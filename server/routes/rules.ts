import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import type { Rules } from '../../src/types/Rules';
import { defaultRules } from '../../src/data/rules';

export const rulesRouter = Router();

// Light structural validation — admin-supplied config, so we verify the shape
// without over-constraining the (large) nested scoring/role objects.
const RulesSchema = z
  .object({
    serviceConductor: z
      .object({
        normalSunday: z.object({}).passthrough(),
        thirdSunday: z.object({}).passthrough(),
      })
      .passthrough(),
    prayer1: z.object({}).passthrough(),
    prayer2: z.object({}).passthrough(),
    prayer3: z.object({}).passthrough(),
    firstLesson: z.object({}).passthrough(),
    secondLesson: z.object({}).passthrough(),
    scoringWeights: z.object({}).passthrough(),
  })
  .passthrough();

rulesRouter.get('/', (_req, res) => {
  const row = db.prepare('SELECT config FROM rules WHERE id = 1').get() as
    | { config: string }
    | undefined;
  res.json(row ? (JSON.parse(row.config) as Rules) : defaultRules);
});

rulesRouter.put('/', (req, res) => {
  const parsed = RulesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid rules configuration' });
    return;
  }
  const rules = parsed.data as unknown as Rules;
  db.prepare(
    `INSERT INTO rules (id, config) VALUES (1, @config)
     ON CONFLICT(id) DO UPDATE SET config=excluded.config`,
  ).run({ config: JSON.stringify(rules) });
  res.json(rules);
});
