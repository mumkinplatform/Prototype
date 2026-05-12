// Inspect the slug column byte-by-byte for hackathon 1, and run the EXACT
// same conflict check the update endpoint runs, to find why it 409s.
import { pool } from '../src/db/pool';

async function main() {
  const [rows] = await pool.query(
    'SELECT hackathon_ID, H_slug, LENGTH(H_slug) AS byteLen, HEX(H_slug) AS hexed FROM hackathon WHERE hackathon_ID = 1',
  );
  console.log('Hackathon 1 row:');
  console.table(rows);

  const slug = (rows as Array<{ H_slug: string }>)[0]?.H_slug;
  if (slug) {
    const [conflict] = await pool.query(
      'SELECT hackathon_ID, H_slug FROM hackathon WHERE H_slug = ? AND hackathon_ID <> ?',
      [slug.trim(), 1],
    );
    console.log(`\nConflict check (slug='${slug}' AND id <> 1):`);
    console.table(conflict);

    // Also case-insensitive variant — same query without trim, to see if
    // collation might be matching more loosely than expected.
    const [allMatches] = await pool.query(
      'SELECT hackathon_ID, H_slug, H_status FROM hackathon WHERE H_slug = ?',
      [slug.trim()],
    );
    console.log(`\nAll rows matching slug='${slug}':`);
    console.table(allMatches);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
