import { pool } from '../src/db/pool';
(async () => {
  const [rows] = await pool.query(
    `SELECT ah.PM_ID, m.M_Email,
            ah.hackathon_ID, h.H_title,
            ah.participation_type, ah.team_method, ah.application_status,
            ah.T_ID, t.T_name
       FROM applies_hackathon ah
       JOIN member m ON m.M_ID = ah.PM_ID
       JOIN hackathon h ON h.hackathon_ID = ah.hackathon_ID
  LEFT JOIN team t ON t.T_ID = ah.T_ID
   ORDER BY ah.PM_ID, ah.hackathon_ID`,
  );
  console.table(rows);
  process.exit(0);
})();
