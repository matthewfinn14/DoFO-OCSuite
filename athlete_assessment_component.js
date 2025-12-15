// ============================================
// ATHLETE SELF-ASSESSMENT COMPONENT
// ============================================
const AthleteSelfAssessment = ({ roster, staff, currentUser, onSync }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState(roster.length > 0 ? roster[0].id : '');
    const [assessmentPeriod, setAssessmentPeriod] = useState('preseason'); // preseason or postseason
    const [assessments, setAssessments] = useState(() => {
        const saved = localStorage.getItem('athlete_assessments');
        return saved ? JSON.parse(saved) : {};
    });

    // Auto-sync effect
    useEffect(() => {
        if (onSync) {
            const timer = setTimeout(() => {
                onSync(assessments);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [assessments, onSync]);

    const ASSESSMENT_CATEGORIES = [
        {
            id: 'dependability',
            name: 'DEPENDABILITY/COMMITMENT',
            exceptional: 'You consistently show up to weights, installs, practice and work hard.',
            poor: 'You inconsistently show up to weights, your teammates and coaches question your commitment to the program.'
        },
        {
            id: 'teamFirst',
            name: 'TEAM-FIRST MINDSET',
            exceptional: 'You encourage and trust your teammates and coaches to do their jobs well. You make personal sacrifices for the betterment of the team.',
            poor: 'You care only about your stats and how you are perceived.'
        },
        {
            id: 'leadership',
            name: 'LEADERSHIP',
            exceptional: 'You help other people on our team become better. You step up to do things no one else wants to do. You aren\'t afraid to stand up to people.',
            poor: 'You are a follower and not sure of what you stand for.'
        },
        {
            id: 'energy',
            name: 'ENERGY/ATTITUDE',
            exceptional: 'You work with intensity and energy. You never finish last. You give good vibes to teammates.',
            poor: 'A lot of whining, negativity, hard to approach.'
        },
        {
            id: 'coachability',
            name: 'COACHABILITY/GROWTH MINDSET',
            exceptional: 'You listen to coaches and do things the way you\'ve been coached.',
            poor: 'You will do things your own way even if it hurts the team.'
        },
        {
            id: 'toughness',
            name: 'TOUGHNESS',
            exceptional: 'You maintain mental focus on your assignment/job despite external factors, and you understand the difference between being injured and being hurt.',
            poor: 'You allow your effort/execution to be affected by temperatures, soreness, and other outside factors.'
        },
        {
            id: 'strength',
            name: 'STRENGTH/POWER',
            exceptional: 'In a one-on-one situation, you are going to move the other guy against his will.',
            poor: 'You often find yourself overpowered in one-on-one situations.'
        },
        {
            id: 'speed',
            name: 'SPEED',
            exceptional: 'You are faster than 90% of our competition.',
            poor: 'You have difficulty beating any of our competition in a foot race.'
        },
        {
            id: 'physicality',
            name: 'PHYSICALITY/TACKLING',
            exceptional: 'You are a dominating presence, a sure-tackler & a sound hitter.',
            poor: 'You don\'t like to hit at all, and try to avoid contact at all costs.'
        },
        {
            id: 'positionKnowledge',
            name: 'POSITION KNOWLEDGE & SKILLS',
            exceptional: 'You show great technique, knowledge of assignments, and do your job well.',
            poor: 'Your technique is rough and you are unsure of assignments on most plays.'
        }
    ];

    const selectedPlayer = roster.find(p => p.id === selectedPlayerId);

    // Get or initialize assessment for current player and period
    const getAssessment = () => {
        const key = `${selectedPlayerId}_${assessmentPeriod}`;
        if (!assessments[key]) {
            const newAssessment = {
                playerId: selectedPlayerId,
                period: assessmentPeriod,
                date: new Date().toISOString().split('T')[0],
                playerRatings: {},
                coachRatings: {},
                coachNotes: ''
            };
            ASSESSMENT_CATEGORIES.forEach(cat => {
                newAssessment.playerRatings[cat.id] = 0;
                newAssessment.coachRatings[cat.id] = 0;
            });
            return newAssessment;
        }
        return assessments[key];
    };

    const currentAssessment = getAssessment();

    // Update player rating
    const updatePlayerRating = (categoryId, value) => {
        const key = `${selectedPlayerId}_${assessmentPeriod}`;
        const updated = {
            ...assessments,
            [key]: {
                ...currentAssessment,
                playerRatings: {
                    ...currentAssessment.playerRatings,
                    [categoryId]: parseInt(value)
                }
            }
        };
        setAssessments(updated);
        localStorage.setItem('athlete_assessments', JSON.stringify(updated));
    };

    // Update coach rating
    const updateCoachRating = (categoryId, value) => {
        const key = `${selectedPlayerId}_${assessmentPeriod}`;
        const updated = {
            ...assessments,
            [key]: {
                ...currentAssessment,
                coachRatings: {
                    ...currentAssessment.coachRatings,
                    [categoryId]: parseInt(value)
                }
            }
        };
        setAssessments(updated);
        localStorage.setItem('athlete_assessments', JSON.stringify(updated));
    };

    // Update coach notes
    const updateCoachNotes = (notes) => {
        const key = `${selectedPlayerId}_${assessmentPeriod}`;
        const updated = {
            ...assessments,
            [key]: {
                ...currentAssessment,
                coachNotes: notes
            }
        };
        setAssessments(updated);
        localStorage.setItem('athlete_assessments', JSON.stringify(updated));
    };

    // Calculate totals
    const calculateTotal = (ratings) => {
        return Object.values(ratings).reduce((sum, val) => sum + (val || 0), 0);
    };

    const playerTotal = calculateTotal(currentAssessment.playerRatings);
    const coachTotal = calculateTotal(currentAssessment.coachRatings);
    const difference = playerTotal - coachTotal;

    // Get rating color
    const getRatingColor = (value) => {
        if (value === 5) return '#22c55e'; // green
        if (value === 4) return '#3b82f6'; // blue
        if (value === 3) return '#eab308'; // yellow
        if (value === 2) return '#f97316'; // orange
        if (value === 1) return '#ef4444'; // red
        return '#6b7280'; // gray
    };

    // Get difference color
    const getDifferenceColor = (diff) => {
        const absDiff = Math.abs(diff);
        if (absDiff <= 5) return '#22c55e';
        if (absDiff <= 10) return '#eab308';
        return '#ef4444';
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📊</span>
                    Athlete Self-Assessment
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    Use the scale below to rank yourself for each attribute. Coaches will complete as well and you will compare scores.
                </p>
            </div>

            {/* Scale Legend */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Rating Scale</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {[
                        { value: 5, label: 'EXCEPTIONAL', color: '#22c55e' },
                        { value: 4, label: 'SOLID', color: '#3b82f6' },
                        { value: 3, label: 'AVERAGE', color: '#eab308' },
                        { value: 2, label: 'BELOW AVERAGE', color: '#f97316' },
                        { value: 1, label: 'POOR', color: '#ef4444' },
                        { value: 0, label: 'NON-EXISTENT', color: '#6b7280' }
                    ].map(scale => (
                        <div key={scale.value} style={{
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            border: `2px solid ${scale.color}`,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: scale.color }}>{scale.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{scale.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Player Selector */}
                    <div>
                        <label className="form-label">Select Player</label>
                        <select
                            className="form-input"
                            value={selectedPlayerId}
                            onChange={e => setSelectedPlayerId(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            {roster.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName} (#{p.jersey}) - {p.position}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Period Selector */}
                    <div>
                        <label className="form-label">Assessment Period</label>
                        <select
                            className="form-input"
                            value={assessmentPeriod}
                            onChange={e => setAssessmentPeriod(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="preseason">Preseason</option>
                            <option value="postseason">Postseason</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Assessment Table */}
            <div className="card" style={{ padding: '0', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--accent)', color: 'white' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', minWidth: '250px' }}>ATTRIBUTE</th>
                            <th style={{ padding: '1rem', textAlign: 'center', width: '120px' }}>PLAYER</th>
                            <th style={{ padding: '1rem', textAlign: 'center', width: '120px' }}>COACH</th>
                            <th style={{ padding: '1rem', textAlign: 'center', width: '100px' }}>DIFF</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ASSESSMENT_CATEGORIES.map((category, index) => {
                            const playerRating = currentAssessment.playerRatings[category.id] || 0;
                            const coachRating = currentAssessment.coachRatings[category.id] || 0;
                            const diff = playerRating - coachRating;

                            return (
                                <React.Fragment key={category.id}>
                                    <tr style={{
                                        background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                                {category.name}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                <strong style={{ color: '#22c55e' }}>Exceptional:</strong> {category.exceptional}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <strong style={{ color: '#ef4444' }}>Poor:</strong> {category.poor}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <select
                                                className="form-input"
                                                value={playerRating}
                                                onChange={e => updatePlayerRating(category.id, e.target.value)}
                                                style={{
                                                    width: '80px',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem',
                                                    color: getRatingColor(playerRating),
                                                    borderColor: getRatingColor(playerRating)
                                                }}
                                            >
                                                {[0, 1, 2, 3, 4, 5].map(val => (
                                                    <option key={val} value={val}>{val}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <select
                                                className="form-input"
                                                value={coachRating}
                                                onChange={e => updateCoachRating(category.id, e.target.value)}
                                                style={{
                                                    width: '80px',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem',
                                                    color: getRatingColor(coachRating),
                                                    borderColor: getRatingColor(coachRating)
                                                }}
                                            >
                                                {[0, 1, 2, 3, 4, 5].map(val => (
                                                    <option key={val} value={val}>{val}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{
                                                fontWeight: 'bold',
                                                fontSize: '1.1rem',
                                                color: diff === 0 ? '#22c55e' : diff > 0 ? '#3b82f6' : '#f97316'
                                            }}>
                                                {diff > 0 ? '+' : ''}{diff}
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        {/* Totals Row */}
                        <tr style={{ background: 'rgba(59, 130, 246, 0.1)', fontWeight: 'bold', borderTop: '2px solid var(--accent)' }}>
                            <td style={{ padding: '1rem', fontSize: '1.1rem' }}>TOTAL</td>
                            <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.5rem', color: 'var(--accent)' }}>
                                {playerTotal}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.5rem', color: 'var(--accent)' }}>
                                {coachTotal}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.5rem', color: getDifferenceColor(difference) }}>
                                {difference > 0 ? '+' : ''}{difference}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Coach Notes Section */}
            <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📝</span>
                    Coach Notes & Feedback
                </h3>
                <textarea
                    className="form-input"
                    value={currentAssessment.coachNotes || ''}
                    onChange={e => updateCoachNotes(e.target.value)}
                    placeholder="Coach: Add notes, areas for improvement, strengths, and goals for this player..."
                    rows={6}
                    style={{ width: '100%', resize: 'vertical' }}
                />
            </div>

            {/* Analysis Summary */}
            {(playerTotal > 0 || coachTotal > 0) && (
                <div className="card" style={{ padding: '1.5rem', marginTop: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Assessment Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Player Self-Rating</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{playerTotal}/50</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{((playerTotal / 50) * 100).toFixed(0)}%</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Coach Rating</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{coachTotal}/50</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{((coachTotal / 50) * 100).toFixed(0)}%</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Perception Gap</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getDifferenceColor(difference) }}>
                                {difference > 0 ? '+' : ''}{difference}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {Math.abs(difference) <= 5 ? 'Aligned' : Math.abs(difference) <= 10 ? 'Some Gap' : 'Significant Gap'}
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Assessment Date</div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                {currentAssessment.date ? new Date(currentAssessment.date).toLocaleDateString() : 'Not Started'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                {assessmentPeriod}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
