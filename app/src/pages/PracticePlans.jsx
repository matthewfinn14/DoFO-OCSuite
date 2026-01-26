import { useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Save,
  ChevronDown,
  ChevronRight,
  Printer,
  FileText,
  Lock,
  Unlock,
  Copy,
  LayoutTemplate,
  GripVertical,
  Settings,
  CheckCircle2,
  X,
  MessageSquare,
  StickyNote
} from 'lucide-react';

// Days of the week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Map day names to URL-friendly slugs
const DAY_SLUGS = {
  'Monday': 'monday',
  'Tuesday': 'tuesday',
  'Wednesday': 'wednesday',
  'Thursday': 'thursday',
  'Friday': 'friday'
};

const SLUG_TO_DAY = {
  'monday': 'Monday',
  'tuesday': 'Tuesday',
  'wednesday': 'Wednesday',
  'thursday': 'Thursday',
  'friday': 'Friday'
};

// Phase options
const PHASES = [
  { value: 'ALL', label: 'ALL' },
  { value: 'O', label: 'O' },
  { value: 'D', label: 'D' },
  { value: 'K', label: 'K' },
  { value: 'C', label: 'C' }
];

// Contact levels
const CONTACT_LEVELS = [
  { value: '', label: '--' },
  { value: 'Install', label: 'Install' },
  { value: 'On-Air', label: 'On-Air' },
  { value: 'Shields/Bags', label: 'Shields/Bags' },
  { value: 'Touch', label: 'Touch' },
  { value: 'Slight Resist', label: 'Slight Resist' },
  { value: 'Thud', label: 'Thud' },
  { value: 'Live', label: 'Live' }
];

// Default segment types (can be customized in setup)
const DEFAULT_SEGMENT_TYPES = [
  'Competition',
  'Individual',
  'Group',
  'Team',
  'Special Teams',
  'Pass Skelly',
  'Inside Run',
  '7-on-7',
  'Team Run',
  'Team Pass',
  '1st/2nd Down',
  '3rd Down',
  'Red Zone',
  'Goal Line',
  '2-Minute',
  'Take-Off',
  'Conditioning'
];

// Segment Notes Modal Component
function SegmentNotesModal({ segment, staff, onUpdateNotes, onClose }) {
  // Ensure notes is an object
  const notes = typeof segment.notes === 'object' ? segment.notes : {};

  // Separate coaches and other staff
  const coaches = (staff || []).filter(s =>
    s.role === 'Head Coach' || s.role === 'Coordinator' || s.role === 'Position Coach'
  );
  const otherStaff = (staff || []).filter(s =>
    s.role !== 'Head Coach' && s.role !== 'Coordinator' && s.role !== 'Position Coach'
  );

  const handleNoteChange = (coachId, value) => {
    const newNotes = { ...notes, [coachId]: value };
    if (!value || value.trim() === '') {
      delete newNotes[coachId];
    }
    onUpdateNotes(newNotes);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <StickyNote size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-white">
              {segment.id === 'WARMUP' ? 'Warmup Notes' : `Notes: ${segment.type || 'Segment'} (${segment.duration || 0}m)`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-600">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300 w-1/3">Staff Member</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Notes</th>
              </tr>
            </thead>
            <tbody>
              {/* All Coaches Row */}
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <td className="px-4 py-3">
                  <span className="font-bold text-amber-400">ALL COACHES</span>
                </td>
                <td className="px-4 py-3">
                  <textarea
                    value={notes['ALL_COACHES'] || ''}
                    onChange={e => handleNoteChange('ALL_COACHES', e.target.value)}
                    placeholder="Notes visible to everyone..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm resize-none"
                    rows={2}
                  />
                </td>
              </tr>

              {/* Coaches Section */}
              {coaches.length > 0 && (
                <>
                  <tr className="bg-slate-800">
                    <td colSpan={2} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Coaches
                    </td>
                  </tr>
                  {coaches.map(coach => (
                    <tr key={coach.id} className="border-b border-slate-700">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-200">{coach.name}</span>
                        {coach.positionGroup && (
                          <span className="ml-2 text-xs text-slate-500">({coach.positionGroup})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={notes[coach.id] || ''}
                          onChange={e => handleNoteChange(coach.id, e.target.value)}
                          placeholder={`Notes for ${coach.name}...`}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm resize-none"
                          rows={1}
                        />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Other Staff Section */}
              {otherStaff.length > 0 && (
                <>
                  <tr className="bg-slate-800">
                    <td colSpan={2} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Other Staff
                    </td>
                  </tr>
                  {otherStaff.map(person => (
                    <tr key={person.id} className="border-b border-slate-700">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-200">{person.name}</span>
                        {person.role && (
                          <span className="ml-2 text-xs text-slate-500">({person.role})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={notes[person.id] || ''}
                          onChange={e => handleNoteChange(person.id, e.target.value)}
                          placeholder={`Notes for ${person.name}...`}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm resize-none"
                          rows={1}
                        />
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PracticePlans() {
  const { year, phase, week: weekParam, day: dayParam, weekId: legacyWeekId } = useParams();
  const navigate = useNavigate();
  const { weeks, updateWeek, setupConfig, staff, settings } = useSchool();

  // Determine the week - support both new URL structure and legacy
  const week = useMemo(() => {
    if (legacyWeekId) {
      // Legacy URL format: /week/:weekId/practice
      return weeks.find(w => w.id === legacyWeekId);
    }
    // New URL format: /:year/:phase/:week/practice/:day
    // Find week by matching year, phase, and week number/name
    return weeks.find(w => {
      const weekYear = w.year || settings?.activeYear || new Date().getFullYear().toString();
      const weekPhase = (w.phase || 'season').toLowerCase();
      const weekName = (w.name || '').toLowerCase().replace(/\s+/g, '-');
      const weekNum = w.weekNum ? `week-${w.weekNum}` : weekName;

      return weekYear === year &&
             weekPhase === phase?.toLowerCase() &&
             (weekNum === weekParam?.toLowerCase() || weekName === weekParam?.toLowerCase() || w.id === weekParam);
    });
  }, [weeks, year, phase, weekParam, legacyWeekId, settings]);

  // Determine selected day from URL or default to Monday
  const selectedDay = useMemo(() => {
    if (dayParam && SLUG_TO_DAY[dayParam.toLowerCase()]) {
      return SLUG_TO_DAY[dayParam.toLowerCase()];
    }
    return 'Monday';
  }, [dayParam]);

  // Build base URL for navigation
  const baseUrl = useMemo(() => {
    if (legacyWeekId) {
      return `/week/${legacyWeekId}/practice`;
    }
    return `/${year}/${phase}/${weekParam}/practice`;
  }, [year, phase, weekParam, legacyWeekId]);

  // Navigate to a specific day
  const navigateToDay = useCallback((day) => {
    const slug = DAY_SLUGS[day];
    navigate(`${baseUrl}/${slug}`);
  }, [navigate, baseUrl]);

  // Local state
  const [selectedSegmentId, setSelectedSegmentId] = useState(null);
  const [mode, setMode] = useState('plan'); // 'plan' or 'script'
  const [coachFilter, setCoachFilter] = useState('ALL');
  const [notesCoach, setNotesCoach] = useState('ALL_COACHES');
  const [notesModalSegmentId, setNotesModalSegmentId] = useState(null); // 'WARMUP' or segment.id

  // Get weekId for updates
  const weekId = week?.id;

  // Get practice plans from week (with defaults)
  const practicePlans = useMemo(() => {
    if (!week?.practicePlans) {
      return DAYS.reduce((acc, day) => {
        acc[day] = {
          id: `${weekId}-${day}`,
          date: '',
          startTime: '15:30',
          warmupDuration: 10,
          transitionTime: 2,
          showPeriodZero: true,
          isTwoPlatoon: false,
          prePracticeNotes: '',
          segments: []
        };
        return acc;
      }, {});
    }
    return week.practicePlans;
  }, [week, weekId]);

  // Current day's plan
  const currentPlan = practicePlans[selectedDay] || {
    id: `${weekId}-${selectedDay}`,
    date: '',
    startTime: '15:30',
    warmupDuration: 10,
    transitionTime: 2,
    showPeriodZero: true,
    isTwoPlatoon: false,
    prePracticeNotes: '',
    segments: []
  };

  // Get segment types from setup or use defaults
  const segmentTypes = useMemo(() => {
    const phaseTypes = setupConfig?.practiceSegmentTypes || {};
    const allTypes = new Set(DEFAULT_SEGMENT_TYPES);
    Object.values(phaseTypes).forEach(types => {
      types.forEach(t => allTypes.add(t));
    });
    return Array.from(allTypes).sort();
  }, [setupConfig]);

  // Get focus items from setup
  const focusItems = useMemo(() => {
    const items = setupConfig?.practiceFocusItems || {};
    const all = new Set();
    Object.values(items).forEach(arr => {
      arr.forEach(item => all.add(item));
    });
    return Array.from(all).sort();
  }, [setupConfig]);

  // Calculate segment start times
  const getSegmentStartTime = useCallback((index) => {
    if (!currentPlan.startTime) return '';

    const [startH, startM] = currentPlan.startTime.split(':').map(Number);
    const warmup = parseInt(currentPlan.warmupDuration) || 0;
    const transition = parseInt(currentPlan.transitionTime) || 0;

    let elapsedMinutes = warmup;
    for (let i = 0; i < index; i++) {
      elapsedMinutes += parseInt(currentPlan.segments[i]?.duration) || 0;
    }
    if (index > 0) {
      elapsedMinutes += index * transition;
    }

    const date = new Date();
    date.setHours(startH, startM + elapsedMinutes);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }, [currentPlan]);

  // Calculate total practice duration
  const totalDuration = useMemo(() => {
    const warmup = parseInt(currentPlan.warmupDuration) || 0;
    const transition = parseInt(currentPlan.transitionTime) || 0;
    const segmentTotal = currentPlan.segments.reduce((sum, seg) => sum + (parseInt(seg.duration) || 0), 0);
    const transitions = Math.max(0, currentPlan.segments.length - 1) * transition;
    return warmup + segmentTotal + transitions;
  }, [currentPlan]);

  // Update plan helper
  const updateCurrentPlan = useCallback((updates) => {
    if (!week) return;

    const newPlans = {
      ...practicePlans,
      [selectedDay]: { ...currentPlan, ...updates }
    };

    updateWeek(weekId, { practicePlans: newPlans });
  }, [week, weekId, practicePlans, selectedDay, currentPlan, updateWeek]);

  // Update segment helper
  const updateSegment = useCallback((segmentId, field, value) => {
    const newSegments = currentPlan.segments.map(seg =>
      seg.id === segmentId ? { ...seg, [field]: value } : seg
    );
    updateCurrentPlan({ segments: newSegments });
  }, [currentPlan, updateCurrentPlan]);

  // Update warmup notes
  const updateWarmupNotes = useCallback((newNotes) => {
    updateCurrentPlan({ warmupNotes: newNotes });
  }, [updateCurrentPlan]);

  // Update segment notes
  const updateSegmentNotes = useCallback((segmentId, newNotes) => {
    const newSegments = currentPlan.segments.map(seg =>
      seg.id === segmentId ? { ...seg, notes: newNotes } : seg
    );
    updateCurrentPlan({ segments: newSegments });
  }, [currentPlan, updateCurrentPlan]);

  // Get segment for notes modal
  const notesModalSegment = useMemo(() => {
    if (!notesModalSegmentId) return null;
    if (notesModalSegmentId === 'WARMUP') {
      return {
        id: 'WARMUP',
        type: 'Warmup',
        duration: currentPlan.warmupDuration || 0,
        notes: currentPlan.warmupNotes || {}
      };
    }
    return currentPlan.segments.find(seg => seg.id === notesModalSegmentId) || null;
  }, [notesModalSegmentId, currentPlan]);

  // Handle notes update from modal
  const handleNotesUpdate = useCallback((newNotes) => {
    if (notesModalSegmentId === 'WARMUP') {
      updateWarmupNotes(newNotes);
    } else if (notesModalSegmentId) {
      updateSegmentNotes(notesModalSegmentId, newNotes);
    }
  }, [notesModalSegmentId, updateWarmupNotes, updateSegmentNotes]);

  // Helper to check if segment has any notes
  const hasNotes = useCallback((notes) => {
    if (!notes || typeof notes !== 'object') return false;
    return Object.values(notes).some(v => v && v.trim() !== '');
  }, []);

  // Get preview text for notes button
  const getNotesPreview = useCallback((notes) => {
    if (!notes || typeof notes !== 'object') return null;
    const allNotes = notes['ALL_COACHES'];
    if (allNotes) return allNotes;
    const firstNote = Object.values(notes).find(v => v && v.trim() !== '');
    return firstNote || null;
  }, []);

  // Add segment
  const addSegment = useCallback((afterIndex = -1) => {
    const newSegment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: '',
      duration: 10,
      phase: 'ALL',
      situation: '',
      contact: '',
      hasScript: false,
      script: [],
      notes: {}
    };

    const newSegments = [...currentPlan.segments];
    if (afterIndex >= 0) {
      newSegments.splice(afterIndex + 1, 0, newSegment);
    } else {
      newSegments.push(newSegment);
    }

    updateCurrentPlan({ segments: newSegments });
  }, [currentPlan, updateCurrentPlan]);

  // Remove segment
  const removeSegment = useCallback((segmentId) => {
    if (!confirm('Remove this segment?')) return;
    const newSegments = currentPlan.segments.filter(seg => seg.id !== segmentId);
    updateCurrentPlan({ segments: newSegments });
    if (selectedSegmentId === segmentId) {
      setSelectedSegmentId(null);
    }
  }, [currentPlan, updateCurrentPlan, selectedSegmentId]);

  // Duplicate plan to another day
  const duplicatePlanToDay = useCallback((targetDay) => {
    if (!week || targetDay === selectedDay) return;
    if (!confirm(`Copy ${selectedDay}'s plan to ${targetDay}? This will overwrite the existing plan.`)) return;

    const newPlans = {
      ...practicePlans,
      [targetDay]: {
        ...currentPlan,
        id: `${weekId}-${targetDay}`,
        segments: currentPlan.segments.map(seg => ({
          ...seg,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }))
      }
    };

    updateWeek(weekId, { practicePlans: newPlans });
    // Navigate to the target day
    navigateToDay(targetDay);
  }, [week, weekId, practicePlans, selectedDay, currentPlan, updateWeek, navigateToDay]);

  if (!week) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Week not found</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-700 bg-slate-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Practice Plans</h1>
                <p className="text-sm text-slate-400">
                  {week.name}{week.opponent ? ` vs ${week.opponent}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setMode('plan')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === 'plan'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Plans
                </button>
                <button
                  onClick={() => setMode('script')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === 'script'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scripts
                </button>
              </div>

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 mt-4">
            {DAYS.map(day => {
              const dayPlan = practicePlans[day];
              const hasSegments = dayPlan?.segments?.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => navigateToDay(day)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    selectedDay === day
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {day.slice(0, 3)}
                  {hasSegments && (
                    <CheckCircle2 size={14} className={selectedDay === day ? 'text-sky-200' : 'text-emerald-400'} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {mode === 'plan' ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Plan Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800 rounded-lg">
              {/* Start Time */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-400">Start:</label>
                <input
                  type="time"
                  value={currentPlan.startTime || '15:30'}
                  onChange={e => updateCurrentPlan({ startTime: e.target.value })}
                  className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>

              {/* Transition Time */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-400">Trans:</label>
                <input
                  type="number"
                  value={currentPlan.transitionTime || 0}
                  onChange={e => updateCurrentPlan({ transitionTime: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-14 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                  min="0"
                />
                <span className="text-xs text-slate-500">min</span>
              </div>

              {/* Period Zero Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPlan.showPeriodZero !== false}
                  onChange={e => updateCurrentPlan({ showPeriodZero: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-700 text-sky-500"
                />
                <span className="text-sm font-medium text-slate-300">Period 0</span>
              </label>

              {/* 2-Platoon Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPlan.isTwoPlatoon || false}
                  onChange={e => updateCurrentPlan({ isTwoPlatoon: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-700 text-sky-500"
                />
                <span className="text-sm font-medium text-slate-300">2-Platoon</span>
              </label>

              {/* Staff Filter */}
              <div className="flex items-center gap-2 ml-auto">
                <select
                  value={coachFilter}
                  onChange={e => setCoachFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="ALL">All Staff</option>
                  {(staff || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Copy to Day */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm">
                  <Copy size={14} />
                  Copy to...
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-slate-700 rounded-lg shadow-xl border border-slate-600 py-1 z-10">
                  {DAYS.filter(d => d !== selectedDay).map(day => (
                    <button
                      key={day}
                      onClick={() => duplicatePlanToDay(day)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-600"
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Duration */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded">
                <Clock size={14} className="text-slate-400" />
                <span className="text-sm font-medium text-white">{totalDuration} min</span>
              </div>
            </div>

            {/* Pre-Practice Notes */}
            <div className="p-4 bg-slate-800 rounded-lg">
              <label className="block text-sm font-medium text-slate-300 mb-2">Pre-Practice Notes</label>
              <textarea
                value={currentPlan.prePracticeNotes || ''}
                onChange={e => updateCurrentPlan({ prePracticeNotes: e.target.value })}
                placeholder="Announcements, weather, focus points..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Segments Table */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-600 text-slate-400 text-xs uppercase">
                    <th className="px-3 py-3 text-center w-12">#</th>
                    <th className="px-3 py-3 text-center w-20">Time</th>
                    <th className="px-3 py-3 text-center w-16">Dur</th>
                    <th className="px-3 py-3 text-center w-16">Phase</th>
                    <th className="px-3 py-3 text-left w-36">Type</th>
                    {currentPlan.isTwoPlatoon ? (
                      <>
                        <th className="px-3 py-3 text-left">Offense Focus</th>
                        <th className="px-3 py-3 text-left">Defense Focus</th>
                      </>
                    ) : (
                      <th className="px-3 py-3 text-left">Focus</th>
                    )}
                    <th className="px-3 py-3 text-center w-28">Contact</th>
                    <th className="px-3 py-3 text-left w-40">Notes</th>
                    <th className="px-3 py-3 text-center w-20">Script</th>
                    <th className="px-3 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Warmup Row (Period 0) */}
                  {currentPlan.showPeriodZero !== false && (
                    <tr
                      className={`border-b border-slate-700 ${
                        selectedSegmentId === 'WARMUP' ? 'bg-sky-500/10' : 'bg-slate-800/50'
                      } cursor-pointer hover:bg-slate-700/50`}
                      onClick={() => setSelectedSegmentId('WARMUP')}
                    >
                      <td className="px-3 py-3 text-center">
                        <span className="text-sky-400 font-bold">0</span>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-300 text-sm">
                        {currentPlan.startTime ? (() => {
                          const [h, m] = currentPlan.startTime.split(':').map(Number);
                          const hours = h % 12 || 12;
                          return `${hours}:${m.toString().padStart(2, '0')}`;
                        })() : ''}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          value={currentPlan.warmupDuration || 0}
                          onChange={e => updateCurrentPlan({ warmupDuration: parseInt(e.target.value) || 0 })}
                          onClick={e => e.stopPropagation()}
                          className="w-14 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <select
                          value={currentPlan.warmupPhase || 'ALL'}
                          onChange={e => updateCurrentPlan({ warmupPhase: e.target.value })}
                          onClick={e => e.stopPropagation()}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                        >
                          {PHASES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-slate-400 italic text-sm">Warmup</td>
                      {currentPlan.isTwoPlatoon ? (
                        <>
                          <td className="px-3 py-3">
                            <select
                              value={currentPlan.warmupOffenseFocus || ''}
                              onChange={e => updateCurrentPlan({ warmupOffenseFocus: e.target.value })}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                            >
                              <option value="">-- Offense --</option>
                              {focusItems.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={currentPlan.warmupDefenseFocus || ''}
                              onChange={e => updateCurrentPlan({ warmupDefenseFocus: e.target.value })}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                            >
                              <option value="">-- Defense --</option>
                              {focusItems.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </td>
                        </>
                      ) : (
                        <td className="px-3 py-3">
                          <select
                            value={currentPlan.warmupSituation || ''}
                            onChange={e => updateCurrentPlan({ warmupSituation: e.target.value })}
                            onClick={e => e.stopPropagation()}
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                          >
                            <option value="">-- Select Focus --</option>
                            {focusItems.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="px-3 py-3 text-center">
                        <select
                          value={currentPlan.warmupContact || ''}
                          onChange={e => updateCurrentPlan({ warmupContact: e.target.value })}
                          onClick={e => e.stopPropagation()}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                        >
                          {CONTACT_LEVELS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesModalSegmentId('WARMUP');
                          }}
                          className={`w-full px-2 py-1.5 text-left text-sm rounded border transition-colors truncate ${
                            hasNotes(currentPlan.warmupNotes)
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-slate-700/50 border-slate-600 text-slate-500 italic'
                          }`}
                        >
                          {hasNotes(currentPlan.warmupNotes)
                            ? getNotesPreview(currentPlan.warmupNotes) || 'View notes...'
                            : 'Add notes...'}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={currentPlan.warmupHasScript || false}
                          onChange={e => updateCurrentPlan({ warmupHasScript: e.target.checked })}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-slate-600 bg-slate-700 text-sky-500"
                        />
                      </td>
                      <td className="px-3 py-3"></td>
                    </tr>
                  )}

                  {/* Segment Rows */}
                  {currentPlan.segments.map((seg, index) => (
                    <tr
                      key={seg.id}
                      className={`border-b border-slate-700 ${
                        selectedSegmentId === seg.id ? 'bg-sky-500/10' : ''
                      } cursor-pointer hover:bg-slate-700/50`}
                      onClick={() => setSelectedSegmentId(seg.id)}
                    >
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sky-400 font-bold">{index + 1}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addSegment(index);
                            }}
                            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-slate-600 rounded"
                            title="Insert segment below"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-300 text-sm">
                        {getSegmentStartTime(index)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          value={seg.duration || 0}
                          onChange={e => updateSegment(seg.id, 'duration', parseInt(e.target.value) || 0)}
                          onClick={e => e.stopPropagation()}
                          className="w-14 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <select
                          value={seg.phase || 'ALL'}
                          onChange={e => updateSegment(seg.id, 'phase', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                        >
                          {PHASES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={seg.type || ''}
                          onChange={e => updateSegment(seg.id, 'type', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        >
                          <option value="">-- Select Type --</option>
                          {segmentTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      {currentPlan.isTwoPlatoon ? (
                        <>
                          <td className="px-3 py-3">
                            <select
                              value={seg.offenseFocus || ''}
                              onChange={e => updateSegment(seg.id, 'offenseFocus', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                            >
                              <option value="">-- Offense --</option>
                              {focusItems.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={seg.defenseFocus || ''}
                              onChange={e => updateSegment(seg.id, 'defenseFocus', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                            >
                              <option value="">-- Defense --</option>
                              {focusItems.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </td>
                        </>
                      ) : (
                        <td className="px-3 py-3">
                          <select
                            value={seg.situation || ''}
                            onChange={e => updateSegment(seg.id, 'situation', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                          >
                            <option value="">-- Select Focus --</option>
                            {focusItems.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="px-3 py-3 text-center">
                        <select
                          value={seg.contact || ''}
                          onChange={e => updateSegment(seg.id, 'contact', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                        >
                          {CONTACT_LEVELS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesModalSegmentId(seg.id);
                          }}
                          className={`w-full px-2 py-1.5 text-left text-sm rounded border transition-colors truncate ${
                            hasNotes(seg.notes)
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-slate-700/50 border-slate-600 text-slate-500 italic'
                          }`}
                        >
                          {hasNotes(seg.notes)
                            ? getNotesPreview(seg.notes) || 'View notes...'
                            : 'Add notes...'}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={seg.hasScript || false}
                          onChange={e => updateSegment(seg.id, 'hasScript', e.target.checked)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-slate-600 bg-slate-700 text-sky-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSegment(seg.id);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-600 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Segment Button */}
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => addSegment()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors border-2 border-dashed border-slate-600"
                >
                  <Plus size={18} />
                  Add Segment
                </button>
              </div>
            </div>

            {/* Post-Practice Notes */}
            <div className="p-4 bg-slate-800 rounded-lg">
              <label className="block text-sm font-medium text-slate-300 mb-2">Post-Practice Notes</label>
              <textarea
                value={currentPlan.postPracticeNotes || ''}
                onChange={e => updateCurrentPlan({ postPracticeNotes: e.target.value })}
                placeholder="Post-practice thoughts, ideas for tomorrow, things that went well or need work..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        ) : (
          /* Script Mode */
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="text-center py-12">
                <FileText size={48} className="text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Script Builder</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Enable scripting for segments in the Plans tab, then return here to build out play-by-play scripts for each segment.
                </p>
                {currentPlan.segments.filter(s => s.hasScript).length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-emerald-400 text-sm">
                      {currentPlan.segments.filter(s => s.hasScript).length} segment(s) have scripting enabled
                    </p>
                    <p className="text-slate-500 text-xs">
                      Full script builder coming soon - for now, use the legacy app for detailed scripting.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {notesModalSegment && (
        <SegmentNotesModal
          segment={notesModalSegment}
          staff={staff}
          onUpdateNotes={handleNotesUpdate}
          onClose={() => setNotesModalSegmentId(null)}
        />
      )}
    </div>
  );
}
