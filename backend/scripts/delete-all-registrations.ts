// Remove participant 5's registration in ALL hackathons + every dependent row
// (team_submission, evaluation, evaluation_score, submission_file). Wipes the
// slate so the user can re-test the participant registration flow from zero.
import { pool } from '../src/db/pool';

const PM_ID = 5;

async function main() {
  // List dependents so we know what we're touching
  const [subs] = await pool.query(
    `SELECT TS_ID, hackathon_ID FROM team_submission WHERE PM_ID = ?`,
    [PM_ID],
  );
  console.log('team_submission rows to remove:', subs);

  const tsIds = (subs as Array<{ TS_ID: number }>).map((r) => r.TS_ID);
  if (tsIds.length > 0) {
    const ph = tsIds.map(() => '?').join(',');
    await pool.execute(
      `DELETE es FROM evaluation_score es
         JOIN evaluation e ON e.E_ID = es.E_ID
        WHERE e.PM_ID = ?`,
      [PM_ID],
    );
    await pool.execute(`DELETE FROM evaluation WHERE PM_ID = ?`, [PM_ID]);
    await pool.execute(`DELETE FROM submission_file WHERE TS_ID IN (${ph})`, tsIds);
    await pool.execute(`DELETE FROM team_submission WHERE TS_ID IN (${ph})`, tsIds);
  }

  const [res] = await pool.execute(
    `DELETE FROM applies_hackathon WHERE PM_ID = ?`,
    [PM_ID],
  );
  console.log('applies_hackathon delete result:', res);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
