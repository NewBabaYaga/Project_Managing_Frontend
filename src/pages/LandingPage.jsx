import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardDocumentCheckIcon, UserGroupIcon,
  ChartBarIcon, ShieldCheckIcon, ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const steps = [
  {
    number: '01',
    title: 'Create & invite',
    description: 'Start a project in seconds and invite teammates as Admin, Manager, or Developer.',
    icon: UserGroupIcon,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    number: '02',
    title: 'Assign & track',
    description: 'Break work into tasks, set difficulty levels, and move them across the Kanban board.',
    icon: ClipboardDocumentCheckIcon,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    number: '03',
    title: 'Review & rank',
    description: 'Managers approve submitted work. Developers earn points and compete on the leaderboard.',
    icon: ChartBarIcon,
    color: 'bg-emerald-50 text-emerald-600',
  },
];

const features = [
  {
    icon: ClipboardDocumentCheckIcon,
    title: 'Kanban Task Board',
    description: 'Visual task management with To Do, In Progress, Submitted, and Approved columns.',
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

const mockTasks = [
  { title: 'Design landing page', difficulty: 'Hard', diffColor: 'bg-red-100 text-red-700', status: 'In Progress' },
  { title: 'Set up CI pipeline', difficulty: 'Medium', diffColor: 'bg-yellow-100 text-yellow-700', status: 'In Progress' },
  { title: 'Write API docs', difficulty: 'Easy', diffColor: 'bg-green-100 text-green-700', status: 'In Progress' },
];

function AppMockup() {
  return (
    <div className="relative">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden select-none">
        {/* Browser chrome */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-md h-5 border border-gray-200" />
        </div>

        {/* App navbar */}
        <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
          <span className="font-bold text-indigo-600 text-sm">TaskFlow</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-100" />
            <div className="w-14 h-4 rounded bg-gray-100" />
          </div>
        </div>

        {/* Dashboard header */}
        <div className="bg-gray-50 px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="w-32 h-4 bg-gray-800 rounded opacity-80 mb-1" />
              <div className="w-20 h-3 bg-gray-300 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-7 bg-indigo-600 rounded-lg opacity-80" />
            </div>
          </div>

          {/* Kanban tabs */}
          <div className="flex gap-5 border-b border-gray-200 -mx-4 px-4">
            {['To Do', 'In Progress', 'Submitted', 'Approved'].map((tab, i) => (
              <div
                key={tab}
                className={`text-[11px] font-semibold pb-2 border-b-2 ${
                  i === 1
                    ? 'text-blue-600 border-blue-500'
                    : 'text-gray-400 border-transparent'
                }`}
              >
                {tab} {i === 1 ? <span className="ml-0.5 text-blue-500">3</span> : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Task cards */}
        <div className="bg-gray-50 px-4 pb-4 pt-3 flex flex-col gap-2">
          {mockTasks.map((task) => (
            <div key={task.title} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{task.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Assigned to you</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${task.diffColor}`}>
                {task.difficulty}
              </span>
              <div className="w-14 h-5 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-indigo-600 font-medium">Submit</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar at bottom */}
        <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex items-center gap-4">
          {[
            { label: 'Tasks', value: '12' },
            { label: 'Approved', value: '7' },
            { label: 'Points', value: '23' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-800">{s.value}</span>
              <span className="text-[10px] text-gray-400">{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-gray-400">Live</span>
          </div>
        </div>
      </div>

      {/* Floating rank badge */}
      <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <div>
          <p className="text-[11px] font-bold text-gray-800">alex_dev</p>
          <p className="text-[10px] text-gray-500">28 pts · Rank #1</p>
        </div>
      </div>

      {/* Floating approval badge */}
      <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-xl shadow-lg px-3 py-1.5 flex items-center gap-1.5">
        <CheckCircleIcon className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold">Task Approved!</span>
      </div>

      {/* Decorative blurs */}
      <div className="absolute -z-10 -bottom-8 -right-8 w-56 h-56 bg-indigo-200 rounded-full blur-3xl opacity-25" />
      <div className="absolute -z-10 -top-8 -left-8 w-40 h-40 bg-violet-200 rounded-full blur-3xl opacity-20" />
    </div>
  );
}

export default function LandingPage() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
              <img src="/logo_transparent.png" alt="TaskFlow" className="h-8 w-8 object-contain" />
              <span className="font-bold text-indigo-600 text-lg">TaskFlow</span>
            </div>
          <div className="flex items-center gap-3">
            {token ? (
              <Link
                to="/projects"
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Go to App <ArrowRightIcon className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero — two-column layout */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Project Management Made Simple
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
              Collaborate, track,<br />and{' '}
              <span className="text-indigo-600">ship faster</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              TaskFlow helps teams manage projects with role-based access, a visual Kanban board,
              built-in review workflows, and a contribution leaderboard to keep everyone motivated.
            </p>
            <div className="flex flex-wrap gap-3">
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
            <p className="text-xs text-gray-400 mt-4">Free to use · No credit card required</p>
          </div>

          {/* Right: app mockup */}
          <div className="hidden lg:block">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">From idea to done in three steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-start">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gray-200 -translate-x-4 z-0" />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative z-10 ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-300 mb-1 tracking-widest">{step.number}</span>
                <h3 className="font-semibold text-gray-900 mb-2 text-base">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">Features</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything your team needs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8 text-sm">Create an account and spin up your first project in minutes.</p>
          <Link
            to={token ? '/projects' : '/register'}
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition"
          >
            {token ? 'Go to dashboard' : 'Create free account'} <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        TaskFlow — Project Management App
      </footer>
    </div>
  );
}
