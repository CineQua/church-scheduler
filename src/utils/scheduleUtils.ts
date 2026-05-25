import type { WeeklySchedule } from '../types/Assignment';
import type { Member } from '../types/Member';
import { ALL_ROLES } from '../types/Assignment';

export function getAssignedMemberIds(schedule: WeeklySchedule): string[] {
  return ALL_ROLES
    .map((role) => schedule.assignments[role]?.memberId)
    .filter(Boolean) as string[];
}

export function isFullyAssigned(schedule: WeeklySchedule): boolean {
  return ALL_ROLES.every((role) => schedule.assignments[role] !== undefined);
}

export function getMemberAssignmentCount(
  schedules: WeeklySchedule[],
  memberId: string,
): number {
  return schedules.reduce((count, schedule) => {
    return (
      count +
      Object.values(schedule.assignments).filter(
        (a) => a?.memberId === memberId,
      ).length
    );
  }, 0);
}

export function applyHistoryToMembers(
  members: Member[],
  schedules: WeeklySchedule[],
): Member[] {
  const historyMap = new Map<
    string,
    { date: string; role: string; scheduleId: string }[]
  >();

  for (const schedule of schedules) {
    for (const [role, assignment] of Object.entries(schedule.assignments)) {
      if (!assignment) continue;
      const existing = historyMap.get(assignment.memberId) ?? [];
      existing.push({ date: schedule.date, role, scheduleId: schedule.id });
      historyMap.set(assignment.memberId, existing);
    }
  }

  return members.map((m) => ({
    ...m,
    assignmentHistory: historyMap.get(m.id) ?? [],
    lastAssignedDate: historyMap.get(m.id)?.slice(-1)[0]?.date,
  }));
}

export function generateScheduleId(date: string): string {
  return `schedule-${date}-${Date.now()}`;
}
