import Badge from '../Shared/Badge';
import Button from '../Shared/Button';
import { getStatusColor, getDifficultyColor, getDifficultyPoints, isDeveloper } from '../../utils/roleUtils';
import { formatDateTime, isOverdue, isDueSoon } from '../../utils/dateUtils';
import { ClockIcon, UserIcon, PaperClipIcon, ExclamationTriangleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';

export default function TaskCard({
  task, userRole, currentUserId, groupMembers,
  onAccept, onOpenSubmit, onOpenReview, onDelegate, onClick, fullWidth = false
}) {
  const diffColor = getDifficultyColor(task.difficulty);
  const points = getDifficultyPoints(task.difficulty);
  const overdue = isOverdue(task.dueDate) && task.status !== 'Approved';
  const dueSoon = !overdue && isDueSoon(task.dueDate) && task.status !== 'Approved';

  const isAssignedToMe = task.assignedToId === currentUserId;
  const isDevRole = isDeveloper(userRole);
  const isManager = userRole === 'Manager';

  const canAccept = isDevRole && task.status === 'ToDo' && (() => {
    if (task.assignmentMode === 'Direct') return false;
    if (task.assignmentMode === 'Invited') return task.eligibleUserIds?.includes(currentUserId);
    return task.assignedToId == null || isAssignedToMe;
  })();

  const canSubmit = isAssignedToMe && task.status === 'InProgress';
  const canReview = !isDevRole && !isManager && task.status === 'Submitted';
  const canManagerReview = isManager && task.status === 'Submitted';
  const canDelegate = isManager && task.status === 'InProgress' && isAssignedToMe && (groupMembers?.length ?? 0) > 0;

  const hasActions = canAccept || canSubmit || canReview || canManagerReview || canDelegate;

  const borderCls = overdue
    ? 'border-red-300 bg-red-50/30'
    : dueSoon
    ? 'border-orange-300 bg-orange-50/30'
    : 'border-gray-200 bg-white';

  if (fullWidth) {
    return (
      <div
        className={`rounded-lg border px-4 py-3 hover:shadow-sm transition cursor-pointer flex items-center gap-4 ${borderCls}`}
        onClick={() => onClick?.(task)}
      >
        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-medium text-gray-900 text-sm truncate">{task.title}</h4>
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 truncate">{task.description}</p>
          )}
          {task.rejectionFeedback && task.status === 'InProgress' && (
            <div className="flex items-center gap-1 mt-1">
              <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 truncate">{task.rejectionFeedback}</p>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
          <Badge className={diffColor}>{task.difficulty} ({points}pt)</Badge>
          {overdue && <Badge className="bg-red-100 text-red-700">Overdue</Badge>}
          {dueSoon && <Badge className="bg-orange-100 text-orange-700">Due soon</Badge>}
          {task.requiresAttachment && (
            <Badge className="bg-amber-50 text-amber-600">
              <PaperClipIcon className="w-3 h-3" />
            </Badge>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-col items-end gap-1 text-xs text-gray-500 flex-shrink-0 min-w-[120px]">
          {task.assignedToUsername && (
            <div className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              <span>{task.assignedToUsername}</span>
            </div>
          )}
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
              <ClockIcon className="w-3.5 h-3.5" />
              <span>{formatDateTime(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {hasActions && (
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {canAccept && (
              <Button size="sm" onClick={() => onAccept(task)}>Accept</Button>
            )}
            {canSubmit && (
              <Button size="sm" variant="success" onClick={() => onOpenSubmit(task)}>Submit</Button>
            )}
            {(canReview || canManagerReview) && (
              <Button size="sm" variant="secondary" onClick={() => onOpenReview(task)}>Review</Button>
            )}
            {canDelegate && (
              <Button size="sm" variant="outline" onClick={() => onDelegate?.(task)} className="flex items-center gap-1">
                <ArrowRightCircleIcon className="w-3.5 h-3.5" />
                Delegate
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Compact card (used in other views)
  return (
    <div
      className={`rounded-lg border p-3 hover:shadow-sm transition cursor-pointer ${borderCls}`}
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h4>
        <Badge className={`${diffColor} flex-shrink-0`}>{task.difficulty} ({points}pt)</Badge>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
      )}

      {task.rejectionFeedback && task.status === 'InProgress' && (
        <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-md p-2 mb-2">
          <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 line-clamp-2">{task.rejectionFeedback}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {overdue && <Badge className="bg-red-100 text-red-700">Overdue</Badge>}
        {dueSoon && <Badge className="bg-orange-100 text-orange-700">Due soon</Badge>}
        {task.requiresAttachment && (
          <Badge className="bg-amber-50 text-amber-600 flex items-center gap-0.5">
            <PaperClipIcon className="w-3 h-3" />
          </Badge>
        )}
      </div>

      {task.assignedToUsername && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <UserIcon className="w-3.5 h-3.5" />
          <span>{task.assignedToUsername}</span>
        </div>
      )}

      {task.dueDate && (
        <div className={`flex items-center gap-1.5 text-xs mb-2 ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
          <ClockIcon className="w-3.5 h-3.5" />
          <span>{formatDateTime(task.dueDate)}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
        {canAccept && <Button size="sm" onClick={() => onAccept(task)} className="w-full justify-center">Accept</Button>}
        {canSubmit && <Button size="sm" variant="success" onClick={() => onOpenSubmit(task)} className="w-full justify-center">Submit</Button>}
        {(canReview || canManagerReview) && <Button size="sm" variant="secondary" onClick={() => onOpenReview(task)} className="w-full justify-center">Review</Button>}
        {canDelegate && (
          <Button size="sm" variant="outline" onClick={() => onDelegate?.(task)} className="w-full justify-center">
            <ArrowRightCircleIcon className="w-3.5 h-3.5" />
            Delegate
          </Button>
        )}
      </div>
    </div>
  );
}
