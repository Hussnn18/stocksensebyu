import pool from '../config/db.js';
import { HttpError, ok, throwIfInvalid } from '../utils/http.js';
import { withTransaction } from '../utils/transaction.js';
import { MAX_QTY, cleanText, containsPattern, isBlank, parseId, parseQty, queryText } from '../utils/validate.js';
import { STOCK_STATE, fetchStockRow, fetchStockRows, parseReorderRule, saveReorderRule } from '../services/productService.js';
import { createProduct } from '../services/stockService.js';

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._/-]*$/;
const STOCK_STATES = ['ok', 'low', 'out'];

const notFound = () => new HttpError(404, 'Product not found.');

/**
 * Validate name, sku, category_id, uom (and min_qty / max_qty when ruleGiven).
 * `fields` may already hold messages from the caller, so the form shows every problem at once.
 * Returns the clean values; format problems throw 400, a taken SKU throws 409.
 */
async function cleanProductInput(body, { productId = null, ruleGiven = true, fields = {} } = {}) {
  const name = cleanText(body.name);
  if (!name) fields.name = 'Enter a product name.';
  else if (name.length > 150) fields.name = 'Keep the name under 150 characters.';

  const sku = cleanText(body.sku)?.toUpperCase() ?? null;
  if (!sku) fields.sku = 'Enter a SKU.';
  else if (sku.length > 50) fields.sku = 'Keep the SKU under 50 characters.';
  else if (!SKU_PATTERN.test(sku)) fields.sku = 'Use letters, numbers, dashes, dots, slashes or underscores (no spaces).';

  const uom = cleanText(body.uom);
  if (!uom) fields.uom = 'Pick a unit of measure.';
  else if (uom.length > 20) fields.uom = 'Keep the unit under 20 characters.';

  let categoryId = null;
  if (!isBlank(body.category_id)) {
    categoryId = parseId(body.category_id);
    const [found] = categoryId ? await pool.query('SELECT id FROM categories WHERE id = ?', [categoryId]) : [[]];
    if (!found.length) fields.category_id = 'Choose a category from the list.';
  }

  const rule = ruleGiven ? parseReorderRule(body, fields) : null;

  throwIfInvalid(fields);

  const [clash] = await pool.query('SELECT id, name FROM products WHERE sku = ? AND id <> ?', [sku, productId || 0]);
  if (clash.length) {
    throw new HttpError(409, `SKU ${sku} is already used by ${clash[0].name}.`, {
      sku: `${sku} is already used by ${clash[0].name}.`,
    });
  }

  return { name, sku, category_id: categoryId, uom, rule };
}

/**
 * GET /api/products?search=&category_id=&stock_state=
 * category_id=none → uncategorized; stock_state=alert → low or out.
 */
export async function handleListProducts(req, res) {
  const where = [];
  const params = [];
  const fields = {};

  const search = queryText(req.query.search);
  if (search) {
    const pattern = containsPattern(search);
    where.push('(s.name LIKE ? OR s.sku LIKE ?)');
    params.push(pattern, pattern);
  }

  const category = queryText(req.query.category_id);
  if (category === 'none') {
    where.push('s.category_id IS NULL');
  } else if (category) {
    const categoryId = parseId(category);
    if (!categoryId) fields.category_id = 'Choose a category from the list.';
    where.push('s.category_id = ?');
    params.push(categoryId);
  }

  const stockState = queryText(req.query.stock_state);
  if (stockState === 'alert') {
    where.push(`${STOCK_STATE} IN ('low', 'out')`);
  } else if (stockState) {
    if (!STOCK_STATES.includes(stockState)) fields.stock_state = 'Use ok, low, out or alert.';
    where.push(`${STOCK_STATE} = ?`);
    params.push(stockState);
  }

  throwIfInvalid(fields, 'Some filters are not valid.');
  return ok(res, await fetchStockRows(pool, { where, params }));
}

/**
 * GET /api/products/:id  →  stock row with warehouse per location + suggested_qty
 */
export async function handleGetProduct(req, res) {
  const id = parseId(req.params.id);
  const row = id ? await fetchStockRow(pool, id) : null;
  if (!row) throw notFound();
  return ok(res, row);
}

/**
 * POST /api/products  { name, sku, category_id, uom, initial_qty?, location_id?, min_qty?, max_qty? }
 */
export async function handleCreateProduct(req, res) {
  // Initial stock first, so every problem in the form is reported together
  const fields = {};
  const initialQty = parseQty(req.body.initial_qty) ?? 0;
  let locationId = null;
  if (Number.isNaN(initialQty) || initialQty < 0 || initialQty > MAX_QTY) {
    fields.initial_qty = 'Initial stock must be 0 or more.';
  } else if (initialQty > 0) {
    locationId = parseId(req.body.location_id);
    const [found] = locationId
      ? await pool.query("SELECT id FROM locations WHERE id = ? AND type = 'internal' AND is_active = 1", [locationId])
      : [[]];
    if (!found.length) fields.location_id = 'Choose where the initial stock is kept.';
  }

  const product = await cleanProductInput(req.body, { fields });
  const productId = await createProduct(
    { ...product, initial_qty: initialQty, location_id: locationId },
    req.user.id
  );
  return ok(res, await fetchStockRow(pool, productId), 201);
}

/**
 * PUT /api/products/:id  { name, sku, category_id, uom, min_qty?, max_qty? }
 * Fields left out keep their value; an empty min_qty removes the reorder rule.
 */
export async function handleUpdateProduct(req, res) {
  const id = parseId(req.params.id);
  const [rows] = id
    ? await pool.query('SELECT id, name, sku, category_id, uom FROM products WHERE id = ? AND is_active = 1', [id])
    : [[]];
  if (!rows.length) throw notFound();
  const current = rows[0];

  const body = {
    name: req.body.name !== undefined ? req.body.name : current.name,
    sku: req.body.sku !== undefined ? req.body.sku : current.sku,
    category_id: req.body.category_id !== undefined ? req.body.category_id : current.category_id,
    uom: req.body.uom !== undefined ? req.body.uom : current.uom,
    min_qty: req.body.min_qty,
    max_qty: req.body.max_qty,
  };
  // Only touch the reorder rule when the form sent it
  const ruleGiven = req.body.min_qty !== undefined || req.body.max_qty !== undefined;
  const product = await cleanProductInput(body, { productId: id, ruleGiven });

  try {
    await withTransaction(async (conn) => {
      await conn.query('UPDATE products SET name = ?, sku = ?, category_id = ?, uom = ? WHERE id = ?', [
        product.name,
        product.sku,
        product.category_id,
        product.uom,
        id,
      ]);
      if (ruleGiven) await saveReorderRule(conn, id, product.rule);
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, `SKU ${product.sku} is already used.`, { sku: `${product.sku} is already used.` });
    }
    throw error;
  }

  return ok(res, await fetchStockRow(pool, id));
}
