import { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY = 'kanban_open_col';

const COLUMNS = [
  { key: 'ToDo',       label: 'To Do',      accent: 'border-gray-400',   bg: 'bg-gray-100',    countBg: 'bg-gray-200 text-gray-700',         text: 'text-gray-700' },
  { key: 'InProgress', label: 'In Progress', accent: 'border-yellow-400', bg: 'bg-yellow-50',   countBg: 'bg-yellow-100 text-yellow-800',      text: 'text-yellow-800' },
  { key: 'Submitted',  label: 'Submitted',   accent: 'border-blue-400',   bg: 'bg-blue-50',     countBg: 'bg-blue-100 text-blue-800',          text: 'text-blue-800' },
  { key: 'Approved',   label: 'Done',        accent: 'border-green-400',  bg: 'bg-green-50',    countBg: 'bg-green-100 text-green-800',        text: 'text-green-800' },
];

export default function KanbanBoard({
  tasks, loading, userRole, currentUserId, groupMembers,
  onAccept, onOpenSubmit, onOpenReview, onTaskClick, onDelegate
}) {
  const [openColumn, setOpenColumn] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'ToDo'
  );
  const [diffFilter, setDiffFilter] = useState('All');

  if (loading) return <LoadingSpinner text="Loading tasks..." />;

  const filteredTasks = diffFilter === 'All' ? tasks : tasks.filter(t => t.difficulty === diffFilter);

  const tasksByStatus = {};
  COLUMNS.forEach(c => { tasksByStatus[c.key] = []; });
  filteredTasks.forEach(t => {
    if (tasksByStatus[t.status] !== undefined) tasksByStatus[t.status].push(t);
  });

  const toggle = (key) => {
    setOpenColumn(prev => {
      const next = prev === key ? null : key;
      if (next) localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-gray-500 font-medium">Difficulty:</span>
        {['All', 'Easy', 'Medium', 'Hard'].map(d => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              diffFilter === d
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      {COLUMNS.map(col => {
        const isOpen = openColumn === col.key;
        const count = tasksByStatus[col.key].length;

        return (
          <div key={col.key} className={`w-full rounded-xl border border-gray-200 border-t-4 ${col.accent} overflow-hidden`}>
            {/* Header button */}
            <button
              onClick={() => toggle(col.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 ${col.bg} hover:opacity-90 transition`}
            >
              <span className={`font-semibold text-sm flex-1 text-left ${col.text}`}>{col.label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.countBg}`}>{count}</span>
              {isOpen
                ? <ChevronUpIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                : <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              }
            </button>

            {/* Task list */}
            {isOpen && (
              <div className="p-4">
                {count === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6 italic">No tasks in this category.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {tasksByStatus[col.key].map(task => (
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
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
