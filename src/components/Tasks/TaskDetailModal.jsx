import { Link } from 'react-router-dom';
import Modal from '../Shared/Modal';
import Badge from '../Shared/Badge';
import Button from '../Shared/Button';
import { getStatusColor, getDifficultyColor, getDifficultyPoints } from '../../utils/roleUtils';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { UserIcon, CalendarIcon, ClockIcon, ArrowTopRightOnSquareIcon, PaperClipIcon } from '@heroicons/react/24/outline';

export default function TaskDetailModal({ isOpen, onClose, task, projectId }) {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
          <Badge className={getDifficultyColor(task.difficulty)}>
            {task.difficulty} ({getDifficultyPoints(task.difficulty)} pts)
          </Badge>
          {task.requiresAttachment && (
            <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
              <PaperClipIcon className="w-3 h-3" />
              Attachment required
            </Badge>
          )}
        </div>

        {task.description && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{task.description}</p>
          </div>
        )}

        {task.rejectionFeedback && task.status === 'InProgress' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-700 mb-1">Rejected — Reviewer feedback:</p>
            <p className="text-sm text-red-600">{task.rejectionFeedback}</p>
          </div>
        )}

        {task.imageUrl && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Reference Image</p>
            <img
              src={`http://localhost:5000${task.imageUrl}`}
              alt="Task reference"
              className="max-h-64 rounded-lg border border-gray-200 object-contain"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-1">Created by</p>
            <div className="flex items-center gap-1.5 text-gray-600">
              <UserIcon className="w-4 h-4" />
              {task.createdByUsername}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Assigned to</p>
            <div className="flex items-center gap-1.5 text-gray-600">
              <UserIcon className="w-4 h-4" />
              {task.assignedToUsername || 'Unassigned'}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Created</p>
            <div className="flex items-center gap-1.5 text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              {formatDateTime(task.createdAt)}
            </div>
          </div>
          {task.dueDate && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Due Date</p>
              <div className="flex items-center gap-1.5 text-gray-600">
                <ClockIcon className="w-4 h-4" />
                {formatDateTime(task.dueDate)}
              </div>
            </div>
          )}
        </div>

        {projectId && (
          <div className="flex justify-end pt-1">
            <Link
              to={`/projects/${projectId}/tasks/${task.id}`}
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              Open full details & comments
            </Link>
          </div>
        )}
      </div>
    </Modal>
  );
}
