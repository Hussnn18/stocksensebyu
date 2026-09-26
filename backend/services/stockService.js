// Everything that changes stock, plus reference numbers. Each public function runs in one
// transaction, so stock_quants (balances) and stock_moves (ledger) always change together.
import { HttpError } from '../utils/http.js';
import { formatQty, round3 } from '../utils/validate.js';
import { withTransaction } from '../utils/transaction.js';
import { OPEN_STATUSES, lockOperation, wrongStatusError } from './operationService.js';
import { saveReorderRule } from './productService.js';

/**
 * Next reference for a document type, e.g. WH/IN/0006.
 * The sequence row stays locked until the caller's transaction ends,
 * so two people creating documents at once never get the same number.
 */
export async function nextReference(conn, type) {
  const [rows] = await conn.query(
    'SELECT prefix, next_number FROM operation_sequences WHERE type = ? FOR UPDATE',
    [type]
  );
  if (!rows.length) {
    throw new Error(`operation_sequences has no row for "${type}". Re-run database/seed.sql.`);
  }
  const { prefix, next_number: n } = rows[0];
  await conn.query('UPDATE operation_sequences SET next_number = next_number + 1 WHERE type = ?', [type]);
  return `WH/${prefix}/${String(n).padStart(4, '0')}`;
}

/** The virtual "Inventory Loss" location: the other side of adjustments and initial stock. */
async function findInventoryLossLocation(conn) {
  const [rows] = await conn.query(
    "SELECT id, name FROM locations WHERE type = 'adjustment' ORDER BY is_active DESC, id LIMIT 1"
  );
  if (!rows.length) {
    throw new HttpError(409, 'There is no Inventory Loss location (type "adjustment"). Re-run database/seed.sql to add it.');
  }
  return rows[0];
}

/** Current time from MySQL as text, so validated_at and moved_at get exactly the same value. */
async function mysqlNow(conn) {
  const [[row]] = await conn.query("SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS now_text");
  return row.now_text;
}

async function loadLocation(conn, id) {
  const [rows] = await conn.query('SELECT id, name, type FROM locations WHERE id = ?', [id]);
  return rows[0];
}

async function loadLines(conn, operationId) {
  const [lines] = await conn.query(
    `SELECT ol.id, ol.product_id, ol.quantity, p.name, p.uom
       FROM operation_lines ol
       JOIN products p ON p.id = ol.product_id
      WHERE ol.operation_id = ?
      ORDER BY ol.id`,
    [operationId]
  );
  // Zero-quantity lines can't become moves (chk_moves_qty); they don't need stock either
  return lines.filter((line) => line.quantity > 0);
}

/**
 * First product whose total need is more than the internal source holds, or null.
 * With lock = true the quant rows stay locked (FOR UPDATE) until commit/rollback,
 * so nobody can take that stock between this check and our writes.
 */
async function findShortage(conn, lines, source, { lock = false } = {}) {
  if (source.type !== 'internal') return null; // vendors / Inventory Loss never run out

  const needs = new Map();
  for (const line of lines) {
    const need = needs.get(line.product_id) || { name: line.name, uom: line.uom, needed: 0 };
    need.needed = round3(need.needed + line.quantity);
    needs.set(line.product_id, need);
  }

  const [quants] = await conn.query(
    `SELECT product_id, quantity
       FROM stock_quants
      WHERE location_id = ? AND product_id IN (?)
      ${lock ? 'FOR UPDATE' : ''}`,
    [source.id, [...needs.keys()]]
  );
  const onHand = new Map(quants.map((q) => [q.product_id, q.quantity]));

  for (const [productId, need] of needs) {
    const available = round3(onHand.get(productId) ?? 0);
    if (available < need.needed) return { ...need, available };
  }
  return null;
}

const shortageMessage = (shortage, source) =>
  `Only ${formatQty(shortage.available)} ${shortage.uom} of ${shortage.name} at ${source.name}.`;

const noLinesError = (op) => new HttpError(409, `${op.reference} has no product lines. Add at least one before continuing.`);

const adjustmentError = (action) =>
  new HttpError(409, `Adjustments are applied as soon as they are created, so there is nothing to ${action}.`);

/** ready when every line fits the stock at the source (receipts always fit), else waiting. */
async function availabilityStatus(conn, op) {
  const lines = await loadLines(conn, op.id);
  if (!lines.length) throw noLinesError(op);
  if (op.type === 'receipt') return 'ready';
  const source = await loadLocation(conn, op.source_location_id);
  return (await findShortage(conn, lines, source)) ? 'waiting' : 'ready';
}

/** POST /operations/:id/confirm — draft → ready / waiting. */
export async function confirmOperation(operationId) {
  await withTransaction(async (conn) => {
    const op = await lockOperation(conn, operationId);
    if (op.type === 'adjustment') throw adjustmentError('confirm');
    if (op.status !== 'draft') throw wrongStatusError(op, 'confirmed');
    const status = await availabilityStatus(conn, op);
    await conn.query('UPDATE operations SET status = ? WHERE id = ?', [status, op.id]);
  });
}

/** POST /operations/:id/check — re-run the stock check for a waiting / ready document. */
export async function recheckOperation(operationId) {
  await withTransaction(async (conn) => {
    const op = await lockOperation(conn, operationId);
    if (op.type === 'adjustment') throw adjustmentError('check');
    if (!['waiting', 'ready'].includes(op.status)) throw wrongStatusError(op, 'checked');
    const status = await availabilityStatus(conn, op);
    await conn.query('UPDATE operations SET status = ? WHERE id = ?', [status, op.id]);
  });
}

/**
 * POST /operations/:id/validate — the only place receipts, deliveries and transfers move stock.
 * One transaction: lock the source quants, refuse (409, nothing written) if any line is short,
 * then move each line: source quant down, destination quant up (internal locations only),
 * one stock_moves row per line, and the document marked done.
 */
export async function validateOperation(operationId, userId) {
  await withTransaction(async (conn) => {
    const op = await lockOperation(conn, operationId);
    if (op.type === 'adjustment') throw adjustmentError('validate');
    if (!OPEN_STATUSES.includes(op.status)) throw wrongStatusError(op, 'validated');

    const lines = await loadLines(conn, op.id);
    if (!lines.length) throw noLinesError(op);
    const source = await loadLocation(conn, op.source_location_id);
    const dest = await loadLocation(conn, op.dest_location_id);

    // Stock first: "not enough stock" is the more useful answer than "pack it first"
    const shortage = await findShortage(conn, lines, source, { lock: true });
    if (shortage) throw new HttpError(409, shortageMessage(shortage, source));
    if (op.type === 'delivery' && !op.packed_at) {
      throw new HttpError(409, `Pick and pack ${op.reference} before validating.`);
    }

    const now = await mysqlNow(conn);
    for (const line of lines) {
      if (source.type === 'internal') {
        await conn.query(
          'UPDATE stock_quants SET quantity = quantity - ? WHERE product_id = ? AND location_id = ?',
          [line.quantity, line.product_id, source.id]
        );
      }
      if (dest.type === 'internal') {
        await conn.query(
          `INSERT INTO stock_quants (product_id, location_id, quantity) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
          [line.product_id, dest.id, line.quantity, line.quantity]
        );
      }
      await conn.query(
        `INSERT INTO stock_moves (operation_id, reference, product_id, from_location_id, to_location_id, quantity, moved_at, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [op.id, op.reference, line.product_id, source.id, dest.id, line.quantity, now, userId]
      );
    }

    // Emptied shelves: drop the zero rows so stock_quants only lists stock that exists
    if (source.type === 'internal') {
      await conn.query(
        'DELETE FROM stock_quants WHERE location_id = ? AND quantity = 0 AND product_id IN (?)',
        [source.id, [...new Set(lines.map((line) => line.product_id))]]
      );
    }

    await conn.query(
      "UPDATE operations SET status = 'done', validated_by = ?, validated_at = ? WHERE id = ?",
      [userId, now, op.id]
    );
  });
}

/**
 * POST /adjustments — set a location's stock of one product to the counted quantity.
 * Creates a done adjustment document (line quantity = recorded, counted_qty = counted) and one
 * move of the difference: location → Inventory Loss when stock drops, the other way when it rises.
 * `location` / `product` are already checked by the controller. Returns the new operation id.
 */
export async function createAdjustment({ location, product, countedQty, reason }, userId) {
  return withTransaction(async (conn) => {
    // Lock the balance so a validate running at the same time can't change it under us
    const [quants] = await conn.query(
      'SELECT quantity FROM stock_quants WHERE product_id = ? AND location_id = ? FOR UPDATE',
      [product.id, location.id]
    );
    const recorded = round3(quants[0]?.quantity ?? 0);
    const difference = round3(countedQty - recorded);
    if (difference === 0) {
      throw new HttpError(
        400,
        `The count matches the recorded stock (${formatQty(recorded)} ${product.uom}), so there is nothing to adjust.`,
        { counted_qty: 'Same as the recorded quantity.' }
      );
    }

    const loss = await findInventoryLossLocation(conn);
    const [fromId, toId] = difference < 0 ? [location.id, loss.id] : [loss.id, location.id];
    const reference = await nextReference(conn, 'adjustment');
    const now = await mysqlNow(conn);

    const [result] = await conn.query(
      `INSERT INTO operations
         (reference, type, status, partner_name, source_location_id, dest_location_id,
          scheduled_date, created_by, validated_by, validated_at)
       VALUES (?, 'adjustment', 'done', ?, ?, ?, ?, ?, ?, ?)`,
      [reference, reason, fromId, toId, now.slice(0, 10), userId, userId, now]
    );
    const operationId = result.insertId;

    await conn.query(
      'INSERT INTO operation_lines (operation_id, product_id, quantity, counted_qty) VALUES (?, ?, ?, ?)',
      [operationId, product.id, recorded, countedQty]
    );

    if (countedQty > 0) {
      await conn.query(
        `INSERT INTO stock_quants (product_id, location_id, quantity) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = ?`,
        [product.id, location.id, countedQty, countedQty]
      );
    } else {
      await conn.query('DELETE FROM stock_quants WHERE product_id = ? AND location_id = ?', [product.id, location.id]);
    }

    await conn.query(
      `INSERT INTO stock_moves (operation_id, reference, product_id, from_location_id, to_location_id, quantity, moved_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [operationId, reference, product.id, fromId, toId, Math.abs(difference), now, userId]
    );

    return operationId;
  });
}

/**
 * POST /products — insert the product, its reorder rule (when a min is given) and,
 * for initial stock, the quant plus an 'INITIAL' move from Inventory Loss. Returns the new id.
 */
export async function createProduct(input, userId) {
  return withTransaction(async (conn) => {
    let productId;
    try {
      const [result] = await conn.query(
        'INSERT INTO products (name, sku, category_id, uom) VALUES (?, ?, ?, ?)',
        [input.name, input.sku, input.category_id, input.uom]
      );
      productId = result.insertId;
    } catch (error) {
      // Someone saved the same SKU between our check and this insert
      if (error.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, `SKU ${input.sku} is already used.`, { sku: `${input.sku} is already used.` });
      }
      throw error;
    }

    await saveReorderRule(conn, productId, input.rule);

    if (input.initial_qty > 0) {
      const loss = await findInventoryLossLocation(conn);
      await conn.query(
        'INSERT INTO stock_quants (product_id, location_id, quantity) VALUES (?, ?, ?)',
        [productId, input.location_id, input.initial_qty]
      );
      await conn.query(
        `INSERT INTO stock_moves (operation_id, reference, product_id, from_location_id, to_location_id, quantity, user_id)
         VALUES (NULL, 'INITIAL', ?, ?, ?, ?, ?)`,
        [productId, loss.id, input.location_id, input.initial_qty, userId]
      );
    }

    return productId;
  });
}
