import type DatabaseType from 'better-sqlite3';
import { rankHierarchy } from '../src/data/rankHierarchy';

/**
 * Idempotent schema migration. Safe to run on every startup — each statement
 * uses IF NOT EXISTS, so existing data (members/schedules/rules added by the
 * previous version) is preserved while the new auth/normalised tables are added.
 */
export function migrate(db: DatabaseType.Database): void {
  db.exec(`
    -- ─── Auth ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      email        TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      name         TEXT,
      role         TEXT NOT NULL CHECK (role IN ('super_admin','scheduler_admin','viewer')),
      isActive     INTEGER NOT NULL DEFAULT 1,
      createdAt    TEXT NOT NULL,
      updatedAt    TEXT NOT NULL
    );

    -- ─── Members (existing) ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS members (
      id                TEXT PRIMARY KEY,
      fullName          TEXT NOT NULL,
      gender            TEXT NOT NULL,
      age               INTEGER NOT NULL,
      rankName          TEXT NOT NULL,
      rankLevel         INTEGER NOT NULL,
      rankCategory      TEXT NOT NULL,
      isActive          INTEGER NOT NULL DEFAULT 1,
      isAvailable       INTEGER NOT NULL DEFAULT 1,
      notes             TEXT,
      lastAssignedDate  TEXT,
      assignmentHistory TEXT NOT NULL DEFAULT '[]',
      extra             TEXT
    );

    -- ─── Ranks (reference data, seeded from rankHierarchy) ─────────────────────
    CREATE TABLE IF NOT EXISTS ranks (
      name     TEXT PRIMARY KEY,
      level    INTEGER NOT NULL UNIQUE,
      category TEXT NOT NULL
    );

    -- ─── Rules (singleton config row) ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS rules (
      id     INTEGER PRIMARY KEY CHECK (id = 1),
      config TEXT NOT NULL
    );

    -- ─── Schedules (existing — assignments kept as JSON for the SPA) ───────────
    CREATE TABLE IF NOT EXISTS schedules (
      id            TEXT PRIMARY KEY,
      date          TEXT NOT NULL UNIQUE,
      isThirdSunday INTEGER NOT NULL DEFAULT 0,
      assignments   TEXT NOT NULL DEFAULT '{}',
      generatedAt   TEXT NOT NULL,
      notes         TEXT
    );

    -- ─── Assignments (normalised: one row per role per schedule) ───────────────
    CREATE TABLE IF NOT EXISTS assignments (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduleId       TEXT NOT NULL,
      date             TEXT NOT NULL,
      role             TEXT NOT NULL,
      memberId         TEXT,
      memberName       TEXT,
      isManualOverride INTEGER NOT NULL DEFAULT 0,
      UNIQUE (scheduleId, role)
    );
    CREATE INDEX IF NOT EXISTS idx_assignments_member ON assignments(memberId);
    CREATE INDEX IF NOT EXISTS idx_assignments_date   ON assignments(date);

    -- ─── Assignment history (append-only audit log) ───────────────────────────
    CREATE TABLE IF NOT EXISTS assignment_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId   TEXT NOT NULL,
      memberName TEXT,
      scheduleId TEXT NOT NULL,
      date       TEXT NOT NULL,
      role       TEXT NOT NULL,
      recordedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_history_member ON assignment_history(memberId);
  `);
}

/** Seed the ranks reference table from the canonical hierarchy (idempotent). */
export function seedRanks(db: DatabaseType.Database): void {
  const insert = db.prepare(
    `INSERT INTO ranks (name, level, category) VALUES (@name, @level, @category)
     ON CONFLICT(name) DO UPDATE SET level = excluded.level, category = excluded.category`,
  );
  const seed = db.transaction(() => {
    for (const rank of rankHierarchy) insert.run(rank);
  });
  seed();
}
