import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import * as XLSX from 'xlsx';
import {
  Trophy,
  Upload,
  Star,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Play,
  Film,
  AlertTriangle,
  Zap,
  X,
  Settings,
  Link2,
  LinkIcon,
  Check,
  Search,
  FileSpreadsheet,
  BarChart3,
  Target,
  TrendingUp,
  HelpCircle,
  Filter,
  MapPin
} from 'lucide-react';

// Helper Box Component for new coaches
function CoachHelperBox({ isLight, onDismiss, showByDefault = true }) {
  const [isExpanded, setIsExpanded] = useState(showByDefault);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className={`mb-6 rounded-xl border ${
      isLight
        ? 'bg-sky-50 border-sky-200'
        : 'bg-sky-900/20 border-sky-800'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between text-left ${
          isLight ? 'hover:bg-sky-100/50' : 'hover:bg-sky-900/30'
        } rounded-xl transition-colors`}
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className={isLight ? 'text-sky-600' : 'text-sky-400'} />
          <span className={`font-medium ${isLight ? 'text-sky-800' : 'text-sky-300'}`}>
            New to Postgame Review? Here's how it works
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className={`text-xs px-2 py-1 rounded ${
              isLight ? 'text-sky-600 hover:bg-sky-200' : 'text-sky-400 hover:bg-sky-800'
            }`}
          >
            Dismiss
          </button>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className={`px-4 pb-4 ${isLight ? 'text-sky-900' : 'text-sky-100'}`}>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">1</span>
                Import Your Game Data
              </h4>
              <p className={`ml-8 ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                Export your game from Hudl as an Excel file, then import it here. The system will automatically try to match plays to your playbook.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">2</span>
                Verify Play Matches
              </h4>
              <p className={`ml-8 ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                Check that imported plays are correctly matched to your playbook. Click "Match to playbook" on any unmatched plays to link them.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">3</span>
                Review Game Film
              </h4>
              <p className={`ml-8 ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                Click "Start Film Review" to slide through each play. Rate execution (1-5 stars), tag what worked/didn't work, and add notes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">4</span>
                Track Play History
              </h4>
              <p className={`ml-8 ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                Your reviews are saved to each play's history. Open any play in your Playbook to see how it performed across all games and practices.
              </p>
            </div>
          </div>
          <div className={`mt-4 pt-3 border-t text-xs ${
            isLight ? 'border-sky-200 text-sky-600' : 'border-sky-700 text-sky-400'
          }`}>
            <strong>Pro tip:</strong> In the Film Review wizard, use keyboard shortcuts: Arrow keys to navigate, 1-5 to rate, Esc to close.
          </div>
        </div>
      )}
    </div>
  );
}

// Default Hudl column mappings - common Hudl column names
const DEFAULT_COLUMN_MAPPING = {
  playNumber: 'PLAY #',
  quarter: 'QTR',
  series: 'SERIES',
  odk: 'ODK',
  down: 'DN',
  distance: 'DIST',
  yardLine: 'YARD LN',
  hash: 'HASH',
  formation: 'OFF FORM',
  backfield: 'OFF BACKFIELD',
  motion: 'OFF MOTION',
  playName: 'OFF PLAY',
  playType: 'PLAY TYPE',
  playDir: 'PLAY DIR',
  result: 'RESULT',
  gainLoss: 'GN/LS'
};

// Alternative column name mappings (Hudl uses different names sometimes)
const COLUMN_ALIASES = {
  playNumber: ['PLAY #', 'PLAY', 'PLAY NUM', '#'],
  quarter: ['QTR', 'QUARTER', 'Q'],
  series: ['SERIES', 'SER', 'DRIVE', 'DRIVE #'],
  odk: ['ODK', 'O/D/K', 'UNIT'],
  down: ['DN', 'DOWN'],
  distance: ['DIST', 'DISTANCE', 'YDS TO GO'],
  yardLine: ['YARD LN', 'YARD LINE', 'YD LN', 'LOS'],
  hash: ['HASH', 'HASH MARK'],
  formation: ['OFF FORM', 'OFF FORMATION', 'FORMATION', 'FORM'],
  backfield: ['OFF BACKFIELD', 'BACKFIELD', 'BACK'],
  motion: ['OFF MOTION', 'MOTION', 'MOT'],
  playName: ['OFF PLAY', 'PLAY NAME', 'PLAY CALL', 'CALL'],
  playType: ['PLAY TYPE', 'TYPE', 'RUN/PASS', 'R/P'],
  playDir: ['PLAY DIR', 'DIRECTION', 'DIR'],
  result: ['RESULT', 'PLAY RESULT'],
  gainLoss: ['GN/LS', 'GAIN/LOSS', 'YARDS', 'YDS', 'GAIN LOSS']
};

// Auto-detect column mapping from headers
function autoDetectColumnMapping(headers) {
  const mapping = {};
  const upperHeaders = headers.map(h => h.toUpperCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = upperHeaders.indexOf(alias.toUpperCase());
      if (idx !== -1) {
        mapping[field] = headers[idx]; // Use original case
        break;
      }
    }
  }

  return mapping;
}

// Star Rating Component (same as PracticeReview)
function StarRating({ rating, onChange, size = 'normal', disabled = false }) {
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = size === 'large' ? 28 : size === 'small' ? 16 : 20;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className={`transition-colors ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <Star
              size={starSize}
              className={`transition-colors ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600 hover:text-amber-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// Column Mapping Modal
function ColumnMappingModal({ isOpen, onClose, onSave, availableColumns, currentMapping, isLight }) {
  const [mapping, setMapping] = useState(currentMapping || DEFAULT_COLUMN_MAPPING);

  const mappingFields = [
    { key: 'playNumber', label: 'Play Number', required: false, group: 'situation' },
    { key: 'quarter', label: 'Quarter', required: false, group: 'situation' },
    { key: 'series', label: 'Series/Drive', required: false, group: 'situation' },
    { key: 'odk', label: 'O/D/K', required: false, group: 'situation' },
    { key: 'down', label: 'Down', required: false, group: 'situation' },
    { key: 'distance', label: 'Distance', required: false, group: 'situation' },
    { key: 'yardLine', label: 'Yard Line', required: false, group: 'situation' },
    { key: 'hash', label: 'Hash', required: false, group: 'situation' },
    // Play call fields - these build the full play call display
    { key: 'formation', label: 'Formation', required: false, group: 'playcall' },
    { key: 'backfield', label: 'Backfield', required: false, group: 'playcall' },
    { key: 'motion', label: 'Motion/Shift', required: false, group: 'playcall' },
    { key: 'personnel', label: 'Personnel', required: false, group: 'playcall' },
    { key: 'tag', label: 'Tag/RPO', required: false, group: 'playcall' },
    { key: 'playName', label: 'Play Name', required: true, group: 'playcall' },
    { key: 'playType', label: 'Play Type (Run/Pass)', required: false, group: 'result' },
    { key: 'playDir', label: 'Play Direction', required: false, group: 'result' },
    { key: 'result', label: 'Result', required: false, group: 'result' },
    { key: 'gainLoss', label: 'Gain/Loss', required: false, group: 'result' },
    // Custom fields users can map
    { key: 'custom1', label: 'Custom Field 1', required: false, group: 'custom' },
    { key: 'custom2', label: 'Custom Field 2', required: false, group: 'custom' },
    { key: 'custom3', label: 'Custom Field 3', required: false, group: 'custom' }
  ];

  const handleSave = () => {
    onSave(mapping);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Map Hudl Columns
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Match your Hudl export columns to data fields
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800'}`}
            >
              <X size={20} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {availableColumns.length === 0 ? (
            <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              <FileSpreadsheet size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">No columns available yet</p>
              <p className="text-sm">Import an Excel file first to see available columns for mapping.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Situation Fields */}
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Situation
                </div>
                <div className="space-y-2">
                  {mappingFields.filter(f => f.group === 'situation').map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className={`w-28 text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                        {field.label}
                      </label>
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                          isLight
                            ? 'bg-gray-100 border border-gray-300 text-gray-900'
                            : 'bg-slate-800 border border-slate-700 text-white'
                        } focus:outline-none focus:border-amber-500`}
                      >
                        <option value="">-- Select --</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Play Call Fields */}
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
                  Play Call (builds the full call display)
                </div>
                <div className="space-y-2">
                  {mappingFields.filter(f => f.group === 'playcall').map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className={`w-28 text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                          isLight
                            ? 'bg-gray-100 border border-gray-300 text-gray-900'
                            : 'bg-slate-800 border border-slate-700 text-white'
                        } focus:outline-none focus:border-amber-500`}
                      >
                        <option value="">-- Select --</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Result Fields */}
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Result
                </div>
                <div className="space-y-2">
                  {mappingFields.filter(f => f.group === 'result').map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className={`w-28 text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                        {field.label}
                      </label>
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                          isLight
                            ? 'bg-gray-100 border border-gray-300 text-gray-900'
                            : 'bg-slate-800 border border-slate-700 text-white'
                        } focus:outline-none focus:border-amber-500`}
                      >
                        <option value="">-- Select --</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Fields */}
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                  Custom Fields (optional extra columns)
                </div>
                <div className="space-y-2">
                  {mappingFields.filter(f => f.group === 'custom').map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className={`w-28 text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                        {field.label}
                      </label>
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                          isLight
                            ? 'bg-gray-100 border border-gray-300 text-gray-900'
                            : 'bg-slate-800 border border-slate-700 text-white'
                        } focus:outline-none focus:border-amber-500`}
                      >
                        <option value="">-- Select --</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600"
          >
            Save Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

// New Terms Modal - prompts coach to add newly discovered terms to glossary
function NewTermsModal({ isOpen, onClose, onSave, newTerms, isLight }) {
  const [selectedTerms, setSelectedTerms] = useState({});
  const [abbreviations, setAbbreviations] = useState({});

  // Initialize selections when modal opens
  useEffect(() => {
    if (isOpen && newTerms) {
      const initial = {};
      const abbrevs = {};
      Object.entries(newTerms).forEach(([category, terms]) => {
        terms.forEach(term => {
          const key = `${category}:${term}`;
          initial[key] = true; // Select all by default
          // Auto-generate simple abbreviation (first 3 chars or first letters)
          const words = term.split(/\s+/);
          if (words.length > 1) {
            abbrevs[key] = words.map(w => w[0]).join('').toUpperCase();
          } else if (term.length > 3) {
            abbrevs[key] = term.substring(0, 3).toUpperCase();
          } else {
            abbrevs[key] = term.toUpperCase();
          }
        });
      });
      setSelectedTerms(initial);
      setAbbreviations(abbrevs);
    }
  }, [isOpen, newTerms]);

  const toggleTerm = (key) => {
    setSelectedTerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateAbbrev = (key, value) => {
    setAbbreviations(prev => ({ ...prev, [key]: value.toUpperCase() }));
  };

  const handleSave = () => {
    // Build terms to add grouped by category
    const termsToAdd = {};
    const abbrevsToAdd = {};

    Object.entries(selectedTerms).forEach(([key, isSelected]) => {
      if (isSelected) {
        const [category, term] = key.split(':');
        if (!termsToAdd[category]) termsToAdd[category] = [];
        termsToAdd[category].push(term);
        if (abbreviations[key]) {
          abbrevsToAdd[term.toUpperCase()] = abbreviations[key];
        }
      }
    });

    onSave(termsToAdd, abbrevsToAdd);
    onClose();
  };

  const totalNew = Object.values(newTerms || {}).flat().length;
  const selectedCount = Object.values(selectedTerms).filter(Boolean).length;

  if (!isOpen || !newTerms || totalNew === 0) return null;

  const categoryLabels = {
    formation: 'Formations',
    backfield: 'Backfields',
    motion: 'Motions',
    playType: 'Play Types',
    playDir: 'Directions'
  };

  const categoryColors = {
    formation: 'sky',
    backfield: 'purple',
    motion: 'amber',
    playType: 'emerald',
    playDir: 'rose'
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                New Terms Found
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {totalNew} new term{totalNew !== 1 ? 's' : ''} from this import
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800'}`}
            >
              <X size={20} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            These terms aren't in your glossary yet. Select which to add and set abbreviations for wristbands.
          </p>

          {Object.entries(newTerms).map(([category, terms]) => {
            if (terms.length === 0) return null;
            const color = categoryColors[category] || 'slate';

            return (
              <div key={category}>
                <h3 className={`text-sm font-semibold mb-2 text-${color}-${isLight ? '600' : '400'}`}>
                  {categoryLabels[category] || category} ({terms.length})
                </h3>
                <div className="space-y-2">
                  {terms.map(term => {
                    const key = `${category}:${term}`;
                    const isSelected = selectedTerms[key];

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          isLight ? 'bg-gray-50' : 'bg-slate-800/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={() => toggleTerm(key)}
                          className="w-4 h-4 rounded"
                        />
                        <span className={`flex-1 text-sm font-medium ${
                          isSelected
                            ? (isLight ? 'text-gray-900' : 'text-white')
                            : (isLight ? 'text-gray-400' : 'text-slate-500')
                        }`}>
                          {term}
                        </span>
                        <input
                          type="text"
                          value={abbreviations[key] || ''}
                          onChange={(e) => updateAbbrev(key, e.target.value)}
                          placeholder="Abbrev"
                          disabled={!isSelected}
                          className={`w-20 px-2 py-1 rounded text-sm text-center ${
                            isLight
                              ? 'bg-white border border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400'
                              : 'bg-slate-700 border border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-500'
                          } focus:outline-none focus:border-amber-500`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`px-6 py-4 border-t flex items-center justify-between ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            {selectedCount} of {totalNew} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={selectedCount === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Glossary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Play Matching Modal
function PlayMatchingModal({ isOpen, onClose, gamePlay, plays, onMatch, isLight }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlays = useMemo(() => {
    if (!plays) return [];
    const playsArray = Object.values(plays);
    if (!searchTerm) return playsArray.slice(0, 20);

    const lower = searchTerm.toLowerCase();
    return playsArray.filter(p =>
      p.name?.toLowerCase().includes(lower) ||
      p.formation?.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [plays, searchTerm]);

  if (!isOpen || !gamePlay) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`w-full max-w-xl mx-4 rounded-xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Match Play to Playbook
          </h2>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Searching for: <span className="font-medium text-amber-400">{gamePlay.playName}</span>
          </p>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search playbook..."
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm ${
                isLight
                  ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400'
                  : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500'
              } focus:outline-none focus:border-amber-500`}
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredPlays.map(play => (
              <button
                key={play.id}
                onClick={() => {
                  onMatch(gamePlay.id, play.id);
                  onClose();
                }}
                className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between ${
                  isLight
                    ? 'hover:bg-gray-100 text-gray-900'
                    : 'hover:bg-slate-800 text-white'
                }`}
              >
                <span>
                  {play.formation && <span className="text-slate-400">{play.formation} </span>}
                  {play.name}
                </span>
                <Check size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
            {filteredPlays.length === 0 && (
              <p className={`text-center py-4 text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                No plays found
              </p>
            )}
          </div>

          <button
            onClick={() => {
              onMatch(gamePlay.id, null);
              onClose();
            }}
            className={`w-full mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
              isLight
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Mark as Unmatched
          </button>
        </div>
      </div>
    </div>
  );
}

// Game Film Review Wizard
function GameFilmReviewWizard({
  isOpen,
  onClose,
  gamePlays,
  plays,
  onUpdatePlayReview,
  filmReviewTags,
  isLight,
  weekId,
  weekName,
  opponent
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentGamePlay = gamePlays[currentIndex];
  const matchedPlay = currentGamePlay?.matchedPlayId ? plays[currentGamePlay.matchedPlayId] : null;

  const workedTags = filmReviewTags?.worked || [];
  const didntWorkTags = filmReviewTags?.didntWork || [];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < gamePlays.length - 1) setCurrentIndex(currentIndex + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          if (currentGamePlay) {
            onUpdatePlayReview(currentGamePlay.id, { rating: parseInt(e.key) });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, gamePlays.length, currentGamePlay, onUpdatePlayReview, onClose]);

  if (!isOpen || gamePlays.length === 0) return null;

  const review = currentGamePlay?.review || {};
  const reviewedCount = gamePlays.filter(p => p.review?.rating > 0).length;

  const isWorkedTagSelected = (tagId) => (review.workedTags || []).includes(tagId);
  const isDidntWorkTagSelected = (tagId) => (review.didntWorkTags || []).includes(tagId);

  const handleToggleWorkedTag = (tagId) => {
    const currentTags = review.workedTags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    onUpdatePlayReview(currentGamePlay.id, { workedTags: newTags });
  };

  const handleToggleDidntWorkTag = (tagId) => {
    const currentTags = review.didntWorkTags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    onUpdatePlayReview(currentGamePlay.id, { didntWorkTags: newTags });
  };

  // Get display values - prefer matched play data, fall back to imported data
  const formation = matchedPlay?.formation || currentGamePlay?.formation || '';
  const backfield = currentGamePlay?.backfield || '';
  const playName = matchedPlay?.name || currentGamePlay?.playName || 'Unknown Play';

  // Build tags for additional info (motion, type, direction - NOT backfield anymore)
  const playTags = [];
  if (currentGamePlay?.motion) playTags.push(currentGamePlay.motion);
  if (currentGamePlay?.playType) playTags.push(currentGamePlay.playType);
  if (currentGamePlay?.playDir) playTags.push(currentGamePlay.playDir);

  // Situation display
  const situation = [];
  if (currentGamePlay?.quarter) {
    let qStr = `Q${currentGamePlay.quarter}`;
    if (currentGamePlay?.series) qStr += ` S${currentGamePlay.series}`;
    situation.push(qStr);
  }
  if (currentGamePlay?.down && currentGamePlay?.distance) {
    situation.push(`${currentGamePlay.down}&${currentGamePlay.distance}`);
  }
  if (currentGamePlay?.yardLine) {
    const yl = currentGamePlay.yardLine;
    situation.push(yl < 0 ? `Own ${Math.abs(yl)}` : `Opp ${yl}`);
  }
  if (currentGamePlay?.hash) situation.push(currentGamePlay.hash);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`w-full max-w-5xl mx-4 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Game Film Review - vs {opponent}
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Play {currentIndex + 1} of {gamePlays.length} ({reviewedCount} reviewed)
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800'}`}
            >
              <X size={24} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
            </button>
          </div>
          {/* Keyboard hints */}
          <div className={`flex items-center gap-4 mt-2 text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>&#8592;</kbd> Prev</span>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>&#8594;</kbd> Next</span>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>1-5</kbd> Rate</span>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>Esc</kbd> Close</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`h-1.5 flex-shrink-0 ${isLight ? 'bg-gray-200' : 'bg-slate-800'}`}>
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${((currentIndex + 1) / gamePlays.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Play Info Card */}
          <div className={`rounded-xl p-6 mb-6 ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className={`text-xs uppercase tracking-wide mb-2 flex items-center gap-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  {situation.join(' | ')}
                  {currentGamePlay?.matchConfidence === 'auto' && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">Auto-matched</span>
                  )}
                  {currentGamePlay?.matchConfidence === 'manual' && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-xs">Manually matched</span>
                  )}
                  {!currentGamePlay?.matchedPlayId && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs">Unmatched</span>
                  )}
                </div>
                <h3 className={`text-2xl font-bold mb-2 flex items-center gap-2 flex-wrap ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {formation && (
                    <span className={isLight ? 'text-sky-600' : 'text-sky-400'}>{formation}</span>
                  )}
                  {formation && backfield && <span className={`text-lg ${isLight ? 'text-gray-300' : 'text-slate-600'}`}>|</span>}
                  {backfield && (
                    <span className={isLight ? 'text-purple-600' : 'text-purple-400'}>{backfield}</span>
                  )}
                  {(formation || backfield) && <span className={`text-lg ${isLight ? 'text-gray-300' : 'text-slate-600'}`}>|</span>}
                  <span>{playName}</span>
                </h3>
                <div className={`flex flex-wrap gap-2 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {/* Show backfield, motion, type, direction tags */}
                  {playTags.map((tag, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded ${isLight ? 'bg-violet-100 text-violet-700' : 'bg-violet-500/20 text-violet-400'}`}>
                      {tag}
                    </span>
                  ))}
                  {currentGamePlay?.result && (
                    <span className={`px-2 py-0.5 rounded ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                      {currentGamePlay.result}
                    </span>
                  )}
                  {currentGamePlay?.gainLoss !== undefined && currentGamePlay?.gainLoss !== null && (
                    <span className={`px-2 py-0.5 rounded ${
                      currentGamePlay.gainLoss > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : currentGamePlay.gainLoss < 0
                          ? 'bg-red-500/20 text-red-400'
                          : isLight ? 'bg-gray-200' : 'bg-slate-700'
                    }`}>
                      {currentGamePlay.gainLoss > 0 ? '+' : ''}{currentGamePlay.gainLoss} yds
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs uppercase tracking-wide mb-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Rating
                </div>
                <StarRating
                  rating={review.rating || 0}
                  onChange={(val) => onUpdatePlayReview(currentGamePlay.id, { rating: val })}
                  size="large"
                />
              </div>
            </div>
          </div>

          {/* Tag Sections */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Reasons It Worked */}
            <div className={`rounded-xl p-4 ${isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-900/20 border border-emerald-800'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                <Zap size={16} />
                Why It Worked
              </h4>
              <div className="flex flex-wrap gap-2">
                {workedTags.length === 0 ? (
                  <p className={`text-xs ${isLight ? 'text-emerald-600' : 'text-emerald-500/70'}`}>
                    No tags defined. Add them in Self-Scout Setup.
                  </p>
                ) : (
                  workedTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleWorkedTag(tag.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isWorkedTagSelected(tag.id)
                          ? 'bg-emerald-500 text-white shadow-lg scale-105'
                          : isLight
                            ? 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-emerald-900/30 text-emerald-400 border border-emerald-700 hover:bg-emerald-900/50'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Reasons It Didn't Work */}
            <div className={`rounded-xl p-4 ${isLight ? 'bg-orange-50 border border-orange-200' : 'bg-orange-900/20 border border-orange-800'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLight ? 'text-orange-800' : 'text-orange-400'}`}>
                <AlertTriangle size={16} />
                Why It Didn't Work
              </h4>
              <div className="flex flex-wrap gap-2">
                {didntWorkTags.length === 0 ? (
                  <p className={`text-xs ${isLight ? 'text-orange-600' : 'text-orange-500/70'}`}>
                    No tags defined. Add them in Self-Scout Setup.
                  </p>
                ) : (
                  didntWorkTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleDidntWorkTag(tag.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDidntWorkTagSelected(tag.id)
                          ? 'bg-orange-500 text-white shadow-lg scale-105'
                          : isLight
                            ? 'bg-white text-orange-700 border border-orange-300 hover:bg-orange-100'
                            : 'bg-orange-900/30 text-orange-400 border border-orange-700 hover:bg-orange-900/50'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Notes and Fixes */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/30 border border-slate-700'}`}>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Notes
              </label>
              <input
                type="text"
                value={review.notes || ''}
                onChange={(e) => onUpdatePlayReview(currentGamePlay.id, { notes: e.target.value })}
                placeholder="Any additional context..."
                className={`w-full px-4 py-3 rounded-lg text-sm ${
                  isLight
                    ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                    : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                } focus:outline-none`}
              />
            </div>
            <div className={`rounded-xl p-4 ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/30 border border-slate-700'}`}>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Fixes / Adjustments
              </label>
              <input
                type="text"
                value={review.fixes || ''}
                onChange={(e) => onUpdatePlayReview(currentGamePlay.id, { fixes: e.target.value })}
                placeholder="What to fix for next time..."
                className={`w-full px-4 py-3 rounded-lg text-sm ${
                  isLight
                    ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                    : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                } focus:outline-none`}
              />
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className={`px-6 py-4 border-t flex-shrink-0 flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
        }`}>
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium ${
              currentIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
              {currentIndex + 1} / {gamePlays.length}
            </div>
            {review.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-sm font-medium">{review.rating}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (currentIndex === gamePlays.length - 1) {
                onClose();
              } else {
                setCurrentIndex(currentIndex + 1);
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600`}
          >
            {currentIndex === gamePlays.length - 1 ? 'Done' : 'Next'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Game Play Card for list view
function GamePlayCard({ gamePlay, matchedPlay, plays, onOpenMatch, onUpdateReview, isLight, index }) {
  // Get display values - prefer matched play data, fall back to imported data
  const formation = matchedPlay?.formation || gamePlay.formation || '';
  const backfield = gamePlay.backfield || '';
  const motion = gamePlay.motion || '';
  const playName = matchedPlay?.name || gamePlay.playName || '';

  const review = gamePlay.review || {};

  // Build full play call parts (formation, backfield, motion, personnel, tag, play)
  // Users can customize which columns appear via column mapping
  const callParts = [];
  if (formation) callParts.push({ text: formation, color: 'sky' });
  if (backfield) callParts.push({ text: backfield, color: 'purple' });
  if (motion) callParts.push({ text: motion, color: 'amber' });
  if (gamePlay.personnel) callParts.push({ text: gamePlay.personnel, color: 'orange' });
  if (playName) callParts.push({ text: playName, color: 'white' });
  if (gamePlay.tag) callParts.push({ text: gamePlay.tag, color: 'teal' });

  // Custom columns that users may have mapped
  if (gamePlay.custom1) callParts.push({ text: gamePlay.custom1, color: 'rose' });
  if (gamePlay.custom2) callParts.push({ text: gamePlay.custom2, color: 'lime' });
  if (gamePlay.custom3) callParts.push({ text: gamePlay.custom3, color: 'cyan' });

  // Build tags for additional info (type, direction)
  const tags = [];
  if (gamePlay.playType) tags.push(gamePlay.playType);
  if (gamePlay.playDir) tags.push(gamePlay.playDir);

  // Color mapping for call parts
  const colorClasses = {
    sky: isLight ? 'text-sky-600' : 'text-sky-400',
    purple: isLight ? 'text-purple-600' : 'text-purple-400',
    amber: isLight ? 'text-amber-600' : 'text-amber-400',
    teal: isLight ? 'text-teal-600' : 'text-teal-400',
    orange: isLight ? 'text-orange-600' : 'text-orange-400',
    rose: isLight ? 'text-rose-600' : 'text-rose-400',
    lime: isLight ? 'text-lime-600' : 'text-lime-400',
    cyan: isLight ? 'text-cyan-600' : 'text-cyan-400',
    white: isLight ? 'text-gray-900' : 'text-white'
  };

  return (
    <div className={`rounded-lg border p-3 ${
      isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'
    }`}>
      <div className="flex items-center gap-3">
        {/* Play number */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
          isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-400'
        }`}>
          {gamePlay.rowNumber || index + 1}
        </div>

        {/* Situation */}
        <div className="w-28 flex-shrink-0">
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            Q{gamePlay.quarter}{gamePlay.series ? ` S${gamePlay.series}` : ''} | {gamePlay.down}&{gamePlay.distance}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-600'}`}>
            {gamePlay.yardLine < 0 ? `Own ${Math.abs(gamePlay.yardLine)}` : `Opp ${gamePlay.yardLine}`}
            {gamePlay.hash && ` ${gamePlay.hash}`}
          </div>
        </div>

        {/* Full Play Call - Formation | Backfield | Motion | Play */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            {callParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className={`${isLight ? 'text-gray-300' : 'text-slate-600'}`}>|</span>}
                <span className={`text-sm ${part.color === 'white' ? 'font-medium' : ''} ${colorClasses[part.color]}`}>
                  {part.text}
                </span>
              </span>
            ))}
            {callParts.length === 0 && (
              <span className={`text-sm italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                No play call data
              </span>
            )}
          </div>
          {/* OD Call if different from constructed call */}
          {gamePlay.odCall && gamePlay.odCall !== playName && (
            <div className={`text-xs mt-0.5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
              {gamePlay.odCall}
            </div>
          )}
        </div>

        {/* Tags and match status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {tags.length > 0 && (
            <div className="flex items-center gap-1">
              {tags.map((tag, i) => (
                <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                  isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-400'
                }`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          {gamePlay.matchedPlayId ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Link2 size={10} />
            </span>
          ) : (
            <button
              onClick={() => onOpenMatch(gamePlay)}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
            >
              <LinkIcon size={10} />
              Match
            </button>
          )}
        </div>

        {/* Result */}
        <div className="w-20 text-center">
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            {gamePlay.result}
          </div>
          <div className={`text-sm font-medium ${
            gamePlay.gainLoss > 0
              ? 'text-emerald-400'
              : gamePlay.gainLoss < 0
                ? 'text-red-400'
                : isLight ? 'text-gray-500' : 'text-slate-400'
          }`}>
            {gamePlay.gainLoss > 0 ? '+' : ''}{gamePlay.gainLoss} yds
          </div>
        </div>

        {/* Rating */}
        <StarRating
          rating={review.rating || 0}
          onChange={(val) => onUpdateReview(gamePlay.id, { rating: val })}
          size="small"
        />
      </div>
    </div>
  );
}

// Calculate detailed stats for a set of plays
function calculateDetailedStats(plays) {
  if (!plays || plays.length === 0) return null;

  let rushAttempts = 0;
  let rushYards = 0;
  let passAttempts = 0;
  let passYards = 0;
  let completions = 0;
  let explosives = 0;
  let efficientPlays = 0;

  // Down efficiency tracking
  const downStats = {
    1: { attempts: 0, successful: 0 },
    2: { attempts: 0, successful: 0 },
    3: { attempts: 0, successful: 0 },
    4: { attempts: 0, successful: 0 }
  };

  // Track best plays
  const allPlays = [];

  plays.forEach(p => {
    const yards = p.gainLoss || 0;
    const result = (p.result || '').toLowerCase();
    const isRun = p.playType === 'Run' || result.includes('rush') || result.includes('run');
    const isIncomplete = result.includes('inc') || result.includes('incomplete');
    const isSack = result.includes('sack');
    const down = p.down || 1;
    const distance = p.distance || 10;

    // Track all plays for "best plays"
    allPlays.push({
      ...p,
      yards,
      isRun
    });

    if (isRun) {
      rushAttempts++;
      rushYards += yards;
      if (yards >= 12) explosives++;
    } else {
      passAttempts++;
      passYards += yards;
      // Count completions (positive yards or result contains completion indicators, not incomplete/sack)
      if (!isIncomplete && !isSack && yards > 0) {
        completions++;
      }
      if (yards >= 16) explosives++;
    }

    // Overall Efficiency calculation:
    // 1st down: 4+ yards or 40% of distance
    // 2nd down: 50%+ of remaining distance
    // 3rd/4th down: convert (get the first down)
    const gotTD = result.includes('td') || result.includes('touchdown');
    let isEfficient = false;
    if (gotTD) {
      isEfficient = true;
    } else if (down === 1) {
      isEfficient = yards >= Math.min(4, distance * 0.4);
    } else if (down === 2) {
      isEfficient = yards >= Math.ceil(distance / 2);
    } else {
      // 3rd or 4th down - need to convert
      isEfficient = yards >= distance;
    }
    if (isEfficient) efficientPlays++;

    // Down efficiency (conversions only)
    if (down >= 1 && down <= 4) {
      downStats[down].attempts++;
      const gotFirstDown = yards >= distance;
      if (gotFirstDown || gotTD) {
        downStats[down].successful++;
      }
    }
  });

  // Sort for best plays (top 3 by yards)
  const bestPlays = allPlays
    .filter(p => (p.yards || 0) > 0)
    .sort((a, b) => (b.yards || 0) - (a.yards || 0))
    .slice(0, 3);

  const totalPlays = rushAttempts + passAttempts;

  return {
    rushAttempts,
    rushYards,
    passAttempts,
    passYards,
    completions,
    explosives,
    efficientPlays,
    efficiencyPct: totalPlays > 0 ? Math.round((efficientPlays / totalPlays) * 100) : 0,
    totalYards: rushYards + passYards,
    yardsPerCarry: rushAttempts > 0 ? (rushYards / rushAttempts).toFixed(1) : '0.0',
    yardsPerAttempt: passAttempts > 0 ? (passYards / passAttempts).toFixed(1) : '0.0',
    yardsPerCompletion: completions > 0 ? (passYards / completions).toFixed(1) : '0.0',
    downStats,
    bestPlays
  };
}

// Build full play call string from play data
function buildPlayCallString(play) {
  const parts = [];
  if (play.formation) parts.push(play.formation);
  if (play.backfield) parts.push(play.backfield);
  if (play.motion) parts.push(play.motion);
  if (play.personnel) parts.push(play.personnel);
  if (play.playName) parts.push(play.playName);
  if (play.tag) parts.push(play.tag);
  if (play.custom1) parts.push(play.custom1);
  if (play.custom2) parts.push(play.custom2);
  if (play.custom3) parts.push(play.custom3);

  return parts.length > 0 ? parts.join(' ') : play.odCall || `Play ${play.rowNumber || '?'}`;
}

// Summary Stats Card
function SummaryStatsCard({ summary, isLight, plays }) {
  // Generate insights with error handling
  const insights = useMemo(() => {
    try {
      if (!plays || plays.length < 5) return null;
      return generatePlayInsights(plays);
    } catch (err) {
      console.error('Error generating insights:', err);
      return null;
    }
  }, [plays]);

  if (!summary) return null;

  const stats = summary.detailedStats;

  return (
    <div className={`rounded-xl ${
      isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/30 border border-slate-700'
    }`}>
      {/* Top row - main stats */}
      <div className="grid grid-cols-7 gap-3 p-4 border-b border-slate-700/50">
        <div className="text-center">
          <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {summary.offensivePlays}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Plays</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {stats?.totalYards || 0}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Total Yds</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.rushYards || 0}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Rush Yds</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-sky-400">
            {stats?.passYards || 0}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Pass Yds</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            (stats?.efficiencyPct || 0) >= 50 ? 'text-emerald-400' :
            (stats?.efficiencyPct || 0) >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {stats?.efficiencyPct || 0}%
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">
            {stats?.explosives || 0}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Explosives</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {((stats?.totalYards || 0) / (summary.offensivePlays || 1)).toFixed(1)}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Yds/Play</div>
        </div>
      </div>

      {/* Second row - rushing and passing details */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Rushing */}
        <div className={`p-3 rounded-lg ${isLight ? 'bg-emerald-50' : 'bg-emerald-500/10'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className={`text-sm font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              Rushing
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {stats?.rushAttempts || 0}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Carries</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {stats?.rushYards || 0}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Yards</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {stats?.yardsPerCarry || '0.0'}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>YPC</div>
            </div>
          </div>
        </div>

        {/* Passing */}
        <div className={`p-3 rounded-lg ${isLight ? 'bg-sky-50' : 'bg-sky-500/10'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-400"></div>
            <span className={`text-sm font-medium ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
              Passing
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {stats?.completions || 0}/{stats?.passAttempts || 0}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Comp/Att</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {stats?.passYards || 0}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Yards</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {stats?.yardsPerAttempt || '0.0'}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>YPA</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {stats?.yardsPerCompletion || '0.0'}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Y/C</div>
            </div>
          </div>
        </div>
      </div>

      {/* Third row - down efficiency and best plays */}
      <div className="grid grid-cols-2 gap-4 p-4 pt-0">
        {/* Down Efficiency */}
        <div className={`p-3 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-slate-700/30'}`}>
          <div className={`text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
            Down Efficiency
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(down => {
              const ds = stats?.downStats?.[down] || { attempts: 0, successful: 0 };
              const pct = ds.attempts > 0 ? Math.round((ds.successful / ds.attempts) * 100) : 0;
              return (
                <div key={down} className="text-center">
                  <div className={`text-sm font-bold ${
                    pct >= 50 ? 'text-emerald-400' : pct >= 30 ? 'text-amber-400' : isLight ? 'text-gray-900' : 'text-white'
                  }`}>
                    {ds.successful}/{ds.attempts}
                  </div>
                  <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    {down === 1 ? '1st' : down === 2 ? '2nd' : down === 3 ? '3rd' : '4th'}
                  </div>
                  <div className={`text-xs ${
                    pct >= 50 ? 'text-emerald-400' : pct >= 30 ? 'text-amber-400' : isLight ? 'text-gray-400' : 'text-slate-500'
                  }`}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Play Calls */}
        <div className={`p-3 rounded-lg ${isLight ? 'bg-amber-50' : 'bg-amber-500/10'}`}>
          <div className={`text-sm font-medium mb-2 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
            Best Play Calls
          </div>
          <div className="space-y-1.5">
            {(stats?.bestPlays || []).length > 0 ? (
              stats.bestPlays.map((play, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span className={`text-xs truncate flex-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                    {buildPlayCallString(play)}
                  </span>
                  <span className={`text-xs font-bold whitespace-nowrap ${play.isRun ? 'text-emerald-400' : 'text-sky-400'}`}>
                    +{play.yards}
                  </span>
                </div>
              ))
            ) : (
              <div className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                No plays yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      {insights && insights.length > 0 && (
        <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-slate-700/50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-violet-400" />
            <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Smart Insights
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {insights.map((insight, idx) => {
              const bgClass = insight.type === 'positive'
                ? (isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-500/10 border border-emerald-500/30')
                : insight.type === 'negative'
                ? (isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-500/30')
                : (isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/30');

              const badgeClass = insight.type === 'positive'
                ? 'bg-emerald-500/20 text-emerald-400'
                : insight.type === 'negative'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400';

              const textClass = insight.type === 'positive'
                ? (isLight ? 'text-emerald-700' : 'text-emerald-300')
                : insight.type === 'negative'
                ? (isLight ? 'text-red-700' : 'text-red-300')
                : (isLight ? 'text-blue-700' : 'text-blue-300');

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg text-xs ${bgClass} ${insight.highlight ? 'ring-2 ring-violet-500/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badgeClass}`}>
                      {insight.category}
                    </span>
                  </div>
                  <div className={`mt-1.5 font-medium ${textClass}`}>
                    {insight.text}
                  </div>
                  {insight.detail && (
                    <div className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      {insight.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Generate smart insights from play data
function generatePlayInsights(plays) {
  if (!plays || plays.length < 5) return null; // Need enough data for insights

  const insights = [];

  // Helper to calculate stats for a group of plays
  const calcGroupStats = (groupPlays) => {
    if (groupPlays.length === 0) return null;
    const totalYards = groupPlays.reduce((sum, p) => sum + (p.gainLoss || 0), 0);
    const avgYards = totalYards / groupPlays.length;
    const positiveCount = groupPlays.filter(p => (p.gainLoss || 0) > 0).length;
    const successRate = (positiveCount / groupPlays.length) * 100;
    const explosives = groupPlays.filter(p => {
      const yards = p.gainLoss || 0;
      const result = (p.result || '').toLowerCase();
      const isRun = p.playType === 'Run' || result.includes('rush') || result.includes('run');
      return isRun ? yards >= 12 : yards >= 16;
    }).length;
    return { count: groupPlays.length, totalYards, avgYards, successRate, explosives, plays: groupPlays };
  };

  // Analyze by field (formation, backfield, motion, tag, personnel)
  const analyzeByField = (fieldName, minCount = 3) => {
    const groups = {};
    plays.forEach(p => {
      const value = p[fieldName];
      if (value && typeof value === 'string' && value.trim()) {
        const key = value.trim().toUpperCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      }
    });

    return Object.entries(groups)
      .filter(([_, groupPlays]) => groupPlays.length >= minCount)
      .map(([name, groupPlays]) => {
        const stats = calcGroupStats(groupPlays);
        return stats ? { name, field: fieldName, ...stats } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.avgYards || 0) - (a.avgYards || 0));
  };

  // Analyze by words/terms in play call
  const analyzeByTerms = (minCount = 3) => {
    const termGroups = {};
    plays.forEach(p => {
      // Get all words from play call parts
      const fullCall = [p.formation, p.backfield, p.motion, p.personnel, p.playName, p.tag, p.custom1, p.custom2, p.custom3]
        .filter(Boolean)
        .join(' ');

      // Split into words and normalize
      const words = fullCall.toUpperCase().split(/[\s\-\/]+/).filter(w => w.length >= 2);
      const uniqueWords = [...new Set(words)];

      uniqueWords.forEach(word => {
        if (!termGroups[word]) termGroups[word] = [];
        termGroups[word].push(p);
      });
    });

    return Object.entries(termGroups)
      .filter(([_, groupPlays]) => groupPlays.length >= minCount)
      .map(([term, groupPlays]) => {
        const stats = calcGroupStats(groupPlays);
        return stats ? { term, ...stats } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.avgYards || 0) - (a.avgYards || 0));
  };

  // Get overall average for comparison
  const overallStats = calcGroupStats(plays);
  const overallAvg = overallStats?.avgYards || 0;

  // Find best and worst formations
  const formationStats = analyzeByField('formation', 2);
  if (formationStats.length > 0) {
    const best = formationStats[0];
    if (best.avgYards > overallAvg + 1 && best.count >= 3) {
      insights.push({
        type: 'positive',
        category: 'Formation',
        text: `${best.name} formation averaged ${best.avgYards.toFixed(1)} yds/play (${best.count} plays)`,
        detail: `${best.successRate.toFixed(0)}% success rate, ${best.explosives} explosives`
      });
    }
    const worst = formationStats[formationStats.length - 1];
    if (worst && worst.avgYards < overallAvg - 1 && worst.count >= 3 && formationStats.length > 1) {
      insights.push({
        type: 'negative',
        category: 'Formation',
        text: `${worst.name} formation averaged only ${worst.avgYards.toFixed(1)} yds/play (${worst.count} plays)`,
        detail: `${worst.successRate.toFixed(0)}% success rate`
      });
    }
  }

  // Find best backfields
  const backfieldStats = analyzeByField('backfield', 2);
  if (backfieldStats.length > 0) {
    const best = backfieldStats[0];
    if (best.avgYards > overallAvg + 1 && best.count >= 3) {
      insights.push({
        type: 'positive',
        category: 'Backfield',
        text: `${best.name} backfield averaged ${best.avgYards.toFixed(1)} yds/play (${best.count} plays)`,
        detail: `${best.successRate.toFixed(0)}% success rate`
      });
    }
  }

  // Find best motions
  const motionStats = analyzeByField('motion', 2);
  if (motionStats.length > 0) {
    const best = motionStats[0];
    if (best.avgYards > overallAvg + 1 && best.count >= 2) {
      insights.push({
        type: 'positive',
        category: 'Motion',
        text: `${best.name} motion averaged ${best.avgYards.toFixed(1)} yds/play (${best.count} plays)`,
        detail: `${best.successRate.toFixed(0)}% success rate`
      });
    }
  }

  // Find best tags
  const tagStats = analyzeByField('tag', 2);
  if (tagStats.length > 0) {
    const best = tagStats[0];
    if (best.avgYards > overallAvg + 0.5 && best.count >= 2) {
      insights.push({
        type: 'positive',
        category: 'Tag',
        text: `${best.name} tag averaged ${best.avgYards.toFixed(1)} yds/play (${best.count} plays)`,
        detail: `${best.successRate.toFixed(0)}% success rate`
      });
    }
  }

  // Find standout terms/words in play calls
  const termStats = analyzeByTerms(3);
  // Filter out common words and find interesting patterns
  const commonWords = new Set(['THE', 'AND', 'OR', 'TO', 'IN', 'ON', 'AT', 'BY', 'FOR', 'OF', 'VS', 'LEFT', 'RIGHT', 'RUN', 'PASS']);
  const interestingTerms = termStats.filter(t =>
    !commonWords.has(t.term) &&
    t.term.length >= 3 &&
    (t.avgYards > overallAvg + 2 || t.avgYards < overallAvg - 2)
  );

  if (interestingTerms.length > 0) {
    // Best performing term
    const bestTerm = interestingTerms[0];
    if (bestTerm.avgYards > overallAvg + 2) {
      insights.push({
        type: 'positive',
        category: 'Term',
        text: `Plays with "${bestTerm.term}" averaged ${bestTerm.avgYards.toFixed(1)} yds/play (${bestTerm.count} plays)`,
        detail: `${bestTerm.successRate.toFixed(0)}% success rate, ${bestTerm.explosives} explosives`,
        highlight: true
      });
    }

    // Worst performing term
    const worstTerms = interestingTerms.filter(t => t.avgYards < overallAvg - 2);
    if (worstTerms.length > 0) {
      const worstTerm = worstTerms[worstTerms.length - 1];
      insights.push({
        type: 'negative',
        category: 'Term',
        text: `Plays with "${worstTerm.term}" averaged only ${worstTerm.avgYards.toFixed(1)} yds/play (${worstTerm.count} plays)`,
        detail: `${worstTerm.successRate.toFixed(0)}% success rate`
      });
    }
  }

  // Run vs Pass insights
  const runs = plays.filter(p => p.playType === 'Run' || (p.result || '').toLowerCase().includes('rush'));
  const passes = plays.filter(p => !runs.includes(p));
  const runStats = calcGroupStats(runs);
  const passStats = calcGroupStats(passes);

  if (runStats && passStats && runs.length >= 5 && passes.length >= 5) {
    if (runStats.avgYards > passStats.avgYards + 2) {
      insights.push({
        type: 'info',
        category: 'Run/Pass',
        text: `Running game outperformed passing (${runStats.avgYards.toFixed(1)} vs ${passStats.avgYards.toFixed(1)} yds/play)`,
        detail: `Run: ${runStats.successRate.toFixed(0)}% success, Pass: ${passStats.successRate.toFixed(0)}% success`
      });
    } else if (passStats.avgYards > runStats.avgYards + 2) {
      insights.push({
        type: 'info',
        category: 'Run/Pass',
        text: `Passing game outperformed running (${passStats.avgYards.toFixed(1)} vs ${runStats.avgYards.toFixed(1)} yds/play)`,
        detail: `Pass: ${passStats.successRate.toFixed(0)}% success, Run: ${runStats.successRate.toFixed(0)}% success`
      });
    }
  }

  return insights.slice(0, 6); // Return top 6 insights
}

// Determine series outcome from plays
function getSeriesOutcome(seriesPlays) {
  if (!seriesPlays || seriesPlays.length === 0) return { type: 'unknown', label: '?' };

  const lastPlay = seriesPlays[seriesPlays.length - 1];
  const result = (lastPlay.result || '').toLowerCase();

  // Check for touchdown
  if (result.includes('td') || result.includes('touchdown')) {
    return { type: 'td', label: 'TD', color: 'emerald' };
  }

  // Check for field goal
  if (result.includes('fg') || result.includes('field goal')) {
    return { type: 'fg', label: 'FG', color: 'emerald' };
  }

  // Check for turnover
  if (result.includes('int') || result.includes('interception')) {
    return { type: 'turnover', label: 'INT', color: 'red' };
  }
  if (result.includes('fumble') && (result.includes('lost') || result.includes('turnover'))) {
    return { type: 'turnover', label: 'FUM', color: 'red' };
  }

  // Check for punt
  if (result.includes('punt')) {
    return { type: 'punt', label: 'PUNT', color: 'amber' };
  }

  // Check for turnover on downs
  if (result.includes('downs') || result.includes('turnover on downs')) {
    return { type: 'turnover', label: 'TOD', color: 'red' };
  }

  // Check if it ended in opponent territory (possible missed FG or end of half)
  if (lastPlay.yardLine > 0 && lastPlay.yardLine <= 40) {
    // Could be missed FG, end of half, etc.
    return { type: 'other', label: '—', color: 'slate' };
  }

  return { type: 'unknown', label: '—', color: 'slate' };
}

// Series Group component - groups plays by series with outcome indicator
function SeriesGroup({ seriesNum, plays, outcome, children, isLight, isExpanded, onToggle }) {
  const colorClasses = {
    emerald: {
      border: 'border-l-emerald-500',
      bg: isLight ? 'bg-emerald-50' : 'bg-emerald-500/10',
      text: 'text-emerald-500',
      badge: isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
    },
    red: {
      border: 'border-l-red-500',
      bg: isLight ? 'bg-red-50' : 'bg-red-500/10',
      text: 'text-red-500',
      badge: isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
    },
    amber: {
      border: 'border-l-amber-500',
      bg: isLight ? 'bg-amber-50' : 'bg-amber-500/10',
      text: 'text-amber-500',
      badge: isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
    },
    slate: {
      border: isLight ? 'border-l-gray-400' : 'border-l-slate-600',
      bg: isLight ? 'bg-gray-50' : 'bg-slate-800/30',
      text: isLight ? 'text-gray-500' : 'text-slate-500',
      badge: isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-400'
    }
  };

  const colors = colorClasses[outcome.color] || colorClasses.slate;

  // Calculate detailed series stats
  const seriesStats = calculateDetailedStats(plays);
  const totalYards = seriesStats?.totalYards || 0;
  const firstPlay = plays[0];
  const lastPlay = plays[plays.length - 1];

  return (
    <div className={`rounded-lg border-l-4 ${colors.border} ${
      isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/30 border border-slate-700'
    } overflow-hidden`}>
      {/* Series Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between ${colors.bg} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`px-2 py-1 rounded text-xs font-bold ${colors.badge}`}>
            {outcome.label}
          </div>
          <div className="text-left">
            <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Series {seriesNum}
            </div>
            <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              Q{firstPlay?.quarter} • {plays.length} plays • {totalYards > 0 ? '+' : ''}{totalYards} yds
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini stats for series */}
          <div className="hidden sm:flex items-center gap-3">
            {seriesStats?.rushAttempts > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 text-xs font-medium">{seriesStats.rushYards}</span>
                <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>rush</span>
              </div>
            )}
            {seriesStats?.passAttempts > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sky-400 text-xs font-medium">{seriesStats.passYards}</span>
                <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>pass</span>
              </div>
            )}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            {firstPlay?.yardLine < 0 ? `Own ${Math.abs(firstPlay?.yardLine)}` : `Opp ${firstPlay?.yardLine}`}
            {' → '}
            {lastPlay?.yardLine < 0 ? `Own ${Math.abs(lastPlay?.yardLine)}` : `Opp ${lastPlay?.yardLine}`}
          </div>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Expanded Stats Bar */}
      {isExpanded && seriesStats && (
        <div className={`px-4 py-2 border-t ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'}`}>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Rushing stats */}
            {seriesStats.rushAttempts > 0 && (
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Rush:</span>
                <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                  {seriesStats.rushAttempts} att, {seriesStats.rushYards} yds, {seriesStats.yardsPerCarry} YPC
                </span>
              </div>
            )}
            {/* Passing stats */}
            {seriesStats.passAttempts > 0 && (
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>Pass:</span>
                <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                  {seriesStats.completions}/{seriesStats.passAttempts}, {seriesStats.passYards} yds, {seriesStats.yardsPerAttempt} YPA
                </span>
              </div>
            )}
            {/* Best play call in series */}
            {seriesStats.bestPlays?.[0] && (
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>Best:</span>
                <span className={`truncate max-w-xs ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  {buildPlayCallString(seriesStats.bestPlays[0])} (+{seriesStats.bestPlays[0].yards})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plays */}
      {isExpanded && (
        <div className="p-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

// Group plays by series
function groupPlaysBySeries(plays) {
  const groups = [];
  let currentSeries = null;
  let currentPlays = [];

  plays.forEach(play => {
    const series = play.series || 0;
    if (series !== currentSeries && currentPlays.length > 0) {
      groups.push({
        series: currentSeries,
        plays: currentPlays,
        outcome: getSeriesOutcome(currentPlays)
      });
      currentPlays = [];
    }
    currentSeries = series;
    currentPlays.push(play);
  });

  // Don't forget the last group
  if (currentPlays.length > 0) {
    groups.push({
      series: currentSeries,
      plays: currentPlays,
      outcome: getSeriesOutcome(currentPlays)
    });
  }

  return groups;
}

// Main PostgameReview component
export default function PostgameReview() {
  const { weekId } = useParams();
  const {
    weeks,
    plays,
    settings,
    school,
    setupConfig,
    updateWeek,
    updatePlay,
    updateSetupConfig,
    setCurrentWeekId
  } = useSchool();

  // Set current week context
  useEffect(() => {
    if (weekId) {
      setCurrentWeekId(weekId);
    }
  }, [weekId, setCurrentWeekId]);

  // Theme
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  // Get current week
  const currentWeek = weeks.find(w => w.id === weekId);

  // File input ref
  const fileInputRef = useRef(null);

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showFilmWizard, setShowFilmWizard] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [showPlayMatching, setShowPlayMatching] = useState(false);
  const [showNewTerms, setShowNewTerms] = useState(false);
  const [detectedNewTerms, setDetectedNewTerms] = useState(null);
  const [selectedGamePlay, setSelectedGamePlay] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [importError, setImportError] = useState(null);
  const [expandedSeries, setExpandedSeries] = useState(new Set());

  // Filter state
  const [viewMode, setViewMode] = useState('drives'); // 'drives', 'downs', 'quarters', 'all'
  const [filters, setFilters] = useState({
    down: null,      // 1, 2, 3, 4, 'p10' (P&10), or null for all
    downDistance: null, // down & distance category id or null for all
    quarter: null,   // 1, 2, 3, 4, or null for all
    half: null,      // 1, 2, or null for all
    drive: null,     // series number or null for all
    playType: null,  // 'run', 'pass', or null for all
    result: null,    // 'positive', 'negative', 'explosive', 'firstdown', or null
    fieldZone: null  // field zone id or null for all
  });

  // Get field zones and down/distance categories from setup config
  const fieldZones = setupConfig?.fieldZones || [];
  const downDistanceCategories = setupConfig?.downDistanceCategories || [];

  // Get game review from the week
  const gameReview = currentWeek?.gameReview || {
    plays: [],
    summary: null
  };

  // Get column mapping from setupConfig
  const columnMapping = setupConfig?.hudlColumnMapping || DEFAULT_COLUMN_MAPPING;

  // Film review tags
  const filmReviewTags = setupConfig?.filmReviewTags || { worked: [], didntWork: [] };

  // Filter to only offensive plays for now
  const allOffensivePlays = useMemo(() => {
    return (gameReview.plays || []).filter(p => p.odk === 'O' || !p.odk);
  }, [gameReview.plays]);

  // Identify first play of each drive (P&10)
  const firstPlayOfDriveIds = useMemo(() => {
    const ids = new Set();
    const seenSeries = new Set();
    allOffensivePlays.forEach(play => {
      const series = play.series;
      if (series && !seenSeries.has(series)) {
        seenSeries.add(series);
        ids.add(play.id);
      }
    });
    // If no series data, fall back to first play overall or plays marked as playInSeries === 1
    if (ids.size === 0) {
      allOffensivePlays.forEach((play, idx) => {
        if (play.playInSeries === 1 || idx === 0) {
          ids.add(play.id);
        }
      });
    }
    return ids;
  }, [allOffensivePlays]);

  // Apply filters to offensive plays
  const offensivePlays = useMemo(() => {
    return allOffensivePlays.filter(play => {
      const result = (play.result || '').toLowerCase();
      const isRun = play.playType === 'Run' || result.includes('rush') || result.includes('run');
      const yards = play.gainLoss || 0;

      // Down filter (including P&10 for first play of drive)
      if (filters.down !== null) {
        if (filters.down === 'p10') {
          // P&10 = first play of each drive only
          if (!firstPlayOfDriveIds.has(play.id)) return false;
        } else if (play.down !== filters.down) {
          return false;
        }
      }

      // Down & Distance category filter
      if (filters.downDistance !== null) {
        const ddCat = downDistanceCategories.find(d => d.id === filters.downDistance);
        if (ddCat) {
          const playDown = String(play.down);
          const playDistance = play.distance || 0;

          // Check down matches
          if (ddCat.down && playDown !== ddCat.down) return false;

          // Check distance range
          if (ddCat.minYards !== null && playDistance < ddCat.minYards) return false;
          if (ddCat.maxYards !== null && playDistance > ddCat.maxYards) return false;
        }
      }

      // Quarter filter
      if (filters.quarter !== null && play.quarter !== filters.quarter) return false;

      // Half filter
      if (filters.half !== null) {
        const playHalf = (play.quarter <= 2) ? 1 : 2;
        if (playHalf !== filters.half) return false;
      }

      // Drive filter
      if (filters.drive !== null && play.series !== filters.drive) return false;

      // Play type filter
      if (filters.playType === 'run' && !isRun) return false;
      if (filters.playType === 'pass' && isRun) return false;

      // Result filter
      if (filters.result === 'positive' && yards <= 0) return false;
      if (filters.result === 'negative' && yards >= 0) return false;
      if (filters.result === 'explosive') {
        const isExplosive = isRun ? yards >= 12 : yards >= 16;
        if (!isExplosive) return false;
      }
      if (filters.result === 'firstdown') {
        const distance = play.distance || 0;
        if (yards < distance) return false;
      }

      // Field zone filter (using user-defined zones from setup)
      if (filters.fieldZone !== null) {
        const zone = fieldZones.find(z => z.id === filters.fieldZone);
        if (zone) {
          // Convert play's yardLine to 1-100 scale
          // Play yardLine: negative = own territory, positive = opponent territory
          // Zone scale: 1-50 = own territory, 51-100 = opponent territory
          const playYardLine = play.yardLine || 0;
          let zoneYardLine;
          if (playYardLine < 0) {
            // Own territory: -25 (own 25) → zone yard 25
            zoneYardLine = Math.abs(playYardLine);
          } else if (playYardLine === 0) {
            // Midfield
            zoneYardLine = 50;
          } else {
            // Opponent territory: 30 (opp 30) → zone yard 70 (100 - 30)
            zoneYardLine = 100 - playYardLine;
          }

          // Check if play is within zone's yard range
          if (zoneYardLine < zone.startYard || zoneYardLine > zone.endYard) return false;
        }
      }

      return true;
    });
  }, [allOffensivePlays, filters, firstPlayOfDriveIds, fieldZones, downDistanceCategories]);

  // Get original drive outcomes (before filtering) so we always show if drive scored
  const originalDriveOutcomes = useMemo(() => {
    const outcomes = {};
    const allGroups = groupPlaysBySeries(allOffensivePlays);
    allGroups.forEach(group => {
      outcomes[group.series] = group.outcome;
    });
    return outcomes;
  }, [allOffensivePlays]);

  // Group plays by series (filtered plays, but with original outcomes)
  const seriesGroups = useMemo(() => {
    const groups = groupPlaysBySeries(offensivePlays);
    // Use original outcomes so TD/FG/etc shows even when filtering
    return groups.map(group => ({
      ...group,
      outcome: originalDriveOutcomes[group.series] || group.outcome
    }));
  }, [offensivePlays, originalDriveOutcomes]);

  // Group plays by down for down view
  const downGroups = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [], 4: [] };
    offensivePlays.forEach(play => {
      const down = play.down;
      if (down >= 1 && down <= 4) {
        groups[down].push(play);
      }
    });
    return groups;
  }, [offensivePlays]);

  // Group plays by quarter
  const quarterGroups = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [], 4: [] };
    offensivePlays.forEach(play => {
      const quarter = play.quarter;
      if (quarter >= 1 && quarter <= 4) {
        groups[quarter].push(play);
      }
    });
    return groups;
  }, [offensivePlays]);

  // Get unique drives for filter dropdown
  const uniqueDrives = useMemo(() => {
    const drives = new Set();
    allOffensivePlays.forEach(p => {
      if (p.series) drives.add(p.series);
    });
    return Array.from(drives).sort((a, b) => a - b);
  }, [allOffensivePlays]);

  // Check if we have series data
  const hasSeries = seriesGroups.length > 0 && seriesGroups.some(g => g.series !== 0 && g.series !== null);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      down: null,
      downDistance: null,
      quarter: null,
      half: null,
      drive: null,
      playType: null,
      result: null,
      fieldZone: null
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  // Auto-expand all drives when filters are active
  useEffect(() => {
    if (hasActiveFilters && seriesGroups.length > 0) {
      setExpandedSeries(new Set(seriesGroups.map(g => g.series)));
    }
  }, [hasActiveFilters, seriesGroups]);

  // Toggle series expansion
  const toggleSeries = useCallback((seriesNum) => {
    setExpandedSeries(prev => {
      const next = new Set(prev);
      if (next.has(seriesNum)) {
        next.delete(seriesNum);
      } else {
        next.add(seriesNum);
      }
      return next;
    });
  }, []);

  // Expand all series
  const expandAllSeries = useCallback(() => {
    setExpandedSeries(new Set(seriesGroups.map(g => g.series)));
  }, [seriesGroups]);

  // Compute summary stats
  const summary = useMemo(() => {
    const allPlays = gameReview.plays || [];
    const offensive = allPlays.filter(p => p.odk === 'O' || !p.odk);

    // Calculate detailed stats using the helper function
    const detailedStats = calculateDetailedStats(offensive);

    return {
      totalPlays: allPlays.length,
      offensivePlays: offensive.length,
      runsVsPasses: {
        runs: detailedStats?.rushAttempts || 0,
        passes: detailedStats?.passAttempts || 0
      },
      explosivePlays: detailedStats?.explosives || 0,
      detailedStats
    };
  }, [gameReview.plays]);

  // Save handler
  const saveGameReview = useCallback(async (updatedReview) => {
    setIsSaving(true);
    try {
      await updateWeek(weekId, {
        gameReview: {
          ...updatedReview,
          updatedAt: new Date().toISOString()
        }
      });
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [weekId, updateWeek]);

  // Save film review to play's history
  const saveFilmReviewToPlay = useCallback((playId, gamePlayData, reviewData) => {
    if (!playId || !plays[playId]) return;

    const play = plays[playId];
    const existingReviews = play.filmReviews || [];

    // Create a unique key for this game review
    const reviewKey = `game_${weekId}_${gamePlayData.rowNumber}`;

    // Check if we already have a review for this
    const existingIndex = existingReviews.findIndex(r => r.key === reviewKey);

    const filmReview = {
      key: reviewKey,
      type: 'game',
      weekId,
      weekName: currentWeek?.name || currentWeek?.opponent || `Week ${currentWeek?.weekNumber || ''}`,
      opponent: currentWeek?.opponent || '',
      date: new Date().toISOString(),
      quarter: gamePlayData.quarter,
      down: gamePlayData.down,
      distance: gamePlayData.distance,
      yardLine: gamePlayData.yardLine,
      result: gamePlayData.result,
      gainLoss: gamePlayData.gainLoss,
      rating: reviewData.rating,
      workedTags: reviewData.workedTags || [],
      didntWorkTags: reviewData.didntWorkTags || [],
      notes: reviewData.notes || '',
      fixes: reviewData.fixes || ''
    };

    let updatedReviews;
    if (existingIndex >= 0) {
      updatedReviews = [...existingReviews];
      updatedReviews[existingIndex] = filmReview;
    } else {
      updatedReviews = [...existingReviews, filmReview];
    }

    updatePlay(playId, { filmReviews: updatedReviews });
  }, [plays, weekId, currentWeek, updatePlay]);

  // Handle play review update
  const handleUpdatePlayReview = useCallback((gamePlayId, updates) => {
    const updatedPlays = (gameReview.plays || []).map(p => {
      if (p.id === gamePlayId) {
        const newReview = { ...p.review, ...updates };
        return { ...p, review: newReview };
      }
      return p;
    });

    const updatedReview = { ...gameReview, plays: updatedPlays };
    saveGameReview(updatedReview);

    // Also save to play's film history if matched
    const gamePlay = updatedPlays.find(p => p.id === gamePlayId);
    if (gamePlay?.matchedPlayId) {
      saveFilmReviewToPlay(gamePlay.matchedPlayId, gamePlay, { ...gamePlay.review, ...updates });
    }
  }, [gameReview, saveGameReview, saveFilmReviewToPlay]);

  // Handle play matching
  const handleMatchPlay = useCallback((gamePlayId, playbookPlayId) => {
    const updatedPlays = (gameReview.plays || []).map(p => {
      if (p.id === gamePlayId) {
        return {
          ...p,
          matchedPlayId: playbookPlayId,
          matchConfidence: playbookPlayId ? 'manual' : 'unmatched'
        };
      }
      return p;
    });

    const updatedReview = { ...gameReview, plays: updatedPlays };
    saveGameReview(updatedReview);
  }, [gameReview, saveGameReview]);

  // Auto-match plays to playbook
  const autoMatchPlays = useCallback((gamePlays) => {
    if (!plays) return gamePlays;

    const playsArray = Object.values(plays);

    return gamePlays.map(gp => {
      if (gp.matchedPlayId) return gp; // Already matched

      // Try to find a match by play name
      const searchName = (gp.playName || '').toLowerCase().trim();
      if (!searchName) return gp;

      // Exact match first
      let match = playsArray.find(p =>
        p.name?.toLowerCase().trim() === searchName
      );

      // Fuzzy match - contains
      if (!match) {
        match = playsArray.find(p =>
          p.name?.toLowerCase().includes(searchName) ||
          searchName.includes(p.name?.toLowerCase() || '')
        );
      }

      if (match) {
        return {
          ...gp,
          matchedPlayId: match.id,
          matchConfidence: 'auto'
        };
      }

      return gp;
    });
  }, [plays]);

  // Detect new terms from imported plays that aren't in termLibrary
  // NOTE: Must be defined before handleFileImport which uses it
  const detectNewTerms = useCallback((importedPlays) => {
    const termLibrary = setupConfig?.termLibrary?.OFFENSE || {};
    const existingTerms = new Set();

    // Collect all existing terms (uppercase for comparison)
    Object.values(termLibrary).forEach(terms => {
      if (Array.isArray(terms)) {
        terms.forEach(t => existingTerms.add((t.label || t).toUpperCase()));
      }
    });

    // Also check abbreviations as existing
    const abbreviations = setupConfig?.wristbandAbbreviations || {};
    Object.keys(abbreviations).forEach(term => existingTerms.add(term.toUpperCase()));

    // Extract unique terms from imported plays
    const newTerms = {
      formation: new Set(),
      backfield: new Set(),
      motion: new Set(),
      playType: new Set(),
      playDir: new Set()
    };

    importedPlays.forEach(play => {
      if (play.odk !== 'O') return; // Only offense for now

      const checkAndAdd = (value, category) => {
        if (!value || typeof value !== 'string') return;
        const normalized = value.trim().toUpperCase();
        if (normalized && !existingTerms.has(normalized)) {
          newTerms[category].add(value.trim()); // Keep original case for display
        }
      };

      checkAndAdd(play.formation, 'formation');
      checkAndAdd(play.backfield, 'backfield');
      checkAndAdd(play.motion, 'motion');
      checkAndAdd(play.playType, 'playType');
      checkAndAdd(play.playDir, 'playDir');
    });

    // Convert sets to arrays and filter empty categories
    const result = {};
    Object.entries(newTerms).forEach(([category, termSet]) => {
      const arr = Array.from(termSet).sort();
      if (arr.length > 0) result[category] = arr;
    });

    return Object.keys(result).length > 0 ? result : null;
  }, [setupConfig]);

  // Handle file import
  const handleFileImport = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        setImportError('File appears to be empty or has no data rows');
        return;
      }

      // First row is headers
      const headers = jsonData[0].map(h => String(h || '').trim());
      setAvailableColumns(headers);

      // Try auto-detection first, then fall back to saved mapping
      const autoDetected = autoDetectColumnMapping(headers);
      const effectiveMapping = { ...columnMapping };

      // Use auto-detected values for any fields not in saved mapping or not found in headers
      for (const [key, value] of Object.entries(autoDetected)) {
        if (!effectiveMapping[key] || !headers.includes(effectiveMapping[key])) {
          effectiveMapping[key] = value;
        }
      }

      // Check if we have a mapping for the play name column
      const playNameCol = effectiveMapping.playName;
      if (!playNameCol || !headers.includes(playNameCol)) {
        // Need to set up column mapping - show what we detected
        console.log('Auto-detected columns:', autoDetected);
        console.log('Available headers:', headers);
        setShowColumnMapping(true);
        return;
      }

      // Log what columns we're using for debugging
      console.log('Using column mapping:', effectiveMapping);
      console.log('Headers in file:', headers);

      // Parse plays
      const importedPlays = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const getValue = (key) => {
          const colName = effectiveMapping[key];
          if (!colName) return null;
          const colIdx = headers.indexOf(colName);
          if (colIdx === -1) return null;
          return row[colIdx];
        };

        const playName = getValue('playName');
        if (!playName) continue; // Skip rows without play name

        const odk = getValue('odk');

        // Parse yard line - negative = own territory
        let yardLine = parseInt(getValue('yardLine')) || 0;
        const ylStr = String(getValue('yardLine') || '');
        if (ylStr.includes('-') || ylStr.toLowerCase().includes('own')) {
          yardLine = -Math.abs(yardLine);
        }

        importedPlays.push({
          id: `game_play_${i}`,
          rowNumber: getValue('playNumber') || i,
          quarter: parseInt(getValue('quarter')) || 1,
          series: parseInt(getValue('series')) || null,
          odk: odk?.toUpperCase() || 'O',
          down: parseInt(getValue('down')) || 1,
          distance: parseInt(getValue('distance')) || 10,
          yardLine,
          hash: getValue('hash') || '',
          // Play call fields
          formation: getValue('formation') || '',
          backfield: getValue('backfield') || '',
          motion: getValue('motion') || '',
          personnel: getValue('personnel') || '',
          tag: getValue('tag') || '',
          playName: String(playName).trim(),
          // Result fields
          playType: getValue('playType') || '',
          playDir: getValue('playDir') || '',
          result: getValue('result') || '',
          gainLoss: parseInt(getValue('gainLoss')) || 0,
          // Custom fields
          custom1: getValue('custom1') || '',
          custom2: getValue('custom2') || '',
          custom3: getValue('custom3') || '',
          // Matching
          matchedPlayId: null,
          matchConfidence: 'unmatched',
          review: {}
        });
      }

      // Auto-match plays
      const matchedPlays = autoMatchPlays(importedPlays);

      // Save to game review with the effective mapping
      const updatedReview = {
        ...gameReview,
        importedAt: new Date().toISOString(),
        opponent: currentWeek?.opponent || '',
        plays: matchedPlays,
        columnMapping: effectiveMapping // Save what mapping we used
      };

      await saveGameReview(updatedReview);

      // Also save the effective mapping for future imports
      if (JSON.stringify(effectiveMapping) !== JSON.stringify(columnMapping)) {
        await updateSetupConfig({ hudlColumnMapping: effectiveMapping });
      }

      // Detect new terms and prompt to add to glossary
      const newTerms = detectNewTerms(matchedPlays);
      if (newTerms) {
        setDetectedNewTerms(newTerms);
        setShowNewTerms(true);
      }

    } catch (err) {
      console.error('Import error:', err);
      setImportError('Failed to parse file. Make sure it\'s a valid Excel file.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [columnMapping, gameReview, currentWeek, autoMatchPlays, saveGameReview, updateSetupConfig, detectNewTerms]);

  // Handle column mapping save
  const handleSaveColumnMapping = useCallback(async (newMapping) => {
    await updateSetupConfig({ hudlColumnMapping: newMapping });
    // Trigger re-import with new mapping
    if (fileInputRef.current?.files?.[0]) {
      handleFileImport({ target: { files: fileInputRef.current.files } });
    }
  }, [updateSetupConfig, handleFileImport]);

  // Handle saving new terms to glossary
  const handleSaveNewTerms = useCallback(async (termsToAdd, abbrevsToAdd) => {
    const termLibrary = { ...(setupConfig?.termLibrary || {}) };
    const offenseTerms = { ...(termLibrary.OFFENSE || {}) };

    // Map categories to syntax part IDs (or create if needed)
    const categoryToPartId = {
      formation: 'formation',
      backfield: 'backfield',
      motion: 'motion',
      playType: 'playType',
      playDir: 'playDir'
    };

    // Add terms to appropriate categories
    Object.entries(termsToAdd).forEach(([category, terms]) => {
      const partId = categoryToPartId[category] || category;
      const existing = offenseTerms[partId] || [];
      const existingLabels = new Set(existing.map(t => (t.label || t).toUpperCase()));

      terms.forEach(term => {
        if (!existingLabels.has(term.toUpperCase())) {
          existing.push({
            id: `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: term.toUpperCase()
          });
        }
      });

      offenseTerms[partId] = existing;
    });

    termLibrary.OFFENSE = offenseTerms;

    // Merge abbreviations
    const newAbbreviations = {
      ...(setupConfig?.wristbandAbbreviations || {}),
      ...abbrevsToAdd
    };

    await updateSetupConfig({
      termLibrary,
      wristbandAbbreviations: newAbbreviations
    });
  }, [setupConfig, updateSetupConfig]);

  // Calculate average rating
  const avgRating = useMemo(() => {
    const ratings = offensivePlays
      .map(p => p.review?.rating)
      .filter(r => r && r > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }, [offensivePlays]);

  const reviewedCount = offensivePlays.filter(p => p.review?.rating > 0).length;
  const matchedCount = offensivePlays.filter(p => p.matchedPlayId).length;

  if (!currentWeek) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Trophy size={64} className="text-amber-400 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Postgame Review
          </h1>
          <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            Select a week from the sidebar to review game film.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-slate-800 bg-slate-900/50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              <Trophy size={24} className="text-amber-400" />
              Postgame Review
            </h1>
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              {currentWeek.name || `Week ${currentWeek.weekNumber || ''}`}
              {currentWeek.opponent && ` vs ${currentWeek.opponent}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <CheckCircle2 size={12} className="text-emerald-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isSaving && (
              <span className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <Clock size={12} className="animate-spin" />
                Saving...
              </span>
            )}
            <button
              onClick={() => setShowColumnMapping(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-800 text-slate-400'}`}
              title="Configure column mapping"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Columns</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Helper box for new coaches */}
        <CoachHelperBox isLight={isLight} showByDefault={gameReview.plays?.length === 0} />

        {gameReview.plays?.length === 0 ? (
          /* Empty state - Import prompt */
          <div className={`text-center py-16 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            <FileSpreadsheet size={64} className="mx-auto mb-4 opacity-50" />
            <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Import Game Data
            </h2>
            <p className="mb-6 max-w-md mx-auto">
              Export your game data from Hudl as an Excel file (.xlsx), then import it here to start your postgame review.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              <Upload size={20} />
              Import from Hudl
            </button>

            {importError && (
              <p className="mt-4 text-sm text-red-400">{importError}</p>
            )}

            <div className={`mt-8 p-4 rounded-lg max-w-md mx-auto text-left ${
              isLight ? 'bg-gray-100' : 'bg-slate-800/50'
            }`}>
              <h3 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                <HelpCircle size={16} />
                How to export from Hudl
              </h3>
              <ol className={`text-xs space-y-1 list-decimal list-inside ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                <li>Open your game in Hudl</li>
                <li>Go to Reports {">"} Play Data</li>
                <li>Select "Excel" export format</li>
                <li>Import the downloaded file here</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <SummaryStatsCard summary={summary} isLight={isLight} plays={allOffensivePlays} />

            {/* View Mode & Filter Bar */}
            <div className={`p-4 rounded-xl ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/30 border border-slate-700'}`}>
              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-medium ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>View by:</span>
                <div className={`flex rounded-lg p-1 ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                  {[
                    { id: 'drives', label: 'Drives' },
                    { id: 'downs', label: 'Downs' },
                    { id: 'quarters', label: 'Quarters' },
                    { id: 'all', label: 'All Plays' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        viewMode === mode.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : isLight ? 'text-gray-600 hover:text-gray-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={14} className={isLight ? 'text-gray-400' : 'text-slate-500'} />

                {/* Down Filter */}
                <select
                  value={filters.down || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters(f => ({ ...f, down: val === 'p10' ? 'p10' : val ? parseInt(val) : null }));
                  }}
                  className={`px-2 py-1 text-xs rounded-lg border ${
                    filters.down
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                  }`}
                >
                  <option value="">All Downs</option>
                  <option value="p10">P&10 (1st of Drive)</option>
                  <option value="1">1st Down</option>
                  <option value="2">2nd Down</option>
                  <option value="3">3rd Down</option>
                  <option value="4">4th Down</option>
                </select>

                {/* Down & Distance Category Filter */}
                {downDistanceCategories.length > 0 && (
                  <select
                    value={filters.downDistance || ''}
                    onChange={(e) => setFilters(f => ({ ...f, downDistance: e.target.value || null }))}
                    className={`px-2 py-1 text-xs rounded-lg border ${
                      filters.downDistance
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                    }`}
                  >
                    <option value="">All Dn & Dist</option>
                    {downDistanceCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}

                {/* Quarter Filter */}
                <select
                  value={filters.quarter || ''}
                  onChange={(e) => setFilters(f => ({ ...f, quarter: e.target.value ? parseInt(e.target.value) : null }))}
                  className={`px-2 py-1 text-xs rounded-lg border ${
                    filters.quarter
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                  }`}
                >
                  <option value="">All Quarters</option>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>

                {/* Half Filter */}
                <select
                  value={filters.half || ''}
                  onChange={(e) => setFilters(f => ({ ...f, half: e.target.value ? parseInt(e.target.value) : null }))}
                  className={`px-2 py-1 text-xs rounded-lg border ${
                    filters.half
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                  }`}
                >
                  <option value="">Both Halves</option>
                  <option value="1">1st Half</option>
                  <option value="2">2nd Half</option>
                </select>

                {/* Drive Filter */}
                {uniqueDrives.length > 0 && (
                  <select
                    value={filters.drive || ''}
                    onChange={(e) => setFilters(f => ({ ...f, drive: e.target.value ? parseInt(e.target.value) : null }))}
                    className={`px-2 py-1 text-xs rounded-lg border ${
                      filters.drive
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                    }`}
                  >
                    <option value="">All Drives</option>
                    {uniqueDrives.map(d => (
                      <option key={d} value={d}>Drive {d}</option>
                    ))}
                  </select>
                )}

                {/* Play Type Filter */}
                <select
                  value={filters.playType || ''}
                  onChange={(e) => setFilters(f => ({ ...f, playType: e.target.value || null }))}
                  className={`px-2 py-1 text-xs rounded-lg border ${
                    filters.playType
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                  }`}
                >
                  <option value="">Run & Pass</option>
                  <option value="run">Runs Only</option>
                  <option value="pass">Passes Only</option>
                </select>

                {/* Result Filter */}
                <select
                  value={filters.result || ''}
                  onChange={(e) => setFilters(f => ({ ...f, result: e.target.value || null }))}
                  className={`px-2 py-1 text-xs rounded-lg border ${
                    filters.result
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                  }`}
                >
                  <option value="">All Results</option>
                  <option value="positive">Positive Plays</option>
                  <option value="negative">Negative Plays</option>
                  <option value="explosive">Explosive Plays</option>
                  <option value="firstdown">First Downs</option>
                </select>

                {/* Field Zone Filter */}
                {fieldZones.length > 0 && (
                  <select
                    value={filters.fieldZone || ''}
                    onChange={(e) => setFilters(f => ({ ...f, fieldZone: e.target.value || null }))}
                    className={`px-2 py-1 text-xs rounded-lg border ${
                      filters.fieldZone
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : isLight ? 'border-gray-300 bg-white text-gray-700' : 'border-slate-600 bg-slate-700 text-slate-300'
                    }`}
                  >
                    <option value="">All Field Zones</option>
                    {fieldZones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}

                {/* Results count */}
                <span className={`text-xs ml-auto ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  {offensivePlays.length} plays
                  {hasActiveFilters && ` (of ${allOffensivePlays.length})`}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  <span className="font-medium text-emerald-400">{matchedCount}</span> of {offensivePlays.length} matched
                </div>
                <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  <span className="font-medium text-amber-400">{reviewedCount}</span> reviewed
                </div>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-amber-400 text-sm font-medium">{avgRating.toFixed(1)} avg</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Upload size={14} />
                  Re-import
                </button>
                <button
                  onClick={() => {
                    const newTerms = detectNewTerms(offensivePlays);
                    if (newTerms) {
                      setDetectedNewTerms(newTerms);
                      setShowNewTerms(true);
                    } else {
                      // No new terms found - could show a toast/message
                      alert('No new terms detected in the imported plays.');
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Search size={14} />
                  Scan for Terms
                </button>
                <button
                  onClick={() => setShowFilmWizard(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                >
                  <Play size={14} />
                  Start Film Review
                </button>
              </div>
            </div>

            {/* Play List */}
            <div className="space-y-3">
              {viewMode === 'drives' && hasSeries ? (
                /* Grouped by Series/Drives */
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs font-medium ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      {seriesGroups.length} drives
                    </div>
                    <button
                      onClick={expandAllSeries}
                      className={`text-xs ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Expand all
                    </button>
                  </div>
                  {seriesGroups.map((group) => (
                    <SeriesGroup
                      key={group.series}
                      seriesNum={group.series}
                      plays={group.plays}
                      outcome={group.outcome}
                      isLight={isLight}
                      isExpanded={expandedSeries.has(group.series)}
                      onToggle={() => toggleSeries(group.series)}
                    >
                      {group.plays.map((gamePlay, idx) => (
                        <GamePlayCard
                          key={gamePlay.id}
                          gamePlay={gamePlay}
                          matchedPlay={gamePlay.matchedPlayId ? plays[gamePlay.matchedPlayId] : null}
                          plays={plays}
                          onOpenMatch={(gp) => {
                            setSelectedGamePlay(gp);
                            setShowPlayMatching(true);
                          }}
                          onUpdateReview={handleUpdatePlayReview}
                          isLight={isLight}
                          index={idx}
                        />
                      ))}
                    </SeriesGroup>
                  ))}
                </>
              ) : viewMode === 'downs' ? (
                /* Grouped by Down */
                <>
                  {[1, 2, 3, 4].map(down => {
                    const downPlays = downGroups[down];
                    if (downPlays.length === 0) return null;
                    const downStats = calculateDetailedStats(downPlays);
                    const downLabel = down === 1 ? '1st' : down === 2 ? '2nd' : down === 3 ? '3rd' : '4th';
                    return (
                      <div key={down} className={`rounded-lg border ${
                        isLight ? 'bg-white border-gray-200' : 'bg-slate-800/30 border-slate-700'
                      }`}>
                        <div className={`px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                down === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                                down === 2 ? 'bg-sky-500/20 text-sky-400' :
                                down === 3 ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {downLabel} Down
                              </div>
                              <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                                {downPlays.length} plays
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              {downStats && (
                                <>
                                  <span className={isLight ? 'text-gray-500' : 'text-slate-500'}>
                                    <span className="text-emerald-400 font-medium">{downStats.rushYards}</span> rush
                                  </span>
                                  <span className={isLight ? 'text-gray-500' : 'text-slate-500'}>
                                    <span className="text-sky-400 font-medium">{downStats.passYards}</span> pass
                                  </span>
                                  <span className={isLight ? 'text-gray-500' : 'text-slate-500'}>
                                    <span className={`font-medium ${
                                      (downStats.downStats[down]?.successful / (downStats.downStats[down]?.attempts || 1)) >= 0.5
                                        ? 'text-emerald-400' : 'text-amber-400'
                                    }`}>
                                      {downStats.downStats[down]?.successful || 0}/{downStats.downStats[down]?.attempts || 0}
                                    </span> converted
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {downPlays.map((gamePlay, idx) => (
                            <GamePlayCard
                              key={gamePlay.id}
                              gamePlay={gamePlay}
                              matchedPlay={gamePlay.matchedPlayId ? plays[gamePlay.matchedPlayId] : null}
                              plays={plays}
                              onOpenMatch={(gp) => {
                                setSelectedGamePlay(gp);
                                setShowPlayMatching(true);
                              }}
                              onUpdateReview={handleUpdatePlayReview}
                              isLight={isLight}
                              index={idx}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : viewMode === 'quarters' ? (
                /* Grouped by Quarter */
                <>
                  {[1, 2, 3, 4].map(quarter => {
                    const quarterPlays = quarterGroups[quarter];
                    if (quarterPlays.length === 0) return null;
                    const quarterStats = calculateDetailedStats(quarterPlays);
                    return (
                      <div key={quarter} className={`rounded-lg border ${
                        isLight ? 'bg-white border-gray-200' : 'bg-slate-800/30 border-slate-700'
                      }`}>
                        <div className={`px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                quarter <= 2 ? 'bg-violet-500/20 text-violet-400' : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                Q{quarter}
                              </div>
                              <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                                {quarterPlays.length} plays • {quarterStats?.totalYards || 0} total yards
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              {quarterStats && (
                                <>
                                  <span className={isLight ? 'text-gray-500' : 'text-slate-500'}>
                                    <span className="text-emerald-400 font-medium">{quarterStats.rushAttempts}</span> runs ({quarterStats.rushYards} yds)
                                  </span>
                                  <span className={isLight ? 'text-gray-500' : 'text-slate-500'}>
                                    <span className="text-sky-400 font-medium">{quarterStats.passAttempts}</span> passes ({quarterStats.passYards} yds)
                                  </span>
                                  {quarterStats.explosives > 0 && (
                                    <span className="text-amber-400 font-medium">
                                      {quarterStats.explosives} explosive
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {quarterPlays.map((gamePlay, idx) => (
                            <GamePlayCard
                              key={gamePlay.id}
                              gamePlay={gamePlay}
                              matchedPlay={gamePlay.matchedPlayId ? plays[gamePlay.matchedPlayId] : null}
                              plays={plays}
                              onOpenMatch={(gp) => {
                                setSelectedGamePlay(gp);
                                setShowPlayMatching(true);
                              }}
                              onUpdateReview={handleUpdatePlayReview}
                              isLight={isLight}
                              index={idx}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                /* Flat list (All Plays view or no series data) */
                offensivePlays.map((gamePlay, idx) => (
                  <GamePlayCard
                    key={gamePlay.id}
                    gamePlay={gamePlay}
                    matchedPlay={gamePlay.matchedPlayId ? plays[gamePlay.matchedPlayId] : null}
                    plays={plays}
                    onOpenMatch={(gp) => {
                      setSelectedGamePlay(gp);
                      setShowPlayMatching(true);
                    }}
                    onUpdateReview={handleUpdatePlayReview}
                    isLight={isLight}
                    index={idx}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={showColumnMapping}
        onClose={() => setShowColumnMapping(false)}
        onSave={handleSaveColumnMapping}
        availableColumns={availableColumns}
        currentMapping={columnMapping}
        isLight={isLight}
      />

      {/* Play Matching Modal */}
      <PlayMatchingModal
        isOpen={showPlayMatching}
        onClose={() => {
          setShowPlayMatching(false);
          setSelectedGamePlay(null);
        }}
        gamePlay={selectedGamePlay}
        plays={plays}
        onMatch={handleMatchPlay}
        isLight={isLight}
      />

      {/* New Terms Modal */}
      <NewTermsModal
        isOpen={showNewTerms}
        onClose={() => {
          setShowNewTerms(false);
          setDetectedNewTerms(null);
        }}
        onSave={handleSaveNewTerms}
        newTerms={detectedNewTerms}
        isLight={isLight}
      />

      {/* Film Review Wizard */}
      <GameFilmReviewWizard
        isOpen={showFilmWizard}
        onClose={() => setShowFilmWizard(false)}
        gamePlays={offensivePlays}
        plays={plays}
        onUpdatePlayReview={handleUpdatePlayReview}
        filmReviewTags={filmReviewTags}
        isLight={isLight}
        weekId={weekId}
        weekName={currentWeek?.name || currentWeek?.opponent || `Week ${currentWeek?.weekNumber || ''}`}
        opponent={currentWeek?.opponent || 'Opponent'}
      />
    </div>
  );
}
