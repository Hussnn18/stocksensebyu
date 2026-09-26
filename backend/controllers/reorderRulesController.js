import pool from '../config/db.js';
import { HttpError, ok, throwIfInvalid } from '../utils/http.js';
import { withTransaction } from '../utils/transaction.js';
import { parseId } from '../utils/validate.js';
import {
  ORDER_BY_SEVERITY,
  fetchStockRow,
  fetchStockRows,
  parseReorderRule,
  saveReorderRule,
} from '../services/productService.js';

/**
 * GET /api/reorder-rules  →  every product as a stock row + suggested_qty; out, then low, then ok
 */
export async function handleListReorderRules(req, res) {
  return ok(res, await fetchStockRows(pool, { orderBy: ORDER_BY_SEVERITY, withSuggested: true }));
}

/**
 * PUT /api/reorder-rules/:productId  { min_qty, max_qty }  — empty min_qty deletes the rule
 */
export async function handleSaveReorderRule(req, res) {
  const productId = parseId(req.params.productId);
  const [found] = productId
    ? await pool.query('SELECT id FROM products WHERE id = ? AND is_active = 1', [productId])
    : [[]];
  if (!found.length) throw new HttpError(404, 'Product not found.');

  const fields = {};
  const rule = parseReorderRule(req.body, fields);
  throwIfInvalid(fields);

  await withTransaction((conn) => saveReorderRule(conn, productId, rule));
  return ok(res, await fetchStockRow(pool, productId));
}
