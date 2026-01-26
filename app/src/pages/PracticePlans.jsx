import { useState, useMemo, useCallback, useRef } from 'react';
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
  StickyNote,
  Layers,
  Link2
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

// Map phase values to setup config keys
const PHASE_TO_CONFIG_KEY = {
  'O': 'O',
  'D': 'D',
  'K': 'K',
  'C': 'C',
  'ALL': null // ALL phase shows types from all phases
};

// Default segment types (fallback if setup is empty)
const DEFAULT_SEGMENT_TYPES = {
  O: [
    { id: 'default_team', name: 'Team', focusItems: [] },
    { id: 'default_indiv', name: 'Individual', focusItems: [] },
    { id: 'default_7on7', name: '7-on-7', focusItems: [] },
    { id: 'default_pass_skelly', name: 'Pass Skelly', focusItems: [] },
    { id: 'default_inside_run', name: 'Inside Run', focusItems: [] }
  ],
  D: [
    { id: 'default_team_d', name: 'Team', focusItems: [] },
    { id: 'default_indiv_d', name: 'Individual', focusItems: [] },
    { id: 'default_tackling', name: 'Tackling', focusItems: [] }
  ],
  K: [
    { id: 'default_kickoff', name: 'Kickoff', focusItems: [] },
    { id: 'default_punt', name: 'Punt', focusItems: [] },
    { id: 'default_fg_pat', name: 'FG/PAT', focusItems: [] }
  ],
  C: [
    { id: 'default_competition', name: 'Competition', focusItems: [] },
    { id: 'default_conditioning', name: 'Conditioning', focusItems: [] },
    { id: 'default_warmup', name: 'Warmup', focusItems: [] }
  ]
};

// Segment Notes Modal Component with @mention support
function SegmentNotesModal({ segment, staff, positionGroups, onUpdateNotes, onClose }) {
  const [noteText, setNoteText] = useState(segment.notes || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Build mention suggestions
  const mentionOptions = useMemo(() => {
    const options = [
      { type: 'special', value: '@all', label: '@all', description: 'Everyone' },
      { type: 'special', value: '@everybody', label: '@everybody', description: 'Everyone' },
    ];

    // Add position groups
    (positionGroups || []).forEach(pg => {
      options.push({
        type: 'group',
        value: `@${pg}`,
        label: `@${pg}`,
        description: 'Position Group'
      });
    });

    // Add individual staff
    (staff || []).forEach(s => {
      const name = s.name.replace(/\s+/g, '');
      options.push({
        type: 'person',
        value: `@${name}`,
        label: `@${s.name}`,
        description: s.role || s.positionGroup || ''
      });
    });

    return options;
  }, [staff, positionGroups]);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!suggestionFilter) return mentionOptions.slice(0, 8);
    const filter = suggestionFilter.toLowerCase();
    return mentionOptions
      .filter(opt =>
        opt.value.toLowerCase().includes(filter) ||
        opt.label.toLowerCase().includes(filter) ||
        opt.description.toLowerCase().includes(filter)
      )
      .slice(0, 8);
  }, [mentionOptions, suggestionFilter]);

  // Handle text change and detect @ mentions
  const handleTextChange = (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    setNoteText(text);
    setCursorPosition(cursor);

    // Check if we're typing an @mention
    const textBeforeCursor = text.substring(0, cursor);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowSuggestions(true);
      setSuggestionFilter(atMatch[1]);
    } else {
      setShowSuggestions(false);
      setSuggestionFilter('');
    }
  };

  // Insert mention at cursor position
  const insertMention = (mention) => {
    const textBeforeCursor = noteText.substring(0, cursorPosition);
    const textAfterCursor = noteText.substring(cursorPosition);

    // Find where the @ starts
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const newText = textBeforeCursor.substring(0, atIndex) + mention.value + ' ' + textAfterCursor;

    setNoteText(newText);
    setShowSuggestions(false);
    setSuggestionFilter('');

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = atIndex + mention.value.length + 1;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  // Save on close
  const handleSave = () => {
    onUpdateNotes(noteText);
    onClose();
  };

  // Render note text with highlighted mentions
  const renderHighlightedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="bg-sky-500/30 text-sky-300 px-1 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={handleSave}
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
            onClick={handleSave}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2">
              Type <span className="text-sky-400 font-mono">@</span> to mention coaches, position groups, or use <span className="text-sky-400 font-mono">@all</span> for everyone.
            </p>
          </div>

          {/* Note Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={noteText}
              onChange={handleTextChange}
              placeholder="Add notes... Use @name or @position to target specific coaches"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm resize-none font-mono"
              rows={6}
              autoFocus
            />

            {/* Mention Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-10">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.value}
                    onClick={() => insertMention(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-600 flex items-center justify-between"
                  >
                    <span className={`font-medium ${
                      suggestion.type === 'special' ? 'text-amber-400' :
                      suggestion.type === 'group' ? 'text-emerald-400' :
                      'text-sky-400'
                    }`}>
                      {suggestion.label}
                    </span>
                    <span className="text-xs text-slate-400">{suggestion.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {noteText && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Preview</p>
              <div className="px-4 py-3 bg-slate-900 rounded-lg text-sm text-slate-300 whitespace-pre-wrap">
                {renderHighlightedText(noteText)}
              </div>
            </div>
          )}

          {/* Quick Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Quick tags:</span>
            <button
              onClick={() => {
                setNoteText(prev => prev + '@all ');
                textareaRef.current?.focus();
              }}
              className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
            >
              @all
            </button>
            {(positionGroups || []).slice(0, 6).map(pg => (
              <button
                key={pg}
                onClick={() => {
                  setNoteText(prev => prev + `@${pg} `);
                  textareaRef.current?.focus();
                }}
                className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
              >
                @{pg}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}

// Print Settings Modal
function PrintSettingsModal({ staff, positionGroups, practicePlans, weekName, onClose }) {
  const [selectedCoach, setSelectedCoach] = useState('ALL');
  const [selectedDays, setSelectedDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true
  });

  const toggleDay = (day) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const selectAllDays = () => {
    setSelectedDays({
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true
    });
  };

  const selectedDaysCount = Object.values(selectedDays).filter(Boolean).length;

  const handlePrint = () => {
    // Store print settings in sessionStorage for the print view to read
    sessionStorage.setItem('printSettings', JSON.stringify({
      coachFilter: selectedCoach,
      days: selectedDays,
      weekName
    }));
    window.print();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Printer size={20} className="text-sky-400" />
            <h3 className="text-lg font-semibold text-white">Print Practice Plans</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Coach Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Print for Coach
            </label>
            <select
              value={selectedCoach}
              onChange={e => setSelectedCoach(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="ALL">All Staff (Master View)</option>
              <optgroup label="Position Groups">
                {(positionGroups || []).map(pg => (
                  <option key={pg} value={`group:${pg}`}>@{pg} - Position Group</option>
                ))}
              </optgroup>
              <optgroup label="Individual Coaches">
                {(staff || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {selectedCoach === 'ALL'
                ? 'Shows all notes and full details'
                : 'Shows @all notes plus notes mentioning this coach/group'}
            </p>
          </div>

          {/* Day Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Days to Print
              </label>
              <button
                onClick={selectAllDays}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                Select All
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {DAYS.map(day => {
                const hasPlan = practicePlans[day]?.segments?.length > 0;
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDays[day]
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    } ${!hasPlan ? 'opacity-50' : ''}`}
                  >
                    {day.slice(0, 3)}
                    {hasPlan && <span className="block text-xs opacity-75">{practicePlans[day].segments.length} seg</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-sm text-slate-400">
              <span className="text-white font-medium">{selectedDaysCount}</span> day(s) will be printed
              {selectedCoach !== 'ALL' && (
                <span> for <span className="text-sky-400">
                  {selectedCoach.startsWith('group:')
                    ? `@${selectedCoach.replace('group:', '')}`
                    : staff?.find(s => s.id === selectedCoach)?.name || selectedCoach}
                </span></span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={selectedDaysCount === 0}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

// Legacy notes modal component (keeping for reference, will be removed)
function LegacySegmentNotesModal({ segment, staff, onUpdateNotes, onClose }) {
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

// Segment Levels Selector - shows which program levels practice this segment together
function SegmentLevelsSelector({ segment, programLevels, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // Get current levels for this segment (default to 'all' if not set)
  const selectedLevels = segment.levels || ['all'];
  const isAllLevels = selectedLevels.includes('all') || selectedLevels.length === 0;

  const toggleLevel = (levelId) => {
    let newLevels;
    if (levelId === 'all') {
      newLevels = ['all'];
    } else {
      // Remove 'all' if selecting specific levels
      const current = selectedLevels.filter(l => l !== 'all');
      if (current.includes(levelId)) {
        newLevels = current.filter(l => l !== levelId);
      } else {
        newLevels = [...current, levelId];
      }
      // If no levels selected, default back to 'all'
      if (newLevels.length === 0) {
        newLevels = ['all'];
      }
    }
    onChange(newLevels);
  };

  // Get display text
  const getDisplayText = () => {
    if (isAllLevels) return 'All';
    const levelNames = selectedLevels
      .map(id => programLevels.find(l => l.id === id)?.name || id)
      .slice(0, 2);
    if (selectedLevels.length > 2) {
      return `${levelNames.join(', ')} +${selectedLevels.length - 2}`;
    }
    return levelNames.join(', ');
  };

  if (!programLevels || programLevels.length === 0) {
    return null; // Don't show if no program levels defined
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
          isAllLevels
            ? 'bg-slate-700/50 border-slate-600 text-slate-400'
            : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
        }`}
        title="Select which levels practice this segment"
      >
        <Layers size={12} />
        <span className="truncate max-w-[60px]">{getDisplayText()}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[140px]">
            <div className="p-2 space-y-1">
              {/* All Levels Option */}
              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllLevels}
                  onChange={() => toggleLevel('all')}
                  className="rounded border-slate-500 bg-slate-600 text-purple-500"
                />
                <span className="text-sm text-white font-medium">All Levels</span>
              </label>

              <div className="border-t border-slate-600 my-1" />

              {/* Varsity (always present) */}
              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isAllLevels && selectedLevels.includes('varsity')}
                  onChange={() => toggleLevel('varsity')}
                  disabled={isAllLevels}
                  className="rounded border-slate-500 bg-slate-600 text-purple-500 disabled:opacity-50"
                />
                <span className={`text-sm ${isAllLevels ? 'text-slate-500' : 'text-slate-300'}`}>Varsity</span>
              </label>

              {/* Program Levels */}
              {programLevels.map(level => (
                <label key={level.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!isAllLevels && selectedLevels.includes(level.id)}
                    onChange={() => toggleLevel(level.id)}
                    disabled={isAllLevels}
                    className="rounded border-slate-500 bg-slate-600 text-purple-500 disabled:opacity-50"
                  />
                  <span className={`text-sm ${isAllLevels ? 'text-slate-500' : 'text-slate-300'}`}>{level.name}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Save Template Modal
function SaveTemplateModal({ currentPlan, selectedDay, existingTemplates, onSave, onClose }) {
  const [templateName, setTemplateName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Get existing folders from templates
  const existingFolders = useMemo(() => {
    const folders = new Set();
    (existingTemplates || []).forEach(t => {
      if (t.folder) folders.add(t.folder);
    });
    return Array.from(folders).sort();
  }, [existingTemplates]);

  const handleSave = () => {
    const name = templateName.trim();
    if (!name) {
      alert('Please enter a template name');
      return;
    }

    const folder = isCreatingFolder ? newFolderName.trim() : selectedFolder;

    const template = {
      id: `template_${Date.now()}`,
      name,
      folder: folder || null,
      createdAt: new Date().toISOString(),
      dayOfWeek: selectedDay,
      startTime: currentPlan.startTime,
      warmupDuration: currentPlan.warmupDuration,
      transitionTime: currentPlan.transitionTime,
      showPeriodZero: currentPlan.showPeriodZero,
      isTwoPlatoon: currentPlan.isTwoPlatoon,
      segments: currentPlan.segments.map(seg => ({
        ...seg,
        id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New IDs for template
        notes: {} // Clear notes for template
      }))
    };

    onSave(template);
    onClose();
  };

  // Example names based on common patterns
  const nameSuggestions = [
    `${selectedDay}-Standard`,
    'Camp-Day1',
    'Preseason-Heavy',
    'GameWeek-Tuesday',
    'Spring-Install'
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <LayoutTemplate size={20} className="text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Save as Template</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Naming Tips */}
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-300 font-medium mb-2">Naming Tips</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use descriptive names that indicate the purpose or phase. Good examples:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {nameSuggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setTemplateName(s)}
                  className="px-2 py-1 text-xs bg-slate-600 text-slate-300 rounded hover:bg-slate-500 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">
              Pattern: [Phase/Event]-[Day/Focus] like "Camp-Monday" or "GameWeek-Install"
            </p>
          </div>

          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Template Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g., Camp-Monday, Preseason-Heavy"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              autoFocus
            />
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Folder (Optional)
            </label>

            {!isCreatingFolder ? (
              <div className="space-y-2">
                <select
                  value={selectedFolder}
                  onChange={e => setSelectedFolder(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">No folder</option>
                  {existingFolders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  + Create new folder
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="New folder name..."
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Cancel - use existing folder
                </button>
              </div>
            )}
          </div>

          {/* Template Preview */}
          <div className="p-3 bg-slate-900 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Template will include:</p>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• {currentPlan.segments?.length || 0} segments</li>
              <li>• Start time: {currentPlan.startTime || '3:30 PM'}</li>
              <li>• Warmup: {currentPlan.warmupDuration || 10} min</li>
              <li>• Transition: {currentPlan.transitionTime || 0} min between periods</li>
              {currentPlan.isTwoPlatoon && <li>• 2-Platoon mode enabled</li>}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!templateName.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PracticePlans() {
  const { year, phase, week: weekParam, day: dayParam, weekId: legacyWeekId } = useParams();
  const navigate = useNavigate();
  const { weeks, updateWeek, setupConfig, updateSetupConfig, staff, settings, activeLevelId } = useSchool();

  // Get program levels from setup config
  const programLevels = useMemo(() => {
    return setupConfig?.programLevels || [];
  }, [setupConfig]);

  // Check if we have multiple levels (show timer sync and level selectors)
  const hasMultipleLevels = programLevels.length > 0;

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
  const [notesModalSegmentId, setNotesModalSegmentId] = useState(null); // 'WARMUP' or segment.id
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

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

  // Get all segment types organized by phase from setup or use defaults
  const allSegmentTypes = useMemo(() => {
    const phaseTypes = setupConfig?.practiceSegmentTypes || {};
    // Merge with defaults for each phase
    const result = {};
    ['O', 'D', 'K', 'C'].forEach(phase => {
      const configTypes = phaseTypes[phase] || [];
      const defaultTypes = DEFAULT_SEGMENT_TYPES[phase] || [];
      // Use config types if available, otherwise defaults
      result[phase] = configTypes.length > 0 ? configTypes : defaultTypes;
    });
    return result;
  }, [setupConfig]);

  // Get segment types for a specific phase (or all phases if 'ALL')
  const getSegmentTypesForPhase = useCallback((phase) => {
    if (phase === 'ALL' || !phase) {
      // Combine all phases
      const allTypes = [];
      ['O', 'D', 'K', 'C'].forEach(p => {
        (allSegmentTypes[p] || []).forEach(t => allTypes.push(t));
      });
      return allTypes;
    }
    return allSegmentTypes[phase] || [];
  }, [allSegmentTypes]);

  // Get focus items for a specific segment type
  const getFocusItemsForType = useCallback((phase, typeName) => {
    const types = getSegmentTypesForPhase(phase);
    const segType = types.find(t => t.name === typeName);
    return segType?.focusItems || [];
  }, [getSegmentTypesForPhase]);

  // Get position groups from setup
  const positionGroups = useMemo(() => {
    const groups = new Set();
    // Collect from all phases
    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = setupConfig?.positionGroups?.[phase] || [];
      phaseGroups.forEach(g => groups.add(g.name || g));
    });
    // Also collect from staff position assignments
    (staff || []).forEach(s => {
      if (s.positionGroup) groups.add(s.positionGroup);
    });
    return Array.from(groups).sort();
  }, [setupConfig, staff]);

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

  // Helper to check if segment has any notes (now works with string)
  const hasNotes = useCallback((notes) => {
    // Support both old object format and new string format
    if (!notes) return false;
    if (typeof notes === 'string') return notes.trim() !== '';
    if (typeof notes === 'object') {
      return Object.values(notes).some(v => v && v.trim() !== '');
    }
    return false;
  }, []);

  // Get preview text for notes button (now works with string)
  const getNotesPreview = useCallback((notes) => {
    if (!notes) return null;
    // New string format
    if (typeof notes === 'string') {
      const preview = notes.substring(0, 50);
      return notes.length > 50 ? preview + '...' : preview;
    }
    // Legacy object format
    if (typeof notes === 'object') {
      const allNotes = notes['ALL_COACHES'];
      if (allNotes) return allNotes.substring(0, 50);
      const firstNote = Object.values(notes).find(v => v && v.trim() !== '');
      return firstNote ? firstNote.substring(0, 50) : null;
    }
    return null;
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

  // Save current plan as template
  const saveAsTemplate = useCallback(async (template) => {
    const existingTemplates = setupConfig?.practiceTemplates || [];
    const newTemplates = [...existingTemplates, template];
    await updateSetupConfig({ practiceTemplates: newTemplates });
  }, [setupConfig, updateSetupConfig]);

  // Get existing templates for the modal
  const existingTemplates = setupConfig?.practiceTemplates || [];

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
                onClick={() => setShowPrintModal(true)}
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
              {/* Timer Source (only show if multiple levels exist) */}
              {hasMultipleLevels && (
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-slate-400" />
                  <select
                    value={currentPlan.timerSource || 'own'}
                    onChange={e => updateCurrentPlan({ timerSource: e.target.value })}
                    className={`px-2 py-1 border rounded text-sm ${
                      currentPlan.timerSource && currentPlan.timerSource !== 'own'
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                        : 'bg-slate-700 border-slate-600 text-white'
                    }`}
                  >
                    <option value="own">Own Timer</option>
                    <option value="varsity">Sync with Varsity</option>
                    {programLevels.map(level => (
                      <option key={level.id} value={level.id}>Sync with {level.name}</option>
                    ))}
                  </select>
                  {currentPlan.timerSource && currentPlan.timerSource !== 'own' && (
                    <span className="text-xs text-purple-400">Timer controlled by {
                      currentPlan.timerSource === 'varsity'
                        ? 'Varsity'
                        : programLevels.find(l => l.id === currentPlan.timerSource)?.name || currentPlan.timerSource
                    }</span>
                  )}
                </div>
              )}

              {/* Start Time */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-400">Start:</label>
                <input
                  type="time"
                  value={currentPlan.startTime || '15:30'}
                  onChange={e => updateCurrentPlan({ startTime: e.target.value })}
                  className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  disabled={currentPlan.timerSource && currentPlan.timerSource !== 'own'}
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

              {/* Save as Template */}
              <button
                onClick={() => setShowSaveTemplateModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded hover:bg-emerald-600/30 text-sm"
              >
                <LayoutTemplate size={14} />
                Save Template
              </button>

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
                    {hasMultipleLevels && <th className="px-3 py-3 text-center w-20">Levels</th>}
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
                      {hasMultipleLevels && (
                        <td className="px-3 py-3 text-center">
                          <SegmentLevelsSelector
                            segment={{ id: 'warmup', levels: currentPlan.warmupLevels }}
                            programLevels={programLevels}
                            onChange={(levels) => updateCurrentPlan({ warmupLevels: levels })}
                          />
                        </td>
                      )}
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
                              {getFocusItemsForType('O', currentPlan.warmupType).map(f => (
                                <option key={f.id || f.name} value={f.name}>{f.name}</option>
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
                              {getFocusItemsForType('D', currentPlan.warmupType).map(f => (
                                <option key={f.id || f.name} value={f.name}>{f.name}</option>
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
                            {getFocusItemsForType('C', currentPlan.warmupType).map(f => (
                              <option key={f.id || f.name} value={f.name}>{f.name}</option>
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
                      {hasMultipleLevels && (
                        <td className="px-3 py-3 text-center">
                          <SegmentLevelsSelector
                            segment={seg}
                            programLevels={programLevels}
                            onChange={(levels) => updateSegment(seg.id, 'levels', levels)}
                          />
                        </td>
                      )}
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
                          {getSegmentTypesForPhase(seg.phase).map(t => (
                            <option key={t.id || t.name} value={t.name}>{t.name}</option>
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
                              {getFocusItemsForType('O', seg.type).map(f => (
                                <option key={f.id || f.name} value={f.name}>{f.name}</option>
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
                              {getFocusItemsForType('D', seg.type).map(f => (
                                <option key={f.id || f.name} value={f.name}>{f.name}</option>
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
                            {getFocusItemsForType(seg.phase, seg.type).map(f => (
                              <option key={f.id || f.name} value={f.name}>{f.name}</option>
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
          positionGroups={positionGroups}
          onUpdateNotes={handleNotesUpdate}
          onClose={() => setNotesModalSegmentId(null)}
        />
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <PrintSettingsModal
          staff={staff}
          positionGroups={positionGroups}
          practicePlans={practicePlans}
          weekName={week?.name || ''}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          currentPlan={currentPlan}
          selectedDay={selectedDay}
          existingTemplates={existingTemplates}
          onSave={saveAsTemplate}
          onClose={() => setShowSaveTemplateModal(false)}
        />
      )}
    </div>
  );
}
