import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { Member } from '../types/Member';
import type { WeeklySchedule, ServiceRole, RoleAssignment } from '../types/Assignment';
import type { Rules } from '../types/Rules';
import { defaultRules } from '../data/rules';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  members: Member[];
  schedules: WeeklySchedule[];
  rules: Rules;
}

const INITIAL_STATE: AppState = {
  members: [],
  schedules: [],
  rules: defaultRules,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'SET_MEMBERS'; payload: Member[] }
  | { type: 'ADD_SCHEDULES'; payload: WeeklySchedule[] }
  | { type: 'UPDATE_SCHEDULE'; payload: WeeklySchedule }
  | { type: 'DELETE_SCHEDULE'; payload: string }
  | { type: 'UPDATE_ASSIGNMENT'; payload: { scheduleId: string; role: ServiceRole; assignment: RoleAssignment } }
  | { type: 'UPDATE_RULES'; payload: Rules }
  | { type: 'LOAD_STATE'; payload: AppState };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };

    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.payload.id ? action.payload : m,
        ),
      };

    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.payload),
      };

    case 'SET_MEMBERS':
      return { ...state, members: action.payload };

    case 'ADD_SCHEDULES':
      return {
        ...state,
        schedules: [
          ...state.schedules.filter(
            (s) => !action.payload.some((ns) => ns.date === s.date),
          ),
          ...action.payload,
        ].sort((a, b) => a.date.localeCompare(b.date)),
      };

    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };

    case 'DELETE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter((s) => s.id !== action.payload),
      };

    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        schedules: state.schedules.map((s) => {
          if (s.id !== action.payload.scheduleId) return s;
          return {
            ...s,
            assignments: {
              ...s.assignments,
              [action.payload.role]: action.payload.assignment,
            },
          };
        }),
      };

    case 'UPDATE_RULES':
      return { ...state, rules: action.payload };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue extends AppState {
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  addSchedules: (schedules: WeeklySchedule[]) => void;
  updateSchedule: (schedule: WeeklySchedule) => void;
  deleteSchedule: (id: string) => void;
  updateAssignment: (scheduleId: string, role: ServiceRole, assignment: RoleAssignment) => void;
  updateRules: (rules: Rules) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'church-scheduler-state';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AppState>;
        return {
          members: parsed.members ?? [],
          schedules: parsed.schedules ?? [],
          rules: parsed.rules ?? defaultRules,
        };
      }
    } catch {
      // corrupted storage — start fresh
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value: AppContextValue = {
    ...state,
    addMember: (m) => dispatch({ type: 'ADD_MEMBER', payload: m }),
    updateMember: (m) => dispatch({ type: 'UPDATE_MEMBER', payload: m }),
    deleteMember: (id) => dispatch({ type: 'DELETE_MEMBER', payload: id }),
    addSchedules: (s) => dispatch({ type: 'ADD_SCHEDULES', payload: s }),
    updateSchedule: (s) => dispatch({ type: 'UPDATE_SCHEDULE', payload: s }),
    deleteSchedule: (id) => dispatch({ type: 'DELETE_SCHEDULE', payload: id }),
    updateAssignment: (scheduleId, role, assignment) =>
      dispatch({ type: 'UPDATE_ASSIGNMENT', payload: { scheduleId, role, assignment } }),
    updateRules: (r) => dispatch({ type: 'UPDATE_RULES', payload: r }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
