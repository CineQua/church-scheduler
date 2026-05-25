import { useState } from 'react';
import type { WeeklySchedule, ServiceRole } from '../types/Assignment';
import { ALL_ROLES, SERVICE_ROLE_LABELS } from '../types/Assignment';
import type { Member } from '../types/Member';
import { formatDate } from '../utils/dateUtils';
import { Edit2, Check, X, RefreshCw } from 'lucide-react';

interface ScheduleTableProps {
  schedules: WeeklySchedule[];
  members: Member[];
  onUpdateAssignment?: (scheduleId: string, role: ServiceRole, memberId: string, memberName: string) => void;
  onRegenerateSchedule?: (scheduleId: string) => void;
  readOnly?: boolean;
}

interface EditState {
  scheduleId: string;
  role: ServiceRole;
  value: string;
}

export function ScheduleTable({
  schedules,
  members,
  onUpdateAssignment,
  onRegenerateSchedule,
  readOnly = false,
}: ScheduleTableProps) {
  const [editing, setEditing] = useState<EditState | null>(null);

  function startEdit(scheduleId: string, role: ServiceRole, currentMemberId: string) {
    setEditing({ scheduleId, role, value: currentMemberId });
  }

  function commitEdit() {
    if (!editing) return;
    const member = members.find((m) => m.id === editing.value);
    if (member && onUpdateAssignment) {
      onUpdateAssignment(editing.scheduleId, editing.role, member.id, member.fullName);
    }
    setEditing(null);
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-base font-medium">No schedules generated yet</p>
        <p className="text-sm">Go to Generate Schedule to create one</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="bg-brand-700 text-white">
            <th className="py-3 px-4 text-left font-semibold rounded-tl-lg">Date</th>
            {ALL_ROLES.map((role, i) => (
              <th
                key={role}
                className={`py-3 px-4 text-left font-semibold ${i === ALL_ROLES.length - 1 && readOnly ? 'rounded-tr-lg' : ''}`}
              >
                {SERVICE_ROLE_LABELS[role]}
              </th>
            ))}
            {!readOnly && <th className="py-3 px-4 rounded-tr-lg" />}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule, idx) => (
            <tr
              key={schedule.id}
              className={`border-b border-slate-100 transition-colors ${
                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              } hover:bg-brand-50`}
            >
              <td className="py-3 px-4">
                <p className="font-semibold text-slate-800">{formatDate(schedule.date)}</p>
                {schedule.isThirdSunday && (
                  <span className="inline-block mt-0.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                    Third Sunday
                  </span>
                )}
              </td>

              {ALL_ROLES.map((role) => {
                const assignment = schedule.assignments[role];
                const isEditingThis =
                  editing?.scheduleId === schedule.id && editing?.role === role;

                return (
                  <td key={role} className="py-3 px-4">
                    {isEditingThis ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={editing.value}
                          onChange={(e) =>
                            setEditing((prev) => prev ? { ...prev, value: e.target.value } : null)
                          }
                          className="text-sm border border-brand-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          autoFocus
                        >
                          <option value="">— Unassigned —</option>
                          {members
                            .filter((m) => m.isActive)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.fullName}
                              </option>
                            ))}
                        </select>
                        <button onClick={commitEdit} className="p-1 text-emerald-600 hover:text-emerald-700">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditing(null)} className="p-1 text-red-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group">
                        <span
                          className={`${
                            assignment
                              ? 'text-slate-700 font-medium'
                              : 'text-red-400 italic'
                          }`}
                        >
                          {assignment ? assignment.memberName : 'Unassigned'}
                        </span>
                        {assignment?.isManualOverride && (
                          <span className="text-xs text-brand-400 ml-1">*</span>
                        )}
                        {!readOnly && onUpdateAssignment && (
                          <button
                            onClick={() =>
                              startEdit(schedule.id, role, assignment?.memberId ?? '')
                            }
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-brand-500 transition-all"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}

              {!readOnly && onRegenerateSchedule && (
                <td className="py-3 px-4">
                  <button
                    onClick={() => onRegenerateSchedule(schedule.id)}
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Regenerate this Sunday"
                  >
                    <RefreshCw size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
