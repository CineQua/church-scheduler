import { Router } from 'express';
import { db } from '../db';
import type { Member } from '../../src/types/Member';

export const membersRouter = Router();

interface MemberRow {
  id: string;
  fullName: string;
  gender: string;
  age: number;
  rankName: string;
  rankLevel: number;
  rankCategory: string;
  isActive: number;
  isAvailable: number;
  notes: string | null;
  lastAssignedDate: string | null;
  assignmentHistory: string;
  extra: string | null;
}

const OPTIONAL_FIELDS = [
  'department',
  'familyGroup',
  'region',
  'preferredRoles',
  'rolesNotAllowed',
  'frequencyLimit',
  'specialRestrictions',
] as const;

function rowToMember(r: MemberRow): Member {
  const extra = r.extra ? JSON.parse(r.extra) : {};
  return {
    id: r.id,
    fullName: r.fullName,
    gender: r.gender as Member['gender'],
    age: r.age,
    rankName: r.rankName,
    rankLevel: r.rankLevel,
    rankCategory: r.rankCategory as Member['rankCategory'],
    isActive: !!r.isActive,
    isAvailable: !!r.isAvailable,
    notes: r.notes ?? undefined,
    lastAssignedDate: r.lastAssignedDate ?? undefined,
    assignmentHistory: JSON.parse(r.assignmentHistory || '[]'),
    ...extra,
  };
}

function upsertMember(m: Member): void {
  const extra: Record<string, unknown> = {};
  for (const key of OPTIONAL_FIELDS) {
    const value = (m as Record<string, unknown>)[key];
    if (value !== undefined) extra[key] = value;
  }

  db.prepare(
    `INSERT INTO members
      (id, fullName, gender, age, rankName, rankLevel, rankCategory,
       isActive, isAvailable, notes, lastAssignedDate, assignmentHistory, extra)
     VALUES
      (@id, @fullName, @gender, @age, @rankName, @rankLevel, @rankCategory,
       @isActive, @isAvailable, @notes, @lastAssignedDate, @assignmentHistory, @extra)
     ON CONFLICT(id) DO UPDATE SET
       fullName=excluded.fullName, gender=excluded.gender, age=excluded.age,
       rankName=excluded.rankName, rankLevel=excluded.rankLevel, rankCategory=excluded.rankCategory,
       isActive=excluded.isActive, isAvailable=excluded.isAvailable, notes=excluded.notes,
       lastAssignedDate=excluded.lastAssignedDate, assignmentHistory=excluded.assignmentHistory,
       extra=excluded.extra`,
  ).run({
    id: m.id,
    fullName: m.fullName,
    gender: m.gender,
    age: m.age,
    rankName: m.rankName,
    rankLevel: m.rankLevel,
    rankCategory: m.rankCategory,
    isActive: m.isActive ? 1 : 0,
    isAvailable: m.isAvailable ? 1 : 0,
    notes: m.notes ?? null,
    lastAssignedDate: m.lastAssignedDate ?? null,
    assignmentHistory: JSON.stringify(m.assignmentHistory ?? []),
    extra: Object.keys(extra).length ? JSON.stringify(extra) : null,
  });
}

membersRouter.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM members ORDER BY fullName')
    .all() as MemberRow[];
  res.json(rows.map(rowToMember));
});

membersRouter.post('/', (req, res) => {
  const member = req.body as Member;
  upsertMember(member);
  res.status(201).json(member);
});

membersRouter.put('/:id', (req, res) => {
  const member = { ...(req.body as Member), id: req.params.id };
  upsertMember(member);
  res.json(member);
});

membersRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
