import { useState, useCallback } from 'react';
import { getPlayCall } from '../../utils/playDisplay';

// Default zone configuration
const DEFAULT_ZONES = [
  { id: 'openers', title: 'Openers vs.', color: '#fef08a', textColor: 'black', columns: ['1st & 10', '2nd & <5', '2nd & 5+', '3rd & <5', '3rd & 5+'] },
  { id: 'black', title: 'Black Zone (Goalline to -10)', color: 'black', textColor: 'white' },
  { id: 'red', title: 'Red Zone (-10 to -40)', color: '#ef4444', textColor: 'white' },
  { id: 'yellow', title: 'Yellow Zone (-40 to +40)', color: '#fef08a', textColor: 'black' },
  { id: 'gold', title: 'Gold Zone - Take A Shot (+40 to Endzone)', color: '#f59e0b', textColor: 'black' },
  { id: 'green', title: 'Green Zone (+20 to Endzone)', color: '#22c55e', textColor: 'black' },
  { id: '4min', title: '4:00 Offense', color: '#1e1b4b', textColor: '#fef08a' },
  { id: '2min', title: '2:00 Offense', color: '#dc2626', textColor: 'black', columns: ['Personnel', 'Timeouts', 'Max Protect', 'First Downs', 'Think Plays'] },
  { id: '2pt', title: 'Two Point Plays', color: 'black', textColor: 'white', columns: [' ', ' '] }
];

const DEFAULT_COLUMNS = ['1st and 10', '2nd and <5', '2nd and 5+', '3rd and <5', '3rd and 5+'];

export default function FZDnDView({
  layouts,
  gamePlan,
  plays,
  currentWeek,
  teamLogo,
  isLocked,
  collapsedRows,
  onToggleRow,
  onDrop,
  onRemove,
  onUpdateZoneNote,
  onUpdateCustomZone,
  onUpdateCustomColumns,
  onAddPlayToSet,
  getPlayDisplayName
}) {
  const [autocomplete, setAutocomplete] = useState({ zoneId: null, rowIdx: null, colIdx: null, query: '' });
  const [wbAutocomplete, setWbAutocomplete] = useState({ playId: null, query: '' });

  const zones = layouts?.FZDND?.zones || DEFAULT_ZONES;
  const weekTitle = currentWeek?.name || `Week ${currentWeek?.weekNumber || ''}`;
  const opponentTitle = currentWeek?.opponent ? `vs. ${currentWeek.opponent}` : '';

  // Get play for a specific cell
  const getPlayForCell = useCallback((zoneId, rowIdx, colIdx) => {
    const setId = `fzdnd_${zoneId}_${colIdx}`;
    const set = gamePlan?.sets?.find(s => s.id === setId);
    const playId = set?.playIds?.[rowIdx];
    return playId ? plays.find(p => p.id === playId) : null;
  }, [gamePlan?.sets, plays]);

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnCell = (e, zoneId, rowIdx, colIdx) => {
    e.preventDefault();
    if (isLocked) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/react-dnd'));
      if (data && data.playId) {
        onDrop(zoneId, rowIdx, colIdx, data.playId);
      }
    } catch (err) {
      // Also try playId directly
      const playId = e.dataTransfer.getData('playId');
      if (playId) {
        onDrop(zoneId, rowIdx, colIdx, playId);
      }
    }
  };

  // Handle autocomplete selection
  const handleSelectPlay = (zoneId, rowIdx, colIdx, playId) => {
    onDrop(zoneId, rowIdx, colIdx, playId);
    setAutocomplete({ zoneId: null, rowIdx: null, colIdx: null, query: '' });
  };

  // Filter plays based on query (search both formation and name)
  const getFilteredPlays = (query) => {
    if (!query) return [];
    const q = query.toLowerCase();
    return plays
      .filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.formation?.toLowerCase().includes(q) ||
        getPlayCall(p).toLowerCase().includes(q)
      )
      .slice(0, 10);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Print Header */}
      <div className="print-only" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '2px solid black',
        background: 'white'
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
              Field Zone Down & Distance
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '20px', background: 'white' }}>
        {zones.map((zone) => {
          const definedCols = zone.columns || DEFAULT_COLUMNS;
          const customZone = (gamePlan?.customZones || {})[zone.id] || {};
          const zoneTitle = customZone.title || zone.title;
          const zoneColor = customZone.color || zone.color;
          const zoneTextColor = customZone.textColor || zone.textColor || '#000';
          const zonePhilosophy = (gamePlan?.zoneNotes || {})[zone.id] || '';
          const customCols = (gamePlan?.customColumns || {})[zone.id] || {};

          return (
            <div key={zone.id} style={{ marginBottom: '0', border: '1px solid black' }}>
              {/* Zone Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderBottom: '1px solid black',
                background: zoneColor
              }}>
                {/* Zone Title */}
                <div style={{
                  borderRight: '1px solid black',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <input
                    id={`fzdnd-zone-title-${zone.id}`}
                    type="text"
                    value={zoneTitle}
                    onChange={(e) => onUpdateCustomZone(zone.id, { title: e.target.value })}
                    disabled={isLocked}
                    className="hide-on-print"
                    aria-label={`Zone title for ${zone.title}`}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: zoneTextColor,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      outline: 'none',
                      cursor: isLocked ? 'default' : 'text'
                    }}
                  />
                  <span className="print-only-text" style={{
                    flex: 1,
                    color: zoneTextColor,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    display: 'none'
                  }}>
                    {zoneTitle}
                  </span>
                  {!isLocked && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        id={`fzdnd-zone-color-${zone.id}`}
                        type="color"
                        value={zoneColor}
                        onChange={(e) => onUpdateCustomZone(zone.id, { color: e.target.value })}
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '1px solid rgba(0,0,0,0.3)',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Change zone color"
                        aria-label={`Zone background color for ${zone.title}`}
                      />
                      <input
                        id={`fzdnd-zone-text-color-${zone.id}`}
                        type="color"
                        value={zoneTextColor}
                        onChange={(e) => onUpdateCustomZone(zone.id, { textColor: e.target.value })}
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '1px solid rgba(0,0,0,0.3)',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Change text color"
                        aria-label={`Zone text color for ${zone.title}`}
                      />
                    </div>
                  )}
                </div>

                {/* Philosophy Notes */}
                <div style={{ padding: '4px 8px' }}>
                  <input
                    id={`fzdnd-zone-philosophy-${zone.id}`}
                    type="text"
                    value={zonePhilosophy}
                    onChange={(e) => onUpdateZoneNote(zone.id, e.target.value)}
                    disabled={isLocked}
                    placeholder="Philosophy reminders..."
                    aria-label={`Philosophy notes for ${zone.title}`}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: zoneTextColor,
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      outline: 'none',
                      cursor: isLocked ? 'default' : 'text'
                    }}
                  />
                </div>
              </div>

              {/* Content Grid */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {definedCols.length > 0 && (
                  <>
                    {/* Column Headers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `40px repeat(${definedCols.length}, minmax(0, 1fr))`
                    }}>
                      <div style={{
                        borderRight: '1px solid black',
                        borderBottom: '1px solid black'
                      }}></div>
                      {definedCols.map((colName, cIdx) => (
                        <div key={`header-${cIdx}`} style={{
                          padding: '4px',
                          textAlign: 'center',
                          borderRight: cIdx < definedCols.length - 1 ? '1px solid black' : 'none',
                          borderBottom: '1px solid black',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <input
                            id={`fzdnd-col-header-${zone.id}-${cIdx}`}
                            type="text"
                            value={customCols[cIdx] || colName}
                            onChange={(e) => onUpdateCustomColumns(zone.id, cIdx, e.target.value)}
                            disabled={isLocked}
                            aria-label={`Column header ${cIdx + 1} for ${zone.title}`}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              color: 'black',
                              fontWeight: '800',
                              fontSize: '0.85rem',
                              fontStyle: 'italic',
                              textAlign: 'center',
                              outline: 'none',
                              cursor: isLocked ? 'default' : 'text'
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Data Rows */}
                    {[0, 1, 2, 3, 4].map(rowIdx => {
                      const rowKey = `${zone.id}_${rowIdx}`;
                      const isRowCollapsed = collapsedRows.has(rowKey);

                      if (isRowCollapsed) {
                        return (
                          <div
                            key={`row-${rowIdx}`}
                            className="hide-on-print"
                            onClick={() => onToggleRow(zone.id, rowIdx)}
                            style={{
                              padding: '4px 8px',
                              background: '#eff6ff',
                              cursor: 'pointer',
                              borderBottom: '1px solid #cbd5e1',
                              color: '#1e3a8a',
                              fontSize: '0.8rem',
                              fontStyle: 'italic',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            title="Click to expand row"
                          >
                            <span style={{ fontSize: '0.7rem' }}>&#9654;</span>
                            <span>Row {rowIdx + 1} (Collapsed)</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`row-${rowIdx}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `40px repeat(${definedCols.length}, minmax(0, 1fr))`,
                            minHeight: '32px'
                          }}
                        >
                          {/* Collapse Toggle */}
                          <div
                            onClick={() => onToggleRow(zone.id, rowIdx)}
                            style={{
                              borderRight: '1px solid black',
                              borderBottom: '1px solid black',
                              background: '#dbeafe',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              color: '#1e40af'
                            }}
                            title="Click to collapse row"
                          >
                            <span className="hide-on-print">&#9660;</span>
                          </div>

                          {/* Cells */}
                          {definedCols.map((_, cIdx) => {
                            const play = getPlayForCell(zone.id, rowIdx, cIdx);
                            const isFocused = autocomplete.zoneId === zone.id &&
                              autocomplete.rowIdx === rowIdx &&
                              autocomplete.colIdx === cIdx;
                            const query = isFocused ? autocomplete.query : '';
                            const filteredPlays = getFilteredPlays(query);

                            return (
                              <div
                                key={`cell-${cIdx}`}
                                style={{
                                  borderRight: cIdx < definedCols.length - 1 ? '1px solid black' : 'none',
                                  borderBottom: '1px solid black',
                                  background: play
                                    ? (play.priority ? '#fef08a' : (rowIdx % 2 === 0 ? 'white' : '#f8fafc'))
                                    : 'white',
                                  padding: play ? '4px 6px' : '0',
                                  minHeight: '32px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnCell(e, zone.id, rowIdx, cIdx)}
                              >
                                {play ? (
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    color: 'black'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      flex: 1,
                                      minWidth: 0
                                    }}>
                                      <span style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {getPlayDisplayName ? getPlayDisplayName(play) : getPlayCall(play)}
                                      </span>
                                    </div>
                                    {!isLocked && (
                                      <button
                                        onClick={() => onRemove(zone.id, rowIdx, cIdx)}
                                        style={{
                                          border: 'none',
                                          background: 'none',
                                          color: '#dc2626',
                                          cursor: 'pointer',
                                          fontSize: '1rem',
                                          fontWeight: 'bold',
                                          padding: '0 4px'
                                        }}
                                      >
                                        x
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  // Autocomplete Input
                                  <div
                                    style={{ position: 'relative', width: '100%', padding: '2px' }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropOnCell(e, zone.id, rowIdx, cIdx)}
                                  >
                                    <input
                                      id={`fzdnd-cell-${zone.id}-${rowIdx}-${cIdx}`}
                                      type="text"
                                      placeholder="Type play name..."
                                      value={query}
                                      disabled={isLocked}
                                      aria-label={`Play input for ${zone.title} row ${rowIdx + 1} column ${cIdx + 1}`}
                                      onFocus={() => setAutocomplete({
                                        zoneId: zone.id,
                                        rowIdx,
                                        colIdx: cIdx,
                                        query: ''
                                      })}
                                      onChange={(e) => setAutocomplete({
                                        zoneId: zone.id,
                                        rowIdx,
                                        colIdx: cIdx,
                                        query: e.target.value.toUpperCase()
                                      })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && query.trim()) {
                                          if (filteredPlays.length > 0) {
                                            handleSelectPlay(zone.id, rowIdx, cIdx, filteredPlays[0].id);
                                          }
                                        } else if (e.key === 'Escape') {
                                          setAutocomplete({ zoneId: null, rowIdx: null, colIdx: null, query: '' });
                                        }
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          setAutocomplete({ zoneId: null, rowIdx: null, colIdx: null, query: '' });
                                        }, 200);
                                      }}
                                      style={{
                                        width: '100%',
                                        fontSize: '0.8rem',
                                        padding: '4px 6px',
                                        border: isFocused ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        background: 'white',
                                        color: '#1f2937',
                                        cursor: isLocked ? 'not-allowed' : 'text'
                                      }}
                                    />

                                    {/* Autocomplete Dropdown */}
                                    {isFocused && filteredPlays.length > 0 && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'white',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        marginTop: '2px'
                                      }}>
                                        {filteredPlays.map(p => (
                                          <div
                                            key={p.id}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleSelectPlay(zone.id, rowIdx, cIdx, p.id);
                                            }}
                                            style={{
                                              padding: '6px 8px',
                                              cursor: 'pointer',
                                              fontSize: '0.8rem',
                                              borderBottom: '1px solid #f1f5f9',
                                              background: 'white',
                                              color: '#1f2937'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                          >
                                            {getPlayCall(p)}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
