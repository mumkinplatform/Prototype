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
import {
  sendCoManagerInviteEmail,
  sendRegistrationDecisionEmail,
  sendJudgeInviteEmail,
  sendJudgeAssignmentEmail,
} from '../lib/mail';
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
  M_ID: number | null;
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

// Stricter than `ensureSectionAccess`: requires the user to be the section's
// MANAGER (HCM_Role='manager'), not just any staff with access. Used for
// operations that change shared hackathon-wide state (dates, deadlines, etc.)
// where staff-level access wouldn't be appropriate.
async function ensureSectionManagerAccess(
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
         AND HCM_Role = 'manager'
         AND HCM_InviteStatus = 'accepted'
       LIMIT 1`,
    [hackathonId, memberId, section],
  );
  return rows.length > 0;
}

// Read-only access to the projects/evaluation section. Like ensureSectionAccess('projects')
// but ALSO allows accepted judges since they need to view criteria + their assignments
// to do their evaluations. Mutations (criteria edit, judge management, distribution)
// still use the stricter ensureSectionAccess('projects') check.
async function ensureProjectsReadAccess(
  hackathonId: number,
  memberId: number,
): Promise<boolean> {
  if (await ensureSectionAccess(hackathonId, memberId, 'projects')) return true;
  const [judgeRows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM hackathon_judge
       WHERE hackathon_ID = ?
         AND M_ID = ?
         AND HJ_InviteStatus = 'accepted'
       LIMIT 1`,
    [hackathonId, memberId],
  );
  return judgeRows.length > 0;
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
    return res.status(403).json({ error: 'not_organizer', message: 'هذه الصفحة متاحة للمنظمين فقط' });
  }

  try {
    // Return hackathons where the user is either:
    //  a) the creator (HAM_ID = me)        → my_role = 'owner'
    //  b) an accepted co-manager           → my_role = 'co_manager' with section/role
    //  c) an accepted judge                → my_role = 'judge' (read-only access to
    //                                        the projects section for evaluation)
    // Two-step query — H_Branding can hold a base64 banner up to ~5MB. Including it
    // in a SELECT with ORDER BY blows up MySQL's sort_buffer (256KB by default) and
    // crashes with ER_OUT_OF_SORTMEMORY. Sort the small columns first, then fetch
    // the heavy branding column by ID and merge in JS.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT h.hackathon_ID, h.H_title, h.H_slug, h.H_description, h.H_status, h.H_type,
              h.H_StartDate, h.H_EndDate, h.H_city, h.H_visibility, h.H_created_at, h.HAM_ID,
              CASE
                WHEN h.HAM_ID = ? THEN 'owner'
                WHEN hcm.HCM_ID IS NOT NULL THEN 'co_manager'
                WHEN hj.HJ_ID IS NOT NULL THEN 'judge'
              END AS my_role,
              hcm.HCM_Role AS my_co_role,
              hcm.HCM_Section AS my_section,
              hcm.HCM_Permissions AS my_permissions,
              hj.HJ_ID AS my_judge_id
         FROM hackathon h
         LEFT JOIN hackathon_co_manager hcm
           ON hcm.hackathon_ID = h.hackathon_ID
          AND hcm.M_ID = ?
          AND hcm.HCM_InviteStatus = 'accepted'
         LEFT JOIN hackathon_judge hj
           ON hj.hackathon_ID = h.hackathon_ID
          AND hj.M_ID = ?
          AND hj.HJ_InviteStatus = 'accepted'
        WHERE (h.HAM_ID = ? OR hcm.HCM_ID IS NOT NULL OR hj.HJ_ID IS NOT NULL)
        ORDER BY h.H_created_at DESC`,
      [
        req.user.memberId,
        req.user.memberId,
        req.user.memberId,
        req.user.memberId,
      ],
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
    return res.status(403).json({ error: 'not_organizer', message: 'فقط المنظمون يقدرون ينشئون هاكاثون' });
  }

  const memberId = req.user.memberId;

  try {
    const [adminRows] = await pool.query<RowDataPacket[]>(
      'SELECT HAM_ID FROM hackathon_admin WHERE HAM_ID = ?',
      [memberId]
    );
    if (adminRows.length === 0) {
      return res.status(403).json({ error: 'organizer_profile_missing', message: 'ملف المنظم غير مفعّل، راجع الإدارة' });
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
        return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
      }
      if (req.user.memberId !== h.HAM_ID) {
        const [myRows] = await pool.query<RowDataPacket[]>(
          `SELECT HCM_ID FROM hackathon_co_manager
            WHERE hackathon_ID = ? AND M_ID = ? AND HCM_InviteStatus = 'accepted' LIMIT 1`,
          [id, req.user.memberId],
        );
        if (myRows.length === 0) {
          return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
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
      'SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty, HJ_InviteStatus, M_ID FROM hackathon_judge WHERE hackathon_ID = ? ORDER BY HJ_ID',
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
    //
    // Three role tiers, in priority order:
    //   1) owner    → full access (creator of the hackathon)
    //   2) co_manager → section-scoped access (manager/staff per section)
    //   3) judge    → restricted to the projects/evaluation flow only
    let myAccess: {
      role: 'owner' | 'co_manager' | 'judge';
      coManagerRole?: 'manager' | 'staff';
      section?: Section | null;
      permissions: string[];
      judgeId?: number;
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
      } else {
        // Not the owner and not a co-manager — is this user a judge in this hackathon?
        // Judges only get access to the projects section, with a restricted view.
        const myJudgeRow = (judges as JudgeRow[]).find(
          (j) => j.M_ID === req.user!.memberId && j.HJ_InviteStatus === 'accepted',
        );
        if (myJudgeRow) {
          myAccess = {
            role: 'judge',
            judgeId: myJudgeRow.HJ_ID,
            permissions: [],
          };
        }
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

    // نفس فكرة عدّاد التسجيلات لكن للرعايات — يدفع الباج "X طلب رعاية جديد"
    // على كرت "الرعاة والمفاوضات" في إدارة الهاكاثون.
    const [pendingSponsorRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS pendingCount
         FROM sponsor_application sa
         JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
        WHERE sp.hackathon_ID = ? AND sa.SA_Status = 'pending'`,
      [id],
    );
    const pendingSponsorApplications =
      (pendingSponsorRows[0] as { pendingCount: number } | undefined)?.pendingCount ?? 0;

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
      counts: { pendingRegistrations, pendingSponsorApplications },
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

  // Three tiers of write access on this endpoint:
  //   1) owner            → may update any field
  //   2) projects manager → may update submission + judging dates only
  //   3) registrations    → may update registration + announcement dates only
  // Anyone else gets 403. We compute the allowed-field whitelist based on the
  // caller's role so the date-edit modals on the section pages work without
  // exposing the rest of the hackathon to unauthorized edits.
  const isOwner = await ensureOwner(id, req.user.memberId);
  // Use the MANAGER-only check: staff have read/work access on their section
  // but date changes are a manager-level decision (deadlines affect everyone).
  const canEditProjectsSection = !isOwner
    && (await ensureSectionManagerAccess(id, req.user.memberId, 'projects'));
  const canEditRegistrationsSection = !isOwner && !canEditProjectsSection
    && (await ensureSectionManagerAccess(id, req.user.memberId, 'registrations'));
  if (!isOwner && !canEditProjectsSection && !canEditRegistrationsSection) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتعديل بيانات الهاكاثون' });
  }

  // Per-section field whitelists. The keys match the request body fields the
  // section managers actually send from their date-edit modals.
  const PROJECTS_FIELDS = new Set(['submissionStart', 'submissionEnd', 'judgingStart', 'judgingEnd']);
  const REGISTRATIONS_FIELDS = new Set(['registrationStart', 'registrationEnd', 'announcementDate']);

  const b = req.body ?? {};

  // Reject the request early if a co-manager tries to touch fields outside
  // their section. Cleaner than silently dropping them.
  if (!isOwner) {
    const allowed = canEditProjectsSection ? PROJECTS_FIELDS : REGISTRATIONS_FIELDS;
    const submitted = Object.keys(b);
    const disallowed = submitted.filter((k) => !allowed.has(k));
    if (disallowed.length > 0) {
      return res.status(403).json({
        error: 'forbidden',
        message: `ليس لديك صلاحية لتعديل: ${disallowed.join(', ')}`,
      });
    }
  }

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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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

  // Look up every co-manager already accepted (i.e. anyone who clicked their
  // invite link and confirmed). Those rows are SACRED — we never delete or
  // overwrite them in this endpoint, even if the organizer drops them from
  // the form. The dedicated DELETE endpoint handles intentional removal.
  // This protects against the "re-save after unpublish wipes accepted invites"
  // regression we saw earlier.
  const [acceptedRows] = await pool.query<RowDataPacket[]>(
    `SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section
       FROM hackathon_co_manager
      WHERE hackathon_ID = ? AND HCM_InviteStatus = 'accepted'`,
    [id],
  );
  const acceptedEmails = new Set(
    (acceptedRows as Array<{ HCM_Email: string }>).map((r) => r.HCM_Email.toLowerCase()),
  );

  // Snapshot the existing pending rows' "email-sent-at" stamps so we can
  // restore them after the delete-and-reinsert. Without this snapshot,
  // re-saving the draft resets EmailSentAt to NULL and the next publish
  // re-emails users who were already notified.
  const [pendingSnapshotRows] = await pool.query<RowDataPacket[]>(
    `SELECT HCM_Email, HCM_InviteEmailSentAt
       FROM hackathon_co_manager
      WHERE hackathon_ID = ?
        AND HCM_InviteStatus IN ('pending', 'declined')
        AND HCM_InviteEmailSentAt IS NOT NULL`,
    [id],
  );
  const previouslyEmailedAt = new Map<string, Date>();
  for (const r of pendingSnapshotRows as Array<{ HCM_Email: string; HCM_InviteEmailSentAt: Date }>) {
    previouslyEmailedAt.set(r.HCM_Email.toLowerCase(), r.HCM_InviteEmailSentAt);
  }

  // Filter `cleaned` so we don't re-insert anyone who is already accepted —
  // they stay in DB untouched.
  const toUpsert = cleaned.filter((c) => !acceptedEmails.has(c.email.toLowerCase()));

  // Cross-role conflict: same email already assigned to a different role
  // (judge or participant) in this hackathon. Only relevant for new/pending
  // rows being upserted now.
  if (toUpsert.length > 0) {
    const emails = toUpsert.map((c) => c.email);
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

  // Manager-per-section rule: count BOTH accepted managers (preserved in DB)
  // and incoming managers from the form. Two managers for one section is
  // always rejected regardless of which payload they came in on.
  const acceptedManagersBySection = new Map<Section, number>();
  for (const r of acceptedRows as Array<{ HCM_Role: 'manager' | 'staff'; HCM_Section: Section | null }>) {
    if (r.HCM_Role !== 'manager' || !r.HCM_Section) continue;
    acceptedManagersBySection.set(
      r.HCM_Section,
      (acceptedManagersBySection.get(r.HCM_Section) ?? 0) + 1,
    );
  }
  const mgrCountBySection = new Map<Section, number>(acceptedManagersBySection);
  for (const c of toUpsert) {
    if (c.role !== 'manager') continue;
    mgrCountBySection.set(c.section, (mgrCountBySection.get(c.section) ?? 0) + 1);
  }
  for (const [sec, count] of mgrCountBySection) {
    if (count > 1) {
      errors.push(`قسم "${sec}" به ${count} مديرين — يُسمح بمدير واحد فقط لكل قسم`);
    }
  }
  // Every staff must have a manager in their section — accepted managers
  // count toward this since they're still active in the hackathon.
  const sectionsWithManager = new Set<Section>([
    ...acceptedManagersBySection.keys(),
    ...toUpsert.filter((c) => c.role === 'manager').map((c) => c.section),
  ]);
  for (const c of toUpsert) {
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

  // Stage 2 — persist. We replace only the pending/declined slice, so
  // accepted rows survive. Parent linking is computed in a second pass after
  // IDs of the new managers are known.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      await conn.execute(
        `DELETE FROM hackathon_co_manager
          WHERE hackathon_ID = ? AND HCM_InviteStatus <> 'accepted'`,
        [id],
      );

      // Build section → manager HCM_ID map. Seed it from accepted managers
      // already in DB so staff (new or accepted) can still link to them.
      const sectionToManagerHCM = new Map<Section, number>();
      for (const r of acceptedRows as Array<{ HCM_ID: number; HCM_Role: 'manager' | 'staff'; HCM_Section: Section | null }>) {
        if (r.HCM_Role === 'manager' && r.HCM_Section) {
          sectionToManagerHCM.set(r.HCM_Section, r.HCM_ID);
        }
      }

      // First pass: insert managers from the form. Their IDs replace/extend
      // the section→manager map. We carry forward HCM_InviteEmailSentAt from
      // the snapshot so users that were already emailed in a previous publish
      // don't get re-emailed on the next one.
      for (const c of toUpsert) {
        if (c.role !== 'manager') continue;
        const prevSent = previouslyEmailedAt.get(c.email.toLowerCase()) ?? null;
        const [result] = await conn.execute<ResultSetHeader>(
          `INSERT INTO hackathon_co_manager
             (hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_Permissions,
              HCM_InviteStatus, HCM_InviteToken, HCM_InvitedAt, HCM_InviteExpiresAt, HCM_InviteEmailSentAt)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?, ?)`,
          [
            id,
            c.fullName,
            c.email,
            c.role,
            c.section,
            JSON.stringify(c.permissions),
            newInviteToken(),
            inviteExpiry(),
            prevSent,
          ],
        );
        sectionToManagerHCM.set(c.section, result.insertId);
      }

      // Second pass: insert staff, auto-linking each to their section's manager.
      for (const c of toUpsert) {
        if (c.role !== 'staff') continue;
        const parentId = sectionToManagerHCM.get(c.section) ?? null;
        const prevSent = previouslyEmailedAt.get(c.email.toLowerCase()) ?? null;
        await conn.execute(
          `INSERT INTO hackathon_co_manager
             (hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
              HCM_InviteStatus, HCM_InviteToken, HCM_InvitedAt, HCM_InviteExpiresAt, HCM_InviteEmailSentAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?, ?)`,
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
            prevSent,
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
    conflicts.push('هذا الإيميل مضاف في الهاكاثون كمنشئ الهاكاثون');
  }

  // Look up the real role for this email so the conflict message can name it
  // (مدير / موظف / حكم / مشارك) instead of a generic label.
  const [coRows] = await pool.query<RowDataPacket[]>(
    `SELECT HCM_ID, HCM_Role FROM hackathon_co_manager
      WHERE hackathon_ID = ? AND LOWER(HCM_Email) = LOWER(?)${
        excludeHcmId ? ' AND HCM_ID <> ?' : ''
      }`,
    excludeHcmId ? [hackathonId, email, excludeHcmId] : [hackathonId, email],
  );
  if (coRows.length > 0) {
    const r = coRows[0] as { HCM_Role: 'manager' | 'staff' };
    const roleLabel = r.HCM_Role === 'manager' ? 'مدير' : 'موظف';
    conflicts.push(`هذا الإيميل مضاف في الهاكاثون كـ${roleLabel}`);
  }

  const [judgeRows] = await pool.query<RowDataPacket[]>(
    'SELECT HJ_ID FROM hackathon_judge WHERE hackathon_ID = ? AND LOWER(HJ_Email) = LOWER(?)',
    [hackathonId, email],
  );
  if (judgeRows.length > 0) {
    conflicts.push('هذا الإيميل مضاف في الهاكاثون كحكم');
  }

  const [appRows] = await pool.query<RowDataPacket[]>(
    `SELECT ah.PM_ID FROM applies_hackathon ah
       JOIN member m ON m.M_ID = ah.PM_ID
      WHERE ah.hackathon_ID = ? AND LOWER(m.M_Email) = LOWER(?)`,
    [hackathonId, email],
  );
  if (appRows.length > 0) {
    conflicts.push('هذا الإيميل مضاف في الهاكاثون كمشارك');
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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
    // Stamp HCM_InviteEmailSentAt up front since we send the email below.
    // Prevents duplicate emails if the hackathon is later republished.
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO hackathon_co_manager
         (hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_ParentID, HCM_Permissions,
          HCM_InviteStatus, HCM_InviteToken, HCM_InvitedAt, HCM_InviteExpiresAt, HCM_InviteEmailSentAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?, NOW())`,
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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
    // Explicit resend always sends an email AND stamps the sent-at column so
    // the publish-hook query treats this user as "already notified".
    await pool.execute(
      `UPDATE hackathon_co_manager
          SET HCM_InviteToken = ?, HCM_InvitedAt = NOW(), HCM_InviteExpiresAt = ?,
              HCM_InviteStatus = 'pending', HCM_InviteEmailSentAt = NOW()
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
    // Check co-manager invites first (the primary invite system).
    const [rows] = await pool.query<CoManagerRow[]>(
      `SELECT HCM_ID, hackathon_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section,
              HCM_InviteStatus, HCM_InviteExpiresAt, HCM_AcceptedAt, M_ID
         FROM hackathon_co_manager WHERE HCM_InviteToken = ? LIMIT 1`,
      [token],
    );
    if (rows.length > 0) {
      const r = rows[0];
      const expired = r.HCM_InviteExpiresAt
        ? new Date(r.HCM_InviteExpiresAt.replace(' ', 'T')).getTime() < Date.now()
        : false;
      const ctx = await getHackathonInviteContext(r.hackathon_ID);
      return res.json({
        kind: 'co_manager',
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
    }

    // Not a co-manager token — try the judge invite system. Judges have their
    // own table since evaluation FK references HJ_ID, but the invite UX is the
    // same (same /invite/:token URL, same accept flow).
    const [judgeRows] = await pool.query<JudgeManageRow[]>(
      `SELECT HJ_ID, hackathon_ID, HJ_FullName, HJ_Email, HJ_Specialty,
              HJ_InviteStatus, HJ_InviteExpiresAt, HJ_AcceptedAt, M_ID
         FROM hackathon_judge WHERE HJ_InviteToken = ? LIMIT 1`,
      [token],
    );
    if (judgeRows.length > 0) {
      const j = judgeRows[0] as JudgeManageRow & { hackathon_ID: number };
      const expired = j.HJ_InviteExpiresAt
        ? new Date(String(j.HJ_InviteExpiresAt).replace(' ', 'T')).getTime() < Date.now()
        : false;
      const ctx = await getHackathonInviteContext(j.hackathon_ID);
      return res.json({
        kind: 'judge',
        invitee: {
          fullName: j.HJ_FullName,
          email: j.HJ_Email,
          role: 'judge',
          specialty: j.HJ_Specialty,
        },
        hackathon: ctx,
        status: j.HJ_InviteStatus,
        expired,
        alreadyAccepted: j.HJ_InviteStatus === 'accepted',
      });
    }

    return res.status(404).json({ error: 'not_found' });
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
    // Look up the logged-in user's email once — used for the email-match check
    // on whichever invite type we find.
    const [memberRows] = await pool.query<RowDataPacket[]>(
      'SELECT M_Email FROM member WHERE M_ID = ? LIMIT 1',
      [req.user.memberId],
    );
    const myEmail = (memberRows[0] as { M_Email?: string } | undefined)?.M_Email ?? '';

    // Branch 1: co-manager invite.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT HCM_ID, HCM_Email, HCM_InviteStatus, HCM_InviteExpiresAt, M_ID
         FROM hackathon_co_manager WHERE HCM_InviteToken = ? LIMIT 1`,
      [token],
    );
    if (rows.length > 0) {
      const r = rows[0] as {
        HCM_ID: number;
        HCM_Email: string;
        HCM_InviteStatus: 'pending' | 'accepted' | 'declined';
        HCM_InviteExpiresAt: string | null;
        M_ID: number | null;
      };

      if (r.HCM_InviteStatus === 'accepted' && r.M_ID === req.user.memberId) {
        return res.json({ kind: 'co_manager', status: 'accepted', alreadyAccepted: true });
      }
      if (r.HCM_InviteStatus !== 'pending') {
        return res.status(400).json({ error: 'invalid_status', detail: 'الدعوة غير قابلة للقبول' });
      }
      const expired = r.HCM_InviteExpiresAt
        ? new Date(r.HCM_InviteExpiresAt.replace(' ', 'T')).getTime() < Date.now()
        : false;
      if (expired) return res.status(400).json({ error: 'expired', detail: 'انتهت صلاحية الدعوة' });
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
      return res.json({ kind: 'co_manager', status: 'accepted' });
    }

    // Branch 2: judge invite (separate table, same accept semantics).
    const [judgeRows] = await pool.query<RowDataPacket[]>(
      `SELECT HJ_ID, HJ_Email, HJ_InviteStatus, HJ_InviteExpiresAt, M_ID
         FROM hackathon_judge WHERE HJ_InviteToken = ? LIMIT 1`,
      [token],
    );
    if (judgeRows.length > 0) {
      const j = judgeRows[0] as {
        HJ_ID: number;
        HJ_Email: string;
        HJ_InviteStatus: 'pending' | 'accepted' | 'declined';
        HJ_InviteExpiresAt: string | null;
        M_ID: number | null;
      };

      if (j.HJ_InviteStatus === 'accepted' && j.M_ID === req.user.memberId) {
        return res.json({ kind: 'judge', status: 'accepted', alreadyAccepted: true });
      }
      if (j.HJ_InviteStatus !== 'pending') {
        return res.status(400).json({ error: 'invalid_status', detail: 'الدعوة غير قابلة للقبول' });
      }
      const expired = j.HJ_InviteExpiresAt
        ? new Date(String(j.HJ_InviteExpiresAt).replace(' ', 'T')).getTime() < Date.now()
        : false;
      if (expired) return res.status(400).json({ error: 'expired', detail: 'انتهت صلاحية الدعوة' });
      if (myEmail.toLowerCase() !== j.HJ_Email.toLowerCase()) {
        return res.status(403).json({
          error: 'email_mismatch',
          detail: 'هذه الدعوة موجّهة لإيميل آخر — سجّل دخول بالإيميل المدعو',
        });
      }
      await pool.execute(
        `UPDATE hackathon_judge
            SET M_ID = ?, HJ_InviteStatus = 'accepted', HJ_AcceptedAt = NOW()
          WHERE HJ_ID = ?`,
        [req.user.memberId, j.HJ_ID],
      );
      return res.json({ kind: 'judge', status: 'accepted' });
    }

    return res.status(404).json({ error: 'not_found' });
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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

  const items = Array.isArray(req.body?.judges) ? req.body.judges : null;
  if (!items) return res.status(400).json({ error: 'judges must be an array' });

  // Preserve any judge who has already accepted their invitation. Same
  // protection as replaceCoManagers: re-saving the draft after unpublish
  // must not wipe accepted users back to pending.
  const [acceptedJudgeRows] = await pool.query<RowDataPacket[]>(
    `SELECT HJ_Email FROM hackathon_judge
      WHERE hackathon_ID = ? AND HJ_InviteStatus = 'accepted'`,
    [id],
  );
  const acceptedJudgeEmails = new Set(
    (acceptedJudgeRows as Array<{ HJ_Email: string }>).map((r) => r.HJ_Email.toLowerCase()),
  );

  // Snapshot the existing pending rows' email-sent-at stamps so re-saving
  // the draft doesn't reset them back to NULL (which would cause publish to
  // re-email those judges).
  const [pendingJudgeSnapshot] = await pool.query<RowDataPacket[]>(
    `SELECT HJ_Email, HJ_InviteEmailSentAt
       FROM hackathon_judge
      WHERE hackathon_ID = ?
        AND HJ_InviteStatus IN ('pending', 'declined')
        AND HJ_InviteEmailSentAt IS NOT NULL`,
    [id],
  );
  const judgePreviouslyEmailedAt = new Map<string, Date>();
  for (const r of pendingJudgeSnapshot as Array<{ HJ_Email: string; HJ_InviteEmailSentAt: Date }>) {
    judgePreviouslyEmailedAt.set(r.HJ_Email.toLowerCase(), r.HJ_InviteEmailSentAt);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      // Delete only pending/declined rows. Accepted judges survive.
      await conn.execute(
        `DELETE FROM hackathon_judge
          WHERE hackathon_ID = ? AND HJ_InviteStatus <> 'accepted'`,
        [id],
      );
      for (const j of items) {
        const fullName = strOrNull(j?.fullName);
        const email = strOrNull(j?.email);
        if (!fullName || !email) continue;
        // Skip emails that already belong to an accepted judge — they're
        // still in DB untouched, no need to re-insert.
        if (acceptedJudgeEmails.has(email.toLowerCase())) continue;
        const specialty = strOrNull(j?.specialty);
        // Carry forward HJ_InviteEmailSentAt from the snapshot so previously-
        // emailed judges don't trigger another email on the next publish.
        const prevSent = judgePreviouslyEmailedAt.get(email.toLowerCase()) ?? null;
        await conn.execute(
          `INSERT INTO hackathon_judge
             (hackathon_ID, HJ_FullName, HJ_Email, HJ_Specialty,
              HJ_InviteStatus, HJ_InviteToken, HJ_InvitedAt, HJ_InviteExpiresAt, HJ_InviteEmailSentAt)
           VALUES (?, ?, ?, ?, 'pending', ?, NOW(), ?, ?)`,
          [id, fullName, email, specialty, newInviteToken(), inviteExpiry(), prevSent],
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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
    // Criteria now live in `hackathon_evaluation_criteria` (since migration 017).
    // The legacy `H_JudgingCriteria` text column is no longer authoritative.
    const [critCountRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM hackathon_evaluation_criteria WHERE hackathon_ID = ?',
      [id],
    );
    if ((critCountRows[0] as { c: number }).c === 0) {
      missing.push('evaluation:criteria');
    }
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
        // Only invite people who haven't been emailed yet. After we send the
        // mail we stamp HCM_InviteEmailSentAt / HJ_InviteEmailSentAt so a
        // later republish doesn't spam them again.
        const [pendingInvites] = await pool.query<RowDataPacket[]>(
          `SELECT HCM_ID, HCM_FullName, HCM_Email, HCM_Role, HCM_Section, HCM_InviteToken
             FROM hackathon_co_manager
            WHERE hackathon_ID = ?
              AND HCM_InviteStatus = 'pending'
              AND M_ID IS NULL
              AND HCM_InviteToken IS NOT NULL
              AND HCM_InviteEmailSentAt IS NULL`,
          [id],
        );
        for (const r of pendingInvites as Array<{
          HCM_ID: number;
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
          // Mark as sent immediately. If SMTP later fails, the safe wrapper
          // logs; the row still won't be re-emailed automatically — we
          // assume the organizer can use "resend invite" for that case.
          await pool.execute(
            'UPDATE hackathon_co_manager SET HCM_InviteEmailSentAt = NOW() WHERE HCM_ID = ?',
            [r.HCM_ID],
          );
          invitesSent++;
        }

        // Same pattern for judges.
        const [pendingJudgeInvites] = await pool.query<RowDataPacket[]>(
          `SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty, HJ_InviteToken
             FROM hackathon_judge
            WHERE hackathon_ID = ?
              AND HJ_InviteStatus = 'pending'
              AND M_ID IS NULL
              AND HJ_InviteToken IS NOT NULL
              AND HJ_InviteEmailSentAt IS NULL`,
          [id],
        );
        for (const r of pendingJudgeInvites as Array<{
          HJ_ID: number;
          HJ_FullName: string;
          HJ_Email: string;
          HJ_Specialty: string | null;
          HJ_InviteToken: string;
        }>) {
          void sendJudgeInviteEmailSafe({
            to: r.HJ_Email,
            inviteeName: r.HJ_FullName,
            organizerName: ctx.organizerName,
            hackathonTitle: ctx.title,
            specialty: r.HJ_Specialty,
            token: r.HJ_InviteToken,
          });
          await pool.execute(
            'UPDATE hackathon_judge SET HJ_InviteEmailSentAt = NOW() WHERE HJ_ID = ?',
            [r.HJ_ID],
          );
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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

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

// ============================================================
// Sponsor applications (organizer's view of incoming sponsorship requests).
// Companion to the sponsor-side endpoints in sponsor.controller.ts.
// ============================================================

// GET /hackathons/:id/sponsor-applications — list every sponsorship request
// this hackathon received. Used by HackathonSponsors.tsx to populate the
// "طلبات الرعاية" + "المحادثات" tabs and the contract panel.
export const listHackathonSponsorApplications = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         sa.SA_ID                  AS applicationId,
         sa.SA_Status              AS status,
         sa.SA_NegotiationStep     AS negotiationStep,
         sa.SA_AppliedAt           AS appliedAt,
         sa.SA_PaidAt              AS paidAt,
         sa.SA_ReceiptFile         AS receiptFile,
         sa.SA_OrganizerSigned     AS organizerSigned,
         sa.SA_OrganizerSignedAt   AS organizerSignedAt,
         sa.SA_TermValue           AS contractValue,
         sa.SM_ID                  AS sponsorMemberId,
         m.M_FName                 AS sponsorFirstName,
         m.M_LName                 AS sponsorLastName,
         m.M_Email                 AS sponsorEmail,
         m.avatar_url              AS sponsorAvatar,
         s.S_Brand                 AS sponsorBrand,
         s.S_Industry              AS sponsorIndustry,
         sa.SP_ID                  AS packageId,
         sp.SP_Name                AS packageName,
         sp.SP_Type                AS packageType,
         sp.SP_Price               AS packagePrice
         FROM sponsor_application sa
         JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
         JOIN sponsor s          ON s.SM_ID  = sa.SM_ID
         JOIN member m           ON m.M_ID   = sa.SM_ID
        WHERE sp.hackathon_ID = ?
        ORDER BY sa.SA_AppliedAt DESC`,
      [id],
    );

    const items = (rows as Array<{
      applicationId: number;
      status: 'pending' | 'accepted' | 'rejected';
      negotiationStep: number;
      appliedAt: Date;
      paidAt: Date | null;
      receiptFile: string | null;
      organizerSigned: number;
      organizerSignedAt: Date | null;
      contractValue: string | null;
      sponsorMemberId: number;
      sponsorFirstName: string;
      sponsorLastName: string;
      sponsorEmail: string;
      sponsorAvatar: string | null;
      sponsorBrand: string | null;
      sponsorIndustry: string | null;
      packageId: number;
      packageName: string;
      packageType: string;
      packagePrice: string | null;
    }>).map((r) => ({
      applicationId: r.applicationId,
      status: r.status,
      negotiationStep: r.negotiationStep,
      appliedAt: r.appliedAt,
      paidAt: r.paidAt,
      receiptFile: r.receiptFile,
      organizerSigned: r.organizerSigned === 1,
      organizerSignedAt: r.organizerSignedAt,
      contractValue: r.contractValue,
      sponsor: {
        memberId: r.sponsorMemberId,
        fullName: `${r.sponsorFirstName} ${r.sponsorLastName}`.trim(),
        email: r.sponsorEmail,
        avatar: r.sponsorAvatar,
        brand: r.sponsorBrand,
        industry: r.sponsorIndustry,
      },
      package: {
        id: r.packageId,
        name: r.packageName,
        type: r.packageType,
        price: r.packagePrice,
      },
    }));

    return res.json({ items });
  } catch (err) {
    console.error('listHackathonSponsorApplications error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /hackathons/:id/sponsor-applications/:saId/start-negotiation
// Flips SA_Status from 'pending' → 'accepted', which unlocks the next steps
// (contract review, signing) on the sponsor's side. This replaces the older
// "accept/reject" decision pattern — the organizer signals willingness to
// negotiate by hitting this single button.
export const startSponsorNegotiation = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const saId = Number(req.params.saId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(saId) || saId <= 0) return res.status(400).json({ error: 'invalid saId' });
  if (!(await ensureOwner(id, req.user.memberId))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  // Make sure the application belongs to THIS hackathon (the saId is
  // user-controlled, so we re-verify via the package's hackathon_ID).
  const [check] = await pool.query<RowDataPacket[]>(
    `SELECT sa.SA_Status FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
      WHERE sa.SA_ID = ? AND sp.hackathon_ID = ?`,
    [saId, id],
  );
  if (check.length === 0) {
    return res.status(404).json({ error: 'not_found', message: 'الطلب غير موجود في هذا الهاكاثون' });
  }
  const current = (check[0] as { SA_Status: string }).SA_Status;
  if (current === 'rejected') {
    return res.status(400).json({ error: 'rejected', message: 'هذا الطلب مرفوض ولا يمكن استئنافه' });
  }
  // Idempotent — if already accepted, just return success so the UI can flow.
  await pool.execute(
    `UPDATE sponsor_application SET SA_Status = 'accepted' WHERE SA_ID = ?`,
    [saId],
  );

  // إشعار للراعي ببدء التفاوض — مرة واحدة فقط (إذا الحالة كانت pending قبل
  // التحديث). نتجنب إشعار مكرر لو المنظم ضغط الزر ثانية لخطأ.
  if (current === 'pending') {
    interface NotifyAcceptRow extends RowDataPacket {
      SM_ID: number;
      H_title: string;
      SP_Name: string;
    }
    const [infoRows] = await pool.query<NotifyAcceptRow[]>(
      `SELECT sa.SM_ID, h.H_title, sp.SP_Name
         FROM sponsor_application sa
         JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
         JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
        WHERE sa.SA_ID = ?`,
      [saId],
    );
    if (infoRows.length > 0) {
      const info = infoRows[0];
      try {
        await pool.execute(
          `INSERT INTO notification
             (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute)
           VALUES (?, 'system', ?, ?, ?, ?)`,
          [
            info.SM_ID,
            'تم قبول طلب رعايتكم',
            `قبل المنظم طلب رعايتكم لـ "${info.H_title}" على باقة "${info.SP_Name}". ابدأ التفاوض الآن.`,
            'فتح المحادثة',
            '/sponsor/messages',
          ],
        );
      } catch (err) {
        console.error('[startSponsorNegotiation] failed to insert notification:', err);
      }
    }
  }

  return res.json({ applicationId: saId, status: 'accepted' });
};

export const replaceSponsorPackages = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureOwner(id, req.user.memberId))) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

  const items = Array.isArray(req.body?.sponsorPackages) ? req.body.sponsorPackages : null;
  if (!items) return res.status(400).json({ error: 'sponsorPackages must be an array' });

  // ⚠️ Critical: this endpoint USED to "delete-then-insert" all packages, which
  // — combined with `sponsor_application.SP_ID ON DELETE CASCADE` — silently
  // wiped every sponsor application for the hackathon whenever an organizer
  // tweaked a single package. The new implementation diffs the incoming list
  // against existing rows:
  //   - has id & matches existing → UPDATE (keeps SP_ID, so applications stay)
  //   - no id (new row)           → INSERT
  //   - existing not in incoming  → DELETE, but only if it has zero applications
  // If a removed package still has applications, we abort the whole save with
  // a clear Arabic error so the organizer knows why nothing happened.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      // 1) Snapshot existing SP_IDs for this hackathon.
      const [existingRows] = await conn.query<RowDataPacket[]>(
        'SELECT SP_ID, SP_Name FROM sponsor_package WHERE hackathon_ID = ?',
        [id],
      );
      const existingMap = new Map<number, string>();
      for (const r of existingRows as { SP_ID: number; SP_Name: string }[]) {
        existingMap.set(r.SP_ID, r.SP_Name);
      }

      // 2) Build the set of incoming SP_IDs (only items that carry one).
      const incomingIds = new Set<number>();
      for (const p of items) {
        const pid = Number(p?.id);
        if (Number.isInteger(pid) && pid > 0) incomingIds.add(pid);
      }

      // 3) Compute deletions = existing − incoming. Refuse to delete any
      //    package that still has sponsor applications, because the FK is
      //    ON DELETE CASCADE and the applications would be wiped.
      const toDelete = [...existingMap.keys()].filter((eid) => !incomingIds.has(eid));
      if (toDelete.length > 0) {
        const [appRows] = await conn.query<RowDataPacket[]>(
          `SELECT sp.SP_ID, sp.SP_Name, COUNT(sa.SA_ID) AS cnt
             FROM sponsor_package sp
             LEFT JOIN sponsor_application sa ON sa.SP_ID = sp.SP_ID
            WHERE sp.SP_ID IN (?)
         GROUP BY sp.SP_ID, sp.SP_Name
           HAVING cnt > 0`,
          [toDelete],
        );
        if ((appRows as unknown[]).length > 0) {
          await conn.rollback();
          const first = (appRows as { SP_Name: string; cnt: number }[])[0];
          return res.status(409).json({
            error: 'package_has_applications',
            message: `لا يمكن حذف باقة "${first.SP_Name}" لأن عليها ${first.cnt} طلب رعاية. عالجي الطلبات أولاً (قبول/رفض) ثم احذفي الباقة.`,
          });
        }
        await conn.query('DELETE FROM sponsor_package WHERE SP_ID IN (?)', [toDelete]);
      }

      // 4) Upsert each incoming package — UPDATE when id matches an existing
      //    row, otherwise INSERT a new one.
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

        const pid = Number(p?.id);
        if (Number.isInteger(pid) && pid > 0 && existingMap.has(pid)) {
          await conn.execute(
            `UPDATE sponsor_package
                SET SP_Name = ?, SP_Type = ?, SP_Description = ?, SP_Duration = ?,
                    SP_Price = ?, SP_Sponsor_Offer = ?, SP_Resources = ?, SP_Benefits = ?
              WHERE SP_ID = ? AND hackathon_ID = ?`,
            [name, type, description, duration, price, sponsorOffer, resources, benefits, pid, id],
          );
        } else {
          await conn.execute(
            'INSERT INTO sponsor_package (hackathon_ID, SP_Name, SP_Type, SP_Description, SP_Duration, SP_Price, SP_Sponsor_Offer, SP_Resources, SP_Benefits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, type, description, duration, price, sponsorOffer, resources, benefits],
          );
        }
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
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
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
         t.T_name                AS teamName,
         (SELECT GROUP_CONCAT(P_skills SEPARATOR '|||')
            FROM participant_skills WHERE PM_ID = a.PM_ID) AS skillsRaw,
         (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
            FROM hackathon_track WHERE hackathon_ID = a.hackathon_ID) AS trackName
         FROM applies_hackathon a
         JOIN member m ON m.M_ID = a.PM_ID
    LEFT JOIN team t   ON t.T_ID = a.T_ID
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
      teamName: string | null;
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
      teamName: r.teamName,
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
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
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
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
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

// ============================================================
// Evaluation criteria — structured (name + weight) per hackathon.
// Replaces the legacy free-text H_JudgingCriteria column.
// Section access: 'projects' (owner or accepted projects manager).
// ============================================================
export const listEvaluationCriteria = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  // Read access — judges need this to know what to score by.
  if (!(await ensureProjectsReadAccess(id, req.user.memberId))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT HEC_ID AS id, HEC_Name AS name, HEC_Description AS description,
              HEC_Weight AS weight, HEC_SortOrder AS sortOrder
         FROM hackathon_evaluation_criteria
        WHERE hackathon_ID = ?
        ORDER BY HEC_SortOrder, HEC_ID`,
      [id],
    );
    return res.json({ items: rows });
  } catch (err) {
    console.error('listEvaluationCriteria error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// Replace-all semantics: the request body's `items` becomes the complete
// criteria list for this hackathon. Validates sum-of-weights = 100% and
// each row has a non-empty name + a positive weight.
export const replaceEvaluationCriteria = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  const rawItems = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!rawItems) return res.status(400).json({ error: 'items array required' });
  if (rawItems.length === 0) return res.status(400).json({ error: 'at least one criterion required' });
  if (rawItems.length > 20) return res.status(400).json({ error: 'too many criteria (max 20)' });

  const normalized: Array<{ name: string; description: string | null; weight: number; sortOrder: number }> = [];
  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i] as { name?: unknown; description?: unknown; weight?: unknown } | null;
    if (!raw || typeof raw !== 'object') return res.status(400).json({ error: `criterion ${i + 1} invalid` });

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!name) return res.status(400).json({ error: `اسم المعيار رقم ${i + 1} مطلوب` });
    if (name.length > 150) return res.status(400).json({ error: `اسم المعيار رقم ${i + 1} طويل (الحد 150 خانة)` });

    const description = typeof raw.description === 'string' ? raw.description.trim() : '';

    const weight = Number(raw.weight);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
      return res.status(400).json({ error: `وزن المعيار رقم ${i + 1} غير صالح` });
    }

    normalized.push({
      name,
      description: description.length > 0 ? description : null,
      weight: Math.round(weight * 100) / 100,
      sortOrder: i + 1,
    });
  }

  const totalWeight = normalized.reduce((sum, r) => sum + r.weight, 0);
  // Tolerance ±0.05 to accommodate floating-point rounding from 25.00 + 25.00 + ...
  if (Math.abs(totalWeight - 100) > 0.05) {
    return res.status(400).json({
      error: `مجموع الأوزان لازم يساوي 100% (المجموع الحالي: ${totalWeight.toFixed(2)}%)`,
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM hackathon_evaluation_criteria WHERE hackathon_ID = ?', [id]);
    for (const c of normalized) {
      await conn.execute(
        `INSERT INTO hackathon_evaluation_criteria
           (hackathon_ID, HEC_Name, HEC_Description, HEC_Weight, HEC_SortOrder)
           VALUES (?, ?, ?, ?, ?)`,
        [id, c.name, c.description, c.weight, c.sortOrder],
      );
    }
    await conn.commit();
    return res.json({ items: normalized.length });
  } catch (err) {
    await conn.rollback();
    console.error('replaceEvaluationCriteria error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};

// ============================================================
// Evaluation visibility settings — controls what participants can see about
// their evaluations, and when. Persisted on the hackathon row so it survives
// re-renders and is consulted whenever a participant fetches their results.
// Section access: 'projects' (organizer-side gate).
// ============================================================

// GET /hackathons/:id/evaluation-settings
export const getEvaluationSettings = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT H_Show_Evaluations_To_Participants AS showEvaluations,
            H_Show_Evaluation_Notes            AS showNotes,
            H_Winners_Date                     AS announcementDate
       FROM hackathon WHERE hackathon_ID = ?`,
    [id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'الهاكاثون غير موجود' });
  const r = rows[0] as {
    showEvaluations: number; showNotes: number; announcementDate: Date | null;
  };
  return res.json({
    showEvaluations: r.showEvaluations === 1,
    showNotes: r.showNotes === 1,
    announcementDate: r.announcementDate,
  });
};

// PUT /hackathons/:id/evaluation-settings
// Body: { showEvaluations: boolean, showNotes: boolean, announcementDate: string | null }
export const updateEvaluationSettings = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  const showEvaluations = req.body?.showEvaluations === true;
  const showNotes = req.body?.showNotes === true;
  // Accept an ISO datetime, a YYYY-MM-DD date, or null to clear. Reject
  // anything else with a clear validation error instead of writing garbage.
  const rawDate = req.body?.announcementDate;
  let announcementDate: Date | null = null;
  if (rawDate != null && rawDate !== '') {
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: 'تاريخ إعلان النتائج غير صالح' });
    }
    announcementDate = d;
  }

  // Enforce the chain rule: winners date must come AFTER judging ends. Same
  // check the frontend does, kept here as a safety net (catches API clients
  // that bypass the UI).
  if (announcementDate) {
    const [endRows] = await pool.query<RowDataPacket[]>(
      'SELECT H_Judging_EndDate FROM hackathon WHERE hackathon_ID = ?',
      [id],
    );
    const judgingEnd = (endRows[0] as { H_Judging_EndDate: Date | null } | undefined)?.H_Judging_EndDate ?? null;
    if (judgingEnd && announcementDate.getTime() <= new Date(judgingEnd).getTime()) {
      return res.status(400).json({
        error: 'يجب أن يكون تاريخ إعلان الفائزين بعد "نهاية التقييم"',
      });
    }
  }

  await pool.execute(
    `UPDATE hackathon
        SET H_Show_Evaluations_To_Participants = ?,
            H_Show_Evaluation_Notes            = ?,
            H_Winners_Date                     = ?
      WHERE hackathon_ID = ?`,
    [showEvaluations ? 1 : 0, showNotes ? 1 : 0, announcementDate, id],
  );

  return res.json({ showEvaluations, showNotes, announcementDate });
};

// ============================================================
// Participants CSV export — one row per registered participant with their
// basic profile, team (if any), and submission status. Used by the
// "تصدير بيانات المشاركين" button on the projects page.
// ============================================================

// GET /hackathons/:id/export-participants — CSV download.
export const exportParticipantsCsv = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         m.M_FName        AS firstName,
         m.M_LName        AS lastName,
         m.M_Email        AS email,
         m.phone          AS phone,
         ah.participation_type  AS participationType,
         t.T_name              AS teamName,
         ah.application_status AS status,
         ah.applied_at         AS appliedAt,
         CASE
           WHEN ts.TS_SubmittedAt IS NOT NULL THEN 'مسلَّم'
           WHEN ts.TS_ID IS NOT NULL THEN 'مسوّدة'
           ELSE 'لم يبدأ'
         END              AS submissionStatus,
         ts.TS_ProjectName AS projectName,
         ts.TS_SubmittedAt AS submittedAt
       FROM applies_hackathon ah
       JOIN member m       ON m.M_ID = ah.PM_ID
       LEFT JOIN team t    ON t.T_ID = ah.T_ID
       LEFT JOIN team_submission ts
         ON ts.hackathon_ID = ah.hackathon_ID
         AND ((ah.T_ID IS NOT NULL AND ts.T_ID = ah.T_ID)
           OR (ah.T_ID IS NULL AND ts.PM_ID = ah.PM_ID))
       WHERE ah.hackathon_ID = ?
       ORDER BY ah.applied_at DESC, m.M_LName, m.M_FName`,
      [id],
    );

    // Build a UTF-8 BOM + CSV so Excel opens it with Arabic intact. Quotes any
    // value containing comma/quote/newline (CSV escaping rule).
    const header = [
      'الاسم الأول',
      'الاسم الأخير',
      'البريد الإلكتروني',
      'الجوال',
      'نوع المشاركة',
      'اسم الفريق',
      'حالة الطلب',
      'تاريخ التقديم',
      'حالة التسليم',
      'اسم المشروع',
      'تاريخ التسليم النهائي',
    ];
    const pad2 = (n: number) => n.toString().padStart(2, '0');
    const fmtDate = (d: Date) =>
      `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      const s = v instanceof Date ? fmtDate(v) : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines: string[] = [header.map(escape).join(',')];
    for (const raw of rows as Array<{
      firstName: string | null; lastName: string | null; email: string | null;
      phone: string | null; participationType: string | null; teamName: string | null;
      status: string | null; appliedAt: Date | null; submissionStatus: string;
      projectName: string | null; submittedAt: Date | null;
    }>) {
      lines.push([
        escape(raw.firstName),
        escape(raw.lastName),
        escape(raw.email),
        escape(raw.phone),
        escape(raw.participationType === 'team' ? 'فريق' : raw.participationType === 'solo' ? 'فردي' : raw.participationType),
        escape(raw.teamName),
        escape(
          raw.status === 'accepted' ? 'مقبول' :
          raw.status === 'rejected' ? 'مرفوض' :
          raw.status === 'pending' ? 'قيد المراجعة' :
          raw.status,
        ),
        escape(raw.appliedAt),
        escape(raw.submissionStatus),
        escape(raw.projectName),
        escape(raw.submittedAt),
      ].join(','));
    }
    const csv = '﻿' + lines.join('\r\n') + '\r\n';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participants-${id}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('exportParticipantsCsv error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// ============================================================
// Judge management — invite/list/remove/resend/remind.
// Mirrors the co-manager invite flow (token-based email invite) but targets
// hackathon_judge since evaluation FK references HJ_ID.
// Section access: 'projects' (owner or accepted projects manager).
// ============================================================
interface JudgeManageRow extends RowDataPacket {
  HJ_ID: number;
  HJ_FullName: string;
  HJ_Email: string;
  HJ_Specialty: string | null;
  HJ_InviteStatus: 'pending' | 'accepted' | 'declined';
  HJ_InvitedAt: Date | null;
  HJ_InviteExpiresAt: Date | null;
  HJ_AcceptedAt: Date | null;
  M_ID: number | null;
}

async function sendJudgeInviteEmailSafe(args: {
  to: string;
  inviteeName: string;
  organizerName: string;
  hackathonTitle: string;
  specialty: string | null;
  token: string;
}): Promise<void> {
  try {
    await sendJudgeInviteEmail({
      to: args.to,
      inviteeName: args.inviteeName,
      organizerName: args.organizerName,
      hackathonTitle: args.hackathonTitle,
      specialty: args.specialty,
      inviteUrl: `${env.frontendUrl}/invite/${args.token}`,
      expiryDays: 7,
    });
  } catch (err) {
    console.error('[judge invite] failed to send email to', args.to, err);
  }
}

// Fire-and-forget wrapper around the post-distribution assignment email so
// SMTP failures don't bubble up and break the HTTP response.
async function sendJudgeAssignmentEmailSafe(args: {
  to: string;
  judgeName: string;
  hackathonTitle: string;
  organizerName: string;
  projectCount: number;
  evaluationEndDate: Date | null;
  workspaceUrl: string;
}): Promise<void> {
  try {
    await sendJudgeAssignmentEmail(args);
  } catch (err) {
    console.error('[judge assignment] failed to send email to', args.to, err);
  }
}

export const listHackathonJudges = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  try {
    const [rows] = await pool.query<JudgeManageRow[]>(
      `SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty,
              HJ_InviteStatus, HJ_InvitedAt, HJ_InviteExpiresAt, HJ_AcceptedAt, M_ID
         FROM hackathon_judge
        WHERE hackathon_ID = ?
        ORDER BY HJ_ID`,
      [id],
    );

    const items = rows.map((r) => ({
      id: r.HJ_ID,
      fullName: r.HJ_FullName,
      email: r.HJ_Email,
      specialty: r.HJ_Specialty,
      inviteStatus: r.HJ_InviteStatus,
      invitedAt: r.HJ_InvitedAt,
      inviteExpiresAt: r.HJ_InviteExpiresAt,
      acceptedAt: r.HJ_AcceptedAt,
      memberId: r.M_ID,
    }));

    return res.json({ items });
  } catch (err) {
    console.error('listHackathonJudges error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /hackathons/:id/judges — add (invite) a new judge.
export const addHackathonJudge = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const specialty = typeof req.body?.specialty === 'string' ? req.body.specialty.trim() : '';

  if (!fullName) return res.status(400).json({ error: 'اسم الحكم مطلوب' });
  if (fullName.length > 150) return res.status(400).json({ error: 'الاسم طويل (الحد 150 خانة)' });
  if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'صيغة البريد الإلكتروني غير صحيحة' });
  }
  if (specialty.length > 200) return res.status(400).json({ error: 'التخصص طويل (الحد 200 خانة)' });

  // Reuse the same role-conflict check we run when adding a co-manager: blocks
  // inviting the hackathon's owner, an existing co-manager, an existing judge,
  // or a registered participant. Keeps roles disjoint per hackathon.
  const conflicts = await findRoleConflicts(id, email);
  if (conflicts.length > 0) {
    // The generic message references "co-manager" — swap to a judge-flavoured
    // wording when the conflict is "owner of the hackathon" since the user is
    // adding a judge, not a co-manager.
    // The unified messages from findRoleConflicts already read naturally for
    // any caller ("هذا الإيميل مضاف في الهاكاثون كحكم/مدير/موظف/مشارك"), so
    // we pass them through as-is.
    return res.status(409).json({
      error: 'role_conflict',
      conflicts,
      message: conflicts[0] ?? 'تعارض في الأدوار',
    });
  }

  try {
    const token = newInviteToken();
    // Stamp HJ_InviteEmailSentAt — email goes out below, so future republishes
    // won't re-email this judge automatically.
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO hackathon_judge
         (hackathon_ID, HJ_FullName, HJ_Email, HJ_Specialty,
          HJ_InviteStatus, HJ_InviteToken, HJ_InvitedAt, HJ_InviteExpiresAt, HJ_InviteEmailSentAt)
       VALUES (?, ?, ?, ?, 'pending', ?, NOW(), ?, NOW())`,
      [id, fullName, email, specialty || null, token, inviteExpiry()],
    );

    const ctx = await getHackathonInviteContext(id);
    if (ctx) {
      void sendJudgeInviteEmailSafe({
        to: email,
        inviteeName: fullName,
        organizerName: ctx.organizerName,
        hackathonTitle: ctx.title,
        specialty: specialty || null,
        token,
      });
    }

    return res.status(201).json({
      judge: {
        id: result.insertId,
        fullName,
        email,
        specialty: specialty || null,
        inviteStatus: 'pending',
      },
    });
  } catch (err) {
    console.error('addHackathonJudge error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// DELETE /hackathons/:id/judges/:hjId — remove a judge.
// Refuses if the judge already evaluated something (data integrity).
export const removeHackathonJudge = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const hjId = Number(req.params.hjId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(hjId) || hjId <= 0) return res.status(400).json({ error: 'invalid hjId' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT HJ_ID FROM hackathon_judge WHERE HJ_ID = ? AND hackathon_ID = ?',
    [hjId, id],
  );
  if (existing.length === 0) return res.status(404).json({ error: 'الحكم غير موجود' });

  const [evals] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS c FROM evaluation WHERE HJ_ID = ?',
    [hjId],
  );
  const evalCount = (evals[0] as { c: number }).c;
  if (evalCount > 0) {
    return res.status(409).json({ error: 'لا يمكن حذف حكم لديه تقييمات مسجّلة' });
  }

  try {
    await pool.execute(
      'UPDATE team_submission SET assigned_judge_id = NULL WHERE assigned_judge_id = ?',
      [hjId],
    );
    await pool.execute('DELETE FROM hackathon_judge WHERE HJ_ID = ?', [hjId]);
    return res.json({ removed: true });
  } catch (err) {
    console.error('removeHackathonJudge error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /hackathons/:id/judges/:hjId/resend-invite — regenerate token + re-send.
export const resendJudgeInvite = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const hjId = Number(req.params.hjId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(hjId) || hjId <= 0) return res.status(400).json({ error: 'invalid hjId' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  const [rows] = await pool.query<JudgeManageRow[]>(
    `SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty, HJ_InviteStatus
       FROM hackathon_judge WHERE HJ_ID = ? AND hackathon_ID = ?`,
    [hjId, id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'الحكم غير موجود' });
  const judge = rows[0];
  if (judge.HJ_InviteStatus !== 'pending') {
    return res.status(400).json({ error: 'لا يمكن إعادة إرسال دعوة إلا للحكام المنتظرين' });
  }

  try {
    const token = newInviteToken();
    // Explicit resend stamps the sent-at column so publishHackathon won't
    // automatically re-email this judge on a future republish.
    await pool.execute(
      `UPDATE hackathon_judge
          SET HJ_InviteToken = ?, HJ_InvitedAt = NOW(), HJ_InviteExpiresAt = ?,
              HJ_InviteEmailSentAt = NOW()
        WHERE HJ_ID = ?`,
      [token, inviteExpiry(), hjId],
    );
    const ctx = await getHackathonInviteContext(id);
    if (ctx) {
      void sendJudgeInviteEmailSafe({
        to: judge.HJ_Email,
        inviteeName: judge.HJ_FullName,
        organizerName: ctx.organizerName,
        hackathonTitle: ctx.title,
        specialty: judge.HJ_Specialty,
        token,
      });
    }
    return res.json({ resent: true });
  } catch (err) {
    console.error('resendJudgeInvite error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /hackathons/:id/judges/:hjId/remind — manual reminder to an accepted
// judge who hasn't finished evaluating. Sends a notification email pointing
// to the projects page (no token — the judge is already in the system).
export const remindJudge = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const hjId = Number(req.params.hjId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(hjId) || hjId <= 0) return res.status(400).json({ error: 'invalid hjId' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  const [rows] = await pool.query<JudgeManageRow[]>(
    `SELECT HJ_ID, HJ_FullName, HJ_Email, HJ_Specialty, HJ_InviteStatus
       FROM hackathon_judge WHERE HJ_ID = ? AND hackathon_ID = ?`,
    [hjId, id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'الحكم غير موجود' });
  const judge = rows[0];
  if (judge.HJ_InviteStatus !== 'accepted') {
    return res.status(400).json({ error: 'هذا الحكم لم يقبل الدعوة بعد' });
  }

  try {
    const ctx = await getHackathonInviteContext(id);
    if (ctx) {
      await sendJudgeInviteEmail({
        to: judge.HJ_Email,
        inviteeName: judge.HJ_FullName,
        organizerName: ctx.organizerName,
        hackathonTitle: ctx.title,
        specialty: judge.HJ_Specialty,
        inviteUrl: `${env.frontendUrl}/admin/hackathon/${id}/projects`,
        expiryDays: 7,
      });
    }
    return res.json({ reminded: true });
  } catch (err) {
    console.error('remindJudge error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// ============================================================
// Projects + distribution + evaluations.
// Powers the organizer's "submitted projects" table and the judge's
// "my assignments" view.
// ============================================================

interface ProjectRow extends RowDataPacket {
  tsId: number;
  teamId: number | null;
  participantId: number | null;
  hackathonId: number;
  projectName: string | null;
  projectDescription: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  submittedAt: Date | null;
  assignedJudgeId: number | null;
  teamName: string | null;
  participantFirst: string | null;
  participantLast: string | null;
  trackName: string | null;
  fileCount: number;
  evaluationCount: number;
  judgeName: string | null;
}

function projectStatusFor(p: ProjectRow): 'pending' | 'awaiting' | 'inReview' | 'completed' {
  if (!p.submittedAt) return 'pending';
  if (p.evaluationCount > 0) return 'completed';
  // Submitted, but the judge assignment hasn't happened yet — distinct from
  // "inReview" (which means a judge is actively reviewing it).
  if (p.assignedJudgeId === null) return 'awaiting';
  return 'inReview';
}

// GET /hackathons/:id/projects — organizer view of every submission for this
// hackathon. Each row reports owner (team/solo), assigned judge, evaluations.
export const listHackathonProjects = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  try {
    const [rows] = await pool.query<ProjectRow[]>(
      `SELECT
         ts.TS_ID                AS tsId,
         ts.T_ID                 AS teamId,
         ts.PM_ID                AS participantId,
         ts.hackathon_ID         AS hackathonId,
         ts.TS_ProjectName       AS projectName,
         ts.TS_ProjectDescription AS projectDescription,
         ts.TS_RepoUrl           AS repoUrl,
         ts.TS_DemoUrl           AS demoUrl,
         ts.TS_SubmittedAt       AS submittedAt,
         ts.assigned_judge_id    AS assignedJudgeId,
         t.T_name                AS teamName,
         pm.M_FName              AS participantFirst,
         pm.M_LName              AS participantLast,
         (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
            FROM hackathon_track WHERE hackathon_ID = ts.hackathon_ID) AS trackName,
         (SELECT COUNT(*) FROM submission_file WHERE TS_ID = ts.TS_ID) AS fileCount,
         (SELECT COUNT(*) FROM evaluation e
            WHERE (e.T_ID = ts.T_ID OR e.PM_ID = ts.PM_ID)
              AND e.hackathon_ID = ts.hackathon_ID) AS evaluationCount,
         hj.HJ_FullName          AS judgeName
         FROM team_submission ts
         LEFT JOIN team t   ON t.T_ID  = ts.T_ID
         LEFT JOIN participant p ON p.PM_ID = ts.PM_ID
         LEFT JOIN member pm     ON pm.M_ID = p.PM_ID
         LEFT JOIN hackathon_judge hj ON hj.HJ_ID = ts.assigned_judge_id
        WHERE ts.hackathon_ID = ?
        ORDER BY ts.TS_SubmittedAt DESC, ts.TS_ID DESC`,
      [id],
    );

    const [hackRows] = await pool.query<RowDataPacket[]>(
      'SELECT H_Judging_Distributed_At, H_Judging_StartDate, H_Judging_EndDate FROM hackathon WHERE hackathon_ID = ?',
      [id],
    );
    const meta = hackRows[0] as {
      H_Judging_Distributed_At: Date | null;
      H_Judging_StartDate: Date | null;
      H_Judging_EndDate: Date | null;
    } | undefined;

    // Pull criteria weights once so we can compute weighted-average scores per
    // project below. Map criterion-name → weight (percentage).
    const [critRows] = await pool.query<RowDataPacket[]>(
      'SELECT HEC_Name, HEC_Weight FROM hackathon_evaluation_criteria WHERE hackathon_ID = ?',
      [id],
    );
    const criteriaWeights = new Map<string, number>();
    for (const c of critRows as Array<{ HEC_Name: string; HEC_Weight: number }>) {
      criteriaWeights.set(c.HEC_Name, Number(c.HEC_Weight));
    }

    // Pull every evaluation score row for this hackathon and bucket them by
    // (target = T_ID or PM_ID). We then compute a weighted total per evaluation
    // and average across evaluators for the project-level score.
    const scoresByTarget = new Map<string, Map<number, Array<{ name: string; score: number }>>>();
    if (rows.length > 0) {
      const [evalScoreRows] = await pool.query<RowDataPacket[]>(
        `SELECT e.E_ID AS evalId, e.T_ID, e.PM_ID,
                es.ES_CriterionName AS name, es.ES_Score AS score
           FROM evaluation e
           JOIN evaluation_score es ON es.E_ID = e.E_ID
          WHERE e.hackathon_ID = ?`,
        [id],
      );
      for (const r of evalScoreRows as Array<{
        evalId: number; T_ID: number | null; PM_ID: number | null; name: string; score: number;
      }>) {
        const key = r.T_ID !== null ? `t:${r.T_ID}` : `p:${r.PM_ID}`;
        const evalMap = scoresByTarget.get(key) ?? new Map<number, Array<{ name: string; score: number }>>();
        const list = evalMap.get(r.evalId) ?? [];
        list.push({ name: r.name, score: Number(r.score) });
        evalMap.set(r.evalId, list);
        scoresByTarget.set(key, evalMap);
      }
    }

    // Compute a single 0-100 score per project by averaging weighted totals
    // across evaluations. Returns null when no evaluations exist yet.
    // New rubric: each criterion's score is already in 0..weight, and the
    // project total is just the sum of those (lands on 0..100 since weights
    // sum to 100). When a project has multiple evaluations we average the
    // per-judge totals.
    const scoreForProject = (teamId: number | null, participantId: number | null): number | null => {
      const key = teamId !== null ? `t:${teamId}` : `p:${participantId}`;
      const evalMap = scoresByTarget.get(key);
      if (!evalMap || evalMap.size === 0) return null;
      const perJudgeTotals: number[] = [];
      for (const scores of evalMap.values()) {
        let total = 0;
        for (const s of scores) total += s.score;
        perJudgeTotals.push(total);
      }
      const avg = perJudgeTotals.reduce((a, b) => a + b, 0) / perJudgeTotals.length;
      return Math.round(avg);
    };

    // Pull all submission files in one go (keyed by TS_ID) so the drawer
    // doesn't need a second roundtrip when the organizer clicks a project.
    const filesByProject = new Map<number, Array<{ id: number; name: string; size: number; mimeType: string | null; url: string }>>();
    if (rows.length > 0) {
      const tsIds = rows.map((r) => r.tsId);
      const placeholders = tsIds.map(() => '?').join(',');
      const [fileRows] = await pool.query<RowDataPacket[]>(
        `SELECT SF_ID AS id, TS_ID, SF_Name AS name, SF_StoredName AS storedName,
                SF_Size AS size, SF_MimeType AS mimeType
           FROM submission_file
          WHERE TS_ID IN (${placeholders})
          ORDER BY SF_UploadedAt DESC`,
        tsIds,
      );
      for (const f of fileRows as Array<{
        id: number; TS_ID: number; name: string; storedName: string;
        size: number; mimeType: string | null;
      }>) {
        const list = filesByProject.get(f.TS_ID) ?? [];
        list.push({
          id: f.id,
          name: f.name,
          size: f.size,
          mimeType: f.mimeType,
          url: `/uploads/submissions/${f.storedName}`,
        });
        filesByProject.set(f.TS_ID, list);
      }
    }

    const trackName = rows[0]?.trackName ?? null;
    const items = rows.map((r) => ({
      tsId: r.tsId,
      type: r.teamId !== null ? ('team' as const) : ('solo' as const),
      teamId: r.teamId,
      teamName: r.teamName,
      participantId: r.participantId,
      participantName:
        r.participantFirst || r.participantLast
          ? `${r.participantFirst ?? ''} ${r.participantLast ?? ''}`.trim()
          : null,
      projectName: r.projectName,
      projectDescription: r.projectDescription,
      repoUrl: r.repoUrl,
      demoUrl: r.demoUrl,
      submittedAt: r.submittedAt,
      hasFiles: Number(r.fileCount) > 0,
      hasLinks: Boolean(r.repoUrl || r.demoUrl),
      files: filesByProject.get(r.tsId) ?? [],
      assignedJudge: r.assignedJudgeId
        ? { id: r.assignedJudgeId, name: r.judgeName ?? '' }
        : null,
      evaluationCount: Number(r.evaluationCount),
      totalEvaluators: r.assignedJudgeId ? 1 : 0,
      score: scoreForProject(r.teamId, r.participantId),
      status: projectStatusFor(r),
      trackName: trackName ? trackName.split('|||').filter(Boolean)[0] ?? null : null,
    }));

    return res.json({
      items,
      distribution: {
        distributedAt: meta?.H_Judging_Distributed_At ?? null,
        judgingStartDate: meta?.H_Judging_StartDate ?? null,
        judgingEndDate: meta?.H_Judging_EndDate ?? null,
      },
    });
  } catch (err) {
    console.error('listHackathonProjects error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /hackathons/:id/distribute-judging — assign every submitted (but not
// yet assigned) project to a judge in a balanced round-robin. One judge per
// project. Idempotent: re-running only assigns projects that don't already
// have a judge.
export const distributeJudging = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  try {
    // First: are there any submitted projects AT ALL? Distinguishing this case
    // from "all already distributed" gives the user a clearer error message.
    const [submittedCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM team_submission
        WHERE hackathon_ID = ? AND TS_SubmittedAt IS NOT NULL`,
      [id],
    );
    const totalSubmitted = (submittedCount[0] as { c: number }).c;

    if (totalSubmitted === 0) {
      return res.status(400).json({
        error: 'لا توجد مشاريع مسلَّمة للتوزيع. انتظر المشاركين يسلمون مشاريعهم أولاً.',
      });
    }

    // Block distribution if no criteria exist — without them, judges land on
    // an empty evaluation form and can't submit anything. Better to fail
    // loud here than silently leave judges stuck later.
    const [critCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM hackathon_evaluation_criteria WHERE hackathon_ID = ?',
      [id],
    );
    if ((critCount[0] as { c: number }).c === 0) {
      return res.status(400).json({
        error: 'لا توجد معايير تقييم. أضف معايير التقييم أولاً من قسم "إعدادات التقييم" ثم وزّع المشاريع.',
      });
    }

    const [unassigned] = await pool.query<RowDataPacket[]>(
      `SELECT TS_ID FROM team_submission
        WHERE hackathon_ID = ?
          AND TS_SubmittedAt IS NOT NULL
          AND assigned_judge_id IS NULL
        ORDER BY TS_ID`,
      [id],
    );

    const [judges] = await pool.query<RowDataPacket[]>(
      `SELECT HJ_ID FROM hackathon_judge
        WHERE hackathon_ID = ? AND HJ_InviteStatus = 'accepted'
        ORDER BY HJ_ID`,
      [id],
    );

    // Shuffle helper — Fisher-Yates. Mutates the array in place.
    const shuffle = <T>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    if (judges.length === 0) {
      return res.status(400).json({
        error: 'لا يوجد حكام مقبولين — أضف حكامًا أولاً ثم انتظر قبولهم',
      });
    }
    if (unassigned.length === 0) {
      // Submitted projects exist but they're all already assigned. Mark the
      // hackathon as "distributed" if it wasn't already.
      await pool.execute(
        'UPDATE hackathon SET H_Judging_Distributed_At = COALESCE(H_Judging_Distributed_At, NOW()) WHERE hackathon_ID = ?',
        [id],
      );
      return res.json({
        assigned: 0,
        totalProjects: totalSubmitted,
        judges: judges.length,
        message: 'كل المشاريع المسلَّمة موزّعة مسبقًا',
      });
    }

    // Shuffle both lists before round-robin so the assignment is random while
    // still balanced: with N projects and K judges every judge gets either
    // floor(N/K) or ceil(N/K) — never a 0/4 split. Shuffling the judge order
    // randomizes WHICH judge gets the extra project when N % K != 0.
    const judgeIds = shuffle((judges as Array<{ HJ_ID: number }>).map((j) => j.HJ_ID));
    const projectIds = shuffle((unassigned as Array<{ TS_ID: number }>).map((p) => p.TS_ID));

    // Build a per-judge tally as we assign so we can return the actual
    // distribution to the UI (lets the organizer see exactly how the random
    // shuffle landed instead of guessing).
    const tally = new Map<number, number>();
    for (let i = 0; i < projectIds.length; i++) {
      const judgeId = judgeIds[i % judgeIds.length];
      await pool.execute(
        'UPDATE team_submission SET assigned_judge_id = ? WHERE TS_ID = ?',
        [judgeId, projectIds[i]],
      );
      tally.set(judgeId, (tally.get(judgeId) ?? 0) + 1);
    }

    await pool.execute(
      'UPDATE hackathon SET H_Judging_Distributed_At = NOW() WHERE hackathon_ID = ?',
      [id],
    );

    // Re-fetch judge contact info in the shuffled order so the UI can render
    // the breakdown AND we can send each assignee an email below.
    const namePh = judgeIds.map(() => '?').join(',');
    const [judgeRows] = await pool.query<RowDataPacket[]>(
      `SELECT HJ_ID, HJ_FullName, HJ_Email FROM hackathon_judge WHERE HJ_ID IN (${namePh})`,
      judgeIds,
    );
    const nameById = new Map<number, string>();
    const emailById = new Map<number, string>();
    for (const r of judgeRows as Array<{ HJ_ID: number; HJ_FullName: string; HJ_Email: string }>) {
      nameById.set(r.HJ_ID, r.HJ_FullName);
      emailById.set(r.HJ_ID, r.HJ_Email);
    }

    // Notify each judge by email — fire-and-forget so the response isn't
    // blocked on SMTP. Pulls the organizer + hackathon title in one query.
    const ctx = await getHackathonInviteContext(id);
    const [hackMeta] = await pool.query<RowDataPacket[]>(
      'SELECT H_Judging_EndDate FROM hackathon WHERE hackathon_ID = ?',
      [id],
    );
    const evaluationEndDate = (hackMeta[0] as { H_Judging_EndDate: Date | null } | undefined)?.H_Judging_EndDate ?? null;
    if (ctx) {
      for (const hjId of judgeIds) {
        const count = tally.get(hjId) ?? 0;
        const email = emailById.get(hjId);
        const name = nameById.get(hjId);
        if (!email || !name || count === 0) continue;
        void sendJudgeAssignmentEmailSafe({
          to: email,
          judgeName: name,
          hackathonTitle: ctx.title,
          organizerName: ctx.organizerName,
          projectCount: count,
          evaluationEndDate,
          workspaceUrl: `${env.frontendUrl}/admin/hackathon/${id}/projects`,
        });
      }
    }

    return res.json({
      assigned: projectIds.length,
      totalProjects: projectIds.length,
      judges: judgeIds.length,
      breakdown: judgeIds.map((hjId) => ({
        judgeId: hjId,
        judgeName: nameById.get(hjId) ?? '',
        count: tally.get(hjId) ?? 0,
      })),
    });
  } catch (err) {
    console.error('distributeJudging error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// GET /hackathons/:id/projects/:tsId/evaluations — all evaluations submitted
// against a given project. Used by the organizer's project drawer.
export const listProjectEvaluations = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  const tsId = Number(req.params.tsId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!Number.isInteger(tsId) || tsId <= 0) return res.status(400).json({ error: 'invalid tsId' });
  if (!(await ensureSectionAccess(id, req.user.memberId, 'projects'))) {
    return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
  }

  try {
    const [subRows] = await pool.query<RowDataPacket[]>(
      'SELECT T_ID, PM_ID FROM team_submission WHERE TS_ID = ? AND hackathon_ID = ?',
      [tsId, id],
    );
    if (subRows.length === 0) return res.status(404).json({ error: 'المشروع غير موجود' });
    const { T_ID, PM_ID } = subRows[0] as { T_ID: number | null; PM_ID: number | null };

    const [evals] = await pool.query<RowDataPacket[]>(
      `SELECT e.E_ID         AS id,
              e.HJ_ID        AS judgeId,
              hj.HJ_FullName AS judgeName,
              hj.HJ_Specialty AS judgeSpecialty,
              e.E_Comment    AS comment,
              e.E_EvaluatedAt AS evaluatedAt
         FROM evaluation e
         JOIN hackathon_judge hj ON hj.HJ_ID = e.HJ_ID
        WHERE e.hackathon_ID = ?
          AND ((? IS NOT NULL AND e.T_ID = ?) OR (? IS NOT NULL AND e.PM_ID = ?))
        ORDER BY e.E_EvaluatedAt DESC`,
      [id, T_ID, T_ID, PM_ID, PM_ID],
    );

    if (evals.length === 0) return res.json({ items: [] });

    const evalIds = (evals as Array<{ id: number }>).map((e) => e.id);
    const placeholders = evalIds.map(() => '?').join(',');
    const [scores] = await pool.query<RowDataPacket[]>(
      `SELECT E_ID, ES_CriterionName, ES_Score, ES_SortOrder
         FROM evaluation_score
        WHERE E_ID IN (${placeholders})
        ORDER BY ES_SortOrder, ES_ID`,
      evalIds,
    );

    const scoresByEval = new Map<number, Array<{ name: string; score: number }>>();
    for (const s of scores as Array<{ E_ID: number; ES_CriterionName: string; ES_Score: number }>) {
      const list = scoresByEval.get(s.E_ID) ?? [];
      list.push({ name: s.ES_CriterionName, score: s.ES_Score });
      scoresByEval.set(s.E_ID, list);
    }

    const items = (evals as Array<{
      id: number;
      judgeId: number;
      judgeName: string;
      judgeSpecialty: string | null;
      comment: string | null;
      evaluatedAt: Date;
    }>).map((e) => ({
      id: e.id,
      judgeId: e.judgeId,
      judgeName: e.judgeName,
      judgeSpecialty: e.judgeSpecialty,
      comment: e.comment,
      evaluatedAt: e.evaluatedAt,
      scores: scoresByEval.get(e.id) ?? [],
    }));

    return res.json({ items });
  } catch (err) {
    console.error('listProjectEvaluations error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// Judge-side: resolve current user's HJ_ID for a hackathon, or null.
async function findMyJudgeId(
  memberId: number,
  hackathonId: number,
): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT HJ_ID FROM hackathon_judge
      WHERE hackathon_ID = ? AND M_ID = ? AND HJ_InviteStatus = 'accepted'
      LIMIT 1`,
    [hackathonId, memberId],
  );
  if (rows.length === 0) return null;
  return (rows[0] as { HJ_ID: number }).HJ_ID;
}

// GET /judges/me/hackathons/:id/assignments — projects this judge must evaluate.
export const listMyJudgeAssignments = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });

  const hjId = await findMyJudgeId(req.user.memberId, id);
  if (hjId === null) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         ts.TS_ID                AS tsId,
         ts.T_ID                 AS teamId,
         ts.PM_ID                AS participantId,
         ts.TS_ProjectName       AS projectName,
         ts.TS_ProjectDescription AS projectDescription,
         ts.TS_RepoUrl           AS repoUrl,
         ts.TS_DemoUrl           AS demoUrl,
         ts.TS_SubmittedAt       AS submittedAt,
         t.T_name                AS teamName,
         pm.M_FName              AS participantFirst,
         pm.M_LName              AS participantLast,
         (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
            FROM hackathon_track WHERE hackathon_ID = ts.hackathon_ID) AS trackName,
         (SELECT COUNT(*) FROM submission_file WHERE TS_ID = ts.TS_ID) AS fileCount,
         (SELECT E_ID FROM evaluation
            WHERE HJ_ID = ?
              AND ((ts.T_ID IS NOT NULL AND T_ID = ts.T_ID)
                OR (ts.PM_ID IS NOT NULL AND PM_ID = ts.PM_ID))
            LIMIT 1) AS myEvaluationId
         FROM team_submission ts
         LEFT JOIN team t   ON t.T_ID  = ts.T_ID
         LEFT JOIN participant p ON p.PM_ID = ts.PM_ID
         LEFT JOIN member pm     ON pm.M_ID = p.PM_ID
        WHERE ts.hackathon_ID = ?
          AND ts.assigned_judge_id = ?
          AND ts.TS_SubmittedAt IS NOT NULL
        ORDER BY ts.TS_SubmittedAt DESC, ts.TS_ID DESC`,
      [hjId, id, hjId],
    );

    const rawRows = rows as Array<{
      tsId: number;
      teamId: number | null;
      participantId: number | null;
      projectName: string | null;
      projectDescription: string | null;
      repoUrl: string | null;
      demoUrl: string | null;
      submittedAt: Date | null;
      teamName: string | null;
      participantFirst: string | null;
      participantLast: string | null;
      trackName: string | null;
      fileCount: number;
      myEvaluationId: number | null;
    }>;
    const firstTrack = rawRows[0]?.trackName?.split('|||').filter(Boolean)[0] ?? null;

    // Pull all submission files in one go (keyed by TS_ID) so the judge can
    // open them directly from their assignments list.
    const filesByProject = new Map<number, Array<{ id: number; name: string; size: number; mimeType: string | null; url: string }>>();
    // Map evaluation_id → weighted total score (0-100) for this judge's
    // evaluations. We compute the weighted average so the judge sees the same
    // number as everyone else (and matches what the organizer view shows).
    const scoreByEvalId = new Map<number, number>();
    // Map evaluation_id → per-criterion scores so the judge can revisit what
    // they submitted (read-only details panel in the UI).
    const scoresByEvalId = new Map<number, Array<{ name: string; score: number }>>();
    // Map evaluation_id → comment so the judge sees their own notes too.
    const commentByEvalId = new Map<number, string | null>();
    if (rawRows.length > 0) {
      const tsIds = rawRows.map((r) => r.tsId);
      const placeholders = tsIds.map(() => '?').join(',');
      const [fileRows] = await pool.query<RowDataPacket[]>(
        `SELECT SF_ID AS id, TS_ID, SF_Name AS name, SF_StoredName AS storedName,
                SF_Size AS size, SF_MimeType AS mimeType
           FROM submission_file
          WHERE TS_ID IN (${placeholders})
          ORDER BY SF_UploadedAt DESC`,
        tsIds,
      );
      for (const f of fileRows as Array<{
        id: number; TS_ID: number; name: string; storedName: string;
        size: number; mimeType: string | null;
      }>) {
        const list = filesByProject.get(f.TS_ID) ?? [];
        list.push({
          id: f.id,
          name: f.name,
          size: f.size,
          mimeType: f.mimeType,
          url: `/uploads/submissions/${f.storedName}`,
        });
        filesByProject.set(f.TS_ID, list);
      }

      // Fetch criteria weights for the hackathon, then per-evaluation scores
      // for every evaluation this judge has submitted. Compute weighted total
      // per evaluation so we can show a single 0-100 score in the judge's row.
      const evalIds = rawRows
        .map((r) => r.myEvaluationId)
        .filter((x): x is number => x !== null);
      if (evalIds.length > 0) {
        const ph = evalIds.map(() => '?').join(',');
        const [scoreRows] = await pool.query<RowDataPacket[]>(
          `SELECT E_ID, ES_CriterionName, ES_Score, ES_SortOrder
             FROM evaluation_score WHERE E_ID IN (${ph})
            ORDER BY ES_SortOrder, ES_ID`,
          evalIds,
        );
        // Sum scores directly — each criterion is already capped at its weight,
        // so the sum lands on 0..100 (since weights total 100).
        const totals = new Map<number, number>();
        for (const s of scoreRows as Array<{ E_ID: number; ES_CriterionName: string; ES_Score: number }>) {
          totals.set(s.E_ID, (totals.get(s.E_ID) ?? 0) + Number(s.ES_Score));
          const list = scoresByEvalId.get(s.E_ID) ?? [];
          list.push({ name: s.ES_CriterionName, score: Number(s.ES_Score) });
          scoresByEvalId.set(s.E_ID, list);
        }
        for (const [evalId, total] of totals) {
          scoreByEvalId.set(evalId, Math.round(total));
        }
        // Pull comments for these evaluations so the judge sees their own notes.
        const [commentRows] = await pool.query<RowDataPacket[]>(
          `SELECT E_ID, E_Comment FROM evaluation WHERE E_ID IN (${ph})`,
          evalIds,
        );
        for (const c of commentRows as Array<{ E_ID: number; E_Comment: string | null }>) {
          commentByEvalId.set(c.E_ID, c.E_Comment);
        }
      }
    }

    const items = rawRows.map((r) => ({
      tsId: r.tsId,
      type: r.teamId !== null ? ('team' as const) : ('solo' as const),
      teamName: r.teamName,
      participantName:
        r.participantFirst || r.participantLast
          ? `${r.participantFirst ?? ''} ${r.participantLast ?? ''}`.trim()
          : null,
      projectName: r.projectName,
      projectDescription: r.projectDescription,
      repoUrl: r.repoUrl,
      demoUrl: r.demoUrl,
      submittedAt: r.submittedAt,
      hasFiles: Number(r.fileCount) > 0,
      hasLinks: Boolean(r.repoUrl || r.demoUrl),
      files: filesByProject.get(r.tsId) ?? [],
      trackName: firstTrack,
      evaluated: r.myEvaluationId !== null,
      myScore: r.myEvaluationId !== null ? (scoreByEvalId.get(r.myEvaluationId) ?? null) : null,
      myEvaluation: r.myEvaluationId !== null
        ? {
            scores: scoresByEvalId.get(r.myEvaluationId) ?? [],
            comment: commentByEvalId.get(r.myEvaluationId) ?? null,
          }
        : null,
    }));

    return res.json({ items });
  } catch (err) {
    console.error('listMyJudgeAssignments error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

// POST /judges/me/evaluations — submit (or update) my evaluation for a
// specific project. Body: { hackathonId, tsId, scores: [{name, score}], comment }
export const submitJudgeEvaluation = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });

  const hackathonId = Number(req.body?.hackathonId);
  const tsId = Number(req.body?.tsId);
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
  const rawScores = Array.isArray(req.body?.scores) ? req.body.scores : null;

  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    return res.status(400).json({ error: 'invalid hackathonId' });
  }
  if (!Number.isInteger(tsId) || tsId <= 0) {
    return res.status(400).json({ error: 'invalid tsId' });
  }
  if (!rawScores || rawScores.length === 0) {
    return res.status(400).json({ error: 'scores array required' });
  }

  const hjId = await findMyJudgeId(req.user.memberId, hackathonId);
  if (hjId === null) return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

  const [subRows] = await pool.query<RowDataPacket[]>(
    `SELECT T_ID, PM_ID, assigned_judge_id, TS_SubmittedAt
       FROM team_submission WHERE TS_ID = ? AND hackathon_ID = ?`,
    [tsId, hackathonId],
  );
  if (subRows.length === 0) return res.status(404).json({ error: 'المشروع غير موجود' });
  const sub = subRows[0] as {
    T_ID: number | null;
    PM_ID: number | null;
    assigned_judge_id: number | null;
    TS_SubmittedAt: Date | null;
  };
  if (sub.assigned_judge_id !== hjId) {
    return res.status(403).json({ error: 'هذا المشروع ليس ضمن مشاريعك للتقييم' });
  }
  if (!sub.TS_SubmittedAt) {
    return res.status(400).json({ error: 'المشروع لم يُسلَّم بعد' });
  }

  // Load criteria — name, sort order, AND weight. Weight doubles as the
  // criterion's max score in the new "weight = ceiling" rubric: a 25% weight
  // criterion can score 0..25, a 10% weight criterion can score 0..10, and
  // the final project score is the SUM of these (which lands on 0..100 since
  // weights sum to 100).
  const [critRows] = await pool.query<RowDataPacket[]>(
    `SELECT HEC_Name, HEC_SortOrder, HEC_Weight
       FROM hackathon_evaluation_criteria
      WHERE hackathon_ID = ?
      ORDER BY HEC_SortOrder, HEC_ID`,
    [hackathonId],
  );
  if (critRows.length === 0) {
    return res.status(400).json({ error: 'لم يحدد المنظم معايير التقييم' });
  }
  const criteriaIndex = new Map<string, { sortOrder: number; max: number }>();
  for (const c of critRows as Array<{ HEC_Name: string; HEC_SortOrder: number; HEC_Weight: number }>) {
    criteriaIndex.set(c.HEC_Name, { sortOrder: c.HEC_SortOrder, max: Number(c.HEC_Weight) });
  }

  const normalizedScores: Array<{ name: string; score: number; sortOrder: number }> = [];
  for (let i = 0; i < rawScores.length; i++) {
    const s = rawScores[i] as { name?: unknown; score?: unknown } | null;
    if (!s || typeof s !== 'object') return res.status(400).json({ error: `score ${i + 1} invalid` });
    const name = typeof s.name === 'string' ? s.name.trim() : '';
    const meta = criteriaIndex.get(name);
    if (!name || !meta) {
      return res.status(400).json({ error: `معيار غير معروف: ${name}` });
    }
    const score = Number(s.score);
    if (!Number.isFinite(score) || score < 0 || score > meta.max) {
      return res.status(400).json({
        error: `درجة المعيار "${name}" غير صالحة (٠ - ${meta.max})`,
      });
    }
    normalizedScores.push({
      name,
      score: Math.round(score),
      sortOrder: meta.sortOrder,
    });
  }

  // Upsert: one evaluation per (judge, target). Update replaces comment +
  // delete-and-reinsert scores.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const targetCol = sub.T_ID !== null ? 'T_ID' : 'PM_ID';
    const targetVal = sub.T_ID !== null ? sub.T_ID : sub.PM_ID;

    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT E_ID FROM evaluation
        WHERE HJ_ID = ? AND hackathon_ID = ? AND ${targetCol} = ? LIMIT 1`,
      [hjId, hackathonId, targetVal],
    );

    let evaluationId: number;
    if (existing.length > 0) {
      evaluationId = (existing[0] as { E_ID: number }).E_ID;
      await conn.execute(
        `UPDATE evaluation SET E_Comment = ?, E_EvaluatedAt = NOW() WHERE E_ID = ?`,
        [comment || null, evaluationId],
      );
      await conn.execute('DELETE FROM evaluation_score WHERE E_ID = ?', [evaluationId]);
    } else {
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO evaluation (HJ_ID, ${targetCol}, hackathon_ID, E_Comment)
         VALUES (?, ?, ?, ?)`,
        [hjId, targetVal, hackathonId, comment || null],
      );
      evaluationId = result.insertId;
    }

    for (const s of normalizedScores) {
      await conn.execute(
        `INSERT INTO evaluation_score (E_ID, ES_CriterionName, ES_Score, ES_SortOrder)
         VALUES (?, ?, ?, ?)`,
        [evaluationId, s.name, s.score, s.sortOrder],
      );
    }

    await conn.commit();
    return res.json({ evaluationId, updated: existing.length > 0 });
  } catch (err) {
    await conn.rollback();
    console.error('submitJudgeEvaluation error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};
