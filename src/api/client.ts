import type { Member } from '../types/Member';
import type { WeeklySchedule } from '../types/Assignment';
import type { Rules } from '../types/Rules';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${options?.method ?? 'GET'} ${url} failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  members: {
    list: () => request<Member[]>('/members'),
    create: (member: Member) =>
      request<Member>('/members', { method: 'POST', body: JSON.stringify(member) }),
    update: (member: Member) =>
      request<Member>(`/members/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify(member),
      }),
    remove: (id: string) =>
      request<void>(`/members/${id}`, { method: 'DELETE' }),
  },
  schedules: {
    list: () => request<WeeklySchedule[]>('/schedules'),
    save: (schedules: WeeklySchedule[]) =>
      request<WeeklySchedule[]>('/schedules', {
        method: 'POST',
        body: JSON.stringify(schedules),
      }),
    update: (schedule: WeeklySchedule) =>
      request<WeeklySchedule>(`/schedules/${schedule.id}`, {
        method: 'PUT',
        body: JSON.stringify(schedule),
      }),
    remove: (id: string) =>
      request<void>(`/schedules/${id}`, { method: 'DELETE' }),
  },
  rules: {
    get: () => request<Rules>('/rules'),
    update: (rules: Rules) =>
      request<Rules>('/rules', { method: 'PUT', body: JSON.stringify(rules) }),
  },
};
