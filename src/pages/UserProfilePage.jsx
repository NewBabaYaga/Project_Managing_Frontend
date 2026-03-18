import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import Badge from '../components/Shared/Badge';
import { getMyStats } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import { getRoleBadgeColor } from '../utils/roleUtils';
import Avatar from '../components/Shared/Avatar';
import {
  ChartBarIcon, CheckCircleIcon,
  XCircleIcon, StarIcon, BuildingOffice2Icon
} from '@heroicons/react/24/outline';

function StatBox({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

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
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-4">
          <Avatar name={stats?.username || user?.username || ''} size="lg" className="w-16 h-16 text-xl" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{stats?.username || user?.username}</h1>
            <p className="text-sm text-gray-500">{stats?.email || user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats?.totalProjects ?? 0} project{stats?.totalProjects !== 1 ? 's' : ''}</p>
          </div>
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
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.approvalRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Per-project breakdown */}
        {(stats?.projectContributions?.length ?? 0) > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Contributions</h2>
            <div className="flex flex-col gap-3">
              {stats.projectContributions.map(p => (
                <Link
                  key={p.projectId}
                  to={`/projects/${p.projectId}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 text-sm">{p.projectName}</span>
                    </div>
                    <Badge className={getRoleBadgeColor(p.role)}>{p.role}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div>
                      <p className="font-semibold text-gray-900">{p.assignedTasks}</p>
                      <p className="text-gray-400">Tasks</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-600">{p.approvedTasks}</p>
                      <p className="text-gray-400">Approved</p>
                    </div>
                    <div>
                      <p className="font-semibold text-indigo-600">{p.points}</p>
                      <p className="text-gray-400">Points</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
