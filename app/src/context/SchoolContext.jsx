import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { ensureMembership } from '../services/auth';

const SchoolContext = createContext(null);

/**
 * Recursively remove undefined values from an object
 * Firestore doesn't accept undefined values, so we need to clean them before saving
 */
const removeUndefinedValues = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }
  return obj;
};

// Default season phases
const DEFAULT_SEASON_PHASES = [
  { id: 'offseason', name: 'Offseason', color: 'slate', order: 0, numWeeks: 0, isOffseason: true },
  { id: 'summer', name: 'Summer', color: 'amber', order: 1, numWeeks: 6 },
  { id: 'preseason', name: 'Preseason', color: 'purple', order: 2, numWeeks: 4 },
  { id: 'season', name: 'Regular Season', color: 'emerald', order: 3, numWeeks: 10 }
];

// Default week configurations for each phase
const DEFAULT_WEEK_CONFIGS = {
  offseason: [
    { name: 'Offseason', weekNum: 0, isOffseason: true }
  ],
  summer: [
    { name: 'Summer Week 1', weekNum: 1 },
    { name: 'Summer Week 2', weekNum: 2 },
    { name: 'Summer Week 3', weekNum: 3 },
    { name: 'Summer Week 4', weekNum: 4 },
    { name: 'Summer Week 5', weekNum: 5 },
    { name: 'Summer Week 6', weekNum: 6 }
  ],
  preseason: [
    { name: 'Camp Week 1', weekNum: 1 },
    { name: 'Camp Week 2', weekNum: 2 },
    { name: 'Camp Week 3', weekNum: 3 },
    { name: 'Scrimmage Week', weekNum: 4 }
  ],
  season: [
    { name: 'Week 1', weekNum: 1, opponent: '', isHome: true },
    { name: 'Week 2', weekNum: 2, opponent: '', isHome: false },
    { name: 'Week 3', weekNum: 3, opponent: '', isHome: true },
    { name: 'Week 4', weekNum: 4, opponent: '', isHome: false },
    { name: 'Week 5', weekNum: 5, opponent: '', isHome: true },
    { name: 'Week 6', weekNum: 6, opponent: '', isHome: false },
    { name: 'Week 7', weekNum: 7, opponent: '', isHome: true },
    { name: 'Week 8', weekNum: 8, opponent: '', isHome: false },
    { name: 'Week 9', weekNum: 9, opponent: '', isHome: true },
    { name: 'Week 10', weekNum: 10, opponent: '', isHome: false }
  ]
};

// Generate default weeks for all phases
function generateDefaultWeeks(year, phases = DEFAULT_SEASON_PHASES) {
  const allWeeks = [];
  const timestamp = Date.now();

  phases.forEach((phase, phaseIndex) => {
    const weekConfigs = DEFAULT_WEEK_CONFIGS[phase.id] || [];

    weekConfigs.forEach((config, weekIndex) => {
      const week = {
        id: config.isOffseason ? 'offseason' : `${phase.id}_week_${config.weekNum}_${timestamp}_${phaseIndex}_${weekIndex}`,
        name: config.name,
        phaseId: phase.id,
        phaseName: phase.name,
        phaseColor: phase.color,
        weekNum: config.weekNum || 0,
        year: year,
        isOffseason: config.isOffseason || false,
        opponent: config.opponent || '',
        date: null,
        createdAt: new Date().toISOString()
      };
      // Only add isHome for season weeks (where it's defined)
      if (typeof config.isHome === 'boolean') {
        week.isHome = config.isHome;
      }
      allWeeks.push(week);
    });
  });

  return allWeeks;
}

export function SchoolProvider({ children }) {
  const { currentSchool, isAuthenticated, user, devMode } = useAuth();

  // Core school data
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save status for UI feedback: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');

  // Debounce refs for batching rapid updates
  const pendingUpdatesRef = useRef({});
  const debounceTimerRef = useRef(null);
  const saveStatusTimerRef = useRef(null);

  // School sub-collections
  const [roster, setRoster] = useState([]);
  const [plays, setPlays] = useState({});
  const [staff, setStaff] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [depthCharts, setDepthCharts] = useState({});
  const [wristbands, setWristbands] = useState({});
  const [gamePlans, setGamePlans] = useState({});

  // Settings
  const [settings, setSettings] = useState({});
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());

  // Archived seasons (historical data)
  const [archivedSeasons, setArchivedSeasons] = useState({});

  // Currently viewing year (may differ from activeYear when viewing history)
  const [viewingYear, setViewingYear] = useState(null);

  // Current week context
  const [currentWeekId, setCurrentWeekId] = useState(null);

  // Program levels (JV, Freshman, Scout Team, etc.)
  const [programLevels, setProgramLevels] = useState([]);

  // Global week templates
  const [globalWeekTemplates, setGlobalWeekTemplates] = useState([]);

  // Feature visibility settings
  const [visibleFeatures, setVisibleFeatures] = useState({
    gameWeek: { enabled: true, items: { schemeSetup: true, playbook: true } }
  });

  // Active sub-level context
  const [activeLevelId, setActiveLevelId] = useState(null);

  // Culture / Program Alignment data
  const [culture, setCulture] = useState({
    seasonMotto: '',
    teamMission: '',
    teamVision: '',
    teamNonNegotiables: '',
    offensePhilosophy: '',
    defensePhilosophy: '',
    specialTeamsPhilosophy: '',
    coachesExpectations: '',
    standards: {
      practice: '',
      meeting: '',
      weightRoom: '',
      life: '',
      school: '',
      travel: ''
    },
    goals: {
      teamSeason: [],
      offenseWeekly: [],
      defenseWeekly: [],
      stWeekly: []
    },
    positionBigThree: {},
    positionBigThreeAssignments: {},
    customBigThreeGroups: []
  });

  // Meeting notes by week (weekly coaches notes)
  const [meetingNotes, setMeetingNotes] = useState({});

  // Quality Control grading data
  const [practiceGrades, setPracticeGrades] = useState([]);
  const [gameGrades, setGameGrades] = useState([]);

  // Season Analytics (Hudl import data)
  const [seasonAnalytics, setSeasonAnalytics] = useState({});

  // Setup configuration data
  const [setupConfig, setSetupConfig] = useState({
    // Setup Mode: 'standard' (simple) or 'advanced' (bucket-specific syntax, signals, etc.)
    setupMode: { OFFENSE: 'standard', DEFENSE: 'standard', SPECIAL_TEAMS: 'standard' },

    // Positions
    positionNames: {},
    positionColors: {},
    positionDescriptions: {},
    customPositions: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] },
    hiddenPositions: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] },

    // Position Groups (with coach assignments and Big 3)
    positionGroups: {
      OFFENSE: [
        { id: 'grp_qb', name: 'Quarterbacks', abbrev: 'QB', positions: ['QB'], coachId: null, big3: [] },
        { id: 'grp_rb', name: 'Running Backs', abbrev: 'RB', positions: ['RB', 'FB'], coachId: null, big3: [] },
        { id: 'grp_wr', name: 'Wide Receivers', abbrev: 'WR', positions: ['WR', 'X', 'Z', 'H', 'Y'], coachId: null, big3: [] },
        { id: 'grp_te', name: 'Tight Ends', abbrev: 'TE', positions: ['TE'], coachId: null, big3: [] },
        { id: 'grp_ol', name: 'Offensive Line', abbrev: 'OL', positions: ['LT', 'LG', 'C', 'RG', 'RT'], coachId: null, big3: [] }
      ],
      DEFENSE: [
        { id: 'grp_dl', name: 'Defensive Line', abbrev: 'DL', positions: ['DE', 'DT', 'NT', 'NG'], coachId: null, big3: [] },
        { id: 'grp_lb', name: 'Linebackers', abbrev: 'LB', positions: ['ILB', 'OLB', 'MLB', 'WLB', 'SLB', 'MIKE', 'WILL', 'SAM'], coachId: null, big3: [] },
        { id: 'grp_db', name: 'Defensive Backs', abbrev: 'DB', positions: ['CB', 'S', 'FS', 'SS', 'NB'], coachId: null, big3: [] }
      ],
      SPECIAL_TEAMS: [
        { id: 'grp_k', name: 'Kickers', abbrev: 'K', positions: ['K', 'P', 'LS'], coachId: null, big3: [] }
      ]
    },

    // Personnel Groupings (Offense only)
    // Each grouping can have isBase: true to mark it as the default for depth charts
    personnelGroupings: [],

    // Formations
    formations: [],

    // Formation Families (Offense) - groupings like 2x2, 3x1, Under/Gun, Open/Closed, etc.
    formationFamilies: [],

    // Shifts & Motions (Offense) - pre-snap movement tags
    shiftMotions: [],

    // Play Buckets (formerly playCategories) - top level organization
    playBuckets: [],

    // Concept Families (formerly playBuckets) - sub-level organization within buckets
    conceptGroups: [],

    // Play Call Syntax (legacy - single syntax per phase)
    syntax: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] },

    // Play Call Syntax Templates (new - multiple templates per phase)
    // Each phase has templates: pass, run, quick, custom
    syntaxTemplates: {
      OFFENSE: {
        pass: [],
        run: [],
        quick: [],
        custom: []
      },
      DEFENSE: {
        custom: []
      },
      SPECIAL_TEAMS: {
        custom: []
      }
    },

    // Term Library / Play Call Chain Terms
    termLibrary: { OFFENSE: {}, DEFENSE: {}, SPECIAL_TEAMS: {} },

    // Glossary Definitions
    glossaryDefinitions: { OFFENSE: {}, DEFENSE: {}, SPECIAL_TEAMS: {} },

    // Practice Setup - Segment types organized by phase (O, D, K, C)
    // Each type has: { id, name, focusItems: [{ id, name }] }
    practiceSegmentTypes: { O: [], D: [], K: [], C: [] },
    practiceSegmentSettings: {},

    // Templates
    practiceTemplates: [],
    gameplanTemplates: [],
    pregameTemplates: [],

    // Read Types (Offense)
    readTypes: [],

    // Look-Alike Series (Offense)
    lookAlikeSeries: [],

    // Situations (Offense)
    fieldZones: [],
    downDistanceCategories: [],
    specialSituations: [],

    // OL Schemes
    passProtections: [],
    runBlocking: [],

    // Quality Control Definitions
    qualityControlDefinitions: {
      playPurposes: [
        { id: 'base', name: 'Base', color: '#3b82f6' },
        { id: 'convert', name: 'Convert', color: '#22c55e' },
        { id: 'shot', name: 'Shot', color: '#f59e0b' },
        { id: 'gadget', name: 'Gadget', color: '#ef4444' }
      ],
      efficiencyThresholds: {
        '1st': { run: 4, pass: 4, screen: 4, default: 4 },
        '2nd': { run: 50, pass: 50, screen: 50, default: 50 },
        '3rd': { run: 100, pass: 100, screen: 100, default: 100 },
        '4th': { run: 100, pass: 100, screen: 100, default: 100 }
      },
      explosiveThresholds: {
        run: 12,
        pass: 15,
        screen: 10,
        default: 12
      },
      minimumVolume: {
        practice: 3,
        game: 2
      }
    }
  });

  /**
   * Load school data with real-time subscription (or localStorage in dev mode)
   */
  useEffect(() => {
    // Dev mode: load from localStorage
    if (devMode) {
      console.log('🔧 DEV MODE: Loading school data from localStorage');
      try {
        const cached = localStorage.getItem('dofo_dev_school_data');
        if (cached) {
          const data = JSON.parse(cached);
          setSchool(data.school || { id: 'dev-school-123', name: 'Development High School', mascot: 'Developers' });
          setRoster(data.roster || []);
          setPlays(data.plays || {});
          setStaff(data.staff || []);
          setWeeks(data.weeks || []);
          setDepthCharts(data.depthCharts || {});
          setWristbands(data.wristbands || {});
          setGamePlans(data.gamePlans || {});
          setSettings(data.settings || {});
          setArchivedSeasons(data.archivedSeasons || {});
          setProgramLevels(data.programLevels || []);
          setGlobalWeekTemplates(data.globalWeekTemplates || []);
          setVisibleFeatures(data.visibleFeatures || { gameWeek: { enabled: true, items: { schemeSetup: true, playbook: true } } });
          if (data.culture) setCulture(prev => ({ ...prev, ...data.culture }));
          if (data.setupConfig) {
            // Migrate old field names to new ones
            const config = { ...data.setupConfig };
            // playCategories → playBuckets (top-level buckets)
            if (config.playCategories && !config.playBuckets) {
              config.playBuckets = config.playCategories;
            }
            delete config.playCategories;
            // old playBuckets → conceptGroups (sub-level families)
            // Note: only migrate if conceptGroups doesn't exist and old playBuckets was the families array
            if (data.setupConfig.playBuckets && !config.conceptGroups && Array.isArray(data.setupConfig.playBuckets) && data.setupConfig.playBuckets[0]?.categoryId) {
              config.conceptGroups = data.setupConfig.playBuckets;
            }
            // conceptFamilies → conceptGroups (renamed field)
            if (config.conceptFamilies && !config.conceptGroups) {
              config.conceptGroups = config.conceptFamilies;
            }
            delete config.conceptFamilies;
            // Migrate legacy syntax to syntaxTemplates
            if (config.syntax && !config.syntaxTemplates) {
              config.syntaxTemplates = {
                OFFENSE: {
                  pass: [],
                  run: [],
                  quick: [],
                  custom: config.syntax.OFFENSE || []
                },
                DEFENSE: {
                  custom: config.syntax.DEFENSE || []
                },
                SPECIAL_TEAMS: {
                  custom: config.syntax.SPECIAL_TEAMS || []
                }
              };
            }
            // Preserve default position groups if stored data has empty arrays
            setSetupConfig(prev => {
              const merged = { ...prev, ...config };
              if (config.positionGroups) {
                const pg = config.positionGroups;
                merged.positionGroups = {
                  OFFENSE: (pg.OFFENSE?.length > 0) ? pg.OFFENSE : prev.positionGroups.OFFENSE,
                  DEFENSE: (pg.DEFENSE?.length > 0) ? pg.DEFENSE : prev.positionGroups.DEFENSE,
                  SPECIAL_TEAMS: (pg.SPECIAL_TEAMS?.length > 0) ? pg.SPECIAL_TEAMS : prev.positionGroups.SPECIAL_TEAMS
                };
              }
              return merged;
            });
          }
          if (data.meetingNotes) setMeetingNotes(data.meetingNotes);
          if (data.practiceGrades) setPracticeGrades(data.practiceGrades);
          if (data.gameGrades) setGameGrades(data.gameGrades);
          if (data.seasonAnalytics) setSeasonAnalytics(data.seasonAnalytics);
        } else {
          // Set default dev school
          setSchool({ id: 'dev-school-123', name: 'Development High School', mascot: 'Developers' });
        }
      } catch (err) {
        console.error('Error loading dev data:', err);
        setSchool({ id: 'dev-school-123', name: 'Development High School', mascot: 'Developers' });
      }
      setLoading(false);
      return;
    }

    if (!isAuthenticated || !currentSchool?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates from Firestore
    const schoolRef = doc(db, 'schools', currentSchool.id);
    const unsubscribe = onSnapshot(
      schoolRef,
      (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
          setSchool(data);
          setRoster(data.roster || []);
          setPlays(data.plays || {});
          setStaff(data.staff || []);
          setWeeks(data.weeks || []);
          setDepthCharts(data.depthChart || {});
          setWristbands(data.wristbands || {});
          setGamePlans(data.gamePlans || {});
          setSettings(data.settings || {});
          setActiveYear(data.settings?.activeYear || new Date().getFullYear().toString());
          setArchivedSeasons(data.archivedSeasons || {});
          setProgramLevels(data.programLevels || []);
          setGlobalWeekTemplates(data.weekTemplates || []);
          setVisibleFeatures(data.visibleFeatures || { gameWeek: { enabled: true, items: { schemeSetup: true, playbook: true } } });
          if (data.culture) setCulture(prev => ({ ...prev, ...data.culture }));
          if (data.setupConfig) {
            // Migrate old field names to new ones
            const config = { ...data.setupConfig };
            // playCategories → playBuckets (top-level buckets)
            if (config.playCategories && !config.playBuckets) {
              config.playBuckets = config.playCategories;
            }
            delete config.playCategories;
            // old playBuckets → conceptGroups (sub-level families)
            if (data.setupConfig.playBuckets && !config.conceptGroups && Array.isArray(data.setupConfig.playBuckets) && data.setupConfig.playBuckets[0]?.categoryId) {
              config.conceptGroups = data.setupConfig.playBuckets;
            }
            // conceptFamilies → conceptGroups (renamed field)
            if (config.conceptFamilies && !config.conceptGroups) {
              config.conceptGroups = config.conceptFamilies;
            }
            delete config.conceptFamilies;
            // Migrate legacy syntax to syntaxTemplates
            if (config.syntax && !config.syntaxTemplates) {
              config.syntaxTemplates = {
                OFFENSE: {
                  pass: [],
                  run: [],
                  quick: [],
                  custom: config.syntax.OFFENSE || []
                },
                DEFENSE: {
                  custom: config.syntax.DEFENSE || []
                },
                SPECIAL_TEAMS: {
                  custom: config.syntax.SPECIAL_TEAMS || []
                }
              };
            }
            // Preserve default position groups if stored data has empty arrays
            setSetupConfig(prev => {
              const merged = { ...prev, ...config };
              if (config.positionGroups) {
                const pg = config.positionGroups;
                merged.positionGroups = {
                  OFFENSE: (pg.OFFENSE?.length > 0) ? pg.OFFENSE : prev.positionGroups.OFFENSE,
                  DEFENSE: (pg.DEFENSE?.length > 0) ? pg.DEFENSE : prev.positionGroups.DEFENSE,
                  SPECIAL_TEAMS: (pg.SPECIAL_TEAMS?.length > 0) ? pg.SPECIAL_TEAMS : prev.positionGroups.SPECIAL_TEAMS
                };
              }
              return merged;
            });
          }
          if (data.meetingNotes) setMeetingNotes(data.meetingNotes);
          if (data.practiceGrades) setPracticeGrades(data.practiceGrades);
          if (data.gameGrades) setGameGrades(data.gameGrades);
          if (data.seasonAnalytics) setSeasonAnalytics(data.seasonAnalytics);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to school:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, currentSchool?.id, devMode]);

  // Track if we've already verified membership
  const membershipVerifiedRef = useRef(false);

  /**
   * Ensure membership document exists for current user/school
   * This fixes cases where users were added to staff/memberList
   * but don't have a membership subcollection document
   */
  useEffect(() => {
    // Skip in dev mode or if already verified
    if (devMode || membershipVerifiedRef.current) return;

    // Skip if not authenticated or no school
    if (!isAuthenticated || !currentSchool?.id || !user?.uid) return;

    // Skip if still loading school data
    if (loading) return;

    const verifyMembership = async () => {
      try {
        const wasCreated = await ensureMembership(user.uid, currentSchool.id, 'member');
        if (wasCreated) {
          console.log('✅ Membership document created for user in school:', currentSchool.id);
        }
        membershipVerifiedRef.current = true;
      } catch (err) {
        console.error('Error verifying membership:', err);
      }
    };

    verifyMembership();
  }, [isAuthenticated, currentSchool?.id, user?.uid, loading, devMode]);

  // Track if we've already auto-initialized weeks to prevent duplicate runs
  const weeksInitializedRef = useRef(false);

  /**
   * Auto-initialize default weeks when school loads with no weeks
   */
  useEffect(() => {
    // Skip if still loading, no school, or already initialized
    if (loading || !school || weeksInitializedRef.current) return;

    // Skip if weeks already exist
    if (weeks.length > 0) {
      weeksInitializedRef.current = true;
      return;
    }

    // Generate and save default weeks
    const initializeWeeks = async () => {
      console.log('📅 Auto-initializing default weeks...');
      weeksInitializedRef.current = true;

      const year = activeYear || new Date().getFullYear().toString();
      const phases = setupConfig?.seasonPhases?.length > 0 ? setupConfig.seasonPhases : DEFAULT_SEASON_PHASES;
      const defaultWeeks = generateDefaultWeeks(year, phases);

      try {
        if (devMode) {
          // Dev mode: save to localStorage
          const cached = localStorage.getItem('dofo_dev_school_data');
          const current = cached ? JSON.parse(cached) : {};
          const updated = { ...current, weeks: defaultWeeks, updatedAt: new Date().toISOString() };
          localStorage.setItem('dofo_dev_school_data', JSON.stringify(updated));
          setWeeks(defaultWeeks);
        } else if (currentSchool?.id) {
          // Production: save to Firebase
          const schoolRef = doc(db, 'schools', currentSchool.id);
          await updateDoc(schoolRef, {
            weeks: defaultWeeks,
            updatedAt: new Date().toISOString()
          });
          // State will update via onSnapshot listener
        }
        console.log(`✅ Created ${defaultWeeks.length} default weeks`);
      } catch (err) {
        console.error('Error auto-initializing weeks:', err);
        weeksInitializedRef.current = false; // Allow retry on error
      }
    };

    initializeWeeks();
  }, [loading, school, weeks.length, activeYear, setupConfig?.seasonPhases, devMode, currentSchool?.id]);

  /**
   * Flush pending updates to Firebase/localStorage
   * Called by debounce timer or can be called directly for immediate save
   */
  const flushUpdates = useCallback(async () => {
    const updates = pendingUpdatesRef.current;
    if (Object.keys(updates).length === 0) return;

    // Clear pending updates before async operation
    pendingUpdatesRef.current = {};
    setSaveStatus('saving');

    // Dev mode: save to localStorage
    if (devMode) {
      console.log('🔧 DEV MODE: Saving to localStorage', Object.keys(updates));
      try {
        const cached = localStorage.getItem('dofo_dev_school_data');
        const current = cached ? JSON.parse(cached) : {};
        const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem('dofo_dev_school_data', JSON.stringify(updated));

        // Update local state based on what was updated
        if (updates.roster) setRoster(updates.roster);
        if (updates.plays) setPlays(updates.plays);
        if (updates.staff) setStaff(updates.staff);
        if (updates.weeks) setWeeks(updates.weeks);
        if (updates.depthChart) setDepthCharts(updates.depthChart);
        if (updates.wristbands) setWristbands(updates.wristbands);
        if (updates.gamePlans) setGamePlans(updates.gamePlans);
        if (updates.settings) setSettings(prev => ({ ...prev, ...updates.settings }));
        if (updates.programLevels) setProgramLevels(updates.programLevels);
        if (updates.weekTemplates) setGlobalWeekTemplates(updates.weekTemplates);
        if (updates.visibleFeatures) setVisibleFeatures(updates.visibleFeatures);
        if (updates.culture) setCulture(prev => ({ ...prev, ...updates.culture }));
        if (updates.setupConfig) setSetupConfig(prev => ({ ...prev, ...updates.setupConfig }));
        if (updates.meetingNotes) setMeetingNotes(updates.meetingNotes);
        if (updates.practiceGrades) setPracticeGrades(updates.practiceGrades);
        if (updates.gameGrades) setGameGrades(updates.gameGrades);
        if (updates.seasonAnalytics) setSeasonAnalytics(updates.seasonAnalytics);

        setSaveStatus('saved');
        // Reset to idle after showing "saved" briefly
        clearTimeout(saveStatusTimerRef.current);
        saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Error saving dev data:', err);
        setError(err.message);
        setSaveStatus('error');
      }
      return;
    }

    if (!currentSchool?.id) {
      console.error('Cannot update school: No school ID available');
      setSaveStatus('error');
      return;
    }

    try {
      const schoolRef = doc(db, 'schools', currentSchool.id);
      console.log(`Saving to Firebase:`, Object.keys(updates));
      // Clean undefined values before saving to Firestore
      const cleanedUpdates = removeUndefinedValues(updates);
      await updateDoc(schoolRef, {
        ...cleanedUpdates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid
      });

      setSaveStatus('saved');
      // Reset to idle after showing "saved" briefly
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error updating school:', err);
      setError(err.message);
      setSaveStatus('error');
    }
  }, [currentSchool?.id, user?.uid, devMode]);

  /**
   * Update school data with debouncing
   * Batches rapid updates and saves after 500ms of inactivity
   */
  const updateSchool = useCallback(async (updates) => {
    // Merge new updates with any pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };

    // Show pending status immediately
    setSaveStatus('pending');

    // Clear existing timer
    clearTimeout(debounceTimerRef.current);

    // Set new timer to flush updates after 500ms
    debounceTimerRef.current = setTimeout(() => {
      flushUpdates();
    }, 500);
  }, [flushUpdates]);

  /**
   * Force immediate save (bypasses debounce)
   * Use for critical saves like before navigation
   */
  const saveNow = useCallback(async () => {
    clearTimeout(debounceTimerRef.current);
    await flushUpdates();
  }, [flushUpdates]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimerRef.current);
      clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  /**
   * Update roster
   */
  const updateRoster = useCallback(async (newRoster) => {
    await updateSchool({ roster: newRoster });
  }, [updateSchool]);

  /**
   * Update plays
   */
  const updatePlays = useCallback(async (newPlays) => {
    await updateSchool({ plays: newPlays });
  }, [updateSchool]);

  /**
   * Update a single play - uses functional update to avoid race conditions
   */
  const updatePlay = useCallback(async (playId, playData) => {
    // Use setPlays with a callback to get the latest state
    setPlays(currentPlays => {
      const newPlays = { ...currentPlays, [playId]: { ...currentPlays[playId], ...playData } };
      // Trigger the async save with the new data
      updateSchool({ plays: newPlays }).catch(err => console.error('Error updating play:', err));
      return newPlays;
    });
  }, [updateSchool]);

  /**
   * Batch update multiple plays at once - more efficient for bulk operations
   * @param {Array} updates - Array of { playId, data } objects
   */
  const batchUpdatePlays = useCallback(async (updates) => {
    if (!updates || updates.length === 0) return;

    setPlays(currentPlays => {
      const newPlays = { ...currentPlays };
      updates.forEach(({ playId, data }) => {
        if (newPlays[playId]) {
          newPlays[playId] = { ...newPlays[playId], ...data };
        }
      });
      // Trigger the async save with all updates at once
      updateSchool({ plays: newPlays }).catch(err => console.error('Error batch updating plays:', err));
      return newPlays;
    });
  }, [updateSchool]);

  /**
   * Add a new play
   */
  const addPlay = useCallback(async (playData) => {
    const playId = `play_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPlays = {
      ...plays,
      [playId]: {
        id: playId,
        ...playData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      }
    };
    await updatePlays(newPlays);
    return playId;
  }, [plays, updatePlays, user?.uid]);

  /**
   * Update weeks
   */
  const updateWeeks = useCallback(async (newWeeks) => {
    await updateSchool({ weeks: newWeeks });
  }, [updateSchool]);

  /**
   * Update a single week by ID
   */
  const updateWeek = useCallback(async (weekId, updates) => {
    const newWeeks = weeks.map(w =>
      w.id === weekId ? { ...w, ...updates } : w
    );
    await updateSchool({ weeks: newWeeks });
  }, [weeks, updateSchool]);

  /**
   * Update staff
   */
  const updateStaff = useCallback(async (newStaff) => {
    await updateSchool({ staff: newStaff });
  }, [updateSchool]);

  /**
   * Update depth charts
   */
  const updateDepthCharts = useCallback(async (newDepthCharts) => {
    await updateSchool({ depthChart: newDepthCharts });
  }, [updateSchool]);

  /**
   * Update wristbands
   */
  const updateWristbands = useCallback(async (newWristbands) => {
    await updateSchool({ wristbands: newWristbands });
  }, [updateSchool]);

  /**
   * Update game plans
   */
  const updateGamePlans = useCallback(async (newGamePlans) => {
    await updateSchool({ gamePlans: newGamePlans });
  }, [updateSchool]);

  /**
   * Update settings
   */
  const updateSettings = useCallback(async (newSettings) => {
    await updateSchool({ settings: { ...settings, ...newSettings } });
  }, [updateSchool, settings]);

  /**
   * Update culture / program alignment data
   */
  const updateCulture = useCallback(async (newCulture) => {
    const merged = { ...culture, ...newCulture };
    await updateSchool({ culture: merged });
  }, [updateSchool, culture]);

  /**
   * Update setup configuration data
   */
  const updateSetupConfig = useCallback(async (newConfig) => {
    const merged = { ...setupConfig, ...newConfig };
    await updateSchool({ setupConfig: merged });
  }, [updateSchool, setupConfig]);

  /**
   * Update meeting notes for a specific week
   */
  const updateMeetingNotes = useCallback(async (weekId, notes) => {
    const newMeetingNotes = { ...meetingNotes, [weekId]: notes };
    await updateSchool({ meetingNotes: newMeetingNotes });
  }, [updateSchool, meetingNotes]);

  /**
   * Update practice grades
   */
  const updatePracticeGrades = useCallback(async (newPracticeGrades) => {
    await updateSchool({ practiceGrades: newPracticeGrades });
  }, [updateSchool]);

  /**
   * Add or update a practice grading session
   */
  const savePracticeGradeSession = useCallback(async (session) => {
    const existingIndex = practiceGrades.findIndex(g => g.id === session.id);
    let newGrades;
    if (existingIndex >= 0) {
      newGrades = [...practiceGrades];
      newGrades[existingIndex] = { ...session, updatedAt: new Date().toISOString() };
    } else {
      newGrades = [...practiceGrades, { ...session, createdAt: new Date().toISOString() }];
    }
    await updatePracticeGrades(newGrades);
  }, [practiceGrades, updatePracticeGrades]);

  /**
   * Update game grades
   */
  const updateGameGrades = useCallback(async (newGameGrades) => {
    await updateSchool({ gameGrades: newGameGrades });
  }, [updateSchool]);

  /**
   * Add or update a game grading session
   */
  const saveGameGradeSession = useCallback(async (session) => {
    const existingIndex = gameGrades.findIndex(g => g.id === session.id);
    let newGrades;
    if (existingIndex >= 0) {
      newGrades = [...gameGrades];
      newGrades[existingIndex] = { ...session, updatedAt: new Date().toISOString() };
    } else {
      newGrades = [...gameGrades, { ...session, createdAt: new Date().toISOString() }];
    }
    await updateGameGrades(newGrades);
  }, [gameGrades, updateGameGrades]);

  /**
   * Update season analytics data
   */
  const updateSeasonAnalytics = useCallback(async (newSeasonAnalytics) => {
    await updateSchool({ seasonAnalytics: newSeasonAnalytics });
  }, [updateSchool]);

  /**
   * Get season analytics for a specific year
   */
  const getSeasonAnalyticsForYear = useCallback((year) => {
    return seasonAnalytics[year] || { games: [], importProfiles: [], settings: {} };
  }, [seasonAnalytics]);

  /**
   * Add imported games to season analytics
   */
  const addImportedGames = useCallback(async (year, games, profileId = null) => {
    const currentYearData = seasonAnalytics[year] || { games: [], importProfiles: [], settings: {} };
    const existingGameIds = new Set(currentYearData.games.map(g => g.gameId));

    // Filter out duplicate games
    const newGames = games.filter(g => !existingGameIds.has(g.gameId));

    if (newGames.length === 0) {
      console.log('No new games to import');
      return { added: 0, duplicates: games.length };
    }

    const updatedYearData = {
      ...currentYearData,
      games: [...currentYearData.games, ...newGames]
    };

    // Update profile last used if specified
    if (profileId) {
      updatedYearData.importProfiles = (updatedYearData.importProfiles || []).map(p =>
        p.id === profileId ? { ...p, lastUsedAt: new Date().toISOString() } : p
      );
    }

    const updatedSeasonAnalytics = {
      ...seasonAnalytics,
      [year]: updatedYearData
    };

    await updateSeasonAnalytics(updatedSeasonAnalytics);
    return { added: newGames.length, duplicates: games.length - newGames.length };
  }, [seasonAnalytics, updateSeasonAnalytics]);

  /**
   * Remove a game from season analytics
   */
  const removeImportedGame = useCallback(async (year, gameId) => {
    const currentYearData = seasonAnalytics[year];
    if (!currentYearData) return;

    const updatedYearData = {
      ...currentYearData,
      games: currentYearData.games.filter(g => g.gameId !== gameId)
    };

    const updatedSeasonAnalytics = {
      ...seasonAnalytics,
      [year]: updatedYearData
    };

    await updateSeasonAnalytics(updatedSeasonAnalytics);
  }, [seasonAnalytics, updateSeasonAnalytics]);

  /**
   * Save an import profile
   */
  const saveImportProfile = useCallback(async (year, profile) => {
    const currentYearData = seasonAnalytics[year] || { games: [], importProfiles: [], settings: {} };
    const existingIndex = currentYearData.importProfiles.findIndex(p => p.id === profile.id);

    let updatedProfiles;
    if (existingIndex >= 0) {
      updatedProfiles = [...currentYearData.importProfiles];
      updatedProfiles[existingIndex] = { ...profile, lastUsedAt: new Date().toISOString() };
    } else {
      updatedProfiles = [...currentYearData.importProfiles, profile];
    }

    const updatedYearData = {
      ...currentYearData,
      importProfiles: updatedProfiles
    };

    const updatedSeasonAnalytics = {
      ...seasonAnalytics,
      [year]: updatedYearData
    };

    await updateSeasonAnalytics(updatedSeasonAnalytics);
  }, [seasonAnalytics, updateSeasonAnalytics]);

  /**
   * Update season analytics settings for a year
   */
  const updateSeasonAnalyticsSettings = useCallback(async (year, settings) => {
    const currentYearData = seasonAnalytics[year] || { games: [], importProfiles: [], settings: {} };

    const updatedYearData = {
      ...currentYearData,
      settings: { ...currentYearData.settings, ...settings }
    };

    const updatedSeasonAnalytics = {
      ...seasonAnalytics,
      [year]: updatedYearData
    };

    await updateSeasonAnalytics(updatedSeasonAnalytics);
  }, [seasonAnalytics, updateSeasonAnalytics]);

  /**
   * Get current week object
   */
  const currentWeek = weeks.find(w => w.id === currentWeekId) || null;

  /**
   * Get plays as array for easier filtering
   */
  const playsArray = Object.values(plays);

  /**
   * Get offense positions from setup config
   * Matches the positions shown in Setup.jsx Name Positions tab
   */
  const offensePositions = (() => {
    const hidden = setupConfig?.hiddenPositions?.OFFENSE || [];
    const custom = setupConfig?.customPositions?.OFFENSE || [];
    // Core positions that match Setup.jsx DEFAULT_POSITIONS.OFFENSE
    // OL: LT, LG, C, RG, RT (linemen)
    // Skill: QB, RB, X, Y, Z, H
    // Note: WR, TE, FB, F, A, B are NOT defaults - must be added as custom positions
    const corePositions = ['LT', 'LG', 'C', 'RG', 'RT', 'QB', 'RB', 'X', 'Y', 'Z', 'H'];
    const visible = corePositions.filter(p => !hidden.includes(p));
    const customKeys = custom.map(p => p.key).filter(Boolean);
    return [...visible, ...customKeys];
  })();

    /**
   * Get active sub-level object
   */
  const activeLevel = programLevels.find(l => l.id === activeLevelId) || null;

  /**
   * Check if currently viewing an archived (historical) season
   */
  const isViewingArchive = viewingYear && viewingYear !== activeYear;

  /**
   * Get list of all available seasons (current + archived)
   */
  const availableSeasons = useMemo(() => {
    const seasons = [{ year: activeYear, isCurrent: true, label: `${activeYear} (Current)` }];
    Object.keys(archivedSeasons).forEach(year => {
      if (year !== activeYear) {
        seasons.push({
          year,
          isCurrent: false,
          label: year,
          archivedAt: archivedSeasons[year]?.archivedAt
        });
      }
    });
    return seasons.sort((a, b) => parseInt(b.year) - parseInt(a.year));
  }, [activeYear, archivedSeasons]);

  /**
   * Switch to viewing a different season
   */
  const switchToSeason = useCallback((year) => {
    if (year === activeYear) {
      // Switch back to current season
      setViewingYear(null);
    } else if (archivedSeasons[year]) {
      // Switch to archived season
      setViewingYear(year);
    }
  }, [activeYear, archivedSeasons]);

  /**
   * Get data for the currently viewed season (current or archived)
   */
  const getViewedSeasonData = useCallback(() => {
    if (!viewingYear || viewingYear === activeYear) {
      // Return current season data
      return { plays, roster, weeks, gamePlans, depthCharts, wristbands, culture, setupConfig, meetingNotes };
    }
    // Return archived season data
    const archived = archivedSeasons[viewingYear];
    if (!archived) return null;
    return archived;
  }, [viewingYear, activeYear, plays, roster, weeks, gamePlans, depthCharts, wristbands, culture, setupConfig, meetingNotes, archivedSeasons]);

  /**
   * Import templates from an archived season into current season
   */
  const importTemplatesFromSeason = useCallback(async (sourceYear, templateTypes = ['practice', 'gameplan', 'pregame']) => {
    const sourceData = archivedSeasons[sourceYear];
    if (!sourceData?.setupConfig) {
      throw new Error(`No archived data found for ${sourceYear}`);
    }

    const updates = {};

    if (templateTypes.includes('practice') && sourceData.setupConfig.practiceTemplates?.length) {
      const existingIds = new Set((setupConfig?.practiceTemplates || []).map(t => t.id));
      const newTemplates = sourceData.setupConfig.practiceTemplates
        .filter(t => !existingIds.has(t.id))
        .map(t => ({ ...t, importedFrom: sourceYear, importedAt: new Date().toISOString() }));
      updates['setupConfig.practiceTemplates'] = [...(setupConfig?.practiceTemplates || []), ...newTemplates];
    }

    if (templateTypes.includes('gameplan') && sourceData.setupConfig.gameplanTemplates?.length) {
      const existingIds = new Set((setupConfig?.gameplanTemplates || []).map(t => t.id));
      const newTemplates = sourceData.setupConfig.gameplanTemplates
        .filter(t => !existingIds.has(t.id))
        .map(t => ({ ...t, importedFrom: sourceYear, importedAt: new Date().toISOString() }));
      updates['setupConfig.gameplanTemplates'] = [...(setupConfig?.gameplanTemplates || []), ...newTemplates];
    }

    if (templateTypes.includes('pregame') && sourceData.setupConfig.pregameTemplates?.length) {
      const existingIds = new Set((setupConfig?.pregameTemplates || []).map(t => t.id));
      const newTemplates = sourceData.setupConfig.pregameTemplates
        .filter(t => !existingIds.has(t.id))
        .map(t => ({ ...t, importedFrom: sourceYear, importedAt: new Date().toISOString() }));
      updates['setupConfig.pregameTemplates'] = [...(setupConfig?.pregameTemplates || []), ...newTemplates];
    }

    if (Object.keys(updates).length > 0) {
      await updateSchool(updates);
    }

    return updates;
  }, [archivedSeasons, setupConfig, updateSchool]);

  /**
   * Start a new season - archive current data and transition to new year
   */
  const startNewSeason = useCallback(async ({ newYear, importOptions, rosterAction, seniorYear }) => {
    console.log('Starting new season:', newYear, importOptions, rosterAction);

    // Step 1: Archive current season data FIRST
    const currentSeasonArchive = {
      plays: plays,
      roster: roster,
      weeks: weeks,
      gamePlans: gamePlans,
      depthCharts: depthCharts,
      wristbands: wristbands,
      culture: culture,
      setupConfig: setupConfig,
      meetingNotes: meetingNotes,
      practiceGrades: practiceGrades,
      gameGrades: gameGrades,
      archivedAt: new Date().toISOString()
    };

    // Build the new season data
    const newSeasonData = {
      // Archive current season
      [`archivedSeasons.${activeYear}`]: currentSeasonArchive,

      // Update the active year
      'settings.activeYear': newYear,

      // Reset weekly data
      weeks: [],
      gamePlans: {},
      meetingNotes: {},
      practiceGrades: [],
      gameGrades: [],
    };

    // Handle playbook
    if (!importOptions.playbook) {
      newSeasonData.plays = {};
    }

    // Handle setup config
    if (importOptions.setupConfig) {
      // Keep setupConfig as-is, but optionally clear templates if not importing
      if (!importOptions.templates) {
        newSeasonData['setupConfig.practiceTemplates'] = [];
        newSeasonData['setupConfig.gameplanTemplates'] = [];
        newSeasonData['setupConfig.pregameTemplates'] = [];
      }
    } else {
      // Reset setupConfig to defaults but keep templates if requested
      const templatesBackup = importOptions.templates ? {
        practiceTemplates: setupConfig?.practiceTemplates || [],
        gameplanTemplates: setupConfig?.gameplanTemplates || [],
        pregameTemplates: setupConfig?.pregameTemplates || [],
      } : {};

      newSeasonData.setupConfig = {
        ...templatesBackup,
        seasonPhases: setupConfig?.seasonPhases || []
      };
    }

    // Handle culture
    if (!importOptions.culture) {
      newSeasonData.culture = {
        seasonMotto: '',
        teamMission: '',
        teamVision: '',
        teamNonNegotiables: '',
        offensePhilosophy: '',
        defensePhilosophy: '',
        specialTeamsPhilosophy: '',
        coachesExpectations: '',
        standards: {},
        goals: {},
        positionBigThree: {},
        positionBigThreeAssignments: {},
        customBigThreeGroups: []
      };
    }

    // Handle roster
    if (importOptions.roster) {
      if (rosterAction === 'archive-seniors') {
        // Archive players matching senior year
        const updatedRoster = roster.map(player => {
          const playerYear = (player.year || player.grade || '').toUpperCase();
          const isSenior = playerYear === seniorYear.toUpperCase();
          if (isSenior) {
            return { ...player, archived: true, archivedAt: new Date().toISOString(), archivedReason: 'graduated' };
          }
          return player;
        });
        newSeasonData.roster = updatedRoster;
      } else if (rosterAction === 'archive-all') {
        // Archive all players
        const updatedRoster = roster.map(player => ({
          ...player,
          archived: true,
          archivedAt: new Date().toISOString(),
          archivedReason: 'new_season'
        }));
        newSeasonData.roster = updatedRoster;
      }
      // 'keep-all' - don't modify roster
    } else {
      // Not importing roster - start fresh
      newSeasonData.roster = [];
    }

    // Handle wristband configs
    if (!importOptions.wristbandConfigs) {
      newSeasonData.wristbands = {};
    }

    // Handle depth charts
    if (!importOptions.depthCharts) {
      newSeasonData.depthCharts = {};
    }

    // Save all changes
    await updateSchool(newSeasonData);

    // Update local state
    setArchivedSeasons(prev => ({ ...prev, [activeYear]: currentSeasonArchive }));
    setActiveYear(newYear);
    setViewingYear(null);
    setWeeks([]);
    setGamePlans({});
    setMeetingNotes({});
    setPracticeGrades([]);
    setGameGrades([]);

    if (newSeasonData.roster) {
      setRoster(newSeasonData.roster);
    }
    if (newSeasonData.plays) {
      setPlays({});
    }
    if (newSeasonData.wristbands) {
      setWristbands({});
    }
    if (newSeasonData.depthCharts) {
      setDepthCharts({});
    }

    console.log('New season started:', newYear);
  }, [activeYear, roster, plays, weeks, gamePlans, depthCharts, wristbands, culture, setupConfig, meetingNotes, practiceGrades, gameGrades, updateSchool]);

  const value = {
    // Data
    school,
    roster,
    plays,
    playsArray,
    offensePositions,
    staff,
    weeks,
    depthCharts,
    wristbands,
    gamePlans,
    settings,
    activeYear,
    currentWeekId,
    currentWeek,
    programLevels,
    globalWeekTemplates,
    visibleFeatures,
    activeLevelId,
    activeLevel,
    culture,
    setupConfig,
    meetingNotes,
    practiceGrades,
    gameGrades,
    seasonAnalytics,

    // Season history
    archivedSeasons,
    viewingYear,
    isViewingArchive,
    availableSeasons,

    // State
    loading,
    error,
    saveStatus,

    // Actions
    updateSchool,
    saveNow,
    updateRoster,
    updatePlays,
    updatePlay,
    batchUpdatePlays,
    addPlay,
    updateWeeks,
    updateWeek,
    updateStaff,
    updateDepthCharts,
    updateWristbands,
    updateGamePlans,
    updateSettings,
    updateCulture,
    updateSetupConfig,
    updateMeetingNotes,
    updatePracticeGrades,
    savePracticeGradeSession,
    updateGameGrades,
    saveGameGradeSession,
    setCurrentWeekId,
    setActiveLevelId,
    startNewSeason,
    switchToSeason,
    getViewedSeasonData,
    importTemplatesFromSeason,
    // Season Analytics
    updateSeasonAnalytics,
    getSeasonAnalyticsForYear,
    addImportedGames,
    removeImportedGame,
    saveImportProfile,
    updateSeasonAnalyticsSettings,
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}

export default SchoolContext;
