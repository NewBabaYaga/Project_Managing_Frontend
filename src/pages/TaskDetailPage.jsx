import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import Badge from '../components/Shared/Badge';
import Button from '../components/Shared/Button';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { getTask } from '../api/tasksApi';
import { getTaskComments, addTaskComment } from '../api/tasksApi';
import { useAuth } from '../context/AuthContext';
import {
  getStatusColor, getDifficultyColor, getDifficultyPoints
} from '../utils/roleUtils';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { getErrorMessage } from '../utils/errorUtils';
import {
  ArrowLeftIcon, UserIcon, CalendarIcon, ClockIcon,
  PaperClipIcon, ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        getTask(projectId, taskId),
        getTaskComments(projectId, taskId),
      ]);
      setTask(taskRes.data);
      setComments(commentsRes.data);
    } catch {
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await addTaskComment(projectId, taskId, { content: commentText });
      setComments(prev => [...prev, res.data]);
      setCommentText('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post comment'));
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LoadingSpinner text="Loading task..." />
    </div>
  );

  if (!task) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">Task not found.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to={`/projects/${projectId}`} className="hover:text-indigo-600 flex items-center gap-1">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to project
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2 mb-3">
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

              <h1 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h1>

              {task.description && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
              )}

              {/* Rejection feedback */}
              {task.rejectionFeedback && task.status === 'InProgress' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 mb-1">Rejected — Reviewer feedback:</p>
                  <p className="text-sm text-red-600">{task.rejectionFeedback}</p>
                </div>
              )}

              {task.imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Reference Image</p>
                  <img
                    src={`http://localhost:5000${task.imageUrl}`}
                    alt="Task reference"
                    className="max-h-64 rounded-lg border border-gray-200 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400" />
                Comments ({comments.length})
              </h2>

              {comments.length === 0 && (
                <p className="text-sm text-gray-400 mb-4">No comments yet. Be the first to ask a question.</p>
              )}

              <div className="flex flex-col gap-3 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-700">
                        {c.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{c.username}</span>
                        {c.userId === user?.userId && (
                          <span className="text-xs text-indigo-500">You</span>
                        )}
                        <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <textarea
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  rows={2}
                  placeholder="Add a comment or question..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e); }
                  }}
                />
                <Button type="submit" size="sm" disabled={submittingComment || !commentText.trim()}>
                  {submittingComment ? '...' : 'Post'}
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Details</h3>

              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created by</p>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    {task.createdByUsername}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Assigned to</p>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    {task.assignedToUsername || 'Unassigned'}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Assignment mode</p>
                  <span className="text-gray-700">{task.assignmentMode}</span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created</p>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    {formatDateTime(task.createdAt)}
                  </div>
                </div>

                {task.dueDate && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Due</p>
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      {formatDateTime(task.dueDate)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
