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
                <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>{label}</label>
                <select className="form-select" value={Array.isArray(filters[key]) ? (filters[key][0] || '') : filters[key]} onChange={e => {
                    const val = e.target.value;
                    if (val === 'All') {
                        setFilters({ ...filters, [key]: key === 'category' ? 'All' : [] });
                    } else {
                        setFilters({ ...filters, [key]: key === 'category' ? val : (val ? [val] : []) });
                    }
                }} style={{ minWidth: '100px' }}>
                    {key === 'category' ? opts.map(o => <option key={o} value={o}>{o}</option>) :
                        <>
                            <option value="">All</option>
                            {opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </>
                    }
                </select>
            </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Specific Play</label>
            <input type="text" className="form-input" placeholder="Search..." value={filters.specificPlay} onChange={e => setFilters({ ...filters, specificPlay: e.target.value })} style={{ minWidth: '120px' }} />
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setFilters(initialFilters)}>Reset</button>
        </div>
    </div>
);

const renderMetricGrid = (data, title) => {
    const stats = calcTotals(data);
    const categories = [
        { id: 'all', label: 'All Downs', min: 0, max: 99 },
        { id: 'short', label: 'Short 1-3', min: 1, max: 3 },
        { id: 'med', label: 'Med 4-6', min: 4, max: 6 },
        { id: 'long', label: 'Long 7-9', min: 7, max: 9 },
        { id: 'xl', label: 'XL 10-12', min: 10, max: 12 },
        { id: 'xxl', label: 'XXL 13+', min: 13, max: 99 }
    ];

    return (
        <div style={{ flex: 1, overflowX: 'auto', padding: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{title} ({data.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #93c5fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e40af' }}>Run / Pass</div>
                    <div style={{ fontSize: '1.2rem', color: '#1e3a8a' }}>{stats.runPct}% / {stats.passPct}%</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#166534' }}>Run Eff</div>
                    <div style={{ fontSize: '1.2rem', color: '#14532d', fontWeight: stats.runEff >= 50 ? 'bold' : 'normal' }}>{stats.runEff}%</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#166534' }}>Pass Eff</div>
                    <div style={{ fontSize: '1.2rem', color: '#14532d', fontWeight: stats.passEff >= 50 ? 'bold' : 'normal' }}>{stats.passEff}%</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#991b1b' }}>Explosive</div>
                    <div style={{ fontSize: '1.2rem', color: '#7f1d1d' }}>{stats.explosive}%</div>
                </div>
            </div>

            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Situation</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Run / Pass</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Run Eff</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Pass Eff</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Expl</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => {
                        const cell = data.filter(p => !p.distance || (p.distance >= cat.min && p.distance <= cat.max));
                        if (cell.length === 0 && cat.id !== 'all') return null;
                        const m = calcTotals(cell);
                        return (
                            <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{cat.label} <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>({m.total})</span></td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{m.runPct} / {m.passPct}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: m.runEff >= 50 ? 'bold' : 'normal' }}>{m.runEff}%</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: m.passEff >= 50 ? 'bold' : 'normal' }}>{m.passEff}%</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: m.explosive >= 15 ? 'bold' : 'normal' }}>{m.explosive}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}><Icon name="Activity" /> Offensive Self-Scout</h2>
                <div style={{ display: 'flex', background: 'var(--bg-body)', padding: '0.25rem', borderRadius: '6px' }}>
                    <button onClick={() => setView('dashboard')} style={{ padding: '0.5rem 1rem', border: 'none', background: view === 'dashboard' ? 'var(--primary)' : 'transparent', color: view === 'dashboard' ? 'white' : 'var(--text-secondary)', borderRadius: '4px', fontWeight: view === 'dashboard' ? 'bold' : 'normal' }}>Dashboard</button>
                    <button onClick={() => setView('import')} style={{ padding: '0.5rem 1rem', border: 'none', background: view === 'import' ? 'var(--primary)' : 'transparent', color: view === 'import' ? 'white' : 'var(--text-secondary)', borderRadius: '4px', fontWeight: view === 'import' ? 'bold' : 'normal' }}>Import / Data</button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><input type="checkbox" checked={isComparing} onChange={e => setIsComparing(e.target.checked)} /> Compare</label>
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
        </div>
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
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                                {renderFilterBar(filtersB, setFiltersB, scoutData)}
                                {renderMetricGrid(filterData(scoutData, filtersB), "DataSet B")}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
);
        };

const handleUpdateSelfScout = (newData) => {
    localStorage.setItem('self_scout_data', JSON.stringify(newData));
};

const useAutoSync = (authUser, key, data, debounceMs = 2000, shouldSync = true) => {
    const isFirstRun = React.useRef(true);
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        if (!shouldSync) return;

        const timer = setTimeout(() => {
            if (authUser && key && data && window.db) {
                window.db.collection('users').doc(authUser.uid).collection('user_data').doc(key).set(data ? (Array.isArray(data) ? { data } : data) : {}, { merge: true }).catch(err => console.error(err));
            }
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [data, authUser, key, shouldSync]);
};

// --- APP STATE RECONSTRUCTION ---
const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('hc-sidebar-collapsed', false);
const [editingPlay, setEditingPlay] = useState(null);
const [schoolSetupData, setSchoolSetupData] = useState({ showWizard: false, schoolId: null });
const [inviteData, setInviteData] = useState(null);
const [programRecords, setProgramRecords] = useLocalStorage('hc-program-records', {});
useAutoSync(authUser, 'program_records', programRecords);

const [culturalCalibration, setCulturalCalibration] = useLocalStorage('hc-cultural-calibration', { quotes: [], challenge: null, activeChallenge: null, responses: [] });
useAutoSync(authUser, 'cultural_calibration', culturalCalibration);

const [drills, setDrills] = useLocalStorage('hc-drills', []);
useAutoSync(authUser, 'drills', drills);

const [depthCharts, setDepthCharts] = useLocalStorage('hc-depth-charts', {});
useAutoSync(authUser, 'depth_charts', depthCharts);

const [activeYear, setActiveYear] = useState(() => localStorage.getItem('hc-active-year') || new Date().getFullYear().toString());
useEffect(() => localStorage.setItem('hc-active-year', activeYear), [activeYear]);

const [fundamentals, setFundamentals] = useLocalStorage('hc-fundamentals', { offense: [], defense: [], specialTeams: [], terms: [] });

const DEFAULT_FEATURES = {
    staffMeeting: { enabled: true },
    gameWeek: { enabled: true, items: { overview: true, practice: true, gameDay: true, smartCallsheet: true } },
    offense: { enabled: true, items: { install: true, gamePlan: true, playbook: true, wristband: true } },
    defense: { enabled: true, items: { install: true } },
    specialTeams: { enabled: true, items: { install: true } },
    program: { enabled: true, items: { roster: true, depthChart: true, culture: true } }
};

const [visibleFeatures, setVisibleFeatures] = useState(() => {
    const saved = localStorage.getItem('visible-features');
    return saved ? JSON.parse(saved) : DEFAULT_FEATURES;
});
useEffect(() => localStorage.setItem('visible-features', JSON.stringify(visibleFeatures)), [visibleFeatures]);

const [roster, setRoster] = useState(() => {
    const saved = localStorage.getItem('oc-dashboard-roster');
    return saved ? JSON.parse(saved) : [];
});
const [rooskiLibrary, setRooskiLibrary] = useState(() => {
    const saved = localStorage.getItem('rooski_ol_library');
    return saved ? JSON.parse(saved) : [];
});

const [wbSettings, setWbSettings] = useState(() => {
    const saved = localStorage.getItem('hc_wb_settings_v3');
    return saved ? JSON.parse(saved) : { card1: { type: 'standard', opp: '', iter: '1', rows: [] }, card2: { type: 'rooski-skill', opp: '', iter: '1', rows: [] }, card3: { type: 'staples', opp: '', iter: '1', rows: [] } };
});

const [positionFatigue, setPositionFatigue] = useState(() => {
    const saved = localStorage.getItem('position-fatigue-values');
    return saved ? JSON.parse(saved) : {};
});

const [budgetData, setBudgetData] = useState(() => {
    const saved = localStorage.getItem('program_budget_data');
    return saved ? JSON.parse(saved) : { income: [], expenses: [], categories: [] };
});

const [onboardingData, setOnboardingData] = useState(() => {
    const saved = localStorage.getItem('program_onboarding_data');
    return saved ? JSON.parse(saved) : { steps: [] };
});

const [weightLogs, setWeightLogs] = useState(() => {
    const saved = localStorage.getItem('athlete_weight_logs');
    return saved ? JSON.parse(saved) : {};
});

const [formations, setFormations] = useState([]);
const [zonePhilosophies, setZonePhilosophies] = useState({});

// --- INIT & SYNC LOGIC ---

const [dataLoaded, setDataLoaded] = useState(false);

useEffect(() => {
    const initUser = async () => {
        if (authUser) {
            try {
                const result = await loadUserDataFromFirestore(authUser.uid);
                if (result && result.wiped) {
                    setSchoolSetupData({ showWizard: true, schoolId: null });
                }
            } catch (e) { console.error(e); }
            finally { setDataLoaded(true); }
        } else {
            setDataLoaded(true);
        }
    };
    initUser();
}, [authUser]);

const checkSchoolInit = async () => {
    if (!authUser) return;
    // Logic to check if user has school or needs wizard
    // Simplified for restoration: rely on existing data loading to trigger wizard if empty
    const hasSchool = localStorage.getItem('hc_school_id');
    if (!hasSchool) {
        // Potentially verify against firestore, but for now assuming local is truthy enough after load
    }
};

const handleAcceptInvite = async () => {
    if (!inviteData || !authUser) return;
    try {
        // Add membership
        await window.db.collection('schools').doc(inviteData.schoolId).collection('members').doc(authUser.uid).set({
            role: inviteData.role,
            email: authUser.email,
            status: 'active',
            joinedAt: new Date().toISOString()
        });

        // Update user schools
        await window.db.collection('users').doc(authUser.uid).set({
            userSchools: { [inviteData.schoolId]: inviteData.role }
        }, { merge: true });

        // Delete invite
        await window.db.collection('invites').doc(inviteData.id).delete();

        alert("Welcome to the team!");
        window.location.reload();
    } catch (e) {
        alert("Error joining team: " + e.message);
    }
};

// Formatting Helper Check
// const handleFormation = ... (Deleted as it was corrupted, avoiding re-introduction)

// Sync Effects
useAutoSync(authUser, 'roster', roster, 2000, dataLoaded);
useAutoSync(authUser, 'rooskiLibrary', rooskiLibrary, 2000, dataLoaded);
useAutoSync(authUser, 'wbSettingsV3', wbSettings, 2000, dataLoaded);
useAutoSync(authUser, 'positionFatigue', positionFatigue, 2000, dataLoaded);
useAutoSync(authUser, 'program_budget_data', budgetData, 2000, dataLoaded);
useAutoSync(authUser, 'program_onboarding_data', onboardingData, 2000, dataLoaded);
useAutoSync(authUser, 'weightLogs', weightLogs, 2000, dataLoaded);

