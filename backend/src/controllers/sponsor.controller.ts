import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { extractBranding } from '../lib/branding';

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

interface ApplicationOwnerRow extends RowDataPacket {
  SM_ID: number;
  SA_Status: 'pending' | 'accepted' | 'rejected';
}

interface NegotiationRow extends RowDataPacket {
  SM_ID: number;
  SA_NegotiationStep: number;
  SA_Status: 'pending' | 'accepted' | 'rejected';
}

interface OpportunityDetailHackathonRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
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
  // عمود JSON في قاعدة البيانات: mysql2 يفك التشفير تلقائياً ويرجّع array،
  // لكن في بعض الإصدارات قد يرجّع string. نتعامل مع الحالتين أدناه.
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
  organizerSigned: number;
  organizerSignedAt: Date | null;
  receiptFile: string | null;
}

interface ChatMessageRow extends RowDataPacket {
  id: number;
  senderId: number;
  senderType: 'SPONSOR' | 'ORGANIZER' | 'PARTICIPANT';
  senderName: string;
  text: string;
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
  packageId: number;
  packageName: string;
  hackathonId: number;
  hackathonTitle: string;
  organizerName: string | null;
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
 * يتحقق من إن المستخدم الحالي راعٍ موثّق.
 * يستخدم في كل دوال الراعي لتجنب تكرار الفحص.
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

  // Two-step query — same pattern as participant.listHackathons / listMyRegistered.
  // ORDER BY + H_Branding (large JSON / image data URLs) blows MySQL's sort_buffer
  // once an organizer uploads a banner image, so we sort small columns first and
  // fetch branding in a follow-up IN(...) query.
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

  // زيادة عداد المشاهدات للهاكاثون (fire-and-forget — ما يأثر على الرد لو فشل)
  pool
    .execute('UPDATE hackathon SET H_views = H_views + 1 WHERE hackathon_ID = ?', [id])
    .catch((err) => console.error('[views increment] error:', err));

  // 1) معلومات الهاكاثون الأساسية (مع التخصيص)
  const [hackathonRows] = await pool.query<OpportunityDetailHackathonRow[]>(
    `SELECT
       h.hackathon_ID AS id,
       h.H_title AS title,
       h.H_slug AS slug,
       h.H_type AS type,
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

  // 2) الباقات المتاحة لهذا الهاكاثون
  const [packageRows] = await pool.query<SponsorPackageRow[]>(
    `SELECT SP_ID, SP_Name, SP_Type, SP_Description, SP_Duration,
            SP_Price, SP_Sponsor_Offer, SP_Resources, SP_Benefits
       FROM sponsor_package
      WHERE hackathon_ID = ?
      ORDER BY SP_ID`,
    [id]
  );

  // 3) الباقات اللي قدّمت لها مسبقاً (لإظهار "تم التقديم" بدل زر التقديم)
  const [appliedRows] = await pool.query<MyApplicationRow[]>(
    `SELECT sa.SP_ID
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
      WHERE sa.SM_ID = ? AND sp.hackathon_ID = ?`,
    [sponsorId, id]
  );
  const appliedSet = new Set(appliedRows.map((r) => r.SP_ID));

  // 4) المسارات والجوائز (لعرض أغنى)
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
    // SP_Benefits عمود JSON: mysql2 يرجّعه عادةً array مفكوكة، ونادراً string.
    // نتعامل مع الحالتين: لو array نأخذها مباشرة، ولو string نفك تشفيرها.
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

  // ID لأول باقة قدّم لها الراعي في هذا الهاكاثون (null لو ما قدّم)
  const myApplicationPackageId = appliedRows.length > 0 ? appliedRows[0].SP_ID : null;

  return res.json({
    hackathon: {
      id: hk.id,
      title: hk.title,
      slug: hk.slug,
      type: hk.type,
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

  // 1) أكثر المنظمين تعاوناً (عدد التقديمات لكل منظم)
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

  // 2) أكثر الباقات اختياراً
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

  // 3) توزيع الحالات
  const [statuses] = await pool.query<InsightStatusRow[]>(
    `SELECT
       CASE
         WHEN sa.SA_Status = 'accepted' AND sa.SA_NegotiationStep >= 4 THEN 'مكتمل'
         WHEN sa.SA_Status = 'accepted' THEN 'قيد التفاوض'
         WHEN sa.SA_Status = 'pending' THEN 'قيد التقديم'
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

  // التحقق من المدخلات
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

  // فصل الاسم الأول والأخير
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

    // أرجع البيانات الكاملة بعد الحفظ
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

  // كل محادثة = تقديم. التقديم النشط (pending أو accepted) يكون محادثة فعّالة.
  const [rows] = await pool.query<MyConversationRow[]>(
    `SELECT
       sa.SA_ID              AS applicationId,
       sa.SA_Status          AS status,
       sa.SA_NegotiationStep AS negotiationStep,
       sa.SA_AppliedAt       AS appliedAt,
       sp.SP_ID              AS packageId,
       sp.SP_Name            AS packageName,
       h.hackathon_ID        AS hackathonId,
       h.H_title             AS hackathonTitle,
       op.ORG_Name           AS organizerName
       FROM sponsor_application sa
       JOIN sponsor_package sp ON sp.SP_ID = sa.SP_ID
       JOIN hackathon h ON h.hackathon_ID = sp.hackathon_ID
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
      WHERE sa.SM_ID = ?
      ORDER BY sa.SA_AppliedAt DESC`,
    [sponsorId]
  );

  const items = rows.map((r) => ({
    id: r.applicationId,
    status: r.status,
    appliedAt: r.appliedAt,
    currentStep: r.negotiationStep,
    hackathon: { id: r.hackathonId, title: r.hackathonTitle },
    package: { id: r.packageId, name: r.packageName },
    organizer: { name: r.organizerName ?? 'المنظم' },
  }));

  return res.json({ items });
};

export const listMyPayments = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const sponsorId = req.user!.memberId;

  // مدفوعات الراعي = تقديماته المقبولة فقط (status='accepted')
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

  // الإجماليات
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

  // العقود = التقديمات المقبولة. الحالة المشتقّة:
  //  - "ساري"            : وصل المرحلة 4 (وقّع الراعي + دفع)
  //  - "بانتظار توقيعك" : مقبول لكن الراعي بعدُه ما خلّص المراحل
  // ملحوظة: SA_OrganizerSigned موجود في DB لكن مو مفعّل في الـ UI الحالي
  //         (حتى تُبنى واجهة المنظم)
  const [rows] = await pool.query<MyContractRow[]>(
    `SELECT
       sa.SA_ID                AS contractId,
       sa.SA_NegotiationStep   AS negotiationStep,
       sa.SA_PaidAt            AS paidAt,
       sa.SA_AppliedAt         AS appliedAt,
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
      ORDER BY sa.SA_AppliedAt DESC`,
    [sponsorId]
  );

  const items = rows.map((r) => {
    const sponsorSigned = r.negotiationStep >= 4;
    const status: 'ساري' | 'بانتظار توقيعك' = sponsorSigned ? 'ساري' : 'بانتظار توقيعك';

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
      signDate: r.paidAt,
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
 * يتأكد إن المستخدم الحالي طرف في التقديم (الراعي صاحبه أو المنظم المالك للهاكاثون).
 * يرجع true لو مسموح، يرسل خطأ ويرجع false لو غير مسموح.
 */
async function ensureChatParticipant(
  req: Request,
  res: Response,
  applicationId: number,
): Promise<{ allowed: boolean; sponsorId?: number }> {
  if (!req.user) {
    res.status(401).json({ error: 'unauthenticated' });
    return { allowed: false };
  }
  const [rows] = await pool.query<ApplicationOwnersRow[]>(
    `SELECT sa.SM_ID, h.HAM_ID
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
  const { SM_ID, HAM_ID } = rows[0];
  const me = req.user.memberId;
  if (me !== SM_ID && me !== HAM_ID) {
    res.status(403).json({ error: 'لا تملك صلاحية الوصول لهذه المحادثة' });
    return { allowed: false };
  }
  return { allowed: true, sponsorId: SM_ID };
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
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'نص الرسالة مطلوب' });
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: 'الرسالة طويلة جداً (الحد 2000 حرف)' });
  }
  const guard = await ensureChatParticipant(req, res, applicationId);
  if (!guard.allowed) return;

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sponsor_application_message (SA_ID, M_ID, SAM_Text)
       VALUES (?, ?, ?)`,
      [applicationId, req.user!.memberId, text],
    );
    return res.status(201).json({
      id: result.insertId,
      senderId: req.user!.memberId,
      text,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[sendApplicationMessage] error:', err);
    return res.status(500).json({ error: 'تعذّر إرسال الرسالة' });
  }
};

export const uploadReceipt = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم إرفاق ملف الإيصال' });
  }

  const sponsorId = req.user!.memberId;

  try {
    const [rows] = await pool.query<NegotiationRow[]>(
      'SELECT SM_ID, SA_NegotiationStep, SA_Status FROM sponsor_application WHERE SA_ID = ?',
      [applicationId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'التقديم غير موجود' });
    }
    if (rows[0].SM_ID !== sponsorId) {
      return res.status(403).json({ error: 'لا يحق لكِ رفع إيصال على هذا التقديم' });
    }
    if (rows[0].SA_Status !== 'accepted') {
      return res
        .status(409)
        .json({ error: 'لا يمكنكِ رفع الإيصال قبل قبول طلب الرعاية' });
    }

    await pool.execute(
      `UPDATE sponsor_application
          SET SA_PaidAt = NOW(),
              SA_ReceiptFile = ?,
              SA_NegotiationStep = 4
        WHERE SA_ID = ?`,
      [req.file.filename, applicationId]
    );

    return res.json({
      id: applicationId,
      paidAt: new Date(),
      receiptFile: req.file.filename,
      negotiationStep: 4,
    });
  } catch (err) {
    console.error('[uploadReceipt] error:', err);
    return res.status(500).json({ error: 'تعذّر رفع الإيصال، حاولي لاحقاً' });
  }
};

export const advanceNegotiationStep = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }

  const sponsorId = req.user!.memberId;

  try {
    const [rows] = await pool.query<NegotiationRow[]>(
      'SELECT SM_ID, SA_NegotiationStep, SA_Status FROM sponsor_application WHERE SA_ID = ?',
      [applicationId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'التقديم غير موجود' });
    }
    if (rows[0].SM_ID !== sponsorId) {
      return res.status(403).json({ error: 'لا يحق لكِ تعديل هذا التقديم' });
    }
    if (rows[0].SA_Status === 'rejected') {
      return res.status(409).json({ error: 'لا يمكن إكمال التفاوض على تقديم مرفوض' });
    }

    const currentStep = rows[0].SA_NegotiationStep;
    if (currentStep >= 4) {
      return res.status(409).json({ error: 'وصلتِ إلى المرحلة الأخيرة بالفعل' });
    }

    const nextStep = currentStep + 1;
    await pool.execute(
      'UPDATE sponsor_application SET SA_NegotiationStep = ? WHERE SA_ID = ?',
      [nextStep, applicationId]
    );

    return res.json({ id: applicationId, negotiationStep: nextStep });
  } catch (err) {
    console.error('[advanceNegotiationStep] error:', err);
    return res.status(500).json({ error: 'تعذّر تحديث الخطوة، حاولي لاحقاً' });
  }
};

export const cancelApplication = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'رقم التقديم غير صالح' });
  }

  const sponsorId = req.user!.memberId;

  try {
    const [rows] = await pool.query<ApplicationOwnerRow[]>(
      'SELECT SM_ID, SA_Status FROM sponsor_application WHERE SA_ID = ?',
      [applicationId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'التقديم غير موجود' });
    }
    if (rows[0].SM_ID !== sponsorId) {
      return res.status(403).json({ error: 'لا يحق لك إلغاء هذا التقديم' });
    }

    await pool.execute(
      'DELETE FROM sponsor_application WHERE SA_ID = ?',
      [applicationId]
    );

    return res.json({ id: applicationId, cancelled: true });
  } catch (err) {
    console.error('[cancelApplication] error:', err);
    return res.status(500).json({ error: 'تعذّر إلغاء التقديم، حاول لاحقاً' });
  }
};

export const applyToPackage = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  // 1) تحقق من المدخل
  const rawId = req.body?.packageId;
  const packageId = Number(rawId);
  if (!Number.isInteger(packageId) || packageId <= 0) {
    return res.status(400).json({ error: 'رقم الباقة غير صالح' });
  }

  const sponsorId = req.user!.memberId;

  try {
    // 2) تحقق إن الباقة موجودة فعلاً + احصل على hackathon_ID
    const [packageRows] = await pool.query<PackageExistsRow[]>(
      'SELECT SP_ID, hackathon_ID FROM sponsor_package WHERE SP_ID = ?',
      [packageId]
    );
    if (packageRows.length === 0) {
      return res.status(404).json({ error: 'الباقة غير موجودة' });
    }
    const hackathonId = packageRows[0].hackathon_ID;

    // 3) قيد العمل: راعٍ واحد = باقة واحدة لكل هاكاثون
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

    // 4) أضف التقديم — UNIQUE KEY يمنع التكرار على نفس الباقة تلقائياً
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sponsor_application (SM_ID, SP_ID, SA_Status)
       VALUES (?, ?, 'pending')`,
      [sponsorId, packageId]
    );

    return res.status(201).json({
      id: result.insertId,
      sponsorId,
      packageId,
      hackathonId,
      status: 'pending',
    });
  } catch (err) {
    // 5) معالجة التكرار (نفس الراعي قدّم لنفس الباقة قبل)
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'سبق وقدّمت على هذه الباقة' });
    }
    console.error('[applyToPackage] error:', err);
    return res.status(500).json({ error: 'تعذّر إتمام التقديم، حاول لاحقاً' });
  }
};

