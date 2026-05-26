import type { RankCategory } from '../types/Member';

export type RankGender = 'Male' | 'Female' | 'Any';

export interface RankDefinition {
  name: string;
  level: number;
  category: RankCategory;
  /** Which gender this rank applies to. 'Any' (Youth) is shared by both. */
  gender: RankGender;
}

// Youth is shared by both genders; it is defined once here.
const YOUTH: RankDefinition = { name: 'Youth', level: 1, category: 'Youth', gender: 'Any' };

export const maleRanks: RankDefinition[] = [
  YOUTH,
  { name: 'Brother', level: 2, category: 'Lower Rank', gender: 'Male' },
  { name: 'Senior Brother', level: 3, category: 'Lower Rank', gender: 'Male' },
  { name: 'Assistant Leader', level: 4, category: 'Lower Rank', gender: 'Male' },
  { name: 'Leader', level: 5, category: 'Higher Rank', gender: 'Male' },
  { name: 'Senior Leader', level: 6, category: 'Higher Rank', gender: 'Male' },
  { name: 'Evangelist', level: 7, category: 'Higher Rank', gender: 'Male' },
  { name: 'Most Senior Evangelist', level: 8, category: 'Higher Rank', gender: 'Male' },
  { name: 'Superior Evangelist', level: 9, category: 'Higher Rank', gender: 'Male' },
  { name: 'Shepherd', level: 10, category: 'Higher Rank', gender: 'Male' },
];

export const femaleRanks: RankDefinition[] = [
  YOUTH,
  { name: 'Sister', level: 2, category: 'Lower Rank', gender: 'Female' },
  { name: 'Elder Sister', level: 3, category: 'Lower Rank', gender: 'Female' },
  { name: 'Senior Elder Sister', level: 4, category: 'Lower Rank', gender: 'Female' },
  { name: 'Superior Senior Elder Sister', level: 5, category: 'Higher Rank', gender: 'Female' },
  { name: 'Mother Celestial', level: 6, category: 'Higher Rank', gender: 'Female' },
];

// All distinct ranks (Youth listed once), used for reference data and summaries.
export const allRanks: RankDefinition[] = [
  YOUTH,
  ...maleRanks.filter((r) => r.gender !== 'Any'),
  ...femaleRanks.filter((r) => r.gender !== 'Any'),
];

/** Backwards-compatible alias (was the single male-only list). */
export const rankHierarchy = allRanks;

/** Ranks selectable for a given member gender (their ranks + shared Youth). */
export function getRanksForGender(gender: 'Male' | 'Female'): RankDefinition[] {
  return gender === 'Female' ? femaleRanks : maleRanks;
}

export function getRankByName(name: string): RankDefinition | undefined {
  return allRanks.find((r) => r.name === name);
}

/** Look up a rank by level for a specific gender (levels repeat across genders). */
export function getRankByLevel(
  level: number,
  gender: 'Male' | 'Female' = 'Male',
): RankDefinition | undefined {
  return getRanksForGender(gender).find((r) => r.level === level);
}
