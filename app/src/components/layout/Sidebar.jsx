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
  Megaphone,
  Layers,
  Clipboard,
  Watch,
  Clock
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
function WeeklyToolItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
          isActive
            ? 'text-sky-400 bg-sky-500/10'
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
function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          isActive
            ? 'bg-sky-500/20 text-sky-400 border-l-2 border-sky-400'
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
  const { school, weeks, currentWeekId, visibleFeatures, setCurrentWeekId } = useSchool();
  const navigate = useNavigate();

  // Persist collapse state to localStorage
  const [collapsed, setCollapsed] = useLocalStorage('dofo_sidebar_collapsed', false);

  // Get current week
  const currentWeek = weeks.find(w => w.id === currentWeekId);
  const isOffseasonWeek = currentWeek?.name === 'Offseason' || currentWeek?.phaseId?.includes('offseason');

  return (
    <aside
      className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with logo, school info, switcher */}
      <SidebarHeader
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        theme={school?.settings?.theme || 'dark'}
      />

      {/* Fixed Core Navigation */}
      <div className="px-2 py-1 border-b border-slate-800 flex-shrink-0">
        <div className="space-y-0.5">
          {currentPermissions.dashboard.view && (
            <NavItem to="/dashboard" icon={Target} label="PROGRAM ALIGNMENT" collapsed={collapsed} />
          )}
          {visibleFeatures.gameWeek?.enabled && visibleFeatures.gameWeek?.items?.schemeSetup && (
            <NavItem to="/setup" icon={Settings} label="SYSTEM SETUP" collapsed={collapsed} />
          )}
          {visibleFeatures.gameWeek?.enabled && visibleFeatures.gameWeek?.items?.playbook && (
            <NavItem to="/playbook" icon={Book} label="MASTER PLAYBOOK" collapsed={collapsed} />
          )}
          {currentPermissions.dashboard.view && (
            <NavItem to="/print" icon={Printer} label="PRINT CENTER" collapsed={collapsed} />
          )}
          {currentPermissions.dashboard.view && (
            <NavItem to="/templates" icon={LayoutTemplate} label="TEMPLATES" collapsed={collapsed} />
          )}
        </div>

        {!collapsed && currentPermissions.staff.view && (
          <NavItem to="/staff" icon={Users} label="STAFF & ROSTER" collapsed={collapsed} />
        )}
      </div>

      {/* Scrollable Weekly Tools Section */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {!collapsed && (
          <>
            {/* Weekly Tools - shown when a week is selected */}
            {currentWeekId && (
              <>
                <div className="mb-1">
                  <span className="px-2 text-[0.65rem] text-slate-500 uppercase tracking-wide">
                    Weekly Tools
                  </span>
                </div>

                <div className="space-y-0.5">
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/notes`}
                    icon={FileText}
                    label="Meeting Notes"
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/practice`}
                    icon={Megaphone}
                    label="Practice Planner"
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/install`}
                    icon={Layers}
                    label="Install Manager"
                  />
                  <WeeklyToolItem
                    to={`/week/${currentWeekId}/depth-charts`}
                    icon={Users}
                    label="Depth Charts"
                  />
                  {!isOffseasonWeek && (
                    <>
                      <WeeklyToolItem
                        to={`/week/${currentWeekId}/game-plan`}
                        icon={Clipboard}
                        label="Game Planner"
                      />
                      <WeeklyToolItem
                        to={`/week/${currentWeekId}/wristband`}
                        icon={Watch}
                        label="Wristband Builder"
                      />
                      <WeeklyToolItem
                        to={`/week/${currentWeekId}/practice-scripts`}
                        icon={FileText}
                        label="Practice Scripts"
                      />
                      <WeeklyToolItem
                        to={`/week/${currentWeekId}/pregame`}
                        icon={Clock}
                        label="Pre-Game Timeline"
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {/* Prompt to select week if none selected */}
            {!currentWeekId && weeks.length > 0 && (
              <div className="px-2 py-2 text-center">
                <p className="text-[0.65rem] text-slate-500">
                  Select a week above to see weekly tools
                </p>
              </div>
            )}

            {!currentWeekId && weeks.length === 0 && (
              <div className="px-2 py-2 text-center">
                <p className="text-[0.65rem] text-slate-500">
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
