// Find emails that appear in MORE than one role table for a given hackathon.
// This is what `replaceCoManagers` flags as 409 role_conflict during re-save.
import { pool } from '../src/db/pool';

const HACKATHON_ID = 1;

async function main() {
  const [coRows] = await pool.query(
    'SELECT HCM_ID, HCM_FullName, HCM_Email FROM hackathon_co_manager WHERE hackathon_ID = ?',
    [HACKATHON_ID],
  );
  console.log(`Co-managers for hackathon ${HACKATHON_ID}:`);
  console.table(coRows);

  const [judgeRows] = await pool.query(
    'SELECT HJ_ID, HJ_FullName, HJ_Email FROM hackathon_judge WHERE hackathon_ID = ?',
    [HACKATHON_ID],
  );
  console.log(`Judges for hackathon ${HACKATHON_ID}:`);
  console.table(judgeRows);

  const [participantRows] = await pool.query(
    `SELECT ah.PM_ID, m.M_Email FROM applies_hackathon ah
       JOIN member m ON m.M_ID = ah.PM_ID
      WHERE ah.hackathon_ID = ?`,
    [HACKATHON_ID],
  );
  console.log(`Participants for hackathon ${HACKATHON_ID}:`);
  console.table(participantRows);

  // Find overlaps
  const coEmails = new Set((coRows as Array<{ HCM_Email: string }>).map((r) => r.HCM_Email.toLowerCase()));
  const judgeEmails = new Set((judgeRows as Array<{ HJ_Email: string }>).map((r) => r.HJ_Email.toLowerCase()));
  const partEmails = new Set((participantRows as Array<{ M_Email: string }>).map((r) => r.M_Email.toLowerCase()));

  const coJudge = [...coEmails].filter((e) => judgeEmails.has(e));
  const coPart = [...coEmails].filter((e) => partEmails.has(e));
  const judgePart = [...judgeEmails].filter((e) => partEmails.has(e));

  console.log('\nOverlaps:');
  if (coJudge.length) console.log('  co-manager ↔ judge:', coJudge);
  if (coPart.length) console.log('  co-manager ↔ participant:', coPart);
  if (judgePart.length) console.log('  judge ↔ participant:', judgePart);
  if (!coJudge.length && !coPart.length && !judgePart.length) {
    console.log('  none');
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
