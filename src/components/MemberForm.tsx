import { useState, type FormEvent } from 'react';
import type { Member, MemberFormData } from '../types/Member';
import { MemberFormSchema } from '../types/Member';
import { getRanksForGender, getRankByName } from '../data/rankHierarchy';

interface MemberFormProps {
  initialData?: Member;
  onSubmit: (data: MemberFormData) => void;
  onCancel: () => void;
}

const EMPTY_FORM: MemberFormData = {
  fullName: '',
  gender: 'Male',
  age: 25,
  rankName: 'Brother',
  rankLevel: 2,
  rankCategory: 'Lower Rank',
  isActive: true,
  isAvailable: true,
  notes: '',
};

export function MemberForm({ initialData, onSubmit, onCancel }: MemberFormProps) {
  const [form, setForm] = useState<MemberFormData>(
    initialData
      ? {
          fullName: initialData.fullName,
          gender: initialData.gender,
          age: initialData.age,
          rankName: initialData.rankName,
          rankLevel: initialData.rankLevel,
          rankCategory: initialData.rankCategory,
          isActive: initialData.isActive,
          isAvailable: initialData.isAvailable,
          notes: initialData.notes ?? '',
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleRankChange(rankName: string) {
    const rank = getRankByName(rankName);
    if (rank) {
      setForm((f) => ({
        ...f,
        rankName: rank.name,
        rankLevel: rank.level,
        rankCategory: rank.category,
      }));
    }
  }

  // When gender changes, keep the rank if it's still valid (e.g. Youth);
  // otherwise reset to that gender's entry rank (Brother / Sister).
  function handleGenderChange(gender: 'Male' | 'Female') {
    setForm((f) => {
      const ranks = getRanksForGender(gender);
      if (ranks.some((r) => r.name === f.rankName)) return { ...f, gender };
      const fallback = ranks.find((r) => r.gender === gender) ?? ranks[0];
      return {
        ...f,
        gender,
        rankName: fallback.name,
        rankLevel: fallback.level,
        rankCategory: fallback.category,
      };
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = MemberFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0]?.toString() ?? 'form';
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          className="input-field"
          placeholder="e.g. John Doe"
        />
        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => handleGenderChange(e.target.value as 'Male' | 'Female')}
            className="input-field"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={120}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
            className="input-field"
          />
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rank</label>
        <select
          value={form.rankName}
          onChange={(e) => handleRankChange(e.target.value)}
          className="input-field"
        >
          {getRanksForGender(form.gender).map((r) => (
            <option key={r.name} value={r.name}>
              {r.name} — Level {r.level} ({r.category})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Category: <span className="font-medium">{form.rankCategory}</span> &nbsp;·&nbsp;
          Level: <span className="font-medium">{form.rankLevel}</span>
        </p>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded accent-brand-600"
          />
          <span className="text-sm text-slate-700">Active Member</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
            className="w-4 h-4 rounded accent-brand-600"
          />
          <span className="text-sm text-slate-700">Available</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="input-field resize-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  );
}
