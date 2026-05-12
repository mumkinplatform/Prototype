import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'submissions');
const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
const BANNERS_DIR = path.join(process.cwd(), 'uploads', 'banners');
const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });
if (!fs.existsSync(BANNERS_DIR)) fs.mkdirSync(BANNERS_DIR, { recursive: true });
if (!fs.existsSync(RECEIPTS_DIR)) fs.mkdirSync(RECEIPTS_DIR, { recursive: true });

function makeStorage(targetDir: string): multer.StorageEngine {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
      // Random name + extension to prevent collisions and path injection
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.\w]/g, '');
      const random = crypto.randomBytes(16).toString('hex');
      cb(null, `${Date.now()}-${random}${ext}`);
    },
  });
}

const storage = makeStorage(UPLOADS_DIR);

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const avatarUpload = multer({
  storage: makeStorage(AVATARS_DIR),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('يجب أن يكون الملف صورة (JPG/PNG/WEBP/GIF)'));
    }
  },
}).single('file');

export const bannerUpload = multer({
  storage: makeStorage(BANNERS_DIR),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('يجب أن يكون الملف صورة (JPG/PNG/WEBP/GIF)'));
    }
  },
}).single('file');

interface MaxSizeRow extends RowDataPacket {
  H_Max_File_Size_MB: number | null;
}

const FALLBACK_MAX_MB = 50;

// Blocklist of obviously dangerous extensions. The uploads dir is never
// executed server-side and files are served as downloads, but blocking
// these still protects participants who might download a submission and
// run it locally (malware distribution via the platform).
const BLOCKED_SUBMISSION_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.scr', '.msi', '.pif',
  '.vbs', '.vbe', '.ws', '.wsf', '.ps1', '.psm1',
  '.app', '.pkg', '.command',
  '.dll', '.ocx', '.sys', '.reg',
]);

/**
 * Submission upload middleware with dynamic per-hackathon size limit.
 * Reads H_Max_File_Size_MB from DB based on :id in URL.
 * Form field name: "file".
 */
export async function submissionUploadDynamic(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const hackathonId = Number(req.params.id);
  if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
    res.status(400).json({ error: 'رقم الهاكاثون غير صالح' });
    return;
  }

  let maxMb = FALLBACK_MAX_MB;
  try {
    const [rows] = await pool.query<MaxSizeRow[]>(
      'SELECT H_Max_File_Size_MB FROM hackathon WHERE hackathon_ID = ?',
      [hackathonId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'الهاكاثون غير موجود' });
      return;
    }
    if (rows[0].H_Max_File_Size_MB && rows[0].H_Max_File_Size_MB > 0) {
      maxMb = rows[0].H_Max_File_Size_MB;
    }
  } catch {
    // Fall through with FALLBACK_MAX_MB on query failure
  }

  const upload = multer({
    storage,
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (BLOCKED_SUBMISSION_EXTENSIONS.has(ext)) {
        // Surface a specific error so the route handler can return 415,
        // not the generic 500 used for unknown upload failures.
        cb(new Error(`نوع الملف غير مسموح (${ext}). الملفات التنفيذية ممنوعة.`));
        return;
      }
      cb(null, true);
    },
  });

  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({
            error: `حجم الملف أكبر من الحد المسموح (${maxMb} MB)`,
          });
          return;
        }
        res.status(400).json({ error: `خطأ في الرفع: ${err.message}` });
        return;
      }
      // Custom errors raised from fileFilter (e.g., blocked extension)
      // arrive here as plain Error instances. 415 = Unsupported Media Type.
      if (err instanceof Error) {
        res.status(415).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'فشل الرفع' });
      return;
    }
    next();
  });
}

const ALLOWED_RECEIPT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Receipt upload: accepts a single payment proof (image or PDF) up to 10 MB.
 * Form field name: "file".
 */
export const receiptUpload = multer({
  storage: makeStorage(RECEIPTS_DIR),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_RECEIPT_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم — استخدمي JPG أو PNG أو PDF'));
    }
  },
}).single('file');

export { UPLOADS_DIR, AVATARS_DIR, BANNERS_DIR, RECEIPTS_DIR };
