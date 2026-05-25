import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  CalendarDays,
  Settings,
  Church,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/members', label: 'Members', icon: Users, end: false },
  { to: '/generate', label: 'Generate', icon: CalendarPlus, end: false },
  { to: '/schedules', label: 'Schedules', icon: CalendarDays, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function Navbar() {
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
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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

        <div className="px-6 py-4 border-t border-brand-700">
          <p className="text-xs text-brand-400">Church Scheduler v0.1</p>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
        </div>
      </nav>
    </>
  );
}
