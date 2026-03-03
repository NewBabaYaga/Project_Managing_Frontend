import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import KanbanBoard from '../components/Tasks/KanbanBoard';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import DelegateTaskModal from '../components/Tasks/DelegateTaskModal';
import SubmitTaskModal from '../components/Submissions/SubmitTaskModal';
import ReviewModal from '../components/Reviews/ReviewModal';
import InviteMemberModal from '../components/Projects/InviteMemberModal';
import StatsCard from '../components/Stats/StatsCard';
import RankingTable from '../components/Stats/RankingTable';
import Button from '../components/Shared/Button';
import Badge from '../components/Shared/Badge';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { getProject, getMembers, removeMember, assignManagerGroup } from '../api/projectsApi';
import ChangeRoleModal from '../components/Projects/ChangeRoleModal';
import MemberStatsModal from '../components/Projects/MemberStatsModal';
import { getTasks, updateTaskStatus, reassignTask } from '../api/tasksApi';
import { getProjectStats, getProjectRanking } from '../api/statsApi';
import { useAuth } from '../context/AuthContext';
import {
  canCreateTask, canInviteMembers, canRemoveMembers, isDeveloper,
  getRoleBadgeColor, getStatusColor, getDifficultyColor
} from '../utils/roleUtils';
import {
  PlusIcon, UserPlusIcon, ChartBarIcon,
  CheckCircleIcon, ClockIcon, DocumentCheckIcon, ArrowLeftIcon, TableCellsIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../utils/dateUtils';
import { getErrorMessage } from '../utils/errorUtils';

const POLL_INTERVAL = 10000;

export default function ProjectDashboard() {
  const { id: projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [myMembership, setMyMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Modals
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showChangeRole, setShowChangeRole] = useState(false);
  const [showMemberStats, setShowMemberStats] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showDelegate, setShowDelegate] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [projectRes, membersRes, tasksRes] = await Promise.all([
        getProject(projectId),
        getMembers(projectId),
        getTasks(projectId),
      ]);
      setProject(projectRes.data);
      const memberList = membersRes.data;
      setMembers(memberList);
      setTasks(tasksRes.data);

      const me = memberList.find(m => m.userId === user?.userId);
      setMyMembership(me || null);
      setUserRole(me?.role || null);

      if (me?.role !== 'Developer') {
        const [statsRes, rankRes] = await Promise.all([
          getProjectStats(projectId),
          getProjectRanking(projectId),
        ]);
        setStats(statsRes.data);
        setRanking(rankRes.data);
      } else {
        const rankRes = await getProjectRanking(projectId);
        setRanking(rankRes.data);
      }
    } catch {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh polling
  useEffect(() => {
    const poll = () => { if (document.visibilityState === 'visible') fetchAll(); };
    const id = setInterval(poll, POLL_INTERVAL);
    document.addEventListener('visibilitychange', poll);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', poll); };
  }, [fetchAll]);

  const handleAcceptTask = async (task) => {
    try {
      await updateTaskStatus(projectId, task.id, { newStatus: 'InProgress' });
      toast.success('Task accepted!');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to accept task'));
    }
  };

  const handleReassign = async (taskId, assignedToId) => {
    try {
      await reassignTask(projectId, taskId, assignedToId || undefined);
      toast.success(assignedToId ? 'Task reassigned' : 'Task unassigned');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reassign task'));
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await removeMember(projectId, userId);
      toast.success('Member removed');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove member'));
    }
  };

  const handleAssignManager = async (developerUserId, managerUserId) => {
    try {
      await assignManagerGroup(projectId, developerUserId, managerUserId || null);
      toast.success(managerUserId ? 'Developer assigned to manager' : 'Developer removed from group');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update group assignment'));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LoadingSpinner text="Loading project..." />
    </div>
  );

  const isAdmin = userRole === 'Admin';
  const isAdminOrManager = canCreateTask(userRole);
  const isManagerRole = userRole === 'Manager';

  // The developers in the current manager's group (for delegate modal & task creation)
  const myGroupMembers = isManagerRole
    ? members.filter(m => m.managerUserId === user?.userId)
    : [];

  // What members are assignable when creating tasks (depends on role)
  const assignableMembersForTask = isAdmin
    ? members.filter(m => m.role !== 'Admin') // admin can assign to Manager or Developer
    : isManagerRole
    ? [...myGroupMembers, { ...myMembership }].filter(Boolean) // manager: own group + themselves
    : [];

  const managers = members.filter(m => m.role === 'Manager');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/projects" className="hover:text-indigo-600 flex items-center gap-1">
            <ArrowLeftIcon className="w-4 h-4" />
            Projects
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{project?.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
              <Badge className={getRoleBadgeColor(userRole)}>{userRole}</Badge>
            </div>
            {project?.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {canInviteMembers(userRole) && (
              <Button variant="outline" size="sm" onClick={() => setShowInvite(true)}>
                <UserPlusIcon className="w-4 h-4" />
                Invite
              </Button>
            )}
            {canCreateTask(userRole) && (
              <Button size="sm" onClick={() => setShowCreateTask(true)}>
                <PlusIcon className="w-4 h-4" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats (Admin/Manager) */}
        {isAdminOrManager && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatsCard label="Total Tasks" value={stats.totalTasks} icon={DocumentCheckIcon} />
            <StatsCard label="Approved" value={stats.approvedTasks} color="text-green-600" icon={CheckCircleIcon} />
            <StatsCard label="Pending" value={stats.pendingTasks} color="text-yellow-600" icon={ClockIcon} />
            <StatsCard label="Approval Rate" value={`${stats.approvalRate}%`} color="text-indigo-600" icon={ChartBarIcon} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-1">
          {['tasks', ...(isAdminOrManager ? ['assignments'] : []), 'members', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition rounded-t-lg ${
                activeTab === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'tasks' && `Tasks (${tasks.length})`}
              {tab === 'assignments' && 'Assignments'}
              {tab === 'members' && `Members (${members.length})`}
              {tab === 'stats' && 'Stats & Ranking'}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <KanbanBoard
            tasks={tasks}
            loading={false}
            userRole={userRole}
            currentUserId={user?.userId}
            groupMembers={myGroupMembers}
            onAccept={handleAcceptTask}
            onOpenSubmit={(task) => { setSelectedTask(task); setShowSubmit(true); }}
            onOpenReview={(task) => { setSelectedTask(task); setShowReview(true); }}
            onTaskClick={(task) => { setSelectedTask(task); setShowTaskDetail(true); }}
            onDelegate={(task) => { setSelectedTask(task); setShowDelegate(true); }}
          />
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && isAdminOrManager && (() => {
          const visibleTasks = isAdmin
            ? tasks
            : tasks.filter(t =>
                t.assignedToId === user?.userId ||
                myGroupMembers.some(m => m.userId === t.assignedToId) ||
                t.assignedToId == null
              );

          const assignableOptions = isAdmin
            ? members.filter(m => m.role !== 'Admin')
            : [...myGroupMembers, myMembership].filter(Boolean);

          const statusOrder = { ToDo: 0, InProgress: 1, Submitted: 2, Approved: 3 };
          const sorted = [...visibleTasks].sort((a, b) =>
            (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
          );

          return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <TableCellsIcon className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-700">
                  {sorted.length} task{sorted.length !== 1 ? 's' : ''}
                  {isManagerRole ? ' (your group)' : ''}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Task</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Difficulty</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Assigned To</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Due Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-sm text-gray-400 italic">No tasks to display.</td>
                      </tr>
                    ) : sorted.map(task => (
                      <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <button
                            className="font-medium text-gray-900 hover:text-indigo-600 text-left"
                            onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                          >
                            {task.title}
                          </button>
                          {task.rejectionFeedback && (
                            <p className="text-xs text-red-500 mt-0.5 truncate max-w-xs">{task.rejectionFeedback}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getDifficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {task.status === 'Approved' ? (
                            <span className="text-gray-500">{task.assignedToUsername || '—'}</span>
                          ) : (
                            <select
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 max-w-[160px]"
                              value={task.assignedToId || ''}
                              onChange={(e) => handleReassign(task.id, e.target.value || null)}
                            >
                              {isAdmin && <option value="">Unassigned (open)</option>}
                              {assignableOptions.map(m => (
                                <option key={m.userId} value={m.userId}>
                                  {m.username}{m.userId === user?.userId ? ' (you)' : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 hidden md:table-cell">
                          {task.dueDate ? formatDate(task.dueDate) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {task.status === 'Submitted' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedTask(task); setShowReview(true); }}
                              >
                                Review
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                            >
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">{members.length} member{members.length !== 1 ? 's' : ''}</p>
              {canInviteMembers(userRole) && (
                <Button size="sm" onClick={() => setShowInvite(true)}>
                  <UserPlusIcon className="w-4 h-4" />
                  Invite Contributor
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Member</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                    {isAdmin && <th className="text-left py-3 px-4 font-semibold text-gray-600">Manager Group</th>}
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Joined</th>
                    {isAdminOrManager && (
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.userId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {m.username}
                        {m.userId === user?.userId && (
                          <Badge className="ml-2 bg-indigo-100 text-indigo-700">You</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{m.email}</td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleBadgeColor(m.role)}>{m.role}</Badge>
                      </td>
                      {/* Group assignment (Admin only, Developers only) */}
                      {isAdmin && (
                        <td className="py-3 px-4">
                          {m.role === 'Developer' ? (
                            <select
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              value={m.managerUserId || ''}
                              onChange={(e) => handleAssignManager(m.userId, e.target.value || null)}
                            >
                              <option value="">No manager</option>
                              {managers.map(mgr => (
                                <option key={mgr.userId} value={mgr.userId}>{mgr.username}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-gray-500">{formatDate(m.joinedAt)}</td>
                      {isAdminOrManager && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedMember(m); setShowMemberStats(true); }}
                            >
                              Stats
                            </Button>
                            {m.userId !== user?.userId && canRemoveMembers(userRole) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setSelectedMember(m); setShowChangeRole(true); }}
                                >
                                  Change Role
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRemoveMember(m.userId)}
                                >
                                  Remove
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-6">
            {isAdminOrManager && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatsCard label="Total Tasks" value={stats.totalTasks} />
                <StatsCard label="Approved" value={stats.approvedTasks} color="text-green-600" />
                <StatsCard label="Rejected" value={stats.rejectedTasks} color="text-red-600" />
                <StatsCard label="Approval Rate" value={`${stats.approvalRate}%`} color="text-indigo-600" />
                <StatsCard label="Total Points" value={stats.totalPoints} color="text-purple-600" />
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Team Ranking</h3>
                <p className="text-sm text-gray-500 mt-0.5">Sorted by points earned from approved tasks</p>
              </div>
              <div className="p-4">
                <RankingTable ranking={ranking} currentUserId={user?.userId} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={projectId}
        members={assignableMembersForTask}
        userRole={userRole}
        onCreated={() => { setShowCreateTask(false); fetchAll(); }}
      />

      <InviteMemberModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        projectId={projectId}
        onInvited={fetchAll}
      />

      <ChangeRoleModal
        isOpen={showChangeRole}
        onClose={() => setShowChangeRole(false)}
        projectId={projectId}
        member={selectedMember}
        onUpdated={fetchAll}
      />

      <MemberStatsModal
        isOpen={showMemberStats}
        onClose={() => setShowMemberStats(false)}
        projectId={projectId}
        member={selectedMember}
      />

      <TaskDetailModal
        isOpen={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        task={selectedTask}
        projectId={projectId}
      />

      <SubmitTaskModal
        isOpen={showSubmit}
        onClose={() => setShowSubmit(false)}
        task={selectedTask}
        onSubmitted={fetchAll}
      />

      <ReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        task={selectedTask}
        onReviewed={fetchAll}
      />

      <DelegateTaskModal
        isOpen={showDelegate}
        onClose={() => setShowDelegate(false)}
        task={selectedTask}
        projectId={projectId}
        groupMembers={myGroupMembers}
        onDelegated={fetchAll}
      />
    </div>
  );
}
