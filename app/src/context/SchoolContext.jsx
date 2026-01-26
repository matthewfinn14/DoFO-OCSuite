import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const { currentSchool, isAuthenticated, user, devMode } = useAuth();

  // Core school data
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Setup configuration data
  const [setupConfig, setSetupConfig] = useState({
    // Positions
    positionNames: {},
    positionColors: {},
    positionDescriptions: {},
    customPositions: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] },
    hiddenPositions: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] },

    // Position Groups (with coach assignments and Big 3)
    positionGroups: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] },

    // Personnel Groupings (Offense only)
    personnelGroupings: [],

    // Formations
    formations: [],

    // Play Categories/Buckets
    playCategories: [],

    // Play Call Syntax
    syntax: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] },

    // Term Library / Play Call Chain Terms
    termLibrary: { OFFENSE: {}, DEFENSE: {}, SPECIAL_TEAMS: {} },

    // Glossary Definitions
    glossaryDefinitions: { OFFENSE: {}, DEFENSE: {}, SPECIAL_TEAMS: {} },

    // Practice Setup
    practiceSegmentTypes: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [], PRACTICE: [] },
    practiceFocusItems: { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [], PRACTICE: [] },
    practiceSegmentSettings: {},

    // Templates
    practiceTemplates: [],
    gameplanTemplates: [],
    pregameTemplates: [],

    // OL Schemes
    passProtections: [],
    runBlocking: []
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
          setProgramLevels(data.programLevels || []);
          setGlobalWeekTemplates(data.globalWeekTemplates || []);
          setVisibleFeatures(data.visibleFeatures || { gameWeek: { enabled: true, items: { schemeSetup: true, playbook: true } } });
          if (data.culture) setCulture(prev => ({ ...prev, ...data.culture }));
          if (data.setupConfig) setSetupConfig(prev => ({ ...prev, ...data.setupConfig }));
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
          setProgramLevels(data.programLevels || []);
          setGlobalWeekTemplates(data.weekTemplates || []);
          setVisibleFeatures(data.visibleFeatures || { gameWeek: { enabled: true, items: { schemeSetup: true, playbook: true } } });
          if (data.culture) setCulture(prev => ({ ...prev, ...data.culture }));
          if (data.setupConfig) setSetupConfig(prev => ({ ...prev, ...data.setupConfig }));
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

  /**
   * Update school data
   */
  const updateSchool = useCallback(async (updates) => {
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
      } catch (err) {
        console.error('Error saving dev data:', err);
        setError(err.message);
        throw err;
      }
      return;
    }

    if (!currentSchool?.id) return;

    try {
      const schoolRef = doc(db, 'schools', currentSchool.id);
      await updateDoc(schoolRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid
      });
    } catch (err) {
      console.error('Error updating school:', err);
      setError(err.message);
      throw err;
    }
  }, [currentSchool?.id, user?.uid, devMode]);

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
   * Update a single play
   */
  const updatePlay = useCallback(async (playId, playData) => {
    const newPlays = { ...plays, [playId]: { ...plays[playId], ...playData } };
    await updatePlays(newPlays);
  }, [plays, updatePlays]);

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
   * Get current week object
   */
  const currentWeek = weeks.find(w => w.id === currentWeekId) || null;

  /**
   * Get plays as array for easier filtering
   */
  const playsArray = Object.values(plays);

    /**
   * Get active sub-level object
   */
  const activeLevel = programLevels.find(l => l.id === activeLevelId) || null;

  const value = {
    // Data
    school,
    roster,
    plays,
    playsArray,
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

    // State
    loading,
    error,

    // Actions
    updateSchool,
    updateRoster,
    updatePlays,
    updatePlay,
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
    setCurrentWeekId,
    setActiveLevelId,
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
