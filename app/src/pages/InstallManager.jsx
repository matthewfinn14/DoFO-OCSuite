import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { getWristbandDisplay } from '../utils/wristband';
import { getAllHistoricalReps, getAllRepsForWeek } from '../utils/repTracking';
import { getSpreadsheetBoxes } from '../utils/gamePlanSections';
import PlayAssignmentWizard from '../components/install/PlayAssignmentWizard';
import PlaySuggestionWizard from '../components/install/PlaySuggestionWizard';
import ReviewSuggestionsModal from '../components/install/ReviewSuggestionsModal';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Star,
  Sparkles,
  Copy,
  Trash2,
  ArrowLeft,
  Search,
  Plus,
  X,
  Check,
  Minus,
  Target,
  MapPin,
  Zap,
  Clock,
  Hash,
  LayoutGrid,
  Settings,
  Wand2,
  CheckCircle2,
  MessageSquarePlus,
  ClipboardCheck
} from 'lucide-react';

// Toggle Chip Component for Quick Assign panel
function ToggleChip({ label, isActive, isPartial, onClick, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
          : isActive
          ? 'text-white shadow-sm'
          : isPartial
          ? 'bg-transparent border text-opacity-90'
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
      }`}
      style={
        isActive
          ? { backgroundColor: color || '#3b82f6' }
          : isPartial
          ? { borderColor: color || '#3b82f6', color: color || '#3b82f6' }
          : {}
      }
    >
      {isPartial && !isActive && <span className="mr-1">~</span>}
      {label}
    </button>
  );
}

// Compact badge for displaying assignments in grid (read-only)
function AssignmentBadge({ label, color, title }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mr-0.5 mb-0.5"
      style={{ backgroundColor: `${color}30`, color }}
      title={title}
    >
      {label}
    </span>
  );
}

// Inline toggle chips for editing in selected rows
function InlineToggleChips({ options, activeIds, onToggle, getLabel, getColor }) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {options.map((opt) => {
        const isActive = activeIds.includes(opt.id);
        const color = getColor ? getColor(opt) : '#3b82f6';
        const label = getLabel ? getLabel(opt) : opt.name;
        return (
          <button
            key={opt.id}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(opt.id);
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
              isActive
                ? 'text-white shadow-sm'
                : 'bg-slate-700/50 text-slate-500 hover:bg-slate-600 hover:text-slate-300'
            }`}
            style={isActive ? { backgroundColor: color } : {}}
            title={opt.name}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Single bucket selector (radio-style, only one active at a time)
function InlineBucketChips({ buckets, activeId, onSelect }) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {buckets.map((bucket) => {
        const isActive = activeId === bucket.id;
        return (
          <button
            key={bucket.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(isActive ? null : bucket.id);
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
              isActive
                ? 'text-white shadow-sm'
                : 'bg-slate-700/50 text-slate-500 hover:bg-slate-600 hover:text-slate-300'
            }`}
            style={isActive ? { backgroundColor: bucket.color || '#3b82f6' } : {}}
            title={bucket.label}
          >
            {bucket.label?.substring(0, 4) || bucket.label}
          </button>
        );
      })}
    </div>
  );
}

// Concept family selector (shows families for the selected bucket)
function InlineConceptChips({ conceptGroups, bucketId, activeFamily, onSelect }) {
  const familiesForBucket = conceptGroups.filter(cg => cg.categoryId === bucketId);
  if (familiesForBucket.length === 0) return <span className="text-slate-500 text-[10px]">-</span>;

  return (
    <div className="flex flex-wrap gap-0.5">
      {familiesForBucket.map((family) => {
        const isActive = activeFamily === family.label;
        return (
          <button
            key={family.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(isActive ? null : family.label);
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
              isActive
                ? 'text-white shadow-sm bg-slate-600'
                : 'bg-slate-700/50 text-slate-500 hover:bg-slate-600 hover:text-slate-300'
            }`}
            title={family.label}
          >
            {family.label?.substring(0, 6) || family.label}
          </button>
        );
      })}
    </div>
  );
}

// Call sheet box toggle chips
function InlineBoxChips({ boxes, activeBoxIds, onToggle }) {
  if (boxes.length === 0) return <span className="text-slate-500 text-[10px]">No boxes</span>;

  return (
    <div className="flex flex-wrap gap-0.5">
      {boxes.map((box) => {
        const isActive = activeBoxIds.includes(box.id);
        return (
          <button
            key={box.id}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(box.id);
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
              isActive
                ? 'text-white shadow-sm'
                : 'bg-slate-700/50 text-slate-500 hover:bg-slate-600 hover:text-slate-300'
            }`}
            style={isActive ? { backgroundColor: box.color || '#3b82f6' } : {}}
            title={box.label}
          >
            {box.label?.substring(0, 6) || box.label}
          </button>
        );
      })}
    </div>
  );
}

// Editable number input for target reps
function RepInput({ value, onChange, disabled }) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleBlur = () => {
    const num = parseInt(localValue) || 0;
    if (num !== value) {
      onChange(num);
    }
  };

  return (
    <input
      type="number"
      min="0"
      max="99"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      disabled={disabled}
      className="w-12 px-1.5 py-0.5 text-center text-xs bg-slate-800 border border-slate-700 rounded
                 text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
    />
  );
}

// Play Search Modal Component
function PlaySearchModal({ isOpen, onClose, onAddPlay, plays, installedIds, isLight }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlays = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return plays
      .filter(p =>
        !installedIds.includes(p.id) &&
        ((p.name || '').toLowerCase().includes(term) ||
          (p.formation || '').toLowerCase().includes(term) ||
          (p.bucketLabel || '').toLowerCase().includes(term))
      )
      .slice(0, 20);
  }, [plays, installedIds, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-20" onClick={onClose}>
      <div
        className={`w-full max-w-xl rounded-xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center gap-3">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plays to add..."
              autoFocus
              className={`flex-1 bg-transparent text-lg focus:outline-none ${
                isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-slate-500'
              }`}
            />
            <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchTerm.trim() === '' ? (
            <div className="p-6 text-center text-slate-500">
              Start typing to search for plays...
            </div>
          ) : filteredPlays.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No plays found matching "{searchTerm}"
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredPlays.map((play) => (
                <button
                  key={play.id}
                  onClick={() => {
                    onAddPlay(play.id);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                    isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className={isLight ? 'text-gray-900 font-medium' : 'text-white font-medium'}>
                      {play.formation ? `${play.formation} ${play.name}` : play.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {play.bucketLabel}
                      {play.conceptFamily && ` / ${play.conceptFamily}`}
                    </div>
                  </div>
                  <Plus size={18} className="text-emerald-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick Assign Panel Component (for bulk operations)
function QuickAssignPanel({
  selectedPlayIds,
  plays,
  setupConfig,
  gamePlan,
  onToggleBucket,
  onToggleCallSheetBox,
  isLight,
  isCollapsed,
  onToggleCollapse,
  activePhase
}) {
  const selectedPlays = plays.filter(p => selectedPlayIds.includes(p.id));
  const hasSelection = selectedPlays.length > 0;

  // Calculate chip states for each category
  const getChipState = (plays, field, value) => {
    if (plays.length === 0) return { isActive: false, isPartial: false };
    const matchCount = plays.filter(p => {
      if (Array.isArray(p[field])) {
        return p[field].includes(value);
      }
      return p[field] === value;
    }).length;
    return {
      isActive: matchCount === plays.length,
      isPartial: matchCount > 0 && matchCount < plays.length
    };
  };

  // Get buckets for current phase
  const phaseBuckets = (setupConfig?.playBuckets || []).filter(
    b => (b.phase || 'OFFENSE') === activePhase
  );

  // Get concept groups
  const conceptGroups = setupConfig?.conceptGroups || [];

  // Get selected bucket(s) to show concept families
  const selectedBucketIds = [...new Set(selectedPlays.map(p => p.bucketId).filter(Boolean))];

  // Get spreadsheet boxes from game plan layouts (replaces CALL_SHEET)
  const callSheetBoxes = useMemo(() => {
    return getSpreadsheetBoxes(gamePlan?.gamePlanLayouts);
  }, [gamePlan]);

  // Check if plays are in a call sheet box
  const getBoxChipState = (boxId) => {
    if (selectedPlays.length === 0) return { isActive: false, isPartial: false };
    const sets = gamePlan?.offensiveGamePlan?.sets || [];
    const boxSet = sets.find(s => s.id === boxId);
    // Check both playIds and assignedPlayIds (spreadsheet uses assignedPlayIds)
    const boxPlayIds = boxSet?.assignedPlayIds || boxSet?.playIds || [];
    const matchCount = selectedPlays.filter(p => boxPlayIds.includes(p.id)).length;
    return {
      isActive: matchCount === selectedPlays.length,
      isPartial: matchCount > 0 && matchCount < selectedPlays.length
    };
  };

  return (
    <div className={`border-b ${isLight ? 'border-gray-200 bg-white' : 'border-slate-800 bg-slate-900/30'}`}>
      {/* Collapse Header */}
      <button
        onClick={onToggleCollapse}
        className={`w-full px-4 py-2 flex items-center justify-between text-sm ${
          isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-slate-400 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Settings size={14} />
          <span>Bulk Assign</span>
          {hasSelection && (
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-xs">
              {selectedPlays.length} selected
            </span>
          )}
        </div>
        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3">
          {!hasSelection ? (
            <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              Click a play row to edit inline, or select multiple plays (via checkboxes) for bulk assign
            </div>
          ) : selectedPlays.length === 1 ? (
            <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              Editing <span className="font-medium text-white">{selectedPlays[0]?.name}</span> inline. Select more plays for bulk operations.
            </div>
          ) : (
            <>
              {/* Buckets Row */}
              {phaseBuckets.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-xs font-semibold uppercase mr-2 w-16 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    Bucket:
                  </span>
                  {phaseBuckets.map((bucket) => {
                    const state = getChipState(selectedPlays, 'bucketId', bucket.id);
                    return (
                      <ToggleChip
                        key={bucket.id}
                        label={bucket.label}
                        isActive={state.isActive}
                        isPartial={state.isPartial}
                        onClick={() => onToggleBucket(bucket.id)}
                        color={bucket.color}
                        disabled={!hasSelection}
                      />
                    );
                  })}
                </div>
              )}

              {/* Call Sheet Boxes Row */}
              {callSheetBoxes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-xs font-semibold uppercase mr-2 w-16 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    Boxes:
                  </span>
                  {callSheetBoxes.map((box) => {
                    const state = getBoxChipState(box.id);
                    return (
                      <ToggleChip
                        key={box.id}
                        label={box.label}
                        isActive={state.isActive}
                        isPartial={state.isPartial}
                        onClick={() => onToggleCallSheetBox(box.id)}
                        color={box.color}
                        disabled={!hasSelection}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function InstallManager() {
  const { weekId } = useParams();
  const {
    playsArray,
    weeks,
    updateWeek,
    updatePlay,
    addPlay,
    settings,
    setupConfig,
    school,
    gamePlans,
    staff
  } = useSchool();
  const { user } = useAuth();

  // Theme detection
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  // Get current week
  const currentWeek = weeks.find(w => w.id === weekId);
  const isOffseason = currentWeek?.name === 'Offseason' || currentWeek?.phaseId?.includes('offseason');

  // Local state
  const [activePhase, setActivePhase] = useState('OFFENSE');
  const [selectedPlayIds, setSelectedPlayIds] = useState([]);
  const [expandedRowIds, setExpandedRowIds] = useState([]); // Rows with edit chips visible
  const [lastClickedIndex, setLastClickedIndex] = useState(null); // For shift+click range select
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [quickAssignCollapsed, setQuickAssignCollapsed] = useState(true);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Wizard state
  const [wizardState, setWizardState] = useState({
    isOpen: false,
    currentIndex: 0,
  });

  // Play suggestion state
  const [showSuggestionWizard, setShowSuggestionWizard] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Determine user role for suggestion permissions
  const userStaffEntry = useMemo(() => {
    if (!staff || !user?.email) return null;
    return staff.find(s => s.email?.toLowerCase() === user.email.toLowerCase());
  }, [staff, user?.email]);

  const isOC = useMemo(() => {
    if (!userStaffEntry) return false;
    return userStaffEntry.role === 'offensive_coordinator' ||
           userStaffEntry.role === 'head_coach' ||
           userStaffEntry.roles?.includes('Offensive Coordinator') ||
           userStaffEntry.roles?.includes('Head Coach') ||
           userStaffEntry.isSchoolAdmin;
  }, [userStaffEntry]);

  const pendingSuggestions = useMemo(() => {
    return (currentWeek?.playSuggestions || []).filter(s => s.status === 'pending');
  }, [currentWeek?.playSuggestions]);

  // Current install list and new install IDs from week
  const installList = currentWeek?.installList || [];
  const newInstallIds = currentWeek?.newInstallIds || [];
  const playRepTargets = currentWeek?.playRepTargets || {};
  const processedPlayIds = currentWeek?.processedPlayIds || [];

  // Get game plan for current week (for call sheet boxes)
  const gamePlan = useMemo(() => {
    return {
      offensiveGamePlan: currentWeek?.offensiveGamePlan || { sets: [] },
      gamePlanLayouts: currentWeek?.gamePlanLayouts || {}
    };
  }, [currentWeek]);

  // Calculate historical reps for all plays
  const historicalReps = useMemo(() => {
    return getAllHistoricalReps(weekId, weeks);
  }, [weekId, weeks]);

  // Calculate current week reps for quota status coloring
  const currentWeekReps = useMemo(() => {
    return getAllRepsForWeek(weekId, weeks);
  }, [weekId, weeks]);

  // Get quota status for a play: 'met' | 'partial' | 'none' | null
  const getQuotaStatus = useCallback((playId) => {
    const target = playRepTargets[playId];
    if (!target || target <= 0) return null; // No quota set
    const reps = currentWeekReps[playId] || 0;
    if (reps >= target) return 'met';
    if (reps > 0) return 'partial';
    return 'none';
  }, [playRepTargets, currentWeekReps]);

  // Get categories from setupConfig for inline editing
  const phaseBuckets = useMemo(() =>
    (setupConfig?.playBuckets || []).filter(b => (b.phase || 'OFFENSE') === activePhase),
    [setupConfig?.playBuckets, activePhase]
  );
  const conceptGroups = setupConfig?.conceptGroups || [];

  // Get spreadsheet boxes from game plan layouts (replaces CALL_SHEET)
  const callSheetBoxes = useMemo(() => {
    return getSpreadsheetBoxes(currentWeek?.gamePlanLayouts);
  }, [currentWeek?.gamePlanLayouts]);

  // Get which boxes each play is in
  const getPlayBoxIds = useCallback((playId) => {
    const boxIds = [];
    const sets = currentWeek?.offensiveGamePlan?.sets || [];
    sets.forEach(set => {
      // Check both playIds and assignedPlayIds (spreadsheet uses assignedPlayIds)
      const setPlayIds = set.assignedPlayIds || set.playIds || [];
      if (setPlayIds.includes(playId)) {
        boxIds.push(set.id);
      }
    });
    return boxIds;
  }, [currentWeek?.offensiveGamePlan]);

  // Get installed plays (hydrated) filtered by phase
  const phaseInstalledPlays = useMemo(() => {
    return installList
      .map(id => playsArray.find(p => p.id === id))
      .filter(p => p && (p.phase || 'OFFENSE') === activePhase);
  }, [installList, playsArray, activePhase]);

  // Sort plays - processed plays go to bottom
  const sortedPlays = useMemo(() => {
    const plays = [...phaseInstalledPlays];
    const processedSet = new Set(processedPlayIds);

    plays.sort((a, b) => {
      // PRIMARY: Unprocessed first
      const aProcessed = processedSet.has(a.id);
      const bProcessed = processedSet.has(b.id);
      if (aProcessed !== bProcessed) {
        return aProcessed ? 1 : -1;
      }

      // SECONDARY: Existing sort logic
      let aVal, bVal;
      switch (sortColumn) {
        case 'name':
          aVal = `${a.formation || ''} ${a.name || ''}`.toLowerCase();
          bVal = `${b.formation || ''} ${b.name || ''}`.toLowerCase();
          break;
        case 'bucket':
          aVal = a.bucketLabel || '';
          bVal = b.bucketLabel || '';
          break;
        case 'reps':
          aVal = playRepTargets[a.id] || 0;
          bVal = playRepTargets[b.id] || 0;
          break;
        case 'history':
          aVal = historicalReps[a.id] || 0;
          bVal = historicalReps[b.id] || 0;
          break;
        case 'wiz':
          aVal = a.needsWiz ? 1 : 0;
          bVal = b.needsWiz ? 1 : 0;
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }
      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return plays;
  }, [phaseInstalledPlays, sortColumn, sortDirection, playRepTargets, historicalReps, processedPlayIds]);

  // Stats
  const stats = useMemo(() => {
    const total = phaseInstalledPlays.length;
    const priorityCount = phaseInstalledPlays.filter(p => p.priority).length;
    const newCount = phaseInstalledPlays.filter(p => newInstallIds.includes(p.id)).length;
    const needsWizCount = phaseInstalledPlays.filter(p => p.needsWiz).length;
    const processedCount = phaseInstalledPlays.filter(p => processedPlayIds.includes(p.id)).length;
    const remainingCount = total - processedCount;
    return { total, priority: priorityCount, new: newCount, needsWiz: needsWizCount, processed: processedCount, remaining: remainingCount };
  }, [phaseInstalledPlays, newInstallIds, processedPlayIds]);

  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Select all / none
  const handleSelectAll = useCallback(() => {
    if (selectedPlayIds.length === phaseInstalledPlays.length) {
      setSelectedPlayIds([]);
    } else {
      setSelectedPlayIds(phaseInstalledPlays.map(p => p.id));
    }
  }, [selectedPlayIds, phaseInstalledPlays]);

  // Toggle single selection (also expands the row by default)
  // Supports shift+click for range selection
  const handleToggleSelect = useCallback((playId, index, shiftKey = false) => {
    if (shiftKey && lastClickedIndex !== null && lastClickedIndex !== index) {
      // Shift+click: select range
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const rangeIds = sortedPlays.slice(start, end + 1).map(p => p.id);

      setSelectedPlayIds(prev => {
        const newSelection = [...new Set([...prev, ...rangeIds])];
        // Also expand all newly selected
        setExpandedRowIds(exp => [...new Set([...exp, ...rangeIds])]);
        return newSelection;
      });
    } else {
      // Normal click: toggle single
      setSelectedPlayIds(prev => {
        if (prev.includes(playId)) {
          // Deselecting - also collapse
          setExpandedRowIds(exp => exp.filter(id => id !== playId));
          return prev.filter(id => id !== playId);
        } else {
          // Selecting - also expand
          setExpandedRowIds(exp => [...exp, playId]);
          return [...prev, playId];
        }
      });
    }
    setLastClickedIndex(index);
  }, [lastClickedIndex, sortedPlays]);

  // Toggle row expansion independently of selection
  const handleToggleExpand = useCallback((playId, e) => {
    e.stopPropagation();
    setExpandedRowIds(prev =>
      prev.includes(playId)
        ? prev.filter(id => id !== playId)
        : [...prev, playId]
    );
  }, []);

  // Add play to install
  const handleAddPlay = useCallback((playId) => {
    if (!currentWeek || installList.includes(playId)) return;
    const newList = [...installList, playId];
    const newNewIds = [...newInstallIds, playId]; // New plays are marked as new by default
    updateWeek(weekId, { installList: newList, newInstallIds: newNewIds });
  }, [currentWeek, installList, newInstallIds, weekId, updateWeek]);

  // Remove play from install only (quick remove)
  const handleRemoveFromInstall = useCallback((playId) => {
    if (!currentWeek) return;
    const newList = installList.filter(id => id !== playId);
    const newNewIds = newInstallIds.filter(id => id !== playId);
    const newTargets = { ...playRepTargets };
    delete newTargets[playId];
    updateWeek(weekId, { installList: newList, newInstallIds: newNewIds, playRepTargets: newTargets });
    setSelectedPlayIds(prev => prev.filter(id => id !== playId));
    setExpandedRowIds(prev => prev.filter(id => id !== playId));
  }, [currentWeek, installList, newInstallIds, playRepTargets, weekId, updateWeek]);

  // Full remove: Remove play from install, practice scripts, call sheet, and wristbands
  const handleFullRemoveFromWeek = useCallback((playId) => {
    if (!currentWeek) return;

    const play = playsArray.find(p => p.id === playId);
    const playName = play ? (play.formation ? `${play.formation} ${play.name}` : play.name) : 'this play';

    const confirm = window.confirm(
      `Remove "${playName}" from this week entirely?\n\nThis will remove it from:\n• Install list\n• All practice scripts\n• Call sheet boxes\n• Wristband assignments\n\nThis cannot be undone.`
    );
    if (!confirm) return;

    const updates = {};

    // 1. Remove from install list
    updates.installList = installList.filter(id => id !== playId);
    updates.newInstallIds = newInstallIds.filter(id => id !== playId);
    const newTargets = { ...playRepTargets };
    delete newTargets[playId];
    updates.playRepTargets = newTargets;

    // 2. Remove from practice scripts
    if (currentWeek.practicePlans) {
      const newPracticePlans = {};
      Object.entries(currentWeek.practicePlans).forEach(([dayKey, dayPlan]) => {
        const newSegments = (dayPlan.segments || []).map(segment => ({
          ...segment,
          script: (segment.script || []).filter(row => row.playId !== playId)
        }));
        newPracticePlans[dayKey] = { ...dayPlan, segments: newSegments };
      });
      updates.practicePlans = newPracticePlans;
    }

    // 3. Remove from call sheet / game plan sets (handle both playIds and assignedPlayIds)
    if (currentWeek.offensiveGamePlan?.sets) {
      const newSets = currentWeek.offensiveGamePlan.sets.map(set => ({
        ...set,
        playIds: (set.playIds || []).filter(id => id !== playId),
        assignedPlayIds: (set.assignedPlayIds || []).filter(id => id !== playId)
      }));
      updates.offensiveGamePlan = { ...currentWeek.offensiveGamePlan, sets: newSets };
    }

    // 4. Remove from wristbands (if wristband data exists on week)
    if (currentWeek.wristbands) {
      const newWristbands = {};
      Object.entries(currentWeek.wristbands).forEach(([key, wristband]) => {
        if (Array.isArray(wristband)) {
          newWristbands[key] = wristband.filter(id => id !== playId);
        } else if (wristband?.playIds) {
          newWristbands[key] = { ...wristband, playIds: wristband.playIds.filter(id => id !== playId) };
        } else {
          newWristbands[key] = wristband;
        }
      });
      updates.wristbands = newWristbands;
    }

    updateWeek(weekId, updates);
    setSelectedPlayIds(prev => prev.filter(id => id !== playId));
    setExpandedRowIds(prev => prev.filter(id => id !== playId));
  }, [currentWeek, playsArray, installList, newInstallIds, playRepTargets, weekId, updateWeek]);

  // Toggle new play marker
  const handleToggleNewPlay = useCallback((playId) => {
    if (!currentWeek) return;
    let newIds;
    if (newInstallIds.includes(playId)) {
      newIds = newInstallIds.filter(id => id !== playId);
    } else {
      newIds = [...newInstallIds, playId];
    }
    updateWeek(weekId, { newInstallIds: newIds });
  }, [currentWeek, newInstallIds, weekId, updateWeek]);

  // Update target reps
  const handleUpdateTargetReps = useCallback((playId, reps) => {
    if (!currentWeek) return;
    const newTargets = { ...playRepTargets, [playId]: reps };
    updateWeek(weekId, { playRepTargets: newTargets });
  }, [currentWeek, playRepTargets, weekId, updateWeek]);

  // Update a single field on a play (for inline editing)
  const handleUpdatePlayField = useCallback((playId, field, value) => {
    updatePlay(playId, { [field]: value });
  }, [updatePlay]);

  // Toggle a value in an array field on a play (for inline editing)
  const handleTogglePlayArrayField = useCallback((playId, field, value) => {
    const play = playsArray.find(p => p.id === playId);
    if (!play) return;
    const current = play[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updatePlay(playId, { [field]: updated });
  }, [playsArray, updatePlay]);

  // Toggle a play in/out of a call sheet box (for inline editing)
  const handleTogglePlayInBox = useCallback((playId, boxId) => {
    if (!currentWeek) return;
    const gamePlanData = currentWeek.offensiveGamePlan || { sets: [] };
    const sets = [...(gamePlanData.sets || [])];
    let boxSetIndex = sets.findIndex(s => s.id === boxId);

    // Determine if this is a spreadsheet box (use assignedPlayIds) or legacy box (use playIds)
    const isSpreadsheetBox = boxId.startsWith('spreadsheet_');
    const playIdField = isSpreadsheetBox ? 'assignedPlayIds' : 'playIds';

    if (boxSetIndex === -1) {
      // Box doesn't exist in sets yet, create it
      sets.push({ id: boxId, [playIdField]: [playId] });
    } else {
      const boxSet = { ...sets[boxSetIndex] };
      const currentPlayIds = boxSet[playIdField] || boxSet.playIds || boxSet.assignedPlayIds || [];
      if (currentPlayIds.includes(playId)) {
        // Remove play from box
        boxSet[playIdField] = currentPlayIds.filter(id => id !== playId);
      } else {
        // Add play to box
        boxSet[playIdField] = [...currentPlayIds, playId];
      }
      sets[boxSetIndex] = boxSet;
    }

    updateWeek(weekId, { offensiveGamePlan: { ...gamePlanData, sets } });
  }, [currentWeek, weekId, updateWeek]);

  // Toggle bucket assignment for selected plays
  const handleToggleBucket = useCallback((bucketId) => {
    const selectedPlays = playsArray.filter(p => selectedPlayIds.includes(p.id));
    const allHave = selectedPlays.every(p => p.bucketId === bucketId);

    selectedPlays.forEach(play => {
      updatePlay(play.id, { bucketId: allHave ? null : bucketId });
    });
  }, [selectedPlayIds, playsArray, updatePlay]);

  // Toggle array field (fieldZones, downDistance, situations, practiceSegmentTypes)
  const handleToggleArrayField = useCallback((field, value) => {
    const selectedPlays = playsArray.filter(p => selectedPlayIds.includes(p.id));
    const allHave = selectedPlays.every(p => (p[field] || []).includes(value));

    selectedPlays.forEach(play => {
      const current = play[field] || [];
      const updated = allHave
        ? current.filter(v => v !== value)
        : [...new Set([...current, value])];
      updatePlay(play.id, { [field]: updated });
    });
  }, [selectedPlayIds, playsArray, updatePlay]);

  // Toggle call sheet box
  const handleToggleCallSheetBox = useCallback((boxId) => {
    if (!currentWeek) return;
    const selectedPlays = playsArray.filter(p => selectedPlayIds.includes(p.id));
    const gamePlanData = currentWeek.offensiveGamePlan || { sets: [] };
    const sets = [...(gamePlanData.sets || [])];
    let boxSetIndex = sets.findIndex(s => s.id === boxId);

    // Determine if this is a spreadsheet box (use assignedPlayIds) or legacy box (use playIds)
    const isSpreadsheetBox = boxId.startsWith('spreadsheet_');
    const playIdField = isSpreadsheetBox ? 'assignedPlayIds' : 'playIds';

    if (boxSetIndex === -1) {
      sets.push({ id: boxId, [playIdField]: [] });
      boxSetIndex = sets.length - 1;
    }

    const boxSet = { ...sets[boxSetIndex] };
    const currentPlayIds = boxSet[playIdField] || boxSet.playIds || boxSet.assignedPlayIds || [];
    const allInBox = selectedPlays.every(p => currentPlayIds.includes(p.id));

    if (allInBox) {
      boxSet[playIdField] = currentPlayIds.filter(id => !selectedPlayIds.includes(id));
    } else {
      boxSet[playIdField] = [...new Set([...currentPlayIds, ...selectedPlayIds])];
    }

    sets[boxSetIndex] = boxSet;
    updateWeek(weekId, { offensiveGamePlan: { ...gamePlanData, sets } });
  }, [currentWeek, selectedPlayIds, playsArray, weekId, updateWeek]);

  // Copy from previous week
  const handleCopyFromPreviousWeek = useCallback(() => {
    if (!currentWeek) return;

    const weekIndex = weeks.findIndex(w => w.id === weekId);
    if (weekIndex <= 0) {
      alert('No previous week available');
      return;
    }

    const prevWeek = weeks[weekIndex - 1];
    if (!prevWeek.installList || prevWeek.installList.length === 0) {
      alert('Previous week has no installed plays');
      return;
    }

    const confirm = window.confirm(
      `Copy ${prevWeek.installList.length} plays from "${prevWeek.name || prevWeek.opponent || 'Previous Week'}"?\n\nThis will add to your current install list.`
    );
    if (!confirm) return;

    const combinedList = [...new Set([...installList, ...prevWeek.installList])];
    updateWeek(weekId, { installList: combinedList });
  }, [currentWeek, weeks, weekId, installList, updateWeek]);

  // Clear all installs
  const handleClearAll = useCallback(() => {
    if (!currentWeek) return;
    const confirm = window.confirm('Clear all installed plays for this week? This cannot be undone.');
    if (!confirm) return;
    updateWeek(weekId, { installList: [], newInstallIds: [], playRepTargets: {} });
    setSelectedPlayIds([]);
    setExpandedRowIds([]);
  }, [currentWeek, weekId, updateWeek]);

  // Bulk full remove for selected plays
  const handleBulkFullRemove = useCallback(() => {
    if (!currentWeek || selectedPlayIds.length === 0) return;

    const confirm = window.confirm(
      `Remove ${selectedPlayIds.length} selected play(s) from this week entirely?\n\nThis will remove them from:\n• Install list\n• All practice scripts\n• Call sheet boxes\n• Wristband assignments\n\nThis cannot be undone.`
    );
    if (!confirm) return;

    const updates = {};

    // 1. Remove from install list
    updates.installList = installList.filter(id => !selectedPlayIds.includes(id));
    updates.newInstallIds = newInstallIds.filter(id => !selectedPlayIds.includes(id));
    const newTargets = { ...playRepTargets };
    selectedPlayIds.forEach(id => delete newTargets[id]);
    updates.playRepTargets = newTargets;

    // 2. Remove from practice scripts
    if (currentWeek.practicePlans) {
      const newPracticePlans = {};
      Object.entries(currentWeek.practicePlans).forEach(([dayKey, dayPlan]) => {
        const newSegments = (dayPlan.segments || []).map(segment => ({
          ...segment,
          script: (segment.script || []).filter(row => !selectedPlayIds.includes(row.playId))
        }));
        newPracticePlans[dayKey] = { ...dayPlan, segments: newSegments };
      });
      updates.practicePlans = newPracticePlans;
    }

    // 3. Remove from call sheet / game plan sets (handle both playIds and assignedPlayIds)
    if (currentWeek.offensiveGamePlan?.sets) {
      const newSets = currentWeek.offensiveGamePlan.sets.map(set => ({
        ...set,
        playIds: (set.playIds || []).filter(id => !selectedPlayIds.includes(id)),
        assignedPlayIds: (set.assignedPlayIds || []).filter(id => !selectedPlayIds.includes(id))
      }));
      updates.offensiveGamePlan = { ...currentWeek.offensiveGamePlan, sets: newSets };
    }

    // 4. Remove from wristbands
    if (currentWeek.wristbands) {
      const newWristbands = {};
      Object.entries(currentWeek.wristbands).forEach(([key, wristband]) => {
        if (Array.isArray(wristband)) {
          newWristbands[key] = wristband.filter(id => !selectedPlayIds.includes(id));
        } else if (wristband?.playIds) {
          newWristbands[key] = { ...wristband, playIds: wristband.playIds.filter(id => !selectedPlayIds.includes(id)) };
        } else {
          newWristbands[key] = wristband;
        }
      });
      updates.wristbands = newWristbands;
    }

    updateWeek(weekId, updates);
    setSelectedPlayIds([]);
    setExpandedRowIds([]);
  }, [currentWeek, selectedPlayIds, installList, newInstallIds, playRepTargets, weekId, updateWeek]);

  // Clear selection and expansion when phase changes
  useEffect(() => {
    setSelectedPlayIds([]);
    setExpandedRowIds([]);
    setLastClickedIndex(null);
  }, [activePhase]);

  // Wizard handlers
  const openWizard = useCallback((startIndex = null) => {
    // Find first unprocessed play if no index specified
    let index = startIndex;
    if (index === null) {
      const firstUnprocessedIdx = sortedPlays.findIndex(p => !processedPlayIds.includes(p.id));
      index = firstUnprocessedIdx >= 0 ? firstUnprocessedIdx : 0;
    }
    setWizardState({
      isOpen: true,
      currentIndex: index,
    });
  }, [sortedPlays, processedPlayIds]);

  const closeWizard = useCallback(() => {
    setWizardState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const wizardNext = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, sortedPlays.length - 1),
    }));
  }, [sortedPlays.length]);

  const wizardPrevious = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  }, []);

  const handleMarkProcessed = useCallback((playId) => {
    if (!currentWeek) return;
    let newIds;
    if (processedPlayIds.includes(playId)) {
      // Already processed, keep it that way (don't toggle off in wizard flow)
      return;
    } else {
      newIds = [...processedPlayIds, playId];
    }
    updateWeek(weekId, { processedPlayIds: newIds });
  }, [currentWeek, processedPlayIds, weekId, updateWeek]);

  const handleToggleProcessed = useCallback((playId) => {
    if (!currentWeek) return;
    let newIds;
    if (processedPlayIds.includes(playId)) {
      newIds = processedPlayIds.filter(id => id !== playId);
    } else {
      newIds = [...processedPlayIds, playId];
    }
    updateWeek(weekId, { processedPlayIds: newIds });
  }, [currentWeek, processedPlayIds, weekId, updateWeek]);

  // Calculate scripted reps for each play
  const scriptedReps = useMemo(() => {
    const reps = {};
    if (currentWeek?.practicePlans) {
      Object.values(currentWeek.practicePlans).forEach(dayPlan => {
        (dayPlan.segments || []).forEach(segment => {
          (segment.script || []).forEach(row => {
            if (row.playId) {
              reps[row.playId] = (reps[row.playId] || 0) + (row.reps || 1);
            }
          });
        });
      });
    }
    return reps;
  }, [currentWeek?.practicePlans]);

  // Get spreadsheet boxes with their play assignments for wizard
  const callSheetBoxesWithPlays = useMemo(() => {
    const spreadsheetBoxes = getSpreadsheetBoxes(currentWeek?.gamePlanLayouts);
    const sets = currentWeek?.offensiveGamePlan?.sets || [];

    return spreadsheetBoxes.map(box => {
      const boxSet = sets.find(s => s.id === box.setId);
      return {
        ...box,
        playIds: boxSet?.playIds || boxSet?.assignedPlayIds || []
      };
    });
  }, [currentWeek?.gamePlanLayouts, currentWeek?.offensiveGamePlan]);

  // Play suggestion handlers
  const handleSubmitSuggestion = useCallback((suggestionData) => {
    const newSuggestion = {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...suggestionData,
      suggestedBy: {
        id: userStaffEntry?.id,
        name: userStaffEntry?.name || user?.displayName || 'Unknown',
        email: user?.email
      },
      suggestedAt: new Date().toISOString(),
      status: 'pending',
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null
    };

    const currentSuggestions = currentWeek?.playSuggestions || [];
    updateWeek(weekId, {
      playSuggestions: [...currentSuggestions, newSuggestion]
    });
    setShowSuggestionWizard(false);
  }, [currentWeek, userStaffEntry, user, weekId, updateWeek]);

  const handleAcceptSuggestion = useCallback(async (suggestionId) => {
    const suggestion = currentWeek?.playSuggestions?.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // 1. Add to master playbook
    const newPlayId = await addPlay({
      ...suggestion.playData,
      phase: activePhase,
      bucketId: suggestion.gamePlanTags?.bucketId,
      conceptFamily: suggestion.gamePlanTags?.conceptFamily
    });

    // 2. Add to install list
    const newInstallList = [...installList, newPlayId];
    const newNewInstallIds = [...newInstallIds, newPlayId];

    // 3. Update suggestion status
    const updatedSuggestions = (currentWeek.playSuggestions || []).map(s =>
      s.id === suggestionId
        ? {
            ...s,
            status: 'accepted',
            reviewedAt: new Date().toISOString(),
            reviewedBy: { name: userStaffEntry?.name, email: user?.email },
            acceptedPlayId: newPlayId
          }
        : s
    );

    updateWeek(weekId, {
      playSuggestions: updatedSuggestions,
      installList: newInstallList,
      newInstallIds: newNewInstallIds
    });
  }, [currentWeek, addPlay, activePhase, installList, newInstallIds, userStaffEntry, user, weekId, updateWeek]);

  const handleRejectSuggestion = useCallback((suggestionId, reason = '') => {
    const updatedSuggestions = (currentWeek?.playSuggestions || []).map(s =>
      s.id === suggestionId
        ? {
            ...s,
            status: 'rejected',
            reviewedAt: new Date().toISOString(),
            reviewedBy: { name: userStaffEntry?.name, email: user?.email },
            rejectionReason: reason
          }
        : s
    );

    updateWeek(weekId, { playSuggestions: updatedSuggestions });
  }, [currentWeek, userStaffEntry, user, weekId, updateWeek]);

  // Get abbreviation helpers
  const getZoneAbbrev = (zoneId) => {
    const zone = (setupConfig?.fieldZones || []).find(z => z.id === zoneId);
    return zone?.abbrev || zone?.name?.substring(0, 2) || '?';
  };

  const getDDAbbrev = (ddId) => {
    const dd = (setupConfig?.downDistanceCategories || []).find(d => d.id === ddId);
    return dd?.abbrev || dd?.name?.substring(0, 3) || '?';
  };

  const getSitAbbrev = (sitId) => {
    const sit = (setupConfig?.specialSituations || []).find(s => s.id === sitId);
    return sit?.abbrev || sit?.name?.substring(0, 2) || '?';
  };

  const getSegAbbrev = (segId) => {
    const phaseKey = activePhase === 'OFFENSE' ? 'O' : activePhase === 'DEFENSE' ? 'D' : 'K';
    const seg = (setupConfig?.practiceSegmentTypes?.[phaseKey] || []).find(s => s.id === segId);
    return seg?.abbrev || seg?.name?.substring(0, 2) || '?';
  };

  // No week selected state
  if (!currentWeek) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Layers size={64} className="text-emerald-400 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>Install Manager</h1>
          <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            Select a week from the sidebar to manage play installations.
          </p>
          <Link
            to="/dashboard"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const allSelected = selectedPlayIds.length === phaseInstalledPlays.length && phaseInstalledPlays.length > 0;
  const someSelected = selectedPlayIds.length > 0 && !allSelected;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-slate-800 bg-slate-900/50'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Install Manager</h1>
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              {currentWeek.name || currentWeek.opponent || `Week ${currentWeek.weekNumber || ''}`}
              {currentWeek.opponent && ` vs ${currentWeek.opponent}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Assignment Wizard Button */}
            <button
              onClick={() => openWizard()}
              disabled={phaseInstalledPlays.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                phaseInstalledPlays.length === 0
                  ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-500'
                  : 'bg-violet-500 text-white hover:bg-violet-600'
              }`}
            >
              <Wand2 size={14} />
              Assignment Wizard
              {stats.remaining > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                  {stats.remaining}
                </span>
              )}
            </button>
            {/* Add Play Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <Plus size={14} />
              Add Play
            </button>
            <button
              onClick={handleCopyFromPreviousWeek}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded ${
                isLight
                  ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Copy size={14} />
              Copy from Previous
            </button>
            {selectedPlayIds.length > 0 && (
              <button
                onClick={handleBulkFullRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600"
              >
                <Trash2 size={14} />
                Delete {selectedPlayIds.length} Selected
              </button>
            )}
            <button
              onClick={handleClearAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded ${
                isLight
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              <Trash2 size={14} />
              Clear All
            </button>
            {/* Suggest Play button - for non-OC coaches */}
            {!isOC && (
              <button
                onClick={() => setShowSuggestionWizard(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-purple-500 text-white hover:bg-purple-600"
              >
                <MessageSquarePlus size={14} />
                Suggest Play
              </button>
            )}
            {/* Review Suggestions button - for OC */}
            {isOC && pendingSuggestions.length > 0 && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-amber-500 text-white hover:bg-amber-600"
              >
                <ClipboardCheck size={14} />
                Review Suggestions
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                  {pendingSuggestions.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].map(phase => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  activePhase === phase
                    ? 'bg-sky-500 text-white'
                    : isLight
                    ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:text-gray-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {phase === 'SPECIAL_TEAMS' ? 'ST' : phase.charAt(0)}
              </button>
            ))}
          </div>

          <div className={`h-5 w-px ${isLight ? 'bg-gray-300' : 'bg-slate-700'}`} />

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>Installed:</span>
              <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star size={12} className="fill-amber-500" />
              <span>{stats.priority}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500">
              <Sparkles size={12} />
              <span>{stats.new} new</span>
            </div>
            {stats.needsWiz > 0 && (
              <div className="flex items-center gap-1.5 text-orange-400" title="Plays needing wristband diagrams">
                <LayoutGrid size={12} />
                <span>{stats.needsWiz} WIZ</span>
              </div>
            )}
            {stats.processed > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-500" title="Plays reviewed in wizard">
                <CheckCircle2 size={12} />
                <span>{stats.processed} done</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Assign Panel */}
      <QuickAssignPanel
        selectedPlayIds={selectedPlayIds}
        plays={playsArray}
        setupConfig={setupConfig}
        gamePlan={gamePlan}
        onToggleBucket={handleToggleBucket}
        onToggleCallSheetBox={handleToggleCallSheetBox}
        isLight={isLight}
        isCollapsed={quickAssignCollapsed}
        onToggleCollapse={() => setQuickAssignCollapsed(!quickAssignCollapsed)}
        activePhase={activePhase}
      />

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {phaseInstalledPlays.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <Layers size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>No Plays Installed</h3>
              <p className={`text-sm mb-4 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Click "Add Play" to search and add plays to your weekly install.
              </p>
              <button
                onClick={() => setShowSearchModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                <Plus size={18} />
                Add Play
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className={`sticky top-0 z-10 ${isLight ? 'bg-gray-100' : 'bg-slate-800'}`}>
              <tr className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-600"
                    ref={el => el && (el.indeterminate = someSelected)}
                  />
                </th>
                <th
                  className="px-3 py-2 text-left cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    Play
                    {sortColumn === 'name' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th
                  className="px-3 py-2 text-left cursor-pointer hover:text-white"
                  onClick={() => handleSort('bucket')}
                >
                  <span className="flex items-center gap-1">
                    Bucket
                    {sortColumn === 'bucket' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th className="px-3 py-2 text-left">Concept</th>
                <th className="px-3 py-2 text-left">Call Sheet Boxes</th>
                <th
                  className="px-3 py-2 text-center cursor-pointer hover:text-white"
                  onClick={() => handleSort('reps')}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Target size={12} />
                    Reps
                    {sortColumn === 'reps' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th
                  className="px-3 py-2 text-center cursor-pointer hover:text-white"
                  onClick={() => handleSort('history')}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Clock size={12} />
                    Hist
                    {sortColumn === 'history' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th
                  className="px-3 py-2 text-center cursor-pointer hover:text-white"
                  onClick={() => handleSort('wiz')}
                  title="Needs Wristband Diagram"
                >
                  <span className="flex items-center justify-center gap-1">
                    <LayoutGrid size={12} />
                    {sortColumn === 'wiz' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sortedPlays.map((play, idx) => {
                const isSelected = selectedPlayIds.includes(play.id);
                const isExpanded = expandedRowIds.includes(play.id);
                const isNew = newInstallIds.includes(play.id);
                const isPriority = play.priority;
                const isProcessed = processedPlayIds.includes(play.id);
                const targetReps = playRepTargets[play.id] || 0;
                const histReps = historicalReps[play.id] || 0;
                const quotaStatus = getQuotaStatus(play.id);

                // Get bucket info
                const bucket = (setupConfig?.playBuckets || []).find(b => b.id === play.bucketId);

                // Quota status colors (only when not selected/processed)
                const getQuotaColor = () => {
                  if (isSelected || isProcessed || !quotaStatus) return '';
                  if (isLight) {
                    if (quotaStatus === 'met') return 'bg-emerald-50 hover:bg-emerald-100';
                    if (quotaStatus === 'partial') return 'bg-amber-50 hover:bg-amber-100';
                    if (quotaStatus === 'none') return 'bg-red-50 hover:bg-red-100';
                  } else {
                    if (quotaStatus === 'met') return 'bg-emerald-500/10 hover:bg-emerald-500/20';
                    if (quotaStatus === 'partial') return 'bg-amber-500/10 hover:bg-amber-500/20';
                    if (quotaStatus === 'none') return 'bg-red-500/10 hover:bg-red-500/20';
                  }
                  return '';
                };
                const quotaColor = getQuotaColor();

                return (
                  <tr
                    key={play.id}
                    onClick={(e) => handleToggleSelect(play.id, idx, e.shiftKey)}
                    onDoubleClick={() => openWizard(idx)}
                    className={`border-b transition-colors cursor-pointer ${
                      isProcessed ? 'opacity-60' : ''
                    } ${
                      isLight
                        ? isSelected
                          ? 'bg-sky-50 border-gray-200'
                          : isProcessed
                          ? 'bg-emerald-50/50 border-gray-200 hover:bg-emerald-50'
                          : quotaColor
                          ? `${quotaColor} border-gray-200`
                          : idx % 2 === 0
                          ? 'bg-white border-gray-200 hover:bg-gray-50'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        : isSelected
                        ? 'bg-sky-500/10 border-slate-700'
                        : isProcessed
                        ? 'bg-emerald-500/5 border-slate-800 hover:bg-emerald-500/10'
                        : quotaColor
                        ? `${quotaColor} border-slate-800`
                        : idx % 2 === 0
                        ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/50'
                        : 'bg-slate-900/30 border-slate-800 hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Checkbox + Expand toggle */}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(play.id, idx, e.nativeEvent.shiftKey)}
                          className="rounded border-slate-600"
                        />
                        {isSelected && (
                          <button
                            onClick={(e) => handleToggleExpand(play.id, e)}
                            className={`p-0.5 rounded transition-colors ${
                              isExpanded
                                ? 'text-sky-400 hover:bg-sky-500/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                            }`}
                            title={isExpanded ? 'Collapse edit chips' : 'Expand edit chips'}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Play Name */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {/* Processed indicator */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleProcessed(play.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            isProcessed
                              ? 'text-emerald-500'
                              : 'text-slate-600 hover:text-emerald-400'
                          }`}
                          title={isProcessed ? 'Mark as not done' : 'Mark as done'}
                        >
                          <CheckCircle2 size={14} className={isProcessed ? 'fill-emerald-500/20' : ''} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdatePlayField(play.id, 'priority', !play.priority);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            isPriority
                              ? 'text-amber-400'
                              : 'text-slate-600 hover:text-amber-400'
                          }`}
                          title={isPriority ? 'Remove priority' : 'Mark as priority'}
                        >
                          <Star size={14} className={isPriority ? 'fill-amber-400' : ''} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNewPlay(play.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            isNew
                              ? 'text-emerald-400'
                              : 'text-slate-600 hover:text-emerald-400'
                          }`}
                          title={isNew ? 'Remove new marker' : 'Mark as new'}
                        >
                          <Sparkles size={14} className={isNew ? 'fill-emerald-400' : ''} />
                        </button>
                        <span className={isLight ? 'text-gray-900 font-medium' : 'text-white font-medium'}>
                          {play.formation ? `${play.formation} ${play.name}` : play.name}
                        </span>
                        {getWristbandDisplay(play) && (
                          <span className="text-xs text-slate-500">[{getWristbandDisplay(play)}]</span>
                        )}
                      </div>
                    </td>

                    {/* Bucket */}
                    <td className="px-3 py-2" onClick={isExpanded ? (e) => e.stopPropagation() : undefined}>
                      {isExpanded ? (
                        <InlineBucketChips
                          buckets={phaseBuckets}
                          activeId={play.bucketId}
                          onSelect={(bucketId) => handleUpdatePlayField(play.id, 'bucketId', bucketId)}
                        />
                      ) : bucket ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: `${bucket.color}30`, color: bucket.color }}
                        >
                          {bucket.label}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>

                    {/* Concept Family */}
                    <td className="px-3 py-2" onClick={isExpanded ? (e) => e.stopPropagation() : undefined}>
                      {isExpanded ? (
                        <InlineConceptChips
                          conceptGroups={conceptGroups}
                          bucketId={play.bucketId}
                          activeFamily={play.conceptFamily}
                          onSelect={(family) => handleUpdatePlayField(play.id, 'conceptFamily', family)}
                        />
                      ) : play.conceptFamily ? (
                        <span className="text-xs text-slate-300">{play.conceptFamily}</span>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>

                    {/* Call Sheet Boxes */}
                    <td className="px-3 py-2" onClick={isExpanded ? (e) => e.stopPropagation() : undefined}>
                      {isExpanded ? (
                        <InlineBoxChips
                          boxes={callSheetBoxes}
                          activeBoxIds={getPlayBoxIds(play.id)}
                          onToggle={(boxId) => handleTogglePlayInBox(play.id, boxId)}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-0.5">
                          {getPlayBoxIds(play.id).map(boxId => {
                            const box = callSheetBoxes.find(b => b.id === boxId);
                            return box ? (
                              <span
                                key={boxId}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{ backgroundColor: `${box.color}30`, color: box.color }}
                                title={box.label}
                              >
                                {box.label?.substring(0, 4)}
                              </span>
                            ) : null;
                          })}
                          {getPlayBoxIds(play.id).length === 0 && (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Target Reps */}
                    <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <RepInput
                        value={targetReps}
                        onChange={(val) => handleUpdateTargetReps(play.id, val)}
                      />
                    </td>

                    {/* Historical Reps */}
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs ${histReps > 0 ? (isLight ? 'text-gray-700' : 'text-slate-300') : 'text-slate-500'}`}>
                        {histReps > 0 ? histReps : '--'}
                      </span>
                    </td>

                    {/* Needs WIZ */}
                    <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={play.needsWiz || false}
                        onChange={() => handleUpdatePlayField(play.id, 'needsWiz', !play.needsWiz)}
                        className={`rounded border-slate-600 ${
                          play.needsWiz ? 'accent-amber-500' : ''
                        }`}
                        title={play.needsWiz ? 'Needs wristband diagram' : 'Mark as needing diagram'}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemoveFromInstall(play.id)}
                          className="p-1 rounded text-slate-500 hover:text-orange-400 hover:bg-orange-500/20 transition-colors"
                          title="Remove from install list only"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          onClick={() => handleFullRemoveFromWeek(play.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Remove from week (install, scripts, call sheet, wristbands)"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Search Modal */}
      <PlaySearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onAddPlay={handleAddPlay}
        plays={playsArray.filter(p => (p.phase || 'OFFENSE') === activePhase)}
        installedIds={installList}
        isLight={isLight}
      />

      {/* Assignment Wizard */}
      <PlayAssignmentWizard
        isOpen={wizardState.isOpen}
        onClose={closeWizard}
        plays={sortedPlays}
        currentIndex={wizardState.currentIndex}
        totalPlays={sortedPlays.length}
        remainingCount={stats.remaining}
        processedPlayIds={processedPlayIds}
        onNext={wizardNext}
        onPrevious={wizardPrevious}
        onMarkProcessed={handleMarkProcessed}
        onUpdatePlayField={handleUpdatePlayField}
        onTogglePlayInBox={handleTogglePlayInBox}
        onUpdateTargetReps={handleUpdateTargetReps}
        onToggleNewPlay={handleToggleNewPlay}
        phaseBuckets={phaseBuckets}
        conceptGroups={conceptGroups}
        callSheetBoxes={callSheetBoxesWithPlays}
        historicalReps={historicalReps}
        playRepTargets={playRepTargets}
        newInstallIds={newInstallIds}
        scriptedReps={scriptedReps}
        isLight={isLight}
      />

      {/* Play Suggestion Wizard */}
      <PlaySuggestionWizard
        isOpen={showSuggestionWizard}
        onClose={() => setShowSuggestionWizard(false)}
        onSubmit={handleSubmitSuggestion}
        setupConfig={setupConfig}
        activePhase={activePhase}
        callSheetBoxes={callSheetBoxes}
        phaseBuckets={phaseBuckets}
        conceptGroups={conceptGroups}
        isLight={isLight}
      />

      {/* Review Suggestions Modal */}
      <ReviewSuggestionsModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        suggestions={currentWeek?.playSuggestions || []}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
        setupConfig={setupConfig}
        phaseBuckets={phaseBuckets}
        isLight={isLight}
      />
    </div>
  );
}
