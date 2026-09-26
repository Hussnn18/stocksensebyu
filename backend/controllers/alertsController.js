import pool from '../config/db.js';
import { ok } from '../utils/http.js';
import { STOCK_STATE, fetchStockRows } from '../services/productService.js';

/**
 * GET /api/alerts/low-stock  →  low / out stock rows + suggested_qty,
 * out first, then the lowest share of the minimum (on_hand / min_qty).
 */
export async function handleLowStock(req, res) {
  const rows = await fetchStockRows(pool, {
    where: [`${STOCK_STATE} IN ('low', 'out')`],
    orderBy: "FIELD(s.stock_state, 'out', 'low'), COALESCE(s.on_hand / NULLIF(s.min_qty, 0), 0), s.name, s.product_id",
    withSuggested: true,
  });
  return ok(res, rows);
}
