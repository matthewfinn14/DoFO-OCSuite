import { NavLink } from 'react-router-dom';
import {
  Target,
  Calendar,
  FileText,
  FileBarChart,
  Megaphone,
  Layers,
  Users,
  Search,
  Clipboard,
  Watch,
  Clock,
  ClipboardCheck,
  Star,
  Trophy,
  Route
} from 'lucide-react';

// Navigation item for weekly tools
function ToolNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 pl-10 py-1.5 text-xs transition-colors ${
          isActive
            ? 'text-sky-400 bg-sky-500/10'
            : 'text-slate-400/85 hover:text-slate-200 hover:bg-slate-800/30'
        }`
      }
    >
      <Icon size={12} />
      <span>{label}</span>
    </NavLink>
  );
}

// Offseason menu items
const OFFSEASON_MENU = [
  { to: '/offseason/reports', icon: FileBarChart, label: 'End of Season Reports' },
  { to: '/offseason/swot', icon: Target, label: 'SWOT Analysis' },
  { to: '/offseason/meetings', icon: Calendar, label: 'Meeting Schedule' },
  { to: (weekId) => `/week/${weekId}/notes`, icon: FileText, label: 'Offseason Notes', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/practice`, icon: Megaphone, label: 'Improving Practice', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/install`, icon: Layers, label: 'Concepts to Add', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/depth-charts`, icon: Users, label: 'Offseason Depth Charts', usesWeekId: true },
  { to: '/offseason/research', icon: Search, label: 'Offseason Research' },
];

// Season menu items - toolId matches the visibility config in Setup.jsx
const SEASON_MENU = [
  { toolId: 'workflow', to: (weekId) => `/week/${weekId}/workflow`, icon: Route, label: 'Weekly Workflow', usesWeekId: true, defaultVisible: true },
  { toolId: 'notes', to: (weekId) => `/week/${weekId}/notes`, icon: FileText, label: 'Meeting Notes', usesWeekId: true, defaultVisible: true },
  { toolId: 'depth-charts', to: (weekId) => `/week/${weekId}/depth-charts`, icon: Users, label: 'Depth Chart', usesWeekId: true, defaultVisible: true },
  { toolId: 'install', to: (weekId) => `/week/${weekId}/install`, icon: Layers, label: 'Priority Plays', usesWeekId: true, defaultVisible: true },
  { toolId: 'practice', to: (weekId) => `/week/${weekId}/practice`, icon: Megaphone, label: 'Practice Planner', usesWeekId: true, defaultVisible: true },
  { toolId: 'practice-scripts', to: (weekId) => `/week/${weekId}/practice?view=script`, icon: FileText, label: 'Practice Scripts', usesWeekId: true, defaultVisible: true },
  { toolId: 'practice-review', to: (weekId) => `/week/${weekId}/practice-review`, icon: Star, label: 'Practice Review', usesWeekId: true, defaultVisible: true },
  { toolId: 'wristband', to: (weekId) => `/week/${weekId}/wristband`, icon: Watch, label: 'Wristband Builder', usesWeekId: true, defaultVisible: true },
  { toolId: 'game-plan', to: (weekId) => `/week/${weekId}/game-plan`, icon: Clipboard, label: 'Game Plan/Call Sheet', usesWeekId: true, defaultVisible: true },
  { toolId: 'pregame', to: (weekId) => `/week/${weekId}/pregame`, icon: Clock, label: 'Pre-Game Timeline', usesWeekId: true, defaultVisible: true },
  { toolId: 'postgame-review', to: (weekId) => `/week/${weekId}/postgame-review`, icon: Trophy, label: 'Postgame Review', usesWeekId: true, defaultVisible: true },
  { toolId: 'quality-control', to: (weekId) => `/week/${weekId}/quality-control`, icon: ClipboardCheck, label: 'X&O Quality Control', usesWeekId: true, defaultVisible: false },
];

export default function WeeklyToolsMenu({ weekId, isOffseason = false, visibleWeeklyTools = {} }) {
  const baseMenuItems = isOffseason ? OFFSEASON_MENU : SEASON_MENU;

  // Filter menu items based on visibility settings (only for season menu)
  const menuItems = isOffseason
    ? baseMenuItems
    : baseMenuItems.filter(item => {
        // Check if visibility is explicitly set, otherwise use default
        if (item.toolId && visibleWeeklyTools[item.toolId] !== undefined) {
          return visibleWeeklyTools[item.toolId];
        }
        // Use item's default visibility (defaults to true if not specified)
        return item.defaultVisible !== false;
      });

  return (
    <div className="flex flex-col gap-0.5 py-1 pb-2">
      {menuItems.map((item, index) => (
        <ToolNavItem
          key={item.toolId || index}
          to={item.usesWeekId ? item.to(weekId) : item.to}
          icon={item.icon}
          label={item.label}
        />
      ))}
    </div>
  );
}
