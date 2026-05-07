import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';

interface HackathonRow extends RowDataPacket {
  hackathon_ID: number;
  H_title: string | null;
  H_slug: string | null;
  H_description: string | null;
  H_type: string | null;
  H_city: string | null;
  H_full_address: string | null;
  H_public_name: string | null;
  H_contact_email: string | null;
  H_visibility: string;
  H_status: string;
  H_StartDate: string | null;
  H_EndDate: string | null;
  H_Hackathon_StartDate: string | null;
  H_Registration_StartDate: string | null;
  H_Registration_EndDate: string | null;
  H_Min_Age: number | null;
  H_Team_Min: number;
  H_Team_Max: number;
  H_Target_Participants: number | null;
  H_Participation_Mode: string;
  H_Allowed_Countries: string;
  H_Branding: unknown;
  H_JudgingCriteria: string | null;
  H_Project_Description: string | null;
  H_Project_Requirements: string | null;
  H_Submission_Fields: unknown;
  H_Submission_StartDate: string | null;
  H_Submission_Deadline: string | null;
  H_Max_File_Size_MB: number;
  H_Allow_Late_Submission: number;
  H_Prize_Terms: string | null;
  H_Announcement_Date: string | null;
  H_Winners_Date: string | null;
  H_Judging_StartDate: string | null;
  H_Judging_EndDate: string | null;
  HAM_ID: number | null;
}

interface TrackRow extends RowDataPacket {
  HT_ID: number;
  hackathon_ID: number;
  HT_Name: string;
  HT_Description: string | null;
}

interface CoManagerRow extends RowDataPacket {
  HCM_ID: number;
  hackathon_ID: number;
  HCM_FullName: string;
  HCM_Email: string;
  HCM_Role: string;
  HCM_Permissions: unknown;
  HCM_InviteStatus: string;
}

interface JudgeRow extends RowDataPacket {
  HJ_ID: number;
  hackathon_ID: number;
  HJ_FullName: string;
  HJ_Email: string;
  HJ_Specialty: string | null;
  HJ_InviteStatus: string;
}

interface PrizeRow extends RowDataPacket {
  HP_ID: number;
  hackathon_ID: number;
  HP_Position: string;
  HP_Amount: string | null;
  HP_Description: string | null;
  HP_SortOrder: number;
}

interface SponsorPackageRow extends RowDataPacket {
  SP_ID: number;
  hackathon_ID: number;
  SP_Name: string;
  SP_Type: string;
  SP_Description: string | null;
  SP_Duration: string | null;
  SP_Price: string | null;
  SP_Sponsor_Offer: string | null;
  SP_Resources: string | null;
  SP_Benefits: unknown;
}

function datetimeOrNull(v: unknown): string | null {
  // datetime-local input → MySQL DATETIME format ("YYYY-MM-DD HH:MM:SS").
  if (!v || typeof v !== 'string' || !v.trim()) return null;
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s.replace('T', ' ') + ':00';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return s.replace('T', ' ');
  return s;
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function boolToInt(v: unknown): number {
  return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
}

function jsonOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

const PARTICIPATION_MODES = ['teams_only', 'individuals_and_teams', 'individuals_only'];
const ALLOWED_COUNTRIES = ['all', 'gulf', 'saudi_only', 'arab', 'custom'];
const SPONSOR_TYPES = ['financial', 'technical', 'logistic', 'hospitality', 'media', 'other'];
const CO_MANAGER_ROLES = ['manager', 'staff', 'coordinator'];

async function ensureOwner(hackathonId: number, memberId: number): Promise<boolean> {
  const [rows] = await pool.query<HackathonRow[]>(
    'SELECT HAM_ID FROM hackathon WHERE hackathon_ID = ?',
    [hackathonId]
  );
  if (rows.length === 0) return false;
  return rows[0].HAM_ID === memberId;
}

export const getPublicHackathon = async (req: Request, res: Response) => {
  const slug = typeof req.params.slug === 'string' ? req.params.slug.trim() : '';
  if (!slug) {
    return res.status(400).json({ error: 'invalid slug' });
  }

  try {
    const [rows] = await pool.query<HackathonRow[]>(
      `SELECT * FROM hackathon WHERE H_slug = ? AND H_status = 'published' LIMIT 1`,
      [slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }
    const h = rows[0];

    const [orgRows] = await pool.query<RowDataPacket[]>(
      `SELECT m.M_FName, m.M_LName, m.M_Bio, m.M_Email, op.ORG_Name
         FROM member m
         LEFT JOIN organizer_profile op ON op.M_ID = m.M_ID
        WHERE m.M_ID = ?
        LIMIT 1`,
      [h.HAM_ID]
    );
    const organizer = (orgRows as Record<string, unknown>[])[0] ?? null;

    const [tracks] = await pool.query<TrackRow[]>(
      'SELECT HT_ID, HT_Name, HT_Description FROM hackathon_track WHERE hackathon_ID = ? ORDER BY HT_ID',
      [h.hackathon_ID]
    );
    const [judges] = await pool.query<JudgeRow[]>(
      'SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty FROM hackathon_judge WHERE hackathon_ID = ? ORDER BY HJ_ID',
      [h.hackathon_ID]
    );
    const [prizes] = await pool.query<PrizeRow[]>(
      'SELECT HP_ID, HP_Position, HP_Amount, HP_Description, HP_SortOrder FROM hackathon_prize WHERE hackathon_ID = ? ORDER BY HP_SortOrder, HP_ID',
      [h.hackathon_ID]
    );
    const [sponsorPackages] = await pool.query<SponsorPackageRow[]>(
      'SELECT SP_ID, SP_Name, SP_Type, SP_Description, SP_Duration, SP_Price, SP_Sponsor_Offer, SP_Resources, SP_Benefits FROM sponsor_package WHERE hackathon_ID = ? ORDER BY SP_ID',
      [h.hackathon_ID]
    );

    return res.json({
      hackathon: h,
      organizer,
      tracks,
      judges,
      prizes,
      sponsorPackages,
    });
  } catch (err) {
    console.error('getPublicHackathon error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const listMyHackathons = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  if (req.user.role !== 'ORGANIZER') {
    return res.status(403).json({ error: 'only organizers can list their hackathons' });
  }

  try {
    const [rows] = await pool.query<HackathonRow[]>(
      `SELECT hackathon_ID, H_title, H_slug, H_description, H_status,
              H_StartDate, H_EndDate, H_city, H_visibility, H_created_at, HAM_ID
         FROM hackathon
        WHERE HAM_ID = ?
          AND H_title IS NOT NULL
          AND H_title <> ''
        ORDER BY H_created_at DESC`,
      [req.user.memberId]
    );
    return res.json({ hackathons: rows });
  } catch (err) {
    console.error('listMyHackathons error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const checkSlug = async (req: Request, res: Response) => {
  const slug = typeof req.query.slug === 'string' ? req.query.slug.trim() : '';
  const excludeId = Number(req.query.excludeId);

  if (!slug) {
    return res.status(400).json({ error: 'slug query is required' });
  }
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return res.json({ available: false, reason: 'invalid_format' });
  }

  try {
    const params: (string | number)[] = [slug];
    let sql = 'SELECT hackathon_ID FROM hackathon WHERE H_slug = ?';
    if (Number.isInteger(excludeId) && excludeId > 0) {
      sql += ' AND hackathon_ID <> ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return res.json({ available: rows.length === 0 });
  } catch (err) {
    console.error('checkSlug error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const createHackathon = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'ORGANIZER') {
    return res.status(403).json({ error: 'only organizers can create hackathons' });
  }

  const memberId = req.user.memberId;

  try {
    const [adminRows] = await pool.query<RowDataPacket[]>(
      'SELECT HAM_ID FROM hackathon_admin WHERE HAM_ID = ?',
      [memberId]
    );
    if (adminRows.length === 0) {
      return res.status(403).json({ error: 'organizer profile not initialized' });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO hackathon (H_status, H_visibility, HAM_ID) VALUES ('draft', 'public', ?)`,
      [memberId]
    );

    return res.status(201).json({ hackathon_ID: result.insertId });
  } catch (err) {
    console.error('createHackathon error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const getHackathon = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const [rows] = await pool.query<HackathonRow[]>(
      'SELECT * FROM hackathon WHERE hackathon_ID = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }

    const h = rows[0];

    if (h.H_status === 'draft') {
      if (!req.user || req.user.memberId !== h.HAM_ID) {
        return res.status(403).json({ error: 'forbidden' });
      }
    }

    const [tracks] = await pool.query<TrackRow[]>(
      'SELECT HT_ID, HT_Name, HT_Description FROM hackathon_track WHERE hackathon_ID = ? ORDER BY HT_ID',
      [id]
    );
    const [coManagers] = await pool.query<CoManagerRow[]>(
      'SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Permissions, HCM_InviteStatus FROM hackathon_co_manager WHERE hackathon_ID = ? ORDER BY HCM_ID',
      [id]
    );
    const [judges] = await pool.query<JudgeRow[]>(
      'SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty, HJ_InviteStatus FROM hackathon_judge WHERE hackathon_ID = ? ORDER BY HJ_ID',
      [id]
    );
    const [prizes] = await pool.query<PrizeRow[]>(
      'SELECT HP_ID, HP_Position, HP_Amount, HP_Description, HP_SortOrder FROM hackathon_prize WHERE hackathon_ID = ? ORDER BY HP_SortOrder, HP_ID',
      [id]
    );
    const [sponsorPackages] = await pool.query<SponsorPackageRow[]>(
      'SELECT SP_ID, SP_Name, SP_Type, SP_Description, SP_Duration, SP_Price, SP_Sponsor_Offer, SP_Resources, SP_Benefits FROM sponsor_package WHERE hackathon_ID = ? ORDER BY SP_ID',
      [id]
    );

    return res.json({
      hackathon: h,
      tracks,
      coManagers,
      judges,
      prizes,
      sponsorPackages,
    });
  } catch (err) {
    console.error('getHackathon error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const updateHackathon = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const owned = await ensureOwner(id, req.user.memberId);
  if (!owned) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const b = req.body ?? {};

  const fields: { col: string; val: unknown }[] = [];

  if ('title' in b) fields.push({ col: 'H_title', val: strOrNull(b.title) });
  if ('slug' in b) fields.push({ col: 'H_slug', val: strOrNull(b.slug) });
  if ('description' in b) fields.push({ col: 'H_description', val: strOrNull(b.description) });
  if ('type' in b) fields.push({ col: 'H_type', val: strOrNull(b.type) });
  if ('city' in b) fields.push({ col: 'H_city', val: strOrNull(b.city) });
  if ('fullAddress' in b) fields.push({ col: 'H_full_address', val: strOrNull(b.fullAddress) });
  if ('publicName' in b) fields.push({ col: 'H_public_name', val: strOrNull(b.publicName) });
  if ('contactEmail' in b) fields.push({ col: 'H_contact_email', val: strOrNull(b.contactEmail) });
  if ('visibility' in b) {
    fields.push({ col: 'H_visibility', val: b.visibility === 'private' ? 'private' : 'public' });
  }
  if ('startDate' in b) fields.push({ col: 'H_StartDate', val: datetimeOrNull(b.startDate) });
  if ('endDate' in b) fields.push({ col: 'H_EndDate', val: datetimeOrNull(b.endDate) });
  if ('hackathonStartDate' in b) {
    fields.push({ col: 'H_Hackathon_StartDate', val: datetimeOrNull(b.hackathonStartDate) });
  }

  // Section 3 — registration
  if ('registrationStart' in b) {
    fields.push({ col: 'H_Registration_StartDate', val: datetimeOrNull(b.registrationStart) });
  }
  if ('registrationEnd' in b) {
    fields.push({ col: 'H_Registration_EndDate', val: datetimeOrNull(b.registrationEnd) });
  }
  if ('minAge' in b) fields.push({ col: 'H_Min_Age', val: numOrNull(b.minAge) });
  if ('teamMin' in b) {
    const v = numOrNull(b.teamMin);
    if (v !== null) fields.push({ col: 'H_Team_Min', val: v });
  }
  if ('teamMax' in b) {
    const v = numOrNull(b.teamMax);
    if (v !== null) fields.push({ col: 'H_Team_Max', val: v });
  }
  if ('targetParticipants' in b) {
    fields.push({ col: 'H_Target_Participants', val: numOrNull(b.targetParticipants) });
  }
  if ('participationMode' in b) {
    const v = typeof b.participationMode === 'string' && PARTICIPATION_MODES.includes(b.participationMode)
      ? b.participationMode
      : null;
    if (v) fields.push({ col: 'H_Participation_Mode', val: v });
  }
  if ('allowedCountries' in b) {
    const v = typeof b.allowedCountries === 'string' && ALLOWED_COUNTRIES.includes(b.allowedCountries)
      ? b.allowedCountries
      : null;
    if (v) fields.push({ col: 'H_Allowed_Countries', val: v });
  }

  // Section 4 — branding (JSON)
  if ('branding' in b) fields.push({ col: 'H_Branding', val: jsonOrNull(b.branding) });

  // Section 5 — projects
  if ('projectDescription' in b) {
    fields.push({ col: 'H_Project_Description', val: strOrNull(b.projectDescription) });
  }
  if ('projectRequirements' in b) {
    fields.push({ col: 'H_Project_Requirements', val: strOrNull(b.projectRequirements) });
  }
  if ('submissionFields' in b) {
    fields.push({ col: 'H_Submission_Fields', val: jsonOrNull(b.submissionFields) });
  }
  if ('submissionStart' in b) {
    fields.push({ col: 'H_Submission_StartDate', val: datetimeOrNull(b.submissionStart) });
  }
  if ('submissionEnd' in b) {
    fields.push({ col: 'H_Submission_Deadline', val: datetimeOrNull(b.submissionEnd) });
  }
  if ('maxFileSizeMB' in b) {
    const v = numOrNull(b.maxFileSizeMB);
    if (v !== null) fields.push({ col: 'H_Max_File_Size_MB', val: v });
  }
  if ('allowLateSubmission' in b) {
    fields.push({ col: 'H_Allow_Late_Submission', val: boolToInt(b.allowLateSubmission) });
  }

  // Section 6 — evaluation
  if ('judgingCriteria' in b) {
    fields.push({ col: 'H_JudgingCriteria', val: strOrNull(b.judgingCriteria) });
  }

  // Section 7 — prizes (text terms)
  if ('prizeTerms' in b) fields.push({ col: 'H_Prize_Terms', val: strOrNull(b.prizeTerms) });

  // Milestones — datetime columns
  if ('announcementDate' in b) {
    fields.push({ col: 'H_Announcement_Date', val: datetimeOrNull(b.announcementDate) });
  }
  if ('winnersDate' in b) {
    fields.push({ col: 'H_Winners_Date', val: datetimeOrNull(b.winnersDate) });
  }
  if ('judgingStart' in b) {
    fields.push({ col: 'H_Judging_StartDate', val: datetimeOrNull(b.judgingStart) });
  }
  if ('judgingEnd' in b) {
    fields.push({ col: 'H_Judging_EndDate', val: datetimeOrNull(b.judgingEnd) });
  }

  if (fields.length === 0) {
    return res.json({ status: 'noop' });
  }

  const setClause = fields.map((f) => `${f.col} = ?`).join(', ');
  const values = fields.map((f) => f.val);

  try {
    if (b.slug && typeof b.slug === 'string' && b.slug.trim()) {
      const [conflict] = await pool.query<RowDataPacket[]>(
        'SELECT hackathon_ID FROM hackathon WHERE H_slug = ? AND hackathon_ID <> ?',
        [b.slug.trim(), id]
      );
      if (conflict.length > 0) {
        return res.status(409).json({ error: 'slug already in use' });
      }
    }

    await pool.query(
      `UPDATE hackathon SET ${setClause} WHERE hackathon_ID = ?`,
      [...values, id]
    );

    return res.json({ status: 'updated' });
  } catch (err) {
    console.error('updateHackathon error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const replaceTracks = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const tracks = Array.isArray(req.body?.tracks) ? req.body.tracks : null;
  if (!tracks) return res.status(400).json({ error: 'tracks must be an array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.execute('DELETE FROM hackathon_track WHERE hackathon_ID = ?', [id]);
      for (const t of tracks) {
        const name = strOrNull(t?.name);
        if (!name) continue;
        const desc = strOrNull(t?.description);
        await conn.execute(
          'INSERT INTO hackathon_track (hackathon_ID, HT_Name, HT_Description) VALUES (?, ?, ?)',
          [id, name, desc]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query<TrackRow[]>(
      'SELECT HT_ID, HT_Name, HT_Description FROM hackathon_track WHERE hackathon_ID = ? ORDER BY HT_ID',
      [id]
    );
    return res.json({ tracks: rows });
  } catch (err) {
    console.error('replaceTracks error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};

export const replaceCoManagers = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const items = Array.isArray(req.body?.coManagers) ? req.body.coManagers : null;
  if (!items) return res.status(400).json({ error: 'coManagers must be an array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.execute('DELETE FROM hackathon_co_manager WHERE hackathon_ID = ?', [id]);
      for (const m of items) {
        const fullName = strOrNull(m?.fullName);
        const email = strOrNull(m?.email);
        if (!fullName || !email) continue;
        const role = typeof m?.role === 'string' && CO_MANAGER_ROLES.includes(m.role) ? m.role : 'staff';
        const permissions = jsonOrNull(m?.permissions ?? []);
        await conn.execute(
          'INSERT INTO hackathon_co_manager (hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Permissions, HCM_InviteStatus) VALUES (?, ?, ?, ?, ?, ?)',
          [id, fullName, email, role, permissions, 'pending']
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query<CoManagerRow[]>(
      'SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Permissions, HCM_InviteStatus FROM hackathon_co_manager WHERE hackathon_ID = ? ORDER BY HCM_ID',
      [id]
    );
    return res.json({ coManagers: rows });
  } catch (err) {
    console.error('replaceCoManagers error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};

export const replaceJudges = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const items = Array.isArray(req.body?.judges) ? req.body.judges : null;
  if (!items) return res.status(400).json({ error: 'judges must be an array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.execute('DELETE FROM hackathon_judge WHERE hackathon_ID = ?', [id]);
      for (const j of items) {
        const fullName = strOrNull(j?.fullName);
        const email = strOrNull(j?.email);
        if (!fullName || !email) continue;
        const specialty = strOrNull(j?.specialty);
        await conn.execute(
          'INSERT INTO hackathon_judge (hackathon_ID, HJ_FullName, HJ_Email, HJ_Specialty, HJ_InviteStatus) VALUES (?, ?, ?, ?, ?)',
          [id, fullName, email, specialty, 'pending']
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query<JudgeRow[]>(
      'SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty, HJ_InviteStatus FROM hackathon_judge WHERE hackathon_ID = ? ORDER BY HJ_ID',
      [id]
    );
    return res.json({ judges: rows });
  } catch (err) {
    console.error('replaceJudges error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};

export const replacePrizes = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const items = Array.isArray(req.body?.prizes) ? req.body.prizes : null;
  if (!items) return res.status(400).json({ error: 'prizes must be an array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.execute('DELETE FROM hackathon_prize WHERE hackathon_ID = ?', [id]);
      let order = 1;
      for (const p of items) {
        const position = strOrNull(p?.position);
        if (!position) continue;
        const amount = strOrNull(p?.amount);
        const description = strOrNull(p?.description);
        await conn.execute(
          'INSERT INTO hackathon_prize (hackathon_ID, HP_Position, HP_Amount, HP_Description, HP_SortOrder) VALUES (?, ?, ?, ?, ?)',
          [id, position, amount, description, order++]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query<PrizeRow[]>(
      'SELECT HP_ID, HP_Position, HP_Amount, HP_Description, HP_SortOrder FROM hackathon_prize WHERE hackathon_ID = ? ORDER BY HP_SortOrder, HP_ID',
      [id]
    );
    return res.json({ prizes: rows });
  } catch (err) {
    console.error('replacePrizes error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};

export const publishHackathon = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  try {
    const [rows] = await pool.query<HackathonRow[]>(
      'SELECT * FROM hackathon WHERE hackathon_ID = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }
    const h = rows[0];

    const missing: string[] = [];

    // Section 1 — basic
    if (!h.H_title || !String(h.H_title).trim()) missing.push('basic:title');
    if (!h.H_slug || !String(h.H_slug).trim()) missing.push('basic:slug');
    if (!h.H_description || !String(h.H_description).trim()) missing.push('basic:description');
    if (!h.H_type) missing.push('basic:type');
    // City is only required when the event is not fully online
    if (h.H_type !== 'عبر الإنترنت' && !h.H_city) missing.push('basic:city');
    if (!h.H_StartDate) missing.push('basic:startDate');
    if (!h.H_EndDate) missing.push('basic:endDate');
    if (!h.H_public_name) missing.push('basic:publicName');
    if (!h.H_contact_email) missing.push('basic:contactEmail');
    if (!h.H_visibility) missing.push('basic:visibility');
    if (!h.H_Announcement_Date) missing.push('basic:announcementDate');
    if (!h.H_Hackathon_StartDate) missing.push('basic:hackathonStartDate');
    if (!h.H_Winners_Date) missing.push('basic:winnersDate');

    const [tracks] = await pool.query<TrackRow[]>(
      'SELECT HT_ID FROM hackathon_track WHERE hackathon_ID = ?',
      [id]
    );
    if (tracks.length === 0) missing.push('basic:tracks');

    // Section 2 — organizers (≥1 fully filled)
    const [orgRows] = await pool.query<CoManagerRow[]>(
      'SELECT HCM_FullName, HCM_Email, HCM_Role, HCM_Permissions FROM hackathon_co_manager WHERE hackathon_ID = ?',
      [id]
    );
    const validOrgs = orgRows.filter((o) => {
      let perms: unknown[] = [];
      try {
        const raw = o.HCM_Permissions;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) perms = parsed;
      } catch {
        perms = [];
      }
      return o.HCM_FullName && o.HCM_Email && o.HCM_Role && perms.length > 0;
    });
    if (validOrgs.length === 0) missing.push('organizers:atLeastOne');

    // Section 3 — registration
    if (!h.H_Registration_StartDate) missing.push('registration:start');
    if (!h.H_Registration_EndDate) missing.push('registration:end');
    if (h.H_Team_Min == null) missing.push('registration:teamMin');
    if (h.H_Team_Max == null) missing.push('registration:teamMax');
    if (!h.H_Target_Participants) missing.push('registration:target');
    if (!h.H_Participation_Mode) missing.push('registration:mode');
    if (!h.H_Allowed_Countries) missing.push('registration:countries');

    // Section 4 — branding (logo + banner + color)
    let branding: Record<string, unknown> = {};
    try {
      const raw = h.H_Branding;
      branding =
        typeof raw === 'string' && raw.trim() !== ''
          ? JSON.parse(raw)
          : raw && typeof raw === 'object'
            ? (raw as Record<string, unknown>)
            : {};
    } catch {
      branding = {};
    }
    const hasLogo =
      (branding.logoMode === 'upload' && !!branding.logoUploadDataUrl) ||
      (branding.logoMode === 'pattern' && !!branding.logoPattern);
    const hasBanner =
      (branding.bannerMode === 'upload' && !!branding.bannerUploadDataUrl) ||
      (branding.bannerMode === 'pattern' && !!branding.bannerPattern);
    if (!hasLogo) missing.push('branding:logo');
    if (!hasBanner) missing.push('branding:banner');
    if (!branding.colorPalette) missing.push('branding:colorPalette');

    // Section 5 — projects
    if (!h.H_Submission_StartDate) missing.push('projects:start');
    if (!h.H_Submission_Deadline) missing.push('projects:end');
    if (!h.H_Project_Description) missing.push('projects:description');
    if (!h.H_Project_Requirements) missing.push('projects:requirements');

    // Section 6 — evaluation
    if (!h.H_JudgingCriteria) missing.push('evaluation:criteria');
    if (!h.H_Judging_StartDate) missing.push('evaluation:judgingStart');
    if (!h.H_Judging_EndDate) missing.push('evaluation:judgingEnd');

    // Section 7 — prizes (≥1)
    const [prizeRows] = await pool.query<PrizeRow[]>(
      'SELECT HP_ID, HP_Position FROM hackathon_prize WHERE hackathon_ID = ? AND HP_Position IS NOT NULL AND HP_Position <> ""',
      [id]
    );
    if (prizeRows.length === 0) missing.push('prizes:atLeastOne');

    // Section 8 — sponsor packages (≥1 fully filled)
    const [spRows] = await pool.query<SponsorPackageRow[]>(
      'SELECT SP_Name, SP_Type, SP_Sponsor_Offer FROM sponsor_package WHERE hackathon_ID = ?',
      [id]
    );
    const validSp = spRows.filter(
      (s) => s.SP_Name && s.SP_Type && s.SP_Sponsor_Offer
    );
    if (validSp.length === 0) missing.push('sponsors:atLeastOne');

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'incomplete',
        missing,
        message: 'يجب إكمال جميع الأقسام قبل النشر',
      });
    }

    // Validate logical ordering of all 9 milestones, plus that every milestone
    // falls within the overall event window [H_StartDate, H_EndDate].
    const conflicts: string[] = [];
    const ts = (v: string | null | undefined): number | null => {
      if (!v || typeof v !== 'string') return null;
      const t = new Date(v.replace(' ', 'T')).getTime();
      return Number.isNaN(t) ? null : t;
    };
    const eventStart = ts(h.H_StartDate);
    const eventEnd = ts(h.H_EndDate);
    if (eventStart != null && eventEnd != null && eventEnd < eventStart) {
      conflicts.push('"تاريخ الانتهاء" يجب أن يكون بعد "تاريخ البدء"');
    }
    const chain: { label: string; value: number | null }[] = [
      { label: 'فتح التسجيل', value: ts(h.H_Registration_StartDate) },
      { label: 'إغلاق التسجيل', value: ts(h.H_Registration_EndDate) },
      { label: 'إعلان المقبولين', value: ts(h.H_Announcement_Date) },
      { label: 'بدء الهاكاثون', value: ts(h.H_Hackathon_StartDate) },
      { label: 'بدء استقبال التسليمات', value: ts(h.H_Submission_StartDate) },
      { label: 'إغلاق التسليمات', value: ts(h.H_Submission_Deadline) },
      { label: 'بدء التحكيم', value: ts(h.H_Judging_StartDate) },
      { label: 'انتهاء التحكيم', value: ts(h.H_Judging_EndDate) },
      { label: 'إعلان الفائزين', value: ts(h.H_Winners_Date) },
    ];
    // Range check first
    for (const m of chain) {
      if (m.value == null) continue;
      if (eventStart != null && m.value < eventStart) {
        conflicts.push(`"${m.label}" يجب أن يكون داخل فترة الهاكاثون (بعد تاريخ البدء)`);
      } else if (eventEnd != null && m.value > eventEnd) {
        conflicts.push(`"${m.label}" يجب أن يكون داخل فترة الهاكاثون (قبل تاريخ الانتهاء)`);
      }
    }
    // Order check
    for (let i = 1; i < chain.length; i++) {
      const cur = chain[i];
      const prev = chain[i - 1];
      if (cur.value != null && prev.value != null && cur.value < prev.value) {
        conflicts.push(`"${cur.label}" يجب أن يكون بعد "${prev.label}"`);
      }
    }
    if (conflicts.length > 0) {
      return res.status(400).json({
        error: 'date_conflict',
        conflicts,
        message: 'تواريخ غير منطقية',
      });
    }

    await pool.query('UPDATE hackathon SET H_status = ? WHERE hackathon_ID = ?', [
      'published',
      id,
    ]);

    return res.json({ status: 'published' });
  } catch (err) {
    console.error('publishHackathon error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const unpublishHackathon = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  try {
    const [rows] = await pool.query<HackathonRow[]>(
      'SELECT H_status FROM hackathon WHERE hackathon_ID = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    if (rows[0].H_status !== 'published') {
      return res.status(400).json({ error: 'not_published', message: 'الهاكاثون ليس منشوراً' });
    }
    await pool.query('UPDATE hackathon SET H_status = ? WHERE hackathon_ID = ?', ['draft', id]);
    return res.json({ status: 'draft' });
  } catch (err) {
    console.error('unpublishHackathon error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const replaceSponsorPackages = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const items = Array.isArray(req.body?.sponsorPackages) ? req.body.sponsorPackages : null;
  if (!items) return res.status(400).json({ error: 'sponsorPackages must be an array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.execute('DELETE FROM sponsor_package WHERE hackathon_ID = ?', [id]);
      for (const p of items) {
        const name = strOrNull(p?.name);
        if (!name) continue;
        const type = typeof p?.type === 'string' && SPONSOR_TYPES.includes(p.type) ? p.type : 'other';
        const description = strOrNull(p?.description);
        const duration = strOrNull(p?.duration);
        const price = numOrNull(p?.price);
        const sponsorOffer = strOrNull(p?.sponsorOffer);
        const resources = strOrNull(p?.resources);
        const benefits = jsonOrNull(p?.benefits ?? []);
        await conn.execute(
          'INSERT INTO sponsor_package (hackathon_ID, SP_Name, SP_Type, SP_Description, SP_Duration, SP_Price, SP_Sponsor_Offer, SP_Resources, SP_Benefits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, name, type, description, duration, price, sponsorOffer, resources, benefits]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query<SponsorPackageRow[]>(
      'SELECT SP_ID, SP_Name, SP_Type, SP_Description, SP_Duration, SP_Price, SP_Sponsor_Offer, SP_Resources, SP_Benefits FROM sponsor_package WHERE hackathon_ID = ? ORDER BY SP_ID',
      [id]
    );
    return res.json({ sponsorPackages: rows });
  } catch (err) {
    console.error('replaceSponsorPackages error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};
