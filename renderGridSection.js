
const renderGridSection = (section, sectionIdx) => {
    const headings = section.gridHeadings || ['LEFT HASH', 'MIDDLE', 'RIGHT HASH', 'NOTES'];
    const allPlays = getGridPlays(section.id);
    const assignedPlays = allPlays.filter(p => p.type !== 'GAP');

    return (
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* No interior config for sections, handled by header edit */}

            <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(4, 1fr)', gap: '1px', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isLocked ? (
                        <input
                            value={section.cornerLabel || ''}
                            onChange={(e) => {
                                const newLayouts = { ...gamePlanLayouts };
                                newLayouts.CALL_SHEET.sections[sectionIdx].cornerLabel = e.target.value;
                                if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                            }}
                            style={{ width: '100%', fontSize: '0.6rem', border: 'none', background: 'transparent', textAlign: 'center', color: '#94a3b8' }}
                            placeholder="Label..."
                        />
                    ) : (
                        section.cornerLabel || ''
                    )}
                </div>
                {headings.map((h, hIdx) => (
                    <div key={hIdx} style={{ textAlign: 'center' }}>
                        {!isLocked ? (
                            <input
                                value={h}
                                onChange={(e) => {
                                    const newLayouts = { ...gamePlanLayouts };
                                    const newHeadings = [...(newLayouts.CALL_SHEET.sections[sectionIdx].gridHeadings || ['LEFT HASH', 'MIDDLE', 'RIGHT HASH', 'NOTES'])];
                                    newHeadings[hIdx] = e.target.value;
                                    newLayouts.CALL_SHEET.sections[sectionIdx].gridHeadings = newHeadings;
                                    if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                                }}
                                style={{ width: '100%', fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textAlign: 'center', border: 'none', background: 'transparent' }}
                            />
                        ) : (
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>{h}</div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {Array.from({ length: 5 }).map((_, rIdx) => {
                    const startIdx = rIdx * 4;
                    const rowPlays = allPlays.slice(startIdx, startIdx + 4);
                    const rowLabel = (section.rowLabels || ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'])[rIdx];

                    return (
                        <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: '50px repeat(4, 1fr)', gap: '1px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '4px' }}>
                                {!isLocked ? (
                                    <input
                                        value={rowLabel || ''}
                                        onChange={(e) => {
                                            const newLayouts = { ...gamePlanLayouts };
                                            const newLabels = [...(newLayouts.CALL_SHEET.sections[sectionIdx].rowLabels || ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'])];
                                            newLabels[rIdx] = e.target.value;
                                            newLayouts.CALL_SHEET.sections[sectionIdx].rowLabels = newLabels;
                                            if (onUpdateLayouts) onUpdateLayouts(newLayouts);
                                        }}
                                        style={{ width: '100%', fontSize: '0.65rem', fontWeight: '600', color: '#475569', textAlign: 'center', border: 'none', background: 'transparent', padding: '0' }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#475569' }}>{rowLabel}</span>
                                )}
                            </div>
                            {rowPlays.map((play, cIdx) => (
                                <div key={cIdx} style={{ position: 'relative', height: '100%', minHeight: '50px' }}>
                                    <PlaySlot
                                        playId={play.type === 'GAP' ? null : play.id}
                                        onUpdate={(newPlayId) => {
                                            handleGridCellUpdate(section.id, startIdx + cIdx, newPlayId);
                                        }}
                                        isLocked={isLocked}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
