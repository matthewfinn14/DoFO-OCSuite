// ============================================
// PLAY-CALLING SIMULATOR COMPONENT
// ============================================

const PlayCallSimulator = ({ plays, roster, gamePlan, onUpdateGamePlan }) => {
    // ===== GAME STATE =====
    const [gameState, setGameState] = useState({
        quarter: 1,
        timeRemaining: 720, // 12 minutes in seconds
        down: 1,
        distance: 10,
        yardLine: 25, // Start at own 25
        hash: 'middle',
        score: { home: 0, away: 0 },
        driveNumber: 1,
        playClockRemaining: 40,
        playClockActive: false,
        possession: 'home'
    });

    const [playHistory, setPlayHistory] = useState([]);
    const [selectedPlay, setSelectedPlay] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatorActive, setSimulatorActive] = useState(false);

    // ===== SCOUT TEAM STATE =====
    const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard, elite
    const [scoutTeam, setScoutTeam] = useState([]);

    // ===== PERFORMANCE TRACKING =====
    const [sessionStats, setSessionStats] = useState({
        playsRun: 0,
        avgDecisionTime: 0,
        successRate: 0,
        totalYards: 0,
        touchdowns: 0,
        turnovers: 0,
        startTime: null
    });

    // ===== OVERLAY POSITION =====
    const [overlayPosition, setOverlayPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // ===== GENERATE SCOUT TEAM =====
    useEffect(() => {
        if (simulatorActive && scoutTeam.length === 0) {
            generateScoutTeam();
        }
    }, [simulatorActive]);

    const generateScoutTeam = () => {
        const positions = ['DL', 'DL', 'DL', 'DL', 'LB', 'LB', 'LB', 'CB', 'CB', 'S', 'S'];
        const difficultyMultipliers = {
            easy: 0.6,
            medium: 0.75,
            hard: 0.9,
            elite: 1.0
        };
        const mult = difficultyMultipliers[difficulty];

        const team = positions.map((pos, idx) => ({
            id: `scout_${idx}`,
            position: pos,
            jersey: idx + 1,
            name: generatePlayerName(),
            ratings: {
                overall: Math.floor((60 + Math.random() * 35) * mult),
                speed: Math.floor((55 + Math.random() * 40) * mult),
                strength: Math.floor((55 + Math.random() * 40) * mult),
                ability: Math.floor((55 + Math.random() * 40) * mult)
            }
        }));
        setScoutTeam(team);
    };

    const generatePlayerName = () => {
        const firstNames = ['Mike', 'John', 'Chris', 'David', 'James', 'Robert', 'Tyler', 'Brandon', 'Kevin', 'Marcus'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    };

    // ===== PLAY CLOCK COUNTDOWN =====
    useEffect(() => {
        if (!gameState.playClockActive || !simulatorActive) return;

        const interval = setInterval(() => {
            setGameState(prev => {
                if (prev.playClockRemaining <= 0) {
                    // Delay of game penalty
                    alert('⚠️ DELAY OF GAME! 5 yard penalty');
                    return {
                        ...prev,
                        playClockRemaining: 40,
                        playClockActive: false,
                        yardLine: Math.max(0, prev.yardLine - 5),
                        distance: prev.distance + 5
                    };
                }
                return { ...prev, playClockRemaining: prev.playClockRemaining - 1 };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState.playClockActive, simulatorActive]);

    // ===== START PLAY CLOCK =====
    const startPlayClock = () => {
        setGameState(prev => ({ ...prev, playClockActive: true, playClockRemaining: 40 }));
        if (!sessionStats.startTime) {
            setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
        }
    };

    // ===== SIMULATE PLAY RESULT =====
    const simulatePlay = async () => {
        if (!selectedPlay) {
            alert('Please select a play from the call sheet first!');
            return;
        }

        setIsSimulating(true);
        setGameState(prev => ({ ...prev, playClockActive: false }));

        // Calculate decision time
        const decisionTime = 40 - gameState.playClockRemaining;

        // Wait 2-3 seconds to simulate play execution
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

        // Calculate result based on ratings
        const result = calculatePlayResult(selectedPlay);

        setLastResult(result);
        setShowResult(true);

        // Update game state
        updateGameStateAfterPlay(result);

        // Update session stats
        updateSessionStats(result, decisionTime);

        // Add to play history
        setPlayHistory(prev => [{
            playNumber: prev.length + 1,
            down: gameState.down,
            distance: gameState.distance,
            yardLine: gameState.yardLine,
            playName: selectedPlay.name,
            result: result,
            timestamp: Date.now()
        }, ...prev]);

        setIsSimulating(false);
        setSelectedPlay(null);

        // Auto-hide result after 3 seconds and start next play clock
        setTimeout(() => {
            setShowResult(false);
            startPlayClock();
        }, 3000);
    };

    // ===== CALCULATE PLAY RESULT =====
    const calculatePlayResult = (play) => {
        // Get offensive player ratings (simplified - using average of roster)
        const offenseRating = roster.reduce((sum, p) => sum + (p.metrics?.maddenRating || 70), 0) / roster.length;

        // Get defensive rating (average of scout team)
        const defenseRating = scoutTeam.reduce((sum, p) => sum + p.ratings.overall, 0) / scoutTeam.length;

        // Base success probability
        let successProb = 0.5 + (offenseRating - defenseRating) / 200;

        // Situational modifiers
        if (gameState.distance >= 10) successProb -= 0.1; // Harder on long distance
        if (gameState.yardLine < 10) successProb -= 0.15; // Harder near goal line
        if (gameState.down >= 3) successProb -= 0.1; // Harder on 3rd/4th down

        // Play type modifiers (check tags)
        const playTags = play.tags || [];
        const isRun = playTags.some(t => ['Strong Run', 'Weak Run'].includes(t));
        const isPass = playTags.some(t => ['Drop Back', 'Quick Game'].includes(t));

        // Determine outcome type
        const roll = Math.random();
        let outcome, yards;

        if (roll > successProb) {
            // Unsuccessful play
            if (isPass && Math.random() > 0.7) {
                outcome = 'Incomplete';
                yards = 0;
            } else if (Math.random() > 0.95) {
                outcome = 'Turnover';
                yards = 0;
            } else if (Math.random() > 0.9) {
                outcome = 'Sack';
                yards = -(3 + Math.floor(Math.random() * 5));
            } else {
                outcome = 'Tackle';
                yards = Math.floor(Math.random() * Math.max(1, gameState.distance * 0.4));
            }
        } else {
            // Successful play
            const baseYards = gameState.distance + Math.floor(Math.random() * 8);
            yards = Math.max(0, baseYards - Math.floor(Math.random() * 5));

            // Check for touchdown
            if (gameState.yardLine + yards >= 100) {
                outcome = 'TOUCHDOWN!';
                yards = 100 - gameState.yardLine;
            } else if (yards >= gameState.distance) {
                outcome = 'First Down';
            } else {
                outcome = 'Tackle';
            }
        }

        // Time elapsed (run plays take more time)
        const timeElapsed = isRun ? (25 + Math.floor(Math.random() * 10)) : (5 + Math.floor(Math.random() * 8));

        return {
            playId: play.id,
            playName: play.name,
            yardsGained: yards,
            outcome: outcome,
            timeElapsed: timeElapsed,
            turnover: outcome === 'Turnover',
            touchdown: outcome === 'TOUCHDOWN!'
        };
    };

    // ===== UPDATE GAME STATE AFTER PLAY =====
    const updateGameStateAfterPlay = (result) => {
        setGameState(prev => {
            let newDown = prev.down;
            let newDistance = prev.distance;
            let newYardLine = Math.min(100, Math.max(0, prev.yardLine + result.yardsGained));
            let newScore = { ...prev.score };
            let newTimeRemaining = Math.max(0, prev.timeRemaining - result.timeElapsed);

            if (result.touchdown) {
                newScore.home += 7; // Assuming extra point
                newDown = 1;
                newDistance = 10;
                newYardLine = 25; // Kickoff
            } else if (result.turnover) {
                // Turnover - opponent gets ball
                newDown = 1;
                newDistance = 10;
                newYardLine = 100 - newYardLine; // Flip field position
            } else {
                // Normal play progression
                const yardsToGo = prev.distance - result.yardsGained;

                if (yardsToGo <= 0) {
                    // First down!
                    newDown = 1;
                    newDistance = Math.min(10, 100 - newYardLine);
                } else {
                    newDown = prev.down + 1;
                    newDistance = yardsToGo;

                    if (newDown > 4) {
                        // Turnover on downs
                        newDown = 1;
                        newDistance = 10;
                        newYardLine = 100 - newYardLine;
                    }
                }
            }

            return {
                ...prev,
                down: newDown,
                distance: newDistance,
                yardLine: newYardLine,
                score: newScore,
                timeRemaining: newTimeRemaining,
                playClockRemaining: 40
            };
        });
    };

    // ===== UPDATE SESSION STATS =====
    const updateSessionStats = (result, decisionTime) => {
        setSessionStats(prev => {
            const newPlaysRun = prev.playsRun + 1;
            const newAvgDecisionTime = ((prev.avgDecisionTime * prev.playsRun) + decisionTime) / newPlaysRun;
            const wasSuccessful = result.outcome === 'First Down' || result.outcome === 'TOUCHDOWN!';
            const newSuccessRate = ((prev.successRate * prev.playsRun) + (wasSuccessful ? 1 : 0)) / newPlaysRun;

            return {
                ...prev,
                playsRun: newPlaysRun,
                avgDecisionTime: newAvgDecisionTime,
                successRate: newSuccessRate,
                totalYards: prev.totalYards + result.yardsGained,
                touchdowns: prev.touchdowns + (result.touchdown ? 1 : 0),
                turnovers: prev.turnovers + (result.turnover ? 1 : 0)
            };
        });
    };

    // ===== RESET SIMULATION =====
    const resetSimulation = () => {
        if (!confirm('Reset the simulation? This will clear all progress.')) return;

        setGameState({
            quarter: 1,
            timeRemaining: 720,
            down: 1,
            distance: 10,
            yardLine: 25,
            hash: 'middle',
            score: { home: 0, away: 0 },
            driveNumber: 1,
            playClockRemaining: 40,
            playClockActive: false,
            possession: 'home'
        });
        setPlayHistory([]);
        setSessionStats({
            playsRun: 0,
            avgDecisionTime: 0,
            successRate: 0,
            totalYards: 0,
            touchdowns: 0,
            turnovers: 0,
            startTime: null
        });
        setShowResult(false);
        setSelectedPlay(null);
        generateScoutTeam();
    };

    // ===== DRAGGING HANDLERS =====
    const handleMouseDown = (e) => {
        if (e.target.closest('.simulator-drag-handle')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - overlayPosition.x,
                y: e.clientY - overlayPosition.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setOverlayPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    // ===== RENDER =====
    if (!simulatorActive) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
                <h2 style={{ marginBottom: '1rem' }}>Play-Calling Simulator</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Practice using your call sheet in realistic game scenarios. Select plays, manage the play clock,
                    and see how your calls perform against a simulated scout team defense.
                </p>

                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Scout Team Difficulty</label>
                    <select
                        className="form-select"
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        style={{ fontSize: '1.1rem', padding: '0.75rem' }}
                    >
                        <option value="easy">Easy (60-70 OVR)</option>
                        <option value="medium">Medium (70-80 OVR)</option>
                        <option value="hard">Hard (80-90 OVR)</option>
                        <option value="elite">Elite (90+ OVR)</option>
                    </select>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setSimulatorActive(true);
                        startPlayClock();
                    }}
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                >
                    Start Simulation
                </button>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            {/* Game Situation Overlay */}
            <div
                style={{
                    position: 'fixed',
                    left: `${overlayPosition.x}px`,
                    top: `${overlayPosition.y}px`,
                    zIndex: 1000,
                    background: 'var(--bg-card)',
                    border: '2px solid var(--accent)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    minWidth: '320px',
                    cursor: isDragging ? 'grabbing' : 'default',
                    userSelect: 'none'
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Drag Handle */}
                <div
                    className="simulator-drag-handle"
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--accent)',
                        borderRadius: '10px 10px 0 0',
                        cursor: 'grab',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <span style={{ fontWeight: 'bold', color: 'white' }}>🎮 SIMULATION</span>
                    <button
                        className="btn"
                        onClick={() => setSimulatorActive(false)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                        Exit
                    </button>
                </div>

                {/* Game Info */}
                <div style={{ padding: '1rem' }}>
                    {/* Score */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        background: 'var(--surface)',
                        borderRadius: '8px'
                    }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>YOUR TEAM</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{gameState.score.home}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>-</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OPPONENT</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{gameState.score.away}</div>
                        </div>
                    </div>

                    {/* Situation */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--surface)', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DOWN & DISTANCE</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {gameState.down}{['st', 'nd', 'rd', 'th'][gameState.down - 1]} & {gameState.distance}
                            </div>
                        </div>
                        <div style={{ padding: '0.5rem', background: 'var(--surface)', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>FIELD POSITION</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {gameState.yardLine < 50 ? `Own ${gameState.yardLine}` : `Opp ${100 - gameState.yardLine}`}
                            </div>
                        </div>
                    </div>

                    {/* Time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--surface)', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>QUARTER</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Q{gameState.quarter}</div>
                        </div>
                        <div style={{ padding: '0.5rem', background: 'var(--surface)', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TIME</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {Math.floor(gameState.timeRemaining / 60)}:{String(gameState.timeRemaining % 60).padStart(2, '0')}
                            </div>
                        </div>
                    </div>

                    {/* Play Clock */}
                    <div style={{
                        padding: '1rem',
                        background: gameState.playClockRemaining <= 10 ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface)',
                        borderRadius: '8px',
                        border: gameState.playClockRemaining <= 10 ? '2px solid #ef4444' : 'none',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PLAY CLOCK</div>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            color: gameState.playClockRemaining <= 10 ? '#ef4444' : 'var(--accent)',
                            fontFamily: 'monospace'
                        }}>
                            {gameState.playClockRemaining}
                        </div>
                    </div>

                    {/* Selected Play Display */}
                    {selectedPlay && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid #3b82f6',
                            borderRadius: '6px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginBottom: '0.25rem' }}>SELECTED PLAY</div>
                            <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{selectedPlay.name}</div>
                        </div>
                    )}

                    {/* Submit Play Button */}
                    <button
                        className="btn btn-primary"
                        onClick={simulatePlay}
                        disabled={!selectedPlay || isSimulating}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem'
                        }}
                    >
                        {isSimulating ? '⏳ Running Play...' : '▶️ Submit Play'}
                    </button>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={resetSimulation}
                            style={{ flex: 1, fontSize: '0.85rem' }}
                        >
                            🔄 Reset
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => alert(`Stats:\n\nPlays: ${sessionStats.playsRun}\nAvg Decision Time: ${sessionStats.avgDecisionTime.toFixed(1)}s\nSuccess Rate: ${(sessionStats.successRate * 100).toFixed(1)}%\nTotal Yards: ${sessionStats.totalYards}\nTDs: ${sessionStats.touchdowns}\nTurnovers: ${sessionStats.turnovers}`)}
                            style={{ flex: 1, fontSize: '0.85rem' }}
                        >
                            📊 Stats
                        </button>
                    </div>
                </div>
            </div>

            {/* Result Popup */}
            {showResult && lastResult && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2000,
                    background: 'var(--bg-card)',
                    border: `3px solid ${lastResult.touchdown ? '#10b981' : lastResult.turnover ? '#ef4444' : '#3b82f6'}`,
                    borderRadius: '16px',
                    padding: '2rem',
                    minWidth: '400px',
                    textAlign: 'center',
                    boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
                    animation: 'fadeIn 0.3s ease-in'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        {lastResult.touchdown ? '🎉' : lastResult.turnover ? '😱' : lastResult.outcome === 'First Down' ? '✅' : '⚡'}
                    </div>
                    <h2 style={{
                        marginBottom: '1rem',
                        color: lastResult.touchdown ? '#10b981' : lastResult.turnover ? '#ef4444' : 'inherit'
                    }}>
                        {lastResult.outcome}
                    </h2>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {lastResult.yardsGained > 0 ? '+' : ''}{lastResult.yardsGained} yards
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        {lastResult.playName}
                    </div>
                </div>
            )}

            {/* The actual call sheet component will render here */}
            <div style={{ paddingTop: '1rem' }}>
                <SmartCallSheet
                    gamePlan={gamePlan}
                    situation={gameState}
                    plays={plays}
                    onUpdateSituation={setGameState}
                    onUpdateGamePlan={onUpdateGamePlan}
                    onPlaySelected={setSelectedPlay}
                />
            </div>
        </div>
    );
};
