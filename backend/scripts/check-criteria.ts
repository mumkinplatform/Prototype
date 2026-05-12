import { pool } from '../src/db/pool';
const ID = Number(process.argv[2]) || 6;
(async () => {
  const [r] = await pool.query('SELECT * FROM hackathon_evaluation_criteria WHERE hackathon_ID = ?', [ID]);
  console.log(`Criteria rows for hackathon ${ID}:`);
  console.table(r);
  process.exit(0);
})();
