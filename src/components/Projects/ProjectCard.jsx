import { useNavigate } from 'react-router-dom';
import { FolderIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition">
          <FolderIcon className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{project.description || 'No description'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <UsersIcon className="w-3.5 h-3.5" />
          <span>{project.memberCount} member{project.memberCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{formatDate(project.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
