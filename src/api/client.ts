import type { Member } from '../types/Member';
import type { WeeklySchedule } from '../types/Assignment';
import type { Rules } from '../types/Rules';

const BASE = '/api';

export type Role = 'super_admin' | 'scheduler_admin' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export interface AdminUser extends AuthUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Rank {
  name: string;
  level: number;
  category: string;
}

/** Thrown for non-2xx responses; carries the HTTP status and server message. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send the httpOnly auth cookie
    ...options,
  });

  if (res.status === 401) {
    // Session missing/expired — let the app drop back to the login screen.
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    me: () => request<{ user: AuthUser; env: string }>('/auth/me'),
    login: (email: string, password: string) =>
      request<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
  },
  users: {
    list: () => request<AdminUser[]>('/users'),
    create: (input: {
      email: string;
      password: string;
      name?: string;
      role: Role;
    }) => request<AdminUser>('/users', { method: 'POST', body: JSON.stringify(input) }),
    update: (
      id: string,
      patch: { name?: string; role?: Role; isActive?: boolean; password?: string },
    ) => request<AdminUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
    remove: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  },
  ranks: {
    list: () => request<Rank[]>('/ranks'),
  },
  members: {
    list: () => request<Member[]>('/members'),
    create: (member: Member) =>
      request<Member>('/members', { method: 'POST', body: JSON.stringify(member) }),
    update: (member: Member) =>
      request<Member>(`/members/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify(member),
      }),
    remove: (id: string) => request<void>(`/members/${id}`, { method: 'DELETE' }),
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
    remove: (id: string) => request<void>(`/schedules/${id}`, { method: 'DELETE' }),
  },
  rules: {
    get: () => request<Rules>('/rules'),
    update: (rules: Rules) =>
      request<Rules>('/rules', { method: 'PUT', body: JSON.stringify(rules) }),
  },
};
