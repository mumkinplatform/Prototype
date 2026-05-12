import { pool } from '../src/db/pool';

async function main() {
  // Run statements one at a time since some MySQL drivers can't multi-statement.
  await pool.execute(
    `ALTER TABLE hackathon_co_manager
       ADD COLUMN HCM_InviteEmailSentAt DATETIME NULL DEFAULT NULL
       AFTER HCM_InvitedAt`,
  ).catch((e) => {
    if (String(e.message).includes('Duplicate column')) console.log('  HCM_InviteEmailSentAt already present, skipping');
    else throw e;
  });
  await pool.execute(
    `ALTER TABLE hackathon_judge
       ADD COLUMN HJ_InviteEmailSentAt DATETIME NULL DEFAULT NULL
       AFTER HJ_InvitedAt`,
  ).catch((e) => {
    if (String(e.message).includes('Duplicate column')) console.log('  HJ_InviteEmailSentAt already present, skipping');
    else throw e;
  });
  console.log('Migration 025 applied.');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
