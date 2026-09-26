import pool from '../config/db.js';
import { ok, throwIfInvalid } from '../utils/http.js';
import { MAX_QTY, cleanText, parseId, parseQty } from '../utils/validate.js';
import { fetchOperationDetail } from '../services/operationService.js';
import { createAdjustment } from '../services/stockService.js';

/**
 * POST /api/adjustments  { location_id, product_id, counted_qty, reason }
 * Sets the stock at one internal location to what was physically counted.
 */
export async function handleCreateAdjustment(req, res) {
  const fields = {};

  const locationId = parseId(req.body.location_id);
  const [locations] = locationId
    ? await pool.query("SELECT id, name FROM locations WHERE id = ? AND type = 'internal' AND is_active = 1", [locationId])
    : [[]];
  if (!locations.length) fields.location_id = 'Choose the location you counted.';

  const productId = parseId(req.body.product_id);
  const [products] = productId
    ? await pool.query('SELECT id, name, uom FROM products WHERE id = ? AND is_active = 1', [productId])
    : [[]];
  if (!products.length) fields.product_id = 'Choose the product you counted.';

  const countedQty = parseQty(req.body.counted_qty);
  if (countedQty === null || Number.isNaN(countedQty) || countedQty < 0 || countedQty > MAX_QTY) {
    fields.counted_qty = 'Enter the counted quantity (0 or more).';
  }

  const reason = cleanText(req.body.reason);
  if (reason && reason.length > 150) fields.reason = 'Keep the reason under 150 characters.';

  throwIfInvalid(fields);

  const operationId = await createAdjustment(
    { location: locations[0], product: products[0], countedQty, reason: reason || 'Physical count' },
    req.user.id
  );
  return ok(res, await fetchOperationDetail(pool, operationId), 201);
}
