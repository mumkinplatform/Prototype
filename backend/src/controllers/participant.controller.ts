import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/pool';
import { hashPassword, verifyPassword } from '../lib/password';
import { UPLOADS_DIR, AVATARS_DIR } from '../middleware/upload.middleware';

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
  org: string | null;
  prizeTotal: string | null;
  tagsRaw: string | null;
  skillsRaw: string | null;
  applicantsCount: number;
  brandingRaw: string | null;
}

/** Extracts banner + logo fields from H_Branding to keep response payload small. */
function extractBranding(raw: string | null): {
  bannerMode: 'upload' | 'pattern' | null;
  bannerUploadDataUrl: string | null;
  bannerPattern: string | null;
  logoMode: 'upload' | 'pattern' | null;
  logoUploadDataUrl: string | null;
  logoPattern: string | null;
  colorPalette: string | null;
} | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object') return null;
    const b = obj as Record<string, unknown>;
    const bMode = b.bannerMode === 'upload' || b.bannerMode === 'pattern' ? b.bannerMode : null;
    const lMode = b.logoMode === 'upload' || b.logoMode === 'pattern' ? b.logoMode : null;
    return {
      bannerMode: bMode,
      bannerUploadDataUrl: bMode === 'upload' && typeof b.bannerUploadDataUrl === 'string' ? b.bannerUploadDataUrl : null,
      bannerPattern: bMode === 'pattern' && typeof b.bannerPattern === 'string' ? b.bannerPattern : null,
      logoMode: lMode,
      logoUploadDataUrl: lMode === 'upload' && typeof b.logoUploadDataUrl === 'string' ? b.logoUploadDataUrl : null,
      logoPattern: lMode === 'pattern' && typeof b.logoPattern === 'string' ? b.logoPattern : null,
      colorPalette: typeof b.colorPalette === 'string' ? b.colorPalette : null,
    };
  } catch {
    return null;
  }
}

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
       op.ORG_Name               AS org,
       (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(HP_Amount, ',', ''), ' ', '') AS DECIMAL(12,2))), 0)
          FROM hackathon_prize WHERE hackathon_ID = h.hackathon_ID) AS prizeTotal,
       (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
          FROM hackathon_track WHERE hackathon_ID = h.hackathon_ID) AS tagsRaw,
       (SELECT GROUP_CONCAT(skill_name SEPARATOR '|||')
          FROM hackathon_skill WHERE hackathon_ID = h.hackathon_ID) AS skillsRaw,
       (SELECT COUNT(*) FROM applies_hackathon WHERE hackathon_ID = h.hackathon_ID) AS applicantsCount
       FROM hackathon h
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
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
       op.ORG_Name               AS org,
       h.HAM_ID                  AS organizerId
       FROM hackathon h
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
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
    'SELECT participation_type, T_ID FROM applies_hackathon WHERE hackathon_ID = ? AND PM_ID = ?',
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

  const prizeTotal = prizeRows.reduce((sum, p) => {
    const cleaned = (p.HP_Amount ?? '').replace(/[,\s]/g, '');
    const n = Number(cleaned);
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
    hasTeam: myReg?.T_ID !== null && myReg?.T_ID !== undefined,
  });
};

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
    `SELECT H_status, H_visibility, H_Registration_EndDate
       FROM hackathon
      WHERE hackathon_ID = ?`,
    [id]
  );
  if (hackRows.length === 0) {
    return res.status(404).json({ error: 'الهاكاثون غير موجود' });
  }
  const h = hackRows[0] as { H_status: string; H_visibility: string; H_Registration_EndDate: Date | null };
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

  try {
    await pool.execute(
      `INSERT INTO applies_hackathon (PM_ID, hackathon_ID, idea_title, idea_description, participation_type)
       VALUES (?, ?, ?, ?, ?)`,
      [memberId, id, ideaTitle, ideaDescription, participationType]
    );
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'أنت مسجّل مسبقاً في هذا الهاكاثون' });
    }
    console.error('registerForHackathon error:', err);
    return res.status(500).json({ error: 'فشل تسجيل الاشتراك' });
  }

  return res.status(201).json({
    hackathonId: id,
    ideaTitle,
    ideaDescription,
    participationType,
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
       op.ORG_Name               AS org,
       a.T_ID                    AS myTeamId,
       a.participation_type      AS participationType,
       (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
          FROM hackathon_track WHERE hackathon_ID = h.hackathon_ID) AS tagsRaw
       FROM applies_hackathon a
       JOIN hackathon h ON h.hackathon_ID = a.hackathon_ID
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
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

  const memberId = req.user!.memberId;

  // 1) Find my team in this hackathon
  const [appRows] = await pool.query<RowDataPacket[]>(
    'SELECT T_ID, participation_type FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, id]
  );
  if (appRows.length === 0) {
    return res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
  }
  const myTeamId = (appRows[0] as { T_ID: number | null }).T_ID;
  const participationType = (appRows[0] as { participation_type: string }).participation_type;

  if (myTeamId === null) {
    return res.json({
      team: null,
      participationType,
    });
  }

  // 2) Fetch team info
  const [teamRows] = await pool.query<RowDataPacket[]>(
    `SELECT t.T_ID, t.T_name, t.T_LeaderId, h.H_Team_Max AS teamMax
       FROM team t
       JOIN hackathon h ON h.hackathon_ID = t.hackathon_ID
      WHERE t.T_ID = ?`,
    [myTeamId]
  );
  if (teamRows.length === 0) {
    return res.json({ team: null, participationType });
  }
  const team = teamRows[0] as { T_ID: number; T_name: string; T_LeaderId: number; teamMax: number };

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
      maxMembers: team.teamMax,
      members,
    },
    participationType,
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

  const memberId = req.user!.memberId;

  // Verify the participant is registered in this hackathon
  const [appRows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, id]
  );
  if (appRows.length === 0) {
    return res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
  }

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

  const memberId = req.user!.memberId;

  // 1) Verify participant is registered in this hackathon
  const [appRows] = await pool.query<MyApplicationRow[]>(
    'SELECT PM_ID, T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId]
  );
  if (appRows.length === 0) {
    return res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
  }
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

  const [submissionsRows] = await pool.query<CountRow[]>(
    `SELECT COUNT(DISTINCT s.Submission_ID) AS count
       FROM submission s
       JOIN participant p ON p.T_ID = s.T_ID
      WHERE p.PM_ID = ?`,
    [memberId]
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

  const memberId = req.user!.memberId;

  // Find the participant's team in this hackathon
  const [appRows] = await pool.query<MyTeamInHackRow[]>(
    'SELECT T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId]
  );
  if (appRows.length === 0) {
    return res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
  }
  const teamId = appRows[0].T_ID;

  // No team yet → return empty list
  if (teamId === null) {
    return res.json({ items: [], teamId: null });
  }

  // 1) Fetch evaluation headers for this team
  const [evRows] = await pool.query<EvaluationHeaderRow[]>(
    `SELECT
       e.E_ID         AS id,
       j.HJ_FullName  AS judgeName,
       j.HJ_Specialty AS judgeSpecialty,
       e.E_Comment    AS comment,
       e.E_EvaluatedAt AS evaluatedAt
       FROM evaluation e
       JOIN hackathon_judge j ON j.HJ_ID = e.HJ_ID
      WHERE e.T_ID = ?
      ORDER BY e.E_EvaluatedAt DESC`,
    [teamId]
  );

  if (evRows.length === 0) {
    return res.json({ items: [], teamId });
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

  const scoresByEval = new Map<number, { name: string; score: number }[]>();
  for (const r of scoreRows) {
    if (!scoresByEval.has(r.evaluationId)) scoresByEval.set(r.evaluationId, []);
    scoresByEval.get(r.evaluationId)!.push({ name: r.criterionName, score: r.score });
  }

  const items = evRows.map((r) => {
    const criteria = scoresByEval.get(r.id) ?? [];
    const total =
      criteria.length > 0
        ? Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length)
        : 0;
    return {
      id: r.id,
      judgeName: r.judgeName,
      judgeSpecialty: r.judgeSpecialty,
      comment: r.comment,
      evaluatedAt: r.evaluatedAt,
      criteria,
      totalScore: total,
      maxScore: 100,
    };
  });

  return res.json({ items, teamId });
};

// ─── Sessions ────────────────────────────────────────────────
interface SessionRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  type: 'zoom' | 'teams' | 'meet' | 'other';
  startAt: Date;
  durationMinutes: number;
  link: string | null;
}

interface ParticipationRow extends RowDataPacket {
  PM_ID: number;
}

/**
 * Returns sessions for a hackathon. Verifies the participant is registered first.
 */
export const listHackathonSessions = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;

  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  const memberId = req.user!.memberId;

  // Verify the participant is registered in this hackathon
  const [appRows] = await pool.query<ParticipationRow[]>(
    'SELECT PM_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ?',
    [memberId, hackathonId]
  );
  if (appRows.length === 0) {
    return res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
  }

  const [rows] = await pool.query<SessionRow[]>(
    `SELECT
       S_ID              AS id,
       S_Title           AS title,
       S_Description     AS description,
       S_Type            AS type,
       S_StartAt         AS startAt,
       S_DurationMinutes AS durationMinutes,
       S_Link            AS link
       FROM session
      WHERE hackathon_ID = ?
      ORDER BY S_StartAt ASC`,
    [hackathonId]
  );

  return res.json({
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      startAt: r.startAt,
      durationMinutes: r.durationMinutes,
      link: r.link,
    })),
  });
};

// ─── Certificates ────────────────────────────────────────────
interface CertificateRow extends RowDataPacket {
  id: number;
  hackathonId: number;
  hackathonTitle: string;
  title: string;
  type: 'participation' | 'win' | 'completion';
  position: string | null;
  fileUrl: string | null;
  issuedAt: Date;
}

/**
 * Returns all certificates for the current participant, joined with hackathon title.
 */
export const listMyCertificates = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const memberId = req.user!.memberId;

  const [rows] = await pool.query<CertificateRow[]>(
    `SELECT
       c.C_ID         AS id,
       c.hackathon_ID AS hackathonId,
       h.H_title      AS hackathonTitle,
       c.C_Title      AS title,
       c.C_Type       AS type,
       c.C_Position   AS position,
       c.C_FileUrl    AS fileUrl,
       c.C_IssuedAt   AS issuedAt
       FROM certificate c
       JOIN hackathon h ON h.hackathon_ID = c.hackathon_ID
      WHERE c.M_ID = ?
      ORDER BY c.C_IssuedAt DESC`,
    [memberId]
  );

  return res.json({
    items: rows.map((r) => ({
      id: r.id,
      hackathonId: r.hackathonId,
      hackathonTitle: r.hackathonTitle,
      title: r.title,
      type: r.type,
      position: r.position,
      fileUrl: r.fileUrl,
      issuedAt: r.issuedAt,
    })),
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

  return res.json({
    id: result.insertId,
    senderId: memberId,
    text,
    createdAt: new Date(),
    isMine: true,
  });
};

// ─── Submission ──────────────────────────────────────────────
interface TeamSubmissionRow extends RowDataPacket {
  TS_ID: number;
  T_ID: number;
  TS_ProjectName: string | null;
  TS_ProjectDescription: string | null;
  TS_RepoUrl: string | null;
  TS_DemoUrl: string | null;
  TS_SubmittedAt: Date | null;
}

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
  H_Submission_Fields: string | null;
  H_Project_Requirements: string | null;
  H_Submission_Deadline: Date | null;
  H_Allow_Late_Submission: number;
  H_Max_File_Size_MB: number;
}

/**
 * Resolves the participant's team in a hackathon. Returns T_ID or null on error.
 * If no team exists, responds 400 (submission requires a team).
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
    res.status(400).json({ error: 'يجب الانضمام لفريق قبل التسليم' });
    return null;
  }
  return teamId;
}

/**
 * Fetches or creates a team_submission row for the given (team, hackathon).
 */
async function getOrCreateTeamSubmission(teamId: number, hackathonId: number): Promise<TeamSubmissionRow> {
  const [rows] = await pool.query<TeamSubmissionRow[]>(
    `SELECT TS_ID, T_ID, TS_ProjectName, TS_ProjectDescription, TS_RepoUrl, TS_DemoUrl, TS_SubmittedAt
       FROM team_submission
      WHERE T_ID = ? AND hackathon_ID = ?`,
    [teamId, hackathonId]
  );
  if (rows.length > 0) return rows[0];

  await pool.query<ResultSetHeader>(
    'INSERT INTO team_submission (T_ID, hackathon_ID) VALUES (?, ?)',
    [teamId, hackathonId]
  );
  const [created] = await pool.query<TeamSubmissionRow[]>(
    `SELECT TS_ID, T_ID, TS_ProjectName, TS_ProjectDescription, TS_RepoUrl, TS_DemoUrl, TS_SubmittedAt
       FROM team_submission
      WHERE T_ID = ? AND hackathon_ID = ?`,
    [teamId, hackathonId]
  );
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

  const teamId = await requireMyTeam(req, res, hackathonId);
  if (teamId === null) return;

  const sub = await getOrCreateTeamSubmission(teamId, hackathonId);

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

  // Hackathon meta (requirements + required fields)
  const [metaRows] = await pool.query<HackathonSubmissionMetaRow[]>(
    `SELECT H_Submission_Fields, H_Project_Requirements, H_Submission_Deadline, H_Allow_Late_Submission, H_Max_File_Size_MB
       FROM hackathon WHERE hackathon_ID = ?`,
    [hackathonId]
  );
  const meta = metaRows[0];

  let submissionFields: string[] = [];
  if (meta?.H_Submission_Fields) {
    try {
      const parsed = JSON.parse(meta.H_Submission_Fields);
      if (Array.isArray(parsed)) submissionFields = parsed.filter((x) => typeof x === 'string');
    } catch {
      submissionFields = [];
    }
  }

  const requirements = meta?.H_Project_Requirements
    ? meta.H_Project_Requirements.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  return res.json({
    submissionId: sub.TS_ID,
    projectName: sub.TS_ProjectName,
    projectDescription: sub.TS_ProjectDescription,
    repoUrl: sub.TS_RepoUrl,
    demoUrl: sub.TS_DemoUrl,
    submittedAt: sub.TS_SubmittedAt,
    submissionDeadline: meta?.H_Submission_Deadline ?? null,
    allowLateSubmission: meta?.H_Allow_Late_Submission === 1,
    maxFileSizeMb: meta?.H_Max_File_Size_MB ?? 50,
    submissionFields,
    requirements,
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

  const teamId = await requireMyTeam(req, res, hackathonId);
  if (teamId === null) return;

  const sub = await getOrCreateTeamSubmission(teamId, hackathonId);

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
    `UPDATE team_submission SET ${updates.join(', ')} WHERE TS_ID = ?`,
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

  const teamId = await requireMyTeam(req, res, hackathonId);
  if (teamId === null) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return;
  }

  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم إرفاق ملف' });
  }

  const sub = await getOrCreateTeamSubmission(teamId, hackathonId);

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

  const teamId = await requireMyTeam(req, res, hackathonId);
  if (teamId === null) return;

  // Verify the file belongs to this team's submission
  interface FileOwnerRow extends RowDataPacket { storedName: string; }
  const [rows] = await pool.query<FileOwnerRow[]>(
    `SELECT f.SF_StoredName AS storedName
       FROM submission_file f
       JOIN team_submission ts ON ts.TS_ID = f.TS_ID
      WHERE f.SF_ID = ? AND ts.T_ID = ? AND ts.hackathon_ID = ?`,
    [fileId, teamId, hackathonId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'الملف غير موجود' });
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
export const confirmSubmission = async (req: Request, res: Response) => {
  if (!ensureParticipant(req, res)) return;
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  const teamId = await requireMyTeam(req, res, hackathonId);
  if (teamId === null) return;

  const sub = await getOrCreateTeamSubmission(teamId, hackathonId);

  await pool.query(
    'UPDATE team_submission SET TS_SubmittedAt = CURRENT_TIMESTAMP WHERE TS_ID = ?',
    [sub.TS_ID]
  );

  return res.json({ ok: true, submittedAt: new Date() });
};
