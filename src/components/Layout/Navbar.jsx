import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRightOnRectangleIcon, FolderIcon } from '@heroicons/react/24/outline';
import Button from '../Shared/Button';
import Avatar from '../Shared/Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/projects" className="flex items-center gap-2 font-bold text-indigo-600 text-lg hover:text-indigo-700">
            <FolderIcon className="w-6 h-6" />
            TaskFlow
          </Link>

          {user && (
            <div className="flex items-center gap-3">
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
