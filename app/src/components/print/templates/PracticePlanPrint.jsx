import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Practice Plan print template - matches the old PracticePlanPrintView format
 * Supports coach view and general view with scripts section
 */
export default function PracticePlanPrint({
  weekId,
  coachView = false,
  coachId = null,
  positionGroup = null,
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  includeScripts = false,
  orientation = 'landscape',
  showNotes = true,
  showContactLevel = true
}) {
  const { weeks, playsArray, staff, setupConfig, settings } = useSchool();

  // Get current week
  const currentWeek = useMemo(() => {
    return weeks.find(w => w.id === weekId);
  }, [weeks, weekId]);

  // Get practice plans for the week
  const practicePlans = useMemo(() => {
    if (!currentWeek) return {};
    return currentWeek.practicePlans || {};
  }, [currentWeek]);

  // Build play lookup
  const playMap = useMemo(() => {
    const map = {};
    playsArray.forEach(play => {
      map[play.id] = play;
    });
    return map;
  }, [playsArray]);

  // Get coach info
  const getCoachName = (coachIdParam) => {
    if (!coachIdParam) return '';
    if (coachIdParam === 'ALL' || coachIdParam === 'ALL_COACHES') return 'Staff';
    const coach = staff?.find(s => s.id === coachIdParam || s.email === coachIdParam);
    return coach?.name || coachIdParam;
  };

  // Filter days that have practice plans
  const activeDays = useMemo(() => {
    return days.filter(day => {
      const dayKey = day.toLowerCase();
      const dayPlan = practicePlans[dayKey] || practicePlans[day];
      return dayPlan && dayPlan.segments && dayPlan.segments.length > 0;
    });
  }, [days, practicePlans]);

  // Filter segments based on coach/position if in coach view
  const isSegmentRelevant = (segment) => {
    if (!coachView) return true;
    if (coachId && coachId !== 'ALL') {
      // Check if segment is assigned to this coach or has notes from this coach
      if (segment.staffId === coachId) return true;
      if (segment.assignedCoach === coachId) return true;
      if (segment.notes && typeof segment.notes === 'object' && segment.notes[coachId]) return true;
      return false;
    }
    if (positionGroup && segment.positionGroup !== positionGroup) return false;
    return true;
  };

  // Format time from 24h to 12h with AM/PM
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

  // Calculate total duration
  const getTotalDuration = (segments) => {
    return segments.reduce((acc, seg) => acc + parseInt(seg.duration || 0), 0);
  };

  // Format duration as "Xh Ym"
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get focus display for a segment
  const getFocusDisplay = (seg) => {
    if (seg.offenseFocus || seg.defenseFocus) {
      const parts = [];
      if (seg.offenseFocus) {
        const focus = Array.isArray(seg.offenseFocus) ? seg.offenseFocus.join(', ') : seg.offenseFocus;
        parts.push(`O: ${focus}`);
      }
      if (seg.defenseFocus) {
        const focus = Array.isArray(seg.defenseFocus) ? seg.defenseFocus.join(', ') : seg.defenseFocus;
        parts.push(`D: ${focus}`);
      }
      return parts.join(' / ');
    }
    return Array.isArray(seg.situation) ? seg.situation.join(', ') : (seg.situation || '-');
  };

  // Get week info
  const weekNum = currentWeek?.weekNumber || currentWeek?.name?.match(/\d+/)?.[0] || '__';
  const opponent = currentWeek?.opponent || '_______';

  return (
    <div className="practice-plan-print">
      <style>{`
        @media print {
          @page {
            size: ${orientation === 'landscape' ? 'letter landscape' : 'letter portrait'};
            margin: 0.3in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; }
          .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
          .page-break-before { break-before: page; page-break-before: always; }
        }

        .practice-plan-print {
          background: white;
          color: black;
          font-family: sans-serif;
          padding: 0.5in;
          min-height: 100%;
        }

        .pp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid black;
          padding-bottom: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .pp-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .pp-logo {
          height: 60px;
          display: flex;
          align-items: center;
        }

        .pp-logo img {
          max-height: 100%;
          width: auto;
        }

        .pp-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
          text-transform: uppercase;
        }

        .pp-header-right {
          text-align: right;
        }

        .pp-start-time {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .pp-duration {
          font-size: 1rem;
        }

        .pp-notes-box {
          border: 1px solid #000;
          padding: 0.5rem;
          margin-bottom: 0.75rem;
          background: #f9fafb;
          font-size: 0.9rem;
        }

        .pp-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }

        .pp-table th {
          padding: 2px 4px;
          background: #e5e7eb;
          border: 1px solid #000;
          font-weight: bold;
          font-size: 0.8rem;
          text-align: center;
          line-height: 1.2;
        }

        .pp-table td {
          padding: 2px 4px;
          font-size: 0.8rem;
          border: 1px solid #000;
          line-height: 1.2;
        }

        .pp-table td.center {
          text-align: center;
        }

        .pp-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .warmup-period {
          color: #f59e0b;
        }

        .segment-name {
          font-weight: 600;
        }

        /* Script styles */
        .pp-script {
          border: 2px solid black;
          margin-top: 0.25rem;
          margin-bottom: 0.5rem;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .pp-script-header {
          background: #000;
          color: white;
          padding: 2px 6px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }

        .pp-script-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.7rem;
        }

        .pp-script-table thead {
          background: #f3f4f6;
          border-bottom: 1px solid black;
        }

        .pp-script-table th {
          padding: 2px;
          text-align: center;
        }

        .pp-script-table th:not(:last-child) {
          border-right: 1px solid black;
        }

        .pp-script-table td {
          padding: 1px 2px;
          border-bottom: 1px solid #ddd;
        }

        .pp-script-table td:not(:last-child) {
          border-right: 1px solid black;
        }

        .pp-script-table .play-call {
          font-weight: bold;
        }

        .pp-script-table .notes-cell {
          font-size: 0.6rem;
          line-height: 1.1;
        }

        .day-section {
          break-before: page;
          page-break-before: always;
        }

        .day-section:first-of-type {
          break-before: auto;
          page-break-before: auto;
        }
      `}</style>

      {activeDays.map((day, dayIndex) => {
        const dayKey = day.toLowerCase();
        const dayPlan = practicePlans[dayKey] || practicePlans[day] || {};
        const segments = (dayPlan.segments || []).filter(isSegmentRelevant);

        if (segments.length === 0) return null;

        const totalDuration = getTotalDuration(segments);

        // Build running time tracker
        let currentTime;
        if (dayPlan.startTime) {
          currentTime = new Date(`2000-01-01T${dayPlan.startTime}`);
          if (isNaN(currentTime.getTime())) currentTime = new Date('2000-01-01T00:00:00');
        } else {
          currentTime = new Date('2000-01-01T00:00:00');
        }

        // Get day date display
        let dateDisplay = day;
        if (currentWeek?.date) {
          const dayOffsets = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
          const parts = String(currentWeek.date).split('-');
          if (parts.length === 3) {
            const [y, m, d] = parts.map(Number);
            if (y && m && d) {
              const mondayDate = new Date(y, m - 1, d);
              const offset = dayOffsets[day] || 0;
              const finalDate = new Date(mondayDate);
              finalDate.setDate(mondayDate.getDate() + offset);
              dateDisplay = finalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            }
          }
        }

        return (
          <div key={day} className={dayIndex > 0 ? 'day-section' : ''}>
            {/* Header */}
            <header className="pp-header">
              <div className="pp-header-left">
                {settings?.teamLogo && (
                  <div className="pp-logo">
                    {(settings.teamLogo.startsWith('http') || settings.teamLogo.startsWith('data:')) ? (
                      <img src={settings.teamLogo} alt="Logo" />
                    ) : (
                      <span style={{ fontSize: '2.5rem' }}>{settings.teamLogo}</span>
                    )}
                  </div>
                )}
                <div>
                  <h1 className="pp-title">
                    Week {weekNum} vs. {opponent} - {dateDisplay}
                  </h1>
                </div>
              </div>
              <div className="pp-header-right">
                <div className="pp-start-time">Start: {formatTime(dayPlan.startTime) || 'TBD'}</div>
                <div className="pp-duration">Duration: {formatDuration(totalDuration)}</div>
              </div>
            </header>

            {/* Pre-Practice Notes */}
            {showNotes && (dayPlan.prePracticeNotes || dayPlan.announcements) && (
              <div className="pp-notes-box">
                <strong>Pre-Practice Notes:</strong>{' '}
                <span style={{ whiteSpace: 'pre-wrap' }}>{dayPlan.prePracticeNotes || dayPlan.announcements}</span>
              </div>
            )}

            {/* Main Schedule Table */}
            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>#</th>
                  <th style={{ width: '60px' }}>Time</th>
                  <th style={{ width: '40px' }}>Dur</th>
                  <th style={{ width: '80px' }}>Phase</th>
                  <th style={{ width: '100px' }}>Type</th>
                  <th style={{ width: '120px' }}>Focus</th>
                  {showContactLevel && <th style={{ width: '60px' }}>Contact</th>}
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {/* Period 0 / Warmup Row */}
                {dayPlan.showPeriodZero !== false && dayPlan.warmupDuration > 0 && (() => {
                  const warmupTime = formatTime(currentTime.toTimeString().slice(0, 5));
                  currentTime.setMinutes(currentTime.getMinutes() + parseInt(dayPlan.warmupDuration));

                  const warmupFocus = (() => {
                    const parts = [];
                    if (dayPlan.warmupOffenseFocus) {
                      const focus = Array.isArray(dayPlan.warmupOffenseFocus) ? dayPlan.warmupOffenseFocus.join(', ') : dayPlan.warmupOffenseFocus;
                      parts.push(`O: ${focus}`);
                    }
                    if (dayPlan.warmupDefenseFocus) {
                      const focus = Array.isArray(dayPlan.warmupDefenseFocus) ? dayPlan.warmupDefenseFocus.join(', ') : dayPlan.warmupDefenseFocus;
                      parts.push(`D: ${focus}`);
                    }
                    if (dayPlan.warmupSituation && parts.length === 0) {
                      return Array.isArray(dayPlan.warmupSituation) ? dayPlan.warmupSituation.join(', ') : dayPlan.warmupSituation;
                    }
                    return parts.join(' / ') || '-';
                  })();

                  return (
                    <tr>
                      <td className="center warmup-period" style={{ fontWeight: 'bold' }}>0</td>
                      <td className="center">{warmupTime}</td>
                      <td className="center">{dayPlan.warmupDuration}</td>
                      <td className="center">{dayPlan.warmupPhase || 'ALL'}</td>
                      <td className="center">Warmup</td>
                      <td className="center">{warmupFocus}</td>
                      {showContactLevel && <td className="center">{dayPlan.warmupContact || '-'}</td>}
                      <td>
                        {dayPlan.warmupNotes && typeof dayPlan.warmupNotes === 'object' &&
                          Object.entries(dayPlan.warmupNotes)
                            .filter(([_, note]) => note)
                            .map(([id, note]) => <div key={id}>{note}</div>)
                        }
                      </td>
                    </tr>
                  );
                })()}

                {/* Regular Segments */}
                {segments.map((seg, idx) => {
                  const startTimeStr = formatTime(currentTime.toTimeString().slice(0, 5));
                  currentTime.setMinutes(currentTime.getMinutes() + parseInt(seg.duration || 0));

                  return (
                    <tr key={idx}>
                      <td className="center" style={{ fontWeight: 'bold' }}>{idx + 1}</td>
                      <td className="center">{startTimeStr}</td>
                      <td className="center">{seg.duration}</td>
                      <td className="center">{seg.phase || seg.group || 'ALL'}</td>
                      <td className="center">{seg.type || '-'}</td>
                      <td className="center">{getFocusDisplay(seg)}</td>
                      {showContactLevel && <td className="center">{seg.contactLevel || '-'}</td>}
                      <td>
                        <div className="segment-name">{seg.name}</div>
                        {seg.notes && (
                          typeof seg.notes === 'string' ? (
                            <div>{seg.notes}</div>
                          ) : (
                            Object.entries(seg.notes)
                              .filter(([noteCoachId, note]) => {
                                const isGeneral = noteCoachId === 'ALL_COACHES' || noteCoachId === 'ALL';
                                if (!coachView || coachId === 'ALL') return isGeneral;
                                return isGeneral || noteCoachId === coachId;
                              })
                              .map(([noteCoachId, note]) => (
                                <div key={noteCoachId} style={{ marginTop: '2px' }}>
                                  <strong style={{ color: '#666', marginRight: '4px' }}>
                                    {getCoachName(noteCoachId)}:
                                  </strong>
                                  {note}
                                </div>
                              ))
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Scripts Section */}
            {includeScripts && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {segments.map((seg, idx) => {
                  // Only show scripts if hasScript is enabled and there's actual content
                  if (!seg.hasScript) return null;
                  if (!seg.script || seg.script.length === 0) return null;

                  const hasActualContent = seg.script.some(row =>
                    row.playCall || row.playName || row.situation || row.yardLine || row.hash
                  );
                  if (!hasActualContent) return null;

                  return (
                    <div key={`script-${idx}`} className="pp-script">
                      <div className="pp-script-header">
                        <span>Script: {seg.name} ({seg.type})</span>
                        <span>Phase: {seg.phase || seg.group || 'ALL'}</span>
                      </div>
                      <table className="pp-script-table">
                        <thead>
                          <tr>
                            <th style={{ width: '25px' }}>#</th>
                            <th style={{ width: '35px' }}>Hash</th>
                            <th style={{ width: '50px' }}>Dn</th>
                            <th style={{ width: '50px' }}>Dist</th>
                            <th style={{ width: '80px' }}>Situation</th>
                            <th>Play Call</th>
                            <th style={{ width: '80px' }}>Defense</th>
                            <th style={{ width: '280px' }}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seg.script.map((row, rIdx) => {
                            // Format notes for print
                            let notesText = '';
                            if (row.notes && typeof row.notes === 'object') {
                              const noteEntries = Object.entries(row.notes)
                                .filter(([_, note]) => note && note.trim())
                                .map(([noteCoachId, note]) => `${getCoachName(noteCoachId)}: ${note}`);
                              notesText = noteEntries.join('; ');
                            } else if (typeof row.notes === 'string') {
                              notesText = row.notes;
                            }

                            return (
                              <tr key={rIdx}>
                                <td className="center" style={{ fontWeight: 'bold' }}>{rIdx + 1}</td>
                                <td className="center">{row.hash || '-'}</td>
                                <td className="center">{row.yardLine || row.down || '-'}</td>
                                <td className="center">{row.downDistance || row.distance || '-'}</td>
                                <td className="center">{row.situation || '-'}</td>
                                <td className="play-call">{row.playName || row.playCall || '-'}</td>
                                <td className="center">{row.defense || '-'}</td>
                                <td className="notes-cell">{notesText || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Post-Practice Notes */}
            {showNotes && dayPlan.postPracticeNotes && (
              <div className="pp-notes-box" style={{ marginTop: '1rem' }}>
                <strong>Post-Practice Notes:</strong>{' '}
                <span style={{ whiteSpace: 'pre-wrap' }}>{dayPlan.postPracticeNotes}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Fallback if no days have content */}
      {activeDays.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No practice plans found for the selected days.
        </div>
      )}
    </div>
  );
}
