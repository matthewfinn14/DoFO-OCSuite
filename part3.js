                        const App = () => {
                            // Custom Hook for Auto-Sync to prevent initial-load overwrites
                            const useAutoSync = (authUser, key, data, debounceMs = 2000, isEnabled = true) => {
                                const isFirstRun = useRef(true);
                                useEffect(() => {
                                    // Always skip the very first run (mount)
                                    if (isFirstRun.current) {
                                        isFirstRun.current = false;
                                        return;
                                    }

                                    // Only run if:
                                    // 1. User is logged in
                                    // 2. Global "isLoaded" flag is true (prevents overwriting cloud data with initial empty state)
                                    if (authUser && window.db && isEnabled) {
                                        const timer = setTimeout(() => {
                                            syncToFirestore(authUser.uid, key, data);
                                        }, debounceMs);
                                        return () => clearTimeout(timer);
                                    }
                                }, [data, authUser, key, debounceMs, isEnabled]);
                            };
                            const { currentUser: authUser, logout } = useAuth();
                            // Auth check moved to end of component to prevent hook mismatch errors


                            const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
                            const [view, setView] = useState('landing'); // Default to My Tasks
                            const [showManageWeekModal, setShowManageWeekModal] = useState(false);
                            const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('hc-sidebar-collapsed', false);
                            const [editingPlay, setEditingPlay] = useState(null);

                            // -- SCHOOL INITIALIZATION CHECK --
                            const [schoolSetupData, setSchoolSetupData] = useState({ showWizard: false, schoolId: null });
                            const [inviteData, setInviteData] = useState(null); // NEW: Invite State

                            // -- PROGRAM RECORDS MIGRATION --
                            const [programRecords, setProgramRecords] = useLocalStorage('hc-program-records', {});

                            // Sync Program Records to Firestore
                            useAutoSync(authUser, 'program_records', programRecords);

                            // -- CULTURAL CALIBRATION --
                            const [culturalCalibration, setCulturalCalibration] = useLocalStorage('hc-cultural-calibration', {
                                quotes: [],
                                challenges: [],
                                activeQuote: null,
                                activeChallenge: null,
                                responses: []
                            });

                            // Sync Cultural Calibration to Firestore
                            useAutoSync(authUser, 'cultural_calibration', culturalCalibration);


                            // -- DRILL LIBRARY STATE --
                            const [drills, setDrills] = useLocalStorage('hc-drills', INITIAL_DRILL_DATA);

                            // Sync Drills to Firestore
                            useAutoSync(authUser, 'drills', drills);

                            const handleAddDrill = (newDrill) => {
                                setDrills(prev => [...prev, { ...newDrill, id: 'drill_' + Date.now() }]);
                            };

                            // -- DEPTH CHART STATE --
                            const [depthCharts, setDepthCharts] = useLocalStorage('hc-depth-charts', {});
                            const [depthChartLayouts, setDepthChartLayouts] = useLocalStorage('hc-depth-chart-layouts', {});

                            const handleUpdateDepthLayout = (chartType, id, x, y) => {
                                setDepthChartLayouts(prev => ({
                                    ...prev,
                                    [chartType]: {
                                        ...(prev[chartType] || {}),
                                        [id]: { x, y }
                                    }
                                }));
                            };

                            const handleResetDepthLayout = (chartType) => {
                                if (window.confirm('Reset layout positions for ' + chartType + '?')) {
                                    const newLayouts = { ...depthChartLayouts };
                                    delete newLayouts[chartType];
                                    setDepthChartLayouts(newLayouts);
                                }
                            };
                            // Sync Depth Charts to Firestore
                            useAutoSync(authUser, 'depth_charts', depthCharts);

                            // Migration Effect
                            useEffect(() => {
                                const MIGRATION_KEY = 'program_records_migrated_v1';
                                // Check for specific user email to load legacy data once
                                if (authUser && authUser.email === 'mfinn@roland-story.k12.ia.us') {
                                    const hasMigrated = localStorage.getItem(MIGRATION_KEY);
                                    if (!hasMigrated && typeof LEGACY_PROGRAM_RECORDS !== 'undefined') {
                                        console.log("Migrating legacy program records for mfinn...");
                                        setProgramRecords(LEGACY_PROGRAM_RECORDS);
                                        localStorage.setItem(MIGRATION_KEY, 'true');
                                    }
                                }
                            }, [authUser, setProgramRecords]);

                            useEffect(() => {
                                const checkSchoolInit = async () => {
                                    if (!authUser) return;

                                    try {
                                        // 1. CHECK FOR PENDING INVITES
                                        console.log("Checking for invites for:", authUser.email);
                                        const inviteQuery = await window.db.collection('invites')
                                            .where('email', '==', authUser.email.toLowerCase())
                                            .where('status', '==', 'pending')
                                            .get();

                                        if (!inviteQuery.empty) {
                                            const inviteDoc = inviteQuery.docs[0];
                                            console.log("Found invite:", inviteDoc.id);
                                            setInviteData({ id: inviteDoc.id, ...inviteDoc.data() });
                                            return; // Stop processing to show invite modal
                                        }

                                        // 1b. CHECK FOR CLAIMED DOMAINS (Auto-Join)
                                        const emailDomain = authUser.email.split('@')[1];
                                        if (emailDomain) {
                                            const domainQuery = await window.db.collection('schools')
                                                .where('domains', 'array-contains', emailDomain.toLowerCase())
                                                .limit(1)
                                                .get();

                                            if (!domainQuery.empty) {
                                                const sDoc = domainQuery.docs[0];
                                                const sData = sDoc.data();
                                                // Check if already a member
                                                const memCheck = await window.db.collection('users').doc(authUser.uid).collection('memberships').doc(sDoc.id).get();
                                                if (!memCheck.exists) {
                                                    setInviteData({
                                                        schoolId: sDoc.id,
                                                        schoolName: sData.name,
                                                        role: 'viewer', // Default to viewer for safety
                                                        type: 'domain_match'
                                                    });
                                                    return;
                                                }
                                            }
                                        }

                                        // 1c. PRIMARY SETUP CHECK: DO I HAVE A MEMBERSHIP?
                                        // If user has ANY membership, they are setup. We skip legacy/creation wizard.
                                        // FIX: Ensure User Document actually exists! (Subcollections persist after parent deletion)
                                        const userDocCall = await window.db.collection('users').doc(authUser.uid).get();

                                        console.log("DEBUG: Checking memberships for user:", authUser.uid);
                                        const memberships = await window.db.collection('users').doc(authUser.uid).collection('memberships').get();
                                        console.log("DEBUG: Membership count:", memberships.size);

                                        // Only respect memberships if the user profile is intact
                                        if (!memberships.empty && userDocCall.exists) {
                                            console.log("User has active memberships. Skipping wizard.");
                                            return;
                                        }

                                        // 2. CHECK LEGACY / EXISTING ACCESS
                                        // Force Server Fetch to avoid stale cache loop (Wrapped in Try/Catch for robustness)
                                        let accessDoc;
                                        try {
                                            accessDoc = await window.db.collection('config').doc('access').get({ source: 'server' });
                                        } catch (e) {
                                            console.warn("Access config server fetch failed, fallback to cache", e);
                                            accessDoc = await window.db.collection('config').doc('access').get();
                                        }

                                        const accessData = accessDoc.exists ? accessDoc.data() : {};
                                        const userValues = Object.values(accessData.userSchools || {});

                                        const isPaying = accessData.payingAdmins && accessData.payingAdmins.includes(authUser.email.toLowerCase());

                                        // Check if user has a school ID assigned in config OR on their profile
                                        let schoolId = accessData.userSchools ? accessData.userSchools[authUser.email.toLowerCase()] : null;

                                        if (!schoolId) {
                                            const userDoc = await window.db.collection('users').doc(authUser.uid).get();
                                            if (userDoc.exists && userDoc.data().schoolId) {
                                                schoolId = userDoc.data().schoolId;
                                            }
                                        }

                                        // 3. CHECK FOR ZERO MEMBERSHIPS (Orphaned User -> Create New School)
                                        // If no invites, no domain match, and no legacy school ID, check strict memberships
                                        if (!inviteData && !schoolId) {
                                            console.log("User has no memberships and no legacy setup. Triggering School Creation Wizard.");
                                            const newSchoolId = 'school_' + Date.now();
                                            setSchoolSetupData({ showWizard: true, schoolId: newSchoolId });
                                            return;
                                        }

                                        // If Paying Admin + Has School ID + School Not Initialized -> Show Wizard
                                        // (Keep existing legacy check for now)
                                        if (isPaying && schoolId) {
                                            let schoolDoc;
                                            try {
                                                schoolDoc = await window.db.collection('schools').doc(schoolId).get({ source: 'server' });
                                            } catch (e) {
                                                console.warn("School doc server fetch failed, using cache", e);
                                                schoolDoc = await window.db.collection('schools').doc(schoolId).get();
                                            }

                                            if (schoolDoc.exists && !schoolDoc.data().initialized) {
                                                console.log("School not initialized, showing wizard.");
                                                setSchoolSetupData({ showWizard: true, schoolId: schoolId });
                                            }
                                        }
                                    } catch (err) {
                                        console.error("Error checking school init:", err);
                                    }
                                };
                                checkSchoolInit();
                            }, [authUser]);

                            // INVITE ACCEPTANCE HANDLER
                            const handleAcceptInvite = async () => {
                                if (!inviteData) return;
                                try {
                                    // 1. Create Membership
                                    await window.db.collection('users').doc(authUser.uid).collection('memberships').doc(inviteData.schoolId).set({
                                        role: inviteData.role,
                                        joinedAt: new Date().toISOString(),
                                        status: 'active'
                                    });

                                    // 2. Add to School Member List
                                    const newMember = {
                                        uid: authUser.uid,
                                        email: authUser.email,
                                        role: inviteData.role,
                                        joinedAt: new Date().toISOString()
                                    };
                                    await window.db.collection('schools').doc(inviteData.schoolId).update({
                                        memberList: firebase.firestore.FieldValue.arrayUnion(newMember)
                                    });

                                    // 3. Mark Invite Accepted (If valid invite)
                                    if (inviteData.id && inviteData.type !== 'domain_match') {
                                        await window.db.collection('invites').doc(inviteData.id).update({
                                            status: 'accepted',
                                            acceptedAt: new Date().toISOString(),
                                            acceptedBy: authUser.uid
                                        });
                                    }

                                    // 4. Set Local Context & Reload
                                    localStorage.setItem('hc_school_id', inviteData.schoolId);
                                    localStorage.setItem('hc_school_name', inviteData.schoolName);

                                    // Force clean slate for new school
                                    localStorage.removeItem('oc-dashboard-roster');
                                    localStorage.removeItem('oc-dashboard-plays');
                                    localStorage.removeItem('oc-dashboard-staff');

                                    alert("Welcome to the team!");
                                    window.location.reload();

                                } catch (err) {
                                    console.error("Error accepting invite:", err);
                                    alert("Failed to join. Please try again.");
                                }
                            };




                            // Settings State
                            const [searchTerm, setSearchTerm] = useState('');


                            const [activeYear, setActiveYear] = useState(() => {
                                return localStorage.getItem('hc-active-year') || '2025';
                            });

                            useEffect(() => {
                                localStorage.setItem('hc-active-year', activeYear);
                                // Cloud Sync
                                if (currentUser && window.db) {
                                    syncToFirestore(currentUser.uid, 'settings', { activeYear });
                                }
                            }, [activeYear, currentUser]);

                            // Football 101 Data
                            const [football101Data, setFootball101Data] = useLocalStorage('hc-football-101', {
                                rules: [],
                                offense: { terms: [], fundamentals: [] },
                                defense: { terms: [], fundamentals: [] },
                                specialTeams: { terms: [], fundamentals: [] }
                            });

                            const [visibleFeatures, setVisibleFeatures] = useState(() => {
                                const saved = localStorage.getItem('hc-visible-features');
                                const DEFAULT_FEATURES = {
                                    staffMeeting: {
                                        enabled: true,
                                        items: {
                                            meetingHome: true,
                                            scouting: true,
                                            weekOverview: true,
                                            practice: true,
                                            pregame: true,
                                            grading: true
                                        }
                                    },
                                    gameWeek: { // Now "Offense, Defense & Special Teams"
                                        enabled: true,
                                        items: {
                                            offenseSetup: true,
                                            defenseSetup: true,
                                            stSetup: true,
                                            depthCharts: true,
                                            playbook: true,
                                            formations: true,
                                            glossary: true,
                                            drillLibrary: true,
                                            gamePlan: true,
                                            addPlay: true,
                                            wristband: true,
                                            practiceScripts: true,
                                            dumbCallsheet: true,
                                            smartCallsheet: true
                                        }
                                    },
                                    program: {
                                        enabled: true,
                                        items: {
                                            roster: true,
                                            taskAssigner: true,
                                            calendar: true,
                                            budget: true,
                                            culturalCalibration: true,
                                            onboarding: true,
                                            equipmentCheckout: true,
                                            jerseyLottery: true,
                                            equipmentInventory: true,
                                            equipmentWishlist: true
                                        }
                                    },
                                    apps: {
                                        enabled: true,
                                        items: {
                                            playerApp: true,
                                            attendanceApp: true,
                                            coachApp: true,
                                            callsheet: true,
                                            simulator: true,
                                            pressbox: true,
                                            specialTeams: true
                                        }
                                    },
                                    development: {
                                        enabled: true,
                                        items: {
                                            testing: true,
                                            ironman: true,
                                            ratings: true,
                                            summerComp: true,

                                            testingRecords: true,
                                            selfAssessment: true,
                                            multiSport: true
                                        }
                                    }
                                };

                                if (saved) {
                                    try {
                                        const parsed = JSON.parse(saved);

                                        // MIGRATION LOGIC:
                                        // 1. If 'scheme' exists, migrate its items to 'gameWeek' if not already there
                                        // 2. Ensure ALL keys from DEFAULT_FEATURES exist in the result (deep merge)

                                        const merged = { ...DEFAULT_FEATURES };
                                        // Force enable ratings per user request
                                        if (parsed.development && parsed.development.items) {
                                            parsed.development.items.ratings = true;
                                        }

                                        // Helper to safely merge category
                                        const mergeCategory = (catName, legacySource = null) => {
                                            const parsedCat = parsed[catName] || {};
                                            const defaultCat = DEFAULT_FEATURES[catName];

                                            // If user explicitly disabled the category in parsed, keep it disabled.
                                            // However, if it was undefined (new category), default to enabled (true).
                                            const isEnabled = parsedCat.enabled !== undefined ? parsedCat.enabled : defaultCat.enabled;

                                            const mergedItems = { ...defaultCat.items };

                                            // Merge existing items from parsed
                                            if (parsedCat.items) {
                                                Object.keys(parsedCat.items).forEach(key => {
                                                    mergedItems[key] = parsedCat.items[key];
                                                });
                                            }

                                            // Migrate legacy items if applicable
                                            if (legacySource && parsed[legacySource] && parsed[legacySource].items) {
                                                // Specific migration for scheme -> gameWeek
                                                if (catName === 'gameWeek') {
                                                    // Map scheme items to new keys if needed, or just copy if names match
                                                    if (parsed[legacySource].items.playbook !== undefined) mergedItems.playbook = parsed[legacySource].items.playbook;
                                                    if (parsed[legacySource].items.formations !== undefined) mergedItems.formations = parsed[legacySource].items.formations;
                                                    if (parsed[legacySource].items.drillLibrary !== undefined) mergedItems.drillLibrary = parsed[legacySource].items.drillLibrary;
                                                    // Glossary was not tracked in scheme permissions previously? If so, default true is fine.
                                                }
                                            }

                                            return {
                                                enabled: isEnabled,
                                                items: mergedItems
                                            };
                                        };

                                        return {
                                            staffMeeting: mergeCategory('staffMeeting'), // New category
                                            gameWeek: mergeCategory('gameWeek', 'scheme'), // Merge scheme into gameWeek
                                            program: mergeCategory('program'),
                                            apps: mergeCategory('apps'),
                                            development: mergeCategory('development')
                                        };

                                    } catch (e) {
                                        console.error("Error parsing visible features, resetting to default", e);
                                        return DEFAULT_FEATURES;
                                    }
                                }

                                return DEFAULT_FEATURES;
                            });

                            useEffect(() => {
                                localStorage.setItem('hc-visible-features', JSON.stringify(visibleFeatures));
                            }, [visibleFeatures]);

                            // --- LIFTED STATE FOR FULL SYNC COMPATIBILITY ---
                            const [positionFatigue, setPositionFatigue] = useState(() => {
                                const saved = localStorage.getItem('position-fatigue-values');
                                if (saved) return JSON.parse(saved);
                                return {
                                    // Offense
                                    'QB': 2, 'RB': 3, 'WR': 2, 'TE': 2,
                                    'LT': 2, 'LG': 2, 'C': 2, 'RG': 2, 'RT': 2,
                                    'X': 2, 'Y': 2, 'Z': 2, 'A': 2,
                                    // Defense
                                    'DE': 3, 'DT': 3, 'NT': 3, 'LDE': 3, 'RDE': 3, 'LDT': 3, 'RDT': 3,
                                    'Will': 3, 'Mike': 3, 'WLB': 3, 'MLB': 3, 'SLB': 3,
                                    'CB': 2, 'LCB': 2, 'RCB': 2, 'FS': 2, 'SS': 2, 'Nickel': 2, 'Nick': 2,
                                    // Special Teams
                                    'K': 1, 'P': 1, 'LS': 1, 'PP': 1,
                                    'KR': 3, 'Ret': 3, 'R': 3, 'R1': 3, 'R2': 3,
                                    'Gunner': 3, 'G1': 3, 'G2': 3,
                                    'L1': 2, 'L2': 2, 'L3': 2, 'L4': 2, 'L5': 2,
                                    'R1': 2, 'R2': 2, 'R3': 2, 'R4': 2, 'R5': 2,
                                    'Rush': 2, 'Jam': 2, 'Front': 2, 'Mid': 2, 'Back': 2, 'Deep': 2,
                                    'Wing': 2, 'Off': 1,
                                    'DEFAULT': 1
                                };
                            });

                            const [dailyConnections, setDailyConnections] = useState(() => {
                                const saved = localStorage.getItem('player_daily_connections');
                                return saved ? JSON.parse(saved) : {};
                            });

                            const [rooskiLibrary, setRooskiLibrary] = useState(() => {
                                const saved = localStorage.getItem('rooski_ol_library');
                                return saved ? JSON.parse(saved) : [];
                            });

                            // Multi-Card Wristband Settings
                            const [wbSettings, setWbSettings] = useState(() => {
                                const defaultSettings = {
                                    card1: { type: 'standard', opp: '', iter: '1', rows: [] },
                                    card2: { type: 'standard', opp: '', iter: '1', rows: [] },
                                    card3: { type: 'rooski-skill', opp: '', iter: '1', rows: [] },
                                    staples: { type: 'staples', opp: '', iter: '1', rows: [] }
                                };
                                const saved = localStorage.getItem('hc_wb_settings_v3');
                                if (saved) {
                                    const parsed = JSON.parse(saved);
                                    // Ensure staples exists and fill other defaults
                                    return { ...defaultSettings, ...parsed };
                                }

                                // Migration from legacy flat keys
                                return {
                                    card1: {
                                        type: 'standard',
                                        opp: localStorage.getItem('hc_wb1_opponent') || '',
                                        iter: localStorage.getItem('hc_wb1_iteration') || '',
                                        rows: []
                                    },
                                    card2: {
                                        type: 'standard',
                                        opp: localStorage.getItem('hc_wb2_opponent') || '',
                                        iter: localStorage.getItem('hc_wb2_iteration') || '',
                                        rows: []
                                    },
                                    card3: {
                                        type: 'rooski-skill',
                                        opp: '',
                                        iter: '',
                                        rows: []
                                    },
                                    staples: {
                                        type: 'staples',
                                        opp: localStorage.getItem('hc_staples_opponent') || '',
                                        iter: localStorage.getItem('hc_staples_iteration') || '',
                                        rows: []
                                    }
                                };
                            });

                            // Sync WB Settings changes
                            useEffect(() => {
                                localStorage.setItem('hc_wb_settings_v3', JSON.stringify(wbSettings));

                                // Maintain legacy keys for external consumption if any
                                localStorage.setItem('hc_wb1_opponent', wbSettings.card1.opp);
                                localStorage.setItem('hc_wb1_iteration', wbSettings.card1.iter);
                                localStorage.setItem('hc_wb2_opponent', wbSettings.card2.opp);
                                localStorage.setItem('hc_wb2_iteration', wbSettings.card2.iter);
                                if (wbSettings.staples) {
                                    localStorage.setItem('hc_staples_opponent', wbSettings.staples.opp);
                                    localStorage.setItem('hc_staples_iteration', wbSettings.staples.iter);
                                }

                                if (authUser) {
                                    syncToFirestore(authUser.uid, 'wbSettingsV3', {
                                        ...wbSettings,
                                        sheetUrl: localStorage.getItem('hc_wristband_sheet_url')
                                    });
                                }
                            }, [wbSettings, authUser]);
                            const [plays, setPlays] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('oc-dashboard-plays');
                                    if (saved) {
                                        const parsed = JSON.parse(saved);
                                        return Array.isArray(parsed) ? parsed : INITIAL_PLAYS;
                                    }
                                    return INITIAL_PLAYS;
                                } catch (error) {
                                    console.error('Error loading plays from localStorage:', error);
                                    return INITIAL_PLAYS;
                                }
                            });

                            useEffect(() => {
                                localStorage.setItem('position-fatigue-values', JSON.stringify(positionFatigue));
                                if (authUser) syncToFirestore(authUser.uid, 'positionFatigue', positionFatigue);
                            }, [positionFatigue]);

                            // --- CRITICAL DATA SYNC (FINAL AUDIT) ---
                            useEffect(() => {
                                localStorage.setItem('program_budget_data', JSON.stringify(budgetData));
                                if (authUser) syncToFirestore(authUser.uid, 'budget', budgetData);
                            }, [budgetData]);

                            useEffect(() => {
                                localStorage.setItem('program_onboarding_data', JSON.stringify(onboardingData));
                                if (authUser) syncToFirestore(authUser.uid, 'onboarding', onboardingData);
                            }, [onboardingData]);

                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-position-names', JSON.stringify(positionNames));
                                if (authUser) syncToFirestore(authUser.uid, 'positionNames', positionNames);
                            }, [positionNames]);

                            useEffect(() => {
                                localStorage.setItem('player_daily_connections', JSON.stringify(dailyConnections));
                                if (authUser) syncToFirestore(authUser.uid, 'dailyConnections', dailyConnections);
                            }, [dailyConnections]);

                            useEffect(() => {
                                localStorage.setItem('player_weight_logs', JSON.stringify(weightLogs));
                                if (authUser) syncToFirestore(authUser.uid, 'weightLogs', weightLogs);
                            }, [weightLogs]);

                            useEffect(() => {
                                localStorage.setItem('rooski_ol_library', JSON.stringify(rooskiLibrary));
                                if (authUser) syncToFirestore(authUser.uid, 'rooskiLib', rooskiLibrary);
                            }, [rooskiLibrary]);


                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-plays', JSON.stringify(plays));

                                // Auto-sync to Firestore (debounced)
                                const timer = setTimeout(() => {
                                    if (authUser && window.db) { // Check for authUser and db here
                                        if (authUser) syncToFirestore(authUser.uid, 'plays', plays);
                                    }
                                }, 2000); // Debounce playbook sync
                                return () => clearTimeout(timer);
                            }, [plays, authUser]); // Changed currentUser to authUser to match existing context

                            // Sync Weeks (Practice Plans) to Firestore
                            useEffect(() => {
                                const timer = setTimeout(() => {
                                    if (authUser) syncToFirestore(authUser.uid, 'weeks', weeks); // Changed currentUser to authUser
                                }, 3000); // 3s debounce for large plan objects
                                return () => clearTimeout(timer);
                            }, [weeks, authUser]); // Changed currentUser to authUser

                            // Sync Attendance to Firestore
                            useEffect(() => {
                                const timer = setTimeout(() => {
                                    if (authUser) syncToFirestore(authUser.uid, 'attendance', attendance); // Changed currentUser to authUser
                                }, 1500);
                                return () => clearTimeout(timer);
                            }, [attendance, authUser]); // Changed currentUser to authUser


                            // Sync Inventory to Firestore
                            useEffect(() => {
                                const timer = setTimeout(() => {
                                    if (authUser) syncToFirestore(authUser.uid, 'inventory', inventory); // Changed currentUser to authUser
                                }, 1500);
                                return () => clearTimeout(timer);
                            }, [inventory, authUser]);

                            // --- LOADING STATE & SAFETY LOCK ---
                            // 'dataLoaded' prevents the app from auto-syncing "empty" initial state back to the cloud.
                            // It remains false until loadUserDataFromFirestore is finished or fails.
                            const [dataLoaded, setDataLoaded] = useState(false);

                            useEffect(() => {
                                const initUser = async () => {
                                    if (authUser) {
                                        try {
                                            const result = await loadUserDataFromFirestore(authUser.uid);
                                            if (result && result.wiped) {
                                                console.log("User data wiped (New/Deleted User). Forcing School Setup.");
                                                // Force Wizard to appear
                                                setSchoolSetupData({ showWizard: true, schoolId: null });
                                                // Clear Invite Data just in case
                                                setInviteData(null);
                                                // Optional: You could reset other states here if needed, but Wizard hides them.
                                            }
                                        } catch (e) {
                                            console.error("Critical Load Error", e);
                                        } finally {
                                            // Unlock the sync mechanism now that we have attempted to load content
                                            setDataLoaded(true);
                                        }
                                    }
                                };
                                initUser();
                            }, [authUser]);

                            // --- AUTO SYNC HOOK IMPLEMENTATION ---
                            // Replaces individual useEffects to prevent "Race Condition" where stale local data overwrites cloud on boot.
                            // Now gated by 'dataLoaded' so we NEVER sync before we have loaded.
                            useAutoSync(authUser, 'checkouts', checkouts, 1500, dataLoaded);
                            useAutoSync(authUser, 'formationLayouts', formationLayouts, 2000, dataLoaded);
                            useAutoSync(authUser, 'ratings', ratings, 2000, dataLoaded);
                            useAutoSync(authUser, 'gameGrades', gameGrades, 2000, dataLoaded);
                            useAutoSync(authUser, 'summerComp', summerCompData, 2000, dataLoaded);
                            useAutoSync(authUser, 'opponentScouting', opponentScoutData, 2000, dataLoaded);
                            useAutoSync(authUser, 'issuance', issuance, 2000, dataLoaded);
                            useAutoSync(authUser, 'wishlist', wishlist, 2000, dataLoaded);
                            useAutoSync(authUser, 'roster', roster, 2000, dataLoaded);
                            useAutoSync(authUser, 'weeks', weeks, 3000, dataLoaded);
                            useAutoSync(authUser, 'plays', plays, 2000, dataLoaded);
                            useAutoSync(authUser, 'staff', staff, 2000, dataLoaded);
                            useAutoSync(authUser, 'metrics', metrics, 2000, dataLoaded);
                            useAutoSync(authUser, 'weightLogs', weightLogs, 2000, dataLoaded);

                            // Formation Database
                            const [formations, setFormations] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-formations');
                                return saved ? JSON.parse(saved) : DEFAULT_FORMATIONS;
                            });

                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-formations', JSON.stringify(formations));
                            }, [formations]);

                            // Zone Philosophies
                            const [zonePhilosophies, setZonePhilosophies] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-zone-philosophies');
                                return saved ? JSON.parse(saved) : {
                                    backed_up: '',
                                    coming_out: '',
                                    open_field: '',
                                    fringe: 'Take one shot, be ready to convert on 4th',
                                    high_red: '',
                                    low_red: '',
                                    goal_line: ''
                                };
                            });

                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-zone-philosophies', JSON.stringify(zonePhilosophies));
                            }, [zonePhilosophies]);

                            const handleUpdateFormations = (newFormations) => {
                                setFormations(newFormations);
                            };

                            const handleAddFormation = (formation) => {
                                setFormations([...formations, { ...formation, id: formation.id || Date.now().toString() }]);
                            };

                            const handleDeleteFormation = (formationId) => {
                                setFormations(formations.filter(f => f.id !== formationId));
                            };

                            const handleUpdateFormation = (formationId, updatedFormation) => {
                                setFormations(formations.map(f => f.id === formationId ? updatedFormation : f));
                            };

                            // Quick add play from game plan (creates incomplete play)
                            const handleQuickAddPlay = (playNameOrObj) => {
                                let newPlay;
                                if (typeof playNameOrObj === 'object' && playNameOrObj !== null) {
                                    newPlay = playNameOrObj;
                                } else {
                                    newPlay = {
                                        id: `play_${Date.now()}`,
                                        name: typeof playNameOrObj === 'string' ? playNameOrObj.trim() : (playNameOrObj || ''),
                                        wristbandSlot: '',
                                        staplesSlot: '', // [NEW] Staples Wristband Slot (10-89)
                                        formation: '',
                                        tags: [],
                                        incomplete: true, // Mark as incomplete
                                        type: 'Run' // Default type
                                    };
                                }
                                setPlays(prev => [...prev, newPlay]);
                                return newPlay;
                            };

                            const renderWeeklyTools = (weekId) => {
                                const isActive = currentWeekId === weekId;
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.25rem 0 0.5rem 0' }}>


                                        <button className={`nav-item ${isActive && view === 'meeting-notes' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('meeting-notes'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Users" size={12} /> Meeting Home
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'practice' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('practice'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Megaphone" size={12} /> Practice Plans
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'install-manager' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('install-manager'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Layers" size={12} /> Install
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'scouting' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('scouting'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Search" size={12} /> Scouting
                                        </button>
                                        {/* Expanded Depth Charts */}
                                        <CollapsibleCategory
                                            title={<span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Depth Charts</span>}
                                            icon="Users"
                                            defaultOpen={false}
                                            nested={true}
                                        >
                                            <button className={`nav-item ${isActive && view === 'depth' && depthChartType === 'OFFENSE' ? 'active' : ''}`}
                                                onClick={() => { setCurrentWeekId(weekId); setView('depth'); setDepthChartType('OFFENSE'); }}
                                                style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                                                Offense
                                            </button>
                                            <button className={`nav-item ${isActive && view === 'depth' && depthChartType === 'DEFENSE' ? 'active' : ''}`}
                                                onClick={() => { setCurrentWeekId(weekId); setView('depth'); setDepthChartType('DEFENSE'); }}
                                                style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                                                Defense
                                            </button>

                                            {/* Special Teams Sub-items */}
                                            <CollapsibleCategory title="Special Teams" defaultOpen={false} nested={true} style={{ fontSize: '0.7rem', paddingLeft: '2rem' }}>
                                                {[
                                                    { id: 'KICKOFF', name: 'Kickoff' },
                                                    { id: 'KICK_RETURN', name: 'Kick Return' },
                                                    { id: 'PUNT', name: 'Punt' },
                                                    { id: 'PUNT_RETURN', name: 'Punt Return' },
                                                    { id: 'PAT_BLOCK', name: 'PAT/FG Block' }
                                                ].map(st => (
                                                    <button key={st.id} className={`nav-item ${isActive && view === 'depth' && depthChartType === st.id ? 'active' : ''}`}
                                                        onClick={() => { setCurrentWeekId(weekId); setView('depth'); setDepthChartType(st.id); }}
                                                        style={{ paddingLeft: '3rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                                                        {st.name}
                                                    </button>
                                                ))}
                                            </CollapsibleCategory>

                                            {/* Scout Sub-items */}
                                            <CollapsibleCategory title="Scout Teams" defaultOpen={false} nested={true} style={{ fontSize: '0.7rem', paddingLeft: '2rem' }}>
                                                <button className={`nav-item ${isActive && view === 'depth' && depthChartType === 'SCOUT_OFFENSE' ? 'active' : ''}`}
                                                    onClick={() => { setCurrentWeekId(weekId); setView('depth'); setDepthChartType('SCOUT_OFFENSE'); }}
                                                    style={{ paddingLeft: '3rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                                                    Scout Offense
                                                </button>
                                                <button className={`nav-item ${isActive && view === 'depth' && depthChartType === 'SCOUT_DEFENSE' ? 'active' : ''}`}
                                                    onClick={() => { setCurrentWeekId(weekId); setView('depth'); setDepthChartType('SCOUT_DEFENSE'); }}
                                                    style={{ paddingLeft: '3rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                                                    Scout Defense
                                                </button>
                                            </CollapsibleCategory>
                                        </CollapsibleCategory>
                                        <button className={`nav-item ${isActive && view === 'game-plan' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('game-plan'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Clipboard" size={12} /> Game Plans
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'wristband' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('wristband'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Watch" size={12} /> Wristband Wizard
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'practice-scripts' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('practice-scripts'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="FileText" size={12} /> Practice Scripts
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'smart-call-sheet' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('smart-call-sheet'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Smartphone" size={12} /> Smart Call Sheet
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'dumb-call-sheet' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('dumb-call-sheet'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="FileText" size={12} /> Dumb Call Sheet
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'pregame' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('pregame'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Clock" size={12} /> Pre-Game Timeline
                                        </button>
                                        <button className={`nav-item ${isActive && view === 'grading' ? 'active' : ''}`}
                                            onClick={() => { setCurrentWeekId(weekId); setView('grading'); }}
                                            style={{ paddingLeft: '1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
                                            <Icon name="Award" size={12} /> Game Gradeouts
                                        </button>
                                    </div>
                                );
                            };

                            const checkWristbandConflict = (slot) => {
                                const numSlot = parseInt(slot, 10);
                                if (isNaN(numSlot)) return false;

                                let collision = false;
                                Object.keys(wbSettings || {}).forEach(cardId => {
                                    if (collision) return;
                                    const card = wbSettings[cardId];
                                    if (card.type === 'mini-scripts') {
                                        const startMap = { card1: 101, card2: 201, card3: 301, card4: 401, card5: 501, card6: 601 };
                                        let current = startMap[cardId] || 101;
                                        (card.rows || []).forEach(row => {
                                            if (row.type !== 'header') {
                                                if (current === numSlot) collision = true;
                                                current++;
                                            }
                                        });
                                    }
                                });
                                return collision;
                            };

                            const handlePatchPlay = (arg1, arg2) => {
                                if (Array.isArray(arg1)) {
                                    // Bulk Update (Array of objects)
                                    const updatesMap = new Map();
                                    arg1.forEach(p => {
                                        if (p && p.id) updatesMap.set(p.id, p);
                                    });
                                    setPlays(prev => prev.map(p => updatesMap.has(p.id) ? { ...p, ...updatesMap.get(p.id) } : p));
                                } else if (typeof arg1 === 'object' && arg1 !== null && arg1.id) {
                                    // Single Object (Update or Create)
                                    const updatedPlay = arg1;
                                    if (updatedPlay.wristbandSlot && checkWristbandConflict(updatedPlay.wristbandSlot)) {
                                        alert(`Wristband slot ${updatedPlay.wristbandSlot} is already assigned to a Mini-Script position. Please choose another number.`);
                                        return;
                                    }
                                    setPlays(prev => {
                                        const exists = prev.some(p => p.id === updatedPlay.id);
                                        if (exists) {
                                            return prev.map(p => p.id === updatedPlay.id ? { ...p, ...updatedPlay } : p);
                                        } else {
                                            // Verify it's not a zombie play (has name)
                                            if (!updatedPlay.name) return prev;
                                            return [...prev, updatedPlay];
                                        }
                                    });
                                } else {
                                    // Standard (id, updates)
                                    if (arg2 && arg2.wristbandSlot && checkWristbandConflict(arg2.wristbandSlot)) {
                                        alert(`Wristband slot ${arg2.wristbandSlot} is already assigned to a Mini-Script position. Please choose another number.`);
                                        return;
                                    }
                                    setPlays(prev => prev.map(p => p.id === arg1 ? { ...p, ...arg2 } : p));
                                }
                            };

                            // RBAC State
                            // Refactored to be User-Centric
                            // We default to the first user (Matt Finn) or finding 's1'
                            const [currentUserId, setCurrentUserId] = useState('s1');
                            const [permissions, setPermissions] = useLocalStorage('oc-dashboard-permissions', DEFAULT_PERMISSIONS);



                            // --- SITE ADMIN LOGIC ---
                            // Hardcoded Safety Fallback
                            const SUPER_ADMIN_EMAIL = 'matthewfinn14@gmail.com';

                            const [siteAdmins, setSiteAdmins] = useState([]);
                            const [isSiteAdmin, setIsSiteAdmin] = useState(false);

                            // Fetch Site Admins from Firestore
                            useEffect(() => {
                                let unsubscribe = () => { };
                                if (window.db && authUser) {
                                    try {
                                        unsubscribe = window.db.collection('config').doc('access')
                                            .onSnapshot((doc) => {
                                                if (doc.exists) {
                                                    const data = doc.data();
                                                    const admins = data.siteAdmins || [];
                                                    setSiteAdmins(admins);

                                                    // Determine if current user is Site Admin
                                                    const email = authUser.email.toLowerCase();
                                                    const isSuper = email === SUPER_ADMIN_EMAIL.toLowerCase();
                                                    const isListed = admins.includes(email);
                                                    setIsSiteAdmin(isSuper || isListed);
                                                } else {
                                                    // Fallback if doc doesn't exist yet
                                                    setIsSiteAdmin(authUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
                                                }
                                            }, (error) => {
                                                console.error("Error fetching admin config:", error);
                                            });
                                    } catch (err) {
                                        console.error("Setup admin listener failed:", err);
                                    }
                                }
                                return () => unsubscribe();
                            }, [authUser]);

                            // Ensure permissions structure integrity on load (if new roles added later)
                            useEffect(() => {
                                const newPerms = { ...permissions };
                                let changed = false;
                                ROLES.forEach(role => {
                                    if (!newPerms[role]) {
                                        newPerms[role] = DEFAULT_PERMISSIONS[role];
                                        changed = true;
                                    }
                                });
                                if (changed) setPermissions(newPerms);
                            }, []);

                            // helper to get current staff member
                            // We need to access 'staff' state, but it is defined below. 
                            // So we will move the staff state definition UP above RBAC or access it inside derived logic.
                            // Let's defer currentPermissions calculation until after staff is defined.

                            // --- Weeks & Season Management ---

                            const [weeks, setWeeks] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-weeks');
                                let existingWeeks = [];
                                if (saved) {
                                    try {
                                        const parsed = JSON.parse(saved);
                                        existingWeeks = Array.isArray(parsed) ? parsed : [parsed];
                                    } catch (e) {
                                        console.error("Error parsing saved weeks", e);
                                    }
                                }

                                // Helper to create default plans
                                const createDefaultPracticePlans = () => {
                                    const defaults = {};
                                    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
                                        defaults[day] = {
                                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + day,
                                            date: new Date().toISOString().split('T')[0],
                                            startTime: '15:40',
                                            segments: []
                                        };
                                    });
                                    return defaults;
                                };

                                // --- SCOPING MIGRATION HELPERS ---
                                // 1. Wristband Defaults
                                const getGlobalWbSettings = () => {
                                    const defaultSettings = {
                                        card1: { type: 'standard', opp: '', iter: '1', rows: [] },
                                        card2: { type: 'standard', opp: '', iter: '1', rows: [] },
                                        card3: { type: 'rooski-skill', opp: '', iter: '1', rows: [] },
                                        staples: { type: 'staples', opp: '', iter: '1', rows: [] }
                                    };
                                    try {
                                        const saved = localStorage.getItem('hc_wb_settings_v3');
                                        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
                                    } catch (e) { return defaultSettings; }
                                };

                                // 2. Depth Chart Defaults
                                const getGlobalDepthCharts = () => {
                                    try {
                                        const saved = localStorage.getItem('hc-depth-charts');
                                        return saved ? JSON.parse(saved) : {};
                                    } catch (e) { return {}; }
                                };

                                // 3. Zone Philosophies Defaults
                                const getGlobalZonePhilosophies = () => {
                                    const defaultPhilosophies = {
                                        backed_up: '',
                                        coming_out: '',
                                        open_field: '',
                                        fringe: 'Take one shot, be ready to convert on 4th',
                                        high_red: '',
                                        low_red: '',
                                        goal_line: ''
                                    };
                                    try {
                                        const saved = localStorage.getItem('oc-dashboard-zone-philosophies');
                                        return saved ? { ...defaultPhilosophies, ...JSON.parse(saved) } : defaultPhilosophies;
                                    } catch (e) { return defaultPhilosophies; }
                                };

                                const currentGlobalWb = getGlobalWbSettings();
                                const currentGlobalDepth = getGlobalDepthCharts();
                                const currentGlobalZone = getGlobalZonePhilosophies();
                                // ---------------------------------

                                // Migrate/Populate from OPS_CALENDAR
                                const mergedWeeks = OPS_CALENDAR.map((phase, index) => {
                                    const existing = existingWeeks.find(w => w.name === phase || w.id === phase);

                                    // Scoping Migration: Ensure existing weeks have the new scoped properties
                                    if (existing) {
                                        return {
                                            ...existing,
                                            wristbands: existing.wristbands || JSON.parse(JSON.stringify(currentGlobalWb)),
                                            depthChart: existing.depthChart || JSON.parse(JSON.stringify(currentGlobalDepth)),
                                            zonePhilosophies: existing.zonePhilosophies || JSON.parse(JSON.stringify(currentGlobalZone))
                                        };
                                    }

                                    if (phase === "Week 1") {
                                        const legacyWeek = existingWeeks.find(w => w.id === 'week-1');
                                        if (legacyWeek) return {
                                            ...legacyWeek,
                                            name: phase,
                                            wristbands: legacyWeek.wristbands || JSON.parse(JSON.stringify(currentGlobalWb)),
                                            depthChart: legacyWeek.depthChart || JSON.parse(JSON.stringify(currentGlobalDepth)),
                                            zonePhilosophies: legacyWeek.zonePhilosophies || JSON.parse(JSON.stringify(currentGlobalZone))
                                        };
                                    }

                                    return {
                                        id: `phase-${index}`,
                                        name: phase,
                                        opponent: '',
                                        scoutingReport: '',
                                        isLocked: false,
                                        practicePlans: createDefaultPracticePlans(),
                                        offensiveGamePlan: { sets: [] },
                                        dumbCallSheetData: {},
                                        pregamePlan: { kickoffTime: '19:00', segments: [] },
                                        gameLog: [],
                                        // Scoped Data Initialization
                                        wristbands: JSON.parse(JSON.stringify(currentGlobalWb)),
                                        depthChart: JSON.parse(JSON.stringify(currentGlobalDepth)),
                                        zonePhilosophies: JSON.parse(JSON.stringify(currentGlobalZone))
                                    };
                                });

                                const customWeeks = existingWeeks.filter(w => !OPS_CALENDAR.includes(w.name) && w.id !== 'week-1').map(w => ({
                                    ...w,
                                    // Backfill custom weeks too
                                    wristbands: w.wristbands || JSON.parse(JSON.stringify(currentGlobalWb)),
                                    depthChart: w.depthChart || JSON.parse(JSON.stringify(currentGlobalDepth)),
                                    zonePhilosophies: w.zonePhilosophies || JSON.parse(JSON.stringify(currentGlobalZone))
                                }));

                                return [...mergedWeeks, ...customWeeks];
                            });

                            const [currentWeekId, setCurrentWeekId] = useState(() => {
                                // Determine current month phase
                                const currentMonth = new Date().toLocaleString('default', { month: 'long' });
                                const currentMonthIndex = OPS_CALENDAR.indexOf(currentMonth);
                                const currentMonthPhaseId = currentMonthIndex !== -1 ? `phase-${currentMonthIndex}` : null;

                                // Priority: Saved selection (most recently used) -> Current Month -> Last Week -> Week 1
                                const savedWeeks = localStorage.getItem('oc-dashboard-weeks');
                                // Note: We are deliberating NOT using 'oc-dashboard-weeks' to persist 'last selected', 
                                // but rather if we want to default to "today", we should probably prioritize the current date match on initial load if no specific "last selected week" was saved.
                                // However, the existing code looked at the LAST item in the weeks array.

                                // Let's check for a specific "last viewed week" pref if we had one (we don't currently save one separately).
                                // Or we can just default to the current month if available.

                                if (currentMonthPhaseId) {
                                    return currentMonthPhaseId;
                                }

                                if (savedWeeks) {
                                    const parsed = JSON.parse(savedWeeks);
                                    return parsed[parsed.length - 1].id;
                                }
                                return 'week-1';
                            });

                            // Duty Draft State
                            const [dutyAssignments, setDutyAssignments] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('oc-dashboard-duties');
                                    return (saved && saved !== "null") ? JSON.parse(saved) : {};
                                } catch (e) { return {}; }
                            });

                            // Save duties to localStorage
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-duties', JSON.stringify(dutyAssignments));
                            }, [dutyAssignments]);

                            // Custom Focus Items State
                            // Custom Focus Items State - MIGRATED TO FULL LISTS
                            // We'll keep the storage key to migrate old data if needed, but primarily use practiceFocusItems

                            const [deleteConfirmation, setDeleteConfirmation] = useState(null); // {list: 'segments'|'focus', item: 'name' }


                            const [practiceSegmentTypes, setPracticeSegmentTypes] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-segment-types');
                                if (saved) return JSON.parse(saved);

                                // Default List
                                return ['Competition', 'Take-Off', 'Fundi', '7-on-7', 'Inside Run', 'Team', 'Team Stationary', 'Circuit', 'Specials', 'Conditioning', 'Ghost Script', 'One-on-Ones', 'Goal Line', 'Short Yardage', 'O FUNDI', 'Team O'];
                            });

                            const [practiceSegmentSettings, setPracticeSegmentSettings] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-segment-settings');
                                if (saved) return JSON.parse(saved);
                                return CALENDAR_CONSTANTS.SEGMENT_TYPE_SETTINGS || {};
                            });

                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-segment-settings', JSON.stringify(practiceSegmentSettings));
                            }, [practiceSegmentSettings]);

                            const [practiceFocusItems, setPracticeFocusItems] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-focus-items');

                                // Migrate legacy custom items if found and not yet saved to new list
                                let initialList = ['Base Downs', 'Convert Downs', 'Red Zone', 'Gold Zone', 'Fringe', 'Goalline/Short YDG', 'Play Action', 'Motion', 'Tackling', 'Turnover', 'Pursuit', 'Board drill', 'Joust', 'Kickoff', 'Kick Return', 'Punt', 'Punt Return', 'Field Goal', 'Onside', 'Hands Team'];

                                if (saved) {
                                    return JSON.parse(saved);
                                } else {
                                    // One-time migration
                                    const legacyCustom = localStorage.getItem('oc-dashboard-custom-focus');
                                    if (legacyCustom) {
                                        try {
                                            const parsedLegacy = JSON.parse(legacyCustom);
                                            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
                                                // Add unique deprecated items
                                                parsedLegacy.forEach(item => {
                                                    if (!initialList.includes(item)) initialList.push(item);
                                                });
                                            }
                                        } catch (e) { }
                                    }
                                    return initialList;
                                }
                            });

                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-segment-types', JSON.stringify(practiceSegmentTypes));
                            }, [practiceSegmentTypes]);

                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-focus-items', JSON.stringify(practiceFocusItems));
                            }, [practiceFocusItems]);

                            // Kept for backward compat in signature but unused
                            const addCustomFocusItem = (item) => {
                                if (item && !practiceFocusItems.includes(item)) {
                                    setPracticeFocusItems([...practiceFocusItems, item]);
                                }
                            };


                            // Helper to get current week data
                            const currentWeek = weeks.find(w => w.id === currentWeekId) || weeks[0];

                            // In-Game State
                            const [activePlay, setActivePlay] = useState(null); // The play currently selected by OC
                            const [gameGrades, setGameGrades] = useLocalStorage('oc-dashboard-game-grades', {}); // {[gameId]: {[playLogId]: {[playerId]: {grade: 0-4, notes: '' } } } }
                            const [masterTasks, setMasterTasks] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-master-tasks');
                                if (!saved) return INITIAL_MASTER_TASKS;

                                try {
                                    const loaded = JSON.parse(saved);
                                    // Merge in any new default tasks that are missing from the saved state
                                    const existingIds = new Set(loaded.map(t => t.id));
                                    const newDefaults = INITIAL_MASTER_TASKS.filter(t => !existingIds.has(t.id));
                                    return [...loaded, ...newDefaults];
                                } catch (e) {
                                    console.error("Error parsing master tasks", e);
                                    return INITIAL_MASTER_TASKS;
                                }
                            });
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-master-tasks', JSON.stringify(masterTasks));
                            }, [masterTasks]);

                            // Force merge new defaults if code changes (handle HMR/Hot Reload)
                            useEffect(() => {
                                const existingIds = new Set(masterTasks.map(t => t.id));
                                const newDefaults = INITIAL_MASTER_TASKS.filter(t => !existingIds.has(t.id));

                                if (newDefaults.length > 0) {
                                    console.log("Merging new default tasks...", newDefaults);
                                    setMasterTasks(prev => [...prev, ...newDefaults]);
                                }
                            }, []); // Run once on mount (or re-mount after code update)

                            // Situation State (Derived/Managed via Week)
                            const situation = currentWeek.situation || { down: 1, distance: 10, yardLine: 25, driveNumber: 1, hash: 'M' };

                            const setSituation = (newSituation) => {
                                if (currentWeek.isLocked) return;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, situation: newSituation } : w));
                            };

                            // Derived state setters for compatibility with existing components
                            const setPracticePlans = (newPlans) => {
                                if (currentWeek.isLocked) return;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, practicePlans: newPlans } : w));
                            };

                            const setPregamePlan = (newPlan) => {
                                if (currentWeek.isLocked) return;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, pregamePlan: newPlan } : w));
                            };

                            const setGameLog = (newLog) => {
                                if (currentWeek.isLocked) return;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, gameLog: newLog } : w));
                            };

                            const setGamePlan = (newPlan) => {
                                if (currentWeek.isLocked) return;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, offensiveGamePlan: newPlan } : w));
                            };

                            const handleAddWeek = () => {
                                // Find highest week number
                                let maxWeek = 0;
                                weeks.forEach(w => {
                                    const match = w.name.match(/Week (\d+)$/); // Strict end match to avoid "Week 1 of Summer"
                                    if (match) {
                                        const num = parseInt(match[1]);
                                        if (num > maxWeek) maxWeek = num;
                                    }
                                });

                                const nextNum = maxWeek + 1;
                                const newWeekId = `week-${nextNum}`; // helper ID
                                const prevWeek = weeks[weeks.length - 1]; // Use last week for data cloning

                                // Carryover Logic
                                const newWeek = {
                                    id: `custom-week-${Date.now()}`, // Unique ID to avoid any potential collision
                                    name: `Week ${nextNum}`,
                                    weekNum: nextNum, // Explicitly set weekNum
                                    date: '',
                                    opponent: '',
                                    scoutingReport: '',
                                    isLocked: false,
                                    // Copy practice plans structure
                                    practicePlans: JSON.parse(JSON.stringify(prevWeek.practicePlans)),
                                    pregamePlan: JSON.parse(JSON.stringify(prevWeek.pregamePlan)),
                                    offensiveGamePlan: prevWeek.offensiveGamePlan ? JSON.parse(JSON.stringify(prevWeek.offensiveGamePlan)) : { sets: [] },
                                    dumbCallSheetData: prevWeek.dumbCallSheetData ? JSON.parse(JSON.stringify(prevWeek.dumbCallSheetData)) : {},

                                    // Scoped Data Carryover (Clone)
                                    wristbands: prevWeek.wristbands ? JSON.parse(JSON.stringify(prevWeek.wristbands)) : JSON.parse(JSON.stringify(getGlobalWbSettings())),
                                    depthChart: prevWeek.depthChart ? JSON.parse(JSON.stringify(prevWeek.depthChart)) : JSON.parse(JSON.stringify(getGlobalDepthCharts())),
                                    zonePhilosophies: prevWeek.zonePhilosophies ? JSON.parse(JSON.stringify(prevWeek.zonePhilosophies)) : JSON.parse(JSON.stringify(getGlobalZonePhilosophies())),

                                    gameLog: []
                                };

                                setWeeks([...weeks, newWeek]);
                                setCurrentWeekId(newWeek.id);
                            };

                            const handleDeleteWeek = (weekId) => {
                                if (!window.confirm("Are you sure you want to permanently delete this week?")) return;

                                const newWeeks = weeks.filter(w => w.id !== weekId);
                                setWeeks(newWeeks);

                                if (currentWeekId === weekId) {
                                    const fallback = newWeeks.length > 0 ? newWeeks[0].id : null;
                                    if (fallback) setCurrentWeekId(fallback); // fixed implicit check
                                }
                            };

                            const toggleWeekLock = () => {
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, isLocked: !w.isLocked } : w));
                            };

                            const handleUpdateWeek = (id, field, value) => {
                                if (field === 'bulk_update' && typeof value === 'object') {
                                    setWeeks(weeks.map(w => w.id === id ? { ...w, ...value } : w));
                                } else {
                                    setWeeks(weeks.map(w => w.id === id ? { ...w, [field]: value } : w));
                                }
                            };

                            const handleUpdateGameLog = (newLog) => {
                                if (currentWeek.isLocked) return;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, gameLog: newLog } : w));
                            };

                            const handleUpdateGamePlan = (newPlan) => {
                                handleUpdateWeek(currentWeekId, 'offensiveGamePlan', newPlan);
                            };

                            // --- SCOPED UPDATE HANDLERS ---
                            const handleUpdateWristbands = (newSettings) => {
                                if (currentWeek.isLocked) return;
                                // Support functional updates like standard setState
                                const resolvedSettings = typeof newSettings === 'function'
                                    ? newSettings(currentWeek.wristbands)
                                    : newSettings;

                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, wristbands: resolvedSettings } : w));
                            };

                            const handleUpdateDepthChart = (newChart) => {
                                if (currentWeek.isLocked) return;
                                const resolvedChart = typeof newChart === 'function' ? newChart(currentWeek.depthChart) : newChart;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, depthChart: resolvedChart } : w));
                            };

                            const handleUpdateZonePhilosophies = (newPhilosophies) => {
                                if (currentWeek.isLocked) return;
                                const resolvedPhils = typeof newPhilosophies === 'function' ? newPhilosophies(currentWeek.zonePhilosophies) : newPhilosophies;
                                setWeeks(weeks.map(w => w.id === currentWeekId ? { ...w, zonePhilosophies: resolvedPhils } : w));
                            };
                            // ------------------------------

                            const [globalWeekTemplates, setGlobalWeekTemplates] = useState([]);

                            // Fetch Week Templates from Firestore
                            useEffect(() => {
                                if (window.db && authUser) {
                                    const fetchTemplates = async () => {
                                        try {
                                            const snapshot = await window.db.collection('global_week_templates').get();
                                            const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                            setGlobalWeekTemplates(templates);
                                        } catch (err) {
                                            console.error("Error fetching week templates:", err);
                                        }
                                    };
                                    fetchTemplates();
                                }
                            }, [authUser]);

                            const handleSaveWeekToTemplates = async (name) => {
                                if (!name.trim()) return;
                                const templateData = {
                                    name: name.trim(),
                                    practicePlans: JSON.parse(JSON.stringify(currentWeek.practicePlans)),
                                    offensiveGamePlan: JSON.parse(JSON.stringify(currentWeek.offensiveGamePlan)),
                                    dumbCallSheetData: JSON.parse(JSON.stringify(currentWeek.dumbCallSheetData || {})),
                                    pregamePlan: currentWeek.pregamePlan ? JSON.parse(JSON.stringify(currentWeek.pregamePlan)) : null,

                                    // Add new scoped data to templates
                                    wristbands: currentWeek.wristbands ? JSON.parse(JSON.stringify(currentWeek.wristbands)) : null,
                                    depthChart: currentWeek.depthChart ? JSON.parse(JSON.stringify(currentWeek.depthChart)) : null,
                                    zonePhilosophies: currentWeek.zonePhilosophies ? JSON.parse(JSON.stringify(currentWeek.zonePhilosophies)) : null,

                                    createdAt: new Date().toISOString(),
                                    createdBy: authUser.uid
                                };

                                try {
                                    const docRef = await window.db.collection('global_week_templates').add(templateData);
                                    setGlobalWeekTemplates([...globalWeekTemplates, { id: docRef.id, ...templateData }]);
                                    alert("Week saved as template!");
                                } catch (err) {
                                    console.error("Error saving week template:", err);
                                    alert("Failed to save template.");
                                }
                            };

                            const handleLoadWeekFromTemplate = (templateId) => {
                                if (currentWeek.isLocked) {
                                    alert("Current week is locked. Unlock it to apply a template.");
                                    return;
                                }
                                const template = globalWeekTemplates.find(t => t.id === templateId);
                                if (!template) return;

                                if (confirm(`Apply template "${template.name}" to the current week? This will overwrite your current plans.`)) {
                                    setWeeks(weeks.map(w => w.id === currentWeekId ? {
                                        ...w,
                                        practicePlans: JSON.parse(JSON.stringify(template.practicePlans)),
                                        offensiveGamePlan: JSON.parse(JSON.stringify(template.offensiveGamePlan)),
                                        dumbCallSheetData: JSON.parse(JSON.stringify(template.dumbCallSheetData || {})),
                                        pregamePlan: template.pregamePlan ? JSON.parse(JSON.stringify(template.pregamePlan)) : w.pregamePlan
                                    } : w));
                                }
                            };

                            // Persistence for Weeks
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-weeks', JSON.stringify(weeks));
                            }, [weeks]);

                            // --- End Weeks Management ---

                            const [roster, setRoster] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('oc-dashboard-roster');
                                    let loadedRoster = [];

                                    if (!saved || saved === "null" || saved === "[]") {
                                        loadedRoster = DEFAULT_ROSTER_2025;
                                    } else {
                                        loadedRoster = JSON.parse(saved);
                                    }

                                    // Migration / Initialization
                                    return loadedRoster.map(p => {
                                        let updated = { ...p };

                                        // Ensure Position Split
                                        if (!updated.offPosition || !updated.defPosition) {
                                            const parts = (updated.position || '').split('/');
                                            updated.offPosition = updated.offPosition || parts[0] || 'NA';
                                            updated.defPosition = updated.defPosition || parts[1] || 'NA';
                                        }

                                        // Ensure Profile Structure
                                        if (!updated.profile) {
                                            updated.profile = {
                                                favorites: { nfl: '', nba: '', mlb: '', musicians: '', food: '', movie: '', hobbies: '' },
                                                family: '',
                                                goals: { postHS: '', job: '', colleges: '' }
                                            };
                                        }

                                        // Ensure Metrics Structure
                                        if (!updated.metrics) {
                                            updated.metrics = {
                                                attendanceStreak: 0,
                                                longestStreak: 0,
                                                awards: [],
                                                warriorDialLogs: []
                                            };
                                        } else if (!updated.metrics.warriorDialLogs) {
                                            updated.metrics.warriorDialLogs = [];
                                        }

                                        // DATA NORMALIZATION: Ensure 'number' and 'name' are primary
                                        if (!updated.number && updated.jersey) updated.number = updated.jersey;
                                        if (!updated.name) {
                                            if (updated.firstName && updated.lastName) {
                                                updated.name = `${updated.firstName} ${updated.lastName}`;
                                            } else if (updated.firstName) {
                                                updated.name = updated.firstName;
                                            }
                                        }

                                        // Ensure 'archived' flag exists
                                        if (updated.archived === undefined) updated.archived = false;

                                        return updated;
                                    });

                                } catch (e) { return DEFAULT_ROSTER_2025; }
                            });
                            const [depthChart, setDepthChart] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('oc-dashboard-depthchart');
                                    return (saved && saved !== "null") ? JSON.parse(saved) : {};
                                } catch (e) { return {}; }
                            });
                            const [staff, setStaff] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('oc-dashboard-staff');
                                    if (!saved || saved === "null" || saved === "[]") return DEFAULT_STAFF_2025;

                                    const loaded = JSON.parse(saved);
                                    // Migration: Ensure 'roles' array exists.
                                    // If old 'role' string exists, convert to array.
                                    return loaded.map(s => {
                                        if (s.role && !s.roles) {
                                            // Map legacy string roles to new array. 
                                            // 'Assistant Coach' -> 'Position Coach' mapping if needed, 
                                            // but explicit mapping is safer.
                                            let mappedRole = s.role;
                                            if (s.role === 'Assistant Coach') mappedRole = 'Position Coach';
                                            return { ...s, roles: [mappedRole], role: undefined };
                                        }
                                        if (!s.roles) {
                                            return { ...s, roles: ['Position Coach'] };
                                        }
                                        return s;
                                    });
                                } catch (e) { return DEFAULT_STAFF_2025; }
                            });

                            // Weight Logs State
                            const [weightLogs, setWeightLogs] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('player_weight_logs');
                                    return saved ? JSON.parse(saved) : {};
                                } catch (e) { return {}; }
                            });

                            // Save weight logs to localStorage whenever they change
                            useEffect(() => {
                                localStorage.setItem('player_weight_logs', JSON.stringify(weightLogs));
                            }, [weightLogs]);

                            // Weight log helper functions
                            const getPlayerWeightLogs = (playerId) => {
                                return (weightLogs[playerId] || []).sort((a, b) => new Date(b.date) - new Date(a.date));
                            };

                            const addWeightLog = (playerId, weight) => {
                                const newLog = {
                                    id: Date.now().toString(),
                                    date: new Date().toISOString().split('T')[0],
                                    weight: parseFloat(weight),
                                    timestamp: Date.now()
                                };
                                setWeightLogs(prev => ({
                                    ...prev,
                                    [playerId]: [...(prev[playerId] || []), newLog]
                                }));
                            };

                            const updateWeightLog = (playerId, logId, weight) => {
                                setWeightLogs(prev => ({
                                    ...prev,
                                    [playerId]: (prev[playerId] || []).map(log =>
                                        log.id === logId ? { ...log, weight: parseFloat(weight) } : log
                                    )
                                }));
                            };

                            const deleteWeightLog = (playerId, logId) => {
                                setWeightLogs(prev => ({
                                    ...prev,
                                    [playerId]: (prev[playerId] || []).filter(log => log.id !== logId)
                                }));
                            };

                            // Calculate Permissions based on Current User's Roles
                            const currentUser = staff.find(s => s.id === currentUserId) || staff[0] || DEFAULT_STAFF_2025[0];

                            const currentPermissions = useMemo(() => {
                                const userRoles = currentUser?.roles || [];

                                // SUPER OVERRIDE: Admin Flag or Head Coach Role
                                if (currentUser?.isAdmin || userRoles.includes('Head Coach')) {
                                    // Start with 'Head Coach' permissions (Full Access)
                                    return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS['Head Coach']));
                                }

                                // Default to first role or generic
                                if (userRoles.length === 0) return DEFAULT_PERMISSIONS['Assistant'];

                                // Merge Permissions: If ANY role has 'true', specific permission is true.
                                const merged = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS['Assistant'])); // Start with base restricted

                                userRoles.forEach(role => {
                                    const rolePerms = permissions[role] || DEFAULT_PERMISSIONS[role];
                                    if (!rolePerms) return;

                                    Object.keys(rolePerms).forEach(feature => {
                                        if (!merged[feature]) merged[feature] = { view: false, edit: false };
                                        if (rolePerms[feature].view) merged[feature].view = true;
                                        if (rolePerms[feature].edit) merged[feature].edit = true;
                                    });
                                });
                                return merged;
                            }, [currentUser, permissions]);
                            const [lotteryData, setLotteryData] = useLocalStorage('oc-dashboard-equipment-lottery', { bids: {}, winners: {}, available: null });

                            const [teamLogo, setTeamLogo] = useState(() => {
                                return localStorage.getItem('oc-dashboard-logo') || null; // Default null for new users
                            });
                            const [schoolName, setSchoolName] = useState(() => {
                                return localStorage.getItem('hc_school_name') || '';
                            });

                            // Access Config for Permissions (Paying Admin Check)
                            const [appAccessConfig, setAppAccessConfig] = useState({});
                            useEffect(() => {
                                const fetchAccess = async () => {
                                    try {
                                        if (!window.db) return;
                                        const doc = await window.db.collection('config').doc('access').get();
                                        if (doc.exists) {
                                            setAppAccessConfig(doc.data());
                                        }
                                    } catch (e) { console.error("Error fetching access config", e); }
                                };
                                fetchAccess();
                            }, []); // Run once on mount
                            const [accentColor, setAccentColor] = useState(() => {
                                return localStorage.getItem('oc-dashboard-accent') || '#38bdf8';
                            });
                            const handleUpdateAccentColor = setAccentColor;

                            // UI Theme State
                            const [theme, setTheme] = useState(() => {
                                return localStorage.getItem('oc-dashboard-theme') || 'navy';
                            });

                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-theme', theme);
                                document.body.className = `theme-${theme}`;
                                // Cloud Sync
                                if (currentUser && window.db) {
                                    syncToFirestore(currentUser.uid, 'settings', { theme });
                                }
                            }, [theme, currentUser]);

                            const [positionNames, setPositionNames] = useState(() => {
                                const saved = localStorage.getItem('oc-dashboard-position-names');
                                return saved ? JSON.parse(saved) : {
                                    X: 'X', Z: 'Z', A: 'A', Y: 'Y',
                                    QB: 'QB', RB: 'RB',
                                    LT: 'LT', LG: 'LG', C: 'C', RG: 'RG', RT: 'RT'
                                };
                            });
                            const [depthChartType, setDepthChartType] = useState('OFFENSE');
                            const [selectedLevel, setSelectedLevel] = useState('ALL'); // 'ALL', 'Varsity', 'JV', 'JV2'
                            const [programLevels, setProgramLevels] = useLocalStorage('oc-dashboard-levels', ['Varsity', 'JV', 'JV2']);

                            // Offense Setup State
                            const [customPositions, setCustomPositions] = useLocalStorage('oc-dashboard-custom-positions', { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] });
                            const [hiddenPositions, setHiddenPositions] = useLocalStorage('oc-dashboard-hidden-positions', { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] });
                            const [positionDescriptions, setPositionDescriptions] = useLocalStorage('oc-dashboard-position-descriptions', {});
                            const [playSyntax, setPlaySyntax] = useLocalStorage('oc-dashboard-play-syntax', [
                                { id: 'pres_form', label: 'Formation', type: 'text' },
                                { id: 'pres_conc', label: 'Concept', type: 'text' }
                            ]);
                            const [defensePlaySyntax, setDefensePlaySyntax] = useLocalStorage('oc-dashboard-play-syntax-defense', []);
                            const [stPlaySyntax, setStPlaySyntax] = useLocalStorage('oc-dashboard-play-syntax-st', []);
                            const [termLibrary, setTermLibrary] = useLocalStorage('oc-dashboard-term-library', {});
                            const [defenseTermLibrary, setDefenseTermLibrary] = useLocalStorage('oc-dashboard-term-library-defense', {});
                            const [stTermLibrary, setStTermLibrary] = useLocalStorage('oc-dashboard-term-library-st', {});
                            const [setupTab, setSetupTab] = useState('positions');
                            const [setupCategory, setSetupCategory] = useState(null);

                            // Script Presets (Dynamic Script Templates)
                            const [scriptPresets, setScriptPresets] = useLocalStorage('oc-dashboard-script-presets', [
                                {
                                    id: 'preset_takeoff',
                                    name: 'Take-Off',
                                    useYardLine: true,
                                    items: [
                                        { yardLine: '-30', hash: 'L' },
                                        { yardLine: '-40', hash: 'M' },
                                        { yardLine: '50', hash: 'R' },
                                        { yardLine: '40', hash: 'L' },
                                        { yardLine: '30', hash: 'M' },
                                        { yardLine: '20', hash: 'R' },
                                        { yardLine: '10', hash: 'L' },
                                        { yardLine: '5', hash: 'M' }
                                    ]
                                }
                            ]);

                            // Weekly Task Management State (must be at top level, not conditional)
                            const [weeklyToday, setWeeklyToday] = useLocalStorage(`weekly-tasks-today-${currentWeekId}`, []);
                            const [weeklyThisWeek, setWeeklyThisWeek] = useLocalStorage(`weekly-tasks-thisweek-${currentWeekId}`, []);
                            const [weeklyThisMonth, setWeeklyThisMonth] = useLocalStorage(`weekly-tasks-thismonth-${currentWeekId}`, []);
                            const [weeklySomeday, setWeeklySomeday] = useLocalStorage(`weekly-tasks-someday-${currentWeekId}`, []);
                            const [weeklyTaskInputs, setWeeklyTaskInputs] = useState({ today: '', thisWeek: '', thisMonth: '', someday: '' });
                            const [weeklyDraggedTask, setWeeklyDraggedTask] = useState(null);




                            // Layout Persistence

                            const [gamePlanLayouts, setGamePlanLayouts] = useLocalStorage('gamePlanLayouts', GAME_PLAN_LAYOUTS);
                            const [layoutVersions, setLayoutVersions] = useLocalStorage('gamePlanLayoutVersions', {});

                            const saveLayoutVersion = (name) => {
                                if (!name) return;
                                const newVersions = { ...layoutVersions, [name]: gamePlanLayouts };
                                setLayoutVersions(newVersions);
                                alert(`Layout version "${name}" saved!`);
                            };

                            const deleteLayoutVersion = (name) => {
                                const newVersions = { ...layoutVersions };
                                delete newVersions[name];
                                setLayoutVersions(newVersions);
                            };

                            const loadLayoutVersion = (name) => {
                                const version = layoutVersions[name];
                                if (!version) return;
                                setGamePlanLayouts(version);
                            };

                            // Force update layout cols if they don't match constant (Migration for 4-col change)
                            useEffect(() => {
                                if (gamePlanLayouts?.CALL_SHEET) {
                                    let changed = false;
                                    const sections = gamePlanLayouts.CALL_SHEET.sections;
                                    // Check Scripts (index 0)
                                    if (sections[0] && sections[0].cols !== 4) {
                                        const newSections = [...sections];
                                        newSections[0] = { ...newSections[0], cols: 4 };
                                        // Also check D&D (index 1) which should be 4
                                        if (newSections[1] && newSections[1].cols !== 4) {
                                            newSections[1] = { ...newSections[1], cols: 4 };
                                        }
                                        setGamePlanLayouts({ ...gamePlanLayouts, CALL_SHEET: { ...gamePlanLayouts.CALL_SHEET, sections: newSections } });
                                        changed = true;
                                    }
                                    else if (sections[1] && sections[1].cols !== 4) {
                                        // Just D&D needs update
                                        const newSections = [...sections];
                                        newSections[1] = { ...newSections[1], cols: 4 };
                                        setGamePlanLayouts({ ...gamePlanLayouts, CALL_SHEET: { ...gamePlanLayouts.CALL_SHEET, sections: newSections } });
                                        changed = true;
                                    }
                                }
                            }, []);
                            const [formationLayouts, setFormationLayouts] = useLocalStorage('formationLayouts', {});

                            const updateFormationLayout = (chartType, posId, x, y) => {
                                setFormationLayouts(prev => ({
                                    ...prev,
                                    [chartType]: {
                                        ...(prev[chartType] || {}),
                                        [posId]: { x, y }
                                    }
                                }));
                            };

                            const resetFormationLayout = (chartType) => {
                                setFormationLayouts(prev => {
                                    const next = { ...prev };
                                    delete next[chartType];
                                    return next;
                                });
                            };

                            const [ratings, setRatings] = useLocalStorage('oc-dashboard-ratings', {});

                            const [summerCompData, setSummerCompData] = useLocalStorage('oc-dashboard-summer-comp', null);
                            // Equipment State
                            const [inventory, setInventory] = useLocalStorage('oc-dashboard-equipment-inventory', []);
                            const [checkouts, setCheckouts] = useLocalStorage('oc-dashboard-equipment-checkouts', []);
                            const [issuance, setIssuance] = useLocalStorage('oc-dashboard-equipment-issuance', {}); // {[playerId]: {helmet: {style: '', size: '', num: '' }, ... } }
                            const [attendance, setAttendance] = useLocalStorage('oc-dashboard-attendance', []);
                            const [wishlist, setWishlist] = useLocalStorage('oc-dashboard-equipment-wishlist', []);
                            const [equipmentDueDate, setEquipmentDueDate] = useLocalStorage('hc-equipment-due-date', '');

                            // Budget Data State
                            const [budgetData, setBudgetData] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('program_budget_data');
                                    return saved ? JSON.parse(saved) : {
                                        accountBalance: 50000,
                                        expenditures: [],
                                        boosterCommitments: [],
                                        fundraisers: [],
                                        budgetWishlist: []
                                    };
                                } catch (e) {
                                    return {
                                        accountBalance: 50000,
                                        expenditures: [],
                                        boosterCommitments: [],
                                        fundraisers: [],
                                        budgetWishlist: []
                                    };
                                }
                            });

                            // Save budget data to localStorage
                            useEffect(() => {
                                localStorage.setItem('program_budget_data', JSON.stringify(budgetData));
                            }, [budgetData]);

                            // Onboarding Data State - now stores only completion status, keyed by person ID
                            const [onboardingData, setOnboardingData] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('program_onboarding_data');
                                    return saved ? JSON.parse(saved) : {};
                                } catch (e) {
                                    return {};
                                }
                            });

                            // Save onboarding data to localStorage
                            useEffect(() => {
                                localStorage.setItem('program_onboarding_data', JSON.stringify(onboardingData));
                            }, [onboardingData]);

                            // Budget view state (must be at top level for React hooks)
                            const [budgetActiveSection, setBudgetActiveSection] = useState('overview');
                            const [budgetNewItem, setBudgetNewItem] = useState({});

                            // Onboarding view state (must be at top level for React hooks)
                            const [onboardingRoleFilter, setOnboardingRoleFilter] = useState('All');
                            const [onboardingSelectedPerson, setOnboardingSelectedPerson] = useState(null);

                            // Budget calculations (at top level)
                            const totalExpenditures = budgetData.expenditures.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
                            const totalCommitments = budgetData.boosterCommitments.reduce((sum, com) => sum + (parseFloat(com.amount) || 0), 0);
                            const receivedCommitments = budgetData.boosterCommitments.filter(c => c.status === 'Received').reduce((sum, com) => sum + (parseFloat(com.amount) || 0), 0);
                            const totalProjectedFundraiser = budgetData.fundraisers.reduce((sum, fr) => sum + (parseFloat(fr.projectedRevenue) || 0), 0);
                            const totalActualFundraiser = budgetData.fundraisers.reduce((sum, fr) => sum + (parseFloat(fr.actualRevenue) || 0), 0);
                            const totalWishlist = budgetData.budgetWishlist.reduce((sum, item) => sum + (parseFloat(item.estimatedCost) || 0), 0);
                            const projectedBalance = budgetData.accountBalance - totalExpenditures + totalCommitments + totalProjectedFundraiser;

                            const getPriorityColor = (priority) => {
                                switch (priority) {
                                    case 'High': return '#ef4444';
                                    case 'Medium': return '#f59e0b';
                                    case 'Low': return '#10b981';
                                    default: return '#6b7280';
                                }
                            };

                            const getStatusColor = (status) => {
                                const colors = {
                                    'Planned': '#3b82f6', 'Approved': '#8b5cf6', 'Purchased': '#10b981',
                                    'Pledged': '#f59e0b', 'Received': '#10b981',
                                    'Planning': '#6b7280', 'Active': '#3b82f6', 'Completed': '#10b981',
                                    'Wishlist': '#6b7280', 'Funded': '#8b5cf6'
                                };
                                return colors[status] || '#6b7280';
                            };

                            // Onboarding helper functions (at top level)
                            const getRequiredItems = (role) => {
                                const commonItems = ['hudlLogin', 'sportsYouLogin', 'boundRegistration'];
                                if (role === 'Player') {
                                    return [...commonItems, 'campRegistration', 'playerAppCompleted', 'programExpectations', 'travelMealOrder'];
                                } else if (role === 'Coach') {
                                    return [...commonItems, 'coachingExpectations'];
                                } else if (role === 'Manager') {
                                    return [...commonItems, 'programExpectations'];
                                }
                                return commonItems;
                            };

                            const getItemLabel = (itemKey) => {
                                const labels = {
                                    hudlLogin: 'Hudl Login',
                                    sportsYouLogin: 'SportsYou Login',
                                    boundRegistration: 'Bound Registration',
                                    campRegistration: 'Camp Registration',
                                    playerAppCompleted: 'Player App Downloaded and Completed',
                                    programExpectations: 'Program Expectations',
                                    travelMealOrder: 'Travel Meal Order Completed',
                                    coachingExpectations: 'Coaching Expectations'
                                };
                                return labels[itemKey] || itemKey;
                            };

                            // Build combined list of all people from roster and staff
                            const allPeople = [
                                ...roster.map(player => ({ id: `player_${player.id}`, name: player.name, role: 'Player' })),
                                ...staff.map(staffMember => ({
                                    id: `staff_${staffMember.id}`,
                                    name: staffMember.name,
                                    role: staffMember.role === 'Manager' ? 'Manager' : 'Coach'
                                }))
                            ];

                            const getPersonOnboardingData = (personId, role) => {
                                if (!onboardingData[personId]) {
                                    // Initialize with all items uncompleted
                                    const requiredItems = getRequiredItems(role);
                                    const items = {};
                                    requiredItems.forEach(item => {
                                        items[item] = { completed: false, dateCompleted: null, notes: '' };
                                    });
                                    return items;
                                }
                                return onboardingData[personId];
                            };

                            const getCompletionStats = (person) => {
                                const requiredItems = getRequiredItems(person.role);
                                const personData = getPersonOnboardingData(person.id, person.role);
                                const completed = requiredItems.filter(item => personData[item]?.completed).length;
                                const total = requiredItems.length;
                                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                                return { completed, total, percentage };
                            };

                            // Filter people by role
                            const filteredPeople = onboardingRoleFilter === 'All'
                                ? allPeople
                                : allPeople.filter(p => p.role === onboardingRoleFilter);

                            // Overall statistics
                            const totalPeople = allPeople.length;
                            const fullyCompleted = allPeople.filter(p => getCompletionStats(p).percentage === 100).length;
                            const inProgress = allPeople.filter(p => {
                                const pct = getCompletionStats(p).percentage;
                                return pct > 0 && pct < 100;
                            }).length;
                            const notStarted = allPeople.filter(p => getCompletionStats(p).percentage === 0).length;

                            const updatePersonItem = (personId, role, itemKey, field, value) => {
                                const personData = getPersonOnboardingData(personId, role);
                                const updatedPersonData = {
                                    ...personData,
                                    [itemKey]: {
                                        ...personData[itemKey],
                                        [field]: value,
                                        ...(field === 'completed' && value ? { dateCompleted: new Date().toISOString().split('T')[0] } : {})
                                    }
                                };
                                setOnboardingData({ ...onboardingData, [personId]: updatedPersonData });
                            };

                            const [metrics, setMetrics] = useState(() => {
                                try {
                                    const saved = localStorage.getItem('oc-dashboard-metrics');
                                    return (saved && saved !== "null") ? JSON.parse(saved) : {};
                                } catch (e) { return {}; }
                            });

                            // Scouting State
                            const [opponentScoutData, setOpponentScoutData] = useLocalStorage('oc-dashboard-scouting', {
                                offense: [],
                                defense: [],
                                specialTeams: []
                            });

                            // Annual Calendar State
                            const [calendarData, setCalendarData] = useLocalStorage('oc-dashboard-annual-calendar', CALENDAR_CONSTANTS.ANNUAL_CALENDAR_DEFAULTS);



                            // Save plays to localStorage whenever it changes
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-plays', JSON.stringify(plays));
                            }, [plays]);

                            // Save roster to localStorage whenever it changes
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-roster', JSON.stringify(roster));
                                // Cloud Sync
                                if (currentUser && window.db) {
                                    syncToFirestore(currentUser.uid, 'roster', roster);
                                }
                            }, [roster, currentUser]);

                            // Save depth chart to localStorage whenever it changes
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-depthchart', JSON.stringify(depthChart));
                                // Cloud Sync
                                if (currentUser && window.db) {
                                    syncToFirestore(currentUser.uid, 'depthChart', depthChart);
                                }
                            }, [depthChart, currentUser]);

                            // Save staff to localStorage whenever it changes
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-staff', JSON.stringify(staff));
                                // Cloud Sync
                                if (currentUser && window.db) {
                                    syncToFirestore(currentUser.uid, 'staff', staff);
                                }
                            }, [staff, currentUser]);

                            // Save team logo to localStorage whenever it changes
                            useEffect(() => {
                                if (teamLogo) {
                                    localStorage.setItem('oc-dashboard-logo', teamLogo);
                                } else {
                                    localStorage.removeItem('oc-dashboard-logo');
                                }
                                // Cloud Sync
                                if (currentUser && window.db) {
                                    syncToFirestore(currentUser.uid, 'settings', { teamLogo });
                                }
                            }, [teamLogo, currentUser]);

                            // Apply and Save Accent Color
                            useEffect(() => {
                                if (accentColor) {
                                    document.documentElement.style.setProperty('--accent', accentColor);
                                    localStorage.setItem('oc-dashboard-accent', accentColor);

                                    // Persist to School Data (Cloud) if possible
                                    const currentSchoolId = localStorage.getItem('hc_school_id');
                                    if (currentSchoolId && window.db) {
                                        try {
                                            const schoolRef = window.db.collection('schools').doc(currentSchoolId);
                                            // Only update if specifically changed (debounce could be added but this is simple)
                                            schoolRef.set({
                                                settings: { accentColor: accentColor }
                                            }, { merge: true }).catch(err => console.error("Error saving color to cloud:", err));
                                        } catch (e) {
                                            console.warn("Could not save color to cloud:", e);
                                        }
                                    }
                                }
                            }, [accentColor]);

                            // Save position names to localStorage
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-position-names', JSON.stringify(positionNames));
                                // Cloud Sync
                                if (currentUser && window.db) {
                                    syncToFirestore(currentUser.uid, 'settings', { positionNames });
                                }
                            }, [positionNames, currentUser]);

                            // Save ratings to localStorage whenever they change
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-ratings', JSON.stringify(ratings));
                            }, [ratings]);

                            // Save metrics to localStorage whenever they change
                            useEffect(() => {
                                localStorage.setItem('oc-dashboard-metrics', JSON.stringify(metrics));
                            }, [metrics]);

                            const toggleTag = (tag) => {
                                // ... (logic handled in PlayInput)
                            };

                            const handleSavePlay = (playData) => {
                                const { assignedScriptIds, ...savedPlayData } = playData;

                                // Sync Mini Script Assignments
                                if (assignedScriptIds !== undefined) {
                                    const currentGamePlan = currentWeek.offensiveGamePlan || { sets: [], miniScripts: [] };
                                    const newMiniScripts = (currentGamePlan.miniScripts || []).map(script => {
                                        const isAssigned = assignedScriptIds.includes(script.id);
                                        const hasPlay = script.playIds.includes(savedPlayData.id);

                                        if (isAssigned && !hasPlay) {
                                            return { ...script, playIds: [...script.playIds, savedPlayData.id] };
                                        } else if (!isAssigned && hasPlay) {
                                            return { ...script, playIds: script.playIds.filter(id => id !== savedPlayData.id) };
                                        }
                                        return script;
                                    });

                                    // Only update gamePlan if changes occured
                                    if (JSON.stringify(newMiniScripts) !== JSON.stringify(currentGamePlan.miniScripts)) {
                                        setGamePlan({ ...currentGamePlan, miniScripts: newMiniScripts });
                                    }
                                }

                                if (editingPlay) {
                                    setPlays(plays.map(p => p.id === savedPlayData.id ? savedPlayData : p));
                                    setEditingPlay(null);
                                } else {
                                    setPlays([savedPlayData, ...plays]);
                                }
                                setView('playbook');
                            };

                            // ...

                            // RENDER LOGIC UPDATE
                            {
                                view === 'new-play' && (
                                    <PlayInput
                                        onSave={handleSavePlay}
                                        onCancel={() => { setEditingPlay(null); setView('playbook'); }}
                                        onDelete={handleDeletePlay}
                                        initialData={editingPlay}
                                        availableMiniScripts={currentWeek.offensiveGamePlan?.miniScripts || []}
                                        initialAssignedScriptIds={editingPlay ? (currentWeek.offensiveGamePlan?.miniScripts || []).filter(s => s.playIds.includes(editingPlay.id)).map(s => s.id) : []}
                                        formations={formations}
                                        rooskiLibrary={rooskiLibrary}
                                        setRooskiLibrary={setRooskiLibrary}
                                        positionNames={positionNames}
                                    />
                                )
                            }

                            const handleEditPlay = (play) => {
                                setEditingPlay(play);
                                setView('new-play');
                            };

                            const handleUpdatePlay = (updatedPlay) => {
                                if (Array.isArray(updatedPlay)) {
                                    // Batch update
                                    const updateMap = new Map(updatedPlay.map(p => [p.id, p]));
                                    setPlays(prev => prev.map(p => updateMap.has(p.id) ? updateMap.get(p.id) : p));
                                } else {
                                    // Single update
                                    setPlays(prev => prev.map(p => p.id === updatedPlay.id ? updatedPlay : p));
                                }
                            };

                            const handleDeletePlay = (playId) => {
                                setPlays(plays.filter(p => p.id !== playId));
                                setEditingPlay(null);
                                setView('playbook');
                            };

                            // Filter Logic for Playbook View
                            const [playbookFilters, setPlaybookFilters] = useState({
                                formation: '',
                                concept: '',
                                tag: '',
                                situation: ''
                            });

                            // Batch Delete State
                            const [selectedPlays, setSelectedPlays] = useState([]);
                            const [lastSelectedPlayId, setLastSelectedPlayId] = useState(null);

                            // Batch Import State
                            const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
                            const [importData, setImportData] = useState('');
                            const [parsedImport, setParsedImport] = useState([]);
                            const [columnMapping, setColumnMapping] = useState({});

                            const handleProgressSeason = () => {
                                const gradeProgression = {
                                    'Freshman': 'Sophomore',
                                    'Sophomore': 'Junior',
                                    'Junior': 'Senior',
                                    'Senior': 'Graduated'
                                };

                                const updatedRoster = roster
                                    .map(player => ({
                                        ...player,
                                        year: gradeProgression[player.year] || player.year
                                    }))
                                    .filter(player => player.year !== 'Graduated'); // Remove graduated seniors

                                const graduatedCount = roster.filter(p => p.year === 'Senior').length;

                                setRoster(updatedRoster);
                                alert(`✅ Season Advanced!\n\n${updatedRoster.length} players progressed to next grade.\n${graduatedCount} seniors graduated and removed from roster.`);
                            };

                            const handleRegressSeason = () => {
                                const gradeRegression = {
                                    'Senior': 'Junior',
                                    'Junior': 'Sophomore',
                                    'Sophomore': 'Freshman',
                                    'Freshman': 'Freshman' // Can't go lower
                                };

                                const updatedRoster = roster.map(player => ({
                                    ...player,
                                    year: gradeRegression[player.year] || player.year
                                }));

                                setRoster(updatedRoster);
                                alert(`✅ Season Regressed!\n\n${updatedRoster.length} players moved back one grade.\n\nNote: Graduated seniors were NOT restored.`);
                            };

                            const togglePlaySelection = (playId, isShift) => {
                                const currentFiltered = getFilteredPlaybook();
                                setLastSelectedPlayId(playId);

                                if (isShift && lastSelectedPlayId) {
                                    const currentIndex = currentFiltered.findIndex(p => p.id === playId);
                                    const lastIndex = currentFiltered.findIndex(p => p.id === lastSelectedPlayId);

                                    if (currentIndex !== -1 && lastIndex !== -1) {
                                        const start = Math.min(currentIndex, lastIndex);
                                        const end = Math.max(currentIndex, lastIndex);
                                        const idsInRange = currentFiltered.slice(start, end + 1).map(p => p.id);

                                        setSelectedPlays(prev => {
                                            const newSet = new Set([...prev, ...idsInRange]);
                                            return Array.from(newSet);
                                        });
                                        return;
                                    }
                                }

                                setSelectedPlays(prev =>
                                    prev.includes(playId)
                                        ? prev.filter(id => id !== playId)
                                        : [...prev, playId]
                                );
                            };

                            const handleDeleteSelected = (e) => {
                                // Prevent event bubbling and default action to avoid conflicts with other handlers
                                if (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }

                                // Small timeout to allow the UI to stabilize/event loop to clear before showing the blocking alert
                                setTimeout(() => {
                                    if (window.confirm(`Are you sure you want to delete ${selectedPlays.length} plays? This cannot be undone.`)) {
                                        setPlays(prevPlays => prevPlays.filter(p => !selectedPlays.includes(p.id)));
                                        setSelectedPlays([]);
                                    }
                                }, 50);
                            };

                            // Batch Import Handlers
                            const handleParseImport = () => {
                                if (!importData.trim()) return;
                                const rows = importData.split('\n').filter(r => r.trim());
                                if (rows.length === 0) return;

                                const firstRow = rows[0];
                                const delimiter = firstRow.includes('\t') ? '\t' : (firstRow.includes(',') ? ',' : ' ');

                                const parsed = rows.map(row => {
                                    return row.split(delimiter).map(cell => cell.trim());
                                });

                                setParsedImport(parsed);
                                setColumnMapping({});
                            };

                            const handleBatchCreate = (addToInstall = false) => {
                                const newPlays = parsedImport.map(row => {
                                    let playNameParts = [];
                                    let formation = '';
                                    let type = '';

                                    Object.entries(columnMapping).forEach(([colIdx, fieldId]) => {
                                        const value = row[parseInt(colIdx)];
                                        if (!value) return;

                                        if (fieldId === 'name_override') {
                                            playNameParts = [value];
                                        } else if (fieldId === 'formation') {
                                            formation = value;
                                        } else if (fieldId === 'type') {
                                            type = value;
                                        } else {
                                            const field = playSyntax.find(f => f.id === fieldId);
                                            if (field) {
                                                playNameParts.push(value);
                                            }
                                        }
                                    });

                                    const finalName = playNameParts.join(' ').trim() || row[0];
                                    return { name: finalName, formation, type: type || 'Run' };
                                });

                                newPlays.forEach(playData => {
                                    const newPlay = handleQuickAddPlay(playData.name);
                                    if (newPlay && playData.formation) {
                                        handleUpdatePlay(newPlay.id, { formation: playData.formation, type: playData.type });
                                    }
                                    if (addToInstall && newPlay && currentWeek) {
                                        const installList = currentWeek.installList || [];
                                        if (!installList.includes(newPlay.id)) {
                                            handleUpdateWeek(currentWeek.id, 'installList', [...installList, newPlay.id]);
                                        }
                                    }
                                });

                                setIsBatchImportOpen(false);
                                setParsedImport([]);
                                setImportData('');
                                setColumnMapping({});
                            };

                            const getFilteredPlaybook = () => {
                                if (!Array.isArray(plays)) {
                                    console.error('plays is not an array:', plays);
                                    return [];
                                }
                                return plays.filter(play => {
                                    const matchFormation = !playbookFilters.formation || play.formation === playbookFilters.formation;
                                    const matchConcept = !playbookFilters.concept || (play.concept && play.concept === playbookFilters.concept);
                                    const matchTag = !playbookFilters.tag || play.tags.includes(playbookFilters.tag) || play.tag1 === playbookFilters.tag || play.tag2 === playbookFilters.tag;

                                    // Situation filter checks against specific categories
                                    const matchSituation = !playbookFilters.situation || play.tags.includes(playbookFilters.situation) ||
                                        (TAG_CATEGORIES["Situation"] && TAG_CATEGORIES["Situation"].includes(playbookFilters.situation) && play.tags.includes(playbookFilters.situation)) ||
                                        (TAG_CATEGORIES["Field Position"] && TAG_CATEGORIES["Field Position"].includes(playbookFilters.situation) && play.tags.includes(playbookFilters.situation)) ||
                                        (TAG_CATEGORIES["Down & Distance"] && TAG_CATEGORIES["Down & Distance"].includes(playbookFilters.situation) && play.tags.includes(playbookFilters.situation));

                                    return matchFormation && matchConcept && matchTag && matchSituation;
                                });
                            };

                            const filteredPlaybook = getFilteredPlaybook();

                            // Extract unique values for Playbook filters
                            const uniqueFormations = [...new Set(plays.map(p => p.formation).filter(Boolean))].sort();
                            const uniqueConcepts = [...new Set(plays.map(p => p.concept).filter(Boolean))].sort();
                            const allTags = [...new Set(plays.flatMap(p => [p.tag1, p.tag2, ...(p.tags || [])]))].filter(Boolean).sort();
                            const situationTags = [...(TAG_CATEGORIES["Field Position"] || []), ...(TAG_CATEGORIES["Down & Distance"] || [])];


                            // Sync status state


                            const renderDataSyncManager = () => {
                                const getLocal = (key, defaultVal = null) => {
                                    const saved = localStorage.getItem(key);
                                    return saved ? JSON.parse(saved) : defaultVal;
                                };

                                const dataTypes = [
                                    { id: 'roster', label: 'Roster', data: getLocal('oc-dashboard-roster', []) },
                                    { id: 'plays', label: 'Playbook', data: getLocal('oc-dashboard-plays', []) },
                                    { id: 'staff', label: 'Staff', data: getLocal('oc-dashboard-staff', []) },
                                    { id: 'weeks', label: 'Game Plans & Scripts', data: getLocal('oc-dashboard-weeks', []) },
                                    { id: 'masterTasks', label: 'Tasks', data: getLocal('oc-dashboard-master-tasks', []) },
                                    { id: 'attendance', label: 'Attendance', data: getLocal('attendance_log', []) },
                                    { id: 'inventory', label: 'Equipment Inventory', data: getLocal('oc-dashboard-equipment-inventory', []) },
                                    { id: 'checkouts', label: 'Equipment Checkouts', data: getLocal('oc-dashboard-equipment-checkouts', []) },
                                    { id: 'formationLayouts', label: 'Formation Maps', data: getLocal('formationLayouts', {}) },
                                    { id: 'ratings', label: 'Player Ratings', data: getLocal('oc-dashboard-ratings', {}) },
                                    { id: 'gameGrades', label: 'Game Grades', data: getLocal('oc-dashboard-game-grades', {}) },
                                    { id: 'summerComp', label: 'Summer Competition', data: getLocal('oc-dashboard-summer-comp', null) },
                                    { id: 'opponentScouting', label: 'Opponent Scouting', data: getLocal('oc-dashboard-scouting', {}) },
                                    { id: 'issuance', label: 'Equipment Issuance', data: getLocal('oc-dashboard-equipment-issuance', {}) },
                                    { id: 'wishlist', label: 'Equipment Wishlist', data: getLocal('oc-dashboard-equipment-wishlist', []) },
                                    { id: 'athleteAssessments', label: 'Athlete Assessments', data: getLocal('athlete_assessments', {}) },
                                    { id: 'formations', label: 'Formations', data: getLocal('oc-dashboard-formations', {}) },
                                    { id: 'zonePhilosophies', label: 'Zone Philosophies', data: getLocal('oc-dashboard-zone-philosophies', {}) },
                                    { id: 'customFocus', label: 'Custom Focus Areas', data: getLocal('oc-dashboard-custom-focus', []) },
                                    { id: 'duties', label: 'Staff Duties', data: getLocal('oc-dashboard-duties', []) },
                                    { id: 'metrics', label: 'Key Performance Metrics', data: getLocal('oc-dashboard-metrics', []) },
                                    { id: 'fatigueThresholds', label: 'Fatigue Settings', data: getLocal('fatigue-thresholds', {}) },
                                    { id: 'positionFatigue', label: 'Position Fatigue', data: getLocal('position-fatigue-values', {}) },
                                    { id: 'budget', label: 'Budget', data: getLocal('program_budget_data', {}) },
                                    { id: 'onboarding', label: 'Onboarding Status', data: getLocal('program_onboarding_data', {}) },
                                    { id: 'positionNames', label: 'Position Names', data: getLocal('oc-dashboard-position-names', {}) },
                                    { id: 'dailyConnections', label: 'Daily Connections', data: getLocal('player_daily_connections', []) },
                                    { id: 'weightLogs', label: 'Weight Logs', data: getLocal('player_weight_logs', {}) },
                                    { id: 'roleTasks', label: 'Role Specific Tasks', data: getLocal('staff_role_tasks', []) },
                                    { id: 'rooskiLib', label: 'Rooski Library', data: getLocal('rooski_ol_library', {}) },
                                    {
                                        id: 'wbSettings', label: 'Wristband Settings', data: {
                                            wb1Opp: localStorage.getItem('hc_wb1_opponent'),
                                            wb1Iter: localStorage.getItem('hc_wb1_iteration'),
                                            wb2Opp: localStorage.getItem('hc_wb2_opponent'),
                                            wb2Iter: localStorage.getItem('hc_wb2_iteration'),
                                            sheetUrl: localStorage.getItem('hc_wristband_sheet_url')
                                        }
                                    }
                                ];

                                const handleSyncOne = (typeId, data) => {
                                    if (!authUser) return alert("You must be logged in to sync.");
                                    if (confirm(`Force PUSH '${typeId}' to cloud? This will overwrite cloud data.`)) {
                                        syncToFirestore(authUser.uid, typeId, data)
                                            .then(res => {
                                                if (res.success) alert(`Successfully pushed ${typeId}!`);
                                                else alert(`Error syncing ${typeId}: ${res.error}`);
                                            });
                                    }
                                };

                                const handlePullOne = (typeId) => {
                                    if (!authUser) return alert("You must be logged in to sync.");
                                    if (confirm(`Force PULL '${typeId}' from cloud? This will overwrite local data.`)) {
                                        // We use loadUserDataFromFirestore but it loads ALL data.
                                        // Ideally we want to load just ONE item, but our function is monolithic.
                                        // However, loadUserDataFromFirestore is safe to run.
                                        // But to be precise, let's just use the doc ref directly here for speed/clarity?
                                        // No, let's allow a full refresh or just reuse the logic.
                                        // Actually, let's just call loadUserDataFromFirestore and alert the user.
                                        // Wait, loadUserDataFromFirestore replaces LOCAL STORAGE. It does NOT update React State immediately unless we reload.
                                        // So we must Reload after pulling.

                                        loadUserDataFromFirestore(authUser.uid).then(result => {
                                            if (result.success) {
                                                alert(`Successfully pulled latest data! The page will now reload.`);
                                                window.location.reload();
                                            } else {
                                                alert("Failed to pull data.");
                                            }
                                        });
                                    }
                                };

                                const handleSyncAll = () => {
                                    if (!authUser) return alert("You must be logged in to sync.");
                                    if (confirm("WARNING: This will overwrite ALL cloud data with the data from THIS computer. Are you sure?")) {
                                        let successCount = 0;
                                        let failCount = 0;

                                        Promise.all(dataTypes.map(item => {
                                            return syncToFirestore(authUser.uid, item.id, item.data)
                                                .then(res => res.success ? successCount++ : failCount++);
                                        })).then(() => {
                                            alert(`Sync Complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
                                        });
                                    }
                                };

                                return (
                                    <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                            <div>
                                                <h1>Master Cloud Sync</h1>
                                                <p style={{ opacity: 0.7 }}>Push local data to cloud or reset local data from cloud.</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => {
                                                        if (window.confirm("NUCLEAR OPTION: This will DELETE all data on THIS computer and force a re-download from the Cloud.\n\nKey Safety Rules:\n1. Only do this if the Cloud data is GOOD.\n2. Do not do this if you have unsaved work on this computer.\n\nAre you sure?")) {
                                                            localStorage.clear();
                                                            window.location.reload();
                                                        }
                                                    }}
                                                    style={{ border: '2px solid #ef4444', backgroundColor: '#7f1d1d' }}
                                                >
                                                    ⚠️ Hard Reset
                                                </button>
                                                <button className="btn btn-primary" onClick={handleSyncAll}>
                                                    Push ALL to Cloud
                                                </button>
                                            </div>

                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                            {dataTypes.map((item, idx) => (
                                                <div key={item.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '1rem',
                                                    background: idx % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-panel)',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                            {Array.isArray(item.data)
                                                                ? `${item.data.length} items`
                                                                : item.data && typeof item.data === 'object'
                                                                    ? `${Object.keys(item.data).length} keys`
                                                                    : 'Data Object'
                                                            } • Key: {item.id}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-sm"
                                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                                                            onClick={() => handlePullOne(item.id)}>
                                                            Pull (Get)
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handleSyncOne(item.id, item.data)}>
                                                            Push
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            };

                            const GlossaryView = ({ phase = 'OFFENSE' }) => {
                                const isOffense = phase === 'OFFENSE';
                                const isDefense = phase === 'DEFENSE';
                                const isST = phase === 'SPECIAL_TEAMS';

                                let currentSyntax, currentTermLibrary;

                                if (isDefense) {
                                    currentSyntax = defensePlaySyntax;
                                    currentTermLibrary = defenseTermLibrary;
                                } else if (isST) {
                                    currentSyntax = stPlaySyntax;
                                    currentTermLibrary = stTermLibrary;
                                } else {
                                    currentSyntax = playSyntax;
                                    currentTermLibrary = termLibrary;
                                }

                                return (
                                    <div className="animate-fade-in" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                                        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                            <h1 style={{ margin: 0 }}>
                                                {isOffense ? 'Offense' : isDefense ? 'Defense' : 'Special Teams'} <span style={{ color: 'var(--accent)' }}>Glossary</span>
                                            </h1>
                                            <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
                                                Master terminology for {phase === 'SPECIAL_TEAMS' ? 'Special Teams' : phase.toLowerCase()}.
                                            </p>
                                        </div>

                                        {currentSyntax.length === 0 ? (
                                            <div className="alert alert-info">
                                                <Icon name="Info" size={18} />
                                                No play syntax defined yet. Go to <button className="btn-link" onClick={() => setView('setup-' + (isOffense ? 'offense' : isDefense ? 'defense' : 'st'))}>Setup</button> to configure your language.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'masonry', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                                                {/* Note: Masonry isn't standard CSS Grid yet (except Firefox), fallback to columns or grid */}
                                                <div style={{ columnCount: 3, columnGap: '2rem' }}>
                                                    {currentSyntax.map(cat => (
                                                        <div key={cat.id} style={{ breakInside: 'avoid', marginBottom: '2rem', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>
                                                            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>
                                                                {cat.label}
                                                            </h3>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                {(currentTermLibrary[cat.id] || []).length > 0 ? (
                                                                    (currentTermLibrary[cat.id] || []).map(term => (
                                                                        <span key={term.id} style={{ background: 'var(--bg-main)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--border)' }}>
                                                                            {term.label}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span style={{ fontStyle: 'italic', opacity: 0.5, fontSize: '0.9rem' }}>No terms added.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div >
                                        )}
                                    </div >
                                );
                            };

                            const ScriptPresetsManager = () => {
                                const [editingPreset, setEditingPreset] = useState(null);

                                const handleSave = () => {
                                    if (!editingPreset.name) return alert('Name is required');
                                    setScriptPresets(prev => {
                                        const exists = prev.find(p => p.id === editingPreset.id);
                                        if (exists) {
                                            return prev.map(p => p.id === editingPreset.id ? editingPreset : p);
                                        } else {
                                            return [...prev, editingPreset];
                                        }
                                    });
                                    setEditingPreset(null);
                                };

                                const handleDelete = (id) => {
                                    if (confirm('Delete this preset?')) {
                                        setScriptPresets(prev => prev.filter(p => p.id !== id));
                                    }
                                };

                                const handleItemChange = (idx, field, val) => {
                                    const newItems = [...editingPreset.items];
                                    newItems[idx] = { ...newItems[idx], [field]: val };
                                    setEditingPreset({ ...editingPreset, items: newItems });
                                };

                                if (editingPreset) {
                                    return (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                                <button className="btn-ghost" onClick={() => setEditingPreset(null)} style={{ marginRight: '1rem' }}>
                                                    <Icon name="ArrowLeft" size={16} /> Back
                                                </button>
                                                <h3 style={{ margin: 0 }}>{editingPreset.id ? 'Edit Preset' : 'New Preset'}</h3>
                                                <div style={{ flex: 1 }}></div>
                                                <button className="btn-primary" onClick={handleSave}>
                                                    <Icon name="Save" size={16} /> Save Preset
                                                </button>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '2rem', flex: 1, minHeight: 0 }}>
                                                <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', height: 'fit-content' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Segment Type</label>
                                                            <select
                                                                className="form-input"
                                                                value={editingPreset.type || ''}
                                                                onChange={e => setEditingPreset({ ...editingPreset, type: e.target.value })}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <option value="">- Generic / None -</option>
                                                                {practiceSegmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Focus / Situation</label>
                                                            <select
                                                                className="form-input"
                                                                value={editingPreset.focus || ''}
                                                                onChange={e => setEditingPreset({ ...editingPreset, focus: e.target.value })}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <option value="">- Any / None -</option>
                                                                {practiceFocusItems.map(f => <option key={f} value={f}>{f}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginBottom: '1.5rem' }}>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Preset Name</label>
                                                        <input
                                                            className="form-input"
                                                            value={editingPreset.name}
                                                            onChange={e => setEditingPreset({ ...editingPreset, name: e.target.value })}
                                                            placeholder="e.g. Take-Off, Red Zone"
                                                        />
                                                    </div>
                                                    <div style={{ marginBottom: '1.5rem' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={editingPreset.useYardLine}
                                                                onChange={e => setEditingPreset({ ...editingPreset, useYardLine: e.target.checked })}
                                                            />
                                                            <span style={{ fontWeight: 'bold' }}>Use Yard Line & Dn/Dist</span>
                                                        </label>
                                                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                                                            If unchecked, uses "Situation" text field instead.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                        <h4 style={{ margin: 0 }}>Script Sequence</h4>
                                                        <button className="btn-secondary btn-sm" onClick={() => setEditingPreset({ ...editingPreset, items: [...editingPreset.items, {}] })}>
                                                            <Icon name="Plus" size={14} /> Add Row
                                                        </button>
                                                    </div>
                                                    <div style={{ flex: 1, overflowY: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                                                    <th style={{ padding: '0.5rem', width: '40px' }}>#</th>
                                                                    {editingPreset.useYardLine ? (
                                                                        <>
                                                                            <th style={{ padding: '0.5rem' }}>Yard Line</th>
                                                                            <th style={{ padding: '0.5rem' }}>Hash</th>
                                                                            <th style={{ padding: '0.5rem' }}>Dn/Dist</th>
                                                                        </>
                                                                    ) : (
                                                                        <th style={{ padding: '0.5rem' }}>Situation</th>
                                                                    )}
                                                                    <th style={{ padding: '0.5rem', width: '40px' }}></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {editingPreset.items.map((item, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                        <td style={{ padding: '0.5rem', opacity: 0.5 }}>{idx + 1}</td>
                                                                        {editingPreset.useYardLine ? (
                                                                            <>
                                                                                <td style={{ padding: '0.5rem' }}>
                                                                                    <input className="form-input" style={{ padding: '4px 8px' }} value={item.yardLine || ''} onChange={e => handleItemChange(idx, 'yardLine', e.target.value)} placeholder="-30" />
                                                                                </td>
                                                                                <td style={{ padding: '0.5rem' }}>
                                                                                    <select className="form-input" style={{ padding: '4px 8px' }} value={item.hash || ''} onChange={e => handleItemChange(idx, 'hash', e.target.value)}>
                                                                                        <option value="">-</option>
                                                                                        <option value="L">L</option>
                                                                                        <option value="M">M</option>
                                                                                        <option value="R">R</option>
                                                                                    </select>
                                                                                </td>
                                                                                <td style={{ padding: '0.5rem' }}>
                                                                                    <input className="form-input" style={{ padding: '4px 8px' }} value={item.down || ''} onChange={e => handleItemChange(idx, 'down', e.target.value)} placeholder="1st & 10" />
                                                                                </td>
                                                                            </>
                                                                        ) : (
                                                                            <td style={{ padding: '0.5rem' }}>
                                                                                <input className="form-input" style={{ padding: '4px 8px', width: '100%' }} value={item.situation || ''} onChange={e => handleItemChange(idx, 'situation', e.target.value)} placeholder="Goal Line..." />
                                                                            </td>
                                                                        )}
                                                                        <td style={{ padding: '0.5rem' }}>
                                                                            <button className="btn-icon" style={{ color: 'var(--danger)', opacity: 0.7 }} onClick={() => {
                                                                                const newItems = editingPreset.items.filter((_, i) => i !== idx);
                                                                                setEditingPreset({ ...editingPreset, items: newItems });
                                                                            }}>
                                                                                <Icon name="Trash" size={14} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {editingPreset.items.length === 0 && (
                                                                    <tr>
                                                                        <td colSpan={editingPreset.useYardLine ? 5 : 3} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                                                            No items. Click "Add Row" to start.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div >
                                    );
                                }

                                return (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0 }}>Script Presets</h3>
                                                <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>Manage standard script templates for different practice periods.</p>
                                            </div>
                                            <button className="btn-primary" onClick={() => setEditingPreset({ id: Date.now().toString(), name: 'New Preset', type: '', focus: '', useYardLine: true, items: [] })}>
                                                <Icon name="Plus" size={16} /> New Preset
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', alignContent: 'start' }}>
                                            {scriptPresets.map(preset => (
                                                <div key={preset.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{preset.name}</h4>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn-icon" onClick={() => setEditingPreset({ ...preset, items: [...preset.items] })} title="Edit">
                                                                <Icon name="Edit" size={16} />
                                                            </button>
                                                            <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(preset.id)} title="Delete">
                                                                <Icon name="Trash" size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                                        {preset.items.length} items • {preset.useYardLine ? 'Yard/Hash' : 'Situation'}
                                                    </div>
                                                    {(preset.type || preset.focus) && (
                                                        <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '500' }}>
                                                            {preset.type && <span style={{ marginRight: '0.5rem' }}>[{preset.type}]</span>}
                                                            {preset.focus && <span>({preset.focus})</span>}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                                                        {preset.items.slice(0, 3).map((item, i) => (
                                                            <span key={i} style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                                                                {preset.useYardLine ? (item.yardLine || '-') + (item.hash ? ` ${item.hash}` : '') : (item.situation || 'Item')}
                                                            </span>
                                                        ))}
                                                        {preset.items.length > 3 && (
                                                            <span style={{ fontSize: '0.8rem', opacity: 0.5, alignSelf: 'center' }}>+{preset.items.length - 3} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            };

                            const renderSetup = (phase) => {
                                const isOffense = phase === 'OFFENSE';
                                const isDefense = phase === 'DEFENSE';
                                const isST = phase === 'SPECIAL_TEAMS';

                                let currentSyntax, setSyntax, defaultPositions;

                                if (isDefense) {
                                    currentSyntax = defensePlaySyntax;
                                    setSyntax = setDefensePlaySyntax;
                                    defaultPositions = [
                                        { key: 'DE', default: 'DE', description: 'Defensive End' },
                                        { key: 'DT', default: 'DT', description: 'Defensive Tackle' },
                                        { key: 'NT', default: 'NT', description: 'Nose Tackle' },
                                        { key: 'LB', default: 'LB', description: 'Linebacker' },
                                        { key: 'CB', default: 'CB', description: 'Cornerback' },
                                        { key: 'S', default: 'S', description: 'Safety' },
                                        { key: 'NB', default: 'NB', description: 'Nickelback' },
                                        { key: 'DL', default: 'DL', description: 'Defensive Line' },
                                        { key: 'DB', default: 'DB', description: 'Defensive Back' }
                                    ];
                                } else if (isST) {
                                    currentSyntax = stPlaySyntax;
                                    setSyntax = setStPlaySyntax;
                                    defaultPositions = [
                                        { key: 'K', default: 'K', description: 'Kicker' },
                                        { key: 'P', default: 'P', description: 'Punter' },
                                        { key: 'LS', default: 'LS', description: 'Long Snapper' },
                                        { key: 'H', default: 'H', description: 'Holder' },
                                        { key: 'KR', default: 'KR', description: 'Kick Returner' },
                                        { key: 'PR', default: 'PR', description: 'Punt Returner' },
                                        { key: 'G', default: 'G', description: 'Gunner' },
                                        { key: 'W', default: 'W', description: 'Wing' },
                                        { key: 'PP', default: 'PP', description: 'Personal Protector' },
                                        { key: 'L1', default: 'L1', description: 'KO Left 1' },
                                        { key: 'R1', default: 'R1', description: 'KO Right 1' }
                                    ];
                                } else {
                                    currentSyntax = playSyntax;
                                    setSyntax = setPlaySyntax;
                                    defaultPositions = [
                                        { key: 'X', default: 'X', description: 'Left WR' },
                                        { key: 'Z', default: 'Z', description: 'Right WR' },
                                        { key: 'A', default: 'A', description: 'Slot WR' },
                                        { key: 'Y', default: 'Y', description: 'Tight End' },
                                        { key: 'QB', default: 'QB', description: 'Quarterback' },
                                        { key: 'RB', default: 'RB', description: 'Running Back' },
                                        { key: 'LT', default: 'LT', description: 'Left Tackle' },
                                        { key: 'LG', default: 'LG', description: 'Left Guard' },
                                        { key: 'C', default: 'C', description: 'Center' },
                                        { key: 'RG', default: 'RG', description: 'Right Guard' },
                                        { key: 'RT', default: 'RT', description: 'Right Tackle' },
                                    ];
                                }

                                let currentTermLibrary, setCurrentTermLibrary;
                                if (isDefense) {
                                    currentTermLibrary = defenseTermLibrary;
                                    setCurrentTermLibrary = setDefenseTermLibrary;
                                } else if (isST) {
                                    currentTermLibrary = stTermLibrary;
                                    setCurrentTermLibrary = setStTermLibrary;
                                } else {
                                    currentTermLibrary = termLibrary;
                                    setCurrentTermLibrary = setTermLibrary;
                                }

                                const getTerms = (catId) => currentTermLibrary[catId] || [];
                                const addTerm = (catId) => {
                                    const term = prompt("Enter new term:");
                                    if (term) {
                                        const newTerms = [...getTerms(catId), { id: Date.now().toString(), label: term }];
                                        setCurrentTermLibrary({ ...currentTermLibrary, [catId]: newTerms });
                                    }
                                };
                                const deleteTerm = (catId, termId) => {
                                    if (confirm("Delete this term?")) {
                                        const newTerms = getTerms(catId).filter(t => t.id !== termId);
                                        setCurrentTermLibrary({ ...currentTermLibrary, [catId]: newTerms });
                                    }
                                };

                                const phaseTitle = isDefense ? 'Defense' : isST ? 'Special Teams' : 'Offense';

                                return (
                                    <div className="card" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                            <h1 style={{ margin: 0 }}>{phaseTitle} Setup</h1>
                                            <p style={{ opacity: 0.7, margin: '0.5rem 0 0 0' }}>Configure your {phaseTitle.toLowerCase()} language, positions, and terminology.</p>
                                        </div>

                                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#1e293b' }}>
                                            <button
                                                className={`btn-ghost`}
                                                style={{
                                                    borderRadius: 0,
                                                    padding: '1rem 1.5rem',
                                                    borderBottom: setupTab === 'positions' ? '3px solid var(--accent)' : '3px solid transparent',
                                                    fontWeight: setupTab === 'positions' ? 'bold' : 'normal',
                                                    color: setupTab === 'positions' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    background: 'transparent'
                                                }}
                                                onClick={() => setSetupTab('positions')}
                                            >
                                                <Icon name="Users" size={16} /> Positions
                                            </button>
                                            <button
                                                className={`btn-ghost`}
                                                style={{
                                                    borderRadius: 0,
                                                    padding: '1rem 1.5rem',
                                                    borderBottom: setupTab === 'syntax' ? '3px solid var(--accent)' : '3px solid transparent',
                                                    fontWeight: setupTab === 'syntax' ? 'bold' : 'normal',
                                                    color: setupTab === 'syntax' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    background: 'transparent'
                                                }}
                                                onClick={() => setSetupTab('syntax')}
                                            >
                                                <Icon name="Code" size={16} /> Playcall Chain
                                            </button>
                                            <button
                                                className={`btn-ghost`}
                                                style={{
                                                    borderRadius: 0,
                                                    padding: '1rem 1.5rem',
                                                    borderBottom: setupTab === 'terms' ? '3px solid var(--accent)' : '3px solid transparent',
                                                    fontWeight: setupTab === 'terms' ? 'bold' : 'normal',
                                                    color: setupTab === 'terms' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    background: 'transparent'
                                                }}
                                                onClick={() => setSetupTab('terms')}
                                            >
                                                <Icon name="BookOpen" size={16} /> Term Library
                                            </button>
                                            <button
                                                className={`btn-ghost`}
                                                style={{
                                                    borderRadius: 0,
                                                    padding: '1rem 1.5rem',
                                                    borderBottom: setupTab === 'practice-lists' ? '3px solid var(--accent)' : '3px solid transparent',
                                                    fontWeight: setupTab === 'practice-lists' ? 'bold' : 'normal',
                                                    color: setupTab === 'practice-lists' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    background: 'transparent'
                                                }}
                                                onClick={() => setSetupTab('practice-lists')}
                                            >
                                                <Icon name="List" size={16} /> Practice Lists
                                            </button>
                                            {isOffense && (
                                                <button
                                                    className={`btn-ghost`}
                                                    style={{
                                                        borderRadius: 0,
                                                        padding: '1rem 1.5rem',
                                                        borderBottom: setupTab === 'script-presets' ? '3px solid var(--accent)' : '3px solid transparent',
                                                        fontWeight: setupTab === 'script-presets' ? 'bold' : 'normal',
                                                        color: setupTab === 'script-presets' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                        background: 'transparent'
                                                    }}
                                                    onClick={() => setSetupTab('script-presets')}
                                                >
                                                    <Icon name="FileText" size={16} /> Script Presets
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ padding: '1.5rem', flex: 1 }}>
                                            {setupTab === 'positions' && (
                                                <div>
                                                    <h3 style={{ marginBottom: '1rem' }}>Position Names</h3>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                                                        {[...defaultPositions.filter(p => !(hiddenPositions[phase] || []).includes(p.key)), ...(customPositions[phase] || [])].map(pos => (
                                                            <div key={pos.key} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
                                                                {pos.isCustom && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm(`Permanently delete custom position ${pos.default}?`)) {
                                                                                const newCustom = (customPositions[phase] || []).filter(p => p.key !== pos.key);
                                                                                setCustomPositions({ ...customPositions, [phase]: newCustom });
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '4px',
                                                                            right: '4px',
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#ef4444',
                                                                            cursor: 'pointer',
                                                                            opacity: 0.6,
                                                                            padding: '4px'
                                                                        }}
                                                                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                                                                        onMouseOut={e => e.currentTarget.style.opacity = '0.6'}
                                                                        title="Delete Position"
                                                                    >
                                                                        <Icon name="X" size={14} />
                                                                    </button>
                                                                )}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingRight: pos.isCustom ? '1rem' : '0', alignItems: 'center' }}>
                                                                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{positionNames[pos.key] || pos.default}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={positionDescriptions[pos.key] !== undefined ? positionDescriptions[pos.key] : pos.description}
                                                                        onChange={(e) => setPositionDescriptions({ ...positionDescriptions, [pos.key]: e.target.value })}
                                                                        placeholder={pos.description}
                                                                        style={{
                                                                            fontSize: '0.8rem',
                                                                            color: 'var(--text-primary)',
                                                                            borderBottom: '1px dashed var(--accent)',
                                                                            background: 'transparent',
                                                                            textAlign: 'right',
                                                                            width: '140px',
                                                                            outline: 'none',
                                                                            cursor: 'text',
                                                                            paddingRight: '2px',
                                                                            fontWeight: '500'
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            e.target.style.background = 'var(--bg-panel)';
                                                                            e.target.style.borderBottom = '1px solid var(--accent)';
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            e.target.style.background = 'transparent';
                                                                            e.target.style.borderBottom = '1px dashed var(--accent)';
                                                                        }}
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    value={positionNames[pos.key] || pos.default}
                                                                    onChange={(e) => setPositionNames({ ...positionNames, [pos.key]: e.target.value.toUpperCase().slice(0, 3) })}
                                                                    placeholder={pos.default}
                                                                    maxLength="3"
                                                                    style={{ padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', marginTop: '0.5rem' }}
                                                                    title={`Customize ${pos.description} label`}
                                                                />
                                                            </div>
                                                        ))}

                                                        {/* Add Position Button */}
                                                        <button
                                                            onClick={() => {
                                                                const key = prompt("Enter Position Key (1-3 letters, e.g., 'F' or 'S2'):");
                                                                if (!key) return;

                                                                const cleanKey = key.toUpperCase().trim().slice(0, 3);
                                                                if (!cleanKey) return;

                                                                // Check for duplicates
                                                                const allKeys = [...defaultPositions, ...(customPositions[phase] || [])].map(p => p.key);
                                                                if (allKeys.includes(cleanKey)) {
                                                                    alert("That position key already exists!");
                                                                    return;
                                                                }

                                                                const desc = prompt("Enter Description (e.g., 'Flex Tight End'):") || cleanKey;

                                                                const newPos = {
                                                                    key: cleanKey,
                                                                    default: cleanKey,
                                                                    description: desc,
                                                                    isCustom: true
                                                                };

                                                                setCustomPositions({
                                                                    ...customPositions,
                                                                    [phase]: [...(customPositions[phase] || []), newPos]
                                                                });
                                                            }}
                                                            style={{
                                                                background: 'var(--surface)',
                                                                border: '2px dashed var(--border)',
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                padding: '1rem',
                                                                minHeight: '100px',
                                                                color: 'var(--text-secondary)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                                            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                        >
                                                            <Icon name="Plus" size={24} style={{ marginBottom: '0.5rem' }} />
                                                            <span style={{ fontWeight: '600' }}>Add Position</span>
                                                        </button>
                                                    </div>

                                                    {(hiddenPositions[phase] || []).length > 0 && (
                                                        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed var(--border)', borderRadius: '8px', opacity: 0.8 }}>
                                                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hidden Default Positions</h4>
                                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                {(hiddenPositions[phase] || []).map(hiddenKey => {
                                                                    const original = defaultPositions.find(p => p.key === hiddenKey);
                                                                    if (!original) return null;
                                                                    return (
                                                                        <div key={hiddenKey} style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.5rem',
                                                                            padding: '0.5rem 1rem',
                                                                            background: 'var(--bg-panel)',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid var(--border)',
                                                                            fontSize: '0.85rem'
                                                                        }}>
                                                                            <span>{original.default} <span style={{ opacity: 0.5 }}>({original.description})</span></span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newHidden = (hiddenPositions[phase] || []).filter(h => h !== hiddenKey);
                                                                                    setHiddenPositions({ ...hiddenPositions, [phase]: newHidden });
                                                                                }}
                                                                                className="btn-sm"
                                                                                style={{ color: 'var(--accent)', border: 'none', background: 'none', padding: '0', marginLeft: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                                                                            >
                                                                                Restore
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {setupTab === 'syntax' && (
                                                <div style={{ maxWidth: '800px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                                        <div>
                                                            <h3 style={{ margin: 0 }}>Play Call Structure</h3>
                                                            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>Define the order and components of a play call.</p>
                                                        </div>
                                                        <button className="btn btn-primary" onClick={() => {
                                                            const newId = Date.now().toString();
                                                            setSyntax([...currentSyntax, { id: newId, label: 'New Component', type: 'text' }]);
                                                        }}>
                                                            <Icon name="Plus" size={16} style={{ marginRight: '6px' }} /> Add Component
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {currentSyntax.map((item, idx) => (
                                                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-main)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--bg-panel)', borderRadius: '50%', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '1rem' }}>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Component Name</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-input"
                                                                            value={item.label}
                                                                            onChange={(e) => {
                                                                                const newSyntax = [...currentSyntax];
                                                                                newSyntax[idx].label = e.target.value;
                                                                                setSyntax(newSyntax);
                                                                            }}
                                                                            placeholder="e.g. Formation"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Prefix</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-input"
                                                                            value={item.prefix || ''}
                                                                            onChange={(e) => {
                                                                                const newSyntax = [...currentSyntax];
                                                                                newSyntax[idx].prefix = e.target.value;
                                                                                setSyntax(newSyntax);
                                                                            }}
                                                                            placeholder='"'
                                                                            style={{ textAlign: 'center' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Suffix</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-input"
                                                                            value={item.suffix || ''}
                                                                            onChange={(e) => {
                                                                                const newSyntax = [...currentSyntax];
                                                                                newSyntax[idx].suffix = e.target.value;
                                                                                setSyntax(newSyntax);
                                                                            }}
                                                                            placeholder='"'
                                                                            style={{ textAlign: 'center' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                    <button className="btn btn-ghost btn-sm" onClick={() => {
                                                                        if (idx === 0) return;
                                                                        const newSyntax = [...currentSyntax];
                                                                        [newSyntax[idx - 1], newSyntax[idx]] = [newSyntax[idx], newSyntax[idx - 1]];
                                                                        setSyntax(newSyntax);
                                                                    }} disabled={idx === 0} style={{ padding: '2px' }}><Icon name="ChevronUp" size={16} /></button>
                                                                    <button className="btn btn-ghost btn-sm" onClick={() => {
                                                                        if (idx === currentSyntax.length - 1) return;
                                                                        const newSyntax = [...currentSyntax];
                                                                        [newSyntax[idx + 1], newSyntax[idx]] = [newSyntax[idx], newSyntax[idx + 1]];
                                                                        setSyntax(newSyntax);
                                                                    }} disabled={idx === currentSyntax.length - 1} style={{ padding: '2px' }}><Icon name="ChevronDown" size={16} /></button>
                                                                </div>
                                                                <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => {
                                                                    if (confirm('Delete this syntax component? All associated terms will be hidden.')) {
                                                                        const newSyntax = currentSyntax.filter((_, i) => i !== idx);
                                                                        setSyntax(newSyntax);
                                                                    }
                                                                }}>
                                                                    <Icon name="Trash" size={18} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {currentSyntax.length === 0 && (
                                                            <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: '8px', opacity: 0.6 }}>
                                                                <Icon name="Code" size={48} style={{ marginBottom: '1rem' }} />
                                                                <p>No play components defined.</p>
                                                                <p>Click "Add Component" to start building your play call structure.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {setupTab === 'terms' && (
                                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ marginBottom: '1.5rem' }}>
                                                        <h3 style={{ margin: 0 }}>Term Library</h3>
                                                        <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>Manage vocabulary for your play components.</p>
                                                    </div>

                                                    {currentSyntax.length === 0 ? (
                                                        <div className="alert alert-warning">
                                                            <Icon name="AlertTriangle" size={18} />
                                                            Please define your Play Call Structure in the Syntax tab first.
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '0' }}>
                                                            <div style={{ width: '250px', borderRight: '1px solid var(--border)', paddingRight: '1rem', overflowY: 'auto' }}>
                                                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>COMPONENTS</div>
                                                                {currentSyntax.map(cat => (
                                                                    <button
                                                                        key={cat.id}
                                                                        onClick={() => setSetupCategory(cat.id)}
                                                                        style={{
                                                                            display: 'block',
                                                                            width: '100%',
                                                                            textAlign: 'left',
                                                                            padding: '0.75rem 1rem',
                                                                            background: setupCategory === cat.id ? 'var(--bg-main)' : 'none',
                                                                            border: 'none',
                                                                            borderRadius: '6px',
                                                                            fontWeight: setupCategory === cat.id ? 'bold' : 'normal',
                                                                            color: setupCategory === cat.id ? 'var(--accent)' : 'var(--text-primary)',
                                                                            marginBottom: '2px',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        {cat.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                                                {!setupCategory ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, flexDirection: 'column' }}>
                                                                        <Icon name="ArrowLeft" size={24} style={{ marginBottom: '1rem' }} />
                                                                        Select a component to manage terms
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                                            <h4 style={{ margin: 0 }}>
                                                                                {currentSyntax.find(s => s.id === setupCategory)?.label} Terms
                                                                            </h4>
                                                                            <button className="btn btn-sm btn-primary" onClick={() => addTerm(setupCategory)}>
                                                                                + Add Term
                                                                            </button>
                                                                        </div>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                                                            {getTerms(setupCategory).map(term => (
                                                                                <div key={term.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                                                    <span style={{ fontWeight: '500' }}>{term.label}</span>
                                                                                    <button className="btn-icon" style={{ color: 'var(--text-secondary)' }} onClick={() => deleteTerm(setupCategory, term.id)}>
                                                                                        <Icon name="X" size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                            {getTerms(setupCategory).length === 0 && (
                                                                                <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', opacity: 0.6, border: '1px dashed var(--border)', borderRadius: '6px' }}>
                                                                                    No terms added yet.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {setupTab === 'practice-lists' && (
                                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ marginBottom: '1.5rem' }}>
                                                        <h3 style={{ margin: 0 }}>Practice Lists</h3>
                                                        <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>Customize standard dropdown options for practice plans.</p>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                                        {/* Segment Types Column */}
                                                        <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                            <h4 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Segment Types</h4>

                                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                                                <input
                                                                    id="new-segment-type"
                                                                    className="form-input"
                                                                    placeholder="New Segment Type..."
                                                                />
                                                                <button className="btn btn-primary" onClick={() => {
                                                                    const val = document.getElementById('new-segment-type').value.trim();
                                                                    if (val) {
                                                                        if (!practiceSegmentTypes.includes(val)) {
                                                                            setPracticeSegmentTypes([...practiceSegmentTypes, val]);
                                                                        }
                                                                        document.getElementById('new-segment-type').value = '';
                                                                    }
                                                                }}>Add</button>
                                                            </div>

                                                            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                {practiceSegmentTypes.map(item => {
                                                                    const settings = practiceSegmentSettings[item] || { showHash: true, showDefense: true };
                                                                    return (
                                                                        <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-panel)', borderRadius: '4px' }}>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                                <span style={{ fontWeight: '600' }}>{item}</span>
                                                                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Show Hash Column">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={settings.showHash !== false}
                                                                                            onChange={(e) => {
                                                                                                setPracticeSegmentSettings({
                                                                                                    ...practiceSegmentSettings,
                                                                                                    [item]: { ...settings, showHash: e.target.checked }
                                                                                                });
                                                                                            }}
                                                                                        /> Hash
                                                                                    </label>
                                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Show Defense Column">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={settings.showDefense !== false}
                                                                                            onChange={(e) => {
                                                                                                setPracticeSegmentSettings({
                                                                                                    ...practiceSegmentSettings,
                                                                                                    [item]: { ...settings, showDefense: e.target.checked }
                                                                                                });
                                                                                            }}
                                                                                        /> Def
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                            {deleteConfirmation?.list === 'segments' && deleteConfirmation?.item === item ? (
                                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                                    <button
                                                                                        className="btn btn-icon"
                                                                                        style={{ color: 'var(--success)' }}
                                                                                        onClick={() => {
                                                                                            setPracticeSegmentTypes(practiceSegmentTypes.filter(t => t !== item));
                                                                                            setDeleteConfirmation(null);
                                                                                        }}
                                                                                    >
                                                                                        <Icon name="Check" size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-icon"
                                                                                        style={{ color: 'var(--text-secondary)' }}
                                                                                        onClick={() => setDeleteConfirmation(null)}
                                                                                    >
                                                                                        <Icon name="X" size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    className="btn btn-icon"
                                                                                    style={{ color: 'var(--danger)', opacity: 0.7 }}
                                                                                    onClick={() => setDeleteConfirmation({ list: 'segments', item })}
                                                                                >
                                                                                    <Icon name="Trash" size={14} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Focus Items Column */}
                                                        <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                            <h4 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Focus Items</h4>

                                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                                                <input
                                                                    id="new-focus-item"
                                                                    className="form-input"
                                                                    placeholder="New Focus Item..."
                                                                />
                                                                <button className="btn btn-primary" onClick={() => {
                                                                    const val = document.getElementById('new-focus-item').value.trim();
                                                                    if (val) {
                                                                        if (!practiceFocusItems.includes(val)) {
                                                                            setPracticeFocusItems([...practiceFocusItems, val]);
                                                                        }
                                                                        document.getElementById('new-focus-item').value = '';
                                                                    }
                                                                }}>Add</button>
                                                            </div>

                                                            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                {practiceFocusItems.map(item => (
                                                                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-panel)', borderRadius: '4px' }}>
                                                                        <span>{item}</span>
                                                                        {deleteConfirmation?.list === 'focus' && deleteConfirmation?.item === item ? (
                                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                                <button
                                                                                    className="btn btn-icon"
                                                                                    style={{ color: 'var(--success)' }}
                                                                                    onClick={() => {
                                                                                        setPracticeFocusItems(practiceFocusItems.filter(t => t !== item));
                                                                                        setDeleteConfirmation(null);
                                                                                    }}
                                                                                >
                                                                                    <Icon name="Check" size={14} />
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-icon"
                                                                                    style={{ color: 'var(--text-secondary)' }}
                                                                                    onClick={() => setDeleteConfirmation(null)}
                                                                                >
                                                                                    <Icon name="X" size={14} />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                className="btn btn-icon"
                                                                                style={{ color: 'var(--danger)', opacity: 0.7 }}
                                                                                onClick={() => setDeleteConfirmation({ list: 'focus', item })}
                                                                            >
                                                                                <Icon name="Trash" size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {setupTab === 'script-presets' && (
                                                <ScriptPresetsManager />
                                            )}
                                        </div>
                                    </div>
                                );
                            };



                            if (!authUser) return <LoginScreen />;

                            return (
                                <div className="app-container">
                                    {schoolSetupData.showWizard && (
                                        <div className="onboarding-wizard-wrapper">
                                            <SchoolOnboardingWizard
                                                user={authUser}
                                                onComplete={async (schoolId) => {
                                                    console.log("Onboarding Complete. Fetching new data...");
                                                    setSchoolSetupData({ showWizard: false, schoolId: null });
                                                    // Fetch fresh data immediately to populate Dashboard without reload
                                                    await loadUserDataFromFirestore(authUser.uid);
                                                    // Ensure School ID is set in local state (in case loader didn't catch it yet)
                                                    localStorage.setItem('hc_school_id', schoolId);
                                                }}
                                            />
                                        </div>
                                    )}


                                    <div className="sidebar" style={{ width: sidebarCollapsed ? '60px' : '280px', transition: 'width 0.3s ease', overflow: 'hidden' }}>
                                        <div style={{ marginBottom: '2rem', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            {!sidebarCollapsed && (
                                                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '-1px' }}>DoFO</h1>
                                            )}
                                            <button
                                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                                style={{
                                                    background: 'rgba(56, 189, 248, 0.1)',
                                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                                    borderRadius: '4px',
                                                    padding: '0.5rem',
                                                    cursor: 'pointer',
                                                    color: 'var(--accent)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginLeft: sidebarCollapsed ? '0' : 'auto',
                                                    marginBottom: sidebarCollapsed ? '0' : '1rem'
                                                }}
                                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                            >
                                                {sidebarCollapsed ? '→' : '←'}
                                            </button>
                                        </div>

                                        <div style={{ padding: sidebarCollapsed ? '0 0.25rem' : '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                                            {!sidebarCollapsed && (
                                                <>
                                                    {schoolName && (
                                                        <div style={{ animation: 'fadeIn 0.5s ease', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {teamLogo && (
                                                                <img
                                                                    src={teamLogo}
                                                                    alt="School Logo"
                                                                    style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', alignSelf: 'flex-start' }}
                                                                />
                                                            )}
                                                            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.2', color: 'var(--text-primary)' }}>
                                                                {schoolName}
                                                            </h2>
                                                        </div>
                                                    )}

                                                    {/* School Switcher */}
                                                    <SchoolSwitcher userId={authUser.uid} currentSchoolId={localStorage.getItem('hc_school_id')} />

                                                    {/* Active Season Display (Moved to Top/Sticky) */}
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0rem', display: 'block' }}>
                                                            Active Season
                                                        </label>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                                                            {activeYear || '2024'}
                                                        </div>
                                                    </div>

                                                    {/* Level Filter (Moved to Top/Sticky) */}
                                                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem', display: 'block' }}>
                                                            Level Filter
                                                        </label>
                                                        <select
                                                            className="form-select"
                                                            value={selectedLevel}
                                                            onChange={(e) => setSelectedLevel(e.target.value)}
                                                            style={{ width: '100%', padding: '0.25rem', fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                                                        >
                                                            <option value="ALL">All Levels</option>
                                                            {programLevels && programLevels.length > 0 && programLevels.map((level) => (
                                                                <option key={level} value={level}>{level}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Week Template Actions (Moved to Top/Sticky) */}
                                                    <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        {globalWeekTemplates.length > 0 && (
                                                            <select
                                                                className="form-select"
                                                                style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.1)', border: '1px dashed rgba(255,255,255,0.2)' }}
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        handleLoadWeekFromTemplate(e.target.value);
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                                value=""
                                                            >
                                                                <option value="" disabled>Apply Week Template...</option>
                                                                {globalWeekTemplates.map(t => (
                                                                    <option key={t.id} value={t.id}>📋 {t.name}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {/* Core Navigation Buttons (Dashboard/Reports - Moved to Top/Sticky) */}
                                            {currentPermissions.dashboard.view && (
                                                <button
                                                    className={`nav-item ${view === 'landing' ? 'active' : ''}`}
                                                    onClick={() => setView('landing')}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        border: 'none',
                                                        background: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                                        gap: '0.5rem',
                                                        padding: sidebarCollapsed ? '0.75rem 0' : '0.5rem 0.75rem',
                                                        marginBottom: '0.25rem'
                                                    }}
                                                >
                                                    <Icon name="Home" size={18} color="var(--accent)" />
                                                    {!sidebarCollapsed && <span style={{ fontWeight: '600' }}>MY DASHBOARD</span>}
                                                </button>
                                            )}

                                            {currentPermissions.dashboard.view && (
                                                <button
                                                    className={`nav-item ${view === 'reports' ? 'active' : ''}`}
                                                    onClick={() => setView('reports')}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        border: 'none',
                                                        background: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                                        gap: '0.5rem',
                                                        padding: sidebarCollapsed ? '0.75rem 0' : '0.5rem 0.75rem',
                                                        marginBottom: '0.25rem'
                                                    }}
                                                >
                                                    <Icon name="FileBarChart" size={18} color="var(--accent)" />
                                                    {!sidebarCollapsed && <span style={{ fontWeight: '600' }}>REPORTS</span>}
                                                </button>
                                            )}

                                            {!sidebarCollapsed && isSiteAdmin && (
                                                <div style={{ marginTop: '0.25rem' }}>
                                                    <select
                                                        className="form-select"
                                                        value={currentUserId}
                                                        onChange={(e) => {
                                                            setCurrentUserId(e.target.value);
                                                            setView('landing');
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            fontSize: '0.8rem',
                                                            padding: '0.4rem',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: 'var(--accent)'
                                                        }}
                                                    >
                                                        {staff.map(s => (
                                                            <option key={s.id} value={s.id}>View as: {s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {!sidebarCollapsed && <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', marginBottom: '0.5rem' }}></div>}
                                        </div>
                                        <nav style={{ flex: 1, overflowY: 'auto' }}>

                                            {/* Week Selector Section (Phase Breakdown) */}
                                            {!sidebarCollapsed && (
                                                <>
                                                    <div style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                                                                Phases / Weeks
                                                            </label>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                                {/* Offseason Phase */}
                                                                <CollapsibleCategory title="OFFSEASON" icon="Calendar" defaultOpen={false}>
                                                                    {weeks.filter(w => ["November", "December", "January", "February", "March", "April", "May"].includes(w.name)).map(w => (
                                                                        <CollapsibleCategory
                                                                            key={w.id}
                                                                            title={w.name}
                                                                            icon={w.isLocked ? "Lock" : "Calendar"}
                                                                            defaultOpen={currentWeekId === w.id}
                                                                            nested={true}
                                                                            onTitleClick={() => { setCurrentWeekId(w.id); setView('staff-meeting'); setShowManageWeekModal(false); }}
                                                                        >
                                                                            {renderWeeklyTools(w.id)}
                                                                        </CollapsibleCategory>
                                                                    ))}
                                                                </CollapsibleCategory>

                                                                {/* Summer Phase */}
                                                                <CollapsibleCategory title="SUMMER" icon="Sun" defaultOpen={false}>
                                                                    {weeks.filter(w => w.name.includes("Summer")).map(w => (
                                                                        <CollapsibleCategory
                                                                            key={w.id}
                                                                            title={w.name}
                                                                            icon={w.isLocked ? "Lock" : "Sun"}
                                                                            defaultOpen={currentWeekId === w.id}
                                                                            nested={true}
                                                                            onTitleClick={() => { setCurrentWeekId(w.id); setView('staff-meeting'); setShowManageWeekModal(false); }}
                                                                        >
                                                                            {renderWeeklyTools(w.id)}
                                                                        </CollapsibleCategory>
                                                                    ))}
                                                                </CollapsibleCategory>

                                                                {/* Pre-Season Phase */}
                                                                <CollapsibleCategory title="PRE-SEASON" icon="Zap" defaultOpen={false}>
                                                                    {weeks.filter(w => ["Family Week", "Camp Week", "First Week of Practice", "Week 0"].includes(w.name)).map(w => (
                                                                        <CollapsibleCategory
                                                                            key={w.id}
                                                                            title={`${w.name}${w.opponent ? ` - ${w.opponent}` : ''}${w.opponent && w.isHome !== undefined ? (w.isHome ? ' (H)' : ' (A)') : ''}`}
                                                                            icon={w.isLocked ? "Lock" : "Zap"}
                                                                            defaultOpen={currentWeekId === w.id}
                                                                            nested={true}
                                                                            onTitleClick={() => { setCurrentWeekId(w.id); setView('staff-meeting'); setShowManageWeekModal(false); }}
                                                                        >
                                                                            {renderWeeklyTools(w.id)}
                                                                        </CollapsibleCategory>
                                                                    ))}
                                                                </CollapsibleCategory>

                                                                {/* Season Setup */}
                                                                {/* Regular Season Phase */}
                                                                <CollapsibleCategory title="SEASON" icon="Trophy" defaultOpen={false} onTitleClick={() => setView('season-setup')}>
                                                                    {weeks.filter(w => (w.name.startsWith("Week ") && !w.name.includes("Summer") && w.name !== "Week 0") || w.name === "First Week with No Game")
                                                                        .sort((a, b) => {
                                                                            const getNum = (item) => {
                                                                                if (item.weekNum !== undefined) return item.weekNum;
                                                                                const match = item.name.match(/Week (\d+)/);
                                                                                return match ? parseInt(match[1]) : 99;
                                                                            };
                                                                            return getNum(a) - getNum(b);
                                                                        })
                                                                        .map(w => (
                                                                            <CollapsibleCategory
                                                                                key={w.id}
                                                                                title={`${w.name}${w.opponent ? ` - ${w.opponent}` : ''}${w.opponent && w.isHome !== undefined ? (w.isHome ? ' (H)' : ' (A)') : ''}`}
                                                                                icon={w.isLocked ? "Lock" : "Trophy"}
                                                                                defaultOpen={currentWeekId === w.id}
                                                                                nested={true}
                                                                                onTitleClick={() => { setCurrentWeekId(w.id); setView('staff-meeting'); setShowManageWeekModal(false); }}
                                                                            >
                                                                                {renderWeeklyTools(w.id)}
                                                                            </CollapsibleCategory>
                                                                        ))}
                                                                </CollapsibleCategory>
                                                            </div>
                                                        </div>



                                                        {/* GAME WEEK CATEGORY */}
                                                        {visibleFeatures.gameWeek?.enabled && (
                                                            <CollapsibleCategory title={`${activeYear || 'MASTER'} OFFENSE`} icon="Zap" defaultOpen={false}>
                                                                {visibleFeatures.gameWeek?.items?.offenseSetup && (
                                                                    <button className={`nav-item ${view === 'offense-setup' ? 'active' : ''}`} onClick={() => setView('offense-setup')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Settings" size={16} style={{ marginRight: '8px' }} /> Offense Setup
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.playbook && (
                                                                    <button className={`nav-item ${view === 'playbook' ? 'active' : ''}`} onClick={() => setView('playbook')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Book" size={16} style={{ marginRight: '8px' }} /> Master Playbook
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.formations && (
                                                                    <button className={`nav-item ${view === 'formations-offense' ? 'active' : ''}`} onClick={() => setView('formations-offense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="LayoutGrid" size={16} style={{ marginRight: '8px' }} /> Formations
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.glossary && (
                                                                    <button className={`nav-item ${view === 'glossary-offense' ? 'active' : ''}`} onClick={() => setView('glossary-offense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="BookOpen" size={16} style={{ marginRight: '8px' }} /> Glossary
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.drillLibrary && (
                                                                    <button className={`nav-item ${view === 'drill-library-offense' ? 'active' : ''}`} onClick={() => setView('drill-library-offense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="List" size={16} style={{ marginRight: '8px' }} /> Drill Library
                                                                    </button>
                                                                )}
                                                                <button className={`nav-item ${view === 'self-scout-offense' ? 'active' : ''}`} onClick={() => setView('self-scout-offense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                    <Icon name="FileBarChart" size={16} style={{ marginRight: '8px' }} /> Offense Self-Scout
                                                                </button>

                                                            </CollapsibleCategory>
                                                        )}



                                                        {/* DEFENSE CATEGORY */}
                                                        {visibleFeatures.gameWeek?.enabled && (
                                                            <CollapsibleCategory title={`${activeYear || 'MASTER'} DEFENSE`} icon="Shield" defaultOpen={false}>
                                                                {visibleFeatures.gameWeek?.items?.defenseSetup && (
                                                                    <button className={`nav-item ${view === 'defense-setup' ? 'active' : ''}`} onClick={() => setView('defense-setup')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Settings" size={16} style={{ marginRight: '8px' }} /> Defense Setup
                                                                    </button>
                                                                )}

                                                                {/* Weekly Depth Charts moved to Week selector above */}

                                                                {visibleFeatures.gameWeek?.items?.formations && (
                                                                    <button className={`nav-item ${view === 'formations-defense' ? 'active' : ''}`} onClick={() => setView('formations-defense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="LayoutGrid" size={16} style={{ marginRight: '8px' }} /> Formations
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.glossary && (
                                                                    <button className={`nav-item ${view === 'glossary-defense' ? 'active' : ''}`} onClick={() => setView('glossary-defense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="BookOpen" size={16} style={{ marginRight: '8px' }} /> Glossary
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.drillLibrary && (
                                                                    <button className={`nav-item ${view === 'drill-library-defense' ? 'active' : ''}`} onClick={() => setView('drill-library-defense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="List" size={16} style={{ marginRight: '8px' }} /> Drill Library
                                                                    </button>
                                                                )}
                                                                <button className={`nav-item ${view === 'self-scout-defense' ? 'active' : ''}`} onClick={() => setView('self-scout-defense')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                    <Icon name="FileBarChart" size={16} style={{ marginRight: '8px' }} /> Defense Self-Scout
                                                                </button>

                                                            </CollapsibleCategory>
                                                        )}


                                                        {/* SPECIAL TEAMS CATEGORY */}
                                                        {visibleFeatures.gameWeek?.enabled && (
                                                            <CollapsibleCategory title={`${activeYear || 'MASTER'} SPECIAL TEAMS`} icon="Compass" defaultOpen={false}>
                                                                {visibleFeatures.gameWeek?.items?.stSetup && (
                                                                    <button className={`nav-item ${view === 'st-setup' ? 'active' : ''}`} onClick={() => setView('st-setup')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Settings" size={16} style={{ marginRight: '8px' }} /> Special Teams Setup
                                                                    </button>
                                                                )}

                                                                {/* Weekly Depth Charts moved to Week selector above */}

                                                                {visibleFeatures.gameWeek?.items?.formations && (
                                                                    <button className={`nav-item ${view === 'formations-st' ? 'active' : ''}`} onClick={() => setView('formations-st')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="LayoutGrid" size={16} style={{ marginRight: '8px' }} /> Formations
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.glossary && (
                                                                    <button className={`nav-item ${view === 'glossary-st' ? 'active' : ''}`} onClick={() => setView('glossary-st')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="BookOpen" size={16} style={{ marginRight: '8px' }} /> Glossary
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.gameWeek?.items?.drillLibrary && (
                                                                    <button className={`nav-item ${view === 'drill-library-st' ? 'active' : ''}`} onClick={() => setView('drill-library-st')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="List" size={16} style={{ marginRight: '8px' }} /> Drill Library
                                                                    </button>
                                                                )}
                                                                <button className={`nav-item ${view === 'self-scout-special-teams' ? 'active' : ''}`} onClick={() => setView('self-scout-special-teams')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                    <Icon name="FileBarChart" size={16} style={{ marginRight: '8px' }} /> Special Teams Self-Scout
                                                                </button>

                                                            </CollapsibleCategory>
                                                        )}



                                                        {/* PERSONNEL CATEGORY (Moved from top) */}
                                                        {currentPermissions.staff.view && (
                                                            <CollapsibleCategory title="Personnel" icon="Users" defaultOpen={false}>
                                                                <button className={`nav-item ${view === 'staff-roster' ? 'active' : ''}`} onClick={() => setView('staff-roster')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                    <Icon name="UserCog" size={16} style={{ marginRight: '8px' }} /> Staff & Roles
                                                                </button>
                                                                {/* Player Profiles moved to top level */}
                                                                <button className={`nav-item ${view === 'roster' ? 'active' : ''}`} onClick={() => setView('roster')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                    <Icon name="Users" size={16} style={{ marginRight: '8px' }} /> Manage Roster
                                                                </button>
                                                                <button className={`nav-item ${view === 'archive' ? 'active' : ''}`} onClick={() => setView('archive')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                    <Icon name="Archive" size={16} style={{ marginRight: '8px' }} /> Archive
                                                                </button>

                                                            </CollapsibleCategory>
                                                        )}



                                                        {/* PROGRAM MANAGEMENT CATEGORY */}
                                                        {visibleFeatures.program?.enabled && (
                                                            <CollapsibleCategory title="Program Mgmt" icon="Briefcase" defaultOpen={false}>
                                                                {visibleFeatures.program?.items?.staffTasks && (
                                                                    <button className={`nav-item ${view === 'staff-tasks' ? 'active' : ''}`} onClick={() => setView('staff-tasks')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="ClipboardList" size={16} style={{ marginRight: '8px' }} /> Staff Tasks
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.program?.items?.calendar && (
                                                                    <button className={`nav-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Calendar" size={16} style={{ marginRight: '8px' }} /> Annual Calendar
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.program?.items?.budget && (
                                                                    <button className={`nav-item ${view === 'budget' ? 'active' : ''}`} onClick={() => setView('budget')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="DollarSign" size={16} style={{ marginRight: '8px' }} /> Budget
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.program?.items?.culturalCalibration && (
                                                                    <button className={`nav-item ${view === 'culturalCalibration' ? 'active' : ''}`} onClick={() => setView('culturalCalibration')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Heart" size={16} style={{ marginRight: '8px' }} /> Culture Calibration
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.program?.items?.onboarding && (
                                                                    <button className={`nav-item ${view === 'onboarding' ? 'active' : ''}`} onClick={() => setView('onboarding')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="UserPlus" size={16} style={{ marginRight: '8px' }} /> Onboarding
                                                                    </button>
                                                                )}
                                                                <CollapsibleCategory title="Equipment & Inv." icon="Package" defaultOpen={false} nested={true}>
                                                                    {visibleFeatures.program?.items?.equipmentCheckout && (
                                                                        <button className={`nav-item ${view === 'equipment-checkout' ? 'active' : ''}`} onClick={() => setView('equipment-checkout')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                            <Icon name="ClipboardCheck" size={16} style={{ marginRight: '8px' }} /> Checkout Form
                                                                        </button>
                                                                    )}
                                                                    {visibleFeatures.program?.items?.jerseyLottery && (
                                                                        <button className={`nav-item ${view === 'equipment-lottery' ? 'active' : ''}`} onClick={() => setView('equipment-lottery')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                            <Icon name="Trophy" size={16} style={{ marginRight: '8px' }} /> Jersey Lottery
                                                                        </button>
                                                                    )}
                                                                    {visibleFeatures.program?.items?.equipmentInventory && (
                                                                        <button className={`nav-item ${view === 'equipment-inventory' ? 'active' : ''}`} onClick={() => setView('equipment-inventory')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                            <Icon name="List" size={16} style={{ marginRight: '8px' }} /> Current Inventory
                                                                        </button>
                                                                    )}
                                                                    {visibleFeatures.program?.items?.equipmentWishlist && (
                                                                        <button className={`nav-item ${view === 'equipment-wishlist' ? 'active' : ''}`} onClick={() => setView('equipment-wishlist')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                            <Icon name="ShoppingCart" size={16} style={{ marginRight: '8px' }} /> Wishlist / Needs
                                                                        </button>
                                                                    )}
                                                                </CollapsibleCategory>

                                                            </CollapsibleCategory>
                                                        )}

                                                        {/* MOBILE/TABLET APPS CATEGORY */}
                                                        {visibleFeatures.apps?.enabled && (
                                                            <CollapsibleCategory title="Mobile/Tablet App" icon="Smartphone" defaultOpen={false}>
                                                                {visibleFeatures.apps?.items?.playerApp && (
                                                                    <button
                                                                        className={`nav-item ${view === 'player-app' ? 'active' : ''}`}
                                                                        onClick={() => setView('player-app')}
                                                                        style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                                                                    >
                                                                        <Icon name="Smartphone" size={16} style={{ marginRight: '8px' }} /> Player App Preview
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.apps?.items?.attendanceApp && (
                                                                    <button
                                                                        className={`nav-item ${view === 'attendance-app' ? 'active' : ''}`}
                                                                        onClick={() => setView('attendance-app')}
                                                                        style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                                                                    >
                                                                        <Icon name="UserCheck" size={16} style={{ marginRight: '8px' }} /> Attendance App
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.apps?.items?.coachApp && (
                                                                    <button
                                                                        className={`nav-item ${view === 'coach-app' ? 'active' : ''}`}
                                                                        onClick={() => setView('coach-app')}
                                                                        style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                                                                    >
                                                                        <Icon name="Clipboard" size={16} style={{ marginRight: '8px' }} /> Practice Coach App
                                                                    </button>
                                                                )}

                                                                {/* ATHLETIC DEVELOPMENT CATEGORY */}
                                                                <div>

                                                                    {visibleFeatures.apps?.items?.simulator && (
                                                                        <button
                                                                            className={`nav-item ${view === 'simulator' ? 'active' : ''}`}
                                                                            onClick={() => setView('simulator')}
                                                                            style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                                                                        >
                                                                            <Icon name="Gamepad2" size={16} style={{ marginRight: '8px' }} /> Play-Calling Simulator
                                                                        </button>
                                                                    )}
                                                                    {visibleFeatures.apps?.items?.pressbox && (
                                                                        <button className={`nav-item ${view === 'pressbox' ? 'active' : ''}`} onClick={() => setView('pressbox')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                            <Icon name="Monitor" size={16} style={{ marginRight: '8px' }} /> Pressbox
                                                                        </button>
                                                                    )}

                                                                    {visibleFeatures.apps?.items?.specialTeams && (
                                                                        <button className={`nav-item ${view === 'special-teams' ? 'active' : ''}`} onClick={() => setView('special-teams')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                            <Icon name="Target" size={16} style={{ marginRight: '8px' }} /> Special Teams
                                                                        </button>
                                                                    )}
                                                                </div>

                                                            </CollapsibleCategory>
                                                        )}

                                                        {currentPermissions.dashboard.view && (
                                                            <button
                                                                className={`nav-item ${view === 'print-hub' ? 'active' : ''}`}
                                                                onClick={() => setView('print-hub')}
                                                                style={{
                                                                    width: '100%',
                                                                    textAlign: 'left',
                                                                    border: 'none',
                                                                    background: 'none',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                                                    gap: '0.75rem',
                                                                    padding: sidebarCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                                                                    marginBottom: '0.5rem'
                                                                }}
                                                            >
                                                                <Icon name="Printer" size={18} color="var(--accent)" />
                                                                {!sidebarCollapsed && <span style={{ fontWeight: '600' }}>PRINT CENTER</span>}
                                                            </button>
                                                        )}

                                                        {/* ATHLETIC DEVELOPMENT CATEGORY */}
                                                        {visibleFeatures.development?.enabled && (
                                                            <CollapsibleCategory title="Player Development" icon="Activity" defaultOpen={false}>
                                                                {visibleFeatures.development?.items?.testing && (
                                                                    <button className={`nav-item ${view === 'testing' ? 'active' : ''}`} onClick={() => setView('testing')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Timer" size={16} style={{ marginRight: '8px' }} /> Combine / Testing
                                                                    </button>
                                                                )}

                                                                {visibleFeatures.development?.items?.ironman && (
                                                                    <button className={`nav-item ${view === 'ironman' ? 'active' : ''}`} onClick={() => setView('ironman')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Dumbbell" size={16} style={{ marginRight: '8px' }} /> Iron Man
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.development?.items?.ratings && (
                                                                    <button className={`nav-item ${view === 'ratings' ? 'active' : ''}`} onClick={() => setView('ratings')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Gamepad2" size={16} style={{ marginRight: '8px' }} /> Impact Ratings
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.development?.items?.summerComp && (
                                                                    <button className={`nav-item ${view === 'summer-comp' ? 'active' : ''}`} onClick={() => setView('summer-comp')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Trophy" size={16} style={{ marginRight: '8px' }} /> Summer Competition
                                                                    </button>
                                                                )}

                                                                {visibleFeatures.development?.items?.testingRecords && (
                                                                    <button className={`nav-item ${view === 'testing-records' ? 'active' : ''}`} onClick={() => setView('testing-records')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Trophy" size={16} style={{ marginRight: '8px' }} /> Program Records
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.development?.items?.selfAssessment && (
                                                                    <button className={`nav-item ${view === 'self-assessment' ? 'active' : ''}`} onClick={() => setView('self-assessment')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="ClipboardCheck" size={16} style={{ marginRight: '8px' }} /> Self-Assessment
                                                                    </button>
                                                                )}
                                                                {visibleFeatures.development?.items?.multiSport && (
                                                                    <button className={`nav-item ${view === 'multi-sport' ? 'active' : ''}`} onClick={() => setView('multi-sport')} style={{ paddingLeft: '2rem', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                                                                        <Icon name="Activity" size={16} style={{ marginRight: '8px' }} /> Multi-Sport Tracking
                                                                    </button>
                                                                )}
                                                            </CollapsibleCategory>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {/* EQUIPMENT CATEGORY */}


                                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {(currentUser?.roles?.includes('Head Coach') || currentUser?.roles?.includes('Team Admin')) && (
                                                    <button
                                                        className={`nav-item ${view === 'settings' ? 'active' : ''}`}
                                                        onClick={() => setView('settings')}
                                                        style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '0.75rem 0' : '0.5rem 1rem' }}
                                                    >
                                                        <Icon name="Settings" size={16} />
                                                        {!sidebarCollapsed && <span style={{ marginLeft: '8px' }}>Settings</span>}
                                                    </button>
                                                )}
                                                {currentUser && currentUser.roles && currentUser.roles.includes('Head Coach') && (
                                                    <button
                                                        className={`nav-item ${view === 'permissions' ? 'active' : ''}`}
                                                        onClick={() => setView('permissions')}
                                                        style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '0.75rem 0' : '0.5rem 1rem', color: 'var(--text-secondary)' }}
                                                    >
                                                        <Icon name="Lock" size={16} />
                                                        {!sidebarCollapsed && <span style={{ marginLeft: '8px' }}>Permissions</span>}
                                                    </button>
                                                )}
                                                <button
                                                    className={`nav-item ${view === 'help' ? 'active' : ''}`}
                                                    onClick={() => setView('help')}
                                                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '0.75rem 0' : '0.5rem 1rem' }}
                                                >
                                                    <Icon name="HelpCircle" size={16} />
                                                    {!sidebarCollapsed && <span style={{ marginLeft: '8px' }}>How to Use</span>}
                                                </button>
                                                <button
                                                    className="nav-item"
                                                    onClick={() => setShowLogoutConfirm(true)}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        border: 'none',
                                                        background: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                                        padding: sidebarCollapsed ? '0.75rem 0' : '0.5rem 1rem',
                                                        color: 'var(--danger)',
                                                        opacity: 0.8
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                                                    onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
                                                >
                                                    <Icon name="LogOut" size={16} />
                                                    {!sidebarCollapsed && <span style={{ marginLeft: '8px' }}>Log Out</span>}
                                                </button>
                                            </div>
                                        </nav>
                                    </div >

                                    <main className="main-content">
                                        {view === 'staff-meeting' && (
                                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto', padding: '1rem' }}>
                                                {/* Header */}
                                                <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Icon name="LayoutDashboard" size={28} />
                                                            {currentWeek.name} Dashboard
                                                        </h2>
                                                        <button
                                                            className="btn"
                                                            onClick={() => setShowManageWeekModal(true)}
                                                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            <Icon name="Settings" size={18} />
                                                            Manage Week
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Week</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{currentWeek.name}</div>
                                                        </div>
                                                        {currentWeek.opponent && (
                                                            <div>
                                                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Opponent</div>
                                                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{currentWeek.opponent}</div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Practice Plans</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{currentWeek.practicePlans?.length || 0}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Active Players</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{roster.filter(p => p.status === 'Active').length}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quick Links */}
                                                <div className="card" style={{ padding: '1.5rem' }}>
                                                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Icon name="Zap" size={20} />
                                                        Quick Links
                                                    </h3>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        <button onClick={() => setView('practice')} className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <Icon name="Megaphone" size={18} style={{ color: 'var(--text-primary)' }} />
                                                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>Practice Plans</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View and edit practice schedules</div>
                                                        </button>
                                                        <button onClick={() => setView('install-manager')} className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <Icon name="Layers" size={18} style={{ color: 'var(--text-primary)' }} />
                                                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>Install Manager</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage weekly installations</div>
                                                        </button>
                                                        <button onClick={() => setView('scouting')} className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <Icon name="Search" size={18} style={{ color: 'var(--text-primary)' }} />
                                                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>Scouting</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Scout opponent tendencies</div>
                                                        </button>
                                                        <button onClick={() => { setView('depth'); setDepthChartType('OFFENSE'); }} className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <Icon name="Users" size={18} style={{ color: 'var(--text-primary)' }} />
                                                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>Depth Charts</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage player positions</div>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Task Management Columns */}
                                                {(() => {
                                                    // Use top-level state (hooks are at component level)
                                                    const weeklyLists = {
                                                        today: weeklyToday,
                                                        thisWeek: weeklyThisWeek,
                                                        thisMonth: weeklyThisMonth,
                                                        someday: weeklySomeday
                                                    };

                                                    const weeklySetters = {
                                                        today: setWeeklyToday,
                                                        thisWeek: setWeeklyThisWeek,
                                                        thisMonth: setWeeklyThisMonth,
                                                        someday: setWeeklySomeday
                                                    };

                                                    const addTaskItem = (col, text) => {
                                                        if (!text?.trim()) return;
                                                        weeklySetters[col]([...weeklyLists[col], text.trim()]);
                                                        setWeeklyTaskInputs(prev => ({ ...prev, [col]: '' }));
                                                    };

                                                    const handleTaskDragOver = (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    };

                                                    const handleTaskDrop = (e, targetCol, targetIndex = null) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (!weeklyDraggedTask) return;

                                                        const { type: sourceCol, index: sourceIndex, item } = weeklyDraggedTask;

                                                        // Remove from source
                                                        const sourceList = weeklyLists[sourceCol];
                                                        const newSourceList = sourceList.filter((_, i) => i !== sourceIndex);
                                                        weeklySetters[sourceCol](newSourceList);

                                                        // Add to target
                                                        const targetList = weeklyLists[targetCol];
                                                        if (targetIndex !== null) {
                                                            const newTargetList = [...targetList];
                                                            newTargetList.splice(targetIndex, 0, item);
                                                            weeklySetters[targetCol](newTargetList);
                                                        } else {
                                                            weeklySetters[targetCol]([...targetList, item]);
                                                        }

                                                        setWeeklyDraggedTask(null);
                                                    };

                                                    return (
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                                            {['today', 'thisWeek', 'thisMonth', 'someday'].map(col => {
                                                                const titleMap = { today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month', someday: 'Someday' };
                                                                const taskList = weeklyLists[col];

                                                                return (
                                                                    <div
                                                                        key={col}
                                                                        className="card"
                                                                        style={{ display: 'flex', flexDirection: 'column', minHeight: '400px', background: 'var(--surface)', border: '1px solid var(--border)' }}
                                                                        onDragOver={handleTaskDragOver}
                                                                        onDrop={(e) => handleTaskDrop(e, col)}
                                                                    >
                                                                        <h3 style={{ fontSize: '1.1rem', padding: '0 1rem 0.5rem 1rem', borderBottom: '2px solid var(--accent)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                                                            {titleMap[col]}
                                                                            <span style={{ fontSize: '1rem', opacity: 0.7, fontWeight: 'normal' }}>{taskList.length}</span>
                                                                        </h3>

                                                                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', minHeight: '200px' }}>
                                                                            {taskList.map((item, idx) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    draggable
                                                                                    onDragStart={(e) => {
                                                                                        setWeeklyDraggedTask({ type: col, index: idx, item });
                                                                                        e.dataTransfer.effectAllowed = "move";
                                                                                    }}
                                                                                    onDragOver={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                    }}
                                                                                    onDrop={(e) => handleTaskDrop(e, col, idx)}
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
                                                                                            const newList = taskList.filter((_, i) => i !== idx);
                                                                                            weeklySetters[col](newList);
                                                                                        }}
                                                                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                                                                    >
                                                                                        <Icon name="X" size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                                                                            <input
                                                                                className="form-input"
                                                                                style={{ fontSize: '0.9rem', padding: '0.75rem' }}
                                                                                placeholder="Add item..."
                                                                                value={weeklyTaskInputs[col] || ''}
                                                                                onChange={e => setWeeklyTaskInputs(prev => ({ ...prev, [col]: e.target.value }))}
                                                                                onKeyDown={e => e.key === 'Enter' && addTaskItem(col, weeklyTaskInputs[col])}
                                                                            />
                                                                            <button className="btn-sm btn-primary" onClick={() => addTaskItem(col, weeklyTaskInputs[col])} style={{ padding: '0 0.5rem' }}>
                                                                                <Icon name="Plus" size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        {view === 'director-ops' && <DirectorOpsView dutyAssignments={dutyAssignments} staff={staff} currentWeek={currentWeek} currentUser={currentUser} positionFatigue={positionFatigue} setPositionFatigue={setPositionFatigue} />}
                                        {view === 'landing' && <ProgramDashboard currentWeek={currentWeek} roster={roster} inventory={inventory} attendance={attendance} checkouts={checkouts} equipmentDueDate={equipmentDueDate} userRole={(currentUser?.roles && currentUser.roles[0]) || 'Head Coach'} permissions={currentPermissions.dashboard} masterTasks={masterTasks} depthChart={depthChart} onUpdateTask={(updatedTask) => {
                                            setMasterTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
                                        }} />}
                                        {view === 'reports' && <ReportsView roster={roster} attendance={attendance} setAttendance={setAttendance} permissions={currentPermissions.dashboard} />}
                                        {view === 'print-hub' && <PrintHubView roster={roster} staff={staff} gamePlans={currentWeek.offensiveGamePlan} depthChart={depthChart} practicePlans={currentWeek.practicePlans} attendance={attendance} wbSettings={wbSettings} setWbSettings={setWbSettings} plays={plays} drills={drills} />}
                                        {view === 'drill-library-offense' && <DrillLibraryView phase="OFFENSE" drills={drills} onAddDrill={handleAddDrill} />}
                                        {view === 'drill-library-defense' && <DrillLibraryView phase="DEFENSE" drills={drills} onAddDrill={handleAddDrill} />}
                                        {view === 'drill-library-st' && <DrillLibraryView phase="SPECIAL_TEAMS" drills={drills} onAddDrill={handleAddDrill} />}

                                        {view === 'permissions' && <PermissionsView permissions={permissions} onUpdatePermissions={setPermissions} onResetDefaults={() => setPermissions(DEFAULT_PERMISSIONS)} />}

                                        {view === 'scouting' && <ScoutingView data={opponentScoutData} onUpdate={setOpponentScoutData} roster={roster} />}
                                        {view === 'glossary-offense' && <GlossaryView phase="OFFENSE" />}
                                        {view === 'glossary-defense' && <GlossaryView phase="DEFENSE" />}
                                        {view === 'glossary-st' && <GlossaryView phase="SPECIAL_TEAMS" />}
                                        {view === 'multi-sport' && <MultiSportTrackingView roster={roster} onUpdateRoster={setRoster} />}
                                        {view === 'dashboard' && <GamedayDashboard plays={plays} />}
                                        {view === 'calendar' && <StaffCalendar data={calendarData} onUpdate={setCalendarData} staff={staff} roster={roster} tasks={masterTasks} onUpdateTasks={setMasterTasks} />}
                                        {view === 'season-setup' && <SeasonSetupView weeks={weeks} onUpdateWeek={handleUpdateWeek} onAddWeek={handleAddWeek} onDeleteWeek={handleDeleteWeek} />}
                                        {view === 'budget' && (
                                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto', padding: '1rem' }}>
                                                {/* Financial Overview */}
                                                <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white' }}>
                                                    <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Icon name="DollarSign" size={28} />
                                                        Program Budget Overview
                                                    </h2>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Account Balance</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${budgetData.accountBalance.toLocaleString()}</div>
                                                            <input type="number" value={budgetData.accountBalance} onChange={(e) => setBudgetData({ ...budgetData, accountBalance: parseFloat(e.target.value) || 0 })} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', width: '150px' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Planned Expenditures</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fca5a5' }}>-${totalExpenditures.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Booster Commitments</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#86efac' }}>+${totalCommitments.toLocaleString()}</div>
                                                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Received: ${receivedCommitments.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Projected Fundraiser Revenue</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#86efac' }}>+${totalProjectedFundraiser.toLocaleString()}</div>
                                                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Actual: ${totalActualFundraiser.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Projected Balance</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: projectedBalance >= 0 ? '#86efac' : '#fca5a5' }}>${projectedBalance.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Wishlist Total</div>
                                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', opacity: 0.7 }}>${totalWishlist.toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section Tabs */}
                                                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
                                                    {['expenditures', 'fundraisers', 'wishlist'].map(section => (
                                                        <button key={section} onClick={() => setBudgetActiveSection(section)} style={{ padding: '0.75rem 1.5rem', border: 'none', background: budgetActiveSection === section ? 'var(--primary)' : 'var(--surface)', color: budgetActiveSection === section ? 'white' : 'var(--text)', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: budgetActiveSection === section ? 'bold' : 'normal', textTransform: 'capitalize' }}>
                                                            {section}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Expenditures Section */}
                                                {budgetActiveSection === 'expenditures' && (
                                                    <div className="card" style={{ padding: '1.5rem' }}>
                                                        <h3 style={{ margin: '0 0 1rem 0' }}><Icon name="ShoppingCart" size={20} /> Planned Expenditures</h3>
                                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                                                            <h4 style={{ margin: '0 0 1rem 0' }}>Add New Expenditure</h4>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                                                <input className="form-input" placeholder="Item Name" value={budgetNewItem.name || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, name: e.target.value })} />
                                                                <select className="form-input" value={budgetNewItem.category || 'Equipment'} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, category: e.target.value })}>
                                                                    <option>Equipment</option><option>Travel</option><option>Facilities</option><option>Uniforms</option><option>Technology</option><option>Other</option>
                                                                </select>
                                                                <input className="form-input" type="number" placeholder="Amount" value={budgetNewItem.amount || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, amount: e.target.value })} />
                                                                <select className="form-input" value={budgetNewItem.priority || 'Medium'} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, priority: e.target.value })}>
                                                                    <option>High</option><option>Medium</option><option>Low</option>
                                                                </select>
                                                                <select className="form-input" value={budgetNewItem.status || 'Planned'} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, status: e.target.value })}>
                                                                    <option>Planned</option><option>Approved</option><option>Purchased</option>
                                                                </select>
                                                                <input className="form-input" type="date" value={budgetNewItem.dueDate || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, dueDate: e.target.value })} />
                                                                <input className="form-input" placeholder="Notes" value={budgetNewItem.notes || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, notes: e.target.value })} style={{ gridColumn: 'span 2' }} />
                                                                <button className="btn-primary" onClick={() => { setBudgetData({ ...budgetData, expenditures: [...budgetData.expenditures, { id: Date.now().toString(), name: budgetNewItem.name || '', category: budgetNewItem.category || 'Equipment', amount: parseFloat(budgetNewItem.amount) || 0, priority: budgetNewItem.priority || 'Medium', status: budgetNewItem.status || 'Planned', dueDate: budgetNewItem.dueDate || '', notes: budgetNewItem.notes || '' }] }); setBudgetNewItem({}); }}>Add</button>
                                                            </div>
                                                        </div>
                                                        <div style={{ overflowX: 'auto' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                <thead>
                                                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Item</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Priority</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Due Date</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Notes</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {budgetData.expenditures.length === 0 ? (
                                                                        <tr><td colSpan="8" style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>No expenditures planned</td></tr>
                                                                    ) : (
                                                                        budgetData.expenditures.map(exp => (
                                                                            <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                                <td style={{ padding: '0.75rem' }}><input className="form-input" value={exp.name} onChange={(e) => setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.map(e => e.id === exp.id ? { ...e, name: e.target.v } : e) })} style={{ minWidth: '150px' }} /></td>
                                                                                <td style={{ padding: '0.75rem' }}><select clase="put" value={exp.category} onChange={(e) => setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.map(e => e.id === exp.id ? { ...e, category: e.target.value } : e) })}><option>Equipment</option><option>Travel</option><option>Facilities</option><option>Uniforms</option><option>Technology</option><option>Other</option></select></td>
                                                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}><input className="form-input" type="number" value={exp.amount} onChange={(e) => setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.map(e => e.id === exp.id ? { ...e, amount: parseFloat(e.target.value) || 0 } : e) })} style={{ width: '100px', textAlign: 'right' }} /></td>
                                                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}><select className="form-input" value={exp.priority} onChange={(e) => setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.map(e => e.id === exp.id ? { ...e, priority: e.target.value } : e) })} style={{ background: getPriorityColor(exp.priority), color: 'white', fontWeight: 'bold' }}><option>High</option><option>Medium</option><option>Low</option></select></td>
                                                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}><select className="form-input" value={exp.status} onChange={(e) => setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.map(e => e.id === exp.id ? { ...e, status: e.target.value } : e) })} style={{ background: getStatusColor(exp.status), color: 'white', fontWeight: 'bold' }}><option>Planned</option><option>Approved</option><option>Purchased</option></select></td>
                                                                                <td style={{ padding: '0.75rem' }}><input className="form-input" type="date" value={exp.dueDate} onChange={(e) => setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.map(e => e.id === exp.id ? { ...e, dueDate: e.target.value } : e) })} /></td>
                                                                                <td style={{ padding: '0.75rem' }}><input className="form-input" value={exp.notes} onChange={(e) => setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.map(e => e.id === exp.id ? { ...e, notes: e.target.value } : e) })} style={{ minWidth: '150px' }} /></td>
                                                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}><button onClick={() => confirm('Delete?') && setBudgetData({ ...budgetData, expenditures: budgetData.expenditures.filter(e => e.id !== exp.id) })} style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Icon name="Trash2" size={14} /></button></td>
                                                                            </tr>
                                                                        ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>Total: ${totalExpenditures.toLocaleString()}</div>
                                                    </div>
                                                )}

                                                {/* Wishlist Section */}
                                                {budgetActiveSection === 'wishlist' && (
                                                    <div className="card" style={{ padding: '1.5rem' }}>
                                                        <h3 style={{ margin: '0 0 1rem 0' }}><Icon name="Gift" size={20} /> Equipment Wishlist</h3>

                                                        {/* Add New Item */}
                                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                                                            <h4 style={{ margin: '0 0 1rem 0' }}>Add Wishlist Item</h4>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                                                <input className="form-input" placeholder="Item Name" value={budgetNewItem.name || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, name: e.target.value })} />
                                                                <input className="form-input" type="number" placeholder="Est. Cost" value={budgetNewItem.estimatedCost || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, estimatedCost: e.target.value })} />
                                                                <select className="form-input" value={budgetNewItem.priority || 'Medium'} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, priority: e.target.value })}>
                                                                    <option>High</option><option>Medium</option><option>Low</option>
                                                                </select>
                                                                <input className="form-input" placeholder="Link / URL" value={budgetNewItem.link || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, link: e.target.value })} />
                                                                <input className="form-input" placeholder="Notes" value={budgetNewItem.notes || ''} onChange={(e) => setBudgetNewItem({ ...budgetNewItem, notes: e.target.value })} style={{ gridColumn: 'span 2' }} />
                                                                <button className="btn-primary" onClick={() => { setBudgetData({ ...budgetData, budgetWishlist: [...budgetData.budgetWishlist, { id: Date.now().toString(), name: budgetNewItem.name || '', estimatedCost: parseFloat(budgetNewItem.estimatedCost) || 0, priority: budgetNewItem.priority || 'Medium', link: budgetNewItem.link || '', notes: budgetNewItem.notes || '' }] }); setBudgetNewItem({}); }}>Add</button>
                                                            </div>
                                                        </div>

                                                        {/* List */}
                                                        <div style={{ overflowX: 'auto' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                <thead>
                                                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Item</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Est. Cost</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Priority</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Link</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Notes</th>
                                                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {budgetData.budgetWishlist.length === 0 ? (
                                                                        <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>No items in wishlist</td></tr>
                                                                    ) : (
                                                                        budgetData.budgetWishlist.map(item => (
                                                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                                <td style={{ padding: '0.75rem' }}><input className="form-input" value={item.name} onChange={(e) => setBudgetData({ ...budgetData, budgetWishlist: budgetData.budgetWishlist.map(i => i.id === item.id ? { ...i, name: e.target.value } : i) })} /></td>
                                                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}><input className="form-input" type="number" value={item.estimatedCost} onChange={(e) => setBudgetData({ ...budgetData, budgetWishlist: budgetData.budgetWishlist.map(i => i.id === item.id ? { ...i, estimatedCost: parseFloat(e.target.value) || 0 } : i) })} style={{ width: '100px', textAlign: 'right' }} /></td>
                                                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                                    <select className="form-input" value={item.priority} onChange={(e) => setBudgetData({ ...budgetData, budgetWishlist: budgetData.budgetWishlist.map(i => i.id === item.id ? { ...i, priority: e.target.value } : i) })} style={{ background: getPriorityColor(item.priority), color: 'white', fontWeight: 'bold' }}>
                                                                                        <option>High</option><option>Medium</option><option>Low</option>
                                                                                    </select>
                                                                                </td>
                                                                                <td style={{ padding: '0.75rem' }}>
                                                                                    <input className="form-input" value={item.link} onChange={(e) => setBudgetData({ ...budgetData, budgetWishlist: budgetData.budgetWishlist.map(i => i.id === item.id ? { ...i, link: e.target.value } : i) })} placeholder="URL" />
                                                                                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--accent)' }}><Icon name="ExternalLink" size={12} /> Open</a>}
                                                                                </td>
                                                                                <td style={{ padding: '0.75rem' }}><input className="form-input" value={item.notes} onChange={(e) => setBudgetData({ ...budgetData, budgetWishlist: budgetData.budgetWishlist.map(i => i.id === item.id ? { ...i, notes: e.target.value } : i) })} /></td>
                                                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                                    <button onClick={() => confirm('Delete?') && setBudgetData({ ...budgetData, budgetWishlist: budgetData.budgetWishlist.filter(i => i.id !== item.id) })} style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Icon name="Trash2" size={14} /></button>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>Total Est. Cost: ${totalWishlist.toLocaleString()}</div>
                                                    </div>
                                                )}

                                                {/* Fundraisers Placeholder */}
                                                {budgetActiveSection === 'fundraisers' && (
                                                    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                        <h3>Fundraisers section coming soon...</h3>
                                                        <p>This section will allow you to manage fundraisers.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {view === 'culturalCalibration' && (
                                            <CulturalCalibration
                                                culturalCalibration={culturalCalibration}
                                                setCulturalCalibration={setCulturalCalibration}
                                                currentPermissions={currentPermissions}
                                                authUser={authUser}
                                            />
                                        )}

                                        {
                                            view === 'onboarding' && (
                                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto', padding: '1rem' }}>
                                                    {/* Header */}
                                                    <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white' }}>
                                                        <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Icon name="UserPlus" size={28} />
                                                            Onboarding Dashboard
                                                        </h2>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total People</div>
                                                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalPeople}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Fully Complete</div>
                                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#86efac' }}>{fullyCompleted}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>In Progress</div>
                                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fcd34d' }}>{inProgress}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Not Started</div>
                                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fca5a5' }}>{notStarted}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Filter */}
                                                    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0' }}>
                                                        <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Filter:</span>
                                                        {['All', 'Player', 'Coach', 'Manager'].map(role => (
                                                            <button key={role} onClick={() => setOnboardingRoleFilter(role)} style={{ padding: '0.5rem 1rem', border: 'none', background: onboardingRoleFilter === role ? 'var(--primary)' : 'var(--surface)', color: onboardingRoleFilter === role ? 'white' : 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontWeight: onboardingRoleFilter === role ? 'bold' : 'normal' }}>
                                                                {role}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* People List */}
                                                    <div className="card" style={{ padding: '1.5rem' }}>
                                                        <h3 style={{ margin: '0 0 1rem 0' }}>People ({filteredPeople.length})</h3>
                                                        {filteredPeople.length === 0 ? (
                                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                                No people found. Add players to your roster or staff members to see them here.
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                                {filteredPeople.map(person => {
                                                                    const stats = getCompletionStats(person);
                                                                    const statusColor = stats.percentage === 100 ? '#10b981' : stats.percentage > 0 ? '#f59e0b' : '#6b7280';
                                                                    return (
                                                                        <div key={person.id} className="card" style={{ padding: '1rem', background: 'var(--surface)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setOnboardingSelectedPerson(person)}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                                                <div>
                                                                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{person.name}</div>
                                                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{person.role}</div>
                                                                                </div>
                                                                                <div style={{ textAlign: 'right' }}>
                                                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: statusColor }}>{stats.percentage}%</div>
                                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stats.completed}/{stats.total} complete</div>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ background: 'var(--background)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                                                                                <div style={{ width: `${stats.percentage}%`, height: '100%', background: statusColor, transition: 'width 0.3s' }}></div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Detail Modal */}
                                                    {onboardingSelectedPerson && (() => {
                                                        const personData = getPersonOnboardingData(onboardingSelectedPerson.id, onboardingSelectedPerson.role);
                                                        return (
                                                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setOnboardingSelectedPerson(null)}>
                                                                <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', padding: '2rem', background: 'var(--background)' }} onClick={(e) => e.stopPropagation()}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                                        <div>
                                                                            <h2 style={{ margin: 0 }}>{onboardingSelectedPerson.name}</h2>
                                                                            <div style={{ color: 'var(--text-secondary)' }}>{onboardingSelectedPerson.role}</div>
                                                                        </div>
                                                                        <button onClick={() => setOnboardingSelectedPerson(null)} style={{ padding: '0.5rem', background: 'var(--surface)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                                                            <Icon name="X" size={20} />
                                                                        </button>
                                                                    </div>

                                                                    <div style={{ marginBottom: '1.5rem' }}>
                                                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getCompletionStats(onboardingSelectedPerson).percentage === 100 ? '#10b981' : '#f59e0b' }}>
                                                                            {getCompletionStats(onboardingSelectedPerson).percentage}% Complete
                                                                        </div>
                                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                                            {getCompletionStats(onboardingSelectedPerson).completed} of {getCompletionStats(onboardingSelectedPerson).total} items completed
                                                                        </div>
                                                                    </div>

                                                                    <h3 style={{ marginBottom: '1rem' }}>Onboarding Checklist</h3>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                                        {getRequiredItems(onboardingSelectedPerson.role).map(itemKey => {
                                                                            const item = personData[itemKey] || { completed: false, dateCompleted: null, notes: '' };
                                                                            return (
                                                                                <div key={itemKey} className="card" style={{ padding: '1rem', background: item.completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface)' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                                                                        <input type="checkbox" checked={item.completed} onChange={(e) => updatePersonItem(onboardingSelectedPerson.id, onboardingSelectedPerson.role, itemKey, 'completed', e.target.checked)} style={{ marginTop: '0.25rem', width: '20px', height: '20px', cursor: 'pointer' }} />
                                                                                        <div style={{ flex: 1 }}>
                                                                                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', textDecoration: item.completed ? 'line-through' : 'none' }}>
                                                                                                {getItemLabel(itemKey)}
                                                                                            </div>
                                                                                            {item.completed && item.dateCompleted && (
                                                                                                <div style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: '0.5rem' }}>
                                                                                                    ✓ Completed on {new Date(item.dateCompleted).toLocaleDateString()}
                                                                                                </div>
                                                                                            )}
                                                                                            <input className="form-input" placeholder="Notes (optional)" value={item.notes} onChange={(e) => updatePersonItem(onboardingSelectedPerson.id, onboardingSelectedPerson.role, itemKey, 'notes', e.target.value)} style={{ fontSize: '0.9rem', marginTop: '0.5rem' }} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    <div style={{ marginTop: '1.5rem' }}>
                                                                        <button className="btn-primary" onClick={() => setOnboardingSelectedPerson(null)} style={{ width: '100%' }}>Close</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )
                                        }



                                        {view === 'offense-setup' && renderSetup('OFFENSE')}
                                        {view === 'defense-setup' && renderSetup('DEFENSE')}
                                        {view === 'st-setup' && renderSetup('SPECIAL_TEAMS')}

                                        {
                                            view === 'new-play' && (
                                                <PlayInput
                                                    onSave={handleSavePlay}
                                                    onCancel={() => { setEditingPlay(null); setView('playbook'); }}
                                                    onDelete={handleDeletePlay}
                                                    initialData={editingPlay}
                                                    rooskiLibrary={rooskiLibrary}
                                                    setRooskiLibrary={setRooskiLibrary}
                                                    positionNames={positionNames}
                                                    formations={formations}
                                                    playSyntax={playSyntax}
                                                    termLibrary={termLibrary}
                                                    programLevels={programLevels}
                                                    drills={drills}
                                                />
                                            )
                                        }

                                        {view === 'install-manager' && <InstallManagerView plays={plays} week={currentWeek} weeks={weeks} currentWeekId={currentWeekId} onUpdateWeek={handleUpdateWeek} gamePlan={currentWeek.offensiveGamePlan} practicePlans={currentWeek.practicePlans} wbSettings={wbSettings} drills={drills} onQuickAddPlay={handleQuickAddPlay} playSyntax={playSyntax} onUpdatePlay={handlePatchPlay} gamePlanLayouts={gamePlanLayouts} />}
                                        {view === 'game-plan' && <OffensiveGamePlan plays={plays} weekDate={currentWeek.date} gamePlan={currentWeek.offensiveGamePlan} practicePlans={currentWeek.practicePlans} onUpdateGamePlan={(updated) => handleUpdateWeek(currentWeek.id, 'offensiveGamePlan', updated)} onQuickAddPlay={handleQuickAddPlay} onUpdatePlay={handlePatchPlay} gamePlanLayouts={gamePlanLayouts} onUpdateLayouts={(newLayouts) => {
                                            setGamePlanLayouts(newLayouts);
                                            // Auto-add focus items involved in the layout
                                            if (newLayouts?.CALL_SHEET?.sections) {
                                                newLayouts.CALL_SHEET.sections.forEach(section => {
                                                    if (section.boxes) {
                                                        section.boxes.forEach(box => {
                                                            if (box.header) addCustomFocusItem(box.header);
                                                        });
                                                    }
                                                });
                                            }
                                        }} isLocked={currentWeek.isLocked} layoutVersions={layoutVersions} onSaveLayoutVersion={saveLayoutVersion} onDeleteLayoutVersion={deleteLayoutVersion} onLoadLayoutVersion={loadLayoutVersion} wbSettings={wbSettings} drills={drills} newInstallIds={currentWeek.newInstallIds} onUpdateWeek={handleUpdateWeek} />}

                                        {
                                            view === 'playbook' && (
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                        <h2>Master Playbook ({filteredPlaybook.length} / {plays.length})</h2>
                                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                                            {selectedPlays.length > 0 && (
                                                                <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }} onClick={handleDeleteSelected}>
                                                                    <Icon name="Trash2" /> Delete Selected ({selectedPlays.length})
                                                                </button>
                                                            )}
                                                            <button className="btn" style={{ backgroundColor: '#10b981', color: 'white' }} onClick={() => setIsBatchImportOpen(true)}>
                                                                <Icon name="Upload" /> Batch Add Plays
                                                            </button>
                                                            <button className="btn btn-primary" onClick={() => { setEditingPlay(null); setView('new-play'); }}>
                                                                <Icon name="PlusCircle" /> New Play
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        marginBottom: '2rem',
                                                        padding: '1.5rem',
                                                        background: 'var(--bg-panel)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '12px'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: '1.25rem',
                                                            paddingBottom: '0.75rem',
                                                            borderBottom: '1px solid var(--border)'
                                                        }}>
                                                            <h4 style={{
                                                                margin: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                color: 'var(--text-secondary)'
                                                            }}>
                                                                <Icon name="Filter" size={14} style={{ color: 'var(--accent)' }} />
                                                                Search & Filter Playbook
                                                            </h4>
                                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                                {selectedPlays.length > 0 && (
                                                                    <button
                                                                        className="btn"
                                                                        style={{
                                                                            fontSize: '0.8rem',
                                                                            padding: '0.4rem 0.8rem',
                                                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                            color: '#ef4444',
                                                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                                                        }}
                                                                        onClick={() => setSelectedPlays([])}
                                                                    >
                                                                        Clear Selection ({selectedPlays.length})
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="btn"
                                                                    style={{
                                                                        fontSize: '0.8rem',
                                                                        padding: '0.4rem 0.8rem',
                                                                        color: 'var(--accent)',
                                                                        background: 'rgba(var(--accent-rgb), 0.1)',
                                                                        border: '1px solid rgba(var(--accent-rgb), 0.2)'
                                                                    }}
                                                                    onClick={() => setPlaybookFilters({ formation: '', concept: '', situation: '', tag: '' })}
                                                                >
                                                                    <Icon name="XCircle" size={14} style={{ marginRight: '4px' }} />
                                                                    Clear Filters
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Search Plays</label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <Icon name="Search" size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                                    <input
                                                                        className="form-input"
                                                                        placeholder="Name or formation..."
                                                                        value={searchTerm}
                                                                        onChange={e => setSearchTerm(e.target.value)}
                                                                        style={{ paddingLeft: '2.25rem', width: '100%' }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Formation</label>
                                                                <select
                                                                    className="form-input"
                                                                    value={playbookFilters.formation}
                                                                    onChange={e => setPlaybookFilters({ ...playbookFilters, formation: e.target.value })}
                                                                >
                                                                    <option value="">All Formations</option>
                                                                    {Array.from(new Set(plays.map(p => p.formation).filter(Boolean))).sort().map(f => (
                                                                        <option key={f} value={f}>{f}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Concept</label>
                                                                <select
                                                                    className="form-input"
                                                                    value={playbookFilters.concept}
                                                                    onChange={e => setPlaybookFilters({ ...playbookFilters, concept: e.target.value })}
                                                                >
                                                                    <option value="">All Concepts</option>
                                                                    {Array.from(new Set(plays.map(p => p.concept).filter(Boolean))).sort().map(c => (
                                                                        <option key={c} value={c}>{c}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Situation</label>
                                                                <select
                                                                    className="form-input"
                                                                    value={playbookFilters.situation}
                                                                    onChange={e => setPlaybookFilters({ ...playbookFilters, situation: e.target.value })}
                                                                >
                                                                    <option value="">All Situations</option>
                                                                    {Object.keys(TAG_CATEGORIES).filter(cat => ["Situation", "Field Position", "Down & Distance"].includes(cat)).map(cat => (
                                                                        <optgroup key={cat} label={cat}>
                                                                            {TAG_CATEGORIES[cat].map(tag => (
                                                                                <option key={tag} value={tag}>{tag}</option>
                                                                            ))}
                                                                        </optgroup>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tag</label>
                                                                <select
                                                                    className="form-input"
                                                                    value={playbookFilters.tag}
                                                                    onChange={e => setPlaybookFilters({ ...playbookFilters, tag: e.target.value })}
                                                                >
                                                                    <option value="">All Tags</option>
                                                                    {allTags.map(t => (
                                                                        <option key={t} value={t}>{t}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                                        {filteredPlaybook.map(play => (
                                                            <PlayCard
                                                                key={play.id}
                                                                play={play}
                                                                isSelected={selectedPlays.includes(play.id)}
                                                                onToggleSelect={() => handleToggleSelect(play.id)}
                                                                onEdit={() => { setEditingPlay(play); setView('new-play'); }}
                                                            />
                                                        ))}
                                                    </div>

                                                </div>
                                            )
                                        }



                                        {view === 'meeting-notes' && (
                                            <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
                                                <div className="card" style={{ padding: '3rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icon name="Users" size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                                                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Meeting Home</h2>
                                                    <p style={{ fontSize: '1.2rem', opacity: 0.6, maxWidth: '500px' }}>
                                                        Reserved for coach meeting notes, daily checklists, and action items.
                                                    </p>
                                                    <div style={{ marginTop: '2rem', padding: '1rem 2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                                        Coming Soon
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {view === 'formations-defense' && <div>Formation Management (Coming Soon)</div>}
                                        {view === 'roster' && <RosterManager roster={roster} onUpdateRoster={setRoster} depthChart={depthChart} />}
                                        {view === 'player-profiles' && <PlayerProfileGallery roster={roster} onUpdateRoster={setRoster} attendance={attendance} getPlayerWeightLogs={getPlayerWeightLogs} addWeightLog={addWeightLog} updateWeightLog={updateWeightLog} deleteWeightLog={deleteWeightLog} />}

                                        {view === 'staff-roster' && <StaffManager view="roster" currentUser={currentUser} staff={staff} onUpdateStaff={setStaff} dutyAssignments={dutyAssignments} onUpdateDuties={setDutyAssignments} masterTasks={masterTasks} onUpdateMasterTasks={setMasterTasks} teamLogo={teamLogo} />}
                                        {view === 'staff-tasks' && <StaffManager view="tasks" currentUser={currentUser} staff={staff} onUpdateStaff={setStaff} dutyAssignments={dutyAssignments} onUpdateDuties={setDutyAssignments} masterTasks={masterTasks} onUpdateMasterTasks={setMasterTasks} teamLogo={teamLogo} />}
                                        {view === 'archive' && <ArchiveManager roster={roster} staff={staff} onUpdateRoster={setRoster} onUpdateStaff={setStaff} />}
                                        {view === 'depth' && <DepthChart roster={roster} depthChart={(currentWeek.depthChart && currentWeek.depthChart[depthChartType]) || {}} onUpdateDepthChart={(updated) => handleUpdateDepthChart(prev => ({ ...prev, [depthChartType]: updated }))} chartType={depthChartType} positionNames={positionNames} customPositions={customPositions} hiddenPositions={hiddenPositions} savedLayout={depthChartLayouts[depthChartType] || {}} onUpdateLayout={(id, x, y) => handleUpdateDepthLayout(depthChartType, id, x, y)} onResetLayout={() => handleResetDepthLayout(depthChartType)} />}
                                        {view === 'wristband' && <WristbandBuilder plays={plays} weeks={weeks} gamePlan={currentWeek.offensiveGamePlan} onUpdatePlay={handlePatchPlay} wbSettings={currentWeek.wristbands || {}} setWbSettings={handleUpdateWristbands} onNavigate={setView} installList={currentWeek?.installList || []} />}


                                        {
                                            view === 'settings' && (
                                                <Settings
                                                    teamLogo={teamLogo}
                                                    onUpdateLogo={setTeamLogo}
                                                    accentColor={accentColor}
                                                    onUpdateAccentColor={handleUpdateAccentColor}
                                                    theme={theme}
                                                    onUpdateTheme={setTheme}
                                                    positionNames={positionNames}
                                                    onUpdatePositionNames={setPositionNames}
                                                    activeYear={activeYear}
                                                    onUpdateActiveYear={setActiveYear}
                                                    visibleFeatures={visibleFeatures}
                                                    onUpdateVisibleFeatures={setVisibleFeatures}
                                                    isAdmin={isSiteAdmin}
                                                    siteAdmins={siteAdmins}
                                                    schoolData={{ id: localStorage.getItem('hc_school_id') }}
                                                    currentSchoolId={localStorage.getItem('hc_school_id')}
                                                    programLevels={programLevels}
                                                    onUpdateProgramLevels={setProgramLevels}
                                                />
                                            )
                                        }

                                        {view === 'testing' && <PlayerMetrics roster={roster} metrics={metrics} onUpdateMetrics={setMetrics} />}
                                        {view === 'ironman' && <PlayerMetrics roster={roster} metrics={metrics} onUpdateMetrics={setMetrics} viewCategory="ironman" />}
                                        {view === 'ratings' && <ImpactRatings roster={roster} ratings={metrics} onUpdateRatings={setMetrics} />}
                                        {view === 'pressbox' && <Pressbox plays={plays} gameLog={gameLog} onUpdateGameLog={handleUpdateGameLog} currentWeek={currentWeek} teamLogo={teamLogo} opponentLogo={currentWeek.opponentData?.logo || ''} gameStart={currentWeek.gameStart || {}} situation={currentWeek.situation} onUpdateSituation={handleUpdateSituation} formations={formations} activePlay={activePlay} onUpdateActivePlay={setActivePlay} />}

                                        {view === 'grading' && <GameGradingView roster={roster} gameLog={currentWeek.gameLog} gameGrades={gameGrades} onUpdateGameGrades={setGameGrades} />}
                                        {view === 'player-app' && <PlayerApp roster={roster} attendance={attendance} setAttendance={setAttendance} getPlayerWeightLogs={getPlayerWeightLogs} addWeightLog={addWeightLog} tasks={masterTasks} onUpdateTasks={setMasterTasks} dailyConnections={dailyConnections} setDailyConnections={setDailyConnections} currentWeek={currentWeek} culturalCalibration={culturalCalibration} depthCharts={depthCharts} positionNames={positionNames} />}
                                        {view === 'attendance-app' && <PlayerApp roster={roster} attendance={attendance} setAttendance={setAttendance} getPlayerWeightLogs={getPlayerWeightLogs} addWeightLog={addWeightLog} tasks={masterTasks} onUpdateTasks={setMasterTasks} dailyConnections={dailyConnections} setDailyConnections={ailtions} currentWeek={currentWeek} culturalCalibration={culturalCalibration} depthCharts={depthCharts} positionNames={positionNames} />}
                                        {view === 'practice' && (
                                            <PracticeScriptBuilder
                                                mode="plan"
                                                plays={plays}
                                                plans={currentWeek.practicePlans || {}}
                                                onUpdatePlans={(updated) => handleUpdateWeek(currentWeek.id, 'practicePlans', updated)}
                                                staff={staff}
                                                addCustomFocusItem={addCustomFocusItem}
                                                user={currentUser}
                                                isLocked={currentWeek.isLocked}
                                                isSiteAdmin={false}
                                                segmentTypes={practiceSegmentTypes}
                                                focusItems={practiceFocusItems}
                                                segmentSettings={practiceSegmentSettings}
                                                scriptPresets={scriptPresets}
                                                gamePlan={currentWeek.offensiveGamePlan}
                                                gamePlanLayouts={GAME_PLAN_LAYOUTS}
                                            />
                                        )}
                                        {view === 'pregame' && (
                                            <PregameTimeline
                                                plan={currentWeek.pregamePlan || { kickoffTime: '19:00', segments: [] }}
                                                onUpdatePlan={(updated) => handleUpdateWeek(currentWeek.id, 'pregamePlan', updated)}
                                                teamLogo={teamLogo}
                                                staff={staff}
                                                user={currentUser}
                                                isLocked={currentWeek.isLocked}
                                            />
                                        )}
                                        {view === 'game-week-overview' && (
                                            <GameWeekOverview
                                                week={currentWeek}
                                                onUpdateWeek={handleUpdateWeek}
                                                teamLogo={teamLogo}
                                                weeks={this.state.weeks}
                                                isLocked={currentWeek.isLocked}
                                            />
                                        )}
                                        {view === 'practice-scripts' && (
                                            <PracticeScriptBuilder
                                                mode="script"
                                                plays={plays}
                                                plans={currentWeek.practicePlans || {}}
                                                onUpdatePlans={(updated) => handleUpdateWeek(currentWeek.id, 'practicePlans', updated)}
                                                staff={staff}
                                                addCustomFocusItem={addCustomFocusItem}
                                                user={currentUser}
                                                isLocked={currentWeek.isLocked}
                                                isSiteAdmin={false}
                                                segmentTypes={practiceSegmentTypes}
                                                focusItems={practiceFocusItems}
                                                segmentSettings={practiceSegmentSettings}
                                                scriptPresets={scriptPresets}
                                                gamePlan={currentWeek.offensiveGamePlan}
                                                gamePlanLayouts={GAME_PLAN_LAYOUTS}
                                            />
                                        )}
                                        {view === 'coach-app' && <PracticeCoachApp roster={roster} plans={currentWeek.practicePlans || {}} plays={plays} drills={drills} weeks={weeks} currentWeek={currentWeek} />}
                                        {view === 'staff-app' && <StaffApp staff={staff} currentUser={currentUser} dutyAssignments={dutyAssignments} masterTasks={masterTasks} onUpdateMasterTasks={setMasterTasks} onUpdateStaff={(updatedStaff) => syncToFirestore('staff', updatedStaff)} />}
                                        {view === 'smart-call-sheet' && <SmartCallSheet gamePlan={currentWeek.offensiveGamePlan} situation={currentWeek.situation} playSyntax={playSyntax} formations={formations} positionNames={positionNames} zonePhilosophies={currentWeek.zonePhilosophies || {}} onUpdatePhilosophy={handleUpdateZonePhilosophies} onUpdateGamePlan={handleUpdateGamePlan} weeks={weeks} currentWeek={currentWeek} />}
                                        {/* Legacy DumbCallSheet removed from here */}
                                        {view === 'play-call-simulator' && <PlayCallSimulator plays={plays} gamePlan={currentWeek.offensiveGamePlan} />}
                                        {view === 'special-teams-setup' && renderSetup('SPECIAL_TEAMS')}
                                        {view === 'formations-offense' && <FormationManager formations={formations} onUpdateFormations={setFormations} formationLayouts={formationLayouts} onUpdateFormationLayout={(chartType, posId, x, y) => updateFormationLayout(chartType, posId, x, y)} onResetLayout={(chartType, formation) => resetFormationLayout(chartType, formation)} positionNames={positionNames} phase="OFFENSE" />}
                                        {view === 'formations-defense' && <FormationManager formations={formations} onUpdateFormations={setFormations} formationLayouts={formationLayouts} onUpdateFormationLayout={(chartType, posId, x, y) => updateFormationLayout(chartType, posId, x, y)} onResetLayout={(chartType, formation) => resetFormationLayout(chartType, formation)} positionNames={positionNames} phase="DEFENSE" />}
                                        {view === 'formations-st' && <FormationManager formations={formations} onUpdateFormations={setFormations} formationLayouts={formationLayouts} onUpdateFormationLayout={(chartType, posId, x, y) => updateFormationLayout(chartType, posId, x, y)} onResetLayout={(chartType, formation) => resetFormationLayout(chartType, formation)} positionNames={positionNames} phase="SPECIAL TEAMS" />}
                                        {view === 'opponent-scouting' && <OpponentScouting opponentData={currentWeek.opponentData || {}} onUpdateOpponentData={(data) => {
                                            const updatedWeeks = weeks.map(w =>
                                                w.id === currentWeek.id ? { ...w, opponentData: data } : w
                                            );
                                            setWeeks(updatedWeeks);
                                        }} />}
                                        {
                                            view.startsWith('equipment-') && (
                                                <EquipmentManager
                                                    equipment={equipment}
                                                    onUpdateEquipment={setEquipment}
                                                    equipmentCheckouts={equipmentCheckouts}
                                                    onUpdateEquipmentCheckouts={setEquipmentCheckouts}
                                                    equipmentIssues={equipmentIssues}
                                                    onUpdateEquipmentIssues={setEquipmentIssues}
                                                    equipmentWishlist={equipmentWishlist}
                                                    onUpdateEquipmentWishlist={setEquipmentWishlist}
                                                    equipmentDueDate={equipmentDueDate}
                                                    setEquipmentDueDate={setEquipmentDueDate}
                                                    view={view}
                                                    roster={roster}
                                                    inventory={inventory}
                                                    onUpdateInventory={setInventory}
                                                    checkouts={equipmentCheckouts}
                                                    onUpdateCheckouts={setEquipmentCheckouts}
                                                    issues={equipmentIssues}
                                                    onUpdateIssues={setEquipmentIssues}
                                                    wishlist={equipmentWishlist}
                                                    onUpdateWishlist={setEquipmentWishlist}
                                                    lotteryData={lotteryData}
                                                    onUpdateLottery={setLotteryData}
                                                />
                                            )
                                        }

                                        {/* Duplicate settings block removed */}

                                        {view === 'help' && <UserGuide />}
                                        {view === 'self-scout-offense' && <SelfScoutAnalytics phase="Offense" />}
                                        {view === 'self-scout-defense' && <SelfScoutAnalytics phase="Defense" />}
                                        {view === 'self-scout-special-teams' && <SelfScoutAnalytics phase="Special Teams" />}



                                        {
                                            showLogoutConfirm && (
                                                <div style={{
                                                    position: 'fixed',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: 'rgba(0, 0, 0, 0.7)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 10000
                                                }}>
                                                    <div style={{
                                                        background: 'white',
                                                        padding: '2rem',
                                                        borderRadius: '8px',
                                                        maxWidth: '400px',
                                                        width: '90%',
                                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                                        border: '1px solid rgba(0,0,0,0.1)'
                                                    }}>
                                                        <h3 style={{ marginTop: 0, color: '#111827', marginBottom: '1rem', fontSize: '1.25rem' }}>Log Out?</h3>
                                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                                            Are you sure you want to sign out?
                                                        </p>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                                            <button
                                                                onClick={() => setShowLogoutConfirm(false)}
                                                                style={{
                                                                    padding: '0.75rem 1.5rem',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #e2e8f0',
                                                                    background: 'white',
                                                                    color: 'var(--text-secondary)',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setShowLogoutConfirm(false);
                                                                    logout();
                                                                }}
                                                                style={{
                                                                    padding: '0.75rem 1.5rem',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    background: '#ef4444',
                                                                    color: 'white',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
                                                                }}
                                                            >
                                                                Log Out
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {/* Invite Acceptance Modal */}
                                        {
                                            inviteData && (
                                                <div style={{
                                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                                    background: 'rgba(0,0,0,0.85)', zIndex: 10001,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2rem', border: '1px solid var(--border)', background: 'var(--bg-panel)', borderRadius: 'var(--radius)' }}>
                                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                                                            {inviteData.type === 'domain_match' ? '🏫' : '📩'}
                                                        </div>
                                                        <h2 style={{ marginBottom: '0.5rem' }}>
                                                            {inviteData.type === 'domain_match' ? 'Join Your Team?' : "You're Invited!"}
                                                        </h2>
                                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                                            {inviteData.type === 'domain_match'
                                                                ? <span>Your email matches <strong>{inviteData.schoolName}</strong>.<br />Join now as a <strong>{inviteData.role}</strong>?</span>
                                                                : <span>To join <strong>{inviteData.schoolName}</strong> as a <strong>{inviteData.role}</strong>.</span>
                                                            }                          </p>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}
                                                            onClick={handleAcceptInvite}
                                                        >
                                                            Accept & Join Team
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', background: 'transparent', border: 'none', textDecoration: 'underline' }}
                                                            onClick={() => {
                                                                if (confirm("Are you sure? This will ignore the existing team and create a new school instead.")) {
                                                                    setInviteData(null);
                                                                    setSchoolSetupData({ showWizard: true, schoolId: `SCH_${Date.now()}` });
                                                                }
                                                            }}
                                                        >
                                                            No, Create New Sl I                                        </button>
                                                    </div>
                                                </div >
                                            )
                                        }
                                    </main >
                                    {/* Global Modals */}
                                    < ManageWeekModal
                                        isOpen={showManageWeekModal}
                                        onClose={() => setShowManageWeekModal(false)}
                                        currentWeek={currentWeek}
                                        weeks={weeks}
                                        onUpdateWeek={handleUpdateWeek}
                                    />
                                </div >
                            );
                        };

                        class ErrorBoundary extends React.Component {
                            constructor(props) {
                                super(props); this.state = { hasError: false, error: null, errorInfo: null };
                            }

                            static getDerivedStateFromError(error) {
                                return { hasError: true };
                            }

                            componentDidCatch(error, errorInfo) {
                                this.setState({ error, errorInfo });
                                console.error("Uncaught error:", error, errorInfo);
                            }


                            render() {
                                if (this.state.hasError) {
                                    return (
                                        <div style={{ padding: '2rem', color: '#ef4444', background: '#1e293b', height: '100vh' }}>
                                            <h1>Something went wrong.</h1>
                                            <details style={{ whiteSpace: 'pre-wrap' }}>
                                                {this.state.error && this.state.error.toString()}
                                                <br />
                                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                                            </details>
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
    </script>
</body>

</html>