import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, Zap, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/DashboardCards';
import { getUpcomingSundays } from '../utils/dateUtils';
import { formatDate } from '../utils/dateUtils';

export default function Dashboard() {
  const { members, schedules } = useApp();
  const navigate = useNavigate();

  const activeMembers = members.filter((m) => m.isActive);
  const upcomingSundays = getUpcomingSundays(4);

  const recentSchedules = [...schedules]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const nextScheduledDates = schedules
    .filter((s) => s.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome to Church Scheduler — manage members and generate service assignments.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={members.length}
          subtitle={`${members.filter((m) => !m.isActive).length} inactive`}
          icon={<Users size={22} />}
          color="indigo"
        />
        <StatCard
          title="Active Members"
          value={activeMembers.length}
          subtitle={`${activeMembers.filter((m) => m.isAvailable).length} available`}
          icon={<UserCheck size={22} />}
          color="emerald"
        />
        <StatCard
          title="Schedules Generated"
          value={schedules.length}
          subtitle="total Sundays"
          icon={<CalendarDays size={22} />}
          color="blue"
        />
        <StatCard
          title="Upcoming Sundays"
          value={upcomingSundays.length}
          subtitle="in the next 4 weeks"
          icon={<Zap size={22} />}
          color="amber"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Sundays */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Upcoming Sundays</h2>
          <div className="space-y-2">
            {upcomingSundays.map((sunday, i) => {
              const isoDate = sunday.toISOString().split('T')[0];
              const scheduled = schedules.find((s) => s.date === isoDate);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{formatDate(sunday)}</p>
                    <p className="text-xs text-slate-400">Sunday {i + 1}</p>
                  </div>
                  {scheduled ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      Scheduled
                    </span>
                  ) : (
                    <button
                      onClick={() => navigate('/generate')}
                      className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium hover:bg-brand-200 transition-colors"
                    >
                      Generate
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Schedules */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Recent Schedules</h2>
          {recentSchedules.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No schedules yet.</p>
              <button
                onClick={() => navigate('/generate')}
                className="mt-2 text-sm text-brand-600 hover:underline"
              >
                Generate your first schedule →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSchedules.map((s) => (
                <div key={s.id} className="py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-700">{formatDate(s.date)}</p>
                    {s.isThirdSunday && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        3rd Sunday
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Conductor:{' '}
                    <span className="font-medium text-slate-700">
                      {s.assignments.serviceConductor?.memberName ?? 'Unassigned'}
                    </span>
                  </p>
                </div>
              ))}
              <button
                onClick={() => navigate('/schedules')}
                className="text-sm text-brand-600 hover:underline pt-1 block"
              >
                View all schedules →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/members')} className="btn-secondary">
            Manage Members
          </button>
          <button onClick={() => navigate('/generate')} className="btn-primary">
            Generate Schedule
          </button>
          <button onClick={() => navigate('/schedules')} className="btn-secondary">
            View Schedules
          </button>
        </div>
      </div>

      {nextScheduledDates.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Next Scheduled Services
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Date</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Conductor</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Prayer 1</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Prayer 2</th>
                </tr>
              </thead>
              <tbody>
                {nextScheduledDates.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="py-2 px-2 font-medium">{formatDate(s.date)}</td>
                    <td className="py-2 px-2 text-slate-600">
                      {s.assignments.serviceConductor?.memberName ?? '—'}
                    </td>
                    <td className="py-2 px-2 text-slate-600">
                      {s.assignments.prayer1?.memberName ?? '—'}
                    </td>
                    <td className="py-2 px-2 text-slate-600">
                      {s.assignments.prayer2?.memberName ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
