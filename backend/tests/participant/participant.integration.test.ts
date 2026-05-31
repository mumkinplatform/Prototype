import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { app } from '../../src/app';
import { pool } from '../../src/db/pool';
import { hashPassword } from '../../src/lib/password';
import { authHeaders } from '../setup';

// Wipes the DB and seeds the base members. IDs match tests/setup.ts so
// authHeaders.participant authenticates as member 3.
beforeEach(async () => {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await pool.query<RowDataPacket[]>(
    `SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`,
  );
  for (const t of tables) {
    await pool.query(`TRUNCATE TABLE \`${t.TABLE_NAME}\``);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  const hashed = await hashPassword('Test1234');
  await pool.execute(
    `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
     VALUES
       (1, 'organizer@test.local',   'ORGANIZER',   'Test', 'Organizer',   ?, '', 1),
       (3, 'participant@test.local', 'PARTICIPANT', 'Test', 'Participant', ?, '', 1)`,
    [hashed, hashed],
  );
  await pool.execute(`INSERT INTO organizer_profile (M_ID, ORG_Name) VALUES (1, 'Test Org')`);
  await pool.execute(`INSERT INTO hackathon_admin (HAM_ID) VALUES (1)`);
  await pool.execute(`INSERT INTO participant (PM_ID) VALUES (3)`);
});

// End-to-end participant journey: register → simulated organizer
// acceptance → notification surfaces via backfill → fill submission →
// confirm. Each step asserts both the HTTP response and the resulting
// DB state.
describe('Integration: participant journey', () => {
  it('register → accept → backfill notification → submit', async () => {
    // Every date gate is open during the test: registration window ±7
    // days, submission window -1..+7 days, announcement date in the past,
    // single required field (title).
    const [hackRes] = await pool.execute<ResultSetHeader>(
      `INSERT INTO hackathon (
         H_title, H_status, H_visibility, H_type, HAM_ID,
         H_Team_Min, H_Team_Max,
         H_Registration_StartDate, H_Registration_EndDate,
         H_Announcement_Date,
         H_Submission_StartDate, H_Submission_Deadline,
         H_Winners_Date,
         H_Submission_Fields, H_Participation_Mode
       ) VALUES (
         'هاكاثون اختبار', 'published', 'public', 'حضوري', 1,
         1, 4,
         DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY),
         DATE_SUB(NOW(), INTERVAL 1 DAY),
         DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY),
         DATE_ADD(NOW(), INTERVAL 14 DAY),
         JSON_ARRAY('title'), 'individuals_and_teams'
       )`,
    );
    const hackathonId = hackRes.insertId;

    // Step 1: register (solo) → registerForHackathon
    const regRes = await request(app)
      .post(`/participants/hackathons/${hackathonId}/register`)
      .set(authHeaders.participant)
      .send({
        participationType: 'solo',
        ideaTitle: 'فكرتي',
        ideaDescription: 'وصف الفكرة',
      });
    expect(regRes.status).toBe(201);

    const [appliesAfterReg] = await pool.query<RowDataPacket[]>(
      `SELECT application_status FROM applies_hackathon
        WHERE PM_ID = 3 AND hackathon_ID = ?`,
      [hackathonId],
    );
    expect(appliesAfterReg).toHaveLength(1);
    expect(appliesAfterReg[0].application_status).toBe('pending');

    // Step 2: simulate the organizer's acceptance decision. The decision
    // endpoint belongs to the organizer slice; we mutate the row directly
    // so the rest of the journey focuses on the participant-side response.
    await pool.execute(
      `UPDATE applies_hackathon
          SET application_status = 'accepted',
              reviewed_at = NOW(),
              notification_sent_at = NOW()
        WHERE PM_ID = 3 AND hackathon_ID = ?`,
      [hackathonId],
    );

    // Step 3: open notifications → listNotifications. The backfill should
    // see the acceptance has notification_sent_at but no notification row,
    // and create one on the fly (workaround for the organizer endpoint not
    // inserting it itself).
    const notifsRes = await request(app)
      .get('/participants/notifications')
      .set(authHeaders.participant);
    expect(notifsRes.status).toBe(200);

    const [acceptNotifs] = await pool.query<RowDataPacket[]>(
      `SELECT N_Title FROM notification WHERE M_ID = 3 AND N_Type = 'acceptance'`,
    );
    expect(acceptNotifs).toHaveLength(1);
    expect(acceptNotifs[0].N_Title).toContain('تم قبولك');

    // Step 4: fill submission metadata → updateMySubmission
    const updateRes = await request(app)
      .put(`/participants/hackathons/${hackathonId}/submission`)
      .set(authHeaders.participant)
      .send({ projectName: 'مشروعي النهائي' });
    expect(updateRes.status).toBe(200);

    // Step 5: send the project → confirmSubmission
    const submitRes = await request(app)
      .post(`/participants/hackathons/${hackathonId}/submission/submit`)
      .set(authHeaders.participant);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.ok).toBe(true);

    const [submissions] = await pool.query<RowDataPacket[]>(
      `SELECT TS_SubmittedAt, TS_ProjectName FROM submission
        WHERE PM_ID = 3 AND hackathon_ID = ?`,
      [hackathonId],
    );
    expect(submissions).toHaveLength(1);
    expect(submissions[0].TS_SubmittedAt).not.toBeNull();
    expect(submissions[0].TS_ProjectName).toBe('مشروعي النهائي');

    const [submitNotifs] = await pool.query<RowDataPacket[]>(
      `SELECT N_Title FROM notification WHERE M_ID = 3 AND N_Type = 'submission'`,
    );
    expect(submitNotifs).toHaveLength(1);
    expect(submitNotifs[0].N_Title).toContain('تم إرسال مشروعك');
  });
});
