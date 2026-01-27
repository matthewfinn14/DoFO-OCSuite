import { useState, useMemo, useCallback } from 'react';
import { X, Search, Trash2, GripVertical, ChevronUp, ChevronDown, ArrowRight, Plus, Hash } from 'lucide-react';

export default function BoxEditorModal({
  box,
  sectionIdx,
  boxIdx,
  plays,
  gamePlan,
  isLocked,
  onClose,
  onSave,
  onAddPlayToQuickList,
  onRemovePlayFromQuickList,
  onReorderQuickList,
  onAssignPlayToCell,
  onRemovePlayFromCell,
  getPlaysForSet,
  getWristbandLabel
}) {
  const [localBox, setLocalBox] = useState({ ...box });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'settings', 'editor'
  const [draggedQuickListIdx, setDraggedQuickListIdx] = useState(null);
  const [dragOverQuickListIdx, setDragOverQuickListIdx] = useState(null);

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

    const assignedPlayIds = setData?.assignedPlayIds || [];
    return assignedPlayIds
      .map(playId => plays.find(p => p.id === playId))
      .filter(Boolean);
  }, [box.setId, gamePlan, plays]);

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

  const updateField = (field, value) => {
    setLocalBox(prev => ({ ...prev, [field]: value }));
  };

  // Handle Quick List drag start
  const handleQuickListDragStart = (e, idx) => {
    if (isLocked) return;
    setDraggedQuickListIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx.toString());
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
    onAssignPlayToCell(box.setId, rowIdx, column, playId);
  };

  // Remove play from script row
  const handleRemoveFromScriptRow = (rowIdx, column) => {
    if (isLocked) return;
    onRemovePlayFromCell(box.setId, rowIdx, column);
  };

  // Assign play from Quick List to grid cell
  const handleAssignToGridCell = (playId, cellIdx) => {
    if (isLocked) return;
    onAssignPlayToCell(box.setId, cellIdx, null, playId);
  };

  // Remove play from grid cell
  const handleRemoveFromGridCell = (cellIdx) => {
    if (isLocked) return;
    onRemovePlayFromCell(box.setId, cellIdx, null);
  };

  // Get grid cell plays
  const getGridCellPlays = () => {
    const cols = localBox.gridColumns || 4;
    const rowsCount = localBox.gridRows || 5;
    const totalSlots = cols * rowsCount;

    // Get assigned plays from box or gamePlan
    let assignedPlayIds = localBox.assignedPlayIds || [];

    // Also check gamePlan sets
    if (box.setId) {
      let setData = null;
      if (Array.isArray(gamePlan?.sets)) {
        setData = gamePlan.sets.find(s => s.id === box.setId);
      }
      if (setData?.playIds) {
        assignedPlayIds = setData.playIds;
      }
    }

    const gridPlays = [];
    for (let i = 0; i < totalSlots; i++) {
      const playId = assignedPlayIds[i];
      if (playId && playId !== 'GAP') {
        const play = plays.find(p => p.id === playId);
        gridPlays.push(play || null);
      } else {
        gridPlays.push(null);
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
                      {play.name}
                    </div>
                    {play.formation && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {play.formation}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getWristbandLabel && getWristbandLabel(play) && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#3b82f6',
                        fontWeight: '600',
                        background: '#eff6ff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Hash size={10} />
                        {getWristbandLabel(play)}
                      </span>
                    )}
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
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                      gap: '8px',
                      padding: '8px',
                      background: isDragOver ? '#dbeafe' : (isDragging ? '#f1f5f9' : 'white'),
                      border: isDragOver ? '2px dashed #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      opacity: isDragging ? 0.5 : 1,
                      cursor: isLocked ? 'default' : 'grab'
                    }}
                  >
                    {!isLocked && (
                      <GripVertical size={14} className="text-slate-400 flex-shrink-0" />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#1e293b',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {play.name}
                      </div>
                      {play.formation && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {play.formation}
                        </div>
                      )}
                    </div>

                    {getWristbandLabel && getWristbandLabel(play) && (
                      <span style={{
                        fontSize: '0.65rem',
                        color: '#3b82f6',
                        fontWeight: '600',
                        background: '#eff6ff',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        flexShrink: 0
                      }}>
                        #{getWristbandLabel(play)}
                      </span>
                    )}

                    {!isLocked && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          onClick={() => handleMoveQuickListPlay(play.id, 'up')}
                          disabled={idx === 0}
                          style={{
                            padding: '2px',
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
                            padding: '2px',
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
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
            Script Columns
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
                        {leftPlay.name}
                      </span>
                      {getWristbandLabel && getWristbandLabel(leftPlay) && (
                        <span style={{
                          fontSize: '0.65rem',
                          color: '#3b82f6',
                          fontWeight: '600'
                        }}>
                          #{getWristbandLabel(leftPlay)}
                        </span>
                      )}
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
                      const playId = e.dataTransfer.getData('text/plain');
                      const play = plays.find(p => p.id === playId) || quickListPlays.find(p => p.id === playId);
                      if (play && !isLocked) {
                        handleAssignToScriptRow(play.id, rowIdx, 'right');
                      }
                    }}
                  >
                    {rightPlay ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '0.85rem' }}>
                          {rightPlay.name}
                        </span>
                        {getWristbandLabel && getWristbandLabel(rightPlay) && (
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#3b82f6',
                            fontWeight: '600'
                          }}>
                            #{getWristbandLabel(rightPlay)}
                          </span>
                        )}
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

        {/* Row count control */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
            Number of Rows
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={numRows}
            disabled={isLocked}
            onChange={(e) => {
              const count = Math.max(1, Math.min(30, parseInt(e.target.value) || 10));
              const newRows = Array(count).fill(null).map((_, i) => ({
                label: i + 1,
                content: scriptRows[i]?.content || null,
                contentRight: scriptRows[i]?.contentRight || null
              }));
              updateField('rows', newRows);
            }}
            style={{
              marginTop: '4px',
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              width: '80px',
              fontSize: '0.875rem'
            }}
          />
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
                      const playId = e.dataTransfer.getData('text/plain');
                      const droppedPlay = plays.find(p => p.id === playId) || quickListPlays.find(p => p.id === playId);
                      if (droppedPlay && !isLocked) {
                        handleAssignToGridCell(droppedPlay.id, cellIdx);
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
                          {play.name}
                        </span>
                        {getWristbandLabel && getWristbandLabel(play) && (
                          <span style={{
                            fontSize: '0.6rem',
                            color: '#3b82f6',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            #{getWristbandLabel(play)}
                          </span>
                        )}
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

  // Render Settings tab
  const renderSettings = () => {
    return (
      <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
        {/* Basic Settings */}
        <div className="box-editor-section">
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>Basic Settings</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Header Title
              </label>
              <input
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
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Box Type
              </label>
              <select
                value={localBox.type || 'grid'}
                onChange={(e) => updateField('type', e.target.value)}
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
                <option value="list">Simple List</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Column Span (1-7)
              </label>
              <input
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
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Header Color
              </label>
              <input
                type="color"
                value={localBox.color || '#3b82f6'}
                onChange={(e) => updateField('color', e.target.value)}
                disabled={isLocked}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '4px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
              />
            </div>
          </div>
        </div>

        {/* Grid Settings */}
        {localBox.type === 'grid' && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>Grid Settings</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={localBox.gridColumns || 4}
                  onChange={(e) => updateField('gridColumns', parseInt(e.target.value) || 4)}
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
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localBox.gridRows || 5}
                  onChange={(e) => updateField('gridRows', parseInt(e.target.value) || 5)}
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
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Corner Label
                </label>
                <input
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
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Column Headings */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                Column Headings
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Array(localBox.gridColumns || 4).fill(null).map((_, i) => (
                  <input
                    key={i}
                    type="text"
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
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Number of Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={(localBox.rows || []).length || 10}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 10;
                    const newRows = Array(count).fill(null).map((_, i) => ({
                      label: i + 1,
                      content: (localBox.rows || [])[i]?.content || null,
                      contentRight: (localBox.rows || [])[i]?.contentRight || null
                    }));
                    updateField('rows', newRows);
                  }}
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
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Columns
                </label>
                <select
                  value={localBox.scriptColumns || 2}
                  onChange={(e) => updateField('scriptColumns', parseInt(e.target.value))}
                  disabled={isLocked}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value={1}>Single Column</option>
                  <option value={2}>Left/Right Hash (2 columns)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="box-editor-overlay" onClick={onClose}>
      <div
        className="box-editor-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '900px',
          maxWidth: '95vw',
          height: '700px',
          maxHeight: '90vh',
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
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
              Edit: {box.header}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {box.type === 'grid' ? 'Grid Box' : box.type === 'script' ? 'Script Box' : 'List Box'}
            </span>
          </div>
          <button
            onClick={onClose}
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
                {localBox.type === 'script' ? renderScriptEditor() : renderGridEditor()}
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
            onClick={onClose}
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
