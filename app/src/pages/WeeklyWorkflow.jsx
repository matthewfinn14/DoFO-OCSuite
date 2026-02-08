import { Link, useParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Calendar,
  ArrowRight,
  Layers,
  Users,
  Clipboard,
  Megaphone,
  FileText,
  Watch,
  Printer,
  Clock,
  Trophy,
  CheckCircle2,
  Lightbulb,
  Info,
  Settings
} from 'lucide-react';

// Day-by-day workflow
const WEEKLY_TIMELINE = [
  {
    day: 'Saturday',
    focus: 'Film Review & Initial Planning',
    description: 'Review Friday\'s game, identify what worked and what needs adjustment. Begin building next week\'s install.',
    tools: [
      { name: 'Postgame Review', icon: Trophy, path: 'postgame-review' },
      { name: 'Priority Plays', icon: Layers, path: 'install' }
    ],
    color: 'bg-purple-500'
  },
  {
    day: 'Sunday',
    focus: 'Personnel & Game Plan',
    description: 'Update depth charts based on Saturday\'s film. Finalize priority plays and begin building the call sheet for this week\'s opponent.',
    tools: [
      { name: 'Depth Chart', icon: Users, path: 'depth-charts' },
      { name: 'Priority Plays', icon: Layers, path: 'install' },
      { name: 'Game Plan/Call Sheet', icon: Clipboard, path: 'game-plan' }
    ],
    color: 'bg-blue-500'
  },
  {
    day: 'Monday',
    focus: 'Practice Planning',
    description: 'Build out practice plans and scripts for the week. Pull plays from your install list or call sheet sections.',
    tools: [
      { name: 'Practice Planner', icon: Megaphone, path: 'practice' },
      { name: 'Practice Scripts', icon: FileText, path: 'practice?view=script' }
    ],
    color: 'bg-green-500'
  },
  {
    day: 'Tuesday',
    focus: 'Practice & Adjustments',
    description: 'Execute practice plan. Review rep counts and make adjustments for Wednesday.',
    tools: [
      { name: 'Practice Scripts', icon: FileText, path: 'practice?view=script' }
    ],
    color: 'bg-yellow-500'
  },
  {
    day: 'Wednesday',
    focus: 'Situational Work',
    description: 'Focus on situational reps. Check that key plays are getting adequate practice time.',
    tools: [
      { name: 'Practice Scripts', icon: FileText, path: 'practice?view=script' },
      { name: 'Game Plan/Call Sheet', icon: Clipboard, path: 'game-plan' }
    ],
    color: 'bg-orange-500'
  },
  {
    day: 'Thursday',
    focus: 'Finalize & Prepare',
    description: 'Lock in your call sheet. Build wristband cards and prepare materials for Friday.',
    tools: [
      { name: 'Game Plan/Call Sheet', icon: Clipboard, path: 'game-plan' },
      { name: 'Wristband Builder', icon: Watch, path: 'wristband' },
      { name: 'Print Center', icon: Printer, path: '/print', absolute: true }
    ],
    color: 'bg-red-500'
  },
  {
    day: 'Friday',
    focus: 'Game Day Prep',
    description: 'Print and distribute materials. Run through pre-game timeline. Execute!',
    tools: [
      { name: 'Print Center', icon: Printer, path: '/print', absolute: true },
      { name: 'Pre-Game Timeline', icon: Clock, path: 'pregame' }
    ],
    color: 'bg-sky-500'
  }
];

// Workflow options
const WORKFLOW_OPTIONS = [
  {
    title: 'Install-First Approach',
    recommended: true,
    description: 'Best for teams with significant weekly installs (15+ new plays)',
    steps: [
      'Build install list Saturday/Sunday with new plays and priorities',
      'Practice scripts pull from install list for reps',
      'Plays graduate to call sheet as they become "game ready"',
      'Call sheet reflects what you\'re confident calling Friday'
    ]
  },
  {
    title: 'Call Sheet-First Approach',
    recommended: false,
    description: 'Best for experienced teams with smaller weekly adjustments',
    steps: [
      'Build/adjust call sheet sections directly',
      'Practice scripts pull from call sheet for reps',
      'Skip Priority Plays - go straight to game plan',
      'Simpler workflow, fewer steps'
    ]
  },
  {
    title: 'Hybrid Approach',
    recommended: false,
    description: 'Maximum flexibility for evolving game plans',
    steps: [
      'Use Priority Plays early week for "what we need to rep"',
      'Transition mid-week to call sheet focus',
      'Install list = practice priority, Call sheet = game day calls',
      'Best of both worlds'
    ]
  }
];

// Quick tips
const QUICK_TIPS = [
  {
    icon: Info,
    tip: 'Your call sheet structure imports from the previous week - you don\'t need to rebuild it. Just review what carried over and adjust plays for this week\'s opponent.'
  },
  {
    icon: CheckCircle2,
    tip: 'Check your rep totals before Friday - plays that haven\'t been practiced enough are risky to call in the game.'
  },
  {
    icon: Watch,
    tip: 'If you make changes to wristband cards after printing, update the iteration number so players know they have the latest version.'
  },
  {
    icon: Printer,
    tip: 'Print a test wristband early in the week to catch any formatting issues before game day.'
  },
  {
    icon: Lightbulb,
    tip: 'Start simple - you don\'t have to use every tool. Many teams start with just the Call Sheet and add tools as needed.'
  },
  {
    icon: Settings,
    tip: 'You can hide tools you don\'t use from the sidebar in System Setup → Weekly Tools to keep your view focused.',
    link: '/setup/weekly-tools',
    linkText: 'Manage Tools'
  }
];

export default function WeeklyWorkflow() {
  const { weekId } = useParams();
  const { currentWeekId, settings, school } = useSchool();

  // Use URL weekId or fall back to current week
  const activeWeekId = weekId || currentWeekId;

  // Get theme
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  const getToolPath = (tool) => {
    if (tool.absolute) return tool.path;
    return activeWeekId ? `/week/${activeWeekId}/${tool.path}` : `/${tool.path}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isLight ? 'bg-sky-100' : 'bg-sky-500/20'}`}>
            <Calendar size={24} className={isLight ? 'text-sky-600' : 'text-sky-400'} />
          </div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Weekly Workflow Guide</h1>
        </div>
        <p className={`ml-12 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
          A suggested flow for getting the most out of DoFO throughout your game week
        </p>
      </div>

      {/* Intro Card */}
      <div className={`rounded-xl p-6 mb-8 border ${
        isLight
          ? 'bg-sky-50 border-sky-200'
          : 'bg-slate-800 border-slate-700'
      }`}>
        <h2 className={`text-lg font-semibold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>How It All Fits Together</h2>
        <p className={`text-sm leading-relaxed mb-4 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
          We understand that for most teams, game plans evolve as the week goes on. That's why we've built
          tools that work together but don't force you into a rigid process.
        </p>
        <p className={`text-sm leading-relaxed mb-4 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
          The <strong className={isLight ? 'text-sky-600' : 'text-sky-400'}>Priority Plays</strong> page gives you a place to house plays
          that are new or a priority for this week. As the week progresses, you may want to transition
          focus to the <strong className={isLight ? 'text-sky-600' : 'text-sky-400'}>Game Plan/Call Sheet</strong> - organizing plays
          by situation so you're ready to roll on Friday.
        </p>
        <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
          It's also totally fine to skip Priority Plays and work directly in the Call Sheet -
          especially if you're not adding many new plays each week. <strong className={isLight ? 'text-gray-900' : 'text-white'}>Use what works for your staff.</strong>
        </p>
      </div>

      {/* Day-by-Day Timeline */}
      <div className="mb-10">
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          <Calendar size={20} className={isLight ? 'text-sky-600' : 'text-sky-400'} />
          Suggested Daily Flow
        </h2>
        <div className="space-y-3">
          {WEEKLY_TIMELINE.map((day, index) => (
            <div
              key={day.day}
              className={`rounded-lg overflow-hidden border transition-colors ${
                isLight
                  ? 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-stretch">
                {/* Day badge */}
                <div className={`${day.color} w-24 flex-shrink-0 flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{day.day}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`font-medium mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{day.focus}</h3>
                      <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>{day.description}</p>
                    </div>

                    {/* Tool links */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {day.tools.map((tool) => (
                        <Link
                          key={tool.name}
                          to={getToolPath(tool)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            isLight
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                          }`}
                        >
                          <tool.icon size={12} />
                          <span>{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Options */}
      <div className="mb-10">
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          <ArrowRight size={20} className={isLight ? 'text-sky-600' : 'text-sky-400'} />
          Choose Your Workflow
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {WORKFLOW_OPTIONS.map((option) => (
            <div
              key={option.title}
              className={`rounded-lg p-5 border ${
                option.recommended
                  ? isLight
                    ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-200'
                    : 'bg-slate-800 border-sky-500/50 ring-1 ring-sky-500/20'
                  : isLight
                    ? 'bg-white border-gray-200 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{option.title}</h3>
                {option.recommended && (
                  <span className="text-[10px] font-bold bg-sky-500 text-white px-2 py-0.5 rounded-full">
                    RECOMMENDED
                  </span>
                )}
              </div>
              <p className={`text-xs mb-4 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>{option.description}</p>
              <ul className="space-y-2">
                {option.steps.map((step, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          <Lightbulb size={20} className="text-amber-500" />
          Quick Tips
        </h2>
        <div className={`rounded-lg p-5 border ${
          isLight
            ? 'bg-amber-50 border-amber-200'
            : 'bg-slate-800/80 border-slate-700'
        }`}>
          <ul className="space-y-4">
            {QUICK_TIPS.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${isLight ? 'bg-amber-100' : 'bg-amber-500/20'}`}>
                  <item.icon size={14} className="text-amber-500" />
                </div>
                <div className={`text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  {item.tip}
                  {item.link && (
                    <Link
                      to={item.link}
                      className={`ml-2 underline ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}
                    >
                      {item.linkText}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className={`text-center py-6 border-t ${isLight ? 'border-gray-200' : 'border-slate-700/50'}`}>
        <p className={`text-sm mb-4 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
          Ready to get started? Pick up where you left off or start fresh.
        </p>
        <div className="flex justify-center gap-3">
          {activeWeekId && (
            <>
              <Link
                to={`/week/${activeWeekId}/install`}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Layers size={16} />
                Priority Plays
              </Link>
              <Link
                to={`/week/${activeWeekId}/game-plan`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLight
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <Clipboard size={16} />
                Game Plan
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
