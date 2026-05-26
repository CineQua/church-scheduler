import { Router, type Response } from 'express';
import { z } from 'zod';
import { AUTH_COOKIE, IS_PROD, NODE_ENV } from '../env';
import {
  verifyPassword,
  signToken,
  type AuthUser,
} from '../auth';
import { findByEmail, findById, updateUser } from '../users';
import { requireAuth } from '../middleware';

export const authRouter = Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD, // HTTPS-only in production
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = findByEmail(parsed.data.email);
  // Verify even when the user is missing to keep timing roughly constant.
  const ok =
    user && user.isActive
      ? verifyPassword(parsed.data.password, user.passwordHash)
      : verifyPassword(parsed.data.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv');

  if (!user || !user.isActive || !ok) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);

  const publicUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  res.json({ user: publicUser });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user, env: NODE_ENV });
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Self-service password change for the currently authenticated user.
authRouter.post('/change-password', requireAuth, (req, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' });
    return;
  }

  const row = findById(req.user!.id);
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (!verifyPassword(parsed.data.currentPassword, row.passwordHash)) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  updateUser(req.user!.id, { password: parsed.data.newPassword });
  res.status(204).end();
});
