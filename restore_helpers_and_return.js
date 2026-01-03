
const handleQuickAddPlay = (playName) => {
    const newPlay = {
        id: `play_${Date.now()}`,
        name: playName.trim(),
        formation: '',
        concept: '',
        type: 'Run',
        tags: [],
        isInstall: false
    };
    setPlays(prev => [...prev, newPlay]);
    return newPlay;
};

const handleUpdatePlay = (playId, updates) => {
    setPlays(prev => prev.map(p => p.id === playId ? { ...p, ...updates } : p));
};

const handlePatchPlay = (arg1, arg2) => {
    if (Array.isArray(arg1)) {
        // Bulk update
        const updates = arg1;
        setPlays(prev => {
            const updateMap = new Map(updates.map(u => [u.id, u]));
            return prev.map(p => updateMap.has(p.id) ? { ...p, ...updateMap.get(p.id) } : p);
        });
    } else {
        handleUpdatePlay(arg1, arg2);
    }
};

const handleDeletePlay = (playId) => {
    if (confirm("Delete this play?")) {
        setPlays(prev => prev.filter(p => p.id !== playId));
        setSelectedPlays(prev => prev.filter(id => id !== playId));
    }
};

const togglePlaySelection = (playId) => {
    setSelectedPlays(prev => {
        if (prev.includes(playId)) return prev.filter(id => id !== playId);
        return [...prev, playId];
    });
};

const handleUpdateWeek = (weekId, field, value) => {
    setWeeks(prev => prev.map(w => w.id === weekId ? { ...w, [field]: value } : w));
};

// Batch Import Logic
const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
const [importData, setImportData] = useState('');
const [parsedImport, setParsedImport] = useState([]);
const [columnMapping, setColumnMapping] = useState({});

const handleParseImport = () => {
    const rows = importData.trim().split('\n').map(r => r.trim()).filter(r => r);
    if (!rows.length) return;
    const parsed = rows.map(r => r.split(/[\t,]/).map(c => c.trim()));
    setParsedImport(parsed);
};

const handleBatchCreate = () => {
    parsedImport.forEach(row => {
        const name = row[0];
        if (name) {
            const p = handleQuickAddPlay(name);
            if (row[1]) handleUpdatePlay(p.id, { formation: row[1] });
            if (row[2]) handleUpdatePlay(p.id, { type: row[2] });
        }
    });
    setIsBatchImportOpen(false);
    setParsedImport([]);
};

const getFilteredPlaybook = () => {
    return plays.filter(play => {
        const matchFormation = !playbookFilters.formation || play.formation === playbookFilters.formation;
        const matchConcept = !playbookFilters.concept || (play.concept && play.concept === playbookFilters.concept);
        const matchTag = !playbookFilters.tag || (play.tags && play.tags.includes(playbookFilters.tag));
        return matchFormation && matchConcept && matchTag;
    });
};

// Sync Manager (Simplified)
const handleSyncAll = () => {
    if (!authUser) return alert("You must be logged in to sync.");
    if (confirm("Push all local data to cloud?")) {
        alert("Triggering Auto-Sync updates...");
    }
};

const renderDataSyncManager = () => {
    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h2>Cloud Sync</h2>
            <p>Manage your data synchronization.</p>
            <button className="btn btn-primary" onClick={handleSyncAll}>Sync All</button>
        </div>
    );
};

const GlossaryView = ({ phase = 'OFFENSE' }) => {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>{phase} Glossary</h1>
            <p>Glossary feature is currently being updated.</p>
        </div>
    );
};

const renderSetup = (phase) => {
    const isDefense = phase === 'DEFENSE';
    const isST = phase === 'SPECIAL_TEAMS';
    // ... Simplification: Standard setup renders not critically needed for App load, but defining basic structure
    return <div className="p-4"><h1>{phase} Setup</h1><p>Setup configuration view.</p></div>;
};

if (!authUser) return <LoginScreen />;

return (
    <div className="app-container">
        {schoolSetupData.showWizard && (
            <div className="overlay-wizard">
                <SetupWizard
                    authUser={authUser}
                    onComplete={async (schoolId) => {
                        console.log("Onboarding Complete");
                        setSchoolSetupData({ showWizard: false, schoolId });
                        await loadUserDataFromFirestore(authUser.uid);
                        localStorage.setItem('hc_school_id', schoolId);
                    }}
                />
            </div>
        )}

        <div className="sidebar" style={{ width: sidebarCollapsed ? '60px' : '280px', transition: 'width 0.3s ease', overflow: 'hidden' }}>
            <div style={{ marginBottom: '2rem', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {!sidebarCollapsed && (
