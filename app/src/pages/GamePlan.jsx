import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { getWristbandDisplay } from '../utils/wristband';
import SheetView from '../components/gameplan/SheetView';
import FZDnDView from '../components/gameplan/FZDnDView';
import MatrixView from '../components/gameplan/MatrixView';
import InstallView from '../components/gameplan/InstallView';
import PlayerView from '../components/gameplan/PlayerView';
import BoxEditorModal from '../components/gameplan/BoxEditorModal';
import {
  List,
  Grid,
  Map,
  Printer,
  Lock,
  Unlock,
  Book,
  Settings,
  X,
  Plus,
  Target,
  MapPin,
  Zap,
  Package,
  Users,
  ExternalLink
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
  const {
    playsArray,
    currentWeek,
    updateWeek,
    settings,
    setupConfig,
    roster,
    depthCharts
  } = useSchool();

  // View state
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet', 'fzdnd', 'matrix'
  const [isLocked, setIsLocked] = useState(false);
  const [isSheetEditing, setIsSheetEditing] = useState(false);
  const [editingBox, setEditingBox] = useState(null);

  // Collapse state for FZDnD rows
  const [collapsedFZDnDRows, setCollapsedFZDnDRows] = useState(new Set());

  // Collapse state for Matrix
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [collapsedHashColumns, setCollapsedHashColumns] = useState(new Set());
  const [collapsedRows, setCollapsedRows] = useState(new Set());
  const [editingFormationId, setEditingFormationId] = useState(null);

  // Drag state for Sheet view
  const [draggedCell, setDraggedCell] = useState(null);
  const [playDragOverBox, setPlayDragOverBox] = useState(null);

  // Add Section modal state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

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

  // Update layouts in current week
  const handleUpdateLayouts = useCallback((newLayouts) => {
    if (!currentWeek) return;
    updateWeek(currentWeek.id, { gamePlanLayouts: newLayouts });
  }, [currentWeek, updateWeek]);

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

  // Handle play drop on FZDnD cell
  const handleFZDnDDrop = useCallback((zoneId, rowIdx, colIdx, playId) => {
    if (isLocked) return;
    const setId = `fzdnd_${zoneId}_${colIdx}`;
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

  // Remove play from FZDnD cell
  const handleRemoveFromFZDnD = useCallback((zoneId, rowIdx, colIdx) => {
    if (isLocked) return;
    const setId = `fzdnd_${zoneId}_${colIdx}`;
    let newSets = [...(gamePlan.sets || [])];
    let setIndex = newSets.findIndex(s => s.id === setId);

    if (setIndex !== -1) {
      const existingSet = { ...newSets[setIndex] };
      existingSet.playIds[rowIdx] = null;
      newSets[setIndex] = existingSet;
      handleUpdateGamePlan({ ...gamePlan, sets: newSets });
    }
  }, [gamePlan, handleUpdateGamePlan, isLocked]);

  // Toggle FZDnD row collapse
  const toggleFZDnDRow = useCallback((zoneId, rowIdx) => {
    const rowKey = `${zoneId}_${rowIdx}`;
    setCollapsedFZDnDRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  }, []);

  // Update zone notes
  const updateZoneNote = useCallback((zoneId, note) => {
    const newNotes = { ...(gamePlan.zoneNotes || {}) };
    newNotes[zoneId] = note;
    handleUpdateGamePlan({ ...gamePlan, zoneNotes: newNotes });
  }, [gamePlan, handleUpdateGamePlan]);

  // Update custom zone settings
  const updateCustomZone = useCallback((zoneId, updates) => {
    const newCustomZones = { ...(gamePlan.customZones || {}) };
    newCustomZones[zoneId] = { ...newCustomZones[zoneId], ...updates };
    handleUpdateGamePlan({ ...gamePlan, customZones: newCustomZones });
  }, [gamePlan, handleUpdateGamePlan]);

  // Update custom column names
  const updateCustomColumns = useCallback((zoneId, colIdx, value) => {
    const newCustomCols = { ...(gamePlan.customColumns || {}) };
    newCustomCols[zoneId] = { ...(newCustomCols[zoneId] || {}), [colIdx]: value };
    handleUpdateGamePlan({ ...gamePlan, customColumns: newCustomCols });
  }, [gamePlan, handleUpdateGamePlan]);

  // Matrix toggle functions
  const toggleGroup = useCallback((groupId) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const toggleHashColumn = useCallback((groupId, direction) => {
    const key = `${groupId}_${direction}`;
    setCollapsedHashColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const toggleRow = useCallback((playTypeId) => {
    setCollapsedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playTypeId)) {
        newSet.delete(playTypeId);
      } else {
        newSet.add(playTypeId);
      }
      return newSet;
    });
  }, []);

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
  const handleAddSheetSection = useCallback((situation = null) => {
    const newSection = {
      title: situation ? situation.name.toUpperCase() : 'New Section',
      expandToFill: false,
      situationId: situation?.id || null,
      situationType: situation?.type || null,
      boxes: situation ? [
        {
          header: situation.name,
          setId: `section_${situation.id}_${Date.now()}`,
          type: 'grid',
          colSpan: 5,
          color: situation.color || '#3b82f6',
          gridColumns: 4,
          gridRows: 5,
          gridHeadings: ['LEFT HASH', 'COL 2', 'COL 3', 'NOTES'],
          cornerLabel: '#'
        }
      ] : []
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

  const handleAddSheetBox = useCallback((sectionIdx) => {
    const newBox = {
      header: 'New Box',
      setId: `box_${Date.now()}`,
      type: 'grid',
      colSpan: 3,
      color: '#3b82f6',
      gridColumns: 3,
      gridRows: 4,
      gridHeadings: ['COL 1', 'COL 2', 'COL 3'],
      cornerLabel: '#'
    };
    const newLayouts = { ...gamePlanLayouts };
    const section = { ...newLayouts.CALL_SHEET.sections[sectionIdx] };
    section.boxes = [...(section.boxes || []), newBox];
    newLayouts.CALL_SHEET.sections[sectionIdx] = section;
    handleUpdateLayouts(newLayouts);
  }, [gamePlanLayouts, handleUpdateLayouts]);

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

  // Handle box drop (reordering)
  const handleSheetBoxDrop = useCallback((e, targetSectionIdx, targetBoxIdx) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for play drop from Play Bank
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/react-dnd'));
      if (data && data.playId) {
        // Find the box at target position
        const section = gamePlanLayouts.CALL_SHEET.sections[targetSectionIdx];
        const box = section?.boxes?.[targetBoxIdx];
        if (box && box.setId) {
          handleAddPlayToSet(box.setId, data.playId);
        }
        setPlayDragOverBox(null);
        return;
      }
    } catch (err) {
      // Not a play drop, continue with box reordering
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

  // Get play display name
  const getPlayDisplayName = useCallback((play) => {
    if (!play) return '';
    return play.name || play.playCall || '';
  }, []);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // No week selected
  if (!currentWeek) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-4">Game Plan</h1>
        <div className="bg-slate-900 rounded-lg p-8 text-center">
          <Book size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Week Selected</h3>
          <p className="text-slate-500">
            Select a week from the sidebar to build your game plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Game Plan</h1>
            <p className="text-slate-400 text-sm">
              {currentWeek.name}
              {currentWeek.opponent && ` vs. ${currentWeek.opponent}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Lock Toggle */}
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isLocked
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
              title={isLocked ? 'Unlock editing' : 'Lock editing'}
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              <span className="text-sm">{isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>

            {/* Print Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700"
              >
                <Printer size={16} />
                <span className="text-sm">Print</span>
              </button>
              <Link
                to="/print?template=game_plan"
                className="p-2 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800"
                title="Open in Print Center"
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'sheet'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <List size={16} />
            <span className="text-sm font-medium">Situations & Scripts</span>
          </button>
          <button
            onClick={() => setActiveTab('fzdnd')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'fzdnd'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Map size={16} />
            <span className="text-sm font-medium">FZDnD</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'matrix'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Grid size={16} />
            <span className="text-sm font-medium">Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('byPlayType')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'byPlayType'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Package size={16} />
            <span className="text-sm font-medium">By Play Type</span>
          </button>
          <button
            onClick={() => setActiveTab('byPlayer')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'byPlayer'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users size={16} />
            <span className="text-sm font-medium">By Player</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-slate-950">
        {activeTab === 'sheet' && (
          <SheetView
            layouts={gamePlanLayouts}
            gamePlan={gamePlan}
            plays={playsArray}
            currentWeek={currentWeek}
            teamLogo={teamLogo}
            isLocked={isLocked}
            isEditing={isSheetEditing}
            onToggleEditing={() => setIsSheetEditing(!isSheetEditing)}
            onUpdateLayouts={handleUpdateLayouts}
            onAddSection={() => setShowAddSectionModal(true)}
            onUpdateSection={handleUpdateSheetSection}
            onDeleteSection={handleDeleteSheetSection}
            onAddBox={handleAddSheetBox}
            onDeleteBox={handleDeleteSheetBox}
            onUpdateBox={handleUpdateSheetBox}
            onBoxDrop={handleSheetBoxDrop}
            onAddPlayToSet={handleAddPlayToSet}
            onRemovePlayFromSet={handleRemovePlayFromSet}
            getPlaysForSet={getPlaysForSet}
            getGridPlays={getGridPlays}
            getWristbandLabel={getWristbandLabel}
            getPlayDisplayName={getPlayDisplayName}
            draggedCell={draggedCell}
            setDraggedCell={setDraggedCell}
            playDragOverBox={playDragOverBox}
            setPlayDragOverBox={setPlayDragOverBox}
            onEditBox={setEditingBox}
          />
        )}

        {activeTab === 'fzdnd' && (
          <FZDnDView
            layouts={gamePlanLayouts}
            gamePlan={gamePlan}
            plays={playsArray}
            currentWeek={currentWeek}
            teamLogo={teamLogo}
            isLocked={isLocked}
            collapsedRows={collapsedFZDnDRows}
            onToggleRow={toggleFZDnDRow}
            onDrop={handleFZDnDDrop}
            onRemove={handleRemoveFromFZDnD}
            onUpdateZoneNote={updateZoneNote}
            onUpdateCustomZone={updateCustomZone}
            onUpdateCustomColumns={updateCustomColumns}
            onAddPlayToSet={handleAddPlayToSet}
            getWristbandLabel={getWristbandLabel}
          />
        )}

        {activeTab === 'matrix' && (
          <MatrixView
            layouts={gamePlanLayouts}
            gamePlan={gamePlan}
            plays={playsArray}
            isLocked={isLocked}
            collapsedGroups={collapsedGroups}
            collapsedHashColumns={collapsedHashColumns}
            collapsedRows={collapsedRows}
            editingFormationId={editingFormationId}
            onToggleGroup={toggleGroup}
            onToggleHashColumn={toggleHashColumn}
            onToggleRow={toggleRow}
            onEditFormation={setEditingFormationId}
            onUpdateFormationName={handleUpdateFormationName}
            onAddPlayToSet={handleAddPlayToSet}
            onRemovePlayFromSet={handleRemovePlayFromSet}
            getWristbandLabel={getWristbandLabel}
          />
        )}

        {activeTab === 'byPlayType' && (
          <InstallView
            currentWeek={currentWeek}
            plays={playsArray}
            gamePlan={gamePlan}
            setupConfig={setupConfig}
            isLocked={isLocked}
            onUpdateGamePlan={handleUpdateGamePlan}
            getWristbandLabel={getWristbandLabel}
          />
        )}

        {activeTab === 'byPlayer' && (
          <PlayerView
            currentWeek={currentWeek}
            plays={playsArray}
            gamePlan={gamePlan}
            roster={roster}
            depthCharts={depthCharts}
            setupConfig={setupConfig}
            isLocked={isLocked}
            onUpdateGamePlan={handleUpdateGamePlan}
            getWristbandLabel={getWristbandLabel}
          />
        )}
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
            handleUpdateSheetBox(editingBox.sectionIdx, editingBox.boxIdx, updates);
            setEditingBox(null);
          }}
          onAddPlayToQuickList={handleAddPlayToQuickList}
          onRemovePlayFromQuickList={handleRemovePlayFromQuickList}
          onReorderQuickList={handleReorderQuickList}
          onAssignPlayToCell={handleAssignPlayToCell}
          onRemovePlayFromCell={handleRemovePlayFromCell}
          getPlaysForSet={getPlaysForSet}
          getWristbandLabel={getWristbandLabel}
        />
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddSectionModal(false)}
        >
          <div
            className="bg-slate-900 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
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
            <div className="flex-1 overflow-y-auto p-4">
              {/* Custom Section Option */}
              <div className="mb-6">
                <button
                  onClick={() => handleAddSheetSection(null)}
                  className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Plus size={24} className="text-slate-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Custom Section</div>
                    <div className="text-sm text-slate-400">Create a blank section with custom name</div>
                  </div>
                </button>
              </div>

              {/* Pre-defined Situations */}
              {availableSituations.length > 0 ? (
                <>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    From Your Defined Situations
                  </div>

                  {/* Field Zones */}
                  {(setupConfig?.fieldZones || []).length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <MapPin size={14} />
                        <span>Field Zones</span>
                      </div>
                      <div className="space-y-2">
                        {(setupConfig?.fieldZones || []).map(zone => (
                          <button
                            key={zone.id}
                            onClick={() => handleAddSheetSection({
                              id: zone.id,
                              name: zone.name,
                              color: zone.color || '#ef4444',
                              type: 'fieldZone'
                            })}
                            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: zone.color || '#ef4444' }}
                            />
                            <span className="text-white font-medium">{zone.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Down & Distance Categories */}
                  {(setupConfig?.downDistanceCategories || []).length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <Target size={14} />
                        <span>Down & Distance</span>
                      </div>
                      <div className="space-y-2">
                        {(setupConfig?.downDistanceCategories || []).map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => handleAddSheetSection({
                              id: cat.id,
                              name: cat.name,
                              color: cat.color || '#f59e0b',
                              type: 'downDistance'
                            })}
                            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color || '#f59e0b' }}
                            />
                            <span className="text-white font-medium">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Situations */}
                  {(setupConfig?.specialSituations || []).length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <Zap size={14} />
                        <span>Special Situations</span>
                      </div>
                      <div className="space-y-2">
                        {(setupConfig?.specialSituations || []).map(sit => (
                          <button
                            key={sit.id}
                            onClick={() => handleAddSheetSection({
                              id: sit.id,
                              name: sit.name,
                              color: sit.color || '#8b5cf6',
                              type: 'specialSituation'
                            })}
                            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: sit.color || '#8b5cf6' }}
                            />
                            <span className="text-white font-medium">{sit.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <Target size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No situations defined yet.</p>
                  <p className="text-xs mt-1">
                    Add situations in Offense Setup → Define Situations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
