import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon, CheckIcon, TrashIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { markRead, markAllRead, deleteNotification, clearAllNotifications } from '../../api/notificationsApi';

const TYPE_ICONS = {
  RoleAssigned: '🎖️',
  RoleChanged: '🔄',
  RemovedFromProject: '🚪',
  TaskAssigned: '📋',
  TaskDelegated: '↗️',
  TaskApproved: '✅',
  TaskRejected: '❌',
  TaskSubmitted: '📤',
  CommentAdded: '💬',
  MemberLeft: '👋',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getNavigationTarget(notification) {
  const { entityType, entityId } = notification;
  if (!entityId) return null;
  if (entityType === 'Task') return `/projects?task=${entityId}`;
  if (entityType === 'User') return `/users/${entityId}`;
  return null;
}

export default function NotificationPanel({
  notifications,
  invitations = [],
  onUpdate,
  onClose,
  onAcceptInvitation,
  onDeclineInvitation,
}) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await markRead(n.id).catch(() => {});
      onUpdate();
    }
    const target = getNavigationTarget(n);
    if (target) { navigate(target); onClose(); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id).catch(() => {});
    onUpdate();
  };

  const handleMarkAllRead = async () => {
    await markAllRead().catch(() => {});
    onUpdate();
  };

  const handleClearAll = async () => {
    await clearAllNotifications().catch(() => {});
    onUpdate();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = invitations.length + unreadCount;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 flex flex-col overflow-hidden"
      style={{ maxHeight: '520px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {totalCount > 0 && (
            <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium">
              {totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <CheckIcon className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <TrashIcon className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Pending invitations section */}
        {invitations.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-1">
              Pending Invitations
            </p>
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-indigo-50/30">
                <span className="text-lg flex-shrink-0">✉️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{inv.projectName}</p>
                  <p className="text-xs text-gray-500">from {inv.invitedByUsername} · as {inv.role ?? 'Member'}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onAcceptInvitation?.(inv)}
                    className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                    title="Accept"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeclineInvitation?.(inv)}
                    className="p-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"
                    title="Decline"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications section */}
        {notifications.length === 0 && invitations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : notifications.length > 0 ? (
          <div>
            {invitations.length > 0 && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-1">
                Activity
              </p>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition group ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1.5" />}
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition flex-shrink-0 mt-0.5"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
