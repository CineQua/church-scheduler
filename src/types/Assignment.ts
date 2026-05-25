export type ServiceRole =
  | 'serviceConductor'
  | 'prayer1'
  | 'prayer2'
  | 'prayer3'
  | 'firstLesson'
  | 'secondLesson';

export const SERVICE_ROLE_LABELS: Record<ServiceRole, string> = {
  serviceConductor: 'Service Conductor',
  prayer1: 'Prayer 1',
  prayer2: 'Prayer 2',
  prayer3: 'Prayer 3',
  firstLesson: 'First Lesson',
  secondLesson: 'Second Lesson',
};

export const ALL_ROLES: ServiceRole[] = [
  'serviceConductor',
  'prayer1',
  'prayer2',
  'prayer3',
  'firstLesson',
  'secondLesson',
];

export interface RoleAssignment {
  memberId: string;
  memberName: string;
  role: ServiceRole;
  isManualOverride?: boolean;
}

export interface WeeklySchedule {
  id: string;
  date: string;
  isThirdSunday: boolean;
  assignments: Partial<Record<ServiceRole, RoleAssignment>>;
  generatedAt: string;
  notes?: string;
}
