import { pool } from '../src/db/pool';
const id = Number(process.argv[2]) || 1;
(async () => {
  const [rows] = await pool.query(
    `SELECT SP_ID, SP_Name, SP_Type, SP_Price, SP_Duration, SP_Description, SP_Benefits
       FROM sponsor_package WHERE hackathon_ID = ?
      ORDER BY SP_ID`,
    [id],
  );
  console.log(`Packages for hackathon ${id}:`);
  console.table(rows);
  process.exit(0);
})();
