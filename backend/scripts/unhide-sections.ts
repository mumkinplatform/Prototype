// One-off: flip every hackathon's visibleSections to all-true. The "hide
// section" UI was never built, so legacy hackathons end up with all sections
// hidden from their public page (no prizes, no sponsors, no timeline, etc.)
// for no reason. This script just normalizes them to fully visible.
import { pool } from '../src/db/pool';

const KEYS = ['about', 'timeline', 'sponsors', 'faq', 'announcements', 'judges', 'submissions', 'prizes'];

async function main() {
  const [rows] = await pool.query(
    'SELECT hackathon_ID, H_Branding FROM hackathon WHERE H_Branding IS NOT NULL',
  );
  let updated = 0;
  for (const r of rows as Array<{ hackathon_ID: number; H_Branding: unknown }>) {
    let branding: Record<string, unknown> = {};
    try {
      branding = typeof r.H_Branding === 'string' ? JSON.parse(r.H_Branding) : (r.H_Branding as Record<string, unknown>);
    } catch {
      continue;
    }
    const allVisible = KEYS.reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>);
    branding.visibleSections = allVisible;
    await pool.execute(
      'UPDATE hackathon SET H_Branding = ? WHERE hackathon_ID = ?',
      [JSON.stringify(branding), r.hackathon_ID],
    );
    updated++;
  }
  console.log(`Updated ${updated} hackathon(s) — all sections now visible by default.`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
