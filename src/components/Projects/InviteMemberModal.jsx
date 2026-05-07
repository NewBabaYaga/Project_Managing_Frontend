import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import Input, { Select } from '../Shared/Input';
import Button from '../Shared/Button';
import { sendInvitation, generateInviteLink } from '../../api/projectsApi';
import { ClipboardIcon, CheckIcon, LinkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function InviteMemberModal({ isOpen, onClose, projectId, onInvited }) {
  const [tab, setTab] = useState('email');
  const [form, setForm] = useState({ email: '', role: 'Developer' });
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setForm({ email: '', role: 'Developer' });
    setGeneratedLink(null);
    setCopied(false);
    onClose();
  };

  const handleEmailInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendInvitation(projectId, { email: form.email, role: form.role });
      toast.success(`Invitation sent to ${form.email}`);
      onInvited?.();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const res = await generateInviteLink(projectId);
      setGeneratedLink(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: 'email', label: 'By Email', icon: EnvelopeIcon },
    { key: 'link', label: 'Invite Link', icon: LinkIcon },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-5 -mt-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setGeneratedLink(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Email tab */}
      {tab === 'email' && (
        <form onSubmit={handleEmailInvite} className="flex flex-col gap-4">
          <Input
            label="User Email"
            type="email"
            placeholder="user@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Developer">Developer</option>
          </Select>
          <p className="text-xs text-gray-500">
            The user will receive a pending invitation they can accept or decline.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={handleClose} type="button">Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      )}

      {/* Link tab */}
      {tab === 'link' && (
        <div className="flex flex-col gap-4">
          {!generatedLink ? (
            <>
              <p className="text-sm text-gray-600">
                Generate a shareable link. Anyone with the link can join the project — an Admin will then assign their role.
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Users who join via link will have no role until you assign one. They won't be able to see any project content until then.
              </p>
              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={handleClose} type="button">Cancel</Button>
                <Button onClick={handleGenerateLink} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Link'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">Share this link with your team member:</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="flex-1 text-xs text-gray-700 truncate font-mono">{generatedLink.link}</span>
                <button onClick={handleCopy} className="flex-shrink-0 text-gray-500 hover:text-indigo-600 transition">
                  {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Expires {new Date(generatedLink.expiresAt).toLocaleDateString()}
              </p>
              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={() => setGeneratedLink(null)} type="button">Generate Another</Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
