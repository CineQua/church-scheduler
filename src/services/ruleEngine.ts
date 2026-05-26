import type { Member } from '../types/Member';
import type { ServiceRole } from '../types/Assignment';
import type { Rules } from '../types/Rules';
import { isAdult, isYouth } from '../utils/memberUtils';

export function getEligibleCandidates(
  role: ServiceRole,
  members: Member[],
  rules: Rules,
  isThirdSunday: boolean,
): Member[] {
  switch (role) {
    case 'serviceConductor':
      return getEligibleConductors(members, rules, isThirdSunday);
    case 'prayer1':
      return getEligiblePrayer1(members, rules, isThirdSunday);
    case 'prayer2':
      return getEligiblePrayer2(members, rules, isThirdSunday);
    case 'prayer3':
      return getEligiblePrayer3(members, rules, isThirdSunday);
    case 'firstLesson':
    case 'secondLesson':
      return getEligibleReaders(members, rules, isThirdSunday);
    default:
      return [];
  }
}

/**
 * The third Sunday is "Youth Sunday": every role is filled by youth within the
 * configured age range. Only the per-role gender constraint still applies —
 * conductor, prayers 1 & 3, and the lessons are male youth; prayer 2 is a
 * female youth.
 */
function isYouthForThirdSunday(member: Member, rules: Rules): boolean {
  const { minimumAge, maximumAge } = rules.serviceConductor.thirdSunday;
  return (
    member.isActive &&
    member.isAvailable &&
    member.age >= minimumAge &&
    member.age <= maximumAge
  );
}

function getEligibleConductors(
  members: Member[],
  rules: Rules,
  isThirdSunday: boolean,
): Member[] {
  if (isThirdSunday) {
    return members.filter(
      (m) => isYouthForThirdSunday(m, rules) && m.gender === 'Male',
    );
  }

  const { minimumRankLevel } = rules.serviceConductor.normalSunday;
  return members.filter(
    (m) =>
      m.isActive &&
      m.isAvailable &&
      m.gender === 'Male' &&
      isAdult(m) &&
      m.rankLevel >= minimumRankLevel,
  );
}

function getEligiblePrayer1(
  members: Member[],
  rules: Rules,
  isThirdSunday: boolean,
): Member[] {
  if (isThirdSunday) {
    return members.filter(
      (m) => isYouthForThirdSunday(m, rules) && m.gender === 'Male',
    );
  }

  const minLevel = rules.prayer1.minimumRankLevel ?? 2;
  return members.filter(
    (m) =>
      m.isActive &&
      m.isAvailable &&
      m.gender === 'Male' &&
      m.rankLevel >= minLevel,
  );
}

function getEligiblePrayer2(
  members: Member[],
  rules: Rules,
  isThirdSunday: boolean,
): Member[] {
  if (isThirdSunday) {
    return members.filter(
      (m) => isYouthForThirdSunday(m, rules) && m.gender === 'Female',
    );
  }

  return members.filter(
    (m) => m.isActive && m.isAvailable && m.gender === 'Female',
  );
}

function getEligiblePrayer3(
  members: Member[],
  rules: Rules,
  isThirdSunday: boolean,
): Member[] {
  if (isThirdSunday) {
    return members.filter(
      (m) => isYouthForThirdSunday(m, rules) && m.gender === 'Male',
    );
  }

  const minLevel = rules.prayer3.minimumRankLevel ?? 2;
  return members.filter(
    (m) =>
      m.isActive &&
      m.isAvailable &&
      m.gender === 'Male' &&
      m.rankLevel >= minLevel,
  );
}

function getEligibleReaders(
  members: Member[],
  rules: Rules,
  isThirdSunday: boolean,
): Member[] {
  if (isThirdSunday) {
    return members.filter(
      (m) => isYouthForThirdSunday(m, rules) && m.gender === 'Male',
    );
  }

  return members.filter(
    (m) =>
      m.isActive &&
      m.isAvailable &&
      m.gender === 'Male' &&
      m.rankLevel >= rules.firstLesson.minimumRankLevel,
  );
}

export function isYouthEligibleForThirdSunday(
  member: Member,
  rules: Rules,
): boolean {
  return (
    member.gender === 'Male' &&
    isYouth(member) &&
    member.age >= rules.serviceConductor.thirdSunday.minimumAge &&
    member.age <= rules.serviceConductor.thirdSunday.maximumAge
  );
}
