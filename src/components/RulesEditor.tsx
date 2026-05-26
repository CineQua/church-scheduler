import { useState } from 'react';
import type { Rules, ScoringWeights } from '../types/Rules';
import { maleRanks } from '../data/rankHierarchy';
import { Save } from 'lucide-react';

interface RulesEditorProps {
  rules: Rules;
  onSave: (rules: Rules) => void;
}

export function RulesEditor({ rules, onSave }: RulesEditorProps) {
  const [draft, setDraft] = useState<Rules>(JSON.parse(JSON.stringify(rules)));
  const [saved, setSaved] = useState(false);

  function updateWeight(key: keyof ScoringWeights, value: number) {
    setDraft((d) => ({
      ...d,
      scoringWeights: { ...d.scoringWeights, [key]: value },
    }));
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Service Conductor */}
      <section>
        <h3 className="text-base font-semibold text-slate-800 mb-3">Service Conductor</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-600 mb-3">Regular Sunday</p>
            <div className="space-y-3">
              <div>
                <label className="label">Minimum Rank Level</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={draft.serviceConductor.normalSunday.minimumRankLevel}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      serviceConductor: {
                        ...d.serviceConductor,
                        normalSunday: {
                          ...d.serviceConductor.normalSunday,
                          minimumRankLevel: Number(e.target.value),
                        },
                      },
                    }))
                  }
                  className="input-field"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {maleRanks.find(
                    (r) => r.level === draft.serviceConductor.normalSunday.minimumRankLevel,
                  )?.name ?? '—'}{' '}
                  and above
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.serviceConductor.normalSunday.adultOnly}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      serviceConductor: {
                        ...d.serviceConductor,
                        normalSunday: {
                          ...d.serviceConductor.normalSunday,
                          adultOnly: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-slate-700">Adults only (age 19+)</span>
              </label>
            </div>
          </div>

          <div className="card p-4">
            <p className="text-sm font-medium text-slate-600 mb-3">Third Sunday (Youth)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Min Age</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={draft.serviceConductor.thirdSunday.minimumAge}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      serviceConductor: {
                        ...d.serviceConductor,
                        thirdSunday: {
                          ...d.serviceConductor.thirdSunday,
                          minimumAge: Number(e.target.value),
                        },
                      },
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Max Age</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={draft.serviceConductor.thirdSunday.maximumAge}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      serviceConductor: {
                        ...d.serviceConductor,
                        thirdSunday: {
                          ...d.serviceConductor.thirdSunday,
                          maximumAge: Number(e.target.value),
                        },
                      },
                    }))
                  }
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimum Rank Levels */}
      <section>
        <h3 className="text-base font-semibold text-slate-800 mb-3">Minimum Rank Levels</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(['prayer1', 'prayer3'] as const).map((role) => (
            <div key={role} className="card p-4">
              <label className="label">
                {role === 'prayer1' ? 'Prayer 1' : 'Prayer 3'} — Min Rank Level
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={draft[role].minimumRankLevel ?? 2}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [role]: { ...d[role], minimumRankLevel: Number(e.target.value) },
                  }))
                }
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">
                {maleRanks.find((r) => r.level === (draft[role].minimumRankLevel ?? 2))?.name ?? '—'} and above
              </p>
            </div>
          ))}
          {(['firstLesson', 'secondLesson'] as const).map((role) => (
            <div key={role} className="card p-4">
              <label className="label">
                {role === 'firstLesson' ? 'First Lesson' : 'Second Lesson'} — Min Rank Level
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={draft[role].minimumRankLevel}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [role]: { ...d[role], minimumRankLevel: Number(e.target.value) },
                  }))
                }
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">
                {maleRanks.find((r) => r.level === draft[role].minimumRankLevel)?.name ?? '—'} and above
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring Weights */}
      <section>
        <h3 className="text-base font-semibold text-slate-800 mb-3">Scoring Weights</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(
            Object.entries(draft.scoringWeights) as [keyof ScoringWeights, number][]
          ).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100">
              <label className="text-sm text-slate-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => updateWeight(key, Number(e.target.value))}
                className="w-24 text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={15} />
          {saved ? 'Saved!' : 'Save Rules'}
        </button>
      </div>
    </div>
  );
}
