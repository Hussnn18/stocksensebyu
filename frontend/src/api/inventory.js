// Data layer for the app pages (products, dashboard, alerts, move history).
//
// Every function is async and returns rows shaped like the SQL views in database/schema.sql
// (v_product_stock, v_dashboard_kpis, v_move_history), with snake_case columns. For now the
// rows come from an in-memory copy of seed.sql. When the Express route in the comment above
// a function is ready, replace its body with a fetch call; the pages don't need to change.

import { createSeed } from './mockDb';
import { OPEN_STATUSES } from '../lib/constants';
import { toDateKey } from '../lib/utils';

// The in-memory copy is saved to localStorage so demo changes survive a page reload.
// Clear the key (or bump the version) to go back to the seed data.
const STORAGE_KEY = 'stocksense.mock-db.v1';

function loadDb() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Blocked or corrupt storage: start from the seed.
  }
  return createSeed();
}

function saveDb() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: changes last until the tab is closed.
  }
}

const db = loadDb();
let currentUser = null;
const listeners = new Set();

/** The logged-in user, recorded on ledger rows. (The real API reads it from the JWT.) */
export function setCurrentUser(user) {
  currentUser = user;
}

/** Called after every write so open pages, the sidebar and the alert bell refresh. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyChange() {
  saveDb();
  listeners.forEach((listener) => listener());
}

const latency = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);
const byId = (rows, id) => rows.find((row) => row.id === Number(id));
const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

function fail(message) {
  // Same message the API sends back as { error: { message } }
  throw new Error(message);
}

function locationOf(id) {
  return byId(db.locations, id);
}

function warehouseOfLocation(id) {
  const location = locationOf(id);
  return location?.warehouse_id ? byId(db.warehouses, location.warehouse_id) : null;
}

function reorderRule(productId) {
  return db.reorder_rules.find((r) => r.product_id === productId && r.location_id === null) || null;
}

// One row of v_product_stock, plus max_qty and where the stock sits.
function productStockRow(product) {
  const quants = db.stock_quants.filter((q) => q.product_id === product.id && q.quantity > 0);
  const onHand = quants.reduce((sum, q) => sum + q.quantity, 0);
  const rule = reorderRule(product.id);
  const minQty = rule ? rule.min_qty : null;
  let stockState = 'ok';
  if (onHand === 0) stockState = 'out';
  else if (minQty !== null && onHand <= minQty) stockState = 'low';

  return {
    product_id: product.id,
    sku: product.sku,
    name: product.name,
    category_id: product.category_id,
    category: byId(db.categories, product.category_id)?.name || null,
    uom: product.uom,
    on_hand: onHand,
    min_qty: minQty,
    max_qty: rule ? rule.max_qty : null,
    stock_state: stockState,
    created_at: product.created_at,
    locations: quants
      .map((q) => ({ location_id: q.location_id, location: locationOf(q.location_id).name, quantity: q.quantity }))
      .sort((a, b) => b.quantity - a.quantity),
  };
}

function allStockRows() {
  return db.products.filter((p) => p.is_active !== false).map(productStockRow);
}

// Suggested order quantity: refill to max (or to twice the minimum when no max is set).
function suggestedQty(row) {
  if (row.stock_state === 'ok') return 0;
  if (row.min_qty === null) return null; // out of stock, but no rule to size the order
  return Math.max(0, (row.max_qty ?? row.min_qty * 2) - row.on_hand);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/** GET /api/dashboard/kpis  →  SELECT * FROM v_dashboard_kpis */
export async function getDashboardKpis() {
  await latency();
  const stock = allStockRows();
  const open = (type) => db.operations.filter((o) => o.type === type && OPEN_STATUSES.includes(o.status)).length;
  return {
    total_products: stock.length,
    products_in_stock: stock.filter((r) => r.on_hand > 0).length,
    low_stock: stock.filter((r) => r.stock_state === 'low').length,
    out_of_stock: stock.filter((r) => r.stock_state === 'out').length,
    pending_receipts: open('receipt'),
    pending_deliveries: open('delivery'),
    transfers_scheduled: open('internal'),
  };
}

/**
 * GET /api/dashboard/operations?type=&status=&warehouse=&category=&search=
 * status may also be 'open' (draft + waiting + ready).
 */
export async function getOperations(filters = {}) {
  await latency();
  const { type, status, warehouse_id, category_id, search } = filters;
  const q = search?.trim().toLowerCase();

  const rows = db.operations
    .filter((o) => !type || o.type === type)
    .filter((o) => !status || (status === 'open' ? OPEN_STATUSES.includes(o.status) : o.status === status))
    .filter((o) => {
      if (!warehouse_id) return true;
      return [o.source_location_id, o.dest_location_id].some((id) => locationOf(id).warehouse_id === Number(warehouse_id));
    })
    .map((o) => {
      const lines = db.operation_lines.filter((l) => l.operation_id === o.id);
      const products = lines.map((l) => byId(db.products, l.product_id));
      const warehouse = warehouseOfLocation(o.source_location_id) || warehouseOfLocation(o.dest_location_id);
      return {
        id: o.id,
        reference: o.reference,
        type: o.type,
        status: o.status,
        partner_name: o.partner_name,
        source_location_id: o.source_location_id,
        source_location: locationOf(o.source_location_id).name,
        dest_location_id: o.dest_location_id,
        dest_location: locationOf(o.dest_location_id).name,
        warehouse_id: warehouse?.id || null,
        warehouse: warehouse?.short_code || null,
        scheduled_date: o.scheduled_date,
        validated_at: o.validated_at,
        line_count: lines.length,
        category_ids: [...new Set(products.map((p) => p.category_id))],
        products: products.map((p) => p.name),
      };
    })
    .filter((o) => !category_id || o.category_ids.includes(Number(category_id)))
    .filter((o) => !q || [o.reference, o.partner_name, ...o.products].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date) || b.id - a.id);

  return clone(rows);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** GET /api/products?search=&category=&stock=ok|low|out|alert */
export async function getProducts(filters = {}) {
  await latency();
  const { search, category_id, stock_state } = filters;
  const q = search?.trim().toLowerCase();
  const rows = allStockRows()
    .filter((r) => !q || r.sku.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    .filter((r) => !category_id || (category_id === 'none' ? r.category_id === null : r.category_id === Number(category_id)))
    .filter((r) => !stock_state || (stock_state === 'alert' ? r.stock_state !== 'ok' : r.stock_state === stock_state))
    .sort((a, b) => a.name.localeCompare(b.name));
  return clone(rows);
}

/** GET /api/products/:id  (product + stock per location) */
export async function getProduct(id) {
  await latency();
  const product = byId(db.products, id);
  if (!product) fail('Product not found.');
  const row = productStockRow(product);
  row.locations = row.locations.map((l) => ({ ...l, warehouse: warehouseOfLocation(l.location_id)?.name || null }));
  row.suggested_qty = suggestedQty(row);
  return clone(row);
}

function validateProduct(input, existingId = null) {
  const name = input.name?.trim();
  const sku = input.sku?.trim().toUpperCase();
  const errors = {};
  if (!name) errors.name = 'Enter a product name.';
  if (!sku) errors.sku = 'Enter a SKU.';
  else if (!/^[A-Z0-9][A-Z0-9-_/.]*$/.test(sku)) errors.sku = 'Use letters, numbers and dashes only.';
  else {
    const clash = db.products.find((p) => p.sku === sku && p.id !== existingId);
    if (clash) errors.sku = `${sku} is already used by ${clash.name}.`;
  }
  if (!input.uom) errors.uom = 'Pick a unit of measure.';

  const min = input.min_qty === '' || input.min_qty == null ? null : Number(input.min_qty);
  const max = input.max_qty === '' || input.max_qty == null ? null : Number(input.max_qty);
  if (min !== null && (Number.isNaN(min) || min < 0)) errors.min_qty = 'Minimum must be 0 or more.';
  if (max !== null && (Number.isNaN(max) || max < 0)) errors.max_qty = 'Maximum must be 0 or more.';
  else if (max !== null && min === null) errors.min_qty = 'Set a minimum as well.';
  else if (max !== null && min !== null && max < min) errors.max_qty = 'Maximum must be at least the minimum.';

  if (Object.keys(errors).length) {
    const error = new Error('Please fix the highlighted fields.');
    error.fields = errors;
    throw error;
  }
  return { name, sku, min, max, category_id: input.category_id ? Number(input.category_id) : null, uom: input.uom };
}

function saveReorderRule(productId, min, max) {
  const rule = reorderRule(productId);
  if (min === null) {
    if (rule) db.reorder_rules = db.reorder_rules.filter((r) => r !== rule);
  } else if (rule) {
    rule.min_qty = min;
    rule.max_qty = max;
  } else {
    db.reorder_rules.push({ id: nextId(db.reorder_rules), product_id: productId, location_id: null, min_qty: min, max_qty: max });
  }
}

/**
 * POST /api/products  { name, sku, category_id, uom, initial_qty?, location_id?, min_qty?, max_qty? }
 * Initial stock is written like a move from the Inventory Loss location, reference 'INITIAL'.
 */
export async function createProduct(input) {
  await latency(240);
  const clean = validateProduct(input);
  const initialQty = input.initial_qty === '' || input.initial_qty == null ? 0 : Number(input.initial_qty);
  if (Number.isNaN(initialQty) || initialQty < 0) {
    const error = new Error('Please fix the highlighted fields.');
    error.fields = { initial_qty: 'Initial stock must be 0 or more.' };
    throw error;
  }
  if (initialQty > 0 && locationOf(input.location_id)?.type !== 'internal') {
    const error = new Error('Please fix the highlighted fields.');
    error.fields = { location_id: 'Choose where the initial stock is kept.' };
    throw error;
  }

  const product = {
    id: nextId(db.products),
    name: clean.name,
    sku: clean.sku,
    category_id: clean.category_id,
    uom: clean.uom,
    created_at: new Date().toISOString(),
  };
  db.products.push(product);
  saveReorderRule(product.id, clean.min, clean.max);

  if (initialQty > 0) {
    const locationId = Number(input.location_id);
    db.stock_quants.push({ product_id: product.id, location_id: locationId, quantity: initialQty });
    db.stock_moves.push({
      id: nextId(db.stock_moves),
      operation_id: null,
      reference: 'INITIAL',
      product_id: product.id,
      from_location_id: db.locations.find((l) => l.type === 'adjustment').id,
      to_location_id: locationId,
      quantity: initialQty,
      moved_at: new Date().toISOString(),
      user_id: null,
      user_name: currentUser?.name || null,
    });
  }

  notifyChange();
  return clone(productStockRow(product));
}

/** PUT /api/products/:id  { name, sku, category_id, uom, min_qty?, max_qty? } */
export async function updateProduct(id, input) {
  await latency(240);
  const product = byId(db.products, id);
  if (!product) fail('Product not found.');
  const clean = validateProduct(input, product.id);
  Object.assign(product, { name: clean.name, sku: clean.sku, category_id: clean.category_id, uom: clean.uom });
  saveReorderRule(product.id, clean.min, clean.max);
  notifyChange();
  return clone(productStockRow(product));
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** GET /api/categories  (with product counts) */
export async function getCategories() {
  await latency(120);
  return clone(
    db.categories
      .map((c) => ({ ...c, product_count: db.products.filter((p) => p.category_id === c.id).length }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

function checkCategoryName(name, existingId = null) {
  const clean = name?.trim();
  if (!clean) fail('Enter a category name.');
  if (db.categories.some((c) => same(c.name, clean) && c.id !== existingId)) fail(`“${clean}” already exists.`);
  return clean;
}

/** POST /api/categories  { name } */
export async function createCategory(name) {
  await latency();
  const category = { id: nextId(db.categories), name: checkCategoryName(name) };
  db.categories.push(category);
  notifyChange();
  return clone(category);
}

/** PUT /api/categories/:id  { name } */
export async function updateCategory(id, name) {
  await latency();
  const category = byId(db.categories, id);
  if (!category) fail('Category not found.');
  category.name = checkCategoryName(name, category.id);
  notifyChange();
  return clone(category);
}

/** DELETE /api/categories/:id  — products keep existing, uncategorized (ON DELETE SET NULL). */
export async function deleteCategory(id) {
  await latency();
  const category = byId(db.categories, id);
  if (!category) fail('Category not found.');
  db.products.forEach((p) => {
    if (p.category_id === category.id) p.category_id = null;
  });
  db.categories = db.categories.filter((c) => c.id !== category.id);
  notifyChange();
}

// ---------------------------------------------------------------------------
// Reorder rules & low-stock alerts
// ---------------------------------------------------------------------------

const SEVERITY = { out: 0, low: 1, ok: 2 };

/** GET /api/reorder-rules  (one row per product, rule columns null when none is set) */
export async function getReorderRules() {
  await latency();
  return clone(
    allStockRows()
      .map((r) => ({ ...r, suggested_qty: suggestedQty(r) }))
      .sort((a, b) => SEVERITY[a.stock_state] - SEVERITY[b.stock_state] || a.name.localeCompare(b.name)),
  );
}

/** PUT /api/reorder-rules/:productId  { min_qty, max_qty }  (empty min removes the rule) */
export async function saveReorderRuleFor(productId, { min_qty, max_qty }) {
  await latency();
  const product = byId(db.products, productId);
  if (!product) fail('Product not found.');
  const min = min_qty === '' || min_qty == null ? null : Number(min_qty);
  const max = max_qty === '' || max_qty == null ? null : Number(max_qty);
  if (min !== null && (Number.isNaN(min) || min < 0)) fail('Minimum must be 0 or more.');
  if (max !== null && min === null) fail('Set a minimum before a maximum.');
  if (max !== null && (Number.isNaN(max) || max < min)) fail('Maximum must be at least the minimum.');
  saveReorderRule(product.id, min, max);
  notifyChange();
}

/** GET /api/alerts/low-stock  (out of stock first, then the lowest against its minimum) */
export async function getLowStock() {
  await latency(120);
  const ratio = (r) => (r.min_qty ? r.on_hand / r.min_qty : 0);
  return clone(
    allStockRows()
      .filter((r) => r.stock_state !== 'ok')
      .map((r) => ({ ...r, suggested_qty: suggestedQty(r) }))
      .sort((a, b) => SEVERITY[a.stock_state] - SEVERITY[b.stock_state] || ratio(a) - ratio(b)),
  );
}

// ---------------------------------------------------------------------------
// Move history (the stock ledger)
// ---------------------------------------------------------------------------

function moveHistoryRow(m) {
  const product = byId(db.products, m.product_id);
  const from = locationOf(m.from_location_id);
  const to = locationOf(m.to_location_id);
  let effect = 0; // signed effect on internal stock, same CASE as v_move_history
  if (from.type !== 'internal' && to.type === 'internal') effect = m.quantity;
  else if (from.type === 'internal' && to.type !== 'internal') effect = -m.quantity;
  return {
    id: m.id,
    moved_at: m.moved_at,
    reference: m.reference,
    operation_id: m.operation_id,
    operation_type: m.operation_id ? byId(db.operations, m.operation_id).type : 'initial',
    product_id: product.id,
    sku: product.sku,
    product: product.name,
    uom: product.uom,
    from_location_id: from.id,
    from_location: from.name,
    to_location_id: to.id,
    to_location: to.name,
    quantity: m.quantity,
    stock_effect: effect,
    user_name: byId(db.users, m.user_id)?.name || m.user_name || null,
  };
}

/** GET /api/moves?search=&type=&location=&product=&from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function getMoves(filters = {}) {
  await latency();
  const { search, type, location_id, product_id, from, to } = filters;
  const q = search?.trim().toLowerCase();
  const rows = db.stock_moves
    .map(moveHistoryRow)
    .filter((m) => !type || m.operation_type === type)
    .filter((m) => !product_id || m.product_id === Number(product_id))
    .filter((m) => !location_id || m.from_location_id === Number(location_id) || m.to_location_id === Number(location_id))
    .filter((m) => !from || toDateKey(m.moved_at) >= from)
    .filter((m) => !to || toDateKey(m.moved_at) <= to)
    .filter((m) => !q || [m.reference, m.sku, m.product].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => b.moved_at.localeCompare(a.moved_at) || b.id - a.id);
  return clone(rows);
}

// ---------------------------------------------------------------------------
// Warehouses & locations
// ---------------------------------------------------------------------------

/** GET /api/warehouses  (with their locations and how many products each holds) */
export async function getWarehouses() {
  await latency(120);
  const productCount = (locationId) =>
    new Set(db.stock_quants.filter((q) => q.location_id === locationId && q.quantity > 0).map((q) => q.product_id)).size;
  return clone(
    db.warehouses.map((w) => ({
      ...w,
      locations: db.locations
        .filter((l) => l.warehouse_id === w.id)
        .map((l) => ({ ...l, product_count: productCount(l.id) })),
    })),
  );
}

/** GET /api/locations?type=internal|vendor|customer|adjustment */
export async function getLocations(type) {
  await latency(80);
  return clone(db.locations.filter((l) => !type || l.type === type));
}
