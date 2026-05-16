import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { RowDataPacket } from 'mysql2';
import { app } from '../../src/app';
import { pool } from '../../src/db/pool';
import { hashPassword } from '../../src/lib/password';
import { authHeaders } from '../setup';

// Before each test: wipe the DB and seed one organizer with id=1
// (must match authHeaders.organizer which is a JWT signed for member 1).
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
     VALUES (1, 'organizer@test.local', 'ORGANIZER', 'Test', 'Organizer', ?, 'bio', 1)`,
    [hashed],
  );
  await pool.execute(`INSERT INTO organizer_profile (M_ID, ORG_Name) VALUES (1, 'Test Organization')`);
  await pool.execute(`INSERT INTO hackathon_admin (HAM_ID) VALUES (1)`);
});

// features 1 :  Hackathon Creation & Management 
// create
describe('createHackathon', () => {
  // Case 1: successful creation — returns 201 + ID, row is created as a draft
  it('creates a draft hackathon successfully', async () => {
    const res = await request(app)
      .post('/hackathons')
      .set(authHeaders.organizer)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.hackathon_ID).toBeTypeOf('number');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT H_status, HAM_ID FROM hackathon WHERE hackathon_ID = ?',
      [res.body.hackathon_ID],
    );
    expect(rows[0].H_status).toBe('draft');
    expect(rows[0].HAM_ID).toBe(1);
  });

  // Case 2: hackathon independence — two consecutive creates produce separate rows with distinct IDs
  it('creates independent hackathons with different IDs', async () => {
    const first = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const second = await request(app).post('/hackathons').set(authHeaders.organizer).send({});

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.hackathon_ID).not.toBe(second.body.hackathon_ID);

    const [rows] = await pool.query<RowDataPacket[]>('SELECT hackathon_ID FROM hackathon');
    expect(rows).toHaveLength(2);
  });
});

// update
describe('updateHackathon', () => {
  // Case 1: successful update — basic fields are saved and reflected in DB
  it('updates basic fields successfully', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    const res = await request(app)
      .put(`/hackathons/${id}`)
      .set(authHeaders.organizer)
      .send({
        title: 'AI Innovators 2026',
        description: 'A hackathon focused on responsible AI.',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('updated');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT H_title, H_description FROM hackathon WHERE hackathon_ID = ?',
      [id],
    );
    expect(rows[0].H_title).toBe('AI Innovators 2026');
    expect(rows[0].H_description).toBe('A hackathon focused on responsible AI.');
  });

  // Case 2: duplicate slug — second hackathon cannot reuse a slug already taken by the first
  it('rejects a slug already used by another hackathon', async () => {
    const first = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const second = await request(app).post('/hackathons').set(authHeaders.organizer).send({});

    // Park the slug on the first hackathon.
    await request(app)
      .put(`/hackathons/${first.body.hackathon_ID}`)
      .set(authHeaders.organizer)
      .send({ slug: 'ai-2026' });

    // Try to reuse it on the second.
    const res = await request(app)
      .put(`/hackathons/${second.body.hackathon_ID}`)
      .set(authHeaders.organizer)
      .send({ slug: 'ai-2026' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('slug already in use');

    // Second hackathon's slug should still be NULL (unchanged).
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT H_slug FROM hackathon WHERE hackathon_ID = ?',
      [second.body.hackathon_ID],
    );
    expect(rows[0].H_slug).toBeNull();
  });

  // Case 3: empty body — auto-save fires with no fields, server returns noop without writing
  it('returns noop when no fields are sent', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});

    const res = await request(app)
      .put(`/hackathons/${created.body.hackathon_ID}`)
      .set(authHeaders.organizer)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('noop');
  });
})

 ;

// publish
describe('publishHackathon', () => {
  // Case 1: incomplete draft — publish refused, status stays 'draft'
  it('refuses to publish an incomplete draft', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    const res = await request(app)
      .post(`/hackathons/${id}/publish`)
      .set(authHeaders.organizer)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('incomplete');
    expect(Array.isArray(res.body.missing)).toBe(true);
    expect(res.body.missing.length).toBeGreaterThan(0);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT H_status FROM hackathon WHERE hackathon_ID = ?',
      [id],
    );
    expect(rows[0].H_status).toBe('draft');
  });

  // Case 2: complete hackathon — publish succeeds
  it('publishes a fully filled hackathon successfully', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    // Fill all hackathon fields
    await request(app).put(`/hackathons/${id}`).set(authHeaders.organizer).send({
      title: 'هاكاثون الابتكار السعودي',
      slug: 'saudi-innovation-2026',
      description: 'هاكاثون وطني يجمع المبدعين لحل تحديات التحول الرقمي في المملكة',
      type: 'حضوري',
      city: 'جدة',
      publicName: 'جواهر الشريف',
      contactEmail: 'electerobero@gmail.com',
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
      projectDescription: 'حلول تقنية مبتكرة تعالج تحديات التحول الرقمي في القطاع الحكومي السعودي',
      projectRequirements: 'يجب أن يكون المشروع أصيلاً وغير مسبوق النشر',
      branding: {
        logoMode: 'pattern',
        logoPattern: 'logo-1',
        bannerMode: 'pattern',
        bannerPattern: 'pattern-5',
        colorPalette: 'red',
      },
    });

    // Add tracks
    await request(app).put(`/hackathons/${id}/tracks`).set(authHeaders.organizer).send({
      tracks: [{ name: 'الذكاء الاصطناعي', description: 'حلول AI لتحسين الخدمات الحكومية' }],
    });

    // Add prizes
    await request(app).put(`/hackathons/${id}/prizes`).set(authHeaders.organizer).send({
      prizes: [
        { position: 'الأول',  amount: '5000', description: null },
        { position: 'الثاني', amount: '4000', description: null },
        { position: 'الثالث', amount: '3000', description: null },
      ],
    });

    // Add evaluation criteria (weights must sum to 100)
    await request(app).put(`/hackathons/${id}/evaluation-criteria`).set(authHeaders.organizer).send({
      items: [
        { name: 'الابتكار والأصالة',     weight: 25 },
        { name: 'جودة التنفيذ التقني',   weight: 25 },
        { name: 'قابلية التطبيق الفعلي', weight: 20 },
        { name: 'الأثر المجتمعي',         weight: 20 },
        { name: 'جودة العرض والتقديم',   weight: 10 },
      ],
    });

    // Add at least one co-manager (must have permissions)
    await request(app).put(`/hackathons/${id}/co-managers`).set(authHeaders.organizer).send({
      coManagers: [{
        fullName: 'جواهر القمر',
        email: 'reemjawaher.121@gmail.com',
        role: 'manager',
        section: 'sponsors',
        permissions: ['view_sponsors', 'start_negotiation', 'send_messages'],
      }],
    });

    // Add sponsor packages
    await request(app).put(`/hackathons/${id}/sponsor-packages`).set(authHeaders.organizer).send({
      sponsorPackages: [
        {
          name: 'الباقة الألماسية',
          type: 'financial',
          description: 'الباقة الأعلى مستوى مع أقصى درجات الظهور والتأثير',
          duration: 'شهران',
          price: 3000,
          sponsorOffer: 'تمويل كامل لجوائز الهاكاثون.\nتغطية تكاليف اللوجستيات.',
          resources: null,
          benefits: ['شعار في جميع المواد الإعلامية', 'كلمة افتتاحية', 'جناح خاص', '5 تذاكر'],
        },
        {
          name: 'الباقة الذهبية',
          type: 'technical',
          description: 'باقة مع اقامة دورات وورش عمل',
          duration: '3 أشهر',
          price: null,
          sponsorOffer: 'توفير مطور ويب لموقع',
          resources: '2 مطور',
          benefits: ['ظهور الشعار في الموقع', 'اقامة دورة أو ورشة عمل'],
        },
        {
          name: 'الباقة البروزنية',
          type: 'media',
          description: 'اعلام وتصوير',
          duration: 'شهرين',
          price: null,
          sponsorOffer: 'تغطية اعلامية',
          resources: 'مصور و مونتج',
          benefits: ['ظهور شعار الشركة', 'شكر وتقدير', 'ساعات تطوعية'],
        },
      ],
    });

    // Publish
    const res = await request(app)
      .post(`/hackathons/${id}/publish`)
      .set(authHeaders.organizer)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT H_status FROM hackathon WHERE hackathon_ID = ?',
      [id],
    );
    expect(rows[0].H_status).toBe('published');
  });
});

// features 2 : Organizing Team Management
// addCoManager
describe('addCoManager', () => {
  // Case 1: successful add — manager is inserted with status 'pending' and an invite token
  it('adds a section manager successfully', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    const res = await request(app)
      .post(`/hackathons/${id}/co-managers`)
      .set(authHeaders.organizer)
      .send({
        fullName: 'منسّق التسجيل',
        email: 'manager@test.local',
        role: 'manager',
        section: 'registrations',
        permissions: ['view_applications', 'accept_application'],
      });

    expect(res.status).toBe(201);
    expect(res.body.coManager.HCM_Email).toBe('manager@test.local');
    expect(res.body.coManager.HCM_InviteStatus).toBe('pending');

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT HCM_Role, HCM_Section, HCM_InviteStatus, HCM_InviteToken
         FROM hackathon_co_manager WHERE hackathon_ID = ? AND HCM_Email = ?`,
      [id, 'manager@test.local'],
    );
    expect(rows[0].HCM_Role).toBe('manager');
    expect(rows[0].HCM_Section).toBe('registrations');
    expect(rows[0].HCM_InviteStatus).toBe('pending');
    expect(rows[0].HCM_InviteToken).toBeTruthy();
  });

  // Case 2: staff added before a section manager exists — refused with no_section_manager
  it('refuses to add staff to a section without a manager', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    const res = await request(app)
      .post(`/hackathons/${id}/co-managers`)
      .set(authHeaders.organizer)
      .send({
        fullName: 'موظف بدون مدير',
        email: 'staff@test.local',
        role: 'staff',
        section: 'projects',
        permissions: ['view_projects'],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('no_section_manager');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT HCM_ID FROM hackathon_co_manager WHERE hackathon_ID = ?',
      [id],
    );
    expect(rows).toHaveLength(0);
  });

  // Case 3: same email reused in a different section — refused with role_conflict
  it('refuses to add the same email in another section', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    // Add a manager to the "team" section first.
    await request(app)
      .post(`/hackathons/${id}/co-managers`)
      .set(authHeaders.organizer)
      .send({
        fullName: 'مدير الفريق',
        email: 'shared@test.local',
        role: 'manager',
        section: 'team',
        permissions: ['view_team'],
      });

    // Try to add the SAME email as a manager to a different section.
    const res = await request(app)
      .post(`/hackathons/${id}/co-managers`)
      .set(authHeaders.organizer)
      .send({
        fullName: 'مدير المشاريع',
        email: 'shared@test.local',
        role: 'manager',
        section: 'projects',
        permissions: ['view_projects'],
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('role_conflict');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT HCM_ID FROM hackathon_co_manager WHERE hackathon_ID = ? AND HCM_Email = ?',
      [id, 'shared@test.local'],
    );
    expect(rows).toHaveLength(1);
  });
});

// features 3 : Registrations Management
// updateRegistrationStatus
describe('updateRegistrationStatus', () => {
  // Case 1: organizer accepts a solo pending application — status becomes 'accepted', reviewed_at is set
  it('accepts a pending application successfully', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    // Seed a participant who applied solo
    await pool.execute(
      `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
       VALUES (10, 'p1@test.local', 'PARTICIPANT', 'Solo', 'One', 'x', 'bio', 1)`,
    );
    await pool.execute(`INSERT INTO participant (PM_ID) VALUES (10)`);
    await pool.execute(
      `INSERT INTO applies_hackathon (PM_ID, hackathon_ID, idea_title, idea_description, participation_type)
       VALUES (10, ?, 'AI idea', 'Description', 'solo')`,
      [id],
    );

    const res = await request(app)
      .put(`/hackathons/${id}/registrations/10/status`)
      .set(authHeaders.organizer)
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT application_status, reviewed_at FROM applies_hackathon WHERE PM_ID = 10 AND hackathon_ID = ?',
      [id],
    );
    expect(rows[0].application_status).toBe('accepted');
    expect(rows[0].reviewed_at).not.toBeNull();
  });

  // Case 2: organizer rejects a solo pending application — status becomes 'rejected'
  it('rejects a pending application successfully', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    await pool.execute(
      `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
       VALUES (11, 'p2@test.local', 'PARTICIPANT', 'Solo', 'Two', 'x', 'bio', 1)`,
    );
    await pool.execute(`INSERT INTO participant (PM_ID) VALUES (11)`);
    await pool.execute(
      `INSERT INTO applies_hackathon (PM_ID, hackathon_ID, idea_title, idea_description, participation_type)
       VALUES (11, ?, 'Web idea', 'Description', 'solo')`,
      [id],
    );

    const res = await request(app)
      .put(`/hackathons/${id}/registrations/11/status`)
      .set(authHeaders.organizer)
      .send({ status: 'rejected' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT application_status FROM applies_hackathon WHERE PM_ID = 11 AND hackathon_ID = ?',
      [id],
    );
    expect(rows[0].application_status).toBe('rejected');
  });

  // Case 3: organizer accepts a team of 2 members — both end up accepted, team stays intact
  it('accepts a team registration with two members', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    // Two team members
    await pool.execute(
      `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
       VALUES (20, 't1@test.local', 'PARTICIPANT', 'Team', 'Leader', 'x', 'bio', 1),
              (21, 't2@test.local', 'PARTICIPANT', 'Team', 'Member', 'x', 'bio', 1)`,
    );
    await pool.execute(`INSERT INTO participant (PM_ID) VALUES (20), (21)`);

    // Team owned by member 20 (leader)
    const [teamResult] = await pool.execute<import('mysql2').ResultSetHeader>(
      `INSERT INTO team (T_name, hackathon_ID, T_LeaderId) VALUES ('Innovators', ?, 20)`,
      [id],
    );
    const teamId = teamResult.insertId;

    // Both members apply as part of the team
    await pool.execute(
      `INSERT INTO applies_hackathon (PM_ID, hackathon_ID, idea_title, idea_description, participation_type, team_method, T_ID)
       VALUES
         (20, ?, 'Team idea', 'Description', 'team', 'manual', ?),
         (21, ?, 'Team idea', 'Description', 'team', 'manual', ?)`,
      [id, teamId, id, teamId],
    );

    // Accept member 20
    const res1 = await request(app)
      .put(`/hackathons/${id}/registrations/20/status`)
      .set(authHeaders.organizer)
      .send({ status: 'accepted' });
    expect(res1.status).toBe(200);

    // Accept member 21
    const res2 = await request(app)
      .put(`/hackathons/${id}/registrations/21/status`)
      .set(authHeaders.organizer)
      .send({ status: 'accepted' });
    expect(res2.status).toBe(200);

    // Both members should be accepted, team link intact
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT PM_ID, application_status, T_ID FROM applies_hackathon
        WHERE hackathon_ID = ? ORDER BY PM_ID`,
      [id],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].application_status).toBe('accepted');
    expect(rows[1].application_status).toBe('accepted');
    expect(rows[0].T_ID).toBe(teamId);
    expect(rows[1].T_ID).toBe(teamId);
  });
});

// features 4 : Projects & Judges Management
// addHackathonJudge
describe('addHackathonJudge', () => {
  // Case 1: successful add — judge is inserted with status 'pending' and an invite token
  it('adds a judge successfully', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    const res = await request(app)
      .post(`/hackathons/${id}/judges`)
      .set(authHeaders.organizer)
      .send({
        fullName: 'د. أحمد الحكم',
        email: 'judge1@test.local',
        specialty: 'الذكاء الاصطناعي',
      });

    expect(res.status).toBe(201);
    expect(res.body.judge.email).toBe('judge1@test.local');
    expect(res.body.judge.inviteStatus).toBe('pending');

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT HJ_FullName, HJ_Specialty, HJ_InviteStatus, HJ_InviteToken
         FROM hackathon_judge WHERE hackathon_ID = ? AND HJ_Email = ?`,
      [id, 'judge1@test.local'],
    );
    expect(rows[0].HJ_FullName).toBe('د. أحمد الحكم');
    expect(rows[0].HJ_Specialty).toBe('الذكاء الاصطناعي');
    expect(rows[0].HJ_InviteStatus).toBe('pending');
    expect(rows[0].HJ_InviteToken).toBeTruthy();
  });

  // Case 2: same email used as co-manager — refused with role_conflict
  it('refuses to add a judge whose email is already a co-manager in the same hackathon', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    // Add the email as a manager first.
    await request(app)
      .post(`/hackathons/${id}/co-managers`)
      .set(authHeaders.organizer)
      .send({
        fullName: 'مدير القسم',
        email: 'taken@test.local',
        role: 'manager',
        section: 'projects',
        permissions: ['view_projects'],
      });

    // Try to add the SAME email as a judge in the SAME hackathon.
    const res = await request(app)
      .post(`/hackathons/${id}/judges`)
      .set(authHeaders.organizer)
      .send({
        fullName: 'حكم متعارض',
        email: 'taken@test.local',
        specialty: 'البلوكتشين',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('role_conflict');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT HJ_ID FROM hackathon_judge WHERE hackathon_ID = ? AND HJ_Email = ?',
      [id, 'taken@test.local'],
    );
    expect(rows).toHaveLength(0);
  });

  // Case 3: judge independence — two different judges are added successfully with distinct IDs
  it('adds two independent judges with different IDs', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    const first = await request(app)
      .post(`/hackathons/${id}/judges`)
      .set(authHeaders.organizer)
      .send({ fullName: 'حكم أول', email: 'judgeA@test.local', specialty: 'AI' });

    const second = await request(app)
      .post(`/hackathons/${id}/judges`)
      .set(authHeaders.organizer)
      .send({ fullName: 'حكم ثاني', email: 'judgeB@test.local', specialty: 'Web' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.judge.id).not.toBe(second.body.judge.id);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT HJ_ID FROM hackathon_judge WHERE hackathon_ID = ?',
      [id],
    );
    expect(rows).toHaveLength(2);
  });
});

// features 5 : Sponsorships Management
// replaceSponsorPackages
describe('replaceSponsorPackages', () => {
  // Case 1: organizer adds 2 new packages — both inserted into DB
  it('adds two new sponsor packages successfully', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    const res = await request(app)
      .put(`/hackathons/${id}/sponsor-packages`)
      .set(authHeaders.organizer)
      .send({
        sponsorPackages: [
          { name: 'الباقة الذهبية', type: 'financial', description: 'باقة الراعي الذهبي', price: 50000, benefits: ['شعار في الموقع', 'منصة عرض'] },
          { name: 'الباقة الفضية',  type: 'financial', description: 'باقة الراعي الفضي',  price: 25000, benefits: ['شعار في الموقع'] },
        ],
      });

    expect(res.status).toBe(200);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT SP_Name, SP_Price FROM sponsor_package WHERE hackathon_ID = ? ORDER BY SP_ID',
      [id],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].SP_Name).toBe('الباقة الذهبية');
    expect(rows[1].SP_Name).toBe('الباقة الفضية');
  });

  // Case 2: cannot delete a package that has a sponsor application (would cascade-wipe applications)
  it('refuses to delete a package that has sponsor applications', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    // Add a package
    await request(app)
      .put(`/hackathons/${id}/sponsor-packages`)
      .set(authHeaders.organizer)
      .send({
        sponsorPackages: [{ name: 'الباقة الذهبية', type: 'financial', price: 50000 }],
      });

    // Seed a sponsor + application against that package
    const [pkgRows] = await pool.query<RowDataPacket[]>(
      'SELECT SP_ID FROM sponsor_package WHERE hackathon_ID = ?',
      [id],
    );
    const packageId = pkgRows[0].SP_ID;

    await pool.execute(
      `INSERT INTO member (M_ID, M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
       VALUES (30, 's1@test.local', 'SPONSOR', 'Spon', 'Sor', 'x', 'bio', 1)`,
    );
    await pool.execute(`INSERT INTO sponsor (SM_ID, S_Brand, S_CR_Number) VALUES (30, 'Brand', '1111111111')`);
    await pool.execute(
      `INSERT INTO sponsor_application (SM_ID, SP_ID, SA_Status) VALUES (30, ?, 'pending')`,
      [packageId],
    );

    // Try to delete the package by sending an empty list
    const res = await request(app)
      .put(`/hackathons/${id}/sponsor-packages`)
      .set(authHeaders.organizer)
      .send({ sponsorPackages: [] });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('package_has_applications');

    // Package must still exist
    const [stillThere] = await pool.query<RowDataPacket[]>(
      'SELECT SP_ID FROM sponsor_package WHERE SP_ID = ?',
      [packageId],
    );
    expect(stillThere).toHaveLength(1);
  });

  // Case 3: organizer updates an existing package — SP_ID is preserved, fields are changed
  it('updates an existing sponsor package without changing its id', async () => {
    const created = await request(app).post('/hackathons').set(authHeaders.organizer).send({});
    const id = created.body.hackathon_ID;

    // Create initial package
    await request(app)
      .put(`/hackathons/${id}/sponsor-packages`)
      .set(authHeaders.organizer)
      .send({
        sponsorPackages: [{ name: 'باقة قابلة للتعديل', type: 'financial', price: 10000 }],
      });

    const [before] = await pool.query<RowDataPacket[]>(
      'SELECT SP_ID, SP_Name, SP_Price FROM sponsor_package WHERE hackathon_ID = ?',
      [id],
    );
    const originalId = before[0].SP_ID;

    // PUT again with the SAME id but updated fields
    const res = await request(app)
      .put(`/hackathons/${id}/sponsor-packages`)
      .set(authHeaders.organizer)
      .send({
        sponsorPackages: [{ id: originalId, name: 'الباقة الذهبية المحدّثة', type: 'financial', price: 75000 }],
      });

    expect(res.status).toBe(200);

    const [after] = await pool.query<RowDataPacket[]>(
      'SELECT SP_ID, SP_Name, SP_Price FROM sponsor_package WHERE hackathon_ID = ?',
      [id],
    );
    expect(after).toHaveLength(1);
    expect(after[0].SP_ID).toBe(originalId);                            // same row
    expect(after[0].SP_Name).toBe('الباقة الذهبية المحدّثة');          // new name
    expect(Number(after[0].SP_Price)).toBe(75000);                      // new price
  });
});
