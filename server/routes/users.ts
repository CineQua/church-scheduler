import { Router } from 'express';
import { z } from 'zod';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  findByEmail,
  countSuperAdmins,
} from '../users';
import { db } from '../db';

export const usersRouter = Router();

// Every route here is mounted behind requireRole('super_admin') in index.ts.

const RoleSchema = z.enum(['super_admin', 'scheduler_admin', 'viewer']);

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().max(120).optional(),
  role: RoleSchema,
});

const UpdateUserSchema = z.object({
  name: z.string().max(120).optional(),
  role: RoleSchema.optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
});

usersRouter.get('/', (_req, res) => {
  res.json(listUsers());
});

usersRouter.post('/', (req, res) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' });
    return;
  }
  if (findByEmail(parsed.data.email)) {
    res.status(409).json({ error: 'A user with that email already exists' });
    return;
  }
  res.status(201).json(createUser(parsed.data));
});

usersRouter.put('/:id', (req, res) => {
  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' });
    return;
  }

  const target = db
    .prepare('SELECT id, role FROM users WHERE id = ?')
    .get(req.params.id) as { id: string; role: string } | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Guard against removing the last active Super Admin (demotion or disable).
  const demoting =
    target.role === 'super_admin' &&
    ((parsed.data.role && parsed.data.role !== 'super_admin') ||
      parsed.data.isActive === false);
  if (demoting && countSuperAdmins(target.id) === 0) {
    res.status(409).json({ error: 'Cannot remove the last Super Admin' });
    return;
  }

  const updated = updateUser(req.params.id, parsed.data);
  res.json(updated);
});

usersRouter.delete('/:id', (req, res) => {
  if (req.user?.id === req.params.id) {
    res.status(409).json({ error: 'You cannot delete your own account' });
    return;
  }
  const target = db
    .prepare('SELECT id, role FROM users WHERE id = ?')
    .get(req.params.id) as { id: string; role: string } | undefined;
  if (target?.role === 'super_admin' && countSuperAdmins(target.id) === 0) {
    res.status(409).json({ error: 'Cannot delete the last Super Admin' });
    return;
  }
  deleteUser(req.params.id);
  res.status(204).end();
});
