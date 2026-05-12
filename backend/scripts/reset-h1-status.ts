// Reset participant 5's application in hackathon 1 from 'rejected' back to
// 'pending', and clear notification_sent_at so the effective status is
// "pending" (not "rejected with notification").
import { pool } from '../src/db/pool';
(async () => {
  const [res] = await pool.execute(
    `UPDATE applies_hackathon
        SET application_status = 'pending',
            notification_sent_at = NULL,
            reviewed_at = NULL
      WHERE PM_ID = 5 AND hackathon_ID = 1`,
  );
  console.log('Updated:', res);
  process.exit(0);
})();
