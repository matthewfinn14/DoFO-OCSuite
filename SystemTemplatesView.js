const SystemTemplatesView = ({
    globalWeekTemplates, setGlobalWeekTemplates,
    globalPregameTemplates, setGlobalPregameTemplates,
    globalCallSheetTemplates, setGlobalCallSheetTemplates
}) => {
    const [activeTab, setActiveTab] = useState('practice');

    const renderTemplateList = (templates, setTemplates, typeName) => {
        const handleDelete = (id) => {
            if (confirm(`Delete this ${typeName} template?`)) {
                setTemplates(templates.filter(t => t.id !== id));
            }
        };

        const handleRename = (id, currentName) => {
            const newName = prompt("Rename Template:", currentName);
            if (newName) {
                setTemplates(templates.map(t => t.id === id ? { ...t, name: newName } : t));
            }
        };

        if (!templates || templates.length === 0) return <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No {typeName} templates saved.</div>;

        return (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {templates.map(t => (
                    <div key={t.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Created: {new Date().toLocaleDateString()}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => handleRename(t.id, t.name)}><Icon name="Edit" size={14} /> Rename</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}><Icon name="Trash2" size={14} /> Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>System Templates</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your reusable templates for practice, pre-game, and call sheets.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['practice', 'pregame', 'callsheet'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {tab === 'practice' ? 'Practice Plans' : tab === 'pregame' ? 'Pre-game Timelines' : 'Call Sheets'}
                    </button>
                ))}
            </div>

            <div className="animate-fade-in">
                {activeTab === 'practice' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Practice Plan Templates</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Save specific practice structures (e.g. "Tuesday In-Season", "Camp Day 1") as templates.
                                </p>
                            </div>
                            {/* Create button usually only exists from a real week, but we could add purely structural create here? 
                                        For now, user creates from existing weeks. */}
                        </div>
                        {renderTemplateList(globalWeekTemplates, setGlobalWeekTemplates, 'practice')}
                    </div>
                )}
                {activeTab === 'pregame' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Pre-game Timelines</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Manage your pre-game schedules (Home, Away, Playoff variants).
                                </p>
                            </div>
                        </div>
                        {renderTemplateList(globalPregameTemplates, setGlobalPregameTemplates, 'pregame')}
                    </div>
                )}
                {activeTab === 'callsheet' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Call Sheet Layouts</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Manage custom call sheet configurations and wristband layouts.
                                </p>
                            </div>
                        </div>
                        {renderTemplateList(globalCallSheetTemplates, setGlobalCallSheetTemplates, 'callsheet')}
                    </div>
                )}
            </div>
        </div>
    );
};

