import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { User, AcademicClass, Role } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Key,
  X,
  Loader2,
  Info
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser, isSuperAdmin, isPrincipal } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(false);

  // User Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'CLASS_TEACHER' as Role,
    password: '',
    assigned_class_id: undefined as number | undefined,
    designation: '',
    contact_number: '',
    permissions: [] as string[],
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, cData] = await Promise.all([
        api.users.getAll(),
        api.classes.getAll(),
      ]);
      setUsers(uData);
      setClasses(cData);
    } catch (err: any) {
      error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: 'CLASS_TEACHER',
      password: 'Sunshine@2026',
      assigned_class_id: classes[0]?.id,
      designation: 'Class Teacher',
      contact_number: '',
      permissions: [],
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email || '',
      full_name: u.full_name,
      role: u.role,
      password: '',
      assigned_class_id: u.teacher_profile?.assigned_class_id,
      designation: u.teacher_profile?.designation || '',
      contact_number: u.teacher_profile?.contact_number || '',
      permissions: u.permissions,
      is_active: u.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.users.update(editingUser.id, {
          email: formData.email || undefined,
          full_name: formData.full_name,
          role: formData.role,
          password: formData.password || undefined,
          assigned_class_id: formData.assigned_class_id,
          designation: formData.designation,
          contact_number: formData.contact_number,
          permissions: formData.permissions,
          is_active: formData.is_active,
        });
        success(`Updated user ${formData.full_name}`);
      } else {
        await api.users.create({
          ...formData,
          email: formData.email || undefined,
        });
        success(`Created user ${formData.full_name}`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (u: User) => {
    try {
      await api.users.toggleStatus(u.id);
      success(`Updated status for ${u.full_name}`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-600" />
            Staff & User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage teacher assignments, roles, accounts, and system authorizations.
          </p>
        </div>

        {isSuperAdmin() && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Staff Account</span>
          </button>
        )}
      </div>

      {/* Account Separation Notice Card */}
      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-start gap-3 text-xs text-sky-900">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Important Account Separation Guarantee</p>
          <p className="text-sky-800 leading-relaxed">
            The two accounts for <strong className="text-sky-950">Seema Upadhyay</strong> are strictly separated:
            <strong> Principal Seema Upadhyay</strong> (ID: 2, Role: PRINCIPAL) and <strong>KGI Teacher Seema Upadhyay</strong> (ID: 4, Role: CLASS_TEACHER) possess distinct unique User IDs, permissions, and class scopes.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading staff accounts...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5 w-16">ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Assigned Class / Scope</th>
                  <th className="p-3.5">Special Permissions</th>
                  <th className="p-3.5 text-center">Status</th>
                  {isSuperAdmin() && <th className="p-3.5 text-right pr-5">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-500">{u.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500">{u.email || 'No email registered'}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 font-semibold">{u.username}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : u.role === 'PRINCIPAL'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {u.role === 'CLASS_TEACHER' ? (
                        <span className="font-bold text-slate-900">
                          Class {u.teacher_profile?.assigned_class_name || 'Unassigned'}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold">All Classes Authority</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {u.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.permissions.map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">Default Scope</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          u.is_active ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Disabled
                          </>
                        )}
                      </span>
                    </td>
                    {isSuperAdmin() && (
                      <td className="p-3.5 text-right pr-5 space-x-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="bg-navy-950 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingUser ? `Edit Account: ${editingUser.full_name}` : 'Create Staff User Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CLASS_TEACHER">CLASS_TEACHER</option>
                    <option value="PRINCIPAL">PRINCIPAL</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Class</label>
                  <select
                    value={formData.assigned_class_id || ''}
                    onChange={(e) => setFormData({ ...formData, assigned_class_id: parseInt(e.target.value) || undefined })}
                    disabled={formData.role !== 'CLASS_TEACHER'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>Class {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  {editingUser ? 'New Password (leave blank to keep unchanged)' : 'Initial Password *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Sunshine@2026'}
                  required={!editingUser}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Special Permissions</label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes('VIEW_ALL_RESULTS')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, permissions: [...formData.permissions, 'VIEW_ALL_RESULTS'] });
                      } else {
                        setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== 'VIEW_ALL_RESULTS') });
                      }
                    }}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span className="font-semibold text-slate-800">
                    VIEW_ALL_RESULTS (Allows teacher to view examination results of all classes)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
