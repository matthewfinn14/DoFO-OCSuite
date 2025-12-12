// ============================================
// PLAYER-FACING APP PREVIEW
// ============================================
const PlayerApp = ({ roster, attendance, setRoster, setAttendance, tasks = [], onUpdateTasks = () => { } }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState(roster.length > 0 ? roster[0].id : '');
    const [activeTab, setActiveTab] = useState('wellness'); // wellness, profile, attendance, achievements
    const [showCoachAlert, setShowCoachAlert] = useState(false);

    // Daily Connections State
    const [dailyConnections, setDailyConnections] = useState(() => {
        const saved = localStorage.getItem('player_daily_connections');
        return saved ? JSON.parse(saved) : {};
    });

    // Warrior Dial Form State
    const [wellnessForm, setWellnessForm] = useState({
        soreness: 5,
        fatigue: 5,
        stress: 5,
        mood: 5,
        sleepQuality: 5,
        sleepDuration: 7,
        pain: false,
        painLocation: '',
        painSeverity: 5,
        rpe: 5,
        notes: ''
    });

    const selectedPlayer = roster.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) return <div>No players found</div>;

    // Helper function to get today's date string
    const getTodayString = () => new Date().toISOString().split('T')[0];

    // Effect to auto-select first player if none selected
    useEffect(() => {
        if (!selectedPlayerId && roster.length > 0) {
            setSelectedPlayerId(roster[0].id);
        }
    }, [roster, selectedPlayerId]);

    // Generate daily connections if missing
    useEffect(() => {
        if (!selectedPlayerId || roster.length === 0) return;

        const today = getTodayString();
        const playerConnections = dailyConnections[selectedPlayerId];

        // If no connections exist or they're from a different day, generate new ones
        if (!playerConnections || playerConnections.date !== today) {
            // Get available teammates (exclude the current player)
            const availableTeammates = roster.filter(p => p.id !== selectedPlayerId);
            const randomTeammate = availableTeammates.length > 0
                ? availableTeammates[Math.floor(Math.random() * availableTeammates.length)]
                : null;

            // Get available coaches from staff
            const coaches = ['Coach Smith', 'Coach Johnson', 'Coach Williams', 'Coach Brown', 'Coach Davis'];
            const randomCoach = coaches[Math.floor(Math.random() * coaches.length)];

            const newConnections = {
                date: today,
                teammate: randomTeammate ? {
                    id: randomTeammate.id,
                    name: `${randomTeammate.firstName} ${randomTeammate.lastName}`,
                    jersey: randomTeammate.jersey,
                    position: randomTeammate.position
                } : null,
                coach: randomCoach
            };

            // Update state and localStorage
            setDailyConnections(prev => {
                const updated = { ...prev, [selectedPlayerId]: newConnections };
                localStorage.setItem('player_daily_connections', JSON.stringify(updated));
                return updated;
            });
        }
    }, [selectedPlayerId, dailyConnections, roster]);

    // Get current player's daily connections
    const currentConnections = dailyConnections[selectedPlayerId] || { teammate: null, coach: null };

    // Calculate readiness score
    const calculateReadiness = (form) => {
        const physical = (10 - form.soreness + 10 - form.fatigue) / 2;
        const mental = (10 - form.stress + form.mood) / 2;
        const sleep = form.sleepQuality;
        const readiness = ((physical + mental + sleep) / 3).toFixed(1);
        return parseFloat(readiness);
    };

    // Submit Warrior Dial
    const submitWellnessLog = () => {
        const readiness = calculateReadiness(wellnessForm);
        const newLog = {
            id: `wdl_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            ...wellnessForm,
            readiness
        };

        const updatedRoster = roster.map(p => {
            if (p.id === selectedPlayerId) {
                return {
                    ...p,
                    metrics: {
                        ...p.metrics,
                        warriorDialLogs: [...(p.metrics.warriorDialLogs || []), newLog]
                    }
                };
            }
            return p;
        });
        setRoster(updatedRoster);

        // Show alert if readiness is low
        if (readiness < 5) {
            setShowCoachAlert(true);
        }

        // Reset form
        setWellnessForm({
            soreness: 5,
            fatigue: 5,
            stress: 5,
            mood: 5,
            sleepQuality: 5,
            sleepDuration: 7,
            pain: false,
            painLocation: '',
            painSeverity: 5,
            rpe: 5,
            notes: ''
        });
    };

    // Get player's attendance records
    const playerAttendance = attendance.filter(a => a.playerId === selectedPlayerId);
    const attendanceStats = {
        total: playerAttendance.length,
        present: playerAttendance.filter(a => a.status === 'present').length,
        absent: playerAttendance.filter(a => a.status === 'absent').length,
        excused: playerAttendance.filter(a => a.status === 'excused').length
    };
    const attendancePercentage = attendanceStats.total > 0
        ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)
        : 0;

    // Calculate current streak
    const calculateStreak = () => {
        const sorted = [...playerAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));
        let streak = 0;
        for (const record of sorted) {
            if (record.status === 'present') streak++;
            else break;
        }
        return streak;
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '2rem',
            background: '#1a1a1a', // Dark background for contrast
            minHeight: '100vh'
        }}>
            <div style={{
                width: '375px',
                height: '812px',
                background: 'black',
                borderRadius: '40px',
                padding: '12px',
                boxShadow: '0 0 0 10px #333, 0 20px 40px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* iPhone Notch */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '50%',
                    height: '30px',
                    background: '#333',
                    borderBottomLeftRadius: '20px',
                    borderBottomRightRadius: '20px',
                    zIndex: 1000
                }}></div>

                {/* Status Bar Mockup */}
                <div style={{
                    height: '44px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    paddingTop: '10px'
                }}>
                    <span>9:41</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <Icon name="Signal" size={12} />
                        <Icon name="Wifi" size={12} />
                        <Icon name="Battery" size={12} />
                    </div>
                </div>

                {/* App Screen Content */}
                <div style={{
                    background: '#000', // App background color
                    height: 'calc(100% - 44px - 34px)', // Deduct status bar and home indicator area
                    overflowY: 'auto',
                    borderRadius: '30px',
                    color: 'white',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}>
                    <div style={{ padding: '1rem', paddingBottom: '3rem' }}>
                        {/* Player Selector */}
                        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {selectedPlayer.jersey}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <select
                                        className="form-input"
                                        value={selectedPlayerId}
                                        onChange={e => setSelectedPlayerId(e.target.value)}
                                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                                    >
                                        {roster.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.firstName} {p.lastName} (#{p.jersey})
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        {selectedPlayer.position} • {selectedPlayer.year}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
                            {[
                                { id: 'wellness', label: 'Daily Check-In', icon: 'Heart' },
                                { id: 'checklist', label: 'My Checklist', icon: 'CheckSquare' },
                                { id: 'profile', label: 'My Profile', icon: 'User' },
                                { id: 'attendance', label: 'Attendance', icon: 'Calendar' },
                                { id: 'achievements', label: 'Progress', icon: 'Award' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                                        color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                                        fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.85rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <Icon name={tab.icon} size={20} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* WELLNESS TAB */}
                        {activeTab === 'wellness' && (
                            <div>
                                {/* Daily Connections Card */}
                                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))' }}>
                                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>🤝</span>
                                        Today's Connections
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                        Connect with these teammates today to build stronger bonds!
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {/* Teammate Connection */}
                                        {currentConnections.teammate && (
                                            <div style={{
                                                padding: '1rem',
                                                background: 'rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                border: '2px solid rgba(34, 197, 94, 0.3)'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                    Teammate
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: '#22c55e',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold',
                                                        color: 'white'
                                                    }}>
                                                        {currentConnections.teammate.jersey}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                                            {currentConnections.teammate.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {currentConnections.teammate.position}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Coach Connection */}
                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            border: '2px solid rgba(59, 130, 246, 0.3)'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                Coach
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.25rem',
                                                    color: 'white'
                                                }}>
                                                    👨‍🏫
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                                        {currentConnections.coach}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        Reach out today!
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wellness Check-In Card */}
                                <div className="card" style={{ padding: '1.5rem' }}>
                                    <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Icon name="Heart" color="var(--accent)" />
                                        Daily Wellness Check-In
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                        How are you feeling today? Move the sliders to rate each area.
                                    </p>

                                    {/* Wellness Sliders */}
                                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                                        {[
                                            { key: 'soreness', label: 'Muscle Soreness', color: '#f97316', inverse: true },
                                            { key: 'fatigue', label: 'Fatigue', color: '#ef4444', inverse: true },
                                            { key: 'stress', label: 'Stress Level', color: '#a855f7', inverse: true },
                                            { key: 'mood', label: 'Mood', color: '#22c55e', inverse: false },
                                            { key: 'sleepQuality', label: 'Sleep Quality', color: '#3b82f6', inverse: false }
                                        ].map(item => (
                                            <div key={item.key}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <label style={{ fontWeight: '500' }}>{item.label}</label>
                                                    <span style={{
                                                        fontWeight: 'bold',
                                                        fontSize: '1.25rem',
                                                        color: item.color
                                                    }}>
                                                        {wellnessForm[item.key]}/10
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={wellnessForm[item.key]}
                                                    onChange={e => setWellnessForm({ ...wellnessForm, [item.key]: parseInt(e.target.value) })}
                                                    style={{
                                                        width: '100%',
                                                        height: '8px',
                                                        borderRadius: '4px',
                                                        outline: 'none',
                                                        background: `linear-gradient(to right, ${item.color} 0%, ${item.color} ${wellnessForm[item.key] * 10}%, rgba(255,255,255,0.1) ${wellnessForm[item.key] * 10}%, rgba(255,255,255,0.1) 100%)`
                                                    }}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                    <span>{item.inverse ? 'None' : 'Poor'}</span>
                                                    <span>{item.inverse ? 'Extreme' : 'Excellent'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pain Checkbox */}
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={wellnessForm.pain}
                                                onChange={e => setWellnessForm({ ...wellnessForm, pain: e.target.checked })}
                                            />
                                            <span style={{ fontWeight: 'bold' }}>I'm experiencing pain or discomfort</span>
                                        </label>
                                        {wellnessForm.pain && (
                                            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                                                <input
                                                    className="form-input"
                                                    placeholder="Where does it hurt? (e.g., Left knee, Right shoulder)"
                                                    value={wellnessForm.painLocation}
                                                    onChange={e => setWellnessForm({ ...wellnessForm, painLocation: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Additional Notes (Optional)</label>
                                        <textarea
                                            className="form-input"
                                            placeholder="Anything else you want to share with the coaching staff?"
                                            value={wellnessForm.notes}
                                            onChange={e => setWellnessForm({ ...wellnessForm, notes: e.target.value })}
                                            rows={3}
                                            style={{ width: '100%', resize: 'vertical' }}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        className="btn btn-primary"
                                        onClick={submitWellnessLog}
                                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                                    >
                                        Submit Daily Check-In
                                    </button>

                                    {/* Recent Logs */}
                                    {selectedPlayer.metrics.warriorDialLogs && selectedPlayer.metrics.warriorDialLogs.length > 0 && (
                                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                            <h3 style={{ marginBottom: '1rem' }}>Recent Check-Ins</h3>
                                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                {selectedPlayer.metrics.warriorDialLogs.slice(-5).reverse().map(log => (
                                                    <div key={log.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold' }}>{new Date(log.date).toLocaleDateString()}</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                Soreness: {log.soreness} • Fatigue: {log.fatigue} • Sleep: {log.sleepQuality}
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '1.5rem',
                                                            fontWeight: 'bold',
                                                            color: log.readiness < 5 ? '#ef4444' : log.readiness < 7 ? '#eab308' : '#22c55e'
                                                        }}>
                                                            {log.readiness}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CHECKLIST TAB */}
                        {activeTab === 'checklist' && (
                            <div className="card" style={{ padding: '1.5rem', background: 'var(--card-bg)', color: 'var(--text)' }}>
                                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Icon name="CheckSquare" color="var(--accent)" /> My Checklist
                                </h2>

                                {(() => {
                                    const myTasks = tasks.filter(t => t.assignTo && t.assignTo.includes(selectedPlayerId));
                                    const pendingTasks = myTasks.filter(t => !t.completed);
                                    const completedTasks = myTasks.filter(t => t.completed);

                                    const toggleTask = (taskId) => {
                                        const updatedTasks = tasks.map(t => {
                                            if (t.id === taskId) {
                                                return { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null };
                                            }
                                            return t;
                                        });
                                        onUpdateTasks(updatedTasks);
                                    };

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {/* Pending Tasks */}
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>To Do ({pendingTasks.length})</h3>
                                                {pendingTasks.length === 0 ? (
                                                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                                                        No pending tasks! great job.
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {pendingTasks.map(task => (
                                                            <div key={task.id} style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={false}
                                                                    onChange={() => toggleTask(task.id)}
                                                                    style={{ marginTop: '0.3rem', width: '20px', height: '20px', cursor: 'pointer' }}
                                                                />
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>{task.task}</div>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                        {task.priority && <span style={{ color: task.priority === 'High' ? '#ef4444' : 'inherit' }}>{task.priority} Priority</span>}
                                                                        {task.deadline && <span>• Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                                                                    </div>
                                                                    {task.notes && <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{task.notes}</div>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Completed Tasks */}
                                            {completedTasks.length > 0 && (
                                                <div>
                                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Completed ({completedTasks.length})</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.7 }}>
                                                        {completedTasks.map(task => (
                                                            <div key={task.id} style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={true}
                                                                    onChange={() => toggleTask(task.id)}
                                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                                />
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 'bold', fontSize: '1rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{task.task}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Low Score Alert Modal */}
                        {showCoachAlert && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'rgba(0,0,0,0.8)',
                                    zIndex: 3000,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                onClick={() => setShowCoachAlert(false)}
                            >
                                <div
                                    className="card"
                                    style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                                    <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>Low Wellness Score</h2>
                                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                                        Your wellness score is lower than usual. Would you like to reach out to a coach for support?
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            className="btn"
                                            onClick={() => setShowCoachAlert(false)}
                                            style={{ flex: 1 }}
                                        >
                                            Not Now
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                alert('Coach notification sent! A coach will reach out to you soon.');
                                                setShowCoachAlert(false);
                                            }}
                                            style={{ flex: 1 }}
                                        >
                                            Contact Coach
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="card" style={{ padding: '1.5rem', background: 'var(--card-bg)', color: 'var(--text)' }}>
                                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>My Profile</h2>

                                {/* Profile Photo Section */}
                                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text)' }}>Profile Photo</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            background: selectedPlayer.profilePhoto ? `url(${selectedPlayer.profilePhoto})` : 'var(--accent)',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '3rem',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            border: '3px solid var(--accent)'
                                        }}>
                                            {!selectedPlayer.profilePhoto && selectedPlayer.jersey}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                                                Upload Photo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                const updatedRoster = roster.map(p =>
                                                                    p.id === selectedPlayerId
                                                                        ? { ...p, profilePhoto: event.target.result }
                                                                        : p
                                                                );
                                                                setRoster(updatedRoster);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                                Upload a profile photo (JPG, PNG)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text)' }}>About Me</h3>

                                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                                        {/* Goals */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>My Goals</label>
                                            <textarea
                                                className="form-input"
                                                placeholder="What are your goals for this season and beyond?"
                                                value={selectedPlayer.personalInfo?.goals || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, goals: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                rows={3}
                                                style={{ width: '100%', resize: 'vertical', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* What I Love About Football */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>What I Love About Football</label>
                                            <textarea
                                                className="form-input"
                                                placeholder="What do you love most about playing football?"
                                                value={selectedPlayer.personalInfo?.lovesAboutFootball || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, lovesAboutFootball: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                rows={2}
                                                style={{ width: '100%', resize: 'vertical', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* Dislikes */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Dislikes</label>
                                            <input
                                                className="form-input"
                                                placeholder="What do you dislike or find challenging?"
                                                value={selectedPlayer.personalInfo?.dislikes || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, dislikes: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* How I Describe Myself */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>How I Describe Myself</label>
                                            <input
                                                className="form-input"
                                                placeholder="Describe yourself in a few words..."
                                                value={selectedPlayer.personalInfo?.selfDescription || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, selfDescription: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* Two Column Layout for Interests */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <label className="form-label" style={{ color: 'var(--text)' }}>Favorite TV Shows</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="e.g., The Office, Breaking Bad"
                                                    value={selectedPlayer.personalInfo?.tvShows || ''}
                                                    onChange={(e) => {
                                                        const updatedRoster = roster.map(p =>
                                                            p.id === selectedPlayerId
                                                                ? { ...p, personalInfo: { ...p.personalInfo, tvShows: e.target.value } }
                                                                : p
                                                        );
                                                        setRoster(updatedRoster);
                                                    }}
                                                    style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ color: 'var(--text)' }}>Favorite Video Games</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="e.g., Madden, Call of Duty"
                                                    value={selectedPlayer.personalInfo?.videoGames || ''}
                                                    onChange={(e) => {
                                                        const updatedRoster = roster.map(p =>
                                                            p.id === selectedPlayerId
                                                                ? { ...p, personalInfo: { ...p.personalInfo, videoGames: e.target.value } }
                                                                : p
                                                        );
                                                        setRoster(updatedRoster);
                                                    }}
                                                    style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Pump Up Song */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Favorite Pump Up Song</label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g., Eye of the Tiger, Till I Collapse"
                                                value={selectedPlayer.personalInfo?.pumpUpSong || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, pumpUpSong: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* Favorite Restaurant */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Favorite Restaurant</label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g., Chipotle, Chick-fil-A"
                                                value={selectedPlayer.personalInfo?.favoriteRestaurant || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, favoriteRestaurant: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* Favorite Class */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Favorite Class</label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g., History, Math, PE"
                                                value={selectedPlayer.personalInfo?.favoriteClass || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, favoriteClass: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* Dislikes */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Dislikes</label>
                                            <input
                                                className="form-input"
                                                placeholder="What do you dislike or find challenging?"
                                                value={selectedPlayer.personalInfo?.dislikes || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, dislikes: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* Other Hobbies */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Other Hobbies</label>
                                            <textarea
                                                className="form-input"
                                                rows="3"
                                                placeholder="What other hobbies or interests do you have?"
                                                value={selectedPlayer.personalInfo?.otherHobbies || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, otherHobbies: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        {/* Other Activities */}
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Other Activities I'm Involved In</label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g., Basketball, Band, Student Council"
                                                value={selectedPlayer.personalInfo?.otherActivities || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, otherActivities: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Relationships */}
                                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text)' }}>Relationships & Support</h3>

                                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Teammates I Trust</label>
                                            <input
                                                className="form-input"
                                                placeholder="List teammates you trust and rely on..."
                                                value={selectedPlayer.personalInfo?.trustedTeammates || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, trustedTeammates: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ color: 'var(--text)' }}>Coaches I'm Willing to Confide In</label>
                                            <input
                                                className="form-input"
                                                placeholder="Which coaches do you feel comfortable talking to?"
                                                value={selectedPlayer.personalInfo?.confideInCoaches || ''}
                                                onChange={(e) => {
                                                    const updatedRoster = roster.map(p =>
                                                        p.id === selectedPlayerId
                                                            ? { ...p, personalInfo: { ...p.personalInfo, confideInCoaches: e.target.value } }
                                                            : p
                                                    );
                                                    setRoster(updatedRoster);
                                                }}
                                                style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <label className="form-label" style={{ color: 'var(--text)' }}>Mentor</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="Who is your mentor?"
                                                    value={selectedPlayer.personalInfo?.mentor || ''}
                                                    onChange={(e) => {
                                                        const updatedRoster = roster.map(p =>
                                                            p.id === selectedPlayerId
                                                                ? { ...p, personalInfo: { ...p.personalInfo, mentor: e.target.value } }
                                                                : p
                                                        );
                                                        setRoster(updatedRoster);
                                                    }}
                                                    style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ color: 'var(--text)' }}>Best Friend</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="Who is your best friend?"
                                                    value={selectedPlayer.personalInfo?.bestFriend || ''}
                                                    onChange={(e) => {
                                                        const updatedRoster = roster.map(p =>
                                                            p.id === selectedPlayerId
                                                                ? { ...p, personalInfo: { ...p.personalInfo, bestFriend: e.target.value } }
                                                                : p
                                                        );
                                                        setRoster(updatedRoster);
                                                    }}
                                                    style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sports Participation Table */}
                                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text)' }}>Sports Participation</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid var(--border)', color: 'var(--text)' }}>Year</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid var(--border)', color: 'var(--text)' }}>Fall</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid var(--border)', color: 'var(--text)' }}>Winter</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid var(--border)', color: 'var(--text)' }}>Spring</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid var(--border)', color: 'var(--text)' }}>Summer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['Senior', 'Junior', 'Sophomore', 'Freshman'].map((year, index) => (
                                                    <tr key={year} style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                                        <td style={{ padding: '0.75rem', fontWeight: 'bold', border: '1px solid var(--border)', color: 'var(--text)' }}>{year}</td>
                                                        {['fall', 'winter', 'spring', 'summer'].map(season => {
                                                            const sportsData = selectedPlayer.sportsParticipation || {};
                                                            const yearData = sportsData[year.toLowerCase()] || {};
                                                            return (
                                                                <td key={season} style={{ padding: '0.5rem', border: '1px solid var(--border)' }}>
                                                                    <input
                                                                        className="form-input"
                                                                        placeholder="Sport"
                                                                        value={yearData[season] || ''}
                                                                        onChange={(e) => {
                                                                            const updatedRoster = roster.map(p => {
                                                                                if (p.id === selectedPlayerId) {
                                                                                    const currentSports = p.sportsParticipation || {};
                                                                                    const currentYear = currentSports[year.toLowerCase()] || {};
                                                                                    return {
                                                                                        ...p,
                                                                                        sportsParticipation: {
                                                                                            ...currentSports,
                                                                                            [year.toLowerCase()]: {
                                                                                                ...currentYear,
                                                                                                [season]: e.target.value
                                                                                            }
                                                                                        }
                                                                                    };
                                                                                }
                                                                                return p;
                                                                            });
                                                                            setRoster(updatedRoster);
                                                                        }}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.5rem',
                                                                            fontSize: '0.85rem',
                                                                            background: 'var(--input-bg)',
                                                                            color: 'var(--text)',
                                                                            border: '1px solid var(--border)'
                                                                        }}
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Save Confirmation */}
                                <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#22c55e', textAlign: 'center' }}>
                                        ✓ All changes are automatically saved
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ATTENDANCE TAB - Placeholder for now */}
                        {activeTab === 'attendance' && (
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h2 style={{ marginBottom: '1rem' }}>My Attendance</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{attendancePercentage}%</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attendance</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{calculateStreak()}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Day Streak</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7' }}>{attendanceStats.total}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Events</div>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>Detailed attendance history coming soon...</p>
                            </div>
                        )}

                        {/* ACHIEVEMENTS TAB - Placeholder for now */}
                        {activeTab === 'achievements' && (
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h2 style={{ marginBottom: '1rem' }}>My Progress</h2>
                                <p style={{ color: 'var(--text-secondary)' }}>Achievements and progress tracking coming soon...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Home Indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '134px',
                    height: '5px',
                    background: 'white',
                    borderRadius: '100px'
                }}></div>
            </div>
        </div>
    );
};

