// Show exactly which fields are missing for hackathon ID 6 so we know why
// publishHackathon rejects it as incomplete.
import { pool } from '../src/db/pool';

const ID = Number(process.argv[2]) || 6;

async function main() {
  const [rows] = await pool.query('SELECT * FROM hackathon WHERE hackathon_ID = ?', [ID]);
  const h = (rows as Array<Record<string, unknown>>)[0];
  if (!h) {
    console.log(`No hackathon with id=${ID}`);
    process.exit(0);
  }
  // Mirror the exact field list publishHackathon checks
  const checks: [string, unknown][] = [
    ['H_title', h.H_title],
    ['H_slug', h.H_slug],
    ['H_description', h.H_description],
    ['H_type', h.H_type],
    ['H_city', h.H_city],
    ['H_StartDate', h.H_StartDate],
    ['H_EndDate', h.H_EndDate],
    ['H_public_name', h.H_public_name],
    ['H_contact_email', h.H_contact_email],
    ['H_visibility', h.H_visibility],
    ['H_Announcement_Date', h.H_Announcement_Date],
    ['H_Hackathon_StartDate', h.H_Hackathon_StartDate],
    ['H_Winners_Date', h.H_Winners_Date],
    ['H_Registration_StartDate', h.H_Registration_StartDate],
    ['H_Registration_EndDate', h.H_Registration_EndDate],
    ['H_Team_Min', h.H_Team_Min],
    ['H_Team_Max', h.H_Team_Max],
    ['H_Target_Participants', h.H_Target_Participants],
    ['H_Participation_Mode', h.H_Participation_Mode],
    ['H_Allowed_Countries', h.H_Allowed_Countries],
    ['H_Submission_StartDate', h.H_Submission_StartDate],
    ['H_Submission_Deadline', h.H_Submission_Deadline],
    ['H_Project_Description', h.H_Project_Description],
    ['H_Project_Requirements', h.H_Project_Requirements],
    ['H_JudgingCriteria', h.H_JudgingCriteria],
    ['H_Judging_StartDate', h.H_Judging_StartDate],
    ['H_Judging_EndDate', h.H_Judging_EndDate],
  ];
  console.log('Field values for hackathon', ID, '(NULL/empty highlighted):');
  for (const [name, val] of checks) {
    const bad = val == null || val === '' || (val instanceof Date && Number.isNaN(val.getTime()));
    console.log(`  ${bad ? '❌' : '✓'} ${name}:`, val);
  }

  const [tracks] = await pool.query('SELECT COUNT(*) AS c FROM hackathon_track WHERE hackathon_ID = ?', [ID]);
  console.log(`\n  tracks count:`, (tracks as Array<{ c: number }>)[0].c);

  const [prizes] = await pool.query("SELECT COUNT(*) AS c FROM hackathon_prize WHERE hackathon_ID = ? AND HP_Position IS NOT NULL AND HP_Position <> ''", [ID]);
  console.log(`  prizes count:`, (prizes as Array<{ c: number }>)[0].c);

  const [orgs] = await pool.query('SELECT HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_Permissions FROM hackathon_co_manager WHERE hackathon_ID = ?', [ID]);
  console.log(`  co-managers:`);
  console.table(orgs);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
