// --- NOTES MODAL COMPONENT (Re-implemented as top-level) ---
const NotesModal = ({ plan, updateCurrentPlan, staff, segmentId, onClose }) => {
    if (!segmentId) return null;

    const segment = segmentId === 'WARMUP'
        ? { id: 'WARMUP', notes: plan.warmupNotes || {} }
        : plan.segments.find(s => s.id == segmentId);

    if (!segment) return null;

    const migrated = segmentId === 'WARMUP'
        ? { notes: plan.warmupNotes || {} }
        : migrateSegmentNotes(segment);

    // Helper to update notes
    const handleUpdateNotes = (staffId, value) => {
        const newNotes = { ...migrated.notes, [staffId]: value };

        if (segmentId === 'WARMUP') {
            updateCurrentPlan({ ...plan, warmupNotes: newNotes });
        } else {
            // Update segment in plan
            const updatedSegments = plan.segments.map(s =>
                s.id === segmentId ? { ...s, notes: newNotes } : s
            );
            updateCurrentPlan({ ...plan, segments: updatedSegments });
        }
    };

    // Get staff
    const allStaff = staff || [];
    const coaches = allStaff.filter(s => {
        const r = (s.role || '').toLowerCase();
        return r.includes('coach') || s.type === 'Coach' || (!s.role && !s.type);
    });
    const managers = allStaff.filter(s => {
        const r = (s.role || '').toLowerCase();
        return r.includes('manager') || r === 'trainer' || r === 'stats';
    });

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10000, padding: '2rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    width: '100%', maxWidth: '900px', maxHeight: '85vh',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-main)'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon name="FileText" size={18} />
                        {segmentId === 'WARMUP' ? 'Warmup Notes' : `Segment Notes: ${segment.type} (${segment.duration}m)`}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '4px', borderRadius: '4px'
                        }}
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-app)' }}>
                    {/* Global Note */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label className="form-label" style={{ color: 'var(--accent)', fontWeight: 700 }}>ALL COACHES / GLOBAL NOTE</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={migrated.notes['ALL_COACHES'] || ''}
                            onChange={(e) => handleUpdateNotes('ALL_COACHES', e.target.value)}
                            placeholder="Enter notes visible to everyone..."
                            style={{ width: '100%', resize: 'vertical', fontSize: '1rem' }}
                        />
                    </div>

                    {/* Coaches Grid */}
                    {coaches.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{
                                fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                                color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)',
                                paddingBottom: '0.5rem'
                            }}>
                                Coaches
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {coaches.map(coach => (
                                    <div key={coach.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="form-label" style={{ margin: 0 }}>{coach.name}</label>
                                        <textarea
                                            className="form-input"
                                            rows={2}
                                            value={migrated.notes[coach.id] || ''}
                                            onChange={(e) => handleUpdateNotes(coach.id, e.target.value)}
                                            placeholder={`Notes for ${coach.name}...`}
                                            style={{ width: '100%', resize: 'vertical' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Managers Grid */}
                    {managers.length > 0 && (
                        <div>
                            <h4 style={{
                                fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                                color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)',
                                paddingBottom: '0.5rem'
                            }}>
                                Staff & Managers
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {managers.map(mgr => (
                                    <div key={mgr.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className="form-label" style={{ margin: 0 }}>{mgr.name}</label>
                                        <textarea
                                            className="form-input"
                                            rows={2}
                                            value={migrated.notes[mgr.id] || ''}
                                            onChange={(e) => handleUpdateNotes(mgr.id, e.target.value)}
                                            placeholder={`Notes for ${mgr.name}...`}
                                            style={{ width: '100%', resize: 'vertical' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

