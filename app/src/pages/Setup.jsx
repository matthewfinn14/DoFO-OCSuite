import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Users,
  Layers,
  UserCheck,
  LayoutGrid,
  Tag,
  Grid,
  BookOpen,
  List,
  FileText,
  Calendar,
  LayoutDashboard,
  Clock,
  Shield,
  Plus,
  X,
  Trash2,
  Edit3,
  ChevronUp,
  ChevronDown,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  Info,
  Image,
  Cloud,
  CloudOff,
  Loader2,
  Eye,
  Copy,
  Target
} from 'lucide-react';
import PlayDiagramEditor from '../components/diagrams/PlayDiagramEditor';
import DiagramPreview from '../components/diagrams/DiagramPreview';

// Collapsible Help Section component
function HelpSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 bg-slate-700/30 border border-slate-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-sky-400" />
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-600">
          {children}
        </div>
      )}
    </div>
  );
}

// Help content for each tab
const TAB_HELP = {
  positions: {
    title: "About Positions",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Define and customize the position labels used throughout your playbook,
          depth charts, and practice scripts. Each position gets a name, color, and description.
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Position names and colors appear in your Playbook, Depth Charts,
          Wristband Builder, and Practice Scripts. Changing a position here updates it everywhere.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Consistent terminology prevents confusion. If your system calls
          the slot receiver "Y" instead of "Slot", set it here once and it flows through the entire app.
        </p>
      </div>
    )
  },
  'position-groups': {
    title: "About Position Groups",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Organize positions into coaching groups (e.g., "Offensive Line",
          "Wide Receivers") and assign a coach to each group. Set "Big 3" focus points for each group.
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Position groups link to the Alignment Dashboard's Position Big 3
          section, allowing coaches to see their group's focus points. Also used in practice plan filtering.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Helps organize your staff responsibilities and ensures each
          position group has clear coaching points to focus on during practice and games.
        </p>
      </div>
    )
  },
  personnel: {
    title: "About Personnel Groupings",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Define your personnel packages (e.g., "11" = 1 RB, 1 TE; "12" = 1 RB, 2 TE).
          Select which skill positions are on the field for each package.
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Personnel links to Formations—each formation can be tagged with its
          personnel package. Used in Playbook filtering and Game Plan organization.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Proper personnel groupings make it easy to filter plays by package,
          build wristbands for specific personnel, and organize your game plan by grouping.
        </p>
      </div>
    )
  },
  formations: {
    title: "About Formations",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Create your formation library with names and personnel tags.
          For defense, these are "Fronts"; for special teams, these are "Packages."
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Formations are used in the Playbook when tagging plays,
          in the Wristband Builder for organization, and in Practice Scripts for period planning.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> A well-organized formation library speeds up play entry
          and ensures consistent naming across all coaches using the system.
        </p>
      </div>
    )
  },
  'season-phases': {
    title: "About Season Phases",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Define the phases of your season (Offseason, Summer,
          Preseason, Regular Season, Playoffs, etc.) with start dates for each phase.
        </p>
        <p>
          <strong className="text-white">Smart Dates:</strong> When you set a phase start date, weeks within that
          phase auto-calculate their dates. Week 1 starts on your phase date, Week 2 is 7 days later, etc.
        </p>
        <p>
          <strong className="text-white">Customizable:</strong> Add custom phases like "Spring Ball", "7-on-7 Season",
          or "Playoff Run" to match your program's calendar.
        </p>
      </div>
    )
  },
  'season-schedule': {
    title: "About Week Schedule",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Add weeks to each phase with opponents and game details.
          Weeks are auto-dated based on the phase start date you set.
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Weeks created here appear in the sidebar navigation.
          Each week links to practice plans, game plans, install sheets, and other weekly tools.
        </p>
        <p>
          <strong className="text-white">Sub-level Games:</strong> Assign weeks to specific levels (JV, Freshman) when
          they have games that don't match the Varsity schedule.
        </p>
      </div>
    )
  },
  'program-events': {
    title: "About Program Events",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Track program-wide events like banquets, pool parties,
          team meals, community service, or fundraisers that involve the whole program.
        </p>
        <p>
          <strong className="text-white">Visibility:</strong> Program events appear on calendars for all levels,
          keeping everyone in the program informed about important dates.
        </p>
        <p>
          <strong className="text-white">Examples:</strong> End of season banquet, summer pool party, team meals
          before games, community service projects, booster club events.
        </p>
      </div>
    )
  },
  'play-buckets': {
    title: "About Play Buckets / Categories",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Define high-level categories for organizing plays
          (e.g., Run, Pass, RPO, Screen for offense; Fronts, Coverages, Blitzes for defense).
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Every play in your Playbook gets tagged with a category.
          Categories are used for filtering, reporting, and wristband organization.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Categories provide the top-level structure for your
          playbook. Good categories make it easy to find plays quickly and analyze your scheme balance.
        </p>
      </div>
    )
  },
  buckets: {
    title: "About Concept Groups",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Within each bucket, create groups of related concepts
          (e.g., under "Run": Inside Zone, Outside Zone, Power, Counter).
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Concept groups provide a second level of organization
          in your Playbook. Use them to group similar plays together for install tracking.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Concept groups help you track what's installed,
          what needs more reps, and how your scheme is organized at a conceptual level.
        </p>
      </div>
    )
  },
  'play-call-chain': {
    title: "About Play Call Chain",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Define your play call structure (e.g., Formation → Motion → Play → Tag)
          and create a library of terms for each component (formations, motions, protections, etc.).
        </p>
        <p>
          <strong className="text-white">Prefix & Suffix:</strong> These characters wrap around each component on wristband calls,
          helping coaches and players visually identify which part of the play call chain they're reading. For example,
          you might use quotes around formations ("Trips") or brackets around tags [X Shallow] so the parts are clearly separated.
        </p>
        <p>
          <strong className="text-white">Connections:</strong> The play call chain feeds into the Playbook's play entry system,
          providing dropdowns and autocomplete for consistent naming. Terms defined here also populate the Glossary.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> A standardized vocabulary prevents "Trips" vs "Trio" confusion.
          The structured syntax ensures every coach writes plays the same way, and clear visual separators on wristbands
          make it easier for players to read calls quickly under pressure.
        </p>
      </div>
    )
  },
  glossary: {
    title: "About Glossary",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> A centralized dictionary of all terms used in your system.
          Add definitions for formations, motions, concepts, and any terminology your staff needs to know.
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Terms are automatically compiled from your Play Call Chain.
          You can also add custom terms. Definitions help new coaches learn your system quickly.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Every program has unique terminology.
          A living glossary ensures everyone speaks the same language and can be used for onboarding new staff.
        </p>
      </div>
    )
  },
  'oline-schemes': {
    title: "About WIZ Library for OL",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Build your offensive line "WIZ" (What I Z) library—define pass protection
          calls (slide direction, man side) and run blocking schemes (zone, gap, power, etc.).
        </p>
        <p>
          <strong className="text-white">Connections:</strong> WIZ schemes can be tagged on plays in the Playbook and
          are used in the OL-specific views for game planning and installation tracking.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> A centralized WIZ library ensures your OL coach and skill
          position coaches are speaking the same language about protections and blocking assignments.
        </p>
      </div>
    )
  },
  situations: {
    title: "About Define Situations",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Configure situational categories for tagging and filtering plays—
          field zones (Red Zone, Gold Zone), down & distance categories (3rd & Long), and special situations (2-Min Offense).
        </p>
        <p>
          <strong className="text-white">Connections:</strong> These categories appear in your Playbook filters and
          Play Editor tag selection, allowing you to organize plays by game situation.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Custom situations let you match your program's terminology
          and game-planning approach. Tag plays with situations to quickly filter what to call in specific game scenarios.
        </p>
      </div>
    )
  },
  'practice-lists': {
    title: "About Practice Lists",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Customize the dropdown options used in Practice Planner—segment
          types (e.g., "Team Run", "7-on-7") and focus items (e.g., "Run Game", "Red Zone").
        </p>
        <p>
          <strong className="text-white">Connections:</strong> These lists populate dropdowns in the Practice Planner
          and Practice Script Builder for consistent period labeling.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Custom practice categories match your program's
          terminology and make practice planning faster with pre-defined options.
        </p>
      </div>
    )
  },
  'practice-templates': {
    title: "About Practice Templates",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Save and reuse practice plan structures. Templates are created
          from the Practice Planner using "Save as Template."
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Templates can be loaded in Practice Planner to quickly
          set up a new day's practice with your standard structure.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Most programs run similar practice structures week-to-week.
          Templates save time and ensure consistency across the coaching staff.
        </p>
      </div>
    )
  },
  'gameplan-templates': {
    title: "About Game Plan Templates",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Save and reuse game plan structures. Templates are created
          from the Game Planner using "Save as Template."
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Templates can be loaded in Game Planner to quickly
          set up a new week's game plan with your standard sections.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> Consistent game plan structure helps coaches
          prepare efficiently and ensures nothing gets missed during game week.
        </p>
      </div>
    )
  },
  'pregame-templates': {
    title: "About Pregame Templates",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Save pregame warmup timelines and schedules. Create your
          standard pregame routine with timing blocks.
        </p>
        <p>
          <strong className="text-white">Connections:</strong> Templates are used in the Pregame Timeline tool to
          quickly set up game day schedules.
        </p>
        <p>
          <strong className="text-white">Why set this up?</strong> A documented pregame routine ensures consistency
          and prevents "what time do we start stretch?" questions on game day.
        </p>
      </div>
    )
  }
};

// Default positions by phase
const DEFAULT_POSITIONS = {
  OFFENSE: [
    { key: 'QB', default: 'QB', description: 'Quarterback' },
    { key: 'RB', default: 'RB', description: 'Running Back' },
    { key: 'FB', default: 'FB', description: 'Fullback' },
    { key: 'WR', default: 'WR', description: 'Wide Receiver' },
    { key: 'TE', default: 'TE', description: 'Tight End' },
    { key: 'LT', default: 'LT', description: 'Left Tackle' },
    { key: 'LG', default: 'LG', description: 'Left Guard' },
    { key: 'C', default: 'C', description: 'Center' },
    { key: 'RG', default: 'RG', description: 'Right Guard' },
    { key: 'RT', default: 'RT', description: 'Right Tackle' },
    { key: 'X', default: 'X', description: 'Split End' },
    { key: 'Y', default: 'Y', description: 'Slot Receiver' },
    { key: 'Z', default: 'Z', description: 'Flanker' },
    { key: 'H', default: 'H', description: 'H-Back' },
    { key: 'F', default: 'F', description: 'F-Back' }
  ],
  DEFENSE: [
    { key: 'DE', default: 'DE', description: 'Defensive End' },
    { key: 'DT', default: 'DT', description: 'Defensive Tackle' },
    { key: 'NT', default: 'NT', description: 'Nose Tackle' },
    { key: 'OLB', default: 'OLB', description: 'Outside Linebacker' },
    { key: 'ILB', default: 'ILB', description: 'Inside Linebacker' },
    { key: 'MLB', default: 'MLB', description: 'Middle Linebacker' },
    { key: 'CB', default: 'CB', description: 'Cornerback' },
    { key: 'FS', default: 'FS', description: 'Free Safety' },
    { key: 'SS', default: 'SS', description: 'Strong Safety' },
    { key: 'NB', default: 'NB', description: 'Nickelback' },
    { key: 'DB', default: 'DB', description: 'Dime Back' }
  ],
  SPECIAL_TEAMS: [
    { key: 'K', default: 'K', description: 'Kicker' },
    { key: 'P', default: 'P', description: 'Punter' },
    { key: 'LS', default: 'LS', description: 'Long Snapper' },
    { key: 'H', default: 'H', description: 'Holder' },
    { key: 'KR', default: 'KR', description: 'Kick Returner' },
    { key: 'PR', default: 'PR', description: 'Punt Returner' },
    { key: 'G', default: 'G', description: 'Gunner' },
    { key: 'PP', default: 'PP', description: 'Personal Protector' }
  ]
};

// Default position colors
const DEFAULT_POSITION_COLORS = {
  QB: '#1e3a5f', RB: '#3b82f6', FB: '#0891b2', WR: '#a855f7', TE: '#f97316',
  LT: '#64748b', LG: '#64748b', C: '#64748b', RG: '#64748b', RT: '#64748b',
  X: '#a855f7', Y: '#22c55e', Z: '#eab308', H: '#06b6d4', F: '#f97316',
  DE: '#ef4444', DT: '#dc2626', NT: '#b91c1c', OLB: '#f59e0b', ILB: '#fbbf24',
  MLB: '#f59e0b', CB: '#10b981', FS: '#14b8a6', SS: '#0d9488', NB: '#6ee7b7', DB: '#34d399',
  K: '#8b5cf6', P: '#8b5cf6', LS: '#64748b', KR: '#3b82f6', PR: '#3b82f6', G: '#f97316', PP: '#94a3b8'
};

// Phase tabs
const PHASES = [
  { id: 'PROGRAM', label: 'Program Setup' },
  { id: 'SEASON', label: 'Season Setup' },
  { id: 'OFFENSE', label: 'Offense Setup' },
  { id: 'DEFENSE', label: 'Defense Setup' },
  { id: 'SPECIAL_TEAMS', label: 'Special Teams Setup' },
  { id: 'PRACTICE', label: 'Practice Setup' }
];

export default function Setup() {
  const { school, staff, setupConfig, updateSetupConfig, weeks, activeYear, updateWeeks, playsArray } = useSchool();
  const { isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();
  const { phase: urlPhase, tab: urlTab } = useParams();
  const navigate = useNavigate();

  // Map URL phase slug to internal phase ID
  const phaseSlugToId = {
    'offense': 'OFFENSE',
    'defense': 'DEFENSE',
    'special-teams': 'SPECIAL_TEAMS',
    'practice': 'PRACTICE',
    'program': 'PROGRAM',
    'season': 'SEASON'
  };

  const phaseIdToSlug = {
    'OFFENSE': 'offense',
    'DEFENSE': 'defense',
    'SPECIAL_TEAMS': 'special-teams',
    'PRACTICE': 'practice',
    'PROGRAM': 'program',
    'SEASON': 'season'
  };

  // Get phase from URL or default
  const getPhaseFromUrl = () => {
    if (urlPhase && phaseSlugToId[urlPhase]) {
      return phaseSlugToId[urlPhase];
    }
    return 'OFFENSE';
  };

  // Phase selection - derive from URL
  const [phase, setPhase] = useState(() => getPhaseFromUrl());
  const isPractice = phase === 'PRACTICE';
  const isProgram = phase === 'PROGRAM';
  const isSeason = phase === 'SEASON';
  const isOffense = phase === 'OFFENSE';
  const isDefense = phase === 'DEFENSE';
  const isST = phase === 'SPECIAL_TEAMS';

  // Active tab within phase - derive from URL or default
  const getDefaultTab = (p) => {
    if (p === 'PRACTICE') return 'practice-lists';
    if (p === 'PROGRAM') return 'levels';
    if (p === 'SEASON') return 'season-phases';
    return 'positions';
  };
  const [activeTab, setActiveTab] = useState(() => urlTab || getDefaultTab(phase));

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'unsaved' | 'saving' | 'error'
  const [error, setError] = useState(null);

  // Local state for editing (to avoid constant Firebase writes)
  const [localConfig, setLocalConfig] = useState(setupConfig);
  const initialConfigRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);

  // Track if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!initialConfigRef.current) return false;
    return JSON.stringify(localConfig) !== JSON.stringify(initialConfigRef.current);
  }, [localConfig]);

  // Sync local config when setupConfig changes from Firebase
  useEffect(() => {
    setLocalConfig(setupConfig);
    initialConfigRef.current = setupConfig;
    setSaveStatus('saved');
  }, [setupConfig]);

  // Autosave with debounce (3 seconds after last change)
  useEffect(() => {
    if (!hasUnsavedChanges()) return;

    setSaveStatus('unsaved');

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new autosave timeout
    autosaveTimeoutRef.current = setTimeout(async () => {
      if (!hasUnsavedChanges()) return;

      setSaveStatus('saving');
      setSaving(true);
      setError(null);

      try {
        await updateSetupConfig(localConfig);
        initialConfigRef.current = localConfig;
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
        setError(err.message || 'Failed to autosave');
      } finally {
        setSaving(false);
      }
    }, 3000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [localConfig, hasUnsavedChanges, updateSetupConfig]);

  // Warn on browser close/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Sync URL with tab changes
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const phaseSlug = phaseIdToSlug[phase];
    navigate(`/setup/${phaseSlug}/${newTab}`, { replace: true });
  };

  // Sync URL with phase changes
  const handlePhaseChange = (newPhase) => {
    setPhase(newPhase);
    const defaultTab = getDefaultTab(newPhase);
    setActiveTab(defaultTab);
    const phaseSlug = phaseIdToSlug[newPhase];
    navigate(`/setup/${phaseSlug}/${defaultTab}`, { replace: true });
  };

  // Handle URL changes (e.g., browser back/forward)
  useEffect(() => {
    const newPhase = getPhaseFromUrl();
    if (newPhase !== phase) {
      setPhase(newPhase);
    }
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    } else if (!urlTab && urlPhase) {
      // URL has phase but no tab - set default tab
      setActiveTab(getDefaultTab(newPhase));
    }
  }, [urlPhase, urlTab]);

  const canEdit = isHeadCoach || isTeamAdmin || isSiteAdmin;

  // Manual save (backup option)
  const saveChanges = async () => {
    // Clear any pending autosave
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    setSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      await updateSetupConfig(localConfig);
      initialConfigRef.current = localConfig;
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving setup:', err);
      setSaveStatus('error');
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Helper to update local config
  const updateLocal = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  // Get positions for current phase
  const getPositions = () => {
    const defaults = DEFAULT_POSITIONS[phase] || [];
    const custom = localConfig.customPositions?.[phase] || [];
    const hidden = localConfig.hiddenPositions?.[phase] || [];
    return [
      ...defaults.filter(p => !hidden.includes(p.key)),
      ...custom.map(p => ({ ...p, isCustom: true }))
    ];
  };

  // Get play buckets for current phase
  const getPlayBuckets = () => {
    return (localConfig.playBuckets || []).filter(b => b.phase === phase || (!b.phase && phase === 'OFFENSE'));
  };

  // Tabs based on phase
  const getTabs = () => {
    if (isProgram) {
      return [
        { id: 'levels', label: 'Program Levels', icon: Layers }
      ];
    }
    if (isSeason) {
      return [
        { id: 'season-phases', label: 'Season Phases', icon: LayoutDashboard },
        { id: 'season-schedule', label: 'Week Schedule', icon: Calendar },
        { id: 'program-events', label: 'Program Events', icon: Clock }
      ];
    }
    if (isPractice) {
      return [
        { id: 'practice-lists', label: 'Practice Lists', icon: List }
      ];
    }
    const tabs = [
      { id: 'positions', label: 'Name Positions', icon: Users },
      { id: 'position-groups', label: 'Position Groups', icon: Layers },
    ];
    if (isOffense) {
      tabs.push({ id: 'personnel', label: 'Personnel Groupings', icon: UserCheck });
    }
    tabs.push({ id: 'play-call-chain', label: 'Play Call Chain', icon: List });
    tabs.push(
      { id: 'formations', label: 'Formation/Front Setup', icon: LayoutGrid },
      { id: 'play-buckets', label: isDefense || isST ? 'Categories' : 'Play Buckets', icon: Tag },
      { id: 'concept-groups', label: isDefense || isST ? 'Variations' : 'Concept Groups', icon: Grid }
    );
    if (isOffense) {
      tabs.push(
        { id: 'read-types', label: 'Read Types', icon: Eye },
        { id: 'look-alike-series', label: 'Look-Alike Series', icon: Copy },
        { id: 'situations', label: 'Define Situations', icon: Target },
        { id: 'oline-schemes', label: 'WIZ Library for OL', icon: Shield },
        { id: 'glossary', label: 'Glossary', icon: BookOpen }
      );
    } else {
      tabs.push({ id: 'glossary', label: 'Glossary', icon: BookOpen });
    }
    return tabs;
  };

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-slate-400">
            Only Head Coaches and Team Admins can access system setup.
          </p>
        </div>
      </div>
    );
  }

  // Save status indicator component
  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sky-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-emerald-400">
            <Cloud size={16} />
            <span className="text-sm">All changes saved</span>
          </div>
        );
      case 'unsaved':
        return (
          <div className="flex items-center gap-2 text-amber-400">
            <CloudOff size={16} />
            <span className="text-sm">Unsaved changes</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">Save failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings size={32} className="text-sky-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">System Setup</h1>
            <p className="text-slate-400 text-sm">Configure your program settings and terminology</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Save status indicator */}
          <SaveStatusIndicator />

          {/* Manual save button (shown when unsaved or error) */}
          {(saveStatus === 'unsaved' || saveStatus === 'error') && (
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Now
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Help Section */}
      <HelpSection title="What is System Setup?">
        <div className="pt-3 space-y-3">
          <div>
            <h4 className="text-white font-medium mb-1">Purpose</h4>
            <p>
              System Setup is where you configure the foundational elements of your football program in DoFO.
              This includes positions, formations, play categories, terminology, and practice structures.
              Think of it as building the vocabulary and organizational structure that the rest of the app will use.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">The Four Phases</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Offense:</strong> Set up offensive positions, formations, personnel groupings, play buckets, and OL schemes</li>
              <li><strong>Defense:</strong> Configure defensive positions, fronts, coverages, and blitz categories</li>
              <li><strong>Special Teams:</strong> Define special teams positions, packages, and play categories</li>
              <li><strong>Practice:</strong> Customize practice segment types, focus items, and save templates</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Why Set This Up First?</h4>
            <p>
              Taking time to configure System Setup properly pays dividends all season. Every play you enter,
              practice you plan, and wristband you build will use these settings. Investing 30-60 minutes here
              saves hours of inconsistency and confusion later. Click on each tab's help icon for specific guidance.
            </p>
          </div>
        </div>
      </HelpSection>

      {/* Phase Tabs */}
      <div className="flex gap-2 mb-6">
        {PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => handlePhaseChange(p.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              phase === p.id
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Content Tabs + Panel */}
      <div className="flex gap-6">
        {/* Tab Navigation */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-2">
            {getTabs().map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700 p-6">
          {/* Tab-specific Help */}
          {TAB_HELP[activeTab] && (
            <HelpSection title={TAB_HELP[activeTab].title}>
              {TAB_HELP[activeTab].content}
            </HelpSection>
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && !isPractice && !isProgram && (
            <PositionsTab
              phase={phase}
              positions={getPositions()}
              positionNames={localConfig.positionNames || {}}
              positionColors={localConfig.positionColors || {}}
              positionDescriptions={localConfig.positionDescriptions || {}}
              hiddenPositions={localConfig.hiddenPositions || {}}
              customPositions={localConfig.customPositions || {}}
              onUpdate={updateLocal}
            />
          )}

          {/* Position Groups Tab */}
          {activeTab === 'position-groups' && !isPractice && !isProgram && (
            <PositionGroupsTab
              phase={phase}
              positionGroups={localConfig.positionGroups || {}}
              staff={staff || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Personnel Tab (Offense only) */}
          {activeTab === 'personnel' && isOffense && (
            <PersonnelTab
              personnelGroupings={localConfig.personnelGroupings || []}
              positions={getPositions()}
              positionNames={localConfig.positionNames || {}}
              positionColors={localConfig.positionColors || {}}
              onUpdate={updateLocal}
            />
          )}

          {/* Formations Tab */}
          {activeTab === 'formations' && !isPractice && !isProgram && (
            <FormationsTab
              phase={phase}
              formations={(localConfig.formations || []).filter(f => f.phase === phase)}
              personnelGroupings={localConfig.personnelGroupings || []}
              onUpdate={(formations) => {
                const otherFormations = (localConfig.formations || []).filter(f => f.phase !== phase);
                updateLocal('formations', [...otherFormations, ...formations]);
              }}
            />
          )}

          {/* Play Buckets Tab */}
          {activeTab === 'play-buckets' && !isPractice && !isProgram && (
            <PlayBucketsTab
              phase={phase}
              buckets={getPlayBuckets()}
              allBuckets={localConfig.playBuckets || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Read Types Tab (Offense only) */}
          {activeTab === 'read-types' && !isPractice && !isProgram && phase === 'OFFENSE' && (
            <ReadTypesTab
              readTypes={localConfig.readTypes || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Look-Alike Series Tab (Offense only) */}
          {activeTab === 'look-alike-series' && !isPractice && !isProgram && phase === 'OFFENSE' && (
            <LookAlikeSeriesTab
              series={localConfig.lookAlikeSeries || []}
              buckets={getPlayBuckets()}
              plays={playsArray}
              onUpdate={updateLocal}
            />
          )}

          {/* Define Situations Tab (Offense only) */}
          {activeTab === 'situations' && !isPractice && !isProgram && phase === 'OFFENSE' && (
            <DefineSituationsTab
              fieldZones={localConfig.fieldZones || []}
              downDistanceCategories={localConfig.downDistanceCategories || []}
              specialSituations={localConfig.specialSituations || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Concept Groups Tab */}
          {activeTab === 'concept-groups' && !isPractice && !isProgram && (
            <ConceptGroupsTab
              phase={phase}
              buckets={getPlayBuckets()}
              allBuckets={localConfig.playBuckets || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Play Call Chain Tab */}
          {activeTab === 'play-call-chain' && !isPractice && !isProgram && (
            <PlayCallChainTab
              phase={phase}
              syntax={localConfig.syntax || {}}
              termLibrary={localConfig.termLibrary || {}}
              onUpdate={updateLocal}
            />
          )}

          {/* Glossary Definitions Tab */}
          {activeTab === 'glossary' && !isPractice && !isProgram && (
            <GlossaryDefinitionsTab
              phase={phase}
              termLibrary={localConfig.termLibrary || {}}
              syntax={localConfig.syntax || {}}
              glossaryDefinitions={localConfig.glossaryDefinitions || {}}
              onUpdate={updateLocal}
            />
          )}

          {/* OL Schemes Tab */}
          {activeTab === 'oline-schemes' && isOffense && (
            <OLSchemesTab
              passProtections={localConfig.passProtections || []}
              runBlocking={localConfig.runBlocking || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Practice Lists Tab */}
          {activeTab === 'practice-lists' && isPractice && (
            <PracticeListsTab
              phase={phase}
              segmentTypes={localConfig.practiceSegmentTypes || {}}
              focusItems={localConfig.practiceFocusItems || {}}
              segmentSettings={localConfig.practiceSegmentSettings || {}}
              onUpdate={updateLocal}
            />
          )}

          {/* Program Levels Tab */}
          {activeTab === 'levels' && isProgram && (
            <ProgramLevelsTab
              programLevels={localConfig.programLevels || []}
              staff={staff || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Season Phases Tab */}
          {activeTab === 'season-phases' && isSeason && (
            <SeasonPhasesTab
              seasonPhases={localConfig.seasonPhases || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Season Schedule Tab */}
          {activeTab === 'season-schedule' && isSeason && (
            <SeasonScheduleTab
              weeks={weeks}
              seasonPhases={localConfig.seasonPhases || []}
              programLevels={localConfig.programLevels || []}
              activeYear={activeYear}
              onUpdateWeeks={updateWeeks}
            />
          )}

          {/* Program Events Tab */}
          {activeTab === 'program-events' && isSeason && (
            <ProgramEventsTab
              programEvents={localConfig.programEvents || []}
              onUpdate={updateLocal}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============= SUB-COMPONENTS =============

// Positions Tab Component
function PositionsTab({ phase, positions, positionNames, positionColors, positionDescriptions, hiddenPositions, customPositions, onUpdate }) {
  const addPosition = () => {
    const key = prompt('Enter Position Key (1-3 letters, e.g., "F" or "S2"):');
    if (!key) return;
    const cleanKey = key.toUpperCase().trim().slice(0, 3);
    if (!cleanKey) return;

    const allKeys = positions.map(p => p.key);
    if (allKeys.includes(cleanKey)) {
      alert('That position key already exists!');
      return;
    }

    const desc = prompt('Enter Description (e.g., "Flex Tight End"):') || cleanKey;
    const newPos = { key: cleanKey, default: cleanKey, description: desc, isCustom: true };
    const current = customPositions[phase] || [];
    onUpdate('customPositions', { ...customPositions, [phase]: [...current, newPos] });
  };

  const removePosition = (key) => {
    if (!confirm(`Permanently delete custom position ${key}?`)) return;
    const current = customPositions[phase] || [];
    onUpdate('customPositions', { ...customPositions, [phase]: current.filter(p => p.key !== key) });
  };

  const hidePosition = (key) => {
    const current = hiddenPositions[phase] || [];
    if (current.includes(key)) return;
    onUpdate('hiddenPositions', { ...hiddenPositions, [phase]: [...current, key] });
  };

  const restorePosition = (key) => {
    const current = hiddenPositions[phase] || [];
    onUpdate('hiddenPositions', { ...hiddenPositions, [phase]: current.filter(h => h !== key) });
  };

  const updatePositionName = (key, value) => {
    onUpdate('positionNames', { ...positionNames, [key]: value.toUpperCase().slice(0, 3) });
  };

  const updatePositionColor = (key, value) => {
    onUpdate('positionColors', { ...positionColors, [key]: value });
  };

  const updatePositionDesc = (key, value) => {
    onUpdate('positionDescriptions', { ...positionDescriptions, [key]: value });
  };

  const hiddenList = hiddenPositions[phase] || [];
  const hiddenDefaults = (DEFAULT_POSITIONS[phase] || []).filter(p => hiddenList.includes(p.key));

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Position Names</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {positions.map(pos => (
          <div key={pos.key} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">
                  {positionNames[pos.key] || pos.default}
                </span>
                <button
                  onClick={() => pos.isCustom ? removePosition(pos.key) : hidePosition(pos.key)}
                  className="p-0.5 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={pos.isCustom ? "Delete Position" : "Hide Position"}
                >
                  <X size={12} />
                </button>
              </div>
              <input
                type="text"
                value={positionDescriptions[pos.key] ?? pos.description}
                onChange={(e) => updatePositionDesc(pos.key, e.target.value)}
                placeholder={pos.description}
                className="text-xs text-right bg-transparent border-none text-slate-300 w-24 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 items-stretch">
              <div className="relative flex-shrink-0">
                <input
                  type="color"
                  value={positionColors[pos.key] || DEFAULT_POSITION_COLORS[pos.key] || '#64748b'}
                  onChange={(e) => updatePositionColor(pos.key, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-white/20"
                  style={{ backgroundColor: positionColors[pos.key] || DEFAULT_POSITION_COLORS[pos.key] || '#64748b' }}
                >
                  <Edit3 size={14} className="text-white/70" />
                </div>
              </div>
              <input
                type="text"
                value={positionNames[pos.key] || pos.default}
                onChange={(e) => updatePositionName(pos.key, e.target.value)}
                placeholder={pos.default}
                maxLength={3}
                className="flex-1 min-w-0 px-2 py-2 text-center font-bold text-white rounded-lg border border-slate-600"
                style={{ backgroundColor: positionColors[pos.key] || DEFAULT_POSITION_COLORS[pos.key] || '#64748b' }}
              />
            </div>
          </div>
        ))}

        {/* Add Position Button */}
        <button
          onClick={addPosition}
          className="bg-slate-700/30 border-2 border-dashed border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-sky-400 hover:border-sky-400 transition-colors min-h-[100px]"
        >
          <Plus size={24} />
          <span className="font-medium text-sm">Add Position</span>
        </button>
      </div>

      {/* Hidden Positions */}
      {hiddenDefaults.length > 0 && (
        <div className="mt-6 p-4 border border-dashed border-slate-600 rounded-lg opacity-80">
          <h4 className="text-sm font-semibold text-slate-400 mb-3">Hidden Default Positions</h4>
          <div className="flex flex-wrap gap-2">
            {hiddenDefaults.map(pos => (
              <div key={pos.key} className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg text-sm">
                <span className="text-white">{pos.default}</span>
                <span className="text-slate-500">({pos.description})</span>
                <button
                  onClick={() => restorePosition(pos.key)}
                  className="text-sky-400 hover:text-sky-300 font-medium"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Position Groups Tab Component
function PositionGroupsTab({ phase, positionGroups, staff, onUpdate }) {
  const groups = positionGroups[phase] || [];

  const addGroup = () => {
    const name = prompt('New position group name:');
    if (!name) return;
    const abbrev = prompt('Abbreviation (e.g., OL, WR):') || name.substring(0, 2).toUpperCase();
    const newGroup = {
      id: `grp_${Date.now()}`,
      name,
      abbrev,
      positions: [],
      coachId: '',
      big3: ['', '', '']
    };
    onUpdate('positionGroups', { ...positionGroups, [phase]: [...groups, newGroup] });
  };

  const deleteGroup = (id) => {
    if (!confirm('Delete this group?')) return;
    onUpdate('positionGroups', { ...positionGroups, [phase]: groups.filter(g => g.id !== id) });
  };

  const updateGroup = (id, updates) => {
    onUpdate('positionGroups', {
      ...positionGroups,
      [phase]: groups.map(g => g.id === id ? { ...g, ...updates } : g)
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Position Groups</h3>
          <p className="text-slate-400 text-sm">Assign coaches and set Big 3 focus points for each group.</p>
        </div>
        <button
          onClick={addGroup}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          <Plus size={16} /> Add Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => (
          <div key={group.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-sky-500 text-black px-2 py-1 rounded text-xs font-bold">
                  {group.abbrev}
                </span>
                <span className="font-semibold text-white">{group.name}</span>
              </div>
              <button
                onClick={() => deleteGroup(group.id)}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Coach Selection */}
            <div className="mb-3">
              <label className="text-xs text-slate-400 block mb-1">Coach</label>
              <select
                value={group.coachId || ''}
                onChange={(e) => updateGroup(group.id, { coachId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
              >
                <option value="">-- Select Coach --</option>
                {staff.filter(s => !s.archived).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Big 3 */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Big 3</label>
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 bg-sky-500 text-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Focus ${i + 1}...`}
                    value={(group.big3 || [])[i] || ''}
                    onChange={(e) => {
                      const newBig3 = [...(group.big3 || ['', '', ''])];
                      newBig3[i] = e.target.value;
                      updateGroup(group.id, { big3: newBig3 });
                    }}
                    className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Layers size={48} className="mx-auto mb-4 opacity-30" />
          <p>No position groups defined.</p>
          <p className="text-sm">Click "Add Group" to create your first group.</p>
        </div>
      )}
    </div>
  );
}

// Personnel Tab Component
function PersonnelTab({ personnelGroupings, positions, positionNames, positionColors, onUpdate }) {
  const oLinePositions = ['LT', 'LG', 'C', 'RG', 'RT'];
  const availablePositions = positions
    .filter(p => !oLinePositions.includes(p.key))
    .map(p => p.key);

  const getPosColor = (pos) => positionColors[pos] || DEFAULT_POSITION_COLORS[pos] || '#64748b';

  const addGrouping = () => {
    const newId = `pers_${Date.now()}`;
    onUpdate('personnelGroupings', [
      ...personnelGroupings,
      { id: newId, code: '', name: 'New Personnel', description: '', positions: [] }
    ]);
  };

  const deleteGrouping = (id) => {
    if (!confirm('Delete this personnel grouping?')) return;
    onUpdate('personnelGroupings', personnelGroupings.filter(g => g.id !== id));
  };

  const updateGrouping = (idx, updates) => {
    const updated = [...personnelGroupings];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate('personnelGroupings', updated);
  };

  const togglePosition = (idx, pos) => {
    const grouping = personnelGroupings[idx];
    const activePositions = grouping.positions || [];
    const newPositions = activePositions.includes(pos)
      ? activePositions.filter(p => p !== pos)
      : [...activePositions, pos];
    updateGrouping(idx, { positions: newPositions });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Personnel Groupings</h3>
          <p className="text-slate-400 text-sm">Define which skill positions are on the field for each package.</p>
        </div>
        <button
          onClick={addGrouping}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          <Plus size={16} /> Add Personnel Grouping
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personnelGroupings.map((grouping, idx) => (
          <div key={grouping.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={grouping.code || ''}
                    onChange={(e) => updateGrouping(idx, { code: e.target.value })}
                    placeholder="Code"
                    className="w-14 px-2 py-1 text-center font-bold text-sky-400 bg-slate-600 border border-slate-500 rounded"
                  />
                  <input
                    type="text"
                    value={grouping.name || ''}
                    onChange={(e) => updateGrouping(idx, { name: e.target.value })}
                    placeholder="Name"
                    className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white"
                  />
                </div>
                <input
                  type="text"
                  value={grouping.description || ''}
                  onChange={(e) => updateGrouping(idx, { description: e.target.value })}
                  placeholder="Description (e.g., 2 RB, 1 TE)"
                  className="w-full px-2 py-1 text-sm bg-slate-600 border border-slate-500 rounded text-slate-300"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">{(grouping.positions || []).length}</span>
                <button onClick={() => deleteGrouping(grouping.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {availablePositions.map(pos => {
                const isActive = (grouping.positions || []).includes(pos);
                const color = getPosColor(pos);
                return (
                  <label
                    key={pos}
                    className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-opacity"
                    style={{
                      backgroundColor: isActive ? color : 'transparent',
                      border: `1px solid ${isActive ? color : 'rgb(71, 85, 105)'}`,
                      opacity: isActive ? 1 : 0.6
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => togglePosition(idx, pos)}
                      className="hidden"
                    />
                    <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {positionNames[pos] || pos}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {personnelGroupings.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <UserCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p>No personnel groupings defined.</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg text-sm text-slate-400">
        <strong>Tip:</strong> Positions shown here come from your Positions tab. Add custom positions there to include them in personnel groupings.
      </div>
    </div>
  );
}

// Formations Tab Component
function FormationsTab({ phase, formations, personnelGroupings, onUpdate }) {
  const addFormation = () => {
    const name = prompt('Formation name:');
    if (!name) return;
    const newFormation = {
      id: `form_${Date.now()}`,
      name,
      personnel: '',
      phase,
      createdAt: new Date().toISOString()
    };
    onUpdate([...formations, newFormation]);
  };

  const deleteFormation = (id) => {
    if (!confirm('Delete this formation?')) return;
    onUpdate(formations.filter(f => f.id !== id));
  };

  const updateFormation = (id, updates) => {
    onUpdate(formations.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const phaseLabel = phase === 'DEFENSE' ? 'Fronts' : phase === 'SPECIAL_TEAMS' ? 'Packages' : 'Formations';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{phaseLabel}</h3>
          <p className="text-slate-400 text-sm">Define your {phaseLabel.toLowerCase()} and link them to personnel packages.</p>
        </div>
        <button
          onClick={addFormation}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          <Plus size={16} /> Add {phase === 'DEFENSE' ? 'Front' : phase === 'SPECIAL_TEAMS' ? 'Package' : 'Formation'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formations.map(formation => (
          <div key={formation.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                value={formation.name}
                onChange={(e) => updateFormation(formation.id, { name: e.target.value })}
                className="font-semibold text-white bg-transparent border-none focus:outline-none"
              />
              <button onClick={() => deleteFormation(formation.id)} className="text-red-400 hover:text-red-300">
                <Trash2 size={14} />
              </button>
            </div>

            {phase === 'OFFENSE' && personnelGroupings.length > 0 && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Personnel</label>
                <select
                  value={formation.personnel || ''}
                  onChange={(e) => updateFormation(formation.id, { personnel: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                >
                  <option value="">-- Select Personnel --</option>
                  {personnelGroupings.map(p => (
                    <option key={p.id} value={p.code}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {formations.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <LayoutGrid size={48} className="mx-auto mb-4 opacity-30" />
          <p>No {phaseLabel.toLowerCase()} defined.</p>
        </div>
      )}
    </div>
  );
}

// Play Buckets Tab Component (called Categories for Defense/ST)
function PlayBucketsTab({ phase, buckets, allBuckets, onUpdate }) {
  const phaseLabel = phase === 'DEFENSE' ? 'Defensive Categories' : phase === 'SPECIAL_TEAMS' ? 'Special Teams Categories' : 'Play Buckets';
  const itemLabel = phase === 'OFFENSE' ? 'Bucket' : 'Category';

  const addBucket = () => {
    const label = prompt(`New ${itemLabel} Label:`);
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (buckets.some(b => b.id === id)) {
      alert(`${itemLabel} ID already exists for this phase.`);
      return;
    }
    onUpdate('playBuckets', [...allBuckets, { id, label, color: '#94a3b8', phase }]);
  };

  const deleteBucket = (id) => {
    if (!confirm(`Delete this ${itemLabel.toLowerCase()}?`)) return;
    onUpdate('playBuckets', allBuckets.filter(b => b.id !== id));
  };

  const updateBucket = (id, updates) => {
    onUpdate('playBuckets', allBuckets.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{phaseLabel}</h3>
        <button
          onClick={addBucket}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          <Plus size={16} /> Add {itemLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => (
          <div key={bucket.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <input
                    type="color"
                    value={bucket.color === 'gray' ? '#94a3b8' : bucket.color}
                    onChange={(e) => updateBucket(bucket.id, { color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border-2 border-white/20"
                    style={{ backgroundColor: bucket.color === 'gray' ? '#94a3b8' : bucket.color }}
                  >
                    <Edit3 size={12} className="text-white/70" />
                  </div>
                </div>
                <input
                  type="text"
                  value={bucket.label}
                  onChange={(e) => updateBucket(bucket.id, { label: e.target.value })}
                  className="flex-1 min-w-0 px-2 py-1 font-semibold bg-slate-600 border border-slate-500 rounded text-white truncate"
                />
              </div>
              <button onClick={() => deleteBucket(bucket.id)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {buckets.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Tag size={48} className="mx-auto mb-4 opacity-30" />
          <p>No {phaseLabel.toLowerCase()} defined.</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg text-sm text-slate-400">
        <strong>Note:</strong> {phase === 'DEFENSE' ? 'These categories organize your defensive scheme (e.g. Fronts, Coverages, Blitzes).' : phase === 'SPECIAL_TEAMS' ? 'These categories organize your special teams units.' : 'These buckets define the high-level organization (e.g. Run, Pass, RPO).'}
      </div>
    </div>
  );
}

// Read Types Tab Component (Offense only)
function ReadTypesTab({ readTypes, onUpdate }) {
  const addReadType = () => {
    const name = prompt('New Read Type Name:');
    if (!name) return;
    const newReadType = {
      id: `read-${Date.now()}`,
      name: name.trim(),
      description: ''
    };
    onUpdate('readTypes', [...readTypes, newReadType]);
  };

  const deleteReadType = (id) => {
    if (!confirm('Delete this read type?')) return;
    onUpdate('readTypes', readTypes.filter(r => r.id !== id));
  };

  const updateReadType = (id, updates) => {
    onUpdate('readTypes', readTypes.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Read Types</h3>
        <p className="text-slate-400 text-sm">
          Define the types of reads your offense uses (e.g., Pre-snap, Post-snap, RPO reads).
        </p>
      </div>

      <div className="space-y-3">
        {readTypes.map(readType => (
          <div
            key={readType.id}
            className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600"
          >
            <input
              type="text"
              value={readType.name}
              onChange={(e) => updateReadType(readType.id, { name: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
              placeholder="Read type name"
            />
            <input
              type="text"
              value={readType.description || ''}
              onChange={(e) => updateReadType(readType.id, { description: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
              placeholder="Description (optional)"
            />
            <button
              onClick={() => deleteReadType(readType.id)}
              className="p-2 text-slate-400 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {readTypes.length === 0 && (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-600 rounded-lg">
            <Eye size={32} className="mx-auto mb-2 opacity-50" />
            <p>No read types defined yet.</p>
          </div>
        )}

        <button
          onClick={addReadType}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 border border-dashed border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-400 transition-colors"
        >
          <Plus size={18} />
          Add Read Type
        </button>
      </div>
    </div>
  );
}

// Look-Alike Series Tab Component (Offense only)
function LookAlikeSeriesTab({ series, buckets, plays, onUpdate }) {
  const [expandedSeries, setExpandedSeries] = useState({});

  const addSeries = () => {
    const name = prompt('New Look-Alike Series Name:');
    if (!name) return;
    const newSeries = {
      id: `series-${Date.now()}`,
      name: name.trim(),
      description: '',
      commonElements: [], // formation, motion, backfieldAction
      playIds: []
    };
    onUpdate('lookAlikeSeries', [...series, newSeries]);
  };

  const deleteSeries = (id) => {
    if (!confirm('Delete this look-alike series?')) return;
    onUpdate('lookAlikeSeries', series.filter(s => s.id !== id));
  };

  const updateSeries = (id, updates) => {
    onUpdate('lookAlikeSeries', series.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleCommonElement = (seriesId, element) => {
    const s = series.find(s => s.id === seriesId);
    if (!s) return;
    const elements = s.commonElements || [];
    const newElements = elements.includes(element)
      ? elements.filter(e => e !== element)
      : [...elements, element];
    updateSeries(seriesId, { commonElements: newElements });
  };

  const addPlayToSeries = (seriesId, playId) => {
    const s = series.find(s => s.id === seriesId);
    if (!s || s.playIds.includes(playId)) return;
    updateSeries(seriesId, { playIds: [...s.playIds, playId] });
  };

  const removePlayFromSeries = (seriesId, playId) => {
    const s = series.find(s => s.id === seriesId);
    if (!s) return;
    updateSeries(seriesId, { playIds: s.playIds.filter(id => id !== playId) });
  };

  const toggleExpand = (id) => {
    setExpandedSeries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Get offense plays only
  const offensePlays = plays.filter(p => (p.phase || 'OFFENSE') === 'OFFENSE');

  // Get bucket/concept group info for a play
  const getPlayInfo = (playId) => {
    const play = plays.find(p => p.id === playId);
    if (!play) return null;
    const bucket = buckets.find(b => b.id === play.bucketId);
    return { play, bucket };
  };

  const COMMON_ELEMENTS = [
    { id: 'formation', label: 'Formation' },
    { id: 'motion', label: 'Motion' },
    { id: 'backfieldAction', label: 'Backfield Action' }
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Look-Alike Series</h3>
        <p className="text-slate-400 text-sm">
          Group plays from different buckets/concept groups that look alike based on formation, motion, and/or backfield action.
        </p>
      </div>

      <div className="space-y-4">
        {series.map(s => {
          const isExpanded = expandedSeries[s.id];
          return (
            <div
              key={s.id}
              className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden"
            >
              {/* Series Header */}
              <div className="flex items-center gap-3 p-3 bg-slate-700/30">
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} className="rotate-180" />}
                </button>
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateSeries(s.id, { name: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white font-medium"
                  placeholder="Series name"
                />
                <span className="text-sm text-slate-400">{s.playIds.length} plays</span>
                <button
                  onClick={() => deleteSeries(s.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-600 space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-xs text-slate-400 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      value={s.description || ''}
                      onChange={(e) => updateSeries(s.id, { description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                      placeholder="What makes these plays look alike?"
                    />
                  </div>

                  {/* Common Elements */}
                  <div>
                    <label className="block text-xs text-slate-400 uppercase mb-2">Looks Alike Because Of</label>
                    <div className="flex gap-2">
                      {COMMON_ELEMENTS.map(el => (
                        <button
                          key={el.id}
                          onClick={() => toggleCommonElement(s.id, el.id)}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            (s.commonElements || []).includes(el.id)
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          {el.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plays in Series */}
                  <div>
                    <label className="block text-xs text-slate-400 uppercase mb-2">Plays in Series</label>
                    <div className="space-y-2">
                      {s.playIds.map(playId => {
                        const info = getPlayInfo(playId);
                        if (!info) return null;
                        return (
                          <div
                            key={playId}
                            className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded border border-slate-600"
                          >
                            <div>
                              <span className="text-white font-medium">
                                {info.play.formation ? `${info.play.formation} ` : ''}{info.play.name}
                              </span>
                              {info.bucket && (
                                <span
                                  className="ml-2 px-1.5 py-0.5 text-xs rounded"
                                  style={{ backgroundColor: info.bucket.color || '#64748b', color: '#fff' }}
                                >
                                  {info.bucket.label}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removePlayFromSeries(s.id, playId)}
                              className="p-1 text-slate-400 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}

                      {s.playIds.length === 0 && (
                        <p className="text-sm text-slate-500 italic py-2">No plays added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Add Play Dropdown */}
                  <div>
                    <label className="block text-xs text-slate-400 uppercase mb-1">Add Play</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addPlayToSeries(s.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                      value=""
                    >
                      <option value="">Select a play to add...</option>
                      {offensePlays
                        .filter(p => !s.playIds.includes(p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.formation ? `${p.formation} ` : ''}{p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {series.length === 0 && (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-600 rounded-lg">
            <Copy size={32} className="mx-auto mb-2 opacity-50" />
            <p>No look-alike series defined yet.</p>
            <p className="text-sm mt-1">Group plays that share formation, motion, or backfield action.</p>
          </div>
        )}

        <button
          onClick={addSeries}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 border border-dashed border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-400 transition-colors"
        >
          <Plus size={18} />
          Add Look-Alike Series
        </button>
      </div>
    </div>
  );
}

// Define Situations Tab Component
function DefineSituationsTab({ fieldZones, downDistanceCategories, specialSituations, onUpdate }) {
  const [expandedSections, setExpandedSections] = useState({
    fieldZones: true,
    downDistance: false,
    special: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Default values for backward compatibility
  const DEFAULT_FIELD_ZONES = [
    { id: 'zone_backed', name: 'Backed Up', description: 'Own 1-10 yard line', startYard: 1, endYard: 10, color: '#ef4444', order: 1 },
    { id: 'zone_minus', name: 'Minus Territory', description: 'Own 11-49 yard line', startYard: 11, endYard: 49, color: '#f97316', order: 2 },
    { id: 'zone_plus', name: 'Plus Territory', description: 'Opponent 40-26 yard line', startYard: 60, endYard: 74, color: '#eab308', order: 3 },
    { id: 'zone_fringe', name: 'Fringe', description: 'Opponent 25-21 yard line', startYard: 75, endYard: 79, color: '#84cc16', order: 4 },
    { id: 'zone_red', name: 'Red Zone', description: 'Opponent 20-11 yard line', startYard: 80, endYard: 89, color: '#dc2626', order: 5 },
    { id: 'zone_gold', name: 'Gold Zone', description: 'Opponent 10-4 yard line', startYard: 90, endYard: 96, color: '#f59e0b', order: 6 },
    { id: 'zone_goal', name: 'Goal Line', description: 'Opponent 3 yard line and in', startYard: 97, endYard: 100, color: '#22c55e', order: 7 }
  ];

  const DEFAULT_DOWN_DISTANCE = [
    { id: 'dd_1st', name: '1st Down', description: 'First down', down: '1', distanceType: 'any', order: 1 },
    { id: 'dd_2long', name: '2nd & Long', description: '2nd down, 7+ yards', down: '2', distanceType: 'long', order: 2 },
    { id: 'dd_2med', name: '2nd & Medium', description: '2nd down, 4-6 yards', down: '2', distanceType: 'medium', order: 3 },
    { id: 'dd_2short', name: '2nd & Short', description: '2nd down, 1-3 yards', down: '2', distanceType: 'short', order: 4 },
    { id: 'dd_3long', name: '3rd & Long', description: '3rd down, 7+ yards', down: '3', distanceType: 'long', order: 5 },
    { id: 'dd_3med', name: '3rd & Medium', description: '3rd down, 4-6 yards', down: '3', distanceType: 'medium', order: 6 },
    { id: 'dd_3short', name: '3rd & Short', description: '3rd down, 1-3 yards', down: '3', distanceType: 'short', order: 7 },
    { id: 'dd_4th', name: '4th Down', description: 'Fourth down', down: '4', distanceType: 'any', order: 8 }
  ];

  const DEFAULT_SPECIAL_SITUATIONS = [
    { id: 'sit_2min', name: '2-Min Offense', description: 'End of half hurry-up', order: 1 },
    { id: 'sit_4min', name: '4-Min Offense', description: 'Ball control / milk clock', order: 2 },
    { id: 'sit_must', name: 'Must Score', description: 'Need a touchdown', order: 3 },
    { id: 'sit_clock', name: 'Clock Running', description: 'Standard tempo', order: 4 },
    { id: 'sit_open', name: 'Openers', description: 'First play of drive', order: 5 }
  ];

  // Field Zones CRUD
  const addFieldZone = () => {
    const name = prompt('New Field Zone Name:');
    if (!name) return;
    const newZone = {
      id: `zone_${Date.now()}`,
      name: name.trim(),
      description: '',
      startYard: 0,
      endYard: 0,
      color: '#64748b',
      order: fieldZones.length + 1
    };
    onUpdate('fieldZones', [...fieldZones, newZone]);
  };

  const updateFieldZone = (id, updates) => {
    onUpdate('fieldZones', fieldZones.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const deleteFieldZone = (id) => {
    if (!confirm('Delete this field zone?')) return;
    onUpdate('fieldZones', fieldZones.filter(z => z.id !== id));
  };

  // Down & Distance CRUD
  const addDownDistance = () => {
    const name = prompt('New Down & Distance Category Name:');
    if (!name) return;
    const newCat = {
      id: `dd_${Date.now()}`,
      name: name.trim(),
      description: '',
      down: '',
      distanceType: '',
      order: downDistanceCategories.length + 1
    };
    onUpdate('downDistanceCategories', [...downDistanceCategories, newCat]);
  };

  const updateDownDistance = (id, updates) => {
    onUpdate('downDistanceCategories', downDistanceCategories.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDownDistance = (id) => {
    if (!confirm('Delete this down & distance category?')) return;
    onUpdate('downDistanceCategories', downDistanceCategories.filter(d => d.id !== id));
  };

  // Special Situations CRUD
  const addSpecialSituation = () => {
    const name = prompt('New Special Situation Name:');
    if (!name) return;
    const newSit = {
      id: `sit_${Date.now()}`,
      name: name.trim(),
      description: '',
      order: specialSituations.length + 1
    };
    onUpdate('specialSituations', [...specialSituations, newSit]);
  };

  const updateSpecialSituation = (id, updates) => {
    onUpdate('specialSituations', specialSituations.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSpecialSituation = (id) => {
    if (!confirm('Delete this special situation?')) return;
    onUpdate('specialSituations', specialSituations.filter(s => s.id !== id));
  };

  // Load defaults if empty
  const loadDefaultFieldZones = () => {
    if (fieldZones.length > 0 && !confirm('This will replace your current field zones. Continue?')) return;
    onUpdate('fieldZones', DEFAULT_FIELD_ZONES);
  };

  const loadDefaultDownDistance = () => {
    if (downDistanceCategories.length > 0 && !confirm('This will replace your current categories. Continue?')) return;
    onUpdate('downDistanceCategories', DEFAULT_DOWN_DISTANCE);
  };

  const loadDefaultSpecialSituations = () => {
    if (specialSituations.length > 0 && !confirm('This will replace your current situations. Continue?')) return;
    onUpdate('specialSituations', DEFAULT_SPECIAL_SITUATIONS);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Define Situations</h3>
        <p className="text-slate-400 text-sm">
          Configure field zones, down & distance categories, and special situations for tagging and filtering plays.
        </p>
      </div>

      {/* Field Zones Section */}
      <div className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
        <button
          onClick={() => toggleSection('fieldZones')}
          className="w-full flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expandedSections.fieldZones ? <ChevronDown size={18} /> : <ChevronUp size={18} className="rotate-180" />}
            <span className="font-medium text-white">Field Zones</span>
            <span className="text-sm text-slate-400">({fieldZones.length} zones)</span>
          </div>
        </button>
        {expandedSections.fieldZones && (
          <div className="p-4 border-t border-slate-600 space-y-3">
            {fieldZones.length === 0 && (
              <div className="text-center py-4 text-slate-400">
                <p className="mb-2">No field zones defined yet.</p>
                <button
                  onClick={loadDefaultFieldZones}
                  className="text-sky-400 hover:text-sky-300 text-sm underline"
                >
                  Load default field zones
                </button>
              </div>
            )}
            {fieldZones.map(zone => (
              <div key={zone.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
                <input
                  type="color"
                  value={zone.color || '#64748b'}
                  onChange={(e) => updateFieldZone(zone.id, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={zone.name}
                  onChange={(e) => updateFieldZone(zone.id, { name: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white font-medium"
                  placeholder="Zone name"
                />
                <input
                  type="text"
                  value={zone.description || ''}
                  onChange={(e) => updateFieldZone(zone.id, { description: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  placeholder="Description"
                />
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <input
                    type="number"
                    value={zone.startYard || 0}
                    onChange={(e) => updateFieldZone(zone.id, { startYard: parseInt(e.target.value) || 0 })}
                    className="w-14 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-center"
                    min="0"
                    max="100"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={zone.endYard || 0}
                    onChange={(e) => updateFieldZone(zone.id, { endYard: parseInt(e.target.value) || 0 })}
                    className="w-14 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-center"
                    min="0"
                    max="100"
                  />
                  <span>yds</span>
                </div>
                <button
                  onClick={() => deleteFieldZone(zone.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addFieldZone}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 border border-dashed border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-400 transition-colors"
              >
                <Plus size={16} />
                Add Field Zone
              </button>
              {fieldZones.length > 0 && (
                <button
                  onClick={loadDefaultFieldZones}
                  className="px-3 py-2 text-slate-400 hover:text-slate-300 text-sm"
                >
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Down & Distance Section */}
      <div className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
        <button
          onClick={() => toggleSection('downDistance')}
          className="w-full flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expandedSections.downDistance ? <ChevronDown size={18} /> : <ChevronUp size={18} className="rotate-180" />}
            <span className="font-medium text-white">Down & Distance</span>
            <span className="text-sm text-slate-400">({downDistanceCategories.length} categories)</span>
          </div>
        </button>
        {expandedSections.downDistance && (
          <div className="p-4 border-t border-slate-600 space-y-3">
            {downDistanceCategories.length === 0 && (
              <div className="text-center py-4 text-slate-400">
                <p className="mb-2">No down & distance categories defined yet.</p>
                <button
                  onClick={loadDefaultDownDistance}
                  className="text-sky-400 hover:text-sky-300 text-sm underline"
                >
                  Load default categories
                </button>
              </div>
            )}
            {downDistanceCategories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateDownDistance(cat.id, { name: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white font-medium"
                  placeholder="Category name"
                />
                <input
                  type="text"
                  value={cat.description || ''}
                  onChange={(e) => updateDownDistance(cat.id, { description: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  placeholder="Description"
                />
                <select
                  value={cat.down || ''}
                  onChange={(e) => updateDownDistance(cat.id, { down: e.target.value })}
                  className="w-24 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="">Down</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
                <select
                  value={cat.distanceType || ''}
                  onChange={(e) => updateDownDistance(cat.id, { distanceType: e.target.value })}
                  className="w-28 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="">Distance</option>
                  <option value="short">Short (1-3)</option>
                  <option value="medium">Medium (4-6)</option>
                  <option value="long">Long (7+)</option>
                  <option value="any">Any</option>
                </select>
                <button
                  onClick={() => deleteDownDistance(cat.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addDownDistance}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 border border-dashed border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-400 transition-colors"
              >
                <Plus size={16} />
                Add Down & Distance
              </button>
              {downDistanceCategories.length > 0 && (
                <button
                  onClick={loadDefaultDownDistance}
                  className="px-3 py-2 text-slate-400 hover:text-slate-300 text-sm"
                >
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Special Situations Section */}
      <div className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
        <button
          onClick={() => toggleSection('special')}
          className="w-full flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expandedSections.special ? <ChevronDown size={18} /> : <ChevronUp size={18} className="rotate-180" />}
            <span className="font-medium text-white">Special Situations</span>
            <span className="text-sm text-slate-400">({specialSituations.length} situations)</span>
          </div>
        </button>
        {expandedSections.special && (
          <div className="p-4 border-t border-slate-600 space-y-3">
            {specialSituations.length === 0 && (
              <div className="text-center py-4 text-slate-400">
                <p className="mb-2">No special situations defined yet.</p>
                <button
                  onClick={loadDefaultSpecialSituations}
                  className="text-sky-400 hover:text-sky-300 text-sm underline"
                >
                  Load default situations
                </button>
              </div>
            )}
            {specialSituations.map(sit => (
              <div key={sit.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
                <input
                  type="text"
                  value={sit.name}
                  onChange={(e) => updateSpecialSituation(sit.id, { name: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white font-medium"
                  placeholder="Situation name"
                />
                <input
                  type="text"
                  value={sit.description || ''}
                  onChange={(e) => updateSpecialSituation(sit.id, { description: e.target.value })}
                  className="flex-[2] px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  placeholder="Description"
                />
                <button
                  onClick={() => deleteSpecialSituation(sit.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addSpecialSituation}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 border border-dashed border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-400 transition-colors"
              >
                <Plus size={16} />
                Add Special Situation
              </button>
              {specialSituations.length > 0 && (
                <button
                  onClick={loadDefaultSpecialSituations}
                  className="px-3 py-2 text-slate-400 hover:text-slate-300 text-sm"
                >
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Concept Groups Tab Component
function ConceptGroupsTab({ phase, buckets, allBuckets, onUpdate }) {
  const phaseLabel = phase === 'DEFENSE' ? 'Defensive Concept Groups' : phase === 'SPECIAL_TEAMS' ? 'Special Teams Variations' : 'Concept Groups';

  const addFamily = (bucketId) => {
    const name = prompt('New Concept Group Name:');
    if (!name) return;
    const bucket = allBuckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const newFamilies = [...(bucket.families || []), name];
    onUpdate('playBuckets', allBuckets.map(b => b.id === bucketId ? { ...b, families: newFamilies } : b));
  };

  const deleteFamily = (bucketId, family) => {
    if (!confirm(`Delete family "${family}"?`)) return;
    const bucket = allBuckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const newFamilies = (bucket.families || []).filter(f => f !== family);
    onUpdate('playBuckets', allBuckets.map(b => b.id === bucketId ? { ...b, families: newFamilies } : b));
  };

  const renameFamily = (bucketId, oldName) => {
    const newName = prompt('Rename Concept Group:', oldName);
    if (!newName || newName === oldName) return;
    const bucket = allBuckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const newFamilies = (bucket.families || []).map(f => f === oldName ? newName : f);
    onUpdate('playBuckets', allBuckets.map(b => b.id === bucketId ? { ...b, families: newFamilies } : b));
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{phaseLabel}</h3>
        <p className="text-slate-400 text-sm">
          {phase === 'DEFENSE' ? 'Manage variations within each defensive category.' : phase === 'SPECIAL_TEAMS' ? 'Manage variations within each special teams unit.' : 'Manage your concept groups within each bucket.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => {
          const families = bucket.families || [];
          return (
            <div key={bucket.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-600">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucket.color === 'gray' ? '#94a3b8' : bucket.color }}
                  />
                  <span className="font-semibold text-white">{bucket.label}</span>
                </div>
                <button
                  onClick={() => addFamily(bucket.id)}
                  className="p-1 text-slate-400 hover:text-sky-400"
                  title="Add Family"
                >
                  <Plus size={16} />
                </button>
              </div>

              {families.length === 0 ? (
                <div className="text-center py-4 text-sm text-slate-500 italic border border-dashed border-slate-600 rounded">
                  No families defined.
                </div>
              ) : (
                <div className="space-y-2">
                  {families.map(family => (
                    <div key={family} className="flex justify-between items-center px-3 py-2 bg-slate-600/50 rounded border border-slate-500">
                      <span className="text-sm font-medium text-white">{family}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => renameFamily(bucket.id, family)}
                          className="p-1 text-slate-400 hover:text-sky-400"
                          title="Rename"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteFamily(bucket.id, family)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {buckets.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Grid size={48} className="mx-auto mb-4 opacity-30" />
          <p>Define play buckets first to add concept groups.</p>
        </div>
      )}
    </div>
  );
}

// Play Call Chain Tab Component
function PlayCallChainTab({ phase, syntax, termLibrary, onUpdate }) {
  const currentSyntax = syntax[phase] || [];
  const currentTerms = termLibrary[phase] || {};

  const addSyntaxComponent = () => {
    const newId = Date.now().toString();
    const newSyntax = [...currentSyntax, { id: newId, label: 'New', type: 'text' }];
    onUpdate('syntax', { ...syntax, [phase]: newSyntax });
  };

  const updateSyntaxComponent = (idx, updates) => {
    const newSyntax = [...currentSyntax];
    newSyntax[idx] = { ...newSyntax[idx], ...updates };
    onUpdate('syntax', { ...syntax, [phase]: newSyntax });
  };

  const deleteSyntaxComponent = (idx) => {
    if (!confirm('Delete this syntax component?')) return;
    const newSyntax = currentSyntax.filter((_, i) => i !== idx);
    onUpdate('syntax', { ...syntax, [phase]: newSyntax });
  };

  const moveSyntax = (idx, direction) => {
    const newSyntax = [...currentSyntax];
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= newSyntax.length) return;
    [newSyntax[idx], newSyntax[newIdx]] = [newSyntax[newIdx], newSyntax[idx]];
    onUpdate('syntax', { ...syntax, [phase]: newSyntax });
  };

  const addTerm = (catId) => {
    const term = prompt('Enter new term:');
    if (!term) return;
    const terms = currentTerms[catId] || [];
    const newTerms = [...terms, { id: Date.now().toString(), label: term }];
    onUpdate('termLibrary', { ...termLibrary, [phase]: { ...currentTerms, [catId]: newTerms } });
  };

  const deleteTerm = (catId, termId) => {
    if (!confirm('Delete this term?')) return;
    const terms = currentTerms[catId] || [];
    const newTerms = terms.filter(t => t.id !== termId);
    onUpdate('termLibrary', { ...termLibrary, [phase]: { ...currentTerms, [catId]: newTerms } });
  };

  // Generate example play call from current syntax
  const getExampleCall = () => {
    return currentSyntax.map(item => {
      const terms = currentTerms[item.id] || [];
      const exampleTerm = terms[0]?.label || item.label;
      return `${item.prefix || ''}${exampleTerm}${item.suffix || ''}`;
    }).join(' ');
  };

  return (
    <div>
      {/* Play Call Structure - Horizontal Layout */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Play Call Structure</h3>
            <p className="text-slate-400 text-sm">Build your play call syntax left to right, like reading a sentence.</p>
          </div>
          <button
            onClick={addSyntaxComponent}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <Plus size={16} /> Add Component
          </button>
        </div>

        {currentSyntax.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p>No play components defined.</p>
            <p className="text-sm">Click "Add Component" to start building your play call structure.</p>
          </div>
        ) : (
          <>
            {/* Example Preview */}
            <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-slate-600">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Example Call:</span>
              <p className="text-xl font-mono text-green-400 mt-1">{getExampleCall() || '...'}</p>
            </div>

            {/* Horizontal Component Chain */}
            <div className="flex items-start gap-2 overflow-x-auto pb-4">
              {currentSyntax.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  {/* Component Card */}
                  <div className="flex-shrink-0 w-48 bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
                    {/* Header with number and controls */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-600/50 border-b border-slate-600">
                      <span className="w-6 h-6 flex items-center justify-center bg-sky-600 rounded-full text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSyntax(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move Left"
                        >
                          <ChevronUp size={14} className="rotate-[-90deg]" />
                        </button>
                        <button
                          onClick={() => moveSyntax(idx, 1)}
                          disabled={idx === currentSyntax.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move Right"
                        >
                          <ChevronDown size={14} className="rotate-[-90deg]" />
                        </button>
                        <button
                          onClick={() => deleteSyntaxComponent(idx)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Body */}
                    <div className="p-3 space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide">Name</label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => updateSyntaxComponent(idx, { label: e.target.value })}
                          placeholder="e.g. Formation"
                          className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wide">Prefix</label>
                          <input
                            type="text"
                            value={item.prefix || ''}
                            onChange={(e) => updateSyntaxComponent(idx, { prefix: e.target.value })}
                            placeholder='"'
                            className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wide">Suffix</label>
                          <input
                            type="text"
                            value={item.suffix || ''}
                            onChange={(e) => updateSyntaxComponent(idx, { suffix: e.target.value })}
                            placeholder='"'
                            className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow between components */}
                  {idx < currentSyntax.length - 1 && (
                    <div className="flex-shrink-0 text-slate-500 text-2xl font-light">→</div>
                  )}
                </div>
              ))}

              {/* Add button at end */}
              <button
                onClick={addSyntaxComponent}
                className="flex-shrink-0 w-12 h-24 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg text-slate-500 hover:border-sky-500 hover:text-sky-500 transition-colors"
                title="Add Component"
              >
                <Plus size={24} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Term Library - Horizontal layout matching the chain */}
      {currentSyntax.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Term Library</h3>
          <p className="text-slate-400 text-sm mb-4">Add terms for each component. These will be available when building plays.</p>

          <div className="flex gap-2 overflow-x-auto pb-4">
            {currentSyntax.map((cat, idx) => {
              const terms = currentTerms[cat.id] || [];
              return (
                <div key={cat.id} className="flex-shrink-0 w-48 bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
                  <div className="flex justify-between items-center px-3 py-2 bg-slate-600/50 border-b border-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-sky-600 rounded-full text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide truncate">{cat.label}</span>
                    </div>
                    <button
                      onClick={() => addTerm(cat.id)}
                      className="p-1 text-sky-400 hover:text-sky-300"
                      title="Add Term"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {terms.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500 italic">
                        No terms yet
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {terms.map(term => (
                          <div
                            key={term.id}
                            className="flex items-center justify-between px-2 py-1 bg-slate-600 rounded text-sm text-white group"
                          >
                            <span className="truncate">{term.label}</span>
                            <button
                              onClick={() => deleteTerm(cat.id, term.id)}
                              className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Glossary Definitions Tab Component
function GlossaryDefinitionsTab({ phase, termLibrary, syntax, glossaryDefinitions, onUpdate }) {
  const currentSyntax = syntax[phase] || [];
  const currentTerms = termLibrary[phase] || {};
  const currentDefinitions = glossaryDefinitions[phase] || {};

  // Compile all terms from the play call chain
  const compiledTerms = [];
  currentSyntax.forEach(cat => {
    const terms = currentTerms[cat.id] || [];
    terms.forEach(term => {
      compiledTerms.push({
        ...term,
        category: cat.label,
        categoryId: cat.id
      });
    });
  });

  // Add custom glossary terms (not from play call chain)
  const customTerms = currentDefinitions._custom || [];

  const updateDefinition = (termId, definition) => {
    const newDefs = { ...currentDefinitions, [termId]: definition };
    onUpdate('glossaryDefinitions', { ...glossaryDefinitions, [phase]: newDefs });
  };

  const addCustomTerm = () => {
    const term = prompt('Enter new glossary term:');
    if (!term) return;
    const newTerm = {
      id: Date.now().toString(),
      label: term,
      isCustom: true
    };
    const current = currentDefinitions._custom || [];
    const newDefs = { ...currentDefinitions, _custom: [...current, newTerm] };
    onUpdate('glossaryDefinitions', { ...glossaryDefinitions, [phase]: newDefs });
  };

  const deleteCustomTerm = (termId) => {
    if (!confirm('Delete this custom term?')) return;
    const current = currentDefinitions._custom || [];
    const newDefs = {
      ...currentDefinitions,
      _custom: current.filter(t => t.id !== termId)
    };
    // Also remove definition
    delete newDefs[termId];
    onUpdate('glossaryDefinitions', { ...glossaryDefinitions, [phase]: newDefs });
  };

  const allTerms = [
    ...compiledTerms.map(t => ({ ...t, source: 'play-call-chain' })),
    ...customTerms.map(t => ({ ...t, category: 'Custom', source: 'custom' }))
  ].sort((a, b) => a.label.localeCompare(b.label));

  // Group terms by category for display
  const termsByCategory = {};
  allTerms.forEach(term => {
    if (!termsByCategory[term.category]) {
      termsByCategory[term.category] = [];
    }
    termsByCategory[term.category].push(term);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Glossary</h3>
          <p className="text-slate-400 text-sm">
            Define terms used in your system. Terms from Play Call Chain are shown automatically.
          </p>
        </div>
        <button
          onClick={addCustomTerm}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          <Plus size={16} /> Add Custom Term
        </button>
      </div>

      {allTerms.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>No terms found.</p>
          <p className="text-sm mt-2">
            Add terms in the Play Call Chain tab, or add custom terms here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(termsByCategory).sort().map(category => (
            <div key={category}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-600">
                <span className="text-sm font-bold text-white uppercase tracking-wide">{category}</span>
                <span className="px-2 py-0.5 text-xs bg-slate-600 text-slate-300 rounded-full">
                  {termsByCategory[category].length}
                </span>
              </div>

              {/* Terms List */}
              <div className="space-y-2">
                {termsByCategory[category].map(term => (
                  <div key={term.id} className="flex items-start gap-4 group">
                    {/* Term (Left Side) */}
                    <div className="w-48 flex-shrink-0 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sky-400">{term.label}</span>
                        {term.source === 'custom' && (
                          <button
                            onClick={() => deleteCustomTerm(term.id)}
                            className="p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete custom term"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {term.source === 'play-call-chain' && (
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">from play call</span>
                      )}
                    </div>

                    {/* Definition (Right Side) */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={currentDefinitions[term.id] || ''}
                        onChange={(e) => updateDefinition(term.id, e.target.value)}
                        placeholder="Add definition..."
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// OL Schemes Tab Component
function OLSchemesTab({ passProtections, runBlocking, onUpdate }) {
  // State for diagram editor modal
  const [editingDiagram, setEditingDiagram] = useState(null); // { type: 'protection'|'scheme', index: number }

  const addProtection = () => {
    const name = prompt('Protection Name (e.g., BROWN):');
    if (!name) return;
    const newProt = {
      id: Date.now().toString(),
      name: name.toUpperCase(),
      slideDirection: 'right',
      manSide: 'left',
      callText: '',
      notes: '',
      diagramData: null
    };
    onUpdate('passProtections', [...passProtections, newProt]);
  };

  const deleteProtection = (id) => {
    if (!confirm('Delete this protection?')) return;
    onUpdate('passProtections', passProtections.filter(p => p.id !== id));
  };

  const updateProtection = (idx, updates) => {
    const updated = [...passProtections];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate('passProtections', updated);
  };

  const addRunScheme = () => {
    const name = prompt('Blocking Scheme Name (e.g., ZONE, POWER):');
    if (!name) return;
    const newScheme = {
      id: Date.now().toString(),
      name: name.toUpperCase(),
      type: 'zone',
      callText: '',
      notes: '',
      diagramData: null
    };
    onUpdate('runBlocking', [...runBlocking, newScheme]);
  };

  const deleteRunScheme = (id) => {
    if (!confirm('Delete this scheme?')) return;
    onUpdate('runBlocking', runBlocking.filter(s => s.id !== id));
  };

  const updateRunScheme = (idx, updates) => {
    const updated = [...runBlocking];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate('runBlocking', updated);
  };

  // Get current diagram data for the editing item
  const getCurrentDiagramData = () => {
    if (!editingDiagram) return null;
    if (editingDiagram.type === 'protection') {
      const prot = passProtections[editingDiagram.index];
      return prot?.diagramData ? { elements: prot.diagramData } : null;
    } else {
      const scheme = runBlocking[editingDiagram.index];
      return scheme?.diagramData ? { elements: scheme.diagramData } : null;
    }
  };

  // Handle save diagram
  const handleSaveDiagram = (data) => {
    if (editingDiagram.type === 'protection') {
      updateProtection(editingDiagram.index, { diagramData: data.elements });
    } else {
      updateRunScheme(editingDiagram.index, { diagramData: data.elements });
    }
    setEditingDiagram(null);
  };

  // Handle save as new (creates a new protection/scheme with the diagram)
  const handleSaveAsDiagram = (data) => {
    if (editingDiagram.type === 'protection') {
      // Create new protection with the diagram
      const newProt = {
        id: Date.now().toString(),
        name: data.name,
        slideDirection: 'right',
        manSide: 'left',
        callText: '',
        notes: '',
        diagramData: data.elements
      };
      onUpdate('passProtections', [...passProtections, newProt]);
    } else {
      // Create new run scheme with the diagram
      const newScheme = {
        id: Date.now().toString(),
        name: data.name,
        type: 'zone',
        callText: '',
        notes: '',
        diagramData: data.elements
      };
      onUpdate('runBlocking', [...runBlocking, newScheme]);
    }
    setEditingDiagram(null);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-6">OL WIZ Library</h3>

      {/* Pass Protections */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-semibold text-white">Pass Protections</h4>
            <p className="text-slate-400 text-sm">Define your pass protection calls (e.g., BROWN, GOLD)</p>
          </div>
          <button
            onClick={addProtection}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <Plus size={16} /> Add Protection
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {passProtections.map((prot, idx) => (
            <div key={prot.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
              <div className="flex justify-between items-center mb-3">
                <input
                  type="text"
                  value={prot.name}
                  onChange={(e) => updateProtection(idx, { name: e.target.value.toUpperCase() })}
                  className="font-bold text-lg bg-transparent border-none text-white w-24"
                />
                <button onClick={() => deleteProtection(prot.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Slide Direction</label>
                  <select
                    value={prot.slideDirection}
                    onChange={(e) => updateProtection(idx, { slideDirection: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  >
                    <option value="left">Slide Left</option>
                    <option value="right">Slide Right</option>
                    <option value="none">No Slide</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Man Side</label>
                  <select
                    value={prot.manSide}
                    onChange={(e) => updateProtection(idx, { manSide: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  >
                    <option value="left">Man Left</option>
                    <option value="right">Man Right</option>
                    <option value="none">N/A</option>
                  </select>
                </div>
              </div>

              <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">Call Text</label>
                <input
                  type="text"
                  value={prot.callText || ''}
                  onChange={(e) => updateProtection(idx, { callText: e.target.value })}
                  placeholder="e.g., Slide R - Man L"
                  className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Notes</label>
                <textarea
                  value={prot.notes || ''}
                  onChange={(e) => updateProtection(idx, { notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm resize-none"
                />
              </div>

              {/* Diagram Section */}
              <div className="pt-3 border-t border-slate-600">
                <label className="text-xs text-slate-400 block mb-2">Blocking Diagram</label>
                <div className="flex items-center gap-3">
                  {prot.diagramData && prot.diagramData.length > 0 ? (
                    <DiagramPreview
                      elements={prot.diagramData}
                      width={120}
                      height={80}
                      onClick={() => setEditingDiagram({ type: 'protection', index: idx })}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingDiagram({ type: 'protection', index: idx })}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 text-sm"
                    >
                      <Image size={14} /> Add Diagram
                    </button>
                  )}
                  {prot.diagramData && prot.diagramData.length > 0 && (
                    <button
                      onClick={() => setEditingDiagram({ type: 'protection', index: idx })}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {passProtections.length === 0 && (
          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
            <Shield size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pass protections defined.</p>
          </div>
        )}
      </div>

      {/* Run Blocking */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-semibold text-white">Run Blocking Schemes</h4>
            <p className="text-slate-400 text-sm">Define your run blocking schemes (e.g., Zone, Gap, Power)</p>
          </div>
          <button
            onClick={addRunScheme}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <Plus size={16} /> Add Scheme
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {runBlocking.map((scheme, idx) => (
            <div key={scheme.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
              <div className="flex justify-between items-center mb-3">
                <input
                  type="text"
                  value={scheme.name}
                  onChange={(e) => updateRunScheme(idx, { name: e.target.value.toUpperCase() })}
                  className="font-bold text-lg bg-transparent border-none text-white w-24"
                />
                <button onClick={() => deleteRunScheme(scheme.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Scheme Type</label>
                <select
                  value={scheme.type}
                  onChange={(e) => updateRunScheme(idx, { type: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                >
                  <option value="zone">Zone</option>
                  <option value="gap">Gap / Man</option>
                  <option value="power">Power</option>
                  <option value="counter">Counter</option>
                  <option value="trap">Trap</option>
                  <option value="iso">Iso</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">Call Text</label>
                <input
                  type="text"
                  value={scheme.callText || ''}
                  onChange={(e) => updateRunScheme(idx, { callText: e.target.value })}
                  placeholder="e.g., Inside Zone Right"
                  className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Notes</label>
                <textarea
                  value={scheme.notes || ''}
                  onChange={(e) => updateRunScheme(idx, { notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm resize-none"
                />
              </div>

              {/* Diagram Section */}
              <div className="pt-3 border-t border-slate-600">
                <label className="text-xs text-slate-400 block mb-2">Blocking Diagram</label>
                <div className="flex items-center gap-3">
                  {scheme.diagramData && scheme.diagramData.length > 0 ? (
                    <DiagramPreview
                      elements={scheme.diagramData}
                      width={120}
                      height={80}
                      onClick={() => setEditingDiagram({ type: 'scheme', index: idx })}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingDiagram({ type: 'scheme', index: idx })}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 text-sm"
                    >
                      <Image size={14} /> Add Diagram
                    </button>
                  )}
                  {scheme.diagramData && scheme.diagramData.length > 0 && (
                    <button
                      onClick={() => setEditingDiagram({ type: 'scheme', index: idx })}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {runBlocking.length === 0 && (
          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
            <Shield size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No run blocking schemes defined.</p>
          </div>
        )}
      </div>

      {/* Diagram Editor Modal */}
      {editingDiagram && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-[95vw] h-[95vh] overflow-hidden shadow-2xl">
            <PlayDiagramEditor
              mode="wiz-oline"
              initialData={getCurrentDiagramData()}
              onSave={handleSaveDiagram}
              onSaveAs={handleSaveAsDiagram}
              onCancel={() => setEditingDiagram(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Practice Lists Tab Component
// Segment Types are organized by phase (O, D, K, C)
// Focus Items are sub-families of Segment Types
const PRACTICE_PHASES = [
  { id: 'O', label: 'Offense', color: 'bg-blue-600' },
  { id: 'D', label: 'Defense', color: 'bg-red-600' },
  { id: 'K', label: 'Special Teams', color: 'bg-amber-600' },
  { id: 'C', label: 'Competition/Conditioning', color: 'bg-emerald-600' }
];

function PracticeListsTab({ phase, segmentTypes, focusItems, segmentSettings, onUpdate }) {
  const [activePhase, setActivePhase] = useState('O');
  const [expandedTypes, setExpandedTypes] = useState({});
  const [editingType, setEditingType] = useState(null);
  const [editingFocus, setEditingFocus] = useState(null);

  // Get segment types for current phase
  // Data structure: { O: [{ id, name, focusItems: [] }], D: [...], K: [...], C: [...] }
  const currentSegments = segmentTypes[activePhase] || [];

  // Toggle expand/collapse for segment type
  const toggleExpand = (typeId) => {
    setExpandedTypes(prev => ({ ...prev, [typeId]: !prev[typeId] }));
  };

  // Add new segment type
  const addSegmentType = () => {
    const name = prompt('New segment type (e.g., Team Run, Individual):');
    if (!name || !name.trim()) return;

    const newType = {
      id: `type_${Date.now()}`,
      name: name.trim(),
      focusItems: []
    };

    const updated = {
      ...segmentTypes,
      [activePhase]: [...currentSegments, newType]
    };
    onUpdate('practiceSegmentTypes', updated);
  };

  // Rename segment type
  const renameSegmentType = (typeId, newName) => {
    if (!newName || !newName.trim()) return;
    const updated = {
      ...segmentTypes,
      [activePhase]: currentSegments.map(t =>
        t.id === typeId ? { ...t, name: newName.trim() } : t
      )
    };
    onUpdate('practiceSegmentTypes', updated);
    setEditingType(null);
  };

  // Delete segment type
  const deleteSegmentType = (typeId, typeName) => {
    if (!confirm(`Delete "${typeName}" and all its focus items?`)) return;
    const updated = {
      ...segmentTypes,
      [activePhase]: currentSegments.filter(t => t.id !== typeId)
    };
    onUpdate('practiceSegmentTypes', updated);
  };

  // Add focus item to segment type
  const addFocusItem = (typeId) => {
    const name = prompt('New focus item (e.g., Run Game, Pass Pro):');
    if (!name || !name.trim()) return;

    const newFocus = {
      id: `focus_${Date.now()}`,
      name: name.trim()
    };

    const updated = {
      ...segmentTypes,
      [activePhase]: currentSegments.map(t =>
        t.id === typeId
          ? { ...t, focusItems: [...(t.focusItems || []), newFocus] }
          : t
      )
    };
    onUpdate('practiceSegmentTypes', updated);
  };

  // Rename focus item
  const renameFocusItem = (typeId, focusId, newName) => {
    if (!newName || !newName.trim()) return;
    const updated = {
      ...segmentTypes,
      [activePhase]: currentSegments.map(t =>
        t.id === typeId
          ? {
              ...t,
              focusItems: (t.focusItems || []).map(f =>
                f.id === focusId ? { ...f, name: newName.trim() } : f
              )
            }
          : t
      )
    };
    onUpdate('practiceSegmentTypes', updated);
    setEditingFocus(null);
  };

  // Delete focus item
  const deleteFocusItem = (typeId, focusId, focusName) => {
    if (!confirm(`Delete focus item "${focusName}"?`)) return;
    const updated = {
      ...segmentTypes,
      [activePhase]: currentSegments.map(t =>
        t.id === typeId
          ? { ...t, focusItems: (t.focusItems || []).filter(f => f.id !== focusId) }
          : t
      )
    };
    onUpdate('practiceSegmentTypes', updated);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Practice Segment Types</h3>
        <p className="text-slate-400 text-sm">
          Define segment types for each phase. Focus items are sub-categories within each segment type.
        </p>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 p-1 rounded-lg">
        {PRACTICE_PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePhase(p.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              activePhase === p.id
                ? `${p.color} text-white`
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Segment Types List */}
      <div className="space-y-3">
        {currentSegments.map(segType => {
          const isExpanded = expandedTypes[segType.id];
          const focusCount = (segType.focusItems || []).length;

          return (
            <div
              key={segType.id}
              className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden"
            >
              {/* Segment Type Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/80">
                <button
                  onClick={() => toggleExpand(segType.id)}
                  className="text-slate-400 hover:text-white"
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} className="rotate-180" />}
                </button>

                {editingType === segType.id ? (
                  <input
                    autoFocus
                    defaultValue={segType.name}
                    onBlur={(e) => renameSegmentType(segType.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameSegmentType(segType.id, e.target.value);
                      if (e.key === 'Escape') setEditingType(null);
                    }}
                    className="flex-1 bg-slate-600 text-white px-2 py-1 rounded border border-slate-500 focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <span
                    className="flex-1 text-white font-medium cursor-pointer hover:text-sky-300"
                    onClick={() => setEditingType(segType.id)}
                  >
                    {segType.name}
                  </span>
                )}

                <span className="text-xs text-slate-500">
                  {focusCount} focus item{focusCount !== 1 ? 's' : ''}
                </span>

                <button
                  onClick={() => addFocusItem(segType.id)}
                  className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-600 rounded"
                  title="Add Focus Item"
                >
                  <Plus size={16} />
                </button>

                <button
                  onClick={() => deleteSegmentType(segType.id, segType.name)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded"
                  title="Delete Segment Type"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Focus Items */}
              {isExpanded && (
                <div className="border-t border-slate-600">
                  {(segType.focusItems || []).length > 0 ? (
                    <div className="p-2 space-y-1">
                      {(segType.focusItems || []).map(focus => (
                        <div
                          key={focus.id}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-600/50 rounded"
                        >
                          <div className="w-2 h-2 rounded-full bg-sky-500" />

                          {editingFocus === focus.id ? (
                            <input
                              autoFocus
                              defaultValue={focus.name}
                              onBlur={(e) => renameFocusItem(segType.id, focus.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') renameFocusItem(segType.id, focus.id, e.target.value);
                                if (e.key === 'Escape') setEditingFocus(null);
                              }}
                              className="flex-1 bg-slate-700 text-white px-2 py-0.5 rounded border border-slate-500 text-sm focus:outline-none focus:border-sky-500"
                            />
                          ) : (
                            <span
                              className="flex-1 text-slate-300 text-sm cursor-pointer hover:text-white"
                              onClick={() => setEditingFocus(focus.id)}
                            >
                              {focus.name}
                            </span>
                          )}

                          <button
                            onClick={() => deleteFocusItem(segType.id, focus.id, focus.name)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-sm italic">
                      No focus items. Click <Plus size={12} className="inline" /> to add one.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {currentSegments.length === 0 && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
            <List size={48} className="mx-auto mb-4 opacity-30" />
            <p>No segment types for {PRACTICE_PHASES.find(p => p.id === activePhase)?.label}.</p>
            <p className="text-sm mt-1">Click "Add Segment Type" to create one.</p>
          </div>
        )}
      </div>

      {/* Add Segment Type Button */}
      <button
        onClick={addSegmentType}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
      >
        <Plus size={18} />
        Add Segment Type
      </button>
    </div>
  );
}

// Templates Tab Component (generic for practice/gameplan/pregame)
function TemplatesTab({ title, description, templates, onUpdate, icon: Icon }) {
  const deleteTemplate = (id) => {
    if (!confirm('Delete this template?')) return;
    onUpdate(templates.filter(t => t.id !== id));
  };

  const renameTemplate = (id, name) => {
    onUpdate(templates.map(t => t.id === id ? { ...t, name } : t));
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
          <Icon size={48} className="mx-auto mb-4 opacity-30" />
          <p>No templates yet.</p>
          <p className="text-sm mt-1">Create templates from their respective tools to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4">
              <div className="flex justify-between items-start mb-2">
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => renameTemplate(template.id, e.target.value)}
                  className="font-semibold text-white bg-transparent border-none focus:outline-none flex-1"
                />
                <button onClick={() => deleteTemplate(template.id)} className="text-red-400 hover:text-red-300 ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {template.segments?.length || 0} segments
                {template.category && ` - ${template.category}`}
              </p>
              <div className="text-xs text-slate-500">
                Created {new Date(template.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Program Levels Tab Component
// Tools available for each level
const LEVEL_TOOLS = [
  { key: 'playbook', label: 'Playbook', description: 'Access to playbook for this level' },
  { key: 'depthChart', label: 'Depth Chart', description: 'Manage depth chart' },
  { key: 'practiceScripts', label: 'Practice Scripts', description: 'Create practice scripts' },
  { key: 'gamePlan', label: 'Game Planner', description: 'Build game plans' },
  { key: 'wristband', label: 'Wristband Builder', description: 'Create wristbands' }
];

function ProgramLevelsTab({ programLevels, staff, onUpdate }) {
  const [expandedLevel, setExpandedLevel] = useState(null);

  // Add new level
  const addLevel = () => {
    const name = prompt('Enter level name (e.g., JV, Freshman, Scout Team):');
    if (!name || !name.trim()) return;

    const newLevel = {
      id: `level_${Date.now()}`,
      name: name.trim(),
      staffPermissions: [],
      enabledTools: {
        playbook: true,
        depthChart: true,
        practiceScripts: true,
        gamePlan: false,
        wristband: false
      },
      levelFocus: '',
      coachExpectations: ''
    };

    onUpdate('programLevels', [...programLevels, newLevel]);
    setExpandedLevel(newLevel.id);
  };

  // Update a level
  const updateLevel = (levelId, updates) => {
    const newLevels = programLevels.map(l =>
      l.id === levelId ? { ...l, ...updates } : l
    );
    onUpdate('programLevels', newLevels);
  };

  // Delete a level
  const deleteLevel = (levelId, levelName) => {
    if (!confirm(`Delete "${levelName}"? This will remove all data for this level.`)) return;
    onUpdate('programLevels', programLevels.filter(l => l.id !== levelId));
  };

  // Toggle staff permission
  const toggleStaffPermission = (levelId, staffId) => {
    const level = programLevels.find(l => l.id === levelId);
    if (!level) return;
    const perms = level.staffPermissions || [];
    const newPerms = perms.includes(staffId)
      ? perms.filter(id => id !== staffId)
      : [...perms, staffId];
    updateLevel(levelId, { staffPermissions: newPerms });
  };

  // Toggle tool
  const toggleTool = (levelId, tool) => {
    const level = programLevels.find(l => l.id === levelId);
    if (!level) return;
    updateLevel(levelId, {
      enabledTools: { ...level.enabledTools, [tool]: !level.enabledTools?.[tool] }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Program Levels</h3>
        <p className="text-slate-400 text-sm">
          Manage sub-levels of your program (JV, Freshman, Scout Team, etc.). Each level can have its own staff permissions and enabled tools.
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
        <p className="text-sm text-sky-300">
          <strong>How it works:</strong> Program levels allow assistant coaches to manage JV, Freshman, or other sub-programs.
          Head coaches see all levels via a dropdown in the header. Coaches assigned to a level only see that level's dropdown option.
        </p>
      </div>

      {/* Levels List */}
      <div className="space-y-4">
        {programLevels.map(level => {
          const isExpanded = expandedLevel === level.id;
          const permCount = (level.staffPermissions || []).length;
          const toolCount = Object.values(level.enabledTools || {}).filter(Boolean).length;

          return (
            <div
              key={level.id}
              className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden"
            >
              {/* Level Header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-700/70"
                onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${permCount > 0 ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  <span className="text-white font-semibold">{level.name}</span>
                  <span className="text-xs text-slate-500">
                    {permCount} coach{permCount !== 1 ? 'es' : ''} • {toolCount} tool{toolCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLevel(level.id, level.name);
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </div>

              {/* Level Content */}
              {isExpanded && (
                <div className="border-t border-slate-600 p-4 space-y-6">
                  {/* Level Name Edit */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Level Name</label>
                    <input
                      type="text"
                      value={level.name}
                      onChange={(e) => updateLevel(level.id, { name: e.target.value })}
                      className="w-full max-w-xs px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Staff Permissions */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Staff with Edit Access
                      </label>
                      <p className="text-xs text-slate-500 mb-3">
                        Select which coaches can manage this level. Head Coach always has access.
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(staff || []).map(s => {
                          const hasAccess = (level.staffPermissions || []).includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className="flex items-center gap-3 p-2 bg-slate-600/50 rounded cursor-pointer hover:bg-slate-600"
                            >
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => toggleStaffPermission(level.id, s.id)}
                                className="rounded border-slate-500 bg-slate-700 text-sky-500"
                              />
                              <div>
                                <span className="text-white text-sm">{s.name}</span>
                                {s.role && (
                                  <span className="text-xs text-slate-400 ml-2">({s.role})</span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                        {(staff || []).length === 0 && (
                          <p className="text-sm text-slate-500 italic">No staff members found. Add staff in the Staff page.</p>
                        )}
                      </div>
                    </div>

                    {/* Enabled Tools */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Enabled Tools
                      </label>
                      <p className="text-xs text-slate-500 mb-3">
                        Choose which tools are available for this level.
                      </p>
                      <div className="space-y-2">
                        {LEVEL_TOOLS.map(tool => {
                          const isEnabled = level.enabledTools?.[tool.key] || false;
                          return (
                            <label
                              key={tool.key}
                              className="flex items-center gap-3 p-2 bg-slate-600/50 rounded cursor-pointer hover:bg-slate-600"
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => toggleTool(level.id, tool.key)}
                                className="rounded border-slate-500 bg-slate-700 text-emerald-500"
                              />
                              <div>
                                <span className="text-white text-sm">{tool.label}</span>
                                <p className="text-xs text-slate-500">{tool.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Level Focus & Expectations (HC Only fields) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Level Focus
                      </label>
                      <textarea
                        value={level.levelFocus || ''}
                        onChange={(e) => updateLevel(level.id, { levelFocus: e.target.value })}
                        placeholder="What is the primary focus for this level? (e.g., Development, fundamentals, game experience...)"
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-sky-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Coach Expectations
                      </label>
                      <textarea
                        value={level.coachExpectations || ''}
                        onChange={(e) => updateLevel(level.id, { coachExpectations: e.target.value })}
                        placeholder="What do you need from coaches at this level? (e.g., Daily attendance tracking, film review emphasis...)"
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-sky-500"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {programLevels.length === 0 && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
            <Layers size={48} className="mx-auto mb-4 opacity-30" />
            <p>No program levels defined.</p>
            <p className="text-sm mt-1">Add levels like JV, Freshman, or Scout Team.</p>
          </div>
        )}
      </div>

      {/* Add Level Button */}
      <button
        onClick={addLevel}
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
      >
        <Plus size={18} />
        Add Program Level
      </button>
    </div>
  );
}

// ============= SEASON SETUP COMPONENTS =============

// Default phase colors
const PHASE_COLORS = [
  { id: 'slate', label: 'Gray', class: 'bg-slate-600' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-600' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-600' },
  { id: 'emerald', label: 'Green', class: 'bg-emerald-600' },
  { id: 'sky', label: 'Blue', class: 'bg-sky-600' },
  { id: 'rose', label: 'Red', class: 'bg-rose-600' },
  { id: 'orange', label: 'Orange', class: 'bg-orange-600' }
];

// Default phases if none defined
const DEFAULT_PHASES = [
  { id: 'offseason', name: 'Offseason', color: 'slate', order: 0 },
  { id: 'summer', name: 'Summer', color: 'amber', order: 1 },
  { id: 'preseason', name: 'Preseason', color: 'purple', order: 2 },
  { id: 'season', name: 'Regular Season', color: 'emerald', order: 3 }
];

// Season Phases Tab Component - Define and configure season phases
function SeasonPhasesTab({ seasonPhases, onUpdate }) {
  const phases = seasonPhases.length > 0 ? seasonPhases : DEFAULT_PHASES;

  const addPhase = () => {
    const name = prompt('Enter phase name (e.g., "Spring Ball", "Playoffs"):');
    if (!name?.trim()) return;

    const newPhase = {
      id: `phase_${Date.now()}`,
      name: name.trim(),
      color: PHASE_COLORS[phases.length % PHASE_COLORS.length].id,
      order: phases.length,
      startDate: '',
      numWeeks: 4
    };
    onUpdate('seasonPhases', [...phases, newPhase]);
  };

  const updatePhase = (phaseId, updates) => {
    const newPhases = phases.map(p => p.id === phaseId ? { ...p, ...updates } : p);
    onUpdate('seasonPhases', newPhases);
  };

  const deletePhase = (phaseId, phaseName) => {
    if (!confirm(`Delete "${phaseName}" phase? Weeks in this phase will become unassigned.`)) return;
    onUpdate('seasonPhases', phases.filter(p => p.id !== phaseId));
  };

  const movePhase = (phaseId, direction) => {
    const idx = phases.findIndex(p => p.id === phaseId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= phases.length) return;

    const newPhases = [...phases];
    [newPhases[idx], newPhases[newIdx]] = [newPhases[newIdx], newPhases[idx]];
    newPhases.forEach((p, i) => p.order = i);
    onUpdate('seasonPhases', newPhases);
  };

  // Calculate end date based on start date and number of weeks
  const getEndDate = (startDate, numWeeks) => {
    if (!startDate || !numWeeks) return null;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (numWeeks * 7) - 1);
    return end;
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
        <p className="text-sm text-sky-300">
          <strong>Season Phases:</strong> Define the phases of your season with start dates.
          When you set a start date, weeks in that phase auto-calculate (Week 1 starts on start date, Week 2 is 7 days later, etc.)
        </p>
      </div>

      {/* Phases List */}
      <div className="space-y-3">
        {phases.sort((a, b) => a.order - b.order).map((phase, idx) => {
          const colorClass = PHASE_COLORS.find(c => c.id === phase.color)?.class || 'bg-slate-600';
          const endDate = getEndDate(phase.startDate, phase.numWeeks);

          return (
            <div
              key={phase.id}
              className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden"
            >
              {/* Phase Header */}
              <div className={`flex items-center gap-3 px-4 py-3 ${colorClass}`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => movePhase(phase.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => movePhase(phase.id, 'down')}
                    disabled={idx === phases.length - 1}
                    className="p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={phase.name}
                  onChange={e => updatePhase(phase.id, { name: e.target.value })}
                  className="bg-transparent text-white font-semibold border-none outline-none flex-1"
                />
                <button
                  onClick={() => deletePhase(phase.id, phase.name)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Phase Settings */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Color</label>
                  <select
                    value={phase.color}
                    onChange={e => updatePhase(phase.id, { color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  >
                    {PHASE_COLORS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={phase.startDate || ''}
                    onChange={e => updatePhase(phase.id, { startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  />
                </div>

                {/* Number of Weeks */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Number of Weeks</label>
                  <input
                    type="number"
                    value={phase.numWeeks || ''}
                    onChange={e => updatePhase(phase.id, { numWeeks: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="52"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  />
                </div>

                {/* Date Range Display */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Date Range</label>
                  <div className="px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-sm">
                    {phase.startDate ? (
                      <span className="text-white">
                        {formatDate(phase.startDate)} — {endDate ? formatDate(endDate) : '...'}
                      </span>
                    ) : (
                      <span className="text-slate-500">Set start date</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Phase Button */}
      <button
        onClick={addPhase}
        className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
      >
        <Plus size={18} />
        Add Phase
      </button>

      {/* Initialize with defaults if empty */}
      {seasonPhases.length === 0 && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-300">
            <strong>Tip:</strong> These are default phases. Edit the names, dates, and colors to match your program's calendar.
            Click "Add Phase" to create custom phases like "Spring Ball" or "Playoffs".
          </p>
          <button
            onClick={() => onUpdate('seasonPhases', DEFAULT_PHASES)}
            className="mt-2 text-sm text-amber-400 hover:underline"
          >
            Save default phases to get started →
          </button>
        </div>
      )}
    </div>
  );
}

// Season Schedule Tab Component - Add weeks to phases
function SeasonScheduleTab({ weeks, seasonPhases, programLevels, activeYear, onUpdateWeeks }) {
  const [editingWeek, setEditingWeek] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToPhase, setAddToPhase] = useState(null);
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');

  // Use default phases if none defined
  const phases = seasonPhases.length > 0 ? seasonPhases : DEFAULT_PHASES;

  // Calculate week date based on phase start date and week number
  const getWeekDate = (phaseId, weekNum) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase?.startDate || !weekNum) return null;
    const start = new Date(phase.startDate);
    start.setDate(start.getDate() + ((weekNum - 1) * 7));
    return start.toISOString().split('T')[0];
  };

  // Get next week number for a phase
  const getNextWeekNum = (phaseId) => {
    const phaseWeeks = weeks.filter(w => w.phaseId === phaseId);
    if (phaseWeeks.length === 0) return 1;
    const maxNum = Math.max(...phaseWeeks.map(w => w.weekNum || 0));
    return maxNum + 1;
  };

  // Filter weeks
  const filteredWeeks = weeks.filter(w => {
    if (filterPhase !== 'all' && w.phaseId !== filterPhase) return false;
    if (filterLevel !== 'all') {
      if (filterLevel === 'varsity' && w.levelId) return false;
      if (filterLevel !== 'varsity' && w.levelId !== filterLevel) return false;
    }
    return true;
  });

  const addWeek = (weekData) => {
    const phase = phases.find(p => p.id === weekData.phaseId);
    const calculatedDate = getWeekDate(weekData.phaseId, weekData.weekNum);

    const newWeek = {
      id: `week_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...weekData,
      date: weekData.date || calculatedDate,
      year: activeYear,
      createdAt: new Date().toISOString()
    };
    onUpdateWeeks([...weeks, newWeek]);
    setShowAddModal(false);
    setAddToPhase(null);
  };

  const updateWeek = (weekId, updates) => {
    const newWeeks = weeks.map(w => {
      if (w.id !== weekId) return w;
      const updated = { ...w, ...updates };
      // Recalculate date if week number changed and no manual date override
      if (updates.weekNum && !updates.date) {
        updated.date = getWeekDate(updated.phaseId, updates.weekNum) || updated.date;
      }
      return updated;
    });
    onUpdateWeeks(newWeeks);
  };

  const deleteWeek = (weekId, weekName) => {
    if (!confirm(`Delete "${weekName}"? This will also delete all practice plans and notes for this week.`)) return;
    onUpdateWeeks(weeks.filter(w => w.id !== weekId));
  };

  // Generate multiple weeks for a phase
  const generateWeeks = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;

    const existingCount = weeks.filter(w => w.phaseId === phaseId).length;
    const toGenerate = (phase.numWeeks || 4) - existingCount;

    if (toGenerate <= 0) {
      alert(`This phase already has ${existingCount} weeks (configured for ${phase.numWeeks}).`);
      return;
    }

    if (!confirm(`Generate ${toGenerate} weeks for ${phase.name}?`)) return;

    const newWeeks = [];
    for (let i = 1; i <= toGenerate; i++) {
      const weekNum = existingCount + i;
      newWeeks.push({
        id: `week_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
        name: `${phase.name} Week ${weekNum}`,
        phaseId: phaseId,
        weekNum: weekNum,
        date: getWeekDate(phaseId, weekNum),
        year: activeYear,
        createdAt: new Date().toISOString()
      });
    }

    onUpdateWeeks([...weeks, ...newWeeks]);
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            value={filterPhase}
            onChange={e => setFilterPhase(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Phases</option>
            {phases.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Levels</option>
            <option value="varsity">Varsity</option>
            {programLevels.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus size={18} />
          Add Week
        </button>
      </div>

      {/* Weeks by Phase */}
      {phases.sort((a, b) => a.order - b.order).map(phase => {
        const phaseWeeks = filteredWeeks
          .filter(w => w.phaseId === phase.id)
          .sort((a, b) => (a.weekNum || 0) - (b.weekNum || 0));

        if (filterPhase !== 'all' && filterPhase !== phase.id) return null;

        const colorClass = PHASE_COLORS.find(c => c.id === phase.color)?.class || 'bg-slate-600';
        const hasStartDate = !!phase.startDate;

        return (
          <div key={phase.id} className="space-y-3">
            <div className={`flex items-center justify-between gap-2 px-4 py-3 rounded-lg ${colorClass}`}>
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold">{phase.name}</span>
                <span className="text-white/70 text-sm">
                  ({phaseWeeks.length}{phase.numWeeks ? ` / ${phase.numWeeks}` : ''} weeks)
                </span>
                {phase.startDate && (
                  <span className="text-white/60 text-xs">
                    Starting {new Date(phase.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {phase.numWeeks && phaseWeeks.length < phase.numWeeks && (
                  <button
                    onClick={() => generateWeeks(phase.id)}
                    className="px-3 py-1 bg-white/20 text-white text-xs rounded hover:bg-white/30"
                  >
                    Generate Weeks
                  </button>
                )}
                <button
                  onClick={() => {
                    setAddToPhase(phase.id);
                    setShowAddModal(true);
                  }}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {!hasStartDate && (
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded text-sm text-amber-300">
                Set a start date in Season Phases to auto-calculate week dates.
              </div>
            )}

            {phaseWeeks.length === 0 ? (
              <div className="text-center py-6 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                <p className="text-sm">No weeks in {phase.name.toLowerCase()}</p>
                <button
                  onClick={() => {
                    setAddToPhase(phase.id);
                    setShowAddModal(true);
                  }}
                  className="text-sky-400 text-sm hover:underline mt-1"
                >
                  + Add a week
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {phaseWeeks.map(week => (
                  <div
                    key={week.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm font-mono w-8">#{week.weekNum || '?'}</span>
                        <span className="font-semibold text-white">{week.name}</span>
                        {week.opponent && (
                          <span className="text-slate-400">
                            vs {week.opponent}
                            {week.isHome !== undefined && (
                              <span className="text-xs ml-1">({week.isHome ? 'Home' : 'Away'})</span>
                            )}
                          </span>
                        )}
                        {week.levelId && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                            {programLevels.find(l => l.id === week.levelId)?.name || 'Sub-level'}
                          </span>
                        )}
                      </div>
                      {week.date && (
                        <p className="text-sm text-slate-500 mt-1 ml-11">
                          {new Date(week.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingWeek(week)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteWeek(week.id, week.name)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add/Edit Week Modal */}
      {(showAddModal || editingWeek) && (
        <WeekEditModal
          week={editingWeek}
          phases={phases}
          programLevels={programLevels}
          defaultPhaseId={addToPhase}
          getNextWeekNum={getNextWeekNum}
          getWeekDate={getWeekDate}
          onSave={(data) => {
            if (editingWeek) {
              updateWeek(editingWeek.id, data);
              setEditingWeek(null);
            } else {
              addWeek(data);
            }
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingWeek(null);
            setAddToPhase(null);
          }}
        />
      )}
    </div>
  );
}

// Week Edit Modal
function WeekEditModal({ week, phases, programLevels, defaultPhaseId, getNextWeekNum, getWeekDate, onSave, onClose }) {
  const initialPhase = week?.phaseId || defaultPhaseId || phases[0]?.id || '';
  const [formData, setFormData] = useState({
    name: week?.name || '',
    phaseId: initialPhase,
    weekNum: week?.weekNum || (initialPhase ? getNextWeekNum(initialPhase) : 1),
    opponent: week?.opponent || '',
    isHome: week?.isHome ?? true,
    date: week?.date || '',
    dateOverride: !!week?.date, // Track if date was manually set
    levelId: week?.levelId || '',
    notes: week?.notes || ''
  });

  // Auto-generate name based on phase and week number
  useEffect(() => {
    if (!week && formData.phaseId && formData.weekNum) {
      const phase = phases.find(p => p.id === formData.phaseId);
      if (phase) {
        setFormData(prev => ({
          ...prev,
          name: `${phase.name} Week ${formData.weekNum}`
        }));
      }
    }
  }, [formData.phaseId, formData.weekNum, week, phases]);

  // Auto-calculate date when phase or week number changes
  useEffect(() => {
    if (!formData.dateOverride && formData.phaseId && formData.weekNum) {
      const calculatedDate = getWeekDate(formData.phaseId, formData.weekNum);
      if (calculatedDate) {
        setFormData(prev => ({ ...prev, date: calculatedDate }));
      }
    }
  }, [formData.phaseId, formData.weekNum, formData.dateOverride, getWeekDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Week name is required');
      return;
    }
    onSave({
      ...formData,
      weekNum: parseInt(formData.weekNum) || 1
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {week ? 'Edit Week' : 'Add Week'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phase</label>
              <select
                value={formData.phaseId}
                onChange={e => {
                  const newPhase = e.target.value;
                  setFormData({
                    ...formData,
                    phaseId: newPhase,
                    weekNum: getNextWeekNum(newPhase)
                  });
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Week #</label>
              <input
                type="number"
                value={formData.weekNum}
                onChange={e => setFormData({ ...formData, weekNum: e.target.value, dateOverride: false })}
                min="1"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Week Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Regular Season Week 1"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Opponent</label>
              <input
                type="text"
                value={formData.opponent}
                onChange={e => setFormData({ ...formData, opponent: e.target.value })}
                placeholder="e.g., Rival High"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Home/Away</label>
              <select
                value={formData.isHome ? 'home' : 'away'}
                onChange={e => setFormData({ ...formData, isHome: e.target.value === 'home' })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="home">Home</option>
                <option value="away">Away</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Week Start Date
                {!formData.dateOverride && formData.date && (
                  <span className="text-xs text-emerald-400 ml-2">(auto-calculated)</span>
                )}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value, dateOverride: true })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
              {formData.dateOverride && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, dateOverride: false })}
                  className="text-xs text-sky-400 hover:underline mt-1"
                >
                  Reset to auto-calculate
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Program Level</label>
              <select
                value={formData.levelId}
                onChange={e => setFormData({ ...formData, levelId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="">All Levels / Varsity</option>
                {programLevels.map(l => (
                  <option key={l.id} value={l.id}>{l.name} only</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              {week ? 'Save Changes' : 'Add Week'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Program Events Tab Component
function ProgramEventsTab({ programEvents, onUpdate }) {
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const addEvent = (eventData) => {
    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...eventData,
      createdAt: new Date().toISOString()
    };
    onUpdate('programEvents', [...programEvents, newEvent]);
    setShowAddModal(false);
  };

  const updateEvent = (eventId, updates) => {
    const newEvents = programEvents.map(e => e.id === eventId ? { ...e, ...updates } : e);
    onUpdate('programEvents', newEvents);
  };

  const deleteEvent = (eventId, eventName) => {
    if (!confirm(`Delete "${eventName}"?`)) return;
    onUpdate('programEvents', programEvents.filter(e => e.id !== eventId));
  };

  // Sort events by date
  const sortedEvents = [...programEvents].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">
            Program-wide events that appear on all levels' calendars (banquets, team meals, community events, etc.)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {/* Events List */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p>No program events defined.</p>
          <p className="text-sm mt-1">Add events like banquets, pool parties, or team meals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map(event => (
            <div
              key={event.id}
              className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">{event.name}</span>
                  {event.type && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded">
                      {event.type}
                    </span>
                  )}
                </div>
                {event.date && (
                  <p className="text-sm text-slate-400 mt-1">
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {event.time && ` at ${event.time}`}
                  </p>
                )}
                {event.location && (
                  <p className="text-sm text-slate-500">{event.location}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingEvent(event)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => deleteEvent(event.id, event.name)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {(showAddModal || editingEvent) && (
        <EventEditModal
          event={editingEvent}
          onSave={(data) => {
            if (editingEvent) {
              updateEvent(editingEvent.id, data);
              setEditingEvent(null);
            } else {
              addEvent(data);
            }
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}

// Event Edit Modal
function EventEditModal({ event, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    type: event?.type || '',
    date: event?.date || '',
    time: event?.time || '',
    location: event?.location || '',
    notes: event?.notes || ''
  });

  const eventTypes = ['Banquet', 'Team Meal', 'Pool Party', 'Community Service', 'Fundraiser', 'Meeting', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Event name is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {event ? 'Edit Event' : 'Add Program Event'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., End of Season Banquet"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="">Select type...</option>
                {eventTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., School Cafeteria"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional details..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              {event ? 'Save Changes' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
