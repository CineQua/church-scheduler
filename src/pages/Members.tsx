import { useState, useMemo } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MemberTable } from '../components/MemberTable';
import { MemberForm } from '../components/MemberForm';
import { Modal } from '../components/Modal';
import type { Member, MemberFormData } from '../types/Member';
import { rankHierarchy } from '../data/rankHierarchy';

type GenderFilter = 'All' | 'Male' | 'Female';
type RankFilter = 'All' | 'Youth' | 'Lower Rank' | 'Higher Rank';
type StatusFilter = 'All' | 'Active' | 'Inactive';
type AvailFilter = 'All' | 'Available' | 'Unavailable';

export default function Members() {
  const { members, addMember, updateMember, deleteMember } = useApp();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [rankFilter, setRankFilter] = useState<RankFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [availFilter, setAvailFilter] = useState<AvailFilter>('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  function generateId(): string {
    return `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function handleAdd(data: MemberFormData) {
    addMember({
      fullName: data.fullName,
      gender: data.gender,
      age: data.age,
      rankName: data.rankName,
      rankLevel: data.rankLevel,
      rankCategory: data.rankCategory,
      isActive: data.isActive,
      isAvailable: data.isAvailable,
      notes: data.notes,
      id: generateId(),
      assignmentHistory: [],
    });
    setShowAddModal(false);
  }

  function handleEdit(data: MemberFormData) {
    if (!editingMember) return;
    updateMember({
      ...editingMember,
      ...data,
    });
    setEditingMember(null);
  }

  function handleToggleActive(m: Member) {
    updateMember({ ...m, isActive: !m.isActive });
  }

  function handleToggleAvailable(m: Member) {
    updateMember({ ...m, isAvailable: !m.isAvailable });
  }

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (search && !m.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      if (genderFilter !== 'All' && m.gender !== genderFilter) return false;
      if (rankFilter !== 'All' && m.rankCategory !== rankFilter) return false;
      if (statusFilter === 'Active' && !m.isActive) return false;
      if (statusFilter === 'Inactive' && m.isActive) return false;
      if (availFilter === 'Available' && !m.isAvailable) return false;
      if (availFilter === 'Unavailable' && m.isAvailable) return false;
      return true;
    });
  }, [members, search, genderFilter, rankFilter, statusFilter, availFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Members</h1>
          <p className="text-slate-500 text-sm mt-1">
            {members.length} total · {members.filter((m) => m.isActive).length} active
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={16} />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
            className="input-field w-auto"
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value as RankFilter)}
            className="input-field w-auto"
          >
            <option value="All">All Ranks</option>
            <option value="Youth">Youth</option>
            <option value="Lower Rank">Lower Rank</option>
            <option value="Higher Rank">Higher Rank</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="input-field w-auto"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value as AvailFilter)}
            className="input-field w-auto"
          >
            <option value="All">All Availability</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        {filtered.length !== members.length && (
          <p className="text-xs text-slate-400 mt-2">
            Showing {filtered.length} of {members.length} members
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        <MemberTable
          members={filtered}
          onEdit={(m) => setEditingMember(m)}
          onDelete={(id) => deleteMember(id)}
          onToggleActive={handleToggleActive}
          onToggleAvailable={handleToggleAvailable}
        />
      </div>

      {/* Rank Summary */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Rank Summary</h2>
        <div className="flex flex-wrap gap-3">
          {rankHierarchy.map((rank) => {
            const count = members.filter((m) => m.rankName === rank.name).length;
            return (
              <div
                key={rank.name}
                className="text-center px-3 py-2 bg-slate-50 rounded-xl min-w-[80px]"
              >
                <p className="text-lg font-bold text-brand-700">{count}</p>
                <p className="text-xs text-slate-500 leading-tight">{rank.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Member"
      >
        <MemberForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editingMember !== null}
        onClose={() => setEditingMember(null)}
        title="Edit Member"
      >
        {editingMember && (
          <MemberForm
            initialData={editingMember}
            onSubmit={handleEdit}
            onCancel={() => setEditingMember(null)}
          />
        )}
      </Modal>
    </div>
  );
}
