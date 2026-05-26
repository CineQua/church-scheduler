import path from 'node:path';

/**
 * Centralised environment configuration. All secrets and deployment-specific
 * values are read here so the rest of the server never touches process.env.
 */

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const IS_PROD = NODE_ENV === 'production';

export const PORT = Number(process.env.PORT ?? 3001);

// Persistent SQLite location. In Docker/production this is a mounted volume.
export const DATABASE_PATH =
  process.env.DATABASE_PATH ??
  (IS_PROD
    ? '/data/church-scheduler.sqlite'
    : path.resolve(process.cwd(), 'data', 'church-scheduler.sqlite'));

// JWT signing secret. A weak default is allowed in dev only; production refuses
// to start without an explicit, sufficiently long secret (see assertSecrets).
export const JWT_SECRET =
  process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me';

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
export const AUTH_COOKIE = 'cs_token';

// First Super Admin, created on startup if no users exist yet.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
export const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Super Admin';

/** Fail fast on insecure production configuration. */
export function assertSecrets(): void {
  if (!IS_PROD) return;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      '[env] JWT_SECRET must be set to a random string of at least 32 characters in production.',
    );
  }
}
