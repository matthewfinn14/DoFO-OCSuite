import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import SubLevelsSection from './SubLevelsSection';
import {
  Target,
  Settings,
  Book,
  Printer,
  LayoutTemplate,
  Users,
  UserCog,
  Lock,
  Archive,
  ChevronDown,
  ChevronRight,
  FileText,
  FileBarChart,
  Megaphone,
  Layers,
  Clipboard,
  Watch,
  Clock,
  TrendingUp,
  Calendar,
  Lightbulb,
  UserPlus,
  BarChart3,
  ClipboardCheck,
  Star,
  Trophy
} from 'lucide-react';

// Enhanced collapsible category component
function CollapsibleCategory({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  nested = false,
  onTitleClick
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (onTitleClick) {
      onTitleClick();
    }
  };

  return (
    <div className={nested ? 'ml-2' : ''}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold rounded transition-colors ${
          nested
            ? 'text-slate-400/90 hover:text-slate-200 hover:bg-slate-800/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <Icon size={14} />
        <span className="flex-1">{title}</span>
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {isOpen && (
        <div className={nested ? 'ml-2 mt-0.5' : 'ml-3 mt-0.5 space-y-0.5'}>
          {children}
        </div>
      )}
    </div>
  );
}

// Weekly tool navigation item
function WeeklyToolItem({ to, icon: Icon, label, isLight = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
          isActive
            ? 'text-sky-500 bg-sky-500/10'
            : isLight
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
        }`
      }
    >
      <Icon size={14} />
      <span>{label}</span>
    </NavLink>
  );
}

// Navigation item component
function NavItem({ to, icon: Icon, label, collapsed, isLight = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          isActive
            ? 'bg-sky-500/20 text-sky-400 border-l-2 border-sky-400'
            : isLight
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        } ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      <Icon size={14} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { currentPermissions, isSiteAdmin } = useAuth();
  const { school, weeks, currentWeekId, visibleFeatures, setCurrentWeekId, settings, setupConfig } = useSchool();
  const navigate = useNavigate();

  // Persist collapse state to localStorage
  const [collapsed, setCollapsed] = useLocalStorage('dofo_sidebar_collapsed', false);

  // Get current week - check if it's offseason
  const currentWeek = weeks.find(w => w.id === currentWeekId);

  // Get season phases from setupConfig to check phase properties
  const seasonPhases = setupConfig?.seasonPhases || [];
  const currentPhase = currentWeek?.phaseId ? seasonPhases.find(p => p.id === currentWeek.phaseId) : null;

  const isOffseasonWeek = currentWeekId === 'offseason' ||
    currentWeek?.isOffseason ||
    currentWeek?.name === 'Offseason' ||
    currentWeek?.name?.toLowerCase() === 'offseason' ||
    currentWeek?.phaseId === 'offseason' ||
    currentPhase?.isOffseason ||
    currentPhase?.id === 'offseason';

  // Get theme from settings
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  return (
    <aside
      className={`flex flex-col transition-all duration-200 print:hidden ${
        collapsed ? 'w-16' : 'w-64'
      } ${
        isLight
          ? 'bg-white border-r border-gray-200'
          : 'bg-slate-900 border-r border-slate-800'
      }`}
    >
      {/* Header with logo, school info, switcher */}
      <SidebarHeader
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        theme={theme}
      />

      {/* Fixed Core Navigation */}
      <div className={`px-2 py-1 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-slate-800'}`}>
        <div className="space-y-0.5">
          {currentPermissions.dashboard.view && (
            <NavItem to="/dashboard" icon={Target} label="PROGRAM ALIGNMENT" collapsed={collapsed} isLight={isLight} />
          )}
          {visibleFeatures.gameWeek?.enabled && visibleFeatures.gameWeek?.items?.schemeSetup && (
            <NavItem to="/setup" icon={Settings} label="SYSTEM SETUP" collapsed={collapsed} isLight={isLight} />
          )}
          {visibleFeatures.gameWeek?.enabled && visibleFeatures.gameWeek?.items?.playbook && (
            <NavItem to="/playbook" icon={Book} label="MASTER PLAYBOOK" collapsed={collapsed} isLight={isLight} />
          )}
          {currentPermissions.dashboard.view && (
            <NavItem to="/print" icon={Printer} label="PRINT CENTER" collapsed={collapsed} isLight={isLight} />
          )}
          {currentPermissions.dashboard.view && (
            <NavItem to="/templates" icon={LayoutTemplate} label="TEMPLATES" collapsed={collapsed} isLight={isLight} />
          )}
        </div>

        {!collapsed && currentPermissions.staff.view && (
          <NavItem to="/staff" icon={Users} label="STAFF & ROSTER" collapsed={collapsed} isLight={isLight} />
        )}
      </div>

      {/* Scrollable Weekly Tools Section */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {!collapsed && (
          <>
            {/* Offseason Tools - shown when offseason is selected */}
            {currentWeekId && isOffseasonWeek && (
              <>
                <div className="mb-1">
                  <span className={`px-2 text-[0.65rem] uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    Offseason Tools
                  </span>
                </div>

                <div className="space-y-0.5">
                  <WeeklyToolItem
                    to={`/offseason/swot`}
                    icon={BarChart3}
                    label="SWOT Analysis"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/offseason/goals`}
                    icon={Target}
                    label="Program Goals"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/offseason/schemes`}
                    icon={Lightbulb}
                    label="Scheme Development"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/offseason/recruiting`}
                    icon={UserPlus}
                    label="Recruiting Plan"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/offseason/calendar`}
                    icon={Calendar}
                    label="Annual Calendar"
                    isLight={isLight}
                  />
                </div>
              </>
            )}

            {/* Weekly Tools - shown when a regular week is selected */}
            {currentWeekId && !isOffseasonWeek && (
              <>
                <div className="mb-1">
                  <span className={`px-2 text-[0.65rem] uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    Weekly Tools
                  </span>
                </div>

                <div className="space-y-0.5">
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/notes`}
                    icon={FileText}
                    label="Meeting Notes"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/depth-charts`}
                    icon={Users}
                    label="Depth Chart"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/install`}
                    icon={Layers}
                    label="Install Manager"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/practice`}
                    icon={Megaphone}
                    label="Practice Planner"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/practice?view=script`}
                    icon={FileText}
                    label="Practice Scripts"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/practice-review`}
                    icon={Star}
                    label="Practice Review"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/wristband`}
                    icon={Watch}
                    label="Wristband Builder"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/game-plan`}
                    icon={Clipboard}
                    label="Game Plan/Call Sheet"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/pregame`}
                    icon={Clock}
                    label="Pre-Game Timeline"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/postgame-review`}
                    icon={Trophy}
                    label="Postgame Review"
                    isLight={isLight}
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/quality-control`}
                    icon={ClipboardCheck}
                    label="X&O Quality Control"
                    isLight={isLight}
                  />
                </div>
              </>
            )}

            {/* Prompt to select week if none selected */}
            {!currentWeekId && weeks.length > 0 && (
              <div className="px-2 py-2 text-center">
                <p className={`text-[0.65rem] ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Select a week above to see weekly tools
                </p>
              </div>
            )}

            {!currentWeekId && weeks.length === 0 && (
              <div className="px-2 py-2 text-center">
                <p className={`text-[0.65rem] ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Add weeks in Season Setup
                </p>
              </div>
            )}

            {/* Sub-Levels Section */}
            <SubLevelsSection />
          </>
        )}
      </nav>

      {/* Footer with settings, admin, help, logout */}
      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
}
