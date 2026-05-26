import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Member } from '../types/Member';
import type { WeeklySchedule, ServiceRole, RoleAssignment } from '../types/Assignment';
import type { Rules } from '../types/Rules';
import { defaultRules } from '../data/rules';
import { api } from '../api/client';

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
  | { type: 'SET_SCHEDULES'; payload: WeeklySchedule[] }
  | { type: 'UPDATE_SCHEDULE'; payload: WeeklySchedule }
  | { type: 'DELETE_SCHEDULE'; payload: string }
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

    case 'SET_SCHEDULES':
      return {
        ...state,
        schedules: [...action.payload].sort((a, b) => a.date.localeCompare(b.date)),
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
  loading: boolean;
  error: string | null;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  importMembers: (members: Member[]) => Promise<{ created: number; updated: number }>;
  addSchedules: (schedules: WeeklySchedule[]) => void;
  updateSchedule: (schedule: WeeklySchedule) => void;
  deleteSchedule: (id: string) => void;
  updateAssignment: (
    scheduleId: string,
    role: ServiceRole,
    assignment: RoleAssignment,
  ) => void;
  updateRules: (rules: Rules) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [members, schedules, rules] = await Promise.all([
          api.members.list(),
          api.schedules.list(),
          api.rules.get(),
        ]);
        if (!cancelled) dispatch({ type: 'LOAD_STATE', payload: { members, schedules, rules } });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(promise: Promise<unknown>) {
    promise.catch((err) => {
      console.error('[persist] failed', err);
      setError('Failed to save. Check that the server is running.');
    });
  }

  const value: AppContextValue = {
    ...state,
    loading,
    error,
    addMember: (m) => {
      dispatch({ type: 'ADD_MEMBER', payload: m });
      persist(api.members.create(m));
    },
    updateMember: (m) => {
      dispatch({ type: 'UPDATE_MEMBER', payload: m });
      persist(api.members.update(m));
    },
    deleteMember: (id) => {
      dispatch({ type: 'DELETE_MEMBER', payload: id });
      persist(api.members.remove(id));
    },
    importMembers: async (members) => {
      const result = await api.members.import(members);
      dispatch({ type: 'SET_MEMBERS', payload: result.members });
      return { created: result.created, updated: result.updated };
    },
    addSchedules: (s) => {
      dispatch({ type: 'ADD_SCHEDULES', payload: s });
      persist(api.schedules.save(s));
    },
    updateSchedule: (s) => {
      dispatch({ type: 'UPDATE_SCHEDULE', payload: s });
      persist(api.schedules.update(s));
    },
    deleteSchedule: (id) => {
      dispatch({ type: 'DELETE_SCHEDULE', payload: id });
      persist(api.schedules.remove(id));
    },
    updateAssignment: (scheduleId, role, assignment) => {
      const current = state.schedules.find((s) => s.id === scheduleId);
      if (!current) return;
      const updated: WeeklySchedule = {
        ...current,
        assignments: { ...current.assignments, [role]: assignment },
      };
      dispatch({ type: 'UPDATE_SCHEDULE', payload: updated });
      persist(api.schedules.update(updated));
    },
    updateRules: (r) => {
      dispatch({ type: 'UPDATE_RULES', payload: r });
      persist(api.rules.update(r));
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading Church Scheduler…</p>
        </div>
      </div>
    );
  }

  if (error && state.members.length === 0 && state.schedules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="card p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-800 mb-2">Cannot reach the server</h1>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <p className="text-xs text-slate-400">
            Start the backend with <code className="bg-slate-100 px-1.5 py-0.5 rounded">npm run dev:all</code>{' '}
            (or <code className="bg-slate-100 px-1.5 py-0.5 rounded">npm start</code> in production),
            then reload this page.
          </p>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
