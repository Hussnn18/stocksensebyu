import pool from '../config/db.js';
import { HttpError, ok } from '../utils/http.js';
import { cleanText, parseId } from '../utils/validate.js';

const notFound = () => new HttpError(404, 'Category not found.');

async function fetchCategory(id) {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      WHERE c.id = ?
      GROUP BY c.id, c.name`,
    [id]
  );
  return rows[0] || null;
}

/** Name from the body; 400 when empty or too long, 409 when another category has it. */
async function cleanCategoryName(body, categoryId = 0) {
  const name = cleanText(body.name);
  if (!name) throw new HttpError(400, 'Enter a category name.', { name: 'Enter a category name.' });
  if (name.length > 100) throw new HttpError(400, 'Keep the name under 100 characters.', { name: 'Keep the name under 100 characters.' });

  // The column collation is case-insensitive, so "hardware" matches "Hardware"
  const [clash] = await pool.query('SELECT id FROM categories WHERE name = ? AND id <> ?', [name, categoryId]);
  if (clash.length) throw new HttpError(409, `"${name}" already exists.`, { name: 'That category already exists.' });
  return name;
}

const duplicateError = (name) => new HttpError(409, `"${name}" already exists.`, { name: 'That category already exists.' });

/**
 * GET /api/categories  →  [{ id, name, product_count }] by name
 */
export async function handleListCategories(req, res) {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id, c.name
      ORDER BY c.name`
  );
  return ok(res, rows);
}

/**
 * POST /api/categories  { name }
 */
export async function handleCreateCategory(req, res) {
  const name = await cleanCategoryName(req.body);
  let result;
  try {
    [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw duplicateError(name);
    throw error;
  }
  return ok(res, await fetchCategory(result.insertId), 201);
}

/**
 * PUT /api/categories/:id  { name }
 */
export async function handleUpdateCategory(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await fetchCategory(id))) throw notFound();
  const name = await cleanCategoryName(req.body, id);
  try {
    await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw duplicateError(name);
    throw error;
  }
  return ok(res, await fetchCategory(id));
}

/**
 * DELETE /api/categories/:id — its products become uncategorized (FK ON DELETE SET NULL)
 */
export async function handleDeleteCategory(req, res) {
  const id = parseId(req.params.id);
  const [result] = id ? await pool.query('DELETE FROM categories WHERE id = ?', [id]) : [{ affectedRows: 0 }];
  if (!result.affectedRows) throw notFound();
  return ok(res, { id });
}
