// Browser-only data source (VITE_DATA_SOURCE=mock): the same functions and row shapes as the
// Express API in docs/api.md, backed by a copy of database/seed.sql kept in localStorage.
// Lets the frontend run and be tested without MySQL. The rules here mirror the backend's.

import { createSeed } from './mockDb';
import { OPEN_STATUSES } from '../lib/constants';
import { toDateKey } from '../lib/utils';

// Clear this key (or bump the version) to go back to the seed data.
const STORAGE_KEY = 'stocksense.mock-db.v2';

function loadDb() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Blocked or corrupt storage: start from the seed.
  }
  return createSeed();
}

const db = loadDb();
let currentUser = null;

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: changes last until the tab is closed.
  }
}

export function setCurrentUser(user) {
  currentUser = user;
}

const latency = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);
const byId = (rows, id) => rows.find((row) => row.id === Number(id));
const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1; // seed lines have no id
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const blank = (v) => v === '' || v === null || v === undefined;

// "YYYY-MM-DDTHH:MM:SS" in local time, the format the API returns.
function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${toDateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Errors look like the API's: message + HTTP-like status + per-field messages.
function fail(status, message, fields) {
  const error = new Error(message);
  error.status = status;
  if (fields) error.fields = fields;
  throw error;
}

const locationOf = (id) => byId(db.locations, id);
const isInternal = (id) => locationOf(id)?.type === 'internal';
const virtualLocation = (type) => db.locations.find((l) => l.type === type);
const actorName = () => currentUser?.name || null;

function warehouseOfLocation(id) {
  const location = locationOf(id);
  return location?.warehouse_id ? byId(db.warehouses, location.warehouse_id) : null;
}

function quantAt(productId, locationId) {
  return db.stock_quants.find((q) => q.product_id === Number(productId) && q.location_id === Number(locationId))?.quantity || 0;
}

function changeQuant(productId, locationId, delta) {
  const quant = db.stock_quants.find((q) => q.product_id === productId && q.location_id === locationId);
  if (quant) quant.quantity = Math.round((quant.quantity + delta) * 1000) / 1000;
  else db.stock_quants.push({ product_id: productId, location_id: locationId, quantity: delta });
  db.stock_quants = db.stock_quants.filter((q) => q.quantity > 0);
}

function addMove(operation, productId, fromId, toId, quantity) {
  db.stock_moves.push({
    id: nextId(db.stock_moves),
    operation_id: operation ? operation.id : null,
    reference: operation ? operation.reference : 'INITIAL',
    product_id: productId,
    from_location_id: fromId,
    to_location_id: toId,
    quantity,
    moved_at: nowLocal(),
    user_id: null,
    user_name: actorName(),
  });
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

const allStockRows = () => db.products.filter((p) => p.is_active !== false).map(productStockRow);

function suggestedQty(row) {
  if (row.stock_state === 'ok') return 0;
  if (row.min_qty === null) return null;
  return Math.max(0, (row.max_qty ?? row.min_qty * 2) - row.on_hand);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

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

export async function getCalendar(month) {
  await latency(90);
  const days = new Map();
  const day = (date) => {
    if (!days.has(date)) days.set(date, { date, scheduled: 0, done: 0 });
    return days.get(date);
  };
  db.operations.forEach((o) => {
    if (o.status !== 'canceled' && o.scheduled_date?.startsWith(month)) day(o.scheduled_date).scheduled += 1;
    if (o.validated_at && toDateKey(o.validated_at).startsWith(month)) day(toDateKey(o.validated_at)).done += 1;
  });
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

const PREFIX = { receipt: 'IN', delivery: 'OUT', internal: 'INT', adjustment: 'ADJ' };

function nextReference(type) {
  const prefix = `WH/${PREFIX[type]}/`;
  const last = db.operations
    .filter((o) => o.reference.startsWith(prefix))
    .reduce((max, o) => Math.max(max, Number(o.reference.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(last + 1).padStart(4, '0')}`;
}

function operationRow(o) {
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
    validated_at: o.validated_at || null,
    picked_at: o.picked_at || null,
    packed_at: o.packed_at || null,
    line_count: lines.length,
    category_ids: [...new Set(products.map((p) => p.category_id))],
    products: products.map((p) => p.name),
    skus: products.map((p) => p.sku),
  };
}

function operationDetail(o) {
  const row = operationRow(o);
  delete row.skus;
  const userName = (id, fallback) => byId(db.users, id)?.name || fallback || null;
  return {
    ...row,
    notes: o.notes || null,
    created_at: o.created_at || (o.scheduled_date ? `${o.scheduled_date}T09:00:00` : null),
    created_by_name: userName(o.created_by, o.created_by_name),
    validated_by_name: userName(o.validated_by ?? (o.validated_at ? o.created_by : null), o.validated_by_name),
    lines: db.operation_lines
      .filter((l) => l.operation_id === o.id)
      .map((l, index) => {
        const p = byId(db.products, l.product_id);
        return {
          id: l.id ?? index + 1,
          product_id: p.id,
          sku: p.sku,
          name: p.name,
          uom: p.uom,
          quantity: l.quantity,
          counted_qty: l.counted_qty ?? null,
          available: isInternal(o.source_location_id) ? quantAt(p.id, o.source_location_id) : null,
        };
      }),
  };
}

function findOperation(id) {
  const operation = byId(db.operations, id);
  if (!operation) fail(404, 'That document doesn’t exist.');
  return operation;
}

function requireStatus(o, allowed, action) {
  if (!allowed.includes(o.status)) fail(409, `${o.reference} is ${o.status}, so it can’t be ${action}.`);
}

export async function getOperations(filters = {}) {
  await latency();
  const { type, status, warehouse_id, location_id, category_id, search, date } = filters;
  const q = search?.trim().toLowerCase();
  const rows = db.operations
    .filter((o) => !type || o.type === type)
    .filter((o) => !status || (status === 'open' ? OPEN_STATUSES.includes(o.status) : o.status === status))
    .filter((o) => !warehouse_id || [o.source_location_id, o.dest_location_id].some((id) => locationOf(id).warehouse_id === Number(warehouse_id)))
    .filter((o) => !location_id || [o.source_location_id, o.dest_location_id].includes(Number(location_id)))
    .filter((o) => !date || o.scheduled_date === date || (o.validated_at && toDateKey(o.validated_at) === date))
    .map(operationRow)
    .filter((o) => !category_id || o.category_ids.includes(Number(category_id)))
    .filter((o) => !q || [o.reference, o.partner_name, ...o.products, ...o.skus].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date) || b.id - a.id)
    .map(({ skus: _skus, ...row }) => row); // skus were only needed for search
  return clone(rows);
}

export async function getOperation(id) {
  await latency();
  return clone(operationDetail(findOperation(id)));
}

const ROUTE_RULES = {
  receipt: { source: 'vendor', dest: 'internal' },
  delivery: { source: 'internal', dest: 'customer' },
  internal: { source: 'internal', dest: 'internal' },
};

function cleanOperationInput(input, type) {
  const fields = {};
  const rules = ROUTE_RULES[type];
  if (!rules) fail(400, 'Choose a receipt, delivery or internal transfer.');

  const partner = input.partner_name?.trim() || null;
  if (!partner && type === 'receipt') fields.partner_name = 'Enter the supplier.';
  if (!partner && type === 'delivery') fields.partner_name = 'Enter the customer.';

  const source = locationOf(input.source_location_id);
  const dest = locationOf(input.dest_location_id);
  if (!source || source.type !== rules.source) fields.source_location_id = type === 'receipt' ? 'Receipts come from the Vendor location.' : 'Choose where the stock comes from.';
  if (!dest || dest.type !== rules.dest) fields.dest_location_id = type === 'delivery' ? 'Deliveries go to the Customer location.' : 'Choose where the stock goes.';
  if (source && dest && source.id === dest.id) fields.dest_location_id = 'Pick a different location from the source.';

  const merged = new Map();
  (input.lines || []).forEach((line) => {
    const productId = Number(line.product_id);
    const qty = Number(line.quantity);
    if (!productId && blank(line.quantity)) return; // empty row
    if (!byId(db.products, productId) || !(qty > 0)) {
      fields.lines = 'Every line needs a product and a quantity above 0.';
      return;
    }
    merged.set(productId, (merged.get(productId) || 0) + qty);
  });
  if (!fields.lines && merged.size === 0) fields.lines = 'Add at least one product.';

  if (Object.keys(fields).length) fail(400, 'Please fix the highlighted fields.', fields);
  return {
    partner_name: partner,
    source_location_id: source.id,
    dest_location_id: dest.id,
    scheduled_date: input.scheduled_date || toDateKey(new Date()),
    notes: input.notes?.trim() || null,
    lines: [...merged].map(([product_id, quantity]) => ({ product_id, quantity })),
  };
}

function replaceLines(operationId, lines) {
  db.operation_lines = db.operation_lines.filter((l) => l.operation_id !== operationId);
  lines.forEach((l) => {
    db.operation_lines.push({ id: nextId(db.operation_lines), operation_id: operationId, product_id: l.product_id, quantity: l.quantity, counted_qty: null });
  });
}

export async function createOperation(input) {
  await latency(200);
  const clean = cleanOperationInput(input, input.type);
  const operation = {
    id: nextId(db.operations),
    reference: nextReference(input.type),
    type: input.type,
    status: 'draft',
    partner_name: clean.partner_name,
    source_location_id: clean.source_location_id,
    dest_location_id: clean.dest_location_id,
    scheduled_date: clean.scheduled_date,
    notes: clean.notes,
    created_by: null,
    created_by_name: actorName(),
    created_at: nowLocal(),
    validated_at: null,
    picked_at: null,
    packed_at: null,
  };
  db.operations.push(operation);
  replaceLines(operation.id, clean.lines);
  save();
  return clone(operationDetail(operation));
}

export async function updateOperation(id, input) {
  await latency(200);
  const operation = findOperation(id);
  requireStatus(operation, ['draft'], 'edited');
  const clean = cleanOperationInput(input, operation.type);
  Object.assign(operation, {
    partner_name: clean.partner_name,
    source_location_id: clean.source_location_id,
    dest_location_id: clean.dest_location_id,
    scheduled_date: clean.scheduled_date,
    notes: clean.notes,
  });
  replaceLines(operation.id, clean.lines);
  save();
  return clone(operationDetail(operation));
}

function linesFit(operation) {
  if (!isInternal(operation.source_location_id)) return true;
  return db.operation_lines
    .filter((l) => l.operation_id === operation.id)
    .every((l) => quantAt(l.product_id, operation.source_location_id) >= l.quantity);
}

export async function confirmOperation(id) {
  await latency();
  const operation = findOperation(id);
  requireStatus(operation, ['draft'], 'confirmed');
  operation.status = linesFit(operation) ? 'ready' : 'waiting';
  save();
  return clone(operationDetail(operation));
}

export async function checkOperation(id) {
  await latency();
  const operation = findOperation(id);
  requireStatus(operation, ['waiting', 'ready'], 'checked');
  operation.status = linesFit(operation) ? 'ready' : 'waiting';
  save();
  return clone(operationDetail(operation));
}

export async function pickOperation(id) {
  await latency();
  const operation = findOperation(id);
  if (operation.type !== 'delivery') fail(409, 'Only delivery orders are picked.');
  requireStatus(operation, ['ready'], 'picked');
  operation.picked_at = nowLocal();
  save();
  return clone(operationDetail(operation));
}

export async function packOperation(id) {
  await latency();
  const operation = findOperation(id);
  if (operation.type !== 'delivery') fail(409, 'Only delivery orders are packed.');
  requireStatus(operation, ['ready'], 'packed');
  if (!operation.picked_at) fail(409, `Pick the items for ${operation.reference} before packing.`);
  operation.packed_at = nowLocal();
  save();
  return clone(operationDetail(operation));
}

export async function validateOperation(id) {
  await latency(220);
  const operation = findOperation(id);
  requireStatus(operation, OPEN_STATUSES, 'validated');

  const lines = db.operation_lines.filter((l) => l.operation_id === operation.id);
  const from = operation.source_location_id;
  const to = operation.dest_location_id;

  // Check every line first so nothing is written when one of them is short (like a rolled-back transaction).
  if (isInternal(from)) {
    lines.forEach((l) => {
      const have = quantAt(l.product_id, from);
      if (have < l.quantity) {
        const p = byId(db.products, l.product_id);
        fail(409, `Only ${have} ${p.uom} of ${p.name} at ${locationOf(from).name}.`);
      }
    });
  }
  // Same order as the backend: stock first, then the pick/pack step.
  if (operation.type === 'delivery' && !operation.packed_at) fail(409, `Pick and pack ${operation.reference} before validating.`);

  lines.forEach((l) => {
    if (isInternal(from)) changeQuant(l.product_id, from, -l.quantity);
    if (isInternal(to)) changeQuant(l.product_id, to, l.quantity);
    addMove(operation, l.product_id, from, to, l.quantity);
  });
  Object.assign(operation, { status: 'done', validated_at: nowLocal(), validated_by: null, validated_by_name: actorName() });
  save();
  return clone(operationDetail(operation));
}

export async function cancelOperation(id) {
  await latency();
  const operation = findOperation(id);
  requireStatus(operation, OPEN_STATUSES, 'canceled');
  operation.status = 'canceled';
  save();
  return clone(operationDetail(operation));
}

export async function createAdjustment({ location_id, product_id, counted_qty, reason }) {
  await latency(220);
  const fields = {};
  const location = locationOf(location_id);
  const product = byId(db.products, product_id);
  const counted = Number(counted_qty);
  if (!location || location.type !== 'internal') fields.location_id = 'Choose the location you counted.';
  if (!product) fields.product_id = 'Choose the product you counted.';
  if (blank(counted_qty) || Number.isNaN(counted) || counted < 0) fields.counted_qty = 'Enter the counted quantity (0 or more).';
  if (Object.keys(fields).length) fail(400, 'Please fix the highlighted fields.', fields);

  const recorded = quantAt(product.id, location.id);
  const diff = Math.round((counted - recorded) * 1000) / 1000;
  if (diff === 0) fail(400, 'The count matches the recorded stock. Nothing to adjust.', { counted_qty: 'Same as the recorded quantity.' });

  const loss = virtualLocation('adjustment');
  const operation = {
    id: nextId(db.operations),
    reference: nextReference('adjustment'),
    type: 'adjustment',
    status: 'done',
    partner_name: reason?.trim() || 'Physical count',
    source_location_id: diff < 0 ? location.id : loss.id,
    dest_location_id: diff < 0 ? loss.id : location.id,
    scheduled_date: toDateKey(new Date()),
    notes: null,
    created_by: null,
    created_by_name: actorName(),
    created_at: nowLocal(),
    validated_at: nowLocal(),
    validated_by_name: actorName(),
    picked_at: null,
    packed_at: null,
  };
  db.operations.push(operation);
  db.operation_lines.push({ id: nextId(db.operation_lines), operation_id: operation.id, product_id: product.id, quantity: recorded, counted_qty: counted });
  changeQuant(product.id, location.id, diff);
  addMove(operation, product.id, operation.source_location_id, operation.dest_location_id, Math.abs(diff));
  save();
  return clone(operationDetail(operation));
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

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

export async function getProduct(id) {
  await latency();
  const product = byId(db.products, id);
  if (!product) fail(404, 'Product not found.');
  const row = productStockRow(product);
  row.locations = row.locations.map((l) => ({ ...l, warehouse: warehouseOfLocation(l.location_id)?.name || null }));
  row.suggested_qty = suggestedQty(row);
  return clone(row);
}

function validateProduct(input, existingId = null) {
  const name = input.name?.trim();
  const sku = input.sku?.trim().toUpperCase();
  const fields = {};
  let status = 400;
  if (!name) fields.name = 'Enter a product name.';
  if (!sku) fields.sku = 'Enter a SKU.';
  else if (!/^[A-Z0-9][A-Z0-9-_/.]*$/.test(sku)) fields.sku = 'Use letters, numbers and dashes only.';
  else {
    const clash = db.products.find((p) => p.sku === sku && p.id !== existingId);
    if (clash) {
      fields.sku = `${sku} is already used by ${clash.name}.`;
      status = 409;
    }
  }
  if (!input.uom) fields.uom = 'Pick a unit of measure.';

  const min = blank(input.min_qty) ? null : Number(input.min_qty);
  const max = blank(input.max_qty) ? null : Number(input.max_qty);
  if (min !== null && (Number.isNaN(min) || min < 0)) fields.min_qty = 'Minimum must be 0 or more.';
  if (max !== null && (Number.isNaN(max) || max < 0)) fields.max_qty = 'Maximum must be 0 or more.';
  else if (max !== null && min === null) fields.min_qty = 'Set a minimum as well.';
  else if (max !== null && min !== null && max < min) fields.max_qty = 'Maximum must be at least the minimum.';

  if (Object.keys(fields).length) fail(Object.keys(fields).length === 1 && fields.sku ? status : 400, 'Please fix the highlighted fields.', fields);
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

export async function createProduct(input) {
  await latency(200);
  const clean = validateProduct(input);
  const initialQty = blank(input.initial_qty) ? 0 : Number(input.initial_qty);
  if (Number.isNaN(initialQty) || initialQty < 0) fail(400, 'Please fix the highlighted fields.', { initial_qty: 'Initial stock must be 0 or more.' });
  if (initialQty > 0 && !isInternal(input.location_id)) fail(400, 'Please fix the highlighted fields.', { location_id: 'Choose where the initial stock is kept.' });

  const product = { id: nextId(db.products), name: clean.name, sku: clean.sku, category_id: clean.category_id, uom: clean.uom, created_at: nowLocal() };
  db.products.push(product);
  saveReorderRule(product.id, clean.min, clean.max);
  if (initialQty > 0) {
    changeQuant(product.id, Number(input.location_id), initialQty);
    addMove(null, product.id, virtualLocation('adjustment').id, Number(input.location_id), initialQty);
  }
  save();
  return clone(productStockRow(product));
}

export async function updateProduct(id, input) {
  await latency(200);
  const product = byId(db.products, id);
  if (!product) fail(404, 'Product not found.');
  const clean = validateProduct(input, product.id);
  Object.assign(product, { name: clean.name, sku: clean.sku, category_id: clean.category_id, uom: clean.uom });
  saveReorderRule(product.id, clean.min, clean.max);
  save();
  return clone(productStockRow(product));
}

// ---------------------------------------------------------------------------
// Categories, reorder rules, alerts
// ---------------------------------------------------------------------------

export async function getCategories() {
  await latency(100);
  return clone(
    db.categories
      .map((c) => ({ ...c, product_count: db.products.filter((p) => p.category_id === c.id).length }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

function checkCategoryName(name, existingId = null) {
  const clean = name?.trim();
  if (!clean) fail(400, 'Enter a category name.');
  if (db.categories.some((c) => same(c.name, clean) && c.id !== existingId)) fail(409, `“${clean}” already exists.`);
  return clean;
}

export async function createCategory(name) {
  await latency();
  const category = { id: nextId(db.categories), name: checkCategoryName(name) };
  db.categories.push(category);
  save();
  return clone(category);
}

export async function updateCategory(id, name) {
  await latency();
  const category = byId(db.categories, id);
  if (!category) fail(404, 'Category not found.');
  category.name = checkCategoryName(name, category.id);
  save();
  return clone(category);
}

export async function deleteCategory(id) {
  await latency();
  const category = byId(db.categories, id);
  if (!category) fail(404, 'Category not found.');
  db.products.forEach((p) => {
    if (p.category_id === category.id) p.category_id = null;
  });
  db.categories = db.categories.filter((c) => c.id !== category.id);
  save();
}

const SEVERITY = { out: 0, low: 1, ok: 2 };

export async function getReorderRules() {
  await latency();
  return clone(
    allStockRows()
      .map((r) => ({ ...r, suggested_qty: suggestedQty(r) }))
      .sort((a, b) => SEVERITY[a.stock_state] - SEVERITY[b.stock_state] || a.name.localeCompare(b.name)),
  );
}

export async function saveReorderRuleFor(productId, { min_qty, max_qty }) {
  await latency();
  const product = byId(db.products, productId);
  if (!product) fail(404, 'Product not found.');
  const min = blank(min_qty) ? null : Number(min_qty);
  const max = blank(max_qty) ? null : Number(max_qty);
  if (min !== null && (Number.isNaN(min) || min < 0)) fail(400, 'Minimum must be 0 or more.');
  if (max !== null && min === null) fail(400, 'Set a minimum before a maximum.');
  if (max !== null && (Number.isNaN(max) || max < min)) fail(400, 'Maximum must be at least the minimum.');
  saveReorderRule(product.id, min, max);
  save();
}

export async function getLowStock() {
  await latency(100);
  const ratio = (r) => (r.min_qty ? r.on_hand / r.min_qty : 0);
  return clone(
    allStockRows()
      .filter((r) => r.stock_state !== 'ok')
      .map((r) => ({ ...r, suggested_qty: suggestedQty(r) }))
      .sort((a, b) => SEVERITY[a.stock_state] - SEVERITY[b.stock_state] || ratio(a) - ratio(b)),
  );
}

// ---------------------------------------------------------------------------
// Move history
// ---------------------------------------------------------------------------

function moveHistoryRow(m) {
  const product = byId(db.products, m.product_id);
  const from = locationOf(m.from_location_id);
  const to = locationOf(m.to_location_id);
  let effect = 0;
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
// Warehouses, locations, profile
// ---------------------------------------------------------------------------

export async function getWarehouses() {
  await latency(100);
  const productCount = (locationId) =>
    new Set(db.stock_quants.filter((q) => q.location_id === locationId && q.quantity > 0).map((q) => q.product_id)).size;
  return clone(
    db.warehouses.map((w) => ({
      ...w,
      locations: db.locations
        .filter((l) => l.warehouse_id === w.id)
        .map((l) => ({ ...l, is_active: l.is_active !== false, product_count: productCount(l.id) })),
    })),
  );
}

function checkWarehouse(input, existingId = null) {
  const fields = {};
  const name = input.name?.trim();
  const code = input.short_code?.trim().toUpperCase();
  if (!name) fields.name = 'Enter a warehouse name.';
  if (!code) fields.short_code = 'Enter a short code, like WH3.';
  else if (!/^[A-Z0-9]{1,10}$/.test(code)) fields.short_code = 'Up to 10 letters or numbers.';
  else if (db.warehouses.some((w) => w.short_code === code && w.id !== existingId)) fields.short_code = `${code} is already used.`;
  if (Object.keys(fields).length) fail(fields.short_code?.includes('already') ? 409 : 400, 'Please fix the highlighted fields.', fields);
  return { name, short_code: code, address: input.address?.trim() || null };
}

export async function createWarehouse(input) {
  await latency();
  const warehouse = { id: nextId(db.warehouses), ...checkWarehouse(input) };
  db.warehouses.push(warehouse);
  save();
  return clone(warehouse);
}

export async function updateWarehouse(id, input) {
  await latency();
  const warehouse = byId(db.warehouses, id);
  if (!warehouse) fail(404, 'Warehouse not found.');
  Object.assign(warehouse, checkWarehouse(input, warehouse.id));
  save();
  return clone(warehouse);
}

export async function getLocations(type) {
  await latency(80);
  return clone(db.locations.filter((l) => l.is_active !== false && (!type || l.type === type)));
}

function checkLocationName(name, existingId = null) {
  const clean = name?.trim();
  if (!clean) fail(400, 'Enter a location name.', { name: 'Enter a location name.' });
  if (db.locations.some((l) => same(l.name, clean) && l.id !== existingId)) fail(409, `“${clean}” already exists.`, { name: 'That name is taken.' });
  return clean;
}

export async function createLocation({ warehouse_id, name }) {
  await latency();
  if (!byId(db.warehouses, warehouse_id)) fail(400, 'Choose a warehouse.');
  const location = { id: nextId(db.locations), warehouse_id: Number(warehouse_id), name: checkLocationName(name), type: 'internal', is_active: true };
  db.locations.push(location);
  save();
  return clone(location);
}

export async function updateLocation(id, { name, is_active }) {
  await latency();
  const location = byId(db.locations, id);
  if (!location || location.type !== 'internal') fail(404, 'Location not found.');
  if (name !== undefined) location.name = checkLocationName(name, location.id);
  if (is_active === false && db.stock_quants.some((q) => q.location_id === location.id && q.quantity > 0)) {
    fail(409, `${location.name} still holds stock. Move it out before archiving the location.`);
  }
  if (is_active !== undefined) location.is_active = Boolean(is_active);
  save();
  return clone(location);
}

export async function updateProfile(name) {
  await latency();
  const clean = name?.trim();
  if (!clean || clean.length < 2) fail(400, 'Enter your name (at least 2 characters).');
  currentUser = { ...currentUser, name: clean };
  return clone(currentUser);
}
