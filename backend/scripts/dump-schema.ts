// Export the database schema (tables + indexes + foreign keys) WITHOUT any
// data. Writes to backend/dump/schema-YYYY-MM-DD.sql so successive runs don't
// overwrite each other. Uses SHOW CREATE TABLE which preserves the exact
// table definitions including engine/charset/collation.
import { pool } from '../src/db/pool';
import { env } from '../src/config/env';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const dbName = env.db.database;

  // List every table in the DB (alphabetical for stable output).
  const [tableRows] = await pool.query<Array<{ table_name: string }>>(
    `SELECT TABLE_NAME AS table_name
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME`,
    [dbName],
  );

  const lines: string[] = [];
  lines.push(`-- ============================================================`);
  lines.push(`-- Schema dump for ${dbName}`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Structure only — no data.`);
  lines.push(`-- ============================================================`);
  lines.push(``);
  lines.push(`SET FOREIGN_KEY_CHECKS = 0;`);
  lines.push(``);
  lines.push(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  lines.push(`USE \`${dbName}\`;`);
  lines.push(``);

  for (const row of tableRows) {
    const tbl = (row as { table_name?: string; TABLE_NAME?: string }).table_name
      ?? (row as { TABLE_NAME?: string }).TABLE_NAME;
    if (!tbl) continue;
    const [createRows] = await pool.query<Array<Record<string, string>>>(
      `SHOW CREATE TABLE \`${tbl}\``,
    );
    const createSql = createRows[0]['Create Table'];
    lines.push(`-- ----------------------------------------------------------`);
    lines.push(`-- Table: ${tbl}`);
    lines.push(`-- ----------------------------------------------------------`);
    lines.push(`DROP TABLE IF EXISTS \`${tbl}\`;`);
    lines.push(`${createSql};`);
    lines.push(``);
  }

  lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
  lines.push(``);

  // Write to backend/dump/schema-YYYY-MM-DD.sql
  const dumpDir = path.join(process.cwd(), 'dump');
  if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const outFile = path.join(dumpDir, `schema-${dateStr}.sql`);
  fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

  console.log(`✓ Wrote schema (${tableRows.length} tables) to:`);
  console.log(`  ${outFile}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
