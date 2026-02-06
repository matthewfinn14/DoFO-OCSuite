import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { usePlayBank } from '../context/PlayBankContext';
import { getWristbandDisplay } from '../utils/wristband';
import { getPlayCall } from '../utils/playDisplay';
import SpreadsheetView from '../components/gameplan/SpreadsheetView';
import BoxEditorModal from '../components/gameplan/BoxEditorModal';
import {
  List,
  Grid,
  Grid3X3,
  Layers,
  Printer,
  Book,
  Settings,
  X,
  Target,
  ExternalLink,
  CheckSquare,
  Undo2
} from 'lucide-react';
import '../styles/gameplan.css';

// Default game plan layouts configuration
const DEFAULT_LAYOUTS = {
  // Legacy MATRIX config - used by print templates
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
  },
  // Spreadsheet mode layout configuration
  SPREADSHEET: {
    pages: [
      {
        pageNum: 1,
        columns: 8,
        rows: 40,
        headers: [
          { id: 'h1', name: 'RUN GAME', colStart: 1, colSpan: 2, rowStart: 1, color: '#3b82f6', situationId: null },
          { id: 'h2', name: 'PASS GAME', colStart: 3, colSpan: 2, rowStart: 1, color: '#22c55e', situationId: null },
          { id: 'h3', name: 'RPO', colStart: 5, colSpan: 2, rowStart: 1, color: '#f59e0b', situationId: null },
          { id: 'h4', name: 'SCREENS', colStart: 7, colSpan: 2, rowStart: 1, color: '#8b5cf6', situationId: null }
        ]
      }
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
  const [pageOrientation, setPageOrientation] = useState('landscape'); // 'portrait' or 'landscape'
  const [editingBox, setEditingBox] = useState(null);

  // Placement choice modal state (for Add All targeting)
  const [showPlacementChoice, setShowPlacementChoice] = useState(false);
  const [pendingPlacementBox, setPendingPlacementBox] = useState(null);
  const [pendingPlacementPlays, setPendingPlacementPlays] = useState([]);

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

        // Get all header setIds from the spreadsheet layout
        const allSetIds = [];
        (gamePlanLayouts.SPREADSHEET?.pages || []).forEach(page => {
          (page.headers || []).forEach(header => {
            if (header.id) allSetIds.push(`spreadsheet_${header.id}`);
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

  // Assign play to a specific cell in spreadsheet header
  const handleAssignPlayToCell = useCallback((setId, cellIdx, column, playId) => {
    if (isLocked) return;

    // Spreadsheet headers store plays in gamePlan.sets
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex === -1) {
      const newSet = { id: setId, playIds: [], assignedPlayIds: [] };
      while (newSet.assignedPlayIds.length <= cellIdx) {
        newSet.assignedPlayIds.push(null);
      }
      newSet.assignedPlayIds[cellIdx] = playId;
      newSets.push(newSet);
    } else {
      const existingSet = { ...newSets[setIndex] };
      const assignedPlayIds = [...(existingSet.assignedPlayIds || [])];
      while (assignedPlayIds.length <= cellIdx) {
        assignedPlayIds.push(null);
      }
      assignedPlayIds[cellIdx] = playId;
      existingSet.assignedPlayIds = assignedPlayIds;
      newSets[setIndex] = existingSet;
    }
    handleUpdateGamePlan({ ...gamePlan, sets: newSets });
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Remove play from a specific cell in spreadsheet header
  const handleRemovePlayFromCell = useCallback((setId, cellIdx, column) => {
    if (isLocked) return;

    // Spreadsheet headers store plays in gamePlan.sets
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      const assignedPlayIds = [...(existingSet.assignedPlayIds || [])];
      if (assignedPlayIds[cellIdx]) {
        assignedPlayIds[cellIdx] = null;
        existingSet.assignedPlayIds = assignedPlayIds;
        newSets[setIndex] = existingSet;
        handleUpdateGamePlan({ ...gamePlan, sets: newSets });
      }
    }
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Handle FZDnD Box drop (for FZDnD boxes in SpreadsheetView)
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

  // Handle Matrix Box add (for Matrix boxes in SpreadsheetView)
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

  // Spreadsheet mode handlers
  const handleSpreadsheetHeaderClick = useCallback(({ pageIdx, header }) => {
    // Open the box editor modal for this spreadsheet section
    // We'll create a "virtual box" object that the BoxEditorModal can work with
    const spreadsheetCols = header.colSpan || 2; // How wide on the spreadsheet
    const boxCols = header.boxColumns || 1; // Internal content columns (for longer play names)
    const rows = header.rowCount || 20;

    // For matrix headers, use matrix type instead of grid
    if (header.isMatrix) {
      setEditingBox({
        box: {
          header: header.name,
          setId: `spreadsheet_${header.id}`,
          type: 'matrix',
          color: header.color,
          colSpan: spreadsheetCols,
          isSpreadsheetHeader: true,
          isMatrix: true,
          headerId: header.id,
          pageIdx,
          formationLabel: header.name,
          // Matrix-specific config
          playTypes: header.playTypes || [
            { id: 'strong_run', label: 'STRONG RUN' },
            { id: 'weak_run', label: 'WEAK RUN' },
            { id: 'quick_game', label: 'QUICK GAME' },
            { id: 'dropback', label: 'DROPBACK' }
          ],
          hashGroups: header.hashGroups || [
            { id: 'BASE', label: 'BASE', cols: ['BASE_L', 'BASE_R'] },
            { id: 'DRESS', label: 'BASE W/ DRESS', cols: ['DRESS_L', 'DRESS_R'] },
            { id: 'CONV', label: 'CONVERT', cols: ['CONV_L', 'CONV_R'] },
            { id: 'EXPL', label: 'EXPLOSIVE', cols: ['EXPL_L', 'EXPL_R'] }
          ]
        },
        sectionIdx: pageIdx,
        boxIdx: 0
      });
      return;
    }

    // Regular (non-matrix) spreadsheet header
    // Generate column headings based on boxColumns (internal layout)
    const gridHeadings = boxCols === 1
      ? ['PLAY']
      : Array(boxCols).fill('').map((_, i) => i === 0 ? 'PLAY' : `COL ${i + 1}`);

    setEditingBox({
      box: {
        header: header.name,
        setId: `spreadsheet_${header.id}`,
        type: 'grid',
        color: header.color,
        colSpan: spreadsheetCols, // Spreadsheet width
        // Use boxColumns for internal grid layout
        gridColumns: boxCols,
        gridRows: rows,
        gridHeadings,
        cornerLabel: '#',
        isSpreadsheetHeader: true,
        headerId: header.id,
        pageIdx,
        // Store original header data for saving
        rowCount: rows,
        boxColumns: boxCols,
        numbering: header.numbering
      },
      sectionIdx: pageIdx,
      boxIdx: 0
    });
  }, []);

  // Handle targeting click on spreadsheet header (shows placement choice modal)
  const handleSpreadsheetTargetingClick = useCallback(({ pageIdx, header }) => {
    // Complete targeting mode and get plays
    if (targetingMode && targetingPlays.length > 0) {
      const playIdsToAdd = completeTargeting();
      // Create a virtual box object from the header
      setPendingPlacementBox({
        header: header.name,
        setId: `spreadsheet_${header.id}`,
        isSpreadsheetHeader: true,
        headerId: header.id,
        pageIdx,
        color: header.color,
        boxColumns: header.boxColumns || 1,
        isMatrix: header.isMatrix
      });
      setPendingPlacementPlays(playIdsToAdd);
      setShowPlacementChoice(true);
      return;
    }

    // Handle local targeting mode (from Batch Add button)
    if (isTargetingBox && pendingBatchPlays.length > 0) {
      setPendingPlacementBox({
        header: header.name,
        setId: `spreadsheet_${header.id}`,
        isSpreadsheetHeader: true,
        headerId: header.id,
        pageIdx,
        color: header.color,
        boxColumns: header.boxColumns || 1,
        isMatrix: header.isMatrix
      });
      setPendingPlacementPlays([...pendingBatchPlays]);
      setShowPlacementChoice(true);

      // Reset batch state
      setIsTargetingBox(false);
      setPendingBatchPlays([]);
      cancelBatchSelect();
    }
  }, [targetingMode, targetingPlays, completeTargeting, isTargetingBox, pendingBatchPlays, cancelBatchSelect]);

  const handleSpreadsheetAddPlay = useCallback((headerId, rowIdxOrPlayTypeId, playId, hashCol) => {
    if (isLocked) return;

    // Check if this is a matrix cell add (hashCol is provided)
    if (hashCol) {
      // Matrix cell: setId pattern is spreadsheet_${headerId}_${playTypeId}_${hashCol}
      const playTypeId = rowIdxOrPlayTypeId;
      const setId = `spreadsheet_${headerId}_${playTypeId}_${hashCol}`;
      let newSets = [...(gamePlan.sets || [])];
      let setIndex = newSets.findIndex(s => s.id === setId);

      if (setIndex === -1) {
        // Create new set for this matrix cell
        newSets.push({ id: setId, playIds: [playId] });
      } else {
        // Add to existing set (matrix cells allow multiple plays)
        const existingSet = { ...newSets[setIndex] };
        if (!existingSet.playIds.includes(playId)) {
          existingSet.playIds = [...(existingSet.playIds || []), playId];
          newSets[setIndex] = existingSet;
        }
      }
      handleUpdateGamePlan({ ...gamePlan, sets: newSets });
      return;
    }

    // Regular spreadsheet add (by row index)
    const rowIdx = rowIdxOrPlayTypeId;
    const setId = `spreadsheet_${headerId}`;
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex === -1) {
      const newSet = { id: setId, playIds: [], assignedPlayIds: [] };
      while (newSet.assignedPlayIds.length <= rowIdx) {
        newSet.assignedPlayIds.push(null);
      }
      newSet.assignedPlayIds[rowIdx] = playId;
      newSets.push(newSet);
    } else {
      const existingSet = { ...newSets[setIndex] };
      const assignedPlayIds = [...(existingSet.assignedPlayIds || [])];
      while (assignedPlayIds.length <= rowIdx) {
        assignedPlayIds.push(null);
      }
      assignedPlayIds[rowIdx] = playId;
      existingSet.assignedPlayIds = assignedPlayIds;
      newSets[setIndex] = existingSet;
    }
    handleUpdateGamePlan({ ...gamePlan, sets: newSets });
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  const handleSpreadsheetRemovePlay = useCallback((headerId, rowIdxOrPlayTypeId, hashCol, playId) => {
    if (isLocked) return;

    // Check if this is a matrix cell remove (hashCol is provided)
    if (hashCol) {
      // Matrix cell: setId pattern is spreadsheet_${headerId}_${playTypeId}_${hashCol}
      const playTypeId = rowIdxOrPlayTypeId;
      const setId = `spreadsheet_${headerId}_${playTypeId}_${hashCol}`;
      let newSets = [...(gamePlan.sets || [])];
      let setIndex = newSets.findIndex(s => s.id === setId);

      if (setIndex !== -1) {
        const existingSet = { ...newSets[setIndex] };
        existingSet.playIds = (existingSet.playIds || []).filter(id => id !== playId);
        newSets[setIndex] = existingSet;
        handleUpdateGamePlan({ ...gamePlan, sets: newSets });
      }
      return;
    }

    // Regular spreadsheet remove (by row index)
    const rowIdx = rowIdxOrPlayTypeId;
    const setId = `spreadsheet_${headerId}`;
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      const assignedPlayIds = [...(existingSet.assignedPlayIds || [])];
      if (assignedPlayIds[rowIdx]) {
        assignedPlayIds[rowIdx] = null;
        existingSet.assignedPlayIds = assignedPlayIds;
        newSets[setIndex] = existingSet;
        handleUpdateGamePlan({ ...gamePlan, sets: newSets });
      }
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

  // Get wristband label for a play (with type suffix: W for WIZ, M for mini)
  const getWristbandLabel = useCallback((play) => {
    return getWristbandDisplay(play) || null;
  }, []);

  // Batch assign plays to a box
  const batchAssignPlaysToBox = useCallback(async (boxId, newPlayIds) => {
    if (!currentWeek || !newPlayIds.length || !boxId) return;

    // Check if this is a spreadsheet header (setId starts with "spreadsheet_")
    if (boxId.startsWith('spreadsheet_')) {
      // Find the spreadsheet header
      const headerId = boxId.replace('spreadsheet_', '');
      let spreadsheetHeader = null;

      const spreadsheet = gamePlanLayouts?.SPREADSHEET;
      if (spreadsheet?.pages) {
        for (const page of spreadsheet.pages) {
          const header = (page.headers || []).find(h => h.id === headerId);
          if (header) {
            spreadsheetHeader = header;
            break;
          }
        }
      }

      if (!spreadsheetHeader) return;

      // Get or create the set for this header
      const updatedGamePlan = { ...gamePlan };
      if (!updatedGamePlan.sets) updatedGamePlan.sets = [];

      let updatedSet = updatedGamePlan.sets.find(s => s.id === boxId);
      if (!updatedSet) {
        updatedSet = {
          id: boxId,
          name: spreadsheetHeader.name,
          playIds: [],
          assignedPlayIds: []
        };
        updatedGamePlan.sets.push(updatedSet);
      }

      // Calculate capacity based on rowCount and boxColumns
      const rowCount = spreadsheetHeader.rowCount || 20;
      const boxColumns = spreadsheetHeader.boxColumns || 1;
      const totalSlots = rowCount * boxColumns;

      // Get current assigned plays
      const currentAssigned = [...(updatedSet.assignedPlayIds || [])];
      while (currentAssigned.length < totalSlots) {
        currentAssigned.push(null);
      }

      // Fill empty slots with new plays
      let playIdx = 0;
      for (let i = 0; i < totalSlots && playIdx < newPlayIds.length; i++) {
        if (!currentAssigned[i]) {
          currentAssigned[i] = newPlayIds[playIdx];
          playIdx++;
        }
      }

      updatedSet.assignedPlayIds = currentAssigned;
      await handleUpdateGamePlan(updatedGamePlan);
      return;
    }

    // First find the layout box to determine type and capacity (modular callsheet)
    let layoutBox = null;
    let sectionIdx = -1;
    let boxIdx = -1;
    let layoutKey = null;

    // Search through layouts
    Object.entries(gamePlanLayouts).some(([key, layout]) => {
      return (layout.sections || []).some((section, sIdx) => {
        return (section.boxes || []).some((box, bIdx) => {
          if (box.setId === boxId) {
            layoutBox = box;
            sectionIdx = sIdx;
            boxIdx = bIdx;
            layoutKey = key;
            return true;
          }
          return false;
        });
      });
    });

    if (!layoutBox) return;

    // Find the box data (search sets and mini-scripts)
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

    // Handle Grid Box
    if (layoutBox.type === 'grid') {
      const cols = layoutBox.gridColumns || 4;
      const rows = layoutBox.gridRows || 5;
      const totalSlots = cols * rows;

      // Get current assigned plays from boxData or empty array
      const currentAssigned = [...(boxData?.assignedPlayIds || [])];

      // Ensure array is big enough
      while (currentAssigned.length < totalSlots) {
        currentAssigned.push(null);
      }

      // Track which plays were actually assigned
      const assignedPlayIds = [];
      let playIdx = 0;
      for (let i = 0; i < totalSlots && playIdx < newPlayIds.length; i++) {
        // If slot is empty or GAP
        if (!currentAssigned[i] || currentAssigned[i] === 'GAP') {
          currentAssigned[i] = newPlayIds[playIdx];
          assignedPlayIds.push(newPlayIds[playIdx]);
          playIdx++;
        }
      }

      // Update the set if it exists, or create one
      const updatedGamePlan = { ...gamePlan };
      let updatedSet = updatedGamePlan.sets?.find(s => s.id === boxId);

      if (!updatedSet) {
        // Create a new set entry for this box
        if (!updatedGamePlan.sets) updatedGamePlan.sets = [];
        updatedSet = {
          id: boxId,
          name: layoutBox.header || 'New Set',
          playIds: [],
          assignedPlayIds: []
        };
        updatedGamePlan.sets.push(updatedSet);
      }

      updatedSet.assignedPlayIds = currentAssigned;
      // Remove assigned plays from Quick List (playIds) - they're now in the grid
      updatedSet.playIds = (updatedSet.playIds || []).filter(id => !assignedPlayIds.includes(id));

      await handleUpdateGamePlan(updatedGamePlan);
    }
    // Handle Script Box
    else if (layoutBox.type === 'script') {
      // Scripts store data in layoutBox.rows
      const scriptRows = [...(layoutBox.rows || [])];
      const scriptColumns = layoutBox.scriptColumns || 2;

      // Track which plays were actually assigned
      const assignedPlayIds = [];
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
          assignedPlayIds.push(newPlayIds[playIdx]);
          playIdx++;
        }

        // Fill right column if empty and using 2 columns
        if (playIdx < newPlayIds.length && scriptColumns === 2 && !scriptRows[r].contentRight) {
          scriptRows[r] = { ...scriptRows[r], contentRight: newPlayIds[playIdx] };
          assignedPlayIds.push(newPlayIds[playIdx]);
          playIdx++;
        }
      }

      // Update layout box using the layoutKey we already found
      const newLayouts = { ...gamePlanLayouts };
      if (layoutKey) {
        newLayouts[layoutKey].sections[sectionIdx].boxes[boxIdx].rows = scriptRows;
        await handleUpdateLayouts(newLayouts);
      }

      // Update the set - remove assigned plays from Quick List
      const updatedGamePlan = { ...gamePlan };
      let updatedSet = updatedGamePlan.sets?.find(s => s.id === boxId);

      if (updatedSet) {
        // Remove assigned plays from Quick List (playIds) - they're now in the script
        updatedSet.playIds = (updatedSet.playIds || []).filter(id => !assignedPlayIds.includes(id));
        await handleUpdateGamePlan(updatedGamePlan);
      }
    }
    // Handle other box types (fzdnd, matrix, etc.) - add plays to set if it exists
    else if (boxData) {
      const updatedGamePlan = { ...gamePlan };
      const updatedSet = updatedGamePlan.sets?.find(s => s.id === boxId);
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

  // Add plays to quicklist only (not grid slots)
  const addPlaysToQuicklistOnly = useCallback(async (boxId, newPlayIds) => {
    if (!currentWeek || !newPlayIds.length || !boxId) return;

    const updatedGamePlan = { ...gamePlan };
    let updatedSet = updatedGamePlan.sets?.find(s => s.id === boxId);

    // Find the layout box to get the header name
    let boxHeader = 'New Set';

    // Check spreadsheet headers first
    if (boxId.startsWith('spreadsheet_')) {
      const headerId = boxId.replace('spreadsheet_', '');
      const spreadsheet = gamePlanLayouts?.SPREADSHEET;
      if (spreadsheet?.pages) {
        for (const page of spreadsheet.pages) {
          const header = (page.headers || []).find(h => h.id === headerId);
          if (header) {
            boxHeader = header.name || 'New Set';
            break;
          }
        }
      }
    } else {
      // Check modular callsheet layouts
      Object.values(gamePlanLayouts).some(layout => {
        return (layout.sections || []).some(section => {
          return (section.boxes || []).some(box => {
            if (box.setId === boxId) {
              boxHeader = box.header || 'New Set';
              return true;
            }
            return false;
          });
        });
      });
    }

    if (!updatedSet) {
      // Create a new set entry for this box
      if (!updatedGamePlan.sets) updatedGamePlan.sets = [];
      updatedSet = {
        id: boxId,
        name: boxHeader,
        playIds: []
      };
      updatedGamePlan.sets.push(updatedSet);
    }

    // Add plays to the set's playIds
    const currentPlayIds = updatedSet.playIds || [];
    const newIdsToAdd = newPlayIds.filter(id => !currentPlayIds.includes(id));
    if (newIdsToAdd.length > 0) {
      updatedSet.playIds = [...currentPlayIds, ...newIdsToAdd];
      await handleUpdateGamePlan(updatedGamePlan);
    }
  }, [currentWeek, gamePlan, gamePlanLayouts, handleUpdateGamePlan]);

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

            {/* Edit Layout Button */}
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
        <SpreadsheetView
          layouts={gamePlanLayouts}
          gamePlan={gamePlan}
          plays={playsArray}
          currentWeek={currentWeek}
          teamLogo={teamLogo}
          isLocked={isLocked}
          isEditing={isSheetEditing}
          pageFormat={pageFormat}
          pageOrientation={pageOrientation}
          onUpdateLayouts={handleUpdateLayouts}
          onHeaderClick={handleSpreadsheetHeaderClick}
          onAddPlayToSection={handleSpreadsheetAddPlay}
          onRemovePlayFromSection={handleSpreadsheetRemovePlay}
          getPlayDisplayName={getPlayDisplayName}
          setupConfig={setupConfig}
          isTargetingMode={targetingMode || isTargetingBox}
          targetingPlayCount={targetingMode ? targetingPlays.length : pendingBatchPlays.length}
          onTargetingClick={handleSpreadsheetTargetingClick}
        />
      </div>

      {/* Placement Choice Modal */}
      {showPlacementChoice && pendingPlacementBox && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-slate-700">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Add {pendingPlacementPlays.length} Plays</h3>
              <p className="text-sm text-slate-400 mt-1">
                Where would you like to add plays to "{pendingPlacementBox.header}"?
              </p>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              {/* Grid Option */}
              <button
                onClick={async () => {
                  await batchAssignPlaysToBox(pendingPlacementBox.setId, pendingPlacementPlays);
                  setShowPlacementChoice(false);
                  setPendingPlacementBox(null);
                  setPendingPlacementPlays([]);
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center">
                  <Grid3X3 size={24} className="text-sky-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Assign to Grid</div>
                  <div className="text-sm text-slate-400">Place plays directly into grid cells</div>
                </div>
              </button>

              {/* Quicklist Option */}
              <button
                onClick={async () => {
                  await addPlaysToQuicklistOnly(pendingPlacementBox.setId, pendingPlacementPlays);
                  setShowPlacementChoice(false);
                  setPendingPlacementBox(null);
                  setPendingPlacementPlays([]);
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600 text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <List size={24} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Stage in Quick List</div>
                  <div className="text-sm text-slate-400">Add to sidebar for manual placement later</div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  setShowPlacementChoice(false);
                  setPendingPlacementBox(null);
                  setPendingPlacementPlays([]);
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

            // Handle spreadsheet headers differently - update the header in SPREADSHEET layout
            if (editingBox.box.isSpreadsheetHeader) {
              const headerId = editingBox.box.headerId;
              const pageIdx = editingBox.box.pageIdx;
              const newLayouts = { ...gamePlanLayouts };
              const spreadsheet = { ...newLayouts.SPREADSHEET };
              const pages = [...spreadsheet.pages];

              pages[pageIdx] = {
                ...pages[pageIdx],
                headers: pages[pageIdx].headers.map(h =>
                  h.id === headerId ? {
                    ...h,
                    name: cleanUpdates.header || h.name,
                    color: cleanUpdates.color || h.color,
                    colSpan: cleanUpdates.colSpan !== undefined ? cleanUpdates.colSpan : h.colSpan,
                    // Save boxColumns from gridColumns (modal uses gridColumns internally)
                    boxColumns: cleanUpdates.gridColumns !== undefined ? cleanUpdates.gridColumns : h.boxColumns,
                    // Save rowCount from gridRows (modal uses gridRows internally)
                    rowCount: cleanUpdates.gridRows !== undefined ? cleanUpdates.gridRows : h.rowCount,
                    numbering: cleanUpdates.numbering !== undefined ? cleanUpdates.numbering : h.numbering,
                    // Matrix-specific: save playTypes and hashGroups for adding/removing rows/columns
                    playTypes: cleanUpdates.playTypes !== undefined ? cleanUpdates.playTypes : h.playTypes,
                    hashGroups: cleanUpdates.hashGroups !== undefined ? cleanUpdates.hashGroups : h.hashGroups
                  } : h
                )
              };

              spreadsheet.pages = pages;
              newLayouts.SPREADSHEET = spreadsheet;
              handleUpdateLayouts(newLayouts);
            }
            setEditingBox(null);
          }}
          onDelete={() => {
            // Handle spreadsheet header deletion
            if (editingBox.box.isSpreadsheetHeader) {
              const headerId = editingBox.box.headerId;
              const pageIdx = editingBox.box.pageIdx;
              const newLayouts = { ...gamePlanLayouts };
              const spreadsheet = { ...newLayouts.SPREADSHEET };
              const pages = [...spreadsheet.pages];

              pages[pageIdx] = {
                ...pages[pageIdx],
                headers: pages[pageIdx].headers.filter(h => h.id !== headerId)
              };

              spreadsheet.pages = pages;
              newLayouts.SPREADSHEET = spreadsheet;
              handleUpdateLayouts(newLayouts);
            }
          }}
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
    </div>
  );
}
