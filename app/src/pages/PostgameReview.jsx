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
  HelpCircle
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
    { key: 'playNumber', label: 'Play Number', required: false },
    { key: 'quarter', label: 'Quarter', required: false },
    { key: 'series', label: 'Series/Drive', required: false },
    { key: 'odk', label: 'O/D/K', required: false },
    { key: 'down', label: 'Down', required: false },
    { key: 'distance', label: 'Distance', required: false },
    { key: 'yardLine', label: 'Yard Line', required: false },
    { key: 'hash', label: 'Hash', required: false },
    { key: 'formation', label: 'Formation', required: false },
    { key: 'backfield', label: 'Backfield', required: false },
    { key: 'motion', label: 'Motion', required: false },
    { key: 'playName', label: 'Play Name', required: true },
    { key: 'playType', label: 'Play Type (Run/Pass)', required: false },
    { key: 'playDir', label: 'Play Direction', required: false },
    { key: 'result', label: 'Result', required: false },
    { key: 'gainLoss', label: 'Gain/Loss', required: false }
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
            <div className="space-y-3">
              {mappingFields.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <label className={`w-28 text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      isLight
                        ? 'bg-gray-100 border border-gray-300 text-gray-900'
                        : 'bg-slate-800 border border-slate-700 text-white'
                    } focus:outline-none focus:border-amber-500`}
                  >
                    <option value="">-- Select Column --</option>
                    {availableColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
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
  const playName = matchedPlay?.name || gamePlay.playName || 'Unknown';

  const review = gamePlay.review || {};

  // Build tags for additional info (motion, type, direction - NOT backfield anymore)
  const tags = [];
  if (gamePlay.motion) tags.push(gamePlay.motion);
  if (gamePlay.playType) tags.push(gamePlay.playType);
  if (gamePlay.playDir) tags.push(gamePlay.playDir);

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

        {/* Formation | Backfield | Play - as distinct columns */}
        <div className="flex-1 min-w-0 flex items-center gap-1">
          {formation && (
            <span className={`text-sm font-medium ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
              {formation}
            </span>
          )}
          {formation && backfield && <span className={`${isLight ? 'text-gray-300' : 'text-slate-600'}`}>|</span>}
          {backfield && (
            <span className={`text-sm ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
              {backfield}
            </span>
          )}
          {(formation || backfield) && <span className={`${isLight ? 'text-gray-300' : 'text-slate-600'}`}>|</span>}
          <span className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {playName}
          </span>
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

    // Down efficiency
    const down = p.down;
    if (down >= 1 && down <= 4) {
      downStats[down].attempts++;
      const distance = p.distance || 0;
      // Success = got the first down or TD
      const gotFirstDown = yards >= distance;
      const gotTD = result.includes('td') || result.includes('touchdown');
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

  return {
    rushAttempts,
    rushYards,
    passAttempts,
    passYards,
    completions,
    explosives,
    totalYards: rushYards + passYards,
    yardsPerCarry: rushAttempts > 0 ? (rushYards / rushAttempts).toFixed(1) : '0.0',
    yardsPerAttempt: passAttempts > 0 ? (passYards / passAttempts).toFixed(1) : '0.0',
    yardsPerCompletion: completions > 0 ? (passYards / completions).toFixed(1) : '0.0',
    downStats,
    bestPlays
  };
}

// Summary Stats Card
function SummaryStatsCard({ summary, isLight }) {
  if (!summary) return null;

  const stats = summary.detailedStats;

  return (
    <div className={`rounded-xl ${
      isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/30 border border-slate-700'
    }`}>
      {/* Top row - main stats */}
      <div className="grid grid-cols-6 gap-4 p-4 border-b border-slate-700/50">
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
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Total Yards</div>
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

        {/* Best Plays */}
        <div className={`p-3 rounded-lg ${isLight ? 'bg-amber-50' : 'bg-amber-500/10'}`}>
          <div className={`text-sm font-medium mb-2 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
            Best Plays
          </div>
          <div className="space-y-1">
            {(stats?.bestPlays || []).length > 0 ? (
              stats.bestPlays.map((play, idx) => (
                <div key={idx} className={`flex items-center justify-between text-xs ${
                  isLight ? 'text-gray-600' : 'text-slate-400'
                }`}>
                  <span className="truncate flex-1">
                    {play.playName || play.odCall || `Play ${play.rowNumber || idx + 1}`}
                  </span>
                  <span className={`font-bold ml-2 ${play.isRun ? 'text-emerald-400' : 'text-sky-400'}`}>
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
    </div>
  );
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
            {/* Best play in series */}
            {seriesStats.bestPlays?.[0] && (
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>Best:</span>
                <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                  {seriesStats.bestPlays[0].playName || seriesStats.bestPlays[0].odCall || 'Play'} (+{seriesStats.bestPlays[0].yards})
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
  const offensivePlays = useMemo(() => {
    return (gameReview.plays || []).filter(p => p.odk === 'O' || !p.odk);
  }, [gameReview.plays]);

  // Group plays by series
  const seriesGroups = useMemo(() => {
    return groupPlaysBySeries(offensivePlays);
  }, [offensivePlays]);

  // Check if we have series data
  const hasSeries = seriesGroups.length > 0 && seriesGroups.some(g => g.series !== 0 && g.series !== null);

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
          formation: getValue('formation') || '',
          backfield: getValue('backfield') || '',
          motion: getValue('motion') || '',
          playName: String(playName).trim(),
          playType: getValue('playType') || '',
          playDir: getValue('playDir') || '',
          result: getValue('result') || '',
          gainLoss: parseInt(getValue('gainLoss')) || 0,
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
            <SummaryStatsCard summary={summary} isLight={isLight} />

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
              {hasSeries ? (
                /* Grouped by Series */
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs font-medium ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      {seriesGroups.length} series
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
              ) : (
                /* Flat list (no series data) */
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
