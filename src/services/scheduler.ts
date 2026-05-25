import type { Member } from '../types/Member';
import type { WeeklySchedule, ServiceRole, RoleAssignment } from '../types/Assignment';
import type { Rules } from '../types/Rules';
import { getSundaysInRange, isThirdSundayOfMonth, toISODate } from '../utils/dateUtils';
import { getEligibleCandidates } from './ruleEngine';
import { scoreAndRankMembers, pickBest } from './scoringEngine';
import { generateScheduleId } from '../utils/scheduleUtils';

const ROLE_ORDER: ServiceRole[] = [
  'serviceConductor',
  'prayer1',
  'prayer2',
  'prayer3',
  'firstLesson',
  'secondLesson',
];

export function generateScheduleForDate(
  date: Date,
  members: Member[],
  rules: Rules,
  existingSchedules: WeeklySchedule[] = [],
): WeeklySchedule {
  const isoDate = toISODate(date);
  const isThirdSunday = isThirdSundayOfMonth(date);
  const assignments: Partial<Record<ServiceRole, RoleAssignment>> = {};
  const assignedIdsToday = new Set<string>();

  const membersWithHistory = enrichWithScheduleHistory(members, existingSchedules);

  for (const role of ROLE_ORDER) {
    const eligible = getEligibleCandidates(
      role,
      membersWithHistory,
      rules,
      isThirdSunday,
    );

    const scored = scoreAndRankMembers(
      eligible,
      role,
      isoDate,
      rules,
      assignedIdsToday,
    );

    const best = pickBest(scored);

    if (best) {
      assignments[role] = {
        memberId: best.id,
        memberName: best.fullName,
        role,
      };
      assignedIdsToday.add(best.id);
    }
  }

  return {
    id: generateScheduleId(isoDate),
    date: isoDate,
    isThirdSunday,
    assignments,
    generatedAt: new Date().toISOString(),
  };
}

export function generateSchedulesForRange(
  startDate: Date,
  endDate: Date,
  members: Member[],
  rules: Rules,
  existingSchedules: WeeklySchedule[] = [],
): WeeklySchedule[] {
  const sundays = getSundaysInRange(startDate, endDate);
  const generated: WeeklySchedule[] = [];

  for (const sunday of sundays) {
    const allSchedules = [...existingSchedules, ...generated];
    const schedule = generateScheduleForDate(sunday, members, rules, allSchedules);
    generated.push(schedule);
  }

  return generated;
}

function enrichWithScheduleHistory(
  members: Member[],
  schedules: WeeklySchedule[],
): Member[] {
  const historyMap = new Map<string, Member['assignmentHistory']>();

  for (const schedule of schedules) {
    for (const [role, assignment] of Object.entries(schedule.assignments)) {
      if (!assignment) continue;
      const existing = historyMap.get(assignment.memberId) ?? [];
      existing.push({
        date: schedule.date,
        role,
        scheduleId: schedule.id,
      });
      historyMap.set(assignment.memberId, existing);
    }
  }

  return members.map((m) => {
    const history = historyMap.get(m.id) ?? [];
    const sorted = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return {
      ...m,
      assignmentHistory: sorted,
      lastAssignedDate: sorted.slice(-1)[0]?.date ?? m.lastAssignedDate,
    };
  });
}
