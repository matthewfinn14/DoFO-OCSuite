import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Practice Plan Coach View - 2-page coach-specific print layout
 *
 * Page 1: Practice schedule with Big 3 focus and weekly emphasis
 * Page 2 (or continuation): Scripts for segments with hasScript=true
 *
 * Scripts can start on page 1 if there's room, but each script section
 * should stay together (no breaking mid-script).
 */
export default function PracticePlanCoachView({
  weekId,
  day = 'Monday',
  coachId,
  orientation = 'portrait',
  includeScripts = true,
  scale = 100
}) {
  const { weeks, staff, setupConfig, settings, culture } = useSchool();

  // Get week and practice plan
  const week = useMemo(() => weeks.find(w => w.id === weekId), [weeks, weekId]);
  const dayPlan = useMemo(() => {
    if (!week?.practicePlans) return null;
    return week.practicePlans[day.toLowerCase()] || week.practicePlans[day];
  }, [week, day]);

  const coach = useMemo(() => {
    if (!coachId) return null;
    return staff?.find(s => s.id === coachId || s.email === coachId);
  }, [staff, coachId]);

  // Find position groups this coach is assigned to
  const coachGroups = useMemo(() => {
    if (!coachId || !setupConfig?.positionGroups) return [];

    const groups = [];
    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = setupConfig.positionGroups[phase] || [];
      phaseGroups.forEach(group => {
        // Check coachIds array or single coachId
        const coachIds = group.coachIds || (group.coachId ? [group.coachId] : []);
        if (coachIds.includes(coachId)) {
          groups.push({
            phase,
            abbrev: group.abbrev,
            name: group.name,
            big3: (group.big3 || []).filter(b => b && b.trim())
          });
        }
      });
    });
    return groups;
  }, [setupConfig, coachId]);

  // Get weekly goals based on coach's phase
  const weeklyGoals = useMemo(() => {
    if (!culture?.goals) return [];

    const isOffense = coachGroups.some(g => g.phase === 'OFFENSE');
    const isDefense = coachGroups.some(g => g.phase === 'DEFENSE');
    const isSpecialTeams = coachGroups.some(g => g.phase === 'SPECIAL_TEAMS');

    const goals = [];
    if (isOffense && culture.goals.offenseWeekly) {
      goals.push(...culture.goals.offenseWeekly);
    }
    if (isDefense && culture.goals.defenseWeekly) {
      goals.push(...culture.goals.defenseWeekly);
    }
    if (isSpecialTeams && culture.goals.stWeekly) {
      goals.push(...culture.goals.stWeekly);
    }

    // If no specific phase, fall back to showing general goals
    if (goals.length === 0 && culture.goals.offenseWeekly) {
      goals.push(...culture.goals.offenseWeekly);
    }

    return goals.filter(g => g && g.trim()).slice(0, 3);
  }, [culture, coachGroups]);

  // Filter notes relevant to this coach
  const getCoachNotes = (segment) => {
    const notes = segment.notes || {};
    if (typeof notes === 'string') return notes;

    const relevant = [];

    // Include @all notes
    if (notes['ALL'] || notes['ALL_COACHES']) {
      relevant.push(notes['ALL'] || notes['ALL_COACHES']);
    }

    // Include notes for this coach
    if (coachId && notes[coachId]) {
      relevant.push(notes[coachId]);
    }

    // Include notes for coach's position groups
    coachGroups.forEach(g => {
      if (notes[g.abbrev]) relevant.push(notes[g.abbrev]);
    });

    return relevant.filter(n => n && n.trim()).join(' | ');
  };

  // Get segments with scripts
  const scriptSegments = useMemo(() => {
    if (!dayPlan?.segments) return [];
    return dayPlan.segments.filter(s => s.hasScript && s.script?.length > 0);
  }, [dayPlan]);

  // Format time from 24h to 12h
  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string' && time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
    }
    return time;
  };

  // Calculate times for each segment
  const segmentsWithTimes = useMemo(() => {
    if (!dayPlan?.segments) return [];

    let currentTime;
    if (dayPlan.startTime) {
      currentTime = new Date(`2000-01-01T${dayPlan.startTime}`);
      if (isNaN(currentTime.getTime())) currentTime = new Date('2000-01-01T15:00:00');
    } else {
      currentTime = new Date('2000-01-01T15:00:00');
    }

    // Account for warmup if present
    if (dayPlan.showPeriodZero !== false && dayPlan.warmupDuration > 0) {
      currentTime.setMinutes(currentTime.getMinutes() + parseInt(dayPlan.warmupDuration));
    }

    return dayPlan.segments.map((seg, idx) => {
      const startTimeStr = formatTime(currentTime.toTimeString().slice(0, 5));
      currentTime.setMinutes(currentTime.getMinutes() + parseInt(seg.duration || 0));
      return { ...seg, calculatedTime: startTimeStr, index: idx + 1 };
    });
  }, [dayPlan]);

  // Get coach name helper
  const getCoachName = (id) => {
    if (!id) return '';
    if (id === 'ALL' || id === 'ALL_COACHES') return 'Staff';
    const c = staff?.find(s => s.id === id || s.email === id);
    return c?.name || id;
  };

  // Get week info
  const weekNum = week?.weekNumber || week?.weekNum || week?.name?.match(/\d+/)?.[0] || '__';
  const opponent = week?.opponent || '';

  // Get phase abbreviation
  const getPhaseAbbrev = (phase) => {
    if (!phase) return '-';
    const p = phase.toUpperCase();
    if (p === 'OFFENSE' || p === 'O') return 'O';
    if (p === 'DEFENSE' || p === 'D') return 'D';
    if (p === 'SPECIAL_TEAMS' || p === 'KICKING' || p === 'ST' || p === 'K') return 'K';
    if (p === 'COMPETITION' || p === 'C') return 'C';
    if (p === 'ALL' || p === 'TEAM') return 'ALL';
    return phase.charAt(0).toUpperCase();
  };

  // Get phase class for color coding
  const getPhaseClass = (phase) => {
    const abbrev = getPhaseAbbrev(phase);
    if (abbrev === 'O') return 'pp2-phase-o';
    if (abbrev === 'D') return 'pp2-phase-d';
    if (abbrev === 'K') return 'pp2-phase-k';
    if (abbrev === 'C') return 'pp2-phase-c';
    return '';
  };

  // Build warmup row
  const warmupRow = useMemo(() => {
    if (!dayPlan || dayPlan.showPeriodZero === false || !dayPlan.warmupDuration) return null;

    let warmupTime;
    if (dayPlan.startTime) {
      const t = new Date(`2000-01-01T${dayPlan.startTime}`);
      warmupTime = formatTime(t.toTimeString().slice(0, 5));
    }

    const warmupFocus = (() => {
      const parts = [];
      if (dayPlan.warmupOffenseFocus) {
        const focus = Array.isArray(dayPlan.warmupOffenseFocus)
          ? dayPlan.warmupOffenseFocus.join(', ')
          : dayPlan.warmupOffenseFocus;
        parts.push(`O: ${focus}`);
      }
      if (dayPlan.warmupDefenseFocus) {
        const focus = Array.isArray(dayPlan.warmupDefenseFocus)
          ? dayPlan.warmupDefenseFocus.join(', ')
          : dayPlan.warmupDefenseFocus;
        parts.push(`D: ${focus}`);
      }
      return parts.join(' / ') || (dayPlan.warmupSituation ?
        (Array.isArray(dayPlan.warmupSituation) ? dayPlan.warmupSituation.join(', ') : dayPlan.warmupSituation)
        : '-');
    })();

    return {
      index: 0,
      calculatedTime: warmupTime || '-',
      duration: dayPlan.warmupDuration,
      type: 'Warmup',
      phase: dayPlan.warmupPhase || 'ALL',
      focus: warmupFocus,
      contactLevel: dayPlan.warmupContact || '-',
      notes: ''
    };
  }, [dayPlan]);

  // Get focus display
  const getFocusDisplay = (seg) => {
    const parts = [];

    // Check for general focuses (array of objects with .name)
    if (seg.focuses?.length > 0) {
      const focusNames = seg.focuses.map(f => typeof f === 'string' ? f : f.name).filter(Boolean);
      if (focusNames.length > 0) {
        parts.push(focusNames.join(', '));
      }
    }

    // Check for offense focuses (array of objects with .name)
    if (seg.offenseFocuses?.length > 0) {
      const focusNames = seg.offenseFocuses.map(f => typeof f === 'string' ? f : f.name).filter(Boolean);
      if (focusNames.length > 0) {
        parts.push(`O: ${focusNames.join(', ')}`);
      }
    }

    // Check for defense focuses (array of objects with .name)
    if (seg.defenseFocuses?.length > 0) {
      const focusNames = seg.defenseFocuses.map(f => typeof f === 'string' ? f : f.name).filter(Boolean);
      if (focusNames.length > 0) {
        parts.push(`D: ${focusNames.join(', ')}`);
      }
    }

    if (parts.length > 0) {
      return parts.join(' / ');
    }

    // Fallback to situation
    if (seg.situation) {
      return Array.isArray(seg.situation) ? seg.situation.join(', ') : seg.situation;
    }
    return '-';
  };

  if (!dayPlan || !dayPlan.segments || dayPlan.segments.length === 0) {
    return (
      <div className="pp2-container pp2-empty">
        <p>No practice plan found for {day}.</p>
      </div>
    );
  }

  // Apply scale as CSS zoom (reflows layout, won't overflow page width)
  const containerStyle = scale !== 100 ? { zoom: `${scale}%` } : {};

  return (
    <div className={`pp2-container pp2-${orientation}`} style={containerStyle}>
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

      {/* PAGE 1 - Practice Schedule */}
      <div className="pp2-page">
        {/* Header */}
        <div className="pp2-header">
          <div className="pp2-header-left">
            {settings?.teamLogo && (
              <div className="pp2-logo-wrap">
                {(settings.teamLogo.startsWith('http') || settings.teamLogo.startsWith('data:')) ? (
                  <img src={settings.teamLogo} alt="Logo" className="pp2-logo" />
                ) : (
                  <span className="pp2-logo-emoji">{settings.teamLogo}</span>
                )}
              </div>
            )}
            <div className="pp2-header-title-group">
              <h1 className="pp2-day-badge">{day.toUpperCase()}</h1>
              <div className="pp2-week-info">
                WEEK {weekNum}{opponent ? ` vs. ${opponent.toUpperCase()}` : ''}
              </div>
            </div>
          </div>
          <div className="pp2-header-right">
            <div className="pp2-start-time">
              Start: {formatTime(dayPlan.startTime) || 'TBD'}
            </div>
          </div>
        </div>

        {/* Coach Info Bar */}
        <div className="pp2-coach-info">
          {/* Coach & Position Groups */}
          <div className="pp2-info-box">
            <h4>Coach</h4>
            <div className="pp2-coach-name">{coach?.name || 'All Staff'}</div>
            {coachGroups.length > 0 && (
              <div className="pp2-position-groups">
                {coachGroups.map(g => g.abbrev).join(', ')}
              </div>
            )}
          </div>

          {/* Big 3 Focus */}
          <div className="pp2-info-box">
            <h4>Big 3 Focus</h4>
            {coachGroups.length > 0 && coachGroups[0].big3.length > 0 ? (
              <div className="pp2-big3-list">
                {coachGroups[0].big3.slice(0, 3).map((item, i) => (
                  <div key={i} className="pp2-big3-item">
                    <span className="pp2-big3-num">{i + 1}</span>
                    <span className="pp2-big3-text">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pp2-empty-text">Not set</div>
            )}
          </div>

          {/* Weekly Emphasis / Areas to Improve */}
          <div className="pp2-info-box">
            <h4>Weekly Emphasis</h4>
            {weeklyGoals.length > 0 ? (
              <div className="pp2-goals-list">
                {weeklyGoals.map((goal, i) => (
                  <div key={i} className="pp2-goal-item">{goal}</div>
                ))}
              </div>
            ) : (
              <div className="pp2-empty-text">Not set</div>
            )}
          </div>
        </div>

        {/* Practice Schedule Grid */}
        <div className="pp2-schedule-section">
          <div className="pp2-section-title">Practice Schedule</div>
          <div className="pp2-schedule">
            {/* Header Row */}
            <div className="pp2-schedule-header">
              <div>#</div>
              <div>Time</div>
              <div>Dur</div>
              <div>Segment</div>
              <div>P</div>
              <div>Focus</div>
              <div>Contact</div>
              <div>Notes</div>
            </div>

            {/* Warmup Row */}
            {warmupRow && (
              <div className="pp2-schedule-row">
                <div className="pp2-warmup-num">0</div>
                <div>{warmupRow.calculatedTime}</div>
                <div>{warmupRow.duration}m</div>
                <div>Warmup</div>
                <div className={getPhaseClass(warmupRow.phase)}>{getPhaseAbbrev(warmupRow.phase)}</div>
                <div>{warmupRow.focus}</div>
                <div>{warmupRow.contactLevel}</div>
                <div></div>
              </div>
            )}

            {/* Segment Rows */}
            {segmentsWithTimes.map((seg) => (
              <div key={seg.index} className="pp2-schedule-row">
                <div>{seg.index}</div>
                <div>{seg.calculatedTime}</div>
                <div>{seg.duration}m</div>
                <div className="pp2-segment-type">{seg.type || seg.name || '-'}</div>
                <div className={getPhaseClass(seg.phase || seg.group)}>{getPhaseAbbrev(seg.phase || seg.group)}</div>
                <div>{getFocusDisplay(seg)}</div>
                <div>{seg.contactLevel || '-'}</div>
                <div className="pp2-notes-cell">{getCoachNotes(seg)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scripts Section - starts on page 1 if room, otherwise flows to page 2 */}
        {includeScripts && scriptSegments.length > 0 && (
          <div className="pp2-scripts-container">
            {scriptSegments.map((seg, sIdx) => {
              const hasActualContent = seg.script.some(row =>
                row.playCall || row.playName || row.situation || row.yardLine || row.hash
              );
              if (!hasActualContent) return null;

              const segmentFocuses = getFocusDisplay(seg);
              return (
                <div key={`script-${sIdx}`} className="pp2-script-section">
                  <div className="pp2-script-header">
                    <span className="pp2-script-title">
                      SEGMENT: {seg.name || seg.type} ({seg.phase || seg.group || 'Team'})
                      {segmentFocuses && segmentFocuses !== '-' && (
                        <span style={{ fontWeight: 400, marginLeft: '8px', opacity: 0.9 }}>
                          • {segmentFocuses}
                        </span>
                      )}
                    </span>
                    <span className="pp2-script-duration">{seg.duration} min</span>
                  </div>
                  <div className="pp2-script-grid">
                    {/* Script Header */}
                    <div className="pp2-script-row pp2-script-row-header">
                      <div>#</div>
                      <div>Situation</div>
                      <div>Hash</div>
                      <div>Dn</div>
                      <div>Dist</div>
                      <div>Play Call</div>
                    </div>
                    {/* Script Rows */}
                    {seg.script.map((row, rIdx) => {
                      return (
                        <div key={rIdx} className="pp2-script-row">
                          <div>{rIdx + 1}</div>
                          <div>{row.situation || '-'}</div>
                          <div>{row.hash || '-'}</div>
                          <div>{row.down || row.yardLine || '-'}</div>
                          <div>{row.distance || row.downDistance || '-'}</div>
                          <div className="pp2-play-call">{row.playName || row.playCall || '-'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
