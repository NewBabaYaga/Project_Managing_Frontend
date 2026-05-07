import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import { Textarea } from '../Shared/Input';
import Button from '../Shared/Button';
import { createSubmission } from '../../api/submissionsApi';
import { getErrorMessage } from '../../utils/errorUtils';
import { CloudArrowUpIcon, DocumentIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function SubmitTaskModal({ isOpen, onClose, task, onSubmitted }) {
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const requiresAttachment = task?.requiresAttachment ?? false;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      toast.error(`File is too large. Maximum allowed size is ${MAX_FILE_MB} MB.`);
      e.target.value = '';
      return;
    }
    setFile(selected);
  };

  const clearFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
  };

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
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition
            border-gray-300 hover:border-indigo-400 hover:bg-indigo-50">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.zip,.docx,.txt"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center gap-1.5 text-indigo-600 px-4">
                <div className="flex items-center gap-2">
                  <DocumentIcon className="w-6 h-6 flex-shrink-0" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
                    title="Remove file"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-400">{formatBytes(file.size)}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <CloudArrowUpIcon className="w-8 h-8 mb-1" />
                <span className="text-sm">Click to upload</span>
              </div>
            )}
          </label>
          <p className="text-xs text-gray-400 mt-1.5">
            Accepted: PDF, PNG, JPG, ZIP, DOCX &nbsp;·&nbsp; Max {MAX_FILE_MB} MB
          </p>
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
