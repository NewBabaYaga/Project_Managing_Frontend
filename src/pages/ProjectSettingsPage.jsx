import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import Button from '../components/Shared/Button';
import Input, { Textarea } from '../components/Shared/Input';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import {
  getProject, updateProject, uploadProjectImage,
  getInviteLinks, deleteInviteLink, generateInviteLink,
} from '../api/projectsApi';
import {
  ArrowLeftIcon, CameraIcon, LinkIcon, TrashIcon,
  PlusIcon, ClipboardDocumentIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5162';

function formatExpiry(expiresAt) {
  if (!expiresAt) return 'Never';
  const d = new Date(expiresAt);
  if (d.getFullYear() > 2100) return 'Never';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function linkStatus(link) {
  if (link.status !== 'Pending') return { label: 'Used', cls: 'bg-gray-100 text-gray-500' };
  if (link.isExpired) return { label: 'Expired', cls: 'bg-red-50 text-red-600' };
  if (link.isMaxedOut) return { label: 'Full', cls: 'bg-amber-50 text-amber-700' };
  return { label: 'Active', cls: 'bg-green-50 text-green-700' };
}

export default function ProjectSettingsPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef(null);

  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [showNewLink, setShowNewLink] = useState(false);
  const [newLinkOpts, setNewLinkOpts] = useState({ maxUses: '', expiresAt: '' });
  const [generatingLink, setGeneratingLink] = useState(false);
  const [frontendBase] = useState(window.location.origin);

  useEffect(() => {
    Promise.all([
      getProject(projectId),
      getInviteLinks(projectId),
    ]).then(([projRes, linksRes]) => {
      setProject(projRes.data);
      setForm({ name: projRes.data.name, description: projRes.data.description });
      setLinks(linksRes.data);
    }).catch(() => {
      toast.error('Failed to load settings');
      navigate(`/projects/${projectId}`);
    }).finally(() => {
      setLoading(false);
      setLinksLoading(false);
    });
  }, [projectId, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProject(projectId, form);
      setProject(res.data);
      toast.success('Project updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const res = await uploadProjectImage(projectId, file);
      setProject(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
      toast.success('Image updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await deleteInviteLink(projectId, linkId);
      setLinks(prev => prev.filter(l => l.id !== linkId));
      toast.success('Link deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const opts = {};
      if (newLinkOpts.maxUses && Number(newLinkOpts.maxUses) > 0) opts.maxUses = Number(newLinkOpts.maxUses);
      if (newLinkOpts.expiresAt) opts.expiresAt = new Date(newLinkOpts.expiresAt).toISOString();
      const res = await generateInviteLink(projectId, Object.keys(opts).length ? opts : null);
      const newLink = {
        id: res.data.invitationId,
        token: res.data.token,
        link: res.data.link,
        expiresAt: res.data.expiresAt,
        maxUses: res.data.maxUses,
        useCount: res.data.useCount,
        status: 'Pending',
        isExpired: false,
        isMaxedOut: false,
        isActive: true,
        invitedByUsername: '',
        createdAt: new Date().toISOString(),
      };
      setLinks(prev => [newLink, ...prev]);
      setShowNewLink(false);
      setNewLinkOpts({ maxUses: '', expiresAt: '' });
      toast.success('Invite link created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = (link) => {
    const url = `${frontendBase}/invite/${link.token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Copied!'),
      () => toast.error('Copy failed')
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to={`/projects/${projectId}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 w-fit"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to project
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Project Settings</h1>

        {/* General */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">General</h2>

          {/* Project image */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-indigo-50 border border-gray-200 flex-shrink-0">
              {project?.imageUrl ? (
                <img src={`${API_BASE}${project.imageUrl}`} alt="Project" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-300 text-3xl font-bold">
                  {project?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition text-white"
              >
                <CameraIcon className="w-5 h-5" />
              </button>
            </div>
            <div>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                disabled={imageUploading}
              >
                {imageUploading ? 'Uploading…' : 'Change project image'}
              </button>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, GIF or WebP, max 5MB. Optional.</p>
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Project Name"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} size="sm">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </section>

        {/* Invite Links */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Invite Links</h2>
            <Button size="sm" variant="outline" onClick={() => setShowNewLink(v => !v)}>
              <PlusIcon className="w-4 h-4" />
              New Link
            </Button>
          </div>

          {/* New link form */}
          {showNewLink && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-600">Create invite link</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Max uses (leave blank = unlimited)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={newLinkOpts.maxUses}
                    onChange={(e) => setNewLinkOpts(o => ({ ...o, maxUses: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Expires at (leave blank = no expiry)</label>
                  <input
                    type="datetime-local"
                    value={newLinkOpts.expiresAt}
                    onChange={(e) => setNewLinkOpts(o => ({ ...o, expiresAt: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowNewLink(false)}>Cancel</Button>
                <Button size="sm" onClick={handleGenerateLink} disabled={generatingLink}>
                  <LinkIcon className="w-4 h-4" />
                  {generatingLink ? 'Creating…' : 'Create Link'}
                </Button>
              </div>
            </div>
          )}

          {linksLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No invite links yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {links.map(link => {
                const status = linkStatus(link);
                const url = `${frontendBase}/invite/${link.token}`;
                return (
                  <div key={link.id} className="py-3 flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-600 truncate max-w-[180px]">{url}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span>{link.useCount}{link.maxUses ? `/${link.maxUses}` : ''} uses</span>
                        <span>Expires: {formatExpiry(link.expiresAt)}</span>
                      </div>
                    </div>
                    <button onClick={() => copyLink(link)} className="p-1 text-gray-400 hover:text-indigo-600 transition" title="Copy link">
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteLink(link.id)} className="p-1 text-gray-400 hover:text-red-500 transition" title="Delete link">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="bg-white rounded-xl border border-red-200 p-6 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">Deleting a project is permanent and cannot be undone.</p>
          <Button
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={async () => {
              if (!window.confirm(`Delete "${project?.name}"? This cannot be undone.`)) return;
              try {
                const { deleteProject } = await import('../api/projectsApi');
                await deleteProject(projectId);
                toast.success('Project deleted');
                navigate('/projects');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to delete');
              }
            }}
          >
            Delete Project
          </Button>
        </section>
      </div>
    </div>
  );
}
