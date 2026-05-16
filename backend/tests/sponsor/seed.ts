// ─────────────────────────────────────────────────────────────────────────────
// Sponsor Test Data Helpers
//
// دالتان مساعدتان للتيستات:
//   • seedTestData()    → تضيف بيانات تجريبية في DB وتُرجع IDs
//   • cleanupTestData() → تحذف البيانات التجريبية من DB
//
// الهدف: نخفي تعقيد الإدخال/الحذف عن ملف التيست، فيصير التيست قصير ومفهوم.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../src/db/pool';

export interface SeedResult {
  hackathonId: number;
  packageId: number;
}

export async function seedTestData(): Promise<SeedResult> {
  // نظافة احتياطية
  await pool.execute('DELETE FROM sponsor_application WHERE SM_ID = 2');
  await pool.execute('DELETE FROM sponsor WHERE SM_ID = 2');
  await pool.execute('DELETE FROM hackathon_admin WHERE HAM_ID = 1');
  await pool.execute('DELETE FROM member WHERE M_ID IN (1, 2)');

  // منظم
  await pool.execute(
    `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password)
     VALUES (1, 'test-organizer@mumkin.test', 'ORGANIZER', 'Test', 'Organizer', 'placeholder')`,
  );
  await pool.execute('INSERT INTO hackathon_admin (HAM_ID) VALUES (1)');

  // راعي
  await pool.execute(
    `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password)
     VALUES (2, 'test-sponsor@mumkin.test', 'SPONSOR', 'Test', 'Sponsor', 'placeholder')`,
  );
  await pool.execute(
    `INSERT INTO sponsor (SM_ID, S_Brand) VALUES (2, 'Test Sponsor Brand')`,
  );

  // هاكاثون
  const [hRes] = await pool.execute<ResultSetHeader>(
    `INSERT INTO hackathon (H_title, H_slug, H_description, H_status, HAM_ID)
     VALUES ('Test Hackathon 2026', 'test-hackathon-2026', 'A test hackathon', 'published', 1)`,
  );

  // باقة رعاية
  const [pRes] = await pool.execute<ResultSetHeader>(
    `INSERT INTO sponsor_package (hackathon_ID, SP_Name, SP_Type, SP_Description)
     VALUES (?, 'Test Gold Package', 'financial', 'Integration test package')`,
    [hRes.insertId],
  );

  return { hackathonId: hRes.insertId, packageId: pRes.insertId };
}

export async function cleanupTestData(applicationId: number | null = null): Promise<void> {
  if (applicationId !== null) {
    await pool.execute('DELETE FROM sponsor_application WHERE SA_ID = ?', [applicationId]);
  }
  await pool.execute('DELETE FROM sponsor_application WHERE SM_ID = 2');
  await pool.execute('DELETE FROM sponsor_package WHERE SP_Name = ?', ['Test Gold Package']);
  await pool.execute('DELETE FROM hackathon WHERE H_slug = ?', ['test-hackathon-2026']);
  await pool.execute('DELETE FROM sponsor WHERE SM_ID = 2');
  await pool.execute('DELETE FROM hackathon_admin WHERE HAM_ID = 1');
  await pool.execute('DELETE FROM member WHERE M_ID IN (1, 2)');
}
