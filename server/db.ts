import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { DATABASE_PATH } from './env';
import { migrate, seedRanks } from './schema';
import { defaultRules } from '../src/data/rules';

fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });

export const db = new Database(DATABASE_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run migrations at module load so route modules (which prepare statements at
// import time) always find their tables ready.
migrate(db);
seedRanks(db);

// Seed the singleton rules row with defaults on first run.
const existingRules = db.prepare('SELECT config FROM rules WHERE id = 1').get();
if (!existingRules) {
  db.prepare('INSERT INTO rules (id, config) VALUES (1, ?)').run(
    JSON.stringify(defaultRules),
  );
}

export function initDb(): void {
  console.log(`[db] SQLite ready at ${DATABASE_PATH}`);
}
