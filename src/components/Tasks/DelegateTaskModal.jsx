import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import Button from '../Shared/Button';
import { delegateTask } from '../../api/projectsApi';
import { getErrorMessage } from '../../utils/errorUtils';
import { UserIcon } from '@heroicons/react/24/outline';

export default function DelegateTaskModal({ isOpen, onClose, task, projectId, groupMembers, onDelegated }) {
  const [selectedDevId, setSelectedDevId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const handleDelegate = async () => {
    if (!selectedDevId) { toast.error('Select a developer'); return; }
    setLoading(true);
    try {
      await delegateTask(projectId, task.id, selectedDevId);
      toast.success('Task delegated!');
      onDelegated?.();
      onClose();
      setSelectedDevId('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delegate task'));
    } finally {
      setLoading(false);
    }
  };

  const devs = groupMembers?.filter(m => m.role === 'Developer') ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delegate: ${task.title}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          Select a developer from your group to hand off this task. They will need to accept it.
        </p>

        {devs.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            You have no developers in your group yet. Ask an Admin to assign developers to you.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {devs.map(dev => (
              <label
                key={dev.userId}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  selectedDevId === dev.userId
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="developer"
                  value={dev.userId}
                  checked={selectedDevId === dev.userId}
                  onChange={() => setSelectedDevId(dev.userId)}
                  className="accent-indigo-600"
                />
                <UserIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{dev.username}</p>
                  <p className="text-xs text-gray-400">{dev.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button onClick={handleDelegate} disabled={loading || !selectedDevId || devs.length === 0}>
            {loading ? 'Delegating...' : 'Delegate Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
