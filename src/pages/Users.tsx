import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus, Trash2, ShieldCheck, KeyRound } from 'lucide-react';
import { api, type AdminUser, type Role, ApiError } from '../api/client';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { Modal } from '../components/Modal';

const ROLE_OPTIONS: Role[] = ['super_admin', 'scheduler_admin', 'viewer'];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  async function refresh() {
    try {
      setUsers(await api.users.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleRoleChange(u: AdminUser, role: Role) {
    setError(null);
    try {
      await api.users.update(u.id, { role });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  }

  async function handleToggleActive(u: AdminUser) {
    setError(null);
    try {
      await api.users.update(u.id, { isActive: !u.isActive });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  }

  async function handleDelete(u: AdminUser) {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.users.remove(u.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Users</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage who can access the scheduler and what they can do.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Role</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
              <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{u.name || u.email}</div>
                      <div className="text-xs text-slate-400">{u.email}{isSelf && ' (you)'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                        className="input-field w-auto py-1.5 disabled:opacity-60"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={isSelf}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full disabled:opacity-60 ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setResetUser(u)}
                          title="Reset password"
                          className="text-slate-400 hover:text-brand-600"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot delete yourself' : 'Delete user'}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="text-brand-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-500 space-y-1">
            <p><strong className="text-slate-700">Super Admin</strong> — full access, including managing users.</p>
            <p><strong className="text-slate-700">Scheduler Admin</strong> — manage members, schedules and rules.</p>
            <p><strong className="text-slate-700">Viewer</strong> — read-only access to members and schedules.</p>
          </div>
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Admin User">
        <AddUserForm
          onCreated={async () => {
            setShowAdd(false);
            await refresh();
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal
        isOpen={resetUser !== null}
        onClose={() => setResetUser(null)}
        title="Reset Password"
      >
        {resetUser && (
          <ResetPasswordForm
            user={resetUser}
            onDone={() => setResetUser(null)}
            onCancel={() => setResetUser(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function ResetPasswordForm({
  user,
  onDone,
  onCancel,
}: {
  user: AdminUser;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.users.update(user.id, { password });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-500">
        Set a new password for <strong className="text-slate-700">{user.name || user.email}</strong>.
        Share it with them and ask them to change it after signing in.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">New password</label>
        <input
          type="text"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="At least 8 characters"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
          {submitting ? 'Saving…' : 'Reset Password'}
        </button>
      </div>
    </form>
  );
}

function AddUserForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('scheduler_admin');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.users.create({ email, password, name: name || undefined, role });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create user');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Name <span className="text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Temporary password
        </label>
        <input
          type="text"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="input-field"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
          {submitting ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
