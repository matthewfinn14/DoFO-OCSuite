import { useState, useCallback } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { getPlayCall } from '../../utils/playDisplay';

export default function SheetView({
  layouts,
  gamePlan,
  plays,
  currentWeek,
  teamLogo,
  isLocked,
  isEditing,
  onToggleEditing,
  onUpdateLayouts,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onAddBox,
  onDeleteBox,
  onUpdateBox,
  onBoxDrop,
  onAddPlayToSet,
  onRemovePlayFromSet,
  getPlaysForSet,
  getGridPlays,
  getPlayDisplayName,
  draggedCell,
  setDraggedCell,
  playDragOverBox,
  setPlayDragOverBox,
  onEditBox,
  onBoxClick,
  setupConfig,
  onFZDnDBoxDrop,
  onMatrixBoxAdd,
  onMatrixBoxRemove,
  pageFormat = '2-page',
  pageOrientation = 'portrait'
}) {
  const sections = layouts?.CALL_SHEET?.sections || [];
  const weekTitle = currentWeek?.name || `Week ${currentWeek?.weekNumber || ''}`;
  const opponentTitle = currentWeek?.opponent ? `vs. ${currentWeek.opponent}` : '';

  // Render grid box content
  const renderGridBox = (box, isPrintMode = false) => {
    const cols = box.gridColumns || 4;
    const rowsCount = box.gridRows || 5;
    const totalSlots = cols * rowsCount;

    // Get assigned plays from gamePlan (or fallback to box data if only in layout)
    const set = gamePlan?.sets?.find(s => s.id === box.setId);
    const assignedPlayIds = set?.assignedPlayIds || box.assignedPlayIds || [];

    const gridPlays = [];
    for (let i = 0; i < totalSlots; i++) {
      const playId = assignedPlayIds[i];
      if (playId) {
        const play = plays.find(p => p.id === playId);
        gridPlays.push(play ? { ...play, type: 'PLAY' } : { type: 'GAP' });
      } else {
        gridPlays.push({ type: 'GAP' });
      }
    }

    const headings = box.gridHeadings || Array(cols).fill('').map((_, i) =>
      i === 0 ? 'LEFT HASH' : (i === cols - 1 ? 'NOTES' : `COL ${i + 1}`)
    );

    const rows = [];
    for (let i = 0; i < gridPlays.length; i += cols) {
      rows.push(gridPlays.slice(i, i + cols));
    }

    // Check if row is empty
    const isGridRowEmpty = (rowSlots) => {
      return rowSlots.every(slot => {
        if (slot.type === 'GAP') return true;
        return !slot || !slot.name || slot.name === '-' || slot.name.trim() === '';
      });
    };

    // Check if entire grid is empty
    const isGridEmpty = rows.every(row => isGridRowEmpty(row));

    if (isPrintMode && isGridEmpty) {
      return null;
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `min-content repeat(${cols}, 1fr)`,
        gap: '0',
        width: '100%'
      }}>
        {/* Header Row */}
        <div style={{
          padding: '2px',
          fontSize: '0.55rem',
          fontWeight: 'bold',
          color: '#94a3b8',
          textAlign: 'center',
          alignSelf: 'end'
        }}>
          {box.cornerLabel || '#'}
        </div>
        {headings.slice(0, cols).map((h, i) => (
          <div key={`h-${i}`} style={{
            padding: '2px',
            fontSize: '0.55rem',
            fontWeight: 'bold',
            color: '#64748b',
            textAlign: 'center',
            background: '#f1f5f9',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            borderRight: i < cols - 1 ? '1px solid #cbd5e1' : 'none',
            borderBottom: '1px solid #cbd5e1'
          }}>
            {h}
          </div>
        ))}

        {/* Data Rows */}
        {rows.map((rowSlots, rIdx) => {
          const isEmpty = isGridRowEmpty(rowSlots);
          if (isEmpty && isPrintMode) return null;

          return (
            <div key={rIdx} style={{ display: 'contents' }}>
              <div style={{
                padding: '2px',
                fontSize: '0.6rem',
                color: '#94a3b8',
                textAlign: 'right',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minWidth: '15px',
                borderBottom: '1px dotted #f1f5f9'
              }}>
                {(box.gridRowLabels && box.gridRowLabels[rIdx]) || (rIdx + 1)}
              </div>
              {rowSlots.map((slot, cIdx) => {
                const play = slot.type === 'PLAY' ? slot : null;
                return (
                  <div key={cIdx} style={{
                    fontSize: '0.6rem',
                    overflow: 'hidden',
                    background: play?.priority ? '#fef08a' : (slot.type === 'GAP' ? 'transparent' : '#f8fafc'),
                    padding: '2px',
                    minHeight: '18px',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    borderRight: cIdx < cols - 1 ? '1px solid #e2e8f0' : 'none',
                    borderBottom: '1px dotted #e2e8f0',
                    wordBreak: 'break-word'
                  }} title={play ? getPlayCall(play) : ''}>
                    {play ? (
                      <span style={{ display: 'inline', lineHeight: '1.2', fontWeight: '500' }}>
                        {getPlayDisplayName(play)}
                      </span>
                    ) : (slot.type === 'GAP' ? '' : '-')}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Render script box content
  const renderScriptBox = (box, isPrintMode = false) => {
    const boxRows = box.rows || [];
    const scriptColumns = box.scriptColumns || 2; // 1 = single column, 2 = left/right hash

    // Filter to non-empty rows for print mode
    const rowsToRender = isPrintMode ? boxRows.filter(row => {
      const playLeft = plays.find(p => p.id === row.content);
      const playRight = plays.find(p => p.id === row.contentRight);
      return playLeft || (scriptColumns === 2 && playRight);
    }) : boxRows;

    if (isPrintMode && rowsToRender.length === 0) {
      return null;
    }

    // Single column layout
    if (scriptColumns === 1) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {rowsToRender.map((row, rIdx) => {
            const play = plays.find(p => p.id === row.content);

            return (
              <div key={rIdx} style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'baseline',
                lineHeight: '1.2',
                borderBottom: '1px dotted #f1f5f9',
                background: play?.priority ? '#fef08a' : 'transparent',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  color: '#64748b',
                  width: '16px',
                  textAlign: 'right',
                  flexShrink: 0,
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}>
                  {row.label || rIdx + 1}
                </span>
                {play ? (
                  <span style={{
                    fontWeight: '600',
                    color: '#1e293b',
                    fontSize: '0.65rem',
                    wordBreak: 'break-word'
                  }}>
                    {getPlayDisplayName(play)}
                  </span>
                ) : (
                  <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Two column layout (left/right hash)
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        columnGap: '0',
        rowGap: '0'
      }}>
        {rowsToRender.map((row, rIdx) => {
          const playLeft = plays.find(p => p.id === row.content);
          const playRight = plays.find(p => p.id === row.contentRight);

          return [
            <div key={`${rIdx}-L`} style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'baseline',
              lineHeight: '1.2',
              borderBottom: '1px dotted #f1f5f9',
              borderRight: '1px solid #e2e8f0',
              paddingRight: '4px',
              background: playLeft?.priority ? '#fef08a' : 'transparent',
              flexWrap: 'wrap'
            }}>
              <span style={{
                color: '#64748b',
                width: '16px',
                textAlign: 'right',
                flexShrink: 0,
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}>
                {row.label || rIdx + 1}
              </span>
              {playLeft ? (
                <span style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  fontSize: '0.65rem',
                  wordBreak: 'break-word'
                }}>
                  {getPlayDisplayName(playLeft)}
                </span>
              ) : (
                <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</span>
              )}
            </div>,
            <div key={`${rIdx}-R`} style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'baseline',
              lineHeight: '1.2',
              borderBottom: '1px dotted #f1f5f9',
              paddingLeft: '4px',
              background: playRight?.priority ? '#fef08a' : 'transparent',
              flexWrap: 'wrap'
            }}>
              {playRight ? (
                <span style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  fontSize: '0.65rem',
                  wordBreak: 'break-word'
                }}>
                  {getPlayDisplayName(playRight)}
                </span>
              ) : (
                <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>+</span>
              )}
            </div>
          ];
        })}
      </div>
    );
  };

  // Render FZDnD Zone box content
  const renderFZDnDBox = (box, isPrintMode = false) => {
    // Get zone info from setupConfig
    const zone = setupConfig?.fieldZones?.find(z => z.id === box.zoneId);

    // Get columns based on columnSource setting
    let columns;
    const columnSource = box.columnSource || 'downDistance';

    if (columnSource === 'custom' && box.customColumns?.length > 0) {
      columns = box.customColumns;
    } else if (columnSource === 'playPurpose') {
      const allPurposes = (setupConfig?.playPurposes || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(p => ({ id: p.id, name: p.name, color: p.color }));
      // Filter by selected if specified
      const selectedIds = box.selectedPurposes;
      columns = selectedIds ? allPurposes.filter(p => selectedIds.includes(p.id)) : allPurposes;
    } else {
      // Default to downDistance
      const allDD = [...(setupConfig?.downDistanceCategories || [])]
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      // Filter by selected if specified
      const selectedIds = box.selectedDownDistance;
      columns = selectedIds ? allDD.filter(d => selectedIds.includes(d.id)) : allDD;
    }

    const rowCount = box.rowCount || 5;
    const rowLabels = box.rowLabels || [];

    // Get plays for each cell using column ID
    const getPlayForCell = (rowIdx, colId) => {
      const setId = `${box.setId}_${colId}`;
      const set = gamePlan?.sets?.find(s => s.id === setId);
      const playId = set?.playIds?.[rowIdx];
      return playId ? plays.find(p => p.id === playId) : null;
    };

    // Check if entire box is empty
    const isBoxEmpty = () => {
      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        for (const col of columns) {
          if (getPlayForCell(rowIdx, col.id)) return false;
        }
      }
      return true;
    };

    if (isPrintMode && isBoxEmpty()) {
      return null;
    }

    const zoneColor = zone?.color || box.color || '#dc2626';
    const cols = columns.length || 1;

    return (
      <div className="fzdnd-box-container">
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `min-content repeat(${cols}, 1fr)`,
          gap: '0',
          width: '100%'
        }}>
          {/* Corner cell */}
          <div style={{
            padding: '2px',
            fontSize: '0.55rem',
            fontWeight: 'bold',
            color: '#94a3b8',
            textAlign: 'center',
            alignSelf: 'end'
          }}>
            #
          </div>
          {columns.map((col, i) => (
            <div key={col.id} style={{
              padding: '2px',
              fontSize: '0.5rem',
              fontWeight: 'bold',
              color: '#64748b',
              textAlign: 'center',
              background: '#f1f5f9',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderRight: i < cols - 1 ? '1px solid #cbd5e1' : 'none',
              borderBottom: '1px solid #cbd5e1'
            }}>
              {col.name}
            </div>
          ))}

          {/* Data Rows */}
          {Array.from({ length: rowCount }, (_, rowIdx) => {
            const rowHasPlay = columns.some(col => getPlayForCell(rowIdx, col.id));
            if (isPrintMode && !rowHasPlay) return null;

            return (
              <div key={rowIdx} style={{ display: 'contents' }}>
                <div style={{
                  padding: '2px',
                  fontSize: '0.6rem',
                  color: '#94a3b8',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: '15px',
                  borderBottom: '1px dotted #f1f5f9'
                }}>
                  {rowLabels[rowIdx] || (rowIdx + 1)}
                </div>
                {columns.map((col, colIdx) => {
                  const play = getPlayForCell(rowIdx, col.id);
                  return (
                    <div
                      key={col.id}
                      className="fzdnd-box-cell"
                      style={{
                        fontSize: '0.6rem',
                        overflow: 'hidden',
                        background: play?.priority ? '#fef08a' : (rowIdx % 2 === 1 ? '#f8fafc' : 'transparent'),
                        padding: '2px',
                        minHeight: '18px',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        borderRight: colIdx < cols - 1 ? '1px solid #e2e8f0' : 'none',
                        borderBottom: '1px dotted #e2e8f0',
                        wordBreak: 'break-word'
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onFZDnDBoxDrop) {
                          const playData = e.dataTransfer.getData('application/react-dnd');
                          if (playData) {
                            try {
                              const { playId } = JSON.parse(playData);
                              if (playId) {
                                onFZDnDBoxDrop(box.setId, rowIdx, col.id, playId);
                              }
                            } catch (err) {
                              console.error('Error parsing drop data:', err);
                            }
                          }
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      title={play ? getPlayCall(play) : ''}
                    >
                      {play ? (
                        <span style={{ display: 'inline', lineHeight: '1.2', fontWeight: '500' }}>
                          {getPlayDisplayName(play)}
                        </span>
                      ) : ''}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Matrix box content
  const renderMatrixBox = (box, isPrintMode = false) => {
    const playTypes = box.playTypes || [
      { id: 'strong_run', label: 'STRONG RUN' },
      { id: 'weak_run', label: 'WEAK RUN' },
      { id: 'quick_game', label: 'QUICK GAME' },
      { id: 'drop_back', label: 'DROPBACK' },
      { id: 'gadget', label: 'GADGET' }
    ];
    const hashGroups = box.hashGroups || [
      { id: 'FB', label: 'BASE/INITIAL', cols: ['FB_L', 'FB_R'] },
      { id: 'CB', label: 'BASE W/ DRESSING', cols: ['CB_L', 'CB_R'] },
      { id: 'CU', label: 'CONVERT', cols: ['CU_L', 'CU_R'] },
      { id: 'SO', label: 'EXPLOSIVE', cols: ['SO_L', 'SO_R'] }
    ];

    // Flatten all columns for grid layout
    const allCols = hashGroups.flatMap(g => g.cols);

    // Get plays for a cell (multiple plays allowed)
    const getPlaysForCell = (playTypeId, colId) => {
      const setId = `${box.setId}_${playTypeId}_${colId}`;
      const set = gamePlan?.sets?.find(s => s.id === setId);
      return (set?.playIds || []).map(id => plays.find(p => p.id === id)).filter(Boolean);
    };

    // Check if entire matrix is empty
    const isMatrixEmpty = () => {
      for (const pt of playTypes) {
        for (const col of allCols) {
          if (getPlaysForCell(pt.id, col).length > 0) return false;
        }
      }
      return true;
    };

    if (isPrintMode && isMatrixEmpty()) {
      return null;
    }

    return (
      <div className="matrix-box-container" style={{ fontSize: '0.6rem' }}>
        {/* Header Section */}
        <div style={{ display: 'flex' }}>
          {/* Formation/Title column - spans both header rows */}
          <div style={{
            width: '70px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              flex: 1,
              padding: '2px 4px',
              fontSize: '0.5rem',
              fontWeight: 'bold',
              textAlign: 'center',
              background: box.color || '#334155',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1.1'
            }}>
              {box.header || 'MATRIX'}
            </div>
          </div>

          {/* Hash group columns */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Row 1: Group Names */}
            <div style={{ display: 'flex' }}>
              {hashGroups.map((group, gIdx) => (
                <div key={group.id} style={{
                  flex: group.cols.length,
                  padding: '2px',
                  fontSize: '0.45rem',
                  fontWeight: 'bold',
                  color: 'white',
                  textAlign: 'center',
                  background: '#475569',
                  borderLeft: gIdx > 0 ? '2px solid #1e293b' : 'none',
                  borderBottom: '1px solid #64748b'
                }}>
                  {group.label}
                </div>
              ))}
            </div>

            {/* Row 2: L/R indicators */}
            <div style={{ display: 'flex' }}>
              {hashGroups.map((group, gIdx) => (
                group.cols.map((colId, cIdx) => (
                  <div key={colId} style={{
                    flex: 1,
                    padding: '2px',
                    fontSize: '0.4rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    background: '#64748b',
                    borderLeft: cIdx === 0 && gIdx > 0 ? '2px solid #1e293b' : (cIdx > 0 ? '1px solid #475569' : 'none')
                  }}>
                    {colId.endsWith('_L') ? 'L HASH' : 'R HASH'}
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>

        {/* Play Type Rows */}
        {playTypes.map((pt, ptIdx) => {
          const rowHasPlays = allCols.some(col => getPlaysForCell(pt.id, col).length > 0);
          if (isPrintMode && !rowHasPlays) return null;

          return (
            <div key={pt.id} style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {/* Play Type Label */}
              <div style={{
                width: '60px',
                flexShrink: 0,
                padding: '2px 4px',
                fontSize: '0.5rem',
                fontWeight: 'bold',
                color: '#1e40af',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center'
              }}>
                {pt.label}
              </div>

              {/* Data Cells */}
              {allCols.map((colId, colIdx) => {
                const cellPlays = getPlaysForCell(pt.id, colId);
                const groupIdx = hashGroups.findIndex(g => g.cols.includes(colId));
                const isFirstInGroup = hashGroups[groupIdx]?.cols[0] === colId;

                return (
                  <div
                    key={colId}
                    className="matrix-box-cell"
                    style={{
                      flex: 1,
                      padding: '2px',
                      minHeight: '22px',
                      background: ptIdx % 2 === 1 ? '#f8fafc' : 'white',
                      borderLeft: isFirstInGroup && groupIdx > 0 ? '2px solid #cbd5e1' : '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px'
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onMatrixBoxAdd) {
                        const playData = e.dataTransfer.getData('application/react-dnd');
                        if (playData) {
                          try {
                            const { playId } = JSON.parse(playData);
                            if (playId) {
                              onMatrixBoxAdd(box.setId, pt.id, colId, playId);
                            }
                          } catch (err) {
                            console.error('Error parsing drop data:', err);
                          }
                        }
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {cellPlays.map((p, i) => (
                      <div key={i} style={{
                        fontSize: '0.55rem',
                        fontWeight: '500',
                        color: '#1e293b',
                        background: p.priority ? '#fef08a' : '#f1f5f9',
                        padding: '1px 2px',
                        borderRadius: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }} title={getPlayCall(p)}>
                        {getPlayDisplayName(p)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Render box content based on type
  const renderBoxContent = (box, isPrintMode = false) => {
    if (box.type === 'grid') {
      return renderGridBox(box, isPrintMode);
    }

    if (box.type === 'script' && box.rows && box.rows.length > 0) {
      return renderScriptBox(box, isPrintMode);
    }

    if (box.type === 'fzdnd') {
      return renderFZDnDBox(box, isPrintMode);
    }

    if (box.type === 'matrix') {
      return renderMatrixBox(box, isPrintMode);
    }

    // Default: show plays from set
    const playsInBox = getPlaysForSet(box.setId);
    if (playsInBox.length === 0) {
      return isPrintMode ? null : (
        <div style={{ color: '#cbd5e1', fontStyle: 'italic', paddingTop: '4px' }}>
          Empty
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {playsInBox.map((p, pIdx) => (
          <div key={pIdx} style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'baseline',
            lineHeight: '1.2',
            background: p.priority ? '#fef08a' : 'transparent'
          }}>
            <span style={{
              color: '#94a3b8',
              width: '14px',
              textAlign: 'right',
              flexShrink: 0
            }}>
              {pIdx + 1}.
            </span>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>{getPlayCall(p)}</span>
          </div>
        ))}
      </div>
    );
  };

  // Handle drag events
  const handleDragStart = (e, sectionIdx, boxIdx) => {
    if (!isEditing) return;
    setDraggedCell({ sectionIdx, boxIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isEditing ? 'move' : 'copy';
  };

  const handleDragEnter = (e, sectionIdx, boxIdx) => {
    e.preventDefault();
    if (!isEditing) {
      setPlayDragOverBox({ sectionIdx, boxIdx });
    }
  };

  const handleDragLeave = (e, sectionIdx, boxIdx) => {
    if (playDragOverBox?.sectionIdx === sectionIdx && playDragOverBox?.boxIdx === boxIdx) {
      setPlayDragOverBox(null);
    }
  };

  const handleDrop = (e, sectionIdx, boxIdx) => {
    setPlayDragOverBox(null);
    onBoxDrop(e, sectionIdx, boxIdx);
  };

  const is4Page = pageFormat === '4-page';
  const gameDate = currentWeek?.gameDate
    ? new Date(currentWeek.gameDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    : '';

  // Compact print header component - aligned with content below
  const PrintHeader = ({ pageNum, totalPages }) => (
    <div className="print-compact-header" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0',
      margin: '0 0 4px 0'
    }}>
      {teamLogo && (teamLogo.startsWith('http') || teamLogo.startsWith('data:')) ? (
        <img src={teamLogo} alt="Logo" style={{ height: '24px', width: 'auto' }} />
      ) : null}
      <div style={{ flex: 1, fontSize: '9pt', fontWeight: 'bold', color: '#000' }}>
        {weekTitle} vs. {currentWeek?.opponent || 'OPPONENT'}
        {gameDate && <span style={{ fontWeight: 'normal', marginLeft: '6px', fontSize: '7pt' }}>{gameDate}</span>}
        {totalPages > 1 && <span style={{ fontWeight: 'normal', marginLeft: '6px', fontSize: '6pt', color: '#666' }}>Page {pageNum}/{totalPages}</span>}
      </div>
    </div>
  );

  // Render matrix box for print with only specific hash groups
  const renderMatrixBoxForPrint = (box, hashGroupIndices) => {
    const playTypes = box.playTypes || [
      { id: 'strong_run', label: 'STRONG RUN' },
      { id: 'weak_run', label: 'WEAK RUN' },
      { id: 'quick_game', label: 'QUICK GAME' },
      { id: 'drop_back', label: 'DROPBACK' },
      { id: 'gadget', label: 'GADGET' }
    ];
    const allHashGroups = box.hashGroups || [
      { id: 'FB', label: 'BASE/INITIAL', cols: ['FB_L', 'FB_R'] },
      { id: 'CB', label: 'BASE W/ DRESSING', cols: ['CB_L', 'CB_R'] },
      { id: 'CU', label: 'CONVERT', cols: ['CU_L', 'CU_R'] },
      { id: 'SO', label: 'EXPLOSIVE', cols: ['SO_L', 'SO_R'] }
    ];

    // Filter to only the hash groups for this page
    const hashGroups = hashGroupIndices.map(i => allHashGroups[i]).filter(Boolean);
    const allCols = hashGroups.flatMap(g => g.cols);

    const getPlaysForCell = (playTypeId, colId) => {
      const setId = `${box.setId}_${playTypeId}_${colId}`;
      const set = gamePlan?.sets?.find(s => s.id === setId);
      return (set?.playIds || []).map(id => plays.find(p => p.id === id)).filter(Boolean);
    };

    return (
      <div className="print-matrix-box" style={{ fontSize: '7pt', width: '100%' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
          <div style={{
            width: '60px',
            flexShrink: 0,
            padding: '2px 4px',
            fontSize: '5pt',
            fontWeight: 'bold',
            textAlign: 'center',
            background: box.color || '#334155',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1.1'
          }}>
            {box.header || 'MATRIX'}
          </div>
          {hashGroups.map((group, gIdx) => (
            <div key={group.id} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '2px',
                fontSize: '6pt',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                background: '#475569',
                borderLeft: gIdx > 0 ? '2px solid #1e293b' : 'none'
              }}>
                {group.label}
              </div>
              <div style={{ display: 'flex' }}>
                {group.cols.map((colId, cIdx) => (
                  <div key={colId} style={{
                    flex: 1,
                    padding: '1px',
                    fontSize: '5pt',
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    background: '#64748b',
                    borderLeft: cIdx === 0 && gIdx > 0 ? '2px solid #1e293b' : (cIdx > 0 ? '1px solid #475569' : 'none')
                  }}>
                    {colId.endsWith('_L') ? 'L' : 'R'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Play Type Rows */}
        {playTypes.map((pt, ptIdx) => {
          const rowHasPlays = allCols.some(col => getPlaysForCell(pt.id, col).length > 0);
          if (!rowHasPlays) return null;

          return (
            <div key={pt.id} style={{ display: 'flex', borderBottom: '1px solid #ddd', minHeight: '16px' }}>
              <div style={{
                width: '50px',
                flexShrink: 0,
                padding: '2px 4px',
                fontSize: '5pt',
                fontWeight: 'bold',
                color: '#1e40af',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center'
              }}>
                {pt.label}
              </div>
              {hashGroups.map((group, gIdx) => (
                group.cols.map((colId, cIdx) => {
                  const cellPlays = getPlaysForCell(pt.id, colId);
                  return (
                    <div key={colId} style={{
                      flex: 1,
                      padding: '1px 2px',
                      background: ptIdx % 2 === 1 ? '#f8fafc' : 'white',
                      borderLeft: cIdx === 0 && gIdx > 0 ? '2px solid #cbd5e1' : '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px'
                    }}>
                      {cellPlays.map((p, i) => (
                        <div key={i} style={{
                          fontSize: '6pt',
                          fontWeight: '500',
                          color: '#1e293b',
                          background: p.priority ? '#fef08a' : '#f1f5f9',
                          padding: '1px 2px',
                          borderRadius: '1px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {getPlayDisplayName(p)}
                        </div>
                      ))}
                    </div>
                  );
                })
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const isLandscape = pageOrientation === 'landscape';

  // Determine actual paper orientation based on format + orientation combo
  // 2-page: orientation matches paper
  // 4-page portrait booklet (17" tall): paper is LANDSCAPE (pages stack vertically)
  // 4-page landscape booklet (17" wide): paper is PORTRAIT (pages side-by-side)
  const getPaperOrientation = () => {
    if (!is4Page) {
      return pageOrientation; // 2-page: use selected orientation
    }
    // 4-page booklet: flip the orientation
    return pageOrientation === 'portrait' ? 'landscape' : 'portrait';
  };

  const paperOrientation = getPaperOrientation();

  // Dynamic print styles for orientation
  const printOrientationStyle = `
    @media print {
      @page {
        size: letter ${paperOrientation};
        margin: 0.25in;
      }
    }
  `;

  return (
    <div className={`animate-fade-in ${is4Page ? 'print-4page' : 'print-2page'} ${isLandscape ? 'print-landscape' : 'print-portrait'}`} style={{ height: '100%', overflowY: 'auto', padding: '1rem' }}>
      {/* Dynamic print orientation style */}
      <style dangerouslySetInnerHTML={{ __html: printOrientationStyle }} />
      {/* Print Pages for 4-page booklet format */}
      {is4Page && (
        <div className="print-only-4page">
          {/*
            4 pages layout for 17x11 booklet:
            - Pages 1 & 2: First spread (left and right halves of matrix - Base/Base w/ Dressing on left, Convert/Explosive on right)
            - Pages 3 & 4: Additional sections if needed

            For matrix boxes: split 4 hash groups into 2 per page
          */}
          {sections.map((section, sIdx) => {
            const visibleBoxes = (section.boxes || []).filter(b => !b.hidden);
            const matrixBoxes = visibleBoxes.filter(b => b.type === 'matrix');
            const nonMatrixBoxes = visibleBoxes.filter(b => b.type !== 'matrix');

            // For matrix boxes, we need 2 pages (left half, right half)
            if (matrixBoxes.length > 0) {
              return matrixBoxes.map((matrixBox, mbIdx) => (
                <div key={`matrix-${sIdx}-${mbIdx}`}>
                  {/* Page 1: Left side - Base & Base w/ Dressing (hash groups 0, 1) */}
                  <div className="print-page-4">
                    <PrintHeader pageNum={1} totalPages={4} />
                    <div className="print-page-content-4">
                      <div className="print-section-4">
                        <div className="print-section-header-4">{section.title} - {matrixBox.header}</div>
                        <div className="print-matrix-wrapper">
                          {renderMatrixBoxForPrint(matrixBox, [0, 1])}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 2: Right side - Convert & Explosive (hash groups 2, 3) */}
                  <div className="print-page-4">
                    <PrintHeader pageNum={2} totalPages={4} />
                    <div className="print-page-content-4">
                      <div className="print-section-4">
                        <div className="print-section-header-4">{section.title} - {matrixBox.header}</div>
                        <div className="print-matrix-wrapper">
                          {renderMatrixBoxForPrint(matrixBox, [2, 3])}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            }

            // For non-matrix sections, split boxes across 2 pages
            if (nonMatrixBoxes.length > 0) {
              const halfIdx = Math.ceil(nonMatrixBoxes.length / 2);
              const leftBoxes = nonMatrixBoxes.slice(0, halfIdx);
              const rightBoxes = nonMatrixBoxes.slice(halfIdx);

              return (
                <div key={`section-${sIdx}`}>
                  {/* Left page */}
                  {leftBoxes.length > 0 && (
                    <div className="print-page-4">
                      <PrintHeader pageNum={3} totalPages={4} />
                      <div className="print-page-content-4">
                        <div className="print-section-4">
                          <div className="print-section-header-4">{section.title}</div>
                          <div className="print-boxes-grid-4">
                            {leftBoxes.map((box, bIdx) => (
                              <div key={bIdx} className="print-box-4" style={{
                                gridColumn: `span ${Math.min(box.colSpan || 2, 4)}`,
                              }}>
                                <div className="print-box-header-4" style={{ background: box.color || '#3b82f6' }}>
                                  {box.header}
                                </div>
                                <div className="print-box-content-4">
                                  {renderBoxContent(box, true)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right page */}
                  {rightBoxes.length > 0 && (
                    <div className="print-page-4">
                      <PrintHeader pageNum={4} totalPages={4} />
                      <div className="print-page-content-4">
                        <div className="print-section-4">
                          <div className="print-section-header-4">{section.title} (cont.)</div>
                          <div className="print-boxes-grid-4">
                            {rightBoxes.map((box, bIdx) => (
                              <div key={bIdx} className="print-box-4" style={{
                                gridColumn: `span ${Math.min(box.colSpan || 2, 4)}`,
                              }}>
                                <div className="print-box-header-4" style={{ background: box.color || '#3b82f6' }}>
                                  {box.header}
                                </div>
                                <div className="print-box-content-4">
                                  {renderBoxContent(box, true)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Standard Print Header (2-page mode) - no left padding, aligns with content */}
      <div className="print-only-2page" style={{
        display: 'none',
        alignItems: 'center',
        gap: '8px',
        padding: '0',
        marginBottom: '8px'
      }}>
        {teamLogo && (teamLogo.startsWith('http') || teamLogo.startsWith('data:')) ? (
          <img src={teamLogo} alt="Logo" style={{ height: '24px', width: 'auto' }} />
        ) : null}
        <div style={{ flex: 1, fontSize: '9pt', fontWeight: 'bold', color: '#000' }}>
          {weekTitle} vs. {currentWeek?.opponent || 'OPPONENT'}
          {gameDate && <span style={{ fontWeight: 'normal', marginLeft: '6px', fontSize: '7pt' }}>{gameDate}</span>}
        </div>
      </div>

      {/* Page Containers */}
      {(() => {
        const numPages = is4Page ? 4 : 2;
        const pageContainers = [];

        // Calculate page dimensions based on format and orientation
        // Using 96px per inch for screen display
        const pxPerInch = 96;
        let pageWidthIn, pageHeightIn;

        if (is4Page) {
          // 4-page booklet
          if (isLandscape) {
            // Landscape booklet: portrait paper, full page each
            pageWidthIn = 8; pageHeightIn = 10.5;
          } else {
            // Portrait booklet: landscape paper, pages stack (half height)
            pageWidthIn = 10.5; pageHeightIn = 5;
          }
        } else {
          // 2-page mode
          if (isLandscape) {
            pageWidthIn = 10.5; pageHeightIn = 8;
          } else {
            pageWidthIn = 8; pageHeightIn = 10.5;
          }
        }

        // Use full width, maintain aspect ratio for height
        const aspectRatio = pageHeightIn / pageWidthIn;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          // Filter sections for this page (default to page 1 if not set)
          const pageSections = sections
            .map((section, idx) => ({ section, originalIdx: idx }))
            .filter(({ section }) => (section.pageNumber || 1) === pageNum);

          // Skip empty pages when not editing
          if (pageSections.length === 0 && !isEditing) continue;

          pageContainers.push(
            <div
              key={pageNum}
              className="page-container"
              style={{
                width: '100%',
                aspectRatio: `${pageWidthIn} / ${pageHeightIn}`,
                border: '2px solid #94a3b8',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                background: 'white',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Page Header - editor only, not printed */}
              <div className="hide-on-print" style={{
                background: '#334155',
                color: 'white',
                padding: '4px 12px',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <span>PAGE {pageNum}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                  {pageWidthIn}" × {pageHeightIn}" | {pageSections.length} section{pageSections.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Page Content - overflow hidden */}
              <div style={{
                flex: 1,
                padding: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {pageSections.map(({ section, originalIdx: sIdx }) => {
                  // Show all boxes in edit mode
                  const visibleBoxes = isEditing
                    ? (section.boxes || [])
                    : (section.boxes || []).filter(b => !b.hidden);

                  if (!isEditing && visibleBoxes.length === 0) return null;

                  // Section grid dimensions
                  const sectionCols = section.gridColumns || 8;
                  const sectionRows = section.gridRows || 6;

                  return (
                    <div
                      key={sIdx}
                      className={`call-sheet-section${section.expandToFill ? ' expand-full-width' : ''}`}
                      style={{
                        gridColumn: '1 / -1',
                        breakInside: 'avoid',
                        marginBottom: '0.5rem',
                        border: isEditing ? '1px dashed #3b82f6' : '1px solid #cbd5e1',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        background: 'white',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Section Header */}
                      <div style={{
                        background: '#f1f5f9',
                        padding: '0.5rem',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #cbd5e1',
                        textTransform: 'uppercase',
                        fontSize: '0.8rem',
                        color: '#334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                            <input
                              value={section.title}
                              onChange={(e) => onUpdateSection(sIdx, { ...section, title: e.target.value })}
                              style={{
                                flex: 1,
                                padding: '2px 4px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}
                            />
                            {/* Page Selector */}
                            <select
                              value={section.pageNumber || 1}
                              onChange={(e) => onUpdateSection(sIdx, { ...section, pageNumber: parseInt(e.target.value) })}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 'bold'
                              }}
                              title="Move to page"
                            >
                              {Array.from({ length: numPages }, (_, i) => (
                                <option key={i + 1} value={i + 1}>Page {i + 1}</option>
                              ))}
                            </select>
                            {/* Grid Columns */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem' }}>
                              <span style={{ color: '#64748b' }}>Cols:</span>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={section.gridColumns || 8}
                                onChange={(e) => onUpdateSection(sIdx, { ...section, gridColumns: parseInt(e.target.value) || 8 })}
                                style={{ width: '36px', padding: '2px 4px', fontSize: '0.65rem', borderRadius: '3px', border: '1px solid #cbd5e1' }}
                              />
                            </div>
                            {/* Grid Rows */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem' }}>
                              <span style={{ color: '#64748b' }}>Rows:</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={section.gridRows || 6}
                                onChange={(e) => onUpdateSection(sIdx, { ...section, gridRows: parseInt(e.target.value) || 6 })}
                                style={{ width: '36px', padding: '2px 4px', fontSize: '0.65rem', borderRadius: '3px', border: '1px solid #cbd5e1' }}
                              />
                            </div>
                            <button
                              onClick={() => onDeleteSection(sIdx)}
                              style={{
                                color: '#ef4444',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span>{section.title}</span>
                        )}
                      </div>

                      {/* Section Content - True 2D Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${sectionCols}, 1fr)`,
                        gridTemplateRows: `repeat(${sectionRows}, minmax(40px, auto))`,
                        gridAutoFlow: 'dense',
                        gap: isEditing ? '4px' : '1px',
                        padding: isEditing ? '4px' : '0',
                        flex: 1
                      }}>
                        {visibleBoxes.map((box, bIdx) => {
                          const colSpan = Math.min(Number(box.colSpan) || 2, sectionCols);
                          const rowSpan = Number(box.rowSpan) || 1;
                          return (
                            <div
                              key={bIdx}
                              draggable={isEditing}
                              onDragStart={(e) => handleDragStart(e, sIdx, bIdx)}
                              onDragOver={handleDragOver}
                              onDragEnter={(e) => handleDragEnter(e, sIdx, bIdx)}
                              onDragLeave={(e) => handleDragLeave(e, sIdx, bIdx)}
                              onDrop={(e) => handleDrop(e, sIdx, bIdx)}
                              style={{
                                gridColumn: `span ${colSpan}`,
                                gridRow: `span ${rowSpan}`,
                                border: isEditing
                                  ? '1px solid #e2e8f0'
                                  : (playDragOverBox?.sectionIdx === sIdx && playDragOverBox?.boxIdx === bIdx
                                    ? '2px dashed #3b82f6'
                                    : '1px solid #e2e8f0'),
                                background: playDragOverBox?.sectionIdx === sIdx && playDragOverBox?.boxIdx === bIdx
                                  ? '#eff6ff'
                                  : 'white',
                                cursor: isEditing ? 'grab' : 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                opacity: (draggedCell?.sectionIdx === sIdx && draggedCell?.boxIdx === bIdx) ? 0.5 : 1,
                                transition: 'background 0.15s, border 0.15s',
                                overflow: 'hidden'
                              }}
                              onClick={() => {
                                if (!isEditing) onBoxClick(box, sIdx, bIdx);
                              }}
                            >
                              {/* Box Header */}
                              <div style={{
                                padding: '4px 8px',
                                background: box.color || '#3b82f6',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span style={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {box.header}
                                </span>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    {/* ColSpan × RowSpan controls */}
                                    <input
                                      type="number"
                                      min="1"
                                      max={sectionCols}
                                      value={box.colSpan || 2}
                                      onChange={(e) => onUpdateBox(sIdx, bIdx, { ...box, colSpan: parseInt(e.target.value) || 2 })}
                                      style={{ width: '28px', padding: '1px 2px', fontSize: '0.6rem', borderRadius: '2px', border: 'none', textAlign: 'center' }}
                                      title="Column span"
                                    />
                                    <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>×</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max={sectionRows}
                                      value={box.rowSpan || 1}
                                      onChange={(e) => onUpdateBox(sIdx, bIdx, { ...box, rowSpan: parseInt(e.target.value) || 1 })}
                                      style={{ width: '28px', padding: '1px 2px', fontSize: '0.6rem', borderRadius: '2px', border: 'none', textAlign: 'center' }}
                                      title="Row span"
                                    />
                                    <div
                                      onClick={() => onDeleteBox(sIdx, bIdx)}
                                      style={{ cursor: 'pointer', padding: '0 2px', marginLeft: '4px' }}
                                    >
                                      ×
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <span style={{
                                      fontSize: '0.7rem',
                                      opacity: 0.9,
                                      background: 'rgba(0,0,0,0.2)',
                                      padding: '0 4px',
                                      borderRadius: '4px'
                                    }}>
                                      {getPlaysForSet(box.setId).length}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {/* Box Content */}
                              <div style={{ padding: '6px', fontSize: '0.7rem', flex: 1 }}>
                                {renderBoxContent(box, false)}
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Box Button */}
                        {isEditing && (
                          <div
                            style={{
                              border: '2px dashed #e2e8f0',
                              borderRadius: '4px',
                              minHeight: '120px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#64748b',
                              fontWeight: '500',
                              background: '#f8fafc'
                            }}
                            onClick={() => onAddBox(sIdx)}
                          >
                            + Add Box
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add Section Button for this page */}
                {isEditing && (
                  <button
                    style={{
                      border: '2px dashed #cbd5e1',
                      height: '60px',
                      width: '100%',
                      gridColumn: '1 / -1',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontWeight: '600',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onClick={() => onAddSection(pageNum)}
                  >
                    <span style={{ fontSize: '1rem' }}>+</span> Add Section to Page {pageNum}
                  </button>
                )}

              </div>
            </div>
          );
        }

        return pageContainers;
      })()}
    </div>
  );
}
