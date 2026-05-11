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
  S_Brand: string | null;
  S_CR_Number: string | null;
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
  brandingRaw: string | null;
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
  SP_Benefits: string | null;
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

interface MyApplicationDetailRow extends RowDataPacket {
  applicationId: number;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date;
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
    return res.status(403).json({ error: 'sponsor role required' });
  }

  const [rows] = await pool.query<SponsorProfileRow[]>(
    `SELECT m.M_ID, m.M_Email, m.M_FName, m.M_LName, m.M_Bio,
            s.S_Brand, s.S_CR_Number
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
    brandName: r.S_Brand,
    crNumber: r.S_CR_Number,
  });
};

export const listOpportunities = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'SPONSOR') {
    return res.status(403).json({ error: 'sponsor role required' });
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
       (SELECT COUNT(*) FROM sponsor_package WHERE hackathon_ID = h.hackathon_ID) AS packagesCount
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
    branding: extractBranding(brandingById.get(r.id) ?? null),
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
    let benefits: string[] = [];
    if (p.SP_Benefits) {
      try {
        const parsed: unknown = JSON.parse(p.SP_Benefits);
        if (Array.isArray(parsed)) {
          benefits = parsed.filter((b): b is string => typeof b === 'string');
        }
      } catch {
        benefits = [];
      }
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
       sa.SA_ID         AS applicationId,
       sa.SA_Status     AS status,
       sa.SA_AppliedAt  AS appliedAt,
       sp.SP_ID         AS packageId,
       sp.SP_Name       AS packageName,
       sp.SP_Type       AS packageType,
       sp.SP_Price      AS packagePrice,
       h.hackathon_ID   AS hackathonId,
       h.H_title        AS hackathonTitle,
       h.H_status       AS hackathonStatus,
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
    appliedAt: r.appliedAt,
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

export const updateMyProfile = async (req: Request, res: Response) => {
  if (!ensureSponsor(req, res)) return;

  const { fullName, bio, brandName, crNumber } = req.body ?? {};

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

  // فصل الاسم الأول والأخير
  const trimmedName = fullName.trim();
  const parts = trimmedName.split(/\s+/);
  const fname = parts.length > 1 ? parts.slice(0, -1).join(' ') : trimmedName;
  const lname = parts.length > 1 ? parts[parts.length - 1] : '';

  const sponsorId = req.user!.memberId;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'UPDATE member SET M_FName = ?, M_LName = ?, M_Bio = ? WHERE M_ID = ?',
      [fname, lname, bio ?? null, sponsorId]
    );
    await conn.execute(
      'UPDATE sponsor SET S_Brand = ?, S_CR_Number = ? WHERE SM_ID = ?',
      [brandName ?? null, crNumber ?? null, sponsorId]
    );
    await conn.commit();

    return res.json({
      id: sponsorId,
      firstName: fname,
      lastName: lname,
      fullName: `${fname} ${lname}`.trim(),
      bio: bio ?? null,
      brandName: brandName ?? null,
      crNumber: crNumber ?? null,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[updateMyProfile] error:', err);
    return res.status(500).json({ error: 'تعذّر تحديث الملف، حاول لاحقاً' });
  } finally {
    conn.release();
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
    if (rows[0].SA_Status !== 'pending') {
      return res.status(409).json({
        error: 'لا يمكن إلغاء تقديم تمت معالجته من قبل المنظم',
      });
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
