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
      return getEligiblePrayer1(members, rules);
    case 'prayer2':
      return getEligiblePrayer2(members, rules);
    case 'prayer3':
      return getEligiblePrayer3(members, rules);
    case 'firstLesson':
    case 'secondLesson':
      return getEligibleReaders(members, rules);
    default:
      return [];
  }
}

function getEligibleConductors(
  members: Member[],
  rules: Rules,
  isThirdSunday: boolean,
): Member[] {
  if (isThirdSunday) {
    const { minimumAge, maximumAge } = rules.serviceConductor.thirdSunday;
    return members.filter(
      (m) =>
        m.isActive &&
        m.isAvailable &&
        m.gender === 'Male' &&
        m.age >= minimumAge &&
        m.age <= maximumAge,
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

function getEligiblePrayer1(members: Member[], rules: Rules): Member[] {
  const minLevel = rules.prayer1.minimumRankLevel ?? 2;
  return members.filter(
    (m) =>
      m.isActive &&
      m.isAvailable &&
      m.gender === 'Male' &&
      m.rankLevel >= minLevel,
  );
}

function getEligiblePrayer2(members: Member[], _rules: Rules): Member[] {
  return members.filter(
    (m) => m.isActive && m.isAvailable && m.gender === 'Female',
  );
}

function getEligiblePrayer3(members: Member[], rules: Rules): Member[] {
  const minLevel = rules.prayer3.minimumRankLevel ?? 2;
  return members.filter(
    (m) =>
      m.isActive &&
      m.isAvailable &&
      m.gender === 'Male' &&
      m.rankLevel >= minLevel,
  );
}

function getEligibleReaders(members: Member[], rules: Rules): Member[] {
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
