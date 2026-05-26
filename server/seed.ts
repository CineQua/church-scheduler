import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } from './env';
import { countUsers, findByEmail, createUser } from './users';

/**
 * Create the first Super Admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Runs automatically on startup but is a no-op once any user exists, so it is
 * safe to leave the env vars set across restarts. Returns a short status string
 * for logging.
 */
export function seedSuperAdmin(): string {
  if (countUsers() > 0) {
    return 'users already exist — skipping seed';
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return 'no users and ADMIN_EMAIL/ADMIN_PASSWORD not set — create the first admin manually';
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('[seed] ADMIN_PASSWORD must be at least 8 characters.');
  }
  if (findByEmail(ADMIN_EMAIL)) {
    return `user ${ADMIN_EMAIL} already exists`;
  }
  createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    name: ADMIN_NAME,
    role: 'super_admin',
  });
  return `created Super Admin ${ADMIN_EMAIL}`;
}

// Allow running as a standalone script: `npm run seed`.
const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    const result = seedSuperAdmin();
    console.log(`[seed] ${result}`);
    process.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
