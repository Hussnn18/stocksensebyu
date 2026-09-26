// Reading operations (receipts, deliveries, transfers, adjustments) in the shapes of docs/api.md.
import { HttpError } from '../utils/http.js';

// warehouse = the internal side's warehouse, source first (virtual locations have no warehouse)
const OPERATION_SELECT = `
  SELECT o.id, o.reference, o.type, o.status, o.partner_name,
         o.source_location_id, ls.name AS source_location,
         o.dest_location_id, ld.name AS dest_location,
         w.id AS warehouse_id, w.short_code AS warehouse,
         DATE_FORMAT(o.scheduled_date, '%Y-%m-%d') AS scheduled_date,
         DATE_FORMAT(o.validated_at, '%Y-%m-%dT%H:%i:%s') AS validated_at,
         DATE_FORMAT(o.picked_at, '%Y-%m-%dT%H:%i:%s') AS picked_at,
         DATE_FORMAT(o.packed_at, '%Y-%m-%dT%H:%i:%s') AS packed_at
    FROM operations o
    JOIN locations ls ON ls.id = o.source_location_id
    JOIN locations ld ON ld.id = o.dest_location_id
    LEFT JOIN warehouses w ON w.id = COALESCE(ls.warehouse_id, ld.warehouse_id)`;

export const OPEN_STATUSES = ['draft', 'waiting', 'ready'];

export const notFoundError = () => new HttpError(404, "That document doesn't exist.");

export const wrongStatusError = (op, action) =>
  new HttpError(409, `${op.reference} is ${op.status}, so it can't be ${action}.`);

/** Add line_count, category_ids and products (names, line order) to each row. */
async function attachLineSummaries(db, rows) {
  if (!rows.length) return rows;
  const [lines] = await db.query(
    `SELECT ol.operation_id, p.name, p.category_id
       FROM operation_lines ol
       JOIN products p ON p.id = ol.product_id
      WHERE ol.operation_id IN (?)
      ORDER BY ol.id`,
    [rows.map((r) => r.id)]
  );

  const summaries = new Map(rows.map((r) => [r.id, { line_count: 0, category_ids: [], products: [] }]));
  for (const line of lines) {
    const summary = summaries.get(line.operation_id);
    summary.line_count += 1;
    if (line.category_id !== null && !summary.category_ids.includes(line.category_id)) {
      summary.category_ids.push(line.category_id);
    }
    summary.products.push(line.name);
  }
  return rows.map((r) => ({ ...r, ...summaries.get(r.id) }));
}

/**
 * Operation rows for the lists, newest scheduled first.
 * `where` holds fixed SQL snippets on aliases o / ls / ld; user values go in `params`.
 */
export async function fetchOperationRows(db, { where = [], params = [] } = {}) {
  const [rows] = await db.query(
    `${OPERATION_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY o.scheduled_date DESC, o.id DESC`,
    params
  );
  return attachLineSummaries(db, rows);
}

/** The GET /operations/:id shape (row + notes, people, lines), or null. */
export async function fetchOperationDetail(db, id) {
  const [rows] = await db.query(`${OPERATION_SELECT} WHERE o.id = ?`, [id]);
  if (!rows.length) return null;
  const [row] = await attachLineSummaries(db, rows);

  const [[extra]] = await db.query(
    `SELECT o.notes,
            DATE_FORMAT(o.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
            uc.name AS created_by_name,
            uv.name AS validated_by_name
       FROM operations o
       LEFT JOIN users uc ON uc.id = o.created_by
       LEFT JOIN users uv ON uv.id = o.validated_by
      WHERE o.id = ?`,
    [id]
  );

  // available = what the source location holds now (only meaningful for internal sources)
  const [lines] = await db.query(
    `SELECT ol.id, ol.product_id, p.sku, p.name, p.uom, ol.quantity, ol.counted_qty,
            CASE WHEN ls.type = 'internal' THEN COALESCE(q.quantity, 0) ELSE NULL END AS available
       FROM operation_lines ol
       JOIN operations o  ON o.id = ol.operation_id
       JOIN products p    ON p.id = ol.product_id
       JOIN locations ls  ON ls.id = o.source_location_id
       LEFT JOIN stock_quants q ON q.product_id = ol.product_id AND q.location_id = o.source_location_id
      WHERE ol.operation_id = ?
      ORDER BY ol.id`,
    [id]
  );

  return { ...row, ...extra, lines };
}

/** Lock one operation row until the transaction ends. Throws 404 when it doesn't exist. */
export async function lockOperation(conn, id) {
  const [rows] = await conn.query(
    `SELECT id, reference, type, status, source_location_id, dest_location_id, picked_at, packed_at
       FROM operations
      WHERE id = ?
      FOR UPDATE`,
    [id]
  );
  if (!rows.length) throw notFoundError();
  return rows[0];
}
