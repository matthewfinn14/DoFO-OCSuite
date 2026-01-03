
const calculateMetrics = (dataSubset) => {
    const total = dataSubset.length;
    if (total === 0) return { total: 0, runPct: 0, passPct: 0, runEff: 0, passEff: 0, explosive: 0 };
    let run = 0, pass = 0, runEff = 0, passEff = 0, expl = 0;
    dataSubset.forEach(p => {
        const isRun = p.playType?.toLowerCase().includes('run');
        const isPass = p.playType?.toLowerCase().includes('pass');

        if (isRun) run++;
        if (isPass) pass++;

        let eff = false;
        if (p.down === 1 && p.gain >= 4) eff = true;
        else if (p.down === 2 && p.gain >= (p.distance / 2)) eff = true;
        else if ((p.down === 3 || p.down === 4) && p.gain >= p.distance) eff = true;

        if (eff) {
            if (isRun) runEff++;
            if (isPass) passEff++;
        }

        if (p.gain >= 12 && isRun) expl++;
        else if (p.gain >= 16 && isPass) expl++;
    });

    return {
        total,
        runPct: Math.round((run / total) * 100),
        passPct: Math.round((pass / total) * 100),
        runEff: run > 0 ? Math.round((runEff / run) * 100) : 0,
        passEff: pass > 0 ? Math.round((passEff / pass) * 100) : 0,
        explosive: Math.round((expl / total) * 100)
    };
};

const filterData = (data, filters) => {
    return data.filter(p => {
        if (filters.category === 'Base' && (p.down !== 1 && p.down !== 2)) return false;
        if (filters.category === 'Conversion' && (p.down !== 3 && p.down !== 4)) return false;
        if (filters.category === 'Explosive') {
            const isRun = p.playType?.toLowerCase().includes('run');
            const isPass = p.playType?.toLowerCase().includes('pass');
            if (!((isRun && p.gain >= 12) || (isPass && p.gain >= 16))) return false;
        }
        if (filters.personnel.length > 0 && !filters.personnel.includes(p.personnel)) return false;
        if (filters.playType.length > 0 && !filters.playType.includes(p.playType)) return false;
        if (filters.concept.length > 0 && !filters.concept.includes(p.concept)) return false;
        if (filters.specificPlay && !p.playName?.toLowerCase().includes(filters.specificPlay.toLowerCase())) return false;
        return true;
    });
};

const getUniques = (d, f) => [...new Set(d.map(x => x[f]).filter(Boolean))].sort();

const renderFilterBar = (filters, setFilters, dataset) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-panel)', borderRadius: '8px', alignItems: 'center' }}>
        {[['category', 'Category', ['All', 'Base', 'Conversion', 'Explosive']],
        ['playType', 'Play Type', getUniques(dataset, 'playType')],
        ['concept', 'Concept', getUniques(dataset, 'concept')],
        ['personnel', 'Personnel', getUniques(dataset, 'personnel')]].map(([key, label, opts]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.75rem', marginBottom: '2px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{label}</label>
                <select className="form-select" value={Array.isArray(filters[key]) ? (filters[key][0] || '') : filters[key]} onChange={e => {
                    const val = e.target.value;
                    if (val === 'All' || val === '') {
                        setFilters({ ...filters, [key]: key === 'category' ? 'All' : [] });
                    } else {
                        setFilters({ ...filters, [key]: key === 'category' ? val : [val] });
                    }
                }} style={{ minWidth: '100px' }}>
                    <option value="">All</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '2px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Specific Play</label>
            <input type="text" className="form-input" placeholder="Search..." value={filters.specificPlay} onChange={e => setFilters({ ...filters, specificPlay: e.target.value })} style={{ width: '120px' }} />
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setFilters(initialFilters)}>Reset</button>
        </div>
    </div>
);

const renderMetricGrid = (data, title) => {
    const stats = calculateMetrics(data);
    const categories = [
        { id: 'short', label: 'Short 1-3', min: 1, max: 3 },
        { id: 'med', label: 'Med 4-6', min: 4, max: 6 },
        { id: 'long', label: 'Long 7-10', min: 7, max: 10 },
        { id: 'xl', label: 'XL 10-12', min: 10, max: 12 },
        { id: 'xxl', label: 'XXL 12+', min: 12, max: 99 }
    ];

    const calcTotals = (d) => calculateMetrics(d);

    return (
        <div style={{ flex: 1, overflowX: 'auto', padding: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>{title} ({data.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #93c5fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1e40af' }}>Run / Pass</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.runPct}% / {stats.passPct}%</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold', color: '#166534' }}>Run Eff</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: stats.runEff >= 45 ? 'bold' : 'normal' }}>{stats.runEff}%</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold', color: '#166534' }}>Pass Eff</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: stats.passEff >= 55 ? 'bold' : 'normal' }}>{stats.passEff}%</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold', color: '#7f1d1d' }}>Explosive</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: stats.explosive >= 12 ? 'bold' : 'normal' }}>{stats.explosive}%</div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Situation</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Run / Pass</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Run Eff</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Pass Eff</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Explosive</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => {
                        const sub = data.filter(p => p.distance >= cat.min && p.distance <= cat.max);
                        if (sub.length === 0) return null;
                        const m = calcTotals(sub);
                        return (
                            <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem' }}>{cat.label} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({sub.length})</span></td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{m.runPct}% / {m.passPct}%</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: m.runEff >= 45 ? 'bold' : 'normal' }}>{m.runEff}%</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: m.passEff >= 55 ? 'bold' : 'normal' }}>{m.passEff}%</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: m.explosive >= 12 ? 'bold' : 'normal' }}>{m.explosive}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

return (
    <div className="flex h-screen overflow-hidden" style={{ flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Offensive Self-Scout</h2>
            <div style={{ display: 'flex', background: 'var(--bg-body)', padding: '0.25rem', borderRadius: '6px' }}>
                <button onClick={() => setView('dashboard')} style={{ padding: '0.5rem 1rem', border: 'none', background: view === 'dashboard' ? 'var(--primary)' : 'transparent', color: view === 'dashboard' ? 'white' : 'var(--text-secondary)', borderRadius: '4px', fontWeight: view === 'dashboard' ? 'bold' : 'normal', cursor: 'pointer' }}>Dashboard</button>
                <button onClick={() => setView('import')} style={{ padding: '0.5rem 1rem', border: 'none', background: view === 'import' ? 'var(--primary)' : 'transparent', color: view === 'import' ? 'white' : 'var(--text-secondary)', borderRadius: '4px', fontWeight: view === 'import' ? 'bold' : 'normal', cursor: 'pointer' }}>Import / Data</button>
            </div>
        </div>
        {view === 'dashboard' && (
            <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isComparing} onChange={e => setIsComparing(e.target.checked)} /> Compare Datasets
                </label>
                <button className="btn btn-secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>Close</button>
            </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
            {view === 'import' ? (
                <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h2>Import Data</h2>
                        {scoutData.length > 0 && <button className="btn btn-danger" onClick={() => { if (window.confirm('Clear ALL?')) { setScoutData([]); onSaveData([]); } }}>Clear All Data</button>}
                    </div>
                    {importStep === 1 && (
                        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3>Game Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div><label>Date</label><input type="date" className="form-input" value={importMeta.date} onChange={e => setImportMeta({ ...importMeta, date: e.target.value })} /></div>
                                    <div><label>Week #</label><input type="number" className="form-input" value={importMeta.week} onChange={e => setImportMeta({ ...importMeta, week: e.target.value })} /></div>
                                    <div><label>Opponent</label><input type="text" className="form-input" value={importMeta.opponent} onChange={e => setImportMeta({ ...importMeta, opponent: e.target.value })} /></div>
                                    <div><label>Result</label><select className="form-select" value={importMeta.result} onChange={e => setImportMeta({ ...importMeta, result: e.target.value })}><option>Win</option><option>Loss</option><option>Tie</option></select></div>
                                </div>
                            </div>
                            <div className="card" style={{ padding: '3rem', border: '2px dashed var(--border)', textAlign: 'center' }}>
                                <h3>Upload CSV</h3>
                                <input type="file" accept=".csv" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { parseCSV(ev.target.result); setImportStep(2); }; r.readAsText(f); } }} />
                            </div>
                        </div>
                    )}
                    {importStep === 2 && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <h3>Map Columns</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                {Object.keys(columnMap).map(key => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-body)' }}>
                                        <label style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{key}</label>
                                        <select className="form-select" value={columnMap[key]} onChange={e => setColumnMap({ ...columnMap, [key]: e.target.value })} style={{ width: '200px' }}>
                                            <option value="">-- Select --</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setImportStep(1)}>Back</button>
                                <button className="btn btn-primary" onClick={finalizeImport}>Complete Import</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                            {renderFilterBar(filtersA, setFiltersA, scoutData)}
                            {renderMetricGrid(filterData(scoutData, filtersA), isComparing ? "DataSet A" : "Overview")}
                        </div>
                        {isComparing && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                                {renderFilterBar(filtersB, setFiltersB, scoutData)}
                                {renderMetricGrid(filterData(scoutData, filtersB), "DataSet B (Last Week/Scout)")}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
);
        };

const [fundamentals, setFundamentals] = useLocalStorage('program_fundamentals', { offense: [], defense: [], specialTeams: [] });

const DEFAULT_FEATURES = {
    staffMeeting: { enabled: true },
    gameWeek: { enabled: true, items: { overview: true, practice: true, gameDay: true, smartCallsheet: true } },
    offense: { enabled: true, items: { install: true, gamePlan: true, playbook: true, wristband: true } },
    defense: { enabled: true, items: { install: true } },
    specialTeams: { enabled: true, items: { install: true } },
    program: { enabled: true, items: { roster: true, depthChart: true, culture: true } }
};

const [visibleFeatures, setVisibleFeatures] = useState(() => {
    const saved = localStorage.getItem('hc-visible-features');
    return saved ? JSON.parse(saved) : DEFAULT_FEATURES;
});

useEffect(() => localStorage.setItem('hc-visible-features', JSON.stringify(visibleFeatures)), [visibleFeatures]);

const [roster, setRoster] = useState(() => {
    try {
        const saved = localStorage.getItem('oc-dashboard-roster');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
});

// App Component Return Structure
if (!authUser) return <LoginScreen />;

// Sidebar Implementation
const renderSidebar = () => (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}>
        {/* Dashboard */}
        <div className="nav-item-container">
            <button
                className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
                title="Dashboard"
            >
                <Icon name="LayoutDashboard" size={20} />
                {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
        </div>

        {/* Game Week */}
        <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-title">GAME WEEK</div>}
            <button
                className={`nav-item ${view === 'week-overview' ? 'active' : ''}`}
                onClick={() => setView('week-overview')}
            >
                <Icon name="Calendar" size={20} />
                {!sidebarCollapsed && <span>Overview</span>}
            </button>
            <button
                className={`nav-item ${view === 'practice-script' ? 'active' : ''}`}
                onClick={() => setView('practice-script')}
            >
                <Icon name="ClipboardList" size={20} />
                {!sidebarCollapsed && <span>Practice</span>}
            </button>
            <button
                className={`nav-item ${view === 'smart-call-sheet' ? 'active' : ''}`}
                onClick={() => setView('smart-call-sheet')}
            >
                <Icon name="FileText" size={20} />
                {!sidebarCollapsed && <span>Call Sheet</span>}
            </button>
        </div>

        {/* Offense */}
        <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-title">OFFENSE</div>}
            <button
                className={`nav-item ${view === 'playbook' ? 'active' : ''}`}
                onClick={() => setView('playbook')}
            >
                <Icon name="BookOpen" size={20} />
                {!sidebarCollapsed && <span>Playbook</span>}
            </button>
            <button
                className={`nav-item ${view === 'gameplan' ? 'active' : ''}`}
                onClick={() => setView('gameplan')}
            >
                <Icon name="Map" size={20} />
                {!sidebarCollapsed && <span>Game Plan</span>}
            </button>
            <button
                className={`nav-item ${view === 'install' ? 'active' : ''}`}
                onClick={() => setView('install')}
            >
                <Icon name="Layers" size={20} />
                {!sidebarCollapsed && <span>Install</span>}
            </button>
            <button
                className={`nav-item ${view === 'self-scout' ? 'active' : ''}`}
                onClick={() => setView('self-scout')}
            >
                <Icon name="Activity" size={20} />
                {!sidebarCollapsed && <span>Self Scout</span>}
            </button>
        </div>

        {/* Program */}
        <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-title">PROGRAM</div>}
            <button
                className={`nav-item ${view === 'roster' ? 'active' : ''}`}
                onClick={() => setView('roster')}
            >
                <Icon name="Users" size={20} />
                {!sidebarCollapsed && <span>Roster</span>}
            </button>
        </div>

        {/* Bottom Actions */}
        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <button
                className="nav-item"
                onClick={() => {
                    if (window.confirm('Sign Out?')) {
                        window.auth.signOut();
                        window.location.reload();
                    }
                }}
                style={{ color: '#ef4444' }}
            >
                <Icon name="LogOut" size={20} />
                {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
        </div>
    </div>
);

return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-body)', color: 'var(--text-primary)' }}>
        {renderSidebar()}
        <main className="main-content" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

            {/* VIEW ROUTING */}
            {view === 'dashboard' && <Dashboard
                week={currentWeek}
                stats={{ plays: plays.length, install: 0, scripts: 0 }}
                tasks={masterTasks}
                onViewChange={setView}
            />}

            {view === 'settings' && <Settings
                teamLogo={teamLogo} onUpdateLogo={setTeamLogo}
                accentColor={accentColor} onUpdateAccentColor={handleUpdateAccentColor}
                theme={theme} onUpdateTheme={handleUpdateTheme}
                positionNames={positionNames} onUpdatePositionNames={setPositionNames}
                activeYear={activeYear} onUpdateActiveYear={setActiveYear}
                visibleFeatures={visibleFeatures} onUpdateVisibleFeatures={setVisibleFeatures}
                renderSyncManager={() => <div />}
                isSiteAdmin={false}
                currentSchoolId={localStorage.getItem('hc_school_id')}
                programLevels={['Varsity', 'JV']} onUpdateProgramLevels={() => { }}
            />}

            {view === 'week-overview' && <GameWeekOverview week={currentWeek} onUpdateWeek={handleUpdateWeek} />}

            {view === 'practice-script' && <PracticeScriptBuilder
                plans={currentWeek.practicePlans}
                onUpdatePlans={(updated) => handleUpdateWeek({ ...currentWeek, practicePlans: updated })}
                plays={plays}
                roster={roster}
                drills={drills}
            />}

            {view === 'smart-call-sheet' && <SmartCallSheet
                gamePlan={currentWeek.offensiveGamePlan}
                plays={plays}
            />}

            {view === 'playbook' && <PlaybookView
                plays={plays}
                onUpdatePlay={handleUpdatePlay}
                onDeletePlay={handleDeletePlay}
                onAddPlay={handleQuickAddPlay}
            />}

            {view === 'gameplan' && <OffensiveGamePlan
                gamePlan={currentWeek.offensiveGamePlan}
                onUpdateGamePlan={(gp) => handleUpdateWeek({ ...currentWeek, offensiveGamePlan: gp })}
                plays={plays}
                formations={formations}
            />}

            {view === 'install' && <InstallManagerView
                plays={plays}
                week={currentWeek}
                onUpdateWeek={handleUpdateWeek}
                gamePlan={currentWeek.offensiveGamePlan}
            />}

            {view === 'self-scout' && <SelfScoutAnalytics
                data={selfScoutData}
                onSaveData={handleUpdateSelfScout}
                onClose={() => setView('dashboard')}
            />}

            {view === 'roster' && <RosterManager
                roster={roster}
                onUpdateRoster={setRoster}
                positionNames={positionNames}
            />}

            {/* Fallback for un-implemented views */}
            {!['dashboard', 'settings', 'week-overview', 'practice-script', 'smart-call-sheet', 'playbook', 'gameplan', 'install', 'self-scout', 'roster'].includes(view) && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>View Not Implementation</h2>
                    <p>The view "{view}" is currently being restored or is under maintenance.</p>
                    <button className="btn btn-primary" onClick={() => setView('dashboard')}>Return to Dashboard</button>
                </div>
            )}

        </main>
    </div>
);
    };

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props); this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: '#ef4444', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h1>Something went wrong.</h1>
                    <p>{this.state.error && this.state.error.toString()}</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>Reload Application</button>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.render(
    <ErrorBoundary>
        <AuthProvider>
            <App />
        </AuthProvider>
    </ErrorBoundary>,
    document.getElementById('root')
);
