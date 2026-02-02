import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Game Plan print template - supports Sheet, FZDnD, and Matrix views
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

  // Header component - compact with logo
  const PageHeader = ({ pageNum }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0.25in',
      paddingBottom: '4px',
      borderBottom: '1px solid #333'
    }}>
      {includeLogo && settings?.teamLogo && (
        <img
          src={settings.teamLogo}
          alt="Logo"
          style={{ height: '32px', width: 'auto' }}
        />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#000' }}>
          {currentWeek?.name || 'Week'} vs. {currentWeek?.opponent || 'OPPONENT'}
          {gameDate && <span style={{ fontWeight: 'normal', marginLeft: '8px', fontSize: '9pt' }}>{gameDate}</span>}
          {totalPages > 1 && <span style={{ fontWeight: 'normal', marginLeft: '8px', fontSize: '8pt', color: '#666' }}>({pageNum}/{totalPages})</span>}
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
            margin: 0.15in;
          }
        }
        .gameplan-print {
          background: white;
          color: black;
        }
        .gameplan-page {
          width: 8in;
          min-height: 10.5in;
          background: white;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
        }
        .gameplan-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .gameplan-page-content {
          padding: 0.15in;
        }
      `}</style>

      {/* Render pages based on format */}
      {Array.from({ length: totalPages }, (_, pageIndex) => (
        <div key={pageIndex} className="gameplan-page">
          <PageHeader pageNum={pageIndex + 1} />
          <div className={`gameplan-page-content ${fontSizeClass}`}>
            {viewType === 'fzdnd' ? (
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
                          <span className="ml-1 text-blue-600 font-bold">
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
                          <span className="ml-1 text-blue-600 font-bold">[{cell.wristbandSlot}]</span>
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
                              <span className="wristband-slot text-blue-600 font-bold ml-1">
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
