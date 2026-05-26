import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users as UsersIcon,
  CalendarPlus,
  CalendarDays,
  Settings,
  ShieldCheck,
  Church,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

type Gate = 'canWrite' | 'isSuperAdmin';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  requires?: Gate;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/members', label: 'Members', icon: UsersIcon, end: false },
  { to: '/generate', label: 'Generate', icon: CalendarPlus, end: false, requires: 'canWrite' },
  { to: '/schedules', label: 'Schedules', icon: CalendarDays, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false, requires: 'canWrite' },
  { to: '/users', label: 'Users', icon: ShieldCheck, end: false, requires: 'isSuperAdmin' },
];

export function Navbar() {
  const auth = useAuth();
  const { user, logout } = auth;
  const [showChangePw, setShowChangePw] = useState(false);

  const items = NAV_ITEMS.filter((item) => !item.requires || auth[item.requires]);

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-brand-900 text-white fixed left-0 top-0 bottom-0 z-40">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-700">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Church size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Church</p>
            <p className="font-bold text-sm leading-tight text-brand-300">Scheduler</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-brand-700 space-y-3">
          {user && (
            <div className="px-2">
              <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
              <p className="text-xs text-brand-300">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
          <button
            onClick={() => setShowChangePw(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors"
          >
            <KeyRound size={16} />
            Change password
          </button>
          <button
            onClick={() => void logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="flex items-center justify-around py-2">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setShowChangePw(true)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400"
          >
            <KeyRound size={20} />
            Password
          </button>
          <button
            onClick={() => void logout()}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400"
          >
            <LogOut size={20} />
            Sign out
          </button>
        </div>
      </nav>

      <ChangePasswordModal isOpen={showChangePw} onClose={() => setShowChangePw(false)} />
    </>
  );
}
