import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleTable } from '../components/ScheduleTable';
import { ExportButtons } from '../components/ExportButtons';
import type { ServiceRole } from '../types/Assignment';
import { Trash2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export default function ViewSchedules() {
  const { schedules, members, updateAssignment, deleteSchedule } = useApp();

  const [filterMonth, setFilterMonth] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...schedules].sort((a, b) => a.date.localeCompare(b.date));

  const filtered = filterMonth
    ? sorted.filter((s) => s.date.startsWith(filterMonth))
    : sorted;

  const months = [...new Set(schedules.map((s) => s.date.slice(0, 7)))].sort();

  function handleUpdateAssignment(
    scheduleId: string,
    role: ServiceRole,
    memberId: string,
    memberName: string,
  ) {
    updateAssignment(scheduleId, role, {
      memberId,
      memberName,
      role,
      isManualOverride: true,
    });
  }

  function handleDeleteSchedule(id: string) {
    if (confirmDeleteId === id) {
      deleteSchedule(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schedules</h1>
          <p className="text-slate-500 text-sm mt-1">
            {schedules.length} Sunday{schedules.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <ExportButtons schedules={filtered} />
      </div>

      {/* Month filter */}
      {months.length > 1 && (
        <div className="card p-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMonth('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterMonth === ''
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {months.map((m) => {
            const [year, month] = m.split('-');
            const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            });
            return (
              <button
                key={m}
                onClick={() => setFilterMonth(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterMonth === m
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-base font-medium">No schedules to display</p>
          <p className="text-sm mt-1">Generate a schedule first from the Generate page.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ScheduleTable
            schedules={filtered}
            members={members}
            onUpdateAssignment={handleUpdateAssignment}
          />
        </div>
      )}

      {/* Per-schedule delete controls */}
      {filtered.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Manage Individual Schedules</h2>
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5">
                <p className="text-sm text-slate-600">{formatDate(s.date)}</p>
                <button
                  onClick={() => handleDeleteSchedule(s.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    confirmDeleteId === s.id
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Trash2 size={13} />
                  {confirmDeleteId === s.id ? 'Confirm Delete' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
