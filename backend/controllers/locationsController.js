import pool from '../config/db.js';
import { HttpError, ok, throwIfInvalid } from '../utils/http.js';
import { cleanText, parseBool, parseId, queryText } from '../utils/validate.js';

const LOCATION_TYPES = ['internal', 'vendor', 'customer', 'adjustment'];

const notFound = () => new HttpError(404, 'Location not found.');
const duplicateError = (name) => new HttpError(409, `"${name}" already exists.`, { name: 'That name is taken.' });

const locationRow = (l) => ({
  id: l.id,
  warehouse_id: l.warehouse_id,
  name: l.name,
  type: l.type,
  is_active: Boolean(l.is_active),
});

async function fetchLocation(id) {
  const [rows] = await pool.query('SELECT id, warehouse_id, name, type, is_active FROM locations WHERE id = ?', [id]);
  return rows[0] ? locationRow(rows[0]) : null;
}

/** Name from the body; 400 when empty or too long, 409 when another location has it. */
async function cleanLocationName(value, locationId = 0) {
  const name = cleanText(value);
  if (!name) throw new HttpError(400, 'Enter a location name.', { name: 'Enter a location name.' });
  if (name.length > 100) throw new HttpError(400, 'Keep the name under 100 characters.', { name: 'Keep the name under 100 characters.' });
  const [clash] = await pool.query('SELECT id FROM locations WHERE name = ? AND id <> ?', [name, locationId]);
  if (clash.length) throw duplicateError(name);
  return name;
}

/**
 * GET /api/locations?type=internal|vendor|customer|adjustment  →  active locations
 */
export async function handleListLocations(req, res) {
  const type = queryText(req.query.type);
  if (type && !LOCATION_TYPES.includes(type)) {
    throw new HttpError(400, 'Some filters are not valid.', { type: 'Use internal, vendor, customer or adjustment.' });
  }
  const [rows] = await pool.query(
    `SELECT id, warehouse_id, name, type, is_active
       FROM locations
      WHERE is_active = 1 ${type ? 'AND type = ?' : ''}
      ORDER BY FIELD(type, 'internal', 'vendor', 'customer', 'adjustment'), name`,
    type ? [type] : []
  );
  return ok(res, rows.map(locationRow));
}

/**
 * POST /api/locations  { warehouse_id, name }  →  a new internal location
 */
export async function handleCreateLocation(req, res) {
  const fields = {};
  const warehouseId = parseId(req.body.warehouse_id);
  const [warehouses] = warehouseId ? await pool.query('SELECT id FROM warehouses WHERE id = ?', [warehouseId]) : [[]];
  if (!warehouses.length) fields.warehouse_id = 'Choose a warehouse.';
  throwIfInvalid(fields);

  const name = await cleanLocationName(req.body.name);
  let result;
  try {
    [result] = await pool.query("INSERT INTO locations (warehouse_id, name, type) VALUES (?, ?, 'internal')", [
      warehouseId,
      name,
    ]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw duplicateError(name);
    throw error;
  }
  return ok(res, await fetchLocation(result.insertId), 201);
}

/**
 * PUT /api/locations/:id  { name?, is_active? }
 * A location that still holds stock can't be archived.
 */
export async function handleUpdateLocation(req, res) {
  const id = parseId(req.params.id);
  const location = id ? await fetchLocation(id) : null;
  if (!location) throw notFound();
  // Vendor / Customer / Inventory Loss are the other side of every receipt, delivery and adjustment
  if (location.type !== 'internal') {
    throw new HttpError(409, `${location.name} is a built-in location and can't be changed.`);
  }

  let isActive;
  if (req.body.is_active !== undefined) {
    isActive = parseBool(req.body.is_active);
    if (isActive === undefined) throw new HttpError(400, 'is_active must be true or false.', { is_active: 'Use true or false.' });
  }
  const name = req.body.name !== undefined ? await cleanLocationName(req.body.name, id) : location.name;

  if (isActive === false) {
    const [[stock]] = await pool.query('SELECT COUNT(*) AS n FROM stock_quants WHERE location_id = ? AND quantity > 0', [id]);
    if (stock.n > 0) throw new HttpError(409, `${location.name} still holds stock. Move it out before archiving the location.`);
  }

  try {
    await pool.query('UPDATE locations SET name = ?, is_active = ? WHERE id = ?', [
      name,
      isActive === undefined ? location.is_active : isActive,
      id,
    ]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw duplicateError(name);
    throw error;
  }
  return ok(res, await fetchLocation(id));
}
