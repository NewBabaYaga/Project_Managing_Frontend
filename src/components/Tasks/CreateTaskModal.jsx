import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import Input, { Textarea, Select } from '../Shared/Input';
import Button from '../Shared/Button';
import { createTask } from '../../api/tasksApi';
import { getErrorMessage } from '../../utils/errorUtils';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CreateTaskModal({ isOpen, onClose, projectId, members, userRole, onCreated }) {
  const isManager = userRole === 'Manager';
  const isAdmin = userRole === 'Admin';

  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    dueDate: '',
    assignmentMode: 'Open',
    assignedToId: '',
    requiresAttachment: false,
  });
  const [eligibleUserIds, setEligibleUserIds] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Members that can be assigned: passed in from dashboard (already filtered by role)
  // If assigning to a Manager, force Direct mode on the backend
  const managerMembers = members?.filter(m => m.role === 'Manager') ?? [];
  const developerMembers = members?.filter(m => m.role === 'Developer') ?? [];

  // Detect if selected assignee is a manager (admin case)
  const selectedIsManager = form.assignedToId
    ? managerMembers.some(m => m.userId === form.assignedToId)
    : false;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => { setImage(null); setImagePreview(null); };

  const toggleEligibleUser = (userId) => {
    setEligibleUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const resetForm = () => {
    setForm({ title: '', description: '', difficulty: 'Medium', dueDate: '', assignmentMode: 'Open', assignedToId: '', requiresAttachment: false });
    setEligibleUserIds([]);
    clearImage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('difficulty', form.difficulty);
      formData.append('requiresAttachment', form.requiresAttachment);

      // Determine effective assignment mode
      let mode = form.assignmentMode;
      if (selectedIsManager) mode = 'Direct'; // assigning to a manager is always Direct
      if (isManager && form.assignedToId) mode = 'Direct'; // managers always Direct-assign
      formData.append('assignmentMode', mode);

      if (form.assignedToId) formData.append('assignedToId', form.assignedToId);

      if (mode === 'Invited')
        eligibleUserIds.forEach(id => formData.append('eligibleUserIds', id));

      if (form.dueDate) formData.append('dueDate', form.dueDate);
      if (image) formData.append('image', image);

      const res = await createTask(projectId, formData);
      toast.success('Task created!');
      onCreated(res.data);
      onClose();
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title *"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <Textarea
          label="Description"
          placeholder="Describe what needs to be done..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Reference image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference Image (optional)</label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200" />
              <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 w-fit px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition text-sm text-gray-500">
              <PhotoIcon className="w-5 h-5 text-gray-400" />
              Attach image
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <Select
          label="Difficulty *"
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
        >
          <option value="Easy">Easy (1 point)</option>
          <option value="Medium">Medium (3 points)</option>
          <option value="Hard">Hard (5 points)</option>
        </Select>

        {/* ── Assignment section ─────────────────────────────────────────────── */}
        {isManager ? (
          /* Managers: assign to themselves or a dev in their group */
          <Select
            label="Assign To"
            value={form.assignedToId}
            onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
          >
            <option value="">Unassigned (open to group)</option>
            {members?.map(m => (
              <option key={m.userId} value={m.userId}>
                {m.username} ({m.role === 'Manager' ? 'You' : 'Dev'})
              </option>
            ))}
          </Select>
        ) : isAdmin ? (
          <>
            {/* Admin: show assignment mode selector */}
            <Select
              label="Assignment Mode"
              value={form.assignmentMode}
              onChange={(e) => setForm({ ...form, assignmentMode: e.target.value, assignedToId: '' })}
            >
              <option value="Open">Open — any developer can accept</option>
              <option value="Invited">Invited — specific developers can accept</option>
              <option value="Direct">Direct — assign directly, no accept step</option>
            </Select>

            {/* Direct/Manager-assign: pick one person */}
            {(form.assignmentMode === 'Direct' || form.assignmentMode === 'Open' || form.assignmentMode === 'Invited') && (
              <Select
                label={form.assignmentMode === 'Direct' ? 'Assign To *' : 'Assign To (optional)'}
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                required={form.assignmentMode === 'Direct'}
              >
                <option value="">Unassigned</option>
                {/* Managers first */}
                {managerMembers.length > 0 && (
                  <optgroup label="Managers (Direct assignment)">
                    {managerMembers.map(m => (
                      <option key={m.userId} value={m.userId}>{m.username}</option>
                    ))}
                  </optgroup>
                )}
                {developerMembers.length > 0 && (
                  <optgroup label="Developers">
                    {developerMembers.map(m => (
                      <option key={m.userId} value={m.userId}>{m.username}</option>
                    ))}
                  </optgroup>
                )}
              </Select>
            )}

            {/* Invited: multi-select (only devs) */}
            {form.assignmentMode === 'Invited' && !form.assignedToId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Developers</label>
                <div className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {developerMembers.length === 0 && <p className="text-sm text-gray-400">No developers available.</p>}
                  {developerMembers.map(m => (
                    <label key={m.userId} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={eligibleUserIds.includes(m.userId)} onChange={() => toggleEligibleUser(m.userId)} className="rounded" />
                      {m.username}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Due date */}
        <Input
          label="Due Date & Time"
          type="datetime-local"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />

        {/* Requires attachment */}
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.requiresAttachment}
            onChange={(e) => setForm({ ...form, requiresAttachment: e.target.checked })}
            className="rounded"
          />
          <span className="font-medium text-gray-700">Require file attachment on submission</span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
