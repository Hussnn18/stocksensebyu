import pool from '../config/db.js';

/**
 * Run work(conn) inside one MySQL transaction on its own connection.
 * Commits when work resolves; rolls back when it throws and re-throws the error
 * (an HttpError then becomes the response, anything else a 500).
 */
export async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    // Keep the original error even if the rollback itself fails (e.g. lost connection)
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }
}
