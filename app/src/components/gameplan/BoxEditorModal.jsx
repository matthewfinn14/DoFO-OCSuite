import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { X, Search, Trash2, GripVertical, ChevronUp, ChevronDown, ArrowRight, Plus } from 'lucide-react';
import { usePlayBank } from '../../context/PlayBankContext';
import { getPlayCall } from '../../utils/playDisplay';

export default function BoxEditorModal({
  box,
  sectionIdx,
  boxIdx,
  plays,
  gamePlan,
  isLocked,
  onClose,
  onSave,
  onDelete,
  onAddPlayToQuickList,
  onRemovePlayFromQuickList,
  onReorderQuickList,
  onAssignPlayToCell,
  onRemovePlayFromCell,
  getPlaysForSet,
  getPlayDisplayName,
  setupConfig,
  onFZDnDCellAssign,
  onFZDnDCellRemove,
  onMatrixCellAdd,
  onMatrixCellRemove
}) {
  const { quickAddRequest } = usePlayBank();
  const [localBox, setLocalBox] = useState({ ...box });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'settings', 'editor'
  const [draggedQuickListIdx, setDraggedQuickListIdx] = useState(null);
  const [dragOverQuickListIdx, setDragOverQuickListIdx] = useState(null);
  const [isQuickListDropTarget, setIsQuickListDropTarget] = useState(false);
  const [showRightHash, setShowRightHash] = useState(false); // R columns collapsed by default
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // Track original box state for comparison
  const originalBoxRef = useRef(JSON.stringify(box));

  // Quick Add Request Handling
  const lastProcessedQuickAddRef = useRef(0);

  useEffect(() => {
    if (quickAddRequest && quickAddRequest.timestamp > lastProcessedQuickAddRef.current) {
      lastProcessedQuickAddRef.current = quickAddRequest.timestamp;

      // Add play to local quick list
      onAddPlayToQuickList(box.setId, quickAddRequest.playId);
    }
  }, [quickAddRequest, onAddPlayToQuickList, box.setId]);

  // Get Quick List plays (assignedPlayIds)
  const quickListPlays = useMemo(() => {
    const setId = box.setId;
    if (!setId) return [];

    // Find set data from gamePlan
    let setData = null;
    if (Array.isArray(gamePlan?.sets)) {
      setData = gamePlan.sets.find(s => s.id === setId);
    } else if (gamePlan?.sets) {
      setData = gamePlan.sets[setId];
    }

    if (!setData && setId.startsWith('ms_')) {
      if (Array.isArray(gamePlan?.miniScripts)) {
        setData = gamePlan.miniScripts.find(s => s.id === setId);
      } else if (gamePlan?.miniScripts) {
        setData = gamePlan.miniScripts[setId];
      }
    }

    const getAssignedSetIds = () => {
      const assigned = new Set();
      // Check Grid assignments
      if (localBox.assignedPlayIds) {
        localBox.assignedPlayIds.forEach(id => id && id !== 'GAP' && assigned.add(id));
      }
      // Check Script assignments
      if (localBox.rows) {
        localBox.rows.forEach(row => {
          if (row.content) assigned.add(row.content);
          if (row.contentRight) assigned.add(row.contentRight);
        });
      }
      return assigned;
    };

    const assignedInBox = getAssignedSetIds();

    // Use playIds as the source of truth for "Available Plays" (Quick List)
    // Fallback to assignedPlayIds if playIds is missing
    const availablePlayIds = setData?.playIds || setData?.assignedPlayIds || [];

    return availablePlayIds
      .map(playId => plays.find(p => p.id === playId))
      .filter(p => p && !assignedInBox.has(p.id));
  }, [box.setId, gamePlan, plays, localBox.assignedPlayIds, localBox.rows]);

  // Filter available plays for search
  const filteredPlays = useMemo(() => {
    if (!searchTerm) return [];
    const search = searchTerm.toLowerCase();
    const quickListIds = new Set(quickListPlays.map(p => p.id));
    return plays
      .filter(p =>
        !quickListIds.has(p.id) &&
        (p.name?.toLowerCase().includes(search) ||
          p.formation?.toLowerCase().includes(search))
      )
      .slice(0, 20);
  }, [plays, searchTerm, quickListPlays]);

  // Get script columns (1 or 2)
  const scriptColumns = localBox.scriptColumns || 2;

  // Get current script rows
  const scriptRows = localBox.rows || [];

  // Handle saving settings
  const handleSave = () => {
    onSave(localBox);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const currentState = JSON.stringify(localBox);
    return currentState !== originalBoxRef.current;
  }, [localBox]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  // Handle discard and close
  const handleDiscardAndClose = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    onClose();
  }, [onClose]);

  // Handle save and close
  const handleSaveAndClose = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    onSave(localBox);
    onClose();
  }, [onSave, localBox, onClose]);

  const updateField = (field, value) => {
    setLocalBox(prev => ({ ...prev, [field]: value }));
  };

  // Handle Quick List drag start
  const handleQuickListDragStart = (e, idx) => {
    if (isLocked) return;
    setDraggedQuickListIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Send Play ID for dropping into grid/script, and keep tracking index via state for reordering
    if (quickListPlays[idx]) {
      e.dataTransfer.setData('text/plain', quickListPlays[idx].id);
    }
  };

  // Handle Quick List drag over
  const handleQuickListDragOver = (e, idx) => {
    e.preventDefault();
    if (isLocked || draggedQuickListIdx === null) return;
    setDragOverQuickListIdx(idx);
  };

  // Handle Quick List drop
  const handleQuickListDrop = (e, targetIdx) => {
    e.preventDefault();

    // Check for Sidebar Play Drop
    const playData = e.dataTransfer.getData('application/react-dnd');
    if (playData) {
      try {
        const { playId } = JSON.parse(playData);
        if (playId) {
          onAddPlayToQuickList(box.setId, playId);
        }
      } catch (err) {
        console.error('Error parsing drop data:', err);
      }
      return;
    }

    if (isLocked || draggedQuickListIdx === null) return;

    if (draggedQuickListIdx !== targetIdx) {
      onReorderQuickList(box.setId, draggedQuickListIdx, targetIdx);
    }

    setDraggedQuickListIdx(null);
    setDragOverQuickListIdx(null);
  };

  // Handle Quick List drag end
  const handleQuickListDragEnd = () => {
    setDraggedQuickListIdx(null);
    setDragOverQuickListIdx(null);
  };

  // Handle drop on Quick List container (from grid cells)
  const handleQuickListContainerDragOver = (e) => {
    e.preventDefault();
    const gridCellData = e.dataTransfer.types.includes('application/grid-cell');
    if (gridCellData && !isLocked) {
      setIsQuickListDropTarget(true);
    }
  };

  const handleQuickListContainerDragLeave = (e) => {
    // Only reset if we're actually leaving the container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsQuickListDropTarget(false);
    }
  };

  const handleQuickListContainerDrop = (e) => {
    e.preventDefault();
    setIsQuickListDropTarget(false);

    const gridCellData = e.dataTransfer.getData('application/grid-cell');
    if (gridCellData && !isLocked) {
      try {
        const { fromCellIdx } = JSON.parse(gridCellData);
        // Remove the play from the grid cell - it stays in Quick List
        handleRemoveFromGridCell(fromCellIdx);
      } catch (err) {
        console.error('Error parsing grid cell data:', err);
      }
    }
  };

  // Move play in Quick List
  const handleMoveQuickListPlay = (playId, direction) => {
    const currentIdx = quickListPlays.findIndex(p => p.id === playId);
    if (currentIdx === -1) return;

    const newIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0 || newIdx >= quickListPlays.length) return;

    onReorderQuickList(box.setId, currentIdx, newIdx);
  };

  // Assign play from Quick List to script row
  const handleAssignToScriptRow = (playId, rowIdx, column) => {
    if (isLocked) return;

    // Update local state
    setLocalBox(prev => {
      const next = { ...prev };
      const newRows = [...(next.rows || [])];
      while (newRows.length <= rowIdx) {
        newRows.push({ label: newRows.length + 1, content: null, contentRight: null });
      }

      if (column === 'left' || column === 'content') {
        newRows[rowIdx] = { ...newRows[rowIdx], content: playId };
      } else {
        newRows[rowIdx] = { ...newRows[rowIdx], contentRight: playId };
      }
      next.rows = newRows;
      return next;
    });

    onAssignPlayToCell(box.setId, rowIdx, column, playId);
  };

  // Remove play from script row
  const handleRemoveFromScriptRow = (rowIdx, column) => {
    if (isLocked) return;

    // Update local state
    setLocalBox(prev => {
      const next = { ...prev };
      const newRows = [...(next.rows || [])];
      if (newRows[rowIdx]) {
        if (column === 'left' || column === 'content') {
          newRows[rowIdx] = { ...newRows[rowIdx], content: null };
        } else {
          newRows[rowIdx] = { ...newRows[rowIdx], contentRight: null };
        }
        next.rows = newRows;
      }
      return next;
    });

    onRemovePlayFromCell(box.setId, rowIdx, column);
  };

  // Assign play from Quick List to grid cell
  const handleAssignToGridCell = (playId, cellIdx) => {
    if (isLocked) return;

    const isSpreadsheet = box.isSpreadsheetHeader;

    // Update local state
    setLocalBox(prev => {
      const next = { ...prev };
      const cols = next.gridColumns || 4;
      const rowsCount = next.gridRows || 5;
      const newAssigned = [...(next.assignedPlayIds || [])];

      if (isSpreadsheet) {
        // For spreadsheet: store by row index
        const rowIdx = Math.floor(cellIdx / cols);
        while (newAssigned.length <= rowIdx) {
          newAssigned.push(null);
        }
        newAssigned[rowIdx] = playId;
      } else {
        // Standard grid: store by flat cell index
        const totalSlots = cols * rowsCount;
        while (newAssigned.length < totalSlots) {
          newAssigned.push('GAP');
        }
        newAssigned[cellIdx] = playId;
      }
      next.assignedPlayIds = newAssigned;
      return next;
    });

    // For spreadsheet headers, pass row index to the handler
    if (isSpreadsheet) {
      const cols = localBox.gridColumns || 1;
      const rowIdx = Math.floor(cellIdx / cols);
      onAssignPlayToCell(box.setId, rowIdx, null, playId);
    } else {
      onAssignPlayToCell(box.setId, cellIdx, null, playId);
    }
  };

  // Remove play from grid cell
  const handleRemoveFromGridCell = (cellIdx) => {
    if (isLocked) return;

    const isSpreadsheet = box.isSpreadsheetHeader;

    // Update local state
    setLocalBox(prev => {
      const next = { ...prev };
      const cols = next.gridColumns || 4;
      const newAssigned = [...(next.assignedPlayIds || [])];

      if (isSpreadsheet) {
        // For spreadsheet: clear by row index
        const rowIdx = Math.floor(cellIdx / cols);
        if (newAssigned[rowIdx]) {
          newAssigned[rowIdx] = null;
          next.assignedPlayIds = newAssigned;
        }
      } else {
        // Standard grid: clear by flat cell index
        if (newAssigned[cellIdx]) {
          newAssigned[cellIdx] = 'GAP';
          next.assignedPlayIds = newAssigned;
        }
      }
      return next;
    });

    // For spreadsheet headers, pass row index to the handler
    if (isSpreadsheet) {
      const cols = localBox.gridColumns || 1;
      const rowIdx = Math.floor(cellIdx / cols);
      onRemovePlayFromCell(box.setId, rowIdx, null);
    } else {
      onRemovePlayFromCell(box.setId, cellIdx, null);
    }
  };

  // Get grid cell plays
  const getGridCellPlays = () => {
    const cols = localBox.gridColumns || 4;
    const rowsCount = localBox.gridRows || 5;
    const totalSlots = cols * rowsCount;

    // Get assigned plays from box or gamePlan
    let assignedPlayIds = localBox.assignedPlayIds || [];

    // Also check gamePlan sets IF localBox is fresh/empty but backend has assignments
    // Note: We use assignedPlayIds for GRID placement.
    // Do NOT use playIds (pool) for grid placement.
    if (box.setId && (!assignedPlayIds || assignedPlayIds.length === 0)) {
      let setData = null;
      if (Array.isArray(gamePlan?.sets)) {
        setData = gamePlan.sets.find(s => s.id === box.setId);
      }
      if (setData?.assignedPlayIds) {
        assignedPlayIds = setData.assignedPlayIds;
      }
    }

    const gridPlays = [];

    // For spreadsheet headers, plays are stored by row index (one per row)
    // Map them to the first column of each row in the multi-column display
    const isSpreadsheet = box.isSpreadsheetHeader;

    for (let i = 0; i < totalSlots; i++) {
      if (isSpreadsheet) {
        // For spreadsheet: only first column of each row has a play
        const rowIdx = Math.floor(i / cols);
        const colIdx = i % cols;
        if (colIdx === 0) {
          // First column - get play from row index
          const playId = assignedPlayIds[rowIdx];
          if (playId && playId !== 'GAP') {
            const play = plays.find(p => p.id === playId);
            gridPlays.push(play || null);
          } else {
            gridPlays.push(null);
          }
        } else {
          // Other columns are empty for spreadsheet mode
          gridPlays.push(null);
        }
      } else {
        // Standard grid: flat index mapping
        const playId = assignedPlayIds[i];
        if (playId && playId !== 'GAP') {
          const play = plays.find(p => p.id === playId);
          gridPlays.push(play || null);
        } else {
          gridPlays.push(null);
        }
      }
    }
    return gridPlays;
  };

  // Render Quick List panel (left side)
  const renderQuickListPanel = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Search to add plays */}
        <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }} />
            <input
              id="box-editor-play-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plays to add..."
              disabled={isLocked}
              style={{
                width: '100%',
                padding: '8px 8px 8px 32px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Search Results */}
          {filteredPlays.length > 0 && (
            <div style={{
              marginTop: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              maxHeight: '150px',
              overflowY: 'auto',
              background: 'white'
            }}>
              {filteredPlays.map(play => (
                <div
                  key={play.id}
                  onClick={() => {
                    if (!isLocked) {
                      onAddPlayToQuickList(box.setId, play.id);
                      setSearchTerm('');
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'white'
                  }}
                  onMouseEnter={(e) => !isLocked && (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>
                      {getPlayDisplayName ? getPlayDisplayName(play) : getPlayCall(play)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} className="text-sky-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick List Header */}
        <div style={{
          padding: '10px 12px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontWeight: '600',
          fontSize: '0.8rem',
          color: '#334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Quick List</span>
          <span style={{
            background: '#e2e8f0',
            color: '#64748b',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.75rem'
          }}>
            {quickListPlays.length}
          </span>
        </div>

        {/* Quick List Items */}
        <div
          onDragOver={handleQuickListContainerDragOver}
          onDragLeave={handleQuickListContainerDragLeave}
          onDrop={handleQuickListContainerDrop}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
            background: isQuickListDropTarget ? '#dbeafe' : 'transparent',
            border: isQuickListDropTarget ? '2px dashed #3b82f6' : '2px solid transparent',
            borderRadius: '4px',
            transition: 'background 0.15s, border-color 0.15s'
          }}>
          {quickListPlays.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '0.875rem'
            }}>
              Search and add plays to your Quick List, then assign them to slots.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {quickListPlays.map((play, idx) => {
                const isDragging = draggedQuickListIdx === idx;
                const isDragOver = dragOverQuickListIdx === idx;

                return (
                  <div
                    key={play.id}
                    draggable={!isLocked}
                    onDragStart={(e) => handleQuickListDragStart(e, idx)}
                    onDragOver={(e) => handleQuickListDragOver(e, idx)}
                    onDrop={(e) => handleQuickListDrop(e, idx)}
                    onDragEnd={handleQuickListDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 6px',
                      background: isDragOver ? '#dbeafe' : (isDragging ? '#f1f5f9' : 'white'),
                      border: isDragOver ? '2px dashed #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '4px',
                      opacity: isDragging ? 0.5 : 1,
                      cursor: isLocked ? 'default' : 'grab'
                    }}
                  >
                    {!isLocked && (
                      <GripVertical size={12} className="text-slate-400 flex-shrink-0" />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#1e293b',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {getPlayDisplayName ? getPlayDisplayName(play) : getPlayCall(play)}
                      </div>
                    </div>

                    {!isLocked && (
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '0px' }}>
                        <button
                          onClick={() => handleMoveQuickListPlay(play.id, 'up')}
                          disabled={idx === 0}
                          style={{
                            padding: '1px',
                            background: 'none',
                            border: 'none',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.3 : 1,
                            color: '#64748b'
                          }}
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => handleMoveQuickListPlay(play.id, 'down')}
                          disabled={idx === quickListPlays.length - 1}
                          style={{
                            padding: '1px',
                            background: 'none',
                            border: 'none',
                            cursor: idx === quickListPlays.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === quickListPlays.length - 1 ? 0.3 : 1,
                            color: '#64748b'
                          }}
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    )}

                    {!isLocked && (
                      <button
                        onClick={() => onRemovePlayFromQuickList(box.setId, play.id)}
                        style={{
                          padding: '4px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={14} />
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
  };

  // Render Script Editor (right panel for script type)
  const renderScriptEditor = () => {
    const numRows = scriptRows.length || 10;
    const cols = scriptColumns;

    return (
      <div style={{ padding: '12px', overflowY: 'auto', height: '100%' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
          {/* Column Type */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
              Columns
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => !isLocked && updateField('scriptColumns', 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: cols === 1 ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: cols === 1 ? '#eff6ff' : 'white',
                  color: cols === 1 ? '#3b82f6' : '#64748b',
                  fontWeight: cols === 1 ? '600' : '400',
                  fontSize: '0.85rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
              >
                Single Column
              </button>
              <button
                onClick={() => !isLocked && updateField('scriptColumns', 2)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: cols === 2 ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: cols === 2 ? '#eff6ff' : 'white',
                  color: cols === 2 ? '#3b82f6' : '#64748b',
                  fontWeight: cols === 2 ? '600' : '400',
                  fontSize: '0.85rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
              >
                Left / Right Hash
              </button>
            </div>
          </div>

          {/* Row Count */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
              Rows
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  if (isLocked) return;
                  const newCount = Math.max(1, numRows - 1);
                  const newRows = Array(newCount).fill(null).map((_, i) => ({
                    label: i + 1,
                    content: scriptRows[i]?.content || null,
                    contentRight: scriptRows[i]?.contentRight || null
                  }));
                  updateField('rows', newRows);
                }}
                disabled={isLocked || numRows <= 1}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  cursor: isLocked || numRows <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={numRows}
                disabled={isLocked}
                onChange={(e) => {
                  const count = Math.max(1, Math.min(50, parseInt(e.target.value) || 10));
                  const newRows = Array(count).fill(null).map((_, i) => ({
                    label: i + 1,
                    content: scriptRows[i]?.content || null,
                    contentRight: scriptRows[i]?.contentRight || null
                  }));
                  updateField('rows', newRows);
                }}
                style={{
                  width: '50px',
                  padding: '6px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (isLocked) return;
                  const newCount = Math.min(50, numRows + 1);
                  const newRows = Array(newCount).fill(null).map((_, i) => ({
                    label: i + 1,
                    content: scriptRows[i]?.content || null,
                    contentRight: scriptRows[i]?.contentRight || null
                  }));
                  updateField('rows', newRows);
                }}
                disabled={isLocked || numRows >= 50}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  cursor: isLocked || numRows >= 50 ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Script Rows */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: cols === 2 ? '40px 1fr 1fr' : '40px 1fr',
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: '600',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <div style={{ padding: '8px', textAlign: 'center' }}>#</div>
            {cols === 2 ? (
              <>
                <div style={{ padding: '8px', borderLeft: '1px solid #e2e8f0' }}>LEFT HASH</div>
                <div style={{ padding: '8px', borderLeft: '1px solid #e2e8f0' }}>RIGHT HASH</div>
              </>
            ) : (
              <div style={{ padding: '8px', borderLeft: '1px solid #e2e8f0' }}>PLAY</div>
            )}
          </div>

          {/* Rows */}
          {Array(numRows).fill(null).map((_, rowIdx) => {
            const row = scriptRows[rowIdx] || {};
            const leftPlay = plays.find(p => p.id === row.content);
            const rightPlay = plays.find(p => p.id === row.contentRight);

            return (
              <div
                key={rowIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: cols === 2 ? '40px 1fr 1fr' : '40px 1fr',
                  borderBottom: rowIdx < numRows - 1 ? '1px solid #f1f5f9' : 'none'
                }}
              >
                <div style={{
                  padding: '8px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  background: '#fafafa'
                }}>
                  {rowIdx + 1}
                </div>

                {/* Left/Single column */}
                <div
                  style={{
                    padding: '6px 8px',
                    borderLeft: '1px solid #e2e8f0',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: leftPlay?.priority ? '#fef9c3' : 'white',
                    cursor: isLocked ? 'default' : 'pointer'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = '#dbeafe';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.background = leftPlay?.priority ? '#fef9c3' : 'white';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = leftPlay?.priority ? '#fef9c3' : 'white';
                    const playId = e.dataTransfer.getData('text/plain');
                    const play = plays.find(p => p.id === playId) || quickListPlays.find(p => p.id === playId);
                    if (play && !isLocked) {
                      handleAssignToScriptRow(play.id, rowIdx, 'left');
                    }
                  }}
                >
                  {leftPlay ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '0.85rem' }}>
                        {getPlayDisplayName ? getPlayDisplayName(leftPlay) : leftPlay.name}
                      </span>
                      {!isLocked && (
                        <button
                          onClick={() => handleRemoveFromScriptRow(rowIdx, 'left')}
                          style={{
                            marginLeft: 'auto',
                            padding: '2px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      Drop play here
                    </span>
                  )}
                </div>

                {/* Right column (if 2 columns) */}
                {cols === 2 && (
                  <div
                    style={{
                      padding: '6px 8px',
                      borderLeft: '1px solid #e2e8f0',
                      minHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: rightPlay?.priority ? '#fef9c3' : 'white',
                      cursor: isLocked ? 'default' : 'pointer'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = '#dbeafe';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.background = rightPlay?.priority ? '#fef9c3' : 'white';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = rightPlay?.priority ? '#fef9c3' : 'white';

                      let playId = e.dataTransfer.getData('text/plain');

                      // Check for Sidebar Play Drop
                      if (!playId) {
                        const playData = e.dataTransfer.getData('application/react-dnd');
                        if (playData) {
                          try {
                            const parsed = JSON.parse(playData);
                            if (parsed.playId) playId = parsed.playId;
                          } catch (err) {
                            console.error('Error parsing drop data:', err);
                          }
                        }
                      }

                      const play = plays.find(p => p.id === playId) || quickListPlays.find(p => p.id === playId);
                      if (play && !isLocked) {
                        handleAssignToScriptRow(play.id, rowIdx, 'right');
                      }
                    }}
                  >
                    {rightPlay ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '0.85rem' }}>
                          {getPlayDisplayName ? getPlayDisplayName(rightPlay) : rightPlay.name}
                        </span>
                        {!isLocked && (
                          <button
                            onClick={() => handleRemoveFromScriptRow(rowIdx, 'right')}
                            style={{
                              marginLeft: 'auto',
                              padding: '2px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        Drop play here
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    );
  };

  // Render Grid Editor (right panel for grid type)
  const renderGridEditor = () => {
    const cols = localBox.gridColumns || 4;
    const rowsCount = localBox.gridRows || 5;
    const headings = localBox.gridHeadings || Array(cols).fill('').map((_, i) =>
      i === 0 ? 'LEFT HASH' : (i === cols - 1 ? 'NOTES' : `COL ${i + 1}`)
    );
    const gridPlays = getGridCellPlays();

    return (
      <div style={{ padding: '12px', overflowY: 'auto', height: '100%' }}>
        {/* Grid Preview */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{
              padding: '6px',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              {localBox.cornerLabel || '#'}
            </div>
            {headings.slice(0, cols).map((h, i) => (
              <div key={i} style={{
                padding: '6px',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: '#64748b',
                textAlign: 'center',
                borderLeft: '1px solid #e2e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {Array(rowsCount).fill(null).map((_, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                borderBottom: rowIdx < rowsCount - 1 ? '1px solid #f1f5f9' : 'none'
              }}
            >
              <div style={{
                padding: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#94a3b8',
                textAlign: 'center',
                background: '#fafafa'
              }}>
                {(localBox.gridRowLabels && localBox.gridRowLabels[rowIdx]) || (rowIdx + 1)}
              </div>
              {Array(cols).fill(null).map((_, colIdx) => {
                const cellIdx = rowIdx * cols + colIdx;
                const play = gridPlays[cellIdx];

                return (
                  <div
                    key={colIdx}
                    style={{
                      padding: '4px 6px',
                      borderLeft: '1px solid #e2e8f0',
                      minHeight: '32px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: play?.priority ? '#fef9c3' : 'white',
                      cursor: isLocked ? 'default' : 'pointer'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = '#dbeafe';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.background = play?.priority ? '#fef9c3' : 'white';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = play?.priority ? '#fef9c3' : 'white';

                      // Check if this is a move from another grid cell
                      const gridCellData = e.dataTransfer.getData('application/grid-cell');
                      if (gridCellData && !isLocked) {
                        try {
                          const { playId, fromCellIdx } = JSON.parse(gridCellData);
                          if (fromCellIdx !== cellIdx) {
                            // Move play from one cell to another
                            handleRemoveFromGridCell(fromCellIdx);
                            handleAssignToGridCell(playId, cellIdx);
                          }
                          return;
                        } catch (err) {
                          console.error('Error parsing grid cell data:', err);
                        }
                      }

                      let playId = e.dataTransfer.getData('text/plain');

                      // Check for Sidebar Play Drop
                      if (!playId) {
                        const playData = e.dataTransfer.getData('application/react-dnd');
                        if (playData) {
                          try {
                            const parsed = JSON.parse(playData);
                            if (parsed.playId) playId = parsed.playId;
                          } catch (err) {
                            console.error('Error parsing drop data:', err);
                          }
                        }
                      }

                      const droppedPlay = plays.find(p => p.id === playId) || quickListPlays.find(p => p.id === playId);
                      if (droppedPlay && !isLocked) {
                        handleAssignToGridCell(droppedPlay.id, cellIdx);
                      }
                    }}
                  >
                    {play ? (
                      <div
                        draggable={!isLocked}
                        onDragStart={(e) => {
                          if (isLocked) return;
                          e.dataTransfer.setData('text/plain', play.id);
                          e.dataTransfer.setData('application/grid-cell', JSON.stringify({ playId: play.id, fromCellIdx: cellIdx }));
                          e.dataTransfer.effectAllowed = 'move';
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flex: 1,
                          overflow: 'hidden',
                          cursor: isLocked ? 'default' : 'grab'
                        }}
                      >
                        <GripVertical size={12} style={{ color: '#94a3b8', flexShrink: 0, cursor: 'grab' }} />
                        <span style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {getPlayDisplayName ? getPlayDisplayName(play) : getPlayCall(play)}
                        </span>
                        {!isLocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromGridCell(cellIdx);
                            }}
                            style={{
                              marginLeft: 'auto',
                              padding: '1px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              flexShrink: 0
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#e2e8f0' }}>-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Grid dimensions info */}
        <div style={{
          marginTop: '12px',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          Drag plays from Quick List to assign them to grid cells. Go to Settings tab to change grid dimensions.
        </div>
      </div>
    );
  };

  // Render FZDnD Editor (right panel for fzdnd type)
  const renderFZDnDEditor = () => {
    // Get zone info from setupConfig
    const zone = setupConfig?.fieldZones?.find(z => z.id === localBox.zoneId);
    const zoneColor = zone?.color || localBox.color || '#dc2626';

    // Get columns based on columnSource (matching SheetView logic)
    let columns;
    const columnSource = localBox.columnSource || 'downDistance';
    if (columnSource === 'custom' && localBox.customColumns?.length > 0) {
      columns = localBox.customColumns;
    } else if (columnSource === 'playPurpose') {
      const allPurposes = (setupConfig?.playPurposes || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(p => ({ id: p.id, name: p.name, color: p.color }));
      // Filter by selected if specified
      const selectedIds = localBox.selectedPurposes;
      columns = selectedIds ? allPurposes.filter(p => selectedIds.includes(p.id)) : allPurposes;
    } else {
      // Default to downDistance
      const allDD = [...(setupConfig?.downDistanceCategories || [])]
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      // Filter by selected if specified
      const selectedIds = localBox.selectedDownDistance;
      columns = selectedIds ? allDD.filter(d => selectedIds.includes(d.id)) : allDD;
    }

    const rowCount = localBox.rowCount || 5;
    const cols = columns.length || 1;

    // Get play for a cell
    const getPlayForCell = (rowIdx, colId) => {
      const setId = `${localBox.setId}_${colId}`;
      const set = gamePlan?.sets?.find(s => s.id === setId);
      const playId = set?.playIds?.[rowIdx];
      return playId ? plays.find(p => p.id === playId) : null;
    };

    return (
      <div style={{ padding: '12px', overflowY: 'auto', height: '100%' }}>
        {/* Zone Header */}
        <div style={{
          padding: '8px 12px',
          background: zoneColor,
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '6px 6px 0 0',
          marginBottom: '0'
        }}>
          {zone?.name || localBox.header}
        </div>

        {/* FZDnD Grid */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          overflow: 'hidden'
        }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{
              padding: '6px',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              #
            </div>
            {columns.map((col, i) => (
              <div key={col.id} style={{
                padding: '6px',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: '#64748b',
                textAlign: 'center',
                borderLeft: '1px solid #e2e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {col.name}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {Array(rowCount).fill(null).map((_, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                borderBottom: rowIdx < rowCount - 1 ? '1px solid #f1f5f9' : 'none'
              }}
            >
              <div style={{
                padding: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#94a3b8',
                textAlign: 'center',
                background: '#fafafa'
              }}>
                {rowIdx + 1}
              </div>
              {columns.map((col, colIdx) => {
                const play = getPlayForCell(rowIdx, col.id);

                return (
                  <div
                    key={col.id}
                    style={{
                      padding: '4px 6px',
                      borderLeft: '1px solid #e2e8f0',
                      minHeight: '32px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: play?.priority ? '#fef9c3' : (rowIdx % 2 === 1 ? '#f8fafc' : 'white'),
                      cursor: isLocked ? 'default' : 'pointer'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = '#dbeafe';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.background = play?.priority ? '#fef9c3' : (rowIdx % 2 === 1 ? '#f8fafc' : 'white');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = play?.priority ? '#fef9c3' : (rowIdx % 2 === 1 ? '#f8fafc' : 'white');

                      let playId = e.dataTransfer.getData('text/plain');
                      if (!playId) {
                        const playData = e.dataTransfer.getData('application/react-dnd');
                        if (playData) {
                          try {
                            const parsed = JSON.parse(playData);
                            if (parsed.playId) playId = parsed.playId;
                          } catch (err) {
                            console.error('Error parsing drop data:', err);
                          }
                        }
                      }

                      if (playId && !isLocked && onFZDnDCellAssign) {
                        onFZDnDCellAssign(localBox.setId, rowIdx, col.id, playId);
                      }
                    }}
                  >
                    {play ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flex: 1,
                        overflow: 'hidden'
                      }}>
                        <span style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {getPlayDisplayName ? getPlayDisplayName(play) : getPlayCall(play)}
                        </span>
                        {!isLocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onFZDnDCellRemove) {
                                onFZDnDCellRemove(localBox.setId, rowIdx, col.id);
                              }
                            }}
                            style={{
                              marginLeft: 'auto',
                              padding: '1px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              flexShrink: 0
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#e2e8f0' }}>-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Help text */}
        <div style={{
          marginTop: '12px',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          Drag plays from Quick List to assign them to zone cells. Go to Settings tab to change zone and row count.
        </div>
      </div>
    );
  };

  // Render Matrix Editor (right panel for matrix type)
  const renderMatrixEditor = () => {
    const playTypes = localBox.playTypes || [
      { id: 'strong_run', label: 'STRONG RUN' },
      { id: 'weak_run', label: 'WEAK RUN' },
      { id: 'quick_game', label: 'QUICK GAME' },
      { id: 'drop_back', label: 'DROPBACK' }
    ];
    const hashGroups = localBox.hashGroups || [
      { id: 'FB', label: 'BASE', cols: ['FB_L', 'FB_R'] },
      { id: 'CU', label: 'CONVERT', cols: ['CU_L', 'CU_R'] }
    ];

    // Filter columns based on showRightHash toggle - only show L columns when collapsed
    const filteredHashGroups = hashGroups.map(g => ({
      ...g,
      cols: showRightHash ? g.cols : g.cols.filter(c => c.endsWith('_L'))
    }));

    // Flatten all columns (filtered)
    const allCols = filteredHashGroups.flatMap(g => g.cols);

    // Get plays for a cell (multiple plays allowed)
    const getPlaysForCell = (playTypeId, colId) => {
      const setId = `${localBox.setId}_${playTypeId}_${colId}`;
      const set = gamePlan?.sets?.find(s => s.id === setId);
      return (set?.playIds || []).map(id => plays.find(p => p.id === id)).filter(Boolean);
    };

    return (
      <div style={{ padding: '12px', overflowY: 'auto', height: '100%' }}>
        {/* Formation Header with R Hash Toggle */}
        <div style={{
          padding: '8px 12px',
          background: localBox.color || '#3b82f6',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '6px 6px 0 0',
          marginBottom: '0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{localBox.formationLabel || localBox.header} Matrix</span>
          <button
            onClick={() => setShowRightHash(!showRightHash)}
            style={{
              padding: '4px 8px',
              fontSize: '0.7rem',
              background: showRightHash ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {showRightHash ? 'Hide R Hash' : 'Show R Hash'}
          </button>
        </div>

        {/* Matrix Grid */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          overflow: 'hidden'
        }}>
          {/* Hash Group Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${allCols.length}, 1fr)`,
            background: '#334155'
          }}>
            <div style={{
              padding: '6px',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: 'white',
              textAlign: 'center'
            }}>
              TYPE
            </div>
            {filteredHashGroups.map((group, gIdx) => (
              group.cols.map((colId, cIdx) => (
                <div key={colId} style={{
                  padding: '4px',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  color: 'white',
                  textAlign: 'center',
                  background: cIdx === 0 && gIdx > 0 ? '#475569' : '#334155',
                  borderLeft: cIdx === 0 && gIdx > 0 ? '2px solid #1e293b' : '1px solid #475569'
                }}>
                  {group.label} {colId.endsWith('_L') ? 'L' : 'R'}
                </div>
              ))
            ))}
          </div>

          {/* Play Type Rows */}
          {playTypes.map((pt, ptIdx) => (
            <div
              key={pt.id}
              style={{
                display: 'grid',
                gridTemplateColumns: `80px repeat(${allCols.length}, 1fr)`,
                borderBottom: ptIdx < playTypes.length - 1 ? '1px solid #e2e8f0' : 'none'
              }}
            >
              <div style={{
                padding: '6px',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: '#1e40af',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center'
              }}>
                {pt.label}
              </div>
              {allCols.map((colId, colIdx) => {
                const cellPlays = getPlaysForCell(pt.id, colId);
                const groupIdx = filteredHashGroups.findIndex(g => g.cols.includes(colId));
                const isFirstInGroup = filteredHashGroups[groupIdx]?.cols[0] === colId;

                return (
                  <div
                    key={colId}
                    style={{
                      padding: '4px',
                      minHeight: '40px',
                      background: ptIdx % 2 === 1 ? '#f8fafc' : 'white',
                      borderLeft: isFirstInGroup && groupIdx > 0 ? '2px solid #cbd5e1' : '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = '#dbeafe';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.background = ptIdx % 2 === 1 ? '#f8fafc' : 'white';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = ptIdx % 2 === 1 ? '#f8fafc' : 'white';

                      let playId = e.dataTransfer.getData('text/plain');
                      if (!playId) {
                        const playData = e.dataTransfer.getData('application/react-dnd');
                        if (playData) {
                          try {
                            const parsed = JSON.parse(playData);
                            if (parsed.playId) playId = parsed.playId;
                          } catch (err) {
                            console.error('Error parsing drop data:', err);
                          }
                        }
                      }

                      if (playId && !isLocked && onMatrixCellAdd) {
                        onMatrixCellAdd(localBox.setId, pt.id, colId, playId);
                      }
                    }}
                  >
                    {cellPlays.map((p, i) => (
                      <div key={i} style={{
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        color: '#1e293b',
                        background: p.priority ? '#fef08a' : '#f1f5f9',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '4px'
                      }}>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {getPlayDisplayName ? getPlayDisplayName(p) : getPlayCall(p)}
                        </span>
                        {!isLocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onMatrixCellRemove) {
                                onMatrixCellRemove(localBox.setId, pt.id, colId, p.id);
                              }
                            }}
                            style={{
                              padding: '0',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              flexShrink: 0,
                              lineHeight: 1
                            }}
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                    {cellPlays.length === 0 && (
                      <span style={{ color: '#cbd5e1', fontSize: '0.65rem' }}>Drop play</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Help text */}
        <div style={{
          marginTop: '12px',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          Drag plays from Quick List to assign them. Multiple plays per cell allowed. Go to Settings tab to customize play types and hash groups.
        </div>
      </div>
    );
  };

  // Render Settings tab
  const renderSettings = () => {
    return (
      <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
        {/* Basic Settings */}
        <div className="box-editor-section">
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>Basic Settings</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="box-editor-header-title" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Header Title
              </label>
              <input
                id="box-editor-header-title"
                type="text"
                value={localBox.header || ''}
                onChange={(e) => updateField('header', e.target.value)}
                disabled={isLocked}
                placeholder="Box title..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label htmlFor="box-editor-box-type" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Box Type
              </label>
              <select
                id="box-editor-box-type"
                value={localBox.type || 'grid'}
                onChange={(e) => {
                  const newType = e.target.value;
                  updateField('type', newType);
                  // Set sensible defaults for new types
                  if (newType === 'fzdnd' && !localBox.zoneId) {
                    const firstZone = setupConfig?.fieldZones?.[0];
                    if (firstZone) {
                      updateField('zoneId', firstZone.id);
                      updateField('header', firstZone.name);
                      updateField('color', firstZone.color || '#dc2626');
                    }
                  }
                  if (newType === 'matrix' && !localBox.formationId) {
                    updateField('playTypes', [
                      { id: 'strong_run', label: 'STRONG RUN' },
                      { id: 'weak_run', label: 'WEAK RUN' },
                      { id: 'quick_game', label: 'QUICK GAME' },
                      { id: 'drop_back', label: 'DROPBACK' }
                    ]);
                    updateField('hashGroups', [
                      { id: 'FB', label: 'BASE', cols: ['FB_L', 'FB_R'] },
                      { id: 'CU', label: 'CONVERT', cols: ['CU_L', 'CU_R'] }
                    ]);
                  }
                }}
                disabled={isLocked}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="grid">Grid</option>
                <option value="script">Script</option>
                <option value="fzdnd">FZDnD Zone</option>
                <option value="matrix">Matrix</option>
                <option value="list">Simple List</option>
              </select>
            </div>
            <div>
              <label htmlFor="box-editor-column-span" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Column Span (1-7)
              </label>
              <input
                id="box-editor-column-span"
                type="number"
                min="1"
                max="7"
                value={localBox.colSpan || 3}
                onChange={(e) => updateField('colSpan', parseInt(e.target.value) || 3)}
                disabled={isLocked}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Color Settings - Organized Section */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>Color Settings</h4>

            {/* Header Colors */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                Header
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label htmlFor="box-editor-header-color" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                    Background
                  </label>
                  <input
                    id="box-editor-header-color"
                    type="color"
                    value={localBox.color || '#3b82f6'}
                    onChange={(e) => updateField('color', e.target.value)}
                    disabled={isLocked}
                    style={{ width: '100%', height: '28px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  />
                </div>
                <div>
                  <label htmlFor="box-editor-header-text-color" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                    Text
                  </label>
                  <input
                    id="box-editor-header-text-color"
                    type="color"
                    value={localBox.headerTextColor || '#ffffff'}
                    onChange={(e) => updateField('headerTextColor', e.target.value)}
                    disabled={isLocked}
                    style={{ width: '100%', height: '28px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Row Colors */}
            <div>
              <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                Alternating Rows
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label htmlFor="box-editor-wristband-preset" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                    Preset
                  </label>
                  <select
                    id="box-editor-wristband-preset"
                    value=""
                    onChange={(e) => {
                      const presets = {
                        'white-gray': { rowColor1: '#ffffff', rowColor2: '#f1f5f9' },
                        'yellow-white': { rowColor1: '#fef9c3', rowColor2: '#ffffff' },
                        'blue-white': { rowColor1: '#dbeafe', rowColor2: '#ffffff' },
                        'green-white': { rowColor1: '#dcfce7', rowColor2: '#ffffff' },
                        'pink-white': { rowColor1: '#fce7f3', rowColor2: '#ffffff' },
                        'orange-white': { rowColor1: '#ffedd5', rowColor2: '#ffffff' },
                        'purple-white': { rowColor1: '#f3e8ff', rowColor2: '#ffffff' },
                        'red-white': { rowColor1: '#fee2e2', rowColor2: '#ffffff' },
                        'cyan-white': { rowColor1: '#cffafe', rowColor2: '#ffffff' },
                        'lime-white': { rowColor1: '#ecfccb', rowColor2: '#ffffff' },
                      };
                      const preset = presets[e.target.value];
                      if (preset) {
                        setLocalBox(prev => ({ ...prev, ...preset }));
                      }
                    }}
                    disabled={isLocked}
                    style={{ width: '100%', height: '28px', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: '#fff', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  >
                    <option value="">Preset...</option>
                    <option value="white-gray">White/Gray</option>
                    <option value="yellow-white">Yellow</option>
                    <option value="blue-white">Blue</option>
                    <option value="green-white">Green</option>
                    <option value="pink-white">Pink</option>
                    <option value="orange-white">Orange</option>
                    <option value="purple-white">Purple</option>
                    <option value="red-white">Red</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="box-editor-row-color-1" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                    Odd Rows
                  </label>
                  <input
                    id="box-editor-row-color-1"
                    type="color"
                    value={localBox.rowColor1 || '#ffffff'}
                    onChange={(e) => updateField('rowColor1', e.target.value)}
                    disabled={isLocked}
                    style={{ width: '100%', height: '28px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  />
                </div>
                <div>
                  <label htmlFor="box-editor-row-color-2" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                    Even Rows
                  </label>
                  <input
                    id="box-editor-row-color-2"
                    type="color"
                    value={localBox.rowColor2 || '#f8fafc'}
                    onChange={(e) => updateField('rowColor2', e.target.value)}
                    disabled={isLocked}
                    style={{ width: '100%', height: '28px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Settings */}
        {localBox.type === 'grid' && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>Grid Settings</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="box-editor-grid-columns" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Columns
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => updateField('gridColumns', Math.max(1, (localBox.gridColumns || 4) - 1))}
                    disabled={isLocked || (localBox.gridColumns || 4) <= 1}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    −
                  </button>
                  <input
                    id="box-editor-grid-columns"
                    type="number"
                    min="1"
                    max="12"
                    value={localBox.gridColumns || 4}
                    onChange={(e) => updateField('gridColumns', Math.min(12, Math.max(1, parseInt(e.target.value) || 4)))}
                    disabled={isLocked}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => updateField('gridColumns', Math.min(12, (localBox.gridColumns || 4) + 1))}
                    disabled={isLocked || (localBox.gridColumns || 4) >= 12}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="box-editor-grid-rows" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Rows
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => updateField('gridRows', Math.max(1, (localBox.gridRows || 5) - 1))}
                    disabled={isLocked || (localBox.gridRows || 5) <= 1}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    −
                  </button>
                  <input
                    id="box-editor-grid-rows"
                    type="number"
                    min="1"
                    max="20"
                    value={localBox.gridRows || 5}
                    onChange={(e) => updateField('gridRows', Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                    disabled={isLocked}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => updateField('gridRows', Math.min(20, (localBox.gridRows || 5) + 1))}
                    disabled={isLocked || (localBox.gridRows || 5) >= 20}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="box-editor-corner-label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Corner Label
                </label>
                <input
                  id="box-editor-corner-label"
                  type="text"
                  value={localBox.cornerLabel || '#'}
                  onChange={(e) => updateField('cornerLabel', e.target.value)}
                  disabled={isLocked}
                  placeholder="#"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    height: '36px'
                  }}
                />
              </div>
            </div>

            {/* Column Headings */}
            <div style={{ marginTop: '12px' }}>
              <label id="box-editor-column-headings-label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Column Headings
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} role="group" aria-labelledby="box-editor-column-headings-label">
                {Array(localBox.gridColumns || 4).fill(null).map((_, i) => (
                  <input
                    key={i}
                    id={`box-editor-column-heading-${i}`}
                    type="text"
                    aria-label={`Column ${i + 1} heading`}
                    value={(localBox.gridHeadings || [])[i] || `COL ${i + 1}`}
                    onChange={(e) => {
                      const newHeadings = [...(localBox.gridHeadings || [])];
                      newHeadings[i] = e.target.value;
                      updateField('gridHeadings', newHeadings);
                    }}
                    disabled={isLocked}
                    style={{
                      flex: 1,
                      minWidth: '80px',
                      padding: '6px 8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Script Settings */}
        {localBox.type === 'script' && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>Script Settings</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="box-editor-script-rows" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Number of Rows
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const currentCount = (localBox.rows || []).length || 10;
                      const newCount = Math.max(1, currentCount - 1);
                      const newRows = Array(newCount).fill(null).map((_, i) => ({
                        label: i + 1,
                        content: (localBox.rows || [])[i]?.content || null,
                        contentRight: (localBox.rows || [])[i]?.contentRight || null
                      }));
                      updateField('rows', newRows);
                    }}
                    disabled={isLocked || (localBox.rows || []).length <= 1}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    −
                  </button>
                  <input
                    id="box-editor-script-rows"
                    type="number"
                    min="1"
                    max="50"
                    value={(localBox.rows || []).length || 10}
                    onChange={(e) => {
                      const count = Math.min(50, Math.max(1, parseInt(e.target.value) || 10));
                      const newRows = Array(count).fill(null).map((_, i) => ({
                        label: i + 1,
                        content: (localBox.rows || [])[i]?.content || null,
                        contentRight: (localBox.rows || [])[i]?.contentRight || null
                      }));
                      updateField('rows', newRows);
                    }}
                    disabled={isLocked}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentCount = (localBox.rows || []).length || 10;
                      const newCount = Math.min(50, currentCount + 1);
                      const newRows = Array(newCount).fill(null).map((_, i) => ({
                        label: i + 1,
                        content: (localBox.rows || [])[i]?.content || null,
                        contentRight: (localBox.rows || [])[i]?.contentRight || null
                      }));
                      updateField('rows', newRows);
                    }}
                    disabled={isLocked || (localBox.rows || []).length >= 50}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="box-editor-script-columns" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Columns
                </label>
                <select
                  id="box-editor-script-columns"
                  value={localBox.scriptColumns || 2}
                  onChange={(e) => updateField('scriptColumns', parseInt(e.target.value))}
                  disabled={isLocked}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    height: '36px'
                  }}
                >
                  <option value={1}>Single Column</option>
                  <option value={2}>Left/Right Hash (2 columns)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* FZDnD Zone Settings */}
        {localBox.type === 'fzdnd' && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>FZDnD Zone Settings</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="box-editor-fzdnd-zone" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Field Zone
                </label>
                <select
                  id="box-editor-fzdnd-zone"
                  value={localBox.zoneId || ''}
                  onChange={(e) => {
                    const zoneId = e.target.value;
                    const zone = setupConfig?.fieldZones?.find(z => z.id === zoneId);
                    updateField('zoneId', zoneId);
                    if (zone) {
                      updateField('header', zone.name);
                      updateField('color', zone.color || '#dc2626');
                    }
                  }}
                  disabled={isLocked}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select a zone...</option>
                  {(setupConfig?.fieldZones || []).map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="box-editor-fzdnd-rows" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Number of Rows
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => updateField('rowCount', Math.max(1, (localBox.rowCount || 5) - 1))}
                    disabled={isLocked || (localBox.rowCount || 5) <= 1}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    −
                  </button>
                  <input
                    id="box-editor-fzdnd-rows"
                    type="number"
                    min="1"
                    max="20"
                    value={localBox.rowCount || 5}
                    onChange={(e) => updateField('rowCount', Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                    disabled={isLocked}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => updateField('rowCount', Math.min(20, (localBox.rowCount || 5) + 1))}
                    disabled={isLocked || (localBox.rowCount || 5) >= 20}
                    style={{
                      width: '32px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Row Labels */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Row Labels (optional)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Array(localBox.rowCount || 5).fill(null).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`${i + 1}`}
                    value={(localBox.rowLabels || [])[i] || ''}
                    onChange={(e) => {
                      const newLabels = [...(localBox.rowLabels || [])];
                      newLabels[i] = e.target.value;
                      updateField('rowLabels', newLabels);
                    }}
                    disabled={isLocked}
                    style={{
                      width: '50px',
                      padding: '4px 6px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      textAlign: 'center'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Column Source */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Column Source
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => updateField('columnSource', 'downDistance')}
                  disabled={isLocked}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: (localBox.columnSource || 'downDistance') === 'downDistance' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: (localBox.columnSource || 'downDistance') === 'downDistance' ? '#eff6ff' : 'white',
                    color: (localBox.columnSource || 'downDistance') === 'downDistance' ? '#3b82f6' : '#64748b',
                    fontWeight: (localBox.columnSource || 'downDistance') === 'downDistance' ? '600' : '400',
                    fontSize: '0.8rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer'
                  }}
                >
                  Down & Distance
                </button>
                <button
                  type="button"
                  onClick={() => updateField('columnSource', 'playPurpose')}
                  disabled={isLocked}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: localBox.columnSource === 'playPurpose' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: localBox.columnSource === 'playPurpose' ? '#eff6ff' : 'white',
                    color: localBox.columnSource === 'playPurpose' ? '#3b82f6' : '#64748b',
                    fontWeight: localBox.columnSource === 'playPurpose' ? '600' : '400',
                    fontSize: '0.8rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer'
                  }}
                >
                  Play Purpose
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateField('columnSource', 'custom');
                    if (!localBox.customColumns?.length) {
                      // Initialize with current source
                      const source = localBox.columnSource === 'playPurpose'
                        ? (setupConfig?.playPurposes || [])
                        : [...(setupConfig?.downDistanceCategories || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
                      updateField('customColumns', source.map(item => ({ id: item.id, name: item.name })));
                    }
                  }}
                  disabled={isLocked}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: localBox.columnSource === 'custom' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: localBox.columnSource === 'custom' ? '#eff6ff' : 'white',
                    color: localBox.columnSource === 'custom' ? '#3b82f6' : '#64748b',
                    fontWeight: localBox.columnSource === 'custom' ? '600' : '400',
                    fontSize: '0.8rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer'
                  }}
                >
                  Custom
                </button>
              </div>

              {/* Column Preview/Editor based on source */}
              {localBox.columnSource === 'custom' ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {(localBox.customColumns || []).map((col, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <input
                          type="text"
                          value={col.name || ''}
                          onChange={(e) => {
                            const newCols = [...(localBox.customColumns || [])];
                            newCols[i] = { ...newCols[i], name: e.target.value };
                            updateField('customColumns', newCols);
                          }}
                          disabled={isLocked}
                          style={{
                            width: '80px',
                            padding: '4px 6px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newCols = [...(localBox.customColumns || [])];
                            newCols.splice(i, 1);
                            updateField('customColumns', newCols);
                          }}
                          disabled={isLocked}
                          style={{
                            width: '20px',
                            height: '20px',
                            border: 'none',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newCols = [...(localBox.customColumns || [])];
                        newCols.push({ id: `col_${Date.now()}`, name: `Col ${newCols.length + 1}` });
                        updateField('customColumns', newCols);
                      }}
                      disabled={isLocked}
                      style={{
                        padding: '4px 8px',
                        border: '1px dashed #cbd5e1',
                        background: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ) : localBox.columnSource === 'playPurpose' ? (
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Click to toggle columns ({(localBox.selectedPurposes || (setupConfig?.playPurposes || []).map(p => p.id)).length} selected)
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(setupConfig?.playPurposes || [])
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map(purpose => {
                        const selectedPurposes = localBox.selectedPurposes || (setupConfig?.playPurposes || []).map(p => p.id);
                        const isSelected = selectedPurposes.includes(purpose.id);
                        return (
                          <button
                            key={purpose.id}
                            onClick={() => {
                              const current = localBox.selectedPurposes || (setupConfig?.playPurposes || []).map(p => p.id);
                              let updated;
                              if (isSelected) {
                                updated = current.filter(id => id !== purpose.id);
                                if (updated.length === 0) updated = [purpose.id]; // Keep at least one
                              } else {
                                updated = [...current, purpose.id];
                              }
                              updateField('selectedPurposes', updated);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: isSelected ? (purpose.color ? `${purpose.color}30` : '#dbeafe') : '#f1f5f9',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: isSelected ? (purpose.color || '#3b82f6') : '#94a3b8',
                              border: `1px solid ${isSelected ? (purpose.color || '#3b82f6') : '#e2e8f0'}`,
                              cursor: 'pointer',
                              opacity: isSelected ? 1 : 0.6,
                              textDecoration: isSelected ? 'none' : 'line-through'
                            }}
                          >
                            {purpose.name}
                          </button>
                        );
                      })}
                    {(setupConfig?.playPurposes || []).length === 0 && (
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No play purposes defined. Go to Setup → Define Situations to add them.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Click to toggle columns ({(localBox.selectedDownDistance || (setupConfig?.downDistanceCategories || []).map(d => d.id)).length} selected)
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {[...(setupConfig?.downDistanceCategories || [])]
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map(dd => {
                        const selectedDD = localBox.selectedDownDistance || (setupConfig?.downDistanceCategories || []).map(d => d.id);
                        const isSelected = selectedDD.includes(dd.id);
                        return (
                          <button
                            key={dd.id}
                            onClick={() => {
                              const current = localBox.selectedDownDistance || (setupConfig?.downDistanceCategories || []).map(d => d.id);
                              let updated;
                              if (isSelected) {
                                updated = current.filter(id => id !== dd.id);
                                if (updated.length === 0) updated = [dd.id]; // Keep at least one
                              } else {
                                updated = [...current, dd.id];
                              }
                              updateField('selectedDownDistance', updated);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: isSelected ? '#dbeafe' : '#f1f5f9',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: isSelected ? '#3b82f6' : '#94a3b8',
                              border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                              cursor: 'pointer',
                              opacity: isSelected ? 1 : 0.6,
                              textDecoration: isSelected ? 'none' : 'line-through'
                            }}
                          >
                            {dd.name}
                          </button>
                        );
                      })}
                  </div>
                  {(setupConfig?.downDistanceCategories || []).length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                      No down/distance categories defined. Go to Setup → Define Situations to add them.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Matrix Settings */}
        {localBox.type === 'matrix' && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>Matrix Settings</h4>

            {/* Formation Label */}
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="box-editor-matrix-formation" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Formation Label
              </label>
              <input
                id="box-editor-matrix-formation"
                type="text"
                value={localBox.formationLabel || ''}
                onChange={(e) => {
                  updateField('formationLabel', e.target.value);
                  updateField('formationId', e.target.value.toLowerCase().replace(/\s+/g, '_'));
                }}
                disabled={isLocked}
                placeholder="e.g., 887, Trips, Empty"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Play Types */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Play Types (Rows)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(localBox.playTypes || []).map((pt, idx) => (
                  <div key={pt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={pt.label}
                      onChange={(e) => {
                        const newPlayTypes = [...(localBox.playTypes || [])];
                        newPlayTypes[idx] = { ...pt, label: e.target.value };
                        updateField('playTypes', newPlayTypes);
                      }}
                      disabled={isLocked}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    />
                    {!isLocked && (
                      <button
                        onClick={() => {
                          const newPlayTypes = (localBox.playTypes || []).filter((_, i) => i !== idx);
                          updateField('playTypes', newPlayTypes);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!isLocked && (
                <button
                  onClick={() => {
                    const newId = `pt_${Date.now()}`;
                    const newPlayTypes = [...(localBox.playTypes || []), { id: newId, label: 'NEW TYPE' }];
                    updateField('playTypes', newPlayTypes);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  + Add Play Type
                </button>
              )}
            </div>

            {/* Hash Groups */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Hash Groups (Columns)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(localBox.hashGroups || []).map((group, gIdx) => (
                  <div key={group.id} style={{
                    padding: '8px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <input
                        type="text"
                        value={group.label}
                        onChange={(e) => {
                          const newGroups = [...(localBox.hashGroups || [])];
                          newGroups[gIdx] = { ...group, label: e.target.value };
                          updateField('hashGroups', newGroups);
                        }}
                        disabled={isLocked}
                        placeholder="Group Label (e.g., BASE)"
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}
                      />
                      {!isLocked && (
                        <button
                          onClick={() => {
                            const newGroups = (localBox.hashGroups || []).filter((_, i) => i !== gIdx);
                            updateField('hashGroups', newGroups);
                          }}
                          style={{
                            padding: '4px 8px',
                            background: '#fee2e2',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Columns: {group.cols.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              {!isLocked && (
                <button
                  onClick={() => {
                    const newId = `hg_${Date.now()}`;
                    const newGroups = [...(localBox.hashGroups || []), {
                      id: newId,
                      label: 'NEW GROUP',
                      cols: [`${newId}_L`, `${newId}_R`]
                    }];
                    updateField('hashGroups', newGroups);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  + Add Hash Group
                </button>
              )}
            </div>

            {/* First Column Settings */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#334155' }}>First Column Settings</h4>

              {/* Row Labels - matching color settings layout */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                  Row Labels
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label htmlFor="box-editor-first-col-width" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                      Width (px)
                    </label>
                    <input
                      id="box-editor-first-col-width"
                      type="number"
                      min="40"
                      max="200"
                      value={localBox.firstColWidth || 60}
                      onChange={(e) => updateField('firstColWidth', parseInt(e.target.value) || 60)}
                      disabled={isLocked}
                      style={{ width: '100%', height: '28px', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="box-editor-first-col-bg" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                      Background
                    </label>
                    <input
                      id="box-editor-first-col-bg"
                      type="color"
                      value={localBox.firstColBg || '#dbeafe'}
                      onChange={(e) => updateField('firstColBg', e.target.value)}
                      disabled={isLocked}
                      style={{ width: '100%', height: '28px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="box-editor-first-col-text" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                      Text
                    </label>
                    <input
                      id="box-editor-first-col-text"
                      type="color"
                      value={localBox.firstColTextColor || '#1e40af'}
                      onChange={(e) => updateField('firstColTextColor', e.target.value)}
                      disabled={isLocked}
                      style={{ width: '100%', height: '28px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="box-editor-first-col-font" style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                      Font Size
                    </label>
                    <select
                      id="box-editor-first-col-font"
                      value={localBox.firstColFontSize || '0.5rem'}
                      onChange={(e) => updateField('firstColFontSize', e.target.value)}
                      disabled={isLocked}
                      style={{ width: '100%', height: '28px', padding: '2px 4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.7rem', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                    >
                      <option value="0.4rem">XS</option>
                      <option value="0.5rem">S</option>
                      <option value="0.6rem">M</option>
                      <option value="0.7rem">L</option>
                      <option value="0.8rem">XL</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Template Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    // Save current first column settings as template default
                    // Use fallback values to avoid undefined (Firestore rejects undefined)
                    const template = {
                      firstColWidth: localBox.firstColWidth || 60,
                      firstColBg: localBox.firstColBg || '#dbeafe',
                      firstColTextColor: localBox.firstColTextColor || '#1e40af',
                      firstColFontSize: localBox.firstColFontSize || '0.5rem',
                      // Also save play types and hash groups as part of template
                      playTypes: localBox.playTypes || [],
                      hashGroups: localBox.hashGroups || [],
                      rowColor1: localBox.rowColor1 || '#ffffff',
                      rowColor2: localBox.rowColor2 || '#f8fafc'
                    };
                    // Store in gamePlan via onSave with special flag
                    onSave({ ...localBox, _saveAsMatrixTemplate: template });
                  }}
                  disabled={isLocked}
                  style={{
                    padding: '6px 12px',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Save as Default Template
                </button>
                <button
                  onClick={() => {
                    // Apply template defaults from gamePlan
                    const template = gamePlan?.matrixTemplate || {};
                    setLocalBox(prev => ({
                      ...prev,
                      firstColWidth: template.firstColWidth || 60,
                      firstColBg: template.firstColBg || '#dbeafe',
                      firstColTextColor: template.firstColTextColor || '#1e40af',
                      firstColFontSize: template.firstColFontSize || '0.5rem',
                      playTypes: template.playTypes || prev.playTypes,
                      hashGroups: template.hashGroups || prev.hashGroups,
                      rowColor1: template.rowColor1 || prev.rowColor1,
                      rowColor2: template.rowColor2 || prev.rowColor2
                    }));
                  }}
                  disabled={isLocked || !gamePlan?.matrixTemplate}
                  style={{
                    padding: '6px 12px',
                    background: gamePlan?.matrixTemplate ? '#eff6ff' : '#f1f5f9',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    color: gamePlan?.matrixTemplate ? '#2563eb' : '#94a3b8',
                    cursor: (isLocked || !gamePlan?.matrixTemplate) ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Reset to Default
                </button>
              </div>
              {!gamePlan?.matrixTemplate && (
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px', marginBottom: 0 }}>
                  No template saved yet. Configure settings and click "Save as Default Template" to use these settings for new matrix boxes.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="box-editor-overlay" onClick={handleClose}>
      {/* Unsaved Changes Confirmation Dialog */}
      {showUnsavedChangesDialog && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '1.1rem' }}>
              Unsaved Changes
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem' }}>
              You have unsaved changes. What would you like to do?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUnsavedChangesDialog(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Keep Editing
              </button>
              <button
                onClick={handleDiscardAndClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #ef4444',
                  background: 'white',
                  color: '#ef4444',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Discard
              </button>
              <button
                onClick={handleSaveAndClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="box-editor-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'calc(100vw - 520px)',
          height: '750px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="box-editor-header" style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Left side: Title, Type, Color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Editable Title */}
            <input
              type="text"
              value={localBox.header || ''}
              onChange={(e) => updateField('header', e.target.value)}
              disabled={isLocked}
              placeholder="Box title..."
              style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#1e293b',
                border: '1px solid transparent',
                borderRadius: '4px',
                padding: '4px 8px',
                background: 'transparent',
                minWidth: '120px',
                maxWidth: '200px',
                transition: 'border-color 0.15s, background 0.15s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = '#fff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.background = 'transparent';
              }}
            />

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />

            {/* Box Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Type:</span>
              <select
                value={localBox.type || 'grid'}
                onChange={(e) => {
                  const newType = e.target.value;
                  updateField('type', newType);
                  // Set sensible defaults for new types
                  if (newType === 'fzdnd' && !localBox.zoneId) {
                    const firstZone = setupConfig?.fieldZones?.[0];
                    if (firstZone) {
                      updateField('zoneId', firstZone.id);
                      updateField('header', firstZone.name);
                      updateField('color', firstZone.color || '#dc2626');
                    }
                  }
                  if (newType === 'matrix' && !localBox.formationId) {
                    updateField('playTypes', [
                      { id: 'strong_run', label: 'STRONG RUN' },
                      { id: 'weak_run', label: 'WEAK RUN' },
                      { id: 'quick_game', label: 'QUICK GAME' },
                      { id: 'drop_back', label: 'DROPBACK' }
                    ]);
                    updateField('hashGroups', [
                      { id: 'FB', label: 'BASE', cols: ['FB_L', 'FB_R'] },
                      { id: 'CU', label: 'CONVERT', cols: ['CU_L', 'CU_R'] }
                    ]);
                  }
                }}
                disabled={isLocked}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  background: '#fff',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  color: '#334155'
                }}
              >
                <option value="grid">Grid</option>
                <option value="script">Script</option>
                <option value="fzdnd">FZDnD</option>
                <option value="matrix">Matrix</option>
                <option value="list">List</option>
              </select>
            </div>

            {/* Header Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Color:</span>
              <input
                type="color"
                value={localBox.color || '#3b82f6'}
                onChange={(e) => updateField('color', e.target.value)}
                disabled={isLocked}
                title="Header color"
                style={{
                  width: '28px',
                  height: '24px',
                  padding: '2px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
              />
            </div>

            {/* Column Span */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Span:</span>
              <button
                onClick={() => updateField('colSpan', Math.max(1, (localBox.colSpan || 3) - 1))}
                disabled={isLocked || (localBox.colSpan || 3) <= 1}
                style={{
                  width: '20px', height: '20px', borderRadius: '4px',
                  border: '1px solid #e2e8f0', background: 'white',
                  cursor: isLocked || (localBox.colSpan || 3) <= 1 ? 'not-allowed' : 'pointer',
                  opacity: isLocked || (localBox.colSpan || 3) <= 1 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: '600', color: '#64748b'
                }}
              >−</button>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e293b', minWidth: '14px', textAlign: 'center' }}>
                {localBox.colSpan || 3}
              </span>
              <button
                onClick={() => updateField('colSpan', Math.min(7, (localBox.colSpan || 3) + 1))}
                disabled={isLocked || (localBox.colSpan || 3) >= 7}
                style={{
                  width: '20px', height: '20px', borderRadius: '4px',
                  border: '1px solid #e2e8f0', background: 'white',
                  cursor: isLocked || (localBox.colSpan || 3) >= 7 ? 'not-allowed' : 'pointer',
                  opacity: isLocked || (localBox.colSpan || 3) >= 7 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: '600', color: '#64748b'
                }}
              >+</button>
            </div>
          </div>

          {/* Right side: Size Controls + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Grid Controls */}
            {localBox.type === 'grid' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cols:</span>
                  <button
                    onClick={() => updateField('gridColumns', Math.max(1, (localBox.gridColumns || 4) - 1))}
                    disabled={isLocked || (localBox.gridColumns || 4) <= 1}
                    style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      border: '1px solid #e2e8f0', background: 'white',
                      cursor: isLocked || (localBox.gridColumns || 4) <= 1 ? 'not-allowed' : 'pointer',
                      opacity: isLocked || (localBox.gridColumns || 4) <= 1 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                    }}
                  >−</button>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', minWidth: '18px', textAlign: 'center' }}>
                    {localBox.gridColumns || 4}
                  </span>
                  <button
                    onClick={() => updateField('gridColumns', Math.min(12, (localBox.gridColumns || 4) + 1))}
                    disabled={isLocked || (localBox.gridColumns || 4) >= 12}
                    style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      border: '1px solid #e2e8f0', background: 'white',
                      cursor: isLocked || (localBox.gridColumns || 4) >= 12 ? 'not-allowed' : 'pointer',
                      opacity: isLocked || (localBox.gridColumns || 4) >= 12 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                    }}
                  >+</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rows:</span>
                  <button
                    onClick={() => updateField('gridRows', Math.max(1, (localBox.gridRows || 5) - 1))}
                    disabled={isLocked || (localBox.gridRows || 5) <= 1}
                    style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      border: '1px solid #e2e8f0', background: 'white',
                      cursor: isLocked || (localBox.gridRows || 5) <= 1 ? 'not-allowed' : 'pointer',
                      opacity: isLocked || (localBox.gridRows || 5) <= 1 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                    }}
                  >−</button>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', minWidth: '18px', textAlign: 'center' }}>
                    {localBox.gridRows || 5}
                  </span>
                  <button
                    onClick={() => updateField('gridRows', Math.min(20, (localBox.gridRows || 5) + 1))}
                    disabled={isLocked || (localBox.gridRows || 5) >= 20}
                    style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      border: '1px solid #e2e8f0', background: 'white',
                      cursor: isLocked || (localBox.gridRows || 5) >= 20 ? 'not-allowed' : 'pointer',
                      opacity: isLocked || (localBox.gridRows || 5) >= 20 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                    }}
                  >+</button>
                </div>
              </>
            )}

            {/* Script Controls */}
            {localBox.type === 'script' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cols:</span>
                  <button
                    onClick={() => !isLocked && updateField('scriptColumns', 1)}
                    disabled={isLocked}
                    style={{
                      padding: '3px 8px', borderRadius: '4px',
                      border: (localBox.scriptColumns || 2) === 1 ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                      background: (localBox.scriptColumns || 2) === 1 ? '#eff6ff' : 'white',
                      color: (localBox.scriptColumns || 2) === 1 ? '#3b82f6' : '#64748b',
                      fontWeight: '500', fontSize: '0.7rem', cursor: isLocked ? 'not-allowed' : 'pointer'
                    }}
                  >L</button>
                  <button
                    onClick={() => !isLocked && updateField('scriptColumns', 2)}
                    disabled={isLocked}
                    style={{
                      padding: '3px 8px', borderRadius: '4px',
                      border: (localBox.scriptColumns || 2) === 2 ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                      background: (localBox.scriptColumns || 2) === 2 ? '#eff6ff' : 'white',
                      color: (localBox.scriptColumns || 2) === 2 ? '#3b82f6' : '#64748b',
                      fontWeight: '500', fontSize: '0.7rem', cursor: isLocked ? 'not-allowed' : 'pointer'
                    }}
                  >L/R</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rows:</span>
                  <button
                    onClick={() => {
                      const newRowCount = Math.max(1, (localBox.rows?.length || 10) - 1);
                      const currentRows = localBox.rows || [];
                      const newRows = currentRows.slice(0, newRowCount);
                      while (newRows.length < newRowCount) {
                        newRows.push({ label: newRows.length + 1, content: null, contentRight: null });
                      }
                      setLocalBox(prev => ({ ...prev, rows: newRows }));
                    }}
                    disabled={isLocked || (localBox.rows?.length || 10) <= 1}
                    style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      border: '1px solid #e2e8f0', background: 'white',
                      cursor: isLocked || (localBox.rows?.length || 10) <= 1 ? 'not-allowed' : 'pointer',
                      opacity: isLocked || (localBox.rows?.length || 10) <= 1 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                    }}
                  >−</button>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', minWidth: '18px', textAlign: 'center' }}>
                    {localBox.rows?.length || 10}
                  </span>
                  <button
                    onClick={() => {
                      const newRowCount = Math.min(50, (localBox.rows?.length || 10) + 1);
                      const currentRows = localBox.rows || [];
                      const newRows = [...currentRows];
                      while (newRows.length < newRowCount) {
                        newRows.push({ label: newRows.length + 1, content: null, contentRight: null });
                      }
                      setLocalBox(prev => ({ ...prev, rows: newRows }));
                    }}
                    disabled={isLocked || (localBox.rows?.length || 10) >= 50}
                    style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      border: '1px solid #e2e8f0', background: 'white',
                      cursor: isLocked || (localBox.rows?.length || 10) >= 50 ? 'not-allowed' : 'pointer',
                      opacity: isLocked || (localBox.rows?.length || 10) >= 50 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                    }}
                  >+</button>
                </div>
              </>
            )}

            {/* FZDnD Controls */}
            {localBox.type === 'fzdnd' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rows:</span>
                <button
                  onClick={() => updateField('rowCount', Math.max(1, (localBox.rowCount || 5) - 1))}
                  disabled={isLocked || (localBox.rowCount || 5) <= 1}
                  style={{
                    width: '22px', height: '22px', borderRadius: '4px',
                    border: '1px solid #e2e8f0', background: 'white',
                    cursor: isLocked || (localBox.rowCount || 5) <= 1 ? 'not-allowed' : 'pointer',
                    opacity: isLocked || (localBox.rowCount || 5) <= 1 ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                  }}
                >−</button>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', minWidth: '18px', textAlign: 'center' }}>
                  {localBox.rowCount || 5}
                </span>
                <button
                  onClick={() => updateField('rowCount', Math.min(20, (localBox.rowCount || 5) + 1))}
                  disabled={isLocked || (localBox.rowCount || 5) >= 20}
                  style={{
                    width: '22px', height: '22px', borderRadius: '4px',
                    border: '1px solid #e2e8f0', background: 'white',
                    cursor: isLocked || (localBox.rowCount || 5) >= 20 ? 'not-allowed' : 'pointer',
                    opacity: isLocked || (localBox.rowCount || 5) >= 20 ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: '600', color: '#64748b'
                  }}
                >+</button>
              </div>
            )}

            {/* Delete Button */}
            {onDelete && !isLocked && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${box.header}"?\n\nThis will permanently remove this box and all plays assigned to it. This cannot be undone.`)) {
                    onDelete(sectionIdx, boxIdx);
                    onClose();
                  }
                }}
                title="Delete box"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#ef4444',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 16px'
        }}>
          <button
            onClick={() => setActiveTab('editor')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'editor' ? '600' : '400',
              color: activeTab === 'editor' ? '#3b82f6' : '#64748b',
              borderBottom: activeTab === 'editor' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'settings' ? '600' : '400',
              color: activeTab === 'settings' ? '#3b82f6' : '#64748b',
              borderBottom: activeTab === 'settings' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            Settings
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeTab === 'editor' ? (
            <>
              {/* Left Panel: Quick List */}
              <div style={{
                width: '320px',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {renderQuickListPanel()}
              </div>

              {/* Right Panel: Editor */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {localBox.type === 'script' ? renderScriptEditor() :
                 localBox.type === 'fzdnd' ? renderFZDnDEditor() :
                 localBox.type === 'matrix' ? renderMatrixEditor() :
                 renderGridEditor()}
              </div>
            </>
          ) : (
            renderSettings()
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLocked}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isLocked ? '#94a3b8' : '#3b82f6',
              color: 'white',
              fontWeight: '500',
              cursor: isLocked ? 'not-allowed' : 'pointer'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
