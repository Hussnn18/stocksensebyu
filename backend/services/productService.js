// Stock rows (v_product_stock + extras) shared by products, reorder rules and alerts,
// plus the reorder-rule helpers used by both the product form and the rules page.
import { MAX_QTY, parseQty, round3 } from '../utils/validate.js';

// max_qty comes from the same product-wide rule the view takes min_qty from (lowest min).
const STOCK_SELECT = `
  SELECT s.product_id, s.sku, s.name, s.category_id, s.category, s.uom, s.on_hand, s.min_qty,
         (SELECT r.max_qty
            FROM reorder_rules r
           WHERE r.product_id = s.product_id AND r.location_id IS NULL
           ORDER BY r.min_qty, r.id
           LIMIT 1) AS max_qty,
         s.stock_state,
         DATE_FORMAT(p.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
    FROM v_product_stock s
    JOIN products p ON p.id = s.product_id`;

// stock_state is computed inside the view, so its collation is whatever the connection that ran
// schema.sql used (MySQL Workbench often differs from the app's). Comparing it to a string then
// fails with "Illegal mix of collations"; an explicit COLLATE works with either setup.
export const STOCK_STATE = 's.stock_state COLLATE utf8mb4_bin';

export const ORDER_BY_NAME = 's.name, s.product_id';
export const ORDER_BY_SEVERITY = "FIELD(s.stock_state, 'out', 'low', 'ok'), s.name, s.product_id";

/**
 * suggested_qty = max(0, (max_qty ?? min_qty * 2) - on_hand); 0 when stock is ok,
 * null when the product is out of stock and has no rule to size a refill from.
 */
export function suggestedQty(row) {
  if (row.stock_state === 'ok') return 0;
  if (row.min_qty === null) return null;
  const target = row.max_qty ?? row.min_qty * 2;
  return round3(Math.max(0, target - row.on_hand));
}

/**
 * Stock rows with locations[] (quantity > 0, largest first).
 * `where` holds fixed SQL snippets on alias s (v_product_stock); user values go in `params`.
 */
export async function fetchStockRows(db, { where = [], params = [], orderBy = ORDER_BY_NAME, withWarehouse = false, withSuggested = false } = {}) {
  const [rows] = await db.query(
    `${STOCK_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${orderBy}`,
    params
  );
  if (!rows.length) return rows;

  // Second query instead of JSON aggregation: simpler to read and keeps numbers as numbers
  const [quants] = await db.query(
    `SELECT q.product_id, q.location_id, l.name AS location, w.name AS warehouse, q.quantity
       FROM stock_quants q
       JOIN locations l ON l.id = q.location_id
       LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE q.quantity > 0 AND q.product_id IN (?)
      ORDER BY q.quantity DESC, l.name`,
    [rows.map((r) => r.product_id)]
  );

  const locationsByProduct = new Map(rows.map((r) => [r.product_id, []]));
  for (const q of quants) {
    const entry = { location_id: q.location_id, location: q.location, quantity: q.quantity };
    if (withWarehouse) entry.warehouse = q.warehouse;
    locationsByProduct.get(q.product_id).push(entry);
  }

  return rows.map((r) => {
    const row = { ...r, locations: locationsByProduct.get(r.product_id) };
    if (withSuggested) row.suggested_qty = suggestedQty(row);
    return row;
  });
}

/** One product's stock row (the GET /products/:id shape), or null. */
export async function fetchStockRow(db, productId) {
  const rows = await fetchStockRows(db, {
    where: ['s.product_id = ?'],
    params: [productId],
    withWarehouse: true,
    withSuggested: true,
  });
  return rows[0] || null;
}

/** Read { min_qty, max_qty } from a form. Empty min = no rule. Adds messages to `fields`. */
export function parseReorderRule(body, fields) {
  const min = parseQty(body.min_qty);
  const max = parseQty(body.max_qty);

  if (Number.isNaN(min) || (min !== null && (min < 0 || min > MAX_QTY))) {
    fields.min_qty = 'Minimum must be a number, 0 or more.';
  }
  if (Number.isNaN(max) || (max !== null && (max < 0 || max > MAX_QTY))) {
    fields.max_qty = 'Maximum must be a number, 0 or more.';
  } else if (max !== null && min === null && !fields.min_qty) {
    fields.min_qty = 'Set a minimum as well.';
  } else if (max !== null && min !== null && !fields.min_qty && max < min) {
    fields.max_qty = 'Maximum must be at least the minimum.';
  }
  return { min, max };
}

/** Replace the product-wide rule (location_id NULL). min = null removes it. */
export async function saveReorderRule(conn, productId, { min, max }) {
  // NULL location_ids never collide on the UNIQUE key, so delete + insert instead of upsert
  await conn.query('DELETE FROM reorder_rules WHERE product_id = ? AND location_id IS NULL', [productId]);
  if (min !== null) {
    await conn.query(
      'INSERT INTO reorder_rules (product_id, location_id, min_qty, max_qty) VALUES (?, NULL, ?, ?)',
      [productId, min, max]
    );
  }
}
