// Helper: list every hackathon row with its slug + status so we can see if
// two rows accidentally share the same slug (which is what triggers the
// "الرابط المختصر مستخدم سابقاً" error when publishing one of them).
import { pool } from '../src/db/pool';

async function main() {
  const [rows] = await pool.query(
    `SELECT hackathon_ID AS id, H_title AS title, H_slug AS slug,
            H_status AS status, HAM_ID AS ownerId
       FROM hackathon
      ORDER BY H_slug, hackathon_ID`,
  );
  console.log('All hackathons:');
  console.table(rows);

  const [dups] = await pool.query(
    `SELECT H_slug AS slug, COUNT(*) AS count
       FROM hackathon
      WHERE H_slug IS NOT NULL AND H_slug <> ''
   GROUP BY H_slug
     HAVING COUNT(*) > 1`,
  );
  console.log('\nDuplicate slugs:');
  console.table(dups);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
