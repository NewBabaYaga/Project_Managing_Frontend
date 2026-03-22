import { useState } from 'react';
import TaskCard from './TaskCard';
import LoadingSpinner from '../Shared/LoadingSpinner';

const STORAGE_KEY = 'kanban_active_tab';

const TABS = [
  { key: 'ToDo',       label: 'To Do',       countCls: 'bg-gray-200 text-gray-700',         activeBar: 'border-gray-500',   activeBg: 'bg-gray-50',    activeText: 'text-gray-800'   },
  { key: 'InProgress', label: 'In Progress',  countCls: 'bg-yellow-100 text-yellow-800',     activeBar: 'border-yellow-500', activeBg: 'bg-yellow-50',  activeText: 'text-yellow-900' },
  { key: 'Submitted',  label: 'Submitted',    countCls: 'bg-blue-100 text-blue-800',         activeBar: 'border-blue-500',   activeBg: 'bg-blue-50',    activeText: 'text-blue-900'   },
  { key: 'Approved',   label: 'Approved',     countCls: 'bg-green-100 text-green-800',       activeBar: 'border-green-500',  activeBg: 'bg-green-50',   activeText: 'text-green-900'  },
];

export default function KanbanBoard({
  tasks, loading, userRole, currentUserId, groupMembers,
  onAccept, onOpenSubmit, onOpenReview, onTaskClick, onDelegate
}) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'ToDo'
  );
  const [diffFilter, setDiffFilter] = useState('All');

  if (loading) return <LoadingSpinner text="Loading tasks..." />;

  const filtered = diffFilter === 'All' ? tasks : tasks.filter(t => t.difficulty === diffFilter);

  const byStatus = {};
  TABS.forEach(t => { byStatus[t.key] = []; });
  filtered.forEach(t => { if (byStatus[t.status] !== undefined) byStatus[t.status].push(t); });

  const handleTabClick = (key) => {
    setActiveTab(key);
    localStorage.setItem(STORAGE_KEY, key);
  };

  const activeCol = TABS.find(t => t.key === activeTab);
  const visibleTasks = byStatus[activeTab] ?? [];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Difficulty filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Difficulty:</span>
        {['All', 'Easy', 'Medium', 'Hard'].map(d => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              diffFilter === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

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
