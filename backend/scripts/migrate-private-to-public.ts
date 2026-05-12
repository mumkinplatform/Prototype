// One-off migration: flip every hackathon row currently marked H_visibility =
// 'private' to 'public'. Run once after the "private hackathon" feature is
// retired so legacy private rows don't stay invisible to participants.
import { pool } from '../src/db/pool';

async function main() {
  const [before] = await pool.query(
    "SELECT hackathon_ID, H_title, H_status FROM hackathon WHERE H_visibility = 'private'",
  );
  console.log('Private hackathons before migration:');
  console.table(before);

  const [result] = await pool.execute(
    "UPDATE hackathon SET H_visibility = 'public' WHERE H_visibility = 'private'",
  );
  console.log('\nUpdate result:', result);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
