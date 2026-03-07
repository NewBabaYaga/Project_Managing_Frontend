import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import { Textarea } from '../Shared/Input';
import Button from '../Shared/Button';
import { createSubmission } from '../../api/submissionsApi';
import { getErrorMessage } from '../../utils/errorUtils';
import { CloudArrowUpIcon, DocumentIcon, PaperClipIcon } from '@heroicons/react/24/outline';

export default function SubmitTaskModal({ isOpen, onClose, task, onSubmitted }) {
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const requiresAttachment = task?.requiresAttachment ?? false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requiresAttachment && !file) {
      toast.error('This task requires a file attachment.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (comment) formData.append('comment', comment);

      await createSubmission(task.id, formData);
      toast.success('Task submitted successfully!');
      onSubmitted?.();
      onClose();
      setComment('');
      setFile(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Submission failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Submit: ${task?.title}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachment {requiresAttachment ? '*' : '(optional)'}
          </label>
          {requiresAttachment && (
            <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
              <PaperClipIcon className="w-3.5 h-3.5" />
              The task creator requires an attachment for this submission.
            </p>
          )}
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.zip,.docx,.txt"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center gap-2 text-indigo-600">
                <DocumentIcon className="w-6 h-6" />
                <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <CloudArrowUpIcon className="w-8 h-8 mb-1" />
                <span className="text-sm">Click to upload</span>
                <span className="text-xs mt-1">PDF, PNG, JPG, ZIP, DOCX (max 10MB)</span>
              </div>
            )}
          </label>
        </div>

        <Textarea
          label="Comment (optional)"
          placeholder="Add notes about your submission..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" variant="success" disabled={loading || (requiresAttachment && !file)}>
            {loading ? 'Submitting...' : 'Submit Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
