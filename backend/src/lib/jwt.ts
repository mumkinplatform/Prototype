import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  memberId: number;
  role: string;
}

export function signJwt(payload: JwtPayload): string {
  if (!env.jwt.secret) {
    throw new Error('JWT_SECRET is not set in .env');
  }
  const opts: SignOptions = { expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwt.secret, opts);
}

export function verifyJwt(token: string): JwtPayload {
  if (!env.jwt.secret) {
    throw new Error('JWT_SECRET is not set in .env');
  }
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
}
