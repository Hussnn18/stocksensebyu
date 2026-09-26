import pool from '../config/db.js';
import { ok, throwIfInvalid } from '../utils/http.js';
import { containsPattern, isValidDate, parseId, queryText } from '../utils/validate.js';

const MOVE_TYPES = ['receipt', 'delivery', 'internal', 'adjustment', 'initial'];

/**
 * GET /api/moves?search=&type=&location_id=&product_id=&from=&to=
 * The stock ledger (v_move_history + ids), newest first. from / to are inclusive dates.
 */
export async function handleListMoves(req, res) {
  const where = [];
  const params = [];
  const fields = {};

  const type = queryText(req.query.type);
  if (type === 'initial') {
    where.push('m.operation_id IS NULL'); // opening stock entered with a new product
  } else if (type) {
    if (!MOVE_TYPES.includes(type)) fields.type = 'Use receipt, delivery, internal, adjustment or initial.';
    where.push('h.operation_type = ?');
    params.push(type);
  }

  const locationText = queryText(req.query.location_id);
  if (locationText) {
    const locationId = parseId(locationText);
    if (!locationId) fields.location_id = 'Choose a location from the list.';
    where.push('(m.from_location_id = ? OR m.to_location_id = ?)');
    params.push(locationId, locationId);
  }

  const productText = queryText(req.query.product_id);
  if (productText) {
    const productId = parseId(productText);
    if (!productId) fields.product_id = 'Choose a product from the list.';
    where.push('m.product_id = ?');
    params.push(productId);
  }

  const from = queryText(req.query.from);
  if (from) {
    if (!isValidDate(from)) fields.from = 'Use a date like 2026-09-01.';
    where.push('h.moved_at >= ?');
    params.push(from);
  }

  const to = queryText(req.query.to);
  if (to) {
    if (!isValidDate(to)) fields.to = 'Use a date like 2026-09-30.';
    where.push('h.moved_at < DATE_ADD(?, INTERVAL 1 DAY)'); // inclusive: the whole "to" day
    params.push(to);
  }

  const search = queryText(req.query.search);
  if (search) {
    const pattern = containsPattern(search);
    where.push('(h.reference LIKE ? OR h.sku LIKE ? OR h.product LIKE ?)');
    params.push(pattern, pattern, pattern);
  }

  throwIfInvalid(fields, 'Some filters are not valid.');

  const [rows] = await pool.query(
    `SELECT h.id,
            DATE_FORMAT(h.moved_at, '%Y-%m-%dT%H:%i:%s') AS moved_at,
            h.reference,
            m.operation_id,
            CASE WHEN m.operation_id IS NULL THEN 'initial' ELSE h.operation_type END AS operation_type,
            m.product_id, h.sku, h.product, h.uom,
            m.from_location_id, h.from_location,
            m.to_location_id, h.to_location,
            h.quantity, h.stock_effect, h.user_name
       FROM v_move_history h
       JOIN stock_moves m ON m.id = h.id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY h.moved_at DESC, h.id DESC`,
    params
  );
  return ok(res, rows);
}
