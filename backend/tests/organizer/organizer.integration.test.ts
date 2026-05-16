import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { RowDataPacket } from 'mysql2';
import { app } from '../../src/app';
import { pool } from '../../src/db/pool';
import { hashPassword } from '../../src/lib/password';
import { authHeaders } from '../setup';

// Before each test: wipe the DB and seed the 3 base users (organizer, sponsor, participant)
// matching the IDs in tests/setup.ts authHeaders.
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
       (1, 'organizer@test.local',   'ORGANIZER',   'Test', 'Organizer',   ?, 'bio', 1),
       (2, 'sponsor@test.local',     'SPONSOR',     'Test', 'Sponsor',     ?, 'bio', 1),
       (3, 'participant@test.local', 'PARTICIPANT', 'Test', 'Participant', ?, 'bio', 1)`,
    [hashed, hashed, hashed],
  );
  await pool.execute(`INSERT INTO organizer_profile (M_ID, ORG_Name) VALUES (1, 'Test Organization')`);
  await pool.execute(`INSERT INTO hackathon_admin (HAM_ID) VALUES (1)`);
  await pool.execute(`INSERT INTO sponsor (SM_ID, S_Brand, S_CR_Number) VALUES (2, 'Test Brand', '1234567890')`);
  await pool.execute(`INSERT INTO participant (PM_ID) VALUES (3)`);
});

// Full hackathon lifecycle: organizer creates a draft, fills all sections,
// publishes it, and the hackathon becomes visible to participants and sponsors.
// Verifies the visibility rule: drafts are private to the organizer, only
// published hackathons appear in the participant/sponsor discovery lists.
//
// Controller methods exercised by this flow:
//   • createHackathon            (POST   /hackathons)
//   • updateHackathon            (PUT    /hackathons/:id)
//   • replaceTracks              (PUT    /hackathons/:id/tracks)
//   • replacePrizes              (PUT    /hackathons/:id/prizes)
//   • replaceEvaluationCriteria  (PUT    /hackathons/:id/evaluation-criteria)
//   • replaceCoManagers          (PUT    /hackathons/:id/co-managers)
//   • listMyHackathons           (GET    /hackathons)                — organizer view
//   • listHackathons             (GET    /participants/hackathons)   — participant view
//   • listOpportunities          (GET    /sponsors/opportunities)    — sponsor view
//   • publishHackathon           (POST   /hackathons/:id/publish)
describe('Integration: hackathon end-to-end visibility', () => {
  it('Hackathon lifecycle and role visibility', async () => {
    // ─── Step 1: create empty draft  → createHackathon ────────────────────
    const created = await request(app)
      .post('/hackathons')
      .set(authHeaders.organizer)
      .send({});
    expect(created.status).toBe(201);
    const id = created.body.hackathon_ID;

    // ─── Step 2: fill all required fields  → updateHackathon ──────────────
    await request(app).put(`/hackathons/${id}`).set(authHeaders.organizer).send({
      title: 'هاكاثون الابتكار السعودي',
      slug: 'saudi-innovation-2026',
      description: 'هاكاثون وطني يجمع المبدعين لحل تحديات التحول الرقمي',
      type: 'حضوري',
      city: 'جدة',
      publicName: 'جواهر الشريف',
      contactEmail: 'org@test.local',
      visibility: 'public',
      startDate:           '2026-05-01T21:00:00',
      endDate:             '2026-06-10T20:59:00',
      registrationStart:   '2026-05-01T21:00:00',
      registrationEnd:     '2026-05-06T21:00:00',
      announcementDate:    '2026-05-07T20:55:00',
      hackathonStartDate:  '2026-05-08T07:51:00',
      submissionStart:     '2026-05-08T21:00:00',
      submissionEnd:       '2026-05-09T20:59:00',
      judgingStart:        '2026-05-10T20:56:00',
      judgingEnd:          '2026-05-11T20:56:00',
      winnersDate:         '2026-05-12T14:55:00',
      teamMin: 1,
      teamMax: 4,
      targetParticipants: 200,
      participationMode: 'individuals_and_teams',
      allowedCountries: 'all',
      projectDescription: 'حلول تقنية مبتكرة',
      projectRequirements: 'يجب أن يكون المشروع أصيلاً',
      branding: {
        logoMode: 'pattern',
        logoPattern: 'logo-1',
        bannerMode: 'pattern',
        bannerPattern: 'pattern-5',
        colorPalette: 'red',
      },
    });

    // ─── Step 3: add tracks/prizes/criteria/co-manager  → replaceTracks, replacePrizes, replaceEvaluationCriteria, replaceCoManagers ───
    await request(app).put(`/hackathons/${id}/tracks`).set(authHeaders.organizer).send({
      tracks: [{ name: 'الذكاء الاصطناعي', description: 'AI track' }],
    });
    await request(app).put(`/hackathons/${id}/prizes`).set(authHeaders.organizer).send({
      prizes: [{ position: 'الأول', amount: '5000', description: null }],
    });
    await request(app).put(`/hackathons/${id}/evaluation-criteria`).set(authHeaders.organizer).send({
      items: [{ name: 'الابتكار', weight: 100 }],
    });
    await request(app).put(`/hackathons/${id}/co-managers`).set(authHeaders.organizer).send({
      coManagers: [{
        fullName: 'منسّق',
        email: 'coordinator@test.local',
        role: 'manager',
        section: 'registrations',
        permissions: ['view_applications'],
      }],
    });

    // ─── Step 4: while still draft, verify visibility per role ────────────
    // → listMyHackathons (organizer sees their draft)
    const orgListDraft = await request(app).get('/hackathons').set(authHeaders.organizer);
    expect(orgListDraft.status).toBe(200);
    expect(orgListDraft.body.hackathons).toHaveLength(1);
    expect(orgListDraft.body.hackathons[0].H_status).toBe('draft');

    // → listHackathons (participant must NOT see the draft)
    const participantListDraft = await request(app).get('/participants/hackathons').set(authHeaders.participant);
    expect(participantListDraft.status).toBe(200);
    expect(participantListDraft.body.items).toHaveLength(0);

    // → listOpportunities (sponsor must NOT see the draft)
    const sponsorListDraft = await request(app).get('/sponsors/opportunities').set(authHeaders.sponsor);
    expect(sponsorListDraft.status).toBe(200);
    expect(sponsorListDraft.body.items).toHaveLength(0);

    // ─── Step 5: publish the hackathon  → publishHackathon ────────────────
    const publishRes = await request(app)
      .post(`/hackathons/${id}/publish`)
      .set(authHeaders.organizer)
      .send();
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.status).toBe('published');

    // ─── Step 6: after publishing, verify it appears for all 3 roles ──────
    // → listMyHackathons (organizer now sees status='published')
    const orgListPub = await request(app).get('/hackathons').set(authHeaders.organizer);
    expect(orgListPub.body.hackathons[0].H_status).toBe('published');

    // → listHackathons (participant now sees the hackathon)
    const participantListPub = await request(app).get('/participants/hackathons').set(authHeaders.participant);
    expect(participantListPub.body.items).toHaveLength(1);
    expect(participantListPub.body.items[0].id).toBe(id);
    expect(participantListPub.body.items[0].title).toBe('هاكاثون الابتكار السعودي');

    // → listOpportunities (sponsor now sees the hackathon)
    const sponsorListPub = await request(app).get('/sponsors/opportunities').set(authHeaders.sponsor);
    expect(sponsorListPub.body.items).toHaveLength(1);
    expect(sponsorListPub.body.items[0].id).toBe(id);
    expect(sponsorListPub.body.items[0].title).toBe('هاكاثون الابتكار السعودي');
  });
});
