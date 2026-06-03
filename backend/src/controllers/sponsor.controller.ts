import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { extractBranding } from '../lib/branding';
import { validatePackageId } from '../lib/sponsor-validation';

interface SponsorProfileRow extends RowDataPacket {
  M_ID: number;
  M_Email: string;
  M_FName: string;
  M_LName: string;
  M_Bio: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  S_Brand: string | null;
  S_CR_Number: string | null;
  S_Position: string | null;
  S_Industry: string | null;
  S_Website: string | null;
  S_Banner: string | null;
}

interface OpportunityRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
  startDate: Date | null;
  registrationDeadline: Date | null;
  org: string | null;
  prizeTotal: string | null;
  tagsRaw: string | null;
  packagesCount: number;
  teamsCount: number;
  brandingRaw: string | null;
  views: number;
}

interface PackageExistsRow extends RowDataPacket {
  SP_ID: number;
  hackathon_ID: number;
}

interface ExistingApplicationRow extends RowDataPacket {
  SA_ID: number;
  SP_Name: string;
}

interface OpportunityDetailHackathonRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
  city: string | null;
  description: string | null;
  startDate: Date | null;
  registrationDeadline: Date | null;
  org: string | null;
  brandingRaw: string | null;
}

interface SponsorPackageRow extends RowDataPacket {
  SP_ID: number;
  SP_Name: string;
  SP_Type: string;
  SP_Description: string | null;
  SP_Duration: string | null;
  SP_Price: string | null;
  SP_Sponsor_Offer: string | null;
  SP_Resources: string | null;
  // JSON column in the database: mysql2 decodes it automatically and returns an array,
  // but some versions may return a string. We handle both cases below.
  SP_Benefits: unknown;
}

interface MyApplicationRow extends RowDataPacket {
  SP_ID: number;
}

interface TrackRow extends RowDataPacket {
  HT_ID: number;
  HT_Name: string;
  HT_Description: string | null;
}

interface PrizeRow extends RowDataPacket {
  HP_Position: string;
  HP_Amount: string | null;
  HP_SortOrder: number;
}

interface MyContractRow extends RowDataPacket {
  contractId: number;
  hackathonId: number;
  hackathonTitle: string;
  hackathonStartDate: Date | null;
  packageName: string;
  packageType: string;
  packagePrice: string | null;
  organizerName: string | null;
  negotiationStep: number;
  paidAt: Date | null;
  appliedAt: Date;
  sponsorSignedAt: Date | null;
  organizerSigned: number;
  organizerSignedAt: Date | null;
  receiptFile: string | null;
}

interface ChatMessageRow extends RowDataPacket {
  id: number;
  senderId: number;
  senderType: 'SPONSOR' | 'ORGANIZER' | 'PARTICIPANT';
  senderName: string;
  text: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isSystem: number;
  createdAt: Date;
}

interface ApplicationOwnersRow extends RowDataPacket {
  SM_ID: number;
  HAM_ID: number;
}

interface MyConversationRow extends RowDataPacket {
  applicationId: number;
  status: 'pending' | 'accepted' | 'rejected';
  negotiationStep: number;
  appliedAt: Date;
  sponsorSignedAt: Date | null;
  packageId: number;
  packageName: string;
  packageType: string;
  packagePrice: string | null;
  hackathonId: number;
  hackathonTitle: string;
  hackathonStartDate: Date | null;
  organizerName: string | null;
  lastMessageText: string | null;
  lastMessageFileName: string | null;
  lastMessageIsSystem: number | null;
  lastMessageAt: Date | null;
}

interface MyPaymentRow extends RowDataPacket {
  applicationId: number;
  appliedAt: Date;
  acceptedStatus: 'pending' | 'accepted' | 'rejected';
  paidAt: Date | null;
  packageId: number;
  packageName: string;
  packagePrice: string | null;
  hackathonId: number;
  hackathonTitle: string;
}

interface MyApplicationDetailRow extends RowDataPacket {
  applicationId: number;
  status: 'pending' | 'accepted' | 'rejected';
  negotiationStep: number;
  appliedAt: Date;
  paidAt: Date | null;
  packageId: number;
  packageName: string;
  packageType: string;
  packagePrice: string | null;
  hackathonId: number;
  hackathonTitle: string;
  hackathonStatus: string;
  hackathonStartDate: Date | null;
  brandingRaw: string | null;
}

/**
 * Verifies that the current user is an authenticated sponsor.
 * Used in all sponsor functions to avoid repeating the check.
 */
function ensureSponsor(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ error: 'يجب تسجيل الدخول' });
    return false;
  }
  if (req.user.role !== 'SPONSOR') {
    res.status(403).json({ error: 'هذه العملية متاحة للرعاة فقط' });
    return false;
  }
  return true;
}

export const getMyProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  if (req.user.role !== 'SPONSOR') {
    return res.status(403).json({ error: 'sponsor_required', message: 'هذه العملية متاحة للرعاة فقط' });
  }

  const [rows] = await pool.query<SponsorProfileRow[]>(
    `SELECT m.M_ID, m.M_Email, m.M_FName, m.M_LName, m.M_Bio,
            m.phone, m.city, m.avatar_url,
            s.S_Brand, s.S_CR_Number, s.S_Position, s.S_Industry,
            s.S_Website, s.S_Banner
       FROM member m
       JOIN sponsor s ON s.SM_ID = m.M_ID
      WHERE m.M_ID = ?`,
    [req.user.memberId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'sponsor profile not found' });
  }

  const r = rows[0];
  return res.json({
    id: r.M_ID,
    email: r.M_Email,
    firstName: r.M_FName,
    lastName: r.M_LName,
    fullName: `${r.M_FName} ${r.M_LName}`.trim(),
    bio: r.M_Bio,
    phone: r.phone,
    location: r.city,
    avatar: r.avatar_url,
    joinedAt: null,
    brandName: r.S_Brand,
    crNumber: r.S_CR_Number,
    position: r.S_Position,
    industry: r.S_Industry,
    website: r.S_Website,
    banner: r.S_Banner,
  });
};

export const listOpportunities = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'SPONSOR') {
    return res.status(403).json({ error: 'sponsor_required', message: 'هذه العملية متاحة للرعاة فقط' });
  }
  const [rows] = await pool.query<OpportunityRow[]>(
    `SELECT
       h.hackathon_ID AS id,
       h.H_title AS title,
       h.H_slug AS slug,
       h.H_type AS type,
       h.H_Hackathon_StartDate AS startDate,
       h.H_Registration_EndDate AS registrationDeadline,
       op.ORG_Name AS org,
       (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(HP_Amount, ',', ''), ' ', '') AS DECIMAL(12,2))), 0)
          FROM hackathon_prize WHERE hackathon_ID = h.hackathon_ID) AS prizeTotal,
       (SELECT GROUP_CONCAT(HT_Name SEPARATOR '|||')
          FROM hackathon_track WHERE hackathon_ID = h.hackathon_ID) AS tagsRaw,
       (SELECT COUNT(*) FROM sponsor_package WHERE hackathon_ID = h.hackathon_ID) AS packagesCount,
       (SELECT COUNT(*) FROM team WHERE hackathon_ID = h.hackathon_ID) AS teamsCount,
       h.H_views AS views
       FROM hackathon h
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
      WHERE h.H_status = 'published'
      ORDER BY h.H_created_at DESC`
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
  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    type: r.type,
    startDate: r.startDate,
    registrationDeadline: r.registrationDeadline,
    org: r.org,
    prizeTotal: r.prizeTotal ? Number(r.prizeTotal) : 0,
    tags: r.tagsRaw ? r.tagsRaw.split('|||') : [],
    packagesCount: r.packagesCount,
    teamsCount: r.teamsCount,
    branding: extractBranding(brandingById.get(r.id) ?? null),
    views: r.views,
  }));
  return res.json({ items });
};

export const getOpportunityDetail = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
  }

  const sponsorId = req.user!.memberId;

  // Increment the hackathon's view counter (fire-and-forget — doesn't affect the response if it fails)
  pool
    .execute('UPDATE hackathon SET H_views = H_views + 1 WHERE hackathon_ID = ?', [id])
    .catch((err) => console.error('[views increment] error:', err));

  // 1) Basic hackathon info (with branding)
  const [hackathonRows] = await pool.query<OpportunityDetailHackathonRow[]>(
    `SELECT
       h.hackathon_ID AS id,
       h.H_title AS title,
       h.H_slug AS slug,
       h.H_type AS type,
       h.H_city AS city,
       h.H_description AS description,
       h.H_Hackathon_StartDate AS startDate,
       h.H_Registration_EndDate AS registrationDeadline,
       op.ORG_Name AS org,
       h.H_Branding AS brandingRaw
       FROM hackathon h
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
      WHERE h.hackathon_ID = ? AND h.H_status = 'published'`,
    [id]
  );

  if (hackathonRows.length === 0) {
    return res.status(404).json({ error: 'الهاكاثون غير موجود أو غير منشور' });
  }
  const hk = hackathonRows[0];

  // 2) Available packages for this hackathon
  const [packageRows] = await pool.query<SponsorPackageRow[]>(
    `SELECT SP_ID, SP_Name, SP_Type, SP_Description, SP_Duration,
            SP_Price, SP_Sponsor_Offer, SP_Resources, SP_Benefits
       FROM sponsor_package
      WHERE hackathon_ID = ?
      ORDER BY SP_ID`,
    [id]
  );

  // 3) Packages already applied to (to show "Applied" instead of the apply button)
  const [appliedRows] = await pool.query<MyApplicationRow[]>(
    `SELECT sa.SP_ID
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
      WHERE sa.SM_ID = ? AND sp.hackathon_ID = ?`,
    [sponsorId, id]
  );
  const appliedSet = new Set(appliedRows.map((r) => r.SP_ID));

  // 4) Tracks and prizes (for a richer display)
  const [trackRows] = await pool.query<TrackRow[]>(
    `SELECT HT_ID, HT_Name, HT_Description
       FROM hackathon_track
      WHERE hackathon_ID = ?
      ORDER BY HT_ID`,
    [id]
  );
  const [prizeRows] = await pool.query<PrizeRow[]>(
    `SELECT HP_Position, HP_Amount, HP_SortOrder
       FROM hackathon_prize
      WHERE hackathon_ID = ?
      ORDER BY HP_SortOrder`,
    [id]
  );

  const packages = packageRows.map((p) => {
    // SP_Benefits is a JSON column: mysql2 usually returns it as a parsed array, rarely a string.
    // We handle both: if it's an array we take it directly, if a string we parse it.
    let benefits: string[] = [];
    const raw = p.SP_Benefits;
    let parsed: unknown = null;
    if (Array.isArray(raw)) {
      parsed = raw;
    } else if (typeof raw === 'string' && raw.length > 0) {
      try { parsed = JSON.parse(raw); } catch { parsed = null; }
    }
    if (Array.isArray(parsed)) {
      benefits = parsed.filter((b): b is string => typeof b === 'string');
    }

    return {
      id: p.SP_ID,
      name: p.SP_Name,
      type: p.SP_Type,
      description: p.SP_Description,
      duration: p.SP_Duration,
      price: p.SP_Price ? Number(p.SP_Price) : null,
      sponsorOffer: p.SP_Sponsor_Offer,
      resources: p.SP_Resources,
      benefits,
      hasApplied: appliedSet.has(p.SP_ID),
    };
  });

  // The ID of the first package the sponsor applied to in this hackathon (null if none)
  const myApplicationPackageId = appliedRows.length > 0 ? appliedRows[0].SP_ID : null;

  return res.json({
    hackathon: {
      id: hk.id,
      title: hk.title,
      slug: hk.slug,
      type: hk.type,
      city: hk.city,
      description: hk.description,
      startDate: hk.startDate,
      registrationDeadline: hk.registrationDeadline,
      org: hk.org,
      branding: extractBranding(hk.brandingRaw),
    },
    tracks: trackRows.map((t) => ({
      id: t.HT_ID,
      name: t.HT_Name,
      description: t.HT_Description,
    })),
    prizes: prizeRows.map((p) => ({
      position: p.HP_Position,
      amount: p.HP_Amount,
      sortOrder: p.HP_SortOrder,
    })),
    packages,
    myApplicationPackageId,
  });
};

export const listMyApplications = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const sponsorId = req.user!.memberId;

  // Two-step query — H_Branding can be a large data URL; sorting on it would
  // blow MySQL's sort_buffer. Sort small columns first, then fetch branding.
  const [rows] = await pool.query<MyApplicationDetailRow[]>(
    `SELECT
       sa.SA_ID              AS applicationId,
       sa.SA_Status          AS status,
       sa.SA_NegotiationStep AS negotiationStep,
       sa.SA_AppliedAt       AS appliedAt,
       sa.SA_PaidAt          AS paidAt,
       sp.SP_ID              AS packageId,
       sp.SP_Name            AS packageName,
       sp.SP_Type            AS packageType,
       sp.SP_Price           AS packagePrice,
       h.hackathon_ID        AS hackathonId,
       h.H_title             AS hackathonTitle,
       h.H_status            AS hackathonStatus,
       h.H_Hackathon_StartDate AS hackathonStartDate
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
      WHERE sa.SM_ID = ?
      ORDER BY sa.SA_AppliedAt DESC`,
    [sponsorId]
  );

  const brandingById = new Map<number, string | null>();
  if (rows.length > 0) {
    const hackathonIds = Array.from(new Set(rows.map((r) => r.hackathonId)));
    const placeholders = hackathonIds.map(() => '?').join(',');
    const [brandingRows] = await pool.query<RowDataPacket[]>(
      `SELECT hackathon_ID, H_Branding FROM hackathon WHERE hackathon_ID IN (${placeholders})`,
      hackathonIds,
    );
    for (const b of brandingRows as Array<{ hackathon_ID: number; H_Branding: string | null }>) {
      brandingById.set(b.hackathon_ID, b.H_Branding ?? null);
    }
  }

  const items = rows.map((r) => ({
    id: r.applicationId,
    status: r.status,
    negotiationStep: r.negotiationStep,
    appliedAt: r.appliedAt,
    paidAt: r.paidAt,
    package: {
      id: r.packageId,
      name: r.packageName,
      type: r.packageType,
      price: r.packagePrice ? Number(r.packagePrice) : null,
    },
    hackathon: {
      id: r.hackathonId,
      title: r.hackathonTitle,
      status: r.hackathonStatus,
      startDate: r.hackathonStartDate,
      branding: extractBranding(brandingById.get(r.hackathonId) ?? null),
    },
  }));

  return res.json({ items });
};

interface InsightOrganizerRow extends RowDataPacket {
  name: string;
  count: number;
}

interface InsightPackageRow extends RowDataPacket {
  name: string;
  count: number;
}

interface InsightStatusRow extends RowDataPacket {
  label: string;
  count: number;
}

export const getMyInsights = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;
  const sponsorId = req.user!.memberId;

  // 1) Most collaborative organizers (number of applications per organizer)
  const [organizers] = await pool.query<InsightOrganizerRow[]>(
    `SELECT op.ORG_Name AS name, COUNT(*) AS count
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
      WHERE sa.SM_ID = ?
      GROUP BY op.ORG_Name
      ORDER BY count DESC
      LIMIT 5`,
    [sponsorId]
  );

  // 2) Most chosen packages
  const [packages] = await pool.query<InsightPackageRow[]>(
    `SELECT sp.SP_Name AS name, COUNT(*) AS count
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
      WHERE sa.SM_ID = ?
      GROUP BY sp.SP_Name
      ORDER BY count DESC
      LIMIT 5`,
    [sponsorId]
  );

  // 3) Status distribution — 4 logical states that progress as the application advances:
  //   pending                  → "قيد المراجعة" / under review (organizer hasn't responded)
  //   accepted + step 0        → "قيد التفاوض" / negotiating (chat only)
  //   accepted + step 1 or 2   → "قيد التنفيذ" / in progress (terms review / signing)
  //   accepted + step 3        → "مكتمل" / completed (both parties signed)
  // rejected exists in the enum but no code path sets it — we keep it as a fallback map only.
  const [statuses] = await pool.query<InsightStatusRow[]>(
    `SELECT
       CASE
         WHEN sa.SA_Status = 'accepted' AND sa.SA_NegotiationStep >= 3 THEN 'مكتمل'
         WHEN sa.SA_Status = 'accepted' AND sa.SA_NegotiationStep >= 1 THEN 'قيد التنفيذ'
         WHEN sa.SA_Status = 'accepted' THEN 'قيد التفاوض'
         WHEN sa.SA_Status = 'pending'  THEN 'قيد المراجعة'
         WHEN sa.SA_Status = 'rejected' THEN 'مرفوض'
         ELSE 'أخرى'
       END AS label,
       COUNT(*) AS count
       FROM sponsor_application sa
      WHERE sa.SM_ID = ?
      GROUP BY label
      ORDER BY count DESC`,
    [sponsorId]
  );

  return res.json({
    organizers: organizers.map((r) => ({
      name: r.name ?? 'المنظم',
      count: Number(r.count),
    })),
    packages: packages.map((r) => ({
      name: r.name,
      count: Number(r.count),
    })),
    statuses: statuses.map((r) => ({
      label: r.label,
      count: Number(r.count),
    })),
  });
};

export const updateMyProfile = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const {
    fullName,
    bio,
    brandName,
    crNumber,
    phone,
    location,
    position,
    industry,
    website,
  } = req.body ?? {};

  // Validate the inputs
  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'الاسم الكامل مطلوب (حرفين على الأقل)' });
  }
  if (bio !== undefined && bio !== null && typeof bio !== 'string') {
    return res.status(400).json({ error: 'النبذة يجب أن تكون نصاً' });
  }
  if (brandName !== undefined && brandName !== null && typeof brandName !== 'string') {
    return res.status(400).json({ error: 'اسم العلامة يجب أن يكون نصاً' });
  }
  if (crNumber !== undefined && crNumber !== null) {
    if (typeof crNumber !== 'string' || !/^\d{10}$/.test(crNumber)) {
      return res.status(400).json({ error: 'رقم السجل التجاري يجب أن يكون 10 أرقام بالضبط' });
    }
  }
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      return res.status(400).json({ error: 'رقم الهاتف يجب أن يكون نصاً' });
    }
    if (phone.trim() && !/^[\d+\-\s()]{5,20}$/.test(phone.trim())) {
      return res.status(400).json({ error: 'رقم الهاتف غير صالح' });
    }
  }
  if (website !== undefined && website !== null && typeof website !== 'string') {
    return res.status(400).json({ error: 'الموقع الإلكتروني يجب أن يكون نصاً' });
  }
  for (const [key, val] of [['location', location], ['position', position], ['industry', industry]] as const) {
    if (val !== undefined && val !== null && typeof val !== 'string') {
      return res.status(400).json({ error: `الحقل ${key} يجب أن يكون نصاً` });
    }
  }

  // Split the first and last name
  const trimmedName = fullName.trim();
  const parts = trimmedName.split(/\s+/);
  const fname = parts.length > 1 ? parts.slice(0, -1).join(' ') : trimmedName;
  const lname = parts.length > 1 ? parts[parts.length - 1] : '';

  const sponsorId = req.user!.memberId;
  const cleanStr = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    return t.length > 0 ? t : null;
  };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE member
          SET M_FName = ?, M_LName = ?, M_Bio = ?, phone = ?, city = ?
        WHERE M_ID = ?`,
      [fname, lname, cleanStr(bio), cleanStr(phone), cleanStr(location), sponsorId]
    );
    await conn.execute(
      `UPDATE sponsor
          SET S_Brand = ?, S_CR_Number = ?, S_Position = ?, S_Industry = ?, S_Website = ?
        WHERE SM_ID = ?`,
      [
        cleanStr(brandName),
        cleanStr(crNumber),
        cleanStr(position),
        cleanStr(industry),
        cleanStr(website),
        sponsorId,
      ]
    );
    await conn.commit();

    // Return the full data after saving
    const [rows] = await pool.query<SponsorProfileRow[]>(
      `SELECT m.M_ID, m.M_Email, m.M_FName, m.M_LName, m.M_Bio,
              m.phone, m.city, m.avatar_url,
              s.S_Brand, s.S_CR_Number, s.S_Position, s.S_Industry,
              s.S_Website, s.S_Banner
         FROM member m
         JOIN sponsor s ON s.SM_ID = m.M_ID
        WHERE m.M_ID = ?`,
      [sponsorId]
    );
    const r = rows[0];
    return res.json({
      id: r.M_ID,
      email: r.M_Email,
      firstName: r.M_FName,
      lastName: r.M_LName,
      fullName: `${r.M_FName} ${r.M_LName}`.trim(),
      bio: r.M_Bio,
      phone: r.phone,
      location: r.city,
      avatar: r.avatar_url,
      joinedAt: null,
      brandName: r.S_Brand,
      crNumber: r.S_CR_Number,
      position: r.S_Position,
      industry: r.S_Industry,
      website: r.S_Website,
      banner: r.S_Banner,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[updateMyProfile] error:', err);
    return res.status(500).json({ error: 'تعذّر تحديث الملف، حاول لاحقاً' });
  } finally {
    conn.release();
  }
};

export const listMyConversations = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const sponsorId = req.user!.memberId;

  // Each conversation = an application. An active application (pending or accepted) is an active conversation.
  // We add the last actual message + its time as subqueries so the sidebar list shows
  // what's really happening in the chat instead of static text tied to the application status.
  const [rows] = await pool.query<MyConversationRow[]>(
    `SELECT
       sa.SA_ID                AS applicationId,
       sa.SA_Status            AS status,
       sa.SA_NegotiationStep   AS negotiationStep,
       sa.SA_AppliedAt         AS appliedAt,
       sa.SA_SponsorSignedAt   AS sponsorSignedAt,
       sp.SP_ID                AS packageId,
       sp.SP_Name              AS packageName,
       sp.SP_Type              AS packageType,
       sp.SP_Price             AS packagePrice,
       h.hackathon_ID          AS hackathonId,
       h.H_title               AS hackathonTitle,
       h.H_Hackathon_StartDate AS hackathonStartDate,
       op.ORG_Name             AS organizerName,
       (SELECT m.SAM_Text     FROM sponsor_application_message m
          WHERE m.SA_ID = sa.SA_ID ORDER BY m.SAM_CreatedAt DESC LIMIT 1) AS lastMessageText,
       (SELECT m.SAM_FileName FROM sponsor_application_message m
          WHERE m.SA_ID = sa.SA_ID ORDER BY m.SAM_CreatedAt DESC LIMIT 1) AS lastMessageFileName,
       (SELECT m.SAM_IsSystem FROM sponsor_application_message m
          WHERE m.SA_ID = sa.SA_ID ORDER BY m.SAM_CreatedAt DESC LIMIT 1) AS lastMessageIsSystem,
       (SELECT m.SAM_CreatedAt FROM sponsor_application_message m
          WHERE m.SA_ID = sa.SA_ID ORDER BY m.SAM_CreatedAt DESC LIMIT 1) AS lastMessageAt
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
      WHERE sa.SM_ID = ?
      ORDER BY COALESCE((SELECT MAX(m.SAM_CreatedAt) FROM sponsor_application_message m
                          WHERE m.SA_ID = sa.SA_ID), sa.SA_AppliedAt) DESC`,
    [sponsorId]
  );

  const items = rows.map((r) => ({
    id: r.applicationId,
    status: r.status,
    appliedAt: r.appliedAt,
    currentStep: r.negotiationStep,
    sponsorSignedAt: r.sponsorSignedAt,
    lastMessageText: r.lastMessageText ?? null,
    lastMessageFileName: r.lastMessageFileName ?? null,
    lastMessageIsSystem: Number(r.lastMessageIsSystem ?? 0) === 1,
    lastMessageAt: r.lastMessageAt ?? null,
    hackathon: {
      id: r.hackathonId,
      title: r.hackathonTitle,
      startDate: r.hackathonStartDate,
    },
    package: {
      id: r.packageId,
      name: r.packageName,
      type: r.packageType,
      price: r.packagePrice ? Number(r.packagePrice) : null,
    },
    organizer: { name: r.organizerName ?? 'المنظم' },
  }));

  return res.json({ items });
};

export const listMyPayments = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const sponsorId = req.user!.memberId;

  // The sponsor's payments = only their accepted applications (status='accepted')
  const [rows] = await pool.query<MyPaymentRow[]>(
    `SELECT
       sa.SA_ID         AS applicationId,
       sa.SA_AppliedAt  AS appliedAt,
       sa.SA_Status     AS acceptedStatus,
       sa.SA_PaidAt     AS paidAt,
       sp.SP_ID         AS packageId,
       sp.SP_Name       AS packageName,
       sp.SP_Price      AS packagePrice,
       h.hackathon_ID   AS hackathonId,
       h.H_title        AS hackathonTitle
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
      WHERE sa.SM_ID = ? AND sa.SA_Status = 'accepted'
      ORDER BY sa.SA_AppliedAt DESC`,
    [sponsorId]
  );

  const items = rows.map((r) => {
    const amount = r.packagePrice ? Number(r.packagePrice) : 0;
    return {
      id: r.applicationId,
      amount,
      currency: 'SAR',
      invoiceDate: r.appliedAt,
      paidAt: r.paidAt,
      status: (r.paidAt ? 'paid' : 'pending') as 'pending' | 'paid',
      hackathon: { id: r.hackathonId, title: r.hackathonTitle },
      package: { id: r.packageId, name: r.packageName },
    };
  });

  // Totals
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const paidAmount = items
    .filter((it) => it.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  return res.json({
    items,
    summary: {
      totalAmount,
      paidAmount,
      pendingAmount,
      invoicesCount: items.length,
      paidCount: items.filter((it) => it.status === 'paid').length,
      pendingCount: items.filter((it) => it.status === 'pending').length,
    },
  });
};

export const listMyContracts = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const sponsorId = req.user!.memberId;

  // Contracts = applications that actually reached the digital-contract phase.
  // We require SA_NegotiationStep >= 2, i.e. after the sponsor approved the terms
  // and the phase moved to "digital contract". Applications still in chat (step 0) or in
  // terms review (step 1) aren't considered contracts yet — they stay in the ongoing
  // sponsorships list only, so the sponsor isn't confused by "contracts awaiting signature"
  // for applications that haven't actually been negotiated.
  // Derived status (3 phases):
  //  - "ساري" (live)              : both parties signed (step >= 3)
  //  - "في انتظار التوقيع" (awaiting signature) : step 2 (sponsor approved the terms and the signing phase opened)
  //  - "قيد المراجعة" (under review)      : step 1 (organizer sent the terms, sponsor hasn't approved yet)
  // The wording is unified with SponsorSponsorships.tsx and the stats card so the same label appears everywhere.
  const [rows] = await pool.query<MyContractRow[]>(
    `SELECT
       sa.SA_ID                AS contractId,
       sa.SA_NegotiationStep   AS negotiationStep,
       sa.SA_PaidAt            AS paidAt,
       sa.SA_AppliedAt         AS appliedAt,
       sa.SA_SponsorSignedAt   AS sponsorSignedAt,
       sa.SA_OrganizerSigned   AS organizerSigned,
       sa.SA_OrganizerSignedAt AS organizerSignedAt,
       sa.SA_ReceiptFile       AS receiptFile,
       sp.SP_Name              AS packageName,
       sp.SP_Type              AS packageType,
       sp.SP_Price             AS packagePrice,
       h.hackathon_ID          AS hackathonId,
       h.H_title               AS hackathonTitle,
       h.H_Hackathon_StartDate AS hackathonStartDate,
       op.ORG_Name             AS organizerName
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
      WHERE sa.SM_ID = ? AND sa.SA_Status = 'accepted'
        AND sa.SA_NegotiationStep >= 1
      ORDER BY sa.SA_AppliedAt DESC`,
    [sponsorId]
  );

  const items = rows.map((r) => {
    const sponsorSigned = r.negotiationStep >= 3;
    const status: 'ساري' | 'في انتظار التوقيع' | 'قيد المراجعة' =
      r.negotiationStep >= 3
        ? 'ساري'
        : r.negotiationStep >= 2
          ? 'في انتظار التوقيع'
          : 'قيد المراجعة';

    return {
      id: r.contractId,
      status,
      signed: sponsorSigned,
      sponsorSigned,
      organizerSigned: r.organizerSigned === 1,
      negotiationStep: r.negotiationStep,
      package: {
        name: r.packageName,
        type: r.packageType,
        price: r.packagePrice ? Number(r.packagePrice) : null,
      },
      hackathon: {
        id: r.hackathonId,
        title: r.hackathonTitle,
        startDate: r.hackathonStartDate,
      },
      organizer: { name: r.organizerName ?? 'المنظم' },
      signDate: r.sponsorSignedAt,
      organizerSignedAt: r.organizerSignedAt,
      receiptFile: r.receiptFile,
      appliedAt: r.appliedAt,
    };
  });

  return res.json({ items });
};

export const uploadAvatar = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم إرفاق صورة' });
  }
  try {
    await pool.execute(
      'UPDATE member SET avatar_url = ? WHERE M_ID = ?',
      [req.file.filename, req.user!.memberId]
    );
    return res.json({ avatar: req.file.filename });
  } catch (err) {
    console.error('[uploadAvatar] error:', err);
    return res.status(500).json({ error: 'تعذّر رفع الصورة، حاول لاحقاً' });
  }
};

export const uploadBanner = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم إرفاق صورة' });
  }
  try {
    await pool.execute(
      'UPDATE sponsor SET S_Banner = ? WHERE SM_ID = ?',
      [req.file.filename, req.user!.memberId]
    );
    return res.json({ banner: req.file.filename });
  } catch (err) {
    console.error('[uploadBanner] error:', err);
    return res.status(500).json({ error: 'تعذّر رفع البنر، حاول لاحقاً' });
  }
};

/**
 * Ensures the current user is a party to the application (the owning sponsor or the organizer who owns the hackathon).
 * Returns true if allowed; sends an error and returns false if not.
 */
async function ensureChatParticipant(
  req: Request,
  res: Response,
  applicationId: number,
): Promise<{ allowed: boolean; sponsorId?: number; isOrganizerSide?: boolean }> {
  if (!req.user) {
    res.status(401).json({ error: 'unauthenticated' });
    return { allowed: false };
  }
  interface ChatGuardRow extends RowDataPacket {
    SM_ID: number;
    HAM_ID: number;
    hackathon_ID: number;
  }
  const [rows] = await pool.query<ChatGuardRow[]>(
    `SELECT sa.SM_ID, h.HAM_ID, h.hackathon_ID
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
      WHERE sa.SA_ID = ?`,
    [applicationId],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'التقديم غير موجود' });
    return { allowed: false };
  }
  const { SM_ID, HAM_ID, hackathon_ID } = rows[0];
  const me = req.user.memberId;

  // The sponsor on the application is always allowed.
  if (me === SM_ID) {
    return { allowed: true, sponsorId: SM_ID, isOrganizerSide: false };
  }
  // Owner is always allowed and counts as the organizer side.
  if (me === HAM_ID) {
    return { allowed: true, sponsorId: SM_ID, isOrganizerSide: true };
  }
  // Co-manager assigned to the 'sponsors' section of this hackathon also counts
  // as the organizer side. Mirrors the registrations/projects section pattern
  // in hackathon.controller.ts.
  const [hcmRows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM hackathon_co_manager
      WHERE hackathon_ID = ?
        AND M_ID = ?
        AND HCM_InviteStatus = 'accepted'
        AND HCM_Section = 'sponsors'
      LIMIT 1`,
    [hackathon_ID, me],
  );
  if (hcmRows.length > 0) {
    return { allowed: true, sponsorId: SM_ID, isOrganizerSide: true };
  }

  res.status(403).json({ error: 'لا تملك صلاحية الوصول لهذه المحادثة' });
  return { allowed: false };
}

export const listApplicationMessages = async (req: Request, res: Response) => {
  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }
  const guard = await ensureChatParticipant(req, res, applicationId);
  if (!guard.allowed) return;

  try {
    const [rows] = await pool.query<ChatMessageRow[]>(
      `SELECT
         msg.SAM_ID        AS id,
         msg.M_ID          AS senderId,
         m.M_Type          AS senderType,
         CONCAT_WS(' ', m.M_FName, m.M_LName) AS senderName,
         msg.SAM_Text      AS text,
         msg.SAM_FileName  AS fileName,
         msg.SAM_FileUrl   AS fileUrl,
         msg.SAM_FileSize  AS fileSize,
         msg.SAM_MimeType  AS mimeType,
         msg.SAM_IsSystem  AS isSystem,
         msg.SAM_CreatedAt AS createdAt
         FROM sponsor_application_message msg
         JOIN member m ON m.M_ID = msg.M_ID
        WHERE msg.SA_ID = ?
        ORDER BY msg.SAM_CreatedAt ASC, msg.SAM_ID ASC`,
      [applicationId],
    );
    return res.json({ items: rows });
  } catch (err) {
    console.error('[listApplicationMessages] error:', err);
    return res.status(500).json({ error: 'تعذّر جلب الرسائل' });
  }
};

export const sendApplicationMessage = async (req: Request, res: Response) => {
  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }
  const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  const text = rawText.length > 0 ? rawText : null;
  const file = req.file;

  if (!text && !file) {
    return res.status(400).json({ error: 'يجب إرفاق نص أو ملف' });
  }
  if (text && text.length > 2000) {
    return res.status(400).json({ error: 'الرسالة طويلة جداً (الحد 2000 حرف)' });
  }
  const guard = await ensureChatParticipant(req, res, applicationId);
  if (!guard.allowed) return;

  const fileName = file?.originalname ?? null;
  const fileUrl = file ? `/uploads/chat/${file.filename}` : null;
  const fileSize = file?.size ?? null;
  const mimeType = file?.mimetype ?? null;

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sponsor_application_message
         (SA_ID, M_ID, SAM_Text, SAM_FileName, SAM_FileUrl, SAM_FileSize, SAM_MimeType, SAM_IsSystem)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [applicationId, req.user!.memberId, text, fileName, fileUrl, fileSize, mimeType],
    );

    // Notify the OTHER party that a new chat message arrived. To avoid spamming
    // the organizer with one notification per typed line, we dedupe: skip insert
    // if an unread chat notification already exists for this conversation.
    try {
      const senderIsSponsor = req.user!.memberId === guard.sponsorId;
      interface ChatNotifInfoRow extends RowDataPacket {
        HAM_ID: number;
        SM_ID: number;
        H_title: string;
        hackathonId: number;
        sponsorName: string;
      }
      const [infoRows] = await pool.query<ChatNotifInfoRow[]>(
        `SELECT h.HAM_ID, sa.SM_ID, h.H_title, h.hackathon_ID AS hackathonId,
                COALESCE(s.S_Brand, CONCAT_WS(' ', m.M_FName, m.M_LName)) AS sponsorName
           FROM sponsor_application sa
           JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
           JOIN hackathon h        ON h.hackathon_ID = sp.hackathon_ID
           JOIN member m           ON m.M_ID = sa.SM_ID
           LEFT JOIN sponsor s     ON s.SM_ID = m.M_ID
          WHERE sa.SA_ID = ?`,
        [applicationId],
      );
      if (infoRows.length > 0) {
        const info = infoRows[0];
        const recipientId = senderIsSponsor ? info.HAM_ID : info.SM_ID;
        const actionRoute = senderIsSponsor
          ? `/admin/hackathon/${info.hackathonId}/sponsors?app=${applicationId}`
          : `/sponsor/messages?app=${applicationId}`;
        const [dupe] = await pool.query<RowDataPacket[]>(
          `SELECT 1 FROM notification
            WHERE M_ID = ? AND N_ActionRoute = ? AND N_Read = 0 LIMIT 1`,
          [recipientId, actionRoute],
        );
        if (dupe.length === 0) {
          await notifySponsorEvent(
            recipientId,
            senderIsSponsor ? `رسالة جديدة من ${info.sponsorName}` : `رسالة جديدة من المنظم`,
            senderIsSponsor
              ? `رسالة جديدة بخصوص رعاية هاكاثون "${info.H_title}".`
              : `رسالة جديدة بخصوص هاكاثون "${info.H_title}".`,
            'فتح المحادثة',
            actionRoute,
          );
        }
      }
    } catch (notifErr) {
      console.error('[sendApplicationMessage] notification failed:', notifErr);
    }

    return res.status(201).json({
      id: result.insertId,
      senderId: req.user!.memberId,
      text,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      isSystem: 0,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[sendApplicationMessage] error:', err);
    return res.status(500).json({ error: 'تعذّر إرسال الرسالة' });
  }
};

// ─── Contract terms + signing ────────────────────────────────────────────────
// Contract flow after the chat negotiation:
//   1. The organizer writes the terms and sends them (PUT terms → step 1, SA_TermsSubmittedAt = NOW)
//   2. The sponsor reviews them
//   3. Each party signs digitally (POST sign)
//      - organizer signs: SA_OrganizerSigned=1, step→2
//      - sponsor signs: SA_SponsorSigned=1
//      - when both sign: step→4 (completed) — the contract is ready and shows on both
//        parties' contracts page.
//
// We use the existing ensureChatParticipant guard — it accepts the sponsor
// (SM_ID === me) or the organizer (HAM_ID === me). The functions inside each endpoint check
// the role before any sensitive action (writing terms = organizer only).

interface ContractRow extends RowDataPacket {
  applicationId: number;
  status: 'pending' | 'accepted' | 'rejected';
  negotiationStep: number;
  termDuration: string | null;
  termValue: string | null;
  termLogoRights: string | null;
  termDisplayTime: string | null;
  termDataAccess: string | null;
  termNotes: string | null;
  termsSubmittedAt: Date | null;
  sponsorAcceptedTerms: number;
  sponsorAcceptedTermsAt: Date | null;
  organizerSigned: number;
  organizerSignedAt: Date | null;
  sponsorSigned: number;
  sponsorSignedAt: Date | null;
  hackathonTitle: string;
  packageName: string;
  packagePrice: string | null;
  sponsorBrand: string | null;
  sponsorFName: string;
  sponsorLName: string;
  organizerName: string | null;
  hamId: number;
  smId: number;
  hackathonId: number;
}

async function loadContract(applicationId: number): Promise<ContractRow | null> {
  const [rows] = await pool.query<ContractRow[]>(
    `SELECT
       sa.SA_ID AS applicationId,
       sa.SA_Status AS status,
       sa.SA_NegotiationStep AS negotiationStep,
       sa.SA_TermDuration AS termDuration,
       sa.SA_TermValue AS termValue,
       sa.SA_TermLogoRights AS termLogoRights,
       sa.SA_TermDisplayTime AS termDisplayTime,
       sa.SA_TermDataAccess AS termDataAccess,
       sa.SA_TermNotes AS termNotes,
       sa.SA_TermsSubmittedAt AS termsSubmittedAt,
       sa.SA_SponsorAcceptedTerms AS sponsorAcceptedTerms,
       sa.SA_SponsorAcceptedTermsAt AS sponsorAcceptedTermsAt,
       sa.SA_OrganizerSigned AS organizerSigned,
       sa.SA_OrganizerSignedAt AS organizerSignedAt,
       sa.SA_SponsorSigned AS sponsorSigned,
       sa.SA_SponsorSignedAt AS sponsorSignedAt,
       h.H_title AS hackathonTitle,
       sp.SP_Name AS packageName,
       sp.SP_Price AS packagePrice,
       s.S_Brand AS sponsorBrand,
       m.M_FName AS sponsorFName,
       m.M_LName AS sponsorLName,
       -- نفضّل اسم المنظمة (مثل "جامعة الملك عبدالعزيز")؛ لو ما عبّاه المنظم
       -- نرجع لاسم العضو الكامل (First + Last). الـ COALESCE يضمن قيمة.
       COALESCE(op.ORG_Name, CONCAT_WS(' ', org.M_FName, org.M_LName)) AS organizerName,
       h.HAM_ID AS hamId,
       sa.SM_ID AS smId,
       h.hackathon_ID AS hackathonId
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
       JOIN sponsor s ON s.SM_ID = sa.SM_ID
       JOIN member m ON m.M_ID = sa.SM_ID
       LEFT JOIN member org ON org.M_ID = h.HAM_ID
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
      WHERE sa.SA_ID = ?`,
    [applicationId],
  );
  return rows[0] ?? null;
}

async function notifySponsorEvent(
  recipientId: number,
  title: string,
  message: string,
  actionLabel: string,
  actionRoute: string,
): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO notification
         (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute)
       VALUES (?, 'system', ?, ?, ?, ?)`,
      [recipientId, title, message, actionLabel, actionRoute],
    );
  } catch (err) {
    console.error('[notifySponsorEvent] failed to insert notification:', err);
  }
}

/**
 * GET /sponsors/applications/:id/contract
 * Read terms + signature status. Both organizer and sponsor can call.
 */
export const getApplicationContract = async (req: Request, res: Response) => {
  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }
  const guard = await ensureChatParticipant(req, res, applicationId);
  if (!guard.allowed) return;

  const c = await loadContract(applicationId);
  if (!c) return res.status(404).json({ error: 'التقديم غير موجود' });

  return res.json({
    applicationId: c.applicationId,
    status: c.status,
    negotiationStep: c.negotiationStep,
    terms: {
      duration: c.termDuration,
      value: c.termValue,
      logoRights: c.termLogoRights,
      displayTime: c.termDisplayTime,
      dataAccess: c.termDataAccess,
      notes: c.termNotes,
      submittedAt: c.termsSubmittedAt,
    },
    acceptance: {
      sponsorAccepted: c.sponsorAcceptedTerms === 1,
      sponsorAcceptedAt: c.sponsorAcceptedTermsAt,
    },
    signatures: {
      organizerSigned: c.organizerSigned === 1,
      organizerSignedAt: c.organizerSignedAt,
      sponsorSigned: c.sponsorSigned === 1,
      sponsorSignedAt: c.sponsorSignedAt,
    },
    parties: {
      hackathonTitle: c.hackathonTitle,
      packageName: c.packageName,
      packagePrice: c.packagePrice,
      sponsorName: c.sponsorBrand || `${c.sponsorFName} ${c.sponsorLName}`.trim(),
      organizerName: c.organizerName ?? '—',
    },
  });
};

/**
 * PUT /sponsors/applications/:id/contract   (organizer-only)
 * Body: { duration?, value?, logoRights?, displayTime?, dataAccess?, notes? }
 * Saves the terms and raises the phase to 1 (terms review) + records the submission time.
 * Allowed only if the phase <= 2 and no party has signed (to prevent edits after signing).
 */
export const saveContractTerms = async (req: Request, res: Response) => {
  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }
  const guard = await ensureChatParticipant(req, res, applicationId);
  if (!guard.allowed) return;

  const c = await loadContract(applicationId);
  if (!c) return res.status(404).json({ error: 'التقديم غير موجود' });

  // Writing the terms is the organizer's responsibility — includes the owner and the sponsors-section manager
  // (guard.isOrganizerSide is set by ensureChatParticipant).
  if (!guard.isOrganizerSide) {
    return res.status(403).json({ error: 'كتابة الشروط من اختصاص المنظم فقط' });
  }
  if (c.status !== 'accepted') {
    return res.status(409).json({ error: 'يجب قبول طلب الرعاية أولاً قبل تحرير الشروط' });
  }
  // Editing is allowed as long as the sponsor hasn't approved the terms yet. Once they approve
  // (SA_SponsorAcceptedTerms=1), the terms are locked.
  if (c.sponsorAcceptedTerms === 1) {
    return res.status(409).json({ error: 'لا يمكن تعديل الشروط بعد موافقة الراعي عليها' });
  }
  if (c.organizerSigned === 1 || c.sponsorSigned === 1) {
    return res.status(409).json({ error: 'لا يمكن تعديل الشروط بعد بدء التوقيع' });
  }

  const body = req.body ?? {};
  const norm = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const duration = norm(body.duration);
  const value = norm(body.value);
  const logoRights = norm(body.logoRights);
  const displayTime = norm(body.displayTime);
  const dataAccess = norm(body.dataAccess);
  const notes = norm(body.notes);

  // The phase after sending the terms: 1 (sponsor review). Moving to 2 (the digital
  // contract) happens later after the sponsor accepts via /accept-terms.
  const newStep = 1;

  try {
    await pool.execute(
      `UPDATE sponsor_application
          SET SA_TermDuration = ?, SA_TermValue = ?, SA_TermLogoRights = ?,
              SA_TermDisplayTime = ?, SA_TermDataAccess = ?, SA_TermNotes = ?,
              SA_TermsSubmittedAt = NOW(), SA_NegotiationStep = ?
        WHERE SA_ID = ?`,
      [duration, value, logoRights, displayTime, dataAccess, notes, newStep, applicationId],
    );
    // Notify the sponsor that the contract terms have arrived for review
    await notifySponsorEvent(
      c.smId,
      'وصلتك شروط عقد الرعاية',
      `أرسل المنظم شروط عقد الرعاية لـ "${c.hackathonTitle}" — راجعها ووافق عليها للانتقال لخطوة التوقيع.`,
      'مراجعة الشروط',
      '/sponsor/messages',
    );
    return res.json({ ok: true, negotiationStep: newStep });
  } catch (err) {
    console.error('[saveContractTerms] error:', err);
    return res.status(500).json({ error: 'تعذّر حفظ الشروط' });
  }
};

/**
 * POST /sponsors/applications/:id/accept-terms   (sponsor-only)
 * The sponsor approves the sent terms. After approval:
 *   - SA_SponsorAcceptedTerms = 1
 *   - The phase rises to 2 (the digital contract) — signing becomes available to both parties
 *   - The terms are locked (the organizer can't edit them after this)
 */
export const acceptContractTerms = async (req: Request, res: Response) => {
  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }
  const guard = await ensureChatParticipant(req, res, applicationId);
  if (!guard.allowed) return;

  const c = await loadContract(applicationId);
  if (!c) return res.status(404).json({ error: 'التقديم غير موجود' });

  if (req.user!.memberId !== c.smId) {
    return res.status(403).json({ error: 'القبول من اختصاص الراعي فقط' });
  }
  if (!c.termsSubmittedAt) {
    return res.status(409).json({ error: 'لا توجد شروط مرسلة بعد للموافقة عليها' });
  }
  if (c.sponsorAcceptedTerms === 1) {
    return res.status(409).json({ error: 'سبق وأن وافقت على الشروط' });
  }

  try {
    await pool.execute(
      `UPDATE sponsor_application
          SET SA_SponsorAcceptedTerms = 1, SA_SponsorAcceptedTermsAt = NOW(),
              SA_NegotiationStep = 2
        WHERE SA_ID = ?`,
      [applicationId],
    );
    // Notify the organizer that the sponsor approved the terms
    await notifySponsorEvent(
      c.hamId,
      'وافق الراعي على الشروط',
      `وافق "${c.sponsorBrand || `${c.sponsorFName} ${c.sponsorLName}`.trim()}" على شروط عقد الرعاية. يمكنك الآن توقيع العقد رقمياً.`,
      'فتح العقد',
      `/admin/hackathon/${c.hackathonId}/sponsors`,
    );
    return res.json({ ok: true, negotiationStep: 2 });
  } catch (err) {
    console.error('[acceptContractTerms] error:', err);
    return res.status(500).json({ error: 'تعذّر تسجيل الموافقة' });
  }
};

/**
 * POST /sponsors/applications/:id/sign   (organizer or sponsor)
 * Signs on behalf of the current party according to their role. Rules:
 *   - No signing before the terms are sent (SA_TermsSubmittedAt must not be NULL)
 *   - The organizer signs first (raises the phase to 2 — the digital contract)
 *   - The sponsor signs after the organizer; when both sign, the phase → 4 (completed)
 */
export const signContract = async (req: Request, res: Response) => {
  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }
  const guard = await ensureChatParticipant(req, res, applicationId);
  if (!guard.allowed) return;

  const c = await loadContract(applicationId);
  if (!c) return res.status(404).json({ error: 'التقديم غير موجود' });

  if (c.status !== 'accepted') {
    return res.status(409).json({ error: 'يجب قبول الطلب أولاً قبل التوقيع' });
  }
  if (!c.termsSubmittedAt) {
    return res.status(409).json({ error: 'لا يمكن التوقيع قبل إرسال الشروط من المنظم' });
  }
  if (c.sponsorAcceptedTerms !== 1) {
    return res.status(409).json({ error: 'لا يمكن التوقيع قبل موافقة الراعي على الشروط' });
  }

  const me = req.user!.memberId;
  // Organizer side = the hackathon owner OR a co-manager assigned to the
  // 'sponsors' section. ensureChatParticipant already validated this.
  const isOrganizer = guard.isOrganizerSide === true;
  const isSponsor = me === c.smId;

  try {
    if (isOrganizer) {
      if (c.organizerSigned === 1) {
        return res.status(409).json({ error: 'سبق ووقّعت العقد' });
      }
      // Organizer signs: raises the phase to at least 2
      const newStep = Math.max(2, c.negotiationStep);
      const finalStep = c.sponsorSigned === 1 ? 3 : newStep;
      await pool.execute(
        `UPDATE sponsor_application
            SET SA_OrganizerSigned = 1, SA_OrganizerSignedAt = NOW(),
                SA_NegotiationStep = ?
          WHERE SA_ID = ?`,
        [finalStep, applicationId],
      );
      // Notify the sponsor that the organizer signed — it's their turn to sign
      await notifySponsorEvent(
        c.smId,
        'وقّع المنظم العقد',
        `وقّع "${c.organizerName ?? 'المنظم'}" عقد رعاية "${c.hackathonTitle}" رقمياً. جاء دورك للتوقيع لإكمال الإجراءات.`,
        'توقيع العقد',
        '/sponsor/messages',
      );
      return res.json({ ok: true, signedBy: 'ORGANIZER', negotiationStep: finalStep });
    }

    if (isSponsor) {
      if (c.sponsorSigned === 1) {
        return res.status(409).json({ error: 'سبق ووقّعت العقد' });
      }
      if (c.organizerSigned !== 1) {
        return res.status(409).json({ error: 'لا يمكنك التوقيع قبل توقيع المنظم' });
      }
      // The sponsor signs after the organizer → the contract is complete (step 3 after merging
      // Ruba's migration 030, which reduced the phases from 5 to 4).
      await pool.execute(
        `UPDATE sponsor_application
            SET SA_SponsorSigned = 1, SA_SponsorSignedAt = NOW(),
                SA_NegotiationStep = 3
          WHERE SA_ID = ?`,
        [applicationId],
      );
      // Notify the organizer that the sponsor signed — the contract is live
      await notifySponsorEvent(
        c.hamId,
        'وقّع الراعي العقد — العقد ساري',
        `وقّع "${c.sponsorBrand || `${c.sponsorFName} ${c.sponsorLName}`.trim()}" عقد رعاية "${c.hackathonTitle}" رقمياً. العقد ساري وموثّق من الطرفين.`,
        'عرض العقد',
        `/admin/hackathon/${c.hackathonId}/sponsors`,
      );
      return res.json({ ok: true, signedBy: 'SPONSOR', negotiationStep: 3 });
    }

    return res.status(403).json({ error: 'لا تملك صلاحية التوقيع على هذا العقد' });
  } catch (err) {
    console.error('[signContract] error:', err);
    return res.status(500).json({ error: 'تعذّر تسجيل التوقيع' });
  }
};

export const applyToPackage = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  // 1) Validate the input
  const validation = validatePackageId(req.body?.packageId);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }
  const packageId = validation.value;
  const sponsorId = req.user!.memberId;
  try {
    // 2) Verify the package actually exists + get the hackathon_ID
    const [packageRows] = await pool.query<PackageExistsRow[]>(
      'SELECT SP_ID, hackathon_ID FROM sponsor_package WHERE SP_ID = ?',
      [packageId]
    );
    if (packageRows.length === 0) {
      return res.status(404).json({ error: 'الباقة غير موجودة' });
    }
    const hackathonId = packageRows[0].hackathon_ID;

    // 3) Business rule: one sponsor = one package per hackathon
    const [existing] = await pool.query<ExistingApplicationRow[]>(
      `SELECT sa.SA_ID, sp.SP_Name
         FROM sponsor_application sa
         JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
        WHERE sa.SM_ID = ? AND sp.hackathon_ID = ?
        LIMIT 1`,
      [sponsorId, hackathonId]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: `لا يمكنك التقديم على أكثر من باقة في نفس الهاكاثون. سبق وقدّمت على "${existing[0].SP_Name}".`,
      });
    }

    // 4) Add the application — the UNIQUE KEY prevents duplicates on the same package automatically
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sponsor_application (SM_ID, SP_ID, SA_Status)
       VALUES (?, ?, 'pending')`,
      [sponsorId, packageId]
    );

    // 5) Notify the organizer that a new sponsorship request arrived
    interface NotifyApplyRow extends RowDataPacket {
      HAM_ID: number;
      H_title: string;
      SP_Name: string;
      sponsorName: string;
    }
    const [infoRows] = await pool.query<NotifyApplyRow[]>(
      `SELECT h.HAM_ID, h.H_title, sp.SP_Name,
              COALESCE(s.S_Brand, CONCAT_WS(' ', m.M_FName, m.M_LName)) AS sponsorName
         FROM sponsor_package sp
         JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
         JOIN member m ON m.M_ID = ?
         LEFT JOIN sponsor s ON s.SM_ID = m.M_ID
        WHERE sp.SP_ID = ?`,
      [sponsorId, packageId],
    );
    if (infoRows.length > 0) {
      const info = infoRows[0];
      await notifySponsorEvent(
        info.HAM_ID,
        'طلب رعاية جديد',
        `طلب رعاية من "${info.sponsorName}" لباقة "${info.SP_Name}" في هاكاثون "${info.H_title}".`,
        'عرض الطلب',
        `/admin/hackathon/${hackathonId}/sponsors`,
      );
    }

    return res.status(201).json({
      id: result.insertId,
      sponsorId,
      packageId,
      hackathonId,
      status: 'pending',
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'سبق وقدّمت على هذه الباقة' });
    }
    console.error('[applyToPackage] error:', err);
    return res.status(500).json({ error: 'تعذّر إتمام التقديم، حاول لاحقاً' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// In-platform notifications for the sponsor
// Reads from the same `notification` table the organizer reads from. Sponsor's
// notifications are written by event-driven triggers (terms received, organizer
// signed, new chat message, etc.) via notifySponsorEvent() throughout this file.
// ═════════════════════════════════════════════════════════════════════════════

interface SponsorNotificationRow extends RowDataPacket {
  N_ID: number;
  N_Type: string;
  N_Title: string;
  N_Message: string;
  N_Read: number;
  N_ActionLabel: string | null;
  N_ActionRoute: string | null;
  N_CreatedAt: Date | string;
}

export const listNotifications = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;
  const memberId = req.user!.memberId;
  try {
    const [rows] = await pool.query<SponsorNotificationRow[]>(
      `SELECT N_ID, N_Type, N_Title, N_Message, N_Read, N_ActionLabel, N_ActionRoute, N_CreatedAt
         FROM notification
        WHERE M_ID = ?
        ORDER BY N_CreatedAt DESC
        LIMIT 100`,
      [memberId],
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
  } catch (err) {
    console.error('[sponsor.listNotifications] error:', err);
    return res.status(500).json({ error: 'تعذّر تحميل الإشعارات' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الإشعار غير صالح' });
  }
  const memberId = req.user!.memberId;
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE notification SET N_Read = 1 WHERE N_ID = ? AND M_ID = ?',
    [id, memberId],
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'الإشعار غير موجود' });
  }
  return res.status(204).send();
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;
  const memberId = req.user!.memberId;
  await pool.execute(
    'UPDATE notification SET N_Read = 1 WHERE M_ID = ? AND N_Read = 0',
    [memberId],
  );
  return res.status(204).send();
};

export const deleteNotification = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الإشعار غير صالح' });
  }
  const memberId = req.user!.memberId;
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM notification WHERE N_ID = ? AND M_ID = ?',
    [id, memberId],
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'الإشعار غير موجود' });
  }
  return res.status(204).send();
};
