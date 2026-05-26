import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from './env';

export type Role = 'super_admin' | 'scheduler_admin' | 'viewer';

export const ROLES: Role[] = ['super_admin', 'scheduler_admin', 'viewer'];

/** Roles allowed to create/update/delete members, schedules and rules. */
export const WRITE_ROLES: Role[] = ['super_admin', 'scheduler_admin'];

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(payload: TokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
