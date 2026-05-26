import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb } from './db';
import { membersRouter } from './routes/members';
import { schedulesRouter } from './routes/schedules';
import { rulesRouter } from './routes/rules';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);

initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/members', membersRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/rules', rulesRouter);

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
