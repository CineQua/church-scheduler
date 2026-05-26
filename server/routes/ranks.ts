import { Router } from 'express';
import { db } from '../db';

export const ranksRouter = Router();

// Read-only reference data, available to any authenticated role.
ranksRouter.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT name, level, category FROM ranks ORDER BY level')
    .all();
  res.json(rows);
});
