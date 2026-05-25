import { useState } from 'react';
import type { Member } from '../types/Member';
import { Edit2, Trash2, CheckCircle, XCircle, User } from 'lucide-react';
import { formatDateShort } from '../utils/dateUtils';

interface MemberTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onToggleActive: (member: Member) => void;
  onToggleAvailable: (member: Member) => void;
}

export function MemberTable({
  members,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleAvailable,
}: MemberTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (deleteId === id) {
      onDelete(id);
      setDeleteId(null);
    } else {
      setDeleteId(id);
      setTimeout(() => setDeleteId(null), 3000);
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <User size={40} className="mb-3 opacity-40" />
        <p className="text-base font-medium">No members found</p>
        <p className="text-sm">Add a member to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Name</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Gender</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Age</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Rank</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Last Assigned</th>
            <th className="text-center py-3 px-4 font-semibold text-slate-600">Active</th>
            <th className="text-center py-3 px-4 font-semibold text-slate-600">Available</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr
              key={m.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                    {m.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{m.fullName}</p>
                    {m.notes && (
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{m.notes}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-slate-600">{m.gender}</td>
              <td className="py-3 px-4 text-slate-600">{m.age}</td>
              <td className="py-3 px-4">
                <span className={`rank-badge ${m.rankCategory === 'Higher Rank' ? 'rank-higher' : m.rankCategory === 'Youth' ? 'rank-youth' : 'rank-lower'}`}>
                  {m.rankName}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-500 text-xs">
                {m.lastAssignedDate ? formatDateShort(m.lastAssignedDate) : '—'}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={() => onToggleActive(m)}
                  className="transition-colors"
                  title={m.isActive ? 'Mark inactive' : 'Mark active'}
                >
                  {m.isActive ? (
                    <CheckCircle size={18} className="text-emerald-500" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </button>
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={() => onToggleAvailable(m)}
                  className="transition-colors"
                  title={m.isAvailable ? 'Mark unavailable' : 'Mark available'}
                >
                  {m.isAvailable ? (
                    <CheckCircle size={18} className="text-blue-500" />
                  ) : (
                    <XCircle size={18} className="text-slate-300" />
                  )}
                </button>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => onEdit(m)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Edit member"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      deleteId === m.id
                        ? 'text-white bg-red-500 hover:bg-red-600'
                        : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={deleteId === m.id ? 'Click again to confirm' : 'Delete member'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
