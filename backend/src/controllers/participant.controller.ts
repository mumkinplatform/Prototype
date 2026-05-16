import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';
import { pool } from '../db/pool';
import { hashPassword, verifyPassword } from '../lib/password';
import { extractBranding } from '../lib/branding';
import { sendTeamInviteEmail } from '../lib/mail';
import { env } from '../config/env';
import { UPLOADS_DIR, AVATARS_DIR } from '../middleware/upload.middleware';
import { notifyHackathonOrganizer } from '../lib/notifyOrganizer';

interface ParticipantProfileRow extends RowDataPacket {
  M_ID: number;
  M_Email: string;
  M_FName: string;
  M_LName: string;
  M_Bio: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  study_year: string | null;
}

interface SkillRow extends RowDataPacket {
  P_skills: string;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface PasswordRow extends RowDataPacket {
  M_password: string;
}

interface HackathonListRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
  city: string | null;
  fullAddress: string | null;
  startDate: Date | null;
  registrationDeadline: Date | null;
  status: string;
  teamMin: number;
  teamMax: number;
  participationMode: 'teams_only' | 'individuals_and_teams' | 'individuals_only';
  org: string | null;
  prizeTotal: string | null;
  tagsRaw: string | null;
  skillsRaw: string | null;
  applicantsCount: number;
  brandingRaw: string | null;
}

/** Extracts banner + logo fields from H_Branding to keep response payload small. */
// extractBranding moved to ../lib/branding (shared with sponsor controller).

interface HackathonDetailRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
  description: string | null;
  city: string | null;
  fullAddress: string | null;
  status: string;
  visibility: string;
  hackathonStartDate: Date | null;
  hackathonEndDate: Date | null;
  submissionDeadline: Date | null;
  registrationStartDate: Date | null;
  registrationEndDate: Date | null;
  announcementDate: Date | null;
  winnersDate: Date | null;
  teamMin: number;
  teamMax: number;
  participationMode: string;
  org: string | null;
  organizerId: number | null;
}

interface PrizeDetailRow extends RowDataPacket {
  HP_Position: string;
  HP_Amount: string | null;
  HP_SortOrder: number;
}

interface TrackDetailRow extends RowDataPacket {
  HT_Name: string;
}

interface IsRegisteredRow extends RowDataPacket {
  participation_type: 'solo' | 'team';
  application_status: 'pending' | 'accepted' | 'rejected';
  T_ID: number | null;
}

interface MyHackathonRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  type: string | null;
  city: string | null;
  fullAddress: string | null;
  registrationStartDate: Date | null;
  registrationDeadline: Date | null;
  hackathonStartDate: Date | null;
  hackathonEndDate: Date | null;
  submissionDeadline: Date | null;
  announcementDate: Date | null;
  winnersDate: Date | null;
  status: string;
  teamMin: number;
  teamMax: number;
  org: string | null;
  myTeamId: number | null;
  participationType: 'solo' | 'team';
  teamMethod: 'ai' | 'manual' | null;
  applicationStatus: 'pending' | 'accepted' | 'rejected';
  myIdeaTitle: string | null;
  myIdeaDescription: string | null;
  appliedAt: Date | null;
  tagsRaw: string | null;
  brandingRaw: string | null;
}

interface TeamListRow extends RowDataPacket {
  T_ID: number;
  T_name: string;
  T_LeaderId: number;
  membersCount: number;
  leaderFirstName: string | null;
  leaderLastName: string | null;
  tagsRaw: string | null;
}

interface TeamMemberRow extends RowDataPacket {
  PM_ID: number;
  M_FName: string;
  M_LName: string;
  isLeader: number;
  skillsRaw: string | null;
}

interface MyApplicationRow extends RowDataPacket {
  PM_ID: number;
  T_ID: number | null;
}

interface TeamCapacityRow extends RowDataPacket {
  T_ID: number;
  hackathon_ID: number;
  membersCount: number;
  teamMax: number;
}

interface NotificationRow extends RowDataPacket {
  N_ID: number;
  N_Type: string;
  N_Title: string;
  N_Message: string;
  N_Read: number;
  N_ActionLabel: string | null;
  N_ActionRoute: string | null;
  N_CreatedAt: Date;
}

/**
 * Verifies the request comes from an authenticated participant.
 */
function ensureParticipant(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ error: 'يجب تسجيل الدخول' });
    return false;
  }
  if (req.user.role !== 'PARTICIPANT') {
    res.status(403).json({ error: 'هذه العملية متاحة للمشاركين فقط' });
    return false;
  }
  return true;
}

/**
 * Workspace gate: a participant can only use workspace endpoints (team,
 * evaluations, messages, submission, etc.) after the organizer has accepted them
 * AND sent the decision notification email. The notification email is the formal
 * announcement — before it, the participant should remain in "pending" state
 * regardless of the internal decision the organizer made. Returns true only when
 * both conditions hold; otherwise responds with 404 (not registered) or 403
 * (rejected / still pending from the participant's POV). Endpoints should
 * `return` immediately when this returns false.
 */
async function ensureAcceptedParticipant(
  req: Request,
  res: Response,
  hackathonId: number,
): Promise<boolean> {
  const memberId = req.user!.memberId;
  interface AppRow extends RowDataPacket {
    application_status: 'pending' | 'accepted' | 'rejected';
    notification_sent_at: Date | string | null;
    participation_type: 'solo' | 'team';
    T_ID: number | null;
    H_Team_Min: number;
    H_Registration_EndDate: Date | null;
  }
  const [rows] = await pool.query<AppRow[]>(
    `SELECT a.application_status, a.notification_sent_at,
            a.participation_type, a.T_ID,
            h.H_Team_Min, h.H_Registration_EndDate
       FROM applies_hackathon a
       JOIN hackathon h ON h.hackathon_ID = a.hackathon_ID
      WHERE a.hackathon_ID = ? AND a.PM_ID = ?`,
    [hackathonId, memberId],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'لم تسجّل في هذا الهاكاثون', reason: 'not_registered' });
    return false;
  }
  const row = rows[0];
  // Until the participant has been notified, treat them as pending — the
  // organizer's internal decision is private. The participant only "sees"
  // the decision once their notification email has been sent.
  if (row.notification_sent_at === null) {
    res.status(403).json({
      error: 'طلب مشاركتك قيد المراجعة من قِبل المنظم',
      reason: 'pending',
    });
    return false;
  }
  if (row.application_status === 'rejected') {
    res.status(403).json({
      error: 'تم رفض طلب مشاركتك في هذا الهاكاثون',
      reason: 'rejected',
    });
    return false;
  }
  if (row.application_status !== 'accepted') {
    // Defensive: status='pending' should never coexist with notification_sent_at
    // IS NOT NULL (we don't send for pending), but if a manual DB edit produces
    // that state, treat as still-pending to the participant.
    res.status(403).json({
      error: 'طلب مشاركتك قيد المراجعة من قِبل المنظم',
      reason: 'pending',
    });
    return false;
  }

  // Team-minimum gate: after registration closes, a team participant whose
  // team is smaller than H_Team_Min is locked out of subsequent phases. This
  // enforces the rule that the team had to be complete by the registration
  // deadline. (Decision 3-🅳️ — see project memory.)
  const regClosed =
    row.H_Registration_EndDate !== null &&
    new Date(row.H_Registration_EndDate).getTime() <= Date.now();
  if (row.participation_type === 'team' && regClosed && row.T_ID !== null) {
    interface CntRow extends RowDataPacket { cnt: number }
    const [memberRows] = await pool.query<CntRow[]>(
      'SELECT COUNT(*) AS cnt FROM applies_hackathon WHERE T_ID = ?',
      [row.T_ID],
    );
    if (memberRows[0].cnt < row.H_Team_Min) {
      res.status(403).json({
        error: `فريقك تحت الحد الأدنى (${memberRows[0].cnt} من ${row.H_Team_Min})، انتهى وقت تعديل التسجيل`,
        reason: 'team_below_min',
      });
      return false;
    }
  }

  return true;
}

/**
 * POST /participants/me/avatar
 * Accepts an image (multipart, field "file"), saves to disk, updates
 * member.avatar_url, returns the new path. Deletes the old avatar file if any.
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) {
    if (req.file) try { fs.unlinkSync(path.join(AVATARS_DIR, req.file.filename)); } catch { /* ignore */ }
    return;
  }
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم إرفاق صورة' });
  }

  const memberId = req.user!.memberId;
  const newPath = `/uploads/avatars/${req.file.filename}`;

  // Fetch old avatar to delete after successful update
  interface OldAvatarRow extends RowDataPacket { avatar_url: string | null; }
  const [oldRows] = await pool.query<OldAvatarRow[]>(
    'SELECT avatar_url FROM member WHERE M_ID = ?',
    [memberId]
  );
  const oldUrl = oldRows[0]?.avatar_url ?? null;

  await pool.query(
    'UPDATE member SET avatar_url = ? WHERE M_ID = ?',
    [newPath, memberId]
  );

  // Only delete files we own (under /uploads/avatars/)
  if (oldUrl && oldUrl.startsWith('/uploads/avatars/')) {
    const oldFile = path.join(AVATARS_DIR, path.basename(oldUrl));
    try { fs.unlinkSync(oldFile); } catch { /* ignore */ }
  }

  return res.json({ avatarUrl: newPath });
};

/**
 * DELETE /participants/me/avatar
 * Deletes the user's avatar: sets avatar_url to NULL and removes file from disk.
 */
export const deleteAvatar = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const memberId = req.user!.memberId;

  interface OldAvatarRow extends RowDataPacket { avatar_url: string | null; }
  const [rows] = await pool.query<OldAvatarRow[]>(
    'SELECT avatar_url FROM member WHERE M_ID = ?',
    [memberId]
  );
  const oldUrl = rows[0]?.avatar_url ?? null;

  await pool.query('UPDATE member SET avatar_url = NULL WHERE M_ID = ?', [memberId]);

  // Only delete files we own (under /uploads/avatars/)
  if (oldUrl && oldUrl.startsWith('/uploads/avatars/')) {
    const oldFile = path.join(AVATARS_DIR, path.basename(oldUrl));
    try { fs.unlinkSync(oldFile); } catch { /* ignore */ }
  }

  return res.json({ ok: true });
};

export const getMyProfile = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;

  const [rows] = await pool.query<ParticipantProfileRow[]>(
    `SELECT m.M_ID, m.M_Email, m.M_FName, m.M_LName, m.M_Bio,
            m.phone, m.city, m.avatar_url,
            p.university, p.major, p.study_year
       FROM member m
       JOIN participant p ON p.PM_ID = m.M_ID
      WHERE m.M_ID = ?`,
    [memberId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'participant profile not found' });
  }

  const r = rows[0];

  const [skillRows] = await pool.query<SkillRow[]>(
    'SELECT P_skills FROM participant_skills WHERE PM_ID = ?',
    [memberId]
  );

  return res.json({
    id: r.M_ID,
    email: r.M_Email,
    firstName: r.M_FName,
    lastName: r.M_LName,
    fullName: `${r.M_FName} ${r.M_LName}`.trim(),
    bio: r.M_Bio,
    phone: r.phone,
    city: r.city,
    avatarUrl: r.avatar_url,
    university: r.university,
    major: r.major,
    studyYear: r.study_year,
    skills: skillRows.map((s) => s.P_skills),
  });
};

export const updateMyProfile = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;
  const {
    firstName,
    lastName,
    bio,
    phone,
    city,
    university,
    major,
    studyYear,
  } = req.body ?? {};

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE member
          SET M_FName = COALESCE(?, M_FName),
              M_LName = COALESCE(?, M_LName),
              M_Bio   = ?,
              phone   = ?,
              city    = ?
        WHERE M_ID = ?`,
      [
        firstName ?? null,
        lastName ?? null,
        bio ?? null,
        phone ?? null,
        city ?? null,
        memberId,
      ]
    );

    await conn.execute(
      `UPDATE participant
          SET university = ?,
              major      = ?,
              study_year = ?
        WHERE PM_ID = ?`,
      [
        university ?? null,
        major ?? null,
        studyYear ?? null,
        memberId,
      ]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('updateMyProfile error:', err);
    return res.status(500).json({ error: 'failed to update profile' });
  } finally {
    conn.release();
  }

  return getMyProfile(req, res);
};

export const addSkill = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;
  const skill = String(req.body?.skill ?? '').trim();

  if (!skill) {
    return res.status(400).json({ error: 'skill is required' });
  }
  if (skill.length > 100) {
    return res.status(400).json({ error: 'skill is too long (max 100 chars)' });
  }

  try {
    await pool.execute(
      'INSERT INTO participant_skills (PM_ID, P_skills) VALUES (?, ?)',
      [memberId, skill]
    );
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'skill already exists' });
    }
    console.error('addSkill error:', err);
    return res.status(500).json({ error: 'failed to add skill' });
  }

  return res.status(201).json({ skill });
};

export const removeSkill = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;
  const skill = String(req.params.skill ?? '').trim();

  if (!skill) {
    return res.status(400).json({ error: 'skill is required' });
  }

  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM participant_skills WHERE PM_ID = ? AND P_skills = ?',
    [memberId, skill]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'skill not found' });
  }

  return res.status(204).send();
};

export const changePassword = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'newPassword must be at least 8 characters' });
  }

  const [rows] = await pool.query<PasswordRow[]>(
    'SELECT M_password FROM member WHERE M_ID = ?',
    [memberId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'member not found' });
  }

  const ok = await verifyPassword(currentPassword, rows[0].M_password);
  if (!ok) {
    return res.status(400).json({ error: 'current password is incorrect' });
  }

  const newHash = await hashPassword(newPassword);
  await pool.execute('UPDATE member SET M_password = ? WHERE M_ID = ?', [newHash, memberId]);

  return res.status(204).send();
};

export const listHackathons = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  // Two-step query — H_Branding can hold a base64 banner up to several MB. Including
  // it in the same SELECT as ORDER BY blows MySQL's sort_buffer (256KB default) and
  // crashes with ER_OUT_OF_SORTMEMORY. Sort the small columns first, then fetch
  // branding by ID and merge in JS.
  const [rows] = await pool.query<HackathonListRow[]>(
    `SELECT
       h.hackathon_ID            AS id,
       h.H_title                 AS title,
       h.H_slug                  AS slug,
       h.H_type                  AS type,
       h.H_city                  AS city,
       h.H_full_address          AS fullAddress,
       h.H_Hackathon_StartDate   AS startDate,
       h.H_Registration_EndDate  AS registrationDeadline,
       h.H_status                AS status,
       h.H_Team_Min              AS teamMin,
       h.H_Team_Max              AS teamMax,
       h.H_Participation_Mode    AS participationMode,
       h.H_public_name           AS org,
       (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(HP_Amount, ',', ''), ' ', '') AS DECIMAL(12,2))), 0)
          FROM hackathon_prize WHERE hackathon_ID = h.hackathon_ID) AS prizeTotal,
       (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
          FROM hackathon_track WHERE hackathon_ID = h.hackathon_ID) AS tagsRaw,
       (SELECT GROUP_CONCAT(skill_name SEPARATOR '|||')
          FROM hackathon_skill WHERE hackathon_ID = h.hackathon_ID) AS skillsRaw,
       (SELECT COUNT(*) FROM applies_hackathon WHERE hackathon_ID = h.hackathon_ID) AS applicantsCount
       FROM hackathon h
      WHERE h.H_status IN ('published', 'ongoing')
        AND h.H_visibility = 'public'
      ORDER BY h.H_created_at DESC`
  );

  // Fetch branding for the listed hackathons in a separate query (no ORDER BY,
  // so sort_buffer doesn't matter even with multi-MB images).
  const brandingById = new Map<number, string | null>();
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const [brandingRows] = await pool.query<RowDataPacket[]>(
      `SELECT hackathon_ID, H_Branding FROM hackathon WHERE hackathon_ID IN (${placeholders})`,
      ids,
    );
    for (const b of brandingRows as Array<{ hackathon_ID: number; H_Branding: string | null }>) {
      brandingById.set(b.hackathon_ID, b.H_Branding ?? null);
    }
  }

  const now = Date.now();

  const items = rows.map((r) => {
    const deadlineMs = r.registrationDeadline ? new Date(r.registrationDeadline).getTime() : null;
    const registrationOpen = r.status === 'published'
      && deadlineMs !== null
      && deadlineMs > now;

    // Online hackathons: surface a friendly "عن بعد" instead of showing a dash when
    // the organizer didn't fill a city — they don't need one.
    const location = r.type === 'عبر الإنترنت'
      ? 'عن بعد'
      : ([r.city, r.fullAddress].filter((s) => s && s.trim()).join('، ') || null);

    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      type: r.type,
      location,
      org: r.org,
      startDate: r.startDate,
      registrationDeadline: r.registrationDeadline,
      prizeTotal: r.prizeTotal ? Number(r.prizeTotal) : 0,
      tags: r.tagsRaw ? r.tagsRaw.split('|||') : [],
      skills: r.skillsRaw ? r.skillsRaw.split('|||') : [],
      teamMin: r.teamMin,
      teamMax: r.teamMax,
      participationMode: r.participationMode,
      applicantsCount: r.applicantsCount,
      registrationOpen,
      branding: extractBranding(brandingById.get(r.id) ?? null),
    };
  });

  return res.json({ items });
};

export const getHackathonDetail = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  const memberId = req.user!.memberId;

  // Single-row query is safe to include H_Branding (no ORDER BY → no sort buffer issue).
  const [rows] = await pool.query<HackathonDetailRow[]>(
    `SELECT
       h.hackathon_ID            AS id,
       h.H_title                 AS title,
       h.H_slug                  AS slug,
       h.H_type                  AS type,
       h.H_description           AS description,
       h.H_city                  AS city,
       h.H_full_address          AS fullAddress,
       h.H_status                AS status,
       h.H_visibility            AS visibility,
       h.H_Hackathon_StartDate   AS hackathonStartDate,
       h.H_EndDate               AS hackathonEndDate,
       h.H_Submission_Deadline   AS submissionDeadline,
       h.H_Registration_StartDate AS registrationStartDate,
       h.H_Registration_EndDate  AS registrationEndDate,
       h.H_Announcement_Date     AS announcementDate,
       h.H_Winners_Date          AS winnersDate,
       h.H_Team_Min              AS teamMin,
       h.H_Team_Max              AS teamMax,
       h.H_Participation_Mode    AS participationMode,
       h.H_Branding              AS brandingRaw,
       h.H_public_name           AS org,
       h.HAM_ID                  AS organizerId
       FROM hackathon h
      WHERE h.hackathon_ID = ?`,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'الهاكاثون غير موجود' });
  }

  const h = rows[0];

  if (h.status === 'draft' || h.visibility === 'private') {
    return res.status(404).json({ error: 'الهاكاثون غير متاح' });
  }

  const [prizeRows] = await pool.query<PrizeDetailRow[]>(
    `SELECT HP_Position, HP_Amount, HP_SortOrder
       FROM hackathon_prize
      WHERE hackathon_ID = ?
      ORDER BY HP_SortOrder ASC`,
    [id]
  );

  const [trackRows] = await pool.query<TrackDetailRow[]>(
    'SELECT HT_Name FROM hackathon_track WHERE hackathon_ID = ?',
    [id]
  );

  const [skillRows] = await pool.query<RowDataPacket[]>(
    'SELECT skill_name FROM hackathon_skill WHERE hackathon_ID = ?',
    [id]
  );

  const [applicantsRows] = await pool.query<CountRow[]>(
    'SELECT COUNT(*) AS count FROM applies_hackathon WHERE hackathon_ID = ?',
    [id]
  );

  const [registeredRows] = await pool.query<IsRegisteredRow[]>(
    `SELECT participation_type,
            CASE WHEN notification_sent_at IS NULL THEN 'pending'
                 ELSE application_status
            END AS application_status,
            T_ID
       FROM applies_hackathon
      WHERE hackathon_ID = ? AND PM_ID = ?`,
    [id, memberId]
  );
  const myReg = registeredRows[0] ?? null;

  const now = Date.now();
  const regEndMs = h.registrationEndDate ? new Date(h.registrationEndDate).getTime() : null;
  const registrationOpen = h.status === 'published'
    && regEndMs !== null
    && regEndMs > now;

  const location = h.type === 'عبر الإنترنت'
    ? 'عن بعد'
    : ([h.city, h.fullAddress].filter((s) => s && s.trim()).join('، ') || null);

  const prizes = prizeRows.map((p) => ({
    rank: p.HP_Position,
    amount: p.HP_Amount,
    sortOrder: p.HP_SortOrder,
  }));

  // Matches the lenient parse the listHackathons SQL uses: extract the leading
  // numeric portion ("50,000 ر.س" → 50000) instead of failing the whole row
  // when there's a currency suffix.
  const prizeTotal = prizeRows.reduce((sum, p) => {
    const match = String(p.HP_Amount ?? '').replace(/,/g, '').match(/[\d.]+/);
    const n = match ? Number(match[0]) : NaN;
    return Number.isFinite(n) ? sum + n : sum;
  }, 0);

  const buildTimelineEntry = (date: Date | null, label: string) => {
    if (!date) return null;
    const t = new Date(date).getTime();
    return { date, label, done: t < now };
  };

  const timeline = [
    buildTimelineEntry(h.registrationEndDate, 'آخر موعد للتسجيل'),
    buildTimelineEntry(h.announcementDate, 'الإعلان عن المقبولين'),
    buildTimelineEntry(h.hackathonStartDate, 'انطلاق الهاكاثون'),
    buildTimelineEntry(h.submissionDeadline, 'التسليم النهائي'),
    buildTimelineEntry(h.winnersDate, 'حفل التكريم والجوائز'),
  ].filter((e): e is { date: Date; label: string; done: boolean } => e !== null);

  return res.json({
    id: h.id,
    title: h.title,
    slug: h.slug,
    type: h.type,
    description: h.description,
    location,
    org: h.org,
    organizerId: h.organizerId,
    hackathonStartDate: h.hackathonStartDate,
    hackathonEndDate: h.hackathonEndDate,
    registrationStartDate: h.registrationStartDate,
    registrationEndDate: h.registrationEndDate,
    submissionDeadline: h.submissionDeadline,
    teamMin: h.teamMin,
    teamMax: h.teamMax,
    participationMode: h.participationMode,
    tags: trackRows.map((t) => t.HT_Name),
    skills: skillRows.map((s) => (s as { skill_name: string }).skill_name),
    prizes,
    prizeTotal,
    timeline,
    branding: extractBranding((h as { brandingRaw?: string | null }).brandingRaw ?? null),
    applicantsCount: applicantsRows[0]?.count ?? 0,
    registrationOpen,
    isRegistered: myReg !== null,
    participationType: myReg?.participation_type ?? null,
    applicationStatus: myReg?.application_status ?? null,
    hasTeam: myReg?.T_ID !== null && myReg?.T_ID !== undefined,
  });
};

function newInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Validates manual-team invite emails. We do NOT require the email to belong
 * to a registered participant — anyone can be invited, and the invitee signs
 * up via the invite link if they don't have an account yet. We still reject
 * obvious mistakes: malformed email, leader inviting themselves, or an email
 * that is registered AND already enrolled in this hackathon (would be a
 * double-registration if they accepted).
 * All-or-nothing: any bad email rejects the whole list so the leader can fix
 * it before retrying.
 */
/**
 * True iff the string matches a basic email shape (something@something.tld).
 * Extracted as a pure helper so it can be unit-tested independently of any
 * DB or HTTP context.
 */
export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Normalises a raw `inviteEmails` payload coming from the request body:
 *   - rejects non-array input by returning null
 *   - trims + lowercases each entry
 *   - drops empty strings and non-string values
 *   - removes duplicates (so the same address can't take two slots)
 * Pure — no DB, no I/O. Returns null on bad shape so callers can branch.
 */
export function cleanInviteEmails(emails: unknown): string[] | null {
  if (!Array.isArray(emails)) return null;
  return Array.from(
    new Set(
      emails
        .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
        .filter((e) => e.length > 0),
    ),
  );
}

async function validateManualTeamInvites(
  emails: unknown,
  leaderMemberId: number,
  hackathonId: number,
  teamMin: number,
  teamMax: number,
): Promise<
  | { ok: true; emails: string[] }
  | { ok: false; status: number; error: string; detail?: string }
> {
  const cleaned = cleanInviteEmails(emails);
  if (cleaned === null) {
    return { ok: false, status: 400, error: 'inviteEmails يجب أن تكون قائمة' };
  }

  for (const e of cleaned) {
    if (!isValidEmailFormat(e)) {
      return { ok: false, status: 400, error: 'إيميل غير صالح', detail: e };
    }
  }

  const minRequired = Math.max(1, teamMin - 1);
  const maxAllowed = Math.max(1, teamMax - 1);
  if (cleaned.length < minRequired) {
    return {
      ok: false,
      status: 400,
      error: `الحد الأدنى لعدد الدعوات هو ${minRequired}`,
    };
  }
  if (cleaned.length > maxAllowed) {
    return {
      ok: false,
      status: 400,
      error: `الحد الأقصى لعدد الدعوات هو ${maxAllowed}`,
    };
  }

  // Reject inviting yourself — compare against the leader's own email.
  interface LeaderEmailRow extends RowDataPacket { M_Email: string }
  const [leaderEmailRows] = await pool.query<LeaderEmailRow[]>(
    'SELECT LOWER(M_Email) AS M_Email FROM member WHERE M_ID = ?',
    [leaderMemberId]
  );
  const leaderEmail = leaderEmailRows[0]?.M_Email ?? null;
  if (leaderEmail && cleaned.includes(leaderEmail)) {
    return { ok: false, status: 400, error: 'لا يمكنك دعوة نفسك' };
  }

  // For emails that DO belong to a registered participant, ensure none of
  // them is already enrolled in this hackathon (accepting would create a
  // double-registration). Unregistered emails pass through untouched — they
  // sign up via the invite link.
  interface ConflictRow extends RowDataPacket { email: string }
  const placeholders = cleaned.map(() => '?').join(',');
  const [conflictRows] = await pool.query<ConflictRow[]>(
    `SELECT LOWER(m.M_Email) AS email
       FROM member m
       JOIN applies_hackathon a ON a.PM_ID = m.M_ID
      WHERE m.M_Type = 'PARTICIPANT'
        AND a.hackathon_ID = ?
        AND LOWER(m.M_Email) IN (${placeholders})`,
    [hackathonId, ...cleaned],
  );
  if (conflictRows.length > 0) {
    return {
      ok: false,
      status: 409,
      error: 'بعض الإيميلات مسجّلة مسبقاً في هذا الهاكاثون',
      detail: conflictRows.map((r) => r.email).join(', '),
    };
  }

  return { ok: true, emails: cleaned };
}

export const registerForHackathon = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  const memberId = req.user!.memberId;
  const ideaTitle = String(req.body?.ideaTitle ?? '').trim();
  const ideaDescription = String(req.body?.ideaDescription ?? '').trim();
  const rawParticipationType = String(req.body?.participationType ?? 'team').trim();
  const participationType: 'solo' | 'team' =
    rawParticipationType === 'solo' ? 'solo' : 'team';

  // Team formation method — only meaningful for team participation. Lets the
  // organizer later filter "AI-formed teams" vs "manually-formed teams".
  const rawTeamMethod = req.body?.teamMethod;
  let teamMethod: 'ai' | 'manual' | null = null;
  if (participationType === 'team') {
    if (rawTeamMethod === 'ai' || rawTeamMethod === 'manual') {
      teamMethod = rawTeamMethod;
    } else {
      return res.status(400).json({
        error: 'يجب اختيار طريقة تكوين الفريق (ذكاء اصطناعي أو يدوي)',
      });
    }
  }

  if (!ideaTitle || !ideaDescription) {
    return res.status(400).json({ error: 'عنوان الفكرة ونبذتها مطلوبان' });
  }
  if (ideaTitle.length > 200) {
    return res.status(400).json({ error: 'عنوان الفكرة طويل (الحد 200 خانة)' });
  }
  if (ideaDescription.length > 5000) {
    return res.status(400).json({ error: 'نبذة الفكرة طويلة (الحد 5000 خانة)' });
  }

  const [hackRows] = await pool.query<RowDataPacket[]>(
    `SELECT H_title, H_status, H_visibility, H_Registration_EndDate, H_Team_Min, H_Team_Max
       FROM hackathon
      WHERE hackathon_ID = ?`,
    [id]
  );
  if (hackRows.length === 0) {
    return res.status(404).json({ error: 'الهاكاثون غير موجود' });
  }
  const h = hackRows[0] as {
    H_title: string;
    H_status: string;
    H_visibility: string;
    H_Registration_EndDate: Date | null;
    H_Team_Min: number;
    H_Team_Max: number;
  };
  if (h.H_status === 'draft' || h.H_visibility === 'private') {
    return res.status(404).json({ error: 'الهاكاثون غير متاح' });
  }
  if (h.H_status !== 'published') {
    return res.status(400).json({ error: 'التسجيل في هذا الهاكاثون غير متاح حالياً' });
  }
  const regEnd = h.H_Registration_EndDate ? new Date(h.H_Registration_EndDate).getTime() : null;
  if (regEnd === null || regEnd <= Date.now()) {
    return res.status(400).json({ error: 'انتهى وقت التسجيل في هذا الهاكاثون' });
  }

  // ─── Solo or AI-formed team: simple single-row insert ────────────────
  if (participationType === 'solo' || teamMethod === 'ai') {
    try {
      await pool.execute(
        `INSERT INTO applies_hackathon (PM_ID, hackathon_ID, idea_title, idea_description, participation_type, team_method)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [memberId, id, ideaTitle, ideaDescription, participationType, teamMethod]
      );
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'أنت مسجّل مسبقاً في هذا الهاكاثون' });
      }
      console.error('registerForHackathon error:', err);
      return res.status(500).json({ error: 'فشل تسجيل الاشتراك' });
    }

    void notifyHackathonOrganizer(id, {
      type: 'team',
      title: `طلب تسجيل جديد في "${h.H_title}"`,
      message: `قُدّمت فكرة جديدة: ${ideaTitle}`,
      actionLabel: 'مراجعة الطلبات',
      actionRoute: `/admin/hackathon/${id}/registrations#applicant=${memberId}`,
    });

    return res.status(201).json({
      hackathonId: id,
      ideaTitle,
      ideaDescription,
      participationType,
      teamMethod,
      appliedAt: new Date().toISOString(),
    });
  }

  // ─── Manual team: create team, register leader, dispatch invites ─────
  const validation = await validateManualTeamInvites(
    req.body?.inviteEmails,
    memberId,
    id,
    h.H_Team_Min,
    h.H_Team_Max,
  );
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error, detail: validation.detail });
  }

  // Compute invite expiry = MIN(NOW + 7 days, H_Registration_EndDate)
  const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Math.min(sevenDays, regEnd));

  // Fetch leader's name for the email template (done outside the transaction).
  interface LeaderNameRow extends RowDataPacket { M_FName: string; M_LName: string }
  const [leaderRows] = await pool.query<LeaderNameRow[]>(
    'SELECT M_FName, M_LName FROM member WHERE M_ID = ?',
    [memberId]
  );
  const leaderName = leaderRows.length > 0
    ? `${leaderRows[0].M_FName} ${leaderRows[0].M_LName}`.trim()
    : 'القائد';

  const conn = await pool.getConnection();
  let teamId = 0;
  let teamName = '';
  const inviteRecords: Array<{ email: string; token: string }> = [];

  try {
    await conn.beginTransaction();

    // Sequential team name within this hackathon. Lock the existing rows so
    // two concurrent registrations don't end up with the same number.
    interface TeamCountRow extends RowDataPacket { cnt: number }
    const [countRows] = await conn.query<TeamCountRow[]>(
      'SELECT COUNT(*) AS cnt FROM team WHERE hackathon_ID = ? FOR UPDATE',
      [id]
    );
    teamName = `الفريق ${countRows[0].cnt + 1}`;

    const [teamInsert] = await conn.execute<ResultSetHeader>(
      'INSERT INTO team (T_name, hackathon_ID, T_LeaderId) VALUES (?, ?, ?)',
      [teamName, id, memberId]
    );
    teamId = teamInsert.insertId;

    try {
      await conn.execute(
        `INSERT INTO applies_hackathon
           (PM_ID, hackathon_ID, idea_title, idea_description, participation_type, team_method, T_ID)
         VALUES (?, ?, ?, ?, 'team', 'manual', ?)`,
        [memberId, id, ideaTitle, ideaDescription, teamId]
      );
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        await conn.rollback();
        return res.status(409).json({ error: 'أنت مسجّل مسبقاً في هذا الهاكاثون' });
      }
      throw err;
    }

    for (const email of validation.emails) {
      const token = newInviteToken();
      await conn.execute(
        `INSERT INTO team_invitation
           (T_ID, TI_Email, TI_Token, TI_InvitedBy, TI_ExpiresAt)
         VALUES (?, ?, ?, ?, ?)`,
        [teamId, email, token, memberId, expiresAt]
      );
      inviteRecords.push({ email, token });
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('registerForHackathon (manual team) error:', err);
    return res.status(500).json({
      error: 'فشل إنشاء الفريق وإرسال الدعوات',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }

  // Fire emails after the DB commits. We don't block the response on slow SMTP;
  // failures are logged but don't roll back the team/invites (invites stay in
  // pending state and the leader can re-trigger from "my team" if needed).
  for (const inv of inviteRecords) {
    const inviteUrl = `${env.frontendUrl}/team-invite/${encodeURIComponent(inv.token)}`;
    sendTeamInviteEmail({
      to: inv.email,
      inviteeName: inv.email,
      leaderName,
      teamName,
      hackathonTitle: h.H_title,
      ideaTitle,
      inviteUrl,
      expiresAt,
    }).catch((mailErr) => {
      console.error(`sendTeamInviteEmail failed to=${inv.email}`, mailErr);
    });
  }

  void notifyHackathonOrganizer(id, {
    type: 'team',
    title: `طلب تسجيل جديد في "${h.H_title}"`,
    message: `فريق "${teamName}" قدّم فكرة "${ideaTitle}"`,
    actionLabel: 'مراجعة الطلبات',
    actionRoute: `/admin/hackathon/${id}/registrations#applicant=${memberId}`,
  });

  return res.status(201).json({
    hackathonId: id,
    teamId,
    teamName,
    ideaTitle,
    ideaDescription,
    participationType,
    teamMethod,
    invitedEmails: validation.emails,
    expiresAt: expiresAt.toISOString(),
    appliedAt: new Date().toISOString(),
  });
};

/**
 * Returns hackathons the participant is registered in (used by matchmaking dropdown).
 */
export const listMyRegisteredHackathons = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;

  // Two-step query — same reason as listHackathons: H_Branding with ORDER BY
  // would blow MySQL's sort_buffer when an organizer uploads a large banner.
  const [rows] = await pool.query<MyHackathonRow[]>(
    `SELECT
       h.hackathon_ID            AS id,
       h.H_title                 AS title,
       h.H_description           AS description,
       h.H_type                  AS type,
       h.H_city                  AS city,
       h.H_full_address          AS fullAddress,
       h.H_Registration_StartDate AS registrationStartDate,
       h.H_Registration_EndDate  AS registrationDeadline,
       h.H_Hackathon_StartDate   AS hackathonStartDate,
       h.H_EndDate               AS hackathonEndDate,
       h.H_Submission_Deadline   AS submissionDeadline,
       h.H_Announcement_Date     AS announcementDate,
       h.H_Winners_Date          AS winnersDate,
       h.H_status                AS status,
       h.H_Team_Min              AS teamMin,
       h.H_Team_Max              AS teamMax,
       h.H_public_name           AS org,
       a.T_ID                    AS myTeamId,
       a.participation_type      AS participationType,
       a.team_method             AS teamMethod,
       -- Effective status for the participant: hide the internal decision
       -- until the organizer has sent the notification email. Anything before
       -- notification_sent_at is set should look like "pending" to the
       -- participant — that's the formal announcement gate.
       CASE WHEN a.notification_sent_at IS NULL THEN 'pending'
            ELSE a.application_status
       END                       AS applicationStatus,
       a.idea_title              AS myIdeaTitle,
       a.idea_description        AS myIdeaDescription,
       a.applied_at              AS appliedAt,
       (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
          FROM hackathon_track WHERE hackathon_ID = h.hackathon_ID) AS tagsRaw
       FROM applies_hackathon a
       JOIN hackathon h ON h.hackathon_ID = a.hackathon_ID
      WHERE a.PM_ID = ?
      ORDER BY h.H_Hackathon_StartDate ASC`,
    [memberId]
  );

  const brandingById = new Map<number, string | null>();
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const [brandingRows] = await pool.query<RowDataPacket[]>(
      `SELECT hackathon_ID, H_Branding FROM hackathon WHERE hackathon_ID IN (${placeholders})`,
      ids,
    );
    for (const b of brandingRows as Array<{ hackathon_ID: number; H_Branding: string | null }>) {
      brandingById.set(b.hackathon_ID, b.H_Branding ?? null);
    }
  }

  const items = rows.map((r) => {
    const location = r.type === 'عبر الإنترنت'
      ? 'عن بعد'
      : ([r.city, r.fullAddress].filter((s) => s && s.trim()).join('، ') || null);
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      location,
      org: r.org,
      registrationStartDate: r.registrationStartDate,
      registrationDeadline: r.registrationDeadline,
      hackathonStartDate: r.hackathonStartDate,
      hackathonEndDate: r.hackathonEndDate,
      submissionDeadline: r.submissionDeadline,
      announcementDate: r.announcementDate,
      winnersDate: r.winnersDate,
      status: r.status,
      teamMin: r.teamMin,
      teamMax: r.teamMax,
      myTeamId: r.myTeamId,
      participationType: r.participationType,
      teamMethod: r.teamMethod,
      applicationStatus: r.applicationStatus,
      myIdeaTitle: r.myIdeaTitle,
      myIdeaDescription: r.myIdeaDescription,
      appliedAt: r.appliedAt,
      tags: r.tagsRaw ? r.tagsRaw.split('|||') : [],
      branding: extractBranding(brandingById.get(r.id) ?? null),
    };
  });

  return res.json({ items });
};

/**
 * Returns the participant's team (if any) in a given hackathon, with members.
 */
export const getMyTeamInHackathon = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  // No `ensureAcceptedParticipant` here — team data must be visible while the
  // application is still pending so the participant can manage their team
  // (add/cancel invites, leave, transfer leadership) during the registration
  // window. Workspace-only features (submission, evaluations, etc.) keep the
  // stricter gate on their own endpoints.

  const memberId = req.user!.memberId;

  // 1) Find my team in this hackathon (with team_method for the UI to decide
  // whether the invite-management section is relevant).
  const [appRows] = await pool.query<RowDataPacket[]>(
    `SELECT T_ID, participation_type, team_method
       FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?`,
    [memberId, id]
  );
  if (appRows.length === 0) {
    return res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
  }
  const myTeamId = (appRows[0] as { T_ID: number | null }).T_ID;
  const participationType = (appRows[0] as { participation_type: string }).participation_type;
  const teamMethod = (appRows[0] as { team_method: 'ai' | 'manual' | null }).team_method;

  if (myTeamId === null) {
    return res.json({
      team: null,
      participationType,
      teamMethod,
    });
  }

  // 2) Fetch team info — include team min so the UI can warn when below it
  // and hackathon registration end so it knows whether edits are still allowed.
  const [teamRows] = await pool.query<RowDataPacket[]>(
    `SELECT t.T_ID, t.T_name, t.T_LeaderId,
            h.H_Team_Min AS teamMin, h.H_Team_Max AS teamMax,
            h.H_Registration_EndDate AS registrationEndDate
       FROM team t
       JOIN hackathon h ON h.hackathon_ID = t.hackathon_ID
      WHERE t.T_ID = ?`,
    [myTeamId]
  );
  if (teamRows.length === 0) {
    return res.json({ team: null, participationType, teamMethod });
  }
  const team = teamRows[0] as {
    T_ID: number;
    T_name: string;
    T_LeaderId: number;
    teamMin: number;
    teamMax: number;
    registrationEndDate: Date | null;
  };

  // 3) Fetch members
  const [memberRows] = await pool.query<RowDataPacket[]>(
    `SELECT m.M_ID, m.M_FName, m.M_LName, m.M_Email
       FROM applies_hackathon ah
       JOIN member m ON m.M_ID = ah.PM_ID
      WHERE ah.T_ID = ?`,
    [myTeamId]
  );

  const members = (memberRows as Array<{ M_ID: number; M_FName: string; M_LName: string; M_Email: string }>).map((r) => ({
    id: r.M_ID,
    fullName: `${r.M_FName} ${r.M_LName}`.trim(),
    email: r.M_Email,
    isLeader: r.M_ID === team.T_LeaderId,
    isMe: r.M_ID === memberId,
  }));

  return res.json({
    team: {
      id: team.T_ID,
      name: team.T_name,
      leaderId: team.T_LeaderId,
      minMembers: team.teamMin,
      maxMembers: team.teamMax,
      registrationEndDate: team.registrationEndDate,
      members,
    },
    participationType,
    teamMethod,
  });
};

/**
 * Lists available teams in a hackathon, with members and each member's skills.
 */
export const listHackathonTeams = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, id))) return;

  const [teamRows] = await pool.query<TeamListRow[]>(
    `SELECT
       t.T_ID,
       t.T_name,
       t.T_LeaderId,
       leader.M_FName AS leaderFirstName,
       leader.M_LName AS leaderLastName,
       (SELECT COUNT(*) FROM applies_hackathon ah WHERE ah.T_ID = t.T_ID) AS membersCount,
       (SELECT GROUP_CONCAT(DISTINCT ps.P_skills SEPARATOR '|||')
          FROM applies_hackathon ah2
          LEFT JOIN participant_skills ps ON ps.PM_ID = ah2.PM_ID
         WHERE ah2.T_ID = t.T_ID) AS tagsRaw
       FROM team t
       LEFT JOIN member leader ON leader.M_ID = t.T_LeaderId
      WHERE t.hackathon_ID = ?
      ORDER BY t.T_ID ASC`,
    [id]
  );

  // Fetch all teams' members in one query
  const teamIds = teamRows.map((t) => t.T_ID);
  let membersByTeam = new Map<number, TeamMemberRow[]>();
  if (teamIds.length > 0) {
    const [memberRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         ah.T_ID,
         m.M_ID AS PM_ID,
         m.M_FName,
         m.M_LName,
         (CASE WHEN t.T_LeaderId = m.M_ID THEN 1 ELSE 0 END) AS isLeader,
         (SELECT GROUP_CONCAT(P_skills SEPARATOR '|||')
            FROM participant_skills WHERE PM_ID = m.M_ID) AS skillsRaw
         FROM applies_hackathon ah
         JOIN member m ON m.M_ID = ah.PM_ID
         JOIN team t ON t.T_ID = ah.T_ID
        WHERE ah.T_ID IN (?)`,
      [teamIds]
    );
    for (const r of memberRows as Array<TeamMemberRow & { T_ID: number }>) {
      const list = membersByTeam.get(r.T_ID) ?? [];
      list.push(r);
      membersByTeam.set(r.T_ID, list);
    }
  }

  const items = teamRows.map((t) => ({
    id: t.T_ID,
    name: t.T_name,
    leaderId: t.T_LeaderId,
    leaderName: [t.leaderFirstName, t.leaderLastName].filter(Boolean).join(' '),
    membersCount: t.membersCount,
    tags: t.tagsRaw ? Array.from(new Set(t.tagsRaw.split('|||').filter(Boolean))) : [],
    members: (membersByTeam.get(t.T_ID) ?? []).map((m) => ({
      id: m.PM_ID,
      fullName: `${m.M_FName} ${m.M_LName}`.trim(),
      isLeader: !!m.isLeader,
      skills: m.skillsRaw ? m.skillsRaw.split('|||').filter(Boolean) : [],
    })),
  }));

  return res.json({ items });
};

/**
 * Participant joins a specific team in a hackathon.
 * Updates applies_hackathon.T_ID for the participant.
 */
export const joinTeam = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const hackathonId = Number(req.params.id);
  const teamId = Number(req.body?.teamId);

  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return res.status(400).json({ error: 'رقم الفريق غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const memberId = req.user!.memberId;

  // 1) Verify participant already has a team slot row (existence already
  //    guaranteed by ensureAcceptedParticipant; we still need T_ID to detect
  //    "already in a team")
  const [appRows] = await pool.query<MyApplicationRow[]>(
    'SELECT PM_ID, T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId]
  );
  if (appRows[0].T_ID !== null) {
    return res.status(409).json({ error: 'أنت بالفعل في فريق لهذا الهاكاثون' });
  }

  // 2) Verify the team belongs to this hackathon and has capacity
  const [capRows] = await pool.query<TeamCapacityRow[]>(
    `SELECT
       t.T_ID,
       t.hackathon_ID,
       (SELECT COUNT(*) FROM applies_hackathon ah WHERE ah.T_ID = t.T_ID) AS membersCount,
       h.H_Team_Max AS teamMax
       FROM team t
       JOIN hackathon h ON h.hackathon_ID = t.hackathon_ID
      WHERE t.T_ID = ?`,
    [teamId]
  );
  if (capRows.length === 0) {
    return res.status(404).json({ error: 'الفريق غير موجود' });
  }
  const cap = capRows[0];
  if (cap.hackathon_ID !== hackathonId) {
    return res.status(400).json({ error: 'الفريق لا ينتمي لهذا الهاكاثون' });
  }
  if (cap.membersCount >= cap.teamMax) {
    return res.status(409).json({ error: 'الفريق مكتمل العدد' });
  }

  // 3) Add participant to the team
  await pool.execute(
    'UPDATE applies_hackathon SET T_ID = ? WHERE PM_ID = ? AND hackathon_ID = ?',
    [teamId, memberId, hackathonId]
  );

  return res.status(200).json({ teamId, hackathonId });
};

export const listNotifications = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;

  // Backfill in-app acceptance notifications. The organizer's
  // notifyRegistrationDecision endpoint sends the decision email and sets
  // notification_sent_at but does not insert into `notification`, so a
  // participant who only checks the in-app notifications page would miss
  // the decision. We gate on notification_sent_at (not H_Announcement_Date)
  // to stay consistent with the rest of the system: the email is the formal
  // announcement, so the in-app notification appears at the same moment.
  // Dedup key is N_ActionRoute (deterministic per hackathon).
  try {
    interface MissingDecisionRow extends RowDataPacket {
      hackathon_ID: number;
      application_status: 'accepted' | 'rejected';
      H_title: string;
    }
    const [missing] = await pool.query<MissingDecisionRow[]>(
      `SELECT a.hackathon_ID, a.application_status, h.H_title
         FROM applies_hackathon a
         JOIN hackathon h ON h.hackathon_ID = a.hackathon_ID
        WHERE a.PM_ID = ?
          AND a.application_status IN ('accepted', 'rejected')
          AND a.notification_sent_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM notification n
             WHERE n.M_ID = a.PM_ID
               AND n.N_Type = 'acceptance'
               AND n.N_ActionRoute IN (
                 CONCAT('/participant/workspace?id=', a.hackathon_ID),
                 CONCAT('/participant/hackathon/', a.hackathon_ID)
               )
          )`,
      [memberId]
    );

    for (const r of missing) {
      const accepted = r.application_status === 'accepted';
      await pool.execute(
        `INSERT INTO notification
           (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute)
         VALUES (?, 'acceptance', ?, ?, ?, ?)`,
        [
          memberId,
          accepted
            ? `تم قبولك في "${r.H_title}"`
            : `بخصوص طلبك في "${r.H_title}"`,
          accepted
            ? 'تم قبول طلبك في الهاكاثون. يمكنك دخول مساحة العمل الآن.'
            : 'نأسف، لم يتم قبول طلب مشاركتك في هذا الهاكاثون.',
          accepted ? 'دخول مساحة العمل' : null,
          accepted
            ? `/participant/workspace?id=${r.hackathon_ID}`
            : `/participant/hackathon/${r.hackathon_ID}`,
        ]
      );
    }
  } catch (backfillErr) {
    console.error('listNotifications: decision backfill failed', backfillErr);
  }

  const [rows] = await pool.query<NotificationRow[]>(
    `SELECT N_ID, N_Type, N_Title, N_Message, N_Read, N_ActionLabel, N_ActionRoute, N_CreatedAt
       FROM notification
      WHERE M_ID = ?
      ORDER BY N_CreatedAt DESC
      LIMIT 100`,
    [memberId]
  );

  const items = rows.map((r) => ({
    id: r.N_ID,
    type: r.N_Type,
    title: r.N_Title,
    message: r.N_Message,
    read: r.N_Read === 1,
    actionLabel: r.N_ActionLabel,
    actionRoute: r.N_ActionRoute,
    createdAt: r.N_CreatedAt,
  }));

  return res.json({ items });
};

export const markNotificationRead = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الإشعار غير صالح' });
  }

  const memberId = req.user!.memberId;
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE notification SET N_Read = 1 WHERE N_ID = ? AND M_ID = ?',
    [id, memberId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'الإشعار غير موجود' });
  }

  return res.status(204).send();
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;
  await pool.execute(
    'UPDATE notification SET N_Read = 1 WHERE M_ID = ? AND N_Read = 0',
    [memberId]
  );

  return res.status(204).send();
};

export const deleteNotification = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الإشعار غير صالح' });
  }

  const memberId = req.user!.memberId;
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM notification WHERE N_ID = ? AND M_ID = ?',
    [id, memberId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'الإشعار غير موجود' });
  }

  return res.status(204).send();
};

export const getStats = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const memberId = req.user!.memberId;

  const [hackathonsRows] = await pool.query<CountRow[]>(
    'SELECT COUNT(*) AS count FROM applies_hackathon WHERE PM_ID = ?',
    [memberId]
  );

  // Count finalized submissions (TS_SubmittedAt IS NOT NULL) where this
  // participant is either the solo submitter (s.PM_ID) or a member of the
  // submitting team (via applies_hackathon.T_ID).
  const [submissionsRows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS count
       FROM submission s
      WHERE s.TS_SubmittedAt IS NOT NULL
        AND (
          s.PM_ID = ?
          OR s.T_ID IN (
            SELECT T_ID FROM applies_hackathon
             WHERE PM_ID = ? AND T_ID IS NOT NULL
          )
        )`,
    [memberId, memberId]
  );

  const [skillsRows] = await pool.query<CountRow[]>(
    'SELECT COUNT(*) AS count FROM participant_skills WHERE PM_ID = ?',
    [memberId]
  );

  return res.json({
    hackathonsCount: hackathonsRows[0]?.count ?? 0,
    submissionsCount: submissionsRows[0]?.count ?? 0,
    skillsCount: skillsRows[0]?.count ?? 0,
    prizesCount: 0,
  });
};

// ─── Evaluations ─────────────────────────────────────────────
interface EvaluationHeaderRow extends RowDataPacket {
  id: number;
  judgeName: string;
  judgeSpecialty: string | null;
  comment: string | null;
  evaluatedAt: Date;
}

interface EvaluationScoreRow extends RowDataPacket {
  evaluationId: number;
  criterionName: string;
  score: number;
  sortOrder: number;
}

interface MyTeamInHackRow extends RowDataPacket {
  T_ID: number | null;
}

/**
 * Returns judge evaluations for the participant's team in a given hackathon.
 * Only works when the participant has a team.
 */
export const listMyEvaluations = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const memberId = req.user!.memberId;

  // Honor the organizer's privacy settings on the hackathon row:
  //   H_Show_Evaluations_To_Participants → master toggle
  //   H_Show_Evaluation_Notes            → strip comments when off
  //   H_Winners_Date                     → results hidden until this datetime
  // When the master toggle is off or the date hasn't passed, we return an
  // empty `items` array along with a `visibility` block so the UI can show
  // a "results will appear after X" banner instead of an awkward blank.
  const [hackRows] = await pool.query<RowDataPacket[]>(
    `SELECT H_Show_Evaluations_To_Participants AS showEvaluations,
            H_Show_Evaluation_Notes            AS showNotes,
            H_Winners_Date                     AS winnersDate
       FROM hackathon WHERE hackathon_ID = ?`,
    [hackathonId],
  );
  const settings = hackRows[0] as {
    showEvaluations: number;
    showNotes: number;
    winnersDate: Date | null;
  } | undefined;
  const showEvaluations = settings?.showEvaluations === 1;
  const showNotes = settings?.showNotes === 1;
  const winnersDate = settings?.winnersDate ?? null;
  const winnersDateMs = winnersDate ? new Date(winnersDate).getTime() : null;
  const winnersDatePassed = winnersDateMs === null || Date.now() >= winnersDateMs;
  const visible = showEvaluations && winnersDatePassed;

  // Find the participant's team in this hackathon
  const [appRows] = await pool.query<MyTeamInHackRow[]>(
    'SELECT T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId]
  );
  const teamId = appRows[0].T_ID;

  if (!visible) {
    return res.json({
      items: [],
      teamId,
      isRegistered: true,
      visibility: {
        visible: false,
        showEvaluations,
        showNotes,
        winnersDate,
        reason: !showEvaluations
          ? 'evaluations_hidden'
          : 'before_winners_date',
      },
    });
  }

  // Filter by team (if in a team) or by solo participant (PM_ID)
  const ownerCol = teamId !== null ? 'e.T_ID' : 'e.PM_ID';
  const ownerId = teamId !== null ? teamId : memberId;

  // 1) Fetch evaluation headers for this owner
  const [evRows] = await pool.query<EvaluationHeaderRow[]>(
    `SELECT
       e.E_ID         AS id,
       j.HJ_FullName  AS judgeName,
       j.HJ_Specialty AS judgeSpecialty,
       e.E_Comment    AS comment,
       e.E_EvaluatedAt AS evaluatedAt
       FROM evaluation e
       JOIN hackathon_judge j ON j.HJ_ID = e.HJ_ID
      WHERE ${ownerCol} = ?
      ORDER BY e.E_EvaluatedAt DESC`,
    [ownerId]
  );

  if (evRows.length === 0) {
    return res.json({
      items: [],
      teamId,
      isRegistered: true,
      visibility: { visible: true, showEvaluations, showNotes, winnersDate, reason: null },
    });
  }

  // 2) Fetch criterion scores for all evaluations in a single query
  const evIds = evRows.map((r) => r.id);
  const [scoreRows] = await pool.query<EvaluationScoreRow[]>(
    `SELECT
       E_ID             AS evaluationId,
       ES_CriterionName AS criterionName,
       ES_Score         AS score,
       ES_SortOrder     AS sortOrder
       FROM evaluation_score
      WHERE E_ID IN (?)
      ORDER BY E_ID ASC, ES_SortOrder ASC`,
    [evIds]
  );

  // Pull weights so we can surface `max` for each criterion in the response.
  // The participant UI uses `max` to render the per-criterion progress bar
  // (filled = score/max) and the "X / Y" label.
  const [critWeightRows] = await pool.query<RowDataPacket[]>(
    'SELECT HEC_Name, HEC_Weight FROM hackathon_evaluation_criteria WHERE hackathon_ID = ?',
    [hackathonId],
  );
  const weights = new Map<string, number>();
  for (const c of critWeightRows as Array<{ HEC_Name: string; HEC_Weight: number }>) {
    weights.set(c.HEC_Name, Number(c.HEC_Weight));
  }

  const scoresByEval = new Map<number, { name: string; score: number; max: number }[]>();
  for (const r of scoreRows) {
    if (!scoresByEval.has(r.evaluationId)) scoresByEval.set(r.evaluationId, []);
    scoresByEval.get(r.evaluationId)!.push({
      name: r.criterionName,
      score: r.score,
      max: weights.get(r.criterionName) ?? 0,
    });
  }

  const items = evRows.map((r) => {
    const criteria = scoresByEval.get(r.id) ?? [];
    // Each criterion is scored 0..weight; the project total is just the sum
    // and lands on 0..100 since weights are required to sum to 100.
    const total =
      criteria.length > 0
        ? Math.round(criteria.reduce((sum, c) => sum + c.score, 0))
        : 0;
    return {
      id: r.id,
      judgeName: r.judgeName,
      judgeSpecialty: r.judgeSpecialty,
      // Strip comments when the organizer hasn't enabled showing notes.
      comment: showNotes ? r.comment : null,
      evaluatedAt: r.evaluatedAt,
      criteria,
      totalScore: total,
      maxScore: 100,
    };
  });

  return res.json({
    items,
    teamId,
    isRegistered: true,
    visibility: { visible: true, showEvaluations, showNotes, winnersDate, reason: null },
  });
};

// ─── Team Chat ───────────────────────────────────────────────
interface TeamMessageRow extends RowDataPacket {
  id: number;
  senderId: number;
  senderFirst: string;
  senderLast: string;
  text: string;
  createdAt: Date;
}

/**
 * GET /participants/hackathons/:id/team-messages
 * Returns the participant's team chat messages (oldest first).
 */
export const listTeamMessages = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const teamId = await requireMyTeam(req, res, hackathonId);
  if (teamId === null) return;

  const [rows] = await pool.query<TeamMessageRow[]>(
    `SELECT
       tm.TM_ID        AS id,
       tm.M_ID         AS senderId,
       m.M_FName       AS senderFirst,
       m.M_LName       AS senderLast,
       tm.TM_Text      AS text,
       tm.TM_CreatedAt AS createdAt
       FROM team_message tm
       JOIN member m ON m.M_ID = tm.M_ID
      WHERE tm.T_ID = ?
      ORDER BY tm.TM_CreatedAt ASC`,
    [teamId]
  );

  const myId = req.user!.memberId;
  return res.json({
    items: rows.map((r) => ({
      id: r.id,
      senderId: r.senderId,
      senderName: `${r.senderFirst ?? ''} ${r.senderLast ?? ''}`.trim() || '—',
      text: r.text,
      createdAt: r.createdAt,
      isMine: r.senderId === myId,
    })),
  });
};

/**
 * POST /participants/hackathons/:id/team-messages
 * Body: { text: string }
 */
export const sendTeamMessage = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (text.length === 0) {
    return res.status(400).json({ error: 'الرسالة فارغة' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'الرسالة طويلة جداً (الحد 5000 حرف)' });
  }

  const teamId = await requireMyTeam(req, res, hackathonId);
  if (teamId === null) return;

  const memberId = req.user!.memberId;
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO team_message (T_ID, M_ID, TM_Text) VALUES (?, ?, ?)',
    [teamId, memberId, text]
  );

  // Notify the other team members. To avoid spamming the bell with one row per
  // message, we collapse consecutive unread chat notifications for the same
  // team into a single row by upserting on (M_ID, N_Type='team', N_ActionRoute).
  // If a recipient already has an unread chat alert for this team, we just
  // refresh its timestamp; otherwise we INSERT a fresh row. Mail / notification
  // failures are logged but do NOT fail the message send.
  try {
    interface TeamMemberRow extends RowDataPacket { PM_ID: number }
    const [otherRows] = await pool.query<TeamMemberRow[]>(
      'SELECT PM_ID FROM applies_hackathon WHERE T_ID = ? AND PM_ID <> ?',
      [teamId, memberId]
    );
    if (otherRows.length > 0) {
      // Deep-link straight to the team tab so the recipient lands on the chat,
      // not the workspace home page. The frontend reads `tab` from the URL.
      const actionRoute = `/participant/workspace?id=${hackathonId}&tab=team`;
      const title = 'رسائل جديدة من فريقك';
      const message = 'وصلتك رسائل جديدة في فريقك. افتح مساحة العمل لقراءتها.';

      for (const other of otherRows) {
        const [updateRes] = await pool.execute<ResultSetHeader>(
          `UPDATE notification
              SET N_Title = ?, N_Message = ?, N_CreatedAt = NOW()
            WHERE M_ID = ? AND N_Type = 'team'
              AND N_ActionRoute = ? AND N_Read = 0`,
          [title, message, other.PM_ID, actionRoute]
        );
        if (updateRes.affectedRows === 0) {
          await pool.execute(
            `INSERT INTO notification
               (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute)
             VALUES (?, 'team', ?, ?, 'فتح الشات', ?)`,
            [other.PM_ID, title, message, actionRoute]
          );
        }
      }
    }
  } catch (notifErr) {
    console.error('sendTeamMessage: notification upsert failed', notifErr);
  }

  return res.json({
    id: result.insertId,
    senderId: memberId,
    text,
    createdAt: new Date(),
    isMine: true,
  });
};

// ─── Submission ──────────────────────────────────────────────
interface SubmissionRow extends RowDataPacket {
  TS_ID: number;
  T_ID: number | null;
  PM_ID: number | null;
  TS_ProjectName: string | null;
  TS_ProjectDescription: string | null;
  TS_RepoUrl: string | null;
  TS_DemoUrl: string | null;
  TS_SubmittedAt: Date | null;
}

type SubmissionTarget =
  | { teamId: number; participantId: null }
  | { teamId: null; participantId: number };

interface SubmissionFileRow extends RowDataPacket {
  id: number;
  name: string;
  storedName: string;
  size: number;
  mimeType: string | null;
  uploadedBy: number;
  uploadedAt: Date;
  uploaderFirst: string | null;
  uploaderLast: string | null;
}

interface HackathonSubmissionMetaRow extends RowDataPacket {
  H_Submission_Fields: string | string[] | null;
  H_Project_Requirements: string | null;
  H_Project_Description: string | null;
  H_Submission_StartDate: Date | null;
  H_Submission_Deadline: Date | null;
  H_Hackathon_StartDate: Date | null;
  H_Max_File_Size_MB: number;
}

/**
 * Resolves the participant's team in a hackathon. Returns T_ID or null on error.
 * For team-only features (e.g. team chat). Solo participants are rejected here.
 */
async function requireMyTeam(req: Request, res: Response, hackathonId: number): Promise<number | null> {
  const memberId = req.user!.memberId;
  const [rows] = await pool.query<MyTeamInHackRow[]>(
    'SELECT T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId]
  );
  if (rows.length === 0) {
    res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
    return null;
  }
  const teamId = rows[0].T_ID;
  if (teamId === null) {
    res.status(400).json({ error: 'يجب الانضمام لفريق أولاً' });
    return null;
  }
  return teamId;
}

/**
 * Time-based gate for submission endpoints. The submission window is:
 *   [start, deadline]
 *   start    = H_Submission_StartDate, falling back to H_Hackathon_StartDate
 *   deadline = H_Submission_Deadline
 * Outside that window we reject. No "late submission" path — the organizer
 * side does not currently expose a toggle to enable it.
 */
interface SubmissionWindow {
  ok: boolean;
  status?: number;
  reason?: 'before_start' | 'closed' | 'no_dates' | 'hackathon_not_found';
  error?: string;
}

async function checkSubmissionWindow(hackathonId: number): Promise<SubmissionWindow> {
  interface HackRow extends RowDataPacket {
    H_Submission_StartDate: Date | null;
    H_Hackathon_StartDate: Date | null;
    H_Submission_Deadline: Date | null;
  }
  const [rows] = await pool.query<HackRow[]>(
    `SELECT H_Submission_StartDate, H_Hackathon_StartDate, H_Submission_Deadline
       FROM hackathon WHERE hackathon_ID = ?`,
    [hackathonId],
  );
  if (rows.length === 0) {
    return { ok: false, status: 404, reason: 'hackathon_not_found', error: 'الهاكاثون غير موجود' };
  }
  const h = rows[0];
  const startSource = h.H_Submission_StartDate ?? h.H_Hackathon_StartDate;
  const deadline = h.H_Submission_Deadline;

  if (!deadline) {
    return { ok: false, status: 400, reason: 'no_dates', error: 'تواريخ التسليم غير معدّة' };
  }

  const now = Date.now();
  if (startSource && now < new Date(startSource).getTime()) {
    return { ok: false, status: 403, reason: 'before_start', error: 'لم يبدأ وقت التسليم بعد' };
  }
  if (now > new Date(deadline).getTime()) {
    return { ok: false, status: 403, reason: 'closed', error: 'انتهى موعد التسليم' };
  }
  return { ok: true };
}

/**
 * Resolves the participant's submission target (team or solo).
 * Solo participants get their own PM_ID as target; team participants get T_ID.
 * Used by submission and evaluation endpoints that work for both modes.
 */
async function requireSubmissionTarget(
  req: Request,
  res: Response,
  hackathonId: number
): Promise<SubmissionTarget | null> {
  const memberId = req.user!.memberId;
  const [rows] = await pool.query<MyTeamInHackRow[]>(
    'SELECT T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId]
  );
  if (rows.length === 0) {
    res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
    return null;
  }
  const teamId = rows[0].T_ID;
  if (teamId !== null) return { teamId, participantId: null };
  return { teamId: null, participantId: memberId };
}

/**
 * Fetches or creates a submission row for the given target (team OR solo participant).
 * Each registered owner (team or solo) gets exactly one submission per hackathon.
 */
async function getOrCreateSubmission(
  target: SubmissionTarget,
  hackathonId: number
): Promise<SubmissionRow> {
  const isTeam = target.teamId !== null;
  const ownerCol = isTeam ? 'T_ID' : 'PM_ID';
  const ownerId = isTeam ? target.teamId! : target.participantId!;

  const selectSql = `SELECT TS_ID, T_ID, PM_ID, TS_ProjectName, TS_ProjectDescription, TS_RepoUrl, TS_DemoUrl, TS_SubmittedAt
       FROM submission
      WHERE ${ownerCol} = ? AND hackathon_ID = ?`;

  const [rows] = await pool.query<SubmissionRow[]>(selectSql, [ownerId, hackathonId]);
  if (rows.length > 0) return rows[0];

  await pool.query<ResultSetHeader>(
    `INSERT INTO submission (${ownerCol}, hackathon_ID) VALUES (?, ?)`,
    [ownerId, hackathonId]
  );
  const [created] = await pool.query<SubmissionRow[]>(selectSql, [ownerId, hackathonId]);
  return created[0];
}

/**
 * GET /participants/hackathons/:id/submission
 * Returns: project info + files + requirements + required fields + deadline.
 */
export const getMySubmission = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const target = await requireSubmissionTarget(req, res, hackathonId);
  if (target === null) return;

  const sub = await getOrCreateSubmission(target, hackathonId);

  // Files
  const [files] = await pool.query<SubmissionFileRow[]>(
    `SELECT
       f.SF_ID         AS id,
       f.SF_Name       AS name,
       f.SF_StoredName AS storedName,
       f.SF_Size       AS size,
       f.SF_MimeType   AS mimeType,
       f.SF_UploadedBy AS uploadedBy,
       f.SF_UploadedAt AS uploadedAt,
       m.M_FName       AS uploaderFirst,
       m.M_LName       AS uploaderLast
       FROM submission_file f
       LEFT JOIN member m ON m.M_ID = f.SF_UploadedBy
      WHERE f.TS_ID = ?
      ORDER BY f.SF_UploadedAt DESC`,
    [sub.TS_ID]
  );

  // Hackathon meta — including submission window so the frontend can render
  // the right UI for "before start" / "open" / "closed".
  const [metaRows] = await pool.query<HackathonSubmissionMetaRow[]>(
    `SELECT H_Submission_Fields, H_Project_Requirements, H_Project_Description,
            H_Submission_StartDate, H_Submission_Deadline, H_Hackathon_StartDate,
            H_Max_File_Size_MB
       FROM hackathon WHERE hackathon_ID = ?`,
    [hackathonId]
  );
  const meta = metaRows[0];

  let submissionFields: string[] = [];
  const rawFields = meta?.H_Submission_Fields;
  if (Array.isArray(rawFields)) {
    submissionFields = rawFields.filter((x): x is string => typeof x === 'string');
  } else if (typeof rawFields === 'string' && rawFields.trim()) {
    try {
      const parsed = JSON.parse(rawFields);
      if (Array.isArray(parsed)) submissionFields = parsed.filter((x) => typeof x === 'string');
    } catch {
      submissionFields = [];
    }
  }

  const requirements = meta?.H_Project_Requirements
    ? meta.H_Project_Requirements.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  // submissionStartDate falls back to the hackathon's overall start date when
  // the organizer didn't set a dedicated submission start — same fallback
  // used inside checkSubmissionWindow so the UI and the gate agree.
  const submissionStartDate = meta?.H_Submission_StartDate ?? meta?.H_Hackathon_StartDate ?? null;

  return res.json({
    submissionId: sub.TS_ID,
    projectName: sub.TS_ProjectName,
    projectDescription: sub.TS_ProjectDescription,
    repoUrl: sub.TS_RepoUrl,
    demoUrl: sub.TS_DemoUrl,
    submittedAt: sub.TS_SubmittedAt,
    submissionStartDate,
    submissionDeadline: meta?.H_Submission_Deadline ?? null,
    maxFileSizeMb: meta?.H_Max_File_Size_MB ?? 50,
    submissionFields,
    requirements,
    // Organizer's description of what kinds of projects are expected
    // (separate from the participant's own project description above).
    expectedProjectsDescription: meta?.H_Project_Description ?? null,
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      url: `/uploads/submissions/${f.storedName}`,
      size: Number(f.size),
      mimeType: f.mimeType,
      uploadedAt: f.uploadedAt,
      uploaderName: [f.uploaderFirst, f.uploaderLast].filter(Boolean).join(' ') || null,
    })),
  });
};

/**
 * PUT /participants/hackathons/:id/submission
 * Body: { projectName?, projectDescription?, repoUrl?, demoUrl? }
 */
export const updateMySubmission = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const win = await checkSubmissionWindow(hackathonId);
  if (!win.ok) {
    return res.status(win.status!).json({ error: win.error, reason: win.reason });
  }

  const target = await requireSubmissionTarget(req, res, hackathonId);
  if (target === null) return;

  const sub = await getOrCreateSubmission(target, hackathonId);

  // Once submitted, the submission is final — no edits, no re-saves.
  // (Organizer-side request: lets them build their own workflow without
  // worrying about post-send mutations.)
  if (sub.TS_SubmittedAt !== null) {
    return res.status(400).json({ error: 'لا يمكن تعديل التسليم بعد الإرسال' });
  }

  const b = req.body ?? {};
  const updates: string[] = [];
  const values: Array<string | null> = [];
  if ('projectName' in b)        { updates.push('TS_ProjectName = ?');        values.push(b.projectName ?? null); }
  if ('projectDescription' in b) { updates.push('TS_ProjectDescription = ?'); values.push(b.projectDescription ?? null); }
  if ('repoUrl' in b)            { updates.push('TS_RepoUrl = ?');            values.push(b.repoUrl ?? null); }
  if ('demoUrl' in b)            { updates.push('TS_DemoUrl = ?');            values.push(b.demoUrl ?? null); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'لا يوجد حقول لتحديثها' });
  }

  await pool.query(
    `UPDATE submission SET ${updates.join(', ')} WHERE TS_ID = ?`,
    [...values, sub.TS_ID]
  );

  return res.json({ ok: true });
};

/**
 * POST /participants/hackathons/:id/submission/files
 * Accepts a single file (form field "file") via multipart/form-data.
 */
export const uploadSubmissionFile = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return;
  }

  const win = await checkSubmissionWindow(hackathonId);
  if (!win.ok) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return res.status(win.status!).json({ error: win.error, reason: win.reason });
  }

  const target = await requireSubmissionTarget(req, res, hackathonId);
  if (target === null) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return;
  }

  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم إرفاق ملف' });
  }

  const sub = await getOrCreateSubmission(target, hackathonId);

  // Submission is final once sent — no new files can be attached after.
  if (sub.TS_SubmittedAt !== null) {
    fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return res.status(400).json({ error: 'لا يمكن رفع ملفات بعد إرسال التسليم' });
  }

  const memberId = req.user!.memberId;
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO submission_file (TS_ID, SF_Name, SF_StoredName, SF_Size, SF_MimeType, SF_UploadedBy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sub.TS_ID, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, memberId]
  );

  return res.json({
    id: result.insertId,
    name: req.file.originalname,
    url: `/uploads/submissions/${req.file.filename}`,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: new Date(),
  });
};

/**
 * DELETE /participants/hackathons/:id/submission/files/:fileId
 * Deletes the file from disk and DB. Verifies the file belongs to the participant's team.
 */
export const deleteSubmissionFile = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  const fileId = Number(req.params.fileId);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }
  if (!Number.isInteger(fileId) || fileId <= 0) {
    return res.status(400).json({ error: 'رقم الملف غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const win = await checkSubmissionWindow(hackathonId);
  if (!win.ok) {
    return res.status(win.status!).json({ error: win.error, reason: win.reason });
  }

  const target = await requireSubmissionTarget(req, res, hackathonId);
  if (target === null) return;

  // Verify the file belongs to this owner's submission (team or solo) and
  // pull TS_SubmittedAt so we can refuse deletion after the submission is
  // final.
  interface FileOwnerRow extends RowDataPacket {
    storedName: string;
    TS_SubmittedAt: Date | null;
  }
  const ownerCol = target.teamId !== null ? 'T_ID' : 'PM_ID';
  const ownerId = target.teamId !== null ? target.teamId : target.participantId!;
  const [rows] = await pool.query<FileOwnerRow[]>(
    `SELECT f.SF_StoredName AS storedName, ts.TS_SubmittedAt
       FROM submission_file f
       JOIN submission ts ON ts.TS_ID = f.TS_ID
      WHERE f.SF_ID = ? AND ts.${ownerCol} = ? AND ts.hackathon_ID = ?`,
    [fileId, ownerId, hackathonId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'الملف غير موجود' });
  }

  // Submission is final once sent — files are part of that final state.
  if (rows[0].TS_SubmittedAt !== null) {
    return res.status(400).json({ error: 'لا يمكن حذف ملفات بعد إرسال التسليم' });
  }

  // Best-effort disk delete (ignore if already missing)
  const filePath = path.join(UPLOADS_DIR, rows[0].storedName);
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }

  await pool.query('DELETE FROM submission_file WHERE SF_ID = ?', [fileId]);

  return res.json({ ok: true });
};

/**
 * POST /participants/hackathons/:id/submission/submit
 * Marks the submission as final (sets TS_SubmittedAt = NOW).
 */
// Maps organizer submission-field keys to their canonical participant labels +
// the TS column (for text/URL fields) used by the confirm-time validation.
const SUBMISSION_FIELD_TO_COLUMN: Record<
  string,
  { column: keyof SubmissionRow; label: string }
> = {
  title:  { column: 'TS_ProjectName',        label: 'عنوان المشروع' },
  desc:   { column: 'TS_ProjectDescription', label: 'وصف المشروع' },
  github: { column: 'TS_RepoUrl',            label: 'رابط GitHub' },
  demo:   { column: 'TS_DemoUrl',            label: 'رابط النسخة التجريبية' },
};
const SUBMISSION_FILE_FIELD_LABELS: Record<string, string> = {
  video:        'فيديو توضيحي',
  presentation: 'عرض تقديمي',
  images:       'صور المشروع',
};

export const confirmSubmission = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  if (!(await ensureAcceptedParticipant(req, res, hackathonId))) return;

  const win = await checkSubmissionWindow(hackathonId);
  if (!win.ok) {
    return res.status(win.status!).json({ error: win.error, reason: win.reason });
  }

  const target = await requireSubmissionTarget(req, res, hackathonId);
  if (target === null) return;

  const sub = await getOrCreateSubmission(target, hackathonId);

  // Already-final submissions can't be re-sent. The frontend never calls
  // this endpoint a second time, but we reject defensively.
  if (sub.TS_SubmittedAt !== null) {
    return res.status(400).json({ error: 'تم إرسال هذا المشروع بالفعل' });
  }

  // Pull the organizer's required-fields list so we can block confirmation
  // when the participant hasn't filled the required text/URL fields or
  // uploaded a file when a file-type field is required. Backend is the
  // authority here — the UI checks too, but a direct API call must still
  // be rejected with a clear list of missing items.
  const [fieldsRow] = await pool.query<RowDataPacket[]>(
    'SELECT H_Submission_Fields FROM hackathon WHERE hackathon_ID = ?',
    [hackathonId],
  );
  let requiredFields: string[] = [];
  if (fieldsRow.length > 0) {
    const raw = (fieldsRow[0] as { H_Submission_Fields: string | string[] | null })
      .H_Submission_Fields;
    if (Array.isArray(raw)) {
      requiredFields = raw.filter((x): x is string => typeof x === 'string');
    } else if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          requiredFields = parsed.filter((x: unknown): x is string => typeof x === 'string');
        }
      } catch { /* malformed JSON → treat as no required fields */ }
    }
  }

  const missing: string[] = [];
  for (const fId of requiredFields) {
    const mapping = SUBMISSION_FIELD_TO_COLUMN[fId];
    if (mapping) {
      const val = sub[mapping.column];
      if (val == null || (typeof val === 'string' && val.trim() === '')) {
        missing.push(mapping.label);
      }
    }
  }

  // For file-type fields we can't tell which uploaded file is "the video"
  // vs "the presentation", so we require at least one file overall when
  // any file-type field is requested.
  const requiredFileFields = requiredFields.filter((f) => f in SUBMISSION_FILE_FIELD_LABELS);
  if (requiredFileFields.length > 0) {
    const [fileCountRow] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM submission_file WHERE TS_ID = ?',
      [sub.TS_ID],
    );
    const cnt = (fileCountRow[0] as { cnt: number }).cnt;
    if (cnt === 0) {
      for (const f of requiredFileFields) {
        missing.push(SUBMISSION_FILE_FIELD_LABELS[f]);
      }
    }
  }

  if (missing.length > 0) {
    return res.status(400).json({
      error: 'بعض الحقول الإلزامية غير مكتملة',
      missing,
    });
  }

  await pool.query(
    'UPDATE submission SET TS_SubmittedAt = CURRENT_TIMESTAMP WHERE TS_ID = ?',
    [sub.TS_ID]
  );

  // Drop an in-app notification so the participant sees confirmation
  // matching the email/decision flow elsewhere in the app.
  try {
    const [hackRows] = await pool.query<RowDataPacket[]>(
      'SELECT H_title FROM hackathon WHERE hackathon_ID = ?',
      [hackathonId],
    );
    const hackathonTitle = hackRows.length > 0
      ? (hackRows[0] as { H_title: string }).H_title
      : 'الهاكاثون';
    await pool.execute(
      `INSERT INTO notification
         (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute)
       VALUES (?, 'submission', ?, ?, ?, ?)`,
      [
        req.user!.memberId,
        `تم إرسال مشروعك في "${hackathonTitle}"`,
        'وصل تسليمك بنجاح. التسليم نهائي ولا يمكن تعديله بعد الإرسال.',
        'فتح التسليم',
        `/participant/workspace?id=${hackathonId}&tab=submission`,
      ],
    );
  } catch (notifErr) {
    console.error('confirmSubmission: notification insert failed', notifErr);
  }

  // Notify the hackathon's organizer that a team/individual finalised a submission.
  void notifyHackathonOrganizer(hackathonId, {
    type: 'submission',
    title: `تسليم جديد في الهاكاثون`,
    message: `تم استلام مشروع "${sub.TS_ProjectName ?? 'بدون عنوان'}" نهائياً.`,
    actionLabel: 'عرض المشاريع',
    actionRoute: `/admin/hackathon/${hackathonId}/projects`,
  });

  return res.json({ ok: true, submittedAt: new Date() });
};

// ═════════════════════════════════════════════════════════════════════════════
// Team Invitations — preview / accept / decline (manual team formation)
// ═════════════════════════════════════════════════════════════════════════════

export interface TeamInviteLookupRow extends RowDataPacket {
  TI_ID: number;
  TI_Email: string;
  TI_Status: 'pending' | 'accepted' | 'declined' | 'expired';
  TI_ExpiresAt: Date | null;
  TI_RespondedAt: Date | null;
  T_ID: number;
  T_name: string;
  leader_M_ID: number;
  leader_first: string;
  leader_last: string;
  hackathon_ID: number;
  hackathon_title: string;
  hackathon_reg_end: Date | null;
  idea_title: string | null;
  idea_description: string | null;
  H_Team_Max: number;
}

/** Loads everything the preview/accept/decline endpoints need in one query. */
async function loadTeamInviteContext(token: string): Promise<TeamInviteLookupRow | null> {
  const [rows] = await pool.query<TeamInviteLookupRow[]>(
    `SELECT
        ti.TI_ID, ti.TI_Email, ti.TI_Status, ti.TI_ExpiresAt, ti.TI_RespondedAt,
        t.T_ID, t.T_name,
        leader.M_ID AS leader_M_ID,
        leader.M_FName AS leader_first,
        leader.M_LName AS leader_last,
        h.hackathon_ID, h.H_title AS hackathon_title,
        h.H_Registration_EndDate AS hackathon_reg_end,
        h.H_Team_Max,
        leaderApp.idea_title, leaderApp.idea_description
      FROM team_invitation ti
      JOIN team t ON t.T_ID = ti.T_ID
      JOIN member leader ON leader.M_ID = t.T_LeaderId
      JOIN hackathon h ON h.hackathon_ID = t.hackathon_ID
      LEFT JOIN applies_hackathon leaderApp
        ON leaderApp.PM_ID = t.T_LeaderId AND leaderApp.hackathon_ID = t.hackathon_ID
      WHERE ti.TI_Token = ?
      LIMIT 1`,
    [token],
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Computes the effective status of an invite, taking into account hard-coded
 * expiry checks. The DB column TI_Status is the recorded state, but a pending
 * invite may also be effectively expired because of time. We don't auto-update
 * the row here — that's done by a separate cleanup, or just at next access.
 */
export function effectiveInviteStatus(
  row: TeamInviteLookupRow,
  now = Date.now(),
): 'pending' | 'accepted' | 'declined' | 'expired' {
  if (row.TI_Status !== 'pending') return row.TI_Status;
  if (row.TI_ExpiresAt && new Date(row.TI_ExpiresAt).getTime() <= now) return 'expired';
  if (row.hackathon_reg_end && new Date(row.hackathon_reg_end).getTime() <= now) return 'expired';
  return 'pending';
}

/**
 * GET /team-invitations/:token
 * Public — no auth. Returns the team, leader, hackathon, and idea snapshot so
 * the invitee can preview before deciding. The token itself is the secret.
 */
export const getTeamInviteByToken = async (req: Request, res: Response) => {
  const token = String(req.params.token ?? '').trim();
  if (!token) {
    return res.status(400).json({ error: 'token غير صالح' });
  }
  const ctx = await loadTeamInviteContext(token);
  if (!ctx) {
    return res.status(404).json({ error: 'الدعوة غير موجودة' });
  }

  const status = effectiveInviteStatus(ctx);

  return res.json({
    email: ctx.TI_Email,
    status,
    expiresAt: ctx.TI_ExpiresAt,
    respondedAt: ctx.TI_RespondedAt,
    team: {
      id: ctx.T_ID,
      name: ctx.T_name,
    },
    leader: {
      id: ctx.leader_M_ID,
      fullName: `${ctx.leader_first} ${ctx.leader_last}`.trim(),
    },
    hackathon: {
      id: ctx.hackathon_ID,
      title: ctx.hackathon_title,
      registrationEndDate: ctx.hackathon_reg_end,
    },
    idea: {
      title: ctx.idea_title,
      description: ctx.idea_description,
    },
  });
};

/**
 * Verifies that the logged-in caller is the intended invitee. Returns the
 * caller's member row when matched, or writes a 403 response otherwise.
 */
async function ensureInviteRecipient(
  req: Request,
  res: Response,
  inviteEmail: string,
): Promise<{ memberId: number; email: string } | null> {
  if (!ensureParticipant(req, res)) return null;
  const memberId = req.user!.memberId;
  interface CallerRow extends RowDataPacket { M_Email: string }
  const [rows] = await pool.query<CallerRow[]>(
    'SELECT M_Email FROM member WHERE M_ID = ?',
    [memberId]
  );
  const callerEmail = (rows[0]?.M_Email ?? '').toLowerCase();
  if (!callerEmail || callerEmail !== inviteEmail.toLowerCase()) {
    res.status(403).json({
      error: 'هذه الدعوة موجّهة لإيميل مختلف',
      reason: 'email_mismatch',
    });
    return null;
  }
  return { memberId, email: callerEmail };
}

/**
 * POST /team-invitations/:token/accept
 * Auth required. The caller must be a PARTICIPANT whose email matches the
 * invite. We insert their applies_hackathon row (inheriting the leader's
 * idea) and mark the invite accepted in one transaction.
 */
export const acceptTeamInvite = async (req: Request, res: Response) => {
  const token = String(req.params.token ?? '').trim();
  if (!token) {
    return res.status(400).json({ error: 'token غير صالح' });
  }

  const ctx = await loadTeamInviteContext(token);
  if (!ctx) {
    return res.status(404).json({ error: 'الدعوة غير موجودة' });
  }

  const status = effectiveInviteStatus(ctx);
  if (status === 'accepted') {
    return res.status(409).json({ error: 'الدعوة مقبولة مسبقاً', reason: 'already_accepted' });
  }
  if (status === 'declined') {
    return res.status(409).json({ error: 'الدعوة مرفوضة مسبقاً', reason: 'already_declined' });
  }
  if (status === 'expired') {
    return res.status(410).json({ error: 'انتهت صلاحية الدعوة', reason: 'expired' });
  }

  const caller = await ensureInviteRecipient(req, res, ctx.TI_Email);
  if (!caller) return;

  // Caller can't already be in this hackathon (would be a double-registration).
  interface AlreadyRow extends RowDataPacket { PM_ID: number; T_ID: number | null }
  const [alreadyRows] = await pool.query<AlreadyRow[]>(
    'SELECT PM_ID, T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [caller.memberId, ctx.hackathon_ID]
  );
  if (alreadyRows.length > 0) {
    const reason = alreadyRows[0].T_ID === null ? 'already_solo' : 'already_in_team';
    return res.status(409).json({
      error:
        reason === 'already_solo'
          ? 'أنت مسجّل في هذا الهاكاثون كفرد. احذف تسجيلك أولاً لقبول الدعوة'
          : 'أنت عضو في فريق آخر في هذا الهاكاثون. غادر فريقك أولاً لقبول الدعوة',
      reason,
    });
  }

  // The leader must have an applies_hackathon row with the idea — sanity check.
  if (!ctx.idea_title || !ctx.idea_description) {
    return res.status(500).json({ error: 'بيانات الفكرة غير مكتملة', reason: 'idea_missing' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check team capacity inside the transaction so we don't oversubscribe.
    interface SizeRow extends RowDataPacket { cnt: number }
    const [sizeRows] = await conn.query<SizeRow[]>(
      'SELECT COUNT(*) AS cnt FROM applies_hackathon WHERE T_ID = ? FOR UPDATE',
      [ctx.T_ID]
    );
    if (sizeRows[0].cnt >= ctx.H_Team_Max) {
      await conn.rollback();
      return res.status(409).json({ error: 'الفريق مكتمل', reason: 'team_full' });
    }

    await conn.execute(
      `INSERT INTO applies_hackathon
         (PM_ID, hackathon_ID, idea_title, idea_description, participation_type, team_method, T_ID)
       VALUES (?, ?, ?, ?, 'team', 'manual', ?)`,
      [caller.memberId, ctx.hackathon_ID, ctx.idea_title, ctx.idea_description, ctx.T_ID]
    );

    await conn.execute(
      `UPDATE team_invitation
          SET TI_Status = 'accepted', TI_RespondedAt = NOW()
        WHERE TI_ID = ?`,
      [ctx.TI_ID]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('acceptTeamInvite error:', err);
    return res.status(500).json({
      error: 'فشل قبول الدعوة',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }

  return res.json({
    ok: true,
    teamId: ctx.T_ID,
    teamName: ctx.T_name,
    hackathonId: ctx.hackathon_ID,
  });
};

/**
 * POST /team-invitations/:token/decline
 * Auth required (same email match rule as accept). Just flips the status —
 * doesn't touch applies_hackathon since the invitee was never enrolled.
 */
export const declineTeamInvite = async (req: Request, res: Response) => {
  const token = String(req.params.token ?? '').trim();
  if (!token) {
    return res.status(400).json({ error: 'token غير صالح' });
  }

  const ctx = await loadTeamInviteContext(token);
  if (!ctx) {
    return res.status(404).json({ error: 'الدعوة غير موجودة' });
  }

  const status = effectiveInviteStatus(ctx);
  if (status === 'accepted') {
    return res.status(409).json({ error: 'الدعوة مقبولة مسبقاً', reason: 'already_accepted' });
  }
  if (status === 'declined') {
    return res.status(409).json({ error: 'الدعوة مرفوضة مسبقاً', reason: 'already_declined' });
  }
  if (status === 'expired') {
    return res.status(410).json({ error: 'انتهت صلاحية الدعوة', reason: 'expired' });
  }

  const caller = await ensureInviteRecipient(req, res, ctx.TI_Email);
  if (!caller) return;

  await pool.execute(
    `UPDATE team_invitation
        SET TI_Status = 'declined', TI_RespondedAt = NOW()
      WHERE TI_ID = ?`,
    [ctx.TI_ID]
  );

  return res.json({ ok: true });
};

// ═════════════════════════════════════════════════════════════════════════════
// Team Management — add/resend/cancel/list invites, withdraw, transfer lead
// ═════════════════════════════════════════════════════════════════════════════

interface LeaderTeamRow extends RowDataPacket {
  T_ID: number;
  T_name: string;
  hackathon_ID: number;
  H_title: string;
  H_Team_Min: number;
  H_Team_Max: number;
  H_Registration_EndDate: Date | null;
}

/**
 * Loads the team led by `memberId` in `hackathonId`. Returns null if the caller
 * isn't currently the leader (covers both "no team" and "demoted from leader").
 * The hackathon fields come along since most endpoints need them anyway.
 */
async function loadTeamForLeader(
  memberId: number,
  hackathonId: number,
): Promise<LeaderTeamRow | null> {
  const [rows] = await pool.query<LeaderTeamRow[]>(
    `SELECT t.T_ID, t.T_name, t.hackathon_ID,
            h.H_title, h.H_Team_Min, h.H_Team_Max, h.H_Registration_EndDate
       FROM team t
       JOIN hackathon h ON h.hackathon_ID = t.hackathon_ID
      WHERE t.hackathon_ID = ? AND t.T_LeaderId = ?
      LIMIT 1`,
    [hackathonId, memberId],
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Counts current "slots used" toward team capacity:
 * accepted members (rows in applies_hackathon with this T_ID) + pending invites.
 */
async function countTeamCapacityUsed(teamId: number): Promise<number> {
  interface CntRow extends RowDataPacket { cnt: number }
  const [memberRows] = await pool.query<CntRow[]>(
    'SELECT COUNT(*) AS cnt FROM applies_hackathon WHERE T_ID = ?',
    [teamId],
  );
  const [pendingRows] = await pool.query<CntRow[]>(
    "SELECT COUNT(*) AS cnt FROM team_invitation WHERE T_ID = ? AND TI_Status = 'pending'",
    [teamId],
  );
  return memberRows[0].cnt + pendingRows[0].cnt;
}

function registrationOpen(regEnd: Date | null): boolean {
  if (!regEnd) return false;
  return new Date(regEnd).getTime() > Date.now();
}

/**
 * POST /participants/hackathons/:id/team-invites
 * Leader adds more invites to their team after initial registration. Capacity
 * = accepted members + pending invites; new invites can't push this past
 * H_Team_Max. Same email validation as initial registration.
 */
export const addTeamInvites = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }
  const memberId = req.user!.memberId;

  const team = await loadTeamForLeader(memberId, hackathonId);
  if (!team) {
    return res.status(403).json({ error: 'لا تملك صلاحية إدارة دعوات هذا الفريق', reason: 'not_leader' });
  }
  if (!registrationOpen(team.H_Registration_EndDate)) {
    return res.status(400).json({ error: 'انتهى وقت التسجيل، لا يمكن تعديل الدعوات', reason: 'registration_closed' });
  }

  const rawEmails = req.body?.inviteEmails;
  if (!Array.isArray(rawEmails)) {
    return res.status(400).json({ error: 'inviteEmails يجب أن تكون قائمة' });
  }

  // Reuse the same validation as initial registration. We pass teamMin=1 so
  // the "at least teamMin-1" floor doesn't apply (the team already exists).
  const validation = await validateManualTeamInvites(
    rawEmails,
    memberId,
    hackathonId,
    /* teamMin */ 1,
    team.H_Team_Max,
  );
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error, detail: validation.detail });
  }

  // Reject emails that already have a pending/accepted invite for this team.
  interface ExistingRow extends RowDataPacket { TI_Email: string }
  const placeholders = validation.emails.map(() => '?').join(',');
  const [existingRows] = await pool.query<ExistingRow[]>(
    `SELECT LOWER(TI_Email) AS TI_Email
       FROM team_invitation
      WHERE T_ID = ?
        AND TI_Status IN ('pending', 'accepted')
        AND LOWER(TI_Email) IN (${placeholders})`,
    [team.T_ID, ...validation.emails],
  );
  if (existingRows.length > 0) {
    return res.status(409).json({
      error: 'بعض الإيميلات لها دعوة سارية مسبقاً في فريقك',
      detail: existingRows.map((r) => r.TI_Email).join(', '),
    });
  }

  // Capacity check: existing (members + pending) + new invites ≤ team max.
  const used = await countTeamCapacityUsed(team.T_ID);
  if (used + validation.emails.length > team.H_Team_Max) {
    return res.status(409).json({
      error: `الفريق ممتلئ. لديك ${used} من ${team.H_Team_Max} مقاعد مشغولة`,
      reason: 'team_full',
    });
  }

  // Pull the idea snapshot for the email template.
  interface IdeaRow extends RowDataPacket { idea_title: string }
  const [ideaRows] = await pool.query<IdeaRow[]>(
    'SELECT idea_title FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId],
  );
  const ideaTitle = ideaRows[0]?.idea_title ?? '—';

  interface LeaderNameRow extends RowDataPacket { M_FName: string; M_LName: string }
  const [leaderRows] = await pool.query<LeaderNameRow[]>(
    'SELECT M_FName, M_LName FROM member WHERE M_ID = ?',
    [memberId],
  );
  const leaderName = leaderRows.length > 0
    ? `${leaderRows[0].M_FName} ${leaderRows[0].M_LName}`.trim()
    : 'القائد';

  // Compute expiry now so all invites in this batch share it.
  const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const regEndMs = team.H_Registration_EndDate
    ? new Date(team.H_Registration_EndDate).getTime()
    : sevenDays;
  const expiresAt = new Date(Math.min(sevenDays, regEndMs));

  const conn = await pool.getConnection();
  const records: Array<{ email: string; token: string }> = [];
  try {
    await conn.beginTransaction();
    for (const email of validation.emails) {
      const token = newInviteToken();
      await conn.execute(
        `INSERT INTO team_invitation
           (T_ID, TI_Email, TI_Token, TI_InvitedBy, TI_ExpiresAt)
         VALUES (?, ?, ?, ?, ?)`,
        [team.T_ID, email, token, memberId, expiresAt],
      );
      records.push({ email, token });
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('addTeamInvites error:', err);
    return res.status(500).json({
      error: 'فشل إنشاء الدعوات',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }

  for (const inv of records) {
    const inviteUrl = `${env.frontendUrl}/team-invite/${encodeURIComponent(inv.token)}`;
    sendTeamInviteEmail({
      to: inv.email,
      inviteeName: inv.email,
      leaderName,
      teamName: team.T_name,
      hackathonTitle: team.H_title,
      ideaTitle,
      inviteUrl,
      expiresAt,
    }).catch((mailErr) => {
      console.error(`addTeamInvites: sendTeamInviteEmail failed to=${inv.email}`, mailErr);
    });
  }

  return res.status(201).json({
    teamId: team.T_ID,
    invitedEmails: validation.emails,
    expiresAt: expiresAt.toISOString(),
  });
};

/**
 * POST /participants/team-invites/:inviteId/resend
 * Regenerates token + expiry for an expired invite and re-sends the email.
 * Only allowed for invites whose effective status is 'expired' (declined and
 * accepted invites cannot be resent — that would override the recipient's
 * decision or duplicate an existing membership).
 */
export const resendTeamInvite = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const inviteId = Number(req.params.inviteId);
  if (!Number.isInteger(inviteId) || inviteId <= 0) {
    return res.status(400).json({ error: 'رقم الدعوة غير صالح' });
  }
  const memberId = req.user!.memberId;

  interface LookupRow extends RowDataPacket {
    TI_ID: number;
    TI_Email: string;
    TI_Status: 'pending' | 'accepted' | 'declined' | 'expired';
    TI_ExpiresAt: Date | null;
    T_ID: number;
    T_name: string;
    T_LeaderId: number;
    hackathon_ID: number;
    H_title: string;
    H_Registration_EndDate: Date | null;
    idea_title: string | null;
    leader_first: string;
    leader_last: string;
  }
  const [rows] = await pool.query<LookupRow[]>(
    `SELECT ti.TI_ID, ti.TI_Email, ti.TI_Status, ti.TI_ExpiresAt,
            t.T_ID, t.T_name, t.T_LeaderId, t.hackathon_ID,
            h.H_title, h.H_Registration_EndDate,
            leaderApp.idea_title,
            leader.M_FName AS leader_first, leader.M_LName AS leader_last
       FROM team_invitation ti
       JOIN team t ON t.T_ID = ti.T_ID
       JOIN hackathon h ON h.hackathon_ID = t.hackathon_ID
       JOIN member leader ON leader.M_ID = t.T_LeaderId
       LEFT JOIN applies_hackathon leaderApp
         ON leaderApp.PM_ID = t.T_LeaderId AND leaderApp.hackathon_ID = t.hackathon_ID
      WHERE ti.TI_ID = ?
      LIMIT 1`,
    [inviteId],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'الدعوة غير موجودة' });
  }
  const inv = rows[0];

  if (inv.T_LeaderId !== memberId) {
    return res.status(403).json({ error: 'لا تملك صلاحية إعادة إرسال هذه الدعوة', reason: 'not_leader' });
  }
  if (!registrationOpen(inv.H_Registration_EndDate)) {
    return res.status(400).json({ error: 'انتهى وقت التسجيل', reason: 'registration_closed' });
  }
  if (inv.TI_Status === 'accepted') {
    return res.status(409).json({ error: 'الدعوة مقبولة بالفعل', reason: 'already_accepted' });
  }
  if (inv.TI_Status === 'declined') {
    return res.status(409).json({ error: 'الدعوة مرفوضة من المدعو، لا يمكن إعادة الإرسال', reason: 'already_declined' });
  }
  // Effective expiry check
  const now = Date.now();
  const recordedExpired = inv.TI_Status === 'expired';
  const timeExpired = inv.TI_ExpiresAt && new Date(inv.TI_ExpiresAt).getTime() <= now;
  if (!recordedExpired && !timeExpired) {
    return res.status(409).json({ error: 'الدعوة لا تزال سارية، لا حاجة لإعادة الإرسال', reason: 'still_pending' });
  }

  const sevenDays = now + 7 * 24 * 60 * 60 * 1000;
  const regEndMs = inv.H_Registration_EndDate
    ? new Date(inv.H_Registration_EndDate).getTime()
    : sevenDays;
  const expiresAt = new Date(Math.min(sevenDays, regEndMs));
  const newToken = newInviteToken();

  await pool.execute(
    `UPDATE team_invitation
        SET TI_Token = ?, TI_Status = 'pending',
            TI_InvitedAt = NOW(), TI_ExpiresAt = ?, TI_RespondedAt = NULL
      WHERE TI_ID = ?`,
    [newToken, expiresAt, inv.TI_ID],
  );

  const inviteUrl = `${env.frontendUrl}/team-invite/${encodeURIComponent(newToken)}`;
  sendTeamInviteEmail({
    to: inv.TI_Email,
    inviteeName: inv.TI_Email,
    leaderName: `${inv.leader_first} ${inv.leader_last}`.trim(),
    teamName: inv.T_name,
    hackathonTitle: inv.H_title,
    ideaTitle: inv.idea_title ?? '—',
    inviteUrl,
    expiresAt,
  }).catch((mailErr) => {
    console.error(`resendTeamInvite: sendTeamInviteEmail failed to=${inv.TI_Email}`, mailErr);
  });

  return res.json({ inviteId: inv.TI_ID, expiresAt: expiresAt.toISOString() });
};

/**
 * DELETE /participants/team-invites/:inviteId
 * Leader cancels a pending invite. Accepted/declined invites are records of
 * decisions and can't be canceled — only pending ones can be removed.
 */
export const cancelTeamInvite = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const inviteId = Number(req.params.inviteId);
  if (!Number.isInteger(inviteId) || inviteId <= 0) {
    return res.status(400).json({ error: 'رقم الدعوة غير صالح' });
  }
  const memberId = req.user!.memberId;

  interface LookupRow extends RowDataPacket {
    TI_ID: number;
    TI_Status: 'pending' | 'accepted' | 'declined' | 'expired';
    T_LeaderId: number;
    H_Registration_EndDate: Date | null;
  }
  const [rows] = await pool.query<LookupRow[]>(
    `SELECT ti.TI_ID, ti.TI_Status, t.T_LeaderId, h.H_Registration_EndDate
       FROM team_invitation ti
       JOIN team t ON t.T_ID = ti.T_ID
       JOIN hackathon h ON h.hackathon_ID = t.hackathon_ID
      WHERE ti.TI_ID = ?
      LIMIT 1`,
    [inviteId],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'الدعوة غير موجودة' });
  }
  const inv = rows[0];

  if (inv.T_LeaderId !== memberId) {
    return res.status(403).json({ error: 'لا تملك صلاحية إلغاء هذه الدعوة', reason: 'not_leader' });
  }
  if (!registrationOpen(inv.H_Registration_EndDate)) {
    return res.status(400).json({ error: 'انتهى وقت التسجيل', reason: 'registration_closed' });
  }
  if (inv.TI_Status !== 'pending') {
    return res.status(409).json({
      error: 'يمكن إلغاء الدعوات المعلّقة فقط',
      reason: 'not_pending',
    });
  }

  await pool.execute('DELETE FROM team_invitation WHERE TI_ID = ?', [inv.TI_ID]);
  return res.json({ ok: true });
};

/**
 * GET /participants/hackathons/:id/team-invites
 * Returns all invitations for the caller's team (whether they're the leader
 * or an accepted member) so the workspace can display invite status to the
 * whole team.
 */
export const listTeamInvites = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }
  const memberId = req.user!.memberId;

  // Find caller's team in this hackathon (must be an accepted member or leader).
  interface MyTeamRow extends RowDataPacket { T_ID: number | null; T_LeaderId: number }
  const [meRows] = await pool.query<MyTeamRow[]>(
    `SELECT a.T_ID, t.T_LeaderId
       FROM applies_hackathon a
       LEFT JOIN team t ON t.T_ID = a.T_ID
      WHERE a.PM_ID = ? AND a.hackathon_ID = ?
      LIMIT 1`,
    [memberId, hackathonId],
  );
  if (meRows.length === 0 || meRows[0].T_ID === null) {
    return res.json({ items: [], isLeader: false });
  }
  const myTeamId = meRows[0].T_ID;
  const isLeader = meRows[0].T_LeaderId === memberId;

  interface InviteRow extends RowDataPacket {
    TI_ID: number;
    TI_Email: string;
    TI_Status: 'pending' | 'accepted' | 'declined' | 'expired';
    TI_InvitedAt: Date;
    TI_ExpiresAt: Date | null;
    TI_RespondedAt: Date | null;
  }
  const [rows] = await pool.query<InviteRow[]>(
    `SELECT TI_ID, TI_Email, TI_Status, TI_InvitedAt, TI_ExpiresAt, TI_RespondedAt
       FROM team_invitation
      WHERE T_ID = ?
      ORDER BY TI_InvitedAt DESC`,
    [myTeamId],
  );

  const now = Date.now();
  const items = rows.map((r) => {
    // Effective status: a 'pending' row past its expiry should display as 'expired'
    // even if the DB row hasn't been touched yet.
    let status = r.TI_Status;
    if (status === 'pending' && r.TI_ExpiresAt && new Date(r.TI_ExpiresAt).getTime() <= now) {
      status = 'expired';
    }
    return {
      id: r.TI_ID,
      email: r.TI_Email,
      status,
      invitedAt: r.TI_InvitedAt,
      expiresAt: r.TI_ExpiresAt,
      respondedAt: r.TI_RespondedAt,
    };
  });

  return res.json({ items, isLeader, teamId: myTeamId });
};

/**
 * DELETE /participants/hackathons/:id/my-registration
 * Caller withdraws from the hackathon. Rules:
 *   • Solo participant or non-leader team member: row is just deleted.
 *   • Team leader: only allowed if no other accepted members remain
 *     (they'd need to transfer leadership first per decision 4-A).
 *     If alone, the team and all its invitations are deleted with them.
 */
export const withdrawFromHackathon = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }
  const memberId = req.user!.memberId;

  interface MyAppRow extends RowDataPacket {
    PM_ID: number;
    T_ID: number | null;
    T_LeaderId: number | null;
  }
  const [meRows] = await pool.query<MyAppRow[]>(
    `SELECT a.PM_ID, a.T_ID, t.T_LeaderId
       FROM applies_hackathon a
       LEFT JOIN team t ON t.T_ID = a.T_ID
      WHERE a.PM_ID = ? AND a.hackathon_ID = ?
      LIMIT 1`,
    [memberId, hackathonId],
  );
  if (meRows.length === 0) {
    return res.status(404).json({ error: 'لم تسجّل في هذا الهاكاثون', reason: 'not_registered' });
  }
  const me = meRows[0];

  // Registration-window guard
  interface RegEndRow extends RowDataPacket { H_Registration_EndDate: Date | null }
  const [regRows] = await pool.query<RegEndRow[]>(
    'SELECT H_Registration_EndDate FROM hackathon WHERE hackathon_ID = ?',
    [hackathonId],
  );
  if (!registrationOpen(regRows[0]?.H_Registration_EndDate ?? null)) {
    return res.status(400).json({ error: 'انتهى وقت التسجيل، لا يمكن الانسحاب', reason: 'registration_closed' });
  }

  // Solo or non-leader team member: simple delete.
  if (me.T_ID === null || me.T_LeaderId !== memberId) {
    await pool.execute(
      'DELETE FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
      [memberId, hackathonId],
    );
    void notifyHackathonOrganizer(hackathonId, {
      type: 'team',
      title: `انسحاب من الهاكاثون`,
      message: `قام أحد المتقدمين بسحب طلب التسجيل.`,
      actionLabel: 'عرض المتقدمين',
      actionRoute: `/admin/hackathon/${hackathonId}/registrations`,
    });
    return res.json({ ok: true });
  }

  // Caller is the leader. They can only withdraw if no other accepted members.
  interface CntRow extends RowDataPacket { cnt: number }
  const [otherRows] = await pool.query<CntRow[]>(
    'SELECT COUNT(*) AS cnt FROM applies_hackathon WHERE T_ID = ? AND PM_ID <> ?',
    [me.T_ID, memberId],
  );
  if (otherRows[0].cnt > 0) {
    return res.status(409).json({
      error: 'فريقك يضم أعضاء آخرين. انقل القيادة لأحدهم قبل الانسحاب',
      reason: 'leader_has_members',
    });
  }

  // Lone leader: delete the team (CASCADE removes pending invitations) and
  // the leader's applies_hackathon row inside a single transaction.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'DELETE FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
      [memberId, hackathonId],
    );
    await conn.execute('DELETE FROM team WHERE T_ID = ?', [me.T_ID]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('withdrawFromHackathon (leader) error:', err);
    return res.status(500).json({
      error: 'فشل الانسحاب',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }

  void notifyHackathonOrganizer(hackathonId, {
    type: 'team',
    title: `انسحاب فريق كامل من الهاكاثون`,
    message: `قائد فريق انسحب وأُلغي الفريق (لم يكن لديه أعضاء آخرون).`,
    actionLabel: 'عرض المتقدمين',
    actionRoute: `/admin/hackathon/${hackathonId}/registrations`,
  });

  return res.json({ ok: true, teamDeleted: true });
};

/**
 * POST /participants/hackathons/:id/transfer-leadership
 * Body: { newLeaderId: <PM_ID> }
 * Current leader hands the team to an accepted team member, paving the way
 * for the old leader to withdraw via the regular withdraw endpoint.
 */
export const transferTeamLeadership = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }
  const newLeaderId = Number(req.body?.newLeaderId);
  if (!Number.isInteger(newLeaderId) || newLeaderId <= 0) {
    return res.status(400).json({ error: 'newLeaderId غير صالح' });
  }
  const memberId = req.user!.memberId;
  if (newLeaderId === memberId) {
    return res.status(400).json({ error: 'أنت القائد بالفعل' });
  }

  const team = await loadTeamForLeader(memberId, hackathonId);
  if (!team) {
    return res.status(403).json({ error: 'لا تملك صلاحية نقل القيادة', reason: 'not_leader' });
  }
  if (!registrationOpen(team.H_Registration_EndDate)) {
    return res.status(400).json({ error: 'انتهى وقت التسجيل', reason: 'registration_closed' });
  }

  // The new leader must be an accepted member of the same team.
  interface MemberCheckRow extends RowDataPacket { PM_ID: number }
  const [rows] = await pool.query<MemberCheckRow[]>(
    'SELECT PM_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ? AND T_ID = ?',
    [newLeaderId, hackathonId, team.T_ID],
  );
  if (rows.length === 0) {
    return res.status(400).json({
      error: 'العضو المختار ليس عضواً مقبولاً في فريقك',
      reason: 'not_team_member',
    });
  }

  await pool.execute(
    'UPDATE team SET T_LeaderId = ? WHERE T_ID = ?',
    [newLeaderId, team.T_ID],
  );

  return res.json({ ok: true, teamId: team.T_ID, newLeaderId });
};
