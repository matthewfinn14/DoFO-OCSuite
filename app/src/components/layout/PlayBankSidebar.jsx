import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { usePlayDetailsModal } from '../PlayDetailsModal';
import { usePlayBank } from '../../context/PlayBankContext';
import { getWristbandDisplay } from '../../utils/wristband';
import { getAllRepsForWeek } from '../../utils/repTracking';
import { getSpreadsheetBoxes } from '../../utils/gamePlanSections';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Landmark,
  Plus,
  PlusCircle,
  Star,
  CheckSquare,
  Square,
  X,
  MousePointer,
  LayoutTemplate,
  MapPin,
  Target,
  Zap,
  List,
  Package
} from 'lucide-react';

export default function PlayBankSidebar({
  isOpen,
  onToggle,
  batchSelectMode = false,
  onBatchSelect = null,
  onCancelBatchSelect = null,
  batchSelectLabel = 'Add Selected',
  // Headers mode props (for spreadsheet view)
  headersMode = false,
  headerTemplates = [],
  onHeaderClick = null,
  pendingHeaderConfig = null,
  setPendingHeaderConfig = null,
  assignHeaderConfig = null,
  setAssignHeaderConfig = null,
  draggedNewHeader = null,
  setDraggedNewHeader = null
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openPlayDetails } = usePlayDetailsModal();
  const {
    playsArray,
    settings,
    weeks,
    currentWeekId,
    gamePlans,
    scripts,
    addPlay,
    updateWeek,
    setupConfig,
    updateSetupConfig
  } = useSchool();

  // Get single select mode from context (for wristband assignment)
  const {
    singleSelectMode,
    selectedPlayId: contextSelectedPlayId,
    selectPlayForAssign,
    clearSelectedPlay,
    triggerQuickAdd,
    highlightFocuses,
    targetingMode,
    targetingPlays,
    startTargetingMode,
    cancelTargetingMode
  } = usePlayBank();

  // Local state - default to headers tab when in headers mode
  const [activeTab, setActiveTab] = useState(headersMode ? 'headers' : 'install'); // install, gameplan, usage, headers
  const [playBankPhase, setPlayBankPhase] = useState('OFFENSE');

  // Switch to headers tab when headersMode is enabled
  useEffect(() => {
    if (headersMode) {
      setActiveTab('headers');
    }
  }, [headersMode]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickAddValue, setQuickAddValue] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Batch selection state
  const [selectedPlayIds, setSelectedPlayIds] = useState(new Set());
  const [internalBatchMode, setInternalBatchMode] = useState(false); // For internal batch-to-install

  // Get play buckets and concept families from setupConfig (with settings fallback)
  const playBuckets = setupConfig?.playBuckets || settings?.playBuckets || [];
  const formations = setupConfig?.formations || settings?.formations || [];
  const readTypes = setupConfig?.readTypes || [];
  const lookAlikeSeries = setupConfig?.lookAlikeSeries || [];
  const fieldZones = setupConfig?.fieldZones || [];
  const specialSituations = setupConfig?.specialSituations || [];

  // Get filter options based on selected category
  const getFilterOptions = useCallback(() => {
    switch (filterCategory) {
      case 'formation':
        return formations
          .filter(f => !f.phase || f.phase === playBankPhase)
          .map(f => ({ id: f.id || f.name, label: f.name || f.label }));
      case 'bucket':
        return playBuckets
          .filter(b => (b.phase || 'OFFENSE') === playBankPhase)
          .map(b => ({ id: b.id, label: b.label }));
      case 'conceptGroup':
        // Derive concept groups from bucket.families
        const groups = [];
        playBuckets
          .filter(b => (b.phase || 'OFFENSE') === playBankPhase)
          .forEach(bucket => {
            (bucket.families || []).forEach(familyName => {
              groups.push({
                id: `${bucket.id}_${familyName}`,
                label: `${bucket.label}: ${familyName}`,
                bucketId: bucket.id,
                familyName: familyName
              });
            });
          });
        return groups;
      case 'readType':
        return readTypes.map(r => ({ id: r.id, label: r.name }));
      case 'lookAlike':
        return lookAlikeSeries.map(s => ({ id: s.id, label: s.name }));
      case 'situation':
        const zones = fieldZones.map(z => ({ id: z.id || z.name, label: z.name, type: 'zone' }));
        const specials = specialSituations.map(s => ({ id: s.id || s.name, label: s.name, type: 'special' }));
        return [...zones, ...specials];
      default:
        return [];
    }
  }, [filterCategory, formations, playBuckets, readTypes, lookAlikeSeries, fieldZones, specialSituations, playBankPhase]);

  const filterOptions = getFilterOptions();

  // Check if a play matches the current filter
  const playMatchesFilter = useCallback((play) => {
    if (!filterCategory || !filterValue) return true;

    switch (filterCategory) {
      case 'formation':
        return play.formation === filterValue || play.formationId === filterValue;
      case 'bucket':
        return play.bucketId === filterValue;
      case 'conceptGroup':
        // filterValue is in format "bucketId_familyName"
        const parts = filterValue.split('_');
        const bucketId = parts[0];
        const familyName = parts.slice(1).join('_');
        return play.bucketId === bucketId && play.conceptFamily === familyName;
      case 'readType':
        return play.readType === filterValue;
      case 'lookAlike':
        const series = lookAlikeSeries.find(s => s.id === filterValue);
        return series && series.playIds?.includes(play.id);
      case 'situation':
        return play.fieldZones?.includes(filterValue) || play.situations?.includes(filterValue);
      default:
        return true;
    }
  }, [filterCategory, filterValue, lookAlikeSeries]);

  // Check if a play matches any of the highlight focuses (for Script mode)
  const playMatchesHighlightFocuses = useCallback((play) => {
    if (!highlightFocuses || highlightFocuses.length === 0) return false;

    for (const focus of highlightFocuses) {
      switch (focus.category) {
        case 'Formations':
          if (play.formation && play.formation.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.formationId && play.formationId === focus.id) return true;
          break;
        case 'Play Buckets':
          if (play.bucket && play.bucket.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.bucketId && play.bucketId === focus.id) return true;
          if (play.category && play.category.toLowerCase() === focus.name.toLowerCase()) return true;
          break;
        case 'Concept Groups':
          if (play.concept && play.concept.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.conceptId && play.conceptId === focus.id) return true;
          if (play.conceptGroup && play.conceptGroup.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.conceptFamily && play.conceptFamily.toLowerCase() === focus.name.toLowerCase()) return true;
          break;
        case 'Read Types':
          if (play.readType && play.readType.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.readTypeId && play.readTypeId === focus.id) return true;
          break;
        case 'Look-Alike Series':
          if (play.lookAlikeSeries && play.lookAlikeSeries.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.lookAlikeSeriesId && play.lookAlikeSeriesId === focus.id) return true;
          // Also check if play is in the look-alike series playIds
          const series = lookAlikeSeries.find(s => s.id === focus.id);
          if (series && series.playIds?.includes(play.id)) return true;
          break;
        case 'Situations':
          if (play.fieldZone && play.fieldZone.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.situation && play.situation.toLowerCase() === focus.name.toLowerCase()) return true;
          if (play.fieldZones?.some(fz => fz.toLowerCase() === focus.name.toLowerCase())) return true;
          if (play.situations?.some(s => s.toLowerCase() === focus.name.toLowerCase())) return true;
          break;
      }
    }
    return false;
  }, [highlightFocuses, lookAlikeSeries]);

  // Get current week
  const currentWeek = weeks.find(w => w.id === currentWeekId) || null;

  // Get rep targets and current reps for quota coloring
  const playRepTargets = currentWeek?.playRepTargets || {};
  const currentWeekReps = useMemo(() => {
    return getAllRepsForWeek(currentWeekId, weeks);
  }, [currentWeekId, weeks]);

  // Get quota status for a play: 'met' | 'partial' | 'none' | null
  const getQuotaStatus = useCallback((playId) => {
    const target = playRepTargets[playId];
    if (!target || target <= 0) return null; // No quota set
    const reps = currentWeekReps[playId] || 0;
    if (reps >= target) return 'met';
    if (reps > 0) return 'partial';
    return 'none';
  }, [playRepTargets, currentWeekReps]);

  // Get wristband card color for a play based on its slot and type
  const getWristbandCardColor = useCallback((play) => {
    if (!play?.wristbandSlot) return null;
    const wristbandSettings = currentWeek?.wristbandSettings || {};

    // Determine which card this play belongs to based on slot range and type
    const slot = play.wristbandSlot;
    const type = play.wristbandType;

    // Card ranges: 100s = card100, 200s = card200, etc.
    // WIZ cards: 100-199 wiz = cardWiz1, 200-299 wiz = cardWiz2
    let cardId = null;
    if (type === 'wiz') {
      if (slot >= 100 && slot < 200) cardId = 'cardWiz1';
      else if (slot >= 200 && slot < 300) cardId = 'cardWiz2';
    } else {
      if (slot >= 100 && slot < 200) cardId = 'card100';
      else if (slot >= 200 && slot < 300) cardId = 'card200';
      else if (slot >= 300 && slot < 400) cardId = 'card300';
      else if (slot >= 400 && slot < 500) cardId = 'card400';
    }

    if (!cardId) return null;
    return wristbandSettings[cardId]?.color || null;
  }, [currentWeek?.wristbandSettings]);

  // Determine if text should be light or dark based on background color
  const getContrastTextColor = useCallback((bgColor) => {
    if (!bgColor) return 'white';
    // Convert color name to hex or parse hex
    const colorMap = {
      white: '#ffffff', black: '#000000', red: '#dc2626', orange: '#f97316',
      yellow: '#facc15', green: '#22c55e', blue: '#3b82f6', purple: '#8b5cf6',
      pink: '#ec4899', gray: '#6b7280', slate: '#64748b', emerald: '#10b981',
      cyan: '#06b6d4', amber: '#f59e0b', lime: '#84cc16', rose: '#f43f5e'
    };
    const hex = colorMap[bgColor?.toLowerCase()] || bgColor;

    // Parse hex to RGB
    let r, g, b;
    if (hex.startsWith('#')) {
      const cleanHex = hex.slice(1);
      if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
      } else {
        r = parseInt(cleanHex.slice(0, 2), 16);
        g = parseInt(cleanHex.slice(2, 4), 16);
        b = parseInt(cleanHex.slice(4, 6), 16);
      }
    } else {
      return 'white'; // Default to white text if can't parse
    }

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1e293b' : 'white';
  }, []);

  // Determine current page context for batch add
  const currentPageContext = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/practice-scripts') || path.includes('/practice')) {
      return 'practice-scripts';
    } else if (path.includes('/gameplan') || path.includes('/game-plan')) {
      return 'gameplan';
    } else if (path.includes('/wristband')) {
      return 'wristband';
    }
    return 'other';
  }, [location.pathname]);

  // Get spreadsheet boxes for context-aware batch add (replaces CALL_SHEET)
  const callSheetBoxes = useMemo(() => {
    return getSpreadsheetBoxes(currentWeek?.gamePlanLayouts);
  }, [currentWeek?.gamePlanLayouts]);

  // Get practice segments for context-aware batch add
  const practiceSegments = useMemo(() => {
    const practicePlans = currentWeek?.practicePlans || {};
    const segments = [];
    Object.entries(practicePlans).forEach(([day, dayPlan]) => {
      (dayPlan?.segments || []).forEach((segment, idx) => {
        if (segment.scriptId || segment.type === 'team' || segment.type === 'indy') {
          segments.push({
            day,
            segmentIdx: idx,
            name: segment.name || segment.type,
            scriptId: segment.scriptId,
            phase: segment.phase
          });
        }
      });
    });
    return segments;
  }, [currentWeek?.practicePlans]);

  // Get game plan boxes with their plays for the Game Plan tab (uses SPREADSHEET)
  const gamePlanBoxesWithPlays = useMemo(() => {
    const spreadsheetBoxes = getSpreadsheetBoxes(currentWeek?.gamePlanLayouts);
    const gamePlan = currentWeek?.offensiveGamePlan || { sets: [] };
    const sets = gamePlan.sets || [];

    if (spreadsheetBoxes.length === 0) return [];

    const boxes = [];
    spreadsheetBoxes.forEach((box) => {
      // Find the matching set for this box
      const set = sets.find(s => s.id === box.setId);
      const playIds = set?.playIds || [];
      const assignedPlayIds = set?.assignedPlayIds || [];

      // Get play objects for quicklist and assigned
      const quicklistPlays = playIds
        .filter(id => id) // Filter out nulls
        .map(id => playsArray.find(p => p.id === id))
        .filter(p => p && !p.archived);

      const assignedPlays = assignedPlayIds
        .map(id => playsArray.find(p => p.id === id))
        .filter(p => p && !p.archived);

      // Only add box if it has plays
      if (quicklistPlays.length > 0 || assignedPlays.length > 0) {
        boxes.push({
          header: box.name,
          setId: box.setId,
          headerId: box.headerId,
          color: box.color || '#3b82f6',
          categoryType: box.categoryType,
          isMatrix: box.isMatrix,
          quicklistPlays,
          assignedPlays,
          totalPlays: quicklistPlays.length + assignedPlays.length
        });
      }
    });

    return boxes;
  }, [currentWeek?.gamePlanLayouts, currentWeek?.offensiveGamePlan, playsArray]);

  // State for expanded game plan boxes
  const [expandedGamePlanBoxes, setExpandedGamePlanBoxes] = useState(new Set());

  const toggleGamePlanBox = useCallback((setId) => {
    setExpandedGamePlanBoxes(prev => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  }, []);

  // Handle drag start for plays
  const handleDragStart = useCallback((e, play) => {
    e.dataTransfer.setData('application/react-dnd', JSON.stringify({ playId: play.id, name: play.name }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Flat list of installed plays (no collapsibles) - sorted by bucket then name
  const flatInstallPlays = useMemo(() => {
    const installList = currentWeek?.installList || [];
    if (installList.length === 0) return [];

    const query = searchTerm.toLowerCase();
    return (playsArray || [])
      .filter(p =>
        !p.archived &&
        installList.includes(p.id) &&
        (p.phase || 'OFFENSE') === playBankPhase &&
        playMatchesFilter(p) &&
        (!searchTerm ||
          p.name?.toLowerCase().includes(query) ||
          p.formation?.toLowerCase().includes(query) ||
          p.concept?.toLowerCase().includes(query))
      )
      .sort((a, b) => {
        // Sort by bucket label, then by name
        const bucketA = playBuckets.find(bk => bk.id === a.bucketId)?.label || 'zzz';
        const bucketB = playBuckets.find(bk => bk.id === b.bucketId)?.label || 'zzz';
        if (bucketA !== bucketB) return bucketA.localeCompare(bucketB);
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [playsArray, playBuckets, currentWeek, searchTerm, playBankPhase, playMatchesFilter]);

  // Flat list of all plays (no collapsibles) - sorted by bucket then name
  const flatAllPlays = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return (playsArray || [])
      .filter(p =>
        !p.archived &&
        (p.phase || 'OFFENSE') === playBankPhase &&
        playMatchesFilter(p) &&
        (!searchTerm ||
          p.name?.toLowerCase().includes(query) ||
          p.formation?.toLowerCase().includes(query) ||
          p.concept?.toLowerCase().includes(query))
      )
      .sort((a, b) => {
        // Sort by bucket label, then by name
        const bucketA = playBuckets.find(bk => bk.id === a.bucketId)?.label || 'zzz';
        const bucketB = playBuckets.find(bk => bk.id === b.bucketId)?.label || 'zzz';
        if (bucketA !== bucketB) return bucketA.localeCompare(bucketB);
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [playsArray, playBuckets, searchTerm, playBankPhase, playMatchesFilter]);

  // Week stats
  const weekStats = useMemo(() => {
    const installList = currentWeek?.installList || [];
    const newInstallIds = currentWeek?.newInstallIds || [];
    return {
      uniquePlaysCount: installList.length,
      newPlaysCount: newInstallIds.length,
      totalScriptSlots: 0 // TODO: calculate from scripts
    };
  }, [currentWeek]);

  // Calculate practice script usage per play per day
  const scriptUsageByPlay = useMemo(() => {
    const usage = {}; // { playId: { M: count, T: count, W: count, TH: count, F: count, TOT: count } }
    const practicePlans = currentWeek?.practicePlans || {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayAbbrev = { Monday: 'M', Tuesday: 'T', Wednesday: 'W', Thursday: 'TH', Friday: 'F' };

    days.forEach(day => {
      const plan = practicePlans[day];
      if (!plan?.segments) return;

      plan.segments.forEach(segment => {
        if (!segment.script) return;
        segment.script.forEach(row => {
          if (row.playId) {
            if (!usage[row.playId]) {
              usage[row.playId] = { M: 0, T: 0, W: 0, TH: 0, F: 0, TOT: 0 };
            }
            usage[row.playId][dayAbbrev[day]]++;
            usage[row.playId].TOT++;
          }
        });
      });
    });

    return usage;
  }, [currentWeek]);

  // Calculate reps per box from script usage
  const boxReps = useMemo(() => {
    const reps = {};
    gamePlanBoxesWithPlays.forEach(box => {
      let totalReps = 0;
      // Sum reps from quicklist plays
      box.quicklistPlays.forEach(play => {
        const usage = scriptUsageByPlay[play.id];
        if (usage?.TOT) totalReps += usage.TOT;
      });
      // Sum reps from assigned plays
      box.assignedPlays.forEach(play => {
        const usage = scriptUsageByPlay[play.id];
        if (usage?.TOT) totalReps += usage.TOT;
      });
      reps[box.setId] = totalReps;
    });
    return reps;
  }, [gamePlanBoxesWithPlays, scriptUsageByPlay]);

  // Get play call chain syntax for current phase
  const currentSyntax = setupConfig?.syntax?.[playBankPhase] || [];
  const currentTermLibrary = setupConfig?.termLibrary?.[playBankPhase] || {};

  // Parse input using play call chain syntax
  const parseWithSyntax = useCallback((input) => {
    if (!currentSyntax.length) return null;

    const words = input.trim().toUpperCase().split(/\s+/);
    const syntaxValues = {};
    let wordIndex = 0;

    // Try to match each syntax component in order
    for (const component of currentSyntax) {
      if (wordIndex >= words.length) break;

      const terms = currentTermLibrary[component.id] || [];
      const termLabels = terms.map(t => t.label?.toUpperCase());
      const termAbbrevs = terms.map(t => t.abbrev?.toUpperCase()).filter(Boolean);

      // Check for multi-word matches first (e.g., "TRIPS RIGHT")
      let matched = false;
      for (let len = Math.min(3, words.length - wordIndex); len > 0; len--) {
        const phrase = words.slice(wordIndex, wordIndex + len).join(' ');
        if (termLabels.includes(phrase) || termAbbrevs.includes(phrase)) {
          syntaxValues[component.id] = phrase;
          wordIndex += len;
          matched = true;
          break;
        }
      }

      // If no exact term match, take single word for this component
      if (!matched && wordIndex < words.length) {
        syntaxValues[component.id] = words[wordIndex];
        wordIndex++;
      }
    }

    // Any remaining words get appended to the last component
    if (wordIndex < words.length && currentSyntax.length > 0) {
      const lastCompId = currentSyntax[currentSyntax.length - 1].id;
      const remaining = words.slice(wordIndex).join(' ');
      syntaxValues[lastCompId] = syntaxValues[lastCompId]
        ? `${syntaxValues[lastCompId]} ${remaining}`
        : remaining;
    }

    // Find formation component
    const formationComp = currentSyntax.find(c => c.label?.toLowerCase().includes('formation'));
    const formation = formationComp ? syntaxValues[formationComp.id] || '' : '';

    // Build the play name - EXCLUDE formation from name since it's stored separately
    const nameParts = currentSyntax.map(comp => {
      // Skip formation component since it's stored separately
      if (formationComp && comp.id === formationComp.id) return '';
      const value = syntaxValues[comp.id];
      if (!value) return '';
      return `${comp.prefix || ''}${value}${comp.suffix || ''}`;
    }).filter(Boolean);

    return {
      name: nameParts.join(' '),
      formation,
      syntaxValues
    };
  }, [currentSyntax, currentTermLibrary]);

  // Quick add play handler
  const handleQuickAdd = useCallback(async () => {
    if (!quickAddValue.trim()) return;

    let name = quickAddValue.trim().toUpperCase();
    let formation = '';
    let syntaxValues = {};

    // Try to parse with syntax if available
    const parsed = parseWithSyntax(quickAddValue);
    if (parsed && parsed.name) {
      name = parsed.name;
      formation = parsed.formation;
      syntaxValues = parsed.syntaxValues;
    } else {
      // Fallback: simple "FORMATION PLAY_NAME" parsing
      const parts = quickAddValue.trim().split(/\s+/);
      if (parts.length > 1 && parts[0].length <= 12) {
        formation = parts[0].toUpperCase();
        name = parts.slice(1).join(' ').toUpperCase();
      }
    }

    // Check for duplicate play (same name + formation + phase)
    const isDuplicate = (playsArray || []).some(p =>
      !p.archived &&
      (p.phase || 'OFFENSE') === playBankPhase &&
      p.name?.toUpperCase() === name &&
      (p.formation || '').toUpperCase() === formation
    );

    if (isDuplicate) {
      console.warn('Play already exists:', formation, name);
      return; // Don't create duplicate
    }

    // Auto-create formation if it doesn't exist in the library
    if (formation && playBankPhase === 'OFFENSE') {
      const existingFormations = setupConfig?.formations || [];
      const formationExists = existingFormations.some(
        f => f.name.toUpperCase() === formation.toUpperCase() && f.phase === 'OFFENSE'
      );

      if (!formationExists) {
        // Create new formation entry without diagram (positions: null)
        const newFormation = {
          id: `form_${Date.now()}`,
          name: formation,
          personnel: '',
          families: [],
          positions: null, // Will be set when diagram is created in Setup
          phase: 'OFFENSE',
          createdAt: new Date().toISOString(),
          source: 'quick-add' // Mark as auto-created
        };

        // Add to formations list
        await updateSetupConfig({
          formations: [...existingFormations, newFormation]
        });
      }
    }

    // Create the new play
    const playData = {
      name,
      formation,
      phase: playBankPhase,
      syntaxValues, // Store parsed syntax values for future editing
      archived: false
    };

    const playId = await addPlay(playData);

    // Add to install list if we have a current week
    if (currentWeek && playId) {
      const installList = currentWeek.installList || [];
      const newInstallIds = currentWeek.newInstallIds || [];
      await updateWeek(currentWeekId, {
        installList: [...installList, playId],
        newInstallIds: [...newInstallIds, playId]
      });
    }

    // Clear the input
    setQuickAddValue('');
  }, [quickAddValue, playBankPhase, addPlay, currentWeek, currentWeekId, updateWeek, parseWithSyntax, setupConfig, updateSetupConfig, playsArray]);

  // Toggle play selection for batch mode
  const togglePlaySelection = useCallback((playId) => {
    setSelectedPlayIds(prev => {
      const next = new Set(prev);
      if (next.has(playId)) {
        next.delete(playId);
      } else {
        next.add(playId);
      }
      return next;
    });
  }, []);

  // Handle batch select submit
  const handleBatchSubmit = useCallback(() => {
    if (onBatchSelect && selectedPlayIds.size > 0) {
      onBatchSelect(Array.from(selectedPlayIds));
      setSelectedPlayIds(new Set());
    }
  }, [onBatchSelect, selectedPlayIds]);

  // Handle cancel batch select
  const handleCancelBatch = useCallback(() => {
    setSelectedPlayIds(new Set());
    setInternalBatchMode(false);
    if (onCancelBatchSelect) {
      onCancelBatchSelect();
    }
  }, [onCancelBatchSelect]);

  // Start internal batch mode for adding to install
  const startBatchAddToInstall = useCallback(() => {
    setInternalBatchMode(true);
    setSelectedPlayIds(new Set());
  }, []);

  // Handle batch add - directly enter targeting mode
  const handleBatchAddToInstall = useCallback(async () => {
    if (selectedPlayIds.size === 0) return;
    const playIds = Array.from(selectedPlayIds);
    if (startTargetingMode) {
      startTargetingMode(playIds);
      setSelectedPlayIds(new Set());
      setInternalBatchMode(false);
    }
  }, [selectedPlayIds, startTargetingMode]);

  // Add plays to install list
  const addToInstall = useCallback(async (playIds) => {
    if (!currentWeek || playIds.length === 0) return;

    const installList = currentWeek.installList || [];
    const newInstallIds = currentWeek.newInstallIds || [];

    // Filter out plays that are already installed
    const newPlayIds = playIds.filter(id => !installList.includes(id));

    if (newPlayIds.length > 0) {
      await updateWeek(currentWeekId, {
        installList: [...installList, ...newPlayIds],
        newInstallIds: [...newInstallIds, ...newPlayIds]
      });
    }

    setSelectedPlayIds(new Set());
    setInternalBatchMode(false);
  }, [currentWeek, currentWeekId, updateWeek]);

  // Check if in any batch mode (external or internal)
  const isInBatchMode = batchSelectMode || internalBatchMode;

  // Render a single play row
  const renderPlayRow = useCallback((play) => {
    // Build play call with formation first
    const playCall = play.formation
      ? `${play.formation} ${play.name}`
      : play.name;

    // Get wristband slot for badge display
    const wristbandSlot = getWristbandDisplay(play);
    const wristbandCardColor = getWristbandCardColor(play);
    const wristbandTextColor = wristbandCardColor ? getContrastTextColor(wristbandCardColor) : 'white';

    const isBatchSelected = selectedPlayIds.has(play.id);
    const isSingleSelected = singleSelectMode && contextSelectedPlayId === play.id;
    const isHighlighted = playMatchesHighlightFocuses(play);
    const usage = scriptUsageByPlay[play.id];
    const quotaStatus = getQuotaStatus(play.id);

    // Determine click behavior
    const handleClick = () => {
      if (isInBatchMode) {
        togglePlaySelection(play.id);
      } else if (singleSelectMode) {
        selectPlayForAssign(play.id);
      }
    };

    // Determine if clickable (batch or single select mode)
    const isClickable = isInBatchMode || singleSelectMode;

    // Quota status colors (only apply if not selected/highlighted)
    const quotaColor = (!isBatchSelected && !isSingleSelected && !isHighlighted && quotaStatus)
      ? quotaStatus === 'met' ? 'bg-emerald-50'
        : quotaStatus === 'partial' ? 'bg-amber-50'
        : quotaStatus === 'none' ? 'bg-red-50'
        : ''
      : '';

    return (
      <div
        key={play.id}
        className={`group flex items-center py-0.5 border-b text-xs hover:bg-slate-50 ${isClickable ? 'cursor-pointer' : 'cursor-grab'
          } ${isBatchSelected ? 'bg-sky-50 border-sky-200' : ''} ${isSingleSelected ? 'bg-emerald-50 border-emerald-300 border-2' : ''} ${isHighlighted && !isBatchSelected && !isSingleSelected ? 'bg-amber-50 border-l-4 border-l-amber-400 border-b-slate-100' : `border-slate-100 ${quotaColor}`}`}
        draggable={!isClickable}
        onDragStart={(e) => !isClickable && handleDragStart(e, play)}
        onClick={handleClick}
        onDoubleClick={() => openPlayDetails(play.id)}
        title={isInBatchMode ? 'Click to select, double-click for details' : (singleSelectMode ? 'Click to select, double-click for details' : (isHighlighted ? 'Matches segment focus - Double-click to view details' : 'Double-click to view details'))}
      >
        {/* Left section: checkbox/pointer, play name, badges */}
        <div className="flex items-center flex-1 min-w-0 pl-2">
          {/* Checkbox for batch mode */}
          {isInBatchMode && (
            <div className="mr-2 flex-shrink-0">
              {isBatchSelected ? (
                <CheckSquare size={16} className="text-sky-500" />
              ) : (
                <Square size={16} className="text-slate-400" />
              )}
            </div>
          )}
          {/* Pointer icon for single select mode */}
          {singleSelectMode && !isInBatchMode && (
            <div className="mr-2 flex-shrink-0">
              {isSingleSelected ? (
                <MousePointer size={14} className="text-emerald-500" />
              ) : (
                <div className="w-[14px]" />
              )}
            </div>
          )}
          <div className={`flex-1 min-w-0 font-medium truncate ${isBatchSelected ? 'text-sky-700' : (isSingleSelected ? 'text-emerald-700' : 'text-slate-800')}`}>
            {playCall}
          </div>
          {/* Wristband coordinate badge */}
          {wristbandSlot && (
            <span
              className="flex-shrink-0 ml-1 px-1 py-0 text-[9px] font-bold rounded"
              style={{
                backgroundColor: wristbandCardColor || '#e11d48',
                color: wristbandTextColor
              }}
              title="Wristband coordinate"
            >
              {wristbandSlot}
            </span>
          )}
          {play.priority && (
            <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0 ml-1" />
          )}
          {/* Quick Add Button - only show on hover when not in batch/single mode */}
          {!isInBatchMode && !singleSelectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerQuickAdd(play.id);
              }}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-sky-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1"
              title="Add to active target"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        {/* Right section: Script usage counters - fixed width, always aligned */}
        <div className="flex items-center text-[8px] font-mono flex-shrink-0 border-l border-slate-200" title="Practice script usage: M T W TH F | Total">
          <span className={`w-4 text-center py-0.5 border-r border-slate-200 ${usage?.M ? 'text-slate-700 font-semibold' : 'text-slate-300'}`}>{usage?.M || '-'}</span>
          <span className={`w-4 text-center py-0.5 border-r border-slate-200 ${usage?.T ? 'text-slate-700 font-semibold' : 'text-slate-300'}`}>{usage?.T || '-'}</span>
          <span className={`w-4 text-center py-0.5 border-r border-slate-200 ${usage?.W ? 'text-slate-700 font-semibold' : 'text-slate-300'}`}>{usage?.W || '-'}</span>
          <span className={`w-5 text-center py-0.5 border-r border-slate-200 ${usage?.TH ? 'text-slate-700 font-semibold' : 'text-slate-300'}`}>{usage?.TH || '-'}</span>
          <span className={`w-4 text-center py-0.5 border-r border-slate-200 ${usage?.F ? 'text-slate-700 font-semibold' : 'text-slate-300'}`}>{usage?.F || '-'}</span>
          <span className={`w-6 text-center py-0.5 font-bold ${usage?.TOT ? 'text-sky-600' : 'text-slate-300'}`}>{usage?.TOT || '-'}</span>
        </div>
      </div>
    );
  }, [handleDragStart, openPlayDetails, isInBatchMode, selectedPlayIds, togglePlaySelection, singleSelectMode, contextSelectedPlayId, selectPlayForAssign, triggerQuickAdd, playMatchesHighlightFocuses, scriptUsageByPlay, getQuotaStatus, getWristbandCardColor, getContrastTextColor]);

  return (
    <div
      className="fixed right-0 top-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out print:hidden"
      style={{
        zIndex: 2005,
        width: isOpen ? '480px' : '40px',
        borderLeft: '1px solid #334155',
        background: isOpen ? '#ffffff' : '#1e293b'
      }}
    >
      {/* Collapsed State */}
      {!isOpen && (
        <div
          onClick={() => onToggle(true)}
          className="w-10 h-full flex flex-col items-center pt-2 gap-3 cursor-pointer hover:bg-slate-700"
          title="Expand Play Bank"
        >
          <ChevronLeft size={20} className="text-slate-400" />
          <span
            className="text-xs font-semibold text-slate-500 uppercase tracking-widest"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)'
            }}
          >
            Play Bank
          </span>
        </div>
      )}

      {/* Expanded Content */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: '480px', display: isOpen ? 'flex' : 'none' }}
      >
        {/* Targeting Mode Banner - Sticky */}
        {targetingMode && targetingPlays.length > 0 && (
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MousePointer size={18} className="animate-pulse" />
              <span className="font-medium">{targetingPlays.length} plays ready</span>
              <span className="text-violet-200 text-sm">Click a target to place</span>
            </div>
            <button
              onClick={cancelTargetingMode}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              title="Cancel"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Plays/Headers Toggle at TOP when headersMode enabled - Sticky */}
        {headersMode && (
          <div className="flex border-b border-slate-600 flex-shrink-0">
            <div
              onClick={() => setActiveTab('install')}
              className={`flex-1 text-center py-2.5 px-1 text-xs font-semibold cursor-pointer transition-colors ${activeTab === 'install'
                ? 'text-white bg-slate-700 border-b-2 border-white'
                : 'text-slate-400 bg-slate-800 border-b-2 border-transparent hover:bg-slate-700'
                }`}
            >
              Plays
            </div>
            <div
              onClick={() => setActiveTab('headers')}
              className={`flex-1 text-center py-2.5 px-1 text-xs font-semibold cursor-pointer transition-colors ${activeTab === 'headers'
                ? 'text-blue-400 bg-slate-700 border-b-2 border-blue-400'
                : 'text-slate-400 bg-slate-800 border-b-2 border-transparent hover:bg-slate-700'
                }`}
            >
              <LayoutTemplate size={14} className="inline mr-1" />
              Headers
            </div>
          </div>
        )}

        {/* Header - Sticky */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-800 border-b border-slate-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Landmark size={20} className="text-slate-300" />
            <label htmlFor="playbank-phase-select" className="text-sm font-extrabold text-white tracking-wide">PLAY BANK</label>
            <select
              id="playbank-phase-select"
              value={playBankPhase}
              onChange={(e) => setPlayBankPhase(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-white text-xs font-semibold cursor-pointer"
            >
              <option value="OFFENSE">Offense</option>
              <option value="DEFENSE">Defense</option>
              <option value="SPECIAL_TEAMS">Special Teams</option>
            </select>
          </div>
          <button
            onClick={() => onToggle(false)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 transition-colors"
            title="Collapse Play Bank"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Batch Select Mode Banner - Sticky */}
        {isInBatchMode && (
          <div className={`px-3 py-2 ${internalBatchMode ? 'bg-emerald-500' : 'bg-sky-500'} text-white flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} />
                <span className="text-sm font-semibold">
                  {internalBatchMode ? 'Select Priority Plays' : 'Select Plays'}
                </span>
              </div>
              <button
                onClick={handleCancelBatch}
                className="text-xs font-medium underline hover:no-underline"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs opacity-80 mt-1">
              {internalBatchMode
                ? 'Click plays to select them, then click "Add" below'
                : `Click plays to select them, then click "${batchSelectLabel}" below`
              }
            </p>
          </div>
        )}

        {/* Single Select Mode Banner (for wristband assignment) - Sticky */}
        {singleSelectMode && !isInBatchMode && (
          <div className="px-3 py-2 bg-emerald-500 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MousePointer size={16} />
                <span className="text-sm font-semibold">
                  {contextSelectedPlayId ? 'Play Selected' : 'Click a Play'}
                </span>
              </div>
              <button
                onClick={clearSelectedPlay}
                className="text-xs font-medium underline hover:no-underline"
              >
                Clear
              </button>
            </div>
            <p className="text-xs opacity-80 mt-1">
              {contextSelectedPlayId
                ? 'Now click an empty wristband slot to assign'
                : 'Click a play, then click an empty wristband slot'
              }
            </p>
          </div>
        )}

        {/* Week Header - Sticky */}
        {currentWeek && (
          <div className="flex items-center justify-center py-2.5 px-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <div className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              {currentWeek.name || `Week ${currentWeek.weekNumber || ''}`}
              {currentWeek.opponent && <span className="text-slate-500 ml-2">vs. {currentWeek.opponent}</span>}
            </div>
          </div>
        )}

        {/* Tabs - show Install/Game Plan/Full Playbook when on Plays side (not when on Headers tab) - Sticky */}
        {activeTab !== 'headers' && (
          <div className="flex border-b border-slate-200 flex-shrink-0">
            {[
              { key: 'install', label: 'Priority Plays' },
              { key: 'gameplan', label: 'Game Plan' },
              { key: 'usage', label: 'Full Playbook' }
            ].map(tab => (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 text-center py-2 px-1 text-xs font-semibold cursor-pointer transition-colors ${activeTab === tab.key
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
                  : 'text-slate-500 border-b-2 border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
              >
                {tab.label}
              </div>
            ))}
          </div>
        )}

        {/* Combined Search + Quick Add - Sticky */}
        <div className="p-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <label htmlFor="playbank-search" className="sr-only">Search or add play</label>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="playbank-search"
                placeholder="Search or add new play..."
                value={searchTerm}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setSearchTerm(val);
                  setQuickAddValue(val);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    // If exact match exists, don't add duplicate
                    const exactMatch = (playsArray || []).find(p =>
                      !p.archived &&
                      (p.phase || 'OFFENSE') === playBankPhase &&
                      (p.name?.toUpperCase() === searchTerm.trim() ||
                       `${p.formation || ''} ${p.name || ''}`.trim().toUpperCase() === searchTerm.trim())
                    );
                    if (!exactMatch) {
                      handleQuickAdd();
                      setSearchTerm('');
                    }
                  }
                }}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400"
              />
            </div>
            {searchTerm.trim() && (
              <button
                onClick={() => {
                  handleQuickAdd();
                  setSearchTerm('');
                }}
                className="px-2.5 py-1.5 bg-emerald-500 text-white rounded text-sm font-semibold hover:bg-emerald-600 flex items-center gap-1"
                title="Add as new play"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          {searchTerm.trim() && (
            <p className="text-[10px] text-slate-400 mt-1">
              Press Enter or click + to add "{searchTerm}" as new play
              {currentWeek ? ' (auto-installs)' : ''}
            </p>
          )}
        </div>

        {/* Filter Dropdowns - Sticky */}
        <div className="p-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div className="flex gap-2">
            <select
              id="playbank-filter-category"
              aria-label="Filter category"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterValue('');
              }}
              className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="">Filter by...</option>
              <option value="formation">Formation</option>
              <option value="bucket">Bucket</option>
              <option value="conceptGroup">Concept Group</option>
              <option value="readType">Read Type</option>
              <option value="lookAlike">Look-Alike Series</option>
              <option value="situation">Situation</option>
            </select>
            <select
              id="playbank-filter-value"
              aria-label="Filter value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={!filterCategory}
              className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {filterCategory ? 'Select...' : 'Select category first'}
              </option>
              {filterOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          {(filterCategory || filterValue) && (
            <button
              onClick={() => {
                setFilterCategory('');
                setFilterValue('');
              }}
              className="mt-1.5 text-[10px] text-sky-500 hover:text-sky-600 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Headers Tab Content */}
          {activeTab === 'headers' && headersMode && (
            <div className="bg-slate-800 h-full flex flex-col">
              {/* Position Controls - Sticky */}
              {assignHeaderConfig && setAssignHeaderConfig && (
                <div className="px-4 py-3 border-b border-slate-700 flex-shrink-0 sticky top-0 bg-slate-800 z-10">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-400">R:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={assignHeaderConfig.rowStart || 1}
                        onChange={(e) => setAssignHeaderConfig(prev => ({ ...prev, rowStart: parseInt(e.target.value) || 1 }))}
                        className="w-12 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-400">C:</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={assignHeaderConfig.colStart || 1}
                        onChange={(e) => setAssignHeaderConfig(prev => ({ ...prev, colStart: parseInt(e.target.value) || 1 }))}
                        className="w-12 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-400">Span:</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={assignHeaderConfig.colSpan || 2}
                        onChange={(e) => setAssignHeaderConfig(prev => ({ ...prev, colSpan: parseInt(e.target.value) || 2 }))}
                        className="w-12 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Header Templates - Scrollable */}
              <div className="p-3 space-y-4 overflow-y-auto flex-1">
                {headerTemplates.map(template => {
                  const IconComponent = template.icon || LayoutTemplate;
                  return (
                    <div key={template.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <IconComponent size={12} style={{ color: template.color }} />
                        <span>{template.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {template.items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (setPendingHeaderConfig) {
                                setPendingHeaderConfig({
                                  item,
                                  categoryType: template.id,
                                  isScript: template.isScript,
                                  isMatrix: template.isMatrix,
                                  colSpan: assignHeaderConfig?.colSpan || (template.isMatrix ? 4 : 2),
                                  rowCount: template.isMatrix ? null : 10
                                });
                              }
                            }}
                            className="px-2 py-1 rounded text-xs font-medium transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                            style={{
                              backgroundColor: item.color || template.color,
                              color: 'white'
                            }}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {headerTemplates.length === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <LayoutTemplate size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No categories defined.</p>
                    <p className="text-xs mt-1">Set up in Offense Setup.</p>
                  </div>
                )}

                {/* Add custom header link */}
                <button
                  onClick={() => {
                    if (setPendingHeaderConfig) {
                      setPendingHeaderConfig({
                        item: { id: `custom_${Date.now()}`, name: 'Custom', color: '#64748b' },
                        categoryType: 'custom',
                        isScript: false,
                        colSpan: assignHeaderConfig?.colSpan || 2,
                        rowCount: 10,
                        isCustom: true
                      });
                    }
                  }}
                  className="w-full text-left text-xs text-blue-400 hover:text-blue-300 py-2"
                >
                  + Add custom header
                </button>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <>
              {/* Batch Add Buttons */}
              {currentWeek && !isInBatchMode && (
                <div className="flex border-b border-emerald-200">
                  <button
                    onClick={startBatchAddToInstall}
                    className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 border-r border-emerald-200"
                  >
                    <CheckSquare size={14} />
                    Batch Add
                  </button>
                  <button
                    onClick={() => {
                      // Add all visible plays - directly enter targeting mode
                      const allPlayIds = flatAllPlays.map(p => p.id);
                      if (allPlayIds.length > 0 && startTargetingMode) {
                        startTargetingMode(allPlayIds);
                        setSelectedPlayIds(new Set());
                        setInternalBatchMode(false);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-sky-50 text-sky-700 text-sm font-medium hover:bg-sky-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Add All ({flatAllPlays.length})
                  </button>
                </div>
              )}
              {/* Usage header with day columns */}
              <div className="sticky top-0 bg-white border-b border-slate-200 flex items-center">
                <span className="flex-1 text-xs font-bold text-slate-600 uppercase pl-2 py-0.5">
                  Full Playbook ({flatAllPlays.length})
                </span>
                <div className="flex items-center text-[7px] font-bold text-slate-500 uppercase border-l border-slate-200">
                  <span className="w-4 text-center py-1 border-r border-slate-200">M</span>
                  <span className="w-4 text-center py-1 border-r border-slate-200">T</span>
                  <span className="w-4 text-center py-1 border-r border-slate-200">W</span>
                  <span className="w-5 text-center py-1 border-r border-slate-200">TH</span>
                  <span className="w-4 text-center py-1 border-r border-slate-200">F</span>
                  <span className="w-6 text-center py-1 font-extrabold text-slate-600">TOT</span>
                </div>
              </div>
              {flatAllPlays.length > 0 ? (
                <div>
                  {flatAllPlays.map(renderPlayRow)}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {searchTerm ? `No plays found matching "${searchTerm}"` : 'No plays in playbook'}
                </div>
              )}
            </>
          )}

          {activeTab === 'gameplan' && (
            <>
              {gamePlanBoxesWithPlays.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {gamePlanBoxesWithPlays.map((box) => {
                    const isExpanded = expandedGamePlanBoxes.has(box.setId);
                    return (
                      <div key={box.setId}>
                        {/* Box Header */}
                        <button
                          onClick={() => toggleGamePlanBox(box.setId)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: box.color }}
                          />
                          <span className="flex-1 text-left text-sm font-medium text-slate-800 truncate">
                            {box.header}
                          </span>
                          <span className="text-xs flex-shrink-0 flex items-center gap-2">
                            <span className={`font-semibold ${boxReps[box.setId] > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {boxReps[box.setId] || 0} reps
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-500">{box.totalPlays} plays</span>
                          </span>
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                          )}
                        </button>

                        {/* Box Plays */}
                        {isExpanded && (
                          <div className="bg-slate-50/50">
                            {/* Quicklist plays */}
                            {box.quicklistPlays.length > 0 && (
                              <div>
                                <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase bg-slate-100">
                                  Quick List ({box.quicklistPlays.length})
                                </div>
                                {box.quicklistPlays.map(play => renderPlayRow(play))}
                              </div>
                            )}
                            {/* Assigned plays */}
                            {box.assignedPlays.length > 0 && (
                              <div>
                                <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase bg-slate-100">
                                  Assigned ({box.assignedPlays.length})
                                </div>
                                {box.assignedPlays.map(play => renderPlayRow(play))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <p>No plays in game plan yet</p>
                  <p className="text-xs mt-1">Add plays to call sheet boxes first</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'install' && (
            <>
              {/* Batch Add Buttons for Install Tab */}
              {currentWeek && !isInBatchMode && flatInstallPlays.length > 0 && (
                <div className="flex border-b border-sky-200">
                  <button
                    onClick={startBatchAddToInstall}
                    className="flex-1 px-3 py-2 bg-sky-50 text-sky-700 text-sm font-medium hover:bg-sky-100 transition-colors flex items-center justify-center gap-2 border-r border-sky-200"
                  >
                    <CheckSquare size={14} />
                    Batch Add
                  </button>
                  <button
                    onClick={() => {
                      // Add all install plays - directly enter targeting mode
                      const allPlayIds = flatInstallPlays.map(p => p.id);
                      if (allPlayIds.length > 0 && startTargetingMode) {
                        startTargetingMode(allPlayIds);
                        setSelectedPlayIds(new Set());
                        setInternalBatchMode(false);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Add All ({flatInstallPlays.length})
                  </button>
                </div>
              )}
              {/* Priority Plays header with day columns */}
              <div className="sticky top-0 bg-emerald-500 flex items-center">
                <span className="flex-1 text-xs font-bold text-white uppercase pl-2 py-1">
                  Priority Plays ({flatInstallPlays.length})
                </span>
                <div className="flex items-center text-[7px] font-bold text-emerald-100 uppercase border-l border-emerald-400">
                  <span className="w-4 text-center py-1 border-r border-emerald-400">M</span>
                  <span className="w-4 text-center py-1 border-r border-emerald-400">T</span>
                  <span className="w-4 text-center py-1 border-r border-emerald-400">W</span>
                  <span className="w-5 text-center py-1 border-r border-emerald-400">TH</span>
                  <span className="w-4 text-center py-1 border-r border-emerald-400">F</span>
                  <span className="w-6 text-center py-1 font-extrabold text-white">TOT</span>
                </div>
              </div>
              {flatInstallPlays.length > 0 ? (
                <div>
                  {flatInstallPlays.map(renderPlayRow)}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {currentWeek
                    ? (searchTerm ? `No priority plays matching "${searchTerm}"` : 'No priority plays for this week')
                    : 'Select a week to view priority plays'
                  }
                </div>
              )}
            </>
          )}
        </div>

        {/* Batch Selection Action Bar */}
        {isInBatchMode && (
          <div className="border-t border-slate-300 bg-slate-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">
                {selectedPlayIds.size} play{selectedPlayIds.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleCancelBatch}
                className="p-1 text-slate-500 hover:text-slate-700"
                title="Cancel selection"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPlayIds(new Set())}
                className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300 transition-colors"
              >
                Clear
              </button>
              {internalBatchMode ? (
                <button
                  onClick={handleBatchAddToInstall}
                  disabled={selectedPlayIds.size === 0}
                  className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add ({selectedPlayIds.size})
                </button>
              ) : (
                <button
                  onClick={handleBatchSubmit}
                  disabled={selectedPlayIds.size === 0}
                  className="flex-1 px-3 py-2 bg-sky-500 text-white rounded text-sm font-semibold hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {batchSelectLabel} ({selectedPlayIds.size})
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
