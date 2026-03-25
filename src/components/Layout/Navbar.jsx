import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRightOnRectangleIcon, FolderIcon, BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../Shared/Button';
import Avatar from '../Shared/Avatar';
import { getMyInvitations, acceptInvitation, declineInvitation } from '../../api/invitationsApi';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    getMyInvitations().then(r => setInvitations(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAccept = async (inv) => {
    try {
      await acceptInvitation(inv.token);
      toast.success(`Joined ${inv.projectName}!`);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
      navigate('/projects');
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

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/projects" className="flex items-center gap-2 font-bold text-indigo-600 text-lg hover:text-indigo-700">
            <FolderIcon className="w-6 h-6" />
            TaskFlow
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              {/* Invitation bell */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setShowBell(v => !v)}
                  className="relative p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition"
                >
                  <BellIcon className="w-5 h-5" />
                  {invitations.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {invitations.length}
                    </span>
                  )}
                </button>

                {showBell && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <p className="text-xs font-semibold text-gray-500 px-4 pt-3 pb-2 border-b border-gray-100">
                      Pending Invitations
                    </p>
                    {invitations.length === 0 ? (
                      <p className="text-sm text-gray-400 px-4 py-4 text-center">No pending invitations</p>
                    ) : (
                      <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {invitations.map(inv => (
                          <li key={inv.id} className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{inv.projectName}</p>
                              <p className="text-xs text-gray-500">
                                from {inv.invitedByUsername} · as {inv.role}
                              </p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleAccept(inv)}
                                className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                                title="Accept"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDecline(inv)}
                                className="p-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"
                                title="Decline"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition">
                <Avatar name={user.username} size="sm" />
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
