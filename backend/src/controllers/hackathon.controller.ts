import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { randomBytes } from 'crypto';
import { pool } from '../db/pool';
import {
  isValidSection,
  isValidPermissionForSection,
  SECTION_LABELS,
  type Section,
} from '../lib/permissions';
import { sendCoManagerInviteEmail, sendRegistrationDecisionEmail } from '../lib/mail';
import { env } from '../config/env';

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
  HCM_Role: 'manager' | 'staff';
  HCM_Section: Section | null;
  HCM_ParentID: number | null;
  HCM_Permissions: unknown;
  HCM_InviteStatus: 'pending' | 'accepted' | 'declined';
  HCM_InviteToken: string | null;
  HCM_InvitedAt: string | null;
  HCM_InviteExpiresAt: string | null;
  HCM_AcceptedAt: string | null;
  M_ID: number | null;
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
const CO_MANAGER_ROLES = ['manager', 'staff'] as const;
type CoManagerRole = (typeof CO_MANAGER_ROLES)[number];

async function ensureOwner(hackathonId: number, memberId: number): Promise<boolean> {
  const [rows] = await pool.query<HackathonRow[]>(
    'SELECT HAM_ID FROM hackathon WHERE hackathon_ID = ?',
    [hackathonId]
  );
  if (rows.length === 0) return false;
  return rows[0].HAM_ID === memberId;
}

// Owner of the hackathon, OR an accepted co-manager assigned to the given section.
// Used by section-scoped endpoints (registrations, projects, etc.) so a section
// manager can do their job without needing full owner privileges.
async function ensureSectionAccess(
  hackathonId: number,
  memberId: number,
  section: Section,
): Promise<boolean> {
  if (await ensureOwner(hackathonId, memberId)) return true;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM hackathon_co_manager
       WHERE hackathon_ID = ?
         AND M_ID = ?
         AND HCM_Section = ?
         AND HCM_InviteStatus = 'accepted'
       LIMIT 1`,
    [hackathonId, memberId, section],
  );
  return rows.length > 0;
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
    // Return hackathons where the user is either:
    //  a) the creator (HAM_ID = me)  → my_role = 'owner'
    //  b) an accepted co-manager     → my_role = 'co_manager' with their section/role
    // Two-step query — H_Branding can hold a base64 banner up to ~5MB. Including it
    // in a SELECT with ORDER BY blows up MySQL's sort_buffer (256KB by default) and
    // crashes with ER_OUT_OF_SORTMEMORY. Sort the small columns first, then fetch
    // the heavy branding column by ID and merge in JS.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT h.hackathon_ID, h.H_title, h.H_slug, h.H_description, h.H_status,
              h.H_StartDate, h.H_EndDate, h.H_city, h.H_visibility, h.H_created_at, h.HAM_ID,
              CASE WHEN h.HAM_ID = ? THEN 'owner' ELSE 'co_manager' END AS my_role,
              hcm.HCM_Role AS my_co_role,
              hcm.HCM_Section AS my_section,
              hcm.HCM_Permissions AS my_permissions
         FROM hackathon h
         LEFT JOIN hackathon_co_manager hcm
           ON hcm.hackathon_ID = h.hackathon_ID
          AND hcm.M_ID = ?
          AND hcm.HCM_InviteStatus = 'accepted'
        WHERE (h.HAM_ID = ? OR hcm.HCM_ID IS NOT NULL)
        ORDER BY h.H_created_at DESC`,
      [req.user.memberId, req.user.memberId, req.user.memberId],
    );

    if (rows.length > 0) {
      const ids = rows.map((r) => r.hackathon_ID);
      const placeholders = ids.map(() => '?').join(',');
      const [brandingRows] = await pool.query<RowDataPacket[]>(
        `SELECT hackathon_ID, H_Branding FROM hackathon WHERE hackathon_ID IN (${placeholders})`,
        ids,
      );
      const brandingById = new Map<number, unknown>();
      for (const b of brandingRows) {
        brandingById.set(b.hackathon_ID, b.H_Branding);
      }
      for (const r of rows) {
        r.H_Branding = brandingById.get(r.hackathon_ID) ?? null;
      }
    }

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

    // Drafts are visible to the owner OR any accepted co-manager. Published
    // hackathons are visible to anyone authenticated.
    if (h.H_status === 'draft') {
      if (!req.user) {
        return res.status(403).json({ error: 'forbidden' });
      }
      if (req.user.memberId !== h.HAM_ID) {
        const [myRows] = await pool.query<RowDataPacket[]>(
          `SELECT HCM_ID FROM hackathon_co_manager
            WHERE hackathon_ID = ? AND M_ID = ? AND HCM_InviteStatus = 'accepted' LIMIT 1`,
          [id, req.user.memberId],
        );
        if (myRows.length === 0) {
          return res.status(403).json({ error: 'forbidden' });
        }
      }
    }

    const [tracks] = await pool.query<TrackRow[]>(
      'SELECT HT_ID, HT_Name, HT_Description FROM hackathon_track WHERE hackathon_ID = ? ORDER BY HT_ID',
      [id]
    );
    const [coManagers] = await pool.query<CoManagerRow[]>(
      `SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
              HCM_InviteStatus, HCM_InvitedAt, HCM_InviteExpiresAt, HCM_AcceptedAt, M_ID
         FROM hackathon_co_manager WHERE hackathon_ID = ? ORDER BY HCM_ID`,
      [id],
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

    // Compute the current user's access for this hackathon. The frontend uses
    // myAccess to filter management cards and disable actions per permission.
    let myAccess: {
      role: 'owner' | 'co_manager';
      coManagerRole?: 'manager' | 'staff';
      section?: Section | null;
      permissions: string[];
    } | null = null;
    if (req.user && req.user.memberId === h.HAM_ID) {
      myAccess = { role: 'owner', permissions: [] }; // owner has implicit full access
    } else if (req.user) {
      const myRow = (coManagers as CoManagerRow[]).find(
        (c) => c.M_ID === req.user!.memberId && c.HCM_InviteStatus === 'accepted',
      );
      if (myRow) {
        let perms: string[] = [];
        try {
          const raw = myRow.HCM_Permissions;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed)) perms = parsed.filter((p): p is string => typeof p === 'string');
        } catch { /* keep empty */ }
        myAccess = {
          role: 'co_manager',
          coManagerRole: myRow.HCM_Role,
          section: myRow.HCM_Section,
          permissions: perms,
        };
      }
    }

    // Light counters used by HackathonManagement to badge cards (e.g. "3 طلب جديد"
    // on the registrations card) — kept here to avoid a second roundtrip from the UI.
    const [pendingCountRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS pendingCount FROM applies_hackathon
        WHERE hackathon_ID = ? AND application_status = 'pending'`,
      [id],
    );
    const pendingRegistrations = (pendingCountRows[0] as { pendingCount: number } | undefined)?.pendingCount ?? 0;

    // Announcement metadata for the registrations page — drives the countdown
    // banner and the lock state of the "مراسلة" button.
    const announceMs = h.H_Announcement_Date ? new Date(h.H_Announcement_Date).getTime() : null;
    const notificationsUnlocked =
      announceMs !== null && Number.isFinite(announceMs) && Date.now() >= announceMs;

    return res.json({
      hackathon: h,
      tracks,
      coManagers,
      judges,
      prizes,
      sponsorPackages,
      myAccess,
      counts: { pendingRegistrations },
      notifications: {
        announcementDate: h.H_Announcement_Date,
        unlocked: notificationsUnlocked,
      },
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

// Email regex covering common cases. Strict enough to catch typos, lenient
// enough to accept valid international addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVITE_TTL_DAYS = 7;

// Opaque URL-safe token for invitation links.
function newInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

// MySQL DATETIME string (YYYY-MM-DD HH:MM:SS) for now + INVITE_TTL_DAYS days.
function inviteExpiry(): string {
  const d = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Look up hackathon title + organizer name for invite emails.
async function getHackathonInviteContext(
  hackathonId: number,
): Promise<{ title: string; organizerName: string } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT h.H_title, h.H_public_name, m.M_FName, m.M_LName
       FROM hackathon h
       JOIN member m ON m.M_ID = h.HAM_ID
      WHERE h.hackathon_ID = ? LIMIT 1`,
    [hackathonId],
  );
  if (rows.length === 0) return null;
  const r = rows[0] as { H_title: string | null; H_public_name: string | null; M_FName: string; M_LName: string };
  return {
    title: r.H_title || 'هاكاثون بدون عنوان',
    organizerName: r.H_public_name || `${r.M_FName} ${r.M_LName}`.trim() || 'منظّم الهاكاثون',
  };
}

// Fire-and-forget invite email. We don't want a failed SMTP to fail the whole
// request — the row is already saved with a token, the admin can resend later.
async function sendInviteEmailSafe(args: {
  to: string;
  inviteeName: string;
  organizerName: string;
  hackathonTitle: string;
  role: 'manager' | 'staff';
  section: Section;
  token: string;
}): Promise<void> {
  try {
    await sendCoManagerInviteEmail({
      to: args.to,
      inviteeName: args.inviteeName,
      organizerName: args.organizerName,
      hackathonTitle: args.hackathonTitle,
      roleLabel: args.role === 'manager' ? 'مدير قسم' : 'موظف',
      sectionLabel: SECTION_LABELS[args.section],
      inviteUrl: `${env.frontendUrl}/invite/${args.token}`,
      expiryDays: INVITE_TTL_DAYS,
    });
  } catch (err) {
    console.error('[invite] failed to send email to', args.to, err);
  }
}

interface CoManagerInput {
  fullName: string;
  email: string;
  role: CoManagerRole;
  section: Section;
  parentClientId?: string | null; // client-side correlation key for staff→manager link
  clientId?: string;              // optional unique key the client sends for cross-references
  permissions: string[];
}

// Extract the organizer's email so we can prevent self-invites.
async function getOrganizerEmail(hackathonId: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.M_Email FROM hackathon h
       JOIN member m ON m.M_ID = h.HAM_ID
      WHERE h.hackathon_ID = ?`,
    [hackathonId],
  );
  const r = rows[0] as { M_Email?: string } | undefined;
  return r?.M_Email ?? null;
}

export const replaceCoManagers = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const items = Array.isArray(req.body?.coManagers) ? req.body.coManagers : null;
  if (!items) return res.status(400).json({ error: 'coManagers must be an array' });

  // Stage 1 — validate every item up front. We only persist if all pass.
  const cleaned: CoManagerInput[] = [];
  const errors: string[] = [];

  const organizerEmail = await getOrganizerEmail(id);
  const seenEmails = new Set<string>();

  for (let idx = 0; idx < items.length; idx++) {
    const m = items[idx];
    const fullName = strOrNull(m?.fullName);
    const email = strOrNull(m?.email);
    if (!fullName || !email) continue; // skip empty rows, same as before

    const emailLower = email.toLowerCase();

    if (!EMAIL_RE.test(email)) {
      errors.push(`صف ${idx + 1}: صيغة الإيميل غير صحيحة (${email})`);
      continue;
    }
    if (organizerEmail && organizerEmail.toLowerCase() === emailLower) {
      errors.push(`صف ${idx + 1}: لا يمكن دعوة منشئ الهاكاثون كمنظّم مساعد`);
      continue;
    }
    if (seenEmails.has(emailLower)) {
      errors.push(`صف ${idx + 1}: الإيميل ${email} مكرّر داخل القائمة`);
      continue;
    }
    seenEmails.add(emailLower);

    const role: CoManagerRole =
      typeof m?.role === 'string' && (CO_MANAGER_ROLES as readonly string[]).includes(m.role)
        ? (m.role as CoManagerRole)
        : 'staff';

    if (!isValidSection(m?.section)) {
      errors.push(`صف ${idx + 1}: قسم غير صالح`);
      continue;
    }
    const section = m.section as Section;

    // Accept the exact permission set the admin chose for this person.
    // Filter out any invalid keys for the section.
    const supplied: unknown[] = Array.isArray(m?.permissions) ? m.permissions : [];
    const permissions = supplied.filter(
      (k: unknown): k is string =>
        typeof k === 'string' && isValidPermissionForSection(section, k),
    );

    cleaned.push({
      fullName,
      email,
      role,
      section,
      parentClientId: typeof m?.parentClientId === 'string' ? m.parentClientId : null,
      clientId: typeof m?.clientId === 'string' ? m.clientId : undefined,
      permissions,
    });
  }

  // Cross-role conflict: same email already assigned to a different role
  // (judge or participant) in this hackathon.
  if (cleaned.length > 0) {
    const emails = cleaned.map((c) => c.email);
    const placeholders = emails.map(() => '?').join(', ');

    const [judgeConflicts] = await pool.query<RowDataPacket[]>(
      `SELECT HJ_Email FROM hackathon_judge
        WHERE hackathon_ID = ? AND HJ_Email IN (${placeholders})`,
      [id, ...emails],
    );
    for (const r of judgeConflicts as { HJ_Email: string }[]) {
      errors.push(`الإيميل ${r.HJ_Email} مرتبط أصلاً بدور حكم في هذا الهاكاثون`);
    }

    const [participantConflicts] = await pool.query<RowDataPacket[]>(
      `SELECT m.M_Email FROM applies_hackathon ah
         JOIN member m ON m.M_ID = ah.PM_ID
        WHERE ah.hackathon_ID = ? AND m.M_Email IN (${placeholders})`,
      [id, ...emails],
    );
    for (const r of participantConflicts as { M_Email: string }[]) {
      errors.push(`الإيميل ${r.M_Email} مرتبط أصلاً كمشارك في هذا الهاكاثون`);
    }
  }

  // Enforce: at most one manager per section.
  const mgrCountBySection = new Map<Section, number>();
  for (const c of cleaned) {
    if (c.role !== 'manager') continue;
    mgrCountBySection.set(c.section, (mgrCountBySection.get(c.section) ?? 0) + 1);
  }
  for (const [sec, count] of mgrCountBySection) {
    if (count > 1) {
      errors.push(`قسم "${sec}" به ${count} مديرين — يُسمح بمدير واحد فقط لكل قسم`);
    }
  }
  // Enforce: every staff must have a manager in their section (in the same payload).
  const sectionsWithManager = new Set<Section>(
    cleaned.filter((c) => c.role === 'manager').map((c) => c.section),
  );
  for (const c of cleaned) {
    if (c.role === 'staff' && !sectionsWithManager.has(c.section)) {
      errors.push(`الموظف ${c.fullName} في قسم بدون مدير — أضف مديراً للقسم أولاً`);
    }
  }

  if (errors.length > 0) {
    return res.status(409).json({
      error: 'role_conflict',
      conflicts: errors,
      message: 'تعارض في الأدوار',
    });
  }

  // Stage 2 — persist. We do parent linking in a second pass after IDs are known.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.execute('DELETE FROM hackathon_co_manager WHERE hackathon_ID = ?', [id]);

      // First pass: insert managers, capture section → HCM_ID for staff auto-link.
      const sectionToManagerHCM = new Map<Section, number>();
      for (const c of cleaned) {
        if (c.role !== 'manager') continue;
        const [result] = await conn.execute<ResultSetHeader>(
          `INSERT INTO hackathon_co_manager
             (hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_Permissions,
              HCM_InviteStatus, HCM_InviteToken, HCM_InvitedAt, HCM_InviteExpiresAt)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?)`,
          [
            id,
            c.fullName,
            c.email,
            c.role,
            c.section,
            JSON.stringify(c.permissions),
            newInviteToken(),
            inviteExpiry(),
          ],
        );
        sectionToManagerHCM.set(c.section, result.insertId);
      }

      // Second pass: insert staff, auto-linking each to their section's manager.
      for (const c of cleaned) {
        if (c.role !== 'staff') continue;
        const parentId = sectionToManagerHCM.get(c.section) ?? null;
        await conn.execute(
          `INSERT INTO hackathon_co_manager
             (hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
              HCM_InviteStatus, HCM_InviteToken, HCM_InvitedAt, HCM_InviteExpiresAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?)`,
          [
            id,
            c.fullName,
            c.email,
            c.role,
            c.section,
            parentId,
            JSON.stringify(c.permissions),
            newInviteToken(),
            inviteExpiry(),
          ],
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query<CoManagerRow[]>(
      `SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
              HCM_InviteStatus, HCM_InvitedAt, HCM_InviteExpiresAt, HCM_AcceptedAt, M_ID
         FROM hackathon_co_manager WHERE hackathon_ID = ? ORDER BY HCM_ID`,
      [id],
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

// Find the existing manager (HCM_ID) for a given section. Returns null if none.
// excludeHcmId is used when updating (so a manager can keep their role).
async function findSectionManager(
  hackathonId: number,
  section: Section,
  excludeHcmId?: number,
): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT HCM_ID FROM hackathon_co_manager
      WHERE hackathon_ID = ? AND HCM_Section = ? AND HCM_Role = 'manager'${
        excludeHcmId ? ' AND HCM_ID <> ?' : ''
      }
      LIMIT 1`,
    excludeHcmId ? [hackathonId, section, excludeHcmId] : [hackathonId, section],
  );
  return rows.length > 0 ? (rows[0] as { HCM_ID: number }).HCM_ID : null;
}

// Check whether `email` already plays another role in the hackathon.
// excludeHcmId: when updating, the current row's email should not count as a conflict.
async function findRoleConflicts(
  hackathonId: number,
  email: string,
  excludeHcmId?: number,
): Promise<string[]> {
  const conflicts: string[] = [];
  const orgEmail = await getOrganizerEmail(hackathonId);
  if (orgEmail && orgEmail.toLowerCase() === email.toLowerCase()) {
    conflicts.push('لا يمكن دعوة منشئ الهاكاثون كمنظّم مساعد');
  }

  const [coRows] = await pool.query<RowDataPacket[]>(
    `SELECT HCM_ID FROM hackathon_co_manager
      WHERE hackathon_ID = ? AND LOWER(HCM_Email) = LOWER(?)${
        excludeHcmId ? ' AND HCM_ID <> ?' : ''
      }`,
    excludeHcmId ? [hackathonId, email, excludeHcmId] : [hackathonId, email],
  );
  if (coRows.length > 0) {
    conflicts.push('هذا الإيميل مضاف أصلاً كمنظّم مساعد في هذا الهاكاثون');
  }

  const [judgeRows] = await pool.query<RowDataPacket[]>(
    'SELECT HJ_ID FROM hackathon_judge WHERE hackathon_ID = ? AND LOWER(HJ_Email) = LOWER(?)',
    [hackathonId, email],
  );
  if (judgeRows.length > 0) {
    conflicts.push('هذا الإيميل مرتبط بدور حكم في هذا الهاكاثون');
  }

  const [appRows] = await pool.query<RowDataPacket[]>(
    `SELECT ah.PM_ID FROM applies_hackathon ah
       JOIN member m ON m.M_ID = ah.PM_ID
      WHERE ah.hackathon_ID = ? AND LOWER(m.M_Email) = LOWER(?)`,
    [hackathonId, email],
  );
  if (appRows.length > 0) {
    conflicts.push('هذا الإيميل مرتبط كمشارك في هذا الهاكاثون');
  }

  return conflicts;
}

// Validate an incoming co-manager payload (used by add and update endpoints).
// Returns the cleaned values OR an array of error messages.
function validateCoManagerInput(body: unknown):
  | { ok: true; data: { fullName: string; email: string; role: CoManagerRole; section: Section; parentId: number | null; permissions: string[] } }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  const fullName = strOrNull(b.fullName);
  const email = strOrNull(b.email);
  if (!fullName) errors.push('الاسم مطلوب');
  if (!email) errors.push('الإيميل مطلوب');
  if (email && !EMAIL_RE.test(email)) errors.push('صيغة الإيميل غير صحيحة');

  const role: CoManagerRole =
    typeof b.role === 'string' && (CO_MANAGER_ROLES as readonly string[]).includes(b.role)
      ? (b.role as CoManagerRole)
      : 'staff';

  if (!isValidSection(b.section)) {
    errors.push('قسم غير صالح');
  }
  const section = b.section as Section;

  let parentId: number | null = null;
  if (role === 'staff' && b.parentId != null) {
    const n = Number(b.parentId);
    parentId = Number.isInteger(n) && n > 0 ? n : null;
  }

  // Accept the permission subset the admin set, filtered to valid keys.
  let permissions: string[] = [];
  if (errors.length === 0) {
    const supplied: unknown[] = Array.isArray(b.permissions) ? b.permissions : [];
    permissions = supplied.filter(
      (k: unknown): k is string =>
        typeof k === 'string' && isValidPermissionForSection(section, k),
    );
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: { fullName: fullName!, email: email!, role, section, parentId, permissions },
  };
}

// POST /hackathons/:id/co-managers — add a single new co-manager.
export const addCoManager = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const validation = validateCoManagerInput(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: 'validation', errors: validation.errors });
  }
  const { fullName, email, role, section, parentId, permissions } = validation.data;

  const conflicts = await findRoleConflicts(id, email);
  if (conflicts.length > 0) {
    return res.status(409).json({ error: 'role_conflict', conflicts, message: 'تعارض في الأدوار' });
  }

  // Enforce one-manager-per-section rule + auto-link staff to that manager.
  let resolvedParentId: number | null = null;
  if (role === 'manager') {
    const existing = await findSectionManager(id, section);
    if (existing != null) {
      return res.status(409).json({
        error: 'duplicate_manager',
        message: 'يوجد مدير آخر لهذا القسم. لكل قسم مدير واحد فقط.',
      });
    }
  } else {
    // staff
    const sectionManager = await findSectionManager(id, section);
    if (sectionManager == null) {
      return res.status(400).json({
        error: 'no_section_manager',
        message: 'يجب إضافة مدير لهذا القسم قبل إضافة موظفين فيه.',
      });
    }
    resolvedParentId = sectionManager;
  }

  try {
    const token = newInviteToken();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO hackathon_co_manager
         (hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
          HCM_InviteStatus, HCM_InviteToken, HCM_InvitedAt, HCM_InviteExpiresAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?)`,
      [id, fullName, email, role, section, resolvedParentId, JSON.stringify(permissions), token, inviteExpiry()],
    );
    const [rows] = await pool.query<CoManagerRow[]>(
      `SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
              HCM_InviteStatus, HCM_InvitedAt, HCM_InviteExpiresAt, HCM_AcceptedAt, M_ID
         FROM hackathon_co_manager WHERE HCM_ID = ?`,
      [result.insertId],
    );

    // Send invitation email (fire-and-forget — won't block the response).
    const ctx = await getHackathonInviteContext(id);
    if (ctx) {
      void sendInviteEmailSafe({
        to: email,
        inviteeName: fullName,
        organizerName: ctx.organizerName,
        hackathonTitle: ctx.title,
        role,
        section,
        token,
      });
    }

    return res.status(201).json({ coManager: rows[0] });
  } catch (err) {
    console.error('addCoManager error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// PUT /hackathons/:id/co-managers/:hcmId — update an existing co-manager.
export const updateCoManager = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const hcmId = Number(req.params.hcmId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(hcmId) || hcmId <= 0) return res.status(400).json({ error: 'invalid hcmId' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  const [existing] = await pool.query<CoManagerRow[]>(
    'SELECT HCM_ID FROM hackathon_co_manager WHERE HCM_ID = ? AND hackathon_ID = ?',
    [hcmId, id],
  );
  if (existing.length === 0) return res.status(404).json({ error: 'not_found' });

  const validation = validateCoManagerInput(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: 'validation', errors: validation.errors });
  }
  const { fullName, email, role, section, parentId, permissions } = validation.data;

  const conflicts = await findRoleConflicts(id, email, hcmId);
  if (conflicts.length > 0) {
    return res.status(409).json({ error: 'role_conflict', conflicts, message: 'تعارض في الأدوار' });
  }

  // Same one-manager-per-section enforcement and auto-link rules as add.
  let resolvedParentId: number | null = null;
  if (role === 'manager') {
    const existing = await findSectionManager(id, section, hcmId);
    if (existing != null) {
      return res.status(409).json({
        error: 'duplicate_manager',
        message: 'يوجد مدير آخر لهذا القسم. لكل قسم مدير واحد فقط.',
      });
    }
  } else {
    const sectionManager = await findSectionManager(id, section, hcmId);
    if (sectionManager == null) {
      return res.status(400).json({
        error: 'no_section_manager',
        message: 'يجب وجود مدير لهذا القسم قبل تعيين موظفين فيه.',
      });
    }
    resolvedParentId = sectionManager;
  }

  try {
    await pool.execute(
      `UPDATE hackathon_co_manager
          SET HCM_FullName = ?, HCM_Email = ?, HCM_Role = ?, HCM_Section = ?,
              HCM_ParentID = ?, HCM_Permissions = ?
        WHERE HCM_ID = ? AND hackathon_ID = ?`,
      [fullName, email, role, section, resolvedParentId, JSON.stringify(permissions), hcmId, id],
    );

    // If we just added or replaced a manager, fix any orphan staff in the same section
    // (their HCM_ParentID may have been NULL or pointing elsewhere).
    if (role === 'manager') {
      await pool.execute(
        `UPDATE hackathon_co_manager
            SET HCM_ParentID = ?
          WHERE hackathon_ID = ? AND HCM_Section = ? AND HCM_Role = 'staff'`,
        [hcmId, id, section],
      );
    }
    const [rows] = await pool.query<CoManagerRow[]>(
      `SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
              HCM_InviteStatus, HCM_InvitedAt, HCM_InviteExpiresAt, HCM_AcceptedAt, M_ID
         FROM hackathon_co_manager WHERE HCM_ID = ?`,
      [hcmId],
    );
    return res.json({ coManager: rows[0] });
  } catch (err) {
    console.error('updateCoManager error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// DELETE /hackathons/:id/co-managers/:hcmId — remove a co-manager.
// FK ON DELETE SET NULL ensures any staff under this manager have their parent cleared.
export const removeCoManager = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const hcmId = Number(req.params.hcmId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(hcmId) || hcmId <= 0) return res.status(400).json({ error: 'invalid hcmId' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM hackathon_co_manager WHERE HCM_ID = ? AND hackathon_ID = ?',
      [hcmId, id],
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('removeCoManager error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /hackathons/:id/co-managers/:hcmId/resend-invite — regenerate token + resend email.
export const resendCoManagerInvite = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const hcmId = Number(req.params.hcmId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(hcmId) || hcmId <= 0) return res.status(400).json({ error: 'invalid hcmId' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  try {
    const [existing] = await pool.query<CoManagerRow[]>(
      `SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_InviteStatus
         FROM hackathon_co_manager
        WHERE HCM_ID = ? AND hackathon_ID = ?`,
      [hcmId, id],
    );
    if (existing.length === 0) return res.status(404).json({ error: 'not_found' });
    const row = existing[0];
    if (row.HCM_InviteStatus === 'accepted') {
      return res.status(400).json({ error: 'already_accepted', message: 'العضو قبل الدعوة بالفعل' });
    }
    if (!row.HCM_Section) {
      return res.status(400).json({ error: 'no_section', message: 'العضو ليس له قسم' });
    }

    const token = newInviteToken();
    await pool.execute(
      `UPDATE hackathon_co_manager
          SET HCM_InviteToken = ?, HCM_InvitedAt = NOW(), HCM_InviteExpiresAt = ?, HCM_InviteStatus = 'pending'
        WHERE HCM_ID = ? AND hackathon_ID = ?`,
      [token, inviteExpiry(), hcmId, id],
    );

    const ctx = await getHackathonInviteContext(id);
    if (ctx) {
      void sendInviteEmailSafe({
        to: row.HCM_Email,
        inviteeName: row.HCM_FullName,
        organizerName: ctx.organizerName,
        hackathonTitle: ctx.title,
        role: row.HCM_Role,
        section: row.HCM_Section,
        token,
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('resendCoManagerInvite error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// GET /invitations/:token — public endpoint, returns invitation details so the
// invite landing page can display "you were invited to X as Y" before login.
export const getInvitationByToken = async (req: Request, res: Response) => {
  const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';
  if (!token) return res.status(400).json({ error: 'invalid_token' });

  try {
    const [rows] = await pool.query<CoManagerRow[]>(
      `SELECT HCM_ID, hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section,
              HCM_InviteStatus, HCM_InviteExpiresAt, HCM_AcceptedAt, M_ID
         FROM hackathon_co_manager WHERE HCM_InviteToken = ? LIMIT 1`,
      [token],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
    const r = rows[0];

    const expired = r.HCM_InviteExpiresAt
      ? new Date(r.HCM_InviteExpiresAt.replace(' ', 'T')).getTime() < Date.now()
      : false;

    const ctx = await getHackathonInviteContext(r.hackathon_ID);

    return res.json({
      invitee: {
        fullName: r.HCM_FullName,
        email: r.HCM_Email,
        role: r.HCM_Role,
        section: r.HCM_Section,
      },
      hackathon: ctx,
      status: r.HCM_InviteStatus,
      expired,
      alreadyAccepted: r.HCM_InviteStatus === 'accepted',
    });
  } catch (err) {
    console.error('getInvitationByToken error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// Accept a co-manager invitation. Called from /invite/:token after the invitee
// has logged in. Requires the logged-in user's email to match the invite email
// to prevent strangers from claiming someone else's invite via leaked token.
export const acceptInvitation = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';
  if (!token) return res.status(400).json({ error: 'invalid_token' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT HCM_ID, HCM_Email, HCM_InviteStatus, HCM_InviteExpiresAt, M_ID
         FROM hackathon_co_manager WHERE HCM_InviteToken = ? LIMIT 1`,
      [token],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
    const r = rows[0] as {
      HCM_ID: number;
      HCM_Email: string;
      HCM_InviteStatus: 'pending' | 'accepted' | 'declined';
      HCM_InviteExpiresAt: string | null;
      M_ID: number | null;
    };

    if (r.HCM_InviteStatus === 'accepted' && r.M_ID === req.user.memberId) {
      return res.json({ status: 'accepted', alreadyAccepted: true });
    }
    if (r.HCM_InviteStatus !== 'pending') {
      return res.status(400).json({ error: 'invalid_status', detail: 'الدعوة غير قابلة للقبول' });
    }

    const expired = r.HCM_InviteExpiresAt
      ? new Date(r.HCM_InviteExpiresAt.replace(' ', 'T')).getTime() < Date.now()
      : false;
    if (expired) return res.status(400).json({ error: 'expired', detail: 'انتهت صلاحية الدعوة' });

    // Match by email — prevents anyone with the token URL from claiming an invite
    // addressed to someone else.
    const [memberRows] = await pool.query<RowDataPacket[]>(
      'SELECT M_Email FROM member WHERE M_ID = ? LIMIT 1',
      [req.user.memberId],
    );
    const myEmail = (memberRows[0] as { M_Email?: string } | undefined)?.M_Email ?? '';
    if (myEmail.toLowerCase() !== r.HCM_Email.toLowerCase()) {
      return res.status(403).json({
        error: 'email_mismatch',
        detail: 'هذه الدعوة موجّهة لإيميل آخر — سجّل دخول بالإيميل المدعو',
      });
    }

    await pool.execute(
      `UPDATE hackathon_co_manager
          SET M_ID = ?, HCM_InviteStatus = 'accepted', HCM_AcceptedAt = NOW()
        WHERE HCM_ID = ?`,
      [req.user.memberId, r.HCM_ID],
    );

    return res.json({ status: 'accepted' });
  } catch (err) {
    console.error('acceptInvitation error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
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

    // Section 2 — organizers (≥1 fully filled with section + at least one permission)
    const [orgRows] = await pool.query<CoManagerRow[]>(
      'SELECT HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_Permissions FROM hackathon_co_manager WHERE hackathon_ID = ?',
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
      return o.HCM_FullName && o.HCM_Email && o.HCM_Role && o.HCM_Section && perms.length > 0;
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

    // Section 8 — sponsor packages: optional. Skipped entirely if the organizer
    // didn't add any. (Partially-filled rows are filtered out by the replace endpoint
    // before they reach the DB, so anything stored here is already valid.)

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

    const wasDraft = h.H_status === 'draft';

    await pool.query('UPDATE hackathon SET H_status = ? WHERE hackathon_ID = ?', [
      'published',
      id,
    ]);

    // First-publish hook: send invite emails to all pending co-managers added during
    // the create flow. We only fire on a draft→published transition so re-publish (after
    // unpublish) doesn't spam existing invitees. Email failures are swallowed inside the
    // helper so a flaky SMTP can't roll back the publish.
    let invitesSent = 0;
    if (wasDraft) {
      const ctx = await getHackathonInviteContext(id);
      if (ctx) {
        const [pendingInvites] = await pool.query<RowDataPacket[]>(
          `SELECT HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_InviteToken
             FROM hackathon_co_manager
            WHERE hackathon_ID = ?
              AND HCM_InviteStatus = 'pending'
              AND M_ID IS NULL
              AND HCM_InviteToken IS NOT NULL`,
          [id],
        );
        for (const r of pendingInvites as Array<{
          HCM_FullName: string;
          HCM_Email: string;
          HCM_Role: 'manager' | 'staff';
          HCM_Section: Section;
          HCM_InviteToken: string;
        }>) {
          void sendInviteEmailSafe({
            to: r.HCM_Email,
            inviteeName: r.HCM_FullName,
            organizerName: ctx.organizerName,
            hackathonTitle: ctx.title,
            role: r.HCM_Role,
            section: r.HCM_Section,
            token: r.HCM_InviteToken,
          });
          invitesSent++;
        }
      }
    }

    return res.json({ status: 'published', invitesSent });
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

// Delete a hackathon and all its dependent rows. Restricted to:
//   • the owner (HAM_ID = me)
//   • drafts only (published hackathons must be unpublished first to make data
//     loss explicit and prevent surprising co-managers / sponsors / participants).
// Most child tables CASCADE on hackathon delete; the two NO ACTION ones
// (applies_hackathon, hackathon_organizer_team) are cleared explicitly inside
// the same transaction so the row goes away atomically or not at all.
export const deleteHackathon = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden' });

  try {
    const [rows] = await pool.query<HackathonRow[]>(
      'SELECT H_status FROM hackathon WHERE hackathon_ID = ?',
      [id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    if (rows[0].H_status !== 'draft') {
      return res.status(400).json({
        error: 'must_unpublish_first',
        detail: 'لا يمكن حذف هاكاثون منشور — يجب إلغاء النشر أولاً',
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Tables without ON DELETE CASCADE — clear explicitly.
      await conn.execute('DELETE FROM applies_hackathon WHERE hackathon_ID = ?', [id]);
      await conn.execute('DELETE FROM hackathon_organizer_team WHERE hackathon_ID = ?', [id]);
      // The rest (track, prize, co_manager, judge, skill, sponsor_package, team,
      // session, evaluation, certificate, team_submission) cascade automatically.
      await conn.execute('DELETE FROM hackathon WHERE hackathon_ID = ?', [id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return res.json({ status: 'deleted' });
  } catch (err) {
    console.error('deleteHackathon error:', err);
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

// ─────────────────────────────────────────────────────────────────────────────
// Registrations management (organizer reviewing participant applications)
// ─────────────────────────────────────────────────────────────────────────────

// List all registrations for a hackathon — for the organizer's "إدارة التسجيلات" page.
export const listHackathonRegistrations = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'registrations'))) {
    return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         a.PM_ID                AS id,
         CONCAT(m.M_FName, ' ', m.M_LName) AS name,
         m.M_Email              AS email,
         m.avatar_url           AS avatarUrl,
         a.participation_type   AS type,
         a.team_method          AS teamMethod,
         a.idea_title           AS ideaTitle,
         a.idea_description     AS ideaDescription,
         a.applied_at           AS registrationDate,
         a.application_status   AS status,
         a.reviewed_at          AS reviewedAt,
         a.notification_sent_at AS notificationSentAt,
         a.T_ID                 AS teamId,
         (SELECT GROUP_CONCAT(P_skills SEPARATOR '|||')
            FROM participant_skills WHERE PM_ID = a.PM_ID) AS skillsRaw,
         (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
            FROM hackathon_track WHERE hackathon_ID = a.hackathon_ID) AS trackName
         FROM applies_hackathon a
         JOIN member m ON m.M_ID = a.PM_ID
        WHERE a.hackathon_ID = ?
        ORDER BY a.applied_at DESC`,
      [id],
    );

    const items = (rows as Array<{
      id: number;
      name: string;
      email: string;
      avatarUrl: string | null;
      type: 'solo' | 'team';
      teamMethod: 'ai' | 'manual' | null;
      ideaTitle: string;
      ideaDescription: string;
      registrationDate: string;
      status: 'pending' | 'accepted' | 'rejected';
      reviewedAt: string | null;
      notificationSentAt: string | null;
      teamId: number | null;
      skillsRaw: string | null;
      trackName: string | null;
    }>).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      avatarUrl: r.avatarUrl,
      type: r.type,
      teamMethod: r.teamMethod,
      ideaTitle: r.ideaTitle,
      ideaDescription: r.ideaDescription,
      registrationDate: r.registrationDate,
      status: r.status,
      reviewedAt: r.reviewedAt,
      notificationSentAt: r.notificationSentAt,
      teamId: r.teamId,
      skills: r.skillsRaw ? r.skillsRaw.split('|||').filter(Boolean) : [],
      // Hackathon-level track. Multiple tracks (if any) joined with " · " to display.
      trackName: r.trackName ? r.trackName.split('|||').filter(Boolean).join(' · ') : null,
    }));

    return res.json({ items });
  } catch (err) {
    console.error('listHackathonRegistrations error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// Update a registration's status (accept / reject / pending). Sets reviewed_at = NOW()
// unless reverting to pending. Body: { status: 'accepted' | 'rejected' | 'pending' }.
export const updateRegistrationStatus = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const pmId = Number(req.params.pmId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid hackathon id' });
  if (!Number.isInteger(pmId) || pmId <= 0) return res.status(400).json({ error: 'invalid participant id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'registrations'))) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const status = req.body?.status;
  if (status !== 'accepted' && status !== 'rejected' && status !== 'pending') {
    return res.status(400).json({ error: 'invalid status' });
  }

  try {
    const reviewedExpr = status === 'pending' ? 'NULL' : 'NOW()';
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE applies_hackathon
          SET application_status = ?,
              reviewed_at = ${reviewedExpr}
        WHERE hackathon_ID = ? AND PM_ID = ?`,
      [status, id, pmId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'registration not found' });
    }
    return res.json({ status });
  } catch (err) {
    console.error('updateRegistrationStatus error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /hackathons/:id/registrations/notify
// Body: { pmIds: number[], decision: 'accepted' | 'rejected' }
// Sends an individual email to each PM_ID whose current application_status
// matches the decision. Skips PM_IDs that were already notified (notification_sent_at
// IS NOT NULL) — once notified, never re-notified. Each email is sent in its
// own sendMail call (no bulk CC/BCC) so recipients don't see each other.
export const notifyRegistrationDecision = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'registrations'))) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const decision = req.body?.decision;
  if (decision !== 'accepted' && decision !== 'rejected') {
    return res.status(400).json({ error: 'invalid decision' });
  }
  const rawPmIds = Array.isArray(req.body?.pmIds) ? req.body.pmIds : [];
  const pmIds = rawPmIds
    .map((x: unknown) => Number(x))
    .filter((n: number): n is number => Number.isInteger(n) && n > 0);
  if (pmIds.length === 0) {
    return res.status(400).json({ error: 'pmIds is required' });
  }

  try {
    // Resolve hackathon title + organizer name + announcement date once
    const [hackRows] = await pool.query<RowDataPacket[]>(
      `SELECT h.H_title AS title,
              h.H_Announcement_Date AS announcementDate,
              op.ORG_Name AS organizerName
         FROM hackathon h
         LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
        WHERE h.hackathon_ID = ?`,
      [id],
    );
    if (hackRows.length === 0) return res.status(404).json({ error: 'hackathon not found' });
    const hackathon = hackRows[0] as {
      title: string;
      announcementDate: Date | string | null;
      organizerName: string | null;
    };

    // Gate: cannot send notifications before the hackathon's announcement date.
    // This is the formal "إعلان النتائج" moment — emails go out only then.
    if (!hackathon.announcementDate) {
      return res.status(400).json({
        error: 'تاريخ إعلان النتائج غير محدد لهذا الهاكاثون',
        reason: 'no_announcement_date',
      });
    }
    const announceMs = new Date(hackathon.announcementDate).getTime();
    if (Number.isFinite(announceMs) && Date.now() < announceMs) {
      return res.status(400).json({
        error: 'لم يحن موعد إعلان النتائج بعد',
        reason: 'before_announcement',
        announcementDate: hackathon.announcementDate,
      });
    }

    // Find all eligible recipients: current status matches decision AND not yet notified
    const placeholders = pmIds.map(() => '?').join(',');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.PM_ID, m.M_Email AS email, m.M_FName AS firstName, m.M_LName AS lastName
         FROM applies_hackathon a
         JOIN member m ON m.M_ID = a.PM_ID
        WHERE a.hackathon_ID = ?
          AND a.PM_ID IN (${placeholders})
          AND a.application_status = ?
          AND a.notification_sent_at IS NULL`,
      [id, ...pmIds, decision],
    );

    const eligible = rows as Array<{
      PM_ID: number;
      email: string;
      firstName: string;
      lastName: string;
    }>;

    const workspaceUrl = `${env.frontendUrl}/participant/workspace?id=${id}`;
    const sent: number[] = [];
    const failed: Array<{ pmId: number; reason: string }> = [];

    for (const r of eligible) {
      try {
        await sendRegistrationDecisionEmail({
          to: r.email,
          participantName: `${r.firstName} ${r.lastName}`.trim() || r.email,
          hackathonTitle: hackathon.title,
          organizerName: hackathon.organizerName ?? '—',
          workspaceUrl,
          decision,
        });
        await pool.execute(
          `UPDATE applies_hackathon
              SET notification_sent_at = NOW()
            WHERE hackathon_ID = ? AND PM_ID = ?`,
          [id, r.PM_ID],
        );
        sent.push(r.PM_ID);
      } catch (mailErr) {
        console.error(`notifyRegistrationDecision: failed to send to ${r.email}`, mailErr);
        failed.push({
          pmId: r.PM_ID,
          reason: mailErr instanceof Error ? mailErr.message : 'send failed',
        });
      }
    }

    const skipped = pmIds.filter((p: number) => !eligible.some((e) => e.PM_ID === p));

    return res.json({
      sent,
      skipped,        // not in matching status, or already notified
      failed,         // attempted to send but mail server rejected
      sentCount: sent.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
    });
  } catch (err) {
    console.error('notifyRegistrationDecision error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};
