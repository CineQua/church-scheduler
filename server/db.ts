import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { defaultRules } from '../src/data/rules';

const dbPath =
  process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data', 'church.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Schema is created at module load so that route modules (which prepare
// statements at import time) always find their tables ready.
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    rankName TEXT NOT NULL,
    rankLevel INTEGER NOT NULL,
    rankCategory TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    isAvailable INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    lastAssignedDate TEXT,
    assignmentHistory TEXT NOT NULL DEFAULT '[]',
    extra TEXT
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    isThirdSunday INTEGER NOT NULL DEFAULT 0,
    assignments TEXT NOT NULL DEFAULT '{}',
    generatedAt TEXT NOT NULL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config TEXT NOT NULL
  );
`);

const existingRules = db.prepare('SELECT config FROM rules WHERE id = 1').get();
if (!existingRules) {
  db.prepare('INSERT INTO rules (id, config) VALUES (1, ?)').run(
    JSON.stringify(defaultRules),
  );
}

export function initDb(): void {
  console.log(`[db] SQLite ready at ${dbPath}`);
}
