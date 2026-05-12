// One-off backfill: stamp HCM_InviteEmailSentAt / HJ_InviteEmailSentAt = NOW()
// for every existing pending invite that has NULL there. Assumption: they
// were already emailed under the old behaviour (every publish blasted every
// pending row), so they don't need another email on the next republish.
import { pool } from '../src/db/pool';

async function main() {
  const [coRes] = await pool.execute(
    `UPDATE hackathon_co_manager
        SET HCM_InviteEmailSentAt = NOW()
      WHERE HCM_InviteEmailSentAt IS NULL
        AND HCM_InvitedAt IS NOT NULL`,
  );
  const [judgeRes] = await pool.execute(
    `UPDATE hackathon_judge
        SET HJ_InviteEmailSentAt = NOW()
      WHERE HJ_InviteEmailSentAt IS NULL
        AND HJ_InvitedAt IS NOT NULL`,
  );
  console.log('co-manager rows backfilled:', coRes);
  console.log('judge rows backfilled:', judgeRes);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
