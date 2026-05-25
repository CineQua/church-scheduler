import type { RankCategory } from '../types/Member';

export interface RankDefinition {
  name: string;
  level: number;
  category: RankCategory;
}

export const rankHierarchy: RankDefinition[] = [
  { name: 'Youth', level: 1, category: 'Youth' },
  { name: 'Brother', level: 2, category: 'Lower Rank' },
  { name: 'Senior Brother', level: 3, category: 'Lower Rank' },
  { name: 'Assistant Leader', level: 4, category: 'Lower Rank' },
  { name: 'Leader', level: 5, category: 'Higher Rank' },
  { name: 'Senior Leader', level: 6, category: 'Higher Rank' },
  { name: 'Evangelist', level: 7, category: 'Higher Rank' },
  { name: 'Most Senior Evangelist', level: 8, category: 'Higher Rank' },
  { name: 'Superior Evangelist', level: 9, category: 'Higher Rank' },
  { name: 'Shepherd', level: 10, category: 'Higher Rank' },
];

export function getRankByName(name: string): RankDefinition | undefined {
  return rankHierarchy.find((r) => r.name === name);
}

export function getRankByLevel(level: number): RankDefinition | undefined {
  return rankHierarchy.find((r) => r.level === level);
}
