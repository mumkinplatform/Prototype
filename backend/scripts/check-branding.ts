import { pool } from '../src/db/pool';
const ID = Number(process.argv[2]) || 6;
(async () => {
  const [r] = await pool.query('SELECT H_Branding FROM hackathon WHERE hackathon_ID = ?', [ID]);
  const row = (r as Array<{ H_Branding: unknown }>)[0];
  console.log('Raw H_Branding:', row?.H_Branding);
  try {
    const parsed = typeof row?.H_Branding === 'string' ? JSON.parse(row.H_Branding) : row?.H_Branding;
    console.log('\nParsed:');
    console.log(JSON.stringify(parsed, null, 2));
    console.log('\nvisibleSections:', parsed?.visibleSections);
  } catch (e) {
    console.log('parse error:', e);
  }
  process.exit(0);
})();
