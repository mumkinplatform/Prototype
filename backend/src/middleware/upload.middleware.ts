import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'submissions');
const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });

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

interface MaxSizeRow extends RowDataPacket {
  H_Max_File_Size_MB: number | null;
}

const FALLBACK_MAX_MB = 50;

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
      res.status(500).json({ error: 'فشل الرفع' });
      return;
    }
    next();
  });
}

export { UPLOADS_DIR, AVATARS_DIR };
