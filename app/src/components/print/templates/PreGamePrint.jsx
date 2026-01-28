import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Pre-Game Timeline print template - checklist format
 */
export default function PreGamePrint({
  weekId,
  gameTime = '19:00',
  showCompletedItems = true,
  showNotes = true,
  timeFormat = 'actual',
  orientation = 'portrait',
  includeCheckboxes = true
}) {
  const { weeks, settings } = useSchool();

  // Get current week
  const currentWeek = useMemo(() => {
    return weeks.find(w => w.id === weekId);
  }, [weeks, weekId]);

  // Get pre-game schedule
  const pregameSchedule = useMemo(() => {
    if (!currentWeek) return [];
    return currentWeek.pregameSchedule || currentWeek.pregame || [];
  }, [currentWeek]);

  // Parse game time
  const gameTimeMinutes = useMemo(() => {
    if (!gameTime) return 19 * 60; // Default 7 PM
    const [hours, minutes] = gameTime.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }, [gameTime]);

  // Calculate actual time from relative minutes
  const getActualTime = (relativeMinutes) => {
    const actualMinutes = gameTimeMinutes + relativeMinutes;
    const hours = Math.floor(actualMinutes / 60) % 24;
    const mins = actualMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  // Format relative time
  const getRelativeTime = (relativeMinutes) => {
    if (relativeMinutes === 0) return 'Kickoff';
    const absMinutes = Math.abs(relativeMinutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;

    let timeStr = '';
    if (hours > 0) timeStr += `${hours}h `;
    if (mins > 0) timeStr += `${mins}m`;

    return relativeMinutes < 0 ? `-${timeStr.trim()}` : `+${timeStr.trim()}`;
  };

  // Sort schedule by time
  const sortedSchedule = useMemo(() => {
    return [...pregameSchedule].sort((a, b) => {
      const timeA = a.relativeMinutes ?? a.minutesBefore ?? 0;
      const timeB = b.relativeMinutes ?? b.minutesBefore ?? 0;
      return timeA - timeB;
    });
  }, [pregameSchedule]);

  const orientationClass = orientation === 'landscape' ? 'print-page-landscape' : '';

  return (
    <div className={`pregame-print ${orientationClass}`}>
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          {settings?.teamLogo && (
            <img src={settings.teamLogo} alt="Logo" className="print-header-logo" />
          )}
          <div className="print-header-info">
            <div className="print-header-title">Pre-Game Schedule</div>
            <div className="print-header-subtitle">
              {currentWeek?.name} {currentWeek?.opponent && `vs ${currentWeek.opponent}`}
            </div>
          </div>
        </div>
        <div className="print-header-right">
          <div className="print-header-opponent">
            Kickoff: {getActualTime(0)}
          </div>
          {currentWeek?.gameDate && (
            <div className="print-header-date">
              {new Date(currentWeek.gameDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="pregame-timeline mt-4">
        {/* Header Row */}
        <div className="pregame-item header">
          {includeCheckboxes && <div className="text-center"></div>}
          <div className="pregame-time">Time</div>
          <div className="pregame-relative-time">Relative</div>
          <div className="pregame-description">Activity</div>
          <div className="pregame-owner">Responsible</div>
        </div>

        {/* Schedule Items */}
        {sortedSchedule.map((item, idx) => {
          const relativeMinutes = item.relativeMinutes ?? (item.minutesBefore ? -item.minutesBefore : 0);

          if (!showCompletedItems && item.completed) return null;

          return (
            <div key={idx}>
              <div className={`pregame-item ${item.completed ? 'opacity-50' : ''}`}>
                {includeCheckboxes && (
                  <div className="flex justify-center">
                    <div className="pregame-checkbox"></div>
                  </div>
                )}
                <div className="pregame-time">
                  {(timeFormat === 'actual' || timeFormat === 'both') && getActualTime(relativeMinutes)}
                </div>
                <div className="pregame-relative-time">
                  {(timeFormat === 'relative' || timeFormat === 'both') && getRelativeTime(relativeMinutes)}
                </div>
                <div className="pregame-description">
                  {item.title || item.description || item.activity}
                </div>
                <div className="pregame-owner">
                  {item.owner || item.responsible || item.assignedTo || ''}
                </div>
              </div>

              {/* Notes */}
              {showNotes && item.notes && (
                <div className="pregame-notes">
                  {item.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend / Footer */}
      <div className="mt-6 pt-4 border-t border-gray-300 text-sm text-gray-600">
        <div className="flex gap-8">
          <div>
            <span className="font-semibold">Location:</span>{' '}
            {currentWeek?.gameLocation || currentWeek?.location || 'TBD'}
          </div>
          {currentWeek?.busTime && (
            <div>
              <span className="font-semibold">Bus Departs:</span>{' '}
              {currentWeek.busTime}
            </div>
          )}
          {currentWeek?.arrivalTime && (
            <div>
              <span className="font-semibold">Arrival:</span>{' '}
              {currentWeek.arrivalTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
