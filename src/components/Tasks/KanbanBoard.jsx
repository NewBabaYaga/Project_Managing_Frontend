import { useState } from 'react';
import TaskCard from './TaskCard';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY = 'kanban_active_tab';

const TABS = [
  { key: 'ToDo',       label: 'To Do',      countCls: 'bg-gray-200 text-gray-700',     activeBar: 'border-gray-500',   activeBg: 'bg-gray-50',   activeText: 'text-gray-800'   },
  { key: 'InProgress', label: 'In Progress', countCls: 'bg-yellow-100 text-yellow-800', activeBar: 'border-yellow-500', activeBg: 'bg-yellow-50', activeText: 'text-yellow-900' },
  { key: 'Submitted',  label: 'Submitted',   countCls: 'bg-blue-100 text-blue-800',     activeBar: 'border-blue-500',   activeBg: 'bg-blue-50',   activeText: 'text-blue-900'   },
  { key: 'Approved',   label: 'Approved',    countCls: 'bg-green-100 text-green-800',   activeBar: 'border-green-500',  activeBg: 'bg-green-50',  activeText: 'text-green-900'  },
];

const DIFF_ORDER = { Easy: 1, Medium: 3, Hard: 5 };

const SORT_OPTIONS = [
  { value: 'dateDesc',       label: 'Date added ↓' },
  { value: 'dateAsc',        label: 'Date added ↑' },
  { value: 'dueDateAsc',     label: 'Due date ↑' },
  { value: 'dueDateDesc',    label: 'Due date ↓' },
  { value: 'difficultyDesc', label: 'Difficulty ↓' },
  { value: 'difficultyAsc',  label: 'Difficulty ↑' },
];

function applySort(tasks, sortBy) {
  const arr = [...tasks];
  arr.sort((a, b) => {
    switch (sortBy) {
      case 'dateAsc':        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'dateDesc':       return new Date(b.createdAt) - new Date(a.createdAt);
      case 'dueDateAsc':     return (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity);
      case 'dueDateDesc':    return (b.dueDate ? new Date(b.dueDate) : -Infinity) - (a.dueDate ? new Date(a.dueDate) : -Infinity);
      case 'difficultyAsc':  return DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty];
      case 'difficultyDesc': return DIFF_ORDER[b.difficulty] - DIFF_ORDER[a.difficulty];
      default:               return 0;
    }
  });
  return arr;
}

export default function KanbanBoard({
  tasks, loading, userRole, currentUserId, groupMembers,
  onAccept, onOpenSubmit, onOpenReview, onTaskClick, onDelegate
}) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'ToDo'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [diffFilter, setDiffFilter]   = useState('All');
  const [sortBy, setSortBy]           = useState('dateDesc');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');

  if (loading) return <LoadingSpinner text="Loading tasks..." />;

  // Count active filters (excluding default sort)
  const activeFilterCount = [
    diffFilter !== 'All',
    sortBy !== 'dateDesc',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDiffFilter('All');
    setSortBy('dateDesc');
    setDateFrom('');
    setDateTo('');
  };

  // Apply filters + sort
  let filtered = [...tasks];
  if (diffFilter !== 'All') filtered = filtered.filter(t => t.difficulty === diffFilter);
  if (dateFrom) filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(dateFrom));
  if (dateTo)   filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(dateTo + 'T23:59:59'));
  filtered = applySort(filtered, sortBy);

  const byStatus = {};
  TABS.forEach(t => { byStatus[t.key] = []; });
  filtered.forEach(t => { if (byStatus[t.status] !== undefined) byStatus[t.status].push(t); });

  const handleTabClick = (key) => {
    setActiveTab(key);
    localStorage.setItem(STORAGE_KEY, key);
  };

  const visibleTasks = byStatus[activeTab] ?? [];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Filter toggle row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
            showFilters || activeFilterCount > 0
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          Filters & Sort
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-4">
          {/* Difficulty */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Difficulty</p>
            <div className="flex gap-1.5">
              {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    diffFilter === d ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Sort by</p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Date added</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="text-sm border border-gray-200 rounded-lg px-2.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;
          const count = byStatus[tab.key].length;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                isActive
                  ? `${tab.activeBar} ${tab.activeText} ${tab.activeBg}`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${tab.countCls}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2">
        {visibleTasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12 italic">
            No tasks in this category.
          </p>
        ) : (
          visibleTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              userRole={userRole}
              currentUserId={currentUserId}
              groupMembers={groupMembers}
              onAccept={onAccept}
              onOpenSubmit={onOpenSubmit}
              onOpenReview={onOpenReview}
              onDelegate={onDelegate}
              onClick={onTaskClick}
              fullWidth
            />
          ))
        )}
      </div>
    </div>
  );
}
