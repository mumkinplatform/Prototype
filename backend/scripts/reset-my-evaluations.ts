// One-off helper: delete all evaluations submitted by the currently-logged-in
// judge so she can re-test the evaluation flow from scratch. Looks up the
// judge row(s) for sadqh.forlovers@gmail.com and removes their evaluation +
// evaluation_score rows. Safe to re-run — no-ops when nothing matches.
//
// Usage from repo root: cd backend && npx tsx scripts/reset-my-evaluations.ts

import { pool } from '../src/db/pool';

const EMAIL = 'sadqh.forlovers@gmail.com';

async function main() {
  const [judges] = await pool.query(
    `SELECT hj.HJ_ID, hj.HJ_FullName, hj.hackathon_ID
       FROM hackathon_judge hj
       JOIN member m ON m.M_ID = hj.M_ID
      WHERE m.M_Email = ?`,
    [EMAIL],
  );
  const rows = judges as Array<{ HJ_ID: number; HJ_FullName: string; hackathon_ID: number }>;
  if (rows.length === 0) {
    console.log(`No judge records found for ${EMAIL}`);
    process.exit(0);
  }
  const hjIds = rows.map((r) => r.HJ_ID);
  console.log(`Found ${rows.length} judge record(s):`, rows);

  const placeholders = hjIds.map(() => '?').join(',');
  const [evals] = await pool.query(
    `SELECT E_ID, HJ_ID, hackathon_ID FROM evaluation WHERE HJ_ID IN (${placeholders})`,
    hjIds,
  );
  const evalRows = evals as Array<{ E_ID: number; HJ_ID: number; hackathon_ID: number }>;
  if (evalRows.length === 0) {
    console.log('No evaluations to delete.');
    process.exit(0);
  }
  console.log(`Deleting ${evalRows.length} evaluation(s):`, evalRows);

  const evalIds = evalRows.map((r) => r.E_ID);
  const evalPh = evalIds.map(() => '?').join(',');
  await pool.execute(`DELETE FROM evaluation_score WHERE E_ID IN (${evalPh})`, evalIds);
  await pool.execute(`DELETE FROM evaluation WHERE E_ID IN (${evalPh})`, evalIds);
  console.log('Done. Refresh the judge page to see the projects back as "بانتظار التقييم".');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
