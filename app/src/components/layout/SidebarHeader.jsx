import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import SchoolSwitcher from './SchoolSwitcher';

export default function SidebarHeader({ collapsed, onToggleCollapse, theme = 'dark' }) {
  const { school, activeYear, globalWeekTemplates, setCurrentWeekId, setupConfig, programLevels, activeLevelId, setActiveLevelId } = useSchool();
  const { user, isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();

  // Get program levels from setupConfig (they're stored there when edited in Setup)
  const levels = setupConfig?.programLevels || programLevels || [];

  // Determine which levels the current user can access
  const accessibleLevels = levels.filter(level => {
    // Head coaches, team admins, and site admins can access all levels
    if (isHeadCoach || isTeamAdmin || isSiteAdmin) return true;
    // Other staff can only access levels they have permission for
    return (level.staffPermissions || []).includes(user?.uid);
  });

  // Only show dropdown if there are 2+ levels AND user has access to at least one
  const showLevelDropdown = levels.length >= 1 && accessibleLevels.length >= 1;

  const handleLoadWeekFromTemplate = (templateId) => {
    // This would be implemented to load a week template
    console.log('Loading week template:', templateId);
  };

  return (
    <div className="p-4 border-b border-slate-800">
      {/* Logo row with collapse toggle */}
      <div className="flex items-center justify-between mb-4">
        {!collapsed ? (
          <img
            src={theme === 'light' ? '/DoFO dark, transparent.png' : '/DoFO - White logo transparent bckgrnd.png'}
            alt="DoFO"
            className="w-[85%] max-w-[200px]"
          />
        ) : (
          <div />
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white flex-shrink-0 border border-slate-600 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {!collapsed && (
        <>

          {/* School Name and Logo */}
          {school?.name && (
            <div className="mb-4 flex flex-col gap-2">
              <h2 className="text-lg font-bold text-white leading-tight">
                {school.name}
              </h2>
              {school.settings?.teamLogo && (
                <img
                  src={school.settings.teamLogo}
                  alt="School Logo"
                  className="max-h-[60px] max-w-full object-contain rounded self-start"
                />
              )}
            </div>
          )}

          {/* School Switcher */}
          <div className="mb-4">
            <SchoolSwitcher />
          </div>

          {/* Active Season */}
          <div className="mt-4">
            <span className="text-[0.65rem] text-slate-500 uppercase tracking-wide block mb-0">
              Active Season
            </span>
            <div className="text-lg font-bold text-white tracking-wide">
              {activeYear || new Date().getFullYear()}
            </div>
          </div>

          {/* Program Level Selector */}
          {showLevelDropdown && (
            <div className="mt-4">
              <span className="text-[0.65rem] text-slate-500 uppercase tracking-wide block mb-1">
                Program Level
              </span>
              <div className="relative">
                <select
                  value={activeLevelId || ''}
                  onChange={(e) => setActiveLevelId(e.target.value || null)}
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white appearance-none cursor-pointer hover:border-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="">Varsity (Main)</option>
                  {accessibleLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                <Layers size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {activeLevelId && (
                <p className="text-[0.65rem] text-amber-400/80 mt-1">
                  Viewing {accessibleLevels.find(l => l.id === activeLevelId)?.name || 'sub-level'} data
                </p>
              )}
            </div>
          )}

          {/* Week Template Selector */}
          {globalWeekTemplates.length > 0 && (
            <div className="mt-4 flex flex-col gap-1">
              <select
                className="w-full px-2 py-1 text-sm bg-black/10 border border-dashed border-white/20 rounded text-slate-300 focus:outline-none focus:border-sky-500"
                onChange={(e) => {
                  if (e.target.value) {
                    handleLoadWeekFromTemplate(e.target.value);
                    e.target.value = '';
                  }
                }}
                value=""
              >
                <option value="" disabled>Apply Week Template...</option>
                {globalWeekTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
