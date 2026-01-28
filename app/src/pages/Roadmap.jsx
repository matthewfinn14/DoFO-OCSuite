import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, CheckCircle, Clock, Circle } from 'lucide-react';

// Product Development Phases
const PRODUCT_PHASES = [
  {
    phase: 1,
    title: 'OC Suite',
    subtitle: 'Current Build',
    description: 'The Offensive Coordinator Suite provides comprehensive tools for game planning and play management.',
    status: 'current',
    color: 'emerald',
    features: [
      { name: 'Master Playbook', desc: 'Organize all plays' },
      { name: 'Game Planner', desc: 'Situational call sheets' },
      { name: 'Practice Scripts', desc: 'Daily practice plans' },
      { name: 'Wristband Builder', desc: 'Print play cards' },
      { name: 'Depth Charts', desc: 'Manage rotations' },
      { name: 'Install Manager', desc: 'Weekly installs' },
      { name: 'Program Alignment', desc: 'Mission & philosophy' },
      { name: 'Formation Builder', desc: 'Visual diagrams' },
      { name: 'Program Levels', desc: 'JV/Freshman management' }
    ]
  },
  {
    phase: 2,
    title: 'HC Suite',
    subtitle: 'Coming Next',
    description: 'Head Coach tools for program-wide management and coordination.',
    status: 'next',
    color: 'amber',
    features: [
      { name: 'Inventory Management', desc: 'Equipment tracking' },
      { name: 'Annual Calendar', desc: 'Year-round planning' },
      { name: 'Staff Tasks', desc: 'Assign & track duties' },
      { name: 'Attendance App', desc: 'Track participation' },
      { name: 'Drill Library', desc: 'Practice resources' },
      { name: 'Defense Prep Tools', desc: 'DC game planning suite' },
      { name: 'Special Teams Prep', desc: 'ST coordinator tools' },
      { name: 'Sideline Signal Library', desc: 'Visual signal management' }
    ]
  },
  {
    phase: 3,
    title: 'Field Apps',
    subtitle: 'Coach Tools',
    description: 'Tablet and mobile apps for coaches on the practice field, sideline, and pressbox.',
    status: 'planned',
    color: 'sky',
    features: [
      { name: 'Practice App', desc: 'Field-side practice tools' },
      { name: 'In-Game App', desc: 'Sideline play calling' },
      { name: 'Pressbox Tracker', desc: 'Live game tracking' },
      { name: 'Smart Call Sheet', desc: 'Situational recommendations' },
      { name: 'Play Call Simulator', desc: 'Practice decision-making' }
    ]
  },
  {
    phase: 4,
    title: 'Player App',
    subtitle: 'Final Phase',
    description: 'Mobile app for players to access playbook, track progress, and connect with the program.',
    status: 'planned',
    color: 'purple',
    features: [
      { name: 'Digital Playbook', desc: 'Access plays & formations' },
      { name: 'Install Quizzes', desc: 'Test playbook knowledge' },
      { name: 'Valhalla Points', desc: 'Gamified accountability system' },
      { name: 'Weight Tracking', desc: 'Log daily weigh-ins' },
      { name: 'Testing Records', desc: 'View personal bests' },
      { name: 'Impact Player Rating', desc: 'Performance metrics' },
      { name: 'Depth Chart View', desc: 'See current rotations' },
      { name: 'Cultural Calibration', desc: 'Team culture check-ins' },
      { name: 'Wellness Feedback', desc: 'Daily wellness check-ins' },
      { name: 'Daily Connections', desc: 'Coach-player communication' },
      { name: 'Schedule & Attendance', desc: 'View schedule, check in' }
    ]
  }
];


export default function Roadmap() {
  const getPhaseIcon = (status) => {
    switch (status) {
      case 'current':
        return <CheckCircle size={24} className="text-emerald-400" />;
      case 'next':
        return <Clock size={24} className="text-amber-400" />;
      default:
        return <Circle size={24} className="text-slate-500" />;
    }
  };

  const getPhaseColors = (color) => {
    const colors = {
      emerald: { border: 'border-l-emerald-500', text: 'text-emerald-400', bg: 'bg-slate-800/80' },
      amber: { border: 'border-l-amber-500', text: 'text-amber-400', bg: 'bg-slate-800/60' },
      sky: { border: 'border-l-sky-500', text: 'text-sky-400', bg: 'bg-slate-800/40' },
      purple: { border: 'border-l-purple-500', text: 'text-purple-400', bg: 'bg-slate-800/40' }
    };
    return colors[color] || colors.sky;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Construction size={32} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Under Construction</h1>
        </div>
        <p className="text-slate-400">
          The DoFO Suite is being built in phases. Here's what's available now and what's coming next.
        </p>
      </div>

      {/* Product Phases */}
      <div className="space-y-6">
        {PRODUCT_PHASES.map((phase) => {
          const colors = getPhaseColors(phase.color);
          return (
            <div
              key={phase.phase}
              className={`rounded-xl ${colors.bg} border-l-4 ${colors.border} overflow-hidden`}
            >
              {/* Phase Header */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-1">
                  {getPhaseIcon(phase.status)}
                  <div>
                    <h2 className={`text-xl font-bold ${colors.text}`}>
                      Phase {phase.phase}: {phase.title}
                    </h2>
                    <p className="text-sm text-slate-500">{phase.subtitle}</p>
                  </div>
                </div>
                <p className="text-slate-400 mt-3 ml-9">{phase.description}</p>
              </div>

              {/* Features Grid */}
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-9">
                  {phase.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700/50 rounded-lg p-3"
                    >
                      <div className="font-medium text-slate-200 text-sm">{feature.name}</div>
                      <div className="text-xs text-slate-500">{feature.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
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
