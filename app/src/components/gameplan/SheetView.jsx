import { useState, useCallback, useRef, useEffect } from 'react';
import { Trash2, Plus, GripVertical, Lock, Unlock } from 'lucide-react';
import { getPlayCall, abbreviatePlayCall } from '../../utils/playDisplay';

/**
 * FitText component - displays text that auto-shrinks to fit container
 * Applies abbreviations first, then reduces font size if needed
 */
function FitText({ text, abbreviations, baseFontSize = 0.6, minFontSize = 0.35, style = {} }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(baseFontSize);

  // Apply abbreviations to text
  const displayText = abbreviations ? abbreviatePlayCall(text, abbreviations) : text;

  useEffect(() => {
    if (!containerRef.current || !textRef.current || !displayText) {
      setFontSize(baseFontSize);
      return;
    }

    // Start at base font size and shrink until text fits
    let currentSize = baseFontSize;

    // Function to measure and fit
    const fitText = () => {
      if (!containerRef.current || !textRef.current) return;

      const container = containerRef.current;
      const textEl = textRef.current;

      // Get container width
      const containerWidth = container.clientWidth;
      if (containerWidth <= 0) return; // Container not rendered yet

      // Reset to base size for measurement
      textEl.style.fontSize = `${baseFontSize}rem`;

      // Measure text width
      let textWidth = textEl.scrollWidth;

      // Shrink font until text fits or we hit minimum
      currentSize = baseFontSize;
      while (textWidth > containerWidth && currentSize > minFontSize) {
        currentSize -= 0.025;
        textEl.style.fontSize = `${currentSize}rem`;
        textWidth = textEl.scrollWidth;
      }

      setFontSize(currentSize);
    };

    // Run on next frame to ensure layout is complete
    const frameId = requestAnimationFrame(fitText);

    return () => cancelAnimationFrame(frameId);
  }, [displayText, baseFontSize, minFontSize]);

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <span
        ref={textRef}
        style={{
          fontSize: `${fontSize}rem`,
          fontWeight: '500',
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        {displayText}
      </span>
    </div>
  );
}

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
  onDropOnEmptyCell,
  onToggleBoxLock,
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
  pageOrientation = 'landscape',
  isTargetingMode = false,
  targetingPlayCount = 0
}) {
  const sections = layouts?.CALL_SHEET?.sections || [];
  const weekTitle = currentWeek?.name || `Week ${currentWeek?.weekNumber || ''}`;
  const opponentTitle = currentWeek?.opponent ? `vs. ${currentWeek.opponent}` : '';

  // Get wristband abbreviations for auto-shortening play names
  const abbreviations = setupConfig?.wristbandAbbreviations || {};

  // Track which cell is being hovered during drag (for visual feedback)
  const [dragOverCell, setDragOverCell] = useState(null);

  // Zoom level for page view (50% to 150%)
  const [zoomLevel, setZoomLevel] = useState(100);

  // Calculate row height based on orientation to fit content on page
  // Landscape: ~720px usable / 60 rows = 12px
  // Portrait: ~960px usable / 70 rows ≈ 13-14px
  const isLandscape = pageOrientation === 'landscape';
  const rowHeight = isLandscape ? 12 : 13;

  // Render grid box content
  // rowOffset: starting row number for sequential numbering across boxes
  const renderGridBox = (box, isPrintMode = false, rowOffset = 0) => {
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

    // Track which row we're on for sequential numbering (only count non-empty rows)
    let displayedRowCount = 0;

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `min-content repeat(${cols}, 1fr)`,
        gap: '0',
        width: '100%'
      }}>
        {/* Header Row */}
        <div style={{
          height: `${rowHeight}px`,
          padding: '0 2px',
          fontSize: '0.55rem',
          fontWeight: 'bold',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {box.cornerLabel || '#'}
        </div>
        {headings.slice(0, cols).map((h, i) => (
          <div key={`h-${i}`} style={{
            height: `${rowHeight}px`,
            padding: '0 2px',
            fontSize: '0.55rem',
            fontWeight: 'bold',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

          // Skip empty rows entirely (hidden in print via CSS class)
          if (isEmpty) {
            return (
              <div key={rIdx} className="empty-row no-print" style={{ display: 'contents' }}>
                <div style={{
                  padding: '2px',
                  fontSize: '0.6rem',
                  color: '#cbd5e1',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: '15px',
                  height: `${rowHeight}px`,
                  borderBottom: '1px dotted #e2e8f0',
                  background: rIdx % 2 === 0 ? (box.rowColor1 || '#ffffff') : (box.rowColor2 || '#f8fafc')
                }}>
                  {rIdx + 1}
                </div>
                {rowSlots.map((slot, cIdx) => (
                  <div key={cIdx} style={{
                    overflow: 'hidden',
                    background: rIdx % 2 === 0 ? (box.rowColor1 || '#ffffff') : (box.rowColor2 || '#f8fafc'),
                    padding: '2px',
                    height: `${rowHeight}px`,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    borderRight: cIdx < cols - 1 ? '1px solid #e2e8f0' : 'none',
                    borderBottom: '1px dotted #e2e8f0',
                  }}>
                  </div>
                ))}
              </div>
            );
          }

          // Non-empty row - use sequential numbering
          displayedRowCount++;
          const rowNumber = rowOffset + displayedRowCount;

          // Alternating row colors (customizable wristband style)
          const rowBg = (rowNumber - 1) % 2 === 0 ? (box.rowColor1 || '#ffffff') : (box.rowColor2 || '#f8fafc');

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
                height: `${rowHeight}px`,
                borderBottom: '1px dotted #e2e8f0',
                background: rowBg
              }}>
                {(box.gridRowLabels && box.gridRowLabels[rIdx]) || rowNumber}
              </div>
              {rowSlots.map((slot, cIdx) => {
                const play = slot.type === 'PLAY' ? slot : null;
                return (
                  <div key={cIdx} style={{
                    overflow: 'hidden',
                    background: play?.priority ? '#fef08a' : rowBg,
                    padding: '2px',
                    height: `${rowHeight}px`,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    borderRight: cIdx < cols - 1 ? '1px solid #e2e8f0' : 'none',
                    borderBottom: '1px dotted #e2e8f0',
                  }} title={play ? getPlayCall(play) : ''}>
                    {play ? (
                      <FitText
                        text={getPlayDisplayName(play)}
                        abbreviations={abbreviations}
                        baseFontSize={0.6}
                        minFontSize={0.35}
                      />
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
  // rowOffset: starting row number for sequential numbering across boxes
  const renderScriptBox = (box, isPrintMode = false, rowOffset = 0) => {
    const boxRows = box.rows || [];
    const scriptColumns = box.scriptColumns || 2; // 1 = single column, 2 = left/right hash

    // Check if a row has content
    const rowHasContent = (row) => {
      const playLeft = plays.find(p => p.id === row.content);
      const playRight = plays.find(p => p.id === row.contentRight);
      return playLeft || (scriptColumns === 2 && playRight);
    };

    // Filter to non-empty rows for print mode
    const rowsToRender = isPrintMode ? boxRows.filter(rowHasContent) : boxRows;

    if (isPrintMode && rowsToRender.length === 0) {
      return null;
    }

    // Single column layout
    if (scriptColumns === 1) {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          gap: '0',
          width: '100%'
        }}>
          {/* Header Row */}
          <div style={{
            height: `${rowHeight}px`,
            padding: '0 2px',
            fontSize: '0.55rem',
            fontWeight: 'bold',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            #
          </div>
          <div style={{
            height: `${rowHeight}px`,
            padding: '0 2px',
            fontSize: '0.55rem',
            fontWeight: 'bold',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1'
          }}>
            PLAY
          </div>

          {/* Data Rows */}
          {rowsToRender.map((row, rIdx) => {
            const play = plays.find(p => p.id === row.content);
            const isEmpty = !play;
            const rowNumber = rowOffset + rIdx + 1;
            // Alternating row colors (customizable wristband style)
            const rowBg = (rowNumber - 1) % 2 === 0 ? (box.rowColor1 || '#ffffff') : (box.rowColor2 || '#f8fafc');

            // For screen display, show empty rows but mark them for print hiding
            if (isEmpty && !isPrintMode) {
              return (
                <div key={rIdx} className="empty-row no-print" style={{ display: 'contents' }}>
                  <div style={{
                    padding: '2px',
                    fontSize: '0.6rem',
                    color: '#cbd5e1',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    minWidth: '15px',
                    height: `${rowHeight}px`,
                    borderBottom: '1px dotted #e2e8f0',
                    background: rowBg
                  }}>
                    {row.label || rowNumber}
                  </div>
                  <div style={{
                    overflow: 'hidden',
                    background: rowBg,
                    padding: '2px',
                    height: `${rowHeight}px`,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px dotted #e2e8f0',
                  }}>
                    <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.6rem' }}>-</span>
                  </div>
                </div>
              );
            }

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
                  height: `${rowHeight}px`,
                  borderBottom: '1px dotted #e2e8f0',
                  background: rowBg
                }}>
                  {row.label || rowNumber}
                </div>
                <div style={{
                  overflow: 'hidden',
                  background: play?.priority ? '#fef08a' : rowBg,
                  padding: '2px',
                  height: `${rowHeight}px`,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px dotted #e2e8f0',
                }}>
                  {play ? (
                    <FitText
                      text={getPlayDisplayName(play)}
                      abbreviations={abbreviations}
                      baseFontSize={0.6}
                      minFontSize={0.35}
                    />
                  ) : (
                    <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.6rem' }}>-</span>
                  )}
                </div>
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
        gridTemplateColumns: 'min-content 1fr 1fr',
        gap: '0',
        width: '100%'
      }}>
        {/* Header Row */}
        <div style={{
          height: `${rowHeight}px`,
          padding: '0 2px',
          fontSize: '0.55rem',
          fontWeight: 'bold',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          #
        </div>
        <div style={{
          height: `${rowHeight}px`,
          padding: '0 2px',
          fontSize: '0.55rem',
          fontWeight: 'bold',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          borderRight: '1px solid #cbd5e1',
          borderBottom: '1px solid #cbd5e1'
        }}>
          LEFT HASH
        </div>
        <div style={{
          height: `${rowHeight}px`,
          padding: '0 2px',
          fontSize: '0.55rem',
          fontWeight: 'bold',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          borderBottom: '1px solid #cbd5e1'
        }}>
          RIGHT HASH
        </div>

        {/* Data Rows */}
        {rowsToRender.map((row, rIdx) => {
          const playLeft = plays.find(p => p.id === row.content);
          const playRight = plays.find(p => p.id === row.contentRight);
          const isEmpty = !playLeft && !playRight;
          const rowNumber = rowOffset + rIdx + 1;
          // Alternating row colors (customizable wristband style)
          const rowBg = (rowNumber - 1) % 2 === 0 ? (box.rowColor1 || '#ffffff') : (box.rowColor2 || '#f8fafc');

          // For screen display, show empty rows but mark them for print hiding
          if (isEmpty && !isPrintMode) {
            return (
              <div key={rIdx} className="empty-row no-print" style={{ display: 'contents' }}>
                <div style={{
                  padding: '2px',
                  fontSize: '0.6rem',
                  color: '#cbd5e1',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: '15px',
                  height: `${rowHeight}px`,
                  borderBottom: '1px dotted #e2e8f0',
                  background: rowBg
                }}>
                  {row.label || rowNumber}
                </div>
                <div style={{
                  overflow: 'hidden',
                  background: rowBg,
                  padding: '2px',
                  height: `${rowHeight}px`,
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px dotted #e2e8f0',
                }}>
                  <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.6rem' }}>-</span>
                </div>
                <div style={{
                  overflow: 'hidden',
                  background: rowBg,
                  padding: '2px',
                  height: `${rowHeight}px`,
                  borderBottom: '1px dotted #e2e8f0',
                }}>
                  <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.6rem' }}>-</span>
                </div>
              </div>
            );
          }

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
                height: `${rowHeight}px`,
                borderBottom: '1px dotted #e2e8f0',
                background: rowBg
              }}>
                {row.label || rowNumber}
              </div>
              <div style={{
                overflow: 'hidden',
                background: playLeft?.priority ? '#fef08a' : rowBg,
                padding: '2px',
                height: `${rowHeight}px`,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                borderRight: '1px solid #e2e8f0',
                borderBottom: '1px dotted #e2e8f0',
              }}>
                {playLeft ? (
                  <FitText
                    text={getPlayDisplayName(playLeft)}
                    abbreviations={abbreviations}
                    baseFontSize={0.6}
                    minFontSize={0.35}
                  />
                ) : (
                  <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.6rem' }}>-</span>
                )}
              </div>
              <div style={{
                overflow: 'hidden',
                background: playRight?.priority ? '#fef08a' : rowBg,
                padding: '2px',
                height: `${rowHeight}px`,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px dotted #e2e8f0',
              }}>
                {playRight ? (
                  <FitText
                    text={getPlayDisplayName(playRight)}
                    abbreviations={abbreviations}
                    baseFontSize={0.6}
                    minFontSize={0.35}
                  />
                ) : (
                  <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.6rem' }}>-</span>
                )}
              </div>
            </div>
          );
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
                        background: dragOverCell?.boxId === box.setId && dragOverCell?.cellId === `${rowIdx}_${col.id}`
                          ? '#dbeafe'
                          : (play?.priority ? '#fef08a' : (rowIdx % 2 === 1 ? '#f8fafc' : 'transparent')),
                        padding: '2px',
                        height: `${rowHeight}px`,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        borderRight: colIdx < cols - 1 ? '1px solid #e2e8f0' : 'none',
                        borderBottom: '1px dotted #e2e8f0',
                        border: dragOverCell?.boxId === box.setId && dragOverCell?.cellId === `${rowIdx}_${col.id}`
                          ? '2px dashed #3b82f6'
                          : undefined,
                        wordBreak: 'break-word',
                        transition: 'background 0.1s, border 0.1s'
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverCell(null);
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
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragOverCell({ boxId: box.setId, cellId: `${rowIdx}_${col.id}` });
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setDragOverCell(null);
                        }
                      }}
                      title={play ? getPlayCall(play) : ''}
                    >
                      {play ? (
                        <FitText
                          text={getPlayDisplayName(play)}
                          abbreviations={abbreviations}
                          baseFontSize={0.6}
                          minFontSize={0.35}
                        />
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

    // Get formation name from header (strip "Matrix" if present)
    const formationName = (box.header || '').replace(/\s*matrix\s*/i, '').trim() || 'TYPE';

    // Header uses box.color (same as other box types) - defaults to blue
    const headerBg = box.color || '#3b82f6';
    // Text color - white by default for colored backgrounds, or custom
    const headerTextColor = box.headerTextColor || '#ffffff';

    // Create short labels for each column (e.g., "BASE L HASH", "BASE R HASH", etc.)
    const getShortLabel = (group, colId) => {
      const hashSide = colId.endsWith('_L') ? 'L' : 'R';
      // Shorten group labels
      const shortGroup = group.label
        .replace('BASE/INITIAL', 'BASE')
        .replace('BASE W/ DRESSING', 'DRESS')
        .replace('CONVERT', 'CONV')
        .replace('EXPLOSIVE', 'EXPL');
      return `${shortGroup} ${hashSide} HASH`;
    };

    // First column settings (configurable per-box or from template)
    const firstColWidth = box.firstColWidth || 60;
    const firstColBg = box.firstColBg || '#dbeafe';
    const firstColTextColor = box.firstColTextColor || '#1e40af';
    const firstColFontSize = box.firstColFontSize || '0.5rem';

    return (
      <div className="matrix-box-container" style={{ fontSize: '0.6rem' }}>
        {/* Single Header Row - uses box.color like other box headers */}
        <div className="box-header" style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.2)', height: `${rowHeight}px` }}>
          {/* Corner cell with formation name */}
          <div style={{
            width: `${firstColWidth}px`,
            flexShrink: 0,
            padding: '1px 2px',
            fontSize: firstColFontSize,
            fontWeight: 'bold',
            textAlign: 'center',
            background: headerBg,
            color: headerTextColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: `${rowHeight}px`
          }}>
            {formationName}
          </div>

          {/* Column headers - single row with combined labels */}
          {hashGroups.map((group, gIdx) => (
            group.cols.map((colId, cIdx) => (
              <div key={colId} style={{
                flex: 1,
                padding: '2px',
                fontSize: '0.45rem',
                fontWeight: 'bold',
                color: headerTextColor,
                textAlign: 'center',
                background: headerBg,
                borderLeft: cIdx === 0 && gIdx > 0 ? '2px solid rgba(0,0,0,0.2)' : '1px solid rgba(255,255,255,0.3)',
                height: `${rowHeight}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getShortLabel(group, colId)}
              </div>
            ))
          ))}
        </div>

        {/* Play Type Rows */}
        {playTypes.map((pt, ptIdx) => {
          const rowHasPlays = allCols.some(col => getPlaysForCell(pt.id, col).length > 0);
          if (isPrintMode && !rowHasPlays) return null;

          // Alternating row colors (customizable wristband style)
          const rowBg = ptIdx % 2 === 0 ? (box.rowColor1 || '#ffffff') : (box.rowColor2 || '#f8fafc');

          return (
            <div key={pt.id} style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              height: `${rowHeight}px`
            }}>
              {/* Play Type Label */}
              <div style={{
                width: `${firstColWidth}px`,
                flexShrink: 0,
                padding: '1px 2px',
                fontSize: firstColFontSize,
                fontWeight: 'bold',
                color: firstColTextColor,
                background: firstColBg,
                display: 'flex',
                alignItems: 'center',
                height: `${rowHeight}px`
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
                      padding: '1px',
                      height: `${rowHeight}px`,
                      overflow: 'hidden',
                      background: dragOverCell?.boxId === box.setId && dragOverCell?.cellId === `${pt.id}_${colId}`
                        ? '#dbeafe'
                        : rowBg,
                      borderLeft: isFirstInGroup && groupIdx > 0 ? '2px solid #cbd5e1' : '1px solid #e2e8f0',
                      border: dragOverCell?.boxId === box.setId && dragOverCell?.cellId === `${pt.id}_${colId}`
                        ? '2px dashed #3b82f6'
                        : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0px',
                      transition: 'background 0.1s, border 0.1s'
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverCell(null);
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
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOverCell({ boxId: box.setId, cellId: `${pt.id}_${colId}` });
                    }}
                    onDragLeave={(e) => {
                      // Only clear if we're actually leaving this cell (not entering a child)
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverCell(null);
                      }
                    }}
                  >
                    {cellPlays.map((p, i) => (
                      <div key={i} style={{
                        color: '#1e293b',
                        background: p.priority ? '#fef08a' : '#f1f5f9',
                        padding: '1px 2px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        width: '100%',
                      }} title={getPlayCall(p)}>
                        <FitText
                          text={getPlayDisplayName(p)}
                          abbreviations={abbreviations}
                          baseFontSize={0.55}
                          minFontSize={0.35}
                        />
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

  // Helper: Count filled (non-empty) rows in a box for sequential numbering
  const countFilledRows = (box) => {
    if (box.type === 'grid') {
      const cols = box.gridColumns || 4;
      const rowsCount = box.gridRows || 5;
      const totalSlots = cols * rowsCount;
      const set = gamePlan?.sets?.find(s => s.id === box.setId);
      const assignedPlayIds = set?.assignedPlayIds || box.assignedPlayIds || [];

      let filledRows = 0;
      for (let rowIdx = 0; rowIdx < rowsCount; rowIdx++) {
        const rowStart = rowIdx * cols;
        const rowEnd = rowStart + cols;
        const hasContent = assignedPlayIds.slice(rowStart, rowEnd).some(id => {
          if (!id) return false;
          const play = plays.find(p => p.id === id);
          return play && play.name && play.name.trim() !== '';
        });
        if (hasContent) filledRows++;
      }
      return filledRows;
    }

    if (box.type === 'script') {
      const boxRows = box.rows || [];
      return boxRows.filter(row => {
        const playLeft = plays.find(p => p.id === row.content);
        const playRight = plays.find(p => p.id === row.contentRight);
        return playLeft || playRight;
      }).length;
    }

    if (box.type === 'fzdnd') {
      // Count rows that have at least one play
      const rowCount = box.rowCount || 5;
      let filledRows = 0;
      // This is complex - simplified for now, just return row count
      return rowCount;
    }

    if (box.type === 'matrix') {
      const playTypes = box.playTypes || [];
      return playTypes.length;
    }

    // Default
    const playsInBox = getPlaysForSet(box.setId);
    return playsInBox.length;
  };

  // Render box content based on type
  // rowOffset: starting row number for sequential numbering across boxes
  const renderBoxContent = (box, isPrintMode = false, rowOffset = 0) => {
    if (box.type === 'grid') {
      return renderGridBox(box, isPrintMode, rowOffset);
    }

    if (box.type === 'script' && box.rows && box.rows.length > 0) {
      return renderScriptBox(box, isPrintMode, rowOffset);
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
        {playsInBox.map((p, pIdx) => {
          const playCall = getPlayCall(p);
          const abbreviated = abbreviatePlayCall(playCall, abbreviations);
          return (
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
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{abbreviated}</span>
            </div>
          );
        })}
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
      margin: '0'
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
                      {cellPlays.map((p, i) => {
                        const displayName = getPlayDisplayName(p);
                        const abbreviated = abbreviatePlayCall(displayName, abbreviations);
                        return (
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
                            {abbreviated}
                          </div>
                        );
                      })}
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
    <div className={`animate-fade-in ${is4Page ? 'print-4page' : 'print-2page'} ${isLandscape ? 'print-landscape' : 'print-portrait'}`} style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic print orientation style */}
      <style dangerouslySetInnerHTML={{ __html: printOrientationStyle }} />

      {/* Zoom Controls - only in edit mode, hidden in print */}
      {isEditing && (
        <div className="zoom-controls no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          flexShrink: 0
        }}>
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            style={{
              padding: '4px 8px',
              background: '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            −
          </button>
          <span style={{ color: 'white', fontSize: '0.75rem', minWidth: '50px', textAlign: 'center' }}>
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
            style={{
              padding: '4px 8px',
              background: '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            style={{
              padding: '4px 8px',
              background: '#475569',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              marginLeft: '8px'
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="sheet-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
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
                            {(() => {
                              // Calculate row offsets for sequential numbering
                              const rowOffsets = [];
                              let cumulative = 0;
                              leftBoxes.forEach((box, idx) => {
                                rowOffsets[idx] = cumulative;
                                cumulative += countFilledRows(box);
                              });
                              return leftBoxes.map((box, bIdx) => (
                              <div key={bIdx} className="print-box-4" style={{
                                gridColumn: `span ${Math.min(box.colSpan || 2, 4)}`,
                              }}>
                                <div className="print-box-header-4" style={{ background: box.color || '#3b82f6' }}>
                                  {box.header}
                                </div>
                                <div className="print-box-content-4">
                                  {renderBoxContent(box, true, rowOffsets[bIdx])}
                                </div>
                              </div>
                            ));
                            })()}
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
                            {(() => {
                              // Calculate row offsets continuing from leftBoxes
                              const leftBoxesTotal = leftBoxes.reduce((sum, box) => sum + countFilledRows(box), 0);
                              const rowOffsets = [];
                              let cumulative = leftBoxesTotal;
                              rightBoxes.forEach((box, idx) => {
                                rowOffsets[idx] = cumulative;
                                cumulative += countFilledRows(box);
                              });
                              return rightBoxes.map((box, bIdx) => (
                              <div key={bIdx} className="print-box-4" style={{
                                gridColumn: `span ${Math.min(box.colSpan || 2, 4)}`,
                              }}>
                                <div className="print-box-header-4" style={{ background: box.color || '#3b82f6' }}>
                                  {box.header}
                                </div>
                                <div className="print-box-content-4">
                                  {renderBoxContent(box, true, rowOffsets[bIdx])}
                                </div>
                              </div>
                            ));
                            })()}
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

        // Page grid constraints based on orientation
        // These define how many columns/rows fit on a printed page
        const pageMaxCols = isLandscape ? 6 : 5;
        const pageMaxRows = isLandscape ? 60 : 70;

        // Use full width, maintain aspect ratio for height
        const aspectRatio = pageHeightIn / pageWidthIn;

        // Helper to calculate displayed row count for a section
        // This must match displayRows logic: max of actual box rows and configured section rows
        const calculateSectionDisplayRows = (section) => {
          const visibleBoxes = isEditing
            ? (section.boxes || [])
            : (section.boxes || []).filter(b => !b.hidden);

          const sectionCols = Math.min(section.gridColumns || pageMaxCols, pageMaxCols);
          const sectionConfiguredRows = section.gridRows || 12;

          // If no boxes in edit mode, still show configured rows
          if (visibleBoxes.length === 0) {
            return isEditing ? sectionConfiguredRows : 0;
          }

          const getBoxRowSpan = (box) => {
            if (box.type === 'grid') return (box.gridRows || 5) + 2;
            if (box.type === 'script') return (box.rows?.length || 10) + 2;
            if (box.type === 'fzdnd') return (box.gridRows || box.rowCount || 5) + 2;
            if (box.type === 'matrix') return (box.playTypes?.length || 5) + 2;
            return 5 + 2;
          };

          // Calculate max row needed by boxes
          let maxBoxRow = 0;
          const occupiedCells = new Set();

          visibleBoxes.forEach((box) => {
            const colSpan = Math.min(Number(box.colSpan) || 2, sectionCols);
            const rowSpan = getBoxRowSpan(box);

            if (box.locked && box.gridPosition) {
              maxBoxRow = Math.max(maxBoxRow, box.gridPosition.row + rowSpan);
            } else {
              // Find first available row
              let placed = false;
              for (let r = 0; !placed; r++) {
                for (let c = 0; c <= sectionCols - colSpan && !placed; c++) {
                  let canPlace = true;
                  for (let dr = 0; dr < rowSpan && canPlace; dr++) {
                    for (let dc = 0; dc < colSpan && canPlace; dc++) {
                      if (occupiedCells.has(`${r + dr},${c + dc}`)) canPlace = false;
                    }
                  }
                  if (canPlace) {
                    for (let dr = 0; dr < rowSpan; dr++) {
                      for (let dc = 0; dc < colSpan; dc++) {
                        occupiedCells.add(`${r + dr},${c + dc}`);
                      }
                    }
                    maxBoxRow = Math.max(maxBoxRow, r + rowSpan);
                    placed = true;
                  }
                }
              }
            }
          });

          // Return ONLY actual box rows for cumulative counting
          // (NOT the configured section rows - those create empty space that shouldn't be counted)
          return maxBoxRow;
        };

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          // Filter sections for this page (default to page 1 if not set)
          const pageSections = sections
            .map((section, idx) => ({ section, originalIdx: idx }))
            .filter(({ section }) => (section.pageNumber || 1) === pageNum);

          // Skip empty pages when not editing
          if (pageSections.length === 0 && !isEditing) continue;

          // Pre-calculate cumulative row offsets for each section on this page
          const sectionRowOffsets = [];
          let cumulativePageRows = 0;
          pageSections.forEach(({ section }, idx) => {
            sectionRowOffsets[idx] = cumulativePageRows;
            cumulativePageRows += calculateSectionDisplayRows(section);
          });

          pageContainers.push(
            <div
              key={pageNum}
              className="page-container"
              style={{
                width: `${zoomLevel}%`,
                aspectRatio: `${pageWidthIn} / ${pageHeightIn}`,
                border: '2px solid #94a3b8',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                marginLeft: 'auto',
                marginRight: 'auto',
                background: 'white',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.2s ease'
              }}
            >
              {/* Page Header - editor only, hidden in print */}
              {isEditing && (() => {
                // Use the pre-calculated cumulative row count
                const totalRowsUsed = cumulativePageRows;
                const isOverLimit = totalRowsUsed > pageMaxRows;

                return (
                  <div className="page-header-edit no-print" style={{
                    background: isOverLimit ? '#991b1b' : '#334155',
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
                    <span style={{ fontSize: '0.65rem', opacity: isOverLimit ? 1 : 0.7 }}>
                      {totalRowsUsed}/{pageMaxRows} rows used {isOverLimit && '⚠️ OVERFLOW'}
                    </span>
                  </div>
                );
              })()}

              {/* Page Content - overflow hidden */}
              <div style={{
                flex: 1,
                padding: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {pageSections.map(({ section, originalIdx: sIdx }, pageSectionIdx) => {
                  // Get the cumulative row offset for this section
                  const sectionRowOffset = sectionRowOffsets[pageSectionIdx] || 0;
                  // Show all boxes in edit mode
                  const visibleBoxes = isEditing
                    ? (section.boxes || [])
                    : (section.boxes || []).filter(b => !b.hidden);

                  if (!isEditing && visibleBoxes.length === 0) return null;

                  // Section grid: COLS controls width distribution, ROWS controls default content rows for boxes
                  // Constrain to page max columns
                  const sectionCols = Math.min(section.gridColumns || pageMaxCols, pageMaxCols);
                  const sectionDefaultRows = section.gridRows || 5; // Default content rows for boxes in this section

                  // Calculate row spans for each box based on content rows
                  // +2 for box header row AND column header row (so 10 content rows = 12 grid rows)
                  const getBoxRowSpan = (box) => {
                    if (box.type === 'grid') return (box.gridRows || 5) + 2; // box header + column header + content
                    if (box.type === 'script') return (box.rows?.length || 10) + 2; // box header + column header + content
                    if (box.type === 'fzdnd') return (box.gridRows || box.rowCount || 5) + 2; // box header + column header + content
                    if (box.type === 'matrix') {
                      // Matrix: header row + play type rows (default 5)
                      const playTypeCount = box.playTypes?.length || 5;
                      return playTypeCount + 2; // +2 for header row and column headers
                    }
                    return 5 + 2; // Default
                  };

                  // Calculate max row span to know total grid rows needed
                  let maxGridRow = 0;
                  const boxPlacements = [];
                  const occupiedCells = new Set();

                  // Helper to mark cells as occupied
                  const markOccupied = (row, col, rowSpan, colSpan) => {
                    for (let dr = 0; dr < rowSpan; dr++) {
                      for (let dc = 0; dc < colSpan; dc++) {
                        occupiedCells.add(`${row + dr},${col + dc}`);
                      }
                    }
                  };

                  // Helper to check if cells are available
                  const canPlaceAt = (row, col, rowSpan, colSpan) => {
                    if (col + colSpan > sectionCols) return false;
                    for (let dr = 0; dr < rowSpan; dr++) {
                      for (let dc = 0; dc < colSpan; dc++) {
                        if (occupiedCells.has(`${row + dr},${col + dc}`)) return false;
                      }
                    }
                    return true;
                  };

                  // PHASE 1: Place locked boxes with explicit gridPosition first
                  visibleBoxes.forEach((box, bIdx) => {
                    if (box.locked && box.gridPosition) {
                      const colSpan = Math.min(Number(box.colSpan) || 2, sectionCols);
                      const rowSpan = getBoxRowSpan(box);
                      const { row, col } = box.gridPosition;

                      // Place at explicit position (even if overlapping - locked takes priority)
                      markOccupied(row, col, rowSpan, colSpan);
                      boxPlacements[bIdx] = { row, col, rowSpan, colSpan, locked: true };
                      maxGridRow = Math.max(maxGridRow, row + rowSpan);
                    }
                  });

                  // PHASE 2: Auto-flow remaining (unlocked) boxes around locked ones
                  visibleBoxes.forEach((box, bIdx) => {
                    if (box.locked && box.gridPosition) return; // Already placed

                    const colSpan = Math.min(Number(box.colSpan) || 2, sectionCols);
                    const rowSpan = getBoxRowSpan(box);

                    // Find first available position
                    let placed = false;
                    for (let r = 0; !placed; r++) {
                      for (let c = 0; c <= sectionCols - colSpan && !placed; c++) {
                        if (canPlaceAt(r, c, rowSpan, colSpan)) {
                          markOccupied(r, c, rowSpan, colSpan);
                          boxPlacements[bIdx] = { row: r, col: c, rowSpan, colSpan, locked: false };
                          maxGridRow = Math.max(maxGridRow, r + rowSpan);
                          placed = true;
                        }
                      }
                    }
                  });

                  // Find empty cells for "+" placeholders (only in edit mode)
                  const emptyCells = [];
                  if (isEditing && maxGridRow > 0) {
                    for (let r = 0; r < maxGridRow; r++) {
                      for (let c = 0; c < sectionCols; c++) {
                        if (!occupiedCells.has(`${r},${c}`)) {
                          emptyCells.push({ row: r, col: c });
                        }
                      }
                    }
                  }

                  // Check if section overflows page row limit
                  const sectionOverflows = maxGridRow > pageMaxRows;

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
                      {/* Section Header - hidden in print */}
                      <div className="section-header-edit no-print" style={{
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
                                max={pageMaxCols}
                                value={section.gridColumns || pageMaxCols}
                                onChange={(e) => onUpdateSection(sIdx, { ...section, gridColumns: Math.min(parseInt(e.target.value) || pageMaxCols, pageMaxCols) })}
                                style={{ width: '36px', padding: '2px 4px', fontSize: '0.65rem', borderRadius: '3px', border: '1px solid #cbd5e1' }}
                              />
                            </div>
                            {/* Default Content Rows for new boxes */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem' }} title="Default play rows for new boxes in this section">
                              <span style={{ color: '#64748b' }}>Rows:</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={section.gridRows || 5}
                                onChange={(e) => onUpdateSection(sIdx, { ...section, gridRows: parseInt(e.target.value) || 5 })}
                                style={{ width: '36px', padding: '2px 4px', fontSize: '0.65rem', borderRadius: '3px', border: '1px solid #cbd5e1' }}
                                title="Default play rows for new boxes"
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
                            {/* Overflow warning */}
                            {sectionOverflows && (
                              <span
                                style={{
                                  marginLeft: '8px',
                                  padding: '2px 6px',
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  fontSize: '0.6rem',
                                  borderRadius: '4px',
                                  fontWeight: 'bold'
                                }}
                                title={`Section has ${maxGridRow} rows but page max is ${pageMaxRows}`}
                              >
                                {maxGridRow}/{pageMaxRows} rows
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{section.title}</span>
                        )}
                      </div>

                      {/* Section Content - CSS Grid with row spans for content height */}
                      {(() => {
                        // Use section's configured rows (ROWS setting), or content rows if larger
                        const sectionMaxRows = section.gridRows || 12;
                        const displayRows = isEditing
                          ? Math.max(maxGridRow, sectionMaxRows) // Show at least section's configured rows
                          : maxGridRow; // Print preview shows only content
                        return (
                      <div className={`section-grid-content ${isEditing ? 'section-grid-editing' : ''}`} data-cols={sectionCols} style={{
                        display: 'grid',
                        gridTemplateColumns: isEditing
                          ? `20px repeat(${sectionCols}, 1fr)` // Row numbers + content columns (edit mode)
                          : `repeat(${sectionCols}, 1fr)`, // Content columns only (print preview)
                        gridTemplateRows: displayRows > 0 ? `repeat(${displayRows}, ${rowHeight}px)` : 'auto', // Fixed row height for alignment
                        gridAutoFlow: 'dense',
                        columnGap: isEditing ? '4px' : '1px', // Space between columns
                        rowGap: '0px', // No vertical gap so boxes align with row numbers
                        padding: isEditing ? '4px' : '0',
                        flex: 1
                      }}>
                        {/* Row numbers on the left (like spreadsheet) - only in edit mode, hidden in print */}
                        {/* Uses sectionRowOffset to continue numbering from previous sections */}
                        {/* Only renders row numbers for ACTUAL box content (maxGridRow), not empty space */}
                        {isEditing && maxGridRow > 0 && Array.from({ length: maxGridRow }, (_, rowIdx) => (
                          <div
                            key={`row-${rowIdx}`}
                            className="row-numbers-column no-print"
                            style={{
                              gridColumn: '1',
                              gridRow: rowIdx + 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem',
                              color: '#94a3b8',
                              background: '#f8fafc',
                              borderRight: '1px solid #e2e8f0',
                              userSelect: 'none'
                            }}
                          >
                            {sectionRowOffset + rowIdx + 1}
                          </div>
                        ))}
                        {/* Calculate cumulative row offsets for sequential numbering */}
                        {(() => {
                          // Pre-calculate row offsets for each box
                          const rowOffsets = [];
                          let cumulativeRows = 0;
                          visibleBoxes.forEach((box, idx) => {
                            rowOffsets[idx] = cumulativeRows;
                            cumulativeRows += countFilledRows(box);
                          });
                          return visibleBoxes.map((box, bIdx) => {
                          const colSpan = Math.min(Number(box.colSpan) || 2, sectionCols);
                          const rowSpan = getBoxRowSpan(box);
                          const placement = boxPlacements[bIdx] || { row: 0, col: 0 };
                          const rowOffset = rowOffsets[bIdx] || 0;
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
                                gridColumn: `${placement.col + (isEditing ? 2 : 1)} / span ${colSpan}`, // +2 in edit mode for row numbers column
                                gridRow: `${placement.row + 1} / span ${rowSpan}`,
                                border: isTargetingMode
                                  ? '2px solid #8b5cf6'
                                  : (isEditing
                                    ? '1px solid #e2e8f0'
                                    : (playDragOverBox?.sectionIdx === sIdx && playDragOverBox?.boxIdx === bIdx
                                      ? '2px dashed #3b82f6'
                                      : '1px solid #e2e8f0')),
                                background: isTargetingMode
                                  ? '#f5f3ff'
                                  : (playDragOverBox?.sectionIdx === sIdx && playDragOverBox?.boxIdx === bIdx
                                    ? '#eff6ff'
                                    : 'white'),
                                boxShadow: isTargetingMode ? '0 0 0 2px rgba(139, 92, 246, 0.3)' : 'none',
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
                              onDoubleClick={() => {
                                // Allow double-click to open box even in edit mode
                                onBoxClick(box, sIdx, bIdx);
                              }}
                            >
                              {/* Box Header - hidden for matrix boxes unless editing */}
                              {(box.type !== 'matrix' || isEditing) && (
                                <div
                                  className="box-header"
                                  style={{
                                    height: `${rowHeight}px`, // Match grid row height
                                    minHeight: `${rowHeight}px`,
                                    maxHeight: `${rowHeight}px`,
                                    padding: '0 8px',
                                    background: box.type === 'matrix' ? '#f1f5f9' : (box.color || '#3b82f6'),
                                    color: box.type === 'matrix' ? '#64748b' : 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    display: box.type === 'matrix' && !isEditing ? 'none' : 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                  {box.type !== 'matrix' && (
                                    <span style={{
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {box.header}
                                    </span>
                                  )}
                                  {isEditing ? (
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: box.type === 'matrix' ? 1 : 'none', justifyContent: box.type === 'matrix' ? 'flex-end' : 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                                      {/* Lock toggle button */}
                                      <div
                                        onClick={() => onToggleBoxLock && onToggleBoxLock(sIdx, bIdx)}
                                        style={{
                                          cursor: 'pointer',
                                          padding: '2px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          opacity: box.locked ? 1 : 0.6,
                                          color: box.type === 'matrix' ? (box.locked ? '#3b82f6' : '#94a3b8') : 'white'
                                        }}
                                        title={box.locked ? 'Unlock box (allow auto-flow)' : 'Lock box in position'}
                                      >
                                        {box.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                      </div>
                                      {/* ColSpan × RowSpan controls */}
                                      <input
                                        type="number"
                                        min="1"
                                        max={sectionCols}
                                        value={box.colSpan || 2}
                                        onChange={(e) => onUpdateBox(sIdx, bIdx, { ...box, colSpan: parseInt(e.target.value) || 2 })}
                                        style={{ width: '28px', padding: '1px 2px', fontSize: '0.6rem', borderRadius: '2px', border: box.type === 'matrix' ? '1px solid #cbd5e1' : 'none', textAlign: 'center' }}
                                        title="Column span"
                                      />
                                      <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>cols</span>
                                      <div
                                        onClick={() => onDeleteBox(sIdx, bIdx)}
                                        style={{ cursor: 'pointer', padding: '0 2px', marginLeft: '4px', color: box.type === 'matrix' ? '#ef4444' : 'white' }}
                                      >
                                        ×
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                              {/* Box Content */}
                              <div className="box-content" style={{ fontSize: '0.7rem', flex: 1, overflow: 'hidden' }}>
                                {renderBoxContent(box, false, rowOffset)}
                              </div>
                            </div>
                          );
                        });
                        })()}

                        {/* Empty cell placeholders - clickable to add box OR drop targets for dragged boxes - hidden in print */}
                        {isEditing && emptyCells.map((cell, idx) => (
                          <div
                            key={`empty-${cell.row}-${cell.col}`}
                            className="empty-cell-placeholder no-print"
                            style={{
                              gridColumn: `${cell.col + 2} / ${cell.col + 3}`, // +2 because col 1 is row numbers
                              gridRow: `${cell.row + 1} / ${cell.row + 2}`,
                              border: draggedCell ? '2px dashed #94a3b8' : '1px dashed #cbd5e1',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              fontSize: '1.2rem',
                              background: 'transparent',
                              transition: 'all 0.15s',
                              minHeight: `${rowHeight}px`
                            }}
                            onClick={() => !draggedCell && onAddBox(sIdx)}
                            onMouseEnter={(e) => {
                              if (!draggedCell) {
                                e.currentTarget.style.background = '#e0f2fe';
                                e.currentTarget.style.borderColor = '#3b82f6';
                                e.currentTarget.style.color = '#3b82f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!draggedCell) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.color = '#94a3b8';
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              e.currentTarget.style.background = '#dbeafe';
                              e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = draggedCell ? '#94a3b8' : '#cbd5e1';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              if (onDropOnEmptyCell && draggedCell) {
                                onDropOnEmptyCell(sIdx, cell.row, cell.col);
                              }
                            }}
                            title={draggedCell ? 'Drop box here to lock in position' : 'Add box'}
                          >
                            {draggedCell ? '' : '+'}
                          </div>
                        ))}

                        {/* Add Box Button at the end - hidden in print */}
                        {isEditing && (
                          <div
                            className="add-box-btn no-print"
                            style={{
                              gridColumn: 'span 2',
                              minHeight: '60px',
                              border: '2px dashed #e2e8f0',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#64748b',
                              fontWeight: '500',
                              background: '#f8fafc',
                              transition: 'all 0.15s'
                            }}
                            onClick={() => onAddBox(sIdx)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e0f2fe';
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.color = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            + Add Box
                          </div>
                        )}
                      </div>
                        );
                      })()}
                    </div>
                  );
                })}

                {/* Rows remaining indicator and Add Section Button - hidden in print */}
                {isEditing && (() => {
                  // Use the pre-calculated cumulative row count
                  const totalRowsUsed = cumulativePageRows;
                  const rowsRemaining = pageMaxRows - totalRowsUsed;

                  return (
                    <>
                      {/* Rows remaining indicator */}
                      <div className="rows-remaining no-print" style={{
                        padding: '8px 12px',
                        background: rowsRemaining < 0 ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${rowsRemaining < 0 ? '#fecaca' : '#bbf7d0'}`,
                        borderRadius: '6px',
                        color: rowsRemaining < 0 ? '#991b1b' : '#166534',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        {rowsRemaining >= 0
                          ? `${rowsRemaining} rows remaining on this page`
                          : `${Math.abs(rowsRemaining)} rows over limit!`}
                      </div>

                      {/* Add Section Button */}
                      <button
                        className="add-section-btn no-print"
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
                    </>
                  );
                })()}

              </div>
            </div>
          );
        }

        return pageContainers;
      })()}
      </div>
    </div>
  );
}
