import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { usePlayBank } from '../context/PlayBankContext';
import { getWristbandDisplay } from '../utils/wristband';
import { getPlayCall } from '../utils/playDisplay';
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
  LayoutTemplate,
  GripVertical,
  Settings,
  CheckCircle2,
  X,
  MessageSquare,
  StickyNote,
  Layers,
  Link2,
  CheckSquare,
  Square,
  ExternalLink,
  HelpCircle,
  Check
} from 'lucide-react';

// Days of the week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Short day abbreviations
const DAY_ABBREV = {
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'W',
  Thursday: 'TH',
  Friday: 'F'
};

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

// Map segment phase to setupConfig phase
const SEGMENT_PHASE_TO_SETUP_PHASE = {
  'O': 'OFFENSE',
  'D': 'DEFENSE',
  'K': 'SPECIAL_TEAMS',
  'C': null, // Competition doesn't map to setup
  'ALL': null
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

// Hash patterns for script rows (alternating L to R)
const HASH_PATTERN_A = ['L', 'LM', 'M', 'RM', 'R', 'RM', 'M', 'LM'];
const HASH_PATTERN_B = ['R', 'RM', 'M', 'LM', 'L', 'LM', 'M', 'RM'];

// Create a script row with hash based on index
const createScriptRow = (index, pattern = HASH_PATTERN_A) => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  playId: '',
  playName: '',
  hash: pattern[index % 8],
  dn: '',
  dist: '',
  situation: '',
  defense: '',
  notes: ''
});

// Generate script rows based on segment duration (~1.6 plays per minute)
const generateScriptRows = (duration, existingScript = []) => {
  const targetCount = Math.round((parseInt(duration) || 0) * 1.6) || 8;

  // Determine pattern based on first row or default
  let pattern = HASH_PATTERN_A;
  if (existingScript.length > 0 && existingScript[0]?.hash === 'R') {
    pattern = HASH_PATTERN_B;
  }

  // Keep existing rows and add more if needed
  const currentRows = [...existingScript];
  const needed = targetCount - currentRows.length;

  if (needed <= 0) return currentRows;

  for (let i = 0; i < needed; i++) {
    currentRows.push(createScriptRow(currentRows.length, pattern));
  }

  return currentRows;
};

// Play Call Autocomplete Input Component
function PlayCallAutocomplete({ id, value, playId, plays, onSelectPlay, onChangeText, onClear, placeholder = "Play Call..." }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter plays based on input
  const filteredPlays = useMemo(() => {
    if (!inputValue || inputValue.length < 1) return [];
    const search = inputValue.toLowerCase();
    return plays.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.formation?.toLowerCase().includes(search)
    ).slice(0, 8);
  }, [inputValue, plays]);

  // Handle input change
  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setShowDropdown(val.length > 0);
    setFocusedIndex(-1);
    onChangeText(val);
  };

  // Handle play selection
  const handleSelect = (play) => {
    setInputValue(getPlayCall(play));
    setShowDropdown(false);
    onSelectPlay(play);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredPlays.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, filteredPlays.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredPlays[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Sync external value changes
  useEffect(() => {
    if (playId) {
      const play = plays.find(p => p.id === playId);
      if (play) setInputValue(getPlayCall(play));
    } else {
      setInputValue(value || '');
    }
  }, [value, playId, plays]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs placeholder-slate-500"
          aria-label="Play call"
        />
        {(inputValue || playId) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInputValue('');
              setShowDropdown(false);
              onClear();
            }}
            className="p-0.5 text-slate-500 hover:text-red-400"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && filteredPlays.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredPlays.map((play, idx) => (
            <button
              key={play.id}
              onClick={() => handleSelect(play)}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700 ${idx === focusedIndex ? 'bg-slate-700' : ''
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{getPlayCall(play)}</span>
                {getWristbandDisplay(play) && (
                  <span className="text-xs font-bold text-sky-300 bg-sky-900/50 px-1 py-0.5 rounded">
                    {getWristbandDisplay(play)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      // Support both old positionGroup (string) and new positionGroups (array)
      const posGroupDisplay = s.positionGroups?.length > 0
        ? s.positionGroups.join(', ')
        : s.positionGroup || '';
      options.push({
        type: 'person',
        value: `@${name}`,
        label: `@${s.name}`,
        description: s.role || posGroupDisplay
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
              id="segment-notes-text"
              ref={textareaRef}
              value={noteText}
              onChange={handleTextChange}
              placeholder="Add notes... Use @name or @position to target specific coaches"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm resize-none font-mono"
              rows={6}
              autoFocus
              aria-label="Segment notes"
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
                    <span className={`font-medium ${suggestion.type === 'special' ? 'text-amber-400' :
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

// Focus Multi-Select Component
// If segmentTypeFocusItems is provided (from Setup → Segment Focus), use those
// Otherwise, auto-populate from setupConfig
function FocusMultiSelect({
  phase,
  segmentType,
  selectedFocuses = [],
  onChange,
  setupConfig,
  isLight = false,
  placeholder = "Select Focus..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef(null);
  const customInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the segment type's configured focus items (if any)
  const segmentTypeFocusItems = useMemo(() => {
    if (!segmentType || !setupConfig?.practiceSegmentTypes) return [];
    const phaseTypes = setupConfig.practiceSegmentTypes[phase] || [];
    const typeConfig = phaseTypes.find(t => t.name === segmentType);
    return typeConfig?.focusItems || [];
  }, [phase, segmentType, setupConfig]);

  // Map source names to display categories
  const SOURCE_TO_CATEGORY = {
    'formations': 'Formations',
    'playBuckets': 'Play Buckets',
    'conceptGroups': 'Concept Groups',
    'readTypes': 'Read Types',
    'lookAlikeSeries': 'Series',
    'fieldZones': 'Situations',
    'specialSituations': 'Situations',
    'shiftMotions': 'Shifts/Motions',
    'qcPlayPurposes': 'QC Purposes',
    'custom': 'Custom'
  };

  // Get all focus options grouped by category for this phase
  const focusGroups = useMemo(() => {
    // If segment type has configured focus items, use those
    if (segmentTypeFocusItems.length > 0) {
      const groups = {};
      segmentTypeFocusItems.forEach(item => {
        const category = SOURCE_TO_CATEGORY[item.source] || item.source || 'Other';
        if (!groups[category]) groups[category] = [];
        groups[category].push({
          id: item.id,
          name: item.name,
          category: category,
          source: item.source
        });
      });
      return Object.entries(groups).map(([category, items]) => ({ category, items }));
    }

    // Otherwise, auto-populate from setupConfig
    const setupPhase = SEGMENT_PHASE_TO_SETUP_PHASE[phase];
    const groups = [];

    // Formations - filtered by phase
    const formations = (setupConfig?.formations || [])
      .filter(f => f.phase === setupPhase)
      .map(f => ({ id: f.id, name: f.name, category: 'Formations' }));
    if (formations.length > 0) {
      groups.push({ category: 'Formations', items: formations });
    }

    // Play Buckets - filtered by phase
    const playBuckets = (setupConfig?.playBuckets || [])
      .filter(b => b.phase === setupPhase)
      .map(b => ({ id: b.id, name: b.label || b.name, category: 'Play Buckets' }));
    if (playBuckets.length > 0) {
      groups.push({ category: 'Play Buckets', items: playBuckets });
    }

    // Offense-only categories
    if (phase === 'O') {
      // Concept Groups
      const conceptGroups = (setupConfig?.conceptGroups || [])
        .map(c => ({ id: c.id, name: c.label || c.name, category: 'Concept Groups' }));
      if (conceptGroups.length > 0) {
        groups.push({ category: 'Concept Groups', items: conceptGroups });
      }

      // Read Types
      const readTypes = (setupConfig?.readTypes || [])
        .map(r => ({ id: r.id, name: r.name, category: 'Read Types' }));
      if (readTypes.length > 0) {
        groups.push({ category: 'Read Types', items: readTypes });
      }

      // Look-Alike Series
      const lookAlikeSeries = (setupConfig?.lookAlikeSeries || [])
        .map(s => ({ id: s.id, name: s.name, category: 'Series' }));
      if (lookAlikeSeries.length > 0) {
        groups.push({ category: 'Series', items: lookAlikeSeries });
      }

      // Situations (combines fieldZones and specialSituations)
      const situations = [
        ...(setupConfig?.fieldZones || []).map(f => ({ id: f.id, name: f.name, category: 'Situations' })),
        ...(setupConfig?.specialSituations || []).map(s => ({ id: s.id, name: s.name, category: 'Situations' }))
      ];
      if (situations.length > 0) {
        groups.push({ category: 'Situations', items: situations });
      }
    }

    return groups;
  }, [phase, segmentType, segmentTypeFocusItems, setupConfig]);

  // Check if an item is selected
  const isSelected = (category, id) => {
    return selectedFocuses.some(f => f.category === category && f.id === id);
  };

  // Toggle item selection
  const toggleItem = (item) => {
    const exists = selectedFocuses.some(f => f.category === item.category && f.id === item.id);
    if (exists) {
      onChange(selectedFocuses.filter(f => !(f.category === item.category && f.id === item.id)));
    } else {
      onChange([...selectedFocuses, item]);
    }
  };

  // Clear all
  const clearAll = () => {
    onChange([]);
  };

  // Add custom focus
  const addCustomFocus = () => {
    if (customInput.trim()) {
      const customItem = {
        id: `custom_${Date.now()}`,
        name: customInput.trim(),
        category: 'Custom'
      };
      onChange([...selectedFocuses, customItem]);
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  // Get display text for button
  const getButtonText = () => {
    if (selectedFocuses.length === 0) return placeholder;
    if (selectedFocuses.length === 1) return selectedFocuses[0].name;
    return `${selectedFocuses.length} selected`;
  };

  // Check if there are any options available (always show since we have custom option)
  const hasOptions = focusGroups.some(g => g.items.length > 0) || phase === 'O' || phase === 'D' || phase === 'K';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full h-7 px-2 border rounded text-xs text-left flex items-center justify-between ${
          isLight
            ? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
        } ${selectedFocuses.length > 0 ? 'ring-1 ring-sky-500/50' : ''}`}
      >
        <span className={`truncate ${selectedFocuses.length === 0 ? (isLight ? 'text-gray-400' : 'text-slate-400') : ''}`}>
          {getButtonText()}
        </span>
        <ChevronDown size={12} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 mt-1 rounded-lg shadow-xl border max-h-64 overflow-y-auto ${
          isLight
            ? 'bg-white border-gray-200'
            : 'bg-slate-800 border-slate-600'
        }`}
        style={{ minWidth: '220px' }}
        >
          {/* Header with Clear All */}
          {selectedFocuses.length > 0 && (
            <div className={`sticky top-0 px-3 py-2 border-b flex items-center justify-between ${
              isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-700 border-slate-600'
            }`}>
              <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                {selectedFocuses.length} selected
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Grouped Options */}
          {focusGroups.map((group, groupIdx) => (
            <div key={group.category}>
              {/* Category Header */}
              <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                isLight
                  ? 'bg-gray-100 text-gray-500 border-y border-gray-200'
                  : 'bg-slate-700/50 text-slate-400 border-y border-slate-600'
              } ${groupIdx === 0 && selectedFocuses.length === 0 ? 'border-t-0' : ''}`}>
                {group.category}
              </div>
              {/* Items */}
              {group.items.map(item => (
                <button
                  key={`${item.category}-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                    isLight
                      ? 'hover:bg-gray-100'
                      : 'hover:bg-slate-700'
                  } ${isSelected(item.category, item.id) ? (isLight ? 'bg-sky-50' : 'bg-sky-900/30') : ''}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    isSelected(item.category, item.id)
                      ? 'bg-sky-500 border-sky-500 text-white'
                      : isLight ? 'border-gray-300' : 'border-slate-500'
                  }`}>
                    {isSelected(item.category, item.id) && <Check size={10} />}
                  </div>
                  <span className={isLight ? 'text-gray-700' : 'text-slate-200'}>{item.name}</span>
                </button>
              ))}
            </div>
          ))}

          {/* Custom Focus Section */}
          <div>
            <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
              isLight
                ? 'bg-gray-100 text-gray-500 border-y border-gray-200'
                : 'bg-slate-700/50 text-slate-400 border-y border-slate-600'
            }`}>
              Custom
            </div>
            {/* Show existing custom focuses */}
            {selectedFocuses.filter(f => f.category === 'Custom').map(item => (
              <button
                key={`${item.category}-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                  isLight ? 'hover:bg-gray-100 bg-sky-50' : 'hover:bg-slate-700 bg-sky-900/30'
                }`}
              >
                <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 bg-sky-500 border-sky-500 text-white">
                  <Check size={10} />
                </div>
                <span className={isLight ? 'text-gray-700' : 'text-slate-200'}>{item.name}</span>
              </button>
            ))}
            {/* Add custom input */}
            {showCustomInput ? (
              <div className="px-3 py-2 flex items-center gap-2">
                <input
                  ref={customInputRef}
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomFocus();
                    } else if (e.key === 'Escape') {
                      setShowCustomInput(false);
                      setCustomInput('');
                    }
                  }}
                  placeholder="Enter custom focus..."
                  className={`flex-1 px-2 py-1 text-xs rounded border ${
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-slate-700 border-slate-600 text-white'
                  }`}
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addCustomFocus();
                  }}
                  className="p-1 text-emerald-500 hover:text-emerald-400"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCustomInput(false);
                    setCustomInput('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCustomInput(true);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                  isLight ? 'hover:bg-gray-100 text-sky-600' : 'hover:bg-slate-700 text-sky-400'
                }`}
              >
                <Plus size={14} />
                <span>Add custom focus...</span>
              </button>
            )}
          </div>
        </div>
      )}
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
            <h3 className="text-lg font-semibold text-white">Print Practice Planner</h3>
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
            <label htmlFor="print-coach-filter" className="block text-sm font-medium text-slate-300 mb-2">
              Print for Coach
            </label>
            <select
              id="print-coach-filter"
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
              <span className="text-sm font-medium text-slate-300">
                Days to Print
              </span>
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
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDays[day]
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      } ${!hasPlan ? 'opacity-50' : ''}`}
                  >
                    {DAY_ABBREV[day]}
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

        {/* Print Center Link */}
        <div className="px-6 pb-2">
          <Link
            to="/print?template=practice_plan"
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm"
          >
            <ExternalLink size={14} />
            Open in Print Center for more options
          </Link>
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
                  <label htmlFor="legacy-notes-all-coaches" className="font-bold text-amber-400">ALL COACHES</label>
                </td>
                <td className="px-4 py-3">
                  <textarea
                    id="legacy-notes-all-coaches"
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
                        <label htmlFor={`legacy-notes-coach-${coach.id}`} className="font-medium text-slate-200">{coach.name}</label>
                        {/* Support both old positionGroup (string) and new positionGroups (array) */}
                        {(coach.positionGroups?.length > 0 || coach.positionGroup) && (
                          <span className="ml-2 text-xs text-slate-500">
                            ({coach.positionGroups?.length > 0 ? coach.positionGroups.join(', ') : coach.positionGroup})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          id={`legacy-notes-coach-${coach.id}`}
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
                        <label htmlFor={`legacy-notes-staff-${person.id}`} className="font-medium text-slate-200">{person.name}</label>
                        {person.role && (
                          <span className="ml-2 text-xs text-slate-500">({person.role})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          id={`legacy-notes-staff-${person.id}`}
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
      .map(id => {
        if (id === 'varsity') return 'Varsity';
        return programLevels.find(l => l.id === id)?.name || id;
      })
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
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${isAllLevels
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
              <label htmlFor={`segment-level-all-${segment.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-600 cursor-pointer">
                <input
                  id={`segment-level-all-${segment.id}`}
                  type="checkbox"
                  checked={isAllLevels}
                  onChange={() => toggleLevel('all')}
                  className="rounded border-slate-500 bg-slate-600 text-purple-500"
                />
                <span className="text-sm text-white font-medium">All Levels</span>
              </label>

              <div className="border-t border-slate-600 my-1" />

              {/* Varsity (always present) */}
              <label htmlFor={`segment-level-varsity-${segment.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-600 cursor-pointer">
                <input
                  id={`segment-level-varsity-${segment.id}`}
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
                <label key={level.id} htmlFor={`segment-level-${level.id}-${segment.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-600 cursor-pointer">
                  <input
                    id={`segment-level-${level.id}-${segment.id}`}
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
            <label htmlFor="template-name" className="block text-sm font-medium text-slate-300 mb-2">
              Template Name <span className="text-red-400">*</span>
            </label>
            <input
              id="template-name"
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
            <label htmlFor="template-folder" className="block text-sm font-medium text-slate-300 mb-2">
              Folder (Optional)
            </label>

            {!isCreatingFolder ? (
              <div className="space-y-2">
                <select
                  id="template-folder"
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
                  id="template-new-folder"
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

// Import Template Modal
function ImportTemplateModal({ existingTemplates, onImport, onClose }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('all');

  // Group templates by folder
  const folders = useMemo(() => {
    const folderSet = new Set();
    (existingTemplates || []).forEach(t => {
      if (t.folder) folderSet.add(t.folder);
    });
    return Array.from(folderSet).sort();
  }, [existingTemplates]);

  // Filter templates by selected folder
  const filteredTemplates = useMemo(() => {
    if (selectedFolder === 'all') return existingTemplates || [];
    return (existingTemplates || []).filter(t => t.folder === selectedFolder);
  }, [existingTemplates, selectedFolder]);

  const selectedTemplate = (existingTemplates || []).find(t => t.id === selectedTemplateId);

  const handleImport = () => {
    if (!selectedTemplate) return;
    onImport(selectedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <LayoutTemplate size={20} className="text-sky-400" />
            <h3 className="text-lg font-semibold text-white">Import Template</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {existingTemplates?.length === 0 ? (
            <div className="text-center py-8">
              <LayoutTemplate size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No templates saved yet.</p>
              <p className="text-slate-500 text-sm mt-1">Create templates by clicking "Save Template" on a practice plan.</p>
            </div>
          ) : (
            <>
              {/* Folder Filter */}
              {folders.length > 0 && (
                <div>
                  <label htmlFor="import-template-folder" className="text-xs text-slate-500 uppercase tracking-wide">Folder</label>
                  <select
                    id="import-template-folder"
                    value={selectedFolder}
                    onChange={e => { setSelectedFolder(e.target.value); setSelectedTemplateId(null); }}
                    className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="all">All Templates</option>
                    {folders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Template List */}
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Select Template</span>
                <div className="mt-1 space-y-2 max-h-48 overflow-y-auto">
                  {filteredTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${selectedTemplateId === template.id
                        ? 'bg-sky-500/20 border-sky-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {template.segments?.length || 0} segments • {template.folder || 'No folder'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div className="p-3 bg-slate-900 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Template Preview</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• {selectedTemplate.segments?.length || 0} segments</li>
                    <li>• Start time: {selectedTemplate.startTime || '3:30 PM'}</li>
                    <li>• Warmup: {selectedTemplate.warmupDuration || 10} min</li>
                    <li>• Transition: {selectedTemplate.transitionTime || 0} min</li>
                    {selectedTemplate.isTwoPlatoon && <li>• 2-Platoon mode</li>}
                  </ul>
                </div>
              )}
            </>
          )}
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
            onClick={handleImport}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <LayoutTemplate size={16} />
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PracticePlans() {
  const { year, phase, week: weekParam, day: dayParam, weekId: legacyWeekId } = useParams();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view'); // 'script' or null
  const navigate = useNavigate();
  const { weeks, updateWeek, setupConfig, updateSetupConfig, staff, settings, activeLevelId, playsArray, plays } = useSchool();
  const { startBatchSelect, quickAddRequest, setHighlightFocuses } = usePlayBank();

  // Theme detection
  const theme = settings?.theme || 'dark';
  const isLight = theme === 'light';

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
    // New URL format: /planner/:year/:phase/:week
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
  const [mode, setMode] = useState(viewParam === 'script' ? 'script' : 'plan'); // 'plan' or 'script'

  // Sync mode with URL parameter when it changes
  useEffect(() => {
    if (viewParam === 'script') {
      setMode('script');
    }
  }, [viewParam]);

  const [coachFilter, setCoachFilter] = useState('ALL');
  const [notesModalSegmentId, setNotesModalSegmentId] = useState(null); // 'WARMUP' or segment.id
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showImportTemplateModal, setShowImportTemplateModal] = useState(false);
  const [showPlanHelp, setShowPlanHelp] = useState(false);
  const [viewingLevelId, setViewingLevelId] = useState(null); // For Program view to see other levels
  const [showPlaySelector, setShowPlaySelector] = useState(false);
  const [activeScriptSegmentId, setActiveScriptSegmentId] = useState(null);
  const [activeScriptRowId, setActiveScriptRowId] = useState(null);
  const [playSearchTerm, setPlaySearchTerm] = useState('');
  const [playFilterPhase, setPlayFilterPhase] = useState('OFFENSE');

  // Stamping Mode State
  const [stagedPlay, setStagedPlay] = useState(null);
  const lastQuickAddRef = useRef(0);

  // Handle Quick Add Request -> Stamping Mode
  useEffect(() => {
    if (quickAddRequest && quickAddRequest.timestamp > lastQuickAddRef.current) {
      lastQuickAddRef.current = quickAddRequest.timestamp;
      if (mode === 'script' || selectedSegmentId) {
        const play = plays?.[quickAddRequest.playId];
        if (play) {
          setStagedPlay(play);
        }
      }
    }
  }, [quickAddRequest, plays, mode, selectedSegmentId]);

  // Clear staged play on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setStagedPlay(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          transitionSeconds: 0,
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
    transitionSeconds: 0,
    showPeriodZero: true,
    isTwoPlatoon: false,
    prePracticeNotes: '',
    segments: []
  };

  // Update PlayBank highlight focuses when in Script mode
  // Collect all focuses from segments with scripts enabled
  useEffect(() => {
    if (mode === 'script' && currentPlan?.segments) {
      const allFocuses = [];
      currentPlan.segments
        .filter(seg => seg.hasScript)
        .forEach(seg => {
          // Single column mode focuses
          if (seg.focuses && seg.focuses.length > 0) {
            allFocuses.push(...seg.focuses);
          }
          // 2-platoon mode focuses
          if (seg.offenseFocuses && seg.offenseFocuses.length > 0) {
            allFocuses.push(...seg.offenseFocuses);
          }
          if (seg.defenseFocuses && seg.defenseFocuses.length > 0) {
            allFocuses.push(...seg.defenseFocuses);
          }
        });
      // Deduplicate by category+id
      const unique = allFocuses.filter((f, i, arr) =>
        arr.findIndex(x => x.category === f.category && x.id === f.id) === i
      );
      setHighlightFocuses(unique);
    } else {
      // Clear highlights when not in script mode
      setHighlightFocuses([]);
    }
    // Cleanup on unmount
    return () => setHighlightFocuses([]);
  }, [mode, currentPlan?.segments, setHighlightFocuses]);

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

  // Get position groups from setup (use abbreviations for @mentions)
  const positionGroups = useMemo(() => {
    const groups = new Set();
    // Collect from all phases - prefer abbrev over name
    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = setupConfig?.positionGroups?.[phase] || [];
      phaseGroups.forEach(g => {
        // Use abbreviation if available, otherwise name
        const groupLabel = g.abbrev || g.name || g;
        groups.add(groupLabel);
      });
    });
    // Also collect from staff position assignments (support both old and new format)
    (staff || []).forEach(s => {
      // Handle new positionGroups array
      if (s.positionGroups?.length > 0) {
        s.positionGroups.forEach(pg => groups.add(pg));
      }
      // Handle old positionGroup string
      if (s.positionGroup) groups.add(s.positionGroup);
    });
    return Array.from(groups).sort();
  }, [setupConfig, staff]);

  // Calculate segment start times
  const getSegmentStartTime = useCallback((index) => {
    if (!currentPlan.startTime) return '';

    const [startH, startM] = currentPlan.startTime.split(':').map(Number);
    const warmup = parseInt(currentPlan.warmupDuration) || 0;
    const transitionMin = parseInt(currentPlan.transitionTime) || 0;
    const transitionSec = parseInt(currentPlan.transitionSeconds) || 0;
    const transition = transitionMin + (transitionSec / 60);

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
    const transitionMin = parseInt(currentPlan.transitionTime) || 0;
    const transitionSec = parseInt(currentPlan.transitionSeconds) || 0;
    const transitionTotal = transitionMin + (transitionSec / 60);
    const segmentTotal = currentPlan.segments.reduce((sum, seg) => sum + (parseInt(seg.duration) || 0), 0);
    const transitions = Math.max(0, currentPlan.segments.length - 1) * transitionTotal;
    return Math.round(warmup + segmentTotal + transitions);
  }, [currentPlan]);

  // Calculate end time based on start time and total duration
  const endTime = useMemo(() => {
    const startTimeStr = currentPlan.startTime || '15:30';
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + totalDuration;
    const endHours24 = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    // Convert to 12-hour format
    const period = endHours24 >= 12 ? 'PM' : 'AM';
    const endHours12 = endHours24 % 12 || 12;
    return `${endHours12}:${endMins.toString().padStart(2, '0')} ${period}`;
  }, [currentPlan.startTime, totalDuration]);

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

  // Get play by ID
  const getPlay = useCallback((playId) => plays[playId], [plays]);

  // Update a specific script row
  const updateScriptRow = useCallback((segmentId, rowId, field, value) => {
    const segment = currentPlan.segments.find(s => s.id === segmentId);
    if (!segment?.script) return;

    const newScript = segment.script.map(row =>
      row.id === rowId ? { ...row, [field]: value } : row
    );
    updateSegment(segmentId, 'script', newScript);
  }, [currentPlan, updateSegment]);

  // Update multiple fields in a script row atomically
  const updateScriptRowFields = useCallback((segmentId, rowId, updates) => {
    const segment = currentPlan.segments.find(s => s.id === segmentId);
    if (!segment?.script) return;

    const newScript = segment.script.map(row =>
      row.id === rowId ? { ...row, ...updates } : row
    );
    updateSegment(segmentId, 'script', newScript);
  }, [currentPlan, updateSegment]);

  // Format Play Call string (Wristband Formation Name)
  const formatPlayCall = useCallback((play) => {
    if (!play) return '';

    const parts = [];
    const wb = getWristbandDisplay(play);
    if (wb) parts.push(wb);

    // Check multiple properties for formation
    const formation = play.formation || play.formationId || play.front;
    if (formation) parts.push(formation.toUpperCase());

    parts.push(play.name);
    return parts.join(' ');
  }, []);

  // Add a script row to a segment
  const addScriptRow = useCallback((segmentId) => {
    const segment = currentPlan.segments.find(s => s.id === segmentId);
    if (!segment) return;

    const script = segment.script || [];
    const newRow = createScriptRow(script.length);
    updateSegment(segmentId, 'script', [...script, newRow]);
  }, [currentPlan, updateSegment]);

  // Delete a script row
  const deleteScriptRow = useCallback((segmentId, rowId) => {
    const segment = currentPlan.segments.find(s => s.id === segmentId);
    if (!segment?.script) return;

    const newScript = segment.script.filter(row => row.id !== rowId);
    updateSegment(segmentId, 'script', newScript);
  }, [currentPlan, updateSegment]);

  // Batch add plays to script from Play Bank
  const handleBatchAddToScript = useCallback((segmentId) => {
    const segment = currentPlan?.segments?.find(s => s.id === segmentId);
    if (!segment) return;

    startBatchSelect((playIds) => {
      const currentScript = segment.script || [];

      // Get empty script rows
      const emptyRowIndices = currentScript
        .map((row, idx) => (!row.playId && !row.playName) ? idx : -1)
        .filter(idx => idx !== -1);

      // Fill empty rows with selected plays
      let newScript = [...currentScript];
      let playIndex = 0;

      emptyRowIndices.forEach(rowIdx => {
        if (playIndex < playIds.length) {
          const play = plays[playIds[playIndex]];
          newScript[rowIdx] = {
            ...newScript[rowIdx],
            playId: playIds[playIndex],
            playName: play?.name || ''
          };
          playIndex++;
        }
      });

      // If more plays than empty rows, add new rows
      while (playIndex < playIds.length) {
        const play = plays[playIds[playIndex]];
        newScript.push({
          ...createScriptRow(newScript.length),
          playId: playIds[playIndex],
          playName: play?.name || ''
        });
        playIndex++;
      }

      updateSegment(segmentId, 'script', newScript);
    }, 'Add to Script');
  }, [currentPlan, plays, startBatchSelect, updateSegment]);

  // Clear play from a script row
  const clearScriptRowPlay = useCallback((segmentId, rowId) => {
    updateScriptRow(segmentId, rowId, 'playId', '');
    updateScriptRow(segmentId, rowId, 'playName', '');
  }, [updateScriptRow]);

  // Ensure segment has script rows when enabled
  const ensureScriptRows = useCallback((segmentId) => {
    const segment = currentPlan.segments.find(s => s.id === segmentId);
    if (!segment) return;

    if (!segment.script || segment.script.length === 0) {
      const script = generateScriptRows(segment.duration);
      updateSegment(segmentId, 'script', script);
    }
  }, [currentPlan, updateSegment]);

  // Filter plays for play selector
  const filteredPlays = useMemo(() => {
    const phasePlays = playsArray.filter(p =>
      p.phase?.toUpperCase() === playFilterPhase ||
      (playFilterPhase === 'OFFENSE' && p.phase === 'offense')
    );
    if (!playSearchTerm) return phasePlays;
    const search = playSearchTerm.toLowerCase();
    return phasePlays.filter(play =>
      play.name?.toLowerCase().includes(search) ||
      play.formation?.toLowerCase().includes(search)
    );
  }, [playsArray, playSearchTerm, playFilterPhase]);

  // Open play selector for a script row
  const openPlaySelector = useCallback((segmentId, rowId) => {
    setActiveScriptSegmentId(segmentId);
    setActiveScriptRowId(rowId);
    setShowPlaySelector(true);
    setPlaySearchTerm('');
  }, []);

  // Add play to script row from selector
  const selectPlayForRow = useCallback((play) => {
    if (!activeScriptSegmentId || !activeScriptRowId) return;

    const segment = currentPlan.segments.find(s => s.id === activeScriptSegmentId);
    if (!segment?.script) return;

    const newScript = segment.script.map(row =>
      row.id === activeScriptRowId
        ? { ...row, playId: play.id, playName: getPlayCall(play) }
        : row
    );
    updateSegment(activeScriptSegmentId, 'script', newScript);
    setShowPlaySelector(false);
    setActiveScriptSegmentId(null);
    setActiveScriptRowId(null);
  }, [activeScriptSegmentId, activeScriptRowId, currentPlan, updateSegment]);

  // Add segment
  const addSegment = useCallback((afterIndex = -1) => {
    const newSegment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: '',
      duration: currentPlan.defaultSegmentDuration || 10,
      phase: 'ALL',
      focuses: [],           // New: array of selected focus items
      offenseFocuses: [],    // New: for 2-platoon mode
      defenseFocuses: [],    // New: for 2-platoon mode
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

  // Import a template into the current day's plan
  const importTemplate = useCallback((template) => {
    if (!confirm(`Import "${template.name}" into ${selectedDay}? This will replace the current plan.`)) return;

    // Create new segments with fresh IDs
    const newSegments = (template.segments || []).map(seg => ({
      ...seg,
      id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    updateCurrentPlan({
      startTime: template.startTime || currentPlan.startTime,
      warmupDuration: template.warmupDuration ?? currentPlan.warmupDuration,
      transitionTime: template.transitionTime ?? currentPlan.transitionTime,
      showPeriodZero: template.showPeriodZero ?? currentPlan.showPeriodZero,
      isTwoPlatoon: template.isTwoPlatoon ?? currentPlan.isTwoPlatoon,
      segments: newSegments
    });
  }, [selectedDay, currentPlan, updateCurrentPlan]);

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
    <div className={`h-full flex flex-col ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
      {/* Header */}
      <div className={`flex-shrink-0 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-slate-700 bg-slate-800'}`}>
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className={`p-2 rounded-lg transition-colors ${isLight
                  ? 'hover:bg-gray-100'
                  : 'hover:bg-slate-700'
                  }`}
              >
                <ArrowLeft size={20} className={isLight ? 'text-gray-400' : 'text-slate-400'} />
              </Link>
              <div>
                <h1 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Practice Planner</h1>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {week.name}{week.opponent ? ` vs ${week.opponent}` : ''}
                </p>
              </div>

              {/* Day Tabs - inline with title */}
              <div className="flex flex-col gap-1 ml-4">
                <span className="text-[0.65rem] text-slate-500 uppercase tracking-wide text-center">Select Day</span>
                <div className="flex gap-1">
                  {DAYS.map(day => {
                    const dayPlan = practicePlans[day];
                    const hasSegments = dayPlan?.segments?.length > 0;

                    return (
                      <button
                        key={day}
                        onClick={() => navigateToDay(day)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${selectedDay === day
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                      >
                        {DAY_ABBREV[day]}
                        {hasSegments && (
                          <CheckCircle2 size={12} className={selectedDay === day ? 'text-sky-200' : 'text-emerald-400'} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates */}
              <div className="flex flex-col gap-1 ml-4">
                <span className="text-[0.65rem] text-slate-500 uppercase tracking-wide text-center">Template</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowImportTemplateModal(true)}
                    className="h-8 flex items-center gap-1 px-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-xs"
                    title="Load a saved template into this day"
                  >
                    <LayoutTemplate size={12} />
                    Import
                  </button>
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="h-8 flex items-center gap-1 px-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 text-xs"
                    title="Save this day's plan as a reusable template"
                  >
                    <Save size={12} />
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-6">
              {/* Mode Toggle */}
              <div className="flex flex-col gap-1">
                <span className="text-[0.65rem] text-slate-500 uppercase tracking-wide text-center">Viewing</span>
                <div className="h-8 flex items-center bg-slate-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setMode('plan')}
                    className={`h-7 px-3 text-sm font-medium rounded-md transition-colors ${mode === 'plan'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Plans
                  </button>
                  <button
                    onClick={() => setMode('script')}
                    className={`h-7 px-3 text-sm font-medium rounded-md transition-colors ${mode === 'script'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Scripts
                  </button>
                </div>
              </div>

              {/* Print Section */}
              <div className="flex flex-col gap-1">
                <label htmlFor="header-print-coach-filter" className="text-[0.65rem] text-slate-500 uppercase tracking-wide text-center">Print For</label>
                <div className="flex items-center gap-2">
                  <select
                    id="header-print-coach-filter"
                    value={coachFilter}
                    onChange={e => setCoachFilter(e.target.value)}
                    className="h-8 px-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="ALL">All</option>
                    <option value="GENERAL">General</option>
                    {(staff || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="h-8 flex items-center gap-2 px-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <Printer size={16} />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stamping Mode Banner */}
      {stagedPlay && (
        <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between text-white shadow-lg z-10 shrink-0 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="font-bold px-2 py-0.5 bg-white text-indigo-700 rounded text-xs uppercase tracking-wide shadow-sm">Stamping Mode</span>
            <span className="text-sm flex items-center gap-2">
              Click any play call slot to assign
              <span className="font-semibold bg-indigo-700 px-2 py-0.5 rounded border border-indigo-500 flex items-center gap-1">
                {getWristbandDisplay && getWristbandDisplay(stagedPlay) ? (
                  <span className="text-[0.65rem] bg-sky-400 text-sky-950 px-1 rounded font-bold">#{getWristbandDisplay(stagedPlay)}</span>
                ) : null}
                {stagedPlay.name}
                {stagedPlay.formation && <span className="opacity-75 font-normal text-xs">({stagedPlay.formation})</span>}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs opacity-75 hidden sm:inline">Press ESC to cancel</span>
            <button onClick={() => setStagedPlay(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {mode === 'plan' ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Plan Controls */}
            <div className={`flex flex-wrap items-center gap-4 p-4 rounded-lg ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800'}`}>
              {/* Help Button */}
              <div className="relative">
                <button
                  onClick={() => setShowPlanHelp(!showPlanHelp)}
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    showPlanHelp
                      ? 'bg-sky-500 text-white'
                      : isLight
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                  }`}
                  title="How to use Practice Planner"
                >
                  <HelpCircle size={14} />
                </button>
                {showPlanHelp && (
                  <div className={`absolute left-0 top-8 z-50 w-80 p-4 rounded-lg shadow-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-700 border-slate-600'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Practice Plan Setup</h4>
                      <button onClick={() => setShowPlanHelp(false)} className={`p-1 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-600'}`}>
                        <X size={14} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
                      </button>
                    </div>
                    <div className={`text-xs space-y-3 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                      <p>
                        This practice planner was designed around <strong>ElectroMech segment timers</strong> commonly used in football programs. The timer officially starts after warmups are complete.
                      </p>
                      <p>
                        <strong>Period 0 (Warmup)</strong> is separate because we don't start the official practice clock until the team is warmed up and ready to go. Use the warmup notes to outline your pre-practice routine.
                      </p>
                      <p>
                        <strong>Settings explained:</strong>
                      </p>
                      <ul className={`list-disc list-inside space-y-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        <li><strong>Start Time</strong> – When warmups begin</li>
                        <li><strong>Transition Time</strong> – Time between periods for water, rotation</li>
                        <li><strong>New Period</strong> – Default duration when adding segments</li>
                        <li><strong>2-Platoon</strong> – Split offense/defense focus columns</li>
                        <li><strong>Script</strong> – Check to add a play script to that period</li>
                      </ul>
                      <p className={`pt-2 border-t ${isLight ? 'border-gray-200 text-gray-500' : 'border-slate-600 text-slate-400'}`}>
                        Tip: Use the <strong>+</strong> button on the right side of any row number to insert a new period between existing ones.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* View Level Selector (Program view only - to see varsity or sub-level plans) */}
              {hasMultipleLevels && !activeLevelId && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="plan-view-level" className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Level</label>
                  <select
                    id="plan-view-level"
                    value={viewingLevelId || 'varsity'}
                    onChange={e => setViewingLevelId(e.target.value === 'varsity' ? null : e.target.value)}
                    className={`h-8 px-2 border rounded text-sm ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  >
                    <option value="varsity">Varsity</option>
                    {programLevels.map(level => (
                      <option key={level.id} value={level.id}>{level.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Timer Source (only show for sub-levels, not varsity or program view) */}
              {hasMultipleLevels && activeLevelId && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="plan-timer-source" className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Timer Sync</label>
                  <div className="h-8 flex items-center gap-1.5">
                    <Link2 size={14} className={isLight ? 'text-gray-400' : 'text-slate-400'} />
                    <select
                      id="plan-timer-source"
                      value={currentPlan.timerSource || 'own'}
                      onChange={e => updateCurrentPlan({ timerSource: e.target.value })}
                      className={`h-8 px-2 border rounded text-sm ${currentPlan.timerSource && currentPlan.timerSource !== 'own'
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                        : isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'
                        }`}
                    >
                      <option value="own">Own Timer</option>
                      <option value="varsity">Sync with Varsity</option>
                      {programLevels.filter(l => l.id !== activeLevelId).map(level => (
                        <option key={level.id} value={level.id}>Sync with {level.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Start Time */}
              <div className="flex flex-col gap-1">
                <label htmlFor="plan-start-time" className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Start Time</label>
                <input
                  id="plan-start-time"
                  type="time"
                  value={currentPlan.startTime || '15:30'}
                  onChange={e => updateCurrentPlan({ startTime: e.target.value })}
                  className={`h-8 px-2 border rounded text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  disabled={currentPlan.timerSource && currentPlan.timerSource !== 'own'}
                />
              </div>

              {/* End Time */}
              <div className="flex flex-col gap-1">
                <span className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>End Time</span>
                <div className={`h-8 px-2 flex items-center border rounded text-sm ${isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}>
                  {endTime}
                </div>
              </div>

              {/* Duration Display */}
              <div className="flex flex-col gap-1">
                <span className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Practice Length</span>
                <div className={`h-8 px-2 flex items-center rounded text-sm font-medium ${isLight ? 'bg-gray-100 text-gray-900' : 'bg-slate-900 text-white'}`}>
                  {totalDuration} min
                </div>
              </div>

              {/* Transition Time */}
              <div className={`flex flex-col gap-1 border-l pl-3 ${isLight ? 'border-gray-200' : 'border-slate-700'}`} title="Time between segments for transitions">
                <span className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Transition Time</span>
                <div className="flex items-center gap-1">
                  <input
                    id="plan-transition-minutes"
                    type="number"
                    value={currentPlan.transitionTime || 0}
                    onChange={e => updateCurrentPlan({ transitionTime: Math.max(0, parseInt(e.target.value) || 0) })}
                    className={`w-10 h-8 px-1 border rounded text-sm text-center ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                    min="0"
                    max="59"
                    aria-label="Transition minutes"
                  />
                  <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>min</span>
                  <input
                    id="plan-transition-seconds"
                    type="number"
                    value={currentPlan.transitionSeconds || 0}
                    onChange={e => updateCurrentPlan({ transitionSeconds: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)) })}
                    className={`w-10 h-8 px-1 border rounded text-sm text-center ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                    min="0"
                    max="59"
                    aria-label="Transition seconds"
                  />
                  <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>sec</span>
                </div>
              </div>

              {/* Default Period Length */}
              <div className={`flex flex-col gap-1 border-l pl-3 ${isLight ? 'border-gray-200' : 'border-slate-700'}`} title="Default duration for new segments">
                <span className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>New Period</span>
                <div className="flex items-center gap-1">
                  <input
                    id="plan-default-duration"
                    type="number"
                    value={currentPlan.defaultSegmentDuration || 10}
                    onChange={e => updateCurrentPlan({ defaultSegmentDuration: Math.max(1, parseInt(e.target.value) || 10) })}
                    className={`w-12 h-8 px-1 border rounded text-sm text-center ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                    min="1"
                    aria-label="Default segment duration"
                  />
                  <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>min</span>
                </div>
              </div>

              {/* 2-Platoon Toggle */}
              <div className={`flex flex-col gap-1 border-l pl-3 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                <span className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>2-Platoon</span>
                <label htmlFor="plan-two-platoon" className="h-8 flex items-center justify-center cursor-pointer">
                  <input
                    id="plan-two-platoon"
                    type="checkbox"
                    checked={currentPlan.isTwoPlatoon || false}
                    onChange={e => updateCurrentPlan({ isTwoPlatoon: e.target.checked })}
                    className={`w-5 h-5 rounded text-sky-500 ${isLight ? 'border-gray-300 bg-white' : 'border-slate-600 bg-slate-700'}`}
                  />
                </label>
              </div>

              {/* Period 0 Warmup Toggle */}
              <div className={`flex flex-col gap-1 border-l pl-3 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                <span className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Per. 0 Warmup</span>
                <label htmlFor="plan-period-zero" className="h-8 flex items-center justify-center cursor-pointer">
                  <input
                    id="plan-period-zero"
                    type="checkbox"
                    checked={currentPlan.showPeriodZero !== false}
                    onChange={e => updateCurrentPlan({ showPeriodZero: e.target.checked })}
                    className={`w-5 h-5 rounded text-sky-500 ${isLight ? 'border-gray-300 bg-white' : 'border-slate-600 bg-slate-700'}`}
                  />
                </label>
              </div>

              {/* Filter Group */}
              <div className={`flex flex-col gap-1 border-l pl-3 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                <label htmlFor="plan-coach-filter" className={`text-[0.65rem] uppercase tracking-wide text-center ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Filter</label>
                <select
                  id="plan-coach-filter"
                  value={coachFilter}
                  onChange={e => setCoachFilter(e.target.value)}
                  className={`h-8 px-2 border rounded text-sm ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                >
                  <option value="ALL">All Staff</option>
                  {(staff || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pre-Practice Notes */}
            <div className={`p-4 rounded-lg ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800'}`}>
              <label htmlFor="pre-practice-notes" className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>Pre-Practice Notes</label>
              <textarea
                id="pre-practice-notes"
                value={currentPlan.prePracticeNotes || ''}
                onChange={e => updateCurrentPlan({ prePracticeNotes: e.target.value })}
                placeholder="Announcements, weather, focus points..."
                className={`w-full px-3 py-2 border rounded-lg text-sm resize-none ${isLight ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'}`}
                rows={2}
              />
            </div>

            {/* Segments Table */}
            <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800'}`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b-2 text-xs uppercase ${isLight ? 'border-gray-200 text-gray-500' : 'border-slate-600 text-slate-400'}`}>
                    <th className="px-3 py-3 text-center w-12">#</th>
                    {hasMultipleLevels && <th className="px-3 py-3 text-center w-20">Levels</th>}
                    <th className="px-3 py-3 text-center w-20">Time</th>
                    <th className="px-3 py-3 text-center w-16">Duration</th>
                    <th className="px-3 py-3 text-center w-16">Phase</th>
                    <th className="px-3 py-3 text-center w-36">Type</th>
                    {currentPlan.isTwoPlatoon ? (
                      <>
                        <th className="px-3 py-3 text-center">Offense Focus</th>
                        <th className="px-3 py-3 text-center">Defense Focus</th>
                      </>
                    ) : (
                      <th className="px-3 py-3 text-center">Focus</th>
                    )}
                    <th className="px-3 py-3 text-center w-28">Contact</th>
                    <th className="px-3 py-3 text-center w-40">Notes</th>
                    <th className="px-3 py-3 text-center w-20">Script</th>
                    <th className="px-3 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Warmup Row (Period 0) */}
                  {currentPlan.showPeriodZero !== false && (
                    <tr
                      className={`border-b cursor-pointer ${
                        isLight
                          ? `border-gray-200 ${selectedSegmentId === 'WARMUP' ? 'bg-sky-50' : 'bg-gray-50/50'} hover:bg-gray-100`
                          : `border-slate-700 ${selectedSegmentId === 'WARMUP' ? 'bg-sky-500/10' : 'bg-slate-800/50'} hover:bg-slate-700/50`
                      }`}
                      onClick={() => setSelectedSegmentId('WARMUP')}
                    >
                      <td className="px-3 py-2 text-center">
                        <span className="text-sky-400 font-bold text-xs">0</span>
                      </td>
                      {hasMultipleLevels && (
                        <td className="px-3 py-2 text-center">
                          <SegmentLevelsSelector
                            segment={{ id: 'warmup', levels: currentPlan.warmupLevels }}
                            programLevels={programLevels}
                            onChange={(levels) => updateCurrentPlan({ warmupLevels: levels })}
                          />
                        </td>
                      )}
                      <td className={`px-3 py-2 text-center text-xs ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                        {currentPlan.startTime ? (() => {
                          const [h, m] = currentPlan.startTime.split(':').map(Number);
                          const hours = h % 12 || 12;
                          return `${hours}:${m.toString().padStart(2, '0')}`;
                        })() : ''}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          id="warmup-duration"
                          type="number"
                          value={currentPlan.warmupDuration || 0}
                          onChange={e => updateCurrentPlan({ warmupDuration: parseInt(e.target.value) || 0 })}
                          onClick={e => e.stopPropagation()}
                          className={`w-14 h-7 px-2 border rounded text-xs text-center ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                          aria-label="Warmup duration"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          id="warmup-phase"
                          value={currentPlan.warmupPhase || 'ALL'}
                          onChange={e => updateCurrentPlan({ warmupPhase: e.target.value })}
                          onClick={e => e.stopPropagation()}
                          className={`h-7 px-2 border rounded text-xs ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                          aria-label="Warmup phase"
                        >
                          {PHASES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className={`px-3 py-2 italic text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Warmup</td>
                      {/* Warmup spans Focus, Contact, Notes, and Script columns */}
                      <td colSpan={currentPlan.isTwoPlatoon ? 5 : 4} className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesModalSegmentId('WARMUP');
                          }}
                          className={`w-full h-7 px-3 text-left text-xs rounded border transition-colors truncate ${hasNotes(currentPlan.warmupNotes)
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : isLight
                              ? 'bg-gray-100 border-gray-300 text-gray-500 italic'
                              : 'bg-slate-700/50 border-slate-600 text-slate-500 italic'
                            }`}
                        >
                          {hasNotes(currentPlan.warmupNotes)
                            ? getNotesPreview(currentPlan.warmupNotes) || 'View warmup routine...'
                            : 'Add warmup routine/notes...'}
                        </button>
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  )}

                  {/* Segment Rows */}
                  {currentPlan.segments.map((seg, index) => (
                    <tr
                      key={seg.id}
                      className={`border-b cursor-pointer ${
                        isLight
                          ? `border-gray-200 ${selectedSegmentId === seg.id ? 'bg-sky-50' : ''} hover:bg-gray-100`
                          : `border-slate-700 ${selectedSegmentId === seg.id ? 'bg-sky-500/10' : ''} hover:bg-slate-700/50`
                      }`}
                      onClick={() => setSelectedSegmentId(seg.id)}
                    >
                      <td className="px-3 py-2 text-center relative">
                        <span className="text-sky-400 font-bold text-xs">{index + 1}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addSegment(index);
                          }}
                          className={`absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded opacity-70 hover:opacity-100 ${isLight ? 'text-gray-500 hover:text-sky-500 hover:bg-gray-200' : 'text-slate-400 hover:text-sky-400 hover:bg-slate-600'}`}
                          title="Insert segment below"
                        >
                          <Plus size={10} />
                        </button>
                      </td>
                      {hasMultipleLevels && (
                        <td className="px-3 py-2 text-center">
                          <SegmentLevelsSelector
                            segment={seg}
                            programLevels={programLevels}
                            onChange={(levels) => updateSegment(seg.id, 'levels', levels)}
                          />
                        </td>
                      )}
                      <td className={`px-3 py-2 text-center text-xs ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                        {getSegmentStartTime(index)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          id={`segment-${seg.id}-duration`}
                          type="number"
                          value={seg.duration || 0}
                          onChange={e => updateSegment(seg.id, 'duration', parseInt(e.target.value) || 0)}
                          onClick={e => e.stopPropagation()}
                          className={`w-14 h-7 px-2 border rounded text-xs text-center ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                          aria-label="Segment duration"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          id={`segment-${seg.id}-phase`}
                          value={seg.phase || 'ALL'}
                          onChange={e => updateSegment(seg.id, 'phase', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className={`h-7 px-2 border rounded text-xs ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                          aria-label="Segment phase"
                        >
                          {PHASES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          id={`segment-${seg.id}-type`}
                          value={seg.type || ''}
                          onChange={e => updateSegment(seg.id, 'type', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className={`w-full h-7 px-2 border rounded text-xs ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                          aria-label="Segment type"
                        >
                          <option value="">-- Select Type --</option>
                          {getSegmentTypesForPhase(seg.phase).map(t => (
                            <option key={t.id || t.name} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                      {currentPlan.isTwoPlatoon ? (
                        <>
                          <td className="px-3 py-2">
                            <FocusMultiSelect
                              phase="O"
                              segmentType={seg.type}
                              selectedFocuses={seg.offenseFocuses || []}
                              onChange={(focuses) => updateSegment(seg.id, 'offenseFocuses', focuses)}
                              setupConfig={setupConfig}
                              isLight={isLight}
                              placeholder="Offense Focus..."
                            />
                          </td>
                          <td className="px-3 py-2">
                            <FocusMultiSelect
                              phase="D"
                              segmentType={seg.type}
                              selectedFocuses={seg.defenseFocuses || []}
                              onChange={(focuses) => updateSegment(seg.id, 'defenseFocuses', focuses)}
                              setupConfig={setupConfig}
                              isLight={isLight}
                              placeholder="Defense Focus..."
                            />
                          </td>
                        </>
                      ) : (
                        <td className="px-3 py-2">
                          <FocusMultiSelect
                            phase={seg.phase}
                            segmentType={seg.type}
                            selectedFocuses={seg.focuses || []}
                            onChange={(focuses) => updateSegment(seg.id, 'focuses', focuses)}
                            setupConfig={setupConfig}
                            isLight={isLight}
                            placeholder="Select Focus..."
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">
                        <select
                          id={`segment-${seg.id}-contact`}
                          value={seg.contact || ''}
                          onChange={e => updateSegment(seg.id, 'contact', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className={`h-7 px-2 border rounded text-xs ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                          aria-label="Segment contact level"
                        >
                          {CONTACT_LEVELS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesModalSegmentId(seg.id);
                          }}
                          className={`w-full h-7 px-2 text-left text-xs rounded border transition-colors truncate ${hasNotes(seg.notes)
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : isLight
                              ? 'bg-gray-100 border-gray-300 text-gray-500 italic'
                              : 'bg-slate-700/50 border-slate-600 text-slate-500 italic'
                            }`}
                        >
                          {hasNotes(seg.notes)
                            ? getNotesPreview(seg.notes) || 'View notes...'
                            : 'Add notes...'}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          id={`segment-${seg.id}-has-script`}
                          type="checkbox"
                          checked={seg.hasScript || false}
                          onChange={e => updateSegment(seg.id, 'hasScript', e.target.checked)}
                          onClick={e => e.stopPropagation()}
                          className={`rounded text-sky-500 ${isLight ? 'border-gray-300 bg-white' : 'border-slate-600 bg-slate-700'}`}
                          aria-label="Segment has script"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSegment(seg.id);
                          }}
                          className={`p-1 rounded ${isLight ? 'text-gray-400 hover:text-red-500 hover:bg-gray-200' : 'text-slate-500 hover:text-red-400 hover:bg-slate-600'}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Segment Button */}
              <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                <button
                  onClick={() => addSegment()}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors border-2 border-dashed ${isLight ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600'}`}
                >
                  <Plus size={18} />
                  Add Segment
                </button>
              </div>
            </div>

            {/* Post-Practice Notes */}
            <div className={`p-4 rounded-lg ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800'}`}>
              <label htmlFor="post-practice-notes" className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>Post-Practice Notes</label>
              <textarea
                id="post-practice-notes"
                value={currentPlan.postPracticeNotes || ''}
                onChange={e => updateCurrentPlan({ postPracticeNotes: e.target.value })}
                placeholder="Post-practice thoughts, ideas for tomorrow, things that went well or need work..."
                className={`w-full px-3 py-2 border rounded-lg text-sm resize-none ${isLight ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'}`}
                rows={3}
              />
            </div>
          </div>
        ) : (
          /* Script Mode - Full Script Tables */
          <div className="space-y-6">
            {currentPlan.segments.filter(s => s.hasScript).length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="text-center py-12">
                  <FileText size={48} className="text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Scripts Enabled</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Enable scripting for segments in the Plans tab using the "Script" checkbox, then return here to build out play-by-play scripts.
                  </p>
                </div>
              </div>
            ) : (
              currentPlan.segments
                .filter(s => s.hasScript)
                .map((seg, segIndex) => {
                  // Calculate start time for segment
                  let elapsed = currentPlan.warmupDuration || 0;
                  for (let i = 0; i < currentPlan.segments.indexOf(seg); i++) {
                    elapsed += currentPlan.segments[i].duration || 0;
                    if (currentPlan.transitionTime) elapsed += currentPlan.transitionTime;
                  }
                  const [startH, startM] = (currentPlan.startTime || '15:00').split(':').map(Number);
                  const totalMins = startH * 60 + startM + elapsed;
                  const segHour = Math.floor(totalMins / 60) % 12 || 12;
                  const segMin = totalMins % 60;
                  const segTime = `${segHour}:${segMin.toString().padStart(2, '0')}`;

                  // Ensure script rows exist
                  const script = seg.script?.length > 0 ? seg.script : generateScriptRows(seg.duration);
                  if (!seg.script || seg.script.length === 0) {
                    // Auto-generate if missing
                    setTimeout(() => updateSegment(seg.id, 'script', script), 0);
                  }

                  return (
                    <div key={seg.id} className="bg-slate-800 rounded-lg overflow-hidden">
                      {/* Segment Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-600">
                        <div className="flex items-center gap-3">
                          <span className="text-sky-400 font-mono font-semibold">{segTime}</span>
                          <span className="text-white font-semibold">{seg.type || 'NEW SEGMENT'}</span>
                          <span className="text-slate-400 text-sm">({seg.duration || 0} min)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBatchAddToScript(seg.id)}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 rounded"
                          >
                            <CheckSquare size={14} />
                            Batch Add
                          </button>
                          <button
                            onClick={() => addScriptRow(seg.id)}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-sky-400 hover:text-sky-300"
                          >
                            <Plus size={14} />
                            Add Row
                          </button>
                        </div>
                      </div>

                      {/* Script Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                              <th className="px-2 py-2 text-center w-10">#</th>
                              <th className="px-2 py-2 text-center w-16">Hash</th>
                              <th className="px-2 py-2 text-center w-12">Dn</th>
                              <th className="px-2 py-2 text-center w-12">Dist</th>
                              <th className="px-2 py-2 text-left w-24">Situation</th>
                              <th className="px-2 py-2 text-left min-w-[200px]">Play Call</th>
                              <th className="px-2 py-2 text-left w-28">Defense</th>
                              <th className="px-2 py-2 text-left w-32">Notes</th>
                              <th className="px-2 py-2 text-center w-16">Act</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(seg.script || script).map((row, idx) => {
                              const play = row.playId ? getPlay(row.playId) : null;
                              return (
                                <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                  <td className="px-2 py-2 text-center text-slate-500">{idx + 1}</td>
                                  <td className="px-2 py-2 text-center">
                                    <select
                                      id={`script-${seg.id}-${row.id}-hash`}
                                      value={row.hash || 'M'}
                                      onChange={(e) => updateScriptRow(seg.id, row.id, 'hash', e.target.value)}
                                      className="w-full px-1 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center"
                                      aria-label="Hash mark"
                                    >
                                      <option value="L">L</option>
                                      <option value="LM">LM</option>
                                      <option value="M">M</option>
                                      <option value="RM">RM</option>
                                      <option value="R">R</option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <select
                                      id={`script-${seg.id}-${row.id}-down`}
                                      value={row.dn || ''}
                                      onChange={(e) => updateScriptRow(seg.id, row.id, 'dn', e.target.value)}
                                      className="w-full px-1 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center"
                                      aria-label="Down"
                                    >
                                      <option value=""></option>
                                      <option value="1">1</option>
                                      <option value="2">2</option>
                                      <option value="3">3</option>
                                      <option value="4">4</option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <input
                                      id={`script-${seg.id}-${row.id}-distance`}
                                      type="text"
                                      value={row.dist || ''}
                                      onChange={(e) => updateScriptRow(seg.id, row.id, 'dist', e.target.value)}
                                      placeholder=""
                                      className="w-full px-1 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center"
                                      aria-label="Distance"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      id={`script-${seg.id}-${row.id}-situation`}
                                      type="text"
                                      value={row.situation || ''}
                                      onChange={(e) => updateScriptRow(seg.id, row.id, 'situation', e.target.value)}
                                      placeholder="Situation"
                                      className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs placeholder-slate-500"
                                      aria-label="Situation"
                                    />
                                  </td>
                                  <td
                                    className="px-2 py-2"
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.currentTarget.style.background = '#334155';
                                    }}
                                    onDragLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.currentTarget.style.background = 'transparent';

                                      let playId = e.dataTransfer.getData('text/plain');
                                      let play = null;

                                      // Check for Sidebar Play Drop (application/react-dnd)
                                      if (!playId) {
                                        const playData = e.dataTransfer.getData('application/react-dnd');
                                        if (playData) {
                                          try {
                                            const parsed = JSON.parse(playData);
                                            if (parsed.playId) playId = parsed.playId;
                                          } catch (err) {
                                            console.error('Error parsing drop data:', err);
                                          }
                                        }
                                      }

                                      if (playId) play = getPlay(playId);

                                      if (play) {
                                        updateScriptRowFields(seg.id, row.id, {
                                          playId: play.id,
                                          playName: formatPlayCall(play)
                                        });
                                      }
                                    }}
                                    onClick={(e) => {
                                      // Click-to-assign (Stamping)
                                      if (stagedPlay) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateScriptRowFields(seg.id, row.id, {
                                          playId: stagedPlay.id,
                                          playName: formatPlayCall(stagedPlay)
                                        });
                                      }
                                    }}
                                    style={{ cursor: stagedPlay ? 'copy' : 'text' }}
                                  >
                                    <PlayCallAutocomplete
                                      id={`script-${seg.id}-${row.id}-play-call`}
                                      value={row.playName || ''}
                                      playId={row.playId}
                                      plays={playsArray}
                                      onSelectPlay={(play) => {
                                        updateScriptRowFields(seg.id, row.id, {
                                          playId: play.id,
                                          playName: formatPlayCall(play)
                                        });
                                      }}
                                      onChangeText={(text) => {
                                        if (row.playId) {
                                          updateScriptRowFields(seg.id, row.id, { playName: text, playId: '' });
                                        } else {
                                          updateScriptRow(seg.id, row.id, 'playName', text);
                                        }
                                      }}
                                      onClear={() => {
                                        updateScriptRowFields(seg.id, row.id, { playId: '', playName: '' });
                                      }}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      id={`script-${seg.id}-${row.id}-defense`}
                                      type="text"
                                      value={row.defense || ''}
                                      onChange={(e) => updateScriptRow(seg.id, row.id, 'defense', e.target.value)}
                                      placeholder="Defense"
                                      className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs placeholder-slate-500"
                                      aria-label="Defense"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      id={`script-${seg.id}-${row.id}-notes`}
                                      type="text"
                                      value={row.notes || ''}
                                      onChange={(e) => updateScriptRow(seg.id, row.id, 'notes', e.target.value)}
                                      placeholder="Add Note..."
                                      className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs placeholder-slate-500"
                                      aria-label="Notes"
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => {
                                          // Insert row after this one
                                          const newScript = [...(seg.script || [])];
                                          const newRow = createScriptRow(idx + 1);
                                          newScript.splice(idx + 1, 0, newRow);
                                          updateSegment(seg.id, 'script', newScript);
                                        }}
                                        className="p-1 text-slate-500 hover:text-sky-400"
                                        title="Insert row"
                                      >
                                        <Plus size={12} />
                                      </button>
                                      <button
                                        onClick={() => deleteScriptRow(seg.id, row.id)}
                                        className="p-1 text-slate-500 hover:text-red-400"
                                        title="Delete row"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
            )}
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

      {/* Import Template Modal */}
      {showImportTemplateModal && (
        <ImportTemplateModal
          existingTemplates={existingTemplates}
          onImport={importTemplate}
          onClose={() => setShowImportTemplateModal(false)}
        />
      )}

      {/* Play Selector Modal */}
      {showPlaySelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Select Play</h3>
              <button
                onClick={() => {
                  setShowPlaySelector(false);
                  setActiveScriptSegmentId(null);
                  setActiveScriptRowId(null);
                }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    id="play-selector-search"
                    type="text"
                    value={playSearchTerm}
                    onChange={e => setPlaySearchTerm(e.target.value)}
                    placeholder="Search plays..."
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                    autoFocus
                    aria-label="Search plays"
                  />
                </div>
                <select
                  id="play-selector-phase"
                  value={playFilterPhase}
                  onChange={e => setPlayFilterPhase(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  aria-label="Filter by phase"
                >
                  <option value="OFFENSE">Offense</option>
                  <option value="DEFENSE">Defense</option>
                  <option value="SPECIAL_TEAMS">Special Teams</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredPlays.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No plays found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredPlays.map(play => (
                    <button
                      key={play.id}
                      onClick={() => selectPlayForRow(play)}
                      className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{getPlayCall(play)}</span>
                        {getWristbandDisplay(play) && (
                          <span className="text-xs font-bold text-sky-300 bg-sky-900/50 px-1 py-0.5 rounded">
                            {getWristbandDisplay(play)}
                          </span>
                        )}
                      </div>
                      {play.bucket && (
                        <div className="text-sm text-slate-500 mt-1">
                          <span>{play.bucket}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
