import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, CheckCircle, Clock, Circle, Target } from 'lucide-react';

// Product Development Phases
const PRODUCT_PHASES = [
  {
    phase: 1,
    title: 'OC Suite',
    subtitle: 'Offensive Coordinator Tools',
    status: 'in-progress',
    features: [
      'Master Playbook Management',
      'Game Planning & Play Calling',
      'Wristband Builder',
      'Practice Script Generator',
      'Install Manager',
      'Formation & Personnel Management'
    ]
  },
  {
    phase: 2,
    title: 'HC Suite',
    subtitle: 'Head Coach Tools',
    status: 'planned',
    features: [
      'Program-Wide Dashboard',
      'Staff Management & Permissions',
      'Multi-Level Program Support (Varsity, JV, Freshman)',
      'Season Calendar & Scheduling',
      'Meeting & Practice Planning',
      'Player Development Tracking'
    ]
  },
  {
    phase: 3,
    title: 'Program Suite',
    subtitle: 'Full Program Management',
    status: 'planned',
    features: [
      'Recruiting Pipeline',
      'Off-Season Workout Tracking',
      'Video Integration',
      'Analytics Dashboard',
      'Mobile App (iOS/Android)',
      'Parent & Player Portals'
    ]
  }
];

// Technical Development Items
const ROADMAP_ITEMS = [
  { status: 'done', label: 'Core Authentication & User Management' },
  { status: 'done', label: 'School Setup & Configuration' },
  { status: 'done', label: 'Master Playbook Management' },
  { status: 'done', label: 'Basic Sidebar Navigation' },
  { status: 'in-progress', label: 'Advanced Sidebar with Weekly Tools' },
  { status: 'in-progress', label: 'Program Levels (JV, Freshman, etc.)' },
  { status: 'planned', label: 'Game Planning Tools' },
  { status: 'planned', label: 'Wristband Builder' },
  { status: 'planned', label: 'Practice Script Generator' },
  { status: 'planned', label: 'Depth Chart Management' },
  { status: 'planned', label: 'Pre-Game Timeline' },
  { status: 'planned', label: 'Mobile App (iOS/Android)' },
  { status: 'planned', label: 'Video Integration' },
  { status: 'planned', label: 'Analytics Dashboard' },
];

function StatusIcon({ status }) {
  switch (status) {
    case 'done':
      return <CheckCircle size={18} className="text-emerald-400" />;
    case 'in-progress':
      return <Clock size={18} className="text-amber-400" />;
    default:
      return <Circle size={18} className="text-slate-500" />;
  }
}

export default function Roadmap() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Construction size={48} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Product Roadmap</h1>
        <p className="text-slate-400">
          Building the complete football program management platform
        </p>
      </div>

      {/* Product Phases */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {PRODUCT_PHASES.map((phase) => (
          <div
            key={phase.phase}
            className={`rounded-xl p-5 border ${
              phase.status === 'in-progress'
                ? 'bg-sky-500/10 border-sky-500/50'
                : 'bg-slate-800/50 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                phase.status === 'in-progress'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                PHASE {phase.phase}
              </span>
              {phase.status === 'in-progress' && (
                <span className="text-xs text-sky-400">Current</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{phase.title}</h3>
            <p className="text-sm text-slate-400 mb-4">{phase.subtitle}</p>
            <ul className="space-y-2">
              {phase.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Target size={14} className={`mt-0.5 flex-shrink-0 ${
                    phase.status === 'in-progress' ? 'text-sky-400' : 'text-slate-600'
                  }`} />
                  <span className={phase.status === 'in-progress' ? 'text-slate-300' : 'text-slate-500'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Technical Progress */}
      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Development Progress</h2>
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-slate-400">Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-slate-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle size={16} className="text-slate-500" />
            <span className="text-slate-400">Planned</span>
          </div>
        </div>

        <ul className="space-y-3">
          {ROADMAP_ITEMS.map((item, index) => (
            <li key={index} className="flex items-center gap-3">
              <StatusIcon status={item.status} />
              <span className={`${
                item.status === 'done'
                  ? 'text-slate-400 line-through'
                  : item.status === 'in-progress'
                    ? 'text-white'
                    : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
