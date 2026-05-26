import { Router } from 'express';
import { db } from '../db';
import type { Rules } from '../../src/types/Rules';
import { defaultRules } from '../../src/data/rules';

export const rulesRouter = Router();

rulesRouter.get('/', (_req, res) => {
  const row = db.prepare('SELECT config FROM rules WHERE id = 1').get() as
    | { config: string }
    | undefined;
  res.json(row ? (JSON.parse(row.config) as Rules) : defaultRules);
});

rulesRouter.put('/', (req, res) => {
  const rules = req.body as Rules;
  db.prepare(
    `INSERT INTO rules (id, config) VALUES (1, @config)
     ON CONFLICT(id) DO UPDATE SET config=excluded.config`,
  ).run({ config: JSON.stringify(rules) });
  res.json(rules);
});
