import { useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Layers, Calendar } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import SchoolSwitcher from './SchoolSwitcher';

export default function SidebarHeader({ collapsed, onToggleCollapse, theme = 'dark' }) {
  const { school, settings, activeYear, globalWeekTemplates, weeks, currentWeekId, setCurrentWeekId, setupConfig, programLevels, activeLevelId, setActiveLevelId } = useSchool();
  const { user, isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();

  // Get program levels from setupConfig (they're stored there when edited in Setup)
  const levels = setupConfig?.programLevels || programLevels || [];

  // Get season phases from setupConfig with defaults
  const DEFAULT_PHASES = [
    { id: 'offseason', name: 'Offseason', color: 'slate', order: 0, isOffseason: true, numWeeks: 0 },
    { id: 'summer', name: 'Summer', color: 'amber', order: 1, numWeeks: 6 },
    { id: 'preseason', name: 'Preseason', color: 'purple', order: 2, numWeeks: 4 },
    { id: 'season', name: 'Regular Season', color: 'emerald', order: 3, numWeeks: 10 }
  ];

  const seasonPhases = setupConfig?.seasonPhases?.length > 0 ? setupConfig.seasonPhases : DEFAULT_PHASES;

  // Use stored weeks directly if they exist, otherwise generate fallback weeks
  const allWeeks = useMemo(() => {
    // If we have stored weeks in Firebase, use those directly
    if (weeks.length > 0) {
      // Enhance weeks with phase info if missing
      return weeks.map(week => {
        const phase = seasonPhases.find(p => p.id === week.phaseId);
        // Determine if this is an offseason week
        const isOffseason = week.isOffseason ||
          week.id === 'offseason' ||
          week.phaseId === 'offseason' ||
          week.name === 'Offseason' ||
          phase?.isOffseason;
        return {
          ...week,
          phaseName: week.phaseName || phase?.name || 'Unknown',
          phaseColor: week.phaseColor || phase?.color || 'slate',
          isOffseason
        };
      });
    }

    // Fallback: Generate weeks from season phases (for backwards compatibility)
    const generated = [];
    seasonPhases
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(phase => {
        const isOffseason = phase.isOffseason || phase.id === 'offseason' || phase.name?.toLowerCase() === 'offseason';

        if (isOffseason) {
          // Offseason is a single item, not multiple weeks
          generated.push({
            id: 'offseason',
            phaseId: phase.id,
            phaseName: phase.name,
            phaseColor: phase.color,
            weekNum: 0,
            name: 'Offseason',
            isOffseason: true,
            date: null
          });
        } else {
          // Generate numbered weeks for regular phases
          const numWeeks = phase.numWeeks || 4;

          for (let i = 1; i <= numWeeks; i++) {
            let weekName = numWeeks === 1 ? phase.name : `Week ${i} of ${phase.name}`;

            // Calculate date if phase has a start date
            let weekDate = null;
            if (phase.startDate) {
              const startDate = new Date(phase.startDate);
              weekDate = new Date(startDate);
              weekDate.setDate(weekDate.getDate() + (i - 1) * 7);
            }

            generated.push({
              id: `${phase.id}_week_${i}`,
              phaseId: phase.id,
              phaseName: phase.name,
              phaseColor: phase.color,
              weekNum: i,
              name: weekName,
              date: weekDate ? weekDate.toISOString().split('T')[0] : null
            });
          }
        }
      });

    return generated;
  }, [weeks, seasonPhases]);

  // Find current week based on today's date
  const currentWeek = useMemo(() => {
    if (currentWeekId) {
      return allWeeks.find(w => w.id === currentWeekId);
    }

    // Auto-select based on today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find week whose date range includes today
    const sortedWeeks = [...allWeeks].filter(w => w.date).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    for (let i = 0; i < sortedWeeks.length; i++) {
      const week = sortedWeeks[i];
      const weekStart = new Date(week.date);
      weekStart.setHours(0, 0, 0, 0);

      // Week ends 6 days after start (7 day week)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (today >= weekStart && today <= weekEnd) {
        return week;
      }

      // If today is before this week, return previous week or this one
      if (today < weekStart) {
        return i > 0 ? sortedWeeks[i - 1] : week;
      }
    }

    // Default to first week if no dates set
    return allWeeks[0] || null;
  }, [allWeeks, currentWeekId]);

  // Group weeks by phase for the dropdown
  const groupedWeeks = useMemo(() => {
    return seasonPhases
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(phase => ({
        ...phase,
        weeks: allWeeks
          .filter(w => w.phaseId === phase.id)
          .sort((a, b) => (a.weekNum || 0) - (b.weekNum || 0))
      }))
      .filter(phase => phase.weeks.length > 0);
  }, [allWeeks, seasonPhases]);

  // Auto-set currentWeekId if not set but a week is auto-selected
  useEffect(() => {
    if (!currentWeekId && currentWeek?.id && allWeeks.length > 0) {
      setCurrentWeekId(currentWeek.id);
    }
  }, [currentWeekId, currentWeek?.id, allWeeks.length, setCurrentWeekId]);

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

  const isLight = theme === 'light';

  return (
    <div className={`px-3 py-2 border-b ${isLight ? 'border-gray-200' : 'border-slate-800'}`}>
      {/* Logo row with collapse toggle */}
      <div className="flex items-center justify-between mb-2">
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
          className={`p-2 rounded-full flex-shrink-0 border transition-colors ${
            isLight
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-gray-300'
              : 'bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white border-slate-600'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Team Logo - Under DoFO logo, above school name */}
          {settings?.teamLogo && (
            <div className="mb-3 flex justify-center">
              <img
                src={settings.teamLogo}
                alt="Team Logo"
                className="h-16 w-16 object-contain rounded-lg"
              />
            </div>
          )}

          {/* School Name */}
          {school?.name && (
            <div className="mb-2">
              <h2 className={`text-sm font-bold leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {school.name}
              </h2>
              <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{activeYear || new Date().getFullYear()}</span>
            </div>
          )}

          {/* School Switcher */}
          <div className="mb-2">
            <SchoolSwitcher />
          </div>

          {/* Program Level & Week Selectors - Compact */}
          <div className="space-y-2 mt-2">
            {/* Program Level Selector */}
            {showLevelDropdown && (
              <div className="relative">
                <span className={`text-[0.6rem] uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Level</span>
                <select
                  value={activeLevelId || ''}
                  onChange={(e) => setActiveLevelId(e.target.value || null)}
                  className={`w-full px-2 py-1.5 text-xs border rounded appearance-none cursor-pointer focus:outline-none focus:border-sky-500 ${
                    isLight
                      ? 'bg-gray-100 border-gray-300 text-gray-900 hover:border-gray-400'
                      : 'bg-slate-800 border-slate-600 text-white hover:border-slate-500'
                  }`}
                >
                  <option value="">Program</option>
                  <option value="varsity">Varsity</option>
                  {accessibleLevels.map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
                <Layers size={12} className={`absolute right-2 bottom-2 pointer-events-none ${isLight ? 'text-gray-400' : 'text-slate-400'}`} />
              </div>
            )}

            {/* Active Week Selector */}
            {allWeeks.length > 0 && (
              <div className="relative">
                <span className={`text-[0.6rem] uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Week</span>
                <select
                  value={currentWeekId || currentWeek?.id || ''}
                  onChange={(e) => setCurrentWeekId(e.target.value || null)}
                  className={`w-full px-2 py-1.5 text-xs rounded appearance-none cursor-pointer focus:outline-none focus:border-sky-500 ${
                    isLight
                      ? 'bg-sky-50 border border-sky-300 text-gray-900 hover:border-sky-400'
                      : 'bg-sky-500/10 border border-sky-500/30 text-white hover:border-sky-500/50'
                  }`}
                >
                  <option value="">Select Week...</option>
                  {groupedWeeks.map(phase => (
                    <optgroup key={phase.id} label={phase.name}>
                      {phase.weeks.map(week => {
                        const displayName = week.opponent
                          ? `${week.name} vs ${week.opponent}`
                          : week.name;
                        return (
                          <option key={week.id} value={week.id}>{displayName}</option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
                <Calendar size={12} className="absolute right-2 bottom-2 text-sky-400 pointer-events-none" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
