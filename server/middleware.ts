import type { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE } from './env';
import { verifyToken, type Role, type AuthUser } from './auth';
import { db } from './db';

// Augment Express' Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: number;
}

function userFromRequest(req: Request): AuthUser | null {
  // Prefer the httpOnly cookie; fall back to a Bearer header for API clients.
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = cookieToken ?? bearer;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Re-check the user still exists and is active on every request, so disabling
  // an account or changing its role takes effect immediately.
  const row = db
    .prepare('SELECT id, email, name, role, isActive FROM users WHERE id = ?')
    .get(payload.sub) as UserRow | undefined;
  if (!row || !row.isActive) return null;

  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

/** Reject unless a valid session is present. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  req.user = user;
  next();
}

/** Reject unless the authenticated user holds one of the allowed roles. */
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
