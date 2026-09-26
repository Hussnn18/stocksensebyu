import pool from '../config/db.js';
import { HttpError, ok } from '../utils/http.js';
import { queryText } from '../utils/validate.js';

/**
 * GET /api/dashboard/kpis  →  the KPI cards in one row
 */
export async function handleGetKpis(req, res) {
  const [[kpis]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM v_product_stock) AS total_products,
            k.products_in_stock, k.low_stock, k.out_of_stock,
            k.pending_receipts, k.pending_deliveries, k.transfers_scheduled
       FROM v_dashboard_kpis k`
  );
  return ok(res, kpis);
}

/**
 * GET /api/dashboard/calendar?month=YYYY-MM  →  [{ date, scheduled, done }], only days with activity
 * scheduled = non-canceled documents planned that day; done = documents validated that day.
 */
export async function handleGetCalendar(req, res) {
  let month = queryText(req.query.month);
  if (!month) {
    const today = new Date();
    month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new HttpError(400, 'Choose a month like 2026-09.', { month: 'Use the format YYYY-MM.' });
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const start = `${month}-01`;
  const end = monthNumber === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNumber + 1).padStart(2, '0')}-01`;

  const [days] = await pool.query(
    `SELECT DATE_FORMAT(d.day, '%Y-%m-%d') AS date, SUM(d.scheduled) AS scheduled, SUM(d.done) AS done
       FROM (
         SELECT scheduled_date AS day, 1 AS scheduled, 0 AS done
           FROM operations
          WHERE status <> 'canceled' AND scheduled_date >= ? AND scheduled_date < ?
         UNION ALL
         SELECT DATE(validated_at), 0, 1
           FROM operations
          WHERE status = 'done' AND validated_at >= ? AND validated_at < ?
       ) d
      GROUP BY d.day
      ORDER BY d.day`,
    [start, end, start, end]
  );
  return ok(res, days);
}
