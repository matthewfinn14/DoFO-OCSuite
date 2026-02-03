import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { usePlayBank } from '../context/PlayBankContext';
import { getWristbandDisplay } from '../utils/wristband';
import { getPlayCall } from '../utils/playDisplay';
import SheetView from '../components/gameplan/SheetView';
import BoxEditorModal from '../components/gameplan/BoxEditorModal';
import {
  List,
  Grid,
  Printer,
  Lock,
  Unlock,
  Book,
  Settings,
  X,
  Plus,
  Target,
  MapPin,
  Map,
  Zap,
  ExternalLink,
  CheckSquare,
  Package,
  Undo2
} from 'lucide-react';
import '../styles/gameplan.css';

// Default game plan layouts configuration
const DEFAULT_LAYOUTS = {
  CALL_SHEET: {
    sections: [
      {
        title: 'OPENERS / SCRIPTS',
        expandToFill: false,
        boxes: [
          {
            header: 'Openers',
            setId: 'openers',
            type: 'grid',
            colSpan: 5,
            color: '#3b82f6',
            gridColumns: 4,
            gridRows: 5,
            gridHeadings: ['LEFT HASH', 'COL 2', 'COL 3', 'NOTES'],
            cornerLabel: '#'
          },
          {
            header: '1st Drive Script',
            setId: 'first_drive',
            type: 'script',
            colSpan: 2,
            color: '#8b5cf6',
            rows: Array(10).fill(null).map((_, i) => ({ label: i + 1, content: null, contentRight: null }))
          }
        ]
      },
      {
        title: 'RUN GAME',
        expandToFill: true,
        boxes: [
          {
            header: 'Inside Zone',
            setId: 'inside_zone',
            type: 'grid',
            colSpan: 3,
            color: '#ef4444',
            gridColumns: 3,
            gridRows: 4,
            gridHeadings: ['LEFT', 'MIDDLE', 'RIGHT'],
            cornerLabel: '#'
          },
          {
            header: 'Outside Zone',
            setId: 'outside_zone',
            type: 'grid',
            colSpan: 3,
            color: '#f97316',
            gridColumns: 3,
            gridRows: 4,
            gridHeadings: ['LEFT', 'MIDDLE', 'RIGHT'],
            cornerLabel: '#'
          }
        ]
      },
      {
        title: 'QUICK GAME',
        expandToFill: true,
        boxes: [
          {
            header: 'Quick Game',
            setId: 'quick_game',
            type: 'grid',
            colSpan: 5,
            color: '#22c55e',
            gridColumns: 4,
            gridRows: 5,
            gridHeadings: ['LEFT HASH', 'COL 2', 'COL 3', 'NOTES'],
            cornerLabel: '#'
          }
        ]
      },
      {
        title: 'DROPBACK',
        expandToFill: true,
        boxes: [
          {
            header: 'Dropback',
            setId: 'dropback',
            type: 'grid',
            colSpan: 5,
            color: '#0ea5e9',
            gridColumns: 4,
            gridRows: 5,
            gridHeadings: ['LEFT HASH', 'COL 2', 'COL 3', 'NOTES'],
            cornerLabel: '#'
          }
        ]
      },
      {
        title: 'RED ZONE / GOAL LINE',
        expandToFill: true,
        boxes: [
          {
            header: 'Red Zone',
            setId: 'red_zone',
            type: 'grid',
            colSpan: 3,
            color: '#dc2626',
            gridColumns: 3,
            gridRows: 5,
            gridHeadings: ['LEFT', 'MIDDLE', 'RIGHT'],
            cornerLabel: '#'
          },
          {
            header: 'Goal Line',
            setId: 'goal_line',
            type: 'grid',
            colSpan: 3,
            color: '#7c2d12',
            gridColumns: 3,
            gridRows: 4,
            gridHeadings: ['LEFT', 'MIDDLE', 'RIGHT'],
            cornerLabel: '#'
          }
        ]
      },
      {
        title: 'SPECIALS',
        expandToFill: true,
        boxes: [
          {
            header: '2-Min Offense',
            setId: 'two_min',
            type: 'script',
            colSpan: 2,
            color: '#6366f1',
            rows: Array(8).fill(null).map((_, i) => ({ label: i + 1, content: null, contentRight: null }))
          },
          {
            header: 'Gadgets',
            setId: 'gadgets',
            type: 'script',
            colSpan: 2,
            color: '#ec4899',
            rows: Array(6).fill(null).map((_, i) => ({ label: i + 1, content: null, contentRight: null }))
          }
        ]
      }
    ]
  },
  MATRIX: {
    id: 'MATRIX',
    name: "Strike 'Em Out",
    cols: [
      { id: 'FB_L', label: 'FB L', fullLabel: 'Base/Initial Left' },
      { id: 'FB_R', label: 'FB R', fullLabel: 'Base/Initial Right' },
      { id: 'CB_L', label: 'CB L', fullLabel: 'Base w/ Dressing Left' },
      { id: 'CB_R', label: 'CB R', fullLabel: 'Base w/ Dressing Right' },
      { id: 'CU_L', label: 'CU L', fullLabel: 'Convert Left' },
      { id: 'CU_R', label: 'CU R', fullLabel: 'Convert Right' },
      { id: 'SO_L', label: 'SO L', fullLabel: 'Explosive Left' },
      { id: 'SO_R', label: 'SO R', fullLabel: 'Explosive Right' }
    ],
    formations: [
      { id: '887', label: '887', color: '#ef4444' },
      { id: '888', label: '888', color: '#ef4444' },
      { id: '687', label: '687', color: '#fbbf24' },
      { id: '688', label: '688', color: '#fbbf24' },
      { id: '881', label: '881', color: '#facc15' },
      { id: '984', label: '984', color: '#4ade80' },
      { id: '983', label: '983', color: '#4ade80' },
      { id: '488', label: '488', color: '#60a5fa' },
      { id: '487', label: '487', color: '#60a5fa' },
      { id: 'jets', label: 'Jets/Specials', color: '#a8a29e' }
    ],
    playTypes: [
      { id: 'strong_run', label: 'STRONG RUN' },
      { id: 'weak_run', label: 'WEAK RUN' },
      { id: 'quick_game', label: 'QUICK GAME' },
      { id: 'drop_back', label: 'DROPBACK' },
      { id: 'gadget', label: 'GADGET' }
    ]
  },
  FZDND: {
    zones: [
      { id: 'openers', title: 'Openers vs.', color: '#fef08a', textColor: 'black', columns: ['1st & 10', '2nd & <5', '2nd & 5+', '3rd & <5', '3rd & 5+'] },
      { id: 'black', title: 'Black Zone (Goalline to -10)', color: 'black', textColor: 'white' },
      { id: 'red', title: 'Red Zone (-10 to -40)', color: '#ef4444', textColor: 'white' },
      { id: 'yellow', title: 'Yellow Zone (-40 to +40)', color: '#fef08a', textColor: 'black' },
      { id: 'gold', title: 'Gold Zone - Take A Shot (+40 to Endzone)', color: '#f59e0b', textColor: 'black' },
      { id: 'green', title: 'Green Zone (+20 to Endzone)', color: '#22c55e', textColor: 'black' },
      { id: '4min', title: '4:00 Offense', color: '#1e1b4b', textColor: '#fef08a' },
      { id: '2min', title: '2:00 Offense', color: '#dc2626', textColor: 'black', columns: ['Personnel', 'Timeouts', 'Max Protect', 'First Downs', 'Think Plays'] },
      { id: '2pt', title: 'Two Point Plays', color: 'black', textColor: 'white', columns: [' ', ' '] }
    ]
  }
};

export default function GamePlan() {
  const { weekId } = useParams();
  const {
    playsArray,
    currentWeek,
    updateWeek,
    settings,
    setupConfig,
    roster,
    depthCharts,
    setCurrentWeekId
  } = useSchool();

  // Sync URL weekId with context
  useEffect(() => {
    if (weekId) {
      setCurrentWeekId(weekId);
    }
  }, [weekId, setCurrentWeekId]);

  // Theme check
  const isLight = settings?.theme === 'light';

  // View state
  const [isLocked, setIsLocked] = useState(false);
  const [isSheetEditing, setIsSheetEditing] = useState(false);
  const [pageFormat, setPageFormat] = useState('2-page'); // '2-page' or '4-page'
  const [pageOrientation, setPageOrientation] = useState('portrait'); // 'portrait' or 'landscape'
  const [editingBox, setEditingBox] = useState(null);

  // Drag state for Sheet view
  const [draggedCell, setDraggedCell] = useState(null);
  const [playDragOverBox, setPlayDragOverBox] = useState(null);

  // Add Box modal state
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [addBoxSectionIdx, setAddBoxSectionIdx] = useState(null);

  // Undo history for layouts
  const [layoutHistory, setLayoutHistory] = useState([]);
  const MAX_HISTORY = 20;

  // Get game plan data from current week
  const gamePlan = currentWeek?.offensiveGamePlan || { sets: [], miniScripts: [] };

  // Get layouts from game plan or use defaults
  const gamePlanLayouts = useMemo(() => {
    return currentWeek?.gamePlanLayouts || DEFAULT_LAYOUTS;
  }, [currentWeek?.gamePlanLayouts]);

  // Team settings
  const teamLogo = settings?.teamLogo || '';
  const teamName = settings?.schoolName || '';

  // Update game plan in current week
  const handleUpdateGamePlan = useCallback((newGamePlan) => {
    if (!currentWeek) return;
    updateWeek(currentWeek.id, { offensiveGamePlan: newGamePlan });
  }, [currentWeek, updateWeek]);

  // Batch Add State
  const { startBatchSelect, cancelBatchSelect, quickAddRequest, batchAddEvent, clearBatchAddEvent, targetingMode, targetingPlays, completeTargeting } = usePlayBank();
  const [isTargetingBox, setIsTargetingBox] = useState(false);
  const [pendingBatchPlays, setPendingBatchPlays] = useState([]);

  // Track last processed request to prevent duplicates/loops
  const lastProcessedQuickAddRef = useRef(0);

  // Handle Quick Add Request (when no modal is open)
  useEffect(() => {
    if (quickAddRequest && !editingBox && quickAddRequest.timestamp > lastProcessedQuickAddRef.current) {
      lastProcessedQuickAddRef.current = quickAddRequest.timestamp;

      // Enter targeting mode with this play
      setPendingBatchPlays([quickAddRequest.playId]);
      setIsTargetingBox(true);
    }
  }, [quickAddRequest, editingBox]);

  // Handle Batch Add Event from PlayBank sidebar
  useEffect(() => {
    if (!batchAddEvent) return;

    const { destination, playIds, setId } = batchAddEvent;

    // Handle specific box selection from context-aware batch add
    if (destination === 'gameplan-box' && setId) {
      const newGamePlan = { ...gamePlan };
      const newSets = [...(newGamePlan.sets || [])];
      let setIndex = newSets.findIndex(s => s.id === setId);

      if (setIndex === -1) {
        newSets.push({ id: setId, playIds: [...playIds] });
      } else {
        const existingSet = { ...newSets[setIndex] };
        existingSet.playIds = [...new Set([...(existingSet.playIds || []), ...playIds])];
        newSets[setIndex] = existingSet;
      }

      newGamePlan.sets = newSets;
      handleUpdateGamePlan(newGamePlan);
      clearBatchAddEvent();
      return;
    }

    // Handle Game Plan/Call Sheet destinations
    if (destination === 'gameplan-quicklist') {
      // Add to the currently editing box's quick list, or add to all boxes' quick lists
      if (editingBox) {
        // Add to currently open box's quick list
        const newGamePlan = { ...gamePlan };
        const set = newGamePlan.sets?.find(s => s.id === editingBox.box?.setId);
        if (set) {
          set.playIds = [...new Set([...(set.playIds || []), ...playIds])];
          handleUpdateGamePlan(newGamePlan);
        }
      } else {
        // No box is open - add plays to all boxes' quick lists so they're available
        // when user opens any box for editing
        const newGamePlan = { ...gamePlan };
        const newSets = [...(newGamePlan.sets || [])];

        // Get all box setIds from the current sheet layout
        const allSetIds = [];
        (gamePlanLayouts.CALL_SHEET?.sections || []).forEach(section => {
          (section.boxes || []).forEach(box => {
            if (box.setId) allSetIds.push(box.setId);
          });
        });

        // Add plays to each box's quick list (playIds)
        allSetIds.forEach(setId => {
          let setIndex = newSets.findIndex(s => s.id === setId);
          if (setIndex === -1) {
            newSets.push({ id: setId, playIds: [...playIds] });
          } else {
            const existingSet = { ...newSets[setIndex] };
            existingSet.playIds = [...new Set([...(existingSet.playIds || []), ...playIds])];
            newSets[setIndex] = existingSet;
          }
        });

        newGamePlan.sets = newSets;
        handleUpdateGamePlan(newGamePlan);

        // Also enter targeting mode so user can click a specific box to fill cells
        setPendingBatchPlays(playIds);
        setIsTargetingBox(true);
      }
      clearBatchAddEvent();
    }
  }, [batchAddEvent, editingBox, gamePlan, gamePlanLayouts, handleUpdateGamePlan, clearBatchAddEvent]);

  // Add Section modal state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  // Update layouts in current week (with history tracking)
  const handleUpdateLayouts = useCallback((newLayouts, skipHistory = false) => {
    if (!currentWeek) return;

    // Save current state to history before updating (unless skipping for undo)
    if (!skipHistory && gamePlanLayouts) {
      setLayoutHistory(prev => {
        const newHistory = [...prev, JSON.parse(JSON.stringify(gamePlanLayouts))];
        // Keep only last MAX_HISTORY items
        return newHistory.slice(-MAX_HISTORY);
      });
    }

    updateWeek(currentWeek.id, { gamePlanLayouts: newLayouts });
  }, [currentWeek, updateWeek, gamePlanLayouts]);

  // Undo last layout change
  const handleUndo = useCallback(() => {
    if (layoutHistory.length === 0) return;

    const previousLayout = layoutHistory[layoutHistory.length - 1];
    setLayoutHistory(prev => prev.slice(0, -1));
    handleUpdateLayouts(previousLayout, true); // Skip adding to history
  }, [layoutHistory, handleUpdateLayouts]);

  // Get plays for a specific set
  const getPlaysForSet = useCallback((setId) => {
    const set = gamePlan.sets?.find(s => s.id === setId);
    if (!set) return [];
    return (set.playIds || [])
      .map(id => playsArray.find(p => p.id === id))
      .filter(Boolean);
  }, [gamePlan.sets, playsArray]);

  // Get grid plays with assigned slots
  const getGridPlays = useCallback((setId, totalSlots, assignedPlayIds = []) => {
    const plays = [];
    for (let i = 0; i < totalSlots; i++) {
      const playId = assignedPlayIds?.[i];
      if (playId) {
        const play = playsArray.find(p => p.id === playId);
        plays.push(play ? { ...play, type: 'PLAY' } : { type: 'GAP' });
      } else {
        plays.push({ type: 'GAP' });
      }
    }
    return plays;
  }, [playsArray]);

  // Add play to a set
  const handleAddPlayToSet = useCallback((setId, playId) => {
    if (isLocked) return;
    const newSets = [...(gamePlan.sets || [])];
    const setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex === -1) {
      newSets.push({ id: setId, playIds: [playId] });
    } else {
      const existingSet = { ...newSets[setIndex] };
      if (!existingSet.playIds.includes(playId)) {
        existingSet.playIds = [...(existingSet.playIds || []), playId];
        newSets[setIndex] = existingSet;
      }
    }
    handleUpdateGamePlan({ ...gamePlan, sets: newSets });
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Remove play from a set
  const handleRemovePlayFromSet = useCallback((setId, playId) => {
    if (isLocked) return;
    const newSets = [...(gamePlan.sets || [])];
    const setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      existingSet.playIds = (existingSet.playIds || []).filter(id => id !== playId);
      newSets[setIndex] = existingSet;
      handleUpdateGamePlan({ ...gamePlan, sets: newSets });
    }
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Add play to Quick List (assignedPlayIds)
  const handleAddPlayToQuickList = useCallback((setId, playId) => {
    if (isLocked) return;
    const newSets = [...(gamePlan.sets || [])];
    const setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex === -1) {
      newSets.push({ id: setId, playIds: [], assignedPlayIds: [playId] });
    } else {
      const existingSet = { ...newSets[setIndex] };
      const currentAssigned = existingSet.assignedPlayIds || [];
      if (!currentAssigned.includes(playId)) {
        existingSet.assignedPlayIds = [...currentAssigned, playId];
        newSets[setIndex] = existingSet;
      }
    }
    handleUpdateGamePlan({ ...gamePlan, sets: newSets });
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Remove play from Quick List (assignedPlayIds)
  const handleRemovePlayFromQuickList = useCallback((setId, playId) => {
    if (isLocked) return;
    const newSets = [...(gamePlan.sets || [])];
    const setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      existingSet.assignedPlayIds = (existingSet.assignedPlayIds || []).filter(id => id !== playId);
      newSets[setIndex] = existingSet;
      handleUpdateGamePlan({ ...gamePlan, sets: newSets });
    }
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Reorder plays in Quick List
  const handleReorderQuickList = useCallback((setId, fromIdx, toIdx) => {
    if (isLocked) return;
    const newSets = [...(gamePlan.sets || [])];
    const setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      const currentAssigned = [...(existingSet.assignedPlayIds || [])];
      const [moved] = currentAssigned.splice(fromIdx, 1);
      currentAssigned.splice(toIdx, 0, moved);
      existingSet.assignedPlayIds = currentAssigned;
      newSets[setIndex] = existingSet;
      handleUpdateGamePlan({ ...gamePlan, sets: newSets });
    }
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Assign play to a specific cell (grid or script)
  const handleAssignPlayToCell = useCallback((setId, cellIdx, column, playId) => {
    if (isLocked) return;

    // For grid boxes, cellIdx is the linear index
    // For script boxes, cellIdx is the row index and column is 'left' or 'right'

    // Update the layout box directly
    const newLayouts = { ...gamePlanLayouts };
    let boxFound = false;

    newLayouts.CALL_SHEET.sections = newLayouts.CALL_SHEET.sections.map(section => ({
      ...section,
      boxes: section.boxes.map(box => {
        if (box.setId === setId) {
          boxFound = true;
          if (box.type === 'script') {
            // Script box - update rows
            const newRows = [...(box.rows || [])];
            while (newRows.length <= cellIdx) {
              newRows.push({ label: newRows.length + 1, content: null, contentRight: null });
            }
            if (column === 'left' || column === null) {
              newRows[cellIdx] = { ...newRows[cellIdx], content: playId };
            } else {
              newRows[cellIdx] = { ...newRows[cellIdx], contentRight: playId };
            }
            return { ...box, rows: newRows };
          } else {
            // Grid box - update assignedPlayIds
            const cols = box.gridColumns || 4;
            const rowsCount = box.gridRows || 5;
            const totalSlots = cols * rowsCount;
            const newAssignedPlayIds = [...(box.assignedPlayIds || [])];
            while (newAssignedPlayIds.length < totalSlots) {
              newAssignedPlayIds.push('GAP');
            }
            newAssignedPlayIds[cellIdx] = playId;
            return { ...box, assignedPlayIds: newAssignedPlayIds };
          }
        }
        return box;
      })
    }));

    if (boxFound) {
      handleUpdateLayouts(newLayouts);
    }
  }, [gamePlanLayouts, handleUpdateLayouts, isLocked]);

  // Remove play from a specific cell
  const handleRemovePlayFromCell = useCallback((setId, cellIdx, column) => {
    if (isLocked) return;

    const newLayouts = { ...gamePlanLayouts };
    let boxFound = false;

    newLayouts.CALL_SHEET.sections = newLayouts.CALL_SHEET.sections.map(section => ({
      ...section,
      boxes: section.boxes.map(box => {
        if (box.setId === setId) {
          boxFound = true;
          if (box.type === 'script') {
            // Script box - clear from rows
            const newRows = [...(box.rows || [])];
            if (newRows[cellIdx]) {
              if (column === 'left' || column === null) {
                newRows[cellIdx] = { ...newRows[cellIdx], content: null };
              } else {
                newRows[cellIdx] = { ...newRows[cellIdx], contentRight: null };
              }
            }
            return { ...box, rows: newRows };
          } else {
            // Grid box - clear from assignedPlayIds
            const newAssignedPlayIds = [...(box.assignedPlayIds || [])];
            if (newAssignedPlayIds[cellIdx]) {
              newAssignedPlayIds[cellIdx] = 'GAP';
            }
            return { ...box, assignedPlayIds: newAssignedPlayIds };
          }
        }
        return box;
      })
    }));

    if (boxFound) {
      handleUpdateLayouts(newLayouts);
    }
  }, [gamePlanLayouts, handleUpdateLayouts, isLocked]);

  // Handle FZDnD Box drop (for FZDnD boxes in SheetView)
  // Set ID pattern: {boxSetId}_{downDistanceId}
  const handleFZDnDBoxDrop = useCallback((boxSetId, rowIdx, ddId, playId) => {
    if (isLocked) return;
    const setId = `${boxSetId}_${ddId}`;
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex === -1) {
      const newSet = { id: setId, playIds: [] };
      while (newSet.playIds.length <= rowIdx) {
        newSet.playIds.push(null);
      }
      newSet.playIds[rowIdx] = playId;
      newSets.push(newSet);
    } else {
      const existingSet = { ...newSets[setIndex] };
      while (existingSet.playIds.length <= rowIdx) {
        existingSet.playIds.push(null);
      }
      existingSet.playIds[rowIdx] = playId;
      newSets[setIndex] = existingSet;
    }
    handleUpdateGamePlan({ ...gamePlan, sets: newSets });
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Remove play from FZDnD Box cell
  const handleFZDnDBoxRemove = useCallback((boxSetId, rowIdx, ddId) => {
    if (isLocked) return;
    const setId = `${boxSetId}_${ddId}`;
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      existingSet.playIds[rowIdx] = null;
      newSets[setIndex] = existingSet;
      handleUpdateGamePlan({ ...gamePlan, sets: newSets });
    }
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Handle Matrix Box add (for Matrix boxes in SheetView)
  // Set ID pattern: {boxSetId}_{playTypeId}_{colId}
  const handleMatrixBoxAdd = useCallback((boxSetId, playTypeId, colId, playId) => {
    if (isLocked) return;
    const setId = `${boxSetId}_${playTypeId}_${colId}`;
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex === -1) {
      newSets.push({ id: setId, playIds: [playId] });
    } else {
      const existingSet = { ...newSets[setIndex] };
      // Matrix cells allow multiple plays, so add if not already present
      if (!existingSet.playIds.includes(playId)) {
        existingSet.playIds = [...(existingSet.playIds || []), playId];
        newSets[setIndex] = existingSet;
      }
    }
    handleUpdateGamePlan({ ...gamePlan, sets: newSets });
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Remove play from Matrix Box cell
  const handleMatrixBoxRemove = useCallback((boxSetId, playTypeId, colId, playId) => {
    if (isLocked) return;
    const setId = `${boxSetId}_${playTypeId}_${colId}`;
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      existingSet.playIds = (existingSet.playIds || []).filter(id => id !== playId);
      newSets[setIndex] = existingSet;
      handleUpdateGamePlan({ ...gamePlan, sets: newSets });
    }
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Update formation name override
  const handleUpdateFormationName = useCallback((formationId, name) => {
    const newOverrides = { ...(gamePlan.formationOverrides || {}) };
    newOverrides[formationId] = name;
    handleUpdateGamePlan({ ...gamePlan, formationOverrides: newOverrides });
    setEditingFormationId(null);
  }, [gamePlan, handleUpdateGamePlan]);

  // Get available situations from setupConfig
  const availableSituations = useMemo(() => {
    const situations = [];

    // Add field zones
    (setupConfig?.fieldZones || []).forEach(zone => {
      situations.push({
        id: zone.id,
        name: zone.name,
        color: zone.color || '#ef4444',
        type: 'fieldZone',
        icon: 'MapPin'
      });
    });

    // Add down & distance categories
    (setupConfig?.downDistanceCategories || []).forEach(cat => {
      situations.push({
        id: cat.id,
        name: cat.name,
        color: cat.color || '#f59e0b',
        type: 'downDistance',
        icon: 'Target'
      });
    });

    // Add special situations
    (setupConfig?.specialSituations || []).forEach(sit => {
      situations.push({
        id: sit.id,
        name: sit.name,
        color: sit.color || '#8b5cf6',
        type: 'specialSituation',
        icon: 'Zap'
      });
    });

    return situations;
  }, [setupConfig]);

  // Sheet editing functions
  const handleAddSheetSection = useCallback((config = null) => {
    const newSection = {
      title: config?.name || 'New Section',
      expandToFill: false,
      sectionType: config?.type || null, // 'fieldZone', 'downDistance', 'specialSituation', 'byPlayer', 'byPlayType', or null for custom
      boxes: []
    };
    const newLayouts = { ...gamePlanLayouts };
    const sheet = { ...newLayouts.CALL_SHEET };
    sheet.sections = [...(sheet.sections || []), newSection];
    newLayouts.CALL_SHEET = sheet;
    handleUpdateLayouts(newLayouts);
    setShowAddSectionModal(false);
  }, [gamePlanLayouts, handleUpdateLayouts]);

  const handleUpdateSheetSection = useCallback((index, updatedSection) => {
    const newLayouts = { ...gamePlanLayouts };
    const sheet = { ...newLayouts.CALL_SHEET };
    const newSections = [...sheet.sections];
    newSections[index] = updatedSection;
    sheet.sections = newSections;
    newLayouts.CALL_SHEET = sheet;
    handleUpdateLayouts(newLayouts);
  }, [gamePlanLayouts, handleUpdateLayouts]);

  const handleDeleteSheetSection = useCallback((index) => {
    if (!confirm('Delete this section and all its boxes?')) return;
    const newLayouts = { ...gamePlanLayouts };
    const sheet = { ...newLayouts.CALL_SHEET };
    const newSections = [...sheet.sections];
    newSections.splice(index, 1);
    sheet.sections = newSections;
    newLayouts.CALL_SHEET = sheet;
    handleUpdateLayouts(newLayouts);
  }, [gamePlanLayouts, handleUpdateLayouts]);

  // Show the Add Box modal
  const handleAddSheetBox = useCallback((sectionIdx) => {
    setAddBoxSectionIdx(sectionIdx);
    setShowAddBoxModal(true);
  }, []);

  // Actually create and add the box with selected type
  const handleCreateBox = useCallback((boxType, options = {}) => {
    if (addBoxSectionIdx === null) return;

    let newBox;
    const timestamp = Date.now();

    switch (boxType) {
      case 'grid':
        newBox = {
          header: options.name || 'New Grid',
          setId: `box_${timestamp}`,
          type: 'grid',
          colSpan: 4,
          color: options.color || '#3b82f6',
          gridColumns: 4,
          gridRows: 5,
          gridHeadings: ['LEFT HASH', 'COL 2', 'COL 3', 'NOTES'],
          cornerLabel: '#'
        };
        break;

      case 'script':
        newBox = {
          header: options.name || 'New Script',
          setId: `box_${timestamp}`,
          type: 'script',
          colSpan: 2,
          color: options.color || '#8b5cf6',
          scriptColumns: 2,
          rows: Array(10).fill(null).map((_, i) => ({ label: i + 1, content: null, contentRight: null }))
        };
        break;

      case 'fzdnd':
        const zone = setupConfig?.fieldZones?.find(z => z.id === options.zoneId);
        newBox = {
          header: zone?.name || options.name || 'Zone',
          setId: `fz_${options.zoneId || 'zone'}_${timestamp}`,
          type: 'fzdnd',
          colSpan: 5,
          color: zone?.color || options.color || '#dc2626',
          zoneId: options.zoneId,
          rowCount: 5,
          columnSource: options.columnSource || 'downDistance' // 'downDistance', 'playPurpose', or 'custom'
        };
        break;

      case 'matrix':
        // Apply template defaults if available
        const template = gamePlan?.matrixTemplate || {};
        newBox = {
          header: options.name ? `${options.name} Matrix` : 'New Matrix',
          setId: `matrix_${(options.name || 'box').toLowerCase().replace(/\s+/g, '_')}_${timestamp}`,
          type: 'matrix',
          colSpan: 7,
          color: options.color || '#06b6d4',
          formationId: (options.name || 'formation').toLowerCase().replace(/\s+/g, '_'),
          formationLabel: options.name || 'Formation',
          // Apply template settings if available
          firstColWidth: template.firstColWidth || 60,
          firstColBg: template.firstColBg || '#dbeafe',
          firstColTextColor: template.firstColTextColor || '#1e40af',
          firstColFontSize: template.firstColFontSize || '0.5rem',
          rowColor1: template.rowColor1 || '#ffffff',
          rowColor2: template.rowColor2 || '#f8fafc',
          playTypes: template.playTypes || [
            { id: 'strong_run', label: 'STRONG RUN' },
            { id: 'weak_run', label: 'WEAK RUN' },
            { id: 'quick_game', label: 'QUICK GAME' },
            { id: 'drop_back', label: 'DROPBACK' },
            { id: 'gadget', label: 'GADGET' }
          ],
          hashGroups: template.hashGroups || [
            { id: 'FB', label: 'BASE/INITIAL', cols: ['FB_L', 'FB_R'] },
            { id: 'CB', label: 'BASE W/ DRESSING', cols: ['CB_L', 'CB_R'] },
            { id: 'CU', label: 'CONVERT', cols: ['CU_L', 'CU_R'] },
            { id: 'SO', label: 'EXPLOSIVE', cols: ['SO_L', 'SO_R'] }
          ]
        };
        break;

      default:
        newBox = {
          header: 'New Box',
          setId: `box_${timestamp}`,
          type: 'grid',
          colSpan: 3,
          color: '#3b82f6',
          gridColumns: 3,
          gridRows: 4,
          gridHeadings: ['COL 1', 'COL 2', 'COL 3'],
          cornerLabel: '#'
        };
    }

    const newLayouts = { ...gamePlanLayouts };
    const section = { ...newLayouts.CALL_SHEET.sections[addBoxSectionIdx] };
    section.boxes = [...(section.boxes || []), newBox];
    newLayouts.CALL_SHEET.sections[addBoxSectionIdx] = section;
    handleUpdateLayouts(newLayouts);

    setShowAddBoxModal(false);
    setAddBoxSectionIdx(null);
  }, [addBoxSectionIdx, gamePlanLayouts, handleUpdateLayouts, setupConfig]);

  const handleDeleteSheetBox = useCallback((sectionIdx, boxIdx) => {
    const newLayouts = { ...gamePlanLayouts };
    const section = { ...newLayouts.CALL_SHEET.sections[sectionIdx] };
    const newBoxes = [...section.boxes];
    newBoxes.splice(boxIdx, 1);
    section.boxes = newBoxes;
    newLayouts.CALL_SHEET.sections[sectionIdx] = section;
    handleUpdateLayouts(newLayouts);
  }, [gamePlanLayouts, handleUpdateLayouts]);

  const handleUpdateSheetBox = useCallback((sectionIdx, boxIdx, updates) => {
    const newLayouts = { ...gamePlanLayouts };
    const section = { ...newLayouts.CALL_SHEET.sections[sectionIdx] };
    const newBoxes = [...section.boxes];
    newBoxes[boxIdx] = { ...newBoxes[boxIdx], ...updates };
    section.boxes = newBoxes;
    newLayouts.CALL_SHEET.sections[sectionIdx] = section;
    handleUpdateLayouts(newLayouts);
  }, [gamePlanLayouts, handleUpdateLayouts]);

  // Handle box drop (reordering or play drop)
  const handleSheetBoxDrop = useCallback(async (e, targetSectionIdx, targetBoxIdx) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for Play Drop from Sidebar
    const playData = e.dataTransfer.getData('application/react-dnd');
    if (playData) {
      try {
        const { playId } = JSON.parse(playData);
        if (playId) {
          const section = gamePlanLayouts.CALL_SHEET.sections[targetSectionIdx];
          const box = section?.boxes?.[targetBoxIdx];
          if (box && box.setId) {
            await handleAddPlayToSet(box.setId, playId);
          }
        }
      } catch (err) {
        console.error('Error parsing drop data:', err);
      }
      setPlayDragOverBox(null);
      return;
    }



    // Handle box reordering
    if (!isSheetEditing || !draggedCell) {
      setPlayDragOverBox(null);
      return;
    }

    const { sectionIdx: srcSectionIdx, boxIdx: srcBoxIdx } = draggedCell;

    if (srcSectionIdx === targetSectionIdx && srcBoxIdx === targetBoxIdx) {
      setDraggedCell(null);
      return;
    }

    const newLayouts = { ...gamePlanLayouts };
    const sheet = { ...newLayouts.CALL_SHEET };
    sheet.sections = [...sheet.sections];

    // Get the box being moved
    const srcSection = { ...sheet.sections[srcSectionIdx] };
    const srcBoxes = [...srcSection.boxes];
    const [movedBox] = srcBoxes.splice(srcBoxIdx, 1);
    srcSection.boxes = srcBoxes;
    sheet.sections[srcSectionIdx] = srcSection;

    // Insert into target position
    const targetSection = { ...sheet.sections[targetSectionIdx] };
    const targetBoxes = [...targetSection.boxes];
    targetBoxes.splice(targetBoxIdx, 0, movedBox);
    targetSection.boxes = targetBoxes;
    sheet.sections[targetSectionIdx] = targetSection;

    newLayouts.CALL_SHEET = sheet;
    handleUpdateLayouts(newLayouts);
    setDraggedCell(null);
  }, [draggedCell, gamePlanLayouts, handleAddPlayToSet, handleUpdateLayouts, isSheetEditing]);

  // Get wristband label for a play (with type suffix: W for WIZ, M for mini)
  const getWristbandLabel = useCallback((play) => {
    return getWristbandDisplay(play) || null;
  }, []);

  // Batch assign plays to a box
  const batchAssignPlaysToBox = useCallback(async (boxId, newPlayIds) => {
    if (!currentWeek || !newPlayIds.length) return;

    // Find the box (search sets and mini-scripts)
    let boxData = null;
    let boxType = 'set'; // 'set' or 'miniscript'

    // Check sets
    const set = gamePlan.sets?.find(s => s.id === boxId);
    if (set) {
      boxData = set;
      boxType = 'set';
    } else {
      // Check mini-scripts
      const ms = gamePlan.miniScripts?.find(s => s.id === boxId);
      if (ms) {
        boxData = ms;
        boxType = 'miniscript';
      }
    }

    if (!boxData) return;

    // Find the layout box to determine type and capacity
    let layoutBox = null;
    let sectionIdx = -1;
    let boxIdx = -1;

    // Search through layouts
    Object.values(gamePlanLayouts).some(layout => {
      return (layout.sections || []).some((section, sIdx) => {
        return (section.boxes || []).some((box, bIdx) => {
          if (box.setId === boxId) {
            layoutBox = box;
            sectionIdx = sIdx;
            boxIdx = bIdx;
            return true;
          }
          return false;
        });
      });
    });

    if (!layoutBox) return;

    // Handle Grid Box
    if (layoutBox.type === 'grid') {
      const cols = layoutBox.gridColumns || 4;
      const rows = layoutBox.gridRows || 5;
      const totalSlots = cols * rows;

      const currentAssigned = [...(boxData.assignedPlayIds || [])];

      // Ensure array is big enough
      while (currentAssigned.length < totalSlots) {
        currentAssigned.push(null);
      }

      // Fill empty slots
      let playIdx = 0;
      for (let i = 0; i < totalSlots && playIdx < newPlayIds.length; i++) {
        // If slot is empty or GAP
        if (!currentAssigned[i] || currentAssigned[i] === 'GAP') {
          currentAssigned[i] = newPlayIds[playIdx];
          playIdx++;
        }
      }

      // Update the set/miniscript
      if (boxType === 'set') {
        // For sets, we also need to update playIds if not using assignedPlayIds exclusively
        // But for grid boxes we usually rely on assignedPlayIds for positioning
        const updatedGamePlan = { ...gamePlan };
        const updatedSet = updatedGamePlan.sets.find(s => s.id === boxId);
        updatedSet.assignedPlayIds = currentAssigned;
        // Also ensure plays are in playIds for general tracking
        const allIds = new Set([...(updatedSet.playIds || []), ...newPlayIds]);
        updatedSet.playIds = Array.from(allIds);

        await handleUpdateGamePlan(updatedGamePlan);
      }
    }
    // Handle Script Box
    else if (layoutBox.type === 'script') {
      // Scripts store data in layoutBox.rows, not in the set directly usually
      // But we need to update the layout box rows
      const scriptRows = [...(layoutBox.rows || [])];
      const scriptColumns = layoutBox.scriptColumns || 2;

      let playIdx = 0;

      // Iterate rows to find empty slots
      for (let r = 0; r < scriptRows.length && playIdx < newPlayIds.length; r++) {
        // If row doesn't exist, create it
        if (!scriptRows[r]) {
          scriptRows[r] = { label: r + 1, content: null, contentRight: null };
        }

        // Fill left column if empty
        if (!scriptRows[r].content) {
          scriptRows[r] = { ...scriptRows[r], content: newPlayIds[playIdx] };
          playIdx++;
        }

        // Fill right column if empty and using 2 columns
        if (playIdx < newPlayIds.length && scriptColumns === 2 && !scriptRows[r].contentRight) {
          scriptRows[r] = { ...scriptRows[r], contentRight: newPlayIds[playIdx] };
          playIdx++;
        }
      }

      // Update layout box
      // We need to construct the full new layouts object
      const newLayouts = { ...gamePlanLayouts };
      // Find the specific layout key (e.g., CALL_SHEET)
      const layoutKey = Object.keys(newLayouts).find(key =>
        newLayouts[key].sections?.[sectionIdx]?.boxes?.[boxIdx]?.setId === boxId
      );

      if (layoutKey) {
        newLayouts[layoutKey].sections[sectionIdx].boxes[boxIdx].rows = scriptRows;
        await handleUpdateLayouts(newLayouts);
      }
    }

    // Also add to quick list (set.playIds) for both types to ideally keep them in sync
    if (boxType === 'set') {
      const updatedGamePlan = { ...gamePlan };
      const updatedSet = updatedGamePlan.sets.find(s => s.id === boxId);
      if (updatedSet) {
        const currentPlayIds = updatedSet.playIds || [];
        const newIdsToAdd = newPlayIds.filter(id => !currentPlayIds.includes(id));
        if (newIdsToAdd.length > 0) {
          updatedSet.playIds = [...currentPlayIds, ...newIdsToAdd];
          await handleUpdateGamePlan(updatedGamePlan);
        }
      }
    }

  }, [currentWeek, gamePlan, gamePlanLayouts, handleUpdateGamePlan, handleUpdateLayouts]);

  // Handle Box Click (Intercept for Batch Add)
  const handleBoxClick = useCallback(async (box, sectionIdx, boxIdx) => {
    // Handle context-level targeting mode (from PlayBank "Click to Place")
    if (targetingMode && targetingPlays.length > 0) {
      const playIdsToAdd = completeTargeting();
      await batchAssignPlaysToBox(box.setId, playIdsToAdd);
      return;
    }

    // Handle local targeting mode (from Batch Add button)
    if (isTargetingBox && pendingBatchPlays.length > 0) {
      await batchAssignPlaysToBox(box.setId, pendingBatchPlays);

      // Reset state
      setIsTargetingBox(false);
      setPendingBatchPlays([]);
      cancelBatchSelect();
    } else {
      // Normal edit behavior
      setEditingBox({ box, sectionIdx, boxIdx });
    }
  }, [isTargetingBox, pendingBatchPlays, batchAssignPlaysToBox, cancelBatchSelect, targetingMode, targetingPlays, completeTargeting]);

  // Get play display name (includes wristband slot if assigned)
  const getPlayDisplayName = useCallback((play) => {
    if (!play) return '';
    // Always include formation with the play name, and wristband slot if assigned
    const playCall = getPlayCall(play);
    const wristband = getWristbandDisplay(play);
    return wristband ? `${playCall} [${wristband}]` : playCall;
  }, []);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Load layout preferences from local storage on mount
  // ... (existing code)

  // No week selected
  if (!currentWeek) {
    return (
      <div className="p-6">
        <h1 className={`text-3xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Game Plan</h1>
        <div className={`rounded-lg p-8 text-center ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900'}`}>
          <Book size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className={`text-xl font-medium mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>No Week Selected</h3>
          <p className="text-slate-500">
            Select a week from the sidebar to build your game plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - hidden when printing */}
      <div className={`p-4 border-b hide-on-print ${isLight ? 'bg-white border-slate-200' : 'border-slate-800 bg-slate-900/50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Game Plan</h1>
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {currentWeek.name}
              {currentWeek.opponent && ` vs. ${currentWeek.opponent}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Batch Add Button */}
            <button
              onClick={() => {
                if (isTargetingBox) {
                  // Cancel targeting mode
                  setIsTargetingBox(false);
                  setPendingBatchPlays([]);
                  cancelBatchSelect();
                } else {
                  // Start batch select
                  startBatchSelect((playIds) => {
                    setPendingBatchPlays(playIds);
                    setIsTargetingBox(true);
                  }, 'Select Target Box');
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isTargetingBox
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
            >
              <CheckSquare size={16} />
              <span className="text-sm">{isTargetingBox ? 'Select Target Box...' : 'Batch Add'}</span>
            </button>

            {/* Lock Toggle */}
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isLocked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200' // Light mode unlocked
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'     // Dark mode unlocked
                }`}
              title={isLocked ? 'Unlock editing' : 'Lock editing'}
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              <span className="text-sm">{isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>

            {/* Edit Layout Button */}
            {!isLocked && (
              <button
                onClick={() => setIsSheetEditing(!isSheetEditing)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isSheetEditing
                  ? 'bg-blue-500 text-white'
                  : isLight
                    ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
              >
                <Settings size={16} />
                <span className="text-sm">{isSheetEditing ? 'Done Editing' : 'Edit Layout'}</span>
              </button>
            )}

            {/* Undo Button - show when editing or has history */}
            {(isSheetEditing || layoutHistory.length > 0) && (
              <button
                onClick={handleUndo}
                disabled={layoutHistory.length === 0}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  layoutHistory.length === 0
                    ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                    : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                }`}
                title={layoutHistory.length > 0 ? `Undo (${layoutHistory.length} available)` : 'Nothing to undo'}
              >
                <Undo2 size={16} />
                <span className="text-sm">Undo{layoutHistory.length > 0 ? ` (${layoutHistory.length})` : ''}</span>
              </button>
            )}

            {/* Print Controls */}
            <div className="flex items-center gap-2">
              <select
                value={pageFormat}
                onChange={(e) => setPageFormat(e.target.value)}
                className={`px-2 py-2 text-sm rounded-lg border ${isLight
                  ? 'bg-white text-slate-700 border-slate-200'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Page format for printing"
              >
                <option value="2-page">2-Page (1 sheet)</option>
                <option value="4-page">4-Page Booklet</option>
              </select>
              <select
                value={pageOrientation}
                onChange={(e) => setPageOrientation(e.target.value)}
                className={`px-2 py-2 text-sm rounded-lg border ${isLight
                  ? 'bg-white text-slate-700 border-slate-200'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Page orientation for printing"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
              <button
                onClick={handlePrint}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
              >
                <Printer size={16} />
                <span className="text-sm">Print</span>
              </button>
              <Link
                to={`/print?template=game_plan&pageFormat=${pageFormat}&orientation=${pageOrientation}`}
                className={`p-2 rounded-lg ${isLight
                  ? 'text-slate-400 hover:text-sky-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                  }`}
                title="Open in Print Center"
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-slate-950">
        <SheetView
            layouts={gamePlanLayouts}
            gamePlan={gamePlan}
            plays={playsArray}
            currentWeek={currentWeek}
            teamLogo={teamLogo}
            isLocked={isLocked}
            isEditing={isSheetEditing}
            pageFormat={pageFormat}
            pageOrientation={pageOrientation}
            onToggleEditing={() => setIsSheetEditing(!isSheetEditing)}
            onUpdateLayouts={handleUpdateLayouts}
            onAddSection={() => setShowAddSectionModal(true)}
            onUpdateSection={handleUpdateSheetSection}
            onDeleteSection={handleDeleteSheetSection}
            onAddBox={handleAddSheetBox}
            onDeleteBox={handleDeleteSheetBox}
            onUpdateBox={handleUpdateSheetBox}
            onBoxDrop={handleSheetBoxDrop}
            onBoxClick={handleBoxClick}
            isTargetingMode={targetingMode || isTargetingBox}
            targetingPlayCount={targetingMode ? targetingPlays.length : pendingBatchPlays.length}
            onAddPlayToSet={handleAddPlayToSet}
            onRemovePlayFromSet={handleRemovePlayFromSet}
            getPlaysForSet={getPlaysForSet}
            getGridPlays={getGridPlays}
            getPlayDisplayName={getPlayDisplayName}
            draggedCell={draggedCell}
            setDraggedCell={setDraggedCell}
            playDragOverBox={playDragOverBox}
            setPlayDragOverBox={setPlayDragOverBox}
            onEditBox={setEditingBox}
            setupConfig={setupConfig}
            onFZDnDBoxDrop={handleFZDnDBoxDrop}
            onMatrixBoxAdd={handleMatrixBoxAdd}
            onMatrixBoxRemove={handleMatrixBoxRemove}
          />
      </div>

      {/* Box Editor Modal */}
      {editingBox && (
        <BoxEditorModal
          box={editingBox.box}
          sectionIdx={editingBox.sectionIdx}
          boxIdx={editingBox.boxIdx}
          plays={playsArray}
          gamePlan={gamePlan}
          isLocked={isLocked}
          onClose={() => setEditingBox(null)}
          onSave={(updates) => {
            // Check if we're saving a matrix template
            if (updates._saveAsMatrixTemplate) {
              const template = updates._saveAsMatrixTemplate;
              delete updates._saveAsMatrixTemplate;
              handleUpdateGamePlan({ ...gamePlan, matrixTemplate: template });
            }
            // Filter out undefined values (Firestore rejects them)
            const cleanUpdates = Object.fromEntries(
              Object.entries(updates).filter(([_, v]) => v !== undefined)
            );
            handleUpdateSheetBox(editingBox.sectionIdx, editingBox.boxIdx, cleanUpdates);
            setEditingBox(null);
          }}
          onDelete={handleDeleteSheetBox}
          onAddPlayToQuickList={handleAddPlayToQuickList}
          onRemovePlayFromQuickList={handleRemovePlayFromQuickList}
          onReorderQuickList={handleReorderQuickList}
          onAssignPlayToCell={handleAssignPlayToCell}
          onRemovePlayFromCell={handleRemovePlayFromCell}
          getPlaysForSet={getPlaysForSet}
          getPlayDisplayName={getPlayDisplayName}
          setupConfig={setupConfig}
          onFZDnDCellAssign={handleFZDnDBoxDrop}
          onFZDnDCellRemove={handleFZDnDBoxRemove}
          onMatrixCellAdd={handleMatrixBoxAdd}
          onMatrixCellRemove={handleMatrixBoxRemove}
        />
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddSectionModal(false)}
        >
          <div
            className="bg-slate-900 rounded-xl w-full max-w-md overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Add New Section</h3>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Field Zones Section */}
              <button
                onClick={() => handleAddSheetSection({ type: 'fieldZone', name: 'FIELD ZONES' })}
                className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <MapPin size={24} className="text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Field Zones</div>
                  <div className="text-sm text-slate-400">Red Zone, Gold Zone, Backed Up, etc.</div>
                </div>
              </button>

              {/* Formations Section */}
              <button
                onClick={() => handleAddSheetSection({ type: 'formations', name: 'FORMATIONS' })}
                className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Grid size={24} className="text-cyan-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Formations</div>
                  <div className="text-sm text-slate-400">Matrix boxes organized by formation</div>
                </div>
              </button>

              {/* Down & Distance Section */}
              <button
                onClick={() => handleAddSheetSection({ type: 'downDistance', name: 'DOWN & DISTANCE' })}
                className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Target size={24} className="text-amber-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Down & Distance</div>
                  <div className="text-sm text-slate-400">1st Down, 2nd & Long, 3rd & Short, etc.</div>
                </div>
              </button>

              {/* Special Situations Section */}
              <button
                onClick={() => handleAddSheetSection({ type: 'specialSituation', name: 'SPECIAL SITUATIONS' })}
                className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Zap size={24} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Special Situations</div>
                  <div className="text-sm text-slate-400">2-Min, 4-Min, Goal Line, etc.</div>
                </div>
              </button>

              {/* By Play Type Section */}
              <button
                onClick={() => handleAddSheetSection({ type: 'byPlayType', name: 'BY PLAY TYPE' })}
                className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center">
                  <Package size={24} className="text-sky-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">By Play Type</div>
                  <div className="text-sm text-slate-400">Run Game, Quick Game, Dropback, etc.</div>
                </div>
              </button>

              {/* By Player Section */}
              <button
                onClick={() => handleAddSheetSection({ type: 'byPlayer', name: 'BY PLAYER' })}
                className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users size={24} className="text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">By Player</div>
                  <div className="text-sm text-slate-400">Plays organized by featured player</div>
                </div>
              </button>

              {/* Custom Section */}
              <button
                onClick={() => handleAddSheetSection(null)}
                className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Plus size={24} className="text-slate-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Custom Section</div>
                  <div className="text-sm text-slate-400">Create a blank section with custom name</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Box Modal */}
      {showAddBoxModal && (() => {
        // Get the section type to show context-aware options
        const section = gamePlanLayouts.CALL_SHEET?.sections?.[addBoxSectionIdx];
        const sectionType = section?.sectionType;

        // Render different content based on section type
        const renderFieldZoneOptions = () => (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">Select a field zone and column type:</p>
            {(setupConfig?.fieldZones || []).length > 0 ? (
              <div className="space-y-3">
                {(setupConfig?.fieldZones || []).map(zone => (
                  <div key={zone.id} className="border border-slate-700 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center gap-3 p-3 bg-slate-800"
                      style={{ borderLeft: `4px solid ${zone.color || '#ef4444'}` }}
                    >
                      <MapPin size={18} style={{ color: zone.color || '#ef4444' }} />
                      <span className="font-semibold text-white">{zone.name}</span>
                    </div>
                    <div className="flex">
                      <button
                        onClick={() => handleCreateBox('fzdnd', { zoneId: zone.id, name: zone.name, color: zone.color, columnSource: 'downDistance' })}
                        className="flex-1 p-3 text-left hover:bg-slate-700 transition-colors border-r border-slate-700"
                      >
                        <div className="text-sm font-medium text-slate-200">By Down & Distance</div>
                        <div className="text-xs text-slate-500">{(setupConfig?.downDistanceCategories || []).length} columns</div>
                      </button>
                      <button
                        onClick={() => handleCreateBox('fzdnd', { zoneId: zone.id, name: zone.name, color: zone.color, columnSource: 'playPurpose' })}
                        className="flex-1 p-3 text-left hover:bg-slate-700 transition-colors"
                      >
                        <div className="text-sm font-medium text-slate-200">By Play Purpose</div>
                        <div className="text-xs text-slate-500">{(setupConfig?.playPurposes || []).length} columns</div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                <MapPin size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No field zones defined yet.</p>
                <p className="text-xs text-slate-500 mt-1">Add zones in Setup → Define Situations</p>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 mt-4">
              <button
                onClick={() => handleCreateBox('grid', { name: 'Custom Zone Grid' })}
                className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <Grid size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Add custom grid box instead</span>
              </button>
            </div>
          </div>
        );

        const renderDownDistanceOptions = () => (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">Select a down & distance category:</p>
            {(setupConfig?.downDistanceCategories || []).length > 0 ? (
              <div className="space-y-2">
                {(setupConfig?.downDistanceCategories || [])
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCreateBox('grid', { name: cat.name, color: cat.color || '#f59e0b' })}
                      className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color || '#f59e0b'}30` }}
                      >
                        <Target size={20} style={{ color: cat.color || '#f59e0b' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{cat.name}</div>
                        <div className="text-sm text-slate-400">Grid box for this situation</div>
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                <Target size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No down & distance categories defined.</p>
                <p className="text-xs text-slate-500 mt-1">Add categories in Setup → Define Situations</p>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 mt-4">
              <button
                onClick={() => handleCreateBox('grid', { name: 'Custom Grid' })}
                className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <Grid size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Add custom grid box instead</span>
              </button>
            </div>
          </div>
        );

        const renderSpecialSituationOptions = () => (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">Select a special situation:</p>
            {(setupConfig?.specialSituations || []).length > 0 ? (
              <div className="space-y-2">
                {(setupConfig?.specialSituations || []).map(sit => (
                  <button
                    key={sit.id}
                    onClick={() => handleCreateBox('script', { name: sit.name, color: sit.color || '#8b5cf6' })}
                    className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${sit.color || '#8b5cf6'}30` }}
                    >
                      <Zap size={20} style={{ color: sit.color || '#8b5cf6' }} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{sit.name}</div>
                      <div className="text-sm text-slate-400">Script box for this situation</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                <Zap size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No special situations defined.</p>
                <p className="text-xs text-slate-500 mt-1">Add situations in Setup → Define Situations</p>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 mt-4 flex gap-2">
              <button
                onClick={() => handleCreateBox('script', { name: 'Custom Script' })}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <List size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Custom Script</span>
              </button>
              <button
                onClick={() => handleCreateBox('grid', { name: 'Custom Grid' })}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Grid size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Custom Grid</span>
              </button>
            </div>
          </div>
        );

        const renderByPlayTypeOptions = () => (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">Select a play purpose/type:</p>
            {(setupConfig?.playPurposes || []).length > 0 ? (
              <div className="space-y-2">
                {(setupConfig?.playPurposes || []).map(purpose => (
                  <button
                    key={purpose.id}
                    onClick={() => handleCreateBox('grid', { name: purpose.name, color: purpose.color || '#3b82f6' })}
                    className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${purpose.color || '#3b82f6'}30` }}
                    >
                      <Package size={20} style={{ color: purpose.color || '#3b82f6' }} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{purpose.name}</div>
                      {purpose.description && (
                        <div className="text-sm text-slate-400">{purpose.description}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                <Package size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No play purposes defined.</p>
                <p className="text-xs text-slate-500 mt-1">Add purposes in Setup → Define Situations</p>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 mt-4">
              <button
                onClick={() => handleCreateBox('grid', { name: 'Custom Play Type Grid' })}
                className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <Grid size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Add custom grid box instead</span>
              </button>
            </div>
          </div>
        );

        const renderByPlayerOptions = () => (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">Create a box for a specific player:</p>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-3 bg-slate-800/50">
                <div className="text-xs text-slate-500 mb-2">Enter player name or position:</div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const name = formData.get('playerName');
                  if (name) {
                    handleCreateBox('grid', { name: `${name} Plays`, color: '#22c55e' });
                  }
                }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="playerName"
                      placeholder="e.g., QB1, #7, RB Package"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-3 mt-4 flex gap-2">
              <button
                onClick={() => handleCreateBox('script', { name: 'Player Script', color: '#22c55e' })}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <List size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Player Script</span>
              </button>
              <button
                onClick={() => handleCreateBox('grid', { name: 'Player Grid', color: '#22c55e' })}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Grid size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Player Grid</span>
              </button>
            </div>
          </div>
        );

        const renderFormationsOptions = () => (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">Create a matrix box for a formation:</p>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-slate-800">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Grid size={24} className="text-cyan-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Formation Matrix</div>
                  <div className="text-sm text-slate-400">Play types × hash groups for a formation</div>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-2">Enter formation name:</div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const name = formData.get('formationName');
                  if (name) {
                    handleCreateBox('matrix', { name, color: '#06b6d4' });
                  }
                }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="formationName"
                      placeholder="e.g., 887, Trips, Empty, Gun"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-3 mt-4">
              <button
                onClick={() => handleCreateBox('grid', { name: 'Formation Grid', color: '#06b6d4' })}
                className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
              >
                <Grid size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">Add simple grid box instead</span>
              </button>
            </div>
          </div>
        );

        const renderDefaultOptions = () => (
          <div className="space-y-3">
            {/* Grid Option */}
            <button
              onClick={() => handleCreateBox('grid', { name: 'New Grid' })}
              className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Grid size={24} className="text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Grid Box</div>
                <div className="text-sm text-slate-400">Rows × columns with individual cell assignments</div>
              </div>
            </button>

            {/* Script Option */}
            <button
              onClick={() => handleCreateBox('script', { name: 'New Script' })}
              className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <List size={24} className="text-purple-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Script Box</div>
                <div className="text-sm text-slate-400">Sequential plays with left/right hash columns</div>
              </div>
            </button>

            {/* FZDnD Zone Option */}
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-slate-800">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Map size={24} className="text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">FZDnD Zone Box</div>
                  <div className="text-sm text-slate-400">Field zone grid with configurable columns</div>
                </div>
              </div>
              {(setupConfig?.fieldZones || []).length > 0 ? (
                <div className="p-2 bg-slate-800/50 border-t border-slate-700">
                  <div className="text-xs text-slate-500 mb-2 px-2">Select a zone and column type:</div>
                  <div className="space-y-2 px-1">
                    {(setupConfig?.fieldZones || []).map(zone => (
                      <div key={zone.id} className="border border-slate-600 rounded overflow-hidden">
                        <div
                          className="flex items-center gap-2 px-2 py-1 bg-slate-700/50"
                          style={{ borderLeft: `3px solid ${zone.color || '#ef4444'}` }}
                        >
                          <span className="text-xs font-medium text-white">{zone.name}</span>
                        </div>
                        <div className="flex text-xs">
                          <button
                            onClick={() => handleCreateBox('fzdnd', { zoneId: zone.id, name: zone.name, color: zone.color, columnSource: 'downDistance' })}
                            className="flex-1 px-2 py-1.5 hover:bg-slate-600 transition-colors border-r border-slate-600 text-slate-300"
                          >
                            D&D
                          </button>
                          <button
                            onClick={() => handleCreateBox('fzdnd', { zoneId: zone.id, name: zone.name, color: zone.color, columnSource: 'playPurpose' })}
                            className="flex-1 px-2 py-1.5 hover:bg-slate-600 transition-colors text-slate-300"
                          >
                            Purpose
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-800/50 border-t border-slate-700 text-center">
                  <p className="text-xs text-slate-500">No field zones defined.</p>
                  <p className="text-xs text-slate-600">Add zones in Setup → Define Situations</p>
                </div>
              )}
            </div>

            {/* Matrix Option */}
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-slate-800">
                <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center">
                  <Grid size={24} className="text-sky-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Matrix Box</div>
                  <div className="text-sm text-slate-400">Formation grid with play types × hash groups</div>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-2">Enter formation name:</div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const name = formData.get('matrixName');
                  if (name) {
                    handleCreateBox('matrix', { name });
                  }
                }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="matrixName"
                      placeholder="e.g., 887, Trips, Empty"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );

        // Get the appropriate title based on section type
        const getModalTitle = () => {
          switch (sectionType) {
            case 'fieldZone': return 'Add Field Zone Box';
            case 'downDistance': return 'Add Down & Distance Box';
            case 'specialSituation': return 'Add Special Situation Box';
            case 'byPlayType': return 'Add Play Type Box';
            case 'byPlayer': return 'Add Player Box';
            case 'formations': return 'Add Formation Box';
            default: return 'Add New Box';
          }
        };

        return (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddBoxModal(false);
              setAddBoxSectionIdx(null);
            }}
          >
            <div
              className="bg-slate-900 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">{getModalTitle()}</h3>
                <button
                  onClick={() => {
                    setShowAddBoxModal(false);
                    setAddBoxSectionIdx(null);
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - render based on section type */}
              <div className="flex-1 overflow-y-auto p-4">
                {sectionType === 'fieldZone' && renderFieldZoneOptions()}
                {sectionType === 'downDistance' && renderDownDistanceOptions()}
                {sectionType === 'specialSituation' && renderSpecialSituationOptions()}
                {sectionType === 'byPlayType' && renderByPlayTypeOptions()}
                {sectionType === 'byPlayer' && renderByPlayerOptions()}
                {sectionType === 'formations' && renderFormationsOptions()}
                {!sectionType && renderDefaultOptions()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
