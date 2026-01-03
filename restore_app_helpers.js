
const handleSyncAll = () => {
    if (!authUser) return alert("You must be logged in to sync.");
    if (confirm("Push all local data to cloud?")) {
        Promise.all(dataTypes.map(item => syncToFirestore(authUser.uid, item.id, item.data)))
            .then(() => alert("Sync Complete!"))
            .catch(err => alert("Sync Failed: " + err));
    }
};

const GlossaryView = ({ phase = 'OFFENSE' }) => {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>{phase} Glossary</h1>
            <p>Glossary feature is currently being updated. Please check back later.</p>
        </div>
    );
};

const renderSetup = (phase) => {
    const isOffense = phase === 'OFFENSE';
    const isDefense = phase === 'DEFENSE';
    const isST = phase === 'SPECIAL_TEAMS';

    let currentSyntax, setSyntax, defaultPositions;
    let currentTermLibrary, setCurrentTermLibrary;

    if (isDefense) {
        currentSyntax = defensePlaySyntax;
        setSyntax = setDefensePlaySyntax;
        currentTermLibrary = defenseTermLibrary;
        setCurrentTermLibrary = setDefenseTermLibrary;
        defaultPositions = [
            { key: 'DE', default: 'DE', description: 'Defensive End' },
            { key: 'DT', default: 'DT', description: 'Defensive Tackle' },
            { key: 'NT', default: 'NT', description: 'Nose Tackle' },
            { key: 'LB', default: 'LB', description: 'Linebacker' },
            { key: 'CB', default: 'CB', description: 'Cornerback' },
            { key: 'S', default: 'S', description: 'Safety' },
            { key: 'NB', default: 'NB', description: 'Nickelback' },
            { key: 'DL', default: 'DL', description: 'Defensive Line' },
            { key: 'DB', default: 'DB', description: 'Defensive Back' }
        ];
    } else if (isST) {
        currentSyntax = stPlaySyntax;
        setSyntax = setStPlaySyntax;
        currentTermLibrary = stTermLibrary;
        setCurrentTermLibrary = setStTermLibrary;
        defaultPositions = [
            { key: 'K', default: 'K', description: 'Kicker' },
            { key: 'P', default: 'P', description: 'Punter' },
            { key: 'LS', default: 'LS', description: 'Long Snapper' },
            { key: 'H', default: 'H', description: 'Holder' },
            { key: 'KR', default: 'KR', description: 'Kick Returner' },
            { key: 'PR', default: 'PR', description: 'Punt Returner' },
            { key: 'G', default: 'G', description: 'Gunner' },
            { key: 'W', default: 'W', description: 'Wing' },
            { key: 'PP', default: 'PP', description: 'Personal Protector' },
            { key: 'L1', default: 'L1', description: 'KO Left 1' },
            { key: 'R1', default: 'R1', description: 'KO Right 1' }
        ];
    } else {
        currentSyntax = playSyntax;
        setSyntax = setPlaySyntax;
        currentTermLibrary = termLibrary;
        setCurrentTermLibrary = setTermLibrary;
        defaultPositions = [
            { key: 'X', default: 'X', description: 'Split End' },
            { key: 'Z', default: 'Z', description: 'Flanker' },
            { key: 'Y', default: 'Y', description: 'Slot WR' },
            { key: 'A', default: 'A', description: 'Tight End' },
            { key: 'H', default: 'H', description: 'Running Back' },
            { key: 'Q', default: 'Q', description: 'Quarterback' },
            { key: 'T', default: 'LT', description: 'Left Tackle' },
            { key: 'LG', default: 'LG', description: 'Left Guard' },
            { key: 'C', default: 'C', description: 'Center' },
            { key: 'RG', default: 'RG', description: 'Right Guard' },
            { key: 'RT', default: 'RT', description: 'Right Tackle' }
        ];
    }

    const getTerms = (catId) => currentTermLibrary[catId] || [];

    const handleAddTerm = (catId) => {
        const term = prompt("Enter new term:");
        if (term) {
            const newId = term.toLowerCase().replace(/[^a-z0-9]/g, '');
            const newTerms = [...getTerms(catId), { id: newId, term }];
            setCurrentTermLibrary({ ...currentTermLibrary, [catId]: newTerms });
        }
    };
    const deleteTerm = (catId, termId) => {
        if (confirm("Delete this term?")) {
            const newTerms = getTerms(catId).filter(t => t.id !== termId);
            setCurrentTermLibrary({ ...currentTermLibrary, [catId]: newTerms });
        }
    };

    const phaseTitle = isDefense ? 'Defense' : isST ? 'Special Teams' : 'Offense';

    return (
        <div className="card" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ margin: 0 }}>{phaseTitle} Setup</h1>
                <p style={{ opacity: 0.7, margin: '0.5rem 0 0 0' }}>Configure your {phaseTitle.toLowerCase()} language, positions, and terminology.</p>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
                <button
                    className={`btn-ghost`}
                    style={{
                        borderRadius: 0,
                        padding: '1rem 1.5rem',
                        borderBottom: setupTab === 'positions' ? '3px solid var(--accent)' : '3px solid transparent',
                        fontWeight: setupTab === 'positions' ? 'bold' : 'normal',
                        color: setupTab === 'positions' ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setSetupTab('positions')}
                >
                    <Icon name="Users" size={16} /> Positions
                </button>
                <button
                    className={`btn-ghost`}
                    style={{
                        borderRadius: 0,
                        padding: '1rem 1.5rem',
                        borderBottom: setupTab === 'syntax' ? '3px solid var(--accent)' : '3px solid transparent',
                        fontWeight: setupTab === 'syntax' ? 'bold' : 'normal',
                        color: setupTab === 'syntax' ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setSetupTab('syntax')}
                >
                    <Icon name="Code" size={16} /> Play Syntax
                </button>
                <button
                    className={`btn-ghost`}
                    style={{
                        borderRadius: 0,
                        padding: '1rem 1.5rem',
                        borderBottom: setupTab === 'terms' ? '3px solid var(--accent)' : '3px solid transparent',
                        fontWeight: setupTab === 'terms' ? 'bold' : 'normal',
                        color: setupTab === 'terms' ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setSetupTab('terms')}
                >
                    <Icon name="BookOpen" size={16} /> Term Library
                </button>
                <button
                    className={`btn-ghost`}
                    style={{
                        borderRadius: 0,
                        padding: '1rem 1.5rem',
                        borderBottom: setupTab === 'practice-lists' ? '3px solid var(--accent)' : '3px solid transparent',
                        fontWeight: setupTab === 'practice-lists' ? 'bold' : 'normal',
                        color: setupTab === 'practice-lists' ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setSetupTab('practice-lists')}
                >
                    <Icon name="List" size={16} /> Practice Lists
                </button>
            </div>

            <div style={{ padding: '1.5rem', flex: 1 }}>
                {setupTab === 'positions' && (
                    <div>
                        <h3 style={{ marginBottom: '1rem' }}>Position Names</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                            {defaultPositions.map(pos => (
                                <div key={pos.key} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{pos.default}</label>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{pos.description}</span>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={positionNames[pos.key] || pos.default}
                                        onChange={(e) => setPositionNames({ ...positionNames, [pos.key]: e.target.value.toUpperCase().slice(0, 3) })}
                                        placeholder={pos.default}
                                        maxLength="3"
                                        style={{ padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}
                                        title={`Customize ${pos.description} label`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {setupTab === 'syntax' && (
                    <div style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Play Call Structure</h3>
                                <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>Define the order and components of a play call.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => {
                                const newId = Date.now().toString();
                                setSyntax([...currentSyntax, { id: newId, label: 'New Component', type: 'text' }]);
                            }}>
                                <Icon name="Plus" size={16} style={{ marginRight: '6px' }} /> Add Component
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {currentSyntax.map((item, idx) => (
                                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-main)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--bg-panel)', borderRadius: '50%', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Component Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={item.label}
                                                onChange={(e) => {
                                                    const newSyntax = [...currentSyntax];
                                                    newSyntax[idx].label = e.target.value;
                                                    setSyntax(newSyntax);
                                                }}
                                                placeholder="e.g. Formation"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Prefix</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={item.prefix || ''}
                                                onChange={(e) => {
                                                    const newSyntax = [...currentSyntax];
                                                    newSyntax[idx].prefix = e.target.value;
                                                    setSyntax(newSyntax);
                                                }}
                                                placeholder='"'
                                                style={{ textAlign: 'center' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Suffix</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={item.suffix || ''}
                                                onChange={(e) => {
                                                    const newSyntax = [...currentSyntax];
                                                    newSyntax[idx].suffix = e.target.value;
                                                    setSyntax(newSyntax);
                                                }}
                                                placeholder='"'
                                                style={{ textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => {
                                            if (idx === 0) return;
                                            const newSyntax = [...currentSyntax];
                                            [newSyntax[idx - 1], newSyntax[idx]] = [newSyntax[idx], newSyntax[idx - 1]];
                                            setSyntax(newSyntax);
                                        }} disabled={idx === 0} style={{ padding: '2px' }}><Icon name="ChevronUp" size={16} /></button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => {
                                            if (idx === currentSyntax.length - 1) return;
                                            const newSyntax = [...currentSyntax];
                                            [newSyntax[idx + 1], newSyntax[idx]] = [newSyntax[idx], newSyntax[idx + 1]];
                                            setSyntax(newSyntax);
                                        }} disabled={idx === currentSyntax.length - 1} style={{ padding: '2px' }}><Icon name="ChevronDown" size={16} /></button>
                                    </div>
                                    <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => {
                                        if (confirm('Delete this syntax component? All associated terms will be hidden.')) {
                                            const newSyntax = currentSyntax.filter((_, i) => i !== idx);
                                            setSyntax(newSyntax);
                                        }
                                    }}>
                                        <Icon name="Trash" size={18} />
                                    </button>
                                </div>
                            ))}
                            {currentSyntax.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: '8px', opacity: 0.6 }}>
                                    <Icon name="Code" size={48} style={{ marginBottom: '1rem' }} />
                                    <p>No play components defined.</p>
                                    <p>Click "Add Component" to start building your play call structure.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {setupTab === 'terms' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Term Library</h3>
                            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>Manage vocabulary for your play components.</p>
                        </div>

                        {currentSyntax.length === 0 ? (
                            <div className="alert alert-warning">
                                <Icon name="AlertTriangle" size={18} />
                                Please define your Play Call Structure in the Syntax tab first.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '0' }}>
                                <div style={{ width: '250px', borderRight: '1px solid var(--border)', paddingRight: '1rem', overflowY: 'auto' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>COMPONENTS</div>
                                    {currentSyntax.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSetupCategory(cat.id)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.75rem 1rem',
                                                background: setupCategory === cat.id ? 'var(--bg-main)' : 'none',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: setupCategory === cat.id ? 'bold' : 'normal',
                                                color: setupCategory === cat.id ? 'var(--accent)' : 'var(--text-primary)',
                                                marginBottom: '2px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {!setupCategory ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, flexDirection: 'column' }}>
                                            <Icon name="ArrowLeft" size={24} style={{ marginBottom: '1rem' }} />
                                            Select a component to manage terms
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h4 style={{ margin: 0 }}>
                                                    {currentSyntax.find(s => s.id === setupCategory)?.label} Terms
                                                </h4>
                                                <button className="btn btn-sm btn-primary" onClick={() => addTerm(setupCategory)}>
                                                    + Add Term
                                                </button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                                {getTerms(setupCategory).map(term => (
                                                    <div key={term.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                        <span style={{ fontWeight: '500' }}>{term.label}</span>
                                                        <button className="btn-icon" style={{ color: 'var(--text-secondary)' }} onClick={() => deleteTerm(setupCategory, term.id)}>
                                                            <Icon name="X" size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {getTerms(setupCategory).length === 0 && (
                                                    <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', opacity: 0.6, border: '1px dashed var(--border)', borderRadius: '6px' }}>
                                                        No terms added yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {setupTab === 'practice-lists' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Practice Lists</h3>
                            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>Customize standard dropdown options for practice plans.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Segment Types Column */}
                            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Segment Types</h4>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        id="new-segment-type"
                                        className="form-input"
                                        placeholder="New Segment Type..."
                                    />
                                    <button className="btn btn-primary" onClick={() => {
                                        const val = document.getElementById('new-segment-type').value.trim();
                                        if (val) {
                                            if (!practiceSegmentTypes.includes(val)) {
                                                setPracticeSegmentTypes([...practiceSegmentTypes, val]);
                                            }
                                            document.getElementById('new-segment-type').value = '';
                                        }
                                    }}>Add</button>
                                </div>

                                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {practiceSegmentTypes.map(item => {
                                        const settings = practiceSegmentSettings[item] || { showHash: true, showDefense: true };
                                        return (
                                            <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-panel)', borderRadius: '4px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontWeight: '600' }}>{item}</span>
                                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Show Hash Column">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.showHash !== false}
                                                                onChange={(e) => {
                                                                    setPracticeSegmentSettings({
                                                                        ...practiceSegmentSettings,
                                                                        [item]: { ...settings, showHash: e.target.checked }
                                                                    });
                                                                }}
                                                            /> Hash
                                                        </label>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Show Defense Column">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.showDefense !== false}
                                                                onChange={(e) => {
                                                                    setPracticeSegmentSettings({
                                                                        ...practiceSegmentSettings,
                                                                        [item]: { ...settings, showDefense: e.target.checked }
                                                                    });
                                                                }}
                                                            /> Def
                                                        </label>
                                                    </div>
                                                </div>
                                                {deleteConfirmation?.list === 'segments' && deleteConfirmation?.item === item ? (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            className="btn btn-icon"
                                                            style={{ color: 'var(--success)' }}
                                                            onClick={() => {
                                                                setPracticeSegmentTypes(practiceSegmentTypes.filter(t => t !== item));
                                                                setDeleteConfirmation(null);
                                                            }}
                                                        >
                                                            <Icon name="Check" size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-icon"
                                                            style={{ color: 'var(--text-secondary)' }}
                                                            onClick={() => setDeleteConfirmation(null)}
                                                        >
                                                            <Icon name="X" size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn btn-icon"
                                                        style={{ color: 'var(--danger)', opacity: 0.7 }}
                                                        onClick={() => setDeleteConfirmation({ list: 'segments', item })}
                                                    >
                                                        <Icon name="Trash" size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Focus Items Column */}
                            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Focus Items</h4>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        id="new-focus-item"
                                        className="form-input"
                                        placeholder="New Focus Item..."
                                    />
                                    <button className="btn btn-primary" onClick={() => {
                                        const val = document.getElementById('new-focus-item').value.trim();
                                        if (val) {
                                            if (!practiceFocusItems.includes(val)) {
                                                setPracticeFocusItems([...practiceFocusItems, val]);
                                            }
                                            document.getElementById('new-focus-item').value = '';
                                        }
                                    }}>Add</button>
                                </div>

                                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {practiceFocusItems.map(item => (
                                        <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-panel)', borderRadius: '4px' }}>
                                            <span>{item}</span>
                                            {deleteConfirmation?.list === 'focus' && deleteConfirmation?.item === item ? (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        className="btn btn-icon"
                                                        style={{ color: 'var(--success)' }}
                                                        onClick={() => {
                                                            setPracticeFocusItems(practiceFocusItems.filter(t => t !== item));
                                                            setDeleteConfirmation(null);
                                                        }}
                                                    >
                                                        <Icon name="Check" size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-icon"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                        onClick={() => setDeleteConfirmation(null)}
                                                    >
                                                        <Icon name="X" size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn btn-icon"
                                                    style={{ color: 'var(--danger)', opacity: 0.7 }}
                                                    onClick={() => setDeleteConfirmation({ list: 'focus', item })}
                                                >
                                                    <Icon name="Trash" size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
