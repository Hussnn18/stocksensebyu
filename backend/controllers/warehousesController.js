import pool from '../config/db.js';
import { HttpError, ok, throwIfInvalid } from '../utils/http.js';
import { cleanText, parseId } from '../utils/validate.js';

const notFound = () => new HttpError(404, 'Warehouse not found.');
const duplicateError = (code) => new HttpError(409, `The code ${code} is already used.`, { short_code: `${code} is already used.` });

/** Warehouses with their locations; product_count = products with stock at that location. */
async function fetchWarehouses(warehouseId = null) {
  const [warehouses] = await pool.query(
    `SELECT id, name, short_code, address
       FROM warehouses
      ${warehouseId ? 'WHERE id = ?' : ''}
      ORDER BY name, id`,
    warehouseId ? [warehouseId] : []
  );
  if (!warehouses.length) return warehouses;

  const [locations] = await pool.query(
    `SELECT l.id, l.warehouse_id, l.name, l.type, l.is_active, COUNT(q.product_id) AS product_count
       FROM locations l
       LEFT JOIN stock_quants q ON q.location_id = l.id AND q.quantity > 0
      WHERE l.warehouse_id IN (?)
      GROUP BY l.id, l.warehouse_id, l.name, l.type, l.is_active
      ORDER BY l.name`,
    [warehouses.map((w) => w.id)]
  );

  return warehouses.map((w) => ({
    ...w,
    locations: locations
      .filter((l) => l.warehouse_id === w.id)
      .map((l) => ({ id: l.id, name: l.name, type: l.type, is_active: Boolean(l.is_active), product_count: l.product_count })),
  }));
}

/** { name, short_code, address } from the body; 400 on bad input, 409 when the code is taken. */
async function cleanWarehouseInput(body, warehouseId = 0) {
  const fields = {};

  const name = cleanText(body.name);
  if (!name) fields.name = 'Enter a warehouse name.';
  else if (name.length > 100) fields.name = 'Keep the name under 100 characters.';

  const shortCode = cleanText(body.short_code)?.toUpperCase() ?? null;
  if (!shortCode) fields.short_code = 'Enter a short code, like WH3.';
  else if (!/^[A-Z0-9]{1,10}$/.test(shortCode)) fields.short_code = 'Use up to 10 letters or numbers.';

  const address = cleanText(body.address);
  if (address && address.length > 255) fields.address = 'Keep the address under 255 characters.';

  throwIfInvalid(fields);

  const [clash] = await pool.query('SELECT id FROM warehouses WHERE short_code = ? AND id <> ?', [shortCode, warehouseId]);
  if (clash.length) throw duplicateError(shortCode);

  return { name, short_code: shortCode, address };
}

/**
 * GET /api/warehouses  →  [{ id, name, short_code, address, locations: [...] }]
 */
export async function handleListWarehouses(req, res) {
  return ok(res, await fetchWarehouses());
}

/**
 * POST /api/warehouses  { name, short_code, address }
 */
export async function handleCreateWarehouse(req, res) {
  const input = await cleanWarehouseInput(req.body);
  let result;
  try {
    [result] = await pool.query('INSERT INTO warehouses (name, short_code, address) VALUES (?, ?, ?)', [
      input.name,
      input.short_code,
      input.address,
    ]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw duplicateError(input.short_code);
    throw error;
  }
  const [warehouse] = await fetchWarehouses(result.insertId);
  return ok(res, warehouse, 201);
}

/**
 * PUT /api/warehouses/:id  { name, short_code, address }
 */
export async function handleUpdateWarehouse(req, res) {
  const id = parseId(req.params.id);
  const [found] = id ? await pool.query('SELECT id FROM warehouses WHERE id = ?', [id]) : [[]];
  if (!found.length) throw notFound();

  const input = await cleanWarehouseInput(req.body, id);
  try {
    await pool.query('UPDATE warehouses SET name = ?, short_code = ?, address = ? WHERE id = ?', [
      input.name,
      input.short_code,
      input.address,
      id,
    ]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw duplicateError(input.short_code);
    throw error;
  }
  const [warehouse] = await fetchWarehouses(id);
  return ok(res, warehouse);
}
