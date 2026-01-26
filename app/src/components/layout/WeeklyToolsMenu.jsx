import { NavLink } from 'react-router-dom';
import {
  FileBarChart,
  Target,
  Calendar,
  FileText,
  Megaphone,
  Layers,
  Users,
  Search,
  Clipboard,
  Watch,
  Clock
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

// Season menu items
const SEASON_MENU = [
  { to: (weekId) => `/week/${weekId}/notes`, icon: FileText, label: 'Meeting Notes', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/practice`, icon: Megaphone, label: 'Practice Planner', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/install`, icon: Layers, label: 'Install', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/depth-charts`, icon: Users, label: 'Depth Charts', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/game-plan`, icon: Clipboard, label: 'Game Planner', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/wristband`, icon: Watch, label: 'Wristband Builder', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/practice-scripts`, icon: FileText, label: 'Practice Scripts', usesWeekId: true },
  { to: (weekId) => `/week/${weekId}/pregame`, icon: Clock, label: 'Pre-Game Timeline', usesWeekId: true },
];

export default function WeeklyToolsMenu({ weekId, isOffseason = false }) {
  const menuItems = isOffseason ? OFFSEASON_MENU : SEASON_MENU;

  return (
    <div className="flex flex-col gap-0.5 py-1 pb-2">
      {menuItems.map((item, index) => (
        <ToolNavItem
          key={index}
          to={item.usesWeekId ? item.to(weekId) : item.to}
          icon={item.icon}
          label={item.label}
        />
      ))}
    </div>
  );
}
