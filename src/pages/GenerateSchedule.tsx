import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateSchedulesForRange, generateScheduleForDate } from '../services/scheduler';
import { ScheduleTable } from '../components/ScheduleTable';
import type { WeeklySchedule } from '../types/Assignment';
import { parseISO } from 'date-fns';

export default function GenerateSchedule() {
  const { members, schedules, rules, addSchedules } = useApp();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [preview, setPreview] = useState<WeeklySchedule[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeMembers = members.filter((m) => m.isActive);

  function handleGenerate() {
    setError('');
    if (!startDate || !endDate) {
      setError('Please select a start and end date.');
      return;
    }
    if (startDate > endDate) {
      setError('Start date must be before end date.');
      return;
    }
    if (activeMembers.length < 3) {
      setError('You need at least 3 active members to generate a schedule.');
      return;
    }

    setLoading(true);
    try {
      const generated = generateSchedulesForRange(
        parseISO(startDate),
        parseISO(endDate),
        members,
        rules,
        schedules,
      );
      if (generated.length === 0) {
        setError('No Sundays found in the selected date range.');
      } else {
        setPreview(generated);
      }
    } catch (err) {
      setError('An error occurred during generation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!preview) return;
    addSchedules(preview);
    setPreview(null);
    navigate('/schedules');
  }

  function handleRegenerateOne(scheduleId: string) {
    if (!preview) return;
    const schedule = preview.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const priorSchedules = [...schedules, ...preview.filter((s) => s.id !== scheduleId)];
    const regenerated = generateScheduleForDate(
      parseISO(schedule.date),
      members,
      rules,
      priorSchedules,
    );
    setPreview(preview.map((s) => (s.id === scheduleId ? regenerated : s)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Generate Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">
          Select a date range and generate service assignments for every Sunday.
        </p>
      </div>

      {/* Member warning */}
      {activeMembers.length < 6 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Low member count</p>
            <p className="text-xs mt-0.5">
              Only {activeMembers.length} active members — some roles may be unassigned or the
              same person may appear multiple times. Add more members for better results.
            </p>
          </div>
        </div>
      )}

      {/* Date Range Selector */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Select Date Range</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <CalendarPlus size={16} />
          )}
          {loading ? 'Generating...' : 'Generate Schedule'}
        </button>
      </div>

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              <h2 className="text-base font-semibold text-slate-800">
                Preview — {preview.length} Sunday{preview.length !== 1 ? 's' : ''} Generated
              </h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="btn-secondary text-sm">
                Discard
              </button>
              <button onClick={handleSave} className="btn-primary text-sm">
                Save Schedule
              </button>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs text-slate-400 mb-4">
              Hover over a name and click the pencil icon to make manual edits. Use the refresh
              icon to regenerate a single Sunday.
            </p>
            <ScheduleTable
              schedules={preview}
              members={members}
              onRegenerateSchedule={handleRegenerateOne}
            />
          </div>
        </div>
      )}
    </div>
  );
}
