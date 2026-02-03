import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, GripVertical, User, X, Plus, Trash2 } from 'lucide-react';
import { getPlayCall } from '../../utils/playDisplay';
import { CANONICAL_OFFENSE_POSITIONS } from '../../utils/depthChartPositions';

// Default positions for offense - use canonical core 11 from shared utility
// Teams can add FB, WR, TE, F etc. as custom positions in Setup > Name Positions
const DEFAULT_OFFENSE_POSITIONS = CANONICAL_OFFENSE_POSITIONS.map(p => ({
  key: p.key,
  default: p.default,
  description: p.key // Keep it simple - descriptions can be looked up elsewhere if needed
}));

// Default position colors
const DEFAULT_POSITION_COLORS = {
  QB: '#1e3a5f', RB: '#3b82f6', FB: '#0891b2', WR: '#a855f7', TE: '#f97316',
  X: '#a855f7', Y: '#22c55e', Z: '#eab308', H: '#06b6d4', F: '#f97316'
};

// Default position types (skill = ball carrier, line = lineman)
const DEFAULT_POSITION_TYPES = {
  QB: 'skill', RB: 'skill', FB: 'skill', WR: 'skill', TE: 'skill',
  X: 'skill', Y: 'skill', Z: 'skill', H: 'skill', F: 'skill',
  LT: 'line', LG: 'line', C: 'line', RG: 'line', RT: 'line'
};

// OL positions to exclude from available list
const OL_POSITIONS = ['LT', 'LG', 'C', 'RG', 'RT'];

export default function PlayerView({
  currentWeek,
  plays,
  gamePlan,
  roster,
  depthCharts,
  setupConfig,
  isLocked,
  onUpdateGamePlan,
  getPlayDisplayName
}) {
  const [expandedPositions, setExpandedPositions] = useState({});
  const [draggedPlay, setDraggedPlay] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);

  // Get player plays order from game plan
  const playerPlays = gamePlan?.playerPlays || {};

  // Get enabled position boxes from game plan
  const enabledPositionBoxes = gamePlan?.playerPositionBoxes || null;

  // Get offense depth chart
  const offenseChart = depthCharts?.offense || {};

  // Get all available positions from setupConfig (excluding OL and line positions)
  const availablePositions = useMemo(() => {
    // Get default positions
    const defaults = DEFAULT_OFFENSE_POSITIONS;

    // Get custom positions for offense
    const customPositions = setupConfig?.customPositions?.OFFENSE || [];

    // Get hidden positions for offense
    const hiddenPositions = setupConfig?.hiddenPositions?.OFFENSE || [];

    // Get position names, colors, and types
    const positionNames = setupConfig?.positionNames || {};
    const positionColors = setupConfig?.positionColors || {};
    const positionTypes = setupConfig?.positionTypes || {};

    // Combine defaults and custom, filter out hidden and OL
    const allPositions = [...defaults, ...customPositions]
      .filter(pos => !hiddenPositions.includes(pos.key))
      .filter(pos => !OL_POSITIONS.includes(pos.key));

    // Map to consistent format with type info
    return allPositions.map(pos => {
      const type = positionTypes[pos.key] || DEFAULT_POSITION_TYPES[pos.key] || 'skill';
      return {
        id: pos.key,
        label: positionNames[pos.key] || pos.description || pos.default || pos.key,
        short: pos.key,
        color: positionColors[pos.key] || DEFAULT_POSITION_COLORS[pos.key] || '#64748b',
        type: type, // 'skill' or 'line'
        isSkill: type === 'skill'
      };
    });
  }, [setupConfig]);

  // Get skill positions (ball carriers) for default boxes
  const skillPositions = useMemo(() => {
    return availablePositions.filter(pos => pos.isSkill);
  }, [availablePositions]);

  // Get currently enabled positions (either from gamePlan or default to skill positions)
  const enabledPositions = useMemo(() => {
    if (enabledPositionBoxes && enabledPositionBoxes.length > 0) {
      // Use explicitly enabled positions from gamePlan
      return enabledPositionBoxes
        .map(posId => availablePositions.find(p => p.id === posId))
        .filter(Boolean);
    }
    // Default: show skill positions that have players in depth chart
    return skillPositions.filter(pos => {
      const depthSlots = offenseChart[pos.id] || [];
      return depthSlots.some(playerId => playerId && roster.find(p => p.id === playerId));
    });
  }, [enabledPositionBoxes, availablePositions, skillPositions, offenseChart, roster]);

  // Organize players by position (only for enabled positions)
  const positionPlayers = useMemo(() => {
    return enabledPositions.map(pos => {
      // Get players from depth chart for this position
      const depthSlots = offenseChart[pos.id] || [];
      const players = depthSlots
        .map(playerId => {
          if (!playerId) return null;
          const player = roster.find(p => p.id === playerId);
          if (!player) return null;
          return {
            id: player.id,
            name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim(),
            number: player.number || player.jerseyNumber,
            position: pos.id
          };
        })
        .filter(Boolean);

      return {
        ...pos,
        players
      };
    });
  }, [enabledPositions, offenseChart, roster]);

  // Get positions not currently enabled (for add modal)
  const availableToAdd = useMemo(() => {
    const enabledIds = new Set(enabledPositions.map(p => p.id));
    return availablePositions.filter(pos => !enabledIds.has(pos.id));
  }, [availablePositions, enabledPositions]);

  // Get plays for a specific player
  const getPlayerPlays = useCallback((playerId) => {
    const playIds = playerPlays[playerId] || [];
    return playIds
      .map(id => plays.find(p => p.id === id))
      .filter(Boolean);
  }, [playerPlays, plays]);

  // Toggle position expansion
  const togglePosition = useCallback((positionId) => {
    setExpandedPositions(prev => ({
      ...prev,
      [positionId]: prev[positionId] === false ? true : (prev[positionId] === undefined ? false : !prev[positionId])
    }));
  }, []);

  // Add a position box
  const handleAddPositionBox = useCallback((positionId) => {
    if (isLocked) return;
    const currentBoxes = enabledPositionBoxes || enabledPositions.map(p => p.id);
    if (!currentBoxes.includes(positionId)) {
      const newBoxes = [...currentBoxes, positionId];
      onUpdateGamePlan({ ...gamePlan, playerPositionBoxes: newBoxes });
    }
    setShowAddPositionModal(false);
  }, [isLocked, enabledPositionBoxes, enabledPositions, gamePlan, onUpdateGamePlan]);

  // Remove a position box
  const handleRemovePositionBox = useCallback((positionId) => {
    if (isLocked) return;
    if (!confirm(`Remove ${positionId} box from this view?`)) return;
    const currentBoxes = enabledPositionBoxes || enabledPositions.map(p => p.id);
    const newBoxes = currentBoxes.filter(id => id !== positionId);
    onUpdateGamePlan({ ...gamePlan, playerPositionBoxes: newBoxes });
  }, [isLocked, enabledPositionBoxes, enabledPositions, gamePlan, onUpdateGamePlan]);

  // Handle drag start for reordering
  const handleDragStart = useCallback((e, play, playerId) => {
    if (isLocked) return;
    setDraggedPlay({ play, playerId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', play.id);
  }, [isLocked]);

  // Handle drag over for reordering
  const handleDragOver = useCallback((e, targetPlayId, playerId) => {
    e.preventDefault();
    if (isLocked) return;

    // Check if this is a play from the play bank (different data format)
    if (!draggedPlay) {
      setDragOverTarget({ playerId, isNew: true });
      return;
    }

    // Only allow reordering within same player
    if (draggedPlay.playerId !== playerId) return;
    setDragOverTarget({ playId: targetPlayId, playerId });
  }, [isLocked, draggedPlay]);

  // Handle drag over for player card (for new plays)
  const handlePlayerDragOver = useCallback((e, playerId) => {
    e.preventDefault();
    if (isLocked) return;
    if (!draggedPlay) {
      setDragOverTarget({ playerId, isNew: true });
    }
  }, [isLocked, draggedPlay]);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  // Handle drop for reordering
  const handleDrop = useCallback((e, targetPlayId, playerId) => {
    e.preventDefault();
    if (isLocked) {
      setDraggedPlay(null);
      setDragOverTarget(null);
      return;
    }

    // Check if this is a play from the play bank
    if (!draggedPlay) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/react-dnd'));
        if (data && data.playId) {
          // Add new play to player
          const currentPlays = playerPlays[playerId] || [];
          if (!currentPlays.includes(data.playId)) {
            const newPlayerPlays = {
              ...playerPlays,
              [playerId]: [...currentPlays, data.playId]
            };
            onUpdateGamePlan({ ...gamePlan, playerPlays: newPlayerPlays });
          }
        }
      } catch (err) {
        // Try plain text format
        const playId = e.dataTransfer.getData('text/plain');
        if (playId && plays.find(p => p.id === playId)) {
          const currentPlays = playerPlays[playerId] || [];
          if (!currentPlays.includes(playId)) {
            const newPlayerPlays = {
              ...playerPlays,
              [playerId]: [...currentPlays, playId]
            };
            onUpdateGamePlan({ ...gamePlan, playerPlays: newPlayerPlays });
          }
        }
      }
      setDragOverTarget(null);
      return;
    }

    // Handle reordering within same player
    if (draggedPlay.playerId !== playerId) {
      setDraggedPlay(null);
      setDragOverTarget(null);
      return;
    }

    const currentOrder = playerPlays[playerId] || [];
    const draggedIdx = currentOrder.indexOf(draggedPlay.play.id);
    const targetIdx = currentOrder.indexOf(targetPlayId);

    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) {
      setDraggedPlay(null);
      setDragOverTarget(null);
      return;
    }

    // Reorder
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedPlay.play.id);

    const newPlayerPlays = { ...playerPlays, [playerId]: newOrder };
    onUpdateGamePlan({ ...gamePlan, playerPlays: newPlayerPlays });

    setDraggedPlay(null);
    setDragOverTarget(null);
  }, [isLocked, draggedPlay, playerPlays, gamePlan, onUpdateGamePlan, plays]);

  // Handle drop on player card (for new plays)
  const handlePlayerDrop = useCallback((e, playerId) => {
    e.preventDefault();
    if (isLocked) {
      setDragOverTarget(null);
      return;
    }

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/react-dnd'));
      if (data && data.playId) {
        const currentPlays = playerPlays[playerId] || [];
        if (!currentPlays.includes(data.playId)) {
          const newPlayerPlays = {
            ...playerPlays,
            [playerId]: [...currentPlays, data.playId]
          };
          onUpdateGamePlan({ ...gamePlan, playerPlays: newPlayerPlays });
        }
      }
    } catch (err) {
      // Try plain text
      const playId = e.dataTransfer.getData('text/plain');
      if (playId && plays.find(p => p.id === playId)) {
        const currentPlays = playerPlays[playerId] || [];
        if (!currentPlays.includes(playId)) {
          const newPlayerPlays = {
            ...playerPlays,
            [playerId]: [...currentPlays, playId]
          };
          onUpdateGamePlan({ ...gamePlan, playerPlays: newPlayerPlays });
        }
      }
    }
    setDragOverTarget(null);
  }, [isLocked, playerPlays, gamePlan, onUpdateGamePlan, plays]);

  // Remove play from player
  const handleRemovePlay = useCallback((playerId, playId) => {
    if (isLocked) return;
    const currentPlays = playerPlays[playerId] || [];
    const newPlays = currentPlays.filter(id => id !== playId);
    const newPlayerPlays = { ...playerPlays, [playerId]: newPlays };
    onUpdateGamePlan({ ...gamePlan, playerPlays: newPlayerPlays });
  }, [isLocked, playerPlays, gamePlan, onUpdateGamePlan]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedPlay(null);
    setDragOverTarget(null);
  }, []);

  // Total stats
  const totalPlayers = positionPlayers.reduce((sum, pos) => sum + pos.players.length, 0);
  const totalAssignedPlays = Object.values(playerPlays).reduce((sum, plays) => sum + (plays?.length || 0), 0);

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
          <div className="text-2xl font-bold text-white">{totalPlayers}</div>
          <div className="text-xs text-slate-500 uppercase">Players</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
          <div className="text-2xl font-bold text-sky-400">{totalAssignedPlays}</div>
          <div className="text-xs text-slate-500 uppercase">Play Assignments</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
          <div className="text-2xl font-bold text-white">{positionPlayers.length}</div>
          <div className="text-xs text-slate-500 uppercase">Position Boxes</div>
        </div>

        {/* Add Position Box Button */}
        {!isLocked && availableToAdd.length > 0 && (
          <button
            onClick={() => setShowAddPositionModal(true)}
            className="bg-slate-800 rounded-lg px-4 py-3 border border-dashed border-slate-600 hover:border-sky-500 hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-400 hover:text-sky-400"
          >
            <Plus size={20} />
            <span className="text-sm font-medium">Add Position</span>
          </button>
        )}
      </div>

      {/* Instructions */}
      {!isLocked && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm text-slate-400">
          <GripVertical size={14} className="inline mr-2" />
          Drag plays from the Play Bank to assign them to players. Drag to reorder within each player. Click X on position header to remove that box.
        </div>
      )}

      {/* Position Groups */}
      {positionPlayers.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <User size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Position Boxes</h3>
            <p className="text-slate-500 mb-4">
              Add position boxes to assign plays to specific players.
            </p>
            {!isLocked && availableToAdd.length > 0 && (
              <button
                onClick={() => setShowAddPositionModal(true)}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Plus size={16} className="inline mr-2" />
                Add Position Box
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {positionPlayers.map(position => {
            const isExpanded = expandedPositions[position.id] !== false;

            return (
              <div
                key={position.id}
                className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
              >
                {/* Position Header */}
                <div className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors">
                  <button
                    onClick={() => togglePosition(position.id)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: position.color }}
                    />
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-400" />
                    )}
                    <span className="font-semibold text-white">{position.label}</span>
                    <span className="text-slate-500 text-sm">({position.short})</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-sm rounded">
                      {position.players.length} {position.players.length === 1 ? 'player' : 'players'}
                    </span>
                    {!isLocked && (
                      <button
                        onClick={() => handleRemovePositionBox(position.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove this position box"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Position Content - Player Cards */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {position.players.length === 0 ? (
                      <div className="col-span-full text-center py-6 text-slate-500">
                        No players in depth chart for this position
                      </div>
                    ) : (
                      position.players.map(player => {
                        const playerPlaysList = getPlayerPlays(player.id);
                        const isDragOver = dragOverTarget?.playerId === player.id && dragOverTarget?.isNew;

                        return (
                          <div
                            key={player.id}
                            className={`bg-slate-800/50 rounded-lg border transition-all ${
                              isDragOver
                                ? 'border-sky-500 bg-sky-500/10'
                                : 'border-slate-700'
                            }`}
                            onDragOver={(e) => handlePlayerDragOver(e, player.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handlePlayerDrop(e, player.id)}
                          >
                            {/* Player Header */}
                            <div className="p-3 border-b border-slate-700/50 flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: position.color }}
                              >
                                {player.number || '#'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white truncate">
                                  {player.name || 'Unknown Player'}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {playerPlaysList.length} {playerPlaysList.length === 1 ? 'play' : 'plays'} assigned
                                </div>
                              </div>
                            </div>

                            {/* Player Plays */}
                            <div className="p-2 min-h-[60px]">
                              {playerPlaysList.length === 0 ? (
                                <div className="text-center py-4 text-slate-600 text-sm">
                                  Drag plays here
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {playerPlaysList.map((play, idx) => {
                                    const isDragging = draggedPlay?.play?.id === play.id && draggedPlay?.playerId === player.id;
                                    const isDropTarget = dragOverTarget?.playId === play.id && dragOverTarget?.playerId === player.id;

                                    return (
                                      <div
                                        key={`${play.id}-${idx}`}
                                        draggable={!isLocked}
                                        onDragStart={(e) => handleDragStart(e, play, player.id)}
                                        onDragOver={(e) => handleDragOver(e, play.id, player.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, play.id, player.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`
                                          flex items-center gap-2 p-2 rounded transition-all text-sm
                                          ${isDragging ? 'opacity-50 bg-slate-700' : 'bg-slate-700/50'}
                                          ${isDropTarget ? 'ring-2 ring-sky-500 bg-sky-500/10' : ''}
                                          ${!isLocked ? 'cursor-grab active:cursor-grabbing' : ''}
                                        `}
                                      >
                                        {!isLocked && (
                                          <GripVertical size={12} className="text-slate-600 flex-shrink-0" />
                                        )}
                                        <span className="flex-1 truncate text-white">
                                          {getPlayDisplayName ? getPlayDisplayName(play) : getPlayCall(play)}
                                        </span>
                                        {!isLocked && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemovePlay(player.id, play.id);
                                            }}
                                            className="text-slate-500 hover:text-red-400 p-0.5 flex-shrink-0"
                                          >
                                            <X size={12} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddPositionModal(false)}
        >
          <div
            className="bg-slate-900 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Add Position Box</h3>
              <button
                onClick={() => setShowAddPositionModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {availableToAdd.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  All available positions have been added.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Skill Positions */}
                  {availableToAdd.filter(p => p.isSkill).length > 0 && (
                    <>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Ball Carriers / Skill Positions
                      </div>
                      {availableToAdd.filter(p => p.isSkill).map(pos => (
                        <button
                          key={pos.id}
                          onClick={() => handleAddPositionBox(pos.id)}
                          className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: pos.color }}
                          >
                            {pos.short}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{pos.label}</div>
                            <div className="text-xs text-slate-500">
                              {(offenseChart[pos.id] || []).filter(id => id && roster.find(p => p.id === id)).length} players in depth chart
                            </div>
                          </div>
                          <Plus size={18} className="text-sky-400" />
                        </button>
                      ))}
                    </>
                  )}

                  {/* Non-skill Positions (if any are non-OL) */}
                  {availableToAdd.filter(p => !p.isSkill).length > 0 && (
                    <>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-2">
                        Other Positions
                      </div>
                      {availableToAdd.filter(p => !p.isSkill).map(pos => (
                        <button
                          key={pos.id}
                          onClick={() => handleAddPositionBox(pos.id)}
                          className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: pos.color }}
                          >
                            {pos.short}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{pos.label}</div>
                            <div className="text-xs text-slate-500">
                              {(offenseChart[pos.id] || []).filter(id => id && roster.find(p => p.id === id)).length} players in depth chart
                            </div>
                          </div>
                          <Plus size={18} className="text-slate-400" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
