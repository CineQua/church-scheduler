import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import type { WeeklySchedule } from '../../src/types/Assignment';

export const schedulesRouter = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const RoleAssignmentSchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  role: z.string(),
  isManualOverride: z.boolean().optional(),
});

const WeeklyScheduleSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  isThirdSunday: z.boolean(),
  assignments: z.record(RoleAssignmentSchema),
  generatedAt: z.string(),
  notes: z.string().optional(),
});

interface ScheduleRow {
  id: string;
  date: string;
  isThirdSunday: number;
  assignments: string;
  generatedAt: string;
  notes: string | null;
}

function rowToSchedule(r: ScheduleRow): WeeklySchedule {
  return {
    id: r.id,
    date: r.date,
    isThirdSunday: !!r.isThirdSunday,
    assignments: JSON.parse(r.assignments || '{}'),
    generatedAt: r.generatedAt,
    notes: r.notes ?? undefined,
  };
}

const insertStmt = db.prepare(
  `INSERT INTO schedules (id, date, isThirdSunday, assignments, generatedAt, notes)
   VALUES (@id, @date, @isThirdSunday, @assignments, @generatedAt, @notes)`,
);

const deleteByDateStmt = db.prepare('DELETE FROM schedules WHERE date = ?');

function toParams(s: WeeklySchedule) {
  return {
    id: s.id,
    date: s.date,
    isThirdSunday: s.isThirdSunday ? 1 : 0,
    assignments: JSON.stringify(s.assignments ?? {}),
    generatedAt: s.generatedAt,
    notes: s.notes ?? null,
  };
}

// ─── Normalised mirror: assignments + assignment_history ───────────────────────

const existingAssignmentsStmt = db.prepare(
  'SELECT role, memberId FROM assignments WHERE scheduleId = ?',
);
const deleteAssignmentsStmt = db.prepare(
  'DELETE FROM assignments WHERE scheduleId = ?',
);
const insertAssignmentStmt = db.prepare(
  `INSERT INTO assignments (scheduleId, date, role, memberId, memberName, isManualOverride)
   VALUES (@scheduleId, @date, @role, @memberId, @memberName, @isManualOverride)`,
);
const insertHistoryStmt = db.prepare(
  `INSERT INTO assignment_history (memberId, memberName, scheduleId, date, role, recordedAt)
   VALUES (@memberId, @memberName, @scheduleId, @date, @role, @recordedAt)`,
);

/**
 * Rewrite the normalised assignment rows for a schedule and append an audit
 * entry only for assignments that actually changed (new role or new member),
 * so repeated saves of an unchanged schedule do not bloat the history log.
 */
function syncAssignments(s: WeeklySchedule): void {
  const previous = existingAssignmentsStmt.all(s.id) as {
    role: string;
    memberId: string | null;
  }[];
  const prevByRole = new Map(previous.map((r) => [r.role, r.memberId]));

  deleteAssignmentsStmt.run(s.id);

  const now = new Date().toISOString();
  for (const [role, a] of Object.entries(s.assignments ?? {})) {
    if (!a) continue;
    insertAssignmentStmt.run({
      scheduleId: s.id,
      date: s.date,
      role,
      memberId: a.memberId,
      memberName: a.memberName,
      isManualOverride: a.isManualOverride ? 1 : 0,
    });
    if (prevByRole.get(role) !== a.memberId) {
      insertHistoryStmt.run({
        memberId: a.memberId,
        memberName: a.memberName,
        scheduleId: s.id,
        date: s.date,
        role,
        recordedAt: now,
      });
    }
  }
}

const saveMany = db.transaction((items: WeeklySchedule[]) => {
  for (const schedule of items) {
    deleteByDateStmt.run(schedule.date);
    insertStmt.run(toParams(schedule));
    syncAssignments(schedule);
  }
});

function listAll(): WeeklySchedule[] {
  const rows = db
    .prepare('SELECT * FROM schedules ORDER BY date')
    .all() as ScheduleRow[];
  return rows.map(rowToSchedule);
}

// ─── Routes ─────────────────────────────────────────────────────────────────

schedulesRouter.get('/', (_req, res) => {
  res.json(listAll());
});

// Bulk save — replaces any existing schedule sharing a date (matches client dedup)
schedulesRouter.post('/', (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : [req.body];
  const parsed = z.array(WeeklyScheduleSchema).safeParse(incoming);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Invalid schedule' });
    return;
  }
  saveMany(parsed.data as WeeklySchedule[]);
  res.status(201).json(listAll());
});

schedulesRouter.put('/:id', (req, res) => {
  const parsed = WeeklyScheduleSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Invalid schedule' });
    return;
  }
  const schedule = parsed.data as WeeklySchedule;
  const updateTxn = db.transaction(() => {
    db.prepare(
      `UPDATE schedules
         SET date=@date, isThirdSunday=@isThirdSunday, assignments=@assignments,
             generatedAt=@generatedAt, notes=@notes
       WHERE id=@id`,
    ).run(toParams(schedule));
    syncAssignments(schedule);
  });
  updateTxn();
  res.json(schedule);
});

schedulesRouter.delete('/:id', (req, res) => {
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM assignments WHERE scheduleId = ?').run(req.params.id);
    db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  });
  txn();
  res.status(204).end();
});
