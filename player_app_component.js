// ============================================
// PLAYER-FACING APP PREVIEW
// ============================================
const PlayerApp = ({ roster, attendance, setRoster, setAttendance }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState(roster.length > 0 ? roster[0].id : '');
    const [activeTab, setActiveTab] = useState('wellness'); // wellness, profile, attendance, achievements
    const [showCoachAlert, setShowCoachAlert] = useState(false);

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
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
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

            {/* PROFILE TAB - Placeholder for now */}
            {activeTab === 'profile' && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>My Profile</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Profile editing coming soon...</p>
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
    );
};

