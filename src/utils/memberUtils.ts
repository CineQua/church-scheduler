import type { Member } from '../types/Member';
import type { ServiceRole } from '../types/Assignment';
import { daysSinceDate } from './dateUtils';

export function isAdult(member: Member): boolean {
  return member.age >= 19;
}

export function isYouth(member: Member): boolean {
  return member.age >= 11 && member.age <= 18;
}

export function getRecentAssignmentCount(member: Member, days = 60): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return member.assignmentHistory.filter(
    (a) => new Date(a.date).getTime() >= cutoff,
  ).length;
}

export function daysSinceLastAssignment(member: Member): number {
  if (!member.lastAssignedDate) return 999;
  return daysSinceDate(member.lastAssignedDate);
}

export function servedOnDate(member: Member, isoDate: string): boolean {
  return member.assignmentHistory.some((a) => a.date === isoDate);
}

export function servedRoleRecently(
  member: Member,
  role: ServiceRole,
  withinDays = 28,
): boolean {
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;
  return member.assignmentHistory.some(
    (a) => a.role === role && new Date(a.date).getTime() >= cutoff,
  );
}

export function servedPreviousSunday(
  member: Member,
  currentDate: string,
): boolean {
  const current = new Date(currentDate);
  const previousSunday = new Date(current.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevISO = previousSunday.toISOString().split('T')[0];
  return member.assignmentHistory.some((a) => a.date === prevISO);
}

export function sortMembersByName(members: Member[]): Member[] {
  return [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function filterActiveAvailable(members: Member[]): Member[] {
  return members.filter((m) => m.isActive && m.isAvailable);
}
