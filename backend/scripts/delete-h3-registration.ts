// Remove participant 5's registration in hackathon 3 (جواهر تجربة) plus all
// related rows (submission, evaluation, evaluation_score, submission_file)
// so the user can re-test the registration flow from scratch.
import { pool } from '../src/db/pool';

const PM_ID = 5;
const HACK_ID = 3;

async function main() {
  // 1. List dependents first so we can see what'll be removed
  const [subs] = await pool.query(
    `SELECT TS_ID FROM submission WHERE hackathon_ID = ? AND PM_ID = ?`,
    [HACK_ID, PM_ID],
  );
  console.log(`submission rows to remove:`, subs);

  const tsIds = (subs as Array<{ TS_ID: number }>).map((r) => r.TS_ID);

  // 2. Delete from leaves up to the root row
  if (tsIds.length > 0) {
    const ph = tsIds.map(() => '?').join(',');
    // Remove evaluation scores tied to evaluations for these submissions
    await pool.execute(
      `DELETE es FROM evaluation_score es
         JOIN evaluation e ON e.E_ID = es.E_ID
        WHERE e.PM_ID = ? AND e.hackathon_ID = ?`,
      [PM_ID, HACK_ID],
    );
    await pool.execute(
      `DELETE FROM evaluation WHERE PM_ID = ? AND hackathon_ID = ?`,
      [PM_ID, HACK_ID],
    );
    await pool.execute(
      `DELETE FROM submission_file WHERE TS_ID IN (${ph})`,
      tsIds,
    );
    await pool.execute(
      `DELETE FROM submission WHERE TS_ID IN (${ph})`,
      tsIds,
    );
  }

  const [res] = await pool.execute(
    `DELETE FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?`,
    [PM_ID, HACK_ID],
  );
  console.log('applies_hackathon delete result:', res);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
