import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Shared/Modal';
import Input, { Textarea, Select } from '../Shared/Input';
import Button from '../Shared/Button';
import { createProject, sendInvitation, generateInviteLink } from '../../api/projectsApi';
import { PlusIcon, TrashIcon, UserPlusIcon, CheckCircleIcon, LinkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

export default function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', description: '' });
  const [createdProject, setCreatedProject] = useState(null);
  const [contributors, setContributors] = useState([{ email: '', role: 'Developer' }]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const reset = () => {
    setStep(1);
    setForm({ name: '', description: '' });
    setCreatedProject(null);
    setContributors([{ email: '', role: 'Developer' }]);
    setInviteLink(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await createProject(form);
      setCreatedProject(res.data);
      onCreated(res.data);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAndFinish = async () => {
    const toInvite = contributors.filter(c => c.email.trim());
    if (toInvite.length > 0) {
      setInviting(true);
      let successCount = 0;
      for (const c of toInvite) {
        try {
          await sendInvitation(createdProject.id, { email: c.email.trim(), role: c.role });
          successCount++;
        } catch (err) {
          toast.error(`Failed to invite ${c.email}: ${err.response?.data?.message || 'error'}`);
        }
      }
      if (successCount > 0) toast.success(`Invited ${successCount} contributor${successCount > 1 ? 's' : ''}!`);
      setInviting(false);
    }
    handleClose();
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await generateInviteLink(createdProject.id);
      setInviteLink(res.data.link);
    } catch {
      toast.error('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(
      () => toast.success('Link copied!'),
      () => toast.error('Failed to copy')
    );
  };

  const addRow = () => setContributors([...contributors, { email: '', role: 'Developer' }]);
  const removeRow = (i) => setContributors(contributors.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) =>
    setContributors(contributors.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 1 ? 'Create Project' : 'Invite Members'}>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s, idx) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition
              ${step === s ? 'bg-indigo-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > s ? <CheckCircleIcon className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs ${step === s ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
              {['Project Details', 'Invite Members'][idx]}
            </span>
            {s < 2 && <div className="w-6 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1 — project details */}
      {step === 1 && (
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
          <Input
            label="Project Name *"
            placeholder="e.g. E-Commerce App"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Briefly describe the project..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} type="button">Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Next: Invite →'}
            </Button>
          </div>
        </form>
      )}

      {/* Step 2 — invite by email + link */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
            <span>Project <strong>{createdProject?.name}</strong> created!</span>
          </div>

          {/* Email invites */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invite by Email</p>
            <div className="flex flex-col gap-2">
              {contributors.map((c, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label={i === 0 ? 'Email' : undefined}
                      type="email"
                      placeholder="teammate@example.com"
                      value={c.email}
                      onChange={(e) => updateRow(i, 'email', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      label={i === 0 ? 'Role' : undefined}
                      value={c.role}
                      onChange={(e) => updateRow(i, 'role', e.target.value)}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Developer">Developer</option>
                    </Select>
                  </div>
                  {contributors.length > 1 && (
                    <button onClick={() => removeRow(i)}
                      className="mb-0.5 p-2 text-gray-400 hover:text-red-500 transition rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addRow}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium w-fit mt-2">
              <PlusIcon className="w-4 h-4" />
              Add another
            </button>
          </div>

          {/* Invite link */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shareable Invite Link</p>
            {!inviteLink ? (
              <Button variant="outline" onClick={handleGenerateLink} disabled={generatingLink} size="sm">
                <LinkIcon className="w-4 h-4" />
                {generatingLink ? 'Generating…' : 'Generate Invite Link'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="flex-1 text-xs text-gray-600 truncate">{inviteLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  Copy
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Anyone with the link can join. Role will be assigned by an Admin.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={handleClose} disabled={inviting}>Skip & Done</Button>
            <Button onClick={handleInviteAndFinish} disabled={inviting}>
              <UserPlusIcon className="w-4 h-4" />
              {inviting ? 'Sending…' : 'Send Invites & Done'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
