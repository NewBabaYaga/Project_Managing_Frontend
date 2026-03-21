import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import { Textarea } from '../Shared/Input';
import Button from '../Shared/Button';
import Badge from '../Shared/Badge';
import { getSubmissions, createReview } from '../../api/submissionsApi';
import { formatDateTime } from '../../utils/dateUtils';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../Shared/LoadingSpinner';

export default function ReviewModal({ isOpen, onClose, task, onReviewed }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setFetching(true);
      getSubmissions(task.id)
        .then(res => {
          const subs = res.data;
          setSubmissions(subs);
          // Auto-select the latest unreviewed submission
          const active = subs.find(s => s.reviewStatus == null);
          setSelectedSubmission(active || subs[0] || null);
        })
        .catch(() => toast.error('Failed to load submissions'))
        .finally(() => setFetching(false));
    }
  }, [isOpen, task]);

  const handleReview = async (status) => {
    if (!selectedSubmission) return;
    if (status === 'Rejected' && !feedback.trim()) { toast.error('Feedback is required when rejecting'); return; }
    setLoading(true);
    try {
      await createReview(selectedSubmission.id, { status, feedback });
      toast.success(status === 'Approved' ? 'Task approved!' : 'Task rejected.');
      onReviewed?.();
      onClose();
      setFeedback('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally {
      setLoading(false);
    }
  };

  const activeSubmission = selectedSubmission && !selectedSubmission.reviewStatus;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${task?.title}`} maxWidth="max-w-2xl">
      {fetching ? <LoadingSpinner /> : (
        <div className="flex flex-col gap-4">
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No submissions yet.</p>
          ) : (
            <>
              {/* Submission selector */}
              {submissions.length > 1 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Submissions ({submissions.length})</p>
                  <div className="flex flex-col gap-2">
                    {submissions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSubmission(s)}
                        className={`text-left p-3 rounded-lg border text-sm transition ${
                          selectedSubmission?.id === s.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>{s.submitterUsername}</span>
                          {s.reviewStatus ? (
                            <Badge className={s.reviewStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {s.reviewStatus}
                            </Badge>
                          ) : <Badge className="bg-blue-100 text-blue-700">Pending</Badge>}
                        </div>
                        <span className="text-gray-400 text-xs">{formatDateTime(s.submittedAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Submission Details</p>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">By:</span> {selectedSubmission.submitterUsername}
                  </div>
                  {selectedSubmission.comment && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Comment:</span> {selectedSubmission.comment}
                    </div>
                  )}
                  {selectedSubmission.fileUrl ? (
                    <a
                      href={`http://localhost:5040${selectedSubmission.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      View Attachment
                    </a>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No attachment</p>
                  )}
                  {selectedSubmission.reviewFeedback && (
                    <div className="mt-3 p-3 bg-white rounded border text-sm text-gray-600">
                      <p className="font-medium">Review Feedback:</p>
                      <p>{selectedSubmission.reviewFeedback}</p>
                    </div>
                  )}
                </div>
              )}

              {activeSubmission && (
                <>
                  <Textarea
                    label="Feedback (required for rejection)"
                    placeholder="Provide feedback for the developer..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="danger" onClick={() => handleReview('Rejected')} disabled={loading}>
                      Reject
                    </Button>
                    <Button variant="success" onClick={() => handleReview('Approved')} disabled={loading}>
                      Approve
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
