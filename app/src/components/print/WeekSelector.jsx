import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

/**
 * Week and level selector for print templates
 * Allows selecting which week's data to print
 */
export default function WeekSelector({
  selectedWeekId,
  onWeekChange,
  selectedLevelId,
  onLevelChange,
  showLevelSelector = true
}) {
  const {
    weeks,
    currentWeekId,
    programLevels,
    activeLevelId
  } = useSchool();

  // Group weeks by phase/season
  const groupedWeeks = useMemo(() => {
    const groups = {};

    weeks.forEach(week => {
      const year = week.year || new Date(week.startDate || week.createdAt).getFullYear();
      const phase = week.phase || 'season';
      const key = `${year} ${phase.charAt(0).toUpperCase() + phase.slice(1)}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(week);
    });

    // Sort weeks within each group
    Object.values(groups).forEach(weekList => {
      weekList.sort((a, b) => {
        const numA = a.weekNumber || parseInt(a.name?.match(/\d+/)?.[0] || '0');
        const numB = b.weekNumber || parseInt(b.name?.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
    });

    return groups;
  }, [weeks]);

  // Get selected week details
  const selectedWeek = useMemo(() => {
    return weeks.find(w => w.id === (selectedWeekId || currentWeekId));
  }, [weeks, selectedWeekId, currentWeekId]);

  // Format week label
  const getWeekLabel = (week) => {
    const num = week.weekNumber || week.name?.match(/\d+/)?.[0] || '';
    const opponent = week.opponent || '';
    return `Week ${num}${opponent ? ` - ${opponent}` : ''}`;
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Calendar size={14} />
        Week Selection
      </div>

      {/* Week Selector */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
        <select
          value={selectedWeekId || currentWeekId || ''}
          onChange={(e) => onWeekChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="">Select a week...</option>
          {Object.entries(groupedWeeks).map(([group, weekList]) => (
            <optgroup key={group} label={group}>
              {weekList.map(week => (
                <option key={week.id} value={week.id}>
                  {getWeekLabel(week)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Level Selector */}
      {showLevelSelector && programLevels?.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select
            value={selectedLevelId || activeLevelId || programLevels[0]?.id || ''}
            onChange={(e) => onLevelChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            {programLevels.map(level => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Week Info Display */}
      {selectedWeek && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <div className="text-gray-900 font-medium">
            {selectedWeek.name || `Week ${selectedWeek.weekNumber}`}
          </div>
          {selectedWeek.opponent && (
            <div className="text-gray-600 mt-1">
              vs {selectedWeek.opponent}
            </div>
          )}
          {selectedWeek.gameDate && (
            <div className="text-gray-500 text-xs mt-1">
              {new Date(selectedWeek.gameDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
