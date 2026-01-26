import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import WeeklyToolsMenu from './WeeklyToolsMenu';
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
  Calendar,
  Sun,
  Zap,
  Trophy,
  ChevronDown,
  ChevronRight
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
    <div className={nested ? 'ml-2' : 'mb-1'}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm font-semibold rounded-md transition-colors ${
          nested
            ? 'text-slate-400/90 hover:text-slate-200 hover:bg-slate-800/30 py-1.5'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <Icon size={nested ? 14 : 16} />
        <span className="flex-1">{title}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && (
        <div className={nested ? 'ml-2 mt-0.5' : 'ml-4 mt-1 space-y-1'}>
          {children}
        </div>
      )}
    </div>
  );
}

// Navigation item component
function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-sky-500/20 text-sky-400 border-l-2 border-sky-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        } ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

// Week collapsible with tools menu
function WeekCollapsible({ week, icon: Icon, nested = false }) {
  const { currentWeekId, setCurrentWeekId } = useSchool();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(currentWeekId === week.id);

  const isOffseasonWeek = week.name === 'Offseason';

  const displayTitle = week.opponent
    ? `${week.name} - ${week.opponent}${week.isHome !== undefined ? (week.isHome ? ' (H)' : ' (A)') : ''}`
    : week.name;

  const handleClick = () => {
    setIsOpen(!isOpen);
    setCurrentWeekId(week.id);
    navigate(`/week/${week.id}/notes`);
  };

  return (
    <div className={nested ? 'ml-2 mb-0.5' : 'mb-1'}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-4 py-1.5 text-left text-sm rounded-md transition-colors ${
          currentWeekId === week.id
            ? 'text-sky-400 bg-sky-500/10'
            : 'text-slate-400/90 hover:text-slate-200 hover:bg-slate-800/30'
        }`}
      >
        <Icon size={14} />
        <span className="flex-1 truncate">{displayTitle}</span>
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {isOpen && (
        <WeeklyToolsMenu weekId={week.id} isOffseason={isOffseasonWeek} />
      )}
    </div>
  );
}

export default function Sidebar() {
  const { currentPermissions, isSiteAdmin } = useAuth();
  const { school, weeks, visibleFeatures, setCurrentWeekId } = useSchool();
  const navigate = useNavigate();

  // Persist collapse state to localStorage
  const [collapsed, setCollapsed] = useLocalStorage('dofo_sidebar_collapsed', false);

  // Categorize weeks by phase
  const offseasonWeeks = weeks.filter(w => w.name === 'Offseason');
  const summerWeeks = weeks.filter(w => w.name.includes('Summer'));
  const preseasonWeeks = weeks.filter(w =>
    ['Family Week', 'Camp Week', 'First Week of Practice', 'Week 0'].includes(w.name)
  );
  const seasonWeeks = weeks
    .filter(w =>
      (w.name.startsWith('Week ') && !w.name.includes('Summer') && w.name !== 'Week 0') ||
      w.name === 'First Week with No Game'
    )
    .sort((a, b) => {
      const getNum = (item) => {
        if (item.weekNum !== undefined) return item.weekNum;
        const match = item.name.match(/Week (\d+)/);
        return match ? parseInt(match[1]) : 99;
      };
      return getNum(a) - getNum(b);
    });

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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Core Navigation */}
        <div className="space-y-1 mb-4">
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

        {!collapsed && (
          <>
            <div className="border-t border-slate-800 my-4" />

            {/* Staff & Roster */}
            {currentPermissions.staff.view && (
              <CollapsibleCategory title="STAFF & ROSTER" icon={Users}>
                <NavItem to="/staff" icon={UserCog} label="Staff & Roles" collapsed={false} />
                {currentPermissions.settings.view && (
                  <NavItem to="/permissions" icon={Lock} label="Permissions" collapsed={false} />
                )}
                <NavItem to="/roster" icon={Users} label="Manage Roster" collapsed={false} />
                <NavItem to="/archive" icon={Archive} label="Archive" collapsed={false} />
              </CollapsibleCategory>
            )}

            <div className="border-t border-slate-800 my-4" />

            {/* Phases / Weeks */}
            <div className="mb-2">
              <span className="px-4 text-xs text-slate-500 uppercase tracking-wide">
                Phases / Weeks
              </span>
            </div>

            {/* Offseason Phase */}
            {offseasonWeeks.map(w => (
              <CollapsibleCategory
                key={w.id}
                title="OFFSEASON"
                icon={w.isLocked ? Lock : Calendar}
                defaultOpen={false}
                onTitleClick={() => {
                  setCurrentWeekId(w.id);
                  navigate('/offseason');
                }}
              >
                <WeeklyToolsMenu weekId={w.id} isOffseason={true} />
              </CollapsibleCategory>
            ))}

            {/* Summer Phase */}
            {summerWeeks.length > 0 && (
              <CollapsibleCategory
                title="SUMMER"
                icon={Sun}
                onTitleClick={() => navigate('/summer')}
              >
                {summerWeeks.map(w => (
                  <WeekCollapsible
                    key={w.id}
                    week={w}
                    icon={w.isLocked ? Lock : Sun}
                    nested
                  />
                ))}
              </CollapsibleCategory>
            )}

            {/* Pre-Season Phase */}
            {preseasonWeeks.length > 0 && (
              <CollapsibleCategory
                title="PRE-SEASON"
                icon={Zap}
                onTitleClick={() => navigate('/preseason')}
              >
                {preseasonWeeks.map(w => (
                  <WeekCollapsible
                    key={w.id}
                    week={w}
                    icon={w.isLocked ? Lock : Zap}
                    nested
                  />
                ))}
              </CollapsibleCategory>
            )}

            {/* Season Phase */}
            {seasonWeeks.length > 0 && (
              <CollapsibleCategory
                title="SEASON"
                icon={Trophy}
                onTitleClick={() => navigate('/season')}
              >
                {seasonWeeks.map(w => (
                  <WeekCollapsible
                    key={w.id}
                    week={w}
                    icon={w.isLocked ? Lock : Trophy}
                    nested
                  />
                ))}
              </CollapsibleCategory>
            )}

            <div className="border-t border-slate-800 my-4" />

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
