import { z } from 'zod';

export type Gender = 'Male' | 'Female';
export type RankCategory = 'Youth' | 'Lower Rank' | 'Higher Rank';

export const AssignmentRecordSchema = z.object({
  date: z.string(),
  role: z.string(),
  scheduleId: z.string(),
});

export const MemberSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.enum(['Male', 'Female']),
  age: z.number().int().min(1).max(120),
  rankName: z.string().min(1, 'Rank is required'),
  rankLevel: z.number().int().min(1).max(10),
  rankCategory: z.enum(['Youth', 'Lower Rank', 'Higher Rank']),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
  notes: z.string().optional(),
  lastAssignedDate: z.string().optional(),
  assignmentHistory: z.array(AssignmentRecordSchema),
  // Future optional fields
  department: z.string().optional(),
  familyGroup: z.string().optional(),
  region: z.string().optional(),
  preferredRoles: z.array(z.string()).optional(),
  rolesNotAllowed: z.array(z.string()).optional(),
  frequencyLimit: z.number().optional(),
  specialRestrictions: z.string().optional(),
});

export type AssignmentRecord = z.infer<typeof AssignmentRecordSchema>;
export type Member = z.infer<typeof MemberSchema>;

export const MemberFormSchema = MemberSchema.omit({
  id: true,
  lastAssignedDate: true,
  assignmentHistory: true,
});

export type MemberFormData = z.infer<typeof MemberFormSchema>;
