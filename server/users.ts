import { randomUUID } from 'node:crypto';
import { db } from './db';
import { hashPassword, type Role } from './auth';

interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  role: Role;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toPublic(r: UserRow): PublicUser {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    isActive: !!r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function findByEmail(email: string): UserRow | undefined {
  return db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function countUsers(): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
}

export function listUsers(): PublicUser[] {
  const rows = db
    .prepare('SELECT * FROM users ORDER BY createdAt')
    .all() as UserRow[];
  return rows.map(toPublic);
}

export function createUser(input: {
  email: string;
  password: string;
  name?: string;
  role: Role;
}): PublicUser {
  const now = new Date().toISOString();
  const row: UserRow = {
    id: randomUUID(),
    email: input.email.toLowerCase().trim(),
    passwordHash: hashPassword(input.password),
    name: input.name?.trim() || null,
    role: input.role,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  };
  db.prepare(
    `INSERT INTO users (id, email, passwordHash, name, role, isActive, createdAt, updatedAt)
     VALUES (@id, @email, @passwordHash, @name, @role, @isActive, @createdAt, @updatedAt)`,
  ).run(row);
  return toPublic(row);
}

export function updateUser(
  id: string,
  patch: { name?: string; role?: Role; isActive?: boolean; password?: string },
): PublicUser | null {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
    | UserRow
    | undefined;
  if (!existing) return null;

  const updated: UserRow = {
    ...existing,
    name: patch.name !== undefined ? patch.name.trim() || null : existing.name,
    role: patch.role ?? existing.role,
    isActive:
      patch.isActive !== undefined ? (patch.isActive ? 1 : 0) : existing.isActive,
    passwordHash: patch.password
      ? hashPassword(patch.password)
      : existing.passwordHash,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    `UPDATE users
        SET name=@name, role=@role, isActive=@isActive,
            passwordHash=@passwordHash, updatedAt=@updatedAt
      WHERE id=@id`,
  ).run(updated);
  return toPublic(updated);
}

export function deleteUser(id: string): void {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function countSuperAdmins(excludeId?: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM users
        WHERE role = 'super_admin' AND isActive = 1 AND id != ?`,
    )
    .get(excludeId ?? '') as { n: number };
  return row.n;
}

export { toPublic };
export type { UserRow };
