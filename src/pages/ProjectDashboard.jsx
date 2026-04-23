import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import Avatar from '../components/Shared/Avatar';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { getProject, getMembers, removeMember, assignManagerGroup, getProjects } from '../api/projectsApi';
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
  CheckCircleIcon, ClockIcon, DocumentCheckIcon, TableCellsIcon,
  FolderIcon, UsersIcon, ClipboardDocumentListIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../utils/dateUtils';
import { getErrorMessage } from '../utils/errorUtils';

const POLL_INTERVAL = 10000;

export default function ProjectDashboard() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [myMembership, setMyMembership] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assignFilter, setAssignFilter] = useState({ status: '', difficulty: '', assignee: '' });
  const [assignSort, setAssignSort] = useState({ by: 'status', dir: 'asc' });

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
      const [projectRes, membersRes, tasksRes, allProjectsRes] = await Promise.all([
        getProject(projectId),
        getMembers(projectId),
        getTasks(projectId),
        getProjects(),
      ]);
      setProject(projectRes.data);
      const memberList = membersRes.data;
      setMembers(memberList);
      setTasks(tasksRes.data);
      setAllProjects(allProjectsRes.data);

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

  // Pending role — show waiting screen, poll until role is assigned
  if (myMembership?.isPendingRoleAssignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 pt-20 pb-8 text-center">
          <div className="bg-white rounded-2xl border border-amber-200 p-8 shadow-sm">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{project?.name}</h2>
            <p className="text-sm text-gray-600 mb-1">{project?.description}</p>
            <p className="text-sm text-amber-700 font-medium mt-4">
              You've joined this project but your role hasn't been assigned yet.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              A project Admin will assign your role shortly. This page refreshes automatically.
            </p>
            <Link to="/projects" className="inline-block mt-6 text-sm text-indigo-600 hover:underline">
              ← Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'Admin';
  const isAdminOrManager = canCreateTask(userRole);
  const isManagerRole = userRole === 'Manager';

  const myGroupMembers = isManagerRole
    ? members.filter(m => m.managerUserId === user?.userId)
    : [];

  const assignableMembersForTask = isAdmin
    ? members.filter(m => m.role !== 'Admin')
    : isManagerRole
    ? [...myGroupMembers, { ...myMembership }].filter(Boolean)
    : [];

  const managers = members.filter(m => m.role === 'Manager');

  // Contextual header stats — only for tabs where the content doesn't already show these numbers
  const headerStats = (() => {
    if (activeTab === 'assignments') {
      const vis = isAdmin
        ? tasks
        : tasks.filter(t =>
            t.assignedToId === user?.userId ||
            myGroupMembers.some(m => m.userId === t.assignedToId) ||
            t.assignedToId == null
          );
      return [
        { label: 'Unassigned', value: vis.filter(t => !t.assignedToId).length, cls: 'bg-gray-100 text-gray-700' },
        { label: 'Submitted',  value: vis.filter(t => t.status === 'Submitted').length, cls: 'bg-amber-50 text-amber-700' },
        { label: 'Overdue',    value: vis.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Approved').length, cls: 'bg-red-50 text-red-700' },
      ];
    }
    if (activeTab === 'members') {
      const roleCounts = members.reduce((acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {});
      return [
        { label: 'Admin',     value: roleCounts.Admin || 0,     cls: 'bg-purple-50 text-purple-700' },
        { label: 'Manager',   value: roleCounts.Manager || 0,   cls: 'bg-indigo-50 text-indigo-700' },
        { label: 'Developer', value: roleCounts.Developer || 0, cls: 'bg-emerald-50 text-emerald-700' },
      ];
    }
    return [];
  })();

  const navItems = [
    { key: 'tasks',       label: 'Tasks',          icon: ClipboardDocumentListIcon, count: tasks.length },
    ...(isAdminOrManager ? [{ key: 'assignments', label: 'Assignments', icon: TableCellsIcon }] : []),
    { key: 'members',     label: 'Members',         icon: UsersIcon, count: members.length },
    { key: 'stats',       label: 'Stats & Ranking', icon: ChartBarIcon },
  ];

  const otherProjects = allProjects.filter(p => p.id !== projectId);

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Back link */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <Link
          to="/projects"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition font-medium mb-3"
          onClick={() => setSidebarOpen(false)}
        >
          ← All Projects
        </Link>
        <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{project?.name}</p>
        {project?.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{project.description}</p>
        )}
        <Badge className={`${getRoleBadgeColor(userRole)} mt-2`}>{userRole}</Badge>
      </div>

      {/* Navigation */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">Navigate</p>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
              activeTab === item.key
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count !== undefined && (
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                activeTab === item.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      {(canCreateTask(userRole) || canInviteMembers(userRole)) && (
        <div className="px-3 pt-1 pb-2 border-t border-gray-100 mt-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5 mt-3">Actions</p>
          {canCreateTask(userRole) && (
            <button
              onClick={() => { setShowCreateTask(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-0.5"
            >
              <PlusIcon className="w-4 h-4 flex-shrink-0" />
              New Task
            </button>
          )}
          {canInviteMembers(userRole) && (
            <button
              onClick={() => { setShowInvite(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            >
              <UserPlusIcon className="w-4 h-4 flex-shrink-0" />
              Invite Member
            </button>
          )}
        </div>
      )}

      {/* Project switcher */}
      {otherProjects.length > 0 && (
        <div className="px-3 pt-1 pb-4 border-t border-gray-100 mt-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5 mt-3">Switch Project</p>
          {otherProjects.map(p => (
            <button
              key={p.id}
              onClick={() => { navigate(`/projects/${p.id}`); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-0.5 text-left"
            >
              <FolderIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex">
        {/* Sidebar — desktop (always visible) */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 sticky top-16 self-start h-[calc(100vh-64px)] bg-white border-r border-gray-200 overflow-hidden">
          <SidebarContent />
        </aside>

        {/* Sidebar — mobile overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative w-64 bg-white border-r border-gray-200 flex flex-col z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-700">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          {/* Page header — hamburger on mobile + tab stats for assignments/members */}
          <div className={`flex items-center gap-3 mb-4${headerStats.length === 0 ? ' lg:hidden' : ''}`}>
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            {headerStats.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                {headerStats.map(s => (
                  <span key={s.label} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.cls}`}>
                    <span className="font-bold">{s.value}</span>
                    <span className="opacity-75">{s.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active tab label (mobile breadcrumb) */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                    activeTab === item.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                  {item.count !== undefined && (
                    <span className={`text-[10px] font-bold ${activeTab === item.key ? 'opacity-80' : 'text-gray-400'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tasks Tab ─────────────────────────────────── */}
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

          {/* ── Assignments Tab ───────────────────────────── */}
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
            const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };

            // Apply filters
            let filtered = visibleTasks;
            if (assignFilter.status) filtered = filtered.filter(t => t.status === assignFilter.status);
            if (assignFilter.difficulty) filtered = filtered.filter(t => t.difficulty === assignFilter.difficulty);
            if (assignFilter.assignee === '__none__') filtered = filtered.filter(t => !t.assignedToId);
            else if (assignFilter.assignee) filtered = filtered.filter(t => t.assignedToId === assignFilter.assignee);

            // Apply sort
            const sorted = [...filtered].sort((a, b) => {
              let cmp = 0;
              if (assignSort.by === 'status') cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
              else if (assignSort.by === 'difficulty') cmp = (diffOrder[a.difficulty] ?? 9) - (diffOrder[b.difficulty] ?? 9);
              else if (assignSort.by === 'dueDate') {
                const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                cmp = da - db;
              }
              else if (assignSort.by === 'title') cmp = a.title.localeCompare(b.title);
              return assignSort.dir === 'asc' ? cmp : -cmp;
            });

            const hasActiveFilter = assignFilter.status || assignFilter.difficulty || assignFilter.assignee;

            return (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header row */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <TableCellsIcon className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-700">
                    {hasActiveFilter
                      ? `${sorted.length} / ${visibleTasks.length} task${visibleTasks.length !== 1 ? 's' : ''}`
                      : `${sorted.length} task${sorted.length !== 1 ? 's' : ''}`}
                    {isManagerRole ? ' (your group)' : ''}
                  </p>
                </div>

                {/* Filter & Sort bar */}
                <div className="px-4 py-2.5 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-white">
                  <select
                    value={assignFilter.status}
                    onChange={e => setAssignFilter(f => ({ ...f, status: e.target.value }))}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">All statuses</option>
                    {['ToDo', 'InProgress', 'Submitted', 'Approved'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={assignFilter.difficulty}
                    onChange={e => setAssignFilter(f => ({ ...f, difficulty: e.target.value }))}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">All difficulties</option>
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={assignFilter.assignee}
                    onChange={e => setAssignFilter(f => ({ ...f, assignee: e.target.value }))}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">All members</option>
                    <option value="__none__">Unassigned</option>
                    {assignableOptions.map(m => (
                      <option key={m.userId} value={m.userId}>
                        {m.username}{m.userId === user?.userId ? ' (you)' : ''}
                      </option>
                    ))}
                  </select>
                  {hasActiveFilter && (
                    <button
                      onClick={() => setAssignFilter({ status: '', difficulty: '', assignee: '' })}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-1"
                    >
                      Clear filters
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Sort:</span>
                    <select
                      value={assignSort.by}
                      onChange={e => setAssignSort(s => ({ ...s, by: e.target.value }))}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="status">Status</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="dueDate">Due Date</option>
                      <option value="title">Title</option>
                    </select>
                    <button
                      onClick={() => setAssignSort(s => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50 transition font-medium text-gray-600 min-w-[52px]"
                    >
                      {assignSort.dir === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </button>
                  </div>
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

          {/* ── Members Tab ───────────────────────────────── */}
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
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={m.username} size="sm" />
                            {m.userId !== user?.userId ? (
                              <Link to={`/users/${m.userId}`} className="font-medium text-gray-900 hover:text-indigo-600 transition">
                                {m.username}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-900">{m.username}</span>
                            )}
                            {m.userId === user?.userId && (
                              <Badge className="bg-indigo-100 text-indigo-700">You</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{m.email}</td>
                        <td className="py-3 px-4">
                          {m.isPendingRoleAssignment
                            ? <Badge className="bg-amber-100 text-amber-700">Pending role</Badge>
                            : <Badge className={getRoleBadgeColor(m.role)}>{m.role}</Badge>
                          }
                        </td>
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

          {/* ── Stats Tab ─────────────────────────────────── */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-6">
              {isAdminOrManager && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatsCard label="Total Tasks" value={stats.totalTasks} icon={DocumentCheckIcon} />
                  <StatsCard label="Approved" value={stats.approvedTasks} color="text-green-600" icon={CheckCircleIcon} />
                  <StatsCard label="Rejected" value={stats.rejectedTasks} color="text-red-600" />
                  <StatsCard label="Approval Rate" value={`${stats.approvalRate}%`} color="text-indigo-600" icon={ChartBarIcon} />
                  <StatsCard label="Total Points" value={stats.totalPoints} color="text-purple-600" />
                  <StatsCard label="Pending" value={stats.pendingTasks} color="text-yellow-600" icon={ClockIcon} />
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
        </main>
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
