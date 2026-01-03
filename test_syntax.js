const App = () => {
        const ProgramDashboard = ({ currentWeek, roster, inventory = [], attendance = {}, checkouts = [], equipmentDueDate, userRole = 'Head Coach', permissions = { view: true, edit: true }, masterTasks = [], onUpdateTask, depthChart }) => {
            // Checklist State (Daily, Weekly, Monthly)
            const [dailyFocus, setDailyFocus] = useState([]);
            const [weeklyFocus, setWeeklyFocus] = useState([]);
            const [monthlyFocus, setMonthlyFocus] = useState([]);
            const [inputs, setInputs] = useState({ daily: '', weekly: '', monthly: '' });
            const [draggedItem, setDraggedItem] = useState(null); // { type: 'daily'|'weekly'|'monthly'|'assigned', index: number, item: object }
            const [viewingTaskNotes, setViewingTaskNotes] = useState(null); // Task being viewed in modal
            const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

            // Helper: Wellness Alerts (Unchanged)
            const getWellnessAlerts = (currentRoster) => {
                const alerts = [];
                const now = new Date();
                const oneDay = 24 * 60 * 60 * 1000;

                currentRoster.forEach(player => {
                    const logs = (player.metrics?.warriorDialLogs || []).sort((a, b) => new Date(b.date) - new Date(a.date));
                    if (logs.length === 0) return;

                    const latest = logs[0];
                    const latestDate = new Date(latest.date);

                    // Only check logs from last 48 hours to be relevant
                    if ((now - latestDate) > (oneDay * 2)) return;

                    // 1. Low Readiness
                    if (latest.readiness <= 4) {
                        alerts.push({
                            id: player.id + '-readiness', player, type: 'Low Readiness', level: 'high', message: `Readiness: ${latest.readiness}/10`
                        });
                    }

                    // 2. Injury / Pain
                    if (latest.pain) {
                        alerts.push({ id: player.id + '-pain', player, type: 'Injury Report', level: 'high', message: `${latest.painLocation} (${latest.painSeverity}/10)` });
                    }

                    // 3. Negative Trend (3 days)
                    if (logs.length >= 3) {
                        const d1 = logs[0].readiness;
                        const d2 = logs[1].readiness;
                        const d3 = logs[2].readiness;
                        if (d1 < d2 && d2 < d3) {
                            alerts.push({ id: player.id + '-trend', player, type: 'Trending Down', level: 'medium', message: `${d3} -> ${d2} -> ${d1}` });
                        }
                    }
                });
                return alerts;
            };

            const wellnessAlerts = useMemo(() => getWellnessAlerts(roster), [roster]);

            // Helper: Load Alerts
            const getLoadAlerts = (currentRoster, depthChart) => {
                const alerts = [];
                currentRoster.forEach(player => {
                    const { totalScore, breakdown } = calculatePlayerLoad(player.id, depthChart);
                    if (totalScore >= 9) { // Red Threshold
                        alerts.push({
                            id: player.id + '-load',
                            player,
                            type: 'High Workload',
                            level: 'high',
                            message: `Load Score: ${totalScore}`,
                            details: breakdown
                        });
                    }
                });
                return alerts;
            };

            const loadAlerts = useMemo(() => getLoadAlerts(roster, depthChart), [roster, depthChart]);

            // Helper: Fatigue Alerts
            const getFatigueAlerts = (currentRoster, depthChart) => {
                const alerts = [];
                currentRoster.forEach(player => {
                    const { totalFatigue, assignments } = calculatePlayerFatigue(player.id, depthChart);
                    if (totalFatigue >= 12) { // Red Threshold
                        alerts.push({
                            id: player.id + '-fatigue',
                            player,
                            type: 'High Fatigue',
                            level: 'high',
                            message: `Fatigue Score: ${totalFatigue}`,
                            details: assignments
                        });
                    }
                });
                return alerts;
            };

            const fatigueAlerts = useMemo(() => getFatigueAlerts(roster, depthChart), [roster, depthChart]);

            // Outreach State (Unchanged)
            const [outreach, setOutreach] = useLocalStorage('oc-dashboard-outreach', []);
            const [newOutreach, setNewOutreach] = useState('');
            const [outreachAssignee, setOutreachAssignee] = useState('ALL');

            // Helper: Attendance Alerts
            const getAttendanceAlerts = (rosterData, attendanceData) => {
                const alerts = [];
                const today = new Date().toISOString().split('T')[0];
                const todayLog = attendanceData[today] || {};

                // Iterate through today's log entries to find anomalies
                Object.entries(todayLog).forEach(([playerId, status]) => {
                    if (status === 'Absent' || status === 'Tardy') {
                        const player = rosterData.find(p => p.id === playerId);
                        if (player) {
                            alerts.push({
                                id: playerId + '-attendance',
                                player,
                                type: status,
                                level: status === 'Absent' ? 'high' : 'medium',
                                message: `Marked as ${status} today`
                            });
                        }
                    }
                });
                return alerts;
            };

            const attendanceAlerts = useMemo(() => getAttendanceAlerts(roster, attendance), [roster, attendance]);

            // Helper: Inventory Alerts
            const getInventoryAlerts = (rosterData, inventoryData) => {
                const alerts = [];
                const needs = {};

                // 1. Calculate Needs based on Roster
                rosterData.forEach(p => {
                    const sizes = p.sizes || {};
                    // Check main items
                    const requirements = [
                        { type: 'Helmet', size: sizes.helmet || p.helmetSize },
                        { type: 'Shoulder Pad', size: sizes.shoulderPad || p.shoulderPadSize },
                        { type: 'Practice Jersey', size: sizes.jersey || p.jerseySize }, // Assuming Jersey means Practice Jersey for now
                        { type: 'Practice Pants', size: sizes.pant || p.pantSize }
                    ];

                    requirements.forEach(req => {
                        if (req.size) {
                            const key = `${req.type}|${req.size}`;
                            needs[key] = (needs[key] || 0) + 1;
                        }
                    });
                });

                // 2. Compare against Inventory
                Object.entries(needs).forEach(([key, neededQty]) => {
                    const [type, size] = key.split('|');

                    // Filter inventory for matching items
                    const stockItems = inventoryData.filter(i =>
                        i.type === type &&
                        i.size === size &&
                        i.condition !== 'Damage' // Exclude damaged items
                    );

                    // Sum quantities
                    const inStock = stockItems.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

                    if (inStock < neededQty) {
                        alerts.push({
                            item: type,
                            size: size,
                            inStock,
                            needed: neededQty,
                            severity: 'high',
                            message: `Shortage: Need ${neededQty}, Have ${inStock}`
                        });
                    } else if (inStock < neededQty + 2) {
                        alerts.push({
                            item: type,
                            size: size,
                            inStock,
                            needed: neededQty,
                            severity: 'medium',
                            message: `Low Stock: Need ${neededQty}, Have ${inStock}`
                        });
                    }
                });

                return alerts;
            };

            const inventoryAlerts = useMemo(() => getInventoryAlerts(roster, inventory), [roster, inventory]);

            // Helper: Checkout Alerts (Overdue items)
            const getCheckoutAlerts = (checkoutsData, dueDate) => {
                const alerts = [];
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const isGlobalOverdue = dueDate && todayStr > dueDate;

                checkoutsData.forEach(c => {
                    if (c.status === 'checked-out') {
                        const daysOut = Math.floor((now - new Date(c.date)) / (1000 * 60 * 60 * 24));

                        if (isGlobalOverdue) {
                            alerts.push({
                                id: c.id,
                                player: { name: c.playerName },
                                type: 'Overdue Equipment',
                                level: 'high',
                                message: `${c.item} assigned to ${c.playerName} is overdue (Due Date: ${dueDate})`
                            });
                        } else if (daysOut > 7 && !dueDate) {
                            // Only apply 7-day rule if NO global due date is set (assuming due date implies season-long checkout)
                            alerts.push({
                                id: c.id,
                                player: { name: c.playerName },
                                type: 'Overdue Equipment',
                                level: 'high',
                                message: `${c.item} assigned to ${c.playerName} is overdue (${daysOut} days)`
                            });
                        }
                    }
                });
                return alerts;
            };

            const checkoutAlerts = useMemo(() => getCheckoutAlerts(checkouts, equipmentDueDate), [checkouts, equipmentDueDate]);

            // Helper: Injury Report
            const getInjuryReport = (rosterData) => {
                // Filter for any player that is NOT Active (e.g. Limited, Out, Questionable)
                // We check player.metrics.status or implied status from recent logs if status is missing
                return rosterData.filter(p => {
                    const status = p.metrics?.status || 'Active';
                    return status !== 'Active' && status !== 'Healthy';
                }).map(p => {
                    // Try to find recent injury details from logs
                    const logs = (p.metrics?.warriorDialLogs || []).sort((a, b) => new Date(b.date) - new Date(a.date));
                    const latest = logs[0] || {};

                    return {
                        id: p.id,
                        name: `${p.firstName} ${p.lastName}`,
                        status: p.metrics.status || 'Unknown',
                        injury: p.metrics.injury || latest.painLocation || 'Undisclosed',
                        returnDate: p.metrics.returnDate || 'TBD'
                    };
                });
            };

            const injuryReport = useMemo(() => getInjuryReport(roster), [roster]);

            // Program Focus Persistence (Role & Type Specific)
            useEffect(() => {
                if (!currentWeek || !currentWeek.id) return;

                const loadList = (type) => {
                    const key = `program-focus-${currentWeek.id}-${userRole}-${type}`;
                    const saved = localStorage.getItem(key);
                    return saved ? JSON.parse(saved) : [];
                };

                setDailyFocus(loadList('daily'));
                setWeeklyFocus(loadList('weekly'));
                setMonthlyFocus(loadList('monthly'));
            }, [currentWeek?.id, userRole]);

            const saveList = (type, items) => {
                const key = `program-focus-${currentWeek.id}-${userRole}-${type}`;
                localStorage.setItem(key, JSON.stringify(items));

                if (type === 'daily') setDailyFocus(items);
                if (type === 'weekly') setWeeklyFocus(items);
                if (type === 'monthly') setMonthlyFocus(items);
            };

            const addItem = (type, text) => {
                if (!text) {
                    if (!inputs[type].trim()) return;
                    text = inputs[type];
                }
                const currentList = type === 'daily' ? dailyFocus : type === 'weekly' ? weeklyFocus : monthlyFocus;
                saveList(type, [...currentList, { id: Date.now(), text: text, completed: false }]);
                setInputs(prev => ({ ...prev, [type]: '' }));
            };

            const toggleItem = (type, id) => {
                const currentList = type === 'daily' ? dailyFocus : type === 'weekly' ? weeklyFocus : monthlyFocus;
                saveList(type, currentList.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
            };

            const removeItem = (type, id) => {
                const currentList = type === 'daily' ? dailyFocus : type === 'weekly' ? weeklyFocus : monthlyFocus;
                saveList(type, currentList.filter(i => i.id !== id));
            };

            // --- Drag & Drop Handlers ---
            const handleDragStart = (e, type, index, item) => {
                setDraggedItem({ type, index, item });
                e.dropEffect = "move"; // Visual cue
            };

            // Drag handling is now centralized in the new handleDrop at line ~15247
            // Removing legacy handlers to fix 'redeclaration' error
            const handleDragOver = (e) => {
                e.preventDefault();
            };

            // Outreach Logic

            // Outreach Logic
            const addOutreach = () => {
                if (!newOutreach.trim()) return;
                const item = {
                    id: Date.now(),
                    text: newOutreach,
                    completed: false,
                    date: new Date().toISOString().split('T')[0],
                    assignedTo: outreachAssignee
                };
                setOutreach([item, ...outreach]);
                setNewOutreach('');
            };

            const removeOutreach = (id) => {
                setOutreach(outreach.filter(i => i.id !== id));
            };

            const toggleOutreach = (id) => {
                setOutreach(outreach.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
            };

            if (!currentWeek) return <div>Loading...</div>;

            const canEdit = permissions.edit;

            // Map full role names to short codes used in tasks
            const roleMap = {
                'Head Coach': 'HC',
                'Offensive Coordinator': 'OC',
                'Defensive Coordinator': 'DC',
                'Special Teams Coordinator': 'ST',
                'Position Coach': 'Position Coach', // Or specific position
                'Director of Ops': 'Ops',
                'Recruiting Coordinator': 'Recruiting'
            };

            const userRoleShort = roleMap[userRole] || userRole;

            // --- FILTER MASTER TASKS & AUTO-SORT ---
            // Filter tasks by role
            const myTasks = (masterTasks || []).filter(t => {
                if (!t.assignTo || t.assignTo.length === 0) return false;
                if (t.assignTo.includes('All Staff')) return true;
                if (userRole === 'Head Coach') return true;

                // Check direct matches
                if (t.assignTo.includes(userRole) || t.assignTo.includes(userRoleShort)) return true;

                // Check Groups
                if (t.assignTo.includes('All Position Coaches') && userRole.includes('Coach') && userRole !== 'Head Coach') return true;
                return false;
            });

            // Filter by assign date - only show tasks on or after their assign date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const myAssignedTasks = myTasks.filter(t => {
                if (!t.assignDate) return true; // No assign date means show immediately
                const assignDate = new Date(t.assignDate);
                assignDate.setHours(0, 0, 0, 0);
                return assignDate <= today; // Only show if assign date has passed
            });

            // Auto-Sort to Buckets
            const getTaskBucket = (task) => {
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"
                const cat = task.category;
                const rec = task.recurrence;



                // 0. Completed (Highest Priority)
                if (task.completed) return 'completed';

                // 1. Explicit Recurrence (Highest Priority - Respects Drag & Drop)
                if (rec === 'Ongoing') return 'ongoing';
                if (rec === 'Annual') return 'someday';
                if (rec === 'Seasonal') return 'thisMonth';
                if (rec === 'Daily') return 'today';
                if (rec === `Weekly: ${today}`) return 'today';
                if (rec && rec.startsWith('Weekly')) return 'thisWeek';

                // 2. Category / Contextual Fallbacks
                // ONGOING
                if (cat === 'Administrative' || cat === 'Ongoing') return 'ongoing';

                // SOMEDAY
                if (cat === 'Offseason' || cat === 'Postseason') return 'someday';

                // TODAY
                if (cat.includes('Game Week') && cat.includes(today)) return 'today';
                if (today === 'Friday' && (cat === 'Pre-Game' || cat === 'In-Game' || cat === 'Post-Game' || cat === 'Travel' || cat === 'Arrival')) return 'today';
                if (today === 'Saturday' && cat === 'Saturday') return 'today';

                // THIS WEEK
                if (cat === 'Game Week') return 'thisWeek';
                if (cat === 'Saturday') return 'thisWeek';
                if (cat === 'Pre-Game' || cat === 'In-Game' || cat === 'Post-Game' || cat === 'Travel' || cat === 'Arrival') return 'thisWeek';

                // THIS MONTH / SEASONAL
                if (cat === 'Summer') return 'thisMonth';

                return 'someday'; // Default fallback
            };

            // Helper to determine task updates when dropped into a new bucket
            const getUpdatesForBucket = (task, targetBucket) => {
                const updates = {};
                const todayWeekDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

                // If moving to 'today', set recurrence to Daily or category to today-specific
                if (targetBucket === 'today') {
                    // Ideally we don't change recurrence unless user wants to, but for "Focus"
                    // we might just want to ensure it shows up today.
                    // The simplest way to force it into 'today' bucket logic is:
                    // 1. If it's a "Game Week" task, maybe we don't change it, just let it be? 
                    //    But the user explicitly dragged it here.
                    //    Let's set a temporary override or just simple category change for now.
                    //    Changing 'recurrence' might be too aggressive.
                    //    Let's try setting category to 'Administrative' (always shows) + force it to be "today" relevant?
                    //    Actually, relying on the 'getTaskBucket' logic:
                    if (task.recurrence !== 'Daily') {
                        // If we drag to today, maybe we make it a one-off for today?
                        // Or just set assignDate to today?
                        updates.assignDate = new Date().toISOString().split('T')[0];
                        // Also need to ensure it falls into 'today' bucket in getTaskBucket
                        // simple hack: recurrence = 'Daily' might be too much.
                        // Let's just assume for this prototype we aren't changing the task DEFINITION
                        // but rather its properties to make it fit.
                        // If I move a "Weekly" task to "Today", it should probably stay Weekly but just be done today?
                        // The user asking for "Drag and Drop" implies changing the STATE of the task.
                        // Best bet: AssignDate = Today.
                    }
                }

                // For now, let's keep it simple: We rely on the user manually editing if they want deep changes.
                // Drag and drop in this dashboard is visual organization.
                // WE REMOVED THE INVALID setTasks call.
                // To support true re-bucketing, we'd need to change categories/recurrence.

                // logic:
                if (targetBucket === 'ongoing') {
                    updates.category = 'Ongoing';
                    updates.recurrence = 'Ongoing';
                } else if (targetBucket === 'someday') {
                    updates.category = 'Offseason';
                    updates.recurrence = 'Annual';
                } else if (targetBucket === 'today') {
                    // Force it to be today
                    updates.recurrence = 'Daily'; // Strong change
                } else if (targetBucket === 'thisWeek') {
                    updates.recurrence = 'Weekly';
                } else if (targetBucket === 'thisMonth') {
                    updates.recurrence = 'Seasonal';
                }

                return updates;
            };

            // Seasonal Filtering - Determine current season and filter tasks
            const getCurrentSeason = () => {
                const month = new Date().getMonth() + 1; // 1-12
                if (month >= 8 && month <= 11) return 'in-season'; // Aug-Nov
                if (month === 12 || month === 1) return 'postseason'; // Dec-Jan
                if (month >= 2 && month <= 4) return 'offseason'; // Feb-Apr
                if (month >= 5 && month <= 7) return 'summer'; // May-Jul
                return 'offseason';
            };

            const isTaskRelevantForSeason = (task, currentSeason) => {
                const cat = task.category;
                const rec = task.recurrence;

                const inSeasonCategories = ['Game Week - Monday', 'Game Week - Tuesday', 'Game Week - Wednesday',
                    'Game Week - Thursday', 'Game Week - Friday', 'Game Week - Saturday', 'Game Week - Sunday',
                    'Game Week', 'Saturday', 'Pre-Game', 'In-Game', 'Post-Game', 'Travel', 'Arrival', 'Day Before Game', 'In-Season Weekday'];

                const postseasonCategories = ['Postseason'];
                const offseasonCategories = ['Offseason', 'Out-of-Season Weekday'];
                const summerCategories = ['Summer'];

                const allSeasonalCategories = [...inSeasonCategories, ...postseasonCategories, ...offseasonCategories, ...summerCategories];

                // 0. Whitelist/Safeguard "Annual" / "Someday" tasks
                if (rec === 'Annual') return true;

                // 1. Strict Seasonal Category Check (Prioritize this over generic recurrence)
                if (allSeasonalCategories.includes(cat)) {
                    if (currentSeason === 'in-season' && inSeasonCategories.includes(cat)) return true;
                    if (currentSeason === 'postseason' && postseasonCategories.includes(cat)) return true;
                    if (currentSeason === 'offseason' && offseasonCategories.includes(cat)) return true;
                    if (currentSeason === 'summer' && summerCategories.includes(cat)) return true;
                    return false;
                }

                // 2. Year-round / Generic tasks (Only if NOT in a strict seasonal category)
                if (rec === 'Daily' || rec?.startsWith('Weekly:') || cat === 'Daily' || cat === 'Weekly') return true;
                if (cat === 'Administrative' || cat === 'Ongoing') return true;

                // 3. Fallback
                return true;
            };

            const currentSeason = getCurrentSeason();
            const seasonallyFilteredTasks = myAssignedTasks.filter(task => isTaskRelevantForSeason(task, currentSeason));

            const assignedBuckets = {
                today: [],
                thisWeek: [],
                thisMonth: [],
                ongoing: [],
                someday: []
            };

            seasonallyFilteredTasks.forEach(t => {
                const bucket = getTaskBucket(t);
                if (assignedBuckets[bucket]) assignedBuckets[bucket].push(t);
            });

            assignedBuckets.completed = [];

            // Sort assigned tasks by priority
            Object.values(assignedBuckets).forEach(bucket => {
                bucket.sort((a, b) => {
                    const pMap = { 'High': 1, 'Medium': 2, 'Low': 3 };
                    const pA = pMap[a.priority] || 4;
                    const pB = pMap[b.priority] || 4;
                    return pA - pB;
                });
            });

            // Personal Lists (Persisted)
            const [ongoingFocus, setOngoingFocus] = useLocalStorage('oc-dashboard-focus-ongoing', []);
            const [somedayFocus, setSomedayFocus] = useLocalStorage('oc-dashboard-focus-someday', []);
            const [completedFocus, setCompletedFocus] = useLocalStorage('oc-dashboard-focus-completed', []);

            const lists = {
                today: dailyFocus,
                thisWeek: weeklyFocus,
                thisMonth: monthlyFocus,
                ongoing: ongoingFocus,
                someday: somedayFocus,
                completed: completedFocus
            };

            const listSetters = {
                today: setDailyFocus,
                thisWeek: setWeeklyFocus,
                thisMonth: setMonthlyFocus,
                ongoing: setOngoingFocus,
                someday: setSomedayFocus,
                completed: setCompletedFocus
            };

            // Enhanced Drop Handler for 5 columns
            const handleDrop = (e, targetType, targetIndex = null) => {
                e.preventDefault();
                e.stopPropagation(); // Stop bubbling to container
                if (!draggedItem) return;

                const { type: sourceType, index: sourceIndex, item } = draggedItem;

                // Handle assigned tasks - move them between buckets
                if (sourceType.startsWith('assigned_')) {
                    const sourceCol = sourceType.replace('assigned_', '');

                    // Calculate updates based on target bucket
                    let updates = getUpdatesForBucket(item, targetType);

                    // Handle completion logic
                    if (targetType === 'completed') {
                        updates = { completed: true }; // Only set completion, don't change category/recurrence
                    } else if (sourceCol === 'completed' && targetType !== 'completed') {
                        // Moving OUT of completed -> uncomplete
                        updates = { ...updates, completed: false };
                    }

                    if (onUpdateTask) {
                        onUpdateTask({ ...item, ...updates });
                    }

                    setDraggedItem(null);
                    return;
                }

                // Move between personal lists
                const sourceList = lists[sourceType];
                const targetList = lists[targetType];

                if (sourceType === targetType) {
                    // Reorder within the same list
                    const newList = [...sourceList];
                    const [movedItem] = newList.splice(sourceIndex, 1);

                    // If dropping on container (targetIndex is null), append to end
                    const finalIndex = targetIndex !== null ? targetIndex : newList.length;

                    newList.splice(finalIndex, 0, movedItem);
                    listSetters[sourceType](newList);
                } else {
                    // Move to different list
                    const newSource = sourceList.filter((_, i) => i !== sourceIndex);
                    listSetters[sourceType](newSource);

                    // If dropping specific index, insert there; otherwise append
                    if (targetIndex !== null) {
                        const newTarget = [...targetList];
                        newTarget.splice(targetIndex, 0, item);
                        listSetters[targetType](newTarget);
                    } else {
                        listSetters[targetType]([...targetList, item]);
                    }
                }
                setDraggedItem(null);
            };

            // Task Notes Modal Component
            const TaskNotesModal = ({ task, onClose }) => {
                if (!task) return null;

                return (
                    <div
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.7)', zIndex: 9999,
                            display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}
                        onClick={onClose}
                    >
                        <div
                            style={{
                                background: 'var(--bg-panel)', padding: '2rem',
                                borderRadius: '12px', maxWidth: '600px', width: '90%',
                                maxHeight: '80vh', overflowY: 'auto',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{task.task || 'Task Details'}</h2>
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: 'none', border: 'none', fontSize: '2rem',
                                        cursor: 'pointer', color: 'var(--text-secondary)',
                                        lineHeight: 1, padding: 0
                                    }}
                                >×</button>
                            </div>

                            {task.notes && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Notes:</h3>
                                    <div style={{
                                        background: 'var(--bg-card)', padding: '1rem',
                                        borderRadius: '6px', whiteSpace: 'pre-wrap',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {task.notes}
                                    </div>
                                </div>
                            )}

                            {!task.notes && (
                                <div style={{
                                    padding: '2rem', textAlign: 'center',
                                    color: 'var(--text-secondary)', fontStyle: 'italic',
                                    background: 'var(--bg-card)', borderRadius: '6px',
                                    border: '1px dashed var(--border)'
                                }}>
                                    No notes for this task
                                </div>
                            )}

                            {/* Display other task properties */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                {task.priority && (
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Priority</div>
                                        <div style={{ fontWeight: 'bold', color: task.priority === 'High' ? '#ef4444' : 'var(--text-primary)' }}>
                                            {task.priority === 'High' ? '🔥 High' : task.priority}
                                        </div>
                                    </div>
                                )}
                                {task.estimatedTime && (
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Est. Time</div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{task.estimatedTime}</div>
                                    </div>
                                )}
                                {task.deadline && (
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Deadline</div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {new Date(task.deadline).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                                {task.category && (
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Category</div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{task.category}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            };


            return (
                <div style={{ padding: '2rem', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--accent)' }}>{currentWeek.name}</span> Focus
                            {currentWeek.opponent && <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>vs {currentWeek.opponent}</span>}
                        </h1>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            Program Dashboard {userRole !== 'Head Coach' && <span style={{ opacity: 0.7 }}>— Viewing as {userRole}</span>}
                        </div>
                    </div>

                    {/* DASHBOARD WIDGETS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

                        {/* 1. ATTENDANCE WIDGET */}
                        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <Icon name="Users" size={20} /> Attendance
                                {attendanceAlerts.length > 0 && <span className="badge badge-red">{attendanceAlerts.length}</span>}
                            </h2>
                            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
                                {attendanceAlerts.length === 0 ? (
                                    <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6, fontStyle: 'italic' }}>
                                        No attendance issues.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {attendanceAlerts.map(alert => (
                                            <div key={alert.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.5rem', borderRadius: '4px',
                                                background: alert.level === 'high' ? '#fef2f2' : '#fffbeb',
                                                border: `1px solid ${alert.level === 'high' ? '#fee2e2' : '#fef3c7'}`
                                            }}>
                                                <span style={{ fontWeight: '600' }}>{alert.player.firstName} {alert.player.lastName}</span>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                                                    background: alert.type === 'Absent' ? '#dc2626' : '#d97706', color: 'white'
                                                }}>
                                                    {alert.type.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. INJURY REPORT WIDGET */}
                        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <Icon name="Activity" size={20} /> Injury Report
                                {injuryReport.length > 0 && <span className="badge badge-red">{injuryReport.length}</span>}
                            </h2>
                            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
                                {injuryReport.length === 0 ? (
                                    <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6, fontStyle: 'italic' }}>
                                        No active injuries.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {injuryReport.map(report => (
                                            <div key={report.id} style={{
                                                padding: '0.5rem', borderRadius: '4px',
                                                background: report.status === 'Out' ? '#fef2f2' : '#fffbeb',
                                                border: `1px solid ${report.status === 'Out' ? '#fee2e2' : '#fef3c7'}`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '600' }}>{report.name}</span>
                                                    <span style={{
                                                        fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                                                        background: report.status === 'Out' ? '#dc2626' : '#f59e0b', color: 'white'
                                                    }}>
                                                        {report.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                                    <span style={{ fontWeight: '500' }}>{report.injury}</span>
                                                    <span style={{ margin: '0 0.5rem', color: '#ccc' }}>|</span>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Return: {report.returnDate}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* 1. HORIZONTAL WEEK SCHEDULE (Only if NOT Offseason) */}
                        {/* 1. HORIZONTAL WEEK SCHEDULE (Only if NOT Offseason) */}
                        {currentWeek.phase !== 'Offseason' && (
                            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Icon name="Calendar" size={20} /> Week Schedule
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', minWidth: '800px' }}>
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => {
                                        // Get Date
                                        const sundayDate = new Date(currentWeek.sundayDate);
                                        const date = new Date(sundayDate);
                                        date.setDate(sundayDate.getDate() + idx);
                                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        const dayKey = day.toLowerCase();

                                        const dayEvents = (currentWeek.overview?.dailySchedule?.[dayKey]?.events || []);
                                        
                                        return (
                                            <div key={day} style={{ border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
                                                {/* Header */}
                                                <div style={{ padding: '0.5rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{day.substring(0, 3)}</div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{dateStr}</div>
                                                </div>

                                                {/* Events */}
                                                <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '80px' }}>
                                                     {dayEvents.length === 0 && <div style={{ fontSize: '0.75rem', opacity: 0.4, fontStyle: 'italic', textAlign: 'center', marginTop: '1rem' }}>Off</div>}
                                                     
                                                     {dayEvents.map(event => (
                                                         <div key={event.id} style={{ 
                                                             fontSize: '0.7rem', 
                                                             padding: '2px 4px', 
                                                             borderRadius: '3px',
                                                             background: event.type === 'game' ? '#fee2e2' : event.type === 'practice' ? '#dbeafe' : '#ecfccb',
                                                             color: event.type === 'game' ? '#dc2626' : event.type === 'practice' ? '#1d4ed8' : '#15803d',
                                                             border: `1px solid ${event.type === 'game' ? '#fecaca' : event.type === 'practice' ? '#bfdbfe' : '#d9f99d'}`
                                                         }}>
                                                             <div style={{ fontWeight: 'bold' }}>{event.start}</div>
                                                             <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                 {event.type === 'game' ? (event.isHome ? 'vs ' : '@ ') + event.opponent : event.type === 'practice' ? 'Practice' : event.title || 'Event'}
                                                             </div>
                                                         </div>
                                                     ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2. DASHBOARD WIDGETS GRID */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                            {/* 3. WARRIOR DIAL (WELLNESS) WIDGET */}
                            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                    <Icon name="HardHat" size={20} /> Warrior Dial
                                    {(wellnessAlerts.length + loadAlerts.length) > 0 && <span className="badge badge-red">{wellnessAlerts.length + loadAlerts.length}</span>}
                                </h2>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {(wellnessAlerts.length === 0 && loadAlerts.length === 0) ? (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            All systems go.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {[...wellnessAlerts, ...loadAlerts].map((alert, idx) => (
                                                <div key={idx} style={{ 
                                                    padding: '0.5rem', 
                                                    borderRadius: '4px',
                                                    background: alert.level === 'high' ? '#fee2e2' : '#fffbeb',
                                                    border: `1px solid ${alert.level === 'high' ? '#fee2e2' : '#fef3c7'}`
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ fontWeight: '600' }}>{alert.player.firstName} {alert.player.lastName}</span>
                                                        <span style={{ fontSize: '0.75rem', color: alert.level === 'high' ? '#dc2626' : '#d97706', fontWeight: 'bold' }}>{alert.type}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>{alert.message}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 4. EQUIPMENT & INVENTORY ALERTS */}
                            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                    <Icon name="Key" size={20} /> Equipment
                                    {(inventoryAlerts.length + checkoutAlerts.length) > 0 && <span className="badge badge-red">{inventoryAlerts.length + checkoutAlerts.length}</span>}
                                </h2>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {(inventoryAlerts.length === 0 && checkoutAlerts.length === 0) ? (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            No alerts.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {/* Overdue Checkouts */}
                                            {checkoutAlerts.map(alert => (
                                                <div key={alert.id} style={{ 
                                                    padding: '0.5rem', 
                                                    borderRadius: '4px',
                                                    background: '#fee2e2',
                                                    border: '1px solid #fee2e2' 
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ fontWeight: '600' }}>{alert.player.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>OVERDUE</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>
                                                        {alert.item} ({alert.size}) - Due: {alert.dueDate}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* 4-COLUMN DASHBOARD (Task List) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', flex: 1, minHeight: 0 }}>
                            {
                                ['today', 'thisWeek', 'thisMonth', 'someday'].map(col => {
                                    const titleMap = { today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month', someday: 'Someday' };
                                    const personalList = lists[col];
                                    const assignedList = assignedBuckets[col];
    
                                    return (
                                        <div
                                            key={col}
                                            className="card"
                                            style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, col)}
                                        >
                                            <h3 style={{ fontSize: '1.2rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--accent)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                                {titleMap[col]}
                                                <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'normal' }}>{personalList.length + assignedList.length}</span>
                                            </h3>
    
                                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', minHeight: '200px', padding: '0.5rem' }}>
                                                {/* Assigned Tasks (Auto-Populated) */}

                                            {assignedList.map((task, idx) => (
                                                <div
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        setDraggedItem({ type: `assigned_${col}`, index: idx, item: task });
                                                        e.dataTransfer.effectAllowed = "move";
                                                    }}
                                                    onDoubleClick={() => setViewingTaskNotes(task)}
                                                    style={{
                                                        padding: '0.75rem',
                                                        background: 'var(--surface)',
                                                        borderRadius: '6px',
                                                        borderLeft: `4px solid ${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#eab308' : '#3b82f6'}`,
                                                        fontSize: '0.9rem',
                                                        cursor: 'grab',
                                                        opacity: task.completed ? 0.6 : 1
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!task.completed}
                                                            onChange={(e) => {
                                                                if (onUpdateTask) {
                                                                    onUpdateTask({ ...task, completed: e.target.checked });
                                                                }
                                                            }}
                                                            style={{ marginTop: '0.25rem' }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '500', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.task}</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                <span>{task.priority === 'High' ? '🔥 High' : task.priority}</span>
                                                                <span>{task.estimatedTime}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Personal Checklist Items */}
                                            {personalList.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        setDraggedItem({ type: col, index: idx, item });
                                                        e.dataTransfer.effectAllowed = "move";
                                                    }}
                                                    onDragOver={(e) => {
                                                        e.preventDefault(); // Necessary to allow dropping
                                                        e.stopPropagation();
                                                    }}
                                                    onDrop={(e) => handleDrop(e, col, idx)}
                                                    onDoubleClick={() => {
                                                        const taskObj = typeof item === 'string' ? { task: item } : item;
                                                        setViewingTaskNotes(taskObj);
                                                    }}
                                                    style={{
                                                        padding: '0.75rem',
                                                        background: 'white',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border)',
                                                        fontSize: '0.9rem',
                                                        cursor: 'grab',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span>{typeof item === 'string' ? item : item.task || JSON.stringify(item)}</span>
                                                    <button
                                                        onClick={() => {
                                                            const newList = personalList.filter((_, i) => i !== idx);
                                                            listSetters[col](newList);
                                                        }}
                                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                                    >
                                                        <Icon name="X" size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {canEdit && (
                                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    className="form-input"
                                                    style={{ fontSize: '0.9rem', padding: '0.4rem' }}
                                                    placeholder={`Add item...`}
                                                    value={inputs[col] || ''}
                                                    onChange={e => setInputs(prev => ({ ...prev, [col]: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && addItem(col, inputs[col])}
                                                />
                                                <button className="btn-sm btn-primary" onClick={() => addItem(col, inputs[col])} style={{ padding: '0 0.5rem' }}>
                                                    <Icon name="Plus" size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                );
                            })
                        }
                    </div>

                    {/* COMPLETED TASKS BUCKET (Collapsible) */}
                    <div
                        className="card"
                        style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: 'var(--bg-panel)',
                            border: '1px dashed var(--border)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isCompletedExpanded ? '1rem' : '0'
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'completed')}
                        onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="CheckCircle" size={18} />
                                Completed Tasks
                                <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>
                                    ({assignedBuckets.completed.length})
                                </span>
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                    {isCompletedExpanded ? 'Click to collapse' : 'Drag here to complete'}
                                </span>
                                <Icon name={isCompletedExpanded ? "ChevronDown" : "ChevronRight"} size={18} color="var(--text-secondary)" />
                            </div>
                        </div>

                        {
                            isCompletedExpanded && (
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                    {assignedBuckets.completed.length === 0 ? (
                                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Drag tasks here to mark as complete</div>
                                    ) : (
                                        assignedBuckets.completed.map((task, idx) => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    setDraggedItem({ type: `assigned_completed`, index: idx, item: task });
                                                    e.dataTransfer.effectAllowed = "move";
                                                }}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: 'var(--bg-input)',
                                                    borderRadius: '20px',
                                                    border: '1px solid var(--border)',
                                                    fontSize: '0.9rem',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'grab',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    textDecoration: 'line-through'
                                                }}
                                            >
                                                <Icon name="Check" size={12} color="#10b981" />
                                                {task.task}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )
                        }
                    </div>

                    {/* Task Notes Modal */}
                    {
                        viewingTaskNotes && (
                            <TaskNotesModal
                                task={viewingTaskNotes}
                                onClose={() => setViewingTaskNotes(null)}
                            />
                        )
                    }
                </div>
            );
        };



        const GAME_PLAN_LAYOUTS = {
            CALL_SHEET: {
                id: 'CALL_SHEET',
                name: 'Call Sheet',
                sections: [
                    {
                        id: 'section_scripts',
                        title: 'SCRIPTS',
                        color: '#1e293b',
                        boxes: [
                            { header: 'OPENING SCRIPT', setId: 'opening_script', type: 'script', colSpan: 1, color: '#10b981' },
                            { header: '2ND HALF OPENER', setId: 'second_half_openers', type: 'script', colSpan: 1, color: '#f97316' },
                            { header: 'P&10', setId: 'p_and_10', type: 'script', colSpan: 1, color: '#ef4444' },
                            { header: '2ND & XL (LH)', setId: '2nd_xl_lh', type: 'script', colSpan: 1, color: '#3b82f6' },
                        ]
                    },
                    {
                        id: 'section_down_distance',
                        title: 'DOWN AND DISTANCE',
                        color: '#1e293b',
                        boxes: [
                            { header: '1 WORD', setId: 'one_word', type: 'grid', colSpan: 1, color: '#f59e0b' },
                            { header: 'FORM ADJ', setId: 'form_adj', type: 'grid', colSpan: 1, color: '#f59e0b' },
                            { header: 'MOTION', setId: 'motion', type: 'grid', colSpan: 1, color: '#f59e0b' },
                            { header: 'TAG', setId: 'tag', type: 'grid', colSpan: 1, color: '#f59e0b' },
                            { header: '3RD & SHORT', setId: '3rd_short', type: 'grid', colSpan: 1, color: '#10b981' },
                            { header: '3RD & MED', setId: '3rd_med', type: 'grid', colSpan: 1, color: '#10b981' },
                            { header: '3RD & LONG', setId: '3rd_long', type: 'grid', colSpan: 1, color: '#10b981' },
                            { header: '3RD & XL', setId: '3rd_xl', type: 'grid', colSpan: 1, color: '#10b981' },
                            { header: 'BACKED UP', setId: 'backed_up', type: 'grid', colSpan: 1, color: '#dc2626' },
                            { header: 'COMING OUT', setId: 'coming_out', type: 'grid', colSpan: 1, color: '#ea580c' },
                            { header: 'OPEN FIELD', setId: 'open_field', type: 'grid', colSpan: 1, color: '#16a34a' },
                            { header: 'FRINGE (+45-25)', setId: 'fringe', type: 'grid', colSpan: 1, color: '#ca8a04' },
                            { header: 'HIGH RED (25-15)', setId: 'high_red', type: 'grid', colSpan: 1, color: '#ef4444' },
                            { header: 'LOW RED (15-6)', setId: 'low_red', type: 'grid', colSpan: 1, color: '#ef4444' },
                            { header: 'GOAL LINE (5-GL)', setId: 'goal_line', type: 'grid', colSpan: 1, color: '#ef4444' },
                            { header: '2-POINT', setId: 'two_point', type: 'grid', colSpan: 1, color: '#8b5cf6' },
                            { header: '2-MIN: OOB/YAC', setId: 'two_minute_oob_yac', type: 'grid', colSpan: 1, color: '#8b5cf6' },
                            { header: '2-MIN: 1st DOWN', setId: 'two_minute_first_down', type: 'grid', colSpan: 1, color: '#8b5cf6' },
                            { header: '2-MIN: TD', setId: 'two_minute_touchdown', type: 'grid', colSpan: 1, color: '#8b5cf6' },
                            { header: '2-MIN: FINAL PLAY', setId: 'two_minute_final_play', type: 'grid', colSpan: 1, color: '#8b5cf6' },
                            { header: '4-MINUTE', setId: 'four_minute', type: 'grid', colSpan: 1, color: '#8b5cf6' },
                        ]
                    },
                    {
                        id: 'section_mini_scripts',
                        title: 'MINI SCRIPTS',
                        color: '#1e293b',
                        boxes: []
                    }
                ]
            },
            MATRIX: {
                id: 'MATRIX',
                name: "Strike 'Em Out",
                cols: [
                    { id: 'FB_L', label: 'FB L', fullLabel: 'Base/Initial Left' },
                    { id: 'FB_R', label: 'FB R', fullLabel: 'Base/Initial Right' },
                    { id: 'CB_L', label: 'CB L', fullLabel: 'Base w/ Dressing Left' },
                    { id: 'CB_R', label: 'CB R', fullLabel: 'Base w/ Dressing Right' },
                    { id: 'CU_L', label: 'CU L', fullLabel: 'Convert Left' },
                    { id: 'CU_R', label: 'CU R', fullLabel: 'Convert Right' },
                    { id: 'SO_L', label: 'SO L', fullLabel: 'Explosive Left' },
                    { id: 'SO_R', label: 'SO R', fullLabel: 'Explosive Right' }
                ],
                formations: [
                    { id: '887', label: '887', color: '#ef4444' },
                    { id: '888', label: '888', color: '#ef4444' },
                    { id: '687', label: '687', color: '#fbbf24' },
                    { id: '688', label: '688', color: '#fbbf24' },
                    { id: '881', label: '881', color: '#facc15' },
                    { id: '984', label: '984', color: '#4ade80' },
                    { id: '983', label: '983', color: '#4ade80' },
                    { id: '488', label: '488', color: '#60a5fa' },
                    { id: '487', label: '487', color: '#60a5fa' },
                    { id: 'jets', label: 'Jets/Specials', color: '#a8a29e' }
                ],
                playTypes: [
                    { id: 'strong_run', label: 'STRONG RUN' },
                    { id: 'weak_run', label: 'WEAK RUN' },
                    { id: 'quick_game', label: 'QUICK GAME' },
                    { id: 'drop_back', label: 'DROPBACK' },
                    { id: 'gadget', label: 'GADGET' }
                ]
            }
        };


};