import { useState, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Clock,
  CheckCircle,
  Circle,
  Plus,
  Trash2,
  Edit2,
  X,
  Timer,
  Users,
  Clipboard,
  Flag,
  StickyNote,
  Save,
  Download,
  LayoutTemplate,
  FolderOpen,
  Printer,
  ExternalLink
} from 'lucide-react';

// Default pregame schedule template
const DEFAULT_SCHEDULE = [
  { id: 1, time: -120, duration: 0, name: 'Locker Room Opens', location: 'Locker Room', category: 'logistics', completed: false, notes: '' },
  { id: 2, time: -90, duration: 15, name: 'Team Arrives / Dress', location: 'Locker Room', category: 'logistics', completed: false, notes: '' },
  { id: 3, time: -75, duration: 15, name: 'Offensive Walk-through', location: 'Locker Room', category: 'warmup', completed: false, notes: '' },
  { id: 4, time: -60, duration: 10, name: 'Defensive Walk-through', location: 'Locker Room', category: 'warmup', completed: false, notes: '' },
  { id: 5, time: -50, duration: 5, name: 'Special Teams Review', location: 'Locker Room', category: 'warmup', completed: false, notes: '' },
  { id: 6, time: -45, duration: 5, name: 'Take Field for Warmups', location: 'Field', category: 'warmup', completed: false, notes: '' },
  { id: 7, time: -40, duration: 10, name: 'Dynamic Stretch', location: 'Field', category: 'warmup', completed: false, notes: '' },
  { id: 8, time: -30, duration: 10, name: 'Position Groups', location: 'Field', category: 'warmup', completed: false, notes: '' },
  { id: 9, time: -20, duration: 5, name: 'Special Teams Warmup', location: 'Field', category: 'warmup', completed: false, notes: '' },
  { id: 10, time: -15, duration: 5, name: 'Return to Locker Room', location: 'Locker Room', category: 'logistics', completed: false, notes: '' },
  { id: 11, time: -10, duration: 5, name: 'Final Meeting / Prayer', location: 'Locker Room', category: 'team', completed: false, notes: '' },
  { id: 12, time: -5, duration: 5, name: 'Captains for Coin Toss', location: 'Field', category: 'team', completed: false, notes: '' },
  { id: 13, time: 0, duration: 0, name: 'KICKOFF', location: 'Field', category: 'game', completed: false, notes: '' }
];

// Categories
const CATEGORIES = [
  { id: 'logistics', label: 'Logistics', color: '#6b7280' },
  { id: 'warmup', label: 'Warmup', color: '#f59e0b' },
  { id: 'team', label: 'Team', color: '#3b82f6' },
  { id: 'game', label: 'Game', color: '#22c55e' }
];

// Helper to format time in 12-hour format with AM/PM
const formatTime12Hour = (hours24, minutes) => {
  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper to convert HH:MM string to 12-hour format
const formatTimeString12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  return formatTime12Hour(hours, minutes);
};

// Pregame Notes Modal Component with @mention support
function PregameNotesModal({ item, staff, positionGroups, onUpdateNotes, onClose }) {
  const [noteText, setNoteText] = useState(item.notes || '');
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
              Notes: {item.name}
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
            <label htmlFor="pregame-note-text" className="sr-only">Notes</label>
            <textarea
              id="pregame-note-text"
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

// Save Pregame Template Modal
function SavePregameTemplateModal({ schedule, gameTime, existingTemplates, onSave, onClose }) {
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
      id: `pregame_template_${Date.now()}`,
      name,
      folder: folder || null,
      createdAt: new Date().toISOString(),
      gameTime: gameTime,
      schedule: schedule.map(item => ({
        id: item.id,
        time: item.time,
        duration: item.duration || 0,
        name: item.name,
        location: item.location || '',
        category: item.category,
        notes: item.notes || ''
      }))
    };

    onSave(template);
    onClose();
  };

  // Example names based on common patterns
  const nameSuggestions = [
    'Home-Standard',
    'Away-Extended',
    'Playoff-Schedule',
    'JV-Pregame',
    'Quick-Warmup'
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
              Use descriptive names that indicate the game type or venue. Good examples:
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
              Pattern: [Venue/Type]-[Details] like "Home-Standard" or "Away-Extended"
            </p>
          </div>

          {/* Template Name */}
          <div>
            <label htmlFor="pregame-template-name" className="block text-sm font-medium text-slate-300 mb-2">
              Template Name <span className="text-red-400">*</span>
            </label>
            <input
              id="pregame-template-name"
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g., Home-Standard, Playoff-Schedule"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              autoFocus
            />
          </div>

          {/* Folder Selection */}
          <div>
            <label htmlFor="pregame-template-folder" className="block text-sm font-medium text-slate-300 mb-2">
              Folder (Optional)
            </label>

            {!isCreatingFolder ? (
              <div className="space-y-2">
                <select
                  id="pregame-template-folder"
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
                <label htmlFor="pregame-new-folder-name" className="sr-only">New folder name</label>
                <input
                  id="pregame-new-folder-name"
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
              <li>- {schedule.length} timeline items</li>
              <li>- Default kickoff time: {formatTimeString12Hour(gameTime)}</li>
              <li>- Notes from all items preserved</li>
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

// Import Pregame Template Modal
function ImportPregameTemplateModal({ existingTemplates, onImport, onClose }) {
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
              <p className="text-slate-500 text-sm mt-1">Create templates by clicking "Save as Template" on a pregame schedule.</p>
            </div>
          ) : (
            <>
              {/* Folder Filter */}
              {folders.length > 0 && (
                <div>
                  <label htmlFor="pregame-import-folder-filter" className="text-xs text-slate-500 uppercase tracking-wide">Folder</label>
                  <select
                    id="pregame-import-folder-filter"
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
                <label className="text-xs text-slate-500 uppercase tracking-wide">Select Template</label>
                <div className="mt-1 space-y-2 max-h-48 overflow-y-auto">
                  {filteredTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedTemplateId === template.id
                          ? 'bg-sky-500/20 border-sky-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {template.schedule?.length || 0} items - Kickoff: {formatTimeString12Hour(template.gameTime || '19:00')}
                        {template.folder && ` - ${template.folder}`}
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
                    <li>- {selectedTemplate.schedule?.length || 0} timeline items</li>
                    <li>- Default kickoff: {formatTimeString12Hour(selectedTemplate.gameTime || '19:00')}</li>
                    {selectedTemplate.schedule?.some(i => i.notes) && (
                      <li>- Includes notes on some items</li>
                    )}
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
            <Download size={16} />
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Pregame() {
  const { weeks, currentWeekId, updateWeeks, setupConfig, updateSetupConfig, staff } = useSchool();

  const [gameTime, setGameTime] = useState('19:00'); // 7:00 PM default
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notesModalItemId, setNotesModalItemId] = useState(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showImportTemplateModal, setShowImportTemplateModal] = useState(false);

  // Get current week
  const currentWeek = weeks.find(w => w.id === currentWeekId);

  // Get pregame schedule
  const schedule = currentWeek?.pregameSchedule || DEFAULT_SCHEDULE;

  // Get existing pregame templates
  const existingTemplates = setupConfig?.pregameTemplates || [];

  // Get position groups for @mentions (use abbreviations)
  const positionGroups = useMemo(() => {
    const groups = new Set();
    // Get unique position group abbreviations from setupConfig
    const pgConfig = setupConfig?.positionGroups || {};
    Object.values(pgConfig).forEach(phaseGroups => {
      (phaseGroups || []).forEach(group => {
        // Use abbreviation if available, otherwise name
        const groupLabel = group.abbrev || group.name;
        if (groupLabel) groups.add(groupLabel);
      });
    });
    return Array.from(groups);
  }, [setupConfig]);

  // Find item for notes modal
  const notesModalItem = notesModalItemId
    ? schedule.find(i => i.id === notesModalItemId)
    : null;

  // Calculate actual times based on game time
  const scheduleWithTimes = useMemo(() => {
    const [hours, minutes] = gameTime.split(':').map(Number);
    const gameMinutes = hours * 60 + minutes;

    return schedule.map(item => {
      const itemMinutes = gameMinutes + item.time;
      let itemHours = Math.floor(itemMinutes / 60) % 24;
      if (itemHours < 0) itemHours += 24;
      const itemMins = ((itemMinutes % 60) + 60) % 60;
      const actualTime = formatTime12Hour(itemHours, itemMins);

      return { ...item, actualTime };
    }).sort((a, b) => a.time - b.time);
  }, [schedule, gameTime]);

  // Save schedule to week
  const saveSchedule = useCallback((newSchedule) => {
    if (!currentWeekId) return;

    const newWeeks = weeks.map(w =>
      w.id === currentWeekId ? { ...w, pregameSchedule: newSchedule } : w
    );
    updateWeeks(newWeeks);
  }, [currentWeekId, weeks, updateWeeks]);

  // Toggle item completion
  const toggleComplete = (itemId) => {
    const newSchedule = schedule.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    saveSchedule(newSchedule);
  };

  // Open editor
  const openEditor = (item = null) => {
    setEditingItem(item || {
      id: Date.now(),
      time: -30,
      duration: 10,
      name: '',
      location: '',
      category: 'warmup',
      completed: false,
      notes: ''
    });
    setShowEditor(true);
  };

  // Save item
  const saveItem = () => {
    if (!editingItem?.name) return;

    const exists = schedule.find(i => i.id === editingItem.id);
    let newSchedule;

    if (exists) {
      newSchedule = schedule.map(i => i.id === editingItem.id ? editingItem : i);
    } else {
      newSchedule = [...schedule, editingItem];
    }

    saveSchedule(newSchedule);
    setShowEditor(false);
    setEditingItem(null);
  };

  // Delete item
  const deleteItem = (itemId) => {
    if (!confirm('Delete this item?')) return;
    const newSchedule = schedule.filter(i => i.id !== itemId);
    saveSchedule(newSchedule);
  };

  // Reset schedule
  const resetSchedule = () => {
    if (!confirm('Reset to default schedule? This will remove any customizations.')) return;
    saveSchedule(DEFAULT_SCHEDULE);
  };

  // Update notes for an item
  const handleNotesUpdate = (notes) => {
    if (!notesModalItemId) return;
    const newSchedule = schedule.map(item =>
      item.id === notesModalItemId ? { ...item, notes } : item
    );
    saveSchedule(newSchedule);
  };

  // Save as template
  const savePregameTemplate = (template) => {
    const existing = setupConfig?.pregameTemplates || [];
    updateSetupConfig({ pregameTemplates: [...existing, template] });
  };

  // Import template
  const importPregameTemplate = (template) => {
    if (!confirm('Import this template? This will replace your current schedule.')) return;

    // Apply template to current week with new IDs and reset completion
    const newSchedule = template.schedule.map(item => ({
      ...item,
      id: Date.now() + Math.random(),
      completed: false
    }));

    // Also update game time if template has one
    if (template.gameTime) {
      setGameTime(template.gameTime);
    }

    saveSchedule(newSchedule);
  };

  // Format time relative to kickoff
  const formatRelativeTime = (minutes) => {
    if (minutes === 0) return 'Kickoff';
    if (minutes < 0) {
      const absMinutes = Math.abs(minutes);
      if (absMinutes >= 60) {
        const hrs = Math.floor(absMinutes / 60);
        const mins = absMinutes % 60;
        return `-${hrs}:${mins.toString().padStart(2, '0')}`;
      }
      return `-${absMinutes} min`;
    }
    return `+${minutes} min`;
  };

  // Get category config
  const getCategoryConfig = (categoryId) =>
    CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  // Check if item has notes
  const hasNotes = (notes) => notes && notes.trim().length > 0;

  // Render note text with highlighted mentions
  const renderHighlightedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="bg-sky-500/30 text-sky-300 px-0.5 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Progress calculation
  const completedCount = schedule.filter(i => i.completed).length;
  const progressPercent = schedule.length > 0 ? (completedCount / schedule.length) * 100 : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Pregame Schedule</h1>
          <p className="text-slate-400">
            {currentWeek ? `Week ${currentWeek.number} vs ${currentWeek.opponent || 'TBD'}` : 'No week selected'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Template Buttons */}
          <button
            onClick={() => setShowImportTemplateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
            title="Import a saved template"
          >
            <Download size={16} />
            Import Template
          </button>
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30"
            title="Save this schedule as a reusable template"
          >
            <Save size={16} />
            Save as Template
          </button>
          <div className="w-px h-8 bg-slate-700" />
          {/* Print Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
              title="Print schedule"
            >
              <Printer size={16} />
              Print
            </button>
            <Link
              to="/print?template=pregame"
              className="p-2 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-700"
              title="Open in Print Center"
            >
              <ExternalLink size={16} />
            </Link>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex items-center gap-2">
            <label htmlFor="pregame-kickoff-time" className="text-slate-400">Kickoff:</label>
            <input
              id="pregame-kickoff-time"
              type="time"
              value={gameTime}
              onChange={e => setGameTime(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Pregame Progress</span>
          <span className="text-slate-400">{completedCount} of {schedule.length} complete</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Schedule</h3>
          <button
            onClick={resetSchedule}
            className="text-sm text-slate-400 hover:text-white"
          >
            Reset to Default
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-600 text-slate-400 text-xs uppercase">
              <th className="px-3 py-3 text-center w-12"></th>
              <th className="px-3 py-3 text-center w-24">Time</th>
              <th className="px-3 py-3 text-center w-16">Dur</th>
              <th className="px-3 py-3 text-center w-24">Category</th>
              <th className="px-3 py-3 text-left">Activity</th>
              <th className="px-3 py-3 text-left w-28">Location</th>
              <th className="px-3 py-3 text-left w-48">Notes</th>
              <th className="px-3 py-3 text-center w-24"></th>
            </tr>
          </thead>
          <tbody>
            {scheduleWithTimes.map((item, idx) => {
              const category = getCategoryConfig(item.category);
              const isKickoff = item.time === 0;
              const itemHasNotes = hasNotes(item.notes);

              return (
                <tr
                  key={item.id}
                  className={`border-b border-slate-700 ${
                    item.completed ? 'bg-green-500/5' : 'bg-slate-800/50'
                  } ${isKickoff ? 'bg-green-500/10' : ''} hover:bg-slate-700/30`}
                >
                  {/* Completion Toggle */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => toggleComplete(item.id)}
                      className={item.completed ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}
                    >
                      {item.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                    </button>
                  </td>

                  {/* Time */}
                  <td className="px-3 py-3 text-center">
                    <div className="font-bold text-white">{item.actualTime}</div>
                    <div className="text-xs text-slate-500">{formatRelativeTime(item.time)}</div>
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-3 text-center text-sm text-slate-300">
                    {item.duration > 0 ? `${item.duration}m` : '-'}
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className="inline-flex px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                        border: `1px solid ${category.color}40`
                      }}
                    >
                      {category.label}
                    </span>
                  </td>

                  {/* Activity Name */}
                  <td className="px-3 py-3">
                    <span className={`font-medium ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {item.name}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-3 py-3 text-sm text-slate-400">
                    {item.location || '-'}
                  </td>

                  {/* Notes */}
                  <td className="px-3 py-3">
                    {itemHasNotes ? (
                      <button
                        onClick={() => setNotesModalItemId(item.id)}
                        className="text-left text-xs text-slate-400 hover:text-amber-300 truncate block max-w-full"
                        title="Click to edit notes"
                      >
                        {renderHighlightedText(item.notes.split('\n')[0])}
                      </button>
                    ) : (
                      <button
                        onClick={() => setNotesModalItemId(item.id)}
                        className="text-xs text-slate-600 hover:text-slate-400"
                      >
                        + Add note
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => setNotesModalItemId(item.id)}
                        className={`p-1.5 rounded transition-colors ${
                          itemHasNotes
                            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                        }`}
                        title={itemHasNotes ? 'Edit notes' : 'Add notes'}
                      >
                        <StickyNote size={14} />
                      </button>
                      {!isKickoff && (
                        <>
                          <button
                            onClick={() => openEditor(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                            title="Edit item"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                            title="Delete item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Category Legend */}
      <div className="mt-4 flex items-center gap-6">
        {CATEGORIES.map(category => (
          <div key={category.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm text-slate-400">{category.label}</span>
          </div>
        ))}
      </div>

      {/* Item Editor Modal */}
      {showEditor && editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {schedule.find(i => i.id === editingItem.id) ? 'Edit Item' : 'Add Item'}
              </h3>
              <button
                onClick={() => { setShowEditor(false); setEditingItem(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="pregame-item-name" className="text-sm text-slate-400 block mb-1">Item Name</label>
                  <input
                    id="pregame-item-name"
                    type="text"
                    value={editingItem.name}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="e.g., Team Stretch"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="pregame-item-location" className="text-sm text-slate-400 block mb-1">Location</label>
                  <input
                    id="pregame-item-location"
                    type="text"
                    value={editingItem.location || ''}
                    onChange={e => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="e.g., Field, Locker Room"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pregame-item-time" className="text-sm text-slate-400 block mb-1">Minutes Before Kickoff</label>
                  <input
                    id="pregame-item-time"
                    type="number"
                    value={Math.abs(editingItem.time)}
                    onChange={e => setEditingItem({ ...editingItem, time: -Math.abs(parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    min="0"
                    max="180"
                  />
                </div>
                <div>
                  <label htmlFor="pregame-item-duration" className="text-sm text-slate-400 block mb-1">Duration (minutes)</label>
                  <input
                    id="pregame-item-duration"
                    type="number"
                    value={editingItem.duration || 0}
                    onChange={e => setEditingItem({ ...editingItem, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    min="0"
                    max="60"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 -mt-2">
                Enter the start time relative to kickoff and duration of the activity
              </p>

              <div>
                <span className="text-sm text-slate-400 block mb-1">Category</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Category selection">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setEditingItem({ ...editingItem, category: category.id })}
                      className={`p-2 rounded-lg text-sm ${
                        editingItem.category === category.id
                          ? 'ring-2'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      style={{
                        backgroundColor: editingItem.category === category.id ? `${category.color}20` : undefined,
                        color: editingItem.category === category.id ? category.color : '#94a3b8',
                        ringColor: category.color
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => { setShowEditor(false); setEditingItem(null); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={!editingItem.name}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModalItem && (
        <PregameNotesModal
          item={notesModalItem}
          staff={staff}
          positionGroups={positionGroups}
          onUpdateNotes={handleNotesUpdate}
          onClose={() => setNotesModalItemId(null)}
        />
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <SavePregameTemplateModal
          schedule={schedule}
          gameTime={gameTime}
          existingTemplates={existingTemplates}
          onSave={savePregameTemplate}
          onClose={() => setShowSaveTemplateModal(false)}
        />
      )}

      {/* Import Template Modal */}
      {showImportTemplateModal && (
        <ImportPregameTemplateModal
          existingTemplates={existingTemplates}
          onImport={importPregameTemplate}
          onClose={() => setShowImportTemplateModal(false)}
        />
      )}
    </div>
  );
}
