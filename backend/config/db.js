import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// One shared connection pool for the whole app (database/schema.sql creates the tables)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stocksense',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // return DECIMAL stock quantities as numbers, not strings
});

export async function checkDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

export default pool;
