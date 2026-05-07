import mysql from 'mysql2/promise';
import { env } from '../config/env';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  charset: 'utf8mb4_unicode_ci',
  // Return DATETIME / DATE columns as raw strings ("YYYY-MM-DD HH:MM:SS") instead of
  // JS Date objects. Avoids implicit UTC conversion that shifts the user's entered
  // hours when the DB connection timezone differs from the browser's timezone.
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function pingDb(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
