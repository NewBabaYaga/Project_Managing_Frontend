import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import { Select } from '../Shared/Input';
import Button from '../Shared/Button';
import Badge from '../Shared/Badge';
import { getRoleBadgeColor } from '../../utils/roleUtils';
import { updateMemberRole } from '../../api/projectsApi';

export default function ChangeRoleModal({ isOpen, onClose, projectId, member, onUpdated }) {
  const [newRole, setNewRole] = useState(member?.role || 'Developer');
  const [loading, setLoading] = useState(false);

  if (!member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newRole === member.role) { onClose(); return; }
    setLoading(true);
    try {
      await updateMemberRole(projectId, member.userId, newRole);
      toast.success(`${member.username}'s role updated to ${newRole}`);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Member Role">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{member.username}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
          <Badge className={`ml-auto ${getRoleBadgeColor(member.role)}`}>{member.role}</Badge>
        </div>

        <Select
          label="New Role"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        >
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Developer">Developer</option>
        </Select>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={loading || newRole === member.role}>
            {loading ? 'Saving...' : 'Update Role'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
