import { describe, it, expect } from 'vitest';
import { isThirdSundayOfMonth, getSundaysInRange } from '../utils/dateUtils';
import { generateScheduleForDate } from '../services/scheduler';
import { defaultRules } from '../data/rules';
import type { Member } from '../types/Member';

const mockMembers: Member[] = [
  {
    id: '1',
    fullName: 'John Senior Leader',
    gender: 'Male',
    age: 45,
    rankName: 'Senior Leader',
    rankLevel: 6,
    rankCategory: 'Higher Rank',
    isActive: true,
    isAvailable: true,
    assignmentHistory: [],
  },
  {
    id: '2',
    fullName: 'Paul Leader',
    gender: 'Male',
    age: 38,
    rankName: 'Leader',
    rankLevel: 5,
    rankCategory: 'Higher Rank',
    isActive: true,
    isAvailable: true,
    assignmentHistory: [],
  },
  {
    id: '3',
    fullName: 'Mark Brother',
    gender: 'Male',
    age: 30,
    rankName: 'Brother',
    rankLevel: 2,
    rankCategory: 'Lower Rank',
    isActive: true,
    isAvailable: true,
    assignmentHistory: [],
  },
  {
    id: '4',
    fullName: 'Grace Sister',
    gender: 'Female',
    age: 32,
    rankName: 'Brother',
    rankLevel: 2,
    rankCategory: 'Lower Rank',
    isActive: true,
    isAvailable: true,
    assignmentHistory: [],
  },
  {
    id: '5',
    fullName: 'James Assistant',
    gender: 'Male',
    age: 27,
    rankName: 'Assistant Leader',
    rankLevel: 4,
    rankCategory: 'Lower Rank',
    isActive: true,
    isAvailable: true,
    assignmentHistory: [],
  },
  {
    id: '6',
    fullName: 'Young Timothy',
    gender: 'Male',
    age: 15,
    rankName: 'Youth',
    rankLevel: 1,
    rankCategory: 'Youth',
    isActive: true,
    isAvailable: true,
    assignmentHistory: [],
  },
];

describe('dateUtils', () => {
  it('detects third Sunday correctly', () => {
    // June 2026 Sundays: 7, 14, 21, 28 — third Sunday is June 21
    expect(isThirdSundayOfMonth(new Date(2026, 5, 21))).toBe(true);
    expect(isThirdSundayOfMonth(new Date(2026, 5, 14))).toBe(false);
    expect(isThirdSundayOfMonth(new Date(2026, 5, 28))).toBe(false);
  });

  it('gets all Sundays in range', () => {
    const sundays = getSundaysInRange(new Date(2026, 5, 1), new Date(2026, 5, 30));
    expect(sundays).toHaveLength(4);
    expect(sundays[0].getDate()).toBe(7);
    expect(sundays[2].getDate()).toBe(21);
  });
});

describe('scheduler', () => {
  it('generates a schedule for a regular Sunday', () => {
    const sunday = new Date(2026, 5, 7); // June 7, 2026 (first Sunday)
    const schedule = generateScheduleForDate(sunday, mockMembers, defaultRules);
    expect(schedule.isThirdSunday).toBe(false);
    expect(schedule.assignments.serviceConductor).toBeDefined();
    // Conductor must be male and high rank
    const conductor = mockMembers.find(
      (m) => m.id === schedule.assignments.serviceConductor?.memberId,
    );
    expect(conductor?.gender).toBe('Male');
    expect(conductor?.rankLevel).toBeGreaterThanOrEqual(5);
  });

  it('assigns youth conductor on third Sunday', () => {
    const sunday = new Date(2026, 5, 21); // June 21, 2026 (third Sunday)
    const schedule = generateScheduleForDate(sunday, mockMembers, defaultRules);
    expect(schedule.isThirdSunday).toBe(true);
    const conductor = mockMembers.find(
      (m) => m.id === schedule.assignments.serviceConductor?.memberId,
    );
    expect(conductor?.age).toBeGreaterThanOrEqual(11);
    expect(conductor?.age).toBeLessThanOrEqual(18);
  });

  it('assigns female to prayer 2', () => {
    const sunday = new Date(2026, 5, 7);
    const schedule = generateScheduleForDate(sunday, mockMembers, defaultRules);
    const prayer2Member = mockMembers.find(
      (m) => m.id === schedule.assignments.prayer2?.memberId,
    );
    expect(prayer2Member?.gender).toBe('Female');
  });
});
