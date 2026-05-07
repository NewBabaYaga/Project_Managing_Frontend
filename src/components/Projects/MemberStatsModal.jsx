import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { getMemberStats } from '../../api/usersApi';

export default function MemberStatsModal({ isOpen, onClose, projectId, member }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !member) return;
    setLoading(true);
    getMemberStats(projectId, member.userId)
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load member stats'))
      .finally(() => setLoading(false));
  }, [isOpen, projectId, member]);

  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stats — ${member.username}`}>
      {loading ? (
        <div className="py-8"><LoadingSpinner text="Loading..." /></div>
      ) : stats ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Projects', value: stats.totalProjects },
              { label: 'Assigned Tasks', value: stats.totalAssignedTasks },
              { label: 'Approved', value: stats.approvedTasks, color: 'text-green-600' },
              { label: 'Rejected', value: stats.rejectedTasks, color: 'text-red-600' },
              { label: 'Points', value: stats.totalPoints, color: 'text-indigo-600' },
              { label: 'Approval Rate', value: `${stats.approvalRate}%`, color: 'text-blue-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {stats.projectContributions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Project Contributions</p>
              <div className="flex flex-col gap-2">
                {stats.projectContributions.map(p => (
                  <div key={p.projectId} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-medium text-gray-800">{p.projectName}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{p.approvedTasks}/{p.assignedTasks} approved</span>
                      <span className="font-semibold text-indigo-600">{p.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-4 text-center">No stats available.</p>
      )}
    </Modal>
  );
}
