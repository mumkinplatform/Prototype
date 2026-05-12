// One-off helper: wipe the judging distribution for a given hackathon so it
// can be redistributed after adding more judges. Clears assigned_judge_id on
// every submission and resets the distribution timestamp on the hackathon.
//
// Usage: cd backend && npx tsx scripts/reset-distribution.ts <hackathonId>
// Defaults to hackathon 3 when no argument is given.

import { pool } from '../src/db/pool';

const hackathonId = Number(process.argv[2]) || 3;

async function main() {
  const [tsRows] = await pool.execute(
    `UPDATE team_submission SET assigned_judge_id = NULL WHERE hackathon_ID = ?`,
    [hackathonId],
  );
  const [hackRows] = await pool.execute(
    `UPDATE hackathon SET H_Judging_Distributed_At = NULL WHERE hackathon_ID = ?`,
    [hackathonId],
  );
  console.log(`Reset distribution for hackathon ${hackathonId}.`);
  console.log('team_submission result:', tsRows);
  console.log('hackathon result:', hackRows);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
