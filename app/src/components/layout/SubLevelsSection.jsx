import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  Home,
  Calendar,
  Users,
  Clipboard,
  FileText
} from 'lucide-react';

// Collapsible category for sub-levels
function SubLevelCategory({ level, isActive, onSelect, children }) {
  const [isOpen, setIsOpen] = useState(isActive);
  const { userProfile } = useAuth();

  const canEdit = userProfile?.roles?.includes('Head Coach') ||
    (level.staffPermissions || []).includes(userProfile?.id);

  const Icon = canEdit ? Edit3 : Eye;

  return (
    <div className="mb-1">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onSelect();
        }}
        className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm font-semibold rounded-md transition-colors ${
          isActive
            ? 'text-sky-400 bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <Icon size={14} />
        <span className="flex-1 uppercase">{level.name}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// Navigation item for sub-level tools
function SubLevelNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 pl-6 py-1.5 text-xs rounded-md transition-colors ${
          isActive
            ? 'text-sky-400 bg-sky-500/10'
            : 'text-slate-400/85 hover:text-slate-200 hover:bg-slate-800/30'
        }`
      }
    >
      <Icon size={13} />
      <span>{label}</span>
    </NavLink>
  );
}

// Nested collapsible for practice plans per week
function PracticePlansCollapsible({ levelId, weeks }) {
  const [isOpen, setIsOpen] = useState(false);

  if (weeks.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 pl-6 py-1.5 text-left text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 rounded-md"
      >
        <Clipboard size={12} />
        <span className="flex-1">Practice Planner</span>
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {isOpen && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {weeks.map(week => (
            <NavLink
              key={week.id}
              to={`/sublevel/${levelId}/practice/${week.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2 pl-6 py-1 text-[0.7rem] rounded transition-colors ${
                  isActive
                    ? 'text-sky-400 bg-sky-500/10'
                    : 'text-slate-400/75 hover:text-slate-300 hover:bg-slate-800/20'
                }`
              }
            >
              <FileText size={11} />
              <span className="truncate">
                {week.name}{week.opponent ? ` - ${week.opponent}` : ''}
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubLevelsSection() {
  const { programLevels, weeks, activeLevelId, setActiveLevelId } = useSchool();

  // Filter and sort season weeks for practice plans
  const seasonWeeks = weeks
    .filter(w =>
      (w.name.startsWith("Week ") && !w.name.includes("Summer") && w.name !== "Week 0") ||
      w.name === "First Week with No Game" ||
      ["Family Week", "Camp Week", "First Week of Practice", "Week 0"].includes(w.name)
    )
    .sort((a, b) => {
      const getNum = (item) => {
        if (item.weekNum !== undefined) return item.weekNum;
        const match = item.name.match(/Week (\d+)/);
        return match ? parseInt(match[1]) : -1;
      };
      return getNum(a) - getNum(b);
    });

  if (programLevels.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <span className="px-4 text-xs text-slate-500 uppercase tracking-wide block mb-2">
        Sub-Levels
      </span>
      <div className="flex flex-col gap-0.5">
        {programLevels.map(level => (
          <SubLevelCategory
            key={level.id}
            level={level}
            isActive={activeLevelId === level.id}
            onSelect={() => setActiveLevelId(level.id)}
          >
            <SubLevelNavItem
              to={`/sublevel/${level.id}`}
              icon={Home}
              label="Overview"
            />
            <SubLevelNavItem
              to={`/sublevel/${level.id}/schedule`}
              icon={Calendar}
              label="Game Schedule"
            />
            {level.enabledTools?.depthChart && (
              <SubLevelNavItem
                to={`/sublevel/${level.id}/depth`}
                icon={Users}
                label="Depth Chart"
              />
            )}
            <PracticePlansCollapsible
              levelId={level.id}
              weeks={seasonWeeks}
            />
          </SubLevelCategory>
        ))}
      </div>
    </div>
  );
}
