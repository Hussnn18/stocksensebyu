import pool from '../config/db.js';
import { HttpError, ok, throwIfInvalid } from '../utils/http.js';
import { withTransaction } from '../utils/transaction.js';
import {
  MAX_QTY,
  cleanText,
  containsPattern,
  isBlank,
  isValidDate,
  parseId,
  parseQty,
  queryText,
  round3,
} from '../utils/validate.js';
import {
  OPEN_STATUSES,
  fetchOperationDetail,
  fetchOperationRows,
  lockOperation,
  notFoundError,
  wrongStatusError,
} from '../services/operationService.js';
import { confirmOperation, nextReference, recheckOperation, validateOperation } from '../services/stockService.js';

const TYPES = ['receipt', 'delivery', 'internal', 'adjustment'];
const STATUSES = ['draft', 'waiting', 'ready', 'done', 'canceled'];

// Which kind of location each side of a document must be
const ROUTES = {
  receipt: { source: 'vendor', dest: 'internal' },
  delivery: { source: 'internal', dest: 'customer' },
  internal: { source: 'internal', dest: 'internal' },
};
const SOURCE_HINT = {
  receipt: 'Receipts come from a vendor location.',
  delivery: 'Choose the internal location the stock leaves from.',
  internal: 'Choose the internal location the stock leaves from.',
};
const DEST_HINT = {
  receipt: 'Choose the internal location the stock goes to.',
  delivery: 'Deliveries go to a customer location.',
  internal: 'Choose the internal location the stock goes to.',
};

/** Parse the product lines: skip empty form rows, merge duplicate products. */
function parseLines(rawLines, fields) {
  if (!Array.isArray(rawLines)) {
    fields.lines = 'Add at least one product.';
    return [];
  }

  const merged = new Map();
  for (const [index, line] of rawLines.entries()) {
    const label = `Line ${index + 1}`;
    if (!line || typeof line !== 'object') {
      fields.lines = `${label} is not a product line.`;
      break;
    }
    if (isBlank(line.product_id) && isBlank(line.quantity)) continue; // untouched empty row

    const productId = parseId(line.product_id);
    const quantity = parseQty(line.quantity);
    if (!productId) {
      fields.lines = `${label}: choose a product.`;
      break;
    }
    if (quantity === null || Number.isNaN(quantity) || quantity <= 0) {
      fields.lines = `${label}: enter a quantity above 0.`;
      break;
    }
    const total = round3((merged.get(productId) || 0) + quantity);
    if (total > MAX_QTY) {
      fields.lines = `${label}: that quantity is too large.`;
      break;
    }
    merged.set(productId, total);
  }

  if (!fields.lines && !merged.size) fields.lines = 'Add at least one product.';
  return [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));
}

/** Validate the create / edit body for a receipt, delivery or internal transfer. */
async function cleanOperationInput(body, type) {
  const fields = {};
  const route = ROUTES[type];

  const partnerName = cleanText(body.partner_name);
  if (partnerName && partnerName.length > 150) fields.partner_name = 'Keep this under 150 characters.';
  else if (!partnerName && type === 'receipt') fields.partner_name = 'Enter the supplier.';
  else if (!partnerName && type === 'delivery') fields.partner_name = 'Enter the customer.';

  const sourceId = parseId(body.source_location_id);
  const destId = parseId(body.dest_location_id);
  const ids = [sourceId, destId].filter(Boolean);
  const [locations] = ids.length
    ? await pool.query('SELECT id, name, type, is_active FROM locations WHERE id IN (?)', [ids])
    : [[]];
  const source = locations.find((l) => l.id === sourceId);
  const dest = locations.find((l) => l.id === destId);

  if (!source || source.type !== route.source) fields.source_location_id = SOURCE_HINT[type];
  else if (!source.is_active) fields.source_location_id = `${source.name} is archived. Choose an active location.`;
  if (!dest || dest.type !== route.dest) fields.dest_location_id = DEST_HINT[type];
  else if (!dest.is_active) fields.dest_location_id = `${dest.name} is archived. Choose an active location.`;
  else if (source && source.id === dest.id) fields.dest_location_id = 'Pick a different location from the source.';

  const scheduledDate = cleanText(body.scheduled_date);
  if (scheduledDate && !isValidDate(scheduledDate)) fields.scheduled_date = 'Use a date like 2026-09-30.';

  const notes = cleanText(body.notes);
  if (notes && notes.length > 2000) fields.notes = 'Keep notes under 2000 characters.';

  const lines = parseLines(body.lines, fields);
  if (lines.length && !fields.lines) {
    const [found] = await pool.query('SELECT id FROM products WHERE id IN (?) AND is_active = 1', [
      lines.map((l) => l.product_id),
    ]);
    if (found.length !== lines.length) fields.lines = 'One of the products no longer exists. Choose it again.';
  }

  throwIfInvalid(fields);
  return {
    partner_name: partnerName,
    source_location_id: sourceId,
    dest_location_id: destId,
    scheduled_date: scheduledDate, // null = today on create, unchanged on edit
    notes,
    lines,
  };
}

async function insertLines(conn, operationId, lines) {
  await conn.query('INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES ?', [
    lines.map((l) => [operationId, l.product_id, l.quantity]),
  ]);
}

async function sendDetail(res, id, status = 200) {
  const detail = await fetchOperationDetail(pool, id);
  if (!detail) throw notFoundError();
  return ok(res, detail, status);
}

function routeId(req) {
  const id = parseId(req.params.id);
  if (!id) throw notFoundError();
  return id;
}

/**
 * GET /api/operations?type=&status=&warehouse_id=&location_id=&category_id=&search=&date=
 */
export async function handleListOperations(req, res) {
  const where = [];
  const params = [];
  const fields = {};

  const type = queryText(req.query.type);
  if (type) {
    if (!TYPES.includes(type)) fields.type = 'Use receipt, delivery, internal or adjustment.';
    where.push('o.type = ?');
    params.push(type);
  }

  const status = queryText(req.query.status);
  if (status === 'open') {
    where.push("o.status IN ('draft', 'waiting', 'ready')");
  } else if (status) {
    if (!STATUSES.includes(status)) fields.status = 'Use draft, waiting, ready, done, canceled or open.';
    where.push('o.status = ?');
    params.push(status);
  }

  const warehouseText = queryText(req.query.warehouse_id);
  if (warehouseText) {
    const warehouseId = parseId(warehouseText);
    if (!warehouseId) fields.warehouse_id = 'Choose a warehouse from the list.';
    // Either side, so a transfer between two warehouses shows up under both
    where.push('(ls.warehouse_id = ? OR ld.warehouse_id = ?)');
    params.push(warehouseId, warehouseId);
  }

  const locationText = queryText(req.query.location_id);
  if (locationText) {
    const locationId = parseId(locationText);
    if (!locationId) fields.location_id = 'Choose a location from the list.';
    where.push('(o.source_location_id = ? OR o.dest_location_id = ?)');
    params.push(locationId, locationId);
  }

  const categoryText = queryText(req.query.category_id);
  if (categoryText) {
    const categoryId = parseId(categoryText);
    if (!categoryId) fields.category_id = 'Choose a category from the list.';
    where.push(
      `EXISTS (SELECT 1 FROM operation_lines cl JOIN products cp ON cp.id = cl.product_id
                WHERE cl.operation_id = o.id AND cp.category_id = ?)`
    );
    params.push(categoryId);
  }

  const search = queryText(req.query.search);
  if (search) {
    const pattern = containsPattern(search);
    where.push(
      `(o.reference LIKE ? OR o.partner_name LIKE ?
        OR EXISTS (SELECT 1 FROM operation_lines sl JOIN products sp ON sp.id = sl.product_id
                    WHERE sl.operation_id = o.id AND (sp.name LIKE ? OR sp.sku LIKE ?)))`
    );
    params.push(pattern, pattern, pattern, pattern);
  }

  const date = queryText(req.query.date);
  if (date) {
    if (!isValidDate(date)) fields.date = 'Use a date like 2026-09-30.';
    where.push('(o.scheduled_date = ? OR DATE(o.validated_at) = ?)');
    params.push(date, date);
  }

  throwIfInvalid(fields, 'Some filters are not valid.');
  return ok(res, await fetchOperationRows(pool, { where, params }));
}

/**
 * GET /api/operations/:id  →  row + notes, created/validated by, lines with availability
 */
export async function handleGetOperation(req, res) {
  return sendDetail(res, routeId(req));
}

/**
 * POST /api/operations  { type, partner_name, source_location_id, dest_location_id, scheduled_date, notes, lines }
 * Creates a draft with the next reference number (WH/IN/0006 …).
 */
export async function handleCreateOperation(req, res) {
  const type = typeof req.body.type === 'string' ? req.body.type.trim() : '';
  if (type === 'adjustment') {
    throw new HttpError(400, 'Adjustments are made from the Inventory Adjustment page (POST /api/adjustments).', {
      type: 'Use receipt, delivery or internal.',
    });
  }
  if (!ROUTES[type]) {
    throw new HttpError(400, 'Choose a receipt, delivery or internal transfer.', { type: 'Use receipt, delivery or internal.' });
  }

  const input = await cleanOperationInput(req.body, type);
  const id = await withTransaction(async (conn) => {
    const reference = await nextReference(conn, type);
    const [result] = await conn.query(
      `INSERT INTO operations
         (reference, type, status, partner_name, source_location_id, dest_location_id, scheduled_date, notes, created_by)
       VALUES (?, ?, 'draft', ?, ?, ?, COALESCE(?, CURDATE()), ?, ?)`,
      [reference, type, input.partner_name, input.source_location_id, input.dest_location_id, input.scheduled_date, input.notes, req.user.id]
    );
    await insertLines(conn, result.insertId, input.lines);
    return result.insertId;
  });

  return sendDetail(res, id, 201);
}

/**
 * PUT /api/operations/:id  (same body; the type can't change) — only while draft, replaces the lines
 */
export async function handleUpdateOperation(req, res) {
  const id = routeId(req);
  const [rows] = await pool.query('SELECT id, reference, type, status FROM operations WHERE id = ?', [id]);
  if (!rows.length) throw notFoundError();
  const current = rows[0];
  if (current.status !== 'draft' || !ROUTES[current.type]) throw wrongStatusError(current, 'edited');

  const input = await cleanOperationInput(req.body, current.type);
  await withTransaction(async (conn) => {
    const op = await lockOperation(conn, id);
    if (op.status !== 'draft') throw wrongStatusError(op, 'edited'); // confirmed while we were checking
    await conn.query(
      `UPDATE operations
          SET partner_name = ?, source_location_id = ?, dest_location_id = ?,
              scheduled_date = COALESCE(?, scheduled_date, CURDATE()), notes = ?
        WHERE id = ?`,
      [input.partner_name, input.source_location_id, input.dest_location_id, input.scheduled_date, input.notes, id]
    );
    await conn.query('DELETE FROM operation_lines WHERE operation_id = ?', [id]);
    await insertLines(conn, id, input.lines);
  });

  return sendDetail(res, id);
}

/** POST /api/operations/:id/confirm — draft → ready (or waiting when stock is short) */
export async function handleConfirmOperation(req, res) {
  const id = routeId(req);
  await confirmOperation(id);
  return sendDetail(res, id);
}

/** POST /api/operations/:id/check — re-check stock for a waiting / ready document */
export async function handleCheckOperation(req, res) {
  const id = routeId(req);
  await recheckOperation(id);
  return sendDetail(res, id);
}

/** POST /api/operations/:id/pick — delivery in ready → picked_at */
export async function handlePickOperation(req, res) {
  const id = routeId(req);
  await withTransaction(async (conn) => {
    const op = await lockOperation(conn, id);
    if (op.type !== 'delivery') throw new HttpError(409, 'Only delivery orders are picked.');
    if (op.status !== 'ready') throw wrongStatusError(op, 'picked');
    if (op.picked_at) throw new HttpError(409, `${op.reference} is already picked.`);
    await conn.query('UPDATE operations SET picked_at = NOW() WHERE id = ?', [id]);
  });
  return sendDetail(res, id);
}

/** POST /api/operations/:id/pack — picked delivery → packed_at */
export async function handlePackOperation(req, res) {
  const id = routeId(req);
  await withTransaction(async (conn) => {
    const op = await lockOperation(conn, id);
    if (op.type !== 'delivery') throw new HttpError(409, 'Only delivery orders are packed.');
    if (op.status !== 'ready') throw wrongStatusError(op, 'packed');
    if (!op.picked_at) throw new HttpError(409, `Pick the items for ${op.reference} before packing.`);
    if (op.packed_at) throw new HttpError(409, `${op.reference} is already packed.`);
    await conn.query('UPDATE operations SET packed_at = NOW() WHERE id = ?', [id]);
  });
  return sendDetail(res, id);
}

/** POST /api/operations/:id/validate — moves the stock (see stockService.validateOperation) */
export async function handleValidateOperation(req, res) {
  const id = routeId(req);
  await validateOperation(id, req.user.id);
  return sendDetail(res, id);
}

/** POST /api/operations/:id/cancel — any open document → canceled; stock is untouched */
export async function handleCancelOperation(req, res) {
  const id = routeId(req);
  await withTransaction(async (conn) => {
    const op = await lockOperation(conn, id);
    if (!OPEN_STATUSES.includes(op.status)) throw wrongStatusError(op, 'canceled');
    await conn.query("UPDATE operations SET status = 'canceled' WHERE id = ?", [id]);
  });
  return sendDetail(res, id);
}
