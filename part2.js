            const renderMatrix = () => {
                const layout = GAME_PLAN_LAYOUTS.MATRIX;

                // Group columns by pitch type
                const columnGroups = [
                    { id: 'FB', label: 'BASE/INITIAL', cols: layout.cols.slice(0, 2) },
                    { id: 'CB', label: 'BASE W/ DRESSING', cols: layout.cols.slice(2, 4) },
                    { id: 'CU', label: 'CONVERT', cols: layout.cols.slice(4, 6) },
                    { id: 'SO', label: 'EXPLOSIVE', cols: layout.cols.slice(6, 8) }
                ];

                const toggleGroup = (groupId) => {
                    setCollapsedGroups(prev => {
                        const newCollapsed = new Set(prev);
                        if (newCollapsed.has(groupId)) {
                            newCollapsed.delete(groupId);
                        } else {
                            newCollapsed.add(groupId);
                        }
                        return newCollapsed;
                    });
                };

                return (
                    <div className="animate-fade-in" style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th rowSpan={2} style={{ padding: '0.5rem', border: '1px solid var(--border)', width: '120px', position: 'sticky', left: 0, top: 0, backgroundColor: 'white', zIndex: 20 }}>Formation / Type</th>
                                    {columnGroups.map(group => {
                                        const isCollapsed = collapsedGroups.has(group.id);
                                        return (
                                            <React.Fragment key={group.id}>
                                                {isCollapsed ? (
                                                    <th
                                                        rowSpan={2}
                                                        style={{ padding: '0.5rem', border: '1px solid var(--border)', backgroundColor: '#334155', color: 'white', cursor: 'pointer', minWidth: '60px', top: 0, position: 'sticky', zIndex: 10 }}
                                                        onClick={() => toggleGroup(group.id)}
                                                        title={`Click to expand ${group.label}`}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                            <span>▶</span>
                                                            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{group.label}</span>
                                                        </div>
                                                    </th>
                                                ) : (
                                                    <th
                                                        colSpan={2}
                                                        style={{
                                                            padding: '0.5rem',
                                                            border: '1px solid var(--border)',
                                                            backgroundColor: '#334155',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            textAlign: 'center',
                                                            top: 0,
                                                            position: 'sticky',
                                                            zIndex: 10
                                                        }}
                                                        onClick={() => toggleGroup(group.id)}
                                                        title={`Click to collapse ${group.label}`}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <span style={{ fontSize: '0.7rem' }}>▼</span>
                                                            <span>{group.label}</span>
                                                        </div>
                                                    </th>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                                <tr>
                                    {columnGroups.map(group => {
                                        if (collapsedGroups.has(group.id)) return null;
                                        const leftHashCollapsed = collapsedHashColumns.has(`${group.id}_LEFT`);
                                        const rightHashCollapsed = collapsedHashColumns.has(`${group.id}_RIGHT`);
                                        return (
                                            <React.Fragment key={group.id + '_sub'}>
                                                {!leftHashCollapsed && (
                                                    <th
                                                        style={{
                                                            padding: '0.25rem',
                                                            border: '1px solid var(--border)',
                                                            backgroundColor: '#475569',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                            textAlign: 'center',
                                                            top: '35px',
                                                            position: 'sticky',
                                                            zIndex: 10,
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => toggleHashColumn(group.id, 'LEFT')}
                                                        title="Click to collapse LEFT HASH"
                                                    >
                                                        ◀ LEFT HASH
                                                    </th>
                                                )}
                                                {leftHashCollapsed && (
                                                    <th
                                                        style={{
                                                            padding: '0.25rem',
                                                            border: '1px solid var(--border)',
                                                            backgroundColor: '#64748b',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                            textAlign: 'center',
                                                            top: '35px',
                                                            position: 'sticky',
                                                            zIndex: 10,
                                                            cursor: 'pointer',
                                                            width: '20px'
                                                        }}
                                                        onClick={() => toggleHashColumn(group.id, 'LEFT')}
                                                        title="Click to expand LEFT HASH"
                                                    >
                                                        ▶
                                                    </th>
                                                )}
                                                {!rightHashCollapsed && (
                                                    <th
                                                        style={{
                                                            padding: '0.25rem',
                                                            border: '1px solid var(--border)',
                                                            backgroundColor: '#475569',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                            textAlign: 'center',
                                                            top: '35px',
                                                            position: 'sticky',
                                                            zIndex: 10,
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => toggleHashColumn(group.id, 'RIGHT')}
                                                        title="Click to collapse RIGHT HASH"
                                                    >
                                                        RIGHT HASH ▶
                                                    </th>
                                                )}
                                                {rightHashCollapsed && (
                                                    <th
                                                        style={{
                                                            padding: '0.25rem',
                                                            border: '1px solid var(--border)',
                                                            backgroundColor: '#64748b',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                            textAlign: 'center',
                                                            top: '35px',
                                                            position: 'sticky',
                                                            zIndex: 10,
                                                            cursor: 'pointer',
                                                            width: '20px'
                                                        }}
                                                        onClick={() => toggleHashColumn(group.id, 'RIGHT')}
                                                        title="Click to expand RIGHT HASH"
                                                    >
                                                        ◀
                                                    </th>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {layout.formations.map(formation => (
                                    <React.Fragment key={formation.id}>
                                        {/* Formation Header Row */}
                                        <tr>
                                            <td
                                                colSpan={columnGroups.reduce((acc, g) => {
                                                    if (collapsedGroups.has(g.id)) return acc + 1;
                                                    let cols = 2;
                                                    if (collapsedHashColumns.has(`${g.id}_LEFT`)) cols--;
                                                    if (collapsedHashColumns.has(`${g.id}_RIGHT`)) cols--;
                                                    return acc + cols;
                                                }, 1)}
                                                style={{ padding: '0.5rem', border: '1px solid var(--border)', fontWeight: 'bold', backgroundColor: formation.color, color: 'white', fontSize: '0.9rem', cursor: 'pointer' }}
                                                onClick={() => setEditingFormationId(formation.id)}
                                            >
                                                {editingFormationId === formation.id ? (
                                                    <input
                                                        autoFocus
                                                        defaultValue={(gamePlan.formationOverrides || {})[formation.id] || formation.label}
                                                        style={{ background: 'white', color: 'black', border: 'none', padding: '2px 4px', borderRadius: '2px', width: '200px' }}
                                                        onBlur={(e) => handleUpdateFormationName(formation.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleUpdateFormationName(formation.id, e.target.currentTarget.value);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    (gamePlan.formationOverrides || {})[formation.id] || formation.label
                                                )}
                                            </td>
                                        </tr>
                                        {/* Play Type Rows */}
                                        {layout.playTypes.map(playType => {
                                            const isRowCollapsed = collapsedRows.has(playType.id);
                                            const totalColSpan = columnGroups.reduce((acc, g) => {
                                                if (collapsedGroups.has(g.id)) return acc + 1;
                                                let cols = g.cols.length;
                                                if (collapsedHashColumns.has(`${g.id}_LEFT`)) cols--;
                                                if (collapsedHashColumns.has(`${g.id}_RIGHT`)) cols--;
                                                return acc + cols;
                                            }, 1);

                                            if (isRowCollapsed) {
                                                return (
                                                    <tr key={`${formation.id}_${playType.id}`}>
                                                        <td
                                                            colSpan={totalColSpan}
                                                            style={{
                                                                padding: '0.5rem',
                                                                border: '1px solid var(--border)',
                                                                fontWeight: '500',
                                                                backgroundColor: '#eff6ff',
                                                                cursor: 'pointer',
                                                                color: '#1e3a8a',
                                                                fontSize: '0.8rem',
                                                                fontStyle: 'italic'
                                                            }}
                                                            onClick={() => toggleRow(playType.id)}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.7rem' }}>▶</span>
                                                                <span>{playType.label} (Collapsed)</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return (
                                                <tr key={`${formation.id}_${playType.id}`}>
                                                    <td
                                                        style={{
                                                            padding: '0.5rem',
                                                            border: '1px solid var(--border)',
                                                            fontWeight: 'bold',
                                                            backgroundColor: '#dbeafe',
                                                            position: 'sticky',
                                                            left: 0,
                                                            zIndex: 5,
                                                            cursor: 'pointer',
                                                            color: '#1e40af'
                                                        }}
                                                        onClick={() => toggleRow(playType.id)}
                                                        title="Click to collapse row"
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontSize: '0.7rem' }}>▼</span>
                                                            {playType.label}
                                                        </div>
                                                    </td>
                                                    {columnGroups.map(group => {
                                                        const isCollapsed = collapsedGroups.has(group.id);
                                                        const leftHashCollapsed = collapsedHashColumns.has(`${group.id}_LEFT`);
                                                        const rightHashCollapsed = collapsedHashColumns.has(`${group.id}_RIGHT`);

                                                        if (isCollapsed) {
                                                            // Show collapsed placeholder
                                                            return (
                                                                <td
                                                                    key={group.id}
                                                                    style={{ padding: '0.25rem', border: '1px solid var(--border)', backgroundColor: '#e5e7eb', textAlign: 'center' }}
                                                                >
                                                                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>•••</span>
                                                                </td>
                                                            );
                                                        } else {
                                                            // Show expanded columns, but skip collapsed hash columns
                                                            return group.cols.map(col => {
                                                                // Skip LEFT HASH if collapsed
                                                                if (col.id === 'LEFT' && leftHashCollapsed) return null;
                                                                // Skip RIGHT HASH if collapsed
                                                                if (col.id === 'RIGHT' && rightHashCollapsed) return null;

                                                                const setId = `matrix_${formation.id}_${playType.id}_${col.id}`;
                                                                return (
                                                                    <td
                                                                        key={setId}
                                                                        style={{ padding: '0.25rem', border: '1px solid #ddd', verticalAlign: 'top', cursor: 'default', minHeight: '60px', backgroundColor: 'white' }}
                                                                    >
                                                                        {renderPlayListSimple(setId)}
                                                                        {onQuickAddPlay && (
                                                                            <GridPlayInput
                                                                                setId={setId}
                                                                                onSelectPlay={(playId) => handleAddPlayToSet(setId, playId)}
                                                                                onQuickAdd={(name) => handleQuickAddToSet(setId, name)}
                                                                            />
                                                                        )}
                                                                    </td>
                                                                );
                                                            });
                                                        }
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            };

            const handleConfigureSection = (sectionIdx, type) => {
                const newLayouts = { ...gamePlanLayouts };
                const sheet = { ...newLayouts.CALL_SHEET };
                const section = { ...sheet.sections[sectionIdx] };

                section.type = type;

                // Initialize defaults based on type
                if (type === 'script') {
                    // Script gets 1 column
                    section.cols = 1;
                    // Ensure rows exist
                    if (!section.rows) section.rows = [];
                } else if (type === 'grid') {
                    // Grid Section defaults
                    if (!section.gridHeadings) section.gridHeadings = ['LEFT HASH', 'MIDDLE', 'RIGHT HASH', 'NOTES'];
                    if (!section.rowLabels) section.rowLabels = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];
                } else if (type === 'field_position') {
                    // Field Position defaults -> Treat as Grid Section for now as per user request for "Strike Em Out" grid
                    if (!section.gridHeadings) section.gridHeadings = ['LEFT HASH', 'MIDDLE', 'RIGHT HASH', 'NOTES'];
                    if (!section.rowLabels) section.rowLabels = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];
                    section.type = 'grid'; // Force to grid type internally to reuse logic
                } else if (type === 'standard') {
                } else if (type === 'standard') {
                    // Standard defaults (Spreadsheet)
                    section.cols = 1; // It renders as a list
                    if (!section.rows) section.rows = [];
                }

                sheet.sections[sectionIdx] = section;
                newLayouts.CALL_SHEET = sheet;

                if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                setConfiguringSection(null);
            };

            const renderSectionConfigurationModal = () => {
                if (!configuringSection) return null;
                const sectionIdx = configuringSection.idx;
                const section = gamePlanLayouts.CALL_SHEET.sections[sectionIdx];
                if (!section) return null; // Safety check

                return (
                    <div className="modal-overlay" onClick={() => setConfiguringSection(null)} style={{ zIndex: 2000 }}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
                            <div className="modal-header">
                                <h3>Configure Box Type</h3>
                                <button className="modal-close" onClick={() => setConfiguringSection(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem', color: '#666' }}>Select a layout type for "{section.title}":</p>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {/* Script Menu */}
                                    <div
                                        onClick={() => handleConfigureSection(sectionIdx, 'script')}
                                        style={{
                                            border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', cursor: 'pointer',
                                            display: 'flex', gap: '1rem', alignItems: 'center',
                                            background: '#f8fafc', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}
                                    >
                                        <div style={{ fontSize: '2rem' }}>📜</div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Script Menu</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Vertical list with editable tempo indicators.</div>
                                        </div>
                                    </div>

                                    {/* Field Position Menu */}
                                    <div
                                        onClick={() => handleConfigureSection(sectionIdx, 'field_position')}
                                        style={{
                                            border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', cursor: 'pointer',
                                            display: 'flex', gap: '1rem', alignItems: 'center',
                                            background: '#f8fafc', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}
                                    >
                                        <div style={{ fontSize: '2rem' }}>🏟️</div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Field Position Menu</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Strike 'Em Out style table with editable headers.</div>
                                        </div>
                                    </div>

                                    {/* Standard Menu */}
                                    <div
                                        onClick={() => handleConfigureSection(sectionIdx, 'standard')}
                                        style={{
                                            border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', cursor: 'pointer',
                                            display: 'flex', gap: '1rem', alignItems: 'center',
                                            background: '#f8fafc', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}
                                    >
                                        <div style={{ fontSize: '2rem' }}>📋</div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Standard Menu</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Spreadsheet-style list with quick add support.</div>
                                        </div>
                                    </div>

                                    {/* Situational Menu (Grid) */}
                                    <div
                                        onClick={() => handleConfigureSection(sectionIdx, 'grid')}
                                        style={{
                                            border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', cursor: 'pointer',
                                            display: 'flex', gap: '1rem', alignItems: 'center',
                                            background: '#f8fafc', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}
                                    >
                                        <div style={{ fontSize: '2rem' }}>🔢</div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Situational Menu</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Grid layout for holding Situational Boxes (e.g. 3rd Down).</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            };

            const renderPlaySelector = () => {

                if (!showPlaySelector) return null;

                // Find the box being edited
                let activeBox = null;
                gamePlanLayouts.CALL_SHEET.sections.forEach(section => {
                    const found = (section.boxes || []).find(b => b.setId === activeCellSetId);
                    if (found) activeBox = found;
                });

                const isGridMode = activeBox?.type === 'grid';
                const gridPlays = getGridPlays(activeCellSetId);

                // Split into Left (0-9) and Right (10-19) for normal mode
                const leftPlays = gridPlays.slice(0, 10); // Indices 0-9
                const rightPlays = gridPlays.slice(10, 20); // Indices 10-19

                // Slice for Grid mode (16 plays)
                const gridModePlays = gridPlays.slice(0, 16);
                const gridHeadings = activeBox?.gridHeadings || ['LEFT HASH', 'MIDDLE', 'RIGHT HASH', 'NOTES'];
                const gridRowLabels = activeBox?.gridRowLabels || ['Group 1', 'Group 2', 'Group 3', 'Group 4'];
                const cornerLabel = activeBox?.cornerLabel || 'Group/Type';

                // Wristband Input Component with Autocomplete
                const WristbandInput = ({ play, playIndex }) => {
                    const assignedCoords = getAssignedWristbandCoordinates(play.id);
                    const isDuplicate = play.wristbandSlot && assignedCoords.has(play.wristbandSlot.trim());
                    const currentValue = play.wristbandSlot || '';

                    // Generate suggested coordinates (101-199, 201-299, etc.)
                    const suggestedCoords = [];
                    for (let i = 101; i <= 999; i++) {
                        const coord = i.toString();
                        if (!assignedCoords.has(coord)) {
                            suggestedCoords.push(coord);
                        }
                        if (suggestedCoords.length >= 50) break; // Limit suggestions
                    }

                    // Filter suggestions based on current input
                    const filteredSuggestions = currentValue
                        ? suggestedCoords.filter(c => c.startsWith(currentValue))
                        : suggestedCoords.slice(0, 10);

                    const isFocused = wristbandFocus === playIndex;

                    return (
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={currentValue}
                                placeholder="#"
                                onFocus={() => setWristbandFocus(playIndex)}
                                onBlur={() => {
                                    // Delay to allow dropdown click to register
                                    setTimeout(() => setWristbandFocus(null), 150);
                                }}
                                onChange={(e) => {
                                    if (onUpdatePlay) onUpdatePlay({ ...play, wristbandSlot: e.target.value });
                                }}
                                style={{
                                    width: '30px',
                                    fontSize: '0.7rem',
                                    textAlign: 'center',
                                    padding: '2px',
                                    border: isDuplicate ? '2px solid #dc2626' : '1px solid #ccc',
                                    borderRadius: '2px',
                                    color: isDuplicate ? '#dc2626' : '#1e293b',
                                    fontWeight: isDuplicate ? 'bold' : 'normal',
                                    background: isDuplicate ? '#fee2e2' : 'white'
                                }}
                                title={isDuplicate ? 'Warning: This coordinate is already assigned!' : ''}
                            />
                            {/* Autocomplete Dropdown */}
                            {isFocused && filteredSuggestions.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    zIndex: 10000,
                                    background: 'white',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    minWidth: '60px',
                                    marginTop: '2px'
                                }}>
                                    {filteredSuggestions.map(coord => (
                                        <div
                                            key={coord}
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent blur
                                                if (onUpdatePlay) {
                                                    onUpdatePlay({ ...play, wristbandSlot: coord });
                                                }
                                                setWristbandFocus(null);
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                color: '#1e293b',
                                                background: 'white'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                                            onMouseLeave={(e) => e.target.style.background = 'white'}
                                        >
                                            {coord}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                };

                return (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }} onClick={() => setShowPlaySelector(false)}>
                        <div style={{ width: '90%', height: '90%', backgroundColor: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <h2>Select Plays {activeBox?.header ? `(${activeBox.header})` : ''}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                                    <button className="btn" onClick={() => setShowPlaySelector(false)}>Close</button>
                                </div>
                            </div>

                            {/* Filters Row - Condensed */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="🔍 Search..."
                                    value={playSelectorFilters.search || ''}
                                    onChange={e => setPlaySelectorFilters({ ...playSelectorFilters, search: e.target.value })}
                                    style={{ flex: 1 }}
                                />
                                <select className="form-select" style={{ width: '150px' }} value={playSelectorFilters.formation} onChange={e => setPlaySelectorFilters({ ...playSelectorFilters, formation: e.target.value })}>
                                    <option value="">All Formations</option>
                                    {uniqueFormations.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <select className="form-select" style={{ width: '150px' }} value={playSelectorFilters.concept} onChange={e => setPlaySelectorFilters({ ...playSelectorFilters, concept: e.target.value })}>
                                    <option value="">All Concepts</option>
                                    {uniqueConcepts.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select className="form-select" style={{ width: '150px' }} value={playSelectorFilters.situation} onChange={e => setPlaySelectorFilters({ ...playSelectorFilters, situation: e.target.value })}>
                                    <option value="">All Situations</option>
                                    {situationTags.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select className="form-select" style={{ width: '150px' }} value={playSelectorFilters.tag} onChange={e => setPlaySelectorFilters({ ...playSelectorFilters, tag: e.target.value })}>
                                    <option value="">All Tags</option>
                                    {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>

                                {/* GRID SIDE */}
                                <div style={{ flex: isGridMode ? '1' : '0 0 450px', maxWidth: isGridMode ? 'none' : '450px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Selected Plays (Drag to Move)</h4>

                                    {isGridMode ? (
                                        /* 4x4 Grid Mode */
                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                            {/* Column Headers Row */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(4, 1fr)', gap: '10px', marginBottom: '8px' }}>
                                                {/* Corner Label */}
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        value={cornerLabel}
                                                        onChange={(e) => {
                                                            const newLayouts = { ...gamePlanLayouts };
                                                            const sheet = { ...newLayouts.CALL_SHEET };
                                                            sheet.sections.forEach(section => {
                                                                (section.boxes || []).forEach(b => {
                                                                    if (b.setId === activeCellSetId) {
                                                                        b.cornerLabel = e.target.value;
                                                                    }
                                                                });
                                                            });
                                                            if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                                                        }}
                                                        style={{
                                                            width: '100%', fontSize: '0.7rem', fontWeight: 'bold',
                                                            background: '#475569', color: 'white', border: 'none',
                                                            padding: '6px 4px', borderRadius: '4px', textAlign: 'center'
                                                        }}
                                                        placeholder="Corner..."
                                                    />
                                                </div>
                                                {gridHeadings.map((h, i) => (
                                                    <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                                                        <input
                                                            value={h}
                                                            onChange={(e) => {
                                                                const newLayouts = { ...gamePlanLayouts };
                                                                const sheet = { ...newLayouts.CALL_SHEET };
                                                                sheet.sections.forEach(section => {
                                                                    (section.boxes || []).forEach(b => {
                                                                        if (b.setId === activeCellSetId) {
                                                                            if (!b.gridHeadings) b.gridHeadings = ['LEFT HASH', 'MIDDLE', 'RIGHT HASH', 'NOTES'];
                                                                            b.gridHeadings[i] = e.target.value;
                                                                        }
                                                                    });
                                                                });
                                                                if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                                                            }}
                                                            style={{
                                                                width: '100%', fontSize: '0.7rem', fontWeight: 'bold',
                                                                background: '#334155', color: 'white', border: 'none',
                                                                padding: '6px 4px', borderRadius: '4px', textAlign: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Grid Body with Row Labels */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
                                                {[0, 1, 2, 3].map(rowNum => (
                                                    <div key={rowNum} style={{ display: 'grid', gridTemplateColumns: '120px repeat(4, 1fr)', gap: '8px', alignItems: 'stretch' }}>
                                                        {/* Row Label */}
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            <input
                                                                value={gridRowLabels[rowNum]}
                                                                onChange={(e) => {
                                                                    const newLayouts = { ...gamePlanLayouts };
                                                                    const sheet = { ...newLayouts.CALL_SHEET };
                                                                    sheet.sections.forEach(section => {
                                                                        (section.boxes || []).forEach(b => {
                                                                            if (b.setId === activeCellSetId) {
                                                                                if (!b.gridRowLabels) b.gridRowLabels = ['Group 1', 'Group 2', 'Group 3', 'Group 4'];
                                                                                b.gridRowLabels[rowNum] = e.target.value;
                                                                            }
                                                                        });
                                                                    });
                                                                    if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                                                                }}
                                                                style={{
                                                                    width: '100%', fontSize: '0.7rem', fontWeight: 'bold',
                                                                    background: '#334155', color: 'white', border: 'none',
                                                                    padding: '6px 4px', borderRadius: '4px', textAlign: 'center',
                                                                    height: '100%'
                                                                }}
                                                            />
                                                        </div>

                                                        {/* 4 Data Cells for this row */}
                                                        {[0, 1, 2, 3].map(colNum => {
                                                            const idx = rowNum * 4 + colNum;
                                                            const p = gridModePlays[idx];
                                                            return (
                                                                <div key={idx}
                                                                    draggable
                                                                    onDragStart={(e) => {
                                                                        e.dataTransfer.setData('text/plain', idx);
                                                                        setDraggedGridIndex(idx);
                                                                    }}
                                                                    onDragOver={(e) => { e.preventDefault(); }}
                                                                    onDrop={(e) => {
                                                                        e.preventDefault();
                                                                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                                                                        handleGridMove(fromIdx, idx);
                                                                        setDraggedGridIndex(null);
                                                                    }}
                                                                    style={{
                                                                        height: '100px', border: '2px dashed #cbd5e1', borderRadius: '8px',
                                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', gap: '4px',
                                                                        background: p.type === 'GAP' ? '#f8fafc' : 'white',
                                                                        opacity: draggedGridIndex === idx ? 0.5 : 1,
                                                                        transition: 'all 0.2s',
                                                                        textAlign: 'center'
                                                                    }}
                                                                >
                                                                    {p.type !== 'GAP' ? (
                                                                        <>
                                                                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                {showWristband && <WristbandInput play={p} playIndex={idx} />}
                                                                                <div
                                                                                    style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '2px' }}
                                                                                    onClick={() => handleGridRemove(idx)}
                                                                                >✖</div>
                                                                            </div>
                                                                            <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                {p.name}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{p.formation}</div>
                                                                        </>
                                                                    ) : (
                                                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>+ Empty</div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Default 2-Column List */
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', height: '100%', overflowY: 'auto' }}>

                                            {/* Left Column */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', background: '#334155', color: 'white', padding: '4px', borderRadius: '4px' }}>LEFT HASH</div>
                                                {leftPlays.map((p, idx) => (
                                                    <div key={idx}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('text/plain', idx); // Global index 0-9
                                                            setDraggedGridIndex(idx);
                                                        }}
                                                        onDragOver={(e) => { e.preventDefault(); }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                                                            handleGridMove(fromIdx, idx);
                                                            setDraggedGridIndex(null);
                                                        }}
                                                        style={{
                                                            height: '40px', border: '1px solid #cbd5e1', borderRadius: '4px',
                                                            display: 'flex', alignItems: 'center', padding: '0 4px', gap: '4px',
                                                            background: p.type === 'GAP' ? '#f8fafc' : 'white',
                                                            opacity: draggedGridIndex === idx ? 0.5 : 1
                                                        }}
                                                    >
                                                        {p.type !== 'GAP' && (
                                                            <>
                                                                {showWristband && (
                                                                    <WristbandInput play={p} playIndex={idx} />
                                                                )}
                                                                <div style={{ flex: 1, fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#1e293b' }} title={p.name}>
                                                                    {p.name}
                                                                </div>
                                                                <div
                                                                    style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '10px' }}
                                                                    onClick={() => handleGridRemove(idx)}
                                                                >✖</div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Right Column */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', background: '#334155', color: 'white', padding: '4px', borderRadius: '4px' }}>RIGHT HASH</div>
                                                {rightPlays.map((p, localIdx) => {
                                                    const globalIdx = localIdx + 10;
                                                    return (
                                                        <div key={globalIdx}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData('text/plain', globalIdx);
                                                                setDraggedGridIndex(globalIdx);
                                                            }}
                                                            onDragOver={(e) => { e.preventDefault(); }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                                                                handleGridMove(fromIdx, globalIdx);
                                                                setDraggedGridIndex(null);
                                                            }}
                                                            style={{
                                                                height: '40px', border: '1px solid #cbd5e1', borderRadius: '4px',
                                                                display: 'flex', alignItems: 'center', padding: '0 4px', gap: '4px',
                                                                background: p.type === 'GAP' ? '#f8fafc' : 'white',
                                                                opacity: draggedGridIndex === globalIdx ? 0.5 : 1
                                                            }}
                                                        >
                                                            {p.type !== 'GAP' && (
                                                                <>
                                                                    {showWristband && (
                                                                        <WristbandInput play={p} playIndex={globalIdx} />
                                                                    )}
                                                                    <div style={{ flex: 1, fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#1e293b' }} title={p.name}>
                                                                        {p.name}
                                                                    </div>
                                                                    <div
                                                                        style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '10px' }}
                                                                        onClick={() => handleGridRemove(globalIdx)}
                                                                    >✖</div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                        </div>
                                    )}
                                </div>

                                {/* AVAILABLE PLAYS */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>Available Plays</h4>
                                    <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', alignContent: 'start', paddingRight: '4px' }}>
                                        {filteredSelectorPlays.map(play => (
                                            <div key={play.id}
                                                style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                                onClick={() => handleGridAdd(play.id)}
                                            >
                                                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '2px', lineHeight: '1.2', color: '#1e293b' }}>{play.name}</div>
                                                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '4px' }}>{play.formation}</div>
                                                {play.image && (
                                                    <div style={{ height: '50px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '4px', borderRadius: '2px' }}>
                                                        <img src={play.image} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                )}
                                                <button className="btn btn-sm btn-primary" style={{ width: '100%', fontSize: '0.7rem', padding: '2px 0' }}>Add</button>
                                            </div>
                                        ))}
                                        {filteredSelectorPlays.length === 0 && (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                No plays match filters.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            };

            const renderStaples = () => {
                const staplesLayout = gamePlanLayouts.STAPLES || { sections: [] };

                const updateStaplesLayout = (newLayout) => {
                    const newLayouts = { ...gamePlanLayouts, STAPLES: newLayout };
                    if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                };

                const handleAddSection = () => {
                    const newSection = {
                        id: `staple_sec_${Date.now()}`,
                        title: "New Staples Section",
                        columns: ["Column 1", "Column 2", "Column 3"],
                        rows: [
                            { id: `row_${Date.now()}_1`, label: "Row 1", cells: {} },
                            { id: `row_${Date.now()}_2`, label: "Row 2", cells: {} }
                        ]
                    };
                    updateStaplesLayout({ ...staplesLayout, sections: [...staplesLayout.sections, newSection] });
                };

                const handleUpdateSection = (sectionIdx, updatedSection) => {
                    const newSections = [...staplesLayout.sections];
                    newSections[sectionIdx] = updatedSection;
                    updateStaplesLayout({ ...staplesLayout, sections: newSections });
                };

                const handleDeleteSection = (sectionIdx) => {
                    if (!confirm("Are you sure you want to delete this section?")) return;
                    const newSections = [...staplesLayout.sections];
                    newSections.splice(sectionIdx, 1);
                    updateStaplesLayout({ ...staplesLayout, sections: newSections });
                };

                return (
                    <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            {!isLocked && (
                                <button className="btn btn-primary" onClick={handleAddSection}>
                                    + Add Staples Section
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {staplesLayout.sections.map((section, sIdx) => (
                                <StapleSection
                                    key={section.id}
                                    section={section}
                                    index={sIdx}
                                    isLocked={isLocked}
                                    onUpdate={(updated) => handleUpdateSection(sIdx, updated)}
                                    onDelete={() => handleDeleteSection(sIdx)}
                                    plays={plays}
                                />
                            ))}
                        </div>

                        {staplesLayout.sections.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
                                <h3>No Staples Sections Yet</h3>
                                <p>Click the button above to create a customizable grid for your staple plays.</p>
                            </div>
                        )}
                    </div>
                );
            };

            const StapleSection = ({ section, index, isLocked, onUpdate, onDelete, plays }) => {
                const [isEditingLayout, setIsEditingLayout] = useState(false);

                const handleTitleChange = (e) => onUpdate({ ...section, title: e.target.value });

                const handleAddColumn = () => {
                    onUpdate({ ...section, columns: [...section.columns, "New Col"] });
                };
                const handleRemoveColumn = (colIdx) => {
                    const newCols = [...section.columns];
                    newCols.splice(colIdx, 1);
                    // Cleanup cells data
                    const newRows = section.rows.map(row => {
                        const newCells = {};
                        Object.keys(row.cells).forEach(key => {
                            const k = parseInt(key);
                            if (k < colIdx) newCells[k] = row.cells[k];
                            else if (k > colIdx) newCells[k - 1] = row.cells[k];
                        });
                        return { ...row, cells: newCells };
                    });
                    onUpdate({ ...section, columns: newCols, rows: newRows });
                };
                const handleColNameChange = (colIdx, val) => {
                    const newCols = [...section.columns];
                    newCols[colIdx] = val;
                    onUpdate({ ...section, columns: newCols });
                };

                const handleAddRow = () => {
                    onUpdate({
                        ...section,
                        rows: [...section.rows, { id: `row_${Date.now()}`, label: "New Row", cells: {} }]
                    });
                };
                const handleRemoveRow = (rowIdx) => {
                    const newRows = [...section.rows];
                    newRows.splice(rowIdx, 1);
                    onUpdate({ ...section, rows: newRows });
                };
                const handleRowLabelChange = (rowIdx, val) => {
                    const newRows = [...section.rows];
                    newRows[rowIdx] = { ...newRows[rowIdx], label: val };
                    onUpdate({ ...section, rows: newRows });
                };

                const handleDrop = (e, rowIdx, colIdx) => {
                    e.preventDefault();
                    if (isLocked) return;
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('application/react-dnd'));
                        if (data && data.playId) {
                            const newRows = [...section.rows];
                            const currentCells = { ...(newRows[rowIdx].cells || {}) };
                            newRows[rowIdx] = {
                                ...newRows[rowIdx],
                                cells: { ...currentCells, [colIdx]: data.playId }
                            };
                            onUpdate({ ...section, rows: newRows });
                        }
                    } catch (e) { }
                };

                const handleClearCell = (rowIdx, colIdx) => {
                    const newRows = [...section.rows];
                    const currentCells = { ...newRows[rowIdx].cells };
                    delete currentCells[colIdx];
                    newRows[rowIdx] = { ...newRows[rowIdx], cells: currentCells };
                    onUpdate({ ...section, rows: newRows });
                };

                return (
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {isEditingLayout ? (
                                <input
                                    value={section.title}
                                    onChange={handleTitleChange}
                                    style={{ fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid #cbd5e1', padding: '4px', borderRadius: '4px' }}
                                />
                            ) : (
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#334155' }}>{section.title}</h3>
                            )}

                            {!isLocked && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className={`btn-sm ${isEditingLayout ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setIsEditingLayout(!isEditingLayout)}
                                    >
                                        {isEditingLayout ? 'Done Editing' : 'Edit Layout'}
                                    </button>
                                    <button className="btn-sm" style={{ color: '#ef4444' }} onClick={onDelete}>
                                        <Icon name="Trash2" size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Grid Content */}
                        <div style={{ padding: '1rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '150px', padding: '8px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
                                            {isEditingLayout ? "ROW LABELS" : ""}
                                        </th>
                                        {section.columns.map((col, cIdx) => (
                                            <th key={cIdx} style={{ padding: '8px', minWidth: '120px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>
                                                {isEditingLayout ? (
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                                                        <input
                                                            value={col}
                                                            onChange={(e) => handleColNameChange(cIdx, e.target.value)}
                                                            style={{ width: '100%', fontSize: '0.8rem', textAlign: 'center', padding: '2px' }}
                                                        />
                                                        <div style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => handleRemoveColumn(cIdx)}>×</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>{col}</div>
                                                )}
                                            </th>
                                        ))}
                                        {isEditingLayout && (
                                            <th style={{ width: '40px', padding: '8px', borderBottom: '2px solid #e2e8f0' }}>
                                                <button className="btn-sm" style={{ fontSize: '1.2rem', padding: '0 6px' }} onClick={handleAddColumn}>+</button>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.rows.map((row, rIdx) => (
                                        <tr key={row.id}>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>
                                                {isEditingLayout ? (
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        <div style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => handleRemoveRow(rIdx)}>×</div>
                                                        <input
                                                            value={row.label}
                                                            onChange={(e) => handleRowLabelChange(rIdx, e.target.value)}
                                                            style={{ width: '100%', fontSize: '0.9rem', padding: '2px' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    row.label
                                                )}
                                            </td>
                                            {section.columns.map((col, cIdx) => {
                                                const playId = row.cells ? row.cells[cIdx] : null;
                                                const play = playId ? plays.find(p => p.id === playId) : null;
                                                return (
                                                    <td
                                                        key={cIdx}
                                                        style={{ padding: '4px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', textAlign: 'center' }}
                                                        onDragOver={e => e.preventDefault()}
                                                        onDrop={e => handleDrop(e, rIdx, cIdx)}
                                                    >
                                                        {play ? (
                                                            <div style={{
                                                                background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px',
                                                                padding: '4px', fontSize: '0.8rem', position: 'relative',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{play.name}</div>
                                                                {!isLocked && (
                                                                    <div
                                                                        onClick={() => handleClearCell(rIdx, cIdx)}
                                                                        style={{ position: 'absolute', right: '-4px', top: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                                    >×</div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div style={{ height: '32px', background: '#fafafa', borderRadius: '4px', border: '1px dashed #e2e8f0' }}></div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {isEditingLayout && <td style={{ borderBottom: '1px solid #f1f5f9' }}></td>}
                                        </tr>
                                    ))}
                                    {isEditingLayout && (
                                        <tr>
                                            <td style={{ padding: '8px' }}>
                                                <button className="btn-sm" onClick={handleAddRow}>+ Add Row</button>
                                            </td>
                                            <td colSpan={section.columns.length + 1}></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            };

            const renderPriorityPlays = () => {
                const CATEGORIES = [
                    { id: 'insideRun', label: 'Inside Run' },
                    { id: 'perimeterRun', label: 'Perimeter Run' },
                    { id: 'rpo', label: 'RPO' },
                    { id: 'quick', label: 'Quick' },
                    { id: 'intermediate', label: 'Intermediate' },
                    { id: 'deep', label: 'Deep' },
                    { id: 'screen', label: 'Screen' }
                ];

                const priorityCategories = gamePlan?.priorityCategories || {};

                // Determine assigned IDs to filter Inbox
                const getAllAssignedIds = () => Object.values(priorityCategories).flat();
                const assignedIds = new Set(getAllAssignedIds());

                // Plays that are Starred but not in any category
                const unassignedPriorityPlays = plays.filter(p => p.priority && !assignedIds.has(p.id));

                const updateCategories = (newCategories) => {
                    if (onUpdateGamePlan) {
                        onUpdateGamePlan({ ...gamePlan, priorityCategories: newCategories });
                    }
                };



                // Handle changes for a specific category
                const handleCategoryListChange = (newItems, catId) => {
                    const newIds = newItems.map(p => p.id);
                    const newCats = { ...priorityCategories };

                    // 1. Update this category
                    newCats[catId] = newIds;

                    // 2. Remove these IDs from ALL other categories to prevent duplicates
                    const idsInThisCategory = new Set(newIds);
                    Object.keys(newCats).forEach(k => {
                        if (k !== catId && newCats[k]) {
                            newCats[k] = newCats[k].filter(id => !idsInThisCategory.has(id));
                        }
                    });

                    updateCategories(newCats);
                };

                // Handle changes for Inbox
                const handleInboxListChange = (newItems) => {
                    // Logic: If item is in Inbox, it must NOT be in any category.
                    const inboxIds = new Set(newItems.map(p => p.id));

                    const newCats = { ...priorityCategories };
                    let changed = false;

                    Object.keys(newCats).forEach(k => {
                        if (newCats[k]) {
                            const originalLen = newCats[k].length;
                            newCats[k] = newCats[k].filter(id => !inboxIds.has(id));
                            if (newCats[k].length !== originalLen) changed = true;
                        }
                    });

                    // If items were moved TO inbox (from category), 'changed' will be true.
                    // If items were reordered in Inbox, 'changed' is false, and we do nothing (Inbox has no order).
                    // If item removed from Inbox (to Category), that event handles itself via handleCategoryListChange.

                    if (changed) {
                        updateCategories(newCats);
                    }
                };

                // Helper to remove from category directly via X button (if we add it back)
                const handleRemoveFromCategory = (catId, playId) => {
                    if (isLocked) return;
                    const newCats = { ...priorityCategories };
                    if (newCats[catId]) {
                        newCats[catId] = newCats[catId].filter(id => id !== playId);
                        updateCategories(newCats);
                    }
                };

                const handleUnstar = (playId) => {
                    if (isLocked) return;
                    if (onUpdatePlay) onUpdatePlay(playId, { priority: false });
                    // Cleanup from categories
                    const newCats = { ...priorityCategories };
                    let changed = false;
                    Object.keys(newCats).forEach(k => {
                        if (newCats[k] && newCats[k].includes(playId)) {
                            newCats[k] = newCats[k].filter(id => id !== playId);
                            changed = true;
                        }
                    });
                    if (changed) updateCategories(newCats);
                };

                return (
                    <div style={{ display: 'flex', height: '100%', gap: '1rem' }}>
                        {/* LEFT: Categories Grid */}
                        <div style={{ flex: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(4, minmax(0, 1fr))', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '20px' }}>
                            {CATEGORIES.map(cat => {
                                const playIds = priorityCategories[cat.id] || [];
                                const listItems = playIds.map(id => plays.find(p => p.id === id)).filter(p => p && p.priority);

                                return (
                                    <div
                                        key={cat.id}
                                        className="card"
                                        style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', border: '1px solid var(--border)', minHeight: '150px' }}
                                    >
                                        <h4 style={{ margin: '0 0 0.5rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                                            {cat.label}
                                            <span className="badge">{playIds.length}</span>
                                        </h4>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                                            <PrioritySortableColumn
                                                items={listItems}
                                                onListChange={(newItems) => handleCategoryListChange(newItems, cat.id)}
                                                style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', gap: '0' }}
                                                isLocked={isLocked}
                                            />
                                            {listItems.length === 0 && (
                                                <div style={{ fontStyle: 'italic', opacity: 0.5, fontSize: '0.8rem', padding: '0.5rem', textAlign: 'center', pointerEvents: 'none' }}>
                                                    Drop plays here
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT: Inbox (Unassigned) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.75rem', background: '#eff6ff', borderBottom: '1px solid var(--border)' }}>
                                <h4 style={{ margin: 0, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Icon name="Star" size={16} color="#eab308" style={{ fill: '#eab308' }} />
                                    Priority Inbox
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>(Unassigned)</span>
                                </h4>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
                                {/* Inbox is also a Sortable to allow two-way dragging */}
                                <PrioritySortableColumn
                                    items={unassignedPriorityPlays}
                                    onListChange={handleInboxListChange}
                                    style={{ minHeight: '200px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                                    isLocked={isLocked}
                                />
                                {unassignedPriorityPlays.length === 0 && (
                                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>
                                        No unassigned priority plays. <br />Star more plays in Install Manager.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: '1rem' }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', alignItems: 'center' }}>
                        <button className={`btn ${viewMode === 'staples' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('staples')}>
                            STAPLES
                        </button>
                        <button className={`btn ${viewMode === 'priority' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('priority')}>
                            PRIORITY PLAYS
                        </button>
                        <button className={`btn ${viewMode === 'call-sheet' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('call-sheet')}>
                            SITUATIONS & SCRIPTS
                        </button>
                        <button className={`btn ${viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('matrix')}>
                            STRIKE 'EM OUT
                        </button>
                        <button className={`btn ${viewMode === 'player-touches' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('player-touches')}>
                            PLAYER TOUCHES
                        </button>
                    </div>

                    {/* View Content */}
                    <div style={{ flex: 1, overflow: 'hidden', background: ['priority', 'staples'].includes(viewMode) ? 'transparent' : 'white', padding: ['priority', 'staples'].includes(viewMode) ? '0' : '1rem', borderRadius: '8px' }}>
                        {viewMode === 'call-sheet' && renderCallSheet()}
                        {viewMode === 'matrix' && renderMatrix()}
                        {viewMode === 'player-touches' && renderPlayerTouches()}
                        {viewMode === 'priority' && renderPriorityPlays()}
                        {viewMode === 'staples' && renderStaples()}
                    </div>

                    {/* Play Selector Modal */}
                    {/* Play Selector Modal */}
                    {renderPlaySelector()}
                    {renderSectionConfigurationModal()}
                    {renderBoxEditorModal()}

                </div>
            );
        };


        const JerseyLottery = ({ roster, lotteryData, onUpdateLottery }) => {
            const [view, setView] = useState('bidding'); // 'bidding', 'results'
            const [selectedBidderId, setSelectedBidderId] = useState('');
            const [battleNumber, setBattleNumber] = useState(null);
            const [battleLives, setBattleLives] = useState({});

            // Ensure data structure
            const bids = lotteryData?.bids || {};
            const winners = lotteryData?.winners || {};
            const availableNumbers = lotteryData?.available || Array.from({ length: 99 }, (_, i) => i + 1);

            const getRemainingTokens = (pid) => {
                const playerBids = bids[pid] || {};
                const total = Object.values(playerBids).reduce((a, b) => a + b, 0);
                return 7 - total;
            };

            const handleBid = (pid, number, delta) => {
                const currentBids = { ...(bids[pid] || {}) };
                const currentVal = currentBids[number] || 0;
                const remaining = getRemainingTokens(pid);

                if (delta > 0 && remaining <= 0) return;
                if (delta < 0 && currentVal <= 0) return;

                const newVal = currentVal + delta;
                if (newVal === 0) delete currentBids[number];
                else currentBids[number] = newVal;

                const newAllBids = { ...bids, [pid]: currentBids };
                onUpdateLottery({ ...lotteryData, bids: newAllBids });
            };

            const getBidsForNumber = (num) => {
                const bidders = [];
                Object.entries(bids).forEach(([pid, playerBids]) => {
                    if (playerBids[num]) bidders.push({ pid, tokens: playerBids[num] });
                });
                return bidders.sort((a, b) => b.tokens - a.tokens);
            };

            const startBattle = (num) => {
                const bidders = getBidsForNumber(num);
                const lives = {};
                bidders.forEach(b => lives[b.pid] = b.tokens);
                setBattleLives(lives);
                setBattleNumber(num);
            };

            const updateLife = (pid, delta) => {
                setBattleLives(prev => ({
                    ...prev,
                    [pid]: Math.max(0, (prev[pid] || 0) + delta)
                }));
            };

            const declareWinner = (num, pid) => {
                if (!confirm(`Declare ${roster.find(p => p.id === pid)?.name} the winner of #${num}?`)) return;
                onUpdateLottery({ ...lotteryData, winners: { ...winners, [num]: pid } });
                setBattleNumber(null);
            };

            const clearWinner = (num) => {
                if (!confirm(`Reset winner for #${num}?`)) return;
                const newWinners = { ...winners };
                delete newWinners[num];
                onUpdateLottery({ ...lotteryData, winners: newWinners });
            };

            return (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Jersey Number Lottery</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={`btn ${view === 'bidding' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('bidding')}>Place Bids</button>
                            <button className={`btn ${view === 'results' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('results')}>Lottery Board</button>
                        </div>
                    </div>

                    {view === 'bidding' && (
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Select Player</label>
                                <select className="form-select" value={selectedBidderId} onChange={e => setSelectedBidderId(e.target.value)}>
                                    <option value="">-- Choose Athlete --</option>
                                    {roster.filter(Boolean).sort((a, b) => ((a?.lastName || '') || '').localeCompare((b?.lastName || '') || '')).map(p => (
                                        <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} (Tokens: {getRemainingTokens(p.id)})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedBidderId && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Tokens Remaining:</div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {Array.from({ length: 7 }).map((_, i) => (
                                                <div key={i} style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: i < getRemainingTokens(selectedBidderId) ? 'var(--accent)' : 'var(--border)',
                                                    border: '1px solid var(--border)'
                                                }}></div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.5rem' }}>
                                        {availableNumbers.map(num => {
                                            const playerBid = (bids[selectedBidderId] || {})[num] || 0;
                                            const isTaken = Object.values(winners).includes(num); // Or check unavailable list
                                            const isWonByMe = winners[num] === selectedBidderId;

                                            // Check if won by someone else
                                            const winnerId = winners[num];
                                            const isWonByOther = winnerId && winnerId !== selectedBidderId;

                                            return (
                                                <button
                                                    key={num}
                                                    onClick={() => !isWonByOther && handleBid(selectedBidderId, num, 1)}
                                                    onContextMenu={(e) => { e.preventDefault(); handleBid(selectedBidderId, num, -1); }}
                                                    disabled={isWonByOther}
                                                    style={{
                                                        height: '60px',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                        border: isWonByOther ? '1px solid var(--border)' : playerBid > 0 ? '2px solid var(--accent)' : '1px solid var(--border)',
                                                        background: isWonByMe ? '#dcfce7' : isWonByOther ? '#eee' : playerBid > 0 ? 'var(--surface)' : 'transparent',
                                                        opacity: isWonByOther ? 0.5 : 1,
                                                        cursor: isWonByOther ? 'not-allowed' : 'pointer',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{num}</span>
                                                    {playerBid > 0 && (
                                                        <div style={{
                                                            position: 'absolute', top: '-5px', right: '-5px',
                                                            background: 'var(--accent)', color: 'white',
                                                            borderRadius: '50%', width: '20px', height: '20px',
                                                            fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            {playerBid}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        * Left Click to Add Token, Right Click to Remove Token.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'results' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {availableNumbers.filter(num => getBidsForNumber(num).length > 0).map(num => {
                                const bidders = getBidsForNumber(num);
                                const winnerId = winners[num];
                                const winner = winnerId ? roster.find(p => p.id === winnerId) : null;
                                const isConflict = bidders.length > 1;

                                return (
                                    <div key={num} className="card" style={{ padding: '1rem', border: winner ? '2px solid #10b981' : isConflict ? '2px solid #f59e0b' : '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '2rem' }}>#{num}</h3>
                                            {winner ? (
                                                <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>MATCHED</span>
                                            ) : isConflict ? (
                                                <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>CONFLICT</span>
                                            ) : (
                                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>OPEN</span>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            {winner ? (
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{winner.name}</div>
                                            ) : (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {bidders.map(b => {
                                                        const p = roster.find(x => x.id === b.pid);
                                                        return (
                                                            <li key={b.pid} style={{ display: 'flex', justifySelf: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                                                <span style={{ flex: 1 }}>{p?.lastName}</span>
                                                                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{b.tokens} Lives</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {winner ? (
                                                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => clearWinner(num)}>Reset</button>
                                            ) : (
                                                <>
                                                    {isConflict ? (
                                                        <button className="btn" style={{ width: '100%', background: '#f59e0b', color: 'white' }} onClick={() => startBattle(num)}>⚔️ Battle!</button>
                                                    ) : (
                                                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => declareWinner(num, bidders[0].pid)}>Assign</button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Battle Modal Overlay */}
                    {battleNumber && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000
                        }}>
                            <div className="card" style={{ width: '500px', maxWidth: '90vw', border: '2px solid #f59e0b' }}>
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '3rem', margin: 0 }}>#{battleNumber}</h2>
                                    <div style={{ color: '#f59e0b', fontWeight: 'bold', letterSpacing: '1px' }}>ROCK PAPER SCISSORS BATTLE</div>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                                    {getBidsForNumber(battleNumber).map(b => {
                                        const p = roster.find(x => x.id === b.pid);
                                        const lives = battleLives[b.pid] ?? b.tokens;
                                        const isOut = lives === 0;

                                        return (
                                            <div key={b.pid} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px',
                                                opacity: isOut ? 0.4 : 1
                                            }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p?.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isOut ? 'red' : 'var(--accent)' }}>
                                                        {lives} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LIVES</span>
                                                    </div>
                                                    <button
                                                        className="btn"
                                                        style={{ background: '#ef4444', color: 'white', padding: '4px 8px' }}
                                                        onClick={() => updateLife(b.pid, -1)}
                                                        disabled={isOut}
                                                    >
                                                        -1
                                                    </button>
                                                    {lives > 0 && Object.values(battleLives).filter(l => l > 0).length === 1 && (
                                                        <button className="btn btn-primary" onClick={() => declareWinner(battleNumber, b.pid)}>Winner 🏆</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setBattleNumber(null)}>Cancel Battle</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const EquipmentManager = ({ view, roster, inventory, onUpdateInventory, checkouts, onUpdateCheckouts, issuance, onUpdateIssuance, wishlist, onUpdateWishlist, lotteryData, onUpdateLottery, equipmentDueDate, setEquipmentDueDate }) => {
            const [newItem, setNewItem] = useState({ name: '', type: '', quantity: 0, condition: 'New', size: '' });
            const [selectedPlayerId, setSelectedPlayerId] = useState('');
            const [playerSearchTerm, setPlayerSearchTerm] = useState('');
            const [checkoutForm, setCheckoutForm] = useState({ selectedItems: [], customItem: '', date: new Date().toISOString().split('T')[0] });
            const [newWish, setNewWish] = useState({ item: '', priority: 'Medium', cost: 0, link: '' });

            // Dynamic Checklist Options
            const [checklistOptions, setChecklistOptions] = useLocalStorage('hc-equipment-checklist-options-v2', ['Other']);
            const [isEditingOptions, setIsEditingOptions] = useState(false);
            const [newOptionName, setNewOptionName] = useState('');

            // Sync Form with Selected Player's Active Checkouts
            useEffect(() => {
                if (selectedPlayerId) {
                    const active = checkouts
                        .filter(c => c.playerId === selectedPlayerId && c.status === 'checked-out')
                        .map(c => c.item);
                    setCheckoutForm(prev => ({ ...prev, selectedItems: active }));
                } else {
                    setCheckoutForm(prev => ({ ...prev, selectedItems: [] }));
                }
            }, [selectedPlayerId, checkouts]);

            const itemTypes = ['Helmet', 'Shoulder Pads', 'Jersey', 'Pants', 'Cleats', 'Training Gear', 'Other'];
            const conditions = ['New', 'Good', 'Fair', 'Poor', 'Retired'];

            // Simplified standard inventory (Quantity tracking only)
            const addInventoryItem = () => {
                if (!newItem.name) return;
                const id = 'item_' + Date.now();
                onUpdateInventory([...inventory, { ...newItem, id }]);
                setNewItem({ name: '', type: '', quantity: 0, condition: 'New', size: '' });
            };

            const deleteInventoryItem = (id) => {
                if (confirm('Delete this item?')) {
                    onUpdateInventory(inventory.filter(i => i.id !== id));
                }
            };

            // Detailed Issuance Logic
            const GEAR_ROWS = [
                { id: 'helmet', label: 'Helmet', fields: ['Style', 'Size', '#'] },
                { id: 'shoulderPads', label: 'Shoulder Pads', fields: ['Size', '#'] },
                { id: 'practiceJersey', label: 'Practice Jersey', fields: ['#', 'Color'] },
                { id: 'practicePants', label: 'Practice Pants', fields: ['Size'] },
                { id: 'gamePantsWhite', label: 'Game Pants (White)', fields: ['Size'] },
                { id: 'gamePantsBlack', label: 'Game Pants (Black)', fields: ['Size'] },
                { id: 'gamePantsGray', label: 'Game Pants (Gray)', fields: ['Size'] },
                { id: 'kneePads', label: 'Knee Pads', type: 'checkbox' },
                { id: 'jerseyBlack', label: 'Black Game Jersey (Var/JV2)', fields: ['#'] },
                { id: 'jerseyWhite', label: 'White Game Jersey (Var/JV2)', fields: ['#'] },
                { id: 'jerseyRed', label: 'Red Game Jersey (Var)', fields: ['#'] },
                { id: 'guardianCap', label: 'Guardian Cap', type: 'checkbox' },
                { id: 'travelJacket', label: 'Black Travel Jacket', fields: ['Size'] },
                { id: 'poloGray', label: 'Gray Polo', fields: ['Size'] },
                { id: 'poloWhite', label: 'White Polo', fields: ['Size'] },
                { id: 'travelPants', label: 'Travel Pants', fields: ['Size'] },
            ];

            const handleIssuanceChange = (rowId, field, value) => {
                if (!selectedPlayerId) return;
                const playerGear = issuance[selectedPlayerId] || {};
                const currentRow = playerGear[rowId] || {};

                const updatedRow = { ...currentRow, [field]: value };
                const updatedGear = { ...playerGear, [rowId]: updatedRow };

                onUpdateIssuance({ ...issuance, [selectedPlayerId]: updatedGear });
            };

            const handleCheckboxChange = (rowId, checked) => {
                if (!selectedPlayerId) return;
                const playerGear = issuance[selectedPlayerId] || {};
                const updatedGear = { ...playerGear, [rowId]: { issued: checked } }; // simple object for checkboxes
                onUpdateIssuance({ ...issuance, [selectedPlayerId]: updatedGear });
            };

            // Equipment Checkout/Return Functions
            const handleUpdateEquipment = () => {
                if (!selectedPlayerId) return;
                const player = roster.find(p => p.id === selectedPlayerId);
                if (!player) return;

                // 1. Identify Current Active Checkouts for Player
                const currentActive = checkouts.filter(c => c.playerId === selectedPlayerId && c.status === 'checked-out');
                const currentItems = currentActive.map(c => c.item);

                // 2. Identify Target State (from Form)
                const targetItems = checkoutForm.selectedItems;

                // 3. Diff
                const toCheckout = targetItems.filter(item => !currentItems.includes(item));
                const toReturn = currentItems.filter(item => !targetItems.includes(item));

                if (toCheckout.length === 0 && toReturn.length === 0) {
                    alert('No changes to save.');
                    return;
                }

                let updatedCheckouts = [...checkouts];
                let updatedInventory = [...inventory];

                // Process Checkouts
                const newCheckouts = toCheckout.map(item => ({
                    id: Date.now() + Math.random(),
                    playerId: selectedPlayerId,
                    playerName: player.name,
                    item: item === 'Other' ? (checkoutForm.customItem || 'Other') : item,
                    date: checkoutForm.date,
                    status: 'checked-out',
                    returnDate: null
                }));
                updatedCheckouts = [...updatedCheckouts, ...newCheckouts];

                // Decrement Inventory for Checked Out Items
                toCheckout.forEach(itemName => {
                    // Find inventory item matching name (case-insensitive? exact match preferred)
                    // If item matches specific specific property (e.g. size), we don't have that detail in checkout form yet unless specified.
                    // Assuming 'itemName' matches 'item.name' in inventory.
                    // Handling potential duplicates by taking first available or just first match.
                    const invItemIndex = updatedInventory.findIndex(i => i.name === itemName);
                    if (invItemIndex > -1) {
                        const invItem = updatedInventory[invItemIndex];
                        updatedInventory[invItemIndex] = { ...invItem, quantity: Math.max(0, invItem.quantity - 1) };
                    }
                });


                // Process Returns
                updatedCheckouts = updatedCheckouts.map(c => {
                    if (c.playerId === selectedPlayerId && c.status === 'checked-out' && toReturn.includes(c.item)) {
                        return { ...c, status: 'returned', returnDate: checkoutForm.date };
                    }
                    return c;
                });

                // Increment Inventory for Returned Items
                toReturn.forEach(itemName => {
                    const invItemIndex = updatedInventory.findIndex(i => i.name === itemName);
                    if (invItemIndex > -1) {
                        const invItem = updatedInventory[invItemIndex];
                        updatedInventory[invItemIndex] = { ...invItem, quantity: invItem.quantity + 1 };
                    }
                });

                onUpdateInventory(updatedInventory);
                onUpdateCheckouts(updatedCheckouts);
                alert('Equipment record updated.');
            };

            const addChecklistOption = () => {
                if (newOptionName && !checklistOptions.includes(newOptionName)) {
                    setChecklistOptions([...checklistOptions, newOptionName]);
                    setNewOptionName('');
                }
            };

            const removeChecklistOption = (option) => {
                if (confirm(`Remove "${option}" from options?`)) {
                    setChecklistOptions(checklistOptions.filter(o => o !== option));
                }
            };

            // Legacy return handler for history table (optional)
            const handleReturnItem = (checkoutId, itemName) => {
                onUpdateCheckouts(checkouts.map(c =>
                    c.id === checkoutId
                        ? { ...c, status: 'returned', returnDate: new Date().toISOString().split('T')[0] }
                        : c
                ));
                // Increment Inventory
                const invItemIndex = inventory.findIndex(i => i.name === itemName);
                if (invItemIndex > -1) {
                    const updatedInv = [...inventory];
                    updatedInv[invItemIndex] = { ...updatedInv[invItemIndex], quantity: updatedInv[invItemIndex].quantity + 1 };
                    onUpdateInventory(updatedInv);
                }
            };


            // Wishlist Actions
            const addWish = () => {
                if (!newWish.item) return;
                const id = 'wish_' + Date.now();
                onUpdateWishlist([...wishlist, { ...newWish, id, status: 'Pending' }]);
                setNewWish({ item: '', priority: 'Medium', cost: 0, link: '' });
            };

            const toggleWishStatus = (id) => {
                onUpdateWishlist(wishlist.map(w => w.id === id ? { ...w, status: w.status === 'Pending' ? 'Purchased' : 'Pending' } : w));
            };

            if (view === 'equipment-lottery') {
                return <JerseyLottery roster={roster} lotteryData={lotteryData} onUpdateLottery={onUpdateLottery} />;
            }
            if (view === 'equipment-inventory') {
                return (
                    <div className="card">
                        <h2>Current Inventory</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                            <div>
                                <label className="form-label">Item Name</label>
                                <input className="form-input" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Riddell Speedflex" />
                            </div>
                            <div>
                                <label className="form-label">Type</label>
                                <select className="form-select" value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                                    <option value="">Select Type</option>
                                    {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div style={{ width: '100px' }}>
                                <label className="form-label">Size</label>
                                <select className="form-select" value={newItem.size} onChange={e => setNewItem({ ...newItem, size: e.target.value })}>
                                    <option value="">--</option>
                                    {['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(s => <option key={s} value={s}>{s}</option>)}
                                    <optgroup label="Shoe">
                                        {[8, 9, 10, 11, 12, 13, 14, 15].map(s => <option key={s} value={s}>{s}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div style={{ width: '80px' }}>
                                <label className="form-label">Qty</label>
                                <input className="form-input" type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div>
                                <label className="form-label">Condition</label>
                                <select className="form-select" value={newItem.condition} onChange={e => setNewItem({ ...newItem, condition: e.target.value })}>
                                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <button className="btn btn-primary" onClick={addInventoryItem}>Add Item</button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Name</th>
                                    <th style={{ padding: '0.5rem' }}>Type</th>
                                    <th style={{ padding: '0.5rem' }}>Size</th>
                                    <th style={{ padding: '0.5rem' }}>Qty</th>
                                    <th style={{ padding: '0.5rem' }}>Condition</th>
                                    <th style={{ padding: '0.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.5rem' }}>{item.name}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.type}</td>
                                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{item.size}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.quantity}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <span style={{
                                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem',
                                                background: item.condition === 'New' ? '#dcfce7' : item.condition === 'Poor' ? '#fee2e2' : '#f3f4f6',
                                                color: item.condition === 'New' ? '#166534' : item.condition === 'Poor' ? '#991b1b' : '#374151'
                                            }}>{item.condition}</span>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <button onClick={() => deleteInventoryItem(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            if (view === 'equipment-checkout') {
                const playerGear = issuance[selectedPlayerId] || {};

                return (
                    <div className="card">
                        <h2>Equipment Checkout & Issuance</h2>
                        {/* Global Due Date Setting (Moved to top) */}
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#1e293b' }}>Global Return Due Date</label>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Set a deadline. If passed, ALL active checkouts become overdue.
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={equipmentDueDate || ''}
                                    onChange={e => setEquipmentDueDate(e.target.value)}
                                    style={{ width: 'auto' }}
                                />
                                {equipmentDueDate && (
                                    <button onClick={() => setEquipmentDueDate('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Clear Date">
                                        <Icon name="X" size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                            <label className="form-label">Select Player</label>
                            <input
                                className="form-input"
                                placeholder="Search Player..."
                                value={playerSearchTerm}
                                onChange={e => setPlayerSearchTerm(e.target.value)}
                                style={{ marginBottom: '0.5rem' }}
                            />
                            <select className="form-select" value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} style={{ fontSize: '1.2rem', padding: '0.75rem' }}>
                                <option value="">-- Choose Athlete --</option>
                                {roster
                                    .filter(p => !playerSearchTerm || p.name.toLowerCase().includes(playerSearchTerm.toLowerCase()))
                                    .filter(Boolean).sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.name} #{p.number}</option>
                                    ))}
                            </select>
                        </div>

                        {selectedPlayerId ? (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {GEAR_ROWS.map(row => (
                                    <div key={row.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border)', background: playerGear[row.id]?.returned ? '#fff1f2' : (row.type === 'checkbox' && playerGear[row.id]?.issued ? '#f0fdf4' : 'transparent'), opacity: playerGear[row.id]?.returned ? 0.7 : 1 }}>
                                        <div style={{ width: '250px', fontWeight: 'bold', textDecoration: playerGear[row.id]?.returned ? 'line-through' : 'none' }}>{row.label}</div>
                                        <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                                            {row.type === 'checkbox' ? (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={playerGear[row.id]?.issued || false}
                                                        onChange={e => handleCheckboxChange(row.id, e.target.checked)}
                                                        style={{ width: '20px', height: '20px' }}
                                                    />
                                                    Issued
                                                </label>
                                            ) : (
                                                row.fields.map(field => (
                                                    <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{field}:</span>
                                                        <input
                                                            className="form-input"
                                                            style={{ width: field === '#' ? '60px' : field === 'Size' ? '80px' : '150px', padding: '0.25rem' }}
                                                            value={playerGear[row.id]?.[field] || ''}
                                                            onChange={e => handleIssuanceChange(row.id, field, e.target.value)}
                                                            placeholder={field}
                                                            disabled={playerGear[row.id]?.returned}
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div style={{ marginLeft: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: playerGear[row.id]?.returned ? '#e11d48' : 'inherit' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={playerGear[row.id]?.returned || false}
                                                    onChange={e => handleIssuanceChange(row.id, 'returned', e.target.checked)}
                                                    style={{ width: '18px', height: '18px', accentColor: '#e11d48' }}
                                                />
                                                Returned
                                            </label>
                                        </div>
                                    </div>
                                ))}

                                {/* Equipment Check-in/Check-out Section */}
                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '8px', border: '2px solid var(--border)' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Icon name="Package" size={20} />
                                        Equipment Check-in/Check-out
                                    </h3>

                                    {/* Checkout Form */}
                                    <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>

                                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 'bold' }}>Select Items (Status):</div>
                                            <button
                                                onClick={() => setIsEditingOptions(!isEditingOptions)}
                                                style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                {isEditingOptions ? 'Done Editing' : 'Customize List'}
                                            </button>
                                        </div>

                                        {isEditingOptions ? (
                                            <div style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px dashed var(--border)', borderRadius: '4px' }} >
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    {checklistOptions.map(opt => (
                                                        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                            {opt}
                                                            <button onClick={() => removeChecklistOption(opt)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        className="form-input"
                                                        placeholder="New Item Name..."
                                                        value={newOptionName}
                                                        onChange={e => setNewOptionName(e.target.value)}
                                                        style={{ padding: '0.25rem' }}
                                                    />
                                                    <button className="btn btn-sm btn-secondary" onClick={addChecklistOption}>Add</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                                {checklistOptions.map(item => (
                                                    <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#0f172a', fontWeight: '500' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checkoutForm.selectedItems.includes(item)}
                                                            onChange={e => {
                                                                const newSelection = e.target.checked
                                                                    ? [...checkoutForm.selectedItems, item]
                                                                    : checkoutForm.selectedItems.filter(i => i !== item);
                                                                setCheckoutForm({ ...checkoutForm, selectedItems: newSelection });
                                                            }}
                                                        />
                                                        {item}
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {checkoutForm.selectedItems.includes('Other') && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <input
                                                    className="form-input"
                                                    placeholder="Specify Other Item..."
                                                    value={checkoutForm.customItem}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, customItem: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                                            <div>
                                                <label className="form-label">Transaction Date</label>
                                                <input
                                                    className="form-input"
                                                    type="date"
                                                    value={checkoutForm.date}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, date: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleUpdateEquipment}
                                            >
                                                Save / Update Status
                                            </button>
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            * Checked items will be marked as issued. Unchecked items will be marked as returned.
                                        </div>
                                    </div>

                                    {/* Checkout History / Returns */}
                                    {
                                        (() => {
                                            const playerCheckouts = checkouts
                                                .filter(c => c.playerId === selectedPlayerId)
                                                .sort((a, b) => new Date(b.date) - new Date(a.date));

                                            if (playerCheckouts.length === 0) {
                                                return (
                                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                        No checkout history for this player.
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div>
                                                    <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                        CHECKOUT HISTORY
                                                    </h4>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                        <thead>
                                                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                                                <th style={{ padding: '0.5rem', borderRadius: '4px 0 0 4px' }}>Item</th>
                                                                <th style={{ padding: '0.5rem' }}>Checkout Date</th>
                                                                <th style={{ padding: '0.5rem' }}>Status</th>
                                                                <th style={{ padding: '0.5rem' }}>Returned Date</th>
                                                                <th style={{ padding: '0.5rem', borderRadius: '0 4px 4px 0' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {playerCheckouts.map(checkout => {
                                                                const daysOut = Math.floor((new Date() - new Date(checkout.date)) / (1000 * 60 * 60 * 24));
                                                                const isOverdue = checkout.status === 'checked-out' && daysOut > 7;

                                                                return (
                                                                    <tr key={checkout.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{checkout.item}</td>
                                                                        <td style={{ padding: '0.5rem' }}>{new Date(checkout.date).toLocaleDateString()}</td>
                                                                        <td style={{ padding: '0.5rem' }}>
                                                                            <span style={{
                                                                                padding: '2px 6px',
                                                                                borderRadius: '4px',
                                                                                fontSize: '0.75rem',
                                                                                background: checkout.status === 'checked-out'
                                                                                    ? (isOverdue ? '#fee2e2' : '#dbeafe')
                                                                                    : '#dcfce7',
                                                                                color: checkout.status === 'checked-out'
                                                                                    ? (isOverdue ? '#991b1b' : '#1e40af')
                                                                                    : '#166534',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                {checkout.status === 'checked-out' ? (isOverdue ? `Overdue (${daysOut} days)` : 'Active') : 'Returned'}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '0.5rem' }}>
                                                                            {checkout.returnDate ? new Date(checkout.returnDate).toLocaleDateString() : '-'}
                                                                        </td>
                                                                        <td style={{ padding: '0.5rem' }}>
                                                                            {checkout.status === 'checked-out' && (
                                                                                <button
                                                                                    className="btn btn-sm"
                                                                                    onClick={() => handleReturnItem(checkout.id, checkout.item)}
                                                                                    style={{
                                                                                        padding: '0.25rem 0.5rem',
                                                                                        fontSize: '0.8rem',
                                                                                        background: 'var(--success)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '4px',
                                                                                        cursor: 'pointer'
                                                                                    }}
                                                                                >
                                                                                    Check In
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()
                                    }
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Select a player to view and edit their equipment file.
                            </div>
                        )
                        }
                    </div>
                );
            }

            if (view === 'equipment-wishlist') {
                return (
                    <div className="card">
                        <h2>Wishlist / Needs</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 2 }}>
                                <label className="form-label">Item Needed</label>
                                <input className="form-input" value={newWish.item} onChange={e => setNewWish({ ...newWish, item: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Priority</label>
                                <select className="form-select" value={newWish.priority} onChange={e => setNewWish({ ...newWish, priority: e.target.value })}>
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Est. Cost</label>
                                <input className="form-input" type="number" value={newWish.cost} onChange={e => setNewWish({ ...newWish, cost: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <button className="btn btn-primary" onClick={addWish}>Add Wish</button>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {wishlist.map(wish => (
                                <li key={wish.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)', opacity: wish.status === 'Purchased' ? 0.6 : 1 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <strong style={{ textDecoration: wish.status === 'Purchased' ? 'line-through' : 'none' }}>{wish.item}</strong>
                                            <span style={{
                                                fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                                background: wish.priority === 'High' ? '#fee2e2' : '#f3f4f6',
                                                color: wish.priority === 'High' ? '#991b1b' : '#374151'
                                            }}>{wish.priority}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Est. Cost: ${wish.cost}</div>
                                    </div>
                                    <button
                                        onClick={() => toggleWishStatus(wish.id)}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                            background: wish.status === 'Purchased' ? '#dcfce7' : '#e5e7eb',
                                            color: wish.status === 'Purchased' ? '#166534' : '#374151'
                                        }}
                                    >
                                        {wish.status === 'Purchased' ? 'Purchased' : 'Mark Purchased'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            }
            return null;
        };


        // --- RBAC CONSTANTS & HELPERS ---
        // --- RBAC CONSTANTS & HELPERS ---
        const ROLES = [
            'Head Coach',
            'Assistant',
            'Student Manager',
            'Trainer',
            'Stats',
            'Player'
        ];

        const FEATURES = [
            { id: 'dashboard', label: 'Program Dashboard (Focus/Injuries)' },
            { id: 'playbook', label: 'Playbook' },
            { id: 'callsheet', label: 'Call Sheet & Game Planning' },
            { id: 'install', label: 'Install Schedule' },
            { id: 'scripts', label: 'Practice Scripts' },
            { id: 'depth', label: 'Depth Charts' },
            { id: 'recruiting', label: 'Recruiting Board' },
            { id: 'staff', label: 'Staff Management' },
            { id: 'settings', label: 'Settings & Config' }
        ];

        const DEFAULT_PERMISSIONS = {
            'Head Coach': {
                dashboard: { view: true, edit: true },
                playbook: { view: true, edit: true },
                callsheet: { view: true, edit: true },
                install: { view: true, edit: true },
                scripts: { view: true, edit: true },
                depth: { view: true, edit: true },
                recruiting: { view: true, edit: true },
                staff: { view: true, edit: true },
                settings: { view: true, edit: true }
            },
            'Assistant': {
                dashboard: { view: true, edit: true },
                playbook: { view: true, edit: true },
                callsheet: { view: true, edit: true },
                install: { view: true, edit: true },
                scripts: { view: true, edit: true },
                depth: { view: true, edit: true },
                recruiting: { view: true, edit: true },
                staff: { view: true, edit: false },
                settings: { view: false, edit: false }
            },
            'Student Manager': {
                dashboard: { view: true, edit: false },
                playbook: { view: false, edit: false },
                callsheet: { view: false, edit: false },
                install: { view: true, edit: false },
                scripts: { view: true, edit: true }, // Help with logistics
                depth: { view: true, edit: false },
                recruiting: { view: false, edit: false },
                staff: { view: false, edit: false },
                settings: { view: false, edit: false }
            },
            'Trainer': {
                dashboard: { view: true, edit: true }, // Update injuries
                playbook: { view: false, edit: false },
                callsheet: { view: false, edit: false },
                install: { view: false, edit: false },
                scripts: { view: false, edit: false },
                depth: { view: true, edit: false },
                recruiting: { view: false, edit: false },
                staff: { view: true, edit: false }, // View contact info
                settings: { view: false, edit: false }
            },
            'Stats': {
                dashboard: { view: true, edit: false },
                playbook: { view: true, edit: false },
                callsheet: { view: true, edit: false },
                install: { view: false, edit: false },
                scripts: { view: true, edit: false },
                depth: { view: true, edit: false },
                recruiting: { view: false, edit: false },
                staff: { view: false, edit: false },
                settings: { view: false, edit: false }
            },
            'Player': {
                dashboard: { view: true, edit: false },
                playbook: { view: true, edit: false },
                callsheet: { view: false, edit: false },
                install: { view: true, edit: false },
                scripts: { view: false, edit: false },
                depth: { view: true, edit: false },
                recruiting: { view: false, edit: false },
                staff: { view: false, edit: false },
                settings: { view: false, edit: false }
            }
        };

        const SchoolManagement = ({ currentUser, schoolId }) => {
            const [createLoading, setCreateLoading] = useState(false);
            const [joinLoading, setJoinLoading] = useState(false);
            const [joinInput, setJoinInput] = useState('');
            const [createAccessCode, setCreateAccessCode] = useState('');
            const [createMascot, setCreateMascot] = useState(''); // New: Mascot Input
            const [importData, setImportData] = useState(false); // Changed: Opt-in to data copy
            const [error, setError] = useState('');

            const handleCreateSchool = async () => {
                if (!createAccessCode.trim()) {
                    setError("Admin Access Code is required.");
                    return;
                }

                if (!confirm(importData
                    ? "This will copy your current workspace data to the new School Database. Proceed?"
                    : "You are creating a new empty school. Proceed?")) return;
                setCreateLoading(true);
                setError('');

                try {
                    // VERIFY ACCESS CODE
                    // In a real app, use a Cloud Function. Here, we check a secured Firestore doc or a hardcoded fallback.
                    let isValid = false;
                    try {
                        const configDoc = await window.db.collection('config').doc('access').get();
                        if (configDoc.exists && configDoc.data().createSchoolCode === createAccessCode) {
                            isValid = true;
                        } else if (createAccessCode === 'HEADCOACH101') {
                            // Fallback until config is set
                            isValid = true;
                        }
                    } catch (err) {
                        console.warn("Config check failed, checking fallback", err);
                        if (createAccessCode === 'HEADCOACH101') isValid = true;
                    }

                    if (!isValid) {
                        throw new Error("Invalid Admin Access Code.");
                    }

                    const newSchoolId = `SCH_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Consistent with SchoolSetupWizard

                    // 1. Gather all local data keys
                    const keys = [
                        'oc-dashboard-roster', 'oc-dashboard-plays', 'oc-dashboard-staff',
                        'oc-dashboard-depthchart', 'oc-dashboard-master-tasks', 'attendance_log',
                        'oc-dashboard-equipment-inventory', 'oc-dashboard-equipment-checkouts',
                        'formationLayouts', 'oc-dashboard-ratings', 'oc-dashboard-game-grades', 'oc-dashboard-summer-comp',
                        'oc-dashboard-scouting', 'oc-dashboard-equipment-issuance', 'oc-dashboard-equipment-wishlist',
                        'athlete_assessments', 'oc-dashboard-formations', 'oc-dashboard-zone-philosophies',
                        'oc-dashboard-custom-focus', 'oc-dashboard-duties', 'oc-dashboard-metrics',
                        'fatigue-thresholds', 'position-fatigue-values', 'program_budget_data', 'program_onboarding_data',
                        'oc-dashboard-position-names', 'player_daily_connections', 'player_weight_logs', 'staff_role_tasks',
                        'rooski_ol_library', 'oc-dashboard-weeks'
                    ];

                    const schoolData = {
                        createdAt: new Date().toISOString(),
                        createdBy: currentUser.uid,
                        id: newSchoolId,
                        joinCode: joinCode, // Store Join Code
                        name: "My New School", // Default name
                        settings: {
                            schoolName: "My New School",
                            schoolMascot: createMascot || 'Tigers', // Default if empty
                            teamLogo: localStorage.getItem('oc-dashboard-logo') || '',
                            accentColor: localStorage.getItem('oc-dashboard-accent') || '#3b82f6',
                            theme: localStorage.getItem('oc-dashboard-theme') || 'dark',
                            activeYear: localStorage.getItem('hc-active-year') || '2025',
                            visibleFeatures: JSON.parse(localStorage.getItem('hc-visible-features') || '{}')
                        },
                        // Initialize empty arrays if NOT importing data
                        roster: [],
                        staff: [
                            {
                                id: currentUser.uid,
                                name: currentUser.displayName || 'Head Coach',
                                email: currentUser.email,
                                roles: ['Head Coach', 'Team Admin'], // FORCE ADMIN RIGHTS
                                phone: '',
                                bio: 'School Creator'
                            }
                        ],
                        plays: [],
                        billing: { // Initialize with trial
                            plan: 'premium_trial',
                            trialStartDate: new Date().toISOString(),
                            trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'active'
                        }
                    };

                    // Populate schoolData only if importing data
                    if (importData) {
                        keys.forEach(k => {
                            const val = localStorage.getItem(k);
                            if (val) {
                                // Map local keys to cloud keys (reverse of loadUserData logic)
                                // This is a bit manual but necessary
                                if (k === 'oc-dashboard-roster') schoolData.roster = JSON.parse(val);
                                if (k === 'oc-dashboard-plays') schoolData.plays = JSON.parse(val);
                                if (k === 'oc-dashboard-staff') schoolData.staff = JSON.parse(val);
                                if (k === 'oc-dashboard-depthchart') schoolData.depthChart = JSON.parse(val);
                                if (k === 'oc-dashboard-master-tasks') schoolData.masterTasks = JSON.parse(val);
                                if (k === 'oc-dashboard-weeks') schoolData.weeks = JSON.parse(val);
                                if (k === 'attendance_log') schoolData.attendance = JSON.parse(val);
                                if (k === 'oc-dashboard-valhalla') schoolData.valhalla = JSON.parse(val);
                                if (k === 'oc-dashboard-equipment-inventory') schoolData.inventory = JSON.parse(val);
                                if (k === 'oc-dashboard-equipment-checkouts') schoolData.checkouts = JSON.parse(val);
                                if (k === 'formationLayouts') schoolData.formationLayouts = JSON.parse(val);
                                if (k === 'oc-dashboard-ratings') schoolData.ratings = JSON.parse(val);
                                if (k === 'oc-dashboard-game-grades') schoolData.gameGrades = JSON.parse(val);
                                if (k === 'oc-dashboard-summer-comp') schoolData.summerComp = JSON.parse(val);
                                if (k === 'oc-dashboard-scouting') schoolData.opponentScouting = JSON.parse(val);
                                if (k === 'oc-dashboard-equipment-issuance') schoolData.issuance = JSON.parse(val);
                                if (k === 'oc-dashboard-equipment-wishlist') schoolData.wishlist = JSON.parse(val);
                                if (k === 'athlete_assessments') schoolData.athleteAssessments = JSON.parse(val);
                                if (k === 'oc-dashboard-formations') schoolData.formations = JSON.parse(val);
                                if (k === 'oc-dashboard-zone-philosophies') schoolData.zonePhilosophies = JSON.parse(val);
                                if (k === 'oc-dashboard-custom-focus') schoolData.customFocus = JSON.parse(val);
                                if (k === 'oc-dashboard-duties') schoolData.duties = JSON.parse(val);
                                if (k === 'oc-dashboard-metrics') schoolData.metrics = JSON.parse(val);
                                if (k === 'fatigue-thresholds') schoolData.fatigueThresholds = JSON.parse(val);
                                if (k === 'position-fatigue-values') schoolData.positionFatigue = JSON.parse(val);
                                if (k === 'program_budget_data') schoolData.budget = JSON.parse(val);
                                if (k === 'program_onboarding_data') schoolData.onboarding = JSON.parse(val);
                                if (k === 'oc-dashboard-position-names') schoolData.positionNames = JSON.parse(val);
                                if (k === 'player_daily_connections') schoolData.dailyConnections = JSON.parse(val);
                                if (k === 'player_weight_logs') schoolData.weightLogs = JSON.parse(val);
                                if (k === 'staff_role_tasks') schoolData.roleTasks = JSON.parse(val);
                                if (k === 'rooski_ol_library') schoolData.rooskiLib = JSON.parse(val);
                            }
                        });
                    }

                    // 2. Write School Doc
                    await window.db.collection('schools').doc(newSchoolId).set(schoolData);

                    // 3. Update User Doc
                    await window.db.collection('users').doc(currentUser.uid).update({ schoolId: newSchoolId });

                    alert(`School Created! ID: ${newSchoolId}. The app will now reload.`);
                    window.location.reload();

                } catch (e) {
                    console.error(e);
                    setError("Failed to create school: " + e.message);
                } finally {
                    setCreateLoading(false);
                }
            };

            const handleJoinSchool = async () => {
                const input = joinInput.trim();
                if (!input) return;

                setJoinLoading(true);
                setError('');
                try {
                    // Try to find by Join Code first (if len 6)
                    let targetSchoolId = null;
                    let targetSchoolName = '';

                    if (input.length === 6) {
                        try {
                            const querySnapshot = await window.db.collection('schools')
                                .where('joinCode', '==', input.toUpperCase())
                                .limit(1)
                                .get();

                            if (!querySnapshot.empty) {
                                targetSchoolId = querySnapshot.docs[0].id;
                                targetSchoolName = querySnapshot.docs[0].data().name;
                            }
                        } catch (err) {
                            console.log("Join Code lookup failed", err);
                        }
                    }

                    // Fallback to direct ID if not found by code
                    if (!targetSchoolId) {
                        const schoolDoc = await window.db.collection('schools').doc(input).get();
                        if (schoolDoc.exists) {
                            targetSchoolId = schoolDoc.id;
                            targetSchoolName = schoolDoc.data().name || 'Unknown School';
                        }
                    }

                    if (!targetSchoolId) {
                        throw new Error("School not found. Check the Code or ID.");
                    }

                    if (!confirm(`Join ${targetSchoolName}?`)) return;

                    await window.db.collection('users').doc(currentUser.uid).update({ schoolId: targetSchoolId });

                    // Add to member list (optional but good practice)
                    await window.db.collection('schools').doc(targetSchoolId).update({
                        [`memberList.${currentUser.uid}`]: {
                            email: currentUser.email,
                            role: 'viewer', // Default role
                            joinedAt: new Date().toISOString()
                        }
                    });

                    window.location.reload();
                } catch (e) {
                    setError(e.message);
                } finally {
                    setJoinLoading(false);
                }
            };

            const handleLeaveSchool = async () => {
                if (!confirm("Are you sure you want to leave this school? You will revert to your personal workspace.")) return;
                try {
                    await window.db.collection('users').doc(currentUser.uid).update({ schoolId: firebase.firestore.FieldValue.delete() });

                    // CLEAR LOCAL DATA to avoid ghost data
                    const keys = [
                        'oc-dashboard-roster', 'oc-dashboard-plays', 'oc-dashboard-staff',
                        'oc-dashboard-depthchart', 'oc-dashboard-master-tasks', 'attendance_log',
                        'oc-dashboard-equipment-inventory', 'oc-dashboard-equipment-checkouts',
                        'formationLayouts', 'oc-dashboard-ratings', 'oc-dashboard-game-grades', 'oc-dashboard-summer-comp',
                        'oc-dashboard-scouting', 'oc-dashboard-equipment-issuance', 'oc-dashboard-equipment-wishlist',
                        'athlete_assessments', 'oc-dashboard-formations', 'oc-dashboard-zone-philosophies',
                        'oc-dashboard-custom-focus', 'oc-dashboard-duties', 'oc-dashboard-metrics',
                        'fatigue-thresholds', 'position-fatigue-values', 'program_budget_data', 'program_onboarding_data',
                        'oc-dashboard-position-names', 'player_daily_connections', 'player_weight_logs', 'staff_role_tasks',
                        'rooski_ol_library', 'oc-dashboard-weeks',
                        'hc_school_id', 'hc_school_name' // Clear name too
                    ];
                    keys.forEach(k => localStorage.removeItem(k));

                    window.location.reload();
                } catch (e) {
                    console.error("Error leaving school:", e);
                    alert("Error leaving school: " + e.message);
                }
            };

            return (
                <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome, {currentUser.displayName || 'Coach'}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            You are currently in your <strong>Personal Workspace</strong>. Data is saved locally.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                            {error}
                        </div>
                    )}

                    {schoolId ? (
                        <div className="card">
                            <h2>Current School</h2>
                            <div style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>School ID</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <code style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-body)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                        {schoolId}
                                    </code>
                                    <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(schoolId)}>Copy</button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Share this ID with other coaches so they can join this team.
                                </p>
                            </div>
                            <button className="btn btn-danger" onClick={handleLeaveSchool}>Leave School</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Create School */}
                            <div className="card">
                                <h2>Create New School</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                    Convert your personal workspace into a shared Team Database. You will become the admin.
                                </p>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>School Mascot</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Tigers, Eagles..."
                                        value={createMascot}
                                        onChange={e => setCreateMascot(e.target.value)}
                                        style={{ width: '100%', marginBottom: '1rem' }}
                                    />
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Admin Access Code</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Required to create school..."
                                        value={createAccessCode}
                                        onChange={e => setCreateAccessCode(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                    <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={importData}
                                            onChange={e => setImportData(e.target.checked)}
                                            style={{ marginRight: '0.5rem', width: 'auto' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Copy my current workspace data (Optional)</span>
                                    </label>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateSchool}
                                    disabled={createLoading}
                                    style={{ width: '100%' }}
                                >
                                    {createLoading ? 'Creating...' : (importData ? 'Create & Import Data' : 'Create New School')}
                                </button>
                            </div>

                            {/* Join School */}
                            <div className="card">
                                <h2>Join Existing School</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                    Enter a <strong>Join Code</strong> (from your HC) or a legacy School ID to sync with your team.
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter 6-digit Join Code..."
                                        value={joinInput}
                                        onChange={e => setJoinInput(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleJoinSchool}
                                        disabled={joinLoading || !joinInput}
                                    >
                                        {joinLoading ? 'Joining...' : 'Join'}
                                    </button>
                                </div>
                                {error && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}
                            </div>
                        </div>
                    )}
                </div>
            );
        };
        const PermissionsView = ({ permissions, onUpdatePermissions, onResetDefaults }) => {
            const togglePermission = (role, featureId, type) => {
                const newPermissions = JSON.parse(JSON.stringify(permissions));
                if (!newPermissions[role]) newPermissions[role] = {};
                if (!newPermissions[role][featureId]) newPermissions[role][featureId] = { view: false, edit: false };

                newPermissions[role][featureId][type] = !newPermissions[role][featureId][type];

                // Logic: If edit is true, view must be true
                if (type === 'edit' && newPermissions[role][featureId].edit) {
                    newPermissions[role][featureId].view = true;
                }
                // Logic: If view is false, edit must be false
                if (type === 'view' && !newPermissions[role][featureId].view) {
                    newPermissions[role][featureId].edit = false;
                }

                onUpdatePermissions(newPermissions);
            };

            return (
                <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Permissions Management</h1>
                            <div style={{ color: 'var(--text-secondary)' }}>Configure View and Edit access for each staff role.</div>
                        </div>
                        <button className="btn btn-outline" onClick={onResetDefaults}>
                            <Icon name="RotateCcw" size={16} /> Reset to Defaults
                        </button>
                    </div>

                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>Feature</th>
                                    {ROLES.map(role => (
                                        <th key={role} style={{ textAlign: 'center', padding: '1rem', minWidth: '120px' }}>
                                            {role.replace(' Coordinator', ' Coord.')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {FEATURES.map(feature => (
                                    <tr key={feature.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{feature.label}</td>
                                        {ROLES.map(role => {
                                            const rolePerms = permissions[role] || DEFAULT_PERMISSIONS[role] || { view: false, edit: false };
                                            const p = rolePerms[feature.id] || { view: false, edit: false };
                                            const isHC = role === 'Head Coach';

                                            return (
                                                <td key={`${role}-${feature.id}`} style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => !isHC && togglePermission(role, feature.id, 'view')}
                                                            title="Toggle View"
                                                            style={{
                                                                background: p.view ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                                border: p.view ? '1px solid #3b82f6' : '1px solid transparent',
                                                                color: p.view ? '#3b82f6' : 'var(--text-secondary)',
                                                                padding: '4px 8px', borderRadius: '4px', cursor: isHC ? 'default' : 'pointer',
                                                                opacity: isHC ? 0.5 : 1
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => !isHC && togglePermission(role, feature.id, 'edit')}
                                                            title="Toggle Edit"
                                                            style={{
                                                                background: p.edit ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                                                border: p.edit ? '1px solid #22c55e' : '1px solid transparent',
                                                                color: p.edit ? '#22c55e' : 'var(--text-secondary)',
                                                                padding: '4px 8px', borderRadius: '4px', cursor: isHC ? 'default' : 'pointer',
                                                                opacity: isHC ? 0.5 : 1
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        };


        // PLAYER LOAD MANAGEMENT
        const LOAD_WEIGHTS = [3, 2, 1]; // Slot 1 (3pts), Slot 2 (2pts), Slot 3 (1pt)

        const calculatePlayerLoad = (playerId, depthCharts) => {
            let totalScore = 0;
            const breakdown = [];

            if (!depthCharts || typeof depthCharts !== 'object') return { totalScore, breakdown };

            Object.entries(depthCharts).forEach(([chartKey, positions]) => {
                if (!positions) return;

                // Parse Unit Name from Key (e.g. "V_OFFENSE" -> "Varsity Offense")
                let unitName = chartKey
                    .replace('V_', 'Varsity ')
                    .replace('JV_', 'JV ')
                    .replace('J2_', 'JV2 ')
                    .replace(/_/g, ' '); // Replace all underscores

                // Capitalize each word
                unitName = unitName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

                Object.entries(positions).forEach(([posId, playerIds]) => {
                    if (Array.isArray(playerIds)) {
                        playerIds.forEach((pId, index) => {
                            if (pId === playerId) {
                                const weight = LOAD_WEIGHTS[index] || 1; // Default to 1 if deep depth
                                totalScore += weight;

                                // Determine Role Name if position structure is standard "UNIT_POS"
                                let roleName = posId;
                                if (posId.includes('_')) {
                                    roleName = posId.split('_').pop();
                                }

                                breakdown.push({
                                    unit: unitName,
                                    role: roleName,
                                    weight: weight,
                                    type: index === 0 ? 'Starter' : (index === 1 ? 'Rotation' : 'Depth')
                                });
                            }
                        });
                    }
                });
            });

            return { totalScore, breakdown };
        };

        // POSITION-BASED FATIGUE SYSTEM
        const DEFAULT_POSITION_FATIGUE = {
            // Offense - Moderate fatigue
            'QB': 2, 'RB': 3, 'WR': 2, 'TE': 2,
            'LT': 2, 'LG': 2, 'C': 2, 'RG': 2, 'RT': 2,
            'X': 2, 'Y': 2, 'Z': 2, 'A': 2, // WR positions

            // Defense - Higher fatigue (more physical)
            'DE': 3, 'DT': 3, 'NT': 3, 'LDE': 3, 'RDE': 3, 'LDT': 3, 'RDT': 3,
            'Will': 3, 'Mike': 3, 'WLB': 3, 'MLB': 3, 'SLB': 3,
            'CB': 2, 'LCB': 2, 'RCB': 2, 'FS': 2, 'SS': 2, 'Nickel': 2, 'Nick': 2,

            // Special Teams - High effort/contact positions
            'K': 1, 'P': 1, 'LS': 1, 'PP': 1, // Low fatigue
            'KR': 3, 'Ret': 3, 'R': 3, 'R1': 3, 'R2': 3, // Returners - high
            'Gunner': 3, 'G1': 3, 'G2': 3, // Gunners - high
            'L1': 2, 'L2': 2, 'L3': 2, 'L4': 2, 'L5': 2, // Coverage - moderate
            'R1': 2, 'R2': 2, 'R3': 2, 'R4': 2, 'R5': 2,
            'Rush': 2, 'Jam': 2, 'Front': 2, 'Mid': 2, 'Back': 2, 'Deep': 2,
            'Wing': 2, 'Off': 1,

            // Default for unlisted positions
            'DEFAULT': 1
        };

        const calculatePlayerFatigue = (playerId, depthCharts, positionFatigueWeights = null) => {
            // Read from localStorage if no custom weights provided
            if (!positionFatigueWeights) {
                try {
                    const stored = localStorage.getItem('position-fatigue-values');
                    positionFatigueWeights = stored ? JSON.parse(stored) : DEFAULT_POSITION_FATIGUE;
                } catch (e) {
                    positionFatigueWeights = DEFAULT_POSITION_FATIGUE;
                }
            }

            let totalFatigue = 0;
            const assignments = [];

            if (!depthCharts || typeof depthCharts !== 'object') return { totalFatigue, assignments };

            Object.entries(depthCharts).forEach(([chartKey, positions]) => {
                if (!positions) return;

                // Parse Unit Name
                let unitName = chartKey
                    .replace('V_', 'Varsity ')
                    .replace('JV_', 'JV ')
                    .replace('J2_', 'JV2 ')
                    .replace(/_/g, ' ');
                unitName = unitName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

                Object.entries(positions).forEach(([posId, playerIds]) => {
                    if (Array.isArray(playerIds) && playerIds.includes(playerId)) {
                        // Extract position name from posId (e.g., "OFF_QB" -> "QB")
                        let posName = posId.includes('_') ? posId.split('_').pop() : posId;

                        const fatigueValue = positionFatigueWeights[posName] || positionFatigueWeights['DEFAULT'];
                        totalFatigue += fatigueValue;

                        assignments.push({
                            unit: unitName,
                            position: posName,
                            fatigue: fatigueValue
                        });
                    }
                });
            });

            return { totalFatigue, assignments };
        };

        // Helper: Get Fatigue Color
        const getFatigueColor = (fatigueScore, thresholds = null) => {
            // Read from localStorage if no custom thresholds provided
            if (!thresholds) {
                try {
                    const stored = localStorage.getItem('fatigue-thresholds');
                    thresholds = stored ? JSON.parse(stored) : { moderate: 5, high: 8, veryHigh: 12 };
                } catch (e) {
                    thresholds = { moderate: 5, high: 8, veryHigh: 12 };
                }
            }

            if (fatigueScore >= thresholds.veryHigh) return '#ef4444'; // Red
            if (fatigueScore >= thresholds.high) return '#eab308'; // Yellow
            if (fatigueScore >= thresholds.moderate) return '#f97316'; // Orange
            return '#10b981'; // Green
        };

        // DEFAULT 2025 DATA
        const DEFAULT_ROSTER_2025 = [];

        const DEFAULT_STAFF_2025 = [];

        // Default Formation Presets
        const DEFAULT_FORMATIONS = [
            {
                id: 'blue',
                name: 'Blue',
                description: '2x2 Spread - Balanced receivers',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'X', x: 10, y: 52 },
                    { label: 'Z', x: 90, y: 52 },
                    { label: 'A', x: 70, y: 56 },
                    { label: 'Y', x: 30, y: 56 }
                ]
            },
            {
                id: 'red',
                name: 'Red',
                description: '3x1 Spread - Trips right',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'X', x: 10, y: 52 },
                    { label: 'Z', x: 90, y: 52 },
                    { label: 'A', x: 80, y: 52 },
                    { label: 'Y', x: 85, y: 56 }
                ]
            },
            {
                id: 'green',
                name: 'Green',
                description: '2x2 Spread with tight slot',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'X', x: 10, y: 52 },
                    { label: 'Z', x: 90, y: 52 },
                    { label: 'A', x: 68, y: 53 },
                    { label: 'Y', x: 32, y: 53 }
                ]
            },
            {
                id: 'orange',
                name: 'Orange',
                description: 'Empty backfield 3x2',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'X', x: 10, y: 52 },
                    { label: 'Z', x: 90, y: 52 },
                    { label: 'A', x: 80, y: 52 },
                    { label: 'Y', x: 30, y: 56 },
                    { label: 'F', x: 70, y: 60 }
                ]
            },
            {
                id: 'diamond_rt',
                name: 'Diamond Rt',
                description: 'Diamond formation right',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'WR', x: 55, y: 45 },
                    { label: 'WR', x: 40, y: 58 },
                    { label: 'WR', x: 70, y: 58 },
                    { label: 'WR', x: 55, y: 72 },
                    { label: 'X', x: 10, y: 52 }
                ]
            },
            {
                id: 'diamond_lt',
                name: 'Diamond Lt',
                description: 'Diamond formation left',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'WR', x: 45, y: 45 },
                    { label: 'WR', x: 30, y: 58 },
                    { label: 'WR', x: 60, y: 58 },
                    { label: 'WR', x: 45, y: 72 },
                    { label: 'Z', x: 90, y: 52 }
                ]
            },
            {
                id: 'bunch_rt',
                name: 'Bunch Rt',
                description: 'Bunched receivers right',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'X', x: 10, y: 52 },
                    { label: 'WR', x: 78, y: 52 },
                    { label: 'WR', x: 83, y: 52 },
                    { label: 'WR', x: 88, y: 50 }
                ]
            },
            {
                id: 'bunch_lt',
                name: 'Bunch Lt',
                description: 'Bunched receivers left',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'Z', x: 90, y: 52 },
                    { label: 'WR', x: 22, y: 52 },
                    { label: 'WR', x: 17, y: 52 },
                    { label: 'WR', x: 12, y: 50 }
                ]
            },
            {
                id: 'bright',
                name: 'Bright',
                description: 'Tight formation with TE',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'TE', x: 70, y: 52 },
                    { label: 'X', x: 10, y: 52 },
                    { label: 'Z', x: 90, y: 52 },
                    { label: 'A', x: 80, y: 54 }
                ]
            },
            {
                id: 'rip',
                name: 'Rip',
                description: 'Rip formation',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'X', x: 12, y: 52 },
                    { label: 'Z', x: 88, y: 52 },
                    { label: 'A', x: 72, y: 55 },
                    { label: 'Y', x: 28, y: 55 }
                ]
            },
            {
                id: 'gold',
                name: 'Gold',
                description: 'Gold formation',
                positions: [
                    { label: 'LT', x: 35, y: 52 },
                    { label: 'LG', x: 42, y: 52 },
                    { label: 'C', x: 50, y: 52 },
                    { label: 'RG', x: 58, y: 52 },
                    { label: 'RT', x: 65, y: 52 },
                    { label: 'QB', x: 50, y: 58 },
                    { label: 'RB', x: 50, y: 65 },
                    { label: 'X', x: 10, y: 52 },
                    { label: 'Z', x: 90, y: 52 },
                    { label: 'A', x: 75, y: 56 },
                    { label: 'Y', x: 25, y: 56 }
                ]
            }
        ];


        const GradingModal = ({ cell, currentData, onClose, onSave }) => {
            const [grade, setGrade] = useState(currentData?.grade || 2);
            const [criteria, setCriteria] = useState(currentData?.criteria || {
                alignment: false,
                assignment: false,
                getOff: false,
                finish: false
            });
            const [notes, setNotes] = useState(currentData?.notes || '');

            useEffect(() => {
                if (currentData) {
                    setGrade(currentData.grade);
                    setCriteria(currentData.criteria || {});
                    setNotes(currentData.notes || '');
                } else {
                    setGrade(2);
                    setCriteria({ alignment: false, assignment: false, getOff: false, finish: false });
                    setNotes('');
                }
            }, [currentData]);

            return (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'slideIn 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <div>
                                <h2>Grade: {cell.player.name}</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {cell.play.play.name} • {cell.play.situation.down}&{cell.play.situation.distance}
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Performance Grade</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[0, 1, 2, 3, 4].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGrade(g)}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            background: grade === g ? (g >= 3 ? '#10b981' : g < 2 ? '#ef4444' : '#f59e0b') : 'var(--bg-panel)',
                                            color: grade === g ? 'white' : 'var(--text-primary)',
                                            fontWeight: 'bold',
                                            padding: '1rem',
                                            fontSize: '1.5rem',
                                            border: grade === g ? '2px solid rgba(255,255,255,0.2)' : '1px solid var(--border)'
                                        }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                                <span>Critical Error</span>
                                <span>Poor</span>
                                <span>Average</span>
                                <span>Good</span>
                                <span>Dominant</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {Object.keys(criteria).map(key => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-panel)', borderRadius: '6px', cursor: 'pointer', border: criteria[key] ? '1px solid var(--accent)' : '1px solid transparent' }}>
                                    <input
                                        type="checkbox"
                                        checked={criteria[key]}
                                        onChange={(e) => setCriteria({ ...criteria, [key]: e.target.checked })}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
                                    />
                                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-input"
                                rows="3"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add specific coaching points..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" onClick={onClose} style={{ flex: 1, background: 'var(--bg-panel)' }}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                                onClick={() => {
                                    onSave({ grade, criteria, notes });
                                    onClose();
                                }}
                            >
                                <Icon name="Save" size={18} style={{ marginRight: '8px' }} />
                                Save Grade
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        const GameGradingView = ({ gameLog, roster, gameGrades, onUpdateGameGrades }) => {
            const [filterSide, setFilterSide] = useState('ALL');
            const [activeCell, setActiveCell] = useState(null); // {playId, playerId, play, player}

            // Simple Position Groups Classification
            const OFFENSE_POS = ['QB', 'RB', 'WR', 'TE', 'OL', 'C', 'G', 'T', 'LT', 'LG', 'RG', 'RT'];
            const DEFENSE_POS = ['DL', 'LB', 'DB', 'DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'CB', 'S', 'FS', 'SS'];

            const filteredRoster = useMemo(() => {
                return roster.filter(p => {
                    if (filterSide === 'ALL') return true;
                    if (filterSide === 'OFFENSE') return OFFENSE_POS.includes(p.position);
                    if (filterSide === 'DEFENSE') return DEFENSE_POS.includes(p.position);
                    return true;
                }).sort((a, b) => {
                    // Sort by Position then Name
                    if (a?.position !== b?.position) return (a?.position || '').localeCompare(b?.position || '');
                    return (a?.name || '').localeCompare(b?.name || '');
                });
            }, [roster, filterSide]);

            // Reverse game log so latest plays are at the bottom? No, chronological (Drive 1, Play 1) usually top-down.
            // gameLog is typically pushed to, so index 0 is first play.
            // Let's assume gameLog is chronological.

            const handleSaveGrade = (gradeData) => {
                if (!activeCell) return;
                const { playId, playerId, player, play } = activeCell;

                const newGrades = {
                    ...gameGrades,
                    [playId]: {
                        ...(gameGrades[playId] || {}),
                        [playerId]: gradeData
                    }
                };
                onUpdateGameGrades(newGrades);


            };

            const getCellColor = (grade) => {
                if (grade === undefined) return 'transparent'; // Ungraded
                if (grade >= 3) return '#10b981'; // Good (Green)
                if (grade === 2) return '#f59e0b'; // Average (Yellow)
                return '#ef4444'; // Bad (Red)
            };

            return (
                <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                    {/* Header Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Game Grade Outs</h2>
                            <div className="btn-group">
                                {['ALL', 'OFFENSE', 'DEFENSE'].map(side => (
                                    <button
                                        key={side}
                                        className={`btn ${filterSide === side ? 'btn-primary' : ''}`}
                                        onClick={() => setFilterSide(side)}
                                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                    >
                                        {side}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            {gameLog.length} Plays • {filteredRoster.length} Players
                        </div>
                    </div>

                    {/* Matrix Container */}
                    <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', minWidth: '200px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', left: 0, zIndex: 20 }}>
                                            Play Call / Situation
                                        </th>
                                        {filteredRoster.map(player => (
                                            <th key={player.id} style={{ padding: '0.5rem', minWidth: '80px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', fontWeight: '500' }}>
                                                <div style={{ fontSize: '0.9rem' }}>{player.name.split(' ').pop()}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{player.position} #{player.number}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {gameLog.map((play, idx) => (
                                        <tr key={play.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            {/* Play Info Column */}
                                            <td style={{ padding: '0.75rem', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 5, borderRight: '1px solid var(--border)' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{play.play.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                                                    <span>Play {idx + 1}</span>
                                                    <span>•</span>
                                                    <span>{play.situation.down}&{play.situation.distance}</span>
                                                    <span>•</span>
                                                    <span>{play.situation.hash}</span>
                                                </div>
                                            </td>

                                            {/* Grading Cells */}
                                            {filteredRoster.map(player => {
                                                const gradeData = (gameGrades[play.id] || {})[player.id];
                                                const grade = gradeData?.grade;
                                                const bgColor = getCellColor(grade);

                                                return (
                                                    <td
                                                        key={`${play.id}-${player.id}`}
                                                        onClick={() => setActiveCell({ playId: play.id, playerId: player.id, play, player })}
                                                        style={{
                                                            borderLeft: '1px solid var(--border)',
                                                            textAlign: 'center',
                                                            cursor: 'pointer',
                                                            background: grade !== undefined ? bgColor : 'transparent',
                                                            color: grade !== undefined ? 'white' : 'inherit',
                                                            fontWeight: 'bold',
                                                            transition: 'all 0.2s',
                                                            height: '60px'
                                                        }}
                                                        className="hover-brighten"
                                                    >
                                                        {grade !== undefined ? grade : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Grading Modal */}
                    {activeCell && (
                        <GradingModal
                            cell={activeCell}
                            currentData={(gameGrades[activeCell.playId] || {})[activeCell.playerId]}
                            onClose={() => setActiveCell(null)}
                            onSave={handleSaveGrade}
                        />
                    )}
                </div>
            );
        };

        const GameWeekOverview = ({ week, onUpdateWeek, teamLogo, isLocked }) => {
            const [addEventModal, setAddEventModal] = useState(null); // { day: 'monday' } or null
            const [editingEvent, setEditingEvent] = useState(null); // { day, eventId, event } or null
            const [exportMode, setExportMode] = useState(false);

            const overview = week.overview || {};

            // Ensure structure
            if (!overview.dailySchedule) {
                overview.dailySchedule = {
                    monday: { events: [] },
                    tuesday: { events: [] },
                    wednesday: { events: [] },
                    thursday: { events: [] },
                    friday: { events: [] },
                    saturday: { events: [] }
                };
            }

            // Sync practices from practice plans
            useEffect(() => {
                if (!week.practicePlans) return;

                const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                let hasChanges = false;
                const newDailySchedule = JSON.parse(JSON.stringify(overview.dailySchedule));

                DAYS.forEach(day => {
                    const plan = week.practicePlans[day];
                    const autoId = `auto-practice-${day}`;
                    const existingIndex = newDailySchedule[day].events.findIndex(e => e.id === autoId);

                    if (plan && plan.startTime) {
                        // Calculate end time
                        let endTime = '';
                        try {
                            const [h, m] = plan.startTime.split(':').map(Number);
                            let totalMinutes = (h * 60) + m;
                            totalMinutes += parseInt(plan.warmupDuration || 0);
                            if (plan.segments && Array.isArray(plan.segments)) {
                                plan.segments.forEach(s => totalMinutes += parseInt(s.duration || 0));
                            }
                            const endH = Math.floor(totalMinutes / 60);
                            const endM = totalMinutes % 60;
                            endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                        } catch (e) { endTime = 'TBD'; }

                        const practiceEvent = {
                            id: autoId,
                            type: 'practice',
                            level: 'Varsity',
                            start: plan.startTime,
                            end: endTime,
                            notes: plan.focus || '',
                            autoPopulated: true
                        };

                        if (existingIndex >= 0) {
                            const existing = newDailySchedule[day].events[existingIndex];
                            if (existing.start !== practiceEvent.start || existing.end !== practiceEvent.end || existing.notes !== practiceEvent.notes) {
                                newDailySchedule[day].events[existingIndex] = practiceEvent;
                                hasChanges = true;
                            }
                        } else {
                            newDailySchedule[day].events.unshift(practiceEvent);
                            hasChanges = true;
                        }
                    } else if (existingIndex >= 0) {
                        // Remove if plan was cleared
                        newDailySchedule[day].events.splice(existingIndex, 1);
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    onUpdateWeek(week.id, 'overview', { ...overview, dailySchedule: newDailySchedule });
                }
            }, [week.practicePlans]);

            const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };

            const handleExport = () => {
                setExportMode(true);
                setTimeout(() => {
                    window.print();
                    setExportMode(false);
                }, 500);
            };

            const getEventColor = (type) => {
                if (type === 'practice') return '#3b82f6';
                if (type === 'game') return '#ef4444';
                return '#10b981';
            };

            return (
                <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h1>Week {week.weekNum} Overview</h1>
                        <button className="btn btn-primary" onClick={handleExport}>
                            <Icon name="Printer" size={18} style={{ marginRight: '8px' }} />
                            Export for SportsYou
                        </button>
                    </div>

                    <div id="game-week-print-area">
                        {/* Header Info */}
                        <div style={{ background: '#1e293b', color: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: '800', marginBottom: '0.5rem' }}>
                                Motivational Focus
                            </div>
                            <div className="no-print">
                                <textarea
                                    className="form-input"
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
                                    value={overview.messageOfWeek || ''}
                                    placeholder="Enter Message of the Week..."
                                    onChange={(e) => onUpdateWeek(week.id, 'overview', { ...overview, messageOfWeek: e.target.value })}
                                />
                            </div>
                            <div className="print-only" style={{ fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic' }}>
                                "{overview.messageOfWeek || 'Win The Day'}"
                            </div>
                        </div>

                        {/* Daily Schedule */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {DAYS.map(day => {
                                const daySchedule = overview.dailySchedule[day];
                                const hasMeal = day === 'thursday' && overview.meal && (overview.meal.host || overview.meal.time);

                                return (
                                    <div key={day} className="card" style={{ padding: '1.25rem', borderLeft: '6px solid var(--accent)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{DAY_LABELS[day]}</h2>
                                            <button className="btn no-print" onClick={() => setAddEventModal({ day })} disabled={isLocked}>
                                                <Icon name="Plus" size={16} style={{ marginRight: '6px' }} />
                                                Add Event
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {daySchedule.events.map(event => (
                                                <div key={event.id} style={{
                                                    padding: '1rem',
                                                    background: 'var(--bg-panel)',
                                                    borderRadius: '10px',
                                                    borderLeft: `5px solid ${getEventColor(event.type)}`,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', background: getEventColor(event.type), color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
                                                                {event.type === 'practice' ? 'Practice' : event.type === 'game' ? `${event.level} Game` : 'Event'}
                                                            </span>
                                                            {event.autoPopulated && <span style={{ fontSize: '0.75em', color: 'var(--text-secondary)', fontStyle: 'italic' }}>(Auto)</span>}
                                                        </div>

                                                        {event.type === 'practice' && (
                                                            <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                                                {event.start} - {event.end} {event.notes && <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>| {event.notes}</span>}
                                                            </div>
                                                        )}

                                                        {event.type === 'game' && (
                                                            <div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                                                    {event.isHome ? '🏠 Home' : '🚌 Away'} vs {event.opponent}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                                                    <span>⏱️ Kickoff: <strong>{event.kickoff}</strong></span>
                                                                    {!event.isHome && <span>🚌 Bus: <strong>{event.busTime}</strong></span>}
                                                                    {!event.isHome && event.dismissalTime && <span style={{ color: '#f59e0b', fontWeight: '800' }}>⚠️ Dismiss: {event.dismissalTime}</span>}
                                                                    <span style={{ color: 'var(--text-secondary)' }}>📍 {event.location}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                    <span style={{ fontSize: '0.8rem', background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px' }}>👕 {event.uniforms?.jersey} Jersey</span>
                                                                    <span style={{ fontSize: '0.8rem', background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px' }}>👖 {event.uniforms?.pants} Pants</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {event.type === 'custom' && (
                                                            <div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{event.title}</div>
                                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                                    ⏰ {event.time} | 📍 {event.location}
                                                                </div>
                                                                {event.notes && <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{event.notes}</div>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!event.autoPopulated && !isLocked && (
                                                        <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn" onClick={() => setEditingEvent({ day, eventId: event.id, event })} style={{ padding: '4px 8px' }}>
                                                                <Icon name="Edit" size={14} />
                                                            </button>
                                                            <button className="btn" style={{ padding: '4px 8px', color: '#ef4444' }} onClick={() => {
                                                                if (confirm('Delete event?')) {
                                                                    const newSchedule = { ...overview.dailySchedule };
                                                                    newSchedule[day].events = newSchedule[day].events.filter(e => e.id !== event.id);
                                                                    onUpdateWeek(week.id, 'overview', { ...overview, dailySchedule: newSchedule });
                                                                }
                                                            }}>
                                                                <Icon name="Trash2" size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {hasMeal && (
                                                <div style={{ padding: '1rem', background: '#fefce8', borderRadius: '10px', borderLeft: '5px solid #eab308' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', background: '#eab308', color: 'white', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', marginBottom: '0.5rem' }}>
                                                        Team Meal
                                                    </div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                                        🍴 {overview.meal.time} {overview.meal.host && <span style={{ fontWeight: 'normal', color: '#854d0e', marginLeft: '0.5rem' }}>@ {overview.meal.host}</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {(addEventModal || editingEvent) && (
                        <EventModal
                            day={addEventModal?.day || editingEvent?.day}
                            event={editingEvent?.event}
                            onClose={() => { setAddEventModal(null); setEditingEvent(null); }}
                            onSave={(data) => {
                                const newSchedule = { ...overview.dailySchedule };
                                if (editingEvent) {
                                    const idx = newSchedule[editingEvent.day].events.findIndex(e => e.id === editingEvent.eventId);
                                    newSchedule[editingEvent.day].events[idx] = { ...data, id: editingEvent.eventId };
                                } else {
                                    newSchedule[addEventModal.day].events.push({ ...data, id: `manual-${Date.now()}` });
                                }
                                onUpdateWeek(week.id, 'overview', { ...overview, dailySchedule: newSchedule });
                                setAddEventModal(null);
                                setEditingEvent(null);
                            }}
                        />
                    )}
                </div>
            );
        };

        const EventModal = ({ day, event, onClose, onSave }) => {
            const [type, setType] = useState(event?.type || 'game');
            const [level, setLevel] = useState(event?.level || 'JV');
            const [isHome, setIsHome] = useState(event?.isHome !== undefined ? event.isHome : true);
            const [opponent, setOpponent] = useState(event?.opponent || '');
            const [kickoff, setKickoff] = useState(event?.kickoff || '');
            const [busTime, setBusTime] = useState(event?.busTime || '');
            const [dismissalTime, setDismissalTime] = useState(event?.dismissalTime || '');
            const [location, setLocation] = useState(event?.location || '');
            const [uniforms, setUniforms] = useState(event?.uniforms || { jersey: 'White', pants: 'Red' });
            const [title, setTitle] = useState(event?.title || '');
            const [time, setTime] = useState(event?.time || '');
            const [notes, setNotes] = useState(event?.notes || '');

            return (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>{event ? 'Edit' : 'Add'} Event for {day.toUpperCase()}</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Type</label>
                            <div className="btn-group">
                                <button className={`btn ${type === 'game' ? 'btn-primary' : ''}`} onClick={() => setType('game')}>Game</button>
                                <button className={`btn ${type === 'custom' ? 'btn-primary' : ''}`} onClick={() => setType('custom')}>Custom</button>
                            </div>
                        </div>

                        {type === 'game' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label className="form-label">Level</label>
                                        <select className="form-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                                            <option>JV</option>
                                            <option>JV2</option>
                                            <option>Varsity</option>
                                            <option>Freshman</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Location Type</label>
                                        <div className="btn-group">
                                            <button className={`btn ${isHome ? 'btn-primary' : ''}`} onClick={() => setIsHome(true)}>Home</button>
                                            <button className={`btn ${!isHome ? 'btn-primary' : ''}`} onClick={() => setIsHome(false)}>Away</button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Opponent</label>
                                    <input className="form-input" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Central High" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label className="form-label">Kickoff</label>
                                        <input className="form-input" value={kickoff} onChange={(e) => setKickoff(e.target.value)} placeholder="6:00 PM" />
                                    </div>
                                    <div>
                                        <label className="form-label">Location</label>
                                        <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Stadium" />
                                    </div>
                                </div>
                                {!isHome && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label className="form-label">Bus Departure</label>
                                            <input className="form-input" value={busTime} onChange={(e) => setBusTime(e.target.value)} placeholder="4:30 PM" />
                                        </div>
                                        <div>
                                            <label className="form-label">Dismissal</label>
                                            <input className="form-input" value={dismissalTime} onChange={(e) => setDismissalTime(e.target.value)} placeholder="2:30 PM" />
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label className="form-label">Jersey</label>
                                        <select className="form-select" value={uniforms.jersey} onChange={(e) => setUniforms({ ...uniforms, jersey: e.target.value })}>
                                            <option>White</option><option>Red</option><option>Black</option><option>Grey</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Pants</label>
                                        <select className="form-select" value={uniforms.pants} onChange={(e) => setUniforms({ ...uniforms, pants: e.target.value })}>
                                            <option>White</option><option>Red</option><option>Black</option><option>Grey</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {type === 'custom' && (
                            <>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Title</label>
                                    <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="High-Five Friday" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label className="form-label">Time</label>
                                        <input className="form-input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="7:30 AM" />
                                    </div>
                                    <div>
                                        <label className="form-label">Location</label>
                                        <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Elementary" />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => onSave({ type, level, isHome, opponent, kickoff, busTime, dismissalTime, location, uniforms, title, time, notes })}>Save</button>
                        </div>
                    </div>
                </div>
            );
        };








        const SchoolSetupWizard = ({ schoolId, onComplete }) => {
            const [localSchoolName, setLocalSchoolName] = useState('');
            const [localMascot, setLocalMascot] = useState('🦅');
            const [primaryColor, setPrimaryColor] = useState('#0ea5e9'); // Default Blue
            const [isInitializing, setIsInitializing] = useState(false);

            const handleInitialize = async () => {
                if (!localSchoolName) return;

                // Silent Wipe (No Confirm)

                setIsInitializing(true);

                try {
                    const userId = window.auth.currentUser.uid;
                    const userRef = window.db.collection('users').doc(userId);

                    // 1. WIPE LOCAL DATA (Clean Slate)
                    const keysToWipe = [
                        'oc-dashboard-roster', 'oc-dashboard-plays', 'oc-dashboard-staff',
                        'oc-dashboard-depthchart', 'oc-dashboard-master-tasks', 'attendance_log',
                        'oc-dashboard-equipment-inventory', 'oc-dashboard-equipment-checkouts',
                        'formationLayouts', 'oc-dashboard-ratings', 'oc-dashboard-game-grades', 'oc-dashboard-summer-comp',
                        'oc-dashboard-scouting', 'oc-dashboard-equipment-issuance', 'oc-dashboard-equipment-wishlist',
                        'athlete_assessments', 'oc-dashboard-formations', 'oc-dashboard-zone-philosophies',
                        'oc-dashboard-custom-focus', 'oc-dashboard-duties', 'oc-dashboard-metrics',
                        'fatigue-thresholds', 'position-fatigue-values', 'program_budget_data', 'program_onboarding_data',
                        'oc-dashboard-position-names', 'player_daily_connections', 'player_weight_logs', 'staff_role_tasks',
                        'rooski_ol_library', 'oc-dashboard-weeks',
                        'oc-dashboard-game-plans', 'oc-dashboard-scripts',
                        'oc-dashboard-logo', 'oc-dashboard-theme', 'oc-dashboard-accent',
                        'hc_school_billing', 'hc_school_id', 'hc_school_name', 'hc-active-year', 'hc-visible-features'
                    ];

                    keysToWipe.forEach(key => localStorage.removeItem(key));

                    // 2. SET DEFAULTS
                    localStorage.setItem('oc-dashboard-accent', primaryColor);
                    localStorage.setItem('hc_school_id', schoolId); // Bind immediately

                    // 3. UPDATE FIRESTORE (School Doc)
                    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                    // 4. Create School Document
                    await window.db.collection('schools').doc(schoolId).set({
                        name: localSchoolName,
                        mascot: localMascot,
                        joinCode: joinCode, // NEW: Join Code for onboarding
                        primaryColor: primaryColor,
                        initialized: true,
                        createdAt: new Date().toISOString(),
                        createdBy: window.auth.currentUser.email,
                        roster: [], // Explicit empty
                        staff: [], // Explicit empty
                        plays: [], // Explicit empty
                        billing: {
                            plan: 'trial',
                            status: 'active',
                            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            promoCode: null,
                            subscriptionEndsAt: null,
                            features: {}
                        }
                    });

                    // 4. CRITICAL: UPDATE USER PROFILE & WIPE PERSONAL DATA
                    // This ensures loadUserDataFromFirestore switches to School Mode
                    // and doesn't fall back to old personal data.
                    await userRef.set({
                        schoolId: schoolId, // LINK USER TO SCHOOL
                        // Wipe potential leaky fields from personal doc
                        roster: firebase.firestore.FieldValue.delete(),
                        plays: firebase.firestore.FieldValue.delete(),
                        staff: firebase.firestore.FieldValue.delete(),
                        weeks: firebase.firestore.FieldValue.delete(),
                        inventory: firebase.firestore.FieldValue.delete(),
                        attendance: firebase.firestore.FieldValue.delete(),

                        settings: {
                            activeYear: '2025',
                            theme: 'dark', // Reset theme
                            accentColor: primaryColor
                        }
                    }, { merge: true });

                    // 4b. CREATE MEMBERSHIP (Explicit)
                    await window.db.collection('users').doc(userId).collection('memberships').doc(schoolId).set({
                        role: 'admin',
                        joinedAt: new Date().toISOString(),
                        status: 'active'
                    });

                    // 5. COMPLETE
                    // alert(`Welcome to ${localSchoolName}! Your workspace is ready.`); // Removed explicit alert to be faster
                    onComplete();

                } catch (err) {
                    console.error("Error initializing school:", err);
                    alert("Failed to initialize school: " + err.message);
                    setIsInitializing(false);
                }
            };

            return (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: '#0f172a', color: 'white', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#1e293b', padding: '2rem', borderRadius: '12px',
                        maxWidth: '500px', width: '90%', border: '1px solid #334155',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome, Coach!</h2>
                            <p style={{ color: '#94a3b8' }}>Let's set up your new school workspace.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>School Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Central High School"
                                    value={localSchoolName}
                                    onChange={(e) => setLocalSchoolName(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Primary Color</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {[
                                        '#0ea5e9', // Sky Blue
                                        '#ef4444', // Red
                                        '#22c55e', // Green
                                        '#eab308', // Yellow
                                        '#f97316', // Orange
                                        '#a855f7', // Purple
                                        '#ec4899', // Pink
                                        '#64748b', // Slate
                                        '#000000', // Black
                                        '#1e1b4b'  // Navy
                                    ].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setPrimaryColor(color)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: color,
                                                border: primaryColor === color ? '3px solid white' : '1px solid rgba(255,255,255,0.2)',
                                                cursor: 'pointer',
                                                transform: primaryColor === color ? 'scale(1.1)' : 'scale(1)',
                                                transition: 'all 0.2s',
                                                boxShadow: primaryColor === color ? `0 0 10px ${color}` : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleInitialize}
                                disabled={!localSchoolName || isInitializing}
                                style={{
                                    marginTop: '1rem', padding: '1rem',
                                    fontSize: '1.1rem', justifyContent: 'center',
                                    background: primaryColor,
                                    opacity: (!localSchoolName || isInitializing) ? 0.5 : 1
                                }}
                            >
                                {isInitializing ? 'Setting up...' : 'Create New School'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        };


        const SchoolSwitcher = ({ userId, currentSchoolId }) => {
            const [memberships, setMemberships] = useState([]);
            const [schools, setSchools] = useState({});
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                const fetchMemberships = async () => {
                    if (!userId) return;
                    try {
                        const memSnapshot = await window.db.collection('users').doc(userId).collection('memberships').get();
                        if (memSnapshot.empty) {
                            setLoading(false);
                            return;
                        }

                        const mems = memSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setMemberships(mems);

                        // Fetch names for these schools
                        const schoolIds = mems.map(m => m.id);
                        // Firestore "in" query limited to 10, split if needed but assuming < 10 for now
                        if (schoolIds.length > 0) {
                            const schoolsMap = {};
                            // Use Promise.all for simplicity over 'in' query limitations if list is small
                            await Promise.all(schoolIds.map(async (sid) => {
                                const doc = await window.db.collection('schools').doc(sid).get();
                                if (doc.exists) schoolsMap[sid] = doc.data().name;
                                else schoolsMap[sid] = "Unknown School";
                            }));
                            setSchools(schoolsMap);
                        }
                    } catch (err) {
                        console.error("Error loading memberships:", err);
                    }
                    setLoading(false);
                };
                fetchMemberships();
            }, [userId]);

            if (loading) return <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Loading schools...</div>;
            if (memberships.length <= 1) return null; // Only show if multiple schools

            return (
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Switch School</label>
                    <select
                        className="form-select"
                        value={currentSchoolId || ''}
                        onChange={(e) => {
                            const newId = e.target.value;
                            if (newId && newId !== currentSchoolId) {
                                if (confirm(`Switch to ${schools[newId]}?`)) {
                                    localStorage.setItem('hc_school_id', newId);
                                    // Ensure clean slate for new context
                                    localStorage.removeItem('oc-dashboard-roster');
                                    localStorage.removeItem('oc-dashboard-plays');
                                    localStorage.removeItem('oc-dashboard-staff');
                                    window.location.reload();
                                }
                            }
                        }}
                        style={{ width: '100%', fontSize: '0.85rem', padding: '0.25rem', marginTop: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        {memberships.map(m => (
                            <option key={m.id} value={m.id}>
                                {schools[m.id] || m.id} ({m.role})
                            </option>
                        ))}
                    </select>
                </div>
            );
        };

        const getSchoolPlan = (school, user) => {
            if (!school) return 'FREE';

            // 1. Site Admin Bypass
            // Hardcoded for safety across entire app context
            const SITE_ADMINS = ['matthewfinn14@gmail.com'];
            if (user && user.email && SITE_ADMINS.includes(user.email.toLowerCase())) {
                return 'ALL_ACCESS';
            }

            const billing = school.billing || {};

            // Default to 'free' if no plan set, BUT if it is a legacy school without billing,
            // we might want to grandfather them or default to trial? 
            // For now, let's assume default is FREE unless migrated.
            const plan = billing.plan || 'free';
            const now = new Date();

            // 2. Trial Check
            if (plan === 'trial') {
                if (billing.trialEndsAt && new Date(billing.trialEndsAt) > now) {
                    return 'PREMIUM_TRIAL';
                }
                return 'FREE'; // Trial Expired
            }

            // 3. Premium Check
            if (plan === 'premium') {
                // If subscription has an end date (e.g. from promo), check it
                if (billing.subscriptionEndsAt && new Date(billing.subscriptionEndsAt) <= now) {
                    return 'FREE'; // Expired
                }
                return 'PREMIUM';
            }

            // 4. All Access (Configured manually)
            if (plan === 'all_access') return 'ALL_ACCESS';

            return 'FREE';
        };

        const LEGACY_PROGRAM_RECORDS = {
            'Squat': {
                '320+': {
                    'PR': { value: '--', holder: '-', year: '-' }
                },
                '310-319': {
                    '12': { value: '470', holder: 'David Downs', year: '8/20' },
                    'PR': { value: '470', holder: 'David Downs', year: '8/20' }
                },
                '300-309': {
                    '12': { value: '480', holder: 'Tyler Heithoff', year: '7/22' },
                    '11': { value: '465', holder: 'Tyler Heithoff', year: '5/22' },
                    '10': { value: '350', holder: 'Tyler Heithoff', year: '5/21' },
                    '9': { value: '240', holder: 'Patrick Gomez', year: '5/22' },
                    'PR': { value: '480', holder: 'Tyler Heithoff', year: '7/22' }
                },
                '290-299': {
                    '12': { value: '315', holder: 'Colin Hansen', year: '8/21' },
                    '11': { value: '280', holder: 'Colin Hansen', year: '5/21' },
                    '10': { value: '315', holder: 'Tyler Heithoff', year: '2/21' },
                    '9': { value: '220', holder: 'Patrick Gomez', year: '11/21' },
                    'PR': { value: '315', holder: 'C. Hansen / T. Heithoff', year: '2021' }
                },
                '280-289': {
                    '12': { value: '355', holder: 'Carson Barber', year: '7/24' },
                    '11': { value: '455', holder: 'Aaron Peyton', year: '5/23' },
                    '10': { value: '350', holder: 'Carson Barber', year: '5/23' },
                    'PR': { value: '455', holder: 'Aaron Peyton', year: '5/23' }
                },
                '270-279': {
                    '12': { value: '455', holder: 'Aaron Peyton', year: '7/23' },
                    '10': { value: '315', holder: 'Carson Barber', year: '10/22' },
                    '9': { value: '270', holder: 'Carson Barber', year: '5/22' },
                    'PR': { value: '455', holder: 'Aaron Peyton', year: '7/23' }
                },
                '260-269': {
                    '11': { value: '415', holder: 'Aaron Peyton', year: '10/22' },
                    '9': { value: '250', holder: 'Carson Barber', year: '2/22' },
                    'PR': { value: '415', holder: 'Aaron Peyton', year: '10/22' }
                },
                '250-259': {
                    '11': { value: '450', holder: 'Record Holder', year: '5/24' },
                    '10': { value: '365', holder: 'Aaron Peyton', year: '5/22' },
                    '9': { value: '230', holder: 'Carson Barber', year: '11/21' },
                    'PR': { value: '450', holder: 'Record Holder', year: '5/24' }
                },
                '240-249': {
                    '12': { value: '405', holder: 'W. Licht, T. Tjaden, T. Peterson', year: '23/24' },
                    '11': { value: '415', holder: 'Record Holder', year: '7/23' },
                    '10': { value: '380', holder: 'Record Holder', year: '2/23' },
                    '9': { value: '225', holder: 'Jackson Mohr', year: '2/23' },
                    'PR': { value: '415', holder: 'Record Holder', year: '7/23' }
                },
                '230-239': {
                    '12': { value: '400', holder: 'Wes Hansen', year: '7/24' },
                    '11': { value: '425', holder: 'Wes Hansen', year: '5/24' },
                    '10': { value: '335', holder: 'Aaron Peyton', year: '2/22' },
                    'PR': { value: '425', holder: 'Wes Hansen', year: '5/24' }
                },
                '220-229': {
                    '12': { value: '470', holder: 'Zach Twedt', year: '8/20' },
                    '11': { value: '445', holder: 'Charlie Watts', year: '2/24' },
                    '10': { value: '340', holder: 'Wes Hansen', year: '5/23' },
                    '9': { value: '285', holder: 'Blake Nelsen', year: '2/23' },
                    'PR': { value: '470', holder: 'Zach Twedt', year: '8/20' }
                },
                '210-219': {
                    '12': { value: '460', holder: 'Garret Nerem', year: '7/24' },
                    '11': { value: '425', holder: 'Garrett Nerem', year: '5/24' },
                    '10': { value: '335', holder: 'Tristan Peterson', year: '5/23' },
                    '9': { value: '340', holder: 'Jake Rogers', year: '5/23' },
                    'PR': { value: '460', holder: 'Garret Nerem', year: '7/24' }
                },
                '200-209': {
                    '12': { value: '280', holder: 'Parker Watts', year: '8/21' },
                    '11': { value: '415', holder: 'C. Watts / G. Nerem', year: '23/24' },
                    '10': { value: '425', holder: 'Fiston Carlson', year: '7/24' },
                    '9': { value: '335', holder: 'Jake Rogers', year: '2/23' },
                    'PR': { value: '425', holder: 'Fiston Carlson', year: '7/24' }
                },
                '190-199': {
                    '12': { value: '285', holder: 'Logan Schnurr', year: '8/21' },
                    '11': { value: '400', holder: 'Cael Vermeer', year: '7/24' },
                    '10': { value: '350', holder: 'Cael Vermeer', year: '7/23' },
                    '9': { value: '430', holder: 'Fiston Carlson', year: '5/24' },
                    'PR': { value: '430', holder: 'Fiston Carlson', year: '5/24' }
                },
                '180-189': {
                    '12': { value: '380', holder: 'Sam Knoll', year: '7/24' },
                    '11': { value: '440', holder: 'Fiston Carlson', year: '7/25' },
                    '10': { value: '355', holder: 'Ben Licht', year: '7/24' },
                    '9': { value: '360', holder: 'Fiston Carlson', year: '7/23' },
                    'PR': { value: '440', holder: 'Fiston Carlson', year: '7/25' }
                },
                '170-179': {
                    '12': { value: '355', holder: 'D. Lettow / H. Johnson', year: '22/23' },
                    '11': { value: '340', holder: 'Tyler Lambert', year: '7/25' },
                    '10': { value: '350', holder: 'Isaac Miskell', year: '7/24' },
                    '9': { value: '345', holder: 'Isaac Miskell', year: '2/24' },
                    'PR': { value: '355', holder: 'D. Lettow / H. Johnson', year: '22/23' }
                },
                '160-169': {
                    '12': { value: '320', holder: 'Heston McIlrath', year: '7/24' },
                    '11': { value: '350', holder: 'Sam Knoll', year: '7/23' },
                    '10': { value: '335', holder: 'Cooper Triggs', year: '7/24' },
                    '9': { value: '300', holder: 'Ben Licht', year: '10/23' },
                    'PR': { value: '350', holder: 'Sam Knoll', year: '7/23' }
                },
                '150-159': {
                    '12': { value: '315', holder: 'G. Carpenter / C. Long', year: '22/25' },
                    '11': { value: '345', holder: 'Cody Long', year: '7/24' },
                    '10': { value: '330', holder: 'Cody Long', year: '11/23' },
                    '9': { value: '355', holder: 'Ben Mazyck', year: '10/23' },
                    'PR': { value: '355', holder: 'Ben Mazyck', year: '10/23' }
                },
                '140-149': {
                    '12': { value: '290', holder: 'C. Diehl / J. Martin', year: '21/22' },
                    '11': { value: '275', holder: 'Blake Larson', year: '7/24' },
                    '10': { value: '315', holder: 'Cody Long', year: '7/23' },
                    '9': { value: '305', holder: 'Ben Mazyck', year: '7/23' },
                    'PR': { value: '315', holder: 'Cody Long', year: '7/23' }
                },
                '130-139': {
                    '11': { value: '255', holder: 'Jake Knoll', year: '7/25' },
                    '10': { value: '275', holder: 'Jake Knoll', year: '7/24' },
                    '9': { value: '270', holder: 'C. Long / B. Loof', year: '22/23' },
                    'PR': { value: '275', holder: 'Jake Knoll', year: '7/24' }
                },
                '120-129': {
                    '11': { value: '215', holder: 'Noah Healy', year: '7/25' },
                    '9': { value: '260', holder: 'Brady Long', year: '7/24' },
                    'PR': { value: '260', holder: 'Brady Long', year: '7/24' }
                },
                '110-119': {
                    '11': { value: '180', holder: 'Brayden Kilstofte', year: '11/21' },
                    '9': { value: '195', holder: 'B. Larson / M. Dahlsten', year: '23/25' },
                    'PR': { value: '195', holder: 'B. Larson / M. Dahlsten', year: '23/25' }
                },
                '100-109': {
                    '11': { value: '160', holder: 'Brayden Kilstofte', year: '8/21' },
                    '9': { value: '185', holder: 'Blake Larson', year: '10/22' },
                    'PR': { value: '185', holder: 'Blake Larson', year: '10/22' }
                }
            },
            'Bench': {
                '320+': {
                    'PR': { value: '--', holder: '-', year: '-' }
                },
                '310-319': {
                    '12': { value: '295', holder: 'David Downs', year: '8/20' },
                    'PR': { value: '295', holder: 'David Downs', year: '8/20' }
                },
                '300-309': {
                    '12': { value: '250', holder: 'Tyler Heithoff', year: '7/22' },
                    '11': { value: '250', holder: 'Tyler Heithoff', year: '5/22' },
                    '9': { value: '170', holder: 'Patrick Gomez', year: '5/22' },
                    'PR': { value: '250', holder: 'Tyler Heithoff', year: '2022' }
                },
                '290-299': {
                    '12': { value: '175', holder: 'Colin Hansen', year: '8/21' },
                    '11': { value: '165', holder: 'Colin Hansen', year: '5/21' },
                    '10': { value: '185', holder: 'Tyler Heithoff', year: '2/21' },
                    '9': { value: '155', holder: 'Patrick Gomez', year: '11/21' },
                    'PR': { value: '185', holder: 'Tyler Heithoff', year: '2/21' }
                },
                '280-289': {
                    '12': { value: '220', holder: 'Carson Barber', year: '7/24' },
                    '11': { value: '220', holder: 'Carson Barber', year: '7/23' },
                    '10': { value: '215', holder: 'Carson Barber', year: '5/23' },
                    'PR': { value: '220', holder: 'Carson Barber', year: '23/24' }
                },
                '270-279': {
                    '12': { value: '245', holder: 'Aaron Peyton', year: '7/23' },
                    '10': { value: '195', holder: 'Carson Barber', year: '10/22' },
                    '9': { value: '175', holder: 'Carson Barber', year: '5/22' },
                    'PR': { value: '245', holder: 'Aaron Peyton', year: '7/23' }
                },
                '260-269': {
                    '11': { value: '245', holder: 'Aaron Peyton', year: '10/22' },
                    '10': { value: '155', holder: 'Carson Barber', year: '2/22' },
                    'PR': { value: '245', holder: 'Aaron Peyton', year: '10/22' }
                },
                '250-259': {
                    '11': { value: '245', holder: 'Aaron Peyton', year: '7/22' },
                    '10': { value: '245', holder: 'Aaron Peyton', year: '5/22' },
                    '9': { value: '145', holder: 'Carson Barber', year: '11/21' },
                    'PR': { value: '245', holder: 'Aaron Peyton', year: '2022' }
                },
                '240-249': {
                    '12': { value: '280', holder: 'William Licht', year: '7/23' },
                    '11': { value: '255', holder: 'Thomas Tjaden', year: '5/23' },
                    '10': { value: '215', holder: 'Aaron Peyton', year: '11/21' },
                    '9': { value: '170', holder: 'Jackson Mohr', year: '10/22' },
                    'PR': { value: '280', holder: 'William Licht', year: '7/23' }
                },
                '230-239': {
                    '12': { value: '265', holder: 'Blake Nelsen', year: '8/25' },
                    '11': { value: '270', holder: 'William Licht', year: '5/23' },
                    '10': { value: '215', holder: 'Record Holder', year: '10/22' },
                    'PR': { value: '270', holder: 'William Licht', year: '5/23' }
                },
                '220-229': {
                    '12': { value: '315', holder: 'Jimmy Philipsen', year: '8/20' },
                    '11': { value: '280', holder: 'Charlie Watts', year: '2/24' },
                    '10': { value: '190', holder: 'Wes Hansen', year: '5/23' },
                    '9': { value: '185', holder: 'Aaron Peyton', year: '5/21' },
                    'PR': { value: '315', holder: 'Jimmy Philipsen', year: '8/20' }
                },
                '210-219': {
                    '12': { value: '255', holder: 'Garrett Nerem', year: '7/24' },
                    '11': { value: '300', holder: 'Chance Georgius', year: '7/25' },
                    '10': { value: '250', holder: 'William Licht', year: '5/22' },
                    '9': { value: '245', holder: 'Jake Rogers', year: '5/23' },
                    'PR': { value: '300', holder: 'Chance Georgius', year: '7/25' }
                },
                '200-209': {
                    '12': { value: '230', holder: 'Jonovan Wilkinson', year: '7/23' },
                    '11': { value: '270', holder: 'Charlie Watts', year: '7/23' },
                    '10': { value: '235', holder: 'William Licht', year: '2/22' },
                    '9': { value: '225', holder: 'Blake Winecoff', year: '7/25' },
                    'PR': { value: '270', holder: 'Charlie Watts', year: '7/23' }
                },
                '190-199': {
                    '12': { value: '170', holder: 'Logan Schnurr', year: '8/21' },
                    '11': { value: '210', holder: 'Jonovan Wilkinson', year: '10/22' },
                    '10': { value: '270', holder: 'Charlie Watts', year: '5/23' },
                    '9': { value: '305', holder: 'Fiston Carlson', year: '2/24' },
                    'PR': { value: '305', holder: 'Fiston Carlson', year: '2/24' }
                },
                '180-189': {
                    '12': { value: '280', holder: 'Christian Eslick', year: '7/22' },
                    '11': { value: '325', holder: 'Fiston Carlson', year: '7/25' },
                    '10': { value: '215', holder: 'G. Nerem / C. Barber', year: '23/24' },
                    '9': { value: '255', holder: 'Fiston Carlson', year: '7/23' },
                    'PR': { value: '325', holder: 'Fiston Carlson', year: '7/25' }
                },
                '170-179': {
                    '12': { value: '220', holder: 'Jackson Sterle', year: '8/20' },
                    '11': { value: '245', holder: 'Ben Mazyck', year: '7/25' },
                    '10': { value: '215', holder: 'Isaac Miskell', year: '7/24' },
                    '9': { value: '210', holder: 'Ben Licht', year: '2/24' },
                    'PR': { value: '245', holder: 'Ben Mazyck', year: '7/25' }
                },
                '160-169': {
                    '12': { value: '235', holder: 'Heston McIlrath', year: '7/24' },
                    '11': { value: '200', holder: 'Q. Ante / D. Lettow', year: '21/21' },
                    '10': { value: '235', holder: 'Sam Knoll', year: '2/23' },
                    '9': { value: '195', holder: 'S. Knoll / B. Licht', year: '22/23' },
                    'PR': { value: '235', holder: 'H. McIlrath / S. Knoll', year: '23/24' }
                },
                '150-159': {
                    '12': { value: '210', holder: 'Cody Long', year: '7/25' },
                    '11': { value: '205', holder: 'Brady Lettow', year: '7/23' },
                    '10': { value: '235', holder: 'Ben Mazyck', year: '7/24' },
                    '9': { value: '225', holder: 'Ben Mazyck', year: '10/23' },
                    'PR': { value: '235', holder: 'Ben Mazyck', year: '7/24' }
                },
                '140-149': {
                    '12': { value: '185', holder: 'John Martin', year: '7/22' },
                    '11': { value: '190', holder: 'Blake Larson', year: '7/24' },
                    '10': { value: '200', holder: 'Brody Kilstofte', year: '7/25' },
                    '9': { value: '200', holder: 'Ben Mazyck', year: '7/23' },
                    'PR': { value: '200', holder: 'B. Kilstofte / B. Mazyck', year: '23/25' }
                },
                '130-139': {
                    '11': { value: '185', holder: 'Jake Knoll', year: '7/25' },
                    '10': { value: '190', holder: 'Jake Knoll', year: '7/24' },
                    '9': { value: '160', holder: 'Blake Loof', year: '11/23' },
                    'PR': { value: '190', holder: 'Jake Knoll', year: '7/24' }
                },
                '120-129': {
                    '11': { value: '160', holder: 'Noah Healy', year: '7/25' },
                    '10': { value: '185', holder: 'Jake Knoll', year: '7/23' },
                    'PR': { value: '185', holder: 'Jake Knoll', year: '7/23' }
                },
                '110-119': {
                    '11': { value: '120', holder: 'Brayden Kilstofte', year: '11/21' },
                    '10': { value: '160', holder: 'Max Dahlsten', year: '7/25' },
                    'PR': { value: '160', holder: 'Max Dahlsten', year: '7/25' }
                },
                '100-109': {
                    '10': { value: '125', holder: 'Blake Larson', year: '2/23' },
                    'PR': { value: '125', holder: 'Blake Larson', year: '2/23' }
                }
            },
            'Tape Shuttle': {
                '320+': {
                    'PR': { value: '--', holder: '-', year: '-' }
                },
                '310-319': {
                    '12': { value: '59.4', holder: 'David Downs', year: '8/20' },
                    'PR': { value: '59.4', holder: 'David Downs', year: '8/20' }
                },
                '300-309': {
                    '12': { value: '1:05.2', holder: 'Tyler Heithoff', year: '8/22' },
                    '11': { value: '1:08', holder: 'Tyler Heithoff', year: '8/21' },
                    'PR': { value: '1:05.2', holder: 'Tyler Heithoff', year: '8/22' }
                },
                '290-299': {
                    '12': { value: '1:05', holder: 'Colin Hansen', year: '8/21' },
                    '11': { value: '1:05', holder: 'Colin Hansen', year: '8/20' },
                    '10': { value: '68.9', holder: 'Tyler Heithoff', year: '8/20' },
                    'PR': { value: '1:05', holder: 'Colin Hansen', year: '8/21' }
                },
                '280-289': {
                    '12': { value: '59.0', holder: 'Carson Barber', year: '8/24' },
                    'PR': { value: '59.0', holder: 'Carson Barber', year: '8/24' }
                },
                '270-279': {
                    '12': { value: '58.7', holder: 'Jackson Mohr', year: '8/25' },
                    '10': { value: '58.9', holder: 'Carson Barber', year: '8/22' },
                    'PR': { value: '58.7', holder: 'Jackson Mohr', year: '8/25' }
                },
                '260-269': {
                    '11': { value: '59.2', holder: 'Jackson Mohr', year: '8/24' },
                    'PR': { value: '59.2', holder: 'Jackson Mohr', year: '8/24' }
                },
                '250-259': {
                    '11': { value: '51.5', holder: 'Aaron Peyton', year: '8/22' },
                    '10': { value: '1:08', holder: 'Carson Barber', year: '8/21' },
                    'PR': { value: '51.5', holder: 'Aaron Peyton', year: '8/22' }
                },
                '240-249': {
                    '12': { value: '51.6', holder: 'Tristan Peterson', year: '8/24' },
                    '11': { value: '1:00.6', holder: 'Jake Jennings', year: '8/22' },
                    '9': { value: '1:00', holder: 'Jackson Mohr', year: '8/22' },
                    'PR': { value: '51.6', holder: 'Tristan Peterson', year: '8/24' }
                },
                '230-239': {
                    '12': { value: '48.6', holder: 'Blake Nelsen', year: '8/25' },
                    '11': { value: '1:01', holder: 'Nick Stewart', year: '8/21' },
                    '10': { value: '49.4', holder: 'Record Holder', year: '8/22' },
                    'PR': { value: '48.6', holder: 'Blake Nelsen', year: '8/25' }
                },
                '220-229': {
                    '12': { value: '49.3', holder: 'Luke Patton', year: '8/22' },
                    '11': { value: '52.5', holder: 'Blake Nelsen', year: '8/24' },
                    '9': { value: '1:10', holder: 'Aaron Peyton', year: '8/20' },
                    'PR': { value: '49.3', holder: 'Luke Patton', year: '8/22' }
                },
                '210-219': {
                    '11': { value: '49.8', holder: 'Carter Barber', year: '8/25' },
                    '10': { value: '53', holder: 'Luke Patton', year: '8/20' },
                    '9': { value: '1:01', holder: 'B. Nelsen / J. Rogers', year: '8/22' },
                    'PR': { value: '49.8', holder: 'Carter Barber', year: '8/25' }
                },
                '200-209': {
                    '12': { value: '50.1', holder: 'Cael Vermeer', year: '8/25' },
                    '11': { value: '50.8', holder: 'Christian Chelsvig', year: '8/22' },
                    '10': { value: '45.0', holder: 'Fiston Carlson', year: '8/24' },
                    '9': { value: '55.32', holder: 'Blake Winecoff', year: '8/25' },
                    'PR': { value: '45.0', holder: 'Fiston Carlson', year: '8/24' }
                },
                '190-199': {
                    '12': { value: '50.6', holder: 'Logan Schnurr', year: '8/21' },
                    '11': { value: '47.9', holder: 'Cael Vermeer', year: '8/24' },
                    '10': { value: '49.4', holder: 'Nick Butler', year: '8/20' },
                    '9': { value: '1:00.7', holder: 'Jaxson Kadolph', year: '8/20' },
                    'PR': { value: '47.9', holder: 'Cael Vermeer', year: '8/24' }
                },
                '180-189': {
                    '12': { value: '45.4', holder: 'Kale Lande', year: '8/22' },
                    '11': { value: '45.3', holder: 'Cooper Triggs', year: '8/25' },
                    '10': { value: '48.0', holder: 'Carter Barber', year: '8/24' },
                    '9': { value: '52.9', holder: 'Cole Olson', year: '8/20' },
                    'PR': { value: '45.3', holder: 'Cooper Triggs', year: '8/25' }
                },
                '170-179': {
                    '12': { value: '45', holder: 'Will Bunn', year: '8/21' },
                    '11': { value: '44.1', holder: 'Hesston Johnson', year: '8/22' },
                    '10': { value: '46.2', holder: 'Jonovan Wilkinson', year: '8/21' },
                    '9': { value: '47.6', holder: 'Connor Morton', year: '8/21' },
                    'PR': { value: '44.1', holder: 'Hesston Johnson', year: '8/22' }
                },
                '160-169': {
                    '12': { value: '43.8', holder: 'Heston McIlrath', year: '8/24' },
                    '11': { value: '45.9', holder: 'Dillon Lettow', year: '8/21' },
                    '10': { value: '45.5', holder: 'Sam Knoll', year: '8/22' },
                    '9': { value: '51.3', holder: 'Charlie Watts', year: '8/21' },
                    'PR': { value: '43.8', holder: 'Heston McIlrath', year: '8/24' }
                },
                '150-159': {
                    '12': { value: '43.3', holder: 'Cody Long', year: '8/25' },
                    '11': { value: '44.9', holder: 'Gavin Carpenter', year: '8/21' },
                    '10': { value: '44.1', holder: 'Luke Thoreson', year: '8/24' },
                    '9': { value: '46.7', holder: 'Sam Scarrow', year: '8/25' },
                    'PR': { value: '43.3', holder: 'Cody Long', year: '8/25' }
                },
                '140-149': {
                    '12': { value: '45.5', holder: 'Cade Diehl', year: '8/21' },
                    '11': { value: '46.3', holder: 'Blake Larson', year: '8/24' },
                    '10': { value: '46.3', holder: 'Brody Kilstofte', year: '8/25' },
                    '9': { value: '48.1', holder: 'Hesston Johnson', year: '8/20' },
                    'PR': { value: '45.5', holder: 'Cade Diehl', year: '8/21' }
                },
                '130-139': {
                    '11': { value: '45.9', holder: 'Jake Knoll', year: '8/25' },
                    '10': { value: '46.1', holder: 'Brady Long', year: '8/25' },
                    '9': { value: '45.7', holder: 'Myles McIlrath', year: '8/25' },
                    'PR': { value: '45.7', holder: 'Myles McIlrath', year: '8/25' }
                },
                '120-129': {
                    '11': { value: '47.21', holder: 'Noah Healy', year: '8/25' },
                    '10': { value: '45.9', holder: 'Cody Long', year: '8/22' },
                    'PR': { value: '45.9', holder: 'Cody Long', year: '8/22' }
                },
                '110-119': {
                    '10': { value: '50.4', holder: 'Parker Watson', year: '8/25' },
                    'PR': { value: '50.4', holder: 'Parker Watson', year: '8/25' }
                },
                '100-109': {
                    '10': { value: '49.3', holder: 'Brayden Kilstofte', year: '8/21' },
                    '9': { value: '50.2', holder: 'Blake Larson', year: '8/22' },
                    'PR': { value: '49.3', holder: 'Brayden Kilstofte', year: '8/21' }
                }
            },
            '800m': {
                '320+': {
                    'PR': { value: '--', holder: '-', year: '-' }
                },
                '310-319': {
                    '12': { value: '3:53', holder: 'David Downs', year: '8/20' },
                    'PR': { value: '3:53', holder: 'David Downs', year: '8/20' }
                },
                '300-309': {
                    '12': { value: '4:51', holder: 'Tyler Heithoff', year: '8/22' },
                    'PR': { value: '4:51', holder: 'Tyler Heithoff', year: '8/22' }
                },
                '290-299': {
                    '11': { value: '4:18', holder: 'Colin Hansen', year: '8/20' },
                    '10': { value: '4:39', holder: 'Patrick Gomez', year: '8/22' },
                    'PR': { value: '4:18', holder: 'Colin Hansen', year: '8/20' }
                },
                '280-289': {
                    '12': { value: '4:13', holder: 'Ryan Johnson', year: '8/21' },
                    'PR': { value: '4:13', holder: 'Ryan Johnson', year: '8/21' }
                },
                '270-279': {
                    '12': { value: '3:43', holder: 'Jackson Mohr', year: '8/25' },
                    '10': { value: '4:04', holder: 'Carson Barber', year: '8/22' },
                    'PR': { value: '3:43', holder: 'Jackson Mohr', year: '8/25' }
                },
                '260-269': {
                    '11': { value: '4:35', holder: 'Ryan Johnson', year: '8/20' },
                    'PR': { value: '4:35', holder: 'Ryan Johnson', year: '8/20' }
                },
                '250-259': {
                    '11': { value: '3:33', holder: 'Aaron Peyton', year: '8/22' },
                    '10': { value: '3:39', holder: 'Carson Barber', year: '8/21' },
                    'PR': { value: '3:33', holder: 'Aaron Peyton', year: '8/22' }
                },
                '240-249': {
                    '11': { value: '3:40', holder: 'Jake Jennings', year: '8/22' },
                    '10': { value: '4:18', holder: 'Jackson Mohr', year: '8/22' },
                    'PR': { value: '3:40', holder: 'Jake Jennings', year: '8/22' }
                },
                '230-239': {
                    '12': { value: '2:43', holder: 'Blake Nelsen', year: '8/25' },
                    '11': { value: '3:32', holder: 'Nick Stewart', year: '8/21' },
                    '10': { value: '3:27', holder: 'Aaron Peyton', year: '8/21' },
                    'PR': { value: '2:43', holder: 'Blake Nelsen', year: '8/25' }
                },
                '220-229': {
                    '12': { value: '2:25', holder: 'Luke Patton', year: '8/22' },
                    '11': { value: '3:20', holder: 'William Licht', year: '8/22' },
                    '9': { value: '4:36', holder: 'Aaron Peyton', year: '8/20' },
                    'PR': { value: '2:25', holder: 'Luke Patton', year: '8/22' }
                },
                '210-219': {
                    '11': { value: '2:43', holder: 'C. Barber / G. Jeter', year: '8/25' },
                    '10': { value: '2:52', holder: 'Luke Patton', year: '8/20' },
                    '9': { value: '4:05', holder: 'Jake Rogers', year: '8/22' },
                    'PR': { value: '2:43', holder: 'C. Barber / G. Jeter', year: '8/25' }
                },
                '200-209': {
                    '12': { value: '2:34', holder: 'Cael Vermeer', year: '8/25' },
                    '11': { value: '2:54', holder: 'Christian Chelsvig', year: '8/22' },
                    '10': { value: '3:15', holder: 'Nick Stewart', year: '8/21' },
                    '9': { value: '3:35', holder: 'Blake Winecoff', year: '8/25' },
                    'PR': { value: '2:34', holder: 'Cael Vermeer', year: '8/25' }
                },
                '190-199': {
                    '12': { value: '3:08', holder: 'Logan Schnurr', year: '8/21' },
                    '11': { value: '2:40', holder: 'Tucker Hawkins', year: '8/25' },
                    '10': { value: '3:02', holder: 'Nick Butler', year: '8/20' },
                    '9': { value: '3:29', holder: 'Jaxson Kadolph', year: '8/20' },
                    'PR': { value: '2:40', holder: 'Tucker Hawkins', year: '8/25' }
                },
                '180-189': {
                    '12': { value: '2:09', holder: 'Kale Lande', year: '8/22' },
                    '11': { value: '2:31', holder: 'Luke Thoreson', year: '8/25' },
                    '10': { value: '3:02', holder: 'Garrett Nerem', year: '8/22' },
                    '9': { value: '2:52', holder: 'Cael Vermeer', year: '8/22' },
                    'PR': { value: '2:09', holder: 'Kale Lande', year: '8/22' }
                },
                '170-179': {
                    '12': { value: '2:11', holder: 'Dillon Lettow', year: '8/22' },
                    '11': { value: '2:09', holder: 'Kale Lande', year: '8/21' },
                    '10': { value: '2:29', holder: 'Jonovan Wilkinson', year: '8/21' },
                    '9': { value: '2:38', holder: 'Connor Morton', year: '8/21' },
                    'PR': { value: '2:09', holder: 'Kale Lande', year: '8/21' }
                },
                '160-169': {
                    '12': { value: '2:34', holder: 'Matt Phelan', year: '8/21' },
                    '11': { value: '2:19', holder: 'Dillon Lettow', year: '8/21' },
                    '10': { value: '2:15', holder: 'Colin Willis', year: '8/25' },
                    '9': { value: '2:53', holder: 'Garrett Nerem', year: '8/21' },
                    'PR': { value: '2:15', holder: 'Colin Willis', year: '8/25' }
                },
                '150-159': {
                    '12': { value: '2:16', holder: 'Ben Greenfield', year: '8/22' },
                    '11': { value: '2:23', holder: 'Gavin Carpenter', year: '8/21' },
                    '10': { value: '2:20', holder: 'Hesston Johnson', year: '8/21' },
                    '9': { value: '2:45', holder: 'Sam Scarrow', year: '8/25' },
                    'PR': { value: '2:16', holder: 'Ben Greenfield', year: '8/22' }
                },
                '140-149': {
                    '12': { value: '2:15', holder: 'Cade Diehl', year: '8/21' },
                    '11': { value: '2:32', holder: 'Carter Loof', year: '8/20' },
                    '10': { value: '2:30', holder: 'Boaz Clark', year: '8/21' },
                    '9': { value: '2:38', holder: 'Sam Knoll', year: '8/21' },
                    'PR': { value: '2:15', holder: 'Cade Diehl', year: '8/21' }
                },
                '130-139': {
                    '11': { value: '2:26', holder: 'Cade Diehl', year: '8/21' },
                    '10': { value: '2:38', holder: 'Brady Long', year: '8/25' },
                    '9': { value: '2:39', holder: 'Myles McIlrath', year: '8/25' },
                    'PR': { value: '2:26', holder: 'Cade Diehl', year: '8/21' }
                },
                '120-129': {
                    '11': { value: '2:31', holder: 'Noah Healy', year: '8/25' },
                    '10': { value: '2:33', holder: 'Hayden Janssen', year: '8/22' },
                    'PR': { value: '2:31', holder: 'Noah Healy', year: '8/25' }
                },
                '110-119': {
                    '11': { value: '2:43', holder: 'Tristan Anderson', year: '8/21' },
                    '10': { value: '2:42', holder: 'Max Dahlsten', year: '8/25' },
                    'PR': { value: '2:42', holder: 'Max Dahlsten', year: '8/25' }
                },
                '100-109': {
                    '11': { value: '2:28', holder: 'Brayden Kilstofte', year: '8/21' },
                    '9': { value: '2:46', holder: 'Blake Larson', year: '8/22' },
                    'PR': { value: '2:28', holder: 'Brayden Kilstofte', year: '8/21' }
                }
            },
            'Bag Jump': {
                '320+': {
                    'PR': { value: '--', holder: '-', year: '-' }
                },
                '310-319': {
                    '12': { value: '33', holder: 'David Downs', year: '8/20' },
                    'PR': { value: '33', holder: 'David Downs', year: '8/20' }
                },
                '300-309': {
                    '12': { value: '27', holder: 'Tyler Heithoff', year: '8/22' },
                    '11': { value: '27', holder: 'Tyler Heithoff', year: '8/21' },
                    'PR': { value: '27', holder: 'Tyler Heithoff', year: '21/22' }
                },
                '290-299': {
                    '12': { value: '34', holder: 'Colin Hansen', year: '8/21' },
                    '11': { value: '36', holder: 'Colin Hansen', year: '8/20' },
                    '10': { value: '25', holder: 'Tyler Heithoff', year: '8/20' },
                    'PR': { value: '36', holder: 'Colin Hansen', year: '8/20' }
                },
                '280-289': {
                    '12': { value: '43', holder: 'Carson Barber', year: '8/24' },
                    'PR': { value: '43', holder: 'Carson Barber', year: '8/24' }
                },
                '270-279': {
                    '12': { value: '37', holder: 'Jackson Mohr', year: '8/25' },
                    '10': { value: '36', holder: 'Carson Barber', year: '8/22' },
                    'PR': { value: '37', holder: 'Jackson Mohr', year: '8/25' }
                },
                '260-269': {
                    '11': { value: '39', holder: 'Ryan Johnson', year: '8/20' },
                    'PR': { value: '39', holder: 'Ryan Johnson', year: '8/20' }
                },
                '250-259': {
                    '11': { value: '49', holder: 'Aaron Peyton', year: '8/22' },
                    '10': { value: '44', holder: 'Carson Barber', year: '8/21' },
                    'PR': { value: '49', holder: 'Aaron Peyton', year: '8/22' }
                },
                '240-249': {
                    '12': { value: '53', holder: 'Tristan Peterson', year: '8/24' },
                    '11': { value: '44', holder: 'Jake Jennings', year: '8/22' },
                    '9': { value: '38', holder: 'Jackson Mohr', year: '8/22' },
                    'PR': { value: '53', holder: 'Tristan Peterson', year: '8/24' }
                },
                '230-239': {
                    '12': { value: '55', holder: 'Blake Nelsen', year: '8/25' },
                    '11': { value: '44', holder: 'Nick Stewart', year: '8/21' },
                    '10': { value: '50', holder: 'Aaron Peyton', year: '8/21' },
                    'PR': { value: '55', holder: 'Blake Nelsen', year: '8/25' }
                },
                '220-229': {
                    '12': { value: '57', holder: 'Jimmy Philipsen', year: '8/20' },
                    '11': { value: '53', holder: 'Blake Nelsen', year: '8/24' },
                    '9': { value: '43', holder: 'Aaron Peyton', year: '8/20' },
                    'PR': { value: '57', holder: 'Jimmy Philipsen', year: '8/20' }
                },
                '210-219': {
                    '12': { value: '59', holder: 'Garrett Nerem', year: '8/24' },
                    '11': { value: '53', holder: 'C. Barber / C. Georgius', year: '8/25' },
                    '10': { value: '51', holder: 'Luke Patton', year: '8/20' },
                    '9': { value: '52', holder: 'Jake Rogers', year: '8/22' },
                    'PR': { value: '59', holder: 'Garrett Nerem', year: '8/24' }
                },
                '200-209': {
                    '12': { value: '51', holder: 'Parker Watts', year: '8/21' },
                    '11': { value: '55', holder: 'Christian Chelsvig', year: '8/22' },
                    '10': { value: '53', holder: 'Thomas Tjaden', year: '8/21' },
                    '9': { value: '46', holder: 'Blake Winecoff', year: '8/25' },
                    'PR': { value: '55', holder: 'Christian Chelsvig', year: '8/22' }
                },
                '190-199': {
                    '12': { value: '51', holder: 'Logan Schnurr', year: '8/21' },
                    '11': { value: '54', holder: 'Nick Butler', year: '8/21' },
                    '10': { value: '54', holder: 'Charlie Watts', year: '8/22' },
                    '9': { value: '41', holder: 'Jaxson Kadolph', year: '8/20' },
                    'PR': { value: '54', holder: 'N. Butler / C. Watts', year: '21/22' }
                },
                '180-189': {
                    '12': { value: '62', holder: 'Sam Knoll', year: '8/24' },
                    '11': { value: '61', holder: 'Luke Thoreson', year: '8/25' },
                    '10': { value: '56', holder: 'C. Chelsvig / C. Barber', year: '21/24' },
                    '9': { value: '47', holder: 'Cael Vermeer', year: '8/22' },
                    'PR': { value: '62', holder: 'Sam Knoll', year: '8/24' }
                },
                '170-179': {
                    '12': { value: '64', holder: 'Adam McIlrath', year: '8/20' },
                    '11': { value: '63', holder: 'Hesston Johnson', year: '8/22' },
                    '10': { value: '58', holder: 'Jonovan Wilkinson', year: '8/21' },
                    '9': { value: '61', holder: 'Connor Morton', year: '8/21' },
                    'PR': { value: '64', holder: 'Adam McIlrath', year: '8/20' }
                },
                '160-169': {
                    '12': { value: '66', holder: 'Heston McIlrath', year: '8/24' },
                    '11': { value: '64', holder: 'Aiden Frey', year: '8/25' },
                    '10': { value: '56', holder: 'K. Lande / C. Willis', year: '20/25' },
                    '9': { value: '59', holder: 'Charlie Watts', year: '8/21' },
                    'PR': { value: '66', holder: 'Heston McIlrath', year: '8/24' }
                },
                '150-159': {
                    '12': { value: '65', holder: 'Cody Long', year: '8/25' },
                    '11': { value: '62', holder: 'Cody Long', year: '8/24' },
                    '10': { value: '62', holder: 'Hesston Johnson', year: '8/21' },
                    '9': { value: '60', holder: 'Sam Scarrow', year: '8/25' },
                    'PR': { value: '65', holder: 'Cody Long', year: '8/25' }
                },
                '140-149': {
                    '12': { value: '64', holder: 'Cade Diehl', year: '8/22' },
                    '11': { value: '64', holder: 'Riley Larson', year: '8/22' },
                    '10': { value: '62', holder: 'Jake Berggren', year: '8/22' },
                    '9': { value: '60', holder: 'H. McIlrath / H. Johnson', year: '20/21' },
                    'PR': { value: '64', holder: 'C. Diehl / R. Larson', year: '2022' }
                },
                '130-139': {
                    '11': { value: '64', holder: 'Cade Diehl', year: '8/20' },
                    '10': { value: '65', holder: 'Brady Long', year: '8/25' },
                    '9': { value: '61', holder: 'Jake Berggren', year: '8/21' },
                    'PR': { value: '65', holder: 'Brady Long', year: '8/25' }
                },
                '120-129': {
                    '10': { value: '58', holder: 'Riley Larson', year: '8/21' },
                    '9': { value: '66', holder: 'Brady Long', year: '8/24' },
                    'PR': { value: '66', holder: 'Brady Long', year: '8/24' }
                },
                '110-119': {
                    '10': { value: '50', holder: 'Tristan Anderson', year: '8/21' },
                    '9': { value: '54', holder: 'Max Dahlsten', year: '8/25' },
                    'PR': { value: '54', holder: 'Max Dahlsten', year: '8/25' }
                },
                '100-109': {
                    '10': { value: '51', holder: 'Brayden Kilstofte', year: '8/21' },
                    '9': { value: '56', holder: 'Blake Larson', year: '8/22' },
                    'PR': { value: '56', holder: 'Blake Larson', year: '8/22' }
                }
            },
            'Broad Jump': {},
            '10m Fly': {},
            'Pro Agility': {},
            'Deadlift': {}
        };

        // Schedule Modal Component
        const ScheduleModal = ({ scheduleModal, setScheduleModal, updateSchedule }) => {
            const [tempDate, setTempDate] = useState(scheduleModal.item.scheduledDate || new Date().toISOString().split('T')[0]);
            const [tempRecurring, setTempRecurring] = useState(scheduleModal.item.recurring?.enabled || false);
            const [tempPattern, setTempPattern] = useState(scheduleModal.item.recurring?.pattern || 'weekly');
            const [tempDayOfWeek, setTempDayOfWeek] = useState(scheduleModal.item.recurring?.dayOfWeek ?? new Date().getDay());
            const [tempWeekOfMonth, setTempWeekOfMonth] = useState(scheduleModal.item.recurring?.weekOfMonth || 1);
            const [tempMonth, setTempMonth] = useState(scheduleModal.item.recurring?.month || 1);

            return (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setScheduleModal(null)}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Schedule {scheduleModal.type === 'quote' ? 'Quote' : 'Challenge'}</h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={tempDate}
                                onChange={e => setTempDate(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={tempRecurring}
                                    onChange={e => setTempRecurring(e.target.checked)}
                                />
                                <span className="form-label" style={{ margin: 0 }}>Recurring</span>
                            </label>
                        </div>

                        {tempRecurring && (
                            <>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Pattern</label>
                                    <select className="form-input" value={tempPattern} onChange={e => setTempPattern(e.target.value)}>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>

                                {tempPattern === 'weekly' && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label">Day of Week</label>
                                        <select className="form-input" value={tempDayOfWeek} onChange={e => setTempDayOfWeek(parseInt(e.target.value))}>
                                            <option value={0}>Sunday</option>
                                            <option value={1}>Monday</option>
                                            <option value={2}>Tuesday</option>
                                            <option value={3}>Wednesday</option>
                                            <option value={4}>Thursday</option>
                                            <option value={5}>Friday</option>
                                            <option value={6}>Saturday</option>
                                        </select>
                                    </div>
                                )}

                                {(tempPattern === 'monthly' || tempPattern === 'yearly') && (
                                    <>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label">Week of Month</label>
                                            <select className="form-input" value={tempWeekOfMonth} onChange={e => setTempWeekOfMonth(e.target.value === 'last' ? 'last' : parseInt(e.target.value))}>
                                                <option value={1}>1st</option>
                                                <option value={2}>2nd</option>
                                                <option value={3}>3rd</option>
                                                <option value={4}>4th</option>
                                                <option value="last">Last</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label">Day of Week</label>
                                            <select className="form-input" value={tempDayOfWeek} onChange={e => setTempDayOfWeek(parseInt(e.target.value))}>
                                                <option value={0}>Sunday</option>
                                                <option value={1}>Monday</option>
                                                <option value={2}>Tuesday</option>
                                                <option value={3}>Wednesday</option>
                                                <option value={4}>Thursday</option>
                                                <option value={5}>Friday</option>
                                                <option value={6}>Saturday</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {tempPattern === 'yearly' && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label">Month</label>
                                        <select className="form-input" value={tempMonth} onChange={e => setTempMonth(parseInt(e.target.value))}>
                                            <option value={1}>January</option>
                                            <option value={2}>February</option>
                                            <option value={3}>March</option>
                                            <option value={4}>April</option>
                                            <option value={5}>May</option>
                                            <option value={6}>June</option>
                                            <option value={7}>July</option>
                                            <option value={8}>August</option>
                                            <option value={9}>September</option>
                                            <option value={10}>October</option>
                                            <option value={11}>November</option>
                                            <option value={12}>December</option>
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setScheduleModal(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    updateSchedule(scheduleModal.type, scheduleModal.item.id, {
                                        scheduledDate: tempDate,
                                        recurring: tempRecurring ? {
                                            enabled: true,
                                            pattern: tempPattern,
                                            dayOfWeek: tempDayOfWeek,
                                            weekOfMonth: (tempPattern === 'monthly' || tempPattern === 'yearly') ? tempWeekOfMonth : undefined,
                                            month: tempPattern === 'yearly' ? tempMonth : undefined
                                        } : null
                                    });
                                    setScheduleModal(null);
                                }}
                            >
                                Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        // Cultural Calibration Component
        const CulturalCalibration = ({ culturalCalibration, setCulturalCalibration, currentPermissions, authUser }) => {
            const isAdmin = true; // currentPermissions?.organizationAdmin || currentPermissions?.culturalAdmin;
            const [ccMode, setCCMode] = useState(isAdmin ? 'admin' : 'user');
            const [quoteText, setQuoteText] = useState('');
            const [quoteAuthor, setQuoteAuthor] = useState('');
            const [challengeText, setChallengeText] = useState('');
            const [reflection, setReflection] = useState('');
            const [currentScore, setCurrentScore] = useState(5);
            const [desiredScore, setDesiredScore] = useState(8);
            const [feedback, setFeedback] = useState('');
            const [adminTab, setAdminTab] = useState('content'); // 'content' or 'calendar'
            const [scheduleModal, setScheduleModal] = useState(null); // {type: 'quote'|'challenge', item: object}
            const [calendarDate, setCalendarDate] = useState(new Date());

            // Helper: Check if two dates are the same day
            const isSameDay = (date1, date2) => {
                return date1.getFullYear() === date2.getFullYear() &&
                    date1.getMonth() === date2.getMonth() &&
                    date1.getDate() === date2.getDate();
            };

            // Helper: Get the week of month for a date (1-5)
            const getWeekOfMonth = (date) => {
                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                const dayOfMonth = date.getDate();
                return Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
            };

            // Helper: Check if date matches monthly pattern (e.g., "2nd Tuesday")
            const matchesMonthlyPattern = (date, recurring) => {
                if (date.getDay() !== recurring.dayOfWeek) return false;

                const weekOfMonth = getWeekOfMonth(date);
                if (recurring.weekOfMonth === 'last') {
                    // Check if this is the last occurrence of this weekday in the month
                    const nextWeek = new Date(date);
                    nextWeek.setDate(date.getDate() + 7);
                    return nextWeek.getMonth() !== date.getMonth();
                }
                return weekOfMonth === recurring.weekOfMonth;
            };

            // Helper: Check if item is scheduled for target date
            const isScheduledFor = (item, targetDate) => {
                if (!item.scheduledDate) return false;

                const scheduled = new Date(item.scheduledDate);

                if (!item.recurring?.enabled) {
                    // One-time: exact date match
                    return isSameDay(scheduled, targetDate);
                }

                // Must be on or after start date
                if (targetDate < scheduled) return false;

                // Recurring patterns
                switch (item.recurring.pattern) {
                    case 'weekly':
                        return targetDate.getDay() === item.recurring.dayOfWeek;
                    case 'monthly':
                        return matchesMonthlyPattern(targetDate, item.recurring);
                    case 'yearly':
                        return targetDate.getMonth() === item.recurring.month - 1 &&
                            matchesMonthlyPattern(targetDate, item.recurring);
                    default:
                        return false;
                }
            };

            // Helper: Find active item for today (or most recent)
            const findActiveItem = (items) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // 1. Find items scheduled for today
                const todayItems = items.filter(item => isScheduledFor(item, today));
                if (todayItems.length) return todayItems[0];

                // 2. Fallback: Most recent scheduled item before today
                const pastItems = items
                    .filter(item => item.scheduledDate && new Date(item.scheduledDate) <= today)
                    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
                if (pastItems.length) return pastItems[0];

                // 3. Fallback: Most recently added
                const sortedByDate = items.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                return sortedByDate[0] || null;
            };


            const addQuote = () => {
                if (!quoteText.trim()) return;
                const newQuote = {
                    id: Date.now().toString(),
                    text: quoteText,
                    author: quoteAuthor || 'Unknown',
                    dateAdded: new Date().toISOString(),
                    scheduledDate: null,
                    recurring: null
                };
                setCulturalCalibration({
                    ...culturalCalibration,
                    quotes: [...(culturalCalibration.quotes || []), newQuote]
                });
                setQuoteText('');
                setQuoteAuthor('');
            };

            const updateSchedule = (type, itemId, scheduleData) => {
                const key = type === 'quote' ? 'quotes' : 'challenges';
                const updated = (culturalCalibration[key] || []).map(item =>
                    item.id === itemId ? { ...item, ...scheduleData } : item
                );
                setCulturalCalibration({
                    ...culturalCalibration,
                    [key]: updated
                });
            };


            const addChallenge = () => {
                if (!challengeText.trim()) return;
                const newChallenge = {
                    id: Date.now().toString(),
                    text: challengeText,
                    dateAdded: new Date().toISOString(),
                    scheduledDate: null,
                    recurring: null
                };
                setCulturalCalibration({
                    ...culturalCalibration,
                    challenges: [...(culturalCalibration.challenges || []), newChallenge]
                });
                setChallengeText('');
            };

            const setActiveQuote = (id) => {
                setCulturalCalibration({
                    ...culturalCalibration,
                    activeQuote: id
                });
            };

            const setActiveChallenge = (id) => {
                setCulturalCalibration({
                    ...culturalCalibration,
                    activeChallenge: id
                });
            };

            const deleteQuote = (id) => {
                setCulturalCalibration({
                    ...culturalCalibration,
                    quotes: (culturalCalibration.quotes || []).filter(q => q.id !== id),
                    activeQuote: culturalCalibration.activeQuote === id ? null : culturalCalibration.activeQuote
                });
            };

            const deleteChallenge = (id) => {
                setCulturalCalibration({
                    ...culturalCalibration,
                    challenges: (culturalCalibration.challenges || []).filter(c => c.id !== id),
                    activeChallenge: culturalCalibration.activeChallenge === id ? null : culturalCalibration.activeChallenge
                });
            };

            const submitResponse = () => {
                const newResponse = {
                    id: Date.now().toString(),
                    userId: authUser?.uid,
                    userName: authUser?.displayName || authUser?.email,
                    date: new Date().toISOString(),
                    reflection: reflection,
                    currentCultureScore: currentScore,
                    desiredCultureScore: desiredScore,
                    feedback: feedback
                };
                setCulturalCalibration({
                    ...culturalCalibration,
                    responses: [...(culturalCalibration.responses || []), newResponse]
                });
                setReflection('');
                setCurrentScore(5);
                setDesiredScore(8);
                setFeedback('');
                alert('Response submitted successfully!');
            };

            const activeQuoteObj = findActiveItem(culturalCalibration.quotes || []);
            const activeChallengeObj = findActiveItem(culturalCalibration.challenges || []);

            const responses = culturalCalibration.responses || [];
            const avgCurrent = responses.length > 0 ? (responses.reduce((sum, r) => sum + r.currentCultureScore, 0) / responses.length).toFixed(1) : 'N/A';
            const avgDesired = responses.length > 0 ? (responses.reduce((sum, r) => sum + r.desiredCultureScore, 0) / responses.length).toFixed(1) : 'N/A';

            return (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto', padding: '1rem' }}>
                    <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
                        <h2 style={{ margin: '0 0 1rem 0', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icon name="Heart" size={28} />
                            Culture Calibration
                        </h2>
                        <p style={{ margin: 0, opacity: 0.9, color: 'white' }}>
                            Daily quotes, challenges, and culture feedback
                        </p>
                        {isAdmin && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button className={`btn ${ccMode === 'admin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCCMode('admin')} style={{ borderRadius: '20px' }}>Admin View</button>
                                <button className={`btn ${ccMode === 'user' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCCMode('user')} style={{ borderRadius: '20px' }}>User View</button>
                            </div>
                        )}
                    </div>
                    {ccMode === 'admin' ? (
                        <>
                            {/* Tabs for Admin View */}
                            <div className="card" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)' }}>
                                    <button
                                        className={`btn ${adminTab === 'content' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setAdminTab('content')}
                                        style={{ borderRadius: '8px 8px 0 0', borderBottom: adminTab === 'content' ? '2px solid var(--accent)' : 'none' }}
                                    >
                                        Manage Content
                                    </button>
                                    <button
                                        className={`btn ${adminTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setAdminTab('calendar')}
                                        style={{ borderRadius: '8px 8px 0 0', borderBottom: adminTab === 'calendar' ? '2px solid var(--accent)' : 'none' }}
                                    >
                                        Calendar Schedule
                                    </button>
                                </div>
                            </div>

                            {adminTab === 'content' ? (
                                <>
                                    {/* Response Dashboard */}
                                    <div className="card" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ margin: '0 0 1rem 0' }}>Response Dashboard</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Responses</div>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{responses.length}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Avg Current Culture</div>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f97316' }}>{avgCurrent}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Avg Desired Culture</div>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{avgDesired}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Daily Quotes */}
                                    <div className="card" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ margin: '0 0 1rem 0' }}>Daily Quotes</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <input className="form-input" placeholder="Quote text..." value={quoteText} onChange={e => setQuoteText(e.target.value)} />
                                            <input className="form-input" placeholder="Author (optional)" value={quoteAuthor} onChange={e => setQuoteAuthor(e.target.value)} />
                                            <button className="btn btn-primary" onClick={addQuote} disabled={!quoteText.trim()}>Add Quote</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {(culturalCalibration.quotes || []).map(quote => (
                                                <div key={quote.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>"{quote.text}"</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>— {quote.author}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => setScheduleModal({ type: 'quote', item: quote })}
                                                            >
                                                                <Icon name="Calendar" size={14} /> Schedule
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => deleteQuote(quote.id)}>Delete</button>
                                                        </div>
                                                    </div>
                                                    {quote.scheduledDate && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
                                                            📅 {quote.recurring?.enabled ? (
                                                                <>Recurring: {
                                                                    quote.recurring.pattern === 'weekly' ? `Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][quote.recurring.dayOfWeek]}` :
                                                                        quote.recurring.pattern === 'monthly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][quote.recurring.weekOfMonth === 'last' ? 4 : quote.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][quote.recurring.dayOfWeek]} of month` :
                                                                            quote.recurring.pattern === 'yearly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][quote.recurring.weekOfMonth === 'last' ? 4 : quote.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][quote.recurring.dayOfWeek]} of ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][quote.recurring.month - 1]}` : ''
                                                                }</>
                                                            ) : (
                                                                new Date(quote.scheduledDate).toLocaleDateString()
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Daily Challenges */}
                                    <div className="card" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ margin: '0 0 1rem 0' }}>Daily Challenges</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <textarea className="form-input" rows={3} placeholder="Challenge text..." value={challengeText} onChange={e => setChallengeText(e.target.value)} />
                                            <button className="btn btn-primary" onClick={addChallenge} disabled={!challengeText.trim()}>Add Challenge</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {(culturalCalibration.challenges || []).map(challenge => (
                                                <div key={challenge.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                                        <div style={{ flex: 1 }}>{challenge.text}</div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => setScheduleModal({ type: 'challenge', item: challenge })}
                                                            >
                                                                <Icon name="Calendar" size={14} /> Schedule
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => deleteChallenge(challenge.id)}>Delete</button>
                                                        </div>
                                                    </div>
                                                    {challenge.scheduledDate && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
                                                            📅 {challenge.recurring?.enabled ? (
                                                                <>Recurring: {
                                                                    challenge.recurring.pattern === 'weekly' ? `Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][challenge.recurring.dayOfWeek]}` :
                                                                        challenge.recurring.pattern === 'monthly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][challenge.recurring.weekOfMonth === 'last' ? 4 : challenge.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][challenge.recurring.dayOfWeek]} of month` :
                                                                            challenge.recurring.pattern === 'yearly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][challenge.recurring.weekOfMonth === 'last' ? 4 : challenge.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][challenge.recurring.dayOfWeek]} of ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][challenge.recurring.month - 1]}` : ''
                                                                }</>
                                                            ) : (
                                                                new Date(challenge.scheduledDate).toLocaleDateString()
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submitted Responses */}
                                    <div className="card" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ margin: '0 0 1rem 0' }}>Submitted Responses</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {responses.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No responses yet</div>
                                            ) : (
                                                responses.map(response => (
                                                    <div key={response.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                            <div style={{ fontWeight: 'bold' }}>{response.userName}</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(response.date).toLocaleDateString()}</div>
                                                        </div>
                                                        <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>{response.reflection}</div>
                                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                                                            <div>Current: <span style={{ fontWeight: 'bold', color: '#f97316' }}>{response.currentCultureScore}/10</span></div>
                                                            <div>Desired: <span style={{ fontWeight: 'bold', color: '#10b981' }}>{response.desiredCultureScore}/10</span></div>
                                                        </div>
                                                        {response.feedback && (
                                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                                <strong>Feedback:</strong> {response.feedback}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="card" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0' }}>Calendar Schedule</h3>
                                    {/* Calendar Controls */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <button className="btn btn-secondary" onClick={() => {
                                            const newDate = new Date(calendarDate);
                                            newDate.setMonth(newDate.getMonth() - 1);
                                            setCalendarDate(newDate);
                                        }}>
                                            ← Previous
                                        </button>
                                        <h4 style={{ margin: 0 }}>
                                            {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </h4>
                                        <button className="btn btn-secondary" onClick={() => {
                                            const newDate = new Date(calendarDate);
                                            newDate.setMonth(newDate.getMonth() + 1);
                                            setCalendarDate(newDate);
                                        }}>
                                            Next →
                                        </button>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(7, 1fr)',
                                        gap: '0.5rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {/* Day Headers */}
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} style={{
                                                padding: '0.5rem',
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.85rem'
                                            }}>
                                                {day}
                                            </div>
                                        ))}

                                        {(() => {
                                            const year = calendarDate.getFullYear();
                                            const month = calendarDate.getMonth();
                                            const firstDay = new Date(year, month, 1).getDay();
                                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);

                                            const days = [];

                                            // Empty cells for days before month starts
                                            for (let i = 0; i < firstDay; i++) {
                                                days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }} />);
                                            }

                                            // Actual days of the month
                                            for (let day = 1; day <= daysInMonth; day++) {
                                                const date = new Date(year, month, day);
                                                const isToday = isSameDay(date, today);

                                                // Find items scheduled for this date
                                                const quotes = (culturalCalibration.quotes || []).filter(q => isScheduledFor(q, date));
                                                const challenges = (culturalCalibration.challenges || []).filter(c => isScheduledFor(c, date));
                                                const hasItems = quotes.length > 0 || challenges.length > 0;

                                                days.push(
                                                    <div
                                                        key={day}
                                                        style={{
                                                            padding: '0.5rem',
                                                            border: '1px solid var(--borde)',
                                                            borderRadius: '4px',
                                                            minHeight: '80px',
                                                            backgroundColor: isToday ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-secondary)',
                                                            borderColor: isToday ? 'var(--accent)' : 'var(--border)',
                                                            cursor: hasItems ? 'pointer' : 'default',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (hasItems) {
                                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (hasItems) {
                                                                e.currentTarget.style.boxShadow = 'none';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                            }
                                                        }}
                                                    >
                                                        <div style={{
                                                            fontWeight: isToday ? 'bold' : 'normal',
                                                            marginBottom: '0.25rem',
                                                            color: isToday ? 'var(--accent)' : 'var(--text-primary)'
                                                        }}>
                                                            {day}
                                                        </div>

                                                        {/* Display scheduled items */}
                                                        {hasItems && (
                                                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                                {quotes.map((q, idx) => (
                                                                    <div
                                                                        key={`quote-${idx}`}
                                                                        style={{
                                                                            padding: '0.15rem 0.3rem',
                                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                                            color: 'white',
                                                                            borderRadius: '3px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            fontSize: '0.7rem'
                                                                        }}
                                                                        title={`Quote: "${q.text}"`}
                                                                    >
                                                                        💬 {q.recurring?.enabled ? '🔄 ' : ''}Quote
                                                                    </div>
                                                                ))}
                                                                {challenges.map((c, idx) => (
                                                                    <div
                                                                        key={`challenge-${idx}`}
                                                                        style={{
                                                                            padding: '0.15rem 0.3rem',
                                                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                            color: 'white',
                                                                            borderRadius: '3px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            fontSize: '0.7rem'
                                                                        }}
                                                                        title={`Challenge: "${c.text}"`}
                                                                    >
                                                                        ⚡ {c.recurring?.enabled ? '🔄 ' : ''}Challenge
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return days;
                                        })()}
                                    </div>

                                    {/* Legend */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '1.5rem',
                                        justifyContent: 'center',
                                        padding: '1rem',
                                        borderTop: '1px solid var(--border)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                borderRadius: '3px'
                                            }} />
                                            <span>Quote</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                borderRadius: '3px'
                                            }} />
                                            <span>Challenge</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                            <span>🔄</span>
                                            <span>Recurring</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Schedule Modal */}
                            {scheduleModal && (
                                <ScheduleModal
                                    scheduleModal={scheduleModal}
                                    setScheduleModal={setScheduleModal}
                                    updateSchedule={updateSchedule}
                                />
                            )}
                        </>
                    ) : (
                        <><div className="card" style={{ padding: '1.5rem' }}><h3 style={{ margin: '0 0 1rem 0' }}>Today's Quote</h3>{activeQuoteObj ? (<div style={{ fontSize: '1.1rem' }}><div style={{ fontStyle: 'italic', marginBottom: '0.75rem' }}>"{activeQuoteObj.text}"</div><div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>— {activeQuoteObj.author}</div></div>) : (<div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active quote for today</div>)}</div><div className="card" style={{ padding: '1.5rem' }}><h3 style={{ margin: '0 0 1rem 0' }}>Today's Challenge</h3>{activeChallengeObj ? (<div style={{ fontSize: '1.05rem' }}>{activeChallengeObj.text}</div>) : (<div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active challenge for today</div>)}</div><div className="card" style={{ padding: '1.5rem' }}><h3 style={{ margin: '0 0 1rem 0' }}>Your Feedback</h3><div style={{ marginBottom: '1.5rem' }}><label className="form-label">How are you feeling about our program's culture? What's on your mind?</label><textarea className="form-input" rows={4} placeholder="Share your thoughts, reflections, or concerns..." value={reflection} onChange={e => setReflection(e.target.value)} /></div><div style={{ marginBottom: '1.5rem' }}><label className="form-label">Current Culture Score (1-10)</label><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><input type="range" min="1" max="10" value={currentScore} onChange={e => setCurrentScore(parseInt(e.target.value))} style={{ flex: 1 }} /><span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '3ch', color: '#f97316' }}>{currentScore}</span></div></div><div style={{ marginBottom: '1.5rem' }}><label className="form-label">Desired Culture Score (1-10)</label><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><input type="range" min="1" max="10" value={desiredScore} onChange={e => setDesiredScore(parseInt(e.target.value))} style={{ flex: 1 }} /><span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '3ch', color: '#10b981' }}>{desiredScore}</span></div></div><div style={{ marginBottom: '1.5rem' }}><label className="form-label">Additional Feedback (Optional)</label><textarea className="form-input" rows={3} placeholder="Any suggestions or thoughts on how we can improve?" value={feedback} onChange={e => setFeedback(e.target.value)} /></div><button className="btn btn-primary" onClick={submitResponse} disabled={!reflection.trim()} style={{ width: '100%' }}>Submit Response</button></div></>
                    )}
                </div>
            );
        };

        // --- INSTALL SLIDESHOW COMPONENT ---
        const RenderInstallSlideshow = ({ plays, rooskiLibrary, positionNames }) => {
            const [currentIndex, setCurrentIndex] = useState(0);

            // Filter plays that have isInstall: true
            const installPlays = useMemo(() => {
                if (!plays) return [];
                return plays.filter(p => p.isInstall === true);
            }, [plays]);

            if (installPlays.length === 0) {
                return (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        <h3>No plays added to Install Slideshow.</h3>
                        <p>Go to "Edit Play" and check "Add to Install Slideshow" to see plays here.</p>
                    </div>
                );
            }

            const currentPlay = installPlays[currentIndex];

            return (
                <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Install Slideshow</h2>
                            <p style={{ margin: 0, color: '#666' }}>{currentPlay.name} ({currentIndex + 1} of {installPlays.length})</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#666', marginRight: '1rem' }}>Click lines to view drills</span>
                            <button className="btn btn-secondary" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>Previous</button>
                            <button className="btn btn-secondary" onClick={() => setCurrentIndex(prev => Math.min(installPlays.length - 1, prev + 1))} disabled={currentIndex === installPlays.length - 1}>Next</button>
                        </div>
                    </div>
                    <div style={{ flex: 1, background: '#f0f0f0', position: 'relative' }}>
                        {/* Key: Force re-mount on play change */}
                        <PlayDiagramEditor
                            key={currentPlay.id}
                            initialData={currentPlay.diagramData || { elements: [] }}
                            onSave={() => { }}
                            onCancel={() => { }}
                            mode="standard"
                            readOnly={true}
                            positionNames={positionNames}
                            rooskiLibrary={rooskiLibrary}
                        />
                    </div>
                </div>
            );
        };



