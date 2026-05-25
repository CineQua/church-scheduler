export interface ServiceConductorNormalRules {
  gender: 'Male';
  adultOnly: boolean;
  minimumRankLevel: number;
  preferredRanks: string[];
}

export interface ServiceConductorThirdSundayRules {
  gender: 'Male';
  minimumAge: number;
  maximumAge: number;
}

export interface PrayerRules {
  gender: 'Male' | 'Female';
  preferredRankLevels?: number[];
  minimumRankLevel?: number;
}

export interface BibleReadingRules {
  gender: 'Male';
  minimumRankLevel: number;
}

export interface ScoringWeights {
  notServedRecently: number;
  preferredRankMatch: number;
  fewerAssignments: number;
  notServedInTwoSundays: number;
  servedPreviousSunday: number;
  alreadyAssignedToday: number;
  servedSameRoleRecently: number;
  inactivePenalty: number;
  unavailablePenalty: number;
  ruleViolation: number;
  exactPreferredRank: number;
  higherThanRequired: number;
  lowerThanPreferred: number;
  doesNotMeetMinimumRank: number;
}

export interface Rules {
  serviceConductor: {
    normalSunday: ServiceConductorNormalRules;
    thirdSunday: ServiceConductorThirdSundayRules;
  };
  prayer1: PrayerRules;
  prayer2: PrayerRules;
  prayer3: PrayerRules;
  firstLesson: BibleReadingRules;
  secondLesson: BibleReadingRules;
  scoringWeights: ScoringWeights;
}
