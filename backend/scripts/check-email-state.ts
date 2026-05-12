import { pool } from '../src/db/pool';
(async () => {
  const [co] = await pool.query(
    `SELECT hackathon_ID, HCM_Email, HCM_InviteStatus, HCM_InvitedAt, HCM_InviteEmailSentAt
       FROM hackathon_co_manager
      ORDER BY hackathon_ID, HCM_ID`,
  );
  console.log('Co-managers:');
  console.table(co);

  const [j] = await pool.query(
    `SELECT hackathon_ID, HJ_Email, HJ_InviteStatus, HJ_InvitedAt, HJ_InviteEmailSentAt
       FROM hackathon_judge
      ORDER BY hackathon_ID, HJ_ID`,
  );
  console.log('Judges:');
  console.table(j);
  process.exit(0);
})();
