import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import Badge from '../components/Shared/Badge';
import Avatar from '../components/Shared/Avatar';
import { getMyStats, uploadAvatar, updateProfile, deleteAccount, getAdminOnlyProjects } from '../api/usersApi';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notificationsApi';
import { getMembers, updateMemberRole } from '../api/projectsApi';
import { useAuth } from '../context/AuthContext';
import { getRoleBadgeColor } from '../utils/roleUtils';
import { BuildingOffice2Icon, CameraIcon, PencilIcon, BellIcon, TrashIcon } from '@heroicons/react/24/outline';

function StatBox({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

export default function UserProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [editOpen, setEditOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Notifications
  const [prefs, setPrefs] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminOnlyProjects, setAdminOnlyProjects] = useState(null);
  const [projectMembers, setProjectMembers] = useState({});
  const [adminTransfers, setAdminTransfers] = useState({});
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    Promise.all([
      getMyStats(),
      getNotificationPreferences(),
    ])
      .then(([statsRes, prefsRes]) => {
        setStats(statsRes.data);
        setPrefs(prefsRes.data);
        setUsername(statsRes.data.username || user?.username || '');
        setEmail(user?.email || '');
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadAvatar(file);
      updateUser({ avatarUrl: res.data.avatarUrl });
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    }
    e.target.value = '';
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      if (username !== (stats?.username || user?.username)) payload.username = username;
      if (email !== user?.email) payload.email = email;
      if (!Object.keys(payload).length) { setEditOpen(false); return; }
      const res = await updateProfile(payload);
      updateUser({ username: res.data.username, email: res.data.email, token: res.data.token });
      toast.success('Profile updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePrefChange = async (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(updated);
    } catch {
      toast.error('Failed to save preferences');
      setPrefs(prefs);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteClick = async () => {
    setCheckingAdmin(true);
    try {
      const res = await getAdminOnlyProjects();
      const projects = res.data;
      if (projects.length === 0) {
        setAdminOnlyProjects([]);
        setDeleteConfirm(true);
      } else {
        const membersMap = {};
        await Promise.all(projects.map(async (p) => {
          const mRes = await getMembers(p.id);
          membersMap[p.id] = mRes.data.filter(m => m.userId !== user?.userId);
        }));
        setProjectMembers(membersMap);
        setAdminOnlyProjects(projects);
      }
    } catch {
      toast.error('Failed to check admin status');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleTransferAndContinue = async () => {
    for (const p of adminOnlyProjects) {
      if (!adminTransfers[p.id]) {
        toast.error(`Please select a new admin for "${p.name}"`);
        return;
      }
    }
    setTransferring(true);
    try {
      await Promise.all(adminOnlyProjects.map(p =>
        updateMemberRole(p.id, adminTransfers[p.id], 'Admin')
      ));
      setAdminOnlyProjects([]);
      setDeleteConfirm(true);
    } catch {
      toast.error('Failed to transfer admin rights');
    } finally {
      setTransferring(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LoadingSpinner text="Loading profile..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar
                name={stats?.username || user?.username || ''}
                avatarUrl={user?.avatarUrl}
                size="lg"
                className="w-16 h-16 text-xl"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{stats?.username || user?.username}</h1>
                <span className="text-sm text-gray-500">{user?.email}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{stats?.totalProjects ?? 0} project{stats?.totalProjects !== 1 ? 's' : ''}</p>
            </div>

            <button
              onClick={() => setEditOpen(v => !v)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
          </div>

          {editOpen && (
            <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Username</label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditOpen(false)} className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Global stats */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Global Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatBox label="Total Tasks" value={stats?.totalAssignedTasks ?? 0} />
          <StatBox label="Approved" value={stats?.approvedTasks ?? 0} color="text-green-600" />
          <StatBox label="Rejected" value={stats?.rejectedTasks ?? 0} color="text-red-600" />
          <StatBox label="Points Earned" value={stats?.totalPoints ?? 0} color="text-indigo-600" />
        </div>

        {/* Approval rate */}
        {(stats?.totalAssignedTasks ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Approval Rate</span>
              <span className="text-sm font-bold text-indigo-600">{stats.approvalRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${stats.approvalRate}%` }} />
            </div>
          </div>
        )}

        {/* Per-project breakdown */}
        {(stats?.projectContributions?.length ?? 0) > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Contributions</h2>
            <div className="flex flex-col gap-3 mb-8">
              {stats.projectContributions.map(p => (
                <Link key={p.projectId} to={`/projects/${p.projectId}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 text-sm">{p.projectName}</span>
                    </div>
                    <Badge className={getRoleBadgeColor(p.role)}>{p.role}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div><p className="font-semibold text-gray-900">{p.assignedTasks}</p><p className="text-gray-400">Tasks</p></div>
                    <div><p className="font-semibold text-green-600">{p.approvedTasks}</p><p className="text-gray-400">Approved</p></div>
                    <div><p className="font-semibold text-indigo-600">{p.points}</p><p className="text-gray-400">Points</p></div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Notification preferences */}
        {prefs && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BellIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
              {savingPrefs && <span className="text-xs text-gray-400 ml-auto">Saving…</span>}
            </div>
            <div className="divide-y divide-gray-100">
              <ToggleRow label="Role changes (assigned / changed)" checked={prefs.roleChanges} onChange={v => handlePrefChange('roleChanges', v)} />
              <ToggleRow label="Task reviews (approved / rejected)" checked={prefs.taskReviews} onChange={v => handlePrefChange('taskReviews', v)} />
              <ToggleRow label="Task assignments" checked={prefs.taskAssigned} onChange={v => handlePrefChange('taskAssigned', v)} />
              <ToggleRow label="Comments on my tasks" checked={prefs.comments} onChange={v => handlePrefChange('comments', v)} />
              <ToggleRow label="Project membership (removed / left)" checked={prefs.projectMembership} onChange={v => handlePrefChange('projectMembership', v)} />
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <TrashIcon className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Deleting your account is permanent. You will be removed from all projects and cannot log in again.
            Your contributions will remain visible to project admins.
          </p>

          {adminOnlyProjects && adminOnlyProjects.length > 0 ? (
            <div>
              <p className="text-sm text-amber-700 font-medium mb-3">
                You are the only admin in the following projects. Please select a new admin for each before proceeding.
              </p>
              <div className="flex flex-col gap-3 mb-4">
                {adminOnlyProjects.map(p => (
                  <div key={p.id} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">{p.name}</p>
                    <select
                      className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-400 outline-none"
                      value={adminTransfers[p.id] || ''}
                      onChange={e => setAdminTransfers(t => ({ ...t, [p.id]: e.target.value }))}
                    >
                      <option value="">Select new admin…</option>
                      {(projectMembers[p.id] || []).map(m => (
                        <option key={m.userId} value={m.userId}>{m.username} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleTransferAndContinue}
                  disabled={transferring}
                  className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {transferring ? 'Transferring…' : 'Transfer & Continue'}
                </button>
                <button
                  onClick={() => { setAdminOnlyProjects(null); setAdminTransfers({}); }}
                  className="text-sm text-gray-600 px-3 py-2 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : !deleteConfirm ? (
            <button
              onClick={handleDeleteClick}
              disabled={checkingAdmin}
              className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              {checkingAdmin ? 'Checking…' : 'Delete account'}
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-red-700 font-medium">Are you sure? This cannot be undone.</span>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-sm text-gray-600 px-3 py-2 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
