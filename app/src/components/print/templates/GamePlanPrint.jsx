import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Game Plan print template - supports Sheet, FZDnD, and Matrix views
 */
export default function GamePlanPrint({
  weekId,
  viewType = 'sheet',
  orientation = 'landscape',
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
    small: 'text-[9pt]',
    medium: 'text-[10pt]',
    large: 'text-[11pt]'
  }[fontSize] || 'text-[10pt]';

  const orientationClass = orientation === 'portrait' ? 'print-page-portrait' : 'print-page-landscape';

  return (
    <div className={`gameplan-print ${orientationClass} bg-white`}>
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          {includeLogo && settings?.teamLogo && (
            <img src={settings.teamLogo} alt="Logo" className="print-header-logo" />
          )}
          <div className="print-header-info">
            <div className="print-header-title">
              Game Plan - {currentWeek?.name || 'Call Sheet'}
            </div>
            {includeOpponent && currentWeek?.opponent && (
              <div className="print-header-subtitle">vs {currentWeek.opponent}</div>
            )}
          </div>
        </div>
        <div className="print-header-right">
          {currentWeek?.gameDate && (
            <div className="print-header-opponent">
              {new Date(currentWeek.gameDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
          <div className="print-header-date">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Content based on view type */}
      <div className={`p-4 ${fontSizeClass}`}>
        {viewType === 'fzdnd' ? (
          <FZDnDView gamePlan={gamePlan} playMap={playMap} sections={sections} />
        ) : viewType === 'matrix' ? (
          <MatrixView gamePlan={gamePlan} playMap={playMap} sections={sections} />
        ) : (
          <SheetView gamePlan={gamePlan} playMap={playMap} sections={sections} />
        )}
      </div>
    </div>
  );
}

// Sheet View - Grid-based call sheet
function SheetView({ gamePlan, playMap, sections }) {
  const sheetData = gamePlan.sheet || gamePlan.sections || [];

  // Filter sections if specified
  const filteredSections = sections
    ? sheetData.filter(s => sections.includes(s.id) || sections.includes(s.name))
    : sheetData;

  if (filteredSections.length === 0) {
    return <div className="text-gray-500 text-center py-8">No call sheet data available</div>;
  }

  return (
    <div className="space-y-4">
      {filteredSections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="call-sheet-section border border-gray-300 rounded overflow-hidden">
          {/* Section Header */}
          <div className="section-header bg-gray-100 px-3 py-2 font-bold uppercase text-sm border-b">
            {section.name || section.title || `Section ${sectionIdx + 1}`}
          </div>

          {/* Section Content - Grid of boxes */}
          <div className="grid grid-cols-7 gap-0">
            {(section.boxes || section.plays || []).map((box, boxIdx) => (
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
      ))}
    </div>
  );
}

// FZDnD View - Field Zone layout
function FZDnDView({ gamePlan, playMap, sections }) {
  const zones = gamePlan.zones || gamePlan.fzdnd || [];

  const filteredZones = sections
    ? zones.filter(z => sections.includes(z.id) || sections.includes(z.name))
    : zones;

  if (filteredZones.length === 0) {
    return <div className="text-gray-500 text-center py-8">No field zone data available</div>;
  }

  return (
    <div className="space-y-4">
      {filteredZones.map((zone, zoneIdx) => (
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
function MatrixView({ gamePlan, playMap, sections }) {
  const matrix = gamePlan.matrix || {};
  const formations = matrix.formations || [];
  const playTypes = matrix.playTypes || [];

  if (formations.length === 0 || playTypes.length === 0) {
    return <div className="text-gray-500 text-center py-8">No matrix data available</div>;
  }

  return (
    <div className="matrix-container overflow-x-auto">
      <table className="matrix-table w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="matrix-corner-cell border border-gray-300 p-2 bg-white">Play Type</th>
            {formations.map((formation, idx) => (
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
              {formations.map((formation, colIdx) => {
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
