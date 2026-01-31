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
  getWristbandLabel,
  getPlayDisplayName,
  draggedCell,
  setDraggedCell,
  playDragOverBox,
  setPlayDragOverBox,
  onEditBox,
  onBoxClick
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
                      <span style={{ display: 'inline', lineHeight: '1.2' }}>
                        <span style={{ fontWeight: '500' }}>{getPlayDisplayName(play)}</span>
                        {getWristbandLabel(play) && (
                          <span style={{
                            marginLeft: '3px',
                            fontWeight: 'bold',
                            color: '#3b82f6',
                            fontSize: '0.85em'
                          }}>
                            {getWristbandLabel(play)}
                          </span>
                        )}
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
                    {getPlayCall(play)}
                    {getWristbandLabel(play) && (
                      <span style={{
                        marginLeft: '3px',
                        fontSize: '0.85em',
                        color: '#3b82f6',
                        fontWeight: 'bold'
                      }}>
                        {getWristbandLabel(play)}
                      </span>
                    )}
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
                  {playLeft.name}
                  {getWristbandLabel(playLeft) && (
                    <span style={{
                      marginLeft: '3px',
                      fontSize: '0.85em',
                      color: '#3b82f6',
                      fontWeight: 'bold'
                    }}>
                      {getWristbandLabel(playLeft)}
                    </span>
                  )}
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
                  {playRight.name}
                  {getWristbandLabel(playRight) && (
                    <span style={{
                      marginLeft: '3px',
                      fontSize: '0.85em',
                      color: '#3b82f6',
                      fontWeight: 'bold'
                    }}>
                      {getWristbandLabel(playRight)}
                    </span>
                  )}
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

  // Render box content based on type
  const renderBoxContent = (box, isPrintMode = false) => {
    if (box.type === 'grid') {
      return renderGridBox(box, isPrintMode);
    }

    if (box.type === 'script' && box.rows && box.rows.length > 0) {
      return renderScriptBox(box, isPrintMode);
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

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto', padding: '1rem' }}>
      {/* Print Header */}
      <div className="print-only" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '2px solid black'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {teamLogo && (teamLogo.startsWith('http') || teamLogo.startsWith('data:')) ? (
            <img src={teamLogo} alt="Logo" style={{ height: '50px', width: 'auto' }} />
          ) : teamLogo ? (
            <span style={{ fontSize: '2rem' }}>{teamLogo}</span>
          ) : null}
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'black' }}>
              {weekTitle} {opponentTitle && `- ${opponentTitle}`}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
              Situations & Scripts
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Edit Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        {!isLocked && (
          <button
            onClick={onToggleEditing}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: isEditing ? '#2563eb' : 'white',
              color: isEditing ? 'white' : '#0f172a',
              border: isEditing ? '1px solid #2563eb' : '1px solid #94a3b8',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            {isEditing ? 'Done Editing' : 'Edit Layout'}
          </button>
        )}
      </div>

      {/* Sections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1rem',
        alignItems: 'start'
      }}>
        {sections.map((section, sIdx) => {
          // Show all boxes in edit mode
          const visibleBoxes = isEditing
            ? (section.boxes || [])
            : (section.boxes || []).filter(b => !b.hidden);

          if (!isEditing && visibleBoxes.length === 0) return null;

          // Group boxes into rows based on 7-column grid
          const rows = [];
          let currentRow = [];
          let currentSpan = 0;

          visibleBoxes.forEach((box, bIdx) => {
            const span = Number(box.colSpan) > 1
              ? Number(box.colSpan)
              : (box.type === 'grid' ? 5 : 2);

            if (currentSpan + span > 7 && currentRow.length > 0) {
              rows.push(currentRow);
              currentRow = [];
              currentSpan = 0;
            }

            currentRow.push({ box, originalIndex: bIdx, span });
            currentSpan += span;
          });

          if (currentRow.length > 0) {
            rows.push(currentRow);
          }

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
                    <button
                      onClick={() => onUpdateSection(sIdx, { ...section, expandToFill: !section.expandToFill })}
                      style={{
                        background: section.expandToFill ? '#f59e0b' : '#e2e8f0',
                        color: section.expandToFill ? 'white' : '#64748b',
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        whiteSpace: 'nowrap',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title={section.expandToFill ? 'Return to fixed width' : 'Expand to fill'}
                    >
                      {section.expandToFill ? 'Fixed Width' : 'Expand'}
                    </button>
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

              {/* Section Content */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '0',
                padding: isEditing ? '4px' : '0'
              }}>
                {rows.map((rowBoxes, rIdx) => (
                  <div key={rIdx} style={{
                    display: section.expandToFill ? 'flex' : 'grid',
                    gridTemplateColumns: section.expandToFill ? undefined : 'repeat(7, 1fr)',
                    width: '100%',
                    gap: isEditing ? '4px' : '0',
                    marginBottom: isEditing ? '4px' : '0'
                  }}>
                    {rowBoxes.map(({ box, originalIndex: bIdx, span }, i) => {
                      const isFirstInRow = i === 0;

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
                            flexGrow: section.expandToFill ? span : 0,
                            flexBasis: section.expandToFill ? '0' : undefined,
                            minWidth: section.expandToFill ? '125px' : undefined,
                            gridColumn: section.expandToFill ? 'auto' : `span ${span}`,
                            border: isEditing
                              ? '1px solid #e2e8f0'
                              : (playDragOverBox?.sectionIdx === sIdx && playDragOverBox?.boxIdx === bIdx
                                ? '2px dashed #3b82f6'
                                : 'none'),
                            background: playDragOverBox?.sectionIdx === sIdx && playDragOverBox?.boxIdx === bIdx
                              ? '#eff6ff'
                              : 'white',
                            minHeight: '120px',
                            cursor: isEditing ? 'grab' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            opacity: (draggedCell?.sectionIdx === sIdx && draggedCell?.boxIdx === bIdx) ? 0.5 : 1,
                            transition: 'background 0.15s, border 0.15s'
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
                              <div
                                onClick={(e) => { e.stopPropagation(); onDeleteBox(sIdx, bIdx); }}
                                style={{ cursor: 'pointer', padding: '0 4px' }}
                              >
                                x
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
                  </div>
                ))}

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

        {/* Add Section Button */}
        {isEditing && (
          <button
            style={{
              border: '2px dashed #cbd5e1',
              height: '80px',
              width: '100%',
              gridColumn: '1 / -1',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onClick={onAddSection}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span> Add New Section
          </button>
        )}
      </div>
    </div>
  );
}
