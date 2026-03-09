import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import Input, { Select } from '../Shared/Input';
import Button from '../Shared/Button';
import { inviteMember } from '../../api/projectsApi';

export default function InviteMemberModal({ isOpen, onClose, projectId, onInvited }) {
  const [form, setForm] = useState({ email: '', role: 'Developer' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inviteMember(projectId, form);
      toast.success(`Invited ${form.email} as ${form.role}`);
      onInvited?.();
      onClose();
      setForm({ email: '', role: 'Developer' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="User Email *"
          type="email"
          placeholder="user@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Select
          label="Role *"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="Manager">Manager</option>
          <option value="Developer">Developer</option>
        </Select>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Inviting...' : 'Send Invite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
