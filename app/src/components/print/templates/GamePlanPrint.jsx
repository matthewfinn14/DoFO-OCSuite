import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';
import { getSpreadsheetBoxes } from '../../../utils/gamePlanSections';

/**
 * Game Plan print template - supports Sheet, FZDnD, Matrix, and Spreadsheet views
 * Page formats:
 * - 2-page: 1 sheet front/back (portrait)
 * - 4-page: 2 sheets that create 17x11 spread when assembled (portrait booklet)
 */
export default function GamePlanPrint({
  weekId,
  viewType = 'sheet',
  pageFormat = '2-page',
  includeLogo = true,
  includeOpponent = true,
  sections = null,
  fontSize = 'medium'
}) {
  const { weeks, playsArray, settings } = useSchool();

  // Get spreadsheet layout data for SPREADSHEET viewType
  const spreadsheetData = useMemo(() => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return { headers: [], sets: [] };

    const headers = getSpreadsheetBoxes(week.gamePlanLayouts);
    const sets = week.offensiveGamePlan?.sets || [];
    return { headers, sets };
  }, [weeks, weekId]);

  // Get current week
  const currentWeek = useMemo(() => {
    return weeks.find(w => w.id === weekId);
  }, [weeks, weekId]);

  // Get game plan data
  const gamePlan = useMemo(() => {
    if (!currentWeek) return {};
    return currentWeek.offensiveGamePlan || currentWeek.gamePlan || {};
  }, [currentWeek]);

  // Build play lookup
  const playMap = useMemo(() => {
    const map = {};
    playsArray.forEach(play => {
      map[play.id] = play;
      map[play.name] = play; // Also index by name for flexibility
    });
    return map;
  }, [playsArray]);

  // Font size classes
  const fontSizeClass = {
    small: 'text-[8pt]',
    medium: 'text-[9pt]',
    large: 'text-[10pt]'
  }[fontSize] || 'text-[9pt]';

  // Format game date
  const gameDate = currentWeek?.gameDate
    ? new Date(currentWeek.gameDate).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  const is4Page = pageFormat === '4-page';
  const totalPages = is4Page ? 4 : 2;

  // Header component - compact with logo, week name, opponent, and date
  const PageHeader = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0.15in 0.25in',
      borderBottom: '1px solid #333'
    }}>
      {includeLogo && settings?.teamLogo && (
        <img
          src={settings.teamLogo}
          alt="Logo"
          style={{ height: '28px', width: 'auto' }}
        />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#000' }}>
          {currentWeek?.name || 'Week'} vs. {currentWeek?.opponent || '_________________'}
          {gameDate && <span style={{ fontWeight: 'normal', marginLeft: '12px', fontSize: '10pt', color: '#333' }}>{gameDate}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="gameplan-print bg-white">
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0.25in;
          }
          /* Force uniform grid row heights in print */
          .spreadsheet-print-grid {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .spreadsheet-print-grid > div {
            overflow: hidden !important;
            max-height: inherit;
          }
        }
        .gameplan-print {
          background: white;
          color: black;
        }
        .gameplan-page {
          width: 8in;
          height: 10.5in;
          background: white;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .gameplan-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .gameplan-page-content {
          flex: 1;
          padding: 0.15in;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .gameplan-page-content > div {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .gameplan-page-content .space-y-3 {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .gameplan-page-content .call-sheet-section {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .gameplan-page-content .call-sheet-section > div:last-child {
          flex: 1;
        }
      `}</style>

      {/* Render pages based on format */}
      {Array.from({ length: totalPages }, (_, pageIndex) => (
        <div key={pageIndex} className="gameplan-page">
          <PageHeader />
          <div className={`gameplan-page-content ${fontSizeClass}`}>
            {viewType === 'spreadsheet' ? (
              <SpreadsheetView spreadsheetData={spreadsheetData} playMap={playMap} sections={sections} pageIndex={pageIndex} totalPages={totalPages} weekData={currentWeek} />
            ) : viewType === 'fzdnd' ? (
              <FZDnDView gamePlan={gamePlan} playMap={playMap} sections={sections} pageIndex={pageIndex} totalPages={totalPages} />
            ) : viewType === 'matrix' ? (
              <MatrixView gamePlan={gamePlan} playMap={playMap} sections={sections} pageIndex={pageIndex} totalPages={totalPages} />
            ) : (
              <SheetView gamePlan={gamePlan} playMap={playMap} sections={sections} pageIndex={pageIndex} totalPages={totalPages} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Sheet View - Grid-based call sheet
// For 4-page booklet: odd pages show left 4 cols, even pages show right 4 cols
function SheetView({ gamePlan, playMap, sections, pageIndex = 0, totalPages = 1 }) {
  const sheetData = gamePlan.sheet || gamePlan.sections || [];

  // Filter sections if specified
  const filteredSections = sections
    ? sheetData.filter(s => sections.includes(s.id) || sections.includes(s.name))
    : sheetData;

  if (filteredSections.length === 0 && pageIndex === 0) {
    return <div className="text-gray-500 text-center py-8">No call sheet data available</div>;
  }

  // For 4-page booklet format:
  // - Pages 0,1 form first spread (0=left 4 cols, 1=right 4 cols)
  // - Pages 2,3 form second spread (2=left 4 cols, 3=right 4 cols)
  const is4PageBooklet = totalPages === 4;
  const isLeftPage = is4PageBooklet && (pageIndex % 2 === 0);
  const isRightPage = is4PageBooklet && (pageIndex % 2 === 1);

  // For 4-page: pages 0-1 show first half of sections, pages 2-3 show second half
  // For 2-page: page 0 shows first half, page 1 shows second half
  let pageSections = filteredSections;
  if (totalPages === 4) {
    const halfSections = Math.ceil(filteredSections.length / 2);
    const spreadIndex = Math.floor(pageIndex / 2); // 0 for pages 0-1, 1 for pages 2-3
    const startIdx = spreadIndex * halfSections;
    const endIdx = Math.min(startIdx + halfSections, filteredSections.length);
    pageSections = filteredSections.slice(startIdx, endIdx);
  } else if (totalPages === 2) {
    const halfSections = Math.ceil(filteredSections.length / 2);
    const startIdx = pageIndex * halfSections;
    const endIdx = Math.min(startIdx + halfSections, filteredSections.length);
    pageSections = filteredSections.slice(startIdx, endIdx);
  }

  if (pageSections.length === 0) {
    return <div className="text-gray-400 text-center py-4 text-sm">Page {pageIndex + 1} - No additional sections</div>;
  }

  // Grid columns: 4 for booklet half-pages, 8 for full pages
  const gridCols = is4PageBooklet ? 4 : 8;

  return (
    <div className="space-y-3">
      {pageSections.map((section, sectionIdx) => {
        // For 4-page booklet, filter boxes to show only left or right half
        let sectionBoxes = section.boxes || section.plays || [];
        if (is4PageBooklet && sectionBoxes.length > 0) {
          // Split boxes: left page gets first 4 column-spans, right page gets rest
          // This is simplified - assumes boxes have colSpan that adds up
          const halfPoint = Math.ceil(sectionBoxes.length / 2);
          sectionBoxes = isLeftPage
            ? sectionBoxes.slice(0, halfPoint)
            : sectionBoxes.slice(halfPoint);
        }

        return (
        <div key={sectionIdx} className="call-sheet-section border border-gray-300 rounded overflow-hidden">
          {/* Section Header */}
          <div className="section-header bg-gray-100 px-3 py-2 font-bold uppercase text-sm border-b">
            {section.name || section.title || `Section ${sectionIdx + 1}`}
            {is4PageBooklet && <span className="text-gray-500 font-normal ml-2">({isLeftPage ? 'L' : 'R'})</span>}
          </div>

          {/* Section Content - Grid of boxes */}
          <div className={`grid gap-0`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
            {sectionBoxes.map((box, boxIdx) => (
              <div
                key={boxIdx}
                className="sheet-box border-r border-b border-gray-200 last:border-r-0 min-h-[80px]"
                style={{
                  backgroundColor: box.backgroundColor || 'white'
                }}
              >
                {/* Box Header */}
                {box.header && (
                  <div
                    className="sheet-box-header px-2 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: box.headerColor || '#3b82f6',
                      color: 'white'
                    }}
                  >
                    {box.header}
                  </div>
                )}

                {/* Box Content - Plays */}
                <div className="sheet-box-content p-2 text-xs">
                  {(box.plays || []).map((playRef, playIdx) => {
                    const playId = typeof playRef === 'string' ? playRef : playRef.id || playRef.name;
                    const play = playMap[playId];
                    return (
                      <div key={playIdx} className="py-0.5">
                        {play?.name || playId}
                        {playRef.wristbandSlot && (
                          <span className="ml-1 text-rose-600 font-bold">
                            [{playRef.wristbandSlot}]
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}

// FZDnD View - Field Zone layout
function FZDnDView({ gamePlan, playMap, sections, pageIndex = 0, totalPages = 1 }) {
  const zones = gamePlan.zones || gamePlan.fzdnd || [];

  const filteredZones = sections
    ? zones.filter(z => sections.includes(z.id) || sections.includes(z.name))
    : zones;

  if (filteredZones.length === 0 && pageIndex === 0) {
    return <div className="text-gray-500 text-center py-8">No field zone data available</div>;
  }

  // Split zones across pages
  const zonesPerPage = Math.ceil(filteredZones.length / totalPages);
  const startIdx = pageIndex * zonesPerPage;
  const endIdx = Math.min(startIdx + zonesPerPage, filteredZones.length);
  const pageZones = filteredZones.slice(startIdx, endIdx);

  if (pageZones.length === 0) {
    return <div className="text-gray-400 text-center py-4 text-sm">Page {pageIndex + 1} - No additional zones</div>;
  }

  return (
    <div className="space-y-3">
      {pageZones.map((zone, zoneIdx) => (
        <div key={zoneIdx} className="fzdnd-zone-container border-2 border-black">
          {/* Zone Header */}
          <div className="fzdnd-zone-header grid grid-cols-2 border-b border-black">
            <div className="fzdnd-zone-title border-r border-black p-2">
              <span className="font-bold uppercase">{zone.name || zone.title || `Zone ${zoneIdx + 1}`}</span>
            </div>
            <div className="fzdnd-zone-philosophy p-2 text-center italic">
              {zone.philosophy || zone.subtitle || ''}
            </div>
          </div>

          {/* Zone Content - Rows with formations */}
          <div className="fzdnd-content">
            {/* Header Row */}
            <div
              className="fzdnd-header-row grid border-b border-black"
              style={{ gridTemplateColumns: `30px repeat(${zone.columns?.length || 4}, 1fr)` }}
            >
              <div className="fzdnd-header-cell border-r border-black bg-gray-100"></div>
              {(zone.columns || ['Formation 1', 'Formation 2', 'Formation 3', 'Formation 4']).map((col, colIdx) => (
                <div key={colIdx} className="fzdnd-header-cell border-r border-black last:border-r-0 p-1 font-bold text-center">
                  {col}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {(zone.rows || []).map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="fzdnd-row-container grid border-b border-black last:border-b-0"
                style={{ gridTemplateColumns: `30px repeat(${zone.columns?.length || 4}, 1fr)` }}
              >
                <div className="fzdnd-toggle-cell border-r border-black bg-blue-100 text-center text-xs font-bold p-1">
                  {row.label || rowIdx + 1}
                </div>
                {(row.cells || []).map((cell, cellIdx) => (
                  <div
                    key={cellIdx}
                    className={`fzdnd-cell border-r border-black last:border-r-0 p-1 ${
                      cell.priority ? 'bg-yellow-100' : rowIdx % 2 === 1 ? 'bg-gray-50' : ''
                    }`}
                  >
                    {cell.play && (
                      <div className="text-xs">
                        {playMap[cell.play]?.name || cell.play}
                        {cell.wristbandSlot && (
                          <span className="ml-1 text-rose-600 font-bold">[{cell.wristbandSlot}]</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Matrix View - Formation/Hash/Play-type matrix
function MatrixView({ gamePlan, playMap, sections, pageIndex = 0, totalPages = 1 }) {
  const matrix = gamePlan.matrix || {};
  const formations = matrix.formations || [];
  const playTypes = matrix.playTypes || [];

  if ((formations.length === 0 || playTypes.length === 0) && pageIndex === 0) {
    return <div className="text-gray-500 text-center py-8">No matrix data available</div>;
  }

  // For matrix, split formations across pages (columns)
  const formationsPerPage = Math.ceil(formations.length / totalPages);
  const startIdx = pageIndex * formationsPerPage;
  const endIdx = Math.min(startIdx + formationsPerPage, formations.length);
  const pageFormations = formations.slice(startIdx, endIdx);

  if (pageFormations.length === 0) {
    return <div className="text-gray-400 text-center py-4 text-sm">Page {pageIndex + 1} - No additional formations</div>;
  }

  return (
    <div className="matrix-container overflow-x-auto">
      <table className="matrix-table w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="matrix-corner-cell border border-gray-300 p-2 bg-white">Play Type</th>
            {pageFormations.map((formation, idx) => (
              <th key={idx} className="matrix-group-header border border-gray-300 p-2 bg-gray-800 text-white">
                {formation.name || formation}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {playTypes.map((playType, rowIdx) => (
            <tr key={rowIdx}>
              <td className="matrix-playtype-cell border border-gray-300 p-2 bg-blue-100 font-bold">
                {playType.name || playType}
              </td>
              {pageFormations.map((formation, colIdx) => {
                const formationName = formation.name || formation;
                const playTypeName = playType.name || playType;
                const cellPlays = matrix.data?.[formationName]?.[playTypeName] || [];

                return (
                  <td key={colIdx} className="matrix-data-cell border border-gray-300 p-1">
                    <div className="matrix-play-list">
                      {cellPlays.map((playRef, playIdx) => {
                        const playId = typeof playRef === 'string' ? playRef : playRef.id;
                        const play = playMap[playId];
                        return (
                          <div key={playIdx} className="matrix-play-item bg-gray-100 rounded p-1 mb-0.5 last:mb-0">
                            <span className="play-name">{play?.name || playId}</span>
                            {playRef.wristbandSlot && (
                              <span className="wristband-slot text-rose-600 font-bold ml-1">
                                [{playRef.wristbandSlot}]
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Spreadsheet View - Renders EXACTLY like the editor with uniform row heights
function SpreadsheetView({ spreadsheetData, playMap, sections, pageIndex = 0, totalPages = 1, weekData }) {
  const { sets } = spreadsheetData;

  // Get the full spreadsheet layout from the raw week data
  const pageData = weekData?.gamePlanLayouts?.SPREADSHEET?.pages?.[pageIndex];
  if (!pageData) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No spreadsheet layout found</div>;
  }

  const { columns, rows, headers: pageHeaders } = pageData;

  // Cell height - uniform for ALL rows (fit ~650px printable area)
  const cellHeight = Math.floor(650 / rows);

  // Calculate bounds for each header - matches editor logic
  const calculateBounds = () => {
    const bounds = {};
    const sortedHeaders = [...(pageHeaders || [])].sort((a, b) => {
      if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart;
      return a.colStart - b.colStart;
    });

    sortedHeaders.forEach(header => {
      const colStart = header.colStart;
      const colEnd = colStart + header.colSpan - 1;
      const rowStart = header.rowStart;
      let rowEnd;

      if (header.isMatrix) {
        const playTypesCount = (header.playTypes || []).length || 4;
        rowEnd = Math.min(rowStart + playTypesCount, rows);
      } else if (header.rowCount) {
        rowEnd = Math.min(rowStart + header.rowCount, rows);
      } else {
        rowEnd = rows;
        for (const other of sortedHeaders) {
          if (other.id === header.id) continue;
          if (other.rowStart <= rowStart) continue;
          const otherColEnd = other.colStart + other.colSpan - 1;
          const hasOverlap = colStart <= otherColEnd && colEnd >= other.colStart;
          if (hasOverlap && other.rowStart < rowEnd) {
            rowEnd = other.rowStart - 1;
          }
        }
      }

      bounds[header.id] = { colStart, colEnd, rowStart, rowEnd, isMatrix: header.isMatrix || false };
    });
    return bounds;
  };

  const bounds = calculateBounds();

  // Build cell occupancy - track what header occupies each cell
  const cellOccupancy = {};
  (pageHeaders || []).forEach(header => {
    const hb = bounds[header.id];
    if (!hb) return;

    for (let r = header.rowStart; r <= hb.rowEnd; r++) {
      for (let c = header.colStart; c <= header.colStart + header.colSpan - 1; c++) {
        const isHeaderRow = r === header.rowStart;
        const isFirstCol = c === header.colStart;
        cellOccupancy[`${r}-${c}`] = {
          header,
          isHeaderRow,
          isFirstCol,
          contentRowIdx: r - header.rowStart - 1
        };
      }
    }
  });

  // Get plays for header as a flat array
  const getPlays = (headerId) => {
    const set = sets.find(s => s.id === `spreadsheet_${headerId}`);
    if (!set) return [];
    return (set.assignedPlayIds || set.playIds || []).map(id => id ? playMap[id] : null);
  };

  // Build all plays arrays for headers
  const headerPlays = {};
  (pageHeaders || []).forEach(header => {
    headerPlays[header.id] = getPlays(header.id);
  });

  // Format cell number based on numbering style
  const formatCellNumber = (rowIdx, style) => {
    if (!style || style === 'none') return '';
    const num = rowIdx + 1;
    if (style === 'numeric') return `${num}.`;
    if (style === 'alphabetic') return `${String.fromCharCode(64 + ((num - 1) % 26) + 1)}.`;
    return '';
  };

  // Elements to render
  const elements = [];

  // First, render ALL grid cells as empty cells with borders
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    const rowNum = rowIdx + 1;
    for (let colIdx = 0; colIdx < columns; colIdx++) {
      const colNum = colIdx + 1;
      const key = `empty-${rowNum}-${colNum}`;
      elements.push(
        <div key={key} style={{
          gridColumn: colNum,
          gridRow: rowNum,
          borderRight: colNum < columns ? '1px solid #e2e8f0' : 'none',
          borderBottom: rowNum < rows ? '1px solid #e2e8f0' : 'none',
          boxSizing: 'border-box',
          background: '#fff'
        }} />
      );
    }
  }

  // Then, render headers and content rows ON TOP (they will overlay the empty cells)
  (pageHeaders || []).forEach(header => {
    const hb = bounds[header.id];
    if (!hb) return;

    const headerColor = header.color || '#3b82f6';
    const sectionColSpan = header.colSpan;
    const plays = headerPlays[header.id] || [];
    const playCount = plays.filter(p => p).length;
    const boxColumns = header.boxColumns || 1;

    // Skip matrix headers for now (render differently)
    if (header.isMatrix) {
      // Render matrix - same structure as editor
      const playTypes = header.playTypes || [];
      const hashGroups = header.hashGroups || [];
      const allHashCols = hashGroups.flatMap(g => g.hashes || [g.id]);

      // Header row with column labels
      elements.push(
        <div
          key={`matrix-header-${header.id}`}
          style={{
            gridColumn: `${header.colStart + 1} / span ${sectionColSpan}`,
            gridRow: header.rowStart,
            display: 'grid',
            gridTemplateColumns: `60px repeat(${allHashCols.length}, 1fr)`,
            background: headerColor,
            border: `3px solid ${headerColor}`,
            borderBottom: '1px solid rgba(255,255,255,0.3)',
            zIndex: 1
          }}
        >
          <div style={{
            padding: '2px 4px',
            fontWeight: 'bold',
            fontSize: '8pt',
            color: '#fff',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center'
          }}>
            {header.name || 'FORMATION'}
          </div>
          {allHashCols.map((hash, idx) => (
            <div key={idx} style={{
              padding: '2px 4px',
              fontWeight: 'bold',
              fontSize: '7pt',
              color: '#fff',
              textAlign: 'center',
              borderLeft: '1px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {typeof hash === 'string' ? hash : hash.label || hash.id}
            </div>
          ))}
        </div>
      );

      // Play type rows
      playTypes.forEach((pt, playTypeIdx) => {
        const rowNum = header.rowStart + playTypeIdx + 1;
        const isLastPlayType = playTypeIdx === playTypes.length - 1;
        const isLastContentRow = rowNum === hb.rowEnd;

        elements.push(
          <div
            key={`matrix-row-${header.id}-${playTypeIdx}`}
            style={{
              gridColumn: `${header.colStart + 1} / span ${sectionColSpan}`,
              gridRow: rowNum,
              display: 'grid',
              gridTemplateColumns: `60px repeat(${allHashCols.length}, 1fr)`,
              borderLeft: `3px solid ${headerColor}`,
              borderRight: `3px solid ${headerColor}`,
              borderBottom: isLastPlayType || isLastContentRow ? `3px solid ${headerColor}` : '1px solid #e2e8f0',
              background: playTypeIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
              zIndex: 1
            }}
          >
            <div style={{
              padding: '1px 4px',
              fontWeight: 'bold',
              fontSize: '7pt',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              borderRight: '1px solid #e2e8f0'
            }}>
              {pt.label || pt.id || pt}
            </div>
            {allHashCols.map((hash, hashIdx) => {
              const hashId = typeof hash === 'string' ? hash : hash.id;
              const ptId = pt.id || pt;
              const setId = `spreadsheet_${header.id}_${ptId}_${hashId}`;
              const cellSet = sets.find(s => s.id === setId);
              const cellPlays = (cellSet?.playIds || []).map(id => playMap[id]).filter(Boolean);

              return (
                <div key={hashIdx} style={{
                  padding: '1px 4px',
                  fontSize: '7pt',
                  borderLeft: hashIdx > 0 ? '1px solid #e2e8f0' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {cellPlays.map((play, pIdx) => (
                    <div key={pIdx} style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {play.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      });

      return;
    }

    // Regular header cell
    elements.push(
      <div
        key={`header-${header.id}`}
        style={{
          gridColumn: `${header.colStart + 1} / span ${sectionColSpan}`,
          gridRow: header.rowStart,
          background: headerColor,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '9pt',
          textTransform: 'uppercase',
          padding: '0 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderTop: `3px solid ${headerColor}`,
          borderLeft: `3px solid ${headerColor}`,
          borderRight: `3px solid ${headerColor}`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        {header.name}
        {playCount > 0 && (
          <span style={{ fontSize: '7pt', background: 'rgba(255,255,255,0.25)', padding: '1px 4px', borderRadius: '3px' }}>
            {playCount}
          </span>
        )}
      </div>
    );

    // Content rows - each row spans the full section width (like editor)
    const contentRows = hb.rowEnd - header.rowStart;
    for (let contentRowIdx = 0; contentRowIdx < contentRows; contentRowIdx++) {
      const rowNum = header.rowStart + contentRowIdx + 1;
      const isLastContentRow = rowNum === hb.rowEnd;

      // Calculate plays for this row
      const rowStartIdx = contentRowIdx * boxColumns;
      const rowPlays = [];
      for (let c = 0; c < boxColumns; c++) {
        rowPlays.push(plays[rowStartIdx + c] || null);
      }

      const numberingStyle = header.numbering || 'none';
      const cellNumber = formatCellNumber(contentRowIdx, numberingStyle);

      elements.push(
        <div
          key={`content-${header.id}-${contentRowIdx}`}
          style={{
            gridColumn: `${header.colStart + 1} / span ${sectionColSpan}`,
            gridRow: rowNum,
            backgroundColor: contentRowIdx % 2 === 0 ? '#ffffff' : '#fafafa',
            borderBottom: isLastContentRow ? `3px solid ${headerColor}` : '1px solid #e2e8f0',
            borderRight: `3px solid ${headerColor}`,
            borderLeft: `3px solid ${headerColor}`,
            padding: '0',
            fontSize: '8pt',
            display: 'grid',
            gridTemplateColumns: cellNumber ? `auto repeat(${boxColumns}, 1fr)` : `repeat(${boxColumns}, 1fr)`,
            alignItems: 'stretch',
            overflow: 'hidden',
            boxSizing: 'border-box',
            zIndex: 1
          }}
        >
          {cellNumber && (
            <span style={{
              color: '#94a3b8',
              fontWeight: 'bold',
              minWidth: '18px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '4px'
            }}>
              {cellNumber}
            </span>
          )}
          {rowPlays.map((play, colIdx) => (
            <div
              key={colIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px',
                borderLeft: colIdx > 0 ? '1px solid #cbd5e1' : 'none',
                overflow: 'hidden',
                minWidth: 0
              }}
            >
              {play && (
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {play.formation ? `${play.formation} ${play.name}` : play.name}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }
  });

  // Render the grid with explicit uniform row heights
  return (
    <div
      className="spreadsheet-print-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
        border: '1px solid #94a3b8',
        background: '#fff',
        width: '100%',
        height: `${rows * cellHeight}px`,
        overflow: 'hidden'
      }}
    >
      {elements}
    </div>
  );
}
