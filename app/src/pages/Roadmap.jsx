import { Link } from 'react-router-dom';
import {
  Construction, ArrowLeft, CheckCircle, Clock, Circle,
  Book, Clipboard, FileText, Grid3X3, Users, Layers, Target, Settings,
  Package, Calendar, CheckSquare, UserCheck, Dumbbell, Shield, Star,
  Tablet, Zap, Monitor, Brain,
  Smartphone, Video, Scale, Activity, Heart, ThermometerSun, MessageCircle, Award
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

// Icon mapping for features
const ICONS = {
  Book, Clipboard, FileText, Grid3X3, Users, Layers, Target, Settings,
  Package, Calendar, CheckSquare, UserCheck, Dumbbell, Shield, Star,
  Tablet, Zap, Monitor, Brain,
  Smartphone, Video, Scale, Activity, Heart, ThermometerSun, MessageCircle, Award
};

// Product Development Phases
const PRODUCT_PHASES = [
  {
    phase: 1,
    title: 'OC Suite',
    subtitle: 'Current Build',
    description: 'The Offensive Coordinator Suite provides comprehensive tools for game planning and play management.',
    status: 'current',
    color: '#22c55e', // emerald-500
    opacity: 1,
    features: [
      { icon: 'Book', name: 'Master Playbook', desc: 'Organize all plays' },
      { icon: 'Clipboard', name: 'Game Planner', desc: 'Situational call sheets' },
      { icon: 'FileText', name: 'Practice Scripts', desc: 'Daily practice plans' },
      { icon: 'Grid3X3', name: 'Wristband Builder', desc: 'Print play cards' },
      { icon: 'Users', name: 'Depth Charts', desc: 'Manage rotations' },
      { icon: 'Layers', name: 'Install Manager', desc: 'Weekly installs' },
      { icon: 'Target', name: 'Program Alignment', desc: 'Mission & philosophy' },
      { icon: 'Settings', name: 'Formation Builder', desc: 'Visual diagrams' },
      { icon: 'Layers', name: 'Program Levels', desc: 'JV/Freshman management' }
    ]
  },
  {
    phase: 2,
    title: 'HC Suite',
    subtitle: 'Coming Next',
    description: 'Head Coach tools for program-wide management and coordination.',
    status: 'next',
    color: '#f59e0b', // amber-500
    opacity: 0.7,
    features: [
      { icon: 'Package', name: 'Inventory Management', desc: 'Equipment tracking' },
      { icon: 'Calendar', name: 'Annual Calendar', desc: 'Year-round planning' },
      { icon: 'CheckSquare', name: 'Staff Tasks', desc: 'Assign & track duties' },
      { icon: 'UserCheck', name: 'Attendance App', desc: 'Track participation' },
      { icon: 'Dumbbell', name: 'Drill Library', desc: 'Practice resources' },
      { icon: 'Shield', name: 'Defense Prep Tools', desc: 'DC game planning suite' },
      { icon: 'Star', name: 'Special Teams Prep', desc: 'ST coordinator tools' },
      { icon: 'MessageCircle', name: 'Sideline Signal Library', desc: 'Visual signal management' }
    ]
  },
  {
    phase: 3,
    title: 'Field Apps',
    subtitle: 'Coach Tools',
    description: 'Tablet and mobile apps for coaches on the practice field, sideline, and pressbox.',
    status: 'planned',
    color: '#3b82f6', // blue-500
    opacity: 0.6,
    features: [
      { icon: 'Clipboard', name: 'Practice App', desc: 'Field-side practice tools' },
      { icon: 'Zap', name: 'In-Game App', desc: 'Sideline play calling' },
      { icon: 'Monitor', name: 'Pressbox Tracker', desc: 'Live game tracking' },
      { icon: 'Brain', name: 'Smart Call Sheet', desc: 'Situational recommendations' },
      { icon: 'Target', name: 'Play Call Simulator', desc: 'Practice decision-making' }
    ]
  },
  {
    phase: 4,
    title: 'Player App',
    subtitle: 'Final Phase',
    description: 'Mobile app for players to access playbook, track progress, and connect with the program.',
    status: 'planned',
    color: '#8b5cf6', // purple-500
    opacity: 0.5,
    features: [
      { icon: 'Book', name: 'Digital Playbook', desc: 'Access plays & formations' },
      { icon: 'CheckSquare', name: 'Install Quizzes', desc: 'Test playbook knowledge' },
      { icon: 'Award', name: 'Valhalla Points', desc: 'Gamified accountability system' },
      { icon: 'Scale', name: 'Weight Tracking', desc: 'Log daily weigh-ins' },
      { icon: 'Activity', name: 'Testing Records', desc: 'View personal bests' },
      { icon: 'Star', name: 'Impact Player Rating', desc: 'Performance metrics' },
      { icon: 'Users', name: 'Depth Chart View', desc: 'See current rotations' },
      { icon: 'Heart', name: 'Cultural Calibration', desc: 'Team culture check-ins' },
      { icon: 'ThermometerSun', name: 'Wellness Feedback', desc: 'Daily wellness check-ins' },
      { icon: 'MessageCircle', name: 'Daily Connections', desc: 'Coach-player communication' },
      { icon: 'Calendar', name: 'Schedule & Attendance', desc: 'View schedule, check in' }
    ]
  }
];


export default function Roadmap() {
  const { school, settings } = useSchool();
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  const getPhaseIcon = (status) => {
    switch (status) {
      case 'current':
        return CheckCircle;
      case 'next':
        return Clock;
      default:
        return Circle;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[900px] mx-auto">
      {/* About DOFO Box */}
      <div
        className={`rounded-xl p-6 mb-6 ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/80'}`}
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #fdf4ff 0%, #faf5ff 50%, #f5f3ff 100%)'
            : 'linear-gradient(135deg, rgba(88, 28, 135, 0.15) 0%, rgba(67, 56, 202, 0.1) 50%, rgba(30, 41, 59, 0.8) 100%)',
          borderLeft: '4px solid #8b5cf6'
        }}
      >
        <h2 className={`text-xl font-bold flex items-center gap-3 mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          <Heart size={24} className="text-purple-500" />
          About DOFO
        </h2>
        <div className={`space-y-4 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
          <p>
            Most football programs don't have a Director of Football Operations.
          </p>
          <p>
            What they have instead is a head coach or coordinator juggling spreadsheets, Google Docs, text threads, playbooks, personnel notes, practice plans, and staff communication (usually late at night, usually alone, and usually with tools that weren't built for football).
          </p>
          <p className="font-medium" style={{ color: isLight ? '#6b21a8' : '#a78bfa' }}>
            DOFO was created out of that reality.
          </p>
          <p>
            After years of piecing together systems that were hard to maintain, hard to share, and hard for an entire staff to actually use... especially those coaches outside the building or coaches who didn't live in spreadsheets... we decided to build something better.
          </p>
          <p>
            DOFO is a planning and execution system designed to organize the operational side of your program so you can spend more time doing what actually matters: coaching football, developing players, and leading your staff.
          </p>
          <p>
            This platform started as a solution to real problems inside a real program, and it will continue to evolve as those needs grow.
          </p>
          <p className="font-semibold" style={{ color: isLight ? '#6b21a8' : '#a78bfa' }}>
            Welcome to DOFO.
          </p>
        </div>
      </div>

      {/* Under Construction Header */}
      <div
        className={`rounded-xl p-6 mb-6 ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/80'}`}
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.5) 100%)',
          borderLeft: '4px solid #f59e0b'
        }}
      >
        <h1 className={`text-2xl font-bold flex items-center gap-3 mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          <Construction size={32} className="text-amber-500" />
          Under Construction
        </h1>
        <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
          The DoFO Suite is being built in phases. Here's what's available now and what's coming next.
        </p>
      </div>

      {/* Product Phases */}
      <div className="space-y-4">
        {PRODUCT_PHASES.map((phase) => {
          const PhaseIcon = getPhaseIcon(phase.status);
          return (
            <div
              key={phase.phase}
              className={`rounded-xl p-6 ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/80'}`}
              style={{ borderLeft: `4px solid ${phase.color}` }}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: phase.color }}
                >
                  <PhaseIcon size={24} color="white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold m-0" style={{ color: phase.color }}>
                    Phase {phase.phase}: {phase.title}
                  </h2>
                  <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    {phase.subtitle}
                  </span>
                </div>
              </div>

              <p className={`mb-4 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                {phase.description}
              </p>

              {/* Features Grid */}
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  opacity: phase.opacity
                }}
              >
                {phase.features.map((feature, idx) => {
                  const FeatureIcon = ICONS[feature.icon] || Circle;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        isLight ? 'bg-gray-100' : 'bg-slate-700/50'
                      }`}
                    >
                      <FeatureIcon size={16} style={{ color: phase.color, flexShrink: 0 }} />
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-slate-200'}`}>
                          {feature.name}
                        </div>
                        <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                          {feature.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLight
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
