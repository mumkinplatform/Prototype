import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool';

// Organizer profile flows. The schema is split across two tables — `member`
// holds the identity/contact columns shared by all roles, `organizer_profile`
// holds the organizer-specific fields (brand name, position, website, CR
// number). The Profile page treats them as a single object on the wire.

function ensureOrganizer(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ error: 'unauthenticated' });
    return false;
  }
  if (req.user.role !== 'ORGANIZER') {
    res.status(403).json({ error: 'organizer_required', message: 'هذه العملية متاحة للمنظمين فقط' });
    return false;
  }
  return true;
}

interface OrganizerProfileRow extends RowDataPacket {
  M_ID: number;
  M_Email: string;
  M_FName: string;
  M_LName: string;
  M_Bio: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  ORG_Name: string | null;
  ORG_Position: string | null;
  ORG_Website: string | null;
  ORG_CR_Number: string | null;
}

interface StatsRow extends RowDataPacket {
  hackathonsTotal: number;
  hackathonsPublished: number;
  hackathonsCompleted: number;
  participantsTotal: number;
  prizesTotal: number;
}

interface ActivityRow extends RowDataPacket {
  hackathon_ID: number;
  H_title: string | null;
  H_status: 'draft' | 'published' | 'ongoing' | 'completed';
  H_created_at: Date | string;
}

function shapeProfile(r: OrganizerProfileRow) {
  return {
    id: r.M_ID,
    email: r.M_Email,
    firstName: r.M_FName,
    lastName: r.M_LName,
    fullName: `${r.M_FName} ${r.M_LName}`.trim(),
    bio: r.M_Bio,
    phone: r.phone,
    location: r.city,
    avatar: r.avatar_url,
    company: r.ORG_Name,
    position: r.ORG_Position,
    website: r.ORG_Website,
    crNumber: r.ORG_CR_Number,
  };
}

export const getMyProfile = async (req: Request, res: Response) => {
  if (!ensureOrganizer(req, res)) return;
  const memberId = req.user!.memberId;

  try {
    const [rows] = await pool.query<OrganizerProfileRow[]>(
      `SELECT m.M_ID, m.M_Email, m.M_FName, m.M_LName, m.M_Bio,
              m.phone, m.city, m.avatar_url,
              op.ORG_Name, op.ORG_Position, op.ORG_Website, op.ORG_CR_Number
         FROM member m
         LEFT JOIN organizer_profile op ON op.M_ID = m.M_ID
        WHERE m.M_ID = ?`,
      [memberId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'organizer profile not found' });
    }

    // Stats — pulled live so the Profile page reflects the real DB state.
    // - hackathonsTotal/Published: status filtering tells the success-rate story.
    // - participantsTotal: accepted applications only, deduped across hackathons
    //   so a participant joining two of my events still counts as one.
    // - prizesTotal: sum of HP_Amount strings cast to decimal (the column is
    //   varchar because organizers sometimes write "50,000 ر.س" — strip commas
    //   and spaces, then cast).
    const [statsRows] = await pool.query<StatsRow[]>(
      `SELECT
         (SELECT COUNT(*) FROM hackathon WHERE HAM_ID = ?) AS hackathonsTotal,
         (SELECT COUNT(*) FROM hackathon WHERE HAM_ID = ? AND H_status IN ('published','ongoing','completed')) AS hackathonsPublished,
         (SELECT COUNT(*) FROM hackathon WHERE HAM_ID = ? AND H_status = 'completed') AS hackathonsCompleted,
         (SELECT COUNT(DISTINCT a.PM_ID)
            FROM applies_hackathon a
            JOIN hackathon h ON h.hackathon_ID = a.hackathon_ID
           WHERE h.HAM_ID = ? AND a.application_status = 'accepted') AS participantsTotal,
         (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(HP_Amount, ',', ''), ' ', '') AS DECIMAL(14,2))), 0)
            FROM hackathon_prize hp
            JOIN hackathon h ON h.hackathon_ID = hp.hackathon_ID
           WHERE h.HAM_ID = ?) AS prizesTotal`,
      [memberId, memberId, memberId, memberId, memberId],
    );
    const s = statsRows[0];
    const successRate =
      s.hackathonsTotal > 0
        ? Math.round((Number(s.hackathonsPublished) / Number(s.hackathonsTotal)) * 100)
        : 0;

    const [activity] = await pool.query<ActivityRow[]>(
      `SELECT hackathon_ID, H_title, H_status, H_created_at
         FROM hackathon
        WHERE HAM_ID = ?
        ORDER BY H_created_at DESC
        LIMIT 4`,
      [memberId],
    );

    return res.json({
      ...shapeProfile(rows[0]),
      stats: {
        hackathonsTotal: Number(s.hackathonsTotal),
        hackathonsPublished: Number(s.hackathonsPublished),
        hackathonsCompleted: Number(s.hackathonsCompleted),
        participantsTotal: Number(s.participantsTotal),
        prizesTotal: Number(s.prizesTotal),
        successRate,
      },
      recentActivity: activity.map((a) => ({
        id: a.hackathon_ID,
        title: a.H_title,
        status: a.H_status,
        createdAt: a.H_created_at,
      })),
    });
  } catch (err) {
    console.error('[organizer.getMyProfile] error:', err);
    return res.status(500).json({ error: 'تعذّر تحميل الملف الشخصي' });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  if (!ensureOrganizer(req, res)) return;
  const memberId = req.user!.memberId;

  const { fullName, bio, phone, location, company, position, website, crNumber } = req.body ?? {};

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'الاسم الكامل مطلوب (حرفين على الأقل)' });
  }
  // Same shape-validation as the sponsor controller — keep the rules aligned
  // so the two profile screens behave consistently for the user.
  for (const [key, val] of [
    ['bio', bio],
    ['phone', phone],
    ['location', location],
    ['company', company],
    ['position', position],
    ['website', website],
    ['crNumber', crNumber],
  ] as const) {
    if (val !== undefined && val !== null && typeof val !== 'string') {
      return res.status(400).json({ error: `الحقل ${key} يجب أن يكون نصاً` });
    }
  }
  if (typeof phone === 'string' && phone.trim() && !/^[\d+\-\s()]{5,20}$/.test(phone.trim())) {
    return res.status(400).json({ error: 'رقم الهاتف غير صالح' });
  }
  if (typeof crNumber === 'string' && crNumber.trim() && !/^\d{10}$/.test(crNumber.trim())) {
    return res.status(400).json({ error: 'رقم السجل التجاري يجب أن يكون 10 أرقام بالضبط' });
  }

  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  const fname = parts.length > 1 ? parts.slice(0, -1).join(' ') : trimmed;
  const lname = parts.length > 1 ? parts[parts.length - 1] : '';

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
      [fname, lname, cleanStr(bio), cleanStr(phone), cleanStr(location), memberId],
    );

    // organizer_profile may not have a row yet for older organizer accounts —
    // upsert via INSERT ... ON DUPLICATE KEY UPDATE keyed on M_ID. The unique
    // key isn't on M_ID, so guard manually instead.
    const [existing] = await conn.query<RowDataPacket[]>(
      'SELECT OP_ID FROM organizer_profile WHERE M_ID = ? LIMIT 1',
      [memberId],
    );
    if (existing.length === 0) {
      await conn.execute(
        `INSERT INTO organizer_profile (M_ID, ORG_Name, ORG_Position, ORG_Website, ORG_CR_Number)
         VALUES (?, ?, ?, ?, ?)`,
        [memberId, cleanStr(company), cleanStr(position), cleanStr(website), cleanStr(crNumber)],
      );
    } else {
      await conn.execute(
        `UPDATE organizer_profile
            SET ORG_Name = ?, ORG_Position = ?, ORG_Website = ?, ORG_CR_Number = ?
          WHERE M_ID = ?`,
        [cleanStr(company), cleanStr(position), cleanStr(website), cleanStr(crNumber), memberId],
      );
    }

    await conn.commit();

    const [rows] = await pool.query<OrganizerProfileRow[]>(
      `SELECT m.M_ID, m.M_Email, m.M_FName, m.M_LName, m.M_Bio,
              m.phone, m.city, m.avatar_url,
              op.ORG_Name, op.ORG_Position, op.ORG_Website, op.ORG_CR_Number
         FROM member m
         LEFT JOIN organizer_profile op ON op.M_ID = m.M_ID
        WHERE m.M_ID = ?`,
      [memberId],
    );
    return res.json(shapeProfile(rows[0]));
  } catch (err) {
    await conn.rollback();
    console.error('[organizer.updateMyProfile] error:', err);
    return res.status(500).json({ error: 'تعذّر تحديث الملف، حاول لاحقاً' });
  } finally {
    conn.release();
  }
};

interface NotificationRow extends RowDataPacket {
  N_ID: number;
  N_Type: 'acceptance' | 'team' | 'deadline' | 'evaluation' | 'achievement' | 'system';
  N_Title: string;
  N_Message: string;
  N_Read: number;
  N_ActionLabel: string | null;
  N_ActionRoute: string | null;
  N_CreatedAt: Date | string;
}

// Synthesise notifications for new pending applications and registration deadlines on the organizer's hackathons.
async function backfillOrganizerNotifications(memberId: number): Promise<void> {
  interface PendingRow extends RowDataPacket {
    hackathon_ID: number;
    H_title: string;
    PM_ID: number;
    fname: string;
    lname: string;
    applied_at: Date | string;
  }
  const [pending] = await pool.query<PendingRow[]>(
    `SELECT a.hackathon_ID, h.H_title, a.PM_ID, m.M_FName AS fname, m.M_LName AS lname, a.applied_at
       FROM applies_hackathon a
       JOIN hackathon h ON h.hackathon_ID = a.hackathon_ID
       JOIN member m ON m.M_ID = a.PM_ID
      WHERE h.HAM_ID = ?
        AND a.application_status = 'pending'
        AND NOT EXISTS (
          SELECT 1 FROM notification n
           WHERE n.M_ID = ?
             AND n.N_Type = 'team'
             AND n.N_ActionRoute = CONCAT('/admin/hackathon/', a.hackathon_ID, '/registrations#applicant=', a.PM_ID)
        )`,
    [memberId, memberId],
  );
  for (const r of pending) {
    const name = `${r.fname} ${r.lname}`.trim() || 'مشارك';
    await pool.execute(
      `INSERT INTO notification (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute, N_CreatedAt)
       VALUES (?, 'team', ?, ?, ?, ?, ?)`,
      [
        memberId,
        `طلب تسجيل جديد في "${r.H_title}"`,
        `قدّم ${name} طلب مشاركة.`,
        'مراجعة الطلبات',
        `/admin/hackathon/${r.hackathon_ID}/registrations#applicant=${r.PM_ID}`,
        r.applied_at,
      ],
    );
  }

  interface DeadlineRow extends RowDataPacket {
    hackathon_ID: number;
    H_title: string;
    hours_left: number;
  }
  const [deadlines] = await pool.query<DeadlineRow[]>(
    `SELECT h.hackathon_ID, h.H_title,
            TIMESTAMPDIFF(HOUR, NOW(), h.H_Registration_EndDate) AS hours_left
       FROM hackathon h
      WHERE h.HAM_ID = ?
        AND h.H_status = 'published'
        AND h.H_Registration_EndDate IS NOT NULL
        AND h.H_Registration_EndDate > NOW()
        AND h.H_Registration_EndDate <= DATE_ADD(NOW(), INTERVAL 48 HOUR)
        AND NOT EXISTS (
          SELECT 1 FROM notification n
           WHERE n.M_ID = ?
             AND n.N_Type = 'deadline'
             AND n.N_ActionRoute = CONCAT('/admin/hackathon/', h.hackathon_ID)
        )`,
    [memberId, memberId],
  );
  for (const r of deadlines) {
    const hours = Math.max(1, Number(r.hours_left));
    const when = hours >= 24 ? `${Math.round(hours / 24)} يوم` : `${hours} ساعة`;
    await pool.execute(
      `INSERT INTO notification (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute)
       VALUES (?, 'deadline', ?, ?, ?, ?)`,
      [
        memberId,
        `موعد إغلاق التسجيل قريب`,
        `يغلق التسجيل في "${r.H_title}" خلال ${when}.`,
        'عرض الهاكاثون',
        `/admin/hackathon/${r.hackathon_ID}`,
      ],
    );
  }
}

export const listNotifications = async (req: Request, res: Response) => {
  if (!ensureOrganizer(req, res)) return;
  const memberId = req.user!.memberId;
  try {
    try {
      await backfillOrganizerNotifications(memberId);
    } catch (backfillErr) {
      console.error('[organizer.notifications] backfill failed:', backfillErr);
    }
    const [rows] = await pool.query<NotificationRow[]>(
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
    console.error('[organizer.listNotifications] error:', err);
    return res.status(500).json({ error: 'تعذّر تحميل الإشعارات' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  if (!ensureOrganizer(req, res)) return;
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
  if (!ensureOrganizer(req, res)) return;
  const memberId = req.user!.memberId;
  await pool.execute(
    'UPDATE notification SET N_Read = 1 WHERE M_ID = ? AND N_Read = 0',
    [memberId],
  );
  return res.status(204).send();
};

export const deleteNotification = async (req: Request, res: Response) => {
  if (!ensureOrganizer(req, res)) return;
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
