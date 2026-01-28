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

// Default formation layouts (x, y coordinates for formation view)
const DEFAULT_FORMATION_LAYOUTS = {
  offense: [
    { id: 'WR1', label: 'X', x: 80, y: 200 },
    { id: 'LT', label: 'LT', x: 280, y: 200 },
    { id: 'LG', label: 'LG', x: 360, y: 200 },
    { id: 'C', label: 'C', x: 440, y: 200 },
    { id: 'RG', label: 'RG', x: 520, y: 200 },
    { id: 'RT', label: 'RT', x: 600, y: 200 },
    { id: 'TE', label: 'TE', x: 680, y: 200 },
    { id: 'WR2', label: 'Z', x: 800, y: 260 },
    { id: 'WR3', label: 'Slot', x: 200, y: 260 },
    { id: 'QB', label: 'QB', x: 440, y: 320 },
    { id: 'RB', label: 'RB', x: 440, y: 420 },
    { id: 'FB', label: 'FB', x: 440, y: 370 }
  ],
  defense: [
    { id: 'DE1', label: 'DE', x: 200, y: 200 },
    { id: 'DT1', label: 'DT', x: 340, y: 200 },
    { id: 'NT', label: 'NT', x: 440, y: 200 },
    { id: 'DT2', label: 'DT', x: 540, y: 200 },
    { id: 'DE2', label: 'DE', x: 680, y: 200 },
    { id: 'OLB1', label: 'OLB', x: 140, y: 280 },
    { id: 'MLB', label: 'MLB', x: 440, y: 300 },
    { id: 'OLB2', label: 'OLB', x: 740, y: 280 },
    { id: 'CB1', label: 'CB', x: 80, y: 380 },
    { id: 'CB2', label: 'CB', x: 800, y: 380 },
    { id: 'FS', label: 'FS', x: 340, y: 420 },
    { id: 'SS', label: 'SS', x: 540, y: 420 }
  ],
  kickoff: [
    { id: 'K', label: 'K', x: 440, y: 450 },
    { id: 'L1', label: 'L1', x: 140, y: 200 },
    { id: 'L2', label: 'L2', x: 220, y: 200 },
    { id: 'L3', label: 'L3', x: 300, y: 200 },
    { id: 'L4', label: 'L4', x: 380, y: 200 },
    { id: 'L5', label: 'L5', x: 440, y: 200 },
    { id: 'R1', label: 'R1', x: 500, y: 200 },
    { id: 'R2', label: 'R2', x: 580, y: 200 },
    { id: 'R3', label: 'R3', x: 660, y: 200 },
    { id: 'R4', label: 'R4', x: 740, y: 200 },
    { id: 'R5', label: 'R5', x: 820, y: 200 }
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
  onUpdateDepthRowCounts
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

  // Get positions with layout coordinates
  const positions = useMemo(() => {
    const defaultLayout = DEFAULT_FORMATION_LAYOUTS[chartType] || DEFAULT_FORMATION_LAYOUTS.offense;
    return defaultLayout.map(pos => ({
      ...pos,
      x: layout?.[pos.id]?.x ?? pos.x,
      y: layout?.[pos.id]?.y ?? pos.y
    }));
  }, [chartType, layout]);

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

    const rect = containerRef.current.getBoundingClientRect();
    setDraggingId(pos.id);
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - pos.x,
      y: (e.clientY - rect.top) / zoom - pos.y
    });
    setTempPosition({ x: pos.x, y: pos.y });
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / zoom - dragOffset.x;
    const rawY = (e.clientY - rect.top) / zoom - dragOffset.y;

    // Snap to grid
    const snappedX = Math.round(rawX / SNAP_SIZE) * SNAP_SIZE;
    const snappedY = Math.round(rawY / SNAP_SIZE) * SNAP_SIZE;

    // Clamp to container bounds
    const clampedX = Math.max(40, Math.min(840, snappedX));
    const clampedY = Math.max(40, Math.min(560, snappedY));

    setTempPosition({ x: clampedX, y: clampedY });
  }, [draggingId, dragOffset, zoom]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (draggingId && tempPosition) {
      onUpdateLayout(draggingId, tempPosition.x, tempPosition.y);
    }
    setDraggingId(null);
    setTempPosition(null);
  }, [draggingId, tempPosition, onUpdateLayout]);

  // Add/remove window listeners for drag
  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

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
    const defaultLayout = DEFAULT_FORMATION_LAYOUTS[chartType] || {};
    const newLayout = {};
    defaultLayout.forEach(pos => {
      newLayout[pos.id] = { x: pos.x, y: pos.y };
    });
    // Update all positions at once
    Object.entries(newLayout).forEach(([id, coords]) => {
      onUpdateLayout(id, coords.x, coords.y);
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isLocked
                ? 'bg-slate-700 text-slate-300'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isLocked ? 'Locked' : 'Editing Layout'}
          </button>
          {!isLocked && (
            <button
              onClick={handleResetLayout}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
            >
              <RotateCcw size={16} />
              Reset Layout
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Zoom:</span>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1.5 bg-slate-700 rounded hover:bg-slate-600"
          >
            <ZoomOut size={16} className="text-slate-300" />
          </button>
          <span className="text-sm text-white w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
            className="p-1.5 bg-slate-700 rounded hover:bg-slate-600"
          >
            <ZoomIn size={16} className="text-slate-300" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Formation Canvas */}
      <div
        className="relative bg-slate-900 rounded-lg border border-slate-700 overflow-auto"
        style={{ height: '600px' }}
      >
        <div
          ref={containerRef}
          className="relative"
          style={{
            width: `${880 * zoom}px`,
            height: `${600 * zoom}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px)'
          }}
        >
          {/* Line of Scrimmage */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-slate-600"
            style={{ top: '180px' }}
          />
          <span
            className="absolute text-xs text-slate-500"
            style={{ top: '160px', left: '10px' }}
          >
            LOS
          </span>

          {/* Position Cards */}
          {positions.map(pos => {
            const isDragging = draggingId === pos.id;
            const x = isDragging && tempPosition ? tempPosition.x : pos.x;
            const y = isDragging && tempPosition ? tempPosition.y : pos.y;
            const posDepthChart = depthChart[pos.id] || [];
            const numRows = depthRowCounts?.[pos.id] || 2;

            return (
              <div
                key={pos.id}
                onMouseDown={(e) => handleMouseDown(e, pos)}
                className={`absolute flex flex-col gap-1 p-2 rounded-lg border transition-colors ${
                  isDragging
                    ? 'bg-sky-500/20 border-sky-500 z-10 cursor-grabbing'
                    : isLocked
                      ? 'bg-slate-800/90 border-slate-700'
                      : 'bg-slate-800/90 border-slate-600 cursor-grab hover:border-slate-500'
                }`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translateX(-50%)',
                  minWidth: '120px'
                }}
              >
                {/* Position Label */}
                <div className="text-center text-xs font-bold text-sky-400 border-b border-slate-700 pb-1 mb-1">
                  {pos.label}
                </div>

                {/* Depth Slots */}
                {Array.from({ length: numRows }).map((_, depth) => {
                  const playerId = posDepthChart[depth];
                  const player = playerId ? getPlayer(playerId) : null;

                  return (
                    <div key={depth} className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 w-4">{depth + 1}.</span>
                      {player ? (
                        <div className="flex-1 flex items-center justify-between bg-slate-700/50 rounded px-1.5 py-0.5 group">
                          <span className="text-xs text-white truncate">
                            <span className="text-sky-400">#{player.number}</span> {player.name?.split(' ').pop()}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemovePlayer(pos.id, depth); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-400"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); openPlayerSelector(pos.id, depth); }}
                          className="flex-1 text-[10px] text-slate-500 hover:text-slate-300 text-left px-1"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Row Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const current = depthRowCounts?.[pos.id] || 2;
                    onUpdateDepthRowCounts({ ...depthRowCounts, [pos.id]: current + 1 });
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 pt-1 border-t border-slate-700/50"
                >
                  + Row
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Selector Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                Select Player
              </h3>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search players..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm"
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
                    className="w-full flex items-center gap-2 p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-left"
                  >
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sky-400 font-bold text-sm">
                      {player.number || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{player.name}</div>
                      <div className="text-xs text-slate-500">{player.position} • {player.year}</div>
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
function GridView({ chartType, depthChart, roster, onUpdateDepthChart }) {
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [activeDepthSlot, setActiveDepthSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const positions = DEFAULT_POSITIONS[chartType] || DEFAULT_POSITIONS.offense;

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
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 w-32">
                Position
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">
                1st String
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">
                2nd String
              </th>
              {maxDepth >= 3 && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">
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
                  className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                >
                  <td className="px-4 py-3 border-r border-slate-800">
                    <span className="font-semibold text-white">{pos.label}</span>
                  </td>

                  {Array.from({ length: maxDepth }).map((_, depthIdx) => {
                    const depth = depthIdx + 1;
                    const playerId = positionData[depthIdx];
                    const player = playerId ? getPlayer(playerId) : null;

                    return (
                      <td key={depth} className="px-4 py-3 border-r border-slate-800 last:border-r-0">
                        {player ? (
                          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sky-400 font-bold">#{player.number || '?'}</span>
                                <span className="font-medium text-white truncate">{player.name}</span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {player.position} • {player.year || 'N/A'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemovePlayer(pos.id, depth)}
                              className="p-1 text-slate-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPlayerSelector(pos.id, depth)}
                            className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-slate-400 hover:border-slate-600"
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

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                Select Player for {positions.find(p => p.id === activePosition)?.label}
              </h3>
              <button
                onClick={() => { setShowPlayerSelector(false); setActivePosition(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name, number, or position..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
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
                      className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 text-left"
                    >
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-sky-400 font-bold">
                        {player.number || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{player.name}</div>
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
  const { roster, depthCharts, updateDepthCharts, weeks, currentWeekId, updateWeeks } = useSchool();

  const [activeChart, setActiveChart] = useState('offense');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'formation'

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
  const handleUpdateLayout = (posId, x, y) => {
    if (!currentWeekId || !currentWeek) return;

    const newLayout = {
      ...currentLayout,
      [posId]: { x, y }
    };
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Depth Charts</h1>
          <p className="text-slate-400">
            {currentWeek ? `${currentWeek.name}` : 'Global'} • {roster.filter(p => !p.archived).length} active players
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                viewMode === 'grid'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('formation')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                viewMode === 'formation'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
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
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none pr-8"
                defaultValue=""
              >
                <option value="" disabled>Copy from week...</option>
                {weeks.filter(w => w.id !== currentWeekId).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              <Printer size={18} />
              Print
            </button>
            <Link
              to="/print?template=depth_chart"
              className="p-2 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800"
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
          onUpdateDepthRowCounts={handleUpdateDepthRowCounts}
        />
      )}
    </div>
  );
}
