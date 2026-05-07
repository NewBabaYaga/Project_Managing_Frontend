import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRightOnRectangleIcon, BellIcon } from '@heroicons/react/24/outline';
import Button from '../Shared/Button';
import Avatar from '../Shared/Avatar';
import NotificationPanel from './NotificationPanel';
import { getMyInvitations, acceptInvitation, declineInvitation } from '../../api/invitationsApi';
import { getNotifications, markAllRead } from '../../api/notificationsApi';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 15000;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchInvitations = useCallback(() => {
    if (!user) return;
    getMyInvitations().then(r => setInvitations(r.data)).catch(() => {});
  }, [user]);

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    getNotifications().then(r => setNotifications(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchInvitations();
    fetchNotifications();
  }, [fetchInvitations, fetchNotifications]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      fetchInvitations();
      fetchNotifications();
    };
    const id = setInterval(tick, POLL_INTERVAL);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [fetchInvitations, fetchNotifications]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleOpenNotifications = async () => {
    setShowNotifications(true);
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length > 0) {
      await markAllRead().catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleAccept = async (inv) => {
    try {
      await acceptInvitation(inv.token);
      toast.success(`Joined ${inv.projectName}!`);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
      navigate('/projects');
      setShowNotifications(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleDecline = async (inv) => {
    try {
      await declineInvitation(inv.token);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalBadge = invitations.length + unreadCount;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/projects" className="flex items-center gap-2 font-bold text-indigo-600 text-lg hover:text-indigo-700">
            <img src="/logo_transparent.png" alt="TaskFlow" className="h-8 w-8 object-contain" />
            TaskFlow
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              {/* Single notification bell — includes invitations */}
              <div className="relative">
                <button
                  onClick={handleOpenNotifications}
                  className="relative p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition"
                  title="Notifications"
                >
                  <BellIcon className="w-5 h-5" />
                  {totalBadge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalBadge > 9 ? '9+' : totalBadge}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    invitations={invitations}
                    onUpdate={fetchNotifications}
                    onClose={() => setShowNotifications(false)}
                    onAcceptInvitation={handleAccept}
                    onDeclineInvitation={handleDecline}
                  />
                )}
              </div>

              <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition">
                <Avatar name={user.username} avatarUrl={user.avatarUrl} size="sm" />
                <span className="font-medium hidden sm:inline">{user.username}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
