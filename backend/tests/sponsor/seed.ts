// Test data helpers for sponsor integration tests.

import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../src/db/pool';

export interface SeedResult {
  hackathonId: number;
  packageId: number;
}

// Wipe every table in the test DB. Matches the pattern used by the organizer
// and participant test suites — disables FK checks, truncates all tables,
// re-enables FK checks. Safe because tests run against mumkin_test, never dev.
async function wipeAllTables(): Promise<void> {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await pool.query<RowDataPacket[]>(
    `SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`,
  );
  for (const t of tables) {
    await pool.query(`TRUNCATE TABLE \`${t.TABLE_NAME}\``);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function seedTestData(): Promise<SeedResult> {
  await wipeAllTables();

  // Organizer
  await pool.execute(
    `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password)
     VALUES (1, 'test-organizer@mumkin.test', 'ORGANIZER', 'Test', 'Organizer', 'placeholder')`,
  );
  await pool.execute('INSERT INTO hackathon_admin (HAM_ID) VALUES (1)');

  // Sponsor (M_ID = 2 matches the JWT in tests/setup.ts)
  await pool.execute(
    `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password)
     VALUES (2, 'test-sponsor@mumkin.test', 'SPONSOR', 'Test', 'Sponsor', 'placeholder')`,
  );
  await pool.execute(
    `INSERT INTO sponsor (SM_ID, S_Brand) VALUES (2, 'Test Sponsor Brand')`,
  );

  // Hackathon (must be published for the sponsor endpoint)
  const [hRes] = await pool.execute<ResultSetHeader>(
    `INSERT INTO hackathon (H_title, H_slug, H_description, H_status, HAM_ID)
     VALUES ('Test Hackathon 2026', 'test-hackathon-2026', 'A test hackathon', 'published', 1)`,
  );

  // Sponsor package
  const [pRes] = await pool.execute<ResultSetHeader>(
    `INSERT INTO sponsor_package (hackathon_ID, SP_Name, SP_Type, SP_Description)
     VALUES (?, 'Test Gold Package', 'financial', 'Integration test package')`,
    [hRes.insertId],
  );

  return { hackathonId: hRes.insertId, packageId: pRes.insertId };
}

export async function cleanupTestData(_applicationId: number | null = null): Promise<void> {
  await wipeAllTables();
}
