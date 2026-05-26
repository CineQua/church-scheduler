import { useApp } from '../context/AppContext';
import { RulesEditor } from '../components/RulesEditor';
import type { Rules } from '../types/Rules';
import { rankHierarchy } from '../data/rankHierarchy';
import { defaultRules } from '../data/rules';

export default function Settings() {
  const { rules, updateRules, members, schedules } = useApp();

  function handleSaveRules(newRules: Rules) {
    updateRules(newRules);
  }

  function handleResetRules() {
    if (confirm('Reset all rules to default values?')) {
      updateRules(defaultRules);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings & Rules</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure scheduling rules, rank requirements, and scoring weights.
        </p>
      </div>

      {/* Rank Hierarchy Reference */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Rank Hierarchy Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Level</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Rank Name</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Category</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Members</th>
              </tr>
            </thead>
            <tbody>
              {rankHierarchy.map((rank) => {
                const count = members.filter((m) => m.rankName === rank.name).length;
                return (
                  <tr key={rank.level} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-500">{rank.level}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{rank.name}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`rank-badge ${
                          rank.category === 'Higher Rank'
                            ? 'rank-higher'
                            : rank.category === 'Youth'
                            ? 'rank-youth'
                            : 'rank-lower'
                        }`}
                      >
                        {rank.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Editor */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-800">Scheduling Rules</h2>
          <button onClick={handleResetRules} className="btn-secondary text-sm">
            Reset to Defaults
          </button>
        </div>
        <RulesEditor rules={rules} onSave={handleSaveRules} />
      </div>

      {/* Data Summary */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Data Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-brand-700">{members.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Members</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-600">
              {members.filter((m) => m.isActive).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Active</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600">{schedules.length}</p>
            <p className="text-xs text-slate-500 mt-1">Schedules</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-600">
              {schedules.reduce(
                (n, s) => n + Object.keys(s.assignments).length,
                0,
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">Assignments</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Data is stored on the server in a SQLite database and shared across all admins. It
            persists across sessions and deployments via the mounted <code className="bg-slate-100 px-1 py-0.5 rounded">/data</code> volume.
            See the README for backup and restore instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
