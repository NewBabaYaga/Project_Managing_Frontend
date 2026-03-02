import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import ProjectCard from '../components/Projects/ProjectCard';
import CreateProjectModal from '../components/Projects/CreateProjectModal';
import Button from '../components/Shared/Button';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { getProjects } from '../api/projectsApi';
import { PlusIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleProjectCreated = (project) => {
    setProjects(prev => [project, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and collaborate on your projects</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading projects..." />
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpenIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No projects yet</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">Create your first project to get started</p>
            <Button onClick={() => setShowCreate(true)}>
              <PlusIcon className="w-4 h-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
