import { describe, it, expect } from 'vitest';
import { membersToCsv, membersToJson, parseMembersFile } from '../services/memberIO';
import type { Member } from '../types/Member';

const sample: Member[] = [
  {
    id: 'm1',
    fullName: 'John Doe',
    gender: 'Male',
    age: 30,
    rankName: 'Brother',
    rankLevel: 2,
    rankCategory: 'Lower Rank',
    isActive: true,
    isAvailable: true,
    assignmentHistory: [],
    notes: 'Likes, commas "and" quotes',
  },
  {
    id: 'm2',
    fullName: 'Mary Jane',
    gender: 'Female',
    age: 25,
    rankName: 'Sister',
    rankLevel: 2,
    rankCategory: 'Lower Rank',
    isActive: false,
    isAvailable: true,
    assignmentHistory: [],
  },
];

describe('memberIO', () => {
  it('round-trips members through CSV (incl. commas/quotes in notes)', () => {
    const { valid, errors } = parseMembersFile(membersToCsv(sample), 'members.csv');
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(2);
    expect(valid[0]).toMatchObject({
      id: 'm1',
      fullName: 'John Doe',
      gender: 'Male',
      age: 30,
      rankName: 'Brother',
      rankLevel: 2,
      isActive: true,
      notes: 'Likes, commas "and" quotes',
    });
    expect(valid[1]).toMatchObject({ id: 'm2', gender: 'Female', isActive: false });
  });

  it('round-trips through JSON with full fidelity', () => {
    const { valid, errors } = parseMembersFile(membersToJson(sample), 'members.json');
    expect(errors).toEqual([]);
    expect(valid).toEqual(sample);
  });

  it('derives rank level/category from rank name and generates a missing id', () => {
    const csv =
      'id,fullName,gender,age,rankName,isActive,isAvailable\n,Grace Lee,Female,40,Mother Celestial,true,true';
    const { valid, errors } = parseMembersFile(csv, 'm.csv');
    expect(errors).toEqual([]);
    expect(valid[0].rankLevel).toBe(6);
    expect(valid[0].rankCategory).toBe('Higher Rank');
    expect(valid[0].id).toBeTruthy();
  });

  it('skips invalid rows but keeps valid ones', () => {
    const csv =
      'id,fullName,gender,age,rankName,rankLevel,rankCategory,isActive,isAvailable\n' +
      'm1,Real Person,Male,30,Brother,2,Lower Rank,true,true\n' +
      'm2,Bad Gender,Martian,30,Brother,2,Lower Rank,true,true';
    const { valid, errors } = parseMembersFile(csv, 'm.csv');
    expect(valid).toHaveLength(1);
    expect(valid[0].fullName).toBe('Real Person');
    expect(errors).toHaveLength(1);
  });
});
