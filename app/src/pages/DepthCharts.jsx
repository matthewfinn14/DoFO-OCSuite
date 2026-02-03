import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Users,
  Plus,
  Printer,
  X,
  Search,
  Grid3X3,
  Move,
  Lock,
  Unlock,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Minus,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { generateDepthChartPositions, CANONICAL_OFFENSE_POSITIONS } from '../utils/depthChartPositions';
import DepthChartPrint from '../components/print/templates/DepthChartPrint';
import '../styles/print-center.css';

// Use canonical offense positions from the shared utility
// This ensures depth chart positions match Setup.jsx's core 11 positions
const DEFAULT_OFFENSE_POSITIONS = CANONICAL_OFFENSE_POSITIONS;

// Depth chart types
const DEPTH_CHART_TYPES = [
  { id: 'offense', label: 'Offense' },
  { id: 'defense', label: 'Defense' },
  { id: 'kickoff', label: 'Kickoff' },
  { id: 'kickoff_return', label: 'KO Return' },
  { id: 'punt', label: 'Punt' },
  { id: 'punt_return', label: 'Punt Return' },
  { id: 'field_goal', label: 'Field Goal' },
  { id: 'pat', label: 'PAT' }
];

// Default positions for grid view
const DEFAULT_POSITIONS = {
  offense: [
    { id: 'QB', label: 'QB', depth: 3 },
    { id: 'RB', label: 'RB', depth: 3 },
    { id: 'FB', label: 'FB', depth: 2 },
    { id: 'WR1', label: 'WR (X)', depth: 3 },
    { id: 'WR2', label: 'WR (Z)', depth: 3 },
    { id: 'WR3', label: 'Slot', depth: 3 },
    { id: 'TE', label: 'TE', depth: 3 },
    { id: 'LT', label: 'LT', depth: 2 },
    { id: 'LG', label: 'LG', depth: 2 },
    { id: 'C', label: 'C', depth: 2 },
    { id: 'RG', label: 'RG', depth: 2 },
    { id: 'RT', label: 'RT', depth: 2 }
  ],
  defense: [
    { id: 'DE1', label: 'DE', depth: 2 },
    { id: 'DT1', label: 'DT', depth: 2 },
    { id: 'NT', label: 'NT', depth: 2 },
    { id: 'DE2', label: 'DE', depth: 2 },
    { id: 'OLB1', label: 'OLB', depth: 2 },
    { id: 'MLB', label: 'MLB', depth: 2 },
    { id: 'OLB2', label: 'OLB', depth: 2 },
    { id: 'CB1', label: 'CB', depth: 2 },
    { id: 'CB2', label: 'CB', depth: 2 },
    { id: 'FS', label: 'FS', depth: 2 },
    { id: 'SS', label: 'SS', depth: 2 }
  ],
  kickoff: [
    { id: 'K', label: 'K', depth: 1 },
    { id: 'L1', label: 'L1', depth: 1 },
    { id: 'L2', label: 'L2', depth: 1 },
    { id: 'L3', label: 'L3', depth: 1 },
    { id: 'L4', label: 'L4', depth: 1 },
    { id: 'L5', label: 'L5', depth: 1 },
    { id: 'R1', label: 'R1', depth: 1 },
    { id: 'R2', label: 'R2', depth: 1 },
    { id: 'R3', label: 'R3', depth: 1 },
    { id: 'R4', label: 'R4', depth: 1 },
    { id: 'R5', label: 'R5', depth: 1 }
  ],
  kickoff_return: [
    { id: 'KR1', label: 'KR1', depth: 2 },
    { id: 'KR2', label: 'KR2', depth: 2 },
    { id: 'FL1', label: 'FL1', depth: 1 },
    { id: 'FL2', label: 'FL2', depth: 1 },
    { id: 'FL3', label: 'FL3', depth: 1 },
    { id: 'FL4', label: 'FL4', depth: 1 },
    { id: 'FL5', label: 'FL5', depth: 1 },
    { id: 'FR1', label: 'FR1', depth: 1 },
    { id: 'FR2', label: 'FR2', depth: 1 },
    { id: 'FR3', label: 'FR3', depth: 1 },
    { id: 'FR4', label: 'FR4', depth: 1 }
  ],
  punt: [
    { id: 'P', label: 'P', depth: 1 },
    { id: 'LS', label: 'LS', depth: 1 },
    { id: 'PP', label: 'PP', depth: 1 },
    { id: 'PW1', label: 'Wing L', depth: 1 },
    { id: 'PW2', label: 'Wing R', depth: 1 },
    { id: 'PG1', label: 'Guard L', depth: 1 },
    { id: 'PG2', label: 'Guard R', depth: 1 },
    { id: 'PT1', label: 'Tackle L', depth: 1 },
    { id: 'PT2', label: 'Tackle R', depth: 1 },
    { id: 'PGN1', label: 'Gunner L', depth: 1 },
    { id: 'PGN2', label: 'Gunner R', depth: 1 }
  ],
  punt_return: [
    { id: 'PR', label: 'PR', depth: 2 },
    { id: 'PRB1', label: 'Blocker 1', depth: 1 },
    { id: 'PRB2', label: 'Blocker 2', depth: 1 },
    { id: 'PRB3', label: 'Blocker 3', depth: 1 },
    { id: 'PRB4', label: 'Blocker 4', depth: 1 },
    { id: 'PRB5', label: 'Blocker 5', depth: 1 },
    { id: 'PRB6', label: 'Blocker 6', depth: 1 },
    { id: 'PRB7', label: 'Blocker 7', depth: 1 },
    { id: 'PRB8', label: 'Blocker 8', depth: 1 },
    { id: 'PRB9', label: 'Blocker 9', depth: 1 },
    { id: 'PRB10', label: 'Blocker 10', depth: 1 }
  ],
  field_goal: [
    { id: 'FGK', label: 'Kicker', depth: 1 },
    { id: 'FGH', label: 'Holder', depth: 1 },
    { id: 'FGLS', label: 'Long Snap', depth: 1 },
    { id: 'FGL1', label: 'Guard L', depth: 1 },
    { id: 'FGL2', label: 'Tackle L', depth: 1 },
    { id: 'FGL3', label: 'Wing L', depth: 1 },
    { id: 'FGR1', label: 'Guard R', depth: 1 },
    { id: 'FGR2', label: 'Tackle R', depth: 1 },
    { id: 'FGR3', label: 'Wing R', depth: 1 },
    { id: 'FGU1', label: 'Upback L', depth: 1 },
    { id: 'FGU2', label: 'Upback R', depth: 1 }
  ],
  pat: [
    { id: 'PATK', label: 'Kicker', depth: 1 },
    { id: 'PATH', label: 'Holder', depth: 1 },
    { id: 'PATLS', label: 'Long Snap', depth: 1 },
    { id: 'PATL1', label: 'Guard L', depth: 1 },
    { id: 'PATL2', label: 'Tackle L', depth: 1 },
    { id: 'PATL3', label: 'Wing L', depth: 1 },
    { id: 'PATR1', label: 'Guard R', depth: 1 },
    { id: 'PATR2', label: 'Tackle R', depth: 1 },
    { id: 'PATR3', label: 'Wing R', depth: 1 },
    { id: 'PATU1', label: 'Upback L', depth: 1 },
    { id: 'PATU2', label: 'Upback R', depth: 1 }
  ]
};

// Canvas dimensions: 11" x 4.25" at 96 DPI = 1056 x 408 pixels
// This allows offense + defense to stack on an 11x8.5 landscape sheet
const CANVAS_WIDTH = 1056;
const CANVAS_HEIGHT = 408;

// Default formation coordinates for common position types
// Used as fallback when no saved layout exists
// Coordinates scaled for 1056x408 canvas (11" x 4.25")
// LOS at y=60, O-Line grouped tightly in center, skill positions spread out
const DEFAULT_POSITION_COORDS = {
  // OL - tightly grouped in center at LOS (y=60)
  LT: { x: 428, y: 60 },
  LG: { x: 478, y: 60 },
  C: { x: 528, y: 60 },
  RG: { x: 578, y: 60 },
  RT: { x: 628, y: 60 },
  // Backfield - stacked behind center
  QB: { x: 528, y: 140 },
  RB: { x: 528, y: 280 },
  FB: { x: 528, y: 210 },
  // Skill positions - spread wide
  TE: { x: 728, y: 60 },       // Inline TE right of RT
  X: { x: 100, y: 60 },        // Split end far left
  Y: { x: 728, y: 60 },        // Y at TE spot
  Z: { x: 920, y: 100 },       // Flanker off line right
  H: { x: 200, y: 100 },       // Slot/H-back off line left
  F: { x: 440, y: 210 },       // F-back offset
  A: { x: 350, y: 140 },       // Adjuster position
  // Generic WR positions
  WR: { x: 100, y: 60 },
  WR2: { x: 920, y: 100 },
  WR3: { x: 200, y: 100 },
  // Slot positions
  Slot: { x: 200, y: 100 }
};

// Default formation layouts (x, y coordinates for formation view)
// Scaled for 1056x408 canvas (11" x 4.25")
// LOS at y=40, O-Line tightly grouped (50px spacing), skill positions spread wide
const DEFAULT_FORMATION_LAYOUTS = {
  offense: [
    { id: 'X', label: 'X', x: 100, y: 60 },
    { id: 'LT', label: 'LT', x: 428, y: 60 },
    { id: 'LG', label: 'LG', x: 478, y: 60 },
    { id: 'C', label: 'C', x: 528, y: 60 },
    { id: 'RG', label: 'RG', x: 578, y: 60 },
    { id: 'RT', label: 'RT', x: 628, y: 60 },
    { id: 'Y', label: 'Y', x: 728, y: 60 },
    { id: 'Z', label: 'Z', x: 920, y: 100 },
    { id: 'H', label: 'H', x: 200, y: 100 },
    { id: 'QB', label: 'QB', x: 528, y: 140 },
    { id: 'RB', label: 'RB', x: 528, y: 280 },
    { id: 'FB', label: 'FB', x: 528, y: 210 }
  ],
  defense: [
    // Flipped so LOS is at bottom - defense faces offense when printed together
    { id: 'FS', label: 'FS', x: 440, y: 60 },
    { id: 'SS', label: 'SS', x: 616, y: 60 },
    { id: 'CB1', label: 'CB', x: 100, y: 140 },
    { id: 'CB2', label: 'CB', x: 956, y: 140 },
    { id: 'OLB1', label: 'OLB', x: 200, y: 240 },
    { id: 'MLB', label: 'MLB', x: 528, y: 220 },
    { id: 'OLB2', label: 'OLB', x: 856, y: 240 },
    { id: 'DE1', label: 'DE', x: 320, y: 340 },
    { id: 'DT1', label: 'DT', x: 448, y: 340 },
    { id: 'NT', label: 'NT', x: 528, y: 340 },
    { id: 'DT2', label: 'DT', x: 608, y: 340 },
    { id: 'DE2', label: 'DE', x: 736, y: 340 }
  ],
  kickoff: [
    // Flipped - kicker at top, coverage team at bottom near LOS
    { id: 'K', label: 'K', x: 528, y: 60 },
    { id: 'L1', label: 'L1', x: 168, y: 340 },
    { id: 'L2', label: 'L2', x: 248, y: 340 },
    { id: 'L3', label: 'L3', x: 328, y: 340 },
    { id: 'L4', label: 'L4', x: 408, y: 340 },
    { id: 'L5', label: 'L5', x: 488, y: 340 },
    { id: 'R1', label: 'R1', x: 568, y: 340 },
    { id: 'R2', label: 'R2', x: 648, y: 340 },
    { id: 'R3', label: 'R3', x: 728, y: 340 },
    { id: 'R4', label: 'R4', x: 808, y: 340 },
    { id: 'R5', label: 'R5', x: 888, y: 340 }
  ]
};

// Snap grid size for formation view
const SNAP_SIZE = 20;

// Formation View Component with drag-and-drop
function FormationView({
  chartType,
  depthChart,
  layout,
  roster,
  onUpdateDepthChart,
  onUpdateLayout,
  depthRowCounts,
  onUpdateDepthRowCounts,
  isLight = false,
  dynamicPositions = null
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [isLocked, setIsLocked] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [activeDepth, setActiveDepth] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set()); // Multi-select
  const [dragStartPositions, setDragStartPositions] = useState({}); // Track original positions during drag
  const [selectionBox, setSelectionBox] = useState(null); // For drag-to-select: { startX, startY, currentX, currentY }

  // Get positions with layout coordinates
  // For offense, use dynamic positions from personnel grouping
  // For other chart types, use default layouts
  const positions = useMemo(() => {
    if (chartType === 'offense' && dynamicPositions && dynamicPositions.length > 0) {
      // Use dynamic positions from personnel grouping
      // Assign coordinates from saved layout, or fall back to default coords for position type
      let slotCounter = 0; // For staggering positions without default coords
      return dynamicPositions.map((pos, index) => {
        // Check if we have a saved layout for this position
        if (layout?.[pos.id]) {
          return {
            id: pos.id,
            label: pos.label,
            x: layout[pos.id].x,
            y: layout[pos.id].y
          };
        }
        // Check if we have default coords for this position type
        // Also check label in case position was renamed (e.g., WR renamed to A)
        const defaultCoords = DEFAULT_POSITION_COORDS[pos.label] || DEFAULT_POSITION_COORDS[pos.positionType] || DEFAULT_POSITION_COORDS[pos.id];
        if (defaultCoords) {
          return {
            id: pos.id,
            label: pos.label,
            x: defaultCoords.x,
            y: defaultCoords.y
          };
        }
        // Fall back to staggered positioning for unknown positions
        slotCounter++;
        return {
          id: pos.id,
          label: pos.label,
          x: 150 + (slotCounter % 5) * 180,
          y: 180 + Math.floor(slotCounter / 5) * 70
        };
      });
    }
    // Non-offense chart types use default layouts
    const defaultLayout = DEFAULT_FORMATION_LAYOUTS[chartType] || DEFAULT_FORMATION_LAYOUTS.offense;
    return defaultLayout.map(pos => ({
      ...pos,
      x: layout?.[pos.id]?.x ?? pos.x,
      y: layout?.[pos.id]?.y ?? pos.y
    }));
  }, [chartType, layout, dynamicPositions]);

  // Get player by ID
  const getPlayer = (playerId) => roster.find(p => p.id === playerId);

  // Filter roster for selector
  const filteredRoster = useMemo(() => {
    const activeRoster = roster.filter(p => !p.archived);
    if (!searchTerm) return activeRoster;
    const search = searchTerm.toLowerCase();
    return activeRoster.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.number?.toString().includes(search) ||
      p.position?.toLowerCase().includes(search)
    );
  }, [roster, searchTerm]);

  // Handle mouse down on position
  const handleMouseDown = (e, pos) => {
    if (isLocked) return;
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    // Shift+click to toggle selection
    if (e.shiftKey) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(pos.id)) {
          newSet.delete(pos.id);
        } else {
          newSet.add(pos.id);
        }
        return newSet;
      });
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();

    // If clicking on a selected item, drag all selected items
    // If clicking on unselected item, clear selection and drag just that one
    let itemsToDrag = new Set();
    if (selectedIds.has(pos.id)) {
      itemsToDrag = new Set(selectedIds);
    } else {
      itemsToDrag = new Set([pos.id]);
      setSelectedIds(new Set());
    }

    // Store starting positions of all items being dragged
    const startPositions = {};
    positions.forEach(p => {
      if (itemsToDrag.has(p.id)) {
        startPositions[p.id] = { x: p.x, y: p.y };
      }
    });
    setDragStartPositions(startPositions);

    setDraggingId(pos.id);
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - pos.x,
      y: (e.clientY - rect.top) / zoom - pos.y
    });
    setTempPosition({ x: pos.x, y: pos.y });
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Handle selection box drag
    if (selectionBox) {
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      setSelectionBox(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
      return;
    }

    // Handle position drag
    if (!draggingId) return;

    const rawX = (e.clientX - rect.left) / zoom - dragOffset.x;
    const rawY = (e.clientY - rect.top) / zoom - dragOffset.y;

    // Snap to grid
    const snappedX = Math.round(rawX / SNAP_SIZE) * SNAP_SIZE;
    const snappedY = Math.round(rawY / SNAP_SIZE) * SNAP_SIZE;

    // Clamp to container bounds (1056 x 408 canvas)
    const clampedX = Math.max(60, Math.min(CANVAS_WIDTH - 60, snappedX));
    const clampedY = Math.max(20, Math.min(CANVAS_HEIGHT - 40, snappedY));

    setTempPosition({ x: clampedX, y: clampedY });
  }, [draggingId, dragOffset, zoom, selectionBox]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Finish selection box - select all positions inside it
    if (selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.currentX);
      const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
      const minY = Math.min(selectionBox.startY, selectionBox.currentY);
      const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

      const selected = new Set();
      positions.forEach(pos => {
        // Check if position center is inside selection box
        if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
          selected.add(pos.id);
        }
      });
      setSelectedIds(selected);
      setSelectionBox(null);
      return;
    }

    // Finish position drag
    if (draggingId && tempPosition && Object.keys(dragStartPositions).length > 0) {
      // Calculate the delta from the dragged item
      const startPos = dragStartPositions[draggingId];
      if (startPos) {
        const deltaX = tempPosition.x - startPos.x;
        const deltaY = tempPosition.y - startPos.y;

        // Build batch update for all items being dragged
        const batchUpdate = {};
        Object.entries(dragStartPositions).forEach(([id, pos]) => {
          const newX = Math.max(60, Math.min(CANVAS_WIDTH - 60, pos.x + deltaX));
          const newY = Math.max(20, Math.min(CANVAS_HEIGHT - 40, pos.y + deltaY));
          batchUpdate[id] = { x: newX, y: newY };
        });
        // Apply all updates at once
        onUpdateLayout(batchUpdate);
      }
    } else if (draggingId && tempPosition) {
      onUpdateLayout(draggingId, tempPosition.x, tempPosition.y);
    }
    setDraggingId(null);
    setDragStartPositions({});
    setTempPosition(null);
  }, [draggingId, tempPosition, onUpdateLayout, selectionBox, positions]);

  // Add/remove window listeners for drag
  useEffect(() => {
    if (draggingId || selectionBox) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, selectionBox, handleMouseMove, handleMouseUp]);

  // Open player selector
  const openPlayerSelector = (posId, depth) => {
    setActivePosition(posId);
    setActiveDepth(depth);
    setShowPlayerModal(true);
    setSearchTerm('');
  };

  // Assign player
  const handleAssignPlayer = (playerId) => {
    const newChart = { ...depthChart };
    if (!newChart[activePosition]) {
      newChart[activePosition] = [];
    }
    while (newChart[activePosition].length <= activeDepth) {
      newChart[activePosition].push(null);
    }
    newChart[activePosition][activeDepth] = playerId;
    onUpdateDepthChart(newChart);
    setShowPlayerModal(false);
  };

  // Remove player
  const handleRemovePlayer = (posId, depth) => {
    const newChart = { ...depthChart };
    if (newChart[posId]) {
      newChart[posId][depth] = null;
    }
    onUpdateDepthChart(newChart);
  };

  // Reset layout to defaults
  const handleResetLayout = () => {
    if (!confirm('Reset all positions to default layout?')) return;

    const batchUpdate = {};

    if (chartType === 'offense' && dynamicPositions && dynamicPositions.length > 0) {
      // Reset using dynamic positions and default coords
      let slotCounter = 0;
      dynamicPositions.forEach(pos => {
        // Also check label in case position was renamed (e.g., WR renamed to A)
        const defaultCoords = DEFAULT_POSITION_COORDS[pos.label] || DEFAULT_POSITION_COORDS[pos.positionType] || DEFAULT_POSITION_COORDS[pos.id];
        if (defaultCoords) {
          batchUpdate[pos.id] = { x: defaultCoords.x, y: defaultCoords.y };
        } else {
          slotCounter++;
          batchUpdate[pos.id] = { x: 150 + (slotCounter % 5) * 180, y: 180 + Math.floor(slotCounter / 5) * 70 };
        }
      });
    } else {
      // Non-offense uses default layouts
      const defaultLayout = DEFAULT_FORMATION_LAYOUTS[chartType] || [];
      defaultLayout.forEach(pos => {
        batchUpdate[pos.id] = { x: pos.x, y: pos.y };
      });
    }

    onUpdateLayout(batchUpdate);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className={`flex items-center justify-between rounded-lg p-3 ${
        isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isLocked
                ? isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-slate-700 text-slate-300'
                : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
            }`}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isLocked ? 'Locked' : 'Editing Layout'}
          </button>
          {!isLocked && (
            <>
              <button
                onClick={handleResetLayout}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isLight ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <RotateCcw size={16} />
                Reset Layout
              </button>
              <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Drag to select • Shift+click to add
              </span>
              {selectedIds.size > 0 && (
                <span className={`text-xs px-2 py-1 rounded ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
                  {selectedIds.size} selected
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Zoom:</span>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className={`p-1.5 rounded ${isLight ? 'bg-white border border-slate-200 hover:bg-slate-50' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <ZoomOut size={16} className={isLight ? 'text-slate-600' : 'text-slate-300'} />
          </button>
          <span className={`text-sm w-12 text-center ${isLight ? 'text-slate-700' : 'text-white'}`}>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
            className={`p-1.5 rounded ${isLight ? 'bg-white border border-slate-200 hover:bg-slate-50' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <ZoomIn size={16} className={isLight ? 'text-slate-600' : 'text-slate-300'} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className={`px-2 py-1 text-xs rounded ${isLight ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Formation Canvas - 11" x 4.25" at 96 DPI = 1056 x 408 pixels */}
      <div
        className={`relative rounded-lg border overflow-auto ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'
        }`}
        style={{ height: `${CANVAS_HEIGHT + 20}px` }}
      >
        <div
          ref={containerRef}
          className="relative mx-auto"
          onMouseDown={(e) => {
            // Start selection box when clicking on empty space (not on a position card)
            if (!isLocked && (e.target === e.currentTarget || e.target.closest('[data-los]'))) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = (e.clientX - rect.left) / zoom;
              const y = (e.clientY - rect.top) / zoom;
              setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
              setSelectedIds(new Set());
            }
          }}
          style={{
            width: `${CANVAS_WIDTH * zoom}px`,
            height: `${CANVAS_HEIGHT * zoom}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            background: isLight
              ? 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.05) 19px, rgba(0,0,0,0.05) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.05) 19px, rgba(0,0,0,0.05) 20px)'
              : 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px)'
          }}
        >
          {/* Selection Box */}
          {selectionBox && (
            <div
              className="absolute border-2 border-sky-500 bg-sky-500/10 pointer-events-none z-50"
              style={{
                left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
                top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
                width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
                height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`
              }}
            />
          )}

          {/* Line of Scrimmage - at top for offense, at bottom for defense/kickoff */}
          <div
            className={`absolute left-0 right-0 border-t-2 border-dashed ${isLight ? 'border-slate-300' : 'border-slate-600'}`}
            style={{ top: (chartType === 'defense' || chartType === 'kickoff') ? '368px' : '40px' }}
          />
          <span
            className={`absolute text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}
            style={{
              top: (chartType === 'defense' || chartType === 'kickoff') ? '372px' : '20px',
              left: '10px'
            }}
          >
            LOS
          </span>

          {/* Position Cards */}
          {positions.map(pos => {
            const isDragging = draggingId === pos.id;
            const isSelected = selectedIds.has(pos.id);
            const isBeingDraggedWithGroup = draggingId && dragStartPositions[pos.id] && !isDragging;

            // Calculate position - if this item is part of a multi-drag, apply the delta
            let x = pos.x;
            let y = pos.y;
            if (isDragging && tempPosition) {
              x = tempPosition.x;
              y = tempPosition.y;
            } else if (isBeingDraggedWithGroup && tempPosition && dragStartPositions[draggingId]) {
              // Apply delta from the main dragged item
              const deltaX = tempPosition.x - dragStartPositions[draggingId].x;
              const deltaY = tempPosition.y - dragStartPositions[draggingId].y;
              x = Math.max(60, Math.min(CANVAS_WIDTH - 60, dragStartPositions[pos.id].x + deltaX));
              y = Math.max(20, Math.min(CANVAS_HEIGHT - 40, dragStartPositions[pos.id].y + deltaY));
            }

            const posDepthChart = depthChart[pos.id] || [];
            const numRows = depthRowCounts?.[pos.id] || 2;

            return (
              <div
                key={pos.id}
                onMouseDown={(e) => handleMouseDown(e, pos)}
                className={`absolute flex flex-col rounded border transition-colors ${
                  isDragging || isBeingDraggedWithGroup
                    ? 'bg-sky-500/20 border-sky-500 z-10 cursor-grabbing'
                    : isSelected
                      ? 'bg-amber-500/20 border-amber-500 z-5'
                      : isLocked
                        ? isLight ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-slate-800/90 border-slate-700'
                        : isLight ? 'bg-white/95 border-slate-300 cursor-grab hover:border-slate-400 shadow-sm' : 'bg-slate-800/90 border-slate-600 cursor-grab hover:border-slate-500'
                }`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translateX(-50%)',
                  minWidth: '110px'
                }}
              >
                {/* Position Label */}
                <div className={`text-center text-[10px] font-bold px-1.5 py-0.5 border-b ${
                  isLight ? 'text-sky-600 border-slate-200' : 'text-sky-400 border-slate-700'
                }`}>
                  {pos.label}
                </div>

                {/* Depth Slots */}
                <div className="px-1.5 py-1 space-y-0.5">
                  {Array.from({ length: numRows }).map((_, depth) => {
                    const playerId = posDepthChart[depth];
                    const player = playerId ? getPlayer(playerId) : null;

                    return (
                      <div key={depth} className="flex items-center gap-0.5">
                        <span className={`text-[9px] w-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{depth + 1}.</span>
                        {player ? (
                          <div className={`flex-1 flex items-center justify-between rounded px-1 py-px group ${
                            isLight ? 'bg-slate-100' : 'bg-slate-700/50'
                          }`}>
                            <span className={`text-[10px] truncate ${isLight ? 'text-slate-700' : 'text-white'}`}>
                              <span className={isLight ? 'text-sky-600' : 'text-sky-400'}>#{player.number}</span> {player.name?.split(' ').pop()}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemovePlayer(pos.id, depth); }}
                              className={`opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 ${isLight ? 'text-slate-400' : 'text-slate-400'}`}
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); openPlayerSelector(pos.id, depth); }}
                            className={`flex-1 text-[9px] text-left ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Row Controls */}
                <div className={`flex items-center justify-center gap-2 px-1.5 py-0.5 border-t ${
                  isLight ? 'border-slate-200' : 'border-slate-700/50'
                }`}>
                  {numRows > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const current = depthRowCounts?.[pos.id] || 2;
                        if (current > 1) {
                          onUpdateDepthRowCounts({ ...depthRowCounts, [pos.id]: current - 1 });
                        }
                      }}
                      className={`text-[9px] ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-slate-500 hover:text-red-400'}`}
                    >
                      − Row
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const current = depthRowCounts?.[pos.id] || 2;
                      onUpdateDepthRowCounts({ ...depthRowCounts, [pos.id]: current + 1 });
                    }}
                    className={`text-[9px] ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    + Row
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Selector Modal */}
      {showPlayerModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isLight ? 'bg-black/50' : 'bg-black/70'}`}>
          <div className={`rounded-xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Select Player
              </h3>
              <button
                onClick={() => setShowPlayerModal(false)}
                className={`p-2 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-white'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className={`p-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="relative">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search players..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {filteredRoster.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleAssignPlayer(player.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isLight ? 'bg-sky-100 text-sky-600' : 'bg-slate-700 text-sky-400'
                    }`}>
                      {player.number || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{player.name}</div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{player.position} • {player.year}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Grid View Component (original table-based view)
function GridView({
  chartType,
  depthChart,
  roster,
  onUpdateDepthChart,
  isLight = false,
  dynamicPositions = null,
  additionalPositions = [],
  showAdditional = false,
  onToggleAdditional = null,
  basePersonnelLabel = null
}) {
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [activeDepthSlot, setActiveDepthSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Use dynamic positions for offense if provided, otherwise fall back to defaults
  const positions = chartType === 'offense' && dynamicPositions
    ? dynamicPositions
    : (DEFAULT_POSITIONS[chartType] || DEFAULT_POSITIONS.offense);

  const getPlayer = (playerId) => roster.find(p => p.id === playerId);

  const filteredRoster = useMemo(() => {
    const activeRoster = roster.filter(p => !p.archived);
    if (!searchTerm) return activeRoster;
    const search = searchTerm.toLowerCase();
    return activeRoster.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.number?.toString().includes(search) ||
      p.position?.toLowerCase().includes(search)
    );
  }, [roster, searchTerm]);

  const openPlayerSelector = (positionId, depthSlot) => {
    setActivePosition(positionId);
    setActiveDepthSlot(depthSlot);
    setShowPlayerSelector(true);
    setSearchTerm('');
  };

  const handleAssignPlayer = (playerId) => {
    const newChart = { ...depthChart };
    if (!newChart[activePosition]) {
      newChart[activePosition] = [];
    }
    while (newChart[activePosition].length < activeDepthSlot) {
      newChart[activePosition].push(null);
    }
    newChart[activePosition][activeDepthSlot - 1] = playerId;
    onUpdateDepthChart(newChart);
    setShowPlayerSelector(false);
  };

  const handleRemovePlayer = (positionId, depthSlot) => {
    const newChart = { ...depthChart };
    if (newChart[positionId]) {
      newChart[positionId][depthSlot - 1] = null;
    }
    onUpdateDepthChart(newChart);
  };

  // Determine max depth for this chart type
  const maxDepth = chartType === 'offense' || chartType === 'defense' ? 3 : 2;

  return (
    <>
      <div className={`rounded-lg border overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <table className="w-full">
          <thead>
            <tr className={isLight ? 'bg-slate-100' : 'bg-slate-800'}>
              <th className={`px-4 py-3 text-left text-sm font-semibold w-32 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Position
              </th>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                1st String
              </th>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                2nd String
              </th>
              {maxDepth >= 3 && (
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  3rd String
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, idx) => {
              const positionData = depthChart[pos.id] || [];

              return (
                <tr
                  key={pos.id}
                  className={idx % 2 === 0
                    ? isLight ? 'bg-white' : 'bg-slate-900'
                    : isLight ? 'bg-slate-50' : 'bg-slate-900/50'
                  }
                >
                  <td className={`px-4 py-3 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{pos.label}</span>
                  </td>

                  {Array.from({ length: maxDepth }).map((_, depthIdx) => {
                    const depth = depthIdx + 1;
                    const playerId = positionData[depthIdx];
                    const player = playerId ? getPlayer(playerId) : null;

                    return (
                      <td key={depth} className={`px-4 py-3 border-r last:border-r-0 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                        {player ? (
                          <div className={`flex items-center gap-2 rounded-lg p-2 ${
                            isLight ? 'bg-slate-100' : 'bg-slate-800'
                          }`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>#{player.number || '?'}</span>
                                <span className={`font-medium truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{player.name}</span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {player.position} • {player.year || 'N/A'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemovePlayer(pos.id, depth)}
                              className="p-1 text-slate-500 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPlayerSelector(pos.id, depth)}
                            className={`w-full py-3 border-2 border-dashed rounded-lg ${
                              isLight
                                ? 'border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400'
                                : 'border-slate-700 text-slate-500 hover:text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            + Add Player
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Additional Positions Section (for offense with personnel groupings) */}
      {additionalPositions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={onToggleAdditional}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <ChevronDown
              size={16}
              className={`transform transition-transform ${showAdditional ? 'rotate-180' : ''}`}
            />
            Additional Positions
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              isLight ? 'bg-slate-200' : 'bg-slate-700'
            }`}>
              {additionalPositions.length}
            </span>
          </button>

          {showAdditional && (
            <div className={`mt-3 rounded-lg border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'
            }`}>
              <table className="w-full">
                <thead>
                  <tr className={isLight ? 'bg-slate-50' : 'bg-slate-800/50'}>
                    <th className={`px-4 py-2 text-left text-xs font-semibold w-32 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      Position
                    </th>
                    <th className={`px-4 py-2 text-left text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      1st String
                    </th>
                    <th className={`px-4 py-2 text-left text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      2nd String
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {additionalPositions.map((pos, idx) => {
                    const positionData = depthChart[pos.id] || [];
                    return (
                      <tr
                        key={pos.id}
                        className={idx % 2 === 0
                          ? isLight ? 'bg-white' : 'bg-slate-900/30'
                          : isLight ? 'bg-slate-50' : 'bg-slate-900/50'
                        }
                      >
                        <td className={`px-4 py-2 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                          <div>
                            <span className={`font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{pos.label}</span>
                            {pos.fromPersonnel && (
                              <span className="ml-2 text-xs text-slate-500">({pos.fromPersonnel})</span>
                            )}
                          </div>
                        </td>
                        {Array.from({ length: 2 }).map((_, depthIdx) => {
                          const depth = depthIdx + 1;
                          const playerId = positionData[depthIdx];
                          const player = playerId ? getPlayer(playerId) : null;

                          return (
                            <td key={depth} className={`px-4 py-2 border-r last:border-r-0 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                              {player ? (
                                <div className={`flex items-center gap-2 rounded-lg p-2 ${
                                  isLight ? 'bg-slate-100' : 'bg-slate-800'
                                }`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold text-sm ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>#{player.number || '?'}</span>
                                      <span className={`font-medium text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{player.name}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemovePlayer(pos.id, depth)}
                                    className="p-1 text-slate-500 hover:text-red-500"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openPlayerSelector(pos.id, depth)}
                                  className={`w-full py-2 border border-dashed rounded-lg text-sm ${
                                    isLight
                                      ? 'border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400'
                                      : 'border-slate-700 text-slate-500 hover:text-slate-400 hover:border-slate-600'
                                  }`}
                                >
                                  + Add
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Base Personnel Indicator */}
      {basePersonnelLabel && (
        <div className={`mt-4 text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          Base Personnel: <span className="font-medium">{basePersonnelLabel}</span>
          {additionalPositions.length > 0 && (
            <span className="ml-2">• Additional positions from other personnel groupings</span>
          )}
        </div>
      )}

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isLight ? 'bg-black/50' : 'bg-black/70'}`}>
          <div className={`rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Select Player for {positions.find(p => p.id === activePosition)?.label}
              </h3>
              <button
                onClick={() => { setShowPlayerSelector(false); setActivePosition(null); }}
                className={`p-2 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-white'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="relative">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name, number, or position..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredRoster.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users size={32} className="mx-auto mb-2" />
                  <p>No players found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRoster.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleAssignPlayer(player.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                        isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isLight ? 'bg-sky-100 text-sky-600' : 'bg-slate-700 text-sky-400'
                      }`}>
                        {player.number || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{player.name}</div>
                        <div className="text-sm text-slate-500">
                          {player.position} • {player.year || 'N/A'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Main DepthCharts Component
export default function DepthCharts() {
  const { roster, depthCharts, updateDepthCharts, weeks, currentWeekId, updateWeeks, settings, school, setupConfig, programLevels, activeLevelId } = useSchool();

  const [activeChart, setActiveChart] = useState('offense');
  const [viewMode, setViewMode] = useState('formation'); // 'formation' or 'grid'
  const [showAdditional, setShowAdditional] = useState(false); // Toggle for additional positions

  // Theme support
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  // Generate dynamic positions from setup config
  const personnelGroupings = setupConfig?.personnelGroupings || [];
  const positionNames = setupConfig?.positionNames || {};
  const customPositions = setupConfig?.customPositions?.OFFENSE || [];
  const hiddenPositions = setupConfig?.hiddenPositions?.OFFENSE || [];

  // Compute active positions: defaults + custom - hidden
  const activePositions = useMemo(() => {
    console.log('DEBUG: DEFAULT_OFFENSE_POSITIONS:', DEFAULT_OFFENSE_POSITIONS);
    console.log('DEBUG: hiddenPositions:', hiddenPositions);
    const defaults = DEFAULT_OFFENSE_POSITIONS.filter(p => !hiddenPositions.includes(p.key));
    console.log('DEBUG: defaults after filter:', defaults);
    const custom = customPositions.map(p => ({ key: p.key || p, default: p.default || p.key || p }));
    console.log('DEBUG: custom:', custom);
    console.log('DEBUG: final activePositions:', [...defaults, ...custom]);
    return [...defaults, ...custom];
  }, [customPositions, hiddenPositions]);

  const { basePositions, additionalPositions, basePersonnel } = useMemo(() => {
    return generateDepthChartPositions(activeLevelId, programLevels, personnelGroupings, positionNames, activePositions);
  }, [activeLevelId, programLevels, personnelGroupings, positionNames, activePositions]);

  // Get current week
  const currentWeek = weeks.find(w => w.id === currentWeekId);

  // Get depth chart data - prefer week-specific, fall back to global
  const weekDepthCharts = currentWeek?.depthCharts || {};
  const currentChartData = weekDepthCharts[activeChart] || depthCharts[activeChart] || {};

  // Get layout data for formation view (stored per week)
  const formationLayouts = currentWeek?.depthChartLayouts || {};
  const currentLayout = formationLayouts[activeChart] || {};

  // Get depth row counts for formation view
  const depthRowCounts = currentWeek?.depthRowCounts?.[activeChart] || {};

  // Update depth chart for current week
  const handleUpdateDepthChart = (newChartData) => {
    if (currentWeekId && currentWeek) {
      // Update week-specific depth chart
      const newWeekDepthCharts = {
        ...weekDepthCharts,
        [activeChart]: newChartData
      };
      const updatedWeeks = weeks.map(w =>
        w.id === currentWeekId ? { ...w, depthCharts: newWeekDepthCharts } : w
      );
      updateWeeks(updatedWeeks);
    } else {
      // Update global depth chart
      updateDepthCharts({
        ...depthCharts,
        [activeChart]: newChartData
      });
    }
  };

  // Update layout for formation view
  // Can be called with (posId, x, y) for single update or (batchUpdates) for multiple
  const handleUpdateLayout = (posIdOrBatch, x, y) => {
    if (!currentWeekId || !currentWeek) return;

    let newLayout;
    if (typeof posIdOrBatch === 'object') {
      // Batch update: posIdOrBatch is { posId: { x, y }, ... }
      newLayout = {
        ...currentLayout,
        ...posIdOrBatch
      };
    } else {
      // Single update
      newLayout = {
        ...currentLayout,
        [posIdOrBatch]: { x, y }
      };
    }

    const newFormationLayouts = {
      ...formationLayouts,
      [activeChart]: newLayout
    };
    const updatedWeeks = weeks.map(w =>
      w.id === currentWeekId ? { ...w, depthChartLayouts: newFormationLayouts } : w
    );
    updateWeeks(updatedWeeks);
  };

  // Update depth row counts
  const handleUpdateDepthRowCounts = (newCounts) => {
    if (!currentWeekId || !currentWeek) return;

    const newDepthRowCounts = {
      ...currentWeek.depthRowCounts,
      [activeChart]: newCounts
    };
    const updatedWeeks = weeks.map(w =>
      w.id === currentWeekId ? { ...w, depthRowCounts: newDepthRowCounts } : w
    );
    updateWeeks(updatedWeeks);
  };

  // Copy depth chart from another week
  const copyFromWeek = (sourceWeekId) => {
    const sourceWeek = weeks.find(w => w.id === sourceWeekId);
    if (!sourceWeek || !currentWeekId) return;

    const sourceCharts = sourceWeek.depthCharts || {};
    const sourceLayouts = sourceWeek.depthChartLayouts || {};
    const sourceRowCounts = sourceWeek.depthRowCounts || {};

    const updatedWeeks = weeks.map(w =>
      w.id === currentWeekId ? {
        ...w,
        depthCharts: { ...sourceCharts },
        depthChartLayouts: { ...sourceLayouts },
        depthRowCounts: { ...sourceRowCounts }
      } : w
    );
    updateWeeks(updatedWeeks);
  };

  return (
    <>
      {/* Print-only content - uses DepthChartPrint template */}
      <div className="hidden print:block">
        <DepthChartPrint
          weekId={currentWeekId}
          chartTypes={[activeChart]}
          viewMode="full"
          depthLevels={3}
          showBackups={true}
        />
      </div>

      {/* Main UI - hidden when printing */}
      <div className="p-6 print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Depth Charts</h1>
          <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>
            {currentWeek ? `${currentWeek.name}` : 'Global'} • {roster.filter(p => !p.archived).length} active players
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className={`flex rounded-lg p-1 ${isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                viewMode === 'grid'
                  ? isLight ? 'bg-white text-sky-600 shadow-sm font-semibold' : 'bg-slate-700 text-white'
                  : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('formation')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                viewMode === 'formation'
                  ? isLight ? 'bg-white text-sky-600 shadow-sm font-semibold' : 'bg-slate-700 text-white'
                  : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Move size={16} />
              Formation
            </button>
          </div>

          {/* Copy from Week */}
          {currentWeekId && weeks.length > 1 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    if (confirm('Copy depth charts from selected week? This will overwrite current data.')) {
                      copyFromWeek(e.target.value);
                    }
                    e.target.value = '';
                  }
                }}
                className={`px-3 py-2 border rounded-lg text-sm appearance-none pr-8 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
                defaultValue=""
              >
                <option value="" disabled>Copy from week...</option>
                {weeks.filter(w => w.id !== currentWeekId).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <Printer size={18} />
              Print
            </button>
            <Link
              to="/print?template=depth_chart"
              className={`p-2 rounded-lg ${
                isLight
                  ? 'text-slate-400 hover:text-sky-500 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
              }`}
              title="Open in Print Center"
            >
              <ExternalLink size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Chart Type Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DEPTH_CHART_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveChart(type.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              activeChart === type.id
                ? 'bg-sky-500 text-white'
                : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      {viewMode === 'grid' ? (
        <GridView
          chartType={activeChart}
          depthChart={currentChartData}
          roster={roster}
          onUpdateDepthChart={handleUpdateDepthChart}
          isLight={isLight}
          dynamicPositions={activeChart === 'offense' ? basePositions : null}
          additionalPositions={activeChart === 'offense' ? additionalPositions : []}
          showAdditional={showAdditional}
          onToggleAdditional={() => setShowAdditional(!showAdditional)}
          basePersonnelLabel={basePersonnel?.code || basePersonnel?.name}
        />
      ) : (
        <FormationView
          chartType={activeChart}
          depthChart={currentChartData}
          layout={currentLayout}
          roster={roster}
          onUpdateDepthChart={handleUpdateDepthChart}
          onUpdateLayout={handleUpdateLayout}
          depthRowCounts={depthRowCounts}
          isLight={isLight}
          onUpdateDepthRowCounts={handleUpdateDepthRowCounts}
          dynamicPositions={activeChart === 'offense' ? basePositions : null}
        />
      )}
      </div>
    </>
  );
}
