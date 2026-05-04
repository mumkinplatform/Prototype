import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { hashPassword, verifyPassword } from '../lib/password';
import { signJwt } from '../lib/jwt';
import { generateOtp } from '../lib/otp';
import { sendOtpEmail, sendPasswordResetEmail } from '../lib/mail';
import { toDbRole, toFrontendRole } from '../lib/roles';

const OTP_TTL_MINUTES = 10;
const RESET_TTL_MINUTES = 30;

interface MemberRow extends RowDataPacket {
  M_ID: number;
  M_Email: string;
  M_Type: string;
  M_FName: string;
  M_LName: string;
  M_password: string;
  M_Bio: string | null;
  verification_code: string | null;
  is_verified: number;
  verification_code_expires_at: Date | null;
  password_reset_code: string | null;
  password_reset_expires_at: Date | null;
}

function isExpired(at: Date | null | undefined): boolean {
  if (!at) return true;
  return new Date(at).getTime() < Date.now();
}

function splitFullName(fullName: string): { fname: string; lname: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { fname: trimmed, lname: '' };
  const lname = parts.pop()!;
  return { fname: parts.join(' '), lname };
}

export const signup = async (req: Request, res: Response) => {
  const { role, email, password, fullName, bio, orgName, brandName, crNumber, skills } = req.body ?? {};

  if (!role || !email || !password || !fullName || !bio) {
    return res.status(400).json({ error: 'role, email, password, fullName, bio are required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  const dbRole = toDbRole(role);
  if (!dbRole) {
    return res.status(400).json({ error: 'invalid role' });
  }

  if (dbRole === 'ORGANIZER') {
    if (!orgName) {
      return res.status(400).json({ error: 'orgName is required for organizer' });
    }
  } else if (dbRole === 'SPONSOR') {
    if (!brandName) {
      return res.status(400).json({ error: 'brandName is required for sponsor' });
    }
    if (!crNumber) {
      return res.status(400).json({ error: 'crNumber is required for sponsor' });
    }
    if (!/^\d{10}$/.test(String(crNumber))) {
      return res.status(400).json({ error: 'crNumber must be exactly 10 digits' });
    }
  } else if (dbRole === 'PARTICIPANT') {
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'skills are required for participant' });
    }
    if (skills.some((s: unknown) => typeof s !== 'string' || !s.trim())) {
      return res.status(400).json({ error: 'invalid skills' });
    }
  }

  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query<MemberRow[]>(
      'SELECT M_ID FROM member WHERE M_Email = ? AND M_Type = ?',
      [email, dbRole]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'email already registered for this role' });
    }

    const { fname, lname } = splitFullName(fullName);
    const passwordHash = await hashPassword(password);
    const otp = generateOtp();

    await conn.beginTransaction();
    try {
      const [memberResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, verification_code, verification_code_expires_at, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)`,
        [email, dbRole, fname, lname, passwordHash, bio, otp, OTP_TTL_MINUTES]
      );
      const memberId = memberResult.insertId;

      if (dbRole === 'ORGANIZER') {
        await conn.execute(
          'INSERT INTO organizer_profile (M_ID, ORG_Name) VALUES (?, ?)',
          [memberId, orgName]
        );
        await conn.execute(
          'INSERT INTO hackathon_admin (HAM_ID) VALUES (?)',
          [memberId]
        );
      } else if (dbRole === 'SPONSOR') {
        await conn.execute(
          'INSERT INTO sponsor (SM_ID, S_Brand, S_CR_Number) VALUES (?, ?, ?)',
          [memberId, brandName, crNumber]
        );
      } else if (dbRole === 'PARTICIPANT') {
        await conn.execute(
          'INSERT INTO participant (PM_ID, T_ID) VALUES (?, NULL)',
          [memberId]
        );
        for (const skill of skills as string[]) {
          await conn.execute(
            'INSERT INTO participant_skills (PM_ID, P_skills) VALUES (?, ?)',
            [memberId, skill.trim()]
          );
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    try {
      await sendOtpEmail(email, otp, OTP_TTL_MINUTES);
    } catch (mailErr) {
      console.error('[mail] failed to send signup OTP:', mailErr);
    }

    return res.status(201).json({
      status: 'pending_verification',
      email,
      role: toFrontendRole(dbRole),
    });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: 'internal server error' });
  } finally {
    conn.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const { role, email, password } = req.body ?? {};

  if (!role || !email || !password) {
    return res.status(400).json({ error: 'role, email, password are required' });
  }

  const dbRole = toDbRole(role);
  if (!dbRole) {
    return res.status(400).json({ error: 'invalid role' });
  }


  try {
    const [rows] = await pool.query<MemberRow[]>(
      'SELECT * FROM member WHERE M_Email = ? AND M_Type = ?',
      [email, dbRole]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'no_account_for_role' });
    }

    const member = rows[0];
    const ok = await verifyPassword(password, member.M_password);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const otp = generateOtp();
    await pool.execute(
      'UPDATE member SET verification_code = ?, verification_code_expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE M_ID = ?',
      [otp, OTP_TTL_MINUTES, member.M_ID]
    );
    try {
      await sendOtpEmail(email, otp, OTP_TTL_MINUTES);
    } catch (mailErr) {
      console.error('[mail] failed to send login OTP:', mailErr);
    }

    return res.json({
      status: 'otp_sent',
      email,
      role: toFrontendRole(dbRole),
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { role, email, code } = req.body ?? {};

  if (!role || !email || !code) {
    return res.status(400).json({ error: 'role, email, code are required' });
  }

  const dbRole = toDbRole(role);
  if (!dbRole) {
    return res.status(400).json({ error: 'invalid role' });
  }

  try {
    const [rows] = await pool.query<MemberRow[]>(
      'SELECT * FROM member WHERE M_Email = ? AND M_Type = ?',
      [email, dbRole]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'invalid request' });
    }

    const member = rows[0];
    if (!member.verification_code || member.verification_code !== String(code)) {
      return res.status(401).json({ error: 'invalid or expired code' });
    }
    if (isExpired(member.verification_code_expires_at)) {
      await pool.execute(
        'UPDATE member SET verification_code = NULL, verification_code_expires_at = NULL WHERE M_ID = ?',
        [member.M_ID]
      );
      return res.status(401).json({ error: 'invalid or expired code' });
    }

    await pool.execute(
      'UPDATE member SET is_verified = 1, verification_code = NULL, verification_code_expires_at = NULL WHERE M_ID = ?',
      [member.M_ID]
    );

    const token = signJwt({ memberId: member.M_ID, role: dbRole });

    return res.json({
      token,
      user: {
        id: member.M_ID,
        fullName: `${member.M_FName} ${member.M_LName}`.trim(),
        email: member.M_Email,
        role: toFrontendRole(dbRole),
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { role, email } = req.body ?? {};

  if (!role || !email) {
    return res.status(400).json({ error: 'role, email are required' });
  }

  const dbRole = toDbRole(role);
  if (!dbRole) {
    return res.status(400).json({ error: 'invalid role' });
  }


  try {
    const [rows] = await pool.query<MemberRow[]>(
      'SELECT M_ID FROM member WHERE M_Email = ? AND M_Type = ?',
      [email, dbRole]
    );

    if (rows.length === 0) {
      return res.json({ status: 'reset_email_sent' });
    }

    const code = generateOtp();
    await pool.execute(
      'UPDATE member SET password_reset_code = ?, password_reset_expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE M_ID = ?',
      [code, RESET_TTL_MINUTES, rows[0].M_ID]
    );
    try {
      await sendPasswordResetEmail(email, code, RESET_TTL_MINUTES);
    } catch (mailErr) {
      console.error('[mail] failed to send reset email:', mailErr);
    }

    return res.json({ status: 'reset_email_sent' });
  } catch (err) {
    console.error('forgot-password error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { role, email, code, newPassword } = req.body ?? {};

  if (!role || !email || !code || !newPassword) {
    return res.status(400).json({ error: 'role, email, code, newPassword are required' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'newPassword must be at least 8 characters' });
  }

  const dbRole = toDbRole(role);
  if (!dbRole) {
    return res.status(400).json({ error: 'invalid role' });
  }

  try {
    const [rows] = await pool.query<MemberRow[]>(
      'SELECT M_ID, password_reset_code, password_reset_expires_at FROM member WHERE M_Email = ? AND M_Type = ?',
      [email, dbRole]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'invalid or expired code' });
    }
    const member = rows[0];

    if (!member.password_reset_code || member.password_reset_code !== String(code)) {
      return res.status(401).json({ error: 'invalid or expired code' });
    }
    if (isExpired(member.password_reset_expires_at)) {
      await pool.execute(
        'UPDATE member SET password_reset_code = NULL, password_reset_expires_at = NULL WHERE M_ID = ?',
        [member.M_ID]
      );
      return res.status(401).json({ error: 'invalid or expired code' });
    }

    const newHash = await hashPassword(newPassword);
    await pool.execute(
      'UPDATE member SET M_password = ?, password_reset_code = NULL, password_reset_expires_at = NULL WHERE M_ID = ?',
      [newHash, member.M_ID]
    );

    return res.json({ status: 'password_reset' });
  } catch (err) {
    console.error('reset-password error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const { role, email } = req.body ?? {};

  if (!role || !email) {
    return res.status(400).json({ error: 'role, email are required' });
  }

  const dbRole = toDbRole(role);
  if (!dbRole) {
    return res.status(400).json({ error: 'invalid role' });
  }

  try {
    const [rows] = await pool.query<MemberRow[]>(
      'SELECT M_ID FROM member WHERE M_Email = ? AND M_Type = ?',
      [email, dbRole]
    );
    if (rows.length === 0) {
      return res.json({ status: 'otp_sent' });
    }

    const otp = generateOtp();
    await pool.execute(
      'UPDATE member SET verification_code = ?, verification_code_expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE M_ID = ?',
      [otp, OTP_TTL_MINUTES, rows[0].M_ID]
    );
    try {
      await sendOtpEmail(email, otp, OTP_TTL_MINUTES);
    } catch (mailErr) {
      console.error('[mail] failed to send resend OTP:', mailErr);
    }

    return res.json({ status: 'otp_sent' });
  } catch (err) {
    console.error('resend-otp error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
