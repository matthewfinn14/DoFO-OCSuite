import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Layers, Calendar } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import SchoolSwitcher from './SchoolSwitcher';

export default function SidebarHeader({ collapsed, onToggleCollapse, theme = 'dark' }) {
  const { school, activeYear, globalWeekTemplates, weeks, currentWeekId, setCurrentWeekId, setupConfig, programLevels, activeLevelId, setActiveLevelId } = useSchool();
  const { user, isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();

  // Get program levels from setupConfig (they're stored there when edited in Setup)
  const levels = setupConfig?.programLevels || programLevels || [];

  // Get season phases from setupConfig with defaults
  const DEFAULT_PHASES = [
    { id: 'offseason', name: 'Offseason', color: 'slate', order: 0, numWeeks: 1 },
    { id: 'summer', name: 'Summer', color: 'amber', order: 1, numWeeks: 8 },
    { id: 'preseason', name: 'Preseason', color: 'purple', order: 2, numWeeks: 3 },
    { id: 'season', name: 'Regular Season', color: 'emerald', order: 3, numWeeks: 13 }
  ];
  const seasonPhases = setupConfig?.seasonPhases?.length > 0 ? setupConfig.seasonPhases : DEFAULT_PHASES;

  // Generate weeks from season phases
  const generatedWeeks = useMemo(() => {
    const allWeeks = [];

    seasonPhases
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(phase => {
        const numWeeks = phase.numWeeks || 4;

        for (let i = 1; i <= numWeeks; i++) {
          // Special naming for certain phases
          let weekName;
          if (phase.id === 'offseason' || phase.name?.toLowerCase() === 'offseason') {
            weekName = i === 1 ? 'Offseason' : `Offseason ${i}`;
          } else if (numWeeks === 1) {
            weekName = phase.name;
          } else {
            weekName = `Week ${i} of ${phase.name}`;
          }

          // Calculate date if phase has a start date
          let weekDate = null;
          if (phase.startDate) {
            const startDate = new Date(phase.startDate);
            weekDate = new Date(startDate);
            weekDate.setDate(weekDate.getDate() + (i - 1) * 7);
          }

          allWeeks.push({
            id: `${phase.id}_week_${i}`,
            phaseId: phase.id,
            phaseName: phase.name,
            phaseColor: phase.color,
            weekNum: i,
            name: weekName,
            date: weekDate ? weekDate.toISOString().split('T')[0] : null
          });
        }
      });

    return allWeeks;
  }, [seasonPhases]);

  // Combine generated weeks with any existing weeks (prefer existing if they have more data)
  const allWeeks = useMemo(() => {
    if (weeks.length > 0) {
      // If we have stored weeks, merge with generated ones
      const mergedWeeks = generatedWeeks.map(genWeek => {
        const existingWeek = weeks.find(w =>
          w.id === genWeek.id ||
          (w.phaseId === genWeek.phaseId && w.weekNum === genWeek.weekNum)
        );
        return existingWeek ? { ...genWeek, ...existingWeek } : genWeek;
      });
      return mergedWeeks;
    }
    return generatedWeeks;
  }, [weeks, generatedWeeks]);

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
    <div className="px-3 py-2 border-b border-slate-800">
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
            <div className="mb-2 flex items-center gap-2">
              {school.settings?.teamLogo && (
                <img
                  src={school.settings.teamLogo}
                  alt="School Logo"
                  className="h-8 w-8 object-contain rounded"
                />
              )}
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">
                  {school.name}
                </h2>
                <span className="text-xs text-slate-400">{activeYear || new Date().getFullYear()}</span>
              </div>
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
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wide">Level</span>
                <select
                  value={activeLevelId || ''}
                  onChange={(e) => setActiveLevelId(e.target.value || null)}
                  className="w-full px-2 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded text-white appearance-none cursor-pointer hover:border-slate-500 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Program</option>
                  <option value="varsity">Varsity</option>
                  {accessibleLevels.map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
                <Layers size={12} className="absolute right-2 bottom-2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Active Week Selector */}
            {allWeeks.length > 0 && (
              <div className="relative">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wide">Week</span>
                <select
                  value={currentWeekId || currentWeek?.id || ''}
                  onChange={(e) => setCurrentWeekId(e.target.value || null)}
                  className="w-full px-2 py-1.5 text-xs bg-sky-500/10 border border-sky-500/30 rounded text-white appearance-none cursor-pointer hover:border-sky-500/50 focus:outline-none focus:border-sky-500"
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
