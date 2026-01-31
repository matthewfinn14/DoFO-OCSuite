import { useState, useCallback } from 'react';
import { getPlayCall } from '../../utils/playDisplay';

// Default matrix configuration
const DEFAULT_MATRIX = {
  cols: [
    { id: 'FB_L', label: 'FB L', fullLabel: 'Base/Initial Left' },
    { id: 'FB_R', label: 'FB R', fullLabel: 'Base/Initial Right' },
    { id: 'CB_L', label: 'CB L', fullLabel: 'Base w/ Dressing Left' },
    { id: 'CB_R', label: 'CB R', fullLabel: 'Base w/ Dressing Right' },
    { id: 'CU_L', label: 'CU L', fullLabel: 'Convert Left' },
    { id: 'CU_R', label: 'CU R', fullLabel: 'Convert Right' },
    { id: 'SO_L', label: 'SO L', fullLabel: 'Explosive Left' },
    { id: 'SO_R', label: 'SO R', fullLabel: 'Explosive Right' }
  ],
  formations: [
    { id: '887', label: '887', color: '#ef4444' },
    { id: '888', label: '888', color: '#ef4444' },
    { id: '687', label: '687', color: '#fbbf24' },
    { id: '688', label: '688', color: '#fbbf24' },
    { id: '881', label: '881', color: '#facc15' },
    { id: '984', label: '984', color: '#4ade80' },
    { id: '983', label: '983', color: '#4ade80' },
    { id: '488', label: '488', color: '#60a5fa' },
    { id: '487', label: '487', color: '#60a5fa' },
    { id: 'jets', label: 'Jets/Specials', color: '#a8a29e' }
  ],
  playTypes: [
    { id: 'strong_run', label: 'STRONG RUN' },
    { id: 'weak_run', label: 'WEAK RUN' },
    { id: 'quick_game', label: 'QUICK GAME' },
    { id: 'drop_back', label: 'DROPBACK' },
    { id: 'gadget', label: 'GADGET' }
  ]
};

export default function MatrixView({
  layouts,
  gamePlan,
  plays,
  isLocked,
  collapsedGroups,
  collapsedHashColumns,
  collapsedRows,
  editingFormationId,
  onToggleGroup,
  onToggleHashColumn,
  onToggleRow,
  onEditFormation,
  onUpdateFormationName,
  onAddPlayToSet,
  onRemovePlayFromSet,
  getPlayDisplayName
}) {
  const [autocomplete, setAutocomplete] = useState({ setId: null, query: '' });

  const matrix = layouts?.MATRIX || DEFAULT_MATRIX;
  const { cols, formations, playTypes } = matrix;

  // Group columns by pitch type
  const columnGroups = [
    { id: 'FB', label: 'BASE/INITIAL', cols: cols.slice(0, 2) },
    { id: 'CB', label: 'BASE W/ DRESSING', cols: cols.slice(2, 4) },
    { id: 'CU', label: 'CONVERT', cols: cols.slice(4, 6) },
    { id: 'SO', label: 'EXPLOSIVE', cols: cols.slice(6, 8) }
  ];

  // Get plays for a cell
  const getPlaysForCell = useCallback((setId) => {
    const set = gamePlan?.sets?.find(s => s.id === setId);
    if (!set) return [];
    return (set.playIds || [])
      .map(id => plays.find(p => p.id === id))
      .filter(Boolean);
  }, [gamePlan?.sets, plays]);

  // Handle autocomplete selection
  const handleSelectPlay = (setId, playId) => {
    onAddPlayToSet(setId, playId);
    setAutocomplete({ setId: null, query: '' });
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

  // Render play list for a cell
  const renderPlayList = (setId) => {
    const cellPlays = getPlaysForCell(setId);
    const isFocused = autocomplete.setId === setId;
    const query = isFocused ? autocomplete.query : '';
    const filteredPlays = getFilteredPlays(query);

    return (
      <div style={{ padding: '4px' }}>
        {/* Existing plays */}
        {cellPlays.map((play, idx) => (
          <div key={`${play.id}-${idx}`} style={{
            fontSize: '0.7rem',
            padding: '2px 4px',
            background: '#f1f5f9',
            borderRadius: '2px',
            marginBottom: '2px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {getPlayDisplayName ? getPlayDisplayName(play) : getPlayCall(play)}
            </span>
            {!isLocked && (
              <button
                onClick={() => onRemovePlayFromSet(setId, play.id)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '0.8rem'
                }}
              >
                x
              </button>
            )}
          </div>
        ))}

        {/* Add input */}
        {!isLocked && (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="+ Add"
              value={query}
              onFocus={() => setAutocomplete({ setId, query: '' })}
              onChange={(e) => setAutocomplete({ setId, query: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim() && filteredPlays.length > 0) {
                  handleSelectPlay(setId, filteredPlays[0].id);
                } else if (e.key === 'Escape') {
                  setAutocomplete({ setId: null, query: '' });
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setAutocomplete({ setId: null, query: '' });
                }, 200);
              }}
              style={{
                width: '100%',
                fontSize: '0.7rem',
                padding: '4px',
                border: isFocused ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: '2px',
                outline: 'none',
                background: isFocused ? '#eff6ff' : 'transparent'
              }}
            />

            {/* Autocomplete dropdown */}
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
                maxHeight: '150px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {filteredPlays.map(p => (
                  <div
                    key={p.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectPlay(setId, p.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      borderBottom: '1px solid #f1f5f9'
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
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <thead>
          {/* Group Headers */}
          <tr>
            <th rowSpan={2} style={{
              padding: '0.5rem',
              border: '1px solid #e2e8f0',
              width: '120px',
              position: 'sticky',
              left: 0,
              top: 0,
              backgroundColor: 'white',
              zIndex: 20
            }}>
              Formation / Type
            </th>
            {columnGroups.map(group => {
              const isCollapsed = collapsedGroups.has(group.id);

              if (isCollapsed) {
                return (
                  <th
                    key={group.id}
                    rowSpan={2}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#334155',
                      color: 'white',
                      cursor: 'pointer',
                      minWidth: '60px',
                      top: 0,
                      position: 'sticky',
                      zIndex: 10
                    }}
                    onClick={() => onToggleGroup(group.id)}
                    title={`Click to expand ${group.label}`}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>&#9654;</span>
                      <span style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)'
                      }}>
                        {group.label}
                      </span>
                    </div>
                  </th>
                );
              }

              return (
                <th
                  key={group.id}
                  colSpan={2}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#334155',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    top: 0,
                    position: 'sticky',
                    zIndex: 10
                  }}
                  onClick={() => onToggleGroup(group.id)}
                  title={`Click to collapse ${group.label}`}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '0.7rem' }}>&#9660;</span>
                    <span>{group.label}</span>
                  </div>
                </th>
              );
            })}
          </tr>

          {/* Hash Headers */}
          <tr>
            {columnGroups.map(group => {
              if (collapsedGroups.has(group.id)) return null;

              const leftHashCollapsed = collapsedHashColumns.has(`${group.id}_LEFT`);
              const rightHashCollapsed = collapsedHashColumns.has(`${group.id}_RIGHT`);

              return [
                // Left Hash
                <th
                  key={`${group.id}_L`}
                  style={{
                    padding: '0.25rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: leftHashCollapsed ? '#64748b' : '#475569',
                    color: 'white',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    top: '35px',
                    position: 'sticky',
                    zIndex: 10,
                    cursor: 'pointer',
                    width: leftHashCollapsed ? '20px' : 'auto'
                  }}
                  onClick={() => onToggleHashColumn(group.id, 'LEFT')}
                  title={leftHashCollapsed ? 'Expand LEFT HASH' : 'Collapse LEFT HASH'}
                >
                  {leftHashCollapsed ? '&#9654;' : '&#9664; LEFT HASH'}
                </th>,

                // Right Hash
                <th
                  key={`${group.id}_R`}
                  style={{
                    padding: '0.25rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: rightHashCollapsed ? '#64748b' : '#475569',
                    color: 'white',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    top: '35px',
                    position: 'sticky',
                    zIndex: 10,
                    cursor: 'pointer',
                    width: rightHashCollapsed ? '20px' : 'auto'
                  }}
                  onClick={() => onToggleHashColumn(group.id, 'RIGHT')}
                  title={rightHashCollapsed ? 'Expand RIGHT HASH' : 'Collapse RIGHT HASH'}
                >
                  {rightHashCollapsed ? '&#9664;' : 'RIGHT HASH &#9654;'}
                </th>
              ];
            })}
          </tr>
        </thead>
        <tbody>
          {formations.map(formation => (
            <>
              {/* Formation Header Row */}
              <tr key={`${formation.id}_header`}>
                <td
                  colSpan={columnGroups.reduce((acc, g) => {
                    if (collapsedGroups.has(g.id)) return acc + 1;
                    return acc + 2;
                  }, 1)}
                  style={{
                    padding: '2px 4px',
                    border: '1px solid #e2e8f0',
                    fontWeight: 'bold',
                    backgroundColor: formation.color,
                    color: 'white',
                    fontSize: '0.8rem',
                    lineHeight: '1.1',
                    cursor: 'pointer'
                  }}
                  onClick={() => onEditFormation(formation.id)}
                >
                  {editingFormationId === formation.id ? (
                    <input
                      autoFocus
                      defaultValue={(gamePlan?.formationOverrides || {})[formation.id] || formation.label}
                      style={{
                        background: 'white',
                        color: 'black',
                        border: 'none',
                        padding: '2px 4px',
                        borderRadius: '2px',
                        width: '200px'
                      }}
                      onBlur={(e) => onUpdateFormationName(formation.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateFormationName(formation.id, e.target.value);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    (gamePlan?.formationOverrides || {})[formation.id] || formation.label
                  )}
                </td>
              </tr>

              {/* Play Type Rows */}
              {playTypes.map(playType => {
                const isRowCollapsed = collapsedRows.has(playType.id);
                const totalColSpan = columnGroups.reduce((acc, g) => {
                  if (collapsedGroups.has(g.id)) return acc + 1;
                  return acc + 2;
                }, 1);

                if (isRowCollapsed) {
                  return (
                    <tr key={`${formation.id}_${playType.id}`}>
                      <td
                        colSpan={totalColSpan}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #e2e8f0',
                          fontWeight: '500',
                          backgroundColor: '#eff6ff',
                          cursor: 'pointer',
                          color: '#1e3a8a',
                          fontSize: '0.8rem',
                          fontStyle: 'italic'
                        }}
                        onClick={() => onToggleRow(playType.id)}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ fontSize: '0.7rem' }}>&#9654;</span>
                          <span>{playType.label} (Collapsed)</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={`${formation.id}_${playType.id}`}>
                    {/* Play Type Label */}
                    <td
                      style={{
                        padding: '2px 4px',
                        border: '1px solid #e2e8f0',
                        fontWeight: 'bold',
                        backgroundColor: '#dbeafe',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5,
                        cursor: 'pointer',
                        color: '#1e40af',
                        fontSize: '0.75rem',
                        lineHeight: '1.1'
                      }}
                      onClick={() => onToggleRow(playType.id)}
                      title="Click to collapse row"
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.7rem' }}>&#9660;</span>
                        {playType.label}
                      </div>
                    </td>

                    {/* Data Cells */}
                    {columnGroups.map(group => {
                      const isGroupCollapsed = collapsedGroups.has(group.id);
                      const leftHashCollapsed = collapsedHashColumns.has(`${group.id}_LEFT`);
                      const rightHashCollapsed = collapsedHashColumns.has(`${group.id}_RIGHT`);

                      if (isGroupCollapsed) {
                        return (
                          <td
                            key={group.id}
                            style={{
                              padding: '0.25rem',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#e5e7eb',
                              textAlign: 'center'
                            }}
                          >
                            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>...</span>
                          </td>
                        );
                      }

                      return group.cols.map(col => {
                        const isLeftHash = col.id.endsWith('_L');
                        const isCollapsedHash = isLeftHash ? leftHashCollapsed : rightHashCollapsed;

                        if (isCollapsedHash) {
                          return (
                            <td
                              key={col.id}
                              style={{
                                padding: '0',
                                border: '1px solid #e2e8f0',
                                verticalAlign: 'middle',
                                backgroundColor: '#f8fafc',
                                width: '20px'
                              }}
                            />
                          );
                        }

                        const setId = `matrix_${formation.id}_${playType.id}_${col.id}`;

                        return (
                          <td
                            key={col.id}
                            style={{
                              padding: '0',
                              border: '1px solid #ddd',
                              verticalAlign: 'top',
                              backgroundColor: 'white',
                              lineHeight: '1'
                            }}
                          >
                            {renderPlayList(setId)}
                          </td>
                        );
                      });
                    })}
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
