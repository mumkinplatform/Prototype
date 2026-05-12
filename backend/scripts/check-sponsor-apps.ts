import { pool } from '../src/db/pool';
(async () => {
  const [rows] = await pool.query(
    `SELECT
       sa.SA_ID, sa.SA_Status, sa.SA_NegotiationStep, sa.SA_AppliedAt,
       sp.hackathon_ID, sp.SP_Name AS package, h.H_title AS hackathon,
       s.S_Brand, m.M_FName, m.M_LName, m.M_Email
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
       JOIN sponsor s ON s.SM_ID = sa.SM_ID
       JOIN member m ON m.M_ID = sa.SM_ID
       ORDER BY sa.SA_AppliedAt DESC`,
  );
  console.table(rows);
  process.exit(0);
})();
