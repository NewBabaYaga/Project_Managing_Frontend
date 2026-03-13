import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardDocumentCheckIcon, UserGroupIcon,
  ChartBarIcon, ShieldCheckIcon, ArrowRightIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: ClipboardDocumentCheckIcon,
    title: 'Kanban Task Board',
    description: 'Visual task management with To Do, In Progress, Submitted, and Done columns.',
  },
  {
    icon: UserGroupIcon,
    title: 'Role-Based Access',
    description: 'Admins, Managers, and Developers each have clearly defined permissions.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Review & Approval Flow',
    description: 'Managers review submitted tasks and provide feedback before approving.',
  },
  {
    icon: ChartBarIcon,
    title: 'Contribution Ranking',
    description: 'Developers earn points for approved tasks and compete on the leaderboard.',
  },
];

export default function LandingPage() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <span className="font-bold text-indigo-600 text-lg">TaskFlow</span>
          <div className="flex items-center gap-3">
            {token ? (
              <Link
                to="/projects"
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Go to App <ArrowRightIcon className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Project Management Made Simple
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Collaborate, track, and <span className="text-indigo-600">ship faster</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          TaskFlow helps teams manage projects with role-based access, a visual Kanban board,
          built-in review workflows, and a contribution leaderboard to keep everyone motivated.
        </p>
        <div className="flex justify-center gap-3">
          {token ? (
            <Link
              to="/projects"
              className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition text-sm"
            >
              Open your projects <ArrowRightIcon className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition text-sm"
              >
                Start for free <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition text-sm"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Everything your team needs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
        <p className="text-gray-500 mb-6 text-sm">Create an account and spin up your first project in minutes.</p>
        <Link
          to={token ? '/projects' : '/register'}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-indigo-700 transition"
        >
          {token ? 'Go to dashboard' : 'Create free account'} <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        TaskFlow — Project Management App
      </footer>
    </div>
  );
}
