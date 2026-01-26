import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, CheckCircle, Clock, Circle } from 'lucide-react';

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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Construction size={48} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Development Roadmap</h1>
        <p className="text-slate-400">
          Features being ported to the new architecture
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
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
