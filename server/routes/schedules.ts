import { Router } from 'express';
import { db } from '../db';
import type { WeeklySchedule } from '../../src/types/Assignment';

export const schedulesRouter = Router();

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

const saveMany = db.transaction((items: WeeklySchedule[]) => {
  for (const schedule of items) {
    deleteByDateStmt.run(schedule.date);
    insertStmt.run(toParams(schedule));
  }
});

function listAll(): WeeklySchedule[] {
  const rows = db
    .prepare('SELECT * FROM schedules ORDER BY date')
    .all() as ScheduleRow[];
  return rows.map(rowToSchedule);
}

schedulesRouter.get('/', (_req, res) => {
  res.json(listAll());
});

// Bulk save — replaces any existing schedule sharing a date (matches client dedup)
schedulesRouter.post('/', (req, res) => {
  const incoming = (
    Array.isArray(req.body) ? req.body : [req.body]
  ) as WeeklySchedule[];
  saveMany(incoming);
  res.status(201).json(listAll());
});

schedulesRouter.put('/:id', (req, res) => {
  const schedule = { ...(req.body as WeeklySchedule), id: req.params.id };
  db.prepare(
    `UPDATE schedules
       SET date=@date, isThirdSunday=@isThirdSunday, assignments=@assignments,
           generatedAt=@generatedAt, notes=@notes
     WHERE id=@id`,
  ).run(toParams(schedule));
  res.json(schedule);
});

schedulesRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
