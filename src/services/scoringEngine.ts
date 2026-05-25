import type { Member } from '../types/Member';
import type { ServiceRole } from '../types/Assignment';
import type { Rules } from '../types/Rules';
import {
  daysSinceLastAssignment,
  getRecentAssignmentCount,
  servedPreviousSunday,
  servedRoleRecently,
} from '../utils/memberUtils';

export interface ScoredMember {
  member: Member;
  score: number;
  reasons: string[];
}

export function scoreMember(
  member: Member,
  role: ServiceRole,
  date: string,
  rules: Rules,
  alreadyAssignedIds: Set<string>,
): ScoredMember {
  const weights = rules.scoringWeights;
  let score = 0;
  const reasons: string[] = [];

  if (!member.isActive) {
    score += weights.inactivePenalty;
    reasons.push(`Inactive (${weights.inactivePenalty})`);
  }

  if (!member.isAvailable) {
    score += weights.unavailablePenalty;
    reasons.push(`Unavailable (${weights.unavailablePenalty})`);
  }

  if (alreadyAssignedIds.has(member.id)) {
    score += weights.alreadyAssignedToday;
    reasons.push(`Already assigned today (${weights.alreadyAssignedToday})`);
  }

  const daysSince = daysSinceLastAssignment(member);
  if (daysSince >= 28) {
    score += weights.notServedRecently;
    reasons.push(`Not served recently: ${daysSince}d (${weights.notServedRecently})`);
  } else if (daysSince >= 14) {
    score += weights.notServedInTwoSundays;
    reasons.push(`Not served in 2 Sundays (${weights.notServedInTwoSundays})`);
  }

  if (servedPreviousSunday(member, date)) {
    score += weights.servedPreviousSunday;
    reasons.push(`Served last Sunday (${weights.servedPreviousSunday})`);
  }

  if (servedRoleRecently(member, role, 28)) {
    score += weights.servedSameRoleRecently;
    reasons.push(`Served same role recently (${weights.servedSameRoleRecently})`);
  }

  const recentCount = getRecentAssignmentCount(member, 60);
  if (recentCount === 0) {
    score += weights.fewerAssignments;
    reasons.push(`0 recent assignments (${weights.fewerAssignments})`);
  } else if (recentCount === 1) {
    score += Math.floor(weights.fewerAssignments / 2);
    reasons.push(`1 recent assignment (+${Math.floor(weights.fewerAssignments / 2)})`);
  }

  const rankBonus = calculateRankScore(member, role, rules);
  score += rankBonus.score;
  reasons.push(...rankBonus.reasons);

  return { member, score, reasons };
}

function calculateRankScore(
  member: Member,
  role: ServiceRole,
  rules: Rules,
): { score: number; reasons: string[] } {
  const weights = rules.scoringWeights;
  const reasons: string[] = [];
  let score = 0;

  switch (role) {
    case 'serviceConductor': {
      const { minimumRankLevel, preferredRanks } =
        rules.serviceConductor.normalSunday;
      if (member.rankLevel < minimumRankLevel) {
        score += weights.doesNotMeetMinimumRank;
        reasons.push(`Below min rank (${weights.doesNotMeetMinimumRank})`);
      } else if (preferredRanks.includes(member.rankName)) {
        score += weights.exactPreferredRank;
        reasons.push(`Preferred rank (${weights.exactPreferredRank})`);
      } else if (member.rankLevel > minimumRankLevel) {
        score += weights.higherThanRequired;
        reasons.push(`Higher than min rank (${weights.higherThanRequired})`);
      }
      break;
    }
    case 'prayer1': {
      const preferred = rules.prayer1.preferredRankLevels ?? [2, 3, 4];
      if (preferred.includes(member.rankLevel)) {
        score += weights.exactPreferredRank;
        reasons.push(`Preferred rank for Prayer 1 (${weights.exactPreferredRank})`);
      } else if (member.rankLevel > Math.max(...preferred)) {
        score += weights.lowerThanPreferred;
        reasons.push(`Above preferred rank for Prayer 1 (${weights.lowerThanPreferred})`);
      }
      break;
    }
    case 'prayer3': {
      const preferred = rules.prayer3.preferredRankLevels ?? [5, 6, 7, 8, 9, 10];
      if (preferred.includes(member.rankLevel)) {
        score += weights.exactPreferredRank;
        reasons.push(`Preferred rank for Prayer 3 (${weights.exactPreferredRank})`);
      } else if (member.rankLevel < Math.min(...preferred)) {
        score += weights.lowerThanPreferred;
        reasons.push(`Below preferred rank for Prayer 3 (${weights.lowerThanPreferred})`);
      }
      break;
    }
    case 'prayer2':
    case 'firstLesson':
    case 'secondLesson':
      if (member.rankLevel >= 2) {
        score += weights.preferredRankMatch;
        reasons.push(`Meets rank requirement (${weights.preferredRankMatch})`);
      }
      break;
  }

  return { score, reasons };
}

export function scoreAndRankMembers(
  members: Member[],
  role: ServiceRole,
  date: string,
  rules: Rules,
  alreadyAssignedIds: Set<string>,
): ScoredMember[] {
  return members
    .map((m) => scoreMember(m, role, date, rules, alreadyAssignedIds))
    .sort((a, b) => b.score - a.score);
}

export function pickBest(scored: ScoredMember[]): Member | null {
  return scored[0]?.member ?? null;
}
