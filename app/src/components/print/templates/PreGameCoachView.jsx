import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Pre-Game Timeline Coach View - Professional single-page layout
 * Matches the style of PracticePlanCoachView
 */
// Default pregame schedule template (fallback)
const DEFAULT_SCHEDULE = [
  { id: 1, time: -120, name: 'Locker Room Opens', location: 'Locker Room', category: 'logistics' },
  { id: 2, time: -90, name: 'Team Arrives / Dress', location: 'Locker Room', category: 'logistics' },
  { id: 3, time: -75, name: 'Offensive Walk-through', location: 'Locker Room', category: 'warmup' },
  { id: 4, time: -60, name: 'Defensive Walk-through', location: 'Locker Room', category: 'warmup' },
  { id: 5, time: -50, name: 'Special Teams Review', location: 'Locker Room', category: 'warmup' },
  { id: 6, time: -45, name: 'Take Field for Warmups', location: 'Field', category: 'warmup' },
  { id: 7, time: -40, name: 'Dynamic Stretch', location: 'Field', category: 'warmup' },
  { id: 8, time: -30, name: 'Position Groups', location: 'Field', category: 'warmup' },
  { id: 9, time: -20, name: 'Special Teams Warmup', location: 'Field', category: 'warmup' },
  { id: 10, time: -15, name: 'Return to Locker Room', location: 'Locker Room', category: 'logistics' },
  { id: 11, time: -10, name: 'Final Meeting / Prayer', location: 'Locker Room', category: 'team' },
  { id: 12, time: -5, name: 'Captains for Coin Toss', location: 'Field', category: 'team' },
  { id: 13, time: 0, name: 'KICKOFF', location: 'Field', category: 'game' }
];

export default function PreGameCoachView({
  weekId,
  gameTime = '19:00',
  schedule: scheduleProp,
  orientation = 'portrait',
  includeCheckboxes = true,
  showNotes = true
}) {
  const { weeks, settings, staff } = useSchool();

  // Get current week
  const week = useMemo(() => weeks.find(w => w.id === weekId), [weeks, weekId]);

  // Get pre-game schedule - use prop if provided, otherwise from week, otherwise default
  const pregameSchedule = useMemo(() => {
    if (scheduleProp && scheduleProp.length > 0) return scheduleProp;
    if (week?.pregameSchedule) return week.pregameSchedule;
    if (week?.pregame) return week.pregame;
    return DEFAULT_SCHEDULE;
  }, [scheduleProp, week]);

  // Parse game time
  const gameTimeMinutes = useMemo(() => {
    if (!gameTime) return 19 * 60;
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
    return `${displayHours}:${mins.toString().padStart(2, '0')}${period}`;
  };

  // Format relative time
  const getRelativeTime = (relativeMinutes) => {
    if (relativeMinutes === 0) return 'KICKOFF';
    const absMinutes = Math.abs(relativeMinutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;

    let timeStr = '';
    if (hours > 0) timeStr += `${hours}h `;
    if (mins > 0) timeStr += `${mins}m`;

    return relativeMinutes < 0 ? `T-${timeStr.trim()}` : `T+${timeStr.trim()}`;
  };

  // Sort schedule by time (earliest first)
  // Supports multiple data formats: time (direct minutes), relativeMinutes, or minutesBefore
  const sortedSchedule = useMemo(() => {
    return [...pregameSchedule].sort((a, b) => {
      const timeA = a.time ?? a.relativeMinutes ?? (a.minutesBefore ? -a.minutesBefore : 0);
      const timeB = b.time ?? b.relativeMinutes ?? (b.minutesBefore ? -b.minutesBefore : 0);
      return timeA - timeB;
    });
  }, [pregameSchedule]);

  // Get week info
  const opponent = week?.opponent || '';
  const weekNum = week?.weekNumber || week?.weekNum || week?.name?.match(/\d+/)?.[0] || '';
  const gameDate = week?.gameDate ? new Date(week.gameDate) : null;
  const isHome = week?.isHome !== false;

  // Format game date
  const formattedDate = gameDate ? gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }) : '';

  if (pregameSchedule.length === 0) {
    return (
      <div className="pg2-container pg2-empty">
        <p>No pre-game schedule found for this week.</p>
      </div>
    );
  }

  return (
    <div className={`pg2-container pg2-${orientation}`}>
      {/* Inline styles for print */}
      <style>{`
        @media print {
          @page {
            size: letter ${orientation};
            margin: 0.25in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="pg2-page">
        {/* Header */}
        <div className="pg2-header">
          <div className="pg2-header-left">
            {settings?.teamLogo && (
              <div className="pg2-logo-wrap">
                {(settings.teamLogo.startsWith('http') || settings.teamLogo.startsWith('data:')) ? (
                  <img src={settings.teamLogo} alt="Logo" className="pg2-logo" />
                ) : (
                  <span className="pg2-logo-emoji">{settings.teamLogo}</span>
                )}
              </div>
            )}
            <div className="pg2-header-title-group">
              <h1 className="pg2-title">PRE-GAME SCHEDULE</h1>
              <div className="pg2-week-info">
                {weekNum && `WEEK ${weekNum} `}
                {opponent && `${isHome ? 'vs.' : '@'} ${opponent.toUpperCase()}`}
              </div>
            </div>
          </div>
          <div className="pg2-header-right">
            <div className="pg2-kickoff-time">
              Kickoff: {getActualTime(0)}
            </div>
            {formattedDate && (
              <div className="pg2-game-date">{formattedDate}</div>
            )}
          </div>
        </div>

        {/* Game Info Bar */}
        <div className="pg2-info-bar">
          <div className="pg2-info-item">
            <span className="pg2-info-label">Location</span>
            <span className="pg2-info-value">{week?.gameLocation || week?.location || (isHome ? 'HOME' : 'AWAY')}</span>
          </div>
          {week?.busTime && (
            <div className="pg2-info-item">
              <span className="pg2-info-label">Bus Departs</span>
              <span className="pg2-info-value">{week.busTime}</span>
            </div>
          )}
          {week?.arrivalTime && (
            <div className="pg2-info-item">
              <span className="pg2-info-label">Arrival</span>
              <span className="pg2-info-value">{week.arrivalTime}</span>
            </div>
          )}
          {week?.mealTime && (
            <div className="pg2-info-item">
              <span className="pg2-info-label">Pre-Game Meal</span>
              <span className="pg2-info-value">{week.mealTime}</span>
            </div>
          )}
        </div>

        {/* Timeline Grid */}
        <div className="pg2-timeline-section">
          <div className="pg2-section-title">Game Day Timeline</div>
          <div className="pg2-timeline">
            {/* Header Row */}
            <div className="pg2-timeline-header">
              {includeCheckboxes && <div></div>}
              <div>Time</div>
              <div>Countdown</div>
              <div>Activity</div>
              <div>Responsible</div>
              {showNotes && <div>Notes</div>}
            </div>

            {/* Timeline Items */}
            {sortedSchedule.map((item, idx) => {
              // Support multiple data formats: time (direct), relativeMinutes, or minutesBefore
              const relativeMinutes = item.time ?? item.relativeMinutes ?? (item.minutesBefore ? -item.minutesBefore : 0);
              const isKickoff = relativeMinutes === 0;
              const isPastKickoff = relativeMinutes > 0;

              return (
                <div
                  key={idx}
                  className={`pg2-timeline-row ${isKickoff ? 'pg2-kickoff-row' : ''} ${isPastKickoff ? 'pg2-post-kickoff' : ''}`}
                >
                  {includeCheckboxes && (
                    <div className="pg2-checkbox-cell">
                      <div className="pg2-checkbox"></div>
                    </div>
                  )}
                  <div className="pg2-time-cell">{getActualTime(relativeMinutes)}</div>
                  <div className={`pg2-countdown-cell ${isKickoff ? 'pg2-kickoff-badge' : ''}`}>
                    {getRelativeTime(relativeMinutes)}
                  </div>
                  <div className="pg2-activity-cell">
                    {item.name || item.title || item.description || item.activity}
                  </div>
                  <div className="pg2-owner-cell">
                    {item.owner || item.responsible || item.assignedTo || ''}
                  </div>
                  {showNotes && (
                    <div className="pg2-notes-cell">
                      {item.notes || ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
