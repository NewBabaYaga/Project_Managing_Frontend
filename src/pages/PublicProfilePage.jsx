import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import Badge from '../components/Shared/Badge';
import Avatar from '../components/Shared/Avatar';
import { getPublicProfile } from '../api/usersApi';
import { getRoleBadgeColor } from '../utils/roleUtils';
import { BuildingOffice2Icon, CalendarIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

function StatBox({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProfile(userId)
      .then(res => setProfile(res.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LoadingSpinner text="Loading profile..." />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center pt-24 text-gray-500">
        <p>User not found.</p>
        <Link to="/projects" className="mt-4 text-indigo-600 hover:underline text-sm">Back to projects</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar name={profile.username} avatarUrl={profile.avatarUrl} size="lg" className="w-16 h-16 text-xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{profile.username}</h1>
                {profile.isDeleted && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    <NoSymbolIcon className="w-3 h-3" /> Deleted account
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Member since {new Date(profile.memberSince).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatBox label="Approved Tasks" value={profile.totalApprovedTasks} color="text-green-600" />
          <StatBox label="Points Earned" value={profile.totalPoints} color="text-indigo-600" />
        </div>

        {/* Shared projects */}
        {profile.sharedProjects.length > 0 ? (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Shared Projects</h2>
            <div className="flex flex-col gap-3">
              {profile.sharedProjects.map(p => (
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
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div>
                      <p className="font-semibold text-green-600">{p.approvedTasks}</p>
                      <p className="text-gray-400">Approved Tasks</p>
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
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No shared projects with this user.</p>
        )}
      </div>
    </div>
  );
}
