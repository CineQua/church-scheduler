import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PORT, IS_PROD, assertSecrets } from './env';
import { initDb } from './db';
import { seedSuperAdmin } from './seed';
import { requireAuth, requireRole } from './middleware';
import { WRITE_ROLES } from './auth';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { ranksRouter } from './routes/ranks';
import { membersRouter } from './routes/members';
import { schedulesRouter } from './routes/schedules';
import { rulesRouter } from './routes/rules';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

assertSecrets();
initDb();
console.log(`[seed] ${seedSuperAdmin()}`);

const app = express();
app.disable('x-powered-by');
// Trust the reverse proxy (Render/Railway) so secure cookies work behind TLS.
if (IS_PROD) app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// ─── Public routes ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);

// ─── Authenticated routes ────────────────────────────────────────────────────
// Everything below requires a valid session. GET is allowed for any role
// (including Viewer); writes require an admin role.
const requireWrite = requireRole(...WRITE_ROLES);

app.use('/api/users', requireAuth, requireRole('super_admin'), usersRouter);
app.use('/api/ranks', requireAuth, ranksRouter);

app.use(
  '/api/members',
  requireAuth,
  (req, res, next) => (req.method === 'GET' ? next() : requireWrite(req, res, next)),
  membersRouter,
);
app.use(
  '/api/schedules',
  requireAuth,
  (req, res, next) => (req.method === 'GET' ? next() : requireWrite(req, res, next)),
  schedulesRouter,
);
app.use(
  '/api/rules',
  requireAuth,
  (req, res, next) => (req.method === 'GET' ? next() : requireWrite(req, res, next)),
  rulesRouter,
);

// Unmatched API routes → JSON 404 (don't fall through to the SPA)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built frontend in production (dist/ exists after `npm run build`)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`[server] Church Scheduler running on http://localhost:${PORT}`);
  if (!fs.existsSync(distPath)) {
    console.log('[server] No dist/ found — run `npm run dev` for the frontend (Vite proxies /api here).');
  }
});
