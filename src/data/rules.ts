import type { Rules } from '../types/Rules';

export const defaultRules: Rules = {
  serviceConductor: {
    normalSunday: {
      gender: 'Male',
      adultOnly: true,
      minimumRankLevel: 5,
      preferredRanks: [
        'Leader',
        'Senior Leader',
        'Evangelist',
        'Most Senior Evangelist',
        'Superior Evangelist',
        'Shepherd',
      ],
    },
    thirdSunday: {
      gender: 'Male',
      minimumAge: 11,
      maximumAge: 18,
    },
  },
  prayer1: {
    gender: 'Male',
    preferredRankLevels: [2, 3, 4],
    minimumRankLevel: 2,
  },
  prayer2: {
    gender: 'Female',
  },
  prayer3: {
    gender: 'Male',
    preferredRankLevels: [5, 6, 7, 8, 9, 10],
    minimumRankLevel: 2,
  },
  firstLesson: {
    gender: 'Male',
    minimumRankLevel: 2,
  },
  secondLesson: {
    gender: 'Male',
    minimumRankLevel: 2,
  },
  scoringWeights: {
    notServedRecently: 50,
    preferredRankMatch: 30,
    fewerAssignments: 20,
    notServedInTwoSundays: 15,
    servedPreviousSunday: -40,
    alreadyAssignedToday: -50,
    servedSameRoleRecently: -75,
    inactivePenalty: -100,
    unavailablePenalty: -100,
    ruleViolation: -1000,
    exactPreferredRank: 40,
    higherThanRequired: 15,
    lowerThanPreferred: -20,
    doesNotMeetMinimumRank: -1000,
  },
};
