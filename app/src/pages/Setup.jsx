import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Target,
  ArrowRightLeft,
  ClipboardCheck,
  Star,
  Dumbbell,
  Video,
  ChevronRight,
  Watch
} from 'lucide-react';
import PlayDiagramEditor from '../components/diagrams/PlayDiagramEditor';
import DiagramPreview from '../components/diagrams/DiagramPreview';

// Collapsible Help Section component
function HelpSection({ title, children, defaultOpen = false, isLight = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`mb-4 rounded-lg overflow-hidden border ${isLight
      ? 'bg-white border-gray-200 shadow-sm'
      : 'bg-slate-700/30 border-slate-600'
      }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isLight
          ? 'hover:bg-gray-200'
          : 'hover:bg-slate-700/50'
          }`}
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-sky-500" />
          <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={18} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
        ) : (
          <ChevronDown size={18} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
        )}
      </button>
      {isOpen && (
        <div className={`px-4 pb-4 text-sm leading-relaxed border-t ${isLight
          ? 'text-gray-600 border-gray-300'
          : 'text-slate-400 border-slate-600'
          }`}>
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
          play purposes (Base, Convert, Shot), field zones (Red Zone, Gold Zone), down & distance categories (3rd & Long), and special situations (2-Min Offense).
        </p>
        <p>
          <strong className="text-white">Play Purposes:</strong> Categorize plays by their role in your offense—
          Base (foundational plays), Convert (situational first-down plays), Shot (explosive opportunities), and Gadget (trick plays).
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
  'quality-control': {
    title: "About Quality Control Definitions",
    content: (
      <div className="pt-3 space-y-3">
        <p>
          <strong className="text-white">Purpose:</strong> Define the parameters used by the X&O Quality Control tool
          to analyze your install, practice scripts, practice performance, game plan, and post-game results.
        </p>
        <p>
          <strong className="text-white">Thresholds:</strong> Set what counts as an "efficient" or "explosive" play
          based on down, distance, and play type. These are used to grade practice reps and game performance.
        </p>
        <p>
          <strong className="text-white">Minimum Volume:</strong> How many reps or calls are needed before play-level
          statistics become meaningful for analysis.
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

// Default position colors - used across all tabs (Name Positions, Personnel, Formations, Diagrams)
const DEFAULT_POSITION_COLORS = {
  QB: '#1e3a5f', RB: '#3b82f6', FB: '#0891b2', WR: '#a855f7', TE: '#f97316',
  LT: '#64748b', LG: '#64748b', C: '#64748b', RG: '#64748b', RT: '#64748b',
  X: '#a855f7', Y: '#22c55e', Z: '#eab308', H: '#06b6d4', F: '#f97316',
  A: '#f97316', B: '#3b82f6',
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
  { id: 'PRACTICE', label: 'Practice Setup' },
  { id: 'SELF_SCOUT', label: 'Self-Scout Setup' }
];

export default function Setup() {
  const { school, staff, setupConfig, updateSetupConfig, weeks, activeYear, updateWeeks, playsArray, settings } = useSchool();
  const { isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();

  // Theme detection
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';
  const { phase: urlPhase, tab: urlTab } = useParams();
  const navigate = useNavigate();

  // Map URL phase slug to internal phase ID
  const phaseSlugToId = {
    'offense': 'OFFENSE',
    'defense': 'DEFENSE',
    'special-teams': 'SPECIAL_TEAMS',
    'practice': 'PRACTICE',
    'program': 'PROGRAM',
    'season': 'SEASON',
    'self-scout': 'SELF_SCOUT'
  };

  const phaseIdToSlug = {
    'OFFENSE': 'offense',
    'DEFENSE': 'defense',
    'SPECIAL_TEAMS': 'special-teams',
    'PRACTICE': 'practice',
    'PROGRAM': 'program',
    'SEASON': 'season',
    'SELF_SCOUT': 'self-scout'
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
  const isSelfScout = phase === 'SELF_SCOUT';

  // Active tab within phase - derive from URL or default
  const getDefaultTab = (p) => {
    if (p === 'PRACTICE') return 'practice-lists';
    if (p === 'PROGRAM') return 'levels';
    if (p === 'SEASON') return 'season-phases';
    if (p === 'SELF_SCOUT') return 'formation-families';
    return 'positions';
  };
  const [activeTab, setActiveTab] = useState(() => urlTab || getDefaultTab(phase));

  // Default position groups
  const DEFAULT_POSITION_GROUPS = {
    OFFENSE: [
      { id: 'grp_qb', name: 'Quarterbacks', abbrev: 'QB', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_rb', name: 'Running Backs', abbrev: 'RB', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_wr', name: 'Wide Receivers', abbrev: 'WR', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_te', name: 'Tight Ends', abbrev: 'TE', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_ol', name: 'Offensive Line', abbrev: 'OL', positions: [], coachIds: [], big3: ['', '', ''] },
    ],
    DEFENSE: [
      { id: 'grp_dl', name: 'Defensive Line', abbrev: 'DL', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_lb', name: 'Linebackers', abbrev: 'LB', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_db', name: 'Defensive Backs', abbrev: 'DB', positions: [], coachIds: [], big3: ['', '', ''] },
    ],
    SPECIAL_TEAMS: [
      { id: 'grp_ko', name: 'Kickoff', abbrev: 'KO', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_kor', name: 'Kickoff Return', abbrev: 'KOR', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_punt', name: 'Punt', abbrev: 'PUNT', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_pr', name: 'Punt Return', abbrev: 'PR', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_fg', name: 'FG / PAT', abbrev: 'FG', positions: [], coachIds: [], big3: ['', '', ''] },
      { id: 'grp_fgb', name: 'FG Block', abbrev: 'FGB', positions: [], coachIds: [], big3: ['', '', ''] },
    ]
  };

  // Default Formation Families
  const DEFAULT_FORMATION_FAMILIES = [
    { id: 'family_2x2', name: '2x2', color: '#3b82f6', category: 'distribution' },
    { id: 'family_3x1', name: '3x1', color: '#8b5cf6', category: 'distribution' },
    { id: 'family_2x1', name: '2x1', color: '#06b6d4', category: 'distribution' },
    { id: 'family_under', name: 'Under Center', color: '#ef4444', category: 'exchange' },
    { id: 'family_gun', name: 'Gun', color: '#22c55e', category: 'exchange' },
    { id: 'family_pistol', name: 'Pistol', color: '#f59e0b', category: 'exchange' },
    { id: 'family_trips', name: 'Trips', color: '#0ea5e9', category: 'grouping' },
    { id: 'family_twins', name: 'Twins', color: '#84cc16', category: 'grouping' },
    { id: 'family_empty', name: 'Empty', color: '#64748b', category: 'grouping' },
  ];

  // Default Shifts & Motions
  const DEFAULT_SHIFT_MOTIONS = [
    { id: 'sm_jet', name: 'Jet', type: 'motion', color: '#ef4444' },
    { id: 'sm_orbit', name: 'Orbit', type: 'motion', color: '#f97316' },
    { id: 'sm_fly', name: 'Fly', type: 'motion', color: '#eab308' },
    { id: 'sm_rocket', name: 'Rocket', type: 'motion', color: '#22c55e' },
    { id: 'sm_return', name: 'Return', type: 'motion', color: '#14b8a6' },
    { id: 'sm_trade', name: 'Trade', type: 'shift', color: '#8b5cf6' },
    { id: 'sm_shift_rt', name: 'Shift Right', type: 'shift', color: '#a855f7' },
    { id: 'sm_shift_lt', name: 'Shift Left', type: 'shift', color: '#d946ef' },
  ];

  // Default Play Buckets
  const DEFAULT_PLAY_BUCKETS = [
    { id: 'run', label: 'Run', color: '#3b82f6', phase: 'OFFENSE' },
    { id: 'pass', label: 'Pass', color: '#8b5cf6', phase: 'OFFENSE' },
    { id: 'screen', label: 'Screen', color: '#f97316', phase: 'OFFENSE' },
    { id: 'rpo', label: 'RPO', color: '#10b981', phase: 'OFFENSE' }
  ];

  // Default Field Zones
  const DEFAULT_FIELD_ZONES = [
    { id: 'zone_backed', name: 'Backed Up', description: 'Own 1-10 yard line', startYard: 1, endYard: 10, color: '#ef4444', order: 1 },
    { id: 'zone_minus', name: 'Minus Territory', description: 'Own 11-49 yard line', startYard: 11, endYard: 49, color: '#f97316', order: 2 },
    { id: 'zone_plus', name: 'Plus Territory', description: 'Opponent 40-26 yard line', startYard: 60, endYard: 74, color: '#eab308', order: 3 },
    { id: 'zone_fringe', name: 'Fringe', description: 'Opponent 25-21 yard line', startYard: 75, endYard: 79, color: '#84cc16', order: 4 },
    { id: 'zone_red', name: 'Red Zone', description: 'Opponent 20-11 yard line', startYard: 80, endYard: 89, color: '#dc2626', order: 5 },
    { id: 'zone_gold', name: 'Gold Zone', description: 'Opponent 10-4 yard line', startYard: 90, endYard: 96, color: '#f59e0b', order: 6 },
    { id: 'zone_goal', name: 'Goal Line', description: 'Opponent 3 yard line and in', startYard: 97, endYard: 100, color: '#22c55e', order: 7 }
  ];

  // Default Down & Distance (with min/max yards for custom ranges)
  const DEFAULT_DOWN_DISTANCE = [
    { id: 'dd_1st', name: '1st Down', description: 'First down', down: '1', minYards: null, maxYards: null, order: 1 },
    { id: 'dd_2long', name: '2nd & Long', description: '2nd down, 7+ yards', down: '2', minYards: 7, maxYards: null, order: 2 },
    { id: 'dd_2med', name: '2nd & Medium', description: '2nd down, 4-6 yards', down: '2', minYards: 4, maxYards: 6, order: 3 },
    { id: 'dd_2short', name: '2nd & Short', description: '2nd down, 1-3 yards', down: '2', minYards: 1, maxYards: 3, order: 4 },
    { id: 'dd_3long', name: '3rd & Long', description: '3rd down, 7+ yards', down: '3', minYards: 7, maxYards: null, order: 5 },
    { id: 'dd_3med', name: '3rd & Medium', description: '3rd down, 4-6 yards', down: '3', minYards: 4, maxYards: 6, order: 6 },
    { id: 'dd_3short', name: '3rd & Short', description: '3rd down, 1-3 yards', down: '3', minYards: 1, maxYards: 3, order: 7 },
    { id: 'dd_4th', name: '4th Down', description: 'Fourth down', down: '4', minYards: null, maxYards: null, order: 8 }
  ];

  // Default Special Situations
  const DEFAULT_SPECIAL_SITUATIONS = [
    { id: 'sit_2min', name: '2-Min Offense', description: 'End of half hurry-up', order: 1 },
    { id: 'sit_4min', name: '4-Min Offense', description: 'Ball control / milk clock', order: 2 },
    { id: 'sit_must', name: 'Must Score', description: 'Need a touchdown', order: 3 },
    { id: 'sit_clock', name: 'Clock Running', description: 'Standard tempo', order: 4 },
    { id: 'sit_open', name: 'Openers', description: 'First play of drive', order: 5 }
  ];

  // Helper to add defaults to config if arrays are empty
  const getConfigWithDefaults = (config) => {
    let updated = { ...config };
    let needsSave = false;

    // Position Groups
    const posGroups = config?.positionGroups || {};
    if (!posGroups.OFFENSE?.length && !posGroups.DEFENSE?.length && !posGroups.SPECIAL_TEAMS?.length) {
      updated.positionGroups = DEFAULT_POSITION_GROUPS;
      needsSave = true;
    }

    // Formation Families
    if (!config?.formationFamilies?.length) {
      updated.formationFamilies = DEFAULT_FORMATION_FAMILIES;
      needsSave = true;
    }

    // Shifts & Motions
    if (!config?.shiftMotions?.length) {
      updated.shiftMotions = DEFAULT_SHIFT_MOTIONS;
      needsSave = true;
    }

    // Play Buckets
    if (!config?.playBuckets?.length) {
      updated.playBuckets = DEFAULT_PLAY_BUCKETS;
      needsSave = true;
    }

    // Field Zones
    if (!config?.fieldZones?.length) {
      updated.fieldZones = DEFAULT_FIELD_ZONES;
      needsSave = true;
    }

    // Down & Distance
    if (!config?.downDistanceCategories?.length) {
      updated.downDistanceCategories = DEFAULT_DOWN_DISTANCE;
      needsSave = true;
    }

    // Special Situations
    if (!config?.specialSituations?.length) {
      updated.specialSituations = DEFAULT_SPECIAL_SITUATIONS;
      needsSave = true;
    }

    // Drills Library - initialize empty structure if not present
    if (!config?.drillsLibrary) {
      updated.drillsLibrary = {
        positionDrills: {},
        schemeDrills: {}
      };
    }

    // Position Colors - initialize with defaults if empty
    // This ensures all tabs (Name Positions, Personnel, Formations) show consistent colors
    if (!config?.positionColors || Object.keys(config.positionColors).length === 0) {
      updated.positionColors = { ...DEFAULT_POSITION_COLORS };
      needsSave = true;
    }

    updated._needsDefaultSave = needsSave;
    return updated;
  };

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'unsaved' | 'saving' | 'error'
  const [error, setError] = useState(null);

  // Local state for editing (to avoid constant Firebase writes) - initialize with defaults
  const [localConfig, setLocalConfig] = useState(() => getConfigWithDefaults(setupConfig));
  const initialConfigRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);

  // Track if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!initialConfigRef.current) return false;
    return JSON.stringify(localConfig) !== JSON.stringify(initialConfigRef.current);
  }, [localConfig]);

  // Sync local config when setupConfig changes from Firebase
  useEffect(() => {
    const configWithDefaults = getConfigWithDefaults(setupConfig);
    const needsDefaults = configWithDefaults._needsDefaultSave;
    delete configWithDefaults._needsDefaultSave;

    setLocalConfig(configWithDefaults);
    // If defaults were added, keep initialConfigRef as the original config
    // so hasUnsavedChanges() returns true and triggers autosave
    if (needsDefaults) {
      initialConfigRef.current = setupConfig;
      setSaveStatus('unsaved');
    } else {
      initialConfigRef.current = configWithDefaults;
      setSaveStatus('saved');
    }
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
        { id: 'position-groups', label: 'Position Groups', icon: Users },
        { id: 'segment-types', label: 'Segment Types', icon: Layers },
        { id: 'segment-focus', label: 'Segment Focus', icon: Target },
        { id: 'drills-library', label: 'Skills & Drills', icon: Dumbbell }
      ];
    }
    // Check if in basic mode
    const isBasicMode = (localConfig.setupMode?.[phase] || 'standard') === 'basic';

    // Self-Scout Setup has its own tabs
    if (isSelfScout) {
      return [
        { id: 'formation-families', label: 'Formation Families', icon: LayoutGrid },
        { id: 'quality-control', label: 'Quality Control Definitions', icon: ClipboardCheck }
      ];
    }

    // Top persistent section
    const tabs = [
      { id: 'positions', label: 'Name Positions', icon: Users },
    ];
    if (isOffense) {
      tabs.push(
        { id: 'personnel', label: 'Personnel Groupings', icon: UserCheck },
        { id: 'situations', label: 'Define Situations', icon: Target },
        { id: 'play-buckets', label: 'Define Play Buckets', icon: Tag },
        { id: 'concept-groups', label: 'Concepts/Groups', icon: Grid }
      );
    }
    // Hide Play Call Chain in Basic mode
    if (!isBasicMode) {
      tabs.push({ id: 'play-call-chain', label: 'Play Call Chain', icon: List });
    }

    // Add divider after stationary items
    tabs.push({ divider: true });

    // For Defense/ST, add buckets after play call chain
    if (!isOffense) {
      tabs.push(
        { id: 'play-buckets', label: isDefense ? 'Categories' : 'Categories', icon: Tag },
        { id: 'concept-groups', label: 'Variations', icon: Grid }
      );
    }

    // Middle section - ordered by play call syntax sequence
    const savedSyntax = setupConfig?.syntax?.[phase] || [];
    const addedTabs = new Set(); // Track which tabs we've added to avoid duplicates

    // Map sourceCategory to tab config
    const categoryToTab = {
      formations: { id: 'formations', label: 'Formations', icon: LayoutGrid },
      formationFamilies: { id: 'formation-families', label: 'Formation Families', icon: LayoutGrid }, // Now in Self-Scout
      shiftMotions: { id: 'shifts-motions', label: 'Shifts/Motions', icon: ArrowRightLeft },
      conceptGroups: { id: 'concept-groups', label: 'Concepts/Groups', icon: Grid },
      readTypes: { id: 'read-types', label: 'Read Types', icon: Eye },
      lookAlikeSeries: { id: 'look-alike-series', label: 'Look-Alike Series', icon: Copy },
      passProtections: { id: 'oline-schemes', label: 'WIZ Library for OL', icon: Shield },
      runBlocking: { id: 'oline-schemes', label: 'WIZ Library for OL', icon: Shield },
    };

    // Add tabs in the order they appear in the play call syntax (skip in Basic mode)
    if (!isBasicMode) {
      savedSyntax.forEach(syntaxPart => {
        if (syntaxPart.sourceCategory && syntaxPart.sourceCategory !== 'custom') {
          const tabConfig = categoryToTab[syntaxPart.sourceCategory];
          if (tabConfig && !addedTabs.has(tabConfig.id)) {
            tabs.push({ ...tabConfig });
            addedTabs.add(tabConfig.id);
          }
        } else if ((!syntaxPart.sourceCategory || syntaxPart.sourceCategory === 'custom') &&
          syntaxPart.label && syntaxPart.label !== 'New') {
          // Custom syntax tab - hidden in Basic mode
          tabs.push({
            id: `custom-syntax-${syntaxPart.id}`,
            label: syntaxPart.label,
            icon: FileText,
            isCustomSyntax: true,
            syntaxPartId: syntaxPart.id
          });
        }
      });
    }

    // Add remaining tabs that weren't in the syntax (for offense)
    // Note: concept-groups is now in the top section for offense, so skip it here
    if (isOffense) {
      if (!addedTabs.has('formations')) {
        tabs.push({ id: 'formations', label: 'Formations', icon: LayoutGrid });
      }
      if (!addedTabs.has('shifts-motions')) {
        tabs.push({ id: 'shifts-motions', label: 'Shifts/Motions', icon: ArrowRightLeft });
      }
      if (!addedTabs.has('read-types')) {
        tabs.push({ id: 'read-types', label: 'Read Types', icon: Eye });
      }
      if (!addedTabs.has('look-alike-series')) {
        tabs.push({ id: 'look-alike-series', label: 'Look-Alike Series', icon: Copy });
      }
      if (!addedTabs.has('oline-schemes')) {
        tabs.push({ id: 'oline-schemes', label: 'WIZ Library for OL', icon: Shield });
      }
    } else {
      // Defense/ST - add formations if not added
      if (!addedTabs.has('formations')) {
        tabs.push({ id: 'formations', label: 'Formation/Front Setup', icon: LayoutGrid });
      }
    }

    // Bottom - Wristband Abbreviations and Glossary (with divider) - hidden in Basic mode
    if (!isBasicMode) {
      tabs.push({ divider: true });
      tabs.push({ id: 'wristband-abbreviations', label: 'Wristband Abbreviations', icon: Watch });
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
      <HelpSection title="What is System Setup?" isLight={isLight}>
        <div className="pt-3 space-y-3">
          <div>
            <h4 className={`font-medium mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>Purpose</h4>
            <p>
              System Setup is where you configure the foundational elements of your football program in DoFO.
              This includes positions, formations, play categories, terminology, and practice structures.
              Think of it as building the vocabulary and organizational structure that the rest of the app will use.
            </p>
          </div>
          <div>
            <h4 className={`font-medium mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>The Four Phases</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Offense:</strong> Set up offensive positions, formations, personnel groupings, play buckets, and OL schemes</li>
              <li><strong>Defense:</strong> Configure defensive positions, fronts, coverages, and blitz categories</li>
              <li><strong>Special Teams:</strong> Define special teams positions, packages, and play categories</li>
              <li><strong>Practice:</strong> Customize practice segment types, focus items, and save templates</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-medium mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>Why Set This Up First?</h4>
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
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${phase === p.id
              ? 'bg-sky-600 text-white'
              : isLight
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Setup Mode Selector - Offense/Defense/ST */}
      {(isOffense || isDefense || isST) && (
        <div className={`mb-6 p-4 rounded-lg border ${isLight
          ? 'bg-white border-gray-200 shadow-sm'
          : 'bg-slate-800/50 border-slate-700'
          }`}>
          <div className="flex flex-col gap-4">
            {/* Header with mode buttons */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Setup Mode
                  <span className={`text-xs px-2 py-0.5 rounded ${(localConfig.setupMode?.[phase] || 'standard') === 'basic'
                    ? isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-600/30 text-sky-400'
                    : (localConfig.setupMode?.[phase] || 'standard') === 'standard'
                      ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-600/30 text-green-400'
                      : isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-600/30 text-purple-400'
                    }`}>
                    {(localConfig.setupMode?.[phase] || 'standard') === 'basic' ? 'Basic' :
                      (localConfig.setupMode?.[phase] || 'standard') === 'standard' ? 'Standard' : 'Advanced'}
                  </span>
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateLocal('setupMode', { ...localConfig.setupMode, [phase]: 'basic' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${(localConfig.setupMode?.[phase] || 'standard') === 'basic'
                    ? 'bg-sky-600 text-white'
                    : isLight
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Basic
                </button>

                <button
                  onClick={() => updateLocal('setupMode', { ...localConfig.setupMode, [phase]: 'advanced' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${(localConfig.setupMode?.[phase] || 'standard') === 'advanced'
                    ? 'bg-purple-600 text-white'
                    : isLight
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Advanced
                </button>
              </div>
            </div>

            {/* Mode description cards */}
            <div className="grid md:grid-cols-2 gap-3">
              {/* Basic Mode Card */}
              <div className={`p-3 rounded-lg border transition-all ${(localConfig.setupMode?.[phase] || 'standard') === 'basic'
                ? isLight
                  ? 'bg-sky-50 border-sky-400 shadow-sm'
                  : 'bg-sky-900/20 border-sky-600/50'
                : isLight
                  ? 'bg-white border-gray-200 opacity-60'
                  : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                }`}>
                <h4 className={`font-medium text-sm mb-2 ${(localConfig.setupMode?.[phase] || 'standard') === 'basic'
                  ? isLight ? 'text-sky-700' : 'text-sky-400'
                  : isLight ? 'text-gray-700' : 'text-slate-300'
                  }`}>Basic Mode</h4>
                <ul className={`text-xs space-y-1 ${(localConfig.setupMode?.[phase] || 'standard') === 'basic'
                  ? isLight ? 'text-sky-600' : 'text-sky-300'
                  : isLight ? 'text-gray-500' : 'text-slate-400'
                  }`}>
                  <li>• Type entire play call in one field</li>
                  <li>• No syntax parsing or breakdown</li>
                  <li>• Practice scripts and game plans work</li>
                  <li>• Situation tagging still available</li>
                </ul>
              </div>

              {/* Advanced Mode Card */}
              <div className={`p-3 rounded-lg border transition-all ${(localConfig.setupMode?.[phase] || 'standard') === 'advanced'
                ? isLight
                  ? 'bg-purple-50 border-purple-400 shadow-sm'
                  : 'bg-purple-900/20 border-purple-600/50'
                : isLight
                  ? 'bg-white border-gray-200 opacity-60'
                  : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                }`}>
                <h4 className={`font-medium text-sm mb-2 ${(localConfig.setupMode?.[phase] || 'standard') === 'advanced'
                  ? isLight ? 'text-purple-700' : 'text-purple-400'
                  : isLight ? 'text-gray-700' : 'text-slate-300'
                  }`}>Advanced Mode</h4>
                <ul className={`text-xs space-y-1 ${(localConfig.setupMode?.[phase] || 'standard') === 'advanced'
                  ? isLight ? 'text-purple-600' : 'text-purple-300'
                  : isLight ? 'text-gray-500' : 'text-slate-400'
                  }`}>
                  <li>• Custom syntax per play bucket</li>
                  <li>• Term signals auto-fill fields</li>
                  <li>• Deep filtering for self-scout</li>
                  <li>• Full play call chain parsing</li>
                </ul>
              </div>
            </div>

            {/* Info note */}
            <p className={`text-xs italic ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              You can switch modes anytime. Your data is preserved when switching - just different entry/filtering options.
            </p>
          </div>
        </div>
      )}

      {/* Offense Setup Overview */}
      {phase === 'OFFENSE' && !isPractice && !isProgram && (
        <HelpSection title="How Offense Setup Works" defaultOpen={false} isLight={isLight}>
          <div className="pt-3 space-y-4">
            <p className={isLight ? 'text-gray-700' : 'text-slate-300'}>
              Offense Setup builds the foundation for your entire playbook. The items you define here become the
              dropdowns, filters, and categories used throughout the app when creating plays, building wristbands,
              and planning game weeks.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`rounded-lg p-3 ${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-slate-700/30'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">1</span>
                  Define Your Building Blocks
                </h4>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Start with the top section: <strong>Name Positions</strong> to customize position labels,
                  <strong> Personnel Groupings</strong> for your packages (11, 12, 21, etc.),
                  <strong> Situations</strong> for down/distance and field zones, and
                  <strong> Play Buckets</strong> to organize your playbook into categories.
                </p>
              </div>

              <div className={`rounded-lg p-3 ${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-slate-700/30'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">2</span>
                  Build Your Play Call Syntax
                </h4>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  The <strong>Play Call Chain</strong> defines how your plays are called. Each part of the call
                  (formation, motion, protection, play name, tag) can pull from the categories you've defined,
                  ensuring consistency across your staff.
                </p>
              </div>

              <div className={`rounded-lg p-3 ${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-slate-700/30'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">3</span>
                  Customize the Middle Section
                </h4>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  The tabs below the line are ordered by your play call syntax. Define your <strong>Formations</strong>,
                  <strong> Shifts/Motions</strong>, <strong>Concepts</strong>, and other elements. These become
                  the options available when building plays.
                </p>
              </div>

              <div className={`rounded-lg p-3 ${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-slate-700/30'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">4</span>
                  Why This Matters
                </h4>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  When you add a play, you'll select from these defined options instead of typing freeform.
                  This means consistent naming, powerful filtering, and the ability to quickly build
                  wristbands and game plans by situation, formation family, or concept.
                </p>
              </div>
            </div>

            <p className={`text-sm italic ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              Tip: Start with the defaults and customize as you go. You can always come back and add more options later.
            </p>
          </div>
        </HelpSection>
      )}

      {/* Content Tabs + Panel */}
      <div className="flex gap-6">
        {/* Tab Navigation */}
        <div className="w-56 flex-shrink-0">
          <div className={`rounded-lg border p-2 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-800/50 border-slate-700'}`}>
            {getTabs().map((tab, idx) => (
              tab.divider ? (
                <div key={`divider-${idx}`} className={`my-2 mx-2 border-t ${isLight ? 'border-gray-300' : 'border-slate-600'}`} />
              ) : (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-colors ${activeTab === tab.id
                    ? isLight
                      ? 'bg-sky-100 text-sky-700 font-medium'
                      : 'bg-sky-500/20 text-sky-400'
                    : isLight
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              )
            ))}
          </div>
        </div>

        {/* Content Panel */}
        <div className={`flex-1 rounded-lg border p-6 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-700'}`}>
          {/* Tab-specific Help */}
          {TAB_HELP[activeTab] && (
            <HelpSection title={TAB_HELP[activeTab].title} isLight={isLight}>
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
              positionTypes={localConfig.positionTypes || {}}
              hiddenPositions={localConfig.hiddenPositions || {}}
              customPositions={localConfig.customPositions || {}}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Position Groups Tab (Practice Setup) */}
          {activeTab === 'position-groups' && isPractice && (
            <PositionGroupsTab
              phase={phase}
              positionGroups={localConfig.positionGroups || {}}
              staff={staff || []}
              onUpdate={updateLocal}
              isLight={isLight}
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
              isLight={isLight}
            />
          )}

          {/* Formations Tab */}
          {activeTab === 'formations' && !isPractice && !isProgram && !isSelfScout && (
            <FormationsTab
              phase={phase}
              formations={(localConfig.formations || []).filter(f => f.phase === phase)}
              personnelGroupings={localConfig.personnelGroupings || []}
              formationFamilies={localConfig.formationFamilies || []}
              onUpdate={(formations) => {
                const otherFormations = (localConfig.formations || []).filter(f => f.phase !== phase);
                updateLocal('formations', [...otherFormations, ...formations]);
              }}
              onUpdateFamilies={(families) => updateLocal('formationFamilies', families)}
              positionColors={localConfig.positionColors || {}}
              positionNames={localConfig.positionNames || {}}
              hiddenPositions={localConfig.hiddenPositions?.OFFENSE || []}
              customPositions={localConfig.customPositions?.OFFENSE || []}
              customDefaultPositions={localConfig.defaultFormationPositions || {}}
              onSaveDefaultPositions={(positions) => updateLocal('defaultFormationPositions', positions)}
              customFamilyCategories={localConfig.customFamilyCategories || []}
              onUpdateCategories={(categories) => updateLocal('customFamilyCategories', categories)}
              isLight={isLight}
              hideFamilies={isOffense}
            />
          )}

          {/* Shifts/Motions Tab (Offense only) */}
          {activeTab === 'shifts-motions' && !isPractice && !isProgram && phase === 'OFFENSE' && (
            <ShiftMotionsTab
              shiftMotions={localConfig.shiftMotions || []}
              onUpdate={(items) => updateLocal('shiftMotions', items)}
              isLight={isLight}
            />
          )}

          {/* Play Buckets Tab */}
          {activeTab === 'play-buckets' && !isPractice && !isProgram && (
            <PlayBucketsTab
              phase={phase}
              buckets={getPlayBuckets()}
              allBuckets={localConfig.playBuckets || []}
              onUpdate={updateLocal}
              setupMode={localConfig.setupMode?.[phase] || 'standard'}
              setupConfig={localConfig}
              isLight={isLight}
            />
          )}

          {/* Read Types Tab (Offense only) */}
          {activeTab === 'read-types' && !isPractice && !isProgram && phase === 'OFFENSE' && (
            <ReadTypesTab
              readTypes={localConfig.readTypes || []}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Look-Alike Series Tab (Offense only) */}
          {activeTab === 'look-alike-series' && !isPractice && !isProgram && phase === 'OFFENSE' && (
            <LookAlikeSeriesTab
              series={localConfig.lookAlikeSeries || []}
              buckets={getPlayBuckets()}
              plays={playsArray}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Define Situations Tab (Offense only) */}
          {activeTab === 'situations' && !isPractice && !isProgram && phase === 'OFFENSE' && (
            <DefineSituationsTab
              fieldZones={localConfig.fieldZones || []}
              downDistanceCategories={localConfig.downDistanceCategories || []}
              specialSituations={localConfig.specialSituations || []}
              playPurposes={localConfig.playPurposes || []}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Concept Groups Tab */}
          {activeTab === 'concept-groups' && !isPractice && !isProgram && (
            <ConceptGroupsTab
              phase={phase}
              buckets={getPlayBuckets()}
              allBuckets={localConfig.playBuckets || []}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Play Call Chain Tab */}
          {activeTab === 'play-call-chain' && !isPractice && !isProgram && (
            <PlayCallChainTab
              phase={phase}
              syntax={localConfig.syntax || {}}
              syntaxTemplates={localConfig.syntaxTemplates || {}}
              termLibrary={localConfig.termLibrary || {}}
              setupConfig={localConfig}
              setupMode={localConfig.setupMode?.[phase] || 'standard'}
              onUpdate={updateLocal}
            />
          )}

          {/* Custom Syntax Term Tabs */}
          {activeTab.startsWith('custom-syntax-') && !isPractice && !isProgram && (() => {
            const syntaxPartId = activeTab.replace('custom-syntax-', '');
            const currentSyntax = localConfig.syntax?.[phase] || [];
            const syntaxPart = currentSyntax.find(s => s.id === syntaxPartId);
            if (!syntaxPart) return null;
            return (
              <CustomSyntaxTermsTab
                phase={phase}
                syntaxPart={syntaxPart}
                termLibrary={localConfig.termLibrary || {}}
                syntax={localConfig.syntax || {}}
                onUpdate={updateLocal}
              />
            );
          })()}

          {/* Wristband Abbreviations Tab */}
          {activeTab === 'wristband-abbreviations' && !isPractice && !isProgram && (
            <WristbandAbbreviationsSection
              phase={phase}
              setupConfig={localConfig}
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

          {/* Quality Control Definitions Tab (Self-Scout Setup) */}
          {activeTab === 'quality-control' && isSelfScout && (
            <QualityControlDefinitionsTab
              qualityControlDefinitions={localConfig.qualityControlDefinitions || {}}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Formation Families Tab (Self-Scout Setup) */}
          {activeTab === 'formation-families' && isSelfScout && (
            <FormationFamiliesTab
              formationFamilies={localConfig.formationFamilies || []}
              customFamilyCategories={localConfig.customFamilyCategories || []}
              onUpdate={(families) => updateLocal('formationFamilies', families)}
              onUpdateCategories={(categories) => updateLocal('customFamilyCategories', categories)}
              isLight={isLight}
            />
          )}

          {/* Segment Types Tab */}
          {activeTab === 'segment-types' && isPractice && (
            <SegmentTypesTab
              segmentTypes={localConfig.practiceSegmentTypes || {}}
              onUpdate={updateLocal}
            />
          )}

          {/* Segment Focus Tab */}
          {activeTab === 'segment-focus' && isPractice && (
            <SegmentFocusTab
              segmentTypes={localConfig.practiceSegmentTypes || {}}
              formations={localConfig.formations || []}
              playBuckets={localConfig.playBuckets || []}
              readTypes={localConfig.readTypes || []}
              lookAlikeSeries={localConfig.lookAlikeSeries || []}
              fieldZones={localConfig.fieldZones || []}
              specialSituations={localConfig.specialSituations || []}
              shiftMotions={localConfig.shiftMotions || []}
              qcPlayPurposes={localConfig.qcPlayPurposes || []}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Skills & Drills Library Tab */}
          {activeTab === 'drills-library' && isPractice && (
            <DrillsLibraryTab
              drillsLibrary={localConfig.drillsLibrary || { positionDrills: {}, schemeDrills: {} }}
              positionGroups={localConfig.positionGroups || {}}
              playBuckets={localConfig.playBuckets || []}
              passProtections={localConfig.passProtections || []}
              runBlocking={localConfig.runBlocking || []}
              plays={playsArray || []}
              onUpdate={updateLocal}
              isLight={isLight}
            />
          )}

          {/* Program Levels Tab */}
          {activeTab === 'levels' && isProgram && (
            <ProgramLevelsTab
              programLevels={localConfig.programLevels || []}
              personnelGroupings={localConfig.personnelGroupings || []}
              staff={staff || []}
              onUpdate={updateLocal}
            />
          )}

          {/* Season Phases Tab */}
          {activeTab === 'season-phases' && isSeason && (
            <SeasonPhasesTab
              seasonPhases={localConfig.seasonPhases || []}
              onUpdate={updateLocal}
              isLight={isLight}
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

// Default position types (skill = ball carrier, line = lineman)
const DEFAULT_POSITION_TYPES = {
  QB: 'skill', RB: 'skill', FB: 'skill', WR: 'skill', TE: 'skill',
  X: 'skill', Y: 'skill', Z: 'skill', H: 'skill', F: 'skill',
  LT: 'line', LG: 'line', C: 'line', RG: 'line', RT: 'line',
  // Defense - all skill for game plan purposes
  DE: 'skill', DT: 'skill', NT: 'skill', OLB: 'skill', ILB: 'skill',
  MLB: 'skill', CB: 'skill', FS: 'skill', SS: 'skill', NB: 'skill', DB: 'skill',
  // Special Teams
  K: 'skill', P: 'skill', LS: 'line', KR: 'skill', PR: 'skill', G: 'skill', PP: 'skill'
};

// Positions Tab Component
function PositionsTab({ phase, positions, positionNames, positionColors, positionDescriptions, positionTypes, hiddenPositions, customPositions, onUpdate, isLight = false }) {
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

  const updatePositionType = (key, value) => {
    onUpdate('positionTypes', { ...(positionTypes || {}), [key]: value });
  };

  const getPositionType = (key) => {
    return positionTypes?.[key] || DEFAULT_POSITION_TYPES[key] || 'skill';
  };

  const hiddenList = hiddenPositions[phase] || [];
  const hiddenDefaults = (DEFAULT_POSITIONS[phase] || []).filter(p => hiddenList.includes(p.key));

  return (
    <div>
      <h3 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>Position Names</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {positions.map(pos => (
          <div key={pos.key} className={`p-4 rounded-lg border relative overflow-hidden group ${isLight
            ? 'bg-white border-gray-200 shadow-sm'
            : 'bg-slate-700/50 border-slate-600'
            }`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
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
                id={`position-desc-${pos.key}`}
                type="text"
                value={positionDescriptions[pos.key] ?? pos.description}
                onChange={(e) => updatePositionDesc(pos.key, e.target.value)}
                placeholder={pos.description}
                aria-label={`${pos.default} description`}
                className={`text-xs text-right bg-transparent border-none w-24 focus:outline-none ${isLight ? 'text-gray-600' : 'text-slate-300'
                  }`}
              />
            </div>

            <div className="flex gap-2 items-stretch">
              <div className="relative flex-shrink-0">
                <input
                  id={`position-color-${pos.key}`}
                  type="color"
                  value={positionColors[pos.key] || DEFAULT_POSITION_COLORS[pos.key] || '#64748b'}
                  onChange={(e) => updatePositionColor(pos.key, e.target.value)}
                  aria-label={`${pos.default} color`}
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
                id={`position-name-${pos.key}`}
                type="text"
                value={positionNames[pos.key] ?? pos.default}
                onChange={(e) => updatePositionName(pos.key, e.target.value)}
                placeholder={pos.default}
                maxLength={3}
                aria-label={`${pos.default} abbreviation`}
                className="flex-1 min-w-0 px-2 py-2 text-center font-bold text-white rounded-lg border border-slate-600"
                style={{ backgroundColor: positionColors[pos.key] || DEFAULT_POSITION_COLORS[pos.key] || '#64748b' }}
              />
            </div>

            {/* Position Type Selector - Only show for Offense */}
            {phase === 'OFFENSE' && (
              <div className="mt-2">
                <select
                  id={`position-type-${pos.key}`}
                  value={getPositionType(pos.key)}
                  onChange={(e) => updatePositionType(pos.key, e.target.value)}
                  aria-label={`${pos.default} position type`}
                  className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-300"
                >
                  <option value="skill">Ball Carrier / Skill</option>
                  <option value="line">Lineman</option>
                </select>
              </div>
            )}
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
function PositionGroupsTab({ phase, positionGroups, staff, onUpdate, isLight = false }) {
  // Position groups are organized by O/D/K, so when viewing from Practice Setup (phase='PRACTICE'),
  // we need our own phase selector
  const [selectedODKPhase, setSelectedODKPhase] = useState('OFFENSE');
  const [openCoachDropdown, setOpenCoachDropdown] = useState(null); // Track which group's dropdown is open
  const activePhase = phase === 'PRACTICE' ? selectedODKPhase : phase;
  const groups = positionGroups[activePhase] || [];

  const addGroup = () => {
    const name = prompt('New position group name:');
    if (!name) return;
    const abbrev = prompt('Abbreviation (e.g., OL, WR):') || name.substring(0, 2).toUpperCase();
    const newGroup = {
      id: `grp_${Date.now()}`,
      name,
      abbrev,
      positions: [],
      coachIds: [], // Array of coach IDs (multi-select)
      big3: ['', '', '']
    };
    onUpdate('positionGroups', { ...positionGroups, [activePhase]: [...groups, newGroup] });
  };

  // Helper to get coach IDs (supports both old coachId and new coachIds format)
  const getCoachIds = (group) => {
    if (group.coachIds?.length > 0) return group.coachIds;
    if (group.coachId) return [group.coachId];
    return [];
  };

  // Get coach names for display
  const getCoachNames = (group) => {
    const ids = getCoachIds(group);
    return ids.map(id => staff?.find(s => s.id === id)?.name).filter(Boolean);
  };

  // Toggle coach selection
  const toggleCoach = (groupId, coachId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const currentIds = getCoachIds(group);
    const newIds = currentIds.includes(coachId)
      ? currentIds.filter(id => id !== coachId)
      : [...currentIds, coachId];
    updateGroup(groupId, { coachIds: newIds, coachId: '' }); // Clear old coachId field
  };

  const deleteGroup = (id) => {
    if (!confirm('Delete this group?')) return;
    onUpdate('positionGroups', { ...positionGroups, [activePhase]: groups.filter(g => g.id !== id) });
  };

  const updateGroup = (id, updates) => {
    onUpdate('positionGroups', {
      ...positionGroups,
      [activePhase]: groups.map(g => g.id === id ? { ...g, ...updates } : g)
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Position Groups</h3>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Assign coaches and set Big 3 focus points for each group.</p>
        </div>
        <button
          onClick={addGroup}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          <Plus size={16} /> Add Group
        </button>
      </div>

      {/* Phase selector when viewing from Practice Setup */}
      {phase === 'PRACTICE' && (
        <div className="flex gap-2 mb-4">
          {[
            { id: 'OFFENSE', label: 'Offense', color: 'bg-blue-500' },
            { id: 'DEFENSE', label: 'Defense', color: 'bg-red-500' },
            { id: 'SPECIAL_TEAMS', label: 'Special Teams', color: 'bg-amber-500' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedODKPhase(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedODKPhase === p.id
                  ? `${p.color} text-white`
                  : isLight
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Click-outside overlay to close dropdown */}
      {openCoachDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenCoachDropdown(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => {
          const selectedCoachIds = getCoachIds(group);
          return (
          <div key={group.id} className={`rounded-lg border p-4 relative ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
            <div className="flex items-start gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  id={`group-abbrev-${group.id}`}
                  type="text"
                  value={group.abbrev || ''}
                  onChange={(e) => updateGroup(group.id, { abbrev: e.target.value.toUpperCase() })}
                  aria-label="Group abbreviation"
                  className="w-14 bg-sky-500 text-white px-2 py-1 rounded text-xs font-bold text-center uppercase flex-shrink-0"
                  placeholder="ABB"
                  maxLength={4}
                />
                <input
                  id={`group-name-${group.id}`}
                  type="text"
                  value={group.name || ''}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  aria-label="Group name"
                  className={`flex-1 min-w-0 bg-transparent border-b font-semibold focus:border-sky-500 focus:outline-none px-1 ${isLight ? 'border-gray-300 text-gray-900' : 'border-slate-500 text-white'}`}
                  placeholder="Group Name"
                />
              </div>
              <button
                onClick={() => deleteGroup(group.id)}
                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Coach Selection - Dropdown Multi-select */}
            <div className="mb-3 relative">
              <span className={`text-xs block mb-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Coach{selectedCoachIds.length > 1 ? 'es' : ''}
              </span>
              <button
                type="button"
                onClick={() => setOpenCoachDropdown(openCoachDropdown === group.id ? null : group.id)}
                className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between ${
                  isLight
                    ? 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                    : 'bg-slate-600 border-slate-500 text-white hover:border-slate-400'
                }`}
              >
                <span className={selectedCoachIds.length === 0 ? (isLight ? 'text-gray-400' : 'text-slate-400') : ''}>
                  {selectedCoachIds.length === 0
                    ? 'Select coaches...'
                    : getCoachNames(group).join(', ')}
                </span>
                <ChevronDown size={14} className={`transition-transform ${openCoachDropdown === group.id ? 'rotate-180' : ''}`} />
              </button>
              {openCoachDropdown === group.id && (
                <div className={`absolute z-10 mt-1 w-full border rounded-lg shadow-lg max-h-40 overflow-y-auto ${
                  isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-500'
                }`}>
                  {staff.filter(s => !s.archived).length === 0 ? (
                    <p className={`text-xs italic p-3 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
                      No staff members defined
                    </p>
                  ) : (
                    staff.filter(s => !s.archived).map(s => {
                      const isSelected = selectedCoachIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 cursor-pointer px-3 py-2 ${
                            isLight
                              ? 'hover:bg-gray-100'
                              : 'hover:bg-slate-600'
                          } ${isSelected ? (isLight ? 'bg-sky-50' : 'bg-sky-500/20') : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCoach(group.id, s.id)}
                            className="rounded border-slate-400 text-sky-500 focus:ring-sky-500"
                          />
                          <span className={`text-sm ${isLight ? 'text-gray-700' : 'text-white'}`}>{s.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Big 3 */}
            <div>
              <span className={`text-xs block mb-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Big 3</span>
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <input
                    id={`group-big3-${group.id}-${i}`}
                    type="text"
                    placeholder={`Focus ${i + 1}...`}
                    value={(group.big3 || [])[i] || ''}
                    onChange={(e) => {
                      const newBig3 = [...(group.big3 || ['', '', ''])];
                      newBig3[i] = e.target.value;
                      updateGroup(group.id, { big3: newBig3 });
                    }}
                    aria-label={`Focus point ${i + 1}`}
                    className={`flex-1 px-2 py-1 border rounded text-sm ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-slate-600 border-slate-500 text-white'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        );
        })}
      </div>

      {groups.length === 0 && (
        <div className={`text-center py-12 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
          <Layers size={48} className="mx-auto mb-4 opacity-30" />
          <p>No position groups defined.</p>
          <p className="text-sm">Click "Add Group" to create position groups.</p>
        </div>
      )}
    </div>
  );
}

// Personnel Tab Component
function PersonnelTab({ personnelGroupings, positions, positionNames, positionColors, onUpdate, isLight = false }) {
  const oLinePositions = ['LT', 'LG', 'C', 'RG', 'RT'];
  const availablePositions = positions
    .filter(p => !oLinePositions.includes(p.key))
    .map(p => p.key);

  const getPosColor = (pos) => positionColors[pos] || DEFAULT_POSITION_COLORS[pos] || '#64748b';

  const addGrouping = () => {
    const newId = `pers_${Date.now()}`;
    // If this is the first grouping, make it the base
    const isFirst = personnelGroupings.length === 0;
    onUpdate('personnelGroupings', [
      ...personnelGroupings,
      { id: newId, code: '', name: 'New Personnel', description: '', positions: [], isBase: isFirst }
    ]);
  };

  const deleteGrouping = (id) => {
    if (!confirm('Delete this personnel grouping?')) return;
    const wasBase = personnelGroupings.find(g => g.id === id)?.isBase;
    const remaining = personnelGroupings.filter(g => g.id !== id);
    // If we deleted the base, make the first remaining one the base
    if (wasBase && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isBase: true };
    }
    onUpdate('personnelGroupings', remaining);
  };

  const updateGrouping = (idx, updates) => {
    const updated = [...personnelGroupings];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate('personnelGroupings', updated);
  };

  const setAsBase = (id) => {
    // Set this one as base, unset all others
    const updated = personnelGroupings.map(g => ({
      ...g,
      isBase: g.id === id
    }));
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
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Personnel Groupings</h3>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Define which skill positions are on the field for each package.</p>
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
          <div key={grouping.id} className={`rounded-lg border p-4 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <input
                    id={`personnel-code-${grouping.id}`}
                    type="text"
                    value={grouping.code || ''}
                    onChange={(e) => updateGrouping(idx, { code: e.target.value })}
                    placeholder="Code"
                    aria-label="Personnel code"
                    className={`w-14 px-2 py-1 text-center font-bold rounded ${isLight ? 'text-sky-600 bg-gray-100 border border-gray-300' : 'text-sky-400 bg-slate-600 border border-slate-500'}`}
                  />
                  <input
                    id={`personnel-name-${grouping.id}`}
                    type="text"
                    value={grouping.name || ''}
                    onChange={(e) => updateGrouping(idx, { name: e.target.value })}
                    placeholder="Name"
                    aria-label="Personnel name"
                    className={`flex-1 px-2 py-1 rounded ${isLight ? 'bg-gray-100 border border-gray-300 text-gray-800' : 'bg-slate-600 border border-slate-500 text-white'}`}
                  />
                </div>
                <input
                  id={`personnel-desc-${grouping.id}`}
                  type="text"
                  value={grouping.description || ''}
                  onChange={(e) => updateGrouping(idx, { description: e.target.value })}
                  placeholder="Description (e.g., 2 RB, 1 TE)"
                  aria-label="Personnel description"
                  className={`w-full px-2 py-1 text-sm rounded ${isLight ? 'bg-gray-100 border border-gray-300 text-gray-600' : 'bg-slate-600 border border-slate-500 text-slate-300'}`}
                />
              </div>
              <div className="flex items-center gap-2">
                {grouping.isBase ? (
                  <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                    <Star size={14} fill="currentColor" /> Base
                  </span>
                ) : (
                  <button
                    onClick={() => setAsBase(grouping.id)}
                    className={`flex items-center gap-1 hover:text-amber-500 text-xs transition-colors ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                    title="Set as default personnel for depth charts"
                  >
                    <Star size={14} /> Set as Base
                  </button>
                )}
                <span className={`text-sm ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>{(grouping.positions || []).length}</span>
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
                    htmlFor={`personnel-pos-${grouping.id}-${pos}`}
                    className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-opacity"
                    style={{
                      backgroundColor: isActive ? color : 'transparent',
                      border: `1px solid ${isActive ? color : (isLight ? 'rgb(209, 213, 219)' : 'rgb(71, 85, 105)')}`,
                      opacity: isActive ? 1 : 0.6
                    }}
                  >
                    <input
                      id={`personnel-pos-${grouping.id}-${pos}`}
                      type="checkbox"
                      checked={isActive}
                      onChange={() => togglePosition(idx, pos)}
                      className="hidden"
                    />
                    <span className={`text-sm font-semibold ${isActive ? 'text-white' : (isLight ? 'text-gray-600' : 'text-slate-300')}`}>
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
        <div className={`text-center py-12 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
          <UserCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p>No personnel groupings defined.</p>
        </div>
      )}

      <div className={`mt-6 p-4 rounded-lg text-sm ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700/30 text-slate-400'}`}>
        <p className="mb-2"><strong className={isLight ? 'text-gray-700' : ''}>Base Personnel:</strong> The personnel grouping marked with a star is used as the default for Depth Charts. Positions in the base personnel determine which slots appear in the depth chart grid.</p>
        <p><strong className={isLight ? 'text-gray-700' : ''}>Tip:</strong> Positions shown here come from your Positions tab. Add custom positions there to include them in personnel groupings.</p>
      </div>
    </div>
  );
}

// Formation Families Tab Component (for Self-Scout Setup)
function FormationFamiliesTab({ formationFamilies = [], customFamilyCategories = [], onUpdate, onUpdateCategories, isLight = false }) {
  // Default family categories
  const DEFAULT_FAMILY_CATEGORIES = [
    { id: 'distribution', name: 'WR Distribution', description: 'How receivers are split (2x2, 3x1, etc.)', isDefault: true },
    { id: 'exchange', name: 'QB Exchange', description: 'How QB receives the snap', isDefault: true },
    { id: 'backfield', name: 'Backfield', description: 'RB alignment', isDefault: true },
    { id: 'te', name: 'TE Positioning', description: 'Tight End alignment', isDefault: true },
    { id: 'grouping', name: 'WR Groupings', description: 'Receiver clusters (Trips, Bunch)', isDefault: true },
    { id: 'strength', name: 'Strength', description: 'Formation strength call', isDefault: true },
    { id: 'trade', name: 'Trade/Unbalanced', description: 'OL adjustments', isDefault: true },
    { id: 'type', name: 'Formation Type', description: 'Open vs Closed formations', isDefault: true },
    { id: 'other', name: 'Other', description: 'Miscellaneous families', isDefault: true },
  ];

  const FAMILY_CATEGORIES = [...DEFAULT_FAMILY_CATEGORIES, ...(customFamilyCategories || [])];

  // State for modals
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyCategory, setNewFamilyCategory] = useState('other');
  const [newFamilyColor, setNewFamilyColor] = useState('#3b82f6');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // Default formation families
  const DEFAULT_FAMILIES = [
    { id: 'family_2x2', name: '2x2', color: '#3b82f6', category: 'distribution' },
    { id: 'family_3x1', name: '3x1', color: '#8b5cf6', category: 'distribution' },
    { id: 'family_2x1', name: '2x1', color: '#06b6d4', category: 'distribution' },
    { id: 'family_3x2', name: '3x2', color: '#6366f1', category: 'distribution' },
    { id: 'family_under', name: 'Under Center', color: '#ef4444', category: 'exchange' },
    { id: 'family_gun', name: 'Gun', color: '#22c55e', category: 'exchange' },
    { id: 'family_pistol', name: 'Pistol', color: '#f59e0b', category: 'exchange' },
    { id: 'family_i', name: 'I-Form', color: '#7c3aed', category: 'backfield' },
    { id: 'family_split', name: 'Split Backs', color: '#0891b2', category: 'backfield' },
    { id: 'family_offset', name: 'Offset', color: '#65a30d', category: 'backfield' },
    { id: 'family_yon', name: 'Y On', color: '#ec4899', category: 'te' },
    { id: 'family_yoff', name: 'Y Off', color: '#14b8a6', category: 'te' },
    { id: 'family_nub', name: 'Nub', color: '#f97316', category: 'te' },
    { id: 'family_trips', name: 'Trips', color: '#0ea5e9', category: 'grouping' },
    { id: 'family_twins', name: 'Twins', color: '#84cc16', category: 'grouping' },
    { id: 'family_bunch', name: 'Bunch', color: '#f43f5e', category: 'grouping' },
    { id: 'family_stack', name: 'Stack', color: '#7c3aed', category: 'grouping' },
    { id: 'family_empty', name: 'Empty', color: '#64748b', category: 'grouping' },
    { id: 'family_strong', name: 'Strong', color: '#059669', category: 'strength' },
    { id: 'family_weak', name: 'Weak', color: '#dc2626', category: 'strength' },
    { id: 'family_balanced', name: 'Balanced', color: '#6b7280', category: 'strength' },
    { id: 'family_trade', name: 'Trade', color: '#b45309', category: 'trade' },
    { id: 'family_open', name: 'Open', color: '#0d9488', category: 'type' },
    { id: 'family_closed', name: 'Closed', color: '#78350f', category: 'type' },
  ];

  const loadDefaultFamilies = () => {
    if (formationFamilies.length > 0 && !confirm('This will add default families to your existing list. Continue?')) return;
    const existingNames = formationFamilies.map(f => f.name.toLowerCase());
    const newFamilies = DEFAULT_FAMILIES.filter(f => !existingNames.includes(f.name.toLowerCase()));
    onUpdate([...formationFamilies, ...newFamilies]);
  };

  const familiesByCategory = useMemo(() => {
    const grouped = {};
    FAMILY_CATEGORIES.forEach(cat => {
      grouped[cat.id] = formationFamilies.filter(f => (f.category || 'other') === cat.id);
    });
    return grouped;
  }, [formationFamilies, FAMILY_CATEGORIES]);

  const addFamily = () => {
    if (!newFamilyName.trim()) return;
    const newFamily = {
      id: `family_${Date.now()}`,
      name: newFamilyName.trim(),
      color: newFamilyColor,
      category: newFamilyCategory
    };
    onUpdate([...formationFamilies, newFamily]);
    setShowAddFamilyModal(false);
    setNewFamilyName('');
    setNewFamilyCategory('other');
    setNewFamilyColor('#3b82f6');
  };

  const deleteFamily = (id) => {
    if (!confirm('Delete this family?')) return;
    onUpdate(formationFamilies.filter(f => f.id !== id));
  };

  const updateFamily = (id, updates) => {
    onUpdate(formationFamilies.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || `Custom category: ${newCategoryName.trim()}`,
      isDefault: false
    };
    onUpdateCategories([...(customFamilyCategories || []), newCategory]);
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const deleteCategory = (categoryId) => {
    const category = FAMILY_CATEGORIES.find(c => c.id === categoryId);
    if (category?.isDefault) {
      alert('Cannot delete default categories.');
      return;
    }
    if (!confirm(`Delete "${category?.name}" category? Families in this category will be moved to "Other".`)) return;
    const updatedFamilies = formationFamilies.map(f =>
      f.category === categoryId ? { ...f, category: 'other' } : f
    );
    onUpdate(updatedFamilies);
    onUpdateCategories((customFamilyCategories || []).filter(c => c.id !== categoryId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Formation Families</h3>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Group formations for self-scouting tendencies analysis
          </p>
        </div>
        {formationFamilies.length === 0 && (
          <button
            onClick={loadDefaultFamilies}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Load Defaults
          </button>
        )}
      </div>

      <div className={`p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'}`}>
        <p className={`text-sm mb-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Group formations by receiver distribution (2x2, 3x1), QB exchange (Gun, Under), TE alignment (Y On/Off, Nub), groupings (Trips, Bunch), strength (Right/Left/Balanced), or formation type (Open/Closed).
        </p>

        <div className="space-y-3">
          {FAMILY_CATEGORIES.map(category => {
            const categoryFamilies = familiesByCategory[category.id] || [];
            if (categoryFamilies.length === 0 && formationFamilies.length > 0) return null;

            return (
              <div key={category.id} className={`p-2 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-700/30'}`}>
                <div className="flex items-center justify-between mb-2 group">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      {category.name}
                    </span>
                    {!category.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">Custom</span>
                    )}
                    <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                      {category.description}
                    </span>
                  </div>
                  {!category.isDefault && (
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                      title="Delete category"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categoryFamilies.map(family => (
                    <div
                      key={family.id}
                      className="group flex items-center gap-1 px-2 py-0.5 rounded border text-sm"
                      style={{ backgroundColor: family.color + '20', borderColor: family.color }}
                    >
                      <input
                        type="color"
                        value={family.color}
                        onChange={(e) => updateFamily(family.id, { color: e.target.value })}
                        className="w-3 h-3 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={family.name}
                        onChange={(e) => updateFamily(family.id, { name: e.target.value })}
                        className={`bg-transparent text-xs font-medium border-none focus:outline-none w-16 ${isLight ? 'text-gray-800' : 'text-white'}`}
                      />
                      <select
                        value={family.category || 'other'}
                        onChange={(e) => updateFamily(family.id, { category: e.target.value })}
                        className={`opacity-0 group-hover:opacity-100 w-4 h-4 text-[10px] bg-transparent border-none cursor-pointer transition-opacity ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                      >
                        {FAMILY_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteFamily(family.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {categoryFamilies.length === 0 && (
                    <span className={`text-xs italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                      No {category.name.toLowerCase()} families yet
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setShowAddFamilyModal(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Plus size={14} /> Add Family
          </button>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'}`}
          >
            <Plus size={14} /> Add Category
          </button>
          {formationFamilies.length > 0 && (
            <button
              onClick={loadDefaultFamilies}
              className="text-xs text-amber-500 hover:text-amber-400 underline"
            >
              + Add more default families
            </button>
          )}
        </div>
      </div>

      {/* Add Family Modal */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl w-80 ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
              <h4 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Add Formation Family</h4>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Family Name
                </label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="e.g., Trips, Gun, Strong..."
                  className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                  autoFocus
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Category
                </label>
                <select
                  value={newFamilyCategory}
                  onChange={(e) => setNewFamilyCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                >
                  {FAMILY_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Color
                </label>
                <input
                  type="color"
                  value={newFamilyColor}
                  onChange={(e) => setNewFamilyColor(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
              <button
                onClick={() => { setShowAddFamilyModal(false); setNewFamilyName(''); }}
                className={`px-3 py-1.5 rounded text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Cancel
              </button>
              <button
                onClick={addFamily}
                className="px-3 py-1.5 bg-sky-600 text-white rounded text-sm hover:bg-sky-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl w-80 ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
              <h4 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Add Custom Category</h4>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Motion Package"
                  className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                  autoFocus
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Description
                </label>
                <input
                  type="text"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Optional description"
                  className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                />
              </div>
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
              <button
                onClick={() => { setShowAddCategoryModal(false); setNewCategoryName(''); setNewCategoryDescription(''); }}
                className={`px-3 py-1.5 rounded text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Formations Tab Component
function FormationsTab({ phase, formations, personnelGroupings, formationFamilies = [], onUpdate, onUpdateFamilies, positionColors = {}, positionNames = {}, hiddenPositions = [], customPositions = [], customDefaultPositions = {}, onSaveDefaultPositions, customFamilyCategories = [], onUpdateCategories, isLight = false, hideFamilies = false }) {
  const [showFamiliesSection, setShowFamiliesSection] = useState(true);
  const [editingFormationId, setEditingFormationId] = useState(null);
  const [showCreateEditor, setShowCreateEditor] = useState(false); // For creating new formations from scratch
  const isOffense = phase === 'OFFENSE';

  // Compute available offense positions (same logic as SchoolContext)
  const offensePositions = (() => {
    const defaults = ['QB', 'RB', 'FB', 'WR', 'TE', 'X', 'Y', 'Z', 'H', 'F', 'A', 'B'];
    const visible = defaults.filter(p => !hiddenPositions.includes(p));
    const customKeys = customPositions.map(p => p.key).filter(Boolean);
    return [...visible, ...customKeys];
  })();

  // Get the formation being edited
  const editingFormation = editingFormationId ? formations.find(f => f.id === editingFormationId) : null;

  const addFormation = () => {
    const name = prompt('Formation name:');
    if (!name) return;
    const newFormation = {
      id: `form_${Date.now()}`,
      name,
      personnel: '',
      families: [],
      positions: null, // Will be set when diagram is created
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

  // Handle saving formation diagram from WIZ editor
  const handleSaveFormationDiagram = (elements) => {
    if (!editingFormationId) return;

    // Extract player positions from elements (convert to percentage-based coords)
    const playerElements = elements.filter(el => el.type === 'player');
    const positions = playerElements.map(el => {
      const point = el.points[0];
      const pos = {
        label: el.label,
        x: Math.round((point.x / 950) * 100 * 10) / 10, // Convert to percentage
        y: Math.round((point.y / 600) * 100 * 10) / 10,
        shape: el.shape || 'circle',
        variant: el.variant || 'filled'
      };
      // Only include optional fields if they have values (Firebase doesn't allow undefined)
      if (el.color) pos.color = el.color;
      if (el.fontSize) pos.fontSize = el.fontSize;
      if (el.groupId) pos.groupId = 'grouped';
      return pos;
    });

    // Update the formation with positions
    updateFormation(editingFormationId, { positions });
    setEditingFormationId(null);
  };

  // Handle "Save As" new formation from WIZ editor (creates a new formation)
  const handleSaveAsNewFormation = (newFormation) => {
    // newFormation comes from PlayDiagramEditor's saveFormationTemplate with { name, personnel, positions }
    const formation = {
      id: `form_${Date.now()}`,
      name: newFormation.name,
      personnel: newFormation.personnel || '',
      families: [],
      positions: newFormation.positions,
      phase,
      createdAt: new Date().toISOString()
    };
    onUpdate([...formations, formation]);
    // Close the editor after saving
    setEditingFormationId(null);
    setShowCreateEditor(false);
  };

  // Use global defaults - matches the DEFAULT_POSITION_COLORS shown in Name Positions tab
  const POSITION_COLORS_DEFAULTS = {
    QB: '#1e3a5f', RB: '#3b82f6', FB: '#0891b2', WR: '#a855f7', TE: '#f97316',
    LT: '#64748b', LG: '#64748b', C: '#64748b', RG: '#64748b', RT: '#64748b',
    X: '#a855f7', Y: '#22c55e', Z: '#eab308', H: '#06b6d4', F: '#f97316',
    A: '#f97316', B: '#3b82f6'
  };
  const SKILL_POSITION_FALLBACK = '#3b82f6'; // Blue fallback for any position not in defaults

  // Get initial elements for the WIZ editor based on formation
  const getInitialElements = () => {
    if (!editingFormation) return null;

    // Debug: log positionColors to verify custom colors are available
    console.log('DEBUG getInitialElements - positionColors:', JSON.stringify(positionColors));

    // If formation already has positions, load them
    if (editingFormation.positions && editingFormation.positions.length > 0) {
      return editingFormation.positions.map((pos, idx) => {
        const resolvedColor = positionColors[pos.label] || pos.color || POSITION_COLORS_DEFAULTS[pos.label] || SKILL_POSITION_FALLBACK;
        console.log(`DEBUG position ${pos.label}: positionColors[${pos.label}]=${positionColors[pos.label]}, stored=${pos.color}, resolved=${resolvedColor}`);
        return {
          id: Date.now() + idx,
          type: 'player',
          points: [{ x: (pos.x / 100) * 950, y: (pos.y / 100) * 600 }],
          // Always prioritize current positionColors over stored colors
          color: resolvedColor,
          label: pos.label,
          shape: pos.shape || 'circle',
          variant: pos.variant || 'filled',
          fontSize: pos.fontSize,
          groupId: pos.groupId
        };
      });
    }

    // Otherwise, return null to use default formation
    return null;
  };

  // Default family category definitions
  const DEFAULT_FAMILY_CATEGORIES = [
    { id: 'distribution', name: 'WR Distribution', description: 'Receiver count by side (2x2, 3x1, etc.)', isDefault: true },
    { id: 'exchange', name: 'QB Alignment', description: 'QB-Center exchange type', isDefault: true },
    { id: 'backfield', name: 'Backfield', description: 'RB/FB positioning', isDefault: true },
    { id: 'te', name: 'TE Positioning', description: 'Tight end alignment', isDefault: true },
    { id: 'grouping', name: 'WR Groupings', description: 'Receiver formations (Trips, Bunch, etc.)', isDefault: true },
    { id: 'strength', name: 'Strength', description: 'Formation strength call', isDefault: true },
    { id: 'trade', name: 'Trade', description: 'OL trade formations', isDefault: true },
    { id: 'type', name: 'Formation Type', description: 'Open/Closed surface', isDefault: true },
    { id: 'other', name: 'Other', description: 'Miscellaneous tags', isDefault: true },
  ];

  // Merge default and custom categories
  const FAMILY_CATEGORIES = useMemo(() => {
    const custom = customFamilyCategories || [];
    return [...DEFAULT_FAMILY_CATEGORIES, ...custom];
  }, [customFamilyCategories]);

  // State for add category modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || `Custom category: ${newCategoryName.trim()}`,
      isDefault: false
    };
    onUpdateCategories([...(customFamilyCategories || []), newCategory]);
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const deleteCategory = (categoryId) => {
    const category = FAMILY_CATEGORIES.find(c => c.id === categoryId);
    if (category?.isDefault) {
      alert('Cannot delete default categories.');
      return;
    }
    if (!confirm(`Delete "${category?.name}" category? Families in this category will be moved to "Other".`)) return;

    // Move families in this category to 'other'
    const updatedFamilies = formationFamilies.map(f =>
      f.category === categoryId ? { ...f, category: 'other' } : f
    );
    onUpdateFamilies(updatedFamilies);

    // Remove the category
    onUpdateCategories((customFamilyCategories || []).filter(c => c.id !== categoryId));
  };

  // Default formation families organized by category
  const DEFAULT_FAMILIES = [
    // WR Distribution
    { id: 'family_2x2', name: '2x2', color: '#3b82f6', category: 'distribution' },
    { id: 'family_3x1', name: '3x1', color: '#8b5cf6', category: 'distribution' },
    { id: 'family_2x1', name: '2x1', color: '#06b6d4', category: 'distribution' },
    { id: 'family_3x2', name: '3x2', color: '#6366f1', category: 'distribution' },
    // QB Alignment
    { id: 'family_under', name: 'Under Center', color: '#ef4444', category: 'exchange' },
    { id: 'family_gun', name: 'Gun', color: '#22c55e', category: 'exchange' },
    { id: 'family_pistol', name: 'Pistol', color: '#f59e0b', category: 'exchange' },
    // Backfield
    { id: 'family_i', name: 'I-Form', color: '#7c3aed', category: 'backfield' },
    { id: 'family_split', name: 'Split Backs', color: '#0891b2', category: 'backfield' },
    { id: 'family_offset', name: 'Offset', color: '#65a30d', category: 'backfield' },
    // TE Positioning
    { id: 'family_yon', name: 'Y On', color: '#ec4899', category: 'te' },
    { id: 'family_yoff', name: 'Y Off', color: '#14b8a6', category: 'te' },
    { id: 'family_nub', name: 'Nub', color: '#f97316', category: 'te' },
    { id: 'family_wing', name: 'Wing', color: '#a855f7', category: 'te' },
    { id: 'family_flexte', name: 'Flex TE', color: '#06b6d4', category: 'te' },
    // WR Groupings
    { id: 'family_trips', name: 'Trips', color: '#0ea5e9', category: 'grouping' },
    { id: 'family_twins', name: 'Twins', color: '#84cc16', category: 'grouping' },
    { id: 'family_bunch', name: 'Bunch', color: '#f43f5e', category: 'grouping' },
    { id: 'family_stack', name: 'Stack', color: '#7c3aed', category: 'grouping' },
    { id: 'family_empty', name: 'Empty', color: '#64748b', category: 'grouping' },
    // Strength
    { id: 'family_strong', name: 'Strong', color: '#059669', category: 'strength' },
    { id: 'family_weak', name: 'Weak', color: '#dc2626', category: 'strength' },
    { id: 'family_balanced', name: 'Balanced', color: '#6b7280', category: 'strength' },
    // Trade
    { id: 'family_trade', name: 'Trade', color: '#b45309', category: 'trade' },
    { id: 'family_tackle_over', name: 'Tackle Over', color: '#7c2d12', category: 'trade' },
    { id: 'family_unbalanced', name: 'Unbalanced', color: '#991b1b', category: 'trade' },
    // Formation Type
    { id: 'family_open', name: 'Open', color: '#0d9488', category: 'type' },
    { id: 'family_closed', name: 'Closed', color: '#78350f', category: 'type' },
  ];

  // State for add family modal
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyCategory, setNewFamilyCategory] = useState('other');
  const [newFamilyColor, setNewFamilyColor] = useState('#3b82f6');

  const loadDefaultFamilies = () => {
    if (formationFamilies.length > 0 && !confirm('This will add default families to your existing list. Continue?')) return;
    // Only add families that don't already exist (by name)
    const existingNames = formationFamilies.map(f => f.name.toLowerCase());
    const newFamilies = DEFAULT_FAMILIES.filter(f => !existingNames.includes(f.name.toLowerCase()));
    onUpdateFamilies([...formationFamilies, ...newFamilies]);
  };

  // Group families by category
  const familiesByCategory = useMemo(() => {
    const grouped = {};
    FAMILY_CATEGORIES.forEach(cat => {
      grouped[cat.id] = formationFamilies.filter(f => (f.category || 'other') === cat.id);
    });
    return grouped;
  }, [formationFamilies]);

  // Family management
  const addFamily = () => {
    if (!newFamilyName.trim()) return;
    const newFamily = {
      id: `family_${Date.now()}`,
      name: newFamilyName.trim(),
      color: newFamilyColor,
      category: newFamilyCategory
    };
    onUpdateFamilies([...formationFamilies, newFamily]);
    setShowAddFamilyModal(false);
    setNewFamilyName('');
    setNewFamilyCategory('other');
    setNewFamilyColor('#3b82f6');
  };

  const deleteFamily = (id) => {
    if (!confirm('Delete this family? Formations will be untagged.')) return;
    onUpdateFamilies(formationFamilies.filter(f => f.id !== id));
    // Remove family from all formations
    onUpdate(formations.map(f => ({
      ...f,
      families: (f.families || []).filter(fId => fId !== id)
    })));
  };

  const updateFamily = (id, updates) => {
    onUpdateFamilies(formationFamilies.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const toggleFormationFamily = (formationId, familyId) => {
    const formation = formations.find(f => f.id === formationId);
    if (!formation) return;
    const currentFamilies = formation.families || [];
    const newFamilies = currentFamilies.includes(familyId)
      ? currentFamilies.filter(id => id !== familyId)
      : [...currentFamilies, familyId];
    updateFormation(formationId, { families: newFamilies });
  };

  const phaseLabel = phase === 'DEFENSE' ? 'Fronts' : phase === 'SPECIAL_TEAMS' ? 'Packages' : 'Formations';

  return (
    <div className="space-y-6">
      {/* Families Section (Offense only, unless hideFamilies is true) */}
      {isOffense && !hideFamilies && (
        <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-800/50 border-slate-700'}`}>
          <button
            onClick={() => setShowFamiliesSection(!showFamiliesSection)}
            className={`w-full flex items-center justify-between p-4 text-left ${isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-700/30'}`}
          >
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-amber-500" />
              <span className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Formation Families</span>
              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>({formationFamilies.length})</span>
            </div>
            {showFamiliesSection ? <ChevronDown size={18} className={isLight ? 'text-gray-400' : 'text-slate-400'} /> : <ChevronUp size={18} className={`rotate-180 ${isLight ? 'text-gray-400' : 'text-slate-400'}`} />}
          </button>

          {showFamiliesSection && (
            <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  Group formations by receiver distribution (2x2, 3x1), QB exchange (Gun, Under), TE alignment (Y On/Off, Nub), groupings (Trips, Bunch), strength (Right/Left/Balanced), or formation type (Open/Closed).
                </p>
                {formationFamilies.length === 0 && (
                  <button
                    onClick={loadDefaultFamilies}
                    className="flex-shrink-0 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
                  >
                    Load Defaults
                  </button>
                )}
              </div>

              {/* Families grouped by category */}
              <div className="space-y-3">
                {FAMILY_CATEGORIES.map(category => {
                  const categoryFamilies = familiesByCategory[category.id] || [];
                  if (categoryFamilies.length === 0 && formationFamilies.length > 0) return null;

                  return (
                    <div key={category.id} className={`p-2 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-700/30'}`}>
                      <div className="flex items-center justify-between mb-2 group">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                            {category.name}
                          </span>
                          {!category.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">Custom</span>
                          )}
                          <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                            {category.description}
                          </span>
                        </div>
                        {!category.isDefault && (
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                            title="Delete category"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {categoryFamilies.map(family => (
                          <div
                            key={family.id}
                            className="group flex items-center gap-1 px-2 py-0.5 rounded border text-sm"
                            style={{ backgroundColor: family.color + '20', borderColor: family.color }}
                          >
                            <input
                              id={`family-color-${family.id}`}
                              type="color"
                              value={family.color}
                              onChange={(e) => updateFamily(family.id, { color: e.target.value })}
                              aria-label={`${family.name} color`}
                              className="w-3 h-3 rounded cursor-pointer border-0"
                            />
                            <input
                              id={`family-name-${family.id}`}
                              type="text"
                              value={family.name}
                              onChange={(e) => updateFamily(family.id, { name: e.target.value })}
                              aria-label="Family name"
                              className={`bg-transparent text-xs font-medium border-none focus:outline-none w-16 ${isLight ? 'text-gray-800' : 'text-white'}`}
                            />
                            <select
                              value={family.category || 'other'}
                              onChange={(e) => updateFamily(family.id, { category: e.target.value })}
                              aria-label="Family category"
                              className={`opacity-0 group-hover:opacity-100 w-4 h-4 text-[10px] bg-transparent border-none cursor-pointer transition-opacity ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                              title="Change category"
                            >
                              {FAMILY_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteFamily(family.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {categoryFamilies.length === 0 && (
                          <span className={`text-xs italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                            No {category.name.toLowerCase()} families yet
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setShowAddFamilyModal(true)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  <Plus size={14} /> Add Family
                </button>
                <button
                  onClick={() => setShowAddCategoryModal(true)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'}`}
                >
                  <Plus size={14} /> Add Category
                </button>
                {formationFamilies.length === 0 ? (
                  <span className={`text-xs italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                    Click "Load Defaults" above to get started
                  </span>
                ) : (
                  <button
                    onClick={loadDefaultFamilies}
                    className="text-xs text-amber-500 hover:text-amber-400 underline"
                  >
                    + Add more default families
                  </button>
                )}
              </div>

              {/* Add Family Modal */}
              {showAddFamilyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className={`rounded-lg shadow-xl w-80 ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
                    <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                      <h4 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Add Formation Family</h4>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          Family Name
                        </label>
                        <input
                          type="text"
                          value={newFamilyName}
                          onChange={(e) => setNewFamilyName(e.target.value)}
                          placeholder="e.g., Trips, Gun, Strong..."
                          className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          Category
                        </label>
                        <select
                          value={newFamilyCategory}
                          onChange={(e) => setNewFamilyCategory(e.target.value)}
                          className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                        >
                          {FAMILY_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          Color
                        </label>
                        <input
                          type="color"
                          value={newFamilyColor}
                          onChange={(e) => setNewFamilyColor(e.target.value)}
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className={`p-4 border-t flex justify-end gap-2 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                      <button
                        onClick={() => { setShowAddFamilyModal(false); setNewFamilyName(''); }}
                        className={`px-3 py-1.5 rounded text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addFamily}
                        disabled={!newFamilyName.trim()}
                        className="px-3 py-1.5 bg-sky-600 text-white rounded text-sm hover:bg-sky-700 disabled:opacity-50"
                      >
                        Add Family
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Category Modal */}
              {showAddCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className={`rounded-lg shadow-xl w-80 ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
                    <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                      <h4 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Add Custom Category</h4>
                      <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        Create a new category to organize formation families
                      </p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g., Tempo, Personnel Sets, Motion Type..."
                          className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          placeholder="Brief description of this category"
                          className={`w-full px-3 py-2 rounded border text-sm ${isLight ? 'bg-white border-gray-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                        />
                      </div>
                    </div>
                    <div className={`p-4 border-t flex justify-end gap-2 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                      <button
                        onClick={() => { setShowAddCategoryModal(false); setNewCategoryName(''); setNewCategoryDescription(''); }}
                        className={`px-3 py-1.5 rounded text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addCategory}
                        disabled={!newCategoryName.trim()}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                      >
                        Add Category
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Formations Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{phaseLabel}</h3>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              {isOffense
                ? 'Define formations and assign them to families and personnel packages.'
                : `Define your ${phaseLabel.toLowerCase()} and link them to personnel packages.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addFormation}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              <Plus size={16} /> Add {phase === 'DEFENSE' ? 'Front' : phase === 'SPECIAL_TEAMS' ? 'Package' : 'Formation'}
            </button>
            {isOffense && (
              <button
                onClick={() => setShowCreateEditor(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                title="Open diagram editor to create and save formations"
              >
                <Grid size={16} /> Create with Diagram
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formations.map(formation => (
            <div key={formation.id} className={`rounded-lg border p-4 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
              <div className="flex justify-between items-start mb-3">
                <input
                  id={`formation-name-${formation.id}`}
                  type="text"
                  value={formation.name}
                  onChange={(e) => updateFormation(formation.id, { name: e.target.value })}
                  aria-label="Formation name"
                  className={`font-semibold bg-transparent border-none focus:outline-none ${isLight ? 'text-gray-800' : 'text-white'}`}
                />
                <button onClick={() => deleteFormation(formation.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Family Tags (Offense only) */}
              {isOffense && formationFamilies.length > 0 && (
                <div className="mb-3">
                  <label className={`text-xs block mb-1.5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Families</label>
                  <div className="flex flex-wrap gap-1">
                    {formationFamilies.map(family => {
                      const isSelected = (formation.families || []).includes(family.id);
                      return (
                        <button
                          key={family.id}
                          onClick={() => toggleFormationFamily(formation.id, family.id)}
                          className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${isSelected
                            ? `ring-1 ring-offset-1 ${isLight ? 'ring-offset-white' : 'ring-offset-slate-700'}`
                            : 'opacity-50 hover:opacity-100'
                            }`}
                          style={{
                            backgroundColor: isSelected ? family.color : (isLight ? 'rgba(156,163,175,0.2)' : 'rgba(100,116,139,0.3)'),
                            color: isSelected ? '#fff' : (isLight ? '#6b7280' : '#94a3b8'),
                            ringColor: family.color
                          }}
                        >
                          {family.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personnel (Offense only) */}
              {isOffense && personnelGroupings.length > 0 && (
                <div className="mb-3">
                  <label htmlFor={`formation-personnel-${formation.id}`} className={`text-xs block mb-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Personnel</label>
                  <select
                    id={`formation-personnel-${formation.id}`}
                    value={formation.personnel || ''}
                    onChange={(e) => updateFormation(formation.id, { personnel: e.target.value })}
                    className={`w-full px-2 py-1 rounded text-sm ${isLight ? 'bg-gray-100 border border-gray-300 text-gray-800' : 'bg-slate-600 border border-slate-500 text-white'}`}
                  >
                    <option value="">-- Select Personnel --</option>
                    {personnelGroupings.map(p => (
                      <option key={p.id} value={p.id}>{p.code && p.code !== p.name ? `${p.code} - ${p.name}` : p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Set WIZ Formation Button (Offense only) */}
              {isOffense && (
                <div className="mt-3 pt-3 border-t border-slate-600/50">
                  <button
                    onClick={() => setEditingFormationId(formation.id)}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      formation.positions && formation.positions.length > 0
                        ? (isLight ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30')
                        : (isLight ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30')
                    }`}
                  >
                    <Grid size={14} />
                    {formation.positions && formation.positions.length > 0 ? 'Edit Diagram' : 'Set Formation Diagram'}
                  </button>
                  {!formation.positions && (
                    <p className={`text-xs mt-1 text-center ${isLight ? 'text-amber-600' : 'text-amber-400/70'}`}>
                      Diagram not set
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {formations.length === 0 && (
          <div className={`text-center py-12 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
            <LayoutGrid size={48} className="mx-auto mb-4 opacity-30" />
            <p>No {phaseLabel.toLowerCase()} defined.</p>
          </div>
        )}
      </div>

      {/* WIZ Formation Editor Modal - Edit Existing Formation */}
      {editingFormationId && editingFormation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-lg w-[95vw] h-[95vh] overflow-hidden">
            <PlayDiagramEditor
              mode="wiz-skill"
              initialData={{ elements: getInitialElements() }}
              personnelGroupings={personnelGroupings}
              formations={formations}
              positionColors={positionColors}
              positionNames={positionNames}
              offensePositions={offensePositions}
              customDefaultPositions={customDefaultPositions}
              onSaveDefaultPositions={onSaveDefaultPositions}
              playName={`Formation: ${editingFormation.name}`}
              onSave={({ elements }) => handleSaveFormationDiagram(elements)}
              onSaveFormation={handleSaveAsNewFormation}
              onCancel={() => setEditingFormationId(null)}
            />
          </div>
        </div>
      )}

      {/* WIZ Formation Editor Modal - Create New Formations */}
      {showCreateEditor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-lg w-[95vw] h-[95vh] overflow-hidden">
            <PlayDiagramEditor
              mode="wiz-skill"
              personnelGroupings={personnelGroupings}
              formations={formations}
              positionColors={positionColors}
              positionNames={positionNames}
              offensePositions={offensePositions}
              customDefaultPositions={customDefaultPositions}
              onSaveDefaultPositions={onSaveDefaultPositions}
              playName="Formation Builder"
              onSaveFormation={handleSaveAsNewFormation}
              onCancel={() => setShowCreateEditor(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Shifts/Motions Tab Component (Offense only)
function ShiftMotionsTab({ shiftMotions, onUpdate, isLight = false }) {
  const DEFAULT_SHIFT_MOTIONS = [
    // Motions
    { id: 'sm_jet', name: 'Jet', type: 'motion', color: '#ef4444' },
    { id: 'sm_orbit', name: 'Orbit', type: 'motion', color: '#f97316' },
    { id: 'sm_fly', name: 'Fly', type: 'motion', color: '#eab308' },
    { id: 'sm_rocket', name: 'Rocket', type: 'motion', color: '#22c55e' },
    { id: 'sm_return', name: 'Return', type: 'motion', color: '#14b8a6' },
    { id: 'sm_zip', name: 'Zip', type: 'motion', color: '#06b6d4' },
    { id: 'sm_over', name: 'Over', type: 'motion', color: '#0ea5e9' },
    // Shifts
    { id: 'sm_trade', name: 'Trade', type: 'shift', color: '#8b5cf6' },
    { id: 'sm_shift_rt', name: 'Shift Right', type: 'shift', color: '#a855f7' },
    { id: 'sm_shift_lt', name: 'Shift Left', type: 'shift', color: '#d946ef' },
    { id: 'sm_trey', name: 'Trey', type: 'shift', color: '#ec4899' },
  ];

  const loadDefaults = () => {
    if (shiftMotions.length > 0 && !confirm('This will add default shifts/motions to your existing list. Continue?')) return;
    const existingNames = shiftMotions.map(s => s.name.toLowerCase());
    const newItems = DEFAULT_SHIFT_MOTIONS.filter(s => !existingNames.includes(s.name.toLowerCase()));
    onUpdate([...shiftMotions, ...newItems]);
  };

  const addItem = (type) => {
    const name = prompt(`${type === 'motion' ? 'Motion' : 'Shift'} name:`);
    if (!name) return;
    onUpdate([...shiftMotions, {
      id: `sm_${Date.now()}`,
      name,
      type,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    }]);
  };

  const deleteItem = (id) => {
    if (!confirm('Delete this item?')) return;
    onUpdate(shiftMotions.filter(s => s.id !== id));
  };

  const updateItem = (id, updates) => {
    onUpdate(shiftMotions.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const motions = shiftMotions.filter(s => s.type === 'motion');
  const shifts = shiftMotions.filter(s => s.type === 'shift');

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Shifts & Motions</h3>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Define pre-snap shifts and motions that can be tagged to plays.
          </p>
        </div>
        {shiftMotions.length === 0 && (
          <button
            onClick={loadDefaults}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            Load Defaults
          </button>
        )}
      </div>

      {/* Motions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-sm font-semibold uppercase tracking-wide ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>Motions</h4>
          <button
            onClick={() => addItem('motion')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Plus size={14} /> Add Motion
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {motions.map(item => (
            <div
              key={item.id}
              className={`group flex items-center gap-2 p-3 rounded-lg border-2 ${isLight ? 'bg-white' : 'bg-slate-700/50'}`}
              style={{ borderColor: item.color }}
            >
              <input
                id={`motion-color-${item.id}`}
                type="color"
                value={item.color}
                onChange={(e) => updateItem(item.id, { color: e.target.value })}
                aria-label={`${item.name} color`}
                className="w-6 h-6 rounded cursor-pointer border-0 flex-shrink-0"
              />
              <input
                id={`motion-name-${item.id}`}
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                aria-label="Motion name"
                className={`flex-1 bg-transparent font-medium border-none focus:outline-none min-w-0 ${isLight ? 'text-gray-800' : 'text-white'}`}
              />
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {motions.length === 0 && (
          <p className={`text-sm italic py-4 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No motions defined. Add motions like Jet, Orbit, Fly, Rocket.</p>
        )}
      </div>

      {/* Shifts Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-sm font-semibold uppercase tracking-wide ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>Shifts</h4>
          <button
            onClick={() => addItem('shift')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Plus size={14} /> Add Shift
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {shifts.map(item => (
            <div
              key={item.id}
              className={`group flex items-center gap-2 p-3 rounded-lg border-2 ${isLight ? 'bg-white' : 'bg-slate-700/50'}`}
              style={{ borderColor: item.color }}
            >
              <input
                id={`shift-color-${item.id}`}
                type="color"
                value={item.color}
                onChange={(e) => updateItem(item.id, { color: e.target.value })}
                aria-label={`${item.name} color`}
                className="w-6 h-6 rounded cursor-pointer border-0 flex-shrink-0"
              />
              <input
                id={`shift-name-${item.id}`}
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                aria-label="Shift name"
                className={`flex-1 bg-transparent font-medium border-none focus:outline-none min-w-0 ${isLight ? 'text-gray-800' : 'text-white'}`}
              />
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {shifts.length === 0 && (
          <p className={`text-sm italic py-4 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No shifts defined. Add shifts like Trade, Shift Right, Trey.</p>
        )}
      </div>

      {shiftMotions.length > 0 && (
        <button
          onClick={loadDefaults}
          className="text-sm text-cyan-400 hover:text-cyan-300 underline"
        >
          + Add more defaults
        </button>
      )}
    </div>
  );
}

// Play Buckets Tab Component (called Categories for Defense/ST)
function PlayBucketsTab({ phase, buckets, allBuckets, onUpdate, setupMode, setupConfig, isLight = false }) {
  const phaseLabel = phase === 'DEFENSE' ? 'Defensive Categories' : phase === 'SPECIAL_TEAMS' ? 'Special Teams Categories' : 'Play Buckets';
  const itemLabel = phase === 'OFFENSE' ? 'Bucket' : 'Category';

  // Default buckets for Offense
  const DEFAULT_OFFENSE_BUCKETS = [
    { id: 'run', label: 'Run', color: '#3b82f6', phase: 'OFFENSE' },
    { id: 'pass', label: 'Pass', color: '#8b5cf6', phase: 'OFFENSE' },
    { id: 'screen', label: 'Screen', color: '#f97316', phase: 'OFFENSE' },
    { id: 'rpo', label: 'RPO', color: '#10b981', phase: 'OFFENSE' }
  ];

  // Initialize defaults if empty
  useEffect(() => {
    if (phase === 'OFFENSE' && buckets.length === 0) {
      const newBuckets = [...allBuckets, ...DEFAULT_OFFENSE_BUCKETS];
      onUpdate('playBuckets', newBuckets);
    }
  }, [phase, buckets.length]);

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
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{phaseLabel}</h3>
        <button
          onClick={addBucket}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          <Plus size={16} /> Add {itemLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => (
          <div key={bucket.id} className={`rounded-lg border p-4 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <input
                    id={`bucket-color-${bucket.id}`}
                    type="color"
                    value={bucket.color === 'gray' ? '#94a3b8' : bucket.color}
                    onChange={(e) => updateBucket(bucket.id, { color: e.target.value })}
                    aria-label={`${bucket.label} color`}
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
                  id={`bucket-label-${bucket.id}`}
                  type="text"
                  value={bucket.label}
                  onChange={(e) => updateBucket(bucket.id, { label: e.target.value })}
                  aria-label="Bucket label"
                  className={`flex-1 min-w-0 px-2 py-1 font-semibold rounded truncate ${isLight ? 'bg-gray-100 border border-gray-300 text-gray-800' : 'bg-slate-600 border border-slate-500 text-white'}`}
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
        <div className={`text-center py-12 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
          <Tag size={48} className="mx-auto mb-4 opacity-30" />
          <p>No {phaseLabel.toLowerCase()} defined.</p>
        </div>
      )}

      <div className={`mt-6 p-4 rounded-lg text-sm ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700/30 text-slate-400'}`}>
        <strong className={isLight ? 'text-gray-700' : ''}>Note:</strong> {phase === 'DEFENSE' ? 'These categories organize your defensive scheme (e.g. Fronts, Coverages, Blitzes).' : phase === 'SPECIAL_TEAMS' ? 'These categories organize your special teams units.' : 'These buckets define the high-level organization (e.g. Run, Pass, RPO).'}
      </div>
    </div>
  );
}

// Read Types Tab Component (Offense only)
function ReadTypesTab({ readTypes, onUpdate, isLight = false }) {
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
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Read Types</h3>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Define the types of reads your offense uses (e.g., Pre-snap, Post-snap, RPO reads).
        </p>
      </div>

      <div className="space-y-3">
        {readTypes.map(readType => (
          <div
            key={readType.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}
          >
            <input
              id={`read-type-name-${readType.id}`}
              type="text"
              value={readType.name}
              onChange={(e) => updateReadType(readType.id, { name: e.target.value })}
              className={`flex-1 px-3 py-2 rounded ${isLight ? 'bg-gray-100 border border-gray-300 text-gray-800' : 'bg-slate-800 border border-slate-600 text-white'}`}
              placeholder="Read type name"
              aria-label="Read type name"
            />
            <input
              id={`read-type-description-${readType.id}`}
              type="text"
              value={readType.description || ''}
              onChange={(e) => updateReadType(readType.id, { description: e.target.value })}
              className={`flex-1 px-3 py-2 rounded text-sm ${isLight ? 'bg-gray-100 border border-gray-300 text-gray-700' : 'bg-slate-800 border border-slate-600 text-white'}`}
              placeholder="Description (optional)"
              aria-label="Read type description"
            />
            <button
              onClick={() => deleteReadType(readType.id)}
              className={`p-2 hover:text-red-400 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {readTypes.length === 0 && (
          <div className={`text-center py-8 border border-dashed rounded-lg ${isLight ? 'text-gray-400 border-gray-300' : 'text-slate-400 border-slate-600'}`}>
            <Eye size={32} className="mx-auto mb-2 opacity-50" />
            <p>No read types defined yet.</p>
          </div>
        )}

        <button
          onClick={addReadType}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded-lg transition-colors ${isLight ? 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400' : 'bg-slate-700/50 border-slate-500 text-slate-300 hover:bg-slate-700 hover:border-slate-400'}`}
        >
          <Plus size={18} />
          Add Read Type
        </button>
      </div>
    </div>
  );
}

// Look-Alike Series Tab Component (Offense only)
function LookAlikeSeriesTab({ series, buckets, plays, onUpdate, isLight = false }) {
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
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Look-Alike Series</h3>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Group plays from different buckets/concept groups that look alike based on formation, motion, and/or backfield action.
        </p>
      </div>

      <div className="space-y-4">
        {series.map(s => {
          const isExpanded = expandedSeries[s.id];
          return (
            <div
              key={s.id}
              className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}
            >
              {/* Series Header */}
              <div className={`flex items-center gap-3 p-3 ${isLight ? 'bg-gray-50' : 'bg-slate-700/30'}`}>
                <button
                  onClick={() => toggleExpand(s.id)}
                  className={`p-1 ${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-slate-400 hover:text-white'}`}
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} className="rotate-180" />}
                </button>
                <input
                  id={`series-name-${s.id}`}
                  type="text"
                  value={s.name}
                  onChange={(e) => updateSeries(s.id, { name: e.target.value })}
                  className={`flex-1 px-3 py-1.5 rounded font-medium ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-800 border border-slate-600 text-white'}`}
                  placeholder="Series name"
                  aria-label="Series name"
                />
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{s.playIds.length} plays</span>
                <button
                  onClick={() => deleteSeries(s.id)}
                  className={`p-1.5 hover:text-red-400 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className={`p-4 border-t space-y-4 ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                  {/* Description */}
                  <div>
                    <label htmlFor={`series-description-${s.id}`} className={`block text-xs uppercase mb-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Description</label>
                    <input
                      id={`series-description-${s.id}`}
                      type="text"
                      value={s.description || ''}
                      onChange={(e) => updateSeries(s.id, { description: e.target.value })}
                      className={`w-full px-3 py-2 rounded text-sm ${isLight ? 'bg-gray-100 border border-gray-300 text-gray-800' : 'bg-slate-800 border border-slate-600 text-white'}`}
                      placeholder="What makes these plays look alike?"
                    />
                  </div>

                  {/* Common Elements */}
                  <div>
                    <label className={`block text-xs uppercase mb-2 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Looks Alike Because Of</label>
                    <div className="flex gap-2">
                      {COMMON_ELEMENTS.map(el => (
                        <button
                          key={el.id}
                          onClick={() => toggleCommonElement(s.id, el.id)}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${(s.commonElements || []).includes(el.id)
                            ? 'bg-sky-500/20 text-sky-500 border border-sky-500/50'
                            : isLight
                              ? 'bg-gray-100 text-gray-500 border border-gray-300 hover:border-gray-400'
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
                    <label className={`block text-xs uppercase mb-2 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Plays in Series</label>
                    <div className="space-y-2">
                      {s.playIds.map(playId => {
                        const info = getPlayInfo(playId);
                        if (!info) return null;
                        return (
                          <div
                            key={playId}
                            className={`flex items-center justify-between px-3 py-2 rounded border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-600'}`}
                          >
                            <div>
                              <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
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
                              className={`p-1 hover:text-red-400 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}

                      {s.playIds.length === 0 && (
                        <p className={`text-sm italic py-2 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No plays added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Add Play Dropdown */}
                  <div>
                    <label htmlFor={`series-add-play-${s.id}`} className={`block text-xs uppercase mb-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Add Play</label>
                    <select
                      id={`series-add-play-${s.id}`}
                      onChange={(e) => {
                        if (e.target.value) {
                          addPlayToSeries(s.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className={`w-full px-3 py-2 rounded text-sm ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-800 border border-slate-600 text-white'}`}
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
          <div className={`text-center py-8 border border-dashed rounded-lg ${isLight ? 'text-gray-400 border-gray-300' : 'text-slate-400 border-slate-600'}`}>
            <Copy size={32} className="mx-auto mb-2 opacity-50" />
            <p>No look-alike series defined yet.</p>
            <p className="text-sm mt-1">Group plays that share formation, motion, or backfield action.</p>
          </div>
        )}

        <button
          onClick={addSeries}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded-lg transition-colors ${isLight ? 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400' : 'bg-slate-700/50 border-slate-500 text-slate-300 hover:bg-slate-700 hover:border-slate-400'}`}
        >
          <Plus size={18} />
          Add Look-Alike Series
        </button>
      </div>
    </div>
  );
}

// Define Situations Tab Component
function DefineSituationsTab({ fieldZones, downDistanceCategories, specialSituations, playPurposes = [], onUpdate, isLight = false }) {
  const [expandedSections, setExpandedSections] = useState({
    playPurposes: true,
    fieldZones: false,
    downDistance: false,
    special: false
  });

  // Default play purposes
  const DEFAULT_PLAY_PURPOSES = [
    { id: 'base', name: 'Base', color: '#3b82f6' },
    { id: 'convert', name: 'Convert', color: '#22c55e' },
    { id: 'shot', name: 'Shot', color: '#f59e0b' },
    { id: 'gadget', name: 'Gadget', color: '#ef4444' }
  ];

  // Play Purposes CRUD
  const addPurpose = () => {
    const name = prompt('Enter purpose name (e.g., "Base", "Convert"):');
    if (!name?.trim()) return;
    const id = name.toLowerCase().trim().replace(/\s+/g, '-');
    const existing = playPurposes || [];
    if (existing.some(p => p.id === id)) {
      alert('A purpose with that name already exists');
      return;
    }
    onUpdate('playPurposes', [...existing, { id, name: name.trim(), color: '#6b7280' }]);
  };

  const updatePurpose = (id, field, value) => {
    const updated = (playPurposes || []).map(p => p.id === id ? { ...p, [field]: value } : p);
    onUpdate('playPurposes', updated);
  };

  const deletePurpose = (id, name) => {
    if (!confirm(`Delete purpose "${name}"?`)) return;
    onUpdate('playPurposes', (playPurposes || []).filter(p => p.id !== id));
  };

  const loadDefaultPurposes = () => {
    if (playPurposes.length > 0 && !confirm('This will add default purposes. Continue?')) return;
    const existingIds = (playPurposes || []).map(p => p.id);
    const newPurposes = DEFAULT_PLAY_PURPOSES.filter(p => !existingIds.includes(p.id));
    onUpdate('playPurposes', [...(playPurposes || []), ...newPurposes]);
  };

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
      minYards: null,
      maxYards: null,
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

  const reorderDownDistance = (id, direction) => {
    const sorted = [...downDistanceCategories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = sorted.findIndex(d => d.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    // Swap items
    const temp = sorted[index];
    sorted[index] = sorted[newIndex];
    sorted[newIndex] = temp;

    // Reassign orders
    const reordered = sorted.map((d, i) => ({ ...d, order: i + 1 }));
    onUpdate('downDistanceCategories', reordered);
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
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Define Situations</h3>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Configure field zones, down & distance categories, and special situations for tagging and filtering plays.
        </p>
      </div>

      {/* Play Purposes Section */}
      <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
        <button
          onClick={() => toggleSection('playPurposes')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/30 hover:bg-slate-700/50'}`}
        >
          <div className="flex items-center gap-2">
            {expandedSections.playPurposes ? <ChevronDown size={18} className={isLight ? 'text-gray-600' : ''} /> : <ChevronUp size={18} className={`rotate-180 ${isLight ? 'text-gray-600' : ''}`} />}
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Play Purposes</span>
            <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>({playPurposes.length} purposes)</span>
          </div>
        </button>
        {expandedSections.playPurposes && (
          <div className={`p-4 border-t space-y-3 ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              Categorize plays by their strategic role (e.g., Base, Convert, Shot, Gadget).
            </p>
            {playPurposes.length === 0 && (
              <div className={`text-center py-4 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
                <p className="mb-2">No purposes defined yet.</p>
                <button
                  onClick={loadDefaultPurposes}
                  className="text-sky-500 hover:text-sky-400 text-sm underline"
                >
                  Load default purposes
                </button>
              </div>
            )}
            <div className="space-y-2">
              {playPurposes.map(purpose => (
                <div key={purpose.id} className={`flex items-center gap-3 p-2 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-800'}`}>
                  <input
                    type="color"
                    value={purpose.color}
                    onChange={(e) => updatePurpose(purpose.id, 'color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={purpose.name}
                    onChange={(e) => updatePurpose(purpose.id, 'name', e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded font-medium ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                  />
                  <button
                    onClick={() => deletePurpose(purpose.id, purpose.name)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={addPurpose}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                <Plus size={14} /> Add Purpose
              </button>
              {playPurposes.length > 0 && (
                <button
                  onClick={loadDefaultPurposes}
                  className="text-xs text-amber-500 hover:text-amber-400 underline"
                >
                  + Add default purposes
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Field Zones Section */}
      <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
        <button
          onClick={() => toggleSection('fieldZones')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/30 hover:bg-slate-700/50'}`}
        >
          <div className="flex items-center gap-2">
            {expandedSections.fieldZones ? <ChevronDown size={18} className={isLight ? 'text-gray-600' : ''} /> : <ChevronUp size={18} className={`rotate-180 ${isLight ? 'text-gray-600' : ''}`} />}
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Field Zones</span>
            <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>({fieldZones.length} zones)</span>
          </div>
        </button>
        {expandedSections.fieldZones && (
          <div className={`p-4 border-t space-y-3 ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
            {fieldZones.length === 0 && (
              <div className={`text-center py-4 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
                <p className="mb-2">No field zones defined yet.</p>
                <button
                  onClick={loadDefaultFieldZones}
                  className="text-sky-500 hover:text-sky-400 text-sm underline"
                >
                  Load default field zones
                </button>
              </div>
            )}
            {fieldZones.map(zone => (
              <div key={zone.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-600'}`}>
                <input
                  id={`field-zone-color-${zone.id}`}
                  type="color"
                  value={zone.color || '#64748b'}
                  onChange={(e) => updateFieldZone(zone.id, { color: e.target.value })}
                  aria-label={`${zone.name} color`}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <input
                  id={`field-zone-name-${zone.id}`}
                  type="text"
                  value={zone.name}
                  onChange={(e) => updateFieldZone(zone.id, { name: e.target.value })}
                  aria-label="Zone name"
                  className={`flex-1 px-3 py-1.5 rounded font-medium ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                  placeholder="Zone name"
                />
                <input
                  id={`field-zone-desc-${zone.id}`}
                  type="text"
                  value={zone.description || ''}
                  onChange={(e) => updateFieldZone(zone.id, { description: e.target.value })}
                  aria-label="Zone description"
                  className={`flex-1 px-3 py-1.5 rounded text-sm ${isLight ? 'bg-white border border-gray-300 text-gray-700' : 'bg-slate-700 border border-slate-600 text-white'}`}
                  placeholder="Description"
                />
                <div className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  <input
                    id={`field-zone-start-${zone.id}`}
                    type="number"
                    value={zone.startYard || 0}
                    onChange={(e) => updateFieldZone(zone.id, { startYard: parseInt(e.target.value) || 0 })}
                    aria-label="Start yard"
                    className={`w-14 px-2 py-1.5 rounded text-center ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                    min="0"
                    max="100"
                  />
                  <span>-</span>
                  <input
                    id={`field-zone-end-${zone.id}`}
                    type="number"
                    value={zone.endYard || 0}
                    onChange={(e) => updateFieldZone(zone.id, { endYard: parseInt(e.target.value) || 0 })}
                    aria-label="End yard"
                    className={`w-14 px-2 py-1.5 rounded text-center ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                    min="0"
                    max="100"
                  />
                  <span>yds</span>
                </div>
                <button
                  onClick={() => deleteFieldZone(zone.id)}
                  className={`p-1.5 hover:text-red-400 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addFieldZone}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg transition-colors ${isLight ? 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400' : 'bg-slate-700/50 border-slate-500 text-slate-300 hover:bg-slate-700 hover:border-slate-400'}`}
              >
                <Plus size={16} />
                Add Field Zone
              </button>
              {fieldZones.length > 0 && (
                <button
                  onClick={loadDefaultFieldZones}
                  className={`px-3 py-2 text-sm ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Down & Distance Section */}
      <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
        <button
          onClick={() => toggleSection('downDistance')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/30 hover:bg-slate-700/50'}`}
        >
          <div className="flex items-center gap-2">
            {expandedSections.downDistance ? <ChevronDown size={18} className={isLight ? 'text-gray-600' : ''} /> : <ChevronUp size={18} className={`rotate-180 ${isLight ? 'text-gray-600' : ''}`} />}
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Down & Distance</span>
            <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>({downDistanceCategories.length} categories)</span>
          </div>
        </button>
        {expandedSections.downDistance && (
          <div className={`p-4 border-t space-y-3 ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
            {downDistanceCategories.length === 0 && (
              <div className={`text-center py-4 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
                <p className="mb-2">No down & distance categories defined yet.</p>
                <button
                  onClick={loadDefaultDownDistance}
                  className="text-sky-500 hover:text-sky-400 text-sm underline"
                >
                  Load default categories
                </button>
              </div>
            )}
            {[...downDistanceCategories].sort((a, b) => (a.order || 0) - (b.order || 0)).map((cat, idx, arr) => (
              <div key={cat.id} className={`flex items-center gap-2 p-3 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-600'}`}>
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => reorderDownDistance(cat.id, 'up')}
                    disabled={idx === 0}
                    className={`p-1 rounded transition-colors ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-600'} ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => reorderDownDistance(cat.id, 'down')}
                    disabled={idx === arr.length - 1}
                    className={`p-1 rounded transition-colors ${idx === arr.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-600'} ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Name */}
                <input
                  id={`down-dist-name-${cat.id}`}
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateDownDistance(cat.id, { name: e.target.value })}
                  aria-label="Category name"
                  className={`flex-1 min-w-[140px] px-3 py-1.5 rounded font-medium ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                  placeholder="Name"
                />

                {/* Down selector */}
                <select
                  id={`down-dist-down-${cat.id}`}
                  value={cat.down || ''}
                  onChange={(e) => updateDownDistance(cat.id, { down: e.target.value })}
                  aria-label="Down"
                  className={`w-24 px-3 py-1.5 rounded text-sm ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                >
                  <option value="">Down</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>

                {/* Yards range */}
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Yards:</span>
                  <input
                    type="number"
                    value={cat.minYards ?? ''}
                    onChange={(e) => updateDownDistance(cat.id, { minYards: e.target.value ? parseInt(e.target.value) : null })}
                    aria-label="Min yards"
                    className={`w-16 px-2 py-1.5 rounded text-sm text-center ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                    placeholder="Min"
                    min="1"
                    max="99"
                  />
                  <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>–</span>
                  <input
                    type="number"
                    value={cat.maxYards ?? ''}
                    onChange={(e) => updateDownDistance(cat.id, { maxYards: e.target.value ? parseInt(e.target.value) : null })}
                    aria-label="Max yards"
                    className={`w-16 px-2 py-1.5 rounded text-sm text-center ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                    placeholder="Max"
                    min="1"
                    max="99"
                  />
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteDownDistance(cat.id)}
                  className={`p-1.5 hover:text-red-400 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addDownDistance}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg transition-colors ${isLight ? 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400' : 'bg-slate-700/50 border-slate-500 text-slate-300 hover:bg-slate-700 hover:border-slate-400'}`}
              >
                <Plus size={16} />
                Add Down & Distance
              </button>
              {downDistanceCategories.length > 0 && (
                <button
                  onClick={loadDefaultDownDistance}
                  className={`px-3 py-2 text-sm ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Special Situations Section */}
      <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}>
        <button
          onClick={() => toggleSection('special')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/30 hover:bg-slate-700/50'}`}
        >
          <div className="flex items-center gap-2">
            {expandedSections.special ? <ChevronDown size={18} className={isLight ? 'text-gray-600' : ''} /> : <ChevronUp size={18} className={`rotate-180 ${isLight ? 'text-gray-600' : ''}`} />}
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Special Situations</span>
            <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>({specialSituations.length} situations)</span>
          </div>
        </button>
        {expandedSections.special && (
          <div className={`p-4 border-t space-y-3 ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
            {specialSituations.length === 0 && (
              <div className={`text-center py-4 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
                <p className="mb-2">No special situations defined yet.</p>
                <button
                  onClick={loadDefaultSpecialSituations}
                  className="text-sky-500 hover:text-sky-400 text-sm underline"
                >
                  Load default situations
                </button>
              </div>
            )}
            {specialSituations.map(sit => (
              <div key={sit.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-600'}`}>
                <input
                  id={`special-sit-name-${sit.id}`}
                  type="text"
                  value={sit.name}
                  onChange={(e) => updateSpecialSituation(sit.id, { name: e.target.value })}
                  aria-label="Situation name"
                  className={`flex-1 px-3 py-1.5 rounded font-medium ${isLight ? 'bg-white border border-gray-300 text-gray-800' : 'bg-slate-700 border border-slate-600 text-white'}`}
                  placeholder="Situation name"
                />
                <input
                  id={`special-sit-desc-${sit.id}`}
                  type="text"
                  value={sit.description || ''}
                  onChange={(e) => updateSpecialSituation(sit.id, { description: e.target.value })}
                  aria-label="Situation description"
                  className={`flex-[2] px-3 py-1.5 rounded text-sm ${isLight ? 'bg-white border border-gray-300 text-gray-700' : 'bg-slate-700 border border-slate-600 text-white'}`}
                  placeholder="Description"
                />
                <button
                  onClick={() => deleteSpecialSituation(sit.id)}
                  className={`p-1.5 hover:text-red-400 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addSpecialSituation}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg transition-colors ${isLight ? 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400' : 'bg-slate-700/50 border-slate-500 text-slate-300 hover:bg-slate-700 hover:border-slate-400'}`}
              >
                <Plus size={16} />
                Add Special Situation
              </button>
              {specialSituations.length > 0 && (
                <button
                  onClick={loadDefaultSpecialSituations}
                  className={`px-3 py-2 text-sm ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-slate-400 hover:text-slate-300'}`}
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
function ConceptGroupsTab({ phase, buckets, allBuckets, onUpdate, isLight = false }) {
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
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{phaseLabel}</h3>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          {phase === 'DEFENSE' ? 'Manage variations within each defensive category.' : phase === 'SPECIAL_TEAMS' ? 'Manage variations within each special teams unit.' : 'Manage your concept groups within each bucket.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => {
          const families = bucket.families || [];
          const bucketColor = bucket.color === 'gray' ? '#94a3b8' : bucket.color;
          return (
            <div
              key={bucket.id}
              className={`rounded-lg border p-4 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-slate-700/50 border-slate-600'}`}
            >
              <div className={`flex justify-between items-center mb-3 pb-2 border-b ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucketColor }}
                  />
                  <span className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{bucket.label}</span>
                </div>
                <button
                  onClick={() => addFamily(bucket.id)}
                  className={`p-1 hover:text-sky-500 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                  title="Add Family"
                >
                  <Plus size={16} />
                </button>
              </div>

              {families.length === 0 ? (
                <div className={`text-center py-4 text-sm italic border border-dashed rounded ${isLight ? 'text-gray-400 border-gray-300' : 'text-slate-500 border-slate-600'}`}>
                  No families defined.
                </div>
              ) : (
                <div className="space-y-2">
                  {families.map(family => (
                    <div
                      key={family}
                      className={`flex justify-between items-center px-3 py-2 rounded border ${isLight ? 'bg-sky-50 border-sky-200' : 'bg-slate-600/50 border-slate-500'}`}
                    >
                      <span className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>{family}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => renameFamily(bucket.id, family)}
                          className={`p-1 hover:text-sky-500 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
                          title="Rename"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteFamily(bucket.id, family)}
                          className={`p-1 hover:text-red-500 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}
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
        <div className={`text-center py-12 ${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
          <Grid size={48} className="mx-auto mb-4 opacity-30" />
          <p>Define play buckets first to add concept groups.</p>
        </div>
      )}
    </div>
  );
}

// Default syntax templates for offense
const DEFAULT_SYNTAX_TEMPLATES = {
  quick: [
    { id: 'formation', label: 'Formation', sourceCategory: 'formations', required: true },
    { id: 'motion', label: 'Motion', sourceCategory: 'shiftMotions', required: false },
    { id: 'play', label: 'Play', sourceCategory: 'conceptGroups', required: true },
  ],
};

// Play type template tabs configuration

// Teach Play Call Modal Component - Learn from example play calls
function TeachPlayCallModal({ isOpen, onClose, phase, currentSyntax, termLibrary, onUpdate }) {
  const [rawCall, setRawCall] = useState('');
  const [tokens, setTokens] = useState([]);
  const [tokenAssignments, setTokenAssignments] = useState({});

  // Parse raw call into tokens
  const parseRawCall = (input) => {
    if (!input.trim()) {
      setTokens([]);
      setTokenAssignments({});
      return;
    }

    // Split by spaces, but keep quoted strings together
    const parsed = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parsed.push(current.trim().replace(/^["']|["']$/g, ''));
        }
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      parsed.push(current.trim().replace(/^["']|["']$/g, ''));
    }

    setTokens(parsed);
    // Reset assignments
    setTokenAssignments({});
  };

  // Update assignment for a token
  const setAssignment = (tokenIdx, syntaxPartId) => {
    setTokenAssignments(prev => ({
      ...prev,
      [tokenIdx]: syntaxPartId
    }));
  };

  // Get unassigned syntax parts
  const getAvailableSyntaxParts = (excludeTokenIdx) => {
    const assigned = Object.entries(tokenAssignments)
      .filter(([idx]) => parseInt(idx) !== excludeTokenIdx)
      .map(([, partId]) => partId);
    return currentSyntax.filter(part => !assigned.includes(part.id) || part.sourceCategory === 'custom');
  };

  // Apply the teaching - create terms from assignments
  const handleApply = () => {
    const currentTerms = termLibrary[phase] || {};
    const newTerms = { ...currentTerms };

    tokens.forEach((token, idx) => {
      const syntaxPartId = tokenAssignments[idx];
      if (!syntaxPartId) return;

      const syntaxPart = currentSyntax.find(p => p.id === syntaxPartId);
      if (!syntaxPart) return;

      // Only add to term library if it's a custom source
      if (!syntaxPart.sourceCategory || syntaxPart.sourceCategory === 'custom') {
        const existingTerms = newTerms[syntaxPartId] || [];
        // Check if term already exists
        const exists = existingTerms.some(t => t.label.toLowerCase() === token.toLowerCase());
        if (!exists) {
          newTerms[syntaxPartId] = [
            ...existingTerms,
            { id: Date.now().toString() + idx, label: token }
          ];
        }
      }
    });

    onUpdate('termLibrary', { ...termLibrary, [phase]: newTerms });
    onClose();
    setRawCall('');
    setTokens([]);
    setTokenAssignments({});
  };

  // Count assigned tokens
  const assignedCount = Object.keys(tokenAssignments).length;
  const canApply = tokens.length > 0 && assignedCount > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-white">Teach from Example</h3>
            <p className="text-sm text-slate-400">Enter a play call and tag each part to teach the system</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Raw call input */}
          <div>
            <label htmlFor="teach-play-call-input" className="block text-sm font-medium text-slate-300 mb-2">
              Enter a full play call
            </label>
            <input
              id="teach-play-call-input"
              type="text"
              value={rawCall}
              onChange={(e) => {
                setRawCall(e.target.value);
                parseRawCall(e.target.value);
              }}
              placeholder='e.g., SCRAMBLE 887 SNUG BROWN Z THRU SMASH'
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-lg font-mono placeholder-slate-500"
              autoFocus
            />
          </div>

          {/* Token display and tagging */}
          {tokens.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Tag each part of the call
              </label>
              <div className="space-y-2">
                {tokens.map((token, idx) => {
                  const assignment = tokenAssignments[idx];
                  const syntaxPart = assignment ? currentSyntax.find(p => p.id === assignment) : null;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${assignment
                        ? 'bg-sky-500/10 border-sky-500/50'
                        : 'bg-slate-700/50 border-slate-600'
                        }`}
                    >
                      <span className="text-lg font-mono font-bold text-white min-w-[100px]">
                        {token}
                      </span>
                      <span className="text-slate-500">→</span>
                      <select
                        id={`teach-token-assignment-${idx}`}
                        value={assignment || ''}
                        onChange={(e) => setAssignment(idx, e.target.value || null)}
                        aria-label={`Tag for ${token}`}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
                      >
                        <option value="">-- Select category --</option>
                        {getAvailableSyntaxParts(idx).map(part => (
                          <option key={part.id} value={part.id}>
                            {part.label}
                            {part.sourceCategory && part.sourceCategory !== 'custom' && ' (from setup)'}
                          </option>
                        ))}
                      </select>
                      {syntaxPart && (
                        <span className={`text-xs px-2 py-1 rounded ${syntaxPart.sourceCategory && syntaxPart.sourceCategory !== 'custom'
                          ? 'bg-slate-600 text-slate-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                          {syntaxPart.sourceCategory && syntaxPart.sourceCategory !== 'custom'
                            ? 'Matches setup'
                            : 'Will add term'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview of what will be created */}
          {canApply && (
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-600">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Preview: Terms to be added</p>
              <div className="flex flex-wrap gap-2">
                {tokens.map((token, idx) => {
                  const syntaxPartId = tokenAssignments[idx];
                  if (!syntaxPartId) return null;
                  const syntaxPart = currentSyntax.find(p => p.id === syntaxPartId);
                  if (!syntaxPart || (syntaxPart.sourceCategory && syntaxPart.sourceCategory !== 'custom')) {
                    return null;
                  }
                  return (
                    <span key={idx} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm">
                      {token} → {syntaxPart.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply ({assignedCount} tagged)
          </button>
        </div>
      </div>
    </div>
  );
}

// Play Call Chain Tab Component - now with template support and mode awareness
function PlayCallChainTab({ phase, syntax, syntaxTemplates, termLibrary, setupConfig, setupMode, onUpdate }) {
  const isBasicMode = setupMode === 'basic';
  const isStandardMode = setupMode === 'standard';
  const isAdvancedMode = setupMode === 'advanced';

  // Template is determined by setup mode: Advanced = custom, Basic/Standard = quick
  const selectedTemplate = isAdvancedMode ? 'custom' : 'quick';

  // State for teach modal
  const [showTeachModal, setShowTeachModal] = useState(false);

  // Get current syntax based on selected template
  // First check syntaxTemplates, fall back to legacy syntax
  const getCurrentSyntax = () => {
    const templates = syntaxTemplates?.[phase];
    if (templates && templates[selectedTemplate]?.length > 0) {
      return templates[selectedTemplate];
    }
    // Fall back to legacy syntax for custom template
    if (selectedTemplate === 'custom' && syntax?.[phase]?.length > 0) {
      return syntax[phase];
    }
    // Return default template if available
    if (phase === 'OFFENSE' && DEFAULT_SYNTAX_TEMPLATES[selectedTemplate]) {
      return DEFAULT_SYNTAX_TEMPLATES[selectedTemplate];
    }
    return [];
  };

  const currentSyntax = getCurrentSyntax();
  const currentTerms = termLibrary[phase] || {};

  // Define source categories based on phase
  const SOURCE_CATEGORIES = phase === 'OFFENSE' ? [
    { id: 'custom', label: 'Custom Term', description: 'Use the term library below' },
    { id: 'formations', label: 'a Formation', description: 'From Formations/Families setup' },
    { id: 'formationFamilies', label: 'a Formation Family', description: '2x2, 3x1, Gun, etc.' },
    { id: 'shiftMotions', label: 'a Shift or Motion', description: 'Jet, Orbit, Trade, etc.' },
    { id: 'personnelGroupings', label: 'a Personnel Grouping', description: '11, 12, 21, etc.' },
    { id: 'playBuckets', label: 'a Play Bucket', description: 'Run, Pass, RPO, etc.' },
    { id: 'conceptGroups', label: 'a Concept', description: 'Inside Zone, Outside Zone, etc.' },
    { id: 'readTypes', label: 'a Read Type', description: 'Pre-snap, Post-snap, etc.' },
    { id: 'lookAlikeSeries', label: 'a Series', description: 'Play series groupings' },
    { id: 'passProtections', label: 'a Pass Protection', description: 'OL protection schemes' },
    { id: 'runBlocking', label: 'a Run Scheme', description: 'OL blocking schemes' },
    { id: 'fieldZones', label: 'a Field Zone', description: 'Red Zone, +50, etc.' },
    { id: 'downDistanceCategories', label: 'a Down & Distance', description: '1st & 10, 3rd & Short, etc.' },
  ] : phase === 'DEFENSE' ? [
    { id: 'custom', label: 'Custom Term', description: 'Use the term library below' },
    { id: 'formations', label: 'a Front or Coverage', description: 'From Formation/Front setup' },
  ] : [
    { id: 'custom', label: 'Custom Term', description: 'Use the term library below' },
  ];

  // Get items from a source category
  const getSourceItems = (sourceId) => {
    if (sourceId === 'custom' || !sourceId) return [];
    const config = setupConfig || {};
    switch (sourceId) {
      case 'formations': return (config.formations || []).map(f => f.name || f);
      case 'formationFamilies': return (config.formationFamilies || []).map(f => f.name);
      case 'shiftMotions': return (config.shiftMotions || []).map(f => f.name);
      case 'personnelGroupings': return (config.personnelGroupings || []).map(f => f.name || f);
      case 'playBuckets': return (config.playBuckets || []).map(f => f.name);
      case 'conceptGroups': return (config.conceptGroups || []).map(f => f.name);
      case 'readTypes': return (config.readTypes || []).map(f => f.name || f);
      case 'lookAlikeSeries': return (config.lookAlikeSeries || []).map(f => f.name);
      case 'passProtections': return (config.passProtections || []).map(f => f.name || f);
      case 'runBlocking': return (config.runBlocking || []).map(f => f.name || f);
      case 'fieldZones': return (config.fieldZones || []).map(f => f.name || f);
      case 'downDistanceCategories': return (config.downDistanceCategories || []).map(f => f.name || f);
      default: return [];
    }
  };

  // Update syntax for current template
  const updateTemplateSyntax = (newSyntax) => {
    const currentTemplates = syntaxTemplates || {
      OFFENSE: { quick: [], custom: [] },
      DEFENSE: { custom: [] },
      SPECIAL_TEAMS: { custom: [] }
    };
    const phaseTemplates = currentTemplates[phase] || {};
    const updatedTemplates = {
      ...currentTemplates,
      [phase]: {
        ...phaseTemplates,
        [selectedTemplate]: newSyntax
      }
    };
    onUpdate('syntaxTemplates', updatedTemplates);
    // Also update legacy syntax for backwards compatibility
    if (selectedTemplate === 'custom') {
      onUpdate('syntax', { ...syntax, [phase]: newSyntax });
    }
  };

  const addSyntaxComponent = () => {
    const newId = Date.now().toString();
    const newSyntax = [...currentSyntax, { id: newId, label: 'New', type: 'text', required: false }];
    updateTemplateSyntax(newSyntax);
  };

  const updateSyntaxComponent = (idx, updates) => {
    const newSyntax = [...currentSyntax];
    newSyntax[idx] = { ...newSyntax[idx], ...updates };
    updateTemplateSyntax(newSyntax);
  };

  const deleteSyntaxComponent = (idx) => {
    if (!confirm('Delete this syntax component?')) return;
    const newSyntax = currentSyntax.filter((_, i) => i !== idx);
    updateTemplateSyntax(newSyntax);
  };

  const moveSyntax = (idx, direction) => {
    const newSyntax = [...currentSyntax];
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= newSyntax.length) return;
    [newSyntax[idx], newSyntax[newIdx]] = [newSyntax[newIdx], newSyntax[idx]];
    updateTemplateSyntax(newSyntax);
  };

  // Initialize template with defaults if empty
  const initializeTemplate = () => {
    if (phase === 'OFFENSE' && DEFAULT_SYNTAX_TEMPLATES[selectedTemplate]) {
      updateTemplateSyntax(DEFAULT_SYNTAX_TEMPLATES[selectedTemplate]);
    }
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
      let exampleTerm = item.label;
      if (item.sourceCategory && item.sourceCategory !== 'custom') {
        const sourceItems = getSourceItems(item.sourceCategory);
        if (sourceItems.length > 0) exampleTerm = sourceItems[0];
      } else {
        const terms = currentTerms[item.id] || [];
        if (terms.length > 0) exampleTerm = terms[0]?.label || item.label;
      }
      return `${item.prefix || ''}${exampleTerm}${item.suffix || ''}`;
    }).join(' ');
  };

  // Check if any components use custom source (need term library)
  const hasCustomComponents = currentSyntax.some(item => !item.sourceCategory || item.sourceCategory === 'custom');

  // Check if using default template (not yet customized)
  const isUsingDefault = phase === 'OFFENSE' &&
    selectedTemplate !== 'custom' &&
    (!syntaxTemplates?.[phase]?.[selectedTemplate]?.length);

  // Basic mode - show simple message
  if (isBasicMode) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BookOpen size={64} className="mx-auto mb-6 opacity-30" />
        <h3 className="text-xl font-semibold text-white mb-3">Play Call Chain Not Used in Basic Mode</h3>
        <p className="text-slate-400 max-w-md mx-auto mb-6">
          In Basic mode, play calls are entered as a single text field with no parsing or breakdown.
          This keeps things simple for practice scripts and game plans.
        </p>
        <p className="text-sm text-slate-500">
          Switch to <span className="text-green-400">Standard</span> or <span className="text-purple-400">Advanced</span> mode
          to enable play call syntax and filtering.
        </p>
      </div>
    );
  }

  // Standard mode - show simplified info
  if (isStandardMode) {
    return (
      <div>
        <div className="mb-6 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Standard Mode: Formation + Motion + Play</h3>
          <p className="text-slate-400 text-sm">
            In Standard mode, plays are entered as <strong>Formation</strong> + <strong>Motion/Tag</strong> (optional) + <strong>Play Name</strong>.
            This enables filtering by formation and basic organization by buckets.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-white font-medium mb-3">Example Play Calls</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex flex-wrap items-center gap-1">
                <span className="text-slate-500">Formation:</span>
                <span className="text-emerald-400">Trips Right</span>
                <span className="text-slate-500">Motion:</span>
                <span className="text-amber-400">Z Jet</span>
                <span className="text-slate-500">Play:</span>
                <span className="text-emerald-400">94 Mesh</span>
              </li>
              <li className="flex flex-wrap items-center gap-1">
                <span className="text-slate-500">Formation:</span>
                <span className="text-emerald-400">Ace</span>
                <span className="text-slate-500">Motion:</span>
                <span className="text-slate-400 italic">-</span>
                <span className="text-slate-500">Play:</span>
                <span className="text-emerald-400">Inside Zone</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-white font-medium mb-3">What You Can Do</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>• Filter plays by formation</li>
              <li>• Filter plays by motion/tag</li>
              <li>• Organize plays by bucket</li>
              <li>• Tag plays with situations</li>
              <li>• Build practice scripts and game plans</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500 text-center">
          Switch to <span className="text-purple-400">Advanced</span> mode to customize play call syntax
          per bucket and enable term signals.
        </p>
      </div>
    );
  }

  // Advanced mode - show full syntax editor
  return (
    <div>
      {/* Play Call Structure - Horizontal Layout */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Play Call Structure</h3>
            <p className="text-slate-400 text-sm">Build your play call syntax left to right, like reading a sentence.</p>
          </div>
          <div className="flex gap-2">
            {currentSyntax.length > 0 && (
              <button
                onClick={() => setShowTeachModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500"
                title="Learn from an example play call"
              >
                <BookOpen size={16} /> Teach from Example
              </button>
            )}
            {isUsingDefault && (
              <button
                onClick={initializeTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Check size={16} /> Use Default Template
              </button>
            )}
            <button
              onClick={addSyntaxComponent}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              <Plus size={16} /> Add Component
            </button>
          </div>
        </div>

        {currentSyntax.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p>No play components defined for this template.</p>
            {isUsingDefault ? (
              <p className="text-sm mt-2">Click "Use Default Template" to start with recommended components, or "Add Component" to build from scratch.</p>
            ) : (
              <p className="text-sm mt-2">Click "Add Component" to start building your play call structure.</p>
            )}
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
                  <div className={`flex-shrink-0 w-48 bg-slate-700/50 rounded-lg border overflow-hidden ${item.required ? 'border-amber-500/50' : 'border-slate-600'
                    }`}>
                    {/* Header with number and controls */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-600/50 border-b border-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center bg-sky-600 rounded-full text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        {item.required && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded uppercase">Required</span>
                        )}
                      </div>
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
                        <label htmlFor={`syntax-component-name-${item.id}`} className="text-[10px] text-slate-500 uppercase tracking-wide">Name</label>
                        <input
                          id={`syntax-component-name-${item.id}`}
                          type="text"
                          value={item.label}
                          onChange={(e) => updateSyntaxComponent(idx, { label: e.target.value })}
                          placeholder="e.g. Formation"
                          className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={`syntax-component-source-${item.id}`} className="text-[10px] text-slate-500 uppercase tracking-wide">Source Category</label>
                        <select
                          id={`syntax-component-source-${item.id}`}
                          value={item.sourceCategory || 'custom'}
                          onChange={(e) => updateSyntaxComponent(idx, { sourceCategory: e.target.value })}
                          className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        >
                          {SOURCE_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                        {item.sourceCategory && item.sourceCategory !== 'custom' && (() => {
                          const items = getSourceItems(item.sourceCategory);
                          return (
                            <div className="mt-1">
                              <p className="text-[10px] text-slate-400">
                                {items.length > 0 ? `${items.length} items: ` : 'No items defined yet'}
                                <span className="text-slate-500">{items.slice(0, 3).join(', ')}{items.length > 3 ? '...' : ''}</span>
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor={`syntax-component-required-${item.id}`} className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                          <input
                            id={`syntax-component-required-${item.id}`}
                            type="checkbox"
                            checked={item.required || false}
                            onChange={(e) => updateSyntaxComponent(idx, { required: e.target.checked })}
                            className="w-3 h-3 rounded"
                          />
                          Required
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor={`syntax-component-prefix-${item.id}`} className="text-[10px] text-slate-500 uppercase tracking-wide">Prefix</label>
                          <input
                            id={`syntax-component-prefix-${item.id}`}
                            type="text"
                            value={item.prefix || ''}
                            onChange={(e) => updateSyntaxComponent(idx, { prefix: e.target.value })}
                            placeholder='"'
                            className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label htmlFor={`syntax-component-suffix-${item.id}`} className="text-[10px] text-slate-500 uppercase tracking-wide">Suffix</label>
                          <input
                            id={`syntax-component-suffix-${item.id}`}
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

      {/* Term Library - Only show for components using custom source */}
      {hasCustomComponents && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Term Library</h3>
          <p className="text-slate-400 text-sm mb-4">Add terms for components using "Custom (Term Library)" source.</p>

          <div className="flex gap-2 overflow-x-auto pb-4">
            {currentSyntax.filter(cat => !cat.sourceCategory || cat.sourceCategory === 'custom').map((cat, idx) => {
              const terms = currentTerms[cat.id] || [];
              const originalIdx = currentSyntax.findIndex(c => c.id === cat.id);
              return (
                <div key={cat.id} className="flex-shrink-0 w-48 bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
                  <div className="flex justify-between items-center px-3 py-2 bg-slate-600/50 border-b border-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-sky-600 rounded-full text-[10px] font-bold text-white">
                        {originalIdx + 1}
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

      {/* Teach from Example Modal */}
      <TeachPlayCallModal
        isOpen={showTeachModal}
        onClose={() => setShowTeachModal(false)}
        phase={phase}
        currentSyntax={currentSyntax}
        termLibrary={termLibrary}
        onUpdate={onUpdate}
      />
    </div>
  );
}

// Wristband Abbreviations Section Component
function WristbandAbbreviationsSection({ phase, setupConfig, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Get all abbreviations
  const abbreviations = setupConfig?.wristbandAbbreviations || {};

  // Collect all terms from various sources
  const allTerms = useMemo(() => {
    const terms = [];
    const config = setupConfig || {};

    // Formations
    (config.formations || []).forEach(f => {
      if (f.name && f.phase === phase) {
        terms.push({ term: f.name, category: 'Formation', source: 'formations' });
      }
    });

    // Formation Families (Offense only)
    if (phase === 'OFFENSE') {
      (config.formationFamilies || []).forEach(f => {
        if (f.name) {
          terms.push({ term: f.name, category: 'Family', source: 'formationFamilies' });
        }
      });
    }

    // Personnel Groupings
    (config.personnelGroupings || []).forEach(p => {
      const name = p.name || p.code;
      if (name) {
        terms.push({ term: name, category: 'Personnel', source: 'personnelGroupings' });
      }
    });

    // Shifts/Motions (Offense only)
    if (phase === 'OFFENSE') {
      (config.shiftMotions || []).forEach(m => {
        if (m.name) {
          terms.push({ term: m.name, category: 'Motion', source: 'shiftMotions' });
        }
      });
    }

    // Play Buckets
    (config.playBuckets || []).forEach(b => {
      if (b.name && b.phase === phase) {
        terms.push({ term: b.name, category: 'Bucket', source: 'playBuckets' });
      }
    });

    // Concept Groups
    (config.conceptGroups || []).forEach(c => {
      if (c.name && c.phase === phase) {
        terms.push({ term: c.name, category: 'Concept', source: 'conceptGroups' });
      }
    });

    // Read Types (Offense only)
    if (phase === 'OFFENSE') {
      (config.readTypes || []).forEach(r => {
        const name = r.name || r;
        if (name) {
          terms.push({ term: name, category: 'Read Type', source: 'readTypes' });
        }
      });
    }

    // Pass Protections (Offense only)
    if (phase === 'OFFENSE') {
      (config.passProtections || []).forEach(p => {
        const name = p.name || p;
        if (name) {
          terms.push({ term: name, category: 'Protection', source: 'passProtections' });
        }
      });
    }

    // Run Blocking (Offense only)
    if (phase === 'OFFENSE') {
      (config.runBlocking || []).forEach(r => {
        const name = r.name || r;
        if (name) {
          terms.push({ term: name, category: 'Run Scheme', source: 'runBlocking' });
        }
      });
    }

    // Term Library custom terms
    const termLibrary = config.termLibrary?.[phase] || {};
    Object.entries(termLibrary).forEach(([categoryId, categoryTerms]) => {
      (categoryTerms || []).forEach(t => {
        if (t.label) {
          terms.push({ term: t.label, category: categoryId, source: 'termLibrary' });
        }
      });
    });

    // Remove duplicates
    const seen = new Set();
    return terms.filter(t => {
      const key = t.term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [setupConfig, phase]);

  // Filter terms
  const filteredTerms = searchFilter
    ? allTerms.filter(t =>
        t.term.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.category.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : allTerms;

  // Group terms by category
  const termsByCategory = useMemo(() => {
    const grouped = {};
    filteredTerms.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    return grouped;
  }, [filteredTerms]);

  // Update abbreviation
  const updateAbbreviation = (term, abbrev) => {
    const newAbbreviations = { ...abbreviations };
    if (abbrev.trim()) {
      newAbbreviations[term] = abbrev.trim();
    } else {
      delete newAbbreviations[term];
    }
    onUpdate('wristbandAbbreviations', newAbbreviations);
  };

  // Auto-generate common abbreviations
  const autoGenerateAbbreviations = () => {
    if (!confirm('This will generate abbreviations for terms that don\'t have one. Existing abbreviations will not be changed. Continue?')) return;

    const newAbbreviations = { ...abbreviations };

    allTerms.forEach(({ term }) => {
      if (newAbbreviations[term]) return; // Skip if already has abbreviation

      // Generate abbreviation based on common patterns
      let abbrev = '';

      // Common replacements
      const replacements = {
        'Right': 'RT',
        'Left': 'LT',
        'Under Center': 'UC',
        'Pistol': 'PST',
        'Shotgun': 'GUN',
        'Gun': 'GUN',
        'Trips': 'TRP',
        'Twins': 'TWN',
        'Bunch': 'BN',
        'Stack': 'STK',
        'Empty': 'EMP',
        'Strong': 'STR',
        'Weak': 'WK',
        'Inside': 'IN',
        'Outside': 'OUT',
        'Zone': 'ZN',
        'Power': 'PWR',
        'Counter': 'CTR',
        'Sweep': 'SWP',
        'Screen': 'SCR',
        'Quick': 'QK',
        'Play Action': 'PA',
        'Sprint Out': 'SO',
        'Boot': 'BT',
        'Draw': 'DRW',
        'Slant': 'SL',
        'Curl': 'CRL',
        'Out': 'OUT',
        'Corner': 'CNR',
        'Post': 'PST',
        'Dig': 'DIG',
        'Seam': 'SM',
        'Wheel': 'WHL',
        'Flat': 'FLT',
        'Check': 'CHK',
        'Release': 'REL'
      };

      // Check for exact match first
      if (replacements[term]) {
        abbrev = replacements[term];
      } else {
        // Try to build abbreviation from words
        const words = term.split(/\s+/);
        if (words.length === 1) {
          // Single word - take first 3 letters
          abbrev = term.substring(0, 3).toUpperCase();
        } else {
          // Multiple words - take first letter of each, or first 2 letters if only 2 words
          abbrev = words.map((w, i) => {
            // Check if this word has a known replacement
            for (const [key, val] of Object.entries(replacements)) {
              if (w.toLowerCase() === key.toLowerCase()) {
                return val;
              }
            }
            return words.length <= 2 ? w.substring(0, 2).toUpperCase() : w[0].toUpperCase();
          }).join('');
        }
      }

      if (abbrev && abbrev !== term) {
        newAbbreviations[term] = abbrev;
      }
    });

    onUpdate('wristbandAbbreviations', newAbbreviations);
  };

  // Count how many have abbreviations
  const abbrevCount = allTerms.filter(t => abbreviations[t.term]).length;

  return (
    <div className="mt-8 border-t border-slate-700 pt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Watch size={20} className="text-amber-500" />
          <div className="text-left">
            <h3 className="font-semibold text-white">Wristband Abbreviations</h3>
            <p className="text-xs text-slate-400">
              Define shortened versions of terms for wristband space constraints
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {abbrevCount} of {allTerms.length} terms abbreviated
          </span>
          {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          {/* Controls */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search terms..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400"
              />
            </div>
            <button
              onClick={autoGenerateAbbreviations}
              className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
            >
              Auto-Generate
            </button>
          </div>

          {/* Terms by category */}
          {Object.keys(termsByCategory).length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No terms found. Add formations, motions, concepts, etc. to see them here.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(termsByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, terms]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {terms.map(({ term }) => (
                      <div key={term} className="flex items-center gap-2 bg-slate-700/50 rounded px-3 py-1.5">
                        <span className="flex-1 text-sm text-white truncate" title={term}>{term}</span>
                        <span className="text-slate-500">→</span>
                        <input
                          type="text"
                          value={abbreviations[term] || ''}
                          onChange={(e) => updateAbbreviation(term, e.target.value)}
                          placeholder="abbrev"
                          className="w-20 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-xs text-white placeholder-slate-400 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Tip: Abbreviations are used on wristbands when the full term doesn't fit. Leave blank to use the full term.
          </p>
        </div>
      )}
    </div>
  );
}

// Signal field options for terms
const SIGNAL_FIELD_OPTIONS = {
  OFFENSE: [
    { id: 'playType', label: 'Play Type', values: ['pass', 'run', 'quick'] },
    { id: 'protection', label: 'Protection', values: 'custom' },
    { id: 'rbAlignment', label: 'RB Alignment', values: 'custom' },
    { id: 'motion', label: 'Motion', values: 'custom' },
    { id: 'formationTag', label: 'Formation Tag', values: 'custom' },
    { id: 'blocking', label: 'Blocking Scheme', values: 'custom' },
  ],
  DEFENSE: [
    { id: 'coverage', label: 'Coverage', values: 'custom' },
    { id: 'front', label: 'Front', values: 'custom' },
  ],
  SPECIAL_TEAMS: []
};

// Custom Syntax Terms Tab Component - for user-defined play call chain parts
function CustomSyntaxTermsTab({ phase, syntaxPart, termLibrary, syntax, onUpdate }) {
  const currentTerms = termLibrary[phase] || {};
  const terms = currentTerms[syntaxPart.id] || [];
  const subdivisions = syntaxPart.subdivisions || [];

  // State for signal editing modal
  const [editingSignalsTerm, setEditingSignalsTerm] = useState(null);

  // Group terms by subdivision
  const termsBySubdivision = {};
  subdivisions.forEach(sub => {
    termsBySubdivision[sub] = terms.filter(t => t.subdivision === sub);
  });
  const ungroupedTerms = terms.filter(t => !t.subdivision || !subdivisions.includes(t.subdivision));

  // Get available signal fields for this phase
  const signalFields = SIGNAL_FIELD_OPTIONS[phase] || [];

  const addSubdivision = () => {
    const name = prompt(`Enter new ${syntaxPart.label} category:`);
    if (!name?.trim()) return;
    // Update the syntax part with new subdivision
    const currentSyntax = syntax[phase] || [];
    const newSyntax = currentSyntax.map(s =>
      s.id === syntaxPart.id
        ? { ...s, subdivisions: [...(s.subdivisions || []), name.trim()] }
        : s
    );
    onUpdate('syntax', { ...syntax, [phase]: newSyntax });
  };

  const deleteSubdivision = (subName) => {
    if (!confirm(`Delete "${subName}" category? Terms will become ungrouped.`)) return;
    // Remove subdivision from syntax part
    const currentSyntax = syntax[phase] || [];
    const newSyntax = currentSyntax.map(s =>
      s.id === syntaxPart.id
        ? { ...s, subdivisions: (s.subdivisions || []).filter(sub => sub !== subName) }
        : s
    );
    onUpdate('syntax', { ...syntax, [phase]: newSyntax });
    // Clear subdivision from affected terms
    const newTerms = terms.map(t =>
      t.subdivision === subName ? { ...t, subdivision: null } : t
    );
    onUpdate('termLibrary', {
      ...termLibrary,
      [phase]: { ...currentTerms, [syntaxPart.id]: newTerms }
    });
  };

  const addTerm = (subdivision = null) => {
    const term = prompt(`Enter new ${syntaxPart.label}:`);
    if (!term?.trim()) return;
    const newTerm = { id: Date.now().toString(), label: term.trim(), signals: {} };
    if (subdivision) newTerm.subdivision = subdivision;
    const newTerms = [...terms, newTerm];
    onUpdate('termLibrary', {
      ...termLibrary,
      [phase]: { ...currentTerms, [syntaxPart.id]: newTerms }
    });
  };

  const updateTerm = (termId, updates) => {
    const newTerms = terms.map(t =>
      t.id === termId ? { ...t, ...updates } : t
    );
    onUpdate('termLibrary', {
      ...termLibrary,
      [phase]: { ...currentTerms, [syntaxPart.id]: newTerms }
    });
  };

  const deleteTerm = (termId) => {
    if (!confirm('Delete this term?')) return;
    const newTerms = terms.filter(t => t.id !== termId);
    onUpdate('termLibrary', {
      ...termLibrary,
      [phase]: { ...currentTerms, [syntaxPart.id]: newTerms }
    });
  };

  const updateTermSignal = (termId, fieldId, value) => {
    const term = terms.find(t => t.id === termId);
    if (!term) return;
    const newSignals = { ...(term.signals || {}) };
    if (value) {
      newSignals[fieldId] = value;
    } else {
      delete newSignals[fieldId];
    }
    updateTerm(termId, { signals: newSignals });
  };

  const getSignalCount = (term) => {
    return Object.keys(term.signals || {}).filter(k => term.signals[k]).length;
  };

  const TermCard = ({ term }) => {
    const signalCount = getSignalCount(term);
    return (
      <div className="p-2 bg-slate-700/50 rounded-lg border border-slate-600 group">
        <div className="flex items-center gap-2">
          <input
            id={`term-label-${term.id}`}
            type="text"
            value={term.label}
            onChange={(e) => updateTerm(term.id, { label: e.target.value })}
            aria-label="Term label"
            className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 min-w-0"
          />
          {subdivisions.length > 0 && (
            <select
              id={`term-subdivision-${term.id}`}
              value={term.subdivision || ''}
              onChange={(e) => updateTerm(term.id, { subdivision: e.target.value || null })}
              aria-label="Term category"
              className="text-xs bg-slate-600 border border-slate-500 rounded px-1 py-0.5 text-slate-300"
            >
              <option value="">No category</option>
              {subdivisions.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => deleteTerm(term.id)}
            className="p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
        {/* Signals indicator and edit button */}
        {signalFields.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              onClick={() => setEditingSignalsTerm(term)}
              className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${signalCount > 0
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-slate-600 text-slate-400 hover:bg-slate-500 opacity-0 group-hover:opacity-100'
                }`}
            >
              {signalCount > 0 ? (
                <>Signals {signalCount} field{signalCount > 1 ? 's' : ''}</>
              ) : (
                <>+ Add signals</>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Signals editing modal
  const SignalsModal = () => {
    if (!editingSignalsTerm) return null;
    const term = editingSignalsTerm;
    const termSignals = term.signals || {};

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-xl w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div>
              <h3 className="text-lg font-semibold text-white">Configure Signals</h3>
              <p className="text-sm text-slate-400">"{term.label}" - auto-fills other fields when selected</p>
            </div>
            <button
              onClick={() => setEditingSignalsTerm(null)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-slate-400">
              When "{term.label}" is selected in a play, it will automatically fill these fields:
            </p>
            {signalFields.map(field => (
              <div key={field.id} className="space-y-1">
                <label htmlFor={`signal-field-${term.id}-${field.id}`} className="block text-sm font-medium text-slate-300">{field.label}</label>
                {field.values === 'custom' ? (
                  <input
                    id={`signal-field-${term.id}-${field.id}`}
                    type="text"
                    value={termSignals[field.id] || ''}
                    onChange={(e) => updateTermSignal(term.id, field.id, e.target.value)}
                    placeholder={`Auto-fill ${field.label.toLowerCase()} with...`}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 text-sm"
                  />
                ) : (
                  <select
                    id={`signal-field-${term.id}-${field.id}`}
                    value={termSignals[field.id] || ''}
                    onChange={(e) => updateTermSignal(term.id, field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
                  >
                    <option value="">-- No auto-fill --</option>
                    {field.values.map(v => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => setEditingSignalsTerm(null)}
              className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{syntaxPart.label} Terms</h3>
          <p className="text-slate-400 text-sm">
            Define the values available for "{syntaxPart.label}" in your play call chain.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addSubdivision}
            className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500"
          >
            <Layers size={16} /> Add Category
          </button>
          <button
            onClick={() => addTerm()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <Plus size={16} /> Add {syntaxPart.label}
          </button>
        </div>
      </div>

      {terms.length === 0 && subdivisions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>No {syntaxPart.label.toLowerCase()} terms defined yet.</p>
          <p className="text-sm mt-2">Click "Add {syntaxPart.label}" to create terms, or "Add Category" to organize them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Subdivisions */}
          {subdivisions.map(sub => (
            <div key={sub} className="bg-slate-800/50 rounded-lg border border-slate-600 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-600">
                <h4 className="font-medium text-white">{sub}</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addTerm(sub)}
                    className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-slate-600 rounded"
                    title={`Add ${syntaxPart.label} to ${sub}`}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => deleteSubdivision(sub)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {termsBySubdivision[sub]?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {termsBySubdivision[sub].map(term => (
                      <TermCard key={term.id} term={term} />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No terms in this category</p>
                )}
              </div>
            </div>
          ))}

          {/* Ungrouped terms */}
          {ungroupedTerms.length > 0 && (
            <div>
              {subdivisions.length > 0 && (
                <h4 className="font-medium text-slate-400 mb-3">Uncategorized</h4>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {ungroupedTerms.map(term => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signals editing modal */}
      <SignalsModal />
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
                        <label htmlFor={`glossary-def-${term.id}`} className="font-semibold text-sky-400 cursor-pointer">{term.label}</label>
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
                        id={`glossary-def-${term.id}`}
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
      assignments: { LT: '', LG: '', C: '', RG: '', RT: '' },
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
      assignments: { LT: '', LG: '', C: '', RG: '', RT: '' },
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
            <div key={prot.id} className="rounded-lg border border-slate-600 p-3 flex gap-3">
              {/* Left side: Diagram */}
              <div
                onClick={() => setEditingDiagram({ type: 'protection', index: idx })}
                className="flex-shrink-0 w-40 h-28 rounded border border-slate-600 cursor-pointer hover:border-sky-500 transition-colors overflow-hidden"
              >
                {prot.diagramData && prot.diagramData.length > 0 ? (
                  <DiagramPreview
                    elements={prot.diagramData}
                    width={160}
                    height={112}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <Image size={24} />
                  </div>
                )}
              </div>

              {/* Right side: Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <input
                    id={`protection-name-${prot.id}`}
                    type="text"
                    value={prot.name}
                    onChange={(e) => updateProtection(idx, { name: e.target.value.toUpperCase() })}
                    className="font-bold text-lg bg-transparent border-none text-white w-28"
                    aria-label="Protection name"
                  />
                  <button onClick={() => deleteProtection(prot.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Position Assignments */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {['LT', 'LG', 'C', 'RG', 'RT'].map((pos) => (
                    <div key={pos} className="text-center">
                      <span className="text-[10px] text-slate-500 font-medium block">{pos}</span>
                      <input
                        type="text"
                        value={prot.assignments?.[pos] || ''}
                        onChange={(e) => updateProtection(idx, {
                          assignments: { ...(prot.assignments || {}), [pos]: e.target.value }
                        })}
                        placeholder="—"
                        className="w-full px-1 py-1 bg-transparent border border-slate-600 rounded text-white text-xs text-center focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <textarea
                  id={`protection-notes-${prot.id}`}
                  value={prot.notes || ''}
                  onChange={(e) => updateProtection(idx, { notes: e.target.value })}
                  placeholder="Notes..."
                  rows={2}
                  className="w-full px-2 py-1 bg-transparent border border-slate-600 rounded text-white text-xs resize-none focus:border-sky-500 focus:outline-none"
                />
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
            <div key={scheme.id} className="rounded-lg border border-slate-600 p-3 flex gap-3">
              {/* Left side: Diagram */}
              <div
                onClick={() => setEditingDiagram({ type: 'scheme', index: idx })}
                className="flex-shrink-0 w-40 h-28 rounded border border-slate-600 cursor-pointer hover:border-emerald-500 transition-colors overflow-hidden"
              >
                {scheme.diagramData && scheme.diagramData.length > 0 ? (
                  <DiagramPreview
                    elements={scheme.diagramData}
                    width={160}
                    height={112}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <Image size={24} />
                  </div>
                )}
              </div>

              {/* Right side: Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      id={`run-scheme-name-${scheme.id}`}
                      type="text"
                      value={scheme.name}
                      onChange={(e) => updateRunScheme(idx, { name: e.target.value.toUpperCase() })}
                      className="font-bold text-lg bg-transparent border-none text-white w-24"
                      aria-label="Scheme name"
                    />
                    <select
                      id={`run-scheme-type-${scheme.id}`}
                      value={scheme.type}
                      onChange={(e) => updateRunScheme(idx, { type: e.target.value })}
                      className="px-2 py-0.5 bg-transparent border border-slate-600 rounded text-slate-300 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="zone">Zone</option>
                      <option value="gap">Gap</option>
                      <option value="power">Power</option>
                      <option value="counter">Counter</option>
                      <option value="trap">Trap</option>
                      <option value="iso">Iso</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <button onClick={() => deleteRunScheme(scheme.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Position Assignments */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {['LT', 'LG', 'C', 'RG', 'RT'].map((pos) => (
                    <div key={pos} className="text-center">
                      <span className="text-[10px] text-slate-500 font-medium block">{pos}</span>
                      <input
                        type="text"
                        value={scheme.assignments?.[pos] || ''}
                        onChange={(e) => updateRunScheme(idx, {
                          assignments: { ...(scheme.assignments || {}), [pos]: e.target.value }
                        })}
                        placeholder="—"
                        className="w-full px-1 py-1 bg-transparent border border-slate-600 rounded text-white text-xs text-center focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <textarea
                  id={`run-scheme-notes-${scheme.id}`}
                  value={scheme.notes || ''}
                  onChange={(e) => updateRunScheme(idx, { notes: e.target.value })}
                  placeholder="Notes..."
                  rows={2}
                  className="w-full px-2 py-1 bg-transparent border border-slate-600 rounded text-white text-xs resize-none focus:border-emerald-500 focus:outline-none"
                />
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

// This component was removed - functionality moved to IndividualPositionSkills in DrillsLibraryTab

function _OLineSkillsTabRemoved({ olineSkills, passProtections, runBlocking, playBuckets, onUpdate }) {
  const [expandedPositions, setExpandedPositions] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [showDrillModal, setShowDrillModal] = useState(null);

  // Extract unique techniques from OL WIZ assignments
  const getUniqueAssignments = () => {
    const passAssignments = new Set();
    const runAssignments = new Map(); // bucket -> assignments

    // Get pass protection assignments
    (passProtections || []).forEach(prot => {
      if (prot.assignments) {
        Object.values(prot.assignments).forEach(val => {
          if (val && val.trim()) passAssignments.add(val.trim());
        });
      }
    });

    // Get run blocking assignments by scheme type/bucket
    (runBlocking || []).forEach(scheme => {
      if (scheme.assignments) {
        const bucketKey = scheme.type || 'general';
        if (!runAssignments.has(bucketKey)) {
          runAssignments.set(bucketKey, new Set());
        }
        Object.values(scheme.assignments).forEach(val => {
          if (val && val.trim()) runAssignments.get(bucketKey).add(val.trim());
        });
      }
    });

    return { passAssignments: Array.from(passAssignments), runAssignments };
  };

  const { passAssignments, runAssignments } = getUniqueAssignments();

  // Toggle position expansion
  const togglePosition = (pos) => {
    setExpandedPositions(prev => ({ ...prev, [pos]: !prev[pos] }));
  };

  // Toggle section expansion within a position
  const toggleSection = (pos, section) => {
    const key = `${pos}-${section}`;
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Get drills for a position/section/level
  const getDrills = (pos, section, level = null) => {
    if (level) {
      return olineSkills?.[pos]?.general?.[level] || [];
    }
    return olineSkills?.[pos]?.[section] || [];
  };

  // Add a drill
  const addDrill = (pos, section, drill) => {
    const currentDrills = section === 'general'
      ? (olineSkills?.[pos]?.general?.[drill.level] || [])
      : (olineSkills?.[pos]?.[section] || []);

    const newDrill = { ...drill, id: `drill_${Date.now()}` };

    let updated;
    if (section === 'general') {
      updated = {
        ...olineSkills,
        [pos]: {
          ...(olineSkills?.[pos] || {}),
          general: {
            ...(olineSkills?.[pos]?.general || {}),
            [drill.level]: [...currentDrills, newDrill]
          }
        }
      };
    } else {
      updated = {
        ...olineSkills,
        [pos]: {
          ...(olineSkills?.[pos] || {}),
          [section]: [...currentDrills, newDrill]
        }
      };
    }
    onUpdate('olineSkills', updated);
    setShowDrillModal(null);
  };

  // Delete a drill
  const deleteDrill = (pos, section, level, drillId) => {
    if (!confirm('Delete this drill?')) return;

    let updated;
    if (level) {
      const currentDrills = olineSkills?.[pos]?.general?.[level] || [];
      updated = {
        ...olineSkills,
        [pos]: {
          ...(olineSkills?.[pos] || {}),
          general: {
            ...(olineSkills?.[pos]?.general || {}),
            [level]: currentDrills.filter(d => d.id !== drillId)
          }
        }
      };
    } else {
      const currentDrills = olineSkills?.[pos]?.[section] || [];
      updated = {
        ...olineSkills,
        [pos]: {
          ...(olineSkills?.[pos] || {}),
          [section]: currentDrills.filter(d => d.id !== drillId)
        }
      };
    }
    onUpdate('olineSkills', updated);
  };

  // Render drill item
  const DrillItem = ({ drill, pos, section, level }) => (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-700/50 rounded mb-1 group">
      <div className="flex-1">
        <span className="text-white text-sm font-medium">{drill.name}</span>
        {drill.description && (
          <p className="text-slate-400 text-xs mt-0.5">{drill.description}</p>
        )}
      </div>
      <button
        onClick={() => deleteDrill(pos, section, level, drill.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">O-LINE Skills & Drills</h3>
        <p className="text-sm text-slate-400">
          Skills organized by position. Techniques auto-populate from your OL WIZ Library assignments.
        </p>
      </div>

      {/* Auto-populated Techniques Summary */}
      {(passAssignments.length > 0 || runAssignments.size > 0) && (
        <div className="mb-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400 font-medium block mb-2">
            Auto-detected Techniques from OL WIZ:
          </span>
          <div className="flex flex-wrap gap-1">
            {passAssignments.map(a => (
              <span key={`pass-${a}`} className="px-2 py-0.5 bg-sky-600/30 text-sky-300 text-xs rounded">
                {a}
              </span>
            ))}
            {Array.from(runAssignments.entries()).flatMap(([bucket, assignments]) =>
              Array.from(assignments).map(a => (
                <span key={`run-${bucket}-${a}`} className="px-2 py-0.5 bg-emerald-600/30 text-emerald-300 text-xs rounded">
                  {a}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Position Cards */}
      <div className="space-y-3">
        {OL_POSITIONS.map(pos => (
          <div key={pos} className="border border-slate-700 rounded-lg overflow-hidden">
            {/* Position Header */}
            <button
              onClick={() => togglePosition(pos)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <span className="font-bold text-white text-lg">{pos}</span>
              <ChevronDown
                size={20}
                className={`text-slate-400 transition-transform ${expandedPositions[pos] ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Position Content */}
            {expandedPositions[pos] && (
              <div className="p-3 space-y-2">
                {/* General Skills Section */}
                <div className="border border-slate-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(pos, 'general')}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 hover:bg-slate-700 transition-colors"
                  >
                    <span className="font-medium text-white text-sm">General Skills</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${expandedSections[`${pos}-general`] ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedSections[`${pos}-general`] && (
                    <div className="p-3 space-y-3">
                      {SKILL_LEVELS.map(level => (
                        <div key={level.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 ${level.color} text-white text-xs font-medium rounded`}>
                              {level.label}
                            </span>
                            <button
                              onClick={() => setShowDrillModal({ pos, section: 'general', level: level.id })}
                              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                          {getDrills(pos, 'general', level.id).map(drill => (
                            <DrillItem key={drill.id} drill={drill} pos={pos} section="general" level={level.id} />
                          ))}
                          {getDrills(pos, 'general', level.id).length === 0 && (
                            <p className="text-slate-500 text-xs italic">No drills added</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pass Protection Section */}
                <div className="border border-slate-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(pos, 'pass')}
                    className="w-full flex items-center justify-between px-3 py-2 bg-sky-900/30 hover:bg-sky-900/50 transition-colors"
                  >
                    <span className="font-medium text-sky-300 text-sm">Pass Protection</span>
                    <div className="flex items-center gap-2">
                      {getDrills(pos, 'pass').length > 0 && (
                        <span className="text-xs text-slate-400">{getDrills(pos, 'pass').length} drills</span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${expandedSections[`${pos}-pass`] ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {expandedSections[`${pos}-pass`] && (
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          {passAssignments.length > 0 ? (
                            passAssignments.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-sky-600/20 text-sky-300 text-xs rounded">{t}</span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-xs italic">No techniques defined in OL WIZ</span>
                          )}
                        </div>
                        <button
                          onClick={() => setShowDrillModal({ pos, section: 'pass', sectionLabel: 'Pass Protection' })}
                          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Drill
                        </button>
                      </div>
                      {getDrills(pos, 'pass').map(drill => (
                        <DrillItem key={drill.id} drill={drill} pos={pos} section="pass" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheme/Bucket Sections - each bucket gets its own collapsible */}
                {playBuckets.map(bucket => (
                  <div key={bucket.id} className="border border-slate-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(pos, `bucket-${bucket.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 transition-colors"
                    >
                      <span className="font-medium text-emerald-300 text-sm">{bucket.label}</span>
                      <div className="flex items-center gap-2">
                        {getDrills(pos, `bucket-${bucket.id}`).length > 0 && (
                          <span className="text-xs text-slate-400">{getDrills(pos, `bucket-${bucket.id}`).length} drills</span>
                        )}
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${expandedSections[`${pos}-bucket-${bucket.id}`] ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>

                    {expandedSections[`${pos}-bucket-${bucket.id}`] && (
                      <div className="p-3">
                        <div className="flex items-center justify-end mb-2">
                          <button
                            onClick={() => setShowDrillModal({ pos, section: `bucket-${bucket.id}`, sectionLabel: bucket.label })}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Drill
                          </button>
                        </div>
                        {getDrills(pos, `bucket-${bucket.id}`).map(drill => (
                          <DrillItem key={drill.id} drill={drill} pos={pos} section={`bucket-${bucket.id}`} />
                        ))}
                        {getDrills(pos, `bucket-${bucket.id}`).length === 0 && (
                          <p className="text-slate-500 text-xs italic">No drills added</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Drill Modal */}
      {showDrillModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add Drill - {showDrillModal.pos} {showDrillModal.sectionLabel || showDrillModal.level || ''}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addDrill(showDrillModal.pos, showDrillModal.section, {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  level: showDrillModal.level
                });
              }}
            >
              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Drill Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="e.g., Kick-Slide Drill"
                />
              </div>
              <div className="mb-4">
                <label className="text-xs text-slate-400 block mb-1">Description (optional)</label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white resize-none"
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDrillModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-500"
                >
                  Add Drill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Equipment presets for drills
const EQUIPMENT_PRESETS = [
  'cones', 'bags', 'sled', 'tackling dummy', 'agility ladder',
  'resistance bands', 'medicine ball', 'blocking pad', 'footballs'
];

// Difficulty levels for position drills
const DIFFICULTY_LEVELS = [
  { id: 'basic', label: 'Basic', color: 'bg-emerald-500' },
  { id: 'intermediate', label: 'Intermediate', color: 'bg-amber-500' },
  { id: 'advanced', label: 'Advanced', color: 'bg-red-500' }
];

// Phase options for drill library (O/D/K only, no Competition)
const DRILL_PHASES = [
  { id: 'OFFENSE', label: 'Offense', color: 'bg-blue-600' },
  { id: 'DEFENSE', label: 'Defense', color: 'bg-red-600' },
  { id: 'SPECIAL_TEAMS', label: 'Special Teams', color: 'bg-amber-600' }
];

// Skills & Drills Library Tab Component
function DrillsLibraryTab({ drillsLibrary, positionGroups, playBuckets, passProtections, runBlocking, plays, onUpdate, isLight = false }) {
  const [activePhase, setActivePhase] = useState('OFFENSE');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedBuckets, setExpandedBuckets] = useState({});
  const [showDrillModal, setShowDrillModal] = useState(null); // { type: 'position' | 'scheme', groupId, bucketId, drill? }

  // Get position groups for current phase
  const currentPositionGroups = positionGroups[activePhase] || [];

  // Get play buckets for current phase (scheme drills)
  const currentBuckets = (playBuckets || []).filter(b => b.phase === activePhase || !b.phase);

  // Extract skill position assignments from plays, grouped by bucket and position group
  const skillAssignmentsByBucket = useMemo(() => {
    const byBucket = {};
    (plays || []).filter(p => (p.phase || 'OFFENSE') === activePhase).forEach(play => {
      const bucketId = play.bucketId || play.playCategory;
      if (!bucketId || !play.skillAssignments) return;
      if (!byBucket[bucketId]) byBucket[bucketId] = {};
      Object.entries(play.skillAssignments).forEach(([pos, assignment]) => {
        if (assignment && assignment.trim()) {
          // Map individual positions to position groups
          const groupAbbrev = pos; // We'll show by position (QB, RB, etc.)
          if (!byBucket[bucketId][groupAbbrev]) byBucket[bucketId][groupAbbrev] = new Set();
          byBucket[bucketId][groupAbbrev].add(assignment.trim());
        }
      });
    });
    // Convert Sets to Arrays
    Object.keys(byBucket).forEach(bucketId => {
      Object.keys(byBucket[bucketId]).forEach(pos => {
        byBucket[bucketId][pos] = Array.from(byBucket[bucketId][pos]);
      });
    });
    return byBucket;
  }, [plays, activePhase]);

  // Get assignments for a position group in a bucket
  const getAssignmentsForPositionBucket = (groupAbbrev, bucketId) => {
    return skillAssignmentsByBucket[bucketId]?.[groupAbbrev] || [];
  };

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Toggle bucket expansion
  const toggleBucket = (bucketId) => {
    setExpandedBuckets(prev => ({ ...prev, [bucketId]: !prev[bucketId] }));
  };

  // Get drills for a position group and difficulty level
  const getPositionDrills = (groupId, difficulty) => {
    return drillsLibrary.positionDrills?.[groupId]?.[difficulty] || [];
  };

  // Get drills for a scheme (bucket/concept)
  const getSchemeDrills = (bucketId) => {
    return drillsLibrary.schemeDrills?.[bucketId] || [];
  };

  // Add a new position drill
  const addPositionDrill = (groupId, drill) => {
    const currentDrills = drillsLibrary.positionDrills?.[groupId]?.[drill.difficulty] || [];
    const newDrill = {
      ...drill,
      id: `drill_${Date.now()}`
    };

    const updated = {
      ...drillsLibrary,
      positionDrills: {
        ...drillsLibrary.positionDrills,
        [groupId]: {
          ...(drillsLibrary.positionDrills?.[groupId] || {}),
          [drill.difficulty]: [...currentDrills, newDrill]
        }
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Update a position drill
  const updatePositionDrill = (groupId, originalDifficulty, drill) => {
    // If difficulty changed, we need to move the drill
    if (originalDifficulty !== drill.difficulty) {
      // Remove from old difficulty
      const oldDrills = (drillsLibrary.positionDrills?.[groupId]?.[originalDifficulty] || [])
        .filter(d => d.id !== drill.id);
      // Add to new difficulty
      const newDrills = [...(drillsLibrary.positionDrills?.[groupId]?.[drill.difficulty] || []), drill];

      const updated = {
        ...drillsLibrary,
        positionDrills: {
          ...drillsLibrary.positionDrills,
          [groupId]: {
            ...(drillsLibrary.positionDrills?.[groupId] || {}),
            [originalDifficulty]: oldDrills,
            [drill.difficulty]: newDrills
          }
        }
      };
      onUpdate('drillsLibrary', updated);
    } else {
      // Same difficulty, just update in place
      const currentDrills = drillsLibrary.positionDrills?.[groupId]?.[drill.difficulty] || [];
      const updated = {
        ...drillsLibrary,
        positionDrills: {
          ...drillsLibrary.positionDrills,
          [groupId]: {
            ...(drillsLibrary.positionDrills?.[groupId] || {}),
            [drill.difficulty]: currentDrills.map(d => d.id === drill.id ? drill : d)
          }
        }
      };
      onUpdate('drillsLibrary', updated);
    }
  };

  // Delete a position drill
  const deletePositionDrill = (groupId, difficulty, drillId) => {
    if (!confirm('Delete this drill?')) return;
    const currentDrills = drillsLibrary.positionDrills?.[groupId]?.[difficulty] || [];
    const updated = {
      ...drillsLibrary,
      positionDrills: {
        ...drillsLibrary.positionDrills,
        [groupId]: {
          ...(drillsLibrary.positionDrills?.[groupId] || {}),
          [difficulty]: currentDrills.filter(d => d.id !== drillId)
        }
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Add a scheme drill
  const addSchemeDrill = (bucketId, drill) => {
    const currentDrills = drillsLibrary.schemeDrills?.[bucketId] || [];
    const newDrill = {
      ...drill,
      id: `drill_${Date.now()}`
    };

    const updated = {
      ...drillsLibrary,
      schemeDrills: {
        ...drillsLibrary.schemeDrills,
        [bucketId]: [...currentDrills, newDrill]
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Update a scheme drill
  const updateSchemeDrill = (bucketId, drill) => {
    const currentDrills = drillsLibrary.schemeDrills?.[bucketId] || [];
    const updated = {
      ...drillsLibrary,
      schemeDrills: {
        ...drillsLibrary.schemeDrills,
        [bucketId]: currentDrills.map(d => d.id === drill.id ? drill : d)
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Delete a scheme drill
  const deleteSchemeDrill = (bucketId, drillId) => {
    if (!confirm('Delete this drill?')) return;
    const currentDrills = drillsLibrary.schemeDrills?.[bucketId] || [];
    const updated = {
      ...drillsLibrary,
      schemeDrills: {
        ...drillsLibrary.schemeDrills,
        [bucketId]: currentDrills.filter(d => d.id !== drillId)
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Add a position bucket drill (drill for a specific position group + bucket combo)
  const addPositionBucketDrill = (groupId, bucketId, drill) => {
    const currentDrills = drillsLibrary.positionBucketDrills?.[groupId]?.[bucketId] || [];
    const newDrill = {
      ...drill,
      id: `drill_${Date.now()}`
    };

    const updated = {
      ...drillsLibrary,
      positionBucketDrills: {
        ...(drillsLibrary.positionBucketDrills || {}),
        [groupId]: {
          ...(drillsLibrary.positionBucketDrills?.[groupId] || {}),
          [bucketId]: [...currentDrills, newDrill]
        }
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Update a position bucket drill
  const updatePositionBucketDrill = (groupId, bucketId, drill) => {
    const currentDrills = drillsLibrary.positionBucketDrills?.[groupId]?.[bucketId] || [];
    const updated = {
      ...drillsLibrary,
      positionBucketDrills: {
        ...(drillsLibrary.positionBucketDrills || {}),
        [groupId]: {
          ...(drillsLibrary.positionBucketDrills?.[groupId] || {}),
          [bucketId]: currentDrills.map(d => d.id === drill.id ? drill : d)
        }
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Delete a position bucket drill
  const deletePositionBucketDrill = (groupId, bucketId, drillId) => {
    if (!confirm('Delete this drill?')) return;
    const currentDrills = drillsLibrary.positionBucketDrills?.[groupId]?.[bucketId] || [];
    const updated = {
      ...drillsLibrary,
      positionBucketDrills: {
        ...(drillsLibrary.positionBucketDrills || {}),
        [groupId]: {
          ...(drillsLibrary.positionBucketDrills?.[groupId] || {}),
          [bucketId]: currentDrills.filter(d => d.id !== drillId)
        }
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Handle save from modal
  const handleSaveDrill = (drill) => {
    const { type, groupId, bucketId, originalDifficulty } = showDrillModal;

    if (type === 'position') {
      if (showDrillModal.drill) {
        updatePositionDrill(groupId, originalDifficulty, drill);
      } else {
        addPositionDrill(groupId, drill);
      }
    } else if (type === 'positionBucket') {
      if (showDrillModal.drill) {
        updatePositionBucketDrill(groupId, bucketId, drill);
      } else {
        addPositionBucketDrill(groupId, bucketId, drill);
      }
    } else {
      if (showDrillModal.drill) {
        updateSchemeDrill(bucketId, drill);
      } else {
        addSchemeDrill(bucketId, drill);
      }
    }
    setShowDrillModal(null);
  };

  // Render a single drill item
  const DrillItem = ({ drill, onEdit, onDelete, showPositionGroups = false }) => {
    // Get position group abbreviations for scheme drills
    const getGroupAbbrevs = () => {
      if (!showPositionGroups || !drill.positionGroupIds?.length) return null;
      const abbrevs = drill.positionGroupIds.map(gid => {
        const group = currentPositionGroups.find(g => g.id === gid);
        return group?.abbrev || gid;
      });
      return abbrevs.join(', ');
    };

    return (
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg group ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/30 hover:bg-slate-700/50'}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {drill.name}
          </span>
          {showPositionGroups && drill.positionGroupIds?.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded ${isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-900/50 text-sky-300'}`}>
              {getGroupAbbrevs()}
            </span>
          )}
          <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            {drill.duration} min
          </span>
          {drill.videoUrl && (
            <Video size={14} className={`${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(drill)}
            className={`p-1.5 rounded ${isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-slate-600 text-slate-300'}`}
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(drill.id)}
            className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Skills & Drills Library</h3>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Organize drills by position group (with difficulty levels) and by scheme (tied to play buckets).
        </p>
      </div>

      {/* Phase Selector */}
      <div className="flex gap-2 mb-6">
        {DRILL_PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePhase(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePhase === p.id
                ? `${p.color} text-white`
                : isLight
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Position Drills Section */}
      <div className={`mb-8 p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'}`}>
        <h4 className={`text-base font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Position Drills
        </h4>

        {currentPositionGroups.length === 0 ? (
          <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p>No position groups defined for {DRILL_PHASES.find(p => p.id === activePhase)?.label}.</p>
            <p className="text-sm mt-1">Add position groups in the Position Groups tab first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentPositionGroups.map(group => {
              const isExpanded = expandedGroups[group.id];
              const totalDrills = DIFFICULTY_LEVELS.reduce((sum, level) =>
                sum + getPositionDrills(group.id, level.id).length, 0
              );

              return (
                <div key={group.id} className={`rounded-lg border overflow-hidden ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                  {/* Group Header */}
                  <div
                    onClick={() => toggleGroup(group.id)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight
                        size={18}
                        className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                      />
                      <span className="bg-sky-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                        {group.abbrev}
                      </span>
                      <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {group.name}
                      </span>
                      <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        ({totalDrills} drill{totalDrills !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDrillModal({ type: 'position', groupId: group.id });
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-sky-600 text-white text-sm rounded hover:bg-sky-700 transition-colors"
                    >
                      <Plus size={14} /> Add Drill
                    </button>
                  </div>

                  {/* Expanded Content - Drills by Difficulty */}
                  {isExpanded && (
                    <div className={`px-4 py-3 ${isLight ? 'bg-white' : 'bg-slate-800/30'}`}>
                      {DIFFICULTY_LEVELS.map(level => {
                        const drills = getPositionDrills(group.id, level.id);
                        return (
                          <div key={level.id} className="mb-4 last:mb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`${level.color} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                                {level.label.toUpperCase()}
                              </span>
                              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                                ({drills.length})
                              </span>
                            </div>
                            {drills.length > 0 ? (
                              <div className="space-y-1 ml-4">
                                {drills.map(drill => (
                                  <DrillItem
                                    key={drill.id}
                                    drill={drill}
                                    onEdit={(d) => setShowDrillModal({
                                      type: 'position',
                                      groupId: group.id,
                                      drill: d,
                                      originalDifficulty: level.id
                                    })}
                                    onDelete={(id) => deletePositionDrill(group.id, level.id, id)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className={`text-sm ml-4 italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                                No drills added yet
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* Bucket-Specific Sections (Play Buckets) */}
                      {currentBuckets.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-600">
                          <p className={`text-xs font-medium mb-3 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                            BY SCHEME / BUCKET
                          </p>
                          {currentBuckets.map(bucket => {
                            const assignments = getAssignmentsForPositionBucket(group.abbrev, bucket.id);
                            const bucketDrills = drillsLibrary.positionBucketDrills?.[group.id]?.[bucket.id] || [];
                            const hasContent = assignments.length > 0 || bucketDrills.length > 0;

                            return (
                              <div key={bucket.id} className="mb-3 last:mb-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: bucket.color || '#10b981' }}
                                    />
                                    <span className={`text-sm font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                      {bucket.label}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDrillModal({ type: 'positionBucket', groupId: group.id, bucketId: bucket.id });
                                    }}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                  >
                                    <Plus size={12} /> Add
                                  </button>
                                </div>

                                {/* Auto-populated assignments from plays */}
                                {assignments.length > 0 && (
                                  <div className={`mb-2 p-2 rounded ml-4 ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                                    <span className={`text-xs font-medium block mb-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                      From plays:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {assignments.map(a => (
                                        <span key={a} className={`px-2 py-0.5 text-xs rounded ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600/30 text-emerald-300'}`}>
                                          {a}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Drills for this bucket */}
                                {bucketDrills.length > 0 && (
                                  <div className="space-y-1 ml-4">
                                    {bucketDrills.map(drill => (
                                      <DrillItem
                                        key={drill.id}
                                        drill={drill}
                                        onEdit={(d) => setShowDrillModal({
                                          type: 'positionBucket',
                                          groupId: group.id,
                                          bucketId: bucket.id,
                                          drill: d
                                        })}
                                        onDelete={(id) => deletePositionBucketDrill(group.id, bucket.id, id)}
                                      />
                                    ))}
                                  </div>
                                )}

                                {!hasContent && (
                                  <p className={`text-xs ml-4 italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                                    No assignments yet
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheme Drills Section */}
      <div className={`p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'}`}>
        <h4 className={`text-base font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Scheme Drills
        </h4>

        {currentBuckets.length === 0 ? (
          <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            <Tag size={32} className="mx-auto mb-2 opacity-50" />
            <p>No play buckets defined for {DRILL_PHASES.find(p => p.id === activePhase)?.label}.</p>
            <p className="text-sm mt-1">Add play buckets in the Define Play Buckets tab first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentBuckets.map(bucket => {
              const isExpanded = expandedBuckets[bucket.id];
              const drills = getSchemeDrills(bucket.id);

              return (
                <div key={bucket.id} className={`rounded-lg border overflow-hidden ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                  {/* Bucket Header */}
                  <div
                    onClick={() => toggleBucket(bucket.id)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight
                        size={18}
                        className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bucket.color || '#94a3b8' }}
                      />
                      <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {bucket.label}
                      </span>
                      <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        ({drills.length} drill{drills.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDrillModal({ type: 'scheme', bucketId: bucket.id });
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-sky-600 text-white text-sm rounded hover:bg-sky-700 transition-colors"
                    >
                      <Plus size={14} /> Add Drill
                    </button>
                  </div>

                  {/* Expanded Content - Scheme Drills */}
                  {isExpanded && (
                    <div className={`px-4 py-3 ${isLight ? 'bg-white' : 'bg-slate-800/30'}`}>
                      {drills.length > 0 ? (
                        <div className="space-y-1">
                          {drills.map(drill => (
                            <DrillItem
                              key={drill.id}
                              drill={drill}
                              showPositionGroups={true}
                              onEdit={(d) => setShowDrillModal({
                                type: 'scheme',
                                bucketId: bucket.id,
                                drill: d
                              })}
                              onDelete={(id) => deleteSchemeDrill(bucket.id, id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className={`text-sm italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                          No drills added yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team/Group Drills Section - for Offense only */}
      {activePhase === 'OFFENSE' && (
        <TeamGroupDrills
          drillsLibrary={drillsLibrary}
          onUpdate={onUpdate}
          isLight={isLight}
        />
      )}

      {/* Individual Position Skills Section - for Offense only */}
      {activePhase === 'OFFENSE' && (
        <IndividualPositionSkills
          drillsLibrary={drillsLibrary}
          playBuckets={(playBuckets || []).filter(b => b.phase === 'OFFENSE' || !b.phase)}
          passProtections={passProtections}
          runBlocking={runBlocking}
          plays={(plays || []).filter(p => (p.phase || 'OFFENSE') === 'OFFENSE')}
          onUpdate={onUpdate}
          isLight={isLight}
        />
      )}

      {/* Add/Edit Drill Modal */}
      {showDrillModal && (
        <DrillModal
          isOpen={true}
          type={showDrillModal.type}
          drill={showDrillModal.drill}
          positionGroups={currentPositionGroups}
          isLight={isLight}
          onSave={handleSaveDrill}
          onClose={() => setShowDrillModal(null)}
        />
      )}
    </div>
  );
}

// Drill Add/Edit Modal Component
function DrillModal({ isOpen, type, drill, positionGroups, isLight, onSave, onClose }) {
  const [name, setName] = useState(drill?.name || '');
  const [description, setDescription] = useState(drill?.description || '');
  const [difficulty, setDifficulty] = useState(drill?.difficulty || 'basic');
  const [videoUrl, setVideoUrl] = useState(drill?.videoUrl || '');
  const [duration, setDuration] = useState(drill?.duration || 5);
  const [equipment, setEquipment] = useState(drill?.equipment || []);
  const [selectedPositionGroupIds, setSelectedPositionGroupIds] = useState(drill?.positionGroupIds || []);
  const [newEquipment, setNewEquipment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const drillData = {
      id: drill?.id,
      name: name.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      duration: parseInt(duration) || 5,
      equipment,
      ...(type === 'position' ? { difficulty } : { positionGroupIds: selectedPositionGroupIds })
    };

    onSave(drillData);
  };

  const addEquipment = (item) => {
    if (item && !equipment.includes(item)) {
      setEquipment([...equipment, item]);
    }
    setNewEquipment('');
  };

  const removeEquipment = (item) => {
    setEquipment(equipment.filter(e => e !== item));
  };

  const togglePositionGroup = (groupId) => {
    if (selectedPositionGroupIds.includes(groupId)) {
      setSelectedPositionGroupIds(selectedPositionGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedPositionGroupIds([...selectedPositionGroupIds, groupId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
        <div className={`sticky top-0 flex items-center justify-between px-6 py-4 border-b ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {drill ? 'Edit' : 'Add'} {type === 'position' ? 'Position' : 'Scheme'} Drill
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-700 text-slate-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drill Name */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Drill Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Stance Check, IZ Footwork"
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-slate-700 border-slate-600 text-white'
              }`}
              required
            />
          </div>

          {/* Difficulty Level (Position drills only) */}
          {type === 'position' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Difficulty Level
              </label>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.map(level => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setDifficulty(level.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      difficulty === level.id
                        ? `${level.color} text-white`
                        : isLight
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Position Groups (Scheme drills only) */}
          {type === 'scheme' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Position Groups
              </label>
              <p className={`text-xs mb-2 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Which position groups work on this scheme drill?
              </p>
              <div className="flex flex-wrap gap-2">
                {positionGroups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => togglePositionGroup(group.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedPositionGroupIds.includes(group.id)
                        ? 'bg-sky-600 text-white'
                        : isLight
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {group.abbrev}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how to run the drill, coaching points, progressions..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${
                isLight
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-slate-700 border-slate-600 text-white'
              }`}
            />
          </div>

          {/* Video URL */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Video URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube, Hudl, etc."
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-slate-700 border-slate-600 text-white'
              }`}
            />
          </div>

          {/* Duration */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={`w-24 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                isLight
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-slate-700 border-slate-600 text-white'
              }`}
            />
          </div>

          {/* Equipment */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Equipment Needed
            </label>

            {/* Selected Equipment Tags */}
            {equipment.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {equipment.map(item => (
                  <span
                    key={item}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      isLight ? 'bg-gray-100 text-gray-700' : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeEquipment(item)}
                      className="hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Equipment Presets */}
            <div className="flex flex-wrap gap-1 mb-2">
              {EQUIPMENT_PRESETS.filter(e => !equipment.includes(e)).map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => addEquipment(item)}
                  className={`px-2 py-1 rounded text-xs ${
                    isLight
                      ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600'
                  }`}
                >
                  + {item}
                </button>
              ))}
            </div>

            {/* Custom Equipment Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEquipment(newEquipment);
                  }
                }}
                placeholder="Add custom equipment..."
                className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isLight
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-slate-700 border-slate-600 text-white'
                }`}
              />
              <button
                type="button"
                onClick={() => addEquipment(newEquipment)}
                className={`px-3 py-2 rounded-lg ${
                  isLight
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                isLight
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {drill ? 'Save Changes' : 'Save Drill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Team/Group Drills Component - for drills involving multiple positions
const TEAM_DRILL_CATEGORIES = [
  { id: 'mesh', label: 'Mesh / Timing', description: 'QB-RB exchange timing, mesh points', icon: '🤝' },
  { id: 'motion', label: 'Motion Drills', description: 'Shift and motion execution with timing', icon: '↔️' },
  { id: 'route-combos', label: 'Route Combinations', description: 'QB + receivers working route concepts', icon: '📡' },
  { id: 'protection-routes', label: 'Protection + Routes', description: 'OL protection with skill routes', icon: '🛡️' },
  { id: 'reads', label: 'Read Progressions', description: 'QB reads with full route tree', icon: '👁️' },
  { id: 'rpo', label: 'RPO Execution', description: 'Run-pass option reads and execution', icon: '⚡' },
  { id: 'screens', label: 'Screen Game', description: 'Screen setups with blocking and timing', icon: '🎯' },
  { id: 'red-zone', label: 'Red Zone', description: 'Compressed field team concepts', icon: '🔴' }
];

function TeamGroupDrills({ drillsLibrary, onUpdate, isLight }) {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showDrillModal, setShowDrillModal] = useState(null);

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Get drills for a category
  const getDrills = (categoryId) => {
    return drillsLibrary?.teamGroupDrills?.[categoryId] || [];
  };

  // Add a drill
  const addDrill = (categoryId, drill) => {
    const currentDrills = drillsLibrary?.teamGroupDrills?.[categoryId] || [];
    const newDrill = { ...drill, id: `drill_${Date.now()}` };

    const updated = {
      ...drillsLibrary,
      teamGroupDrills: {
        ...(drillsLibrary?.teamGroupDrills || {}),
        [categoryId]: [...currentDrills, newDrill]
      }
    };
    onUpdate('drillsLibrary', updated);
    setShowDrillModal(null);
  };

  // Delete a drill
  const deleteDrill = (categoryId, drillId) => {
    if (!confirm('Delete this drill?')) return;
    const currentDrills = drillsLibrary?.teamGroupDrills?.[categoryId] || [];

    const updated = {
      ...drillsLibrary,
      teamGroupDrills: {
        ...(drillsLibrary?.teamGroupDrills || {}),
        [categoryId]: currentDrills.filter(d => d.id !== drillId)
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Drill item component
  const DrillItem = ({ drill, categoryId }) => (
    <div className={`flex items-center justify-between py-2 px-3 rounded mb-1 group ${isLight ? 'bg-gray-50' : 'bg-slate-700/50'}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{drill.name}</span>
          {drill.positions?.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-900/50 text-sky-300'}`}>
              {drill.positions.join(', ')}
            </span>
          )}
        </div>
        {drill.description && (
          <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{drill.description}</p>
        )}
      </div>
      <button
        onClick={() => deleteDrill(categoryId, drill.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className={`mt-8 p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'}`}>
      <div className="mb-4">
        <h4 className={`text-base font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Team / Group Drills
        </h4>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Drills involving multiple positions working together - meshes, motions, route combos, reads
        </p>
      </div>

      <div className="space-y-2">
        {TEAM_DRILL_CATEGORIES.map(cat => {
          const drills = getDrills(cat.id);
          const isExpanded = expandedCategories[cat.id];

          return (
            <div key={cat.id} className={`rounded-lg border overflow-hidden ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full flex items-center justify-between px-4 py-3 ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/50 hover:bg-slate-700'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cat.icon}</span>
                  <div className="text-left">
                    <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{cat.label}</span>
                    <span className={`text-xs ml-2 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      ({drills.length} drill{drills.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDrillModal({ categoryId: cat.id, categoryLabel: cat.label });
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-sky-600 text-white text-xs rounded hover:bg-sky-700"
                  >
                    <Plus size={12} /> Add
                  </button>
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className={`p-3 ${isLight ? 'bg-white' : 'bg-slate-800/30'}`}>
                  <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>{cat.description}</p>
                  {drills.length > 0 ? (
                    drills.map(drill => (
                      <DrillItem key={drill.id} drill={drill} categoryId={cat.id} />
                    ))
                  ) : (
                    <p className={`text-sm italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                      No drills added yet
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Drill Modal */}
      {showDrillModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-4 w-full max-w-md ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Add Team Drill - {showDrillModal.categoryLabel}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const positionsStr = formData.get('positions');
                addDrill(showDrillModal.categoryId, {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  positions: positionsStr ? positionsStr.split(',').map(p => p.trim()).filter(Boolean) : []
                });
              }}
            >
              <div className="mb-3">
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Drill Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className={`w-full px-3 py-2 rounded border ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  placeholder="e.g., Mesh Point Drill"
                />
              </div>
              <div className="mb-3">
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Positions Involved</label>
                <input
                  name="positions"
                  type="text"
                  className={`w-full px-3 py-2 rounded border ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  placeholder="e.g., QB, RB, WR (comma separated)"
                />
              </div>
              <div className="mb-4">
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Description</label>
                <textarea
                  name="description"
                  className={`w-full px-3 py-2 rounded border resize-none ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDrillModal(null)}
                  className={`px-4 py-2 ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-slate-400 hover:text-white'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-500"
                >
                  Add Drill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Position Skills Component (for OL and Skill positions)
const INDIVIDUAL_OL_POSITIONS = ['LT', 'LG', 'C', 'RG', 'RT'];
const INDIVIDUAL_SKILL_POSITIONS = ['QB', 'RB', 'FB', 'WR', 'TE', 'X', 'Y', 'Z', 'H', 'F'];
const POSITION_SKILL_LEVELS = [
  { id: 'basic', label: 'Basic', color: 'bg-emerald-500' },
  { id: 'intermediate', label: 'Intermediate', color: 'bg-amber-500' },
  { id: 'advanced', label: 'Advanced', color: 'bg-red-500' }
];

function IndividualPositionSkills({ drillsLibrary, playBuckets, passProtections, runBlocking, plays, onUpdate, isLight }) {
  const [expandedPositions, setExpandedPositions] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [showDrillModal, setShowDrillModal] = useState(null);
  const [activeTab, setActiveTab] = useState('oline'); // 'oline' or 'skill'

  // Extract unique techniques from OL WIZ Pass Protections
  const passAssignments = useMemo(() => {
    const assignments = new Set();
    (passProtections || []).forEach(prot => {
      if (prot.assignments) {
        Object.values(prot.assignments).forEach(val => {
          if (val && val.trim()) assignments.add(val.trim());
        });
      }
    });
    return Array.from(assignments);
  }, [passProtections]);

  // Extract unique OL assignments from Run Blocking schemes by type
  const runAssignmentsByType = useMemo(() => {
    const byType = {};
    (runBlocking || []).forEach(scheme => {
      const type = scheme.type || 'other';
      if (!byType[type]) byType[type] = { all: new Set(), byPosition: {} };
      if (scheme.assignments) {
        Object.entries(scheme.assignments).forEach(([pos, val]) => {
          if (val && val.trim()) {
            byType[type].all.add(val.trim());
            if (!byType[type].byPosition[pos]) byType[type].byPosition[pos] = new Set();
            byType[type].byPosition[pos].add(val.trim());
          }
        });
      }
    });
    return byType;
  }, [runBlocking]);

  // Extract skill position assignments from plays, grouped by bucket
  const skillAssignmentsByBucket = useMemo(() => {
    const byBucket = {};
    (plays || []).forEach(play => {
      const bucketId = play.bucketId || play.playCategory;
      if (!bucketId || !play.skillAssignments) return;
      if (!byBucket[bucketId]) byBucket[bucketId] = {};
      Object.entries(play.skillAssignments).forEach(([pos, assignment]) => {
        if (assignment && assignment.trim()) {
          if (!byBucket[bucketId][pos]) byBucket[bucketId][pos] = new Set();
          byBucket[bucketId][pos].add(assignment.trim());
        }
      });
    });
    // Convert Sets to Arrays
    Object.keys(byBucket).forEach(bucketId => {
      Object.keys(byBucket[bucketId]).forEach(pos => {
        byBucket[bucketId][pos] = Array.from(byBucket[bucketId][pos]);
      });
    });
    return byBucket;
  }, [plays]);

  // Get assignments for a position in a bucket
  const getAssignmentsForBucket = (pos, bucketId) => {
    // For skill positions, use skillAssignmentsByBucket
    if (INDIVIDUAL_SKILL_POSITIONS.includes(pos)) {
      return skillAssignmentsByBucket[bucketId]?.[pos] || [];
    }
    // For OL positions, match bucket to run blocking type if possible
    const bucket = playBuckets.find(b => b.id === bucketId);
    if (bucket) {
      const label = (bucket.label || '').toLowerCase();
      // Try to match bucket label to run blocking types
      const typeMap = {
        'zone': 'zone', 'inside zone': 'zone', 'outside zone': 'zone',
        'gap': 'gap', 'power': 'power', 'counter': 'counter',
        'trap': 'trap', 'iso': 'iso'
      };
      for (const [key, type] of Object.entries(typeMap)) {
        if (label.includes(key)) {
          return Array.from(runAssignmentsByType[type]?.byPosition?.[pos] || []);
        }
      }
    }
    return [];
  };

  const positions = activeTab === 'oline' ? INDIVIDUAL_OL_POSITIONS : INDIVIDUAL_SKILL_POSITIONS;

  const togglePosition = (pos) => {
    setExpandedPositions(prev => ({ ...prev, [pos]: !prev[pos] }));
  };

  const toggleSection = (pos, section) => {
    const key = `${pos}-${section}`;
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Get drills for a position/section/level
  const getDrills = (pos, section, level = null) => {
    const posKey = `individual-${pos}`;
    if (level) {
      return drillsLibrary?.individualPositionDrills?.[posKey]?.general?.[level] || [];
    }
    return drillsLibrary?.individualPositionDrills?.[posKey]?.[section] || [];
  };

  // Add a drill
  const addDrill = (pos, section, drill) => {
    const posKey = `individual-${pos}`;
    const currentDrills = section === 'general'
      ? (drillsLibrary?.individualPositionDrills?.[posKey]?.general?.[drill.level] || [])
      : (drillsLibrary?.individualPositionDrills?.[posKey]?.[section] || []);

    const newDrill = { ...drill, id: `drill_${Date.now()}` };

    let posData;
    if (section === 'general') {
      posData = {
        ...(drillsLibrary?.individualPositionDrills?.[posKey] || {}),
        general: {
          ...(drillsLibrary?.individualPositionDrills?.[posKey]?.general || {}),
          [drill.level]: [...currentDrills, newDrill]
        }
      };
    } else {
      posData = {
        ...(drillsLibrary?.individualPositionDrills?.[posKey] || {}),
        [section]: [...currentDrills, newDrill]
      };
    }

    const updated = {
      ...drillsLibrary,
      individualPositionDrills: {
        ...(drillsLibrary?.individualPositionDrills || {}),
        [posKey]: posData
      }
    };
    onUpdate('drillsLibrary', updated);
    setShowDrillModal(null);
  };

  // Delete a drill
  const deleteDrill = (pos, section, level, drillId) => {
    if (!confirm('Delete this drill?')) return;
    const posKey = `individual-${pos}`;

    let posData;
    if (level) {
      const currentDrills = drillsLibrary?.individualPositionDrills?.[posKey]?.general?.[level] || [];
      posData = {
        ...(drillsLibrary?.individualPositionDrills?.[posKey] || {}),
        general: {
          ...(drillsLibrary?.individualPositionDrills?.[posKey]?.general || {}),
          [level]: currentDrills.filter(d => d.id !== drillId)
        }
      };
    } else {
      const currentDrills = drillsLibrary?.individualPositionDrills?.[posKey]?.[section] || [];
      posData = {
        ...(drillsLibrary?.individualPositionDrills?.[posKey] || {}),
        [section]: currentDrills.filter(d => d.id !== drillId)
      };
    }

    const updated = {
      ...drillsLibrary,
      individualPositionDrills: {
        ...(drillsLibrary?.individualPositionDrills || {}),
        [posKey]: posData
      }
    };
    onUpdate('drillsLibrary', updated);
  };

  // Drill item component
  const DrillItem = ({ drill, pos, section, level }) => (
    <div className={`flex items-center justify-between py-2 px-3 rounded mb-1 group ${isLight ? 'bg-gray-50' : 'bg-slate-700/50'}`}>
      <div className="flex-1">
        <span className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{drill.name}</span>
        {drill.description && (
          <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{drill.description}</p>
        )}
      </div>
      <button
        onClick={() => deleteDrill(pos, section, level, drill.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className={`mt-8 p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className={`text-base font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Individual Position Skills
          </h4>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Drills organized by position with general skills and scheme-specific drills
          </p>
        </div>
        <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('oline')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              activeTab === 'oline'
                ? 'bg-sky-600 text-white'
                : isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-300 hover:bg-slate-600'
            }`}
          >
            O-Line
          </button>
          <button
            onClick={() => setActiveTab('skill')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              activeTab === 'skill'
                ? 'bg-sky-600 text-white'
                : isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-300 hover:bg-slate-600'
            }`}
          >
            Skill Positions
          </button>
        </div>
      </div>

      {/* Auto-detected techniques for OL */}
      {activeTab === 'oline' && passAssignments.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg ${isLight ? 'bg-sky-50 border border-sky-200' : 'bg-sky-900/20 border border-sky-800'}`}>
          <span className={`text-xs font-medium block mb-2 ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
            Auto-detected from OL WIZ:
          </span>
          <div className="flex flex-wrap gap-1">
            {passAssignments.map(a => (
              <span key={a} className={`px-2 py-0.5 text-xs rounded ${isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-600/30 text-sky-300'}`}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Position Cards */}
      <div className="space-y-2">
        {positions.map(pos => (
          <div key={pos} className={`rounded-lg border overflow-hidden ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
            {/* Position Header */}
            <button
              onClick={() => togglePosition(pos)}
              className={`w-full flex items-center justify-between px-4 py-3 ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/50 hover:bg-slate-700'}`}
            >
              <span className={`font-bold text-lg ${isLight ? 'text-gray-900' : 'text-white'}`}>{pos}</span>
              <ChevronDown
                size={20}
                className={`transition-transform ${expandedPositions[pos] ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
              />
            </button>

            {/* Position Content */}
            {expandedPositions[pos] && (
              <div className={`p-3 space-y-2 ${isLight ? 'bg-white' : 'bg-slate-800/30'}`}>
                {/* General Skills Section */}
                <div className={`rounded-lg border overflow-hidden ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                  <button
                    onClick={() => toggleSection(pos, 'general')}
                    className={`w-full flex items-center justify-between px-3 py-2 ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <span className={`font-medium text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>General Skills</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${expandedSections[`${pos}-general`] ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                    />
                  </button>

                  {expandedSections[`${pos}-general`] && (
                    <div className="p-3 space-y-3">
                      {POSITION_SKILL_LEVELS.map(level => (
                        <div key={level.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 ${level.color} text-white text-xs font-medium rounded`}>
                              {level.label}
                            </span>
                            <button
                              onClick={() => setShowDrillModal({ pos, section: 'general', level: level.id })}
                              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                          {getDrills(pos, 'general', level.id).map(drill => (
                            <DrillItem key={drill.id} drill={drill} pos={pos} section="general" level={level.id} />
                          ))}
                          {getDrills(pos, 'general', level.id).length === 0 && (
                            <p className={`text-xs italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No drills</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pass Protection Section (OL only) */}
                {activeTab === 'oline' && (
                  <div className={`rounded-lg border overflow-hidden ${isLight ? 'border-sky-200' : 'border-slate-600'}`}>
                    <button
                      onClick={() => toggleSection(pos, 'pass')}
                      className={`w-full flex items-center justify-between px-3 py-2 ${isLight ? 'bg-sky-50 hover:bg-sky-100' : 'bg-sky-900/30 hover:bg-sky-900/50'}`}
                    >
                      <span className={`font-medium text-sm ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>Pass Protection</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${expandedSections[`${pos}-pass`] ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                      />
                    </button>

                    {expandedSections[`${pos}-pass`] && (
                      <div className="p-3">
                        <div className="flex items-center justify-end mb-2">
                          <button
                            onClick={() => setShowDrillModal({ pos, section: 'pass', sectionLabel: 'Pass Protection' })}
                            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Drill
                          </button>
                        </div>
                        {getDrills(pos, 'pass').map(drill => (
                          <DrillItem key={drill.id} drill={drill} pos={pos} section="pass" />
                        ))}
                        {getDrills(pos, 'pass').length === 0 && (
                          <p className={`text-xs italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No drills</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bucket/Scheme Sections */}
                {playBuckets.map(bucket => (
                  <div key={bucket.id} className={`rounded-lg border overflow-hidden ${isLight ? 'border-emerald-200' : 'border-slate-600'}`}>
                    <button
                      onClick={() => toggleSection(pos, `bucket-${bucket.id}`)}
                      className={`w-full flex items-center justify-between px-3 py-2 ${isLight ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-emerald-900/30 hover:bg-emerald-900/50'}`}
                    >
                      <span className={`font-medium text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{bucket.label}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${expandedSections[`${pos}-bucket-${bucket.id}`] ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-slate-400'}`}
                      />
                    </button>

                    {expandedSections[`${pos}-bucket-${bucket.id}`] && (
                      <div className="p-3">
                        {/* Auto-detected assignments from plays */}
                        {getAssignmentsForBucket(pos, bucket.id).length > 0 && (
                          <div className={`mb-3 p-2 rounded ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                            <span className={`text-xs font-medium block mb-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              Assignments from plays:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {getAssignmentsForBucket(pos, bucket.id).map(a => (
                                <span key={a} className={`px-2 py-0.5 text-xs rounded ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600/30 text-emerald-300'}`}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-end mb-2">
                          <button
                            onClick={() => setShowDrillModal({ pos, section: `bucket-${bucket.id}`, sectionLabel: bucket.label })}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Drill
                          </button>
                        </div>
                        {getDrills(pos, `bucket-${bucket.id}`).map(drill => (
                          <DrillItem key={drill.id} drill={drill} pos={pos} section={`bucket-${bucket.id}`} />
                        ))}
                        {getDrills(pos, `bucket-${bucket.id}`).length === 0 && getAssignmentsForBucket(pos, bucket.id).length === 0 && (
                          <p className={`text-xs italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No assignments or drills yet</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Drill Modal */}
      {showDrillModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-4 w-full max-w-md ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Add Drill - {showDrillModal.pos} {showDrillModal.sectionLabel || showDrillModal.level || ''}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addDrill(showDrillModal.pos, showDrillModal.section, {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  level: showDrillModal.level
                });
              }}
            >
              <div className="mb-3">
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Drill Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className={`w-full px-3 py-2 rounded border ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  placeholder="e.g., Kick-Slide Drill"
                />
              </div>
              <div className="mb-4">
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Description (optional)</label>
                <textarea
                  name="description"
                  className={`w-full px-3 py-2 rounded border resize-none ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDrillModal(null)}
                  className={`px-4 py-2 ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-slate-400 hover:text-white'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-500"
                >
                  Add Drill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Practice Segment Types Tab Component
// Segment Types are organized by phase (O, D, K, C)
const PRACTICE_PHASES = [
  { id: 'O', label: 'Offense', color: 'bg-blue-600', setupPhase: 'OFFENSE' },
  { id: 'D', label: 'Defense', color: 'bg-red-600', setupPhase: 'DEFENSE' },
  { id: 'K', label: 'Special Teams', color: 'bg-amber-600', setupPhase: 'SPECIAL_TEAMS' },
  { id: 'C', label: 'Competition/Conditioning', color: 'bg-emerald-600', setupPhase: null }
];

function SegmentTypesTab({ segmentTypes, onUpdate }) {
  const [activePhase, setActivePhase] = useState('O');
  const [editingType, setEditingType] = useState(null);

  const currentSegments = segmentTypes[activePhase] || [];

  const addSegmentType = () => {
    const name = prompt('New segment type (e.g., Team Run, Individual, 7-on-7):');
    if (!name || !name.trim()) return;

    const newType = {
      id: `type_${Date.now()}`,
      name: name.trim()
    };

    const updated = {
      ...segmentTypes,
      [activePhase]: [...currentSegments, newType]
    };
    onUpdate('practiceSegmentTypes', updated);
  };

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

  const deleteSegmentType = (typeId, typeName) => {
    if (!confirm(`Delete segment type "${typeName}"?`)) return;
    const updated = {
      ...segmentTypes,
      [activePhase]: currentSegments.filter(t => t.id !== typeId)
    };
    onUpdate('practiceSegmentTypes', updated);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Practice Segment Types</h3>
        <p className="text-slate-400 text-sm">
          Define segment types for each phase (e.g., Team Run, Individual, 7-on-7).
        </p>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 p-1 rounded-lg">
        {PRACTICE_PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePhase(p.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activePhase === p.id
              ? `${p.color} text-white`
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Segment Types List */}
      <div className="space-y-2">
        {currentSegments.map(segType => (
          <div
            key={segType.id}
            className="flex items-center gap-3 px-4 py-3 bg-slate-700/50 rounded-lg border border-slate-600 group"
          >
            {editingType === segType.id ? (
              <input
                id={`segment-type-name-${segType.id}`}
                autoFocus
                defaultValue={segType.name}
                onBlur={(e) => renameSegmentType(segType.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameSegmentType(segType.id, e.target.value);
                  if (e.key === 'Escape') setEditingType(null);
                }}
                aria-label="Segment type name"
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

            <button
              onClick={() => deleteSegmentType(segType.id, segType.name)}
              className="p-1.5 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete Segment Type"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {currentSegments.length === 0 && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
            <Layers size={48} className="mx-auto mb-4 opacity-30" />
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

// Segment Focus Tab Component
// Organized by Phase → Segment Type → Focus Items
const FOCUS_SOURCES = [
  { id: 'situations', label: 'Situations', icon: Target },
  { id: 'playBuckets', label: 'Play Buckets', icon: Tag },
  { id: 'conceptGroups', label: 'Concept Groups', icon: Grid },
  { id: 'formations', label: 'Formations', icon: LayoutGrid },
  { id: 'shiftMotions', label: 'Shifts/Motions', icon: ArrowRightLeft },
  { id: 'readTypes', label: 'Read Types', icon: Eye },
  { id: 'lookAlikeSeries', label: 'Series', icon: Copy },
  { id: 'qcPlayPurposes', label: 'QC Purposes', icon: ClipboardCheck },
  { id: 'custom', label: 'Custom', icon: Plus }
];

function SegmentFocusTab({
  segmentTypes,
  formations,
  playBuckets,
  readTypes,
  lookAlikeSeries,
  fieldZones,
  specialSituations,
  shiftMotions,
  qcPlayPurposes,
  onUpdate,
  isLight = false
}) {
  const [selectedPhase, setSelectedPhase] = useState('O');
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [customName, setCustomName] = useState('');

  // Get segment types for selected phase
  const phaseSegmentTypes = segmentTypes[selectedPhase] || [];

  // Get selected segment type
  const selectedType = phaseSegmentTypes.find(t => t.id === selectedTypeId);

  // Get current focus items for selected type
  const currentFocusItems = selectedType?.focusItems || [];

  // Get setup phase for filtering
  const setupPhase = PRACTICE_PHASES.find(p => p.id === selectedPhase)?.setupPhase;

  // Get items from source based on phase
  const getSourceItems = (sourceId) => {
    switch (sourceId) {
      case 'formations':
        return formations
          .filter(f => !setupPhase || f.phase === setupPhase)
          .map(f => ({ id: f.id || f.name, name: f.name || f.label, source: 'formations' }));
      case 'playBuckets':
        return playBuckets
          .filter(b => !setupPhase || b.phase === setupPhase)
          .map(b => ({ id: b.id, name: b.label, source: 'playBuckets' }));
      case 'conceptGroups':
        // Concept groups are derived from bucket families - filter by phase
        const phaseBuckets = playBuckets.filter(b => !setupPhase || b.phase === setupPhase);
        const groups = [];
        phaseBuckets.forEach(bucket => {
          (bucket.families || []).forEach(familyName => {
            groups.push({
              id: `${bucket.id}_${familyName}`,
              name: `${bucket.label}: ${familyName}`,
              bucketId: bucket.id,
              familyName: familyName,
              source: 'conceptGroups'
            });
          });
        });
        return groups;
      case 'readTypes':
        // Read types are offense-only
        if (selectedPhase !== 'O') return [];
        return readTypes.map(r => ({ id: r.id, name: r.name, source: 'readTypes' }));
      case 'lookAlikeSeries':
        // Look-alike series are offense-only
        if (selectedPhase !== 'O') return [];
        return lookAlikeSeries.map(s => ({ id: s.id, name: s.name, source: 'lookAlikeSeries' }));
      case 'situations':
        // Combine field zones and special situations
        const zones = (fieldZones || []).map(z => ({ id: z.id || z.name, name: z.name, source: 'fieldZones' }));
        const specials = (specialSituations || []).map(s => ({ id: s.id || s.name, name: s.name, source: 'specialSituations' }));
        return [...zones, ...specials];
      case 'shiftMotions':
        // Shifts/motions are offense-only
        if (selectedPhase !== 'O') return [];
        return (shiftMotions || []).map(sm => ({ id: sm.id || sm.name, name: sm.name, source: 'shiftMotions' }));
      case 'qcPlayPurposes':
        return (qcPlayPurposes || []).map(p => ({ id: p.id || p.name, name: p.name || p.label, source: 'qcPlayPurposes' }));
      default:
        return [];
    }
  };

  // Check if item is already added to selected type
  const isAdded = (itemId, source) => {
    return currentFocusItems.some(f => f.id === itemId && f.source === source);
  };

  // Update focus items for selected segment type
  const updateFocusItems = (newFocusItems) => {
    if (!selectedType) return;
    const updatedTypes = phaseSegmentTypes.map(t =>
      t.id === selectedTypeId ? { ...t, focusItems: newFocusItems } : t
    );
    onUpdate('practiceSegmentTypes', { ...segmentTypes, [selectedPhase]: updatedTypes });
  };

  // Add focus item
  const addFocusItem = (item) => {
    if (isAdded(item.id, item.source)) return;
    updateFocusItems([...currentFocusItems, item]);
  };

  // Add custom focus item
  const addCustomFocus = () => {
    if (!customName.trim()) return;
    const newItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      source: 'custom'
    };
    updateFocusItems([...currentFocusItems, newItem]);
    setCustomName('');
  };

  // Remove focus item
  const removeFocusItem = (itemId, source) => {
    updateFocusItems(currentFocusItems.filter(f => !(f.id === itemId && f.source === source)));
  };

  // Group current focus by source for display
  const groupedFocus = currentFocusItems.reduce((acc, item) => {
    const source = item.source || 'custom';
    if (!acc[source]) acc[source] = [];
    acc[source].push(item);
    return acc;
  }, {});

  // Auto-select first segment type when phase changes
  useEffect(() => {
    if (phaseSegmentTypes.length > 0 && !phaseSegmentTypes.find(t => t.id === selectedTypeId)) {
      setSelectedTypeId(phaseSegmentTypes[0]?.id || null);
    }
  }, [selectedPhase, phaseSegmentTypes, selectedTypeId]);

  // Get available sources for this phase (filter out offense-only for non-offense)
  const availableSources = FOCUS_SOURCES.filter(source => {
    if (selectedPhase === 'O') return true;
    // Hide offense-only sources for other phases
    return !['conceptGroups', 'readTypes', 'lookAlikeSeries', 'shiftMotions'].includes(source.id);
  });

  // Get focus mode for selected segment type (default to 'all')
  const selectedTypeFocusMode = selectedType?.focusMode || 'all';

  // Toggle focus mode for selected segment type
  const toggleSegmentFocusMode = () => {
    if (!selectedType) return;
    const newMode = selectedTypeFocusMode === 'all' ? 'custom' : 'all';
    const updatedTypes = phaseSegmentTypes.map(t =>
      t.id === selectedTypeId ? { ...t, focusMode: newMode } : t
    );
    onUpdate('practiceSegmentTypes', { ...segmentTypes, [selectedPhase]: updatedTypes });
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Segment Focus Items</h3>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Configure focus options for each segment type. These appear as selectable focuses when building practice plans.
        </p>
      </div>

      {/* Phase Selector */}
      <div className="flex gap-2 mb-4">
        {PRACTICE_PHASES.map(phase => (
          <button
            key={phase.id}
            onClick={() => setSelectedPhase(phase.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPhase === phase.id
                ? 'bg-sky-600 text-white'
                : isLight
                  ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Segment Types List */}
        <div className={`col-span-3 rounded-lg p-3 ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
          <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Segment Types
          </h4>
          {phaseSegmentTypes.length === 0 ? (
            <p className={`text-sm italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
              No segment types defined. Add them in the Segment Types tab.
            </p>
          ) : (
            <div className="space-y-1">
              {phaseSegmentTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedTypeId(type.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedTypeId === type.id
                      ? 'bg-sky-600 text-white'
                      : isLight
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{type.name}</span>
                    {(type.focusItems?.length || 0) > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        selectedTypeId === type.id
                          ? 'bg-sky-500'
                          : isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-600'
                      }`}>
                        {type.focusItems.length}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Focus Items Configuration */}
        <div className="col-span-9">
          {!selectedType ? (
            <div className={`rounded-lg p-8 text-center ${isLight ? 'bg-gray-50 text-gray-400 border border-gray-200' : 'bg-slate-800/30 text-slate-500'}`}>
              <Target size={48} className="mx-auto mb-4 opacity-30" />
              <p>Select a segment type to configure its focus options</p>
            </div>
          ) : (
            <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
              {/* Selected Type Header with Toggle */}
              <div className={`px-4 py-3 border-b ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-700/50 border-slate-600'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      Focus Options for: <span className="text-sky-500">{selectedType.name}</span>
                    </h4>
                    <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      {selectedTypeFocusMode === 'all' ? 'All options available' : `${currentFocusItems.length} custom item${currentFocusItems.length !== 1 ? 's' : ''} selected`}
                    </p>
                  </div>
                  {/* Per-Segment Toggle - Segmented Button */}
                  <div className={`flex rounded overflow-hidden border ${isLight ? 'border-gray-300' : 'border-slate-600'}`}>
                    <button
                      onClick={() => selectedTypeFocusMode !== 'all' && toggleSegmentFocusMode()}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        selectedTypeFocusMode === 'all'
                          ? 'bg-emerald-500 text-white'
                          : isLight ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => selectedTypeFocusMode !== 'custom' && toggleSegmentFocusMode()}
                      className={`px-3 py-1 text-xs font-medium transition-colors border-l ${
                        selectedTypeFocusMode === 'custom'
                          ? 'bg-sky-500 text-white border-sky-500'
                          : isLight ? 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border-slate-600'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>
              </div>

              {selectedTypeFocusMode === 'all' ? (
                /* All Options Mode for this segment */
                <div className={`p-6 text-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/10'}`}>
                  <Check size={32} className={`mx-auto mb-2 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                  <p className={`text-sm font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    All focus options available for {selectedType.name}
                  </p>
                  <p className={`text-xs mt-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                    All situations, buckets, concept groups, formations, etc. can be selected when building practice plans.
                  </p>
                </div>
              ) : (
                <>
                  {/* Current Focus Items */}
                  {currentFocusItems.length > 0 && (
                    <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                      <h5 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        Selected Focus Items
                      </h5>
                      <div className="space-y-2">
                        {Object.entries(groupedFocus).map(([source, items]) => {
                          const sourceInfo = FOCUS_SOURCES.find(s => s.id === source) ||
                            { label: source.charAt(0).toUpperCase() + source.slice(1), icon: Tag };
                          const Icon = sourceInfo.icon;
                          return (
                            <div key={source} className="flex items-start gap-2">
                              <div className={`flex items-center gap-1 min-w-[100px] ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                                <Icon size={12} />
                                <span className="text-xs">{sourceInfo.label}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 flex-1">
                                {items.map(item => (
                                  <div
                                    key={`${item.id}-${item.source}`}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs group ${
                                      isLight ? 'bg-sky-100 text-sky-700' : 'bg-slate-700 text-white'
                                    }`}
                                  >
                                    <span>{item.name}</span>
                                    <button
                                      onClick={() => removeFocusItem(item.id, item.source)}
                                      className="p-0.5 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All Sources - Scrollable List */}
                  <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
                    <p className={`text-sm mb-2 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      Click items to add them as focus options:
                    </p>

                {availableSources.filter(s => s.id !== 'custom').map(source => {
                  const Icon = source.icon;
                  const items = getSourceItems(source.id);

                  return (
                    <div key={source.id} className={`border rounded-lg overflow-hidden ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                      {/* Category Header */}
                      <div className={`flex items-center justify-between px-3 py-2 ${isLight ? 'bg-gray-50' : 'bg-slate-700/50'}`}>
                        <div className={`flex items-center gap-2 text-sm font-medium ${isLight ? 'text-gray-700' : 'text-white'}`}>
                          <Icon size={14} />
                          {source.label}
                          <span className={`px-1.5 py-0.5 rounded text-xs ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-600 text-slate-300'}`}>
                            {items.length}
                          </span>
                        </div>
                      </div>

                      {/* Category Items */}
                      <div className="p-2">
                        {items.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {items.map(item => {
                              const added = isAdded(item.id, item.source);
                              return (
                                <button
                                  key={`${item.id}-${item.source}`}
                                  onClick={() => !added && addFocusItem(item)}
                                  disabled={added}
                                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                                    added
                                      ? isLight
                                        ? 'bg-emerald-100 text-emerald-600 cursor-default'
                                        : 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                      : isLight
                                        ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-sky-300'
                                        : 'bg-slate-700 text-white hover:bg-slate-600'
                                  }`}
                                >
                                  {added && <Check size={10} className="inline mr-1" />}
                                  {item.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={`text-xs italic py-1 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                            No items defined yet
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Custom Focus Input */}
                <div className={`border rounded-lg overflow-hidden ${isLight ? 'border-gray-200' : 'border-slate-600'}`}>
                  <div className={`flex items-center gap-2 px-3 py-2 ${isLight ? 'bg-gray-50' : 'bg-slate-700/50'}`}>
                    <Plus size={14} className={isLight ? 'text-gray-700' : 'text-white'} />
                    <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-white'}`}>Custom</span>
                  </div>
                  <div className="p-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomFocus()}
                        placeholder="Add custom focus..."
                        className={`flex-1 px-2.5 py-1.5 border rounded text-xs ${
                          isLight
                            ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                            : 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                        }`}
                      />
                      <button
                        onClick={addCustomFocus}
                        disabled={!customName.trim()}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
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
                  id={`template-name-${template.id}`}
                  type="text"
                  value={template.name}
                  onChange={(e) => renameTemplate(template.id, e.target.value)}
                  className="font-semibold text-white bg-transparent border-none focus:outline-none flex-1"
                  aria-label="Template name"
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

function ProgramLevelsTab({ programLevels, personnelGroupings = [], staff, onUpdate }) {
  const [expandedLevel, setExpandedLevel] = useState(null);

  // Get the program default base personnel (the one marked as isBase)
  const defaultBasePersonnel = personnelGroupings.find(p => p.isBase) || personnelGroupings[0];

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
                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <label htmlFor={`level-name-${level.id}`} className="block text-sm font-medium text-slate-300 mb-2">Level Name</label>
                      <input
                        id={`level-name-${level.id}`}
                        type="text"
                        value={level.name}
                        onChange={(e) => updateLevel(level.id, { name: e.target.value })}
                        className="w-full max-w-xs px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* Base Personnel Override */}
                    {personnelGroupings.length > 0 && (
                      <div>
                        <label htmlFor={`level-personnel-${level.id}`} className="block text-sm font-medium text-slate-300 mb-2">
                          Base Personnel
                        </label>
                        <select
                          id={`level-personnel-${level.id}`}
                          value={level.basePersonnelId || ''}
                          onChange={(e) => updateLevel(level.id, { basePersonnelId: e.target.value || null })}
                          className="w-full max-w-xs px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="">
                            Use Program Default{defaultBasePersonnel ? ` (${defaultBasePersonnel.code || defaultBasePersonnel.name})` : ''}
                          </option>
                          {personnelGroupings.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.code ? `${p.code} - ${p.name}` : p.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                          Determines default positions shown on this level's depth chart.
                        </p>
                      </div>
                    )}
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
                              htmlFor={`level-staff-perm-${level.id}-${s.id}`}
                              className="flex items-center gap-3 p-2 bg-slate-600/50 rounded cursor-pointer hover:bg-slate-600"
                            >
                              <input
                                id={`level-staff-perm-${level.id}-${s.id}`}
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
                              htmlFor={`level-tool-${level.id}-${tool.key}`}
                              className="flex items-center gap-3 p-2 bg-slate-600/50 rounded cursor-pointer hover:bg-slate-600"
                            >
                              <input
                                id={`level-tool-${level.id}-${tool.key}`}
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
                      <label htmlFor={`level-focus-${level.id}`} className="block text-sm font-medium text-slate-300 mb-2">
                        Level Focus
                      </label>
                      <textarea
                        id={`level-focus-${level.id}`}
                        value={level.levelFocus || ''}
                        onChange={(e) => updateLevel(level.id, { levelFocus: e.target.value })}
                        placeholder="What is the primary focus for this level? (e.g., Development, fundamentals, game experience...)"
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-sky-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label htmlFor={`level-expectations-${level.id}`} className="block text-sm font-medium text-slate-300 mb-2">
                        Coach Expectations
                      </label>
                      <textarea
                        id={`level-expectations-${level.id}`}
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

// Default phases if none defined - includes default week counts and configurations
const DEFAULT_PHASES = [
  { id: 'offseason', name: 'Offseason', color: 'slate', order: 0, numWeeks: 0, isOffseason: true },
  { id: 'summer', name: 'Summer', color: 'amber', order: 1, numWeeks: 6, startDate: '' },
  { id: 'preseason', name: 'Preseason', color: 'purple', order: 2, numWeeks: 4, startDate: '' },
  { id: 'season', name: 'Regular Season', color: 'emerald', order: 3, numWeeks: 10, startDate: '' }
];

// Default week names for each phase (customizable templates)
const DEFAULT_WEEK_CONFIGS = {
  offseason: {
    // Offseason is a single special entry, not multiple weeks
    weeks: [{ name: 'Offseason', isOffseason: true }]
  },
  summer: {
    // Summer camp / 7-on-7 weeks
    weeks: [
      { name: 'Summer Week 1', weekNum: 1 },
      { name: 'Summer Week 2', weekNum: 2 },
      { name: 'Summer Week 3', weekNum: 3 },
      { name: 'Summer Week 4', weekNum: 4 },
      { name: 'Summer Week 5', weekNum: 5 },
      { name: 'Summer Week 6', weekNum: 6 }
    ]
  },
  preseason: {
    // Fall camp / preseason practice weeks
    weeks: [
      { name: 'Camp Week 1', weekNum: 1 },
      { name: 'Camp Week 2', weekNum: 2 },
      { name: 'Camp Week 3', weekNum: 3 },
      { name: 'Scrimmage Week', weekNum: 4 }
    ]
  },
  season: {
    // Regular season game weeks
    weeks: [
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
  }
};

// Helper function to generate default weeks for all phases
function generateDefaultWeeks(phases, activeYear) {
  const allWeeks = [];

  phases.forEach(phase => {
    const config = DEFAULT_WEEK_CONFIGS[phase.id];
    if (!config) return;

    config.weeks.forEach((weekConfig, index) => {
      // Calculate date if phase has a start date
      let date = null;
      if (phase.startDate && weekConfig.weekNum) {
        const start = new Date(phase.startDate);
        start.setDate(start.getDate() + ((weekConfig.weekNum - 1) * 7));
        date = start.toISOString().split('T')[0];
      }

      const week = {
        id: phase.id === 'offseason' ? 'offseason' : `${phase.id}_week_${weekConfig.weekNum || index + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: weekConfig.name,
        phaseId: phase.id,
        phaseName: phase.name,
        phaseColor: phase.color,
        weekNum: weekConfig.weekNum || 0,
        date: date,
        year: activeYear,
        isOffseason: weekConfig.isOffseason || false,
        opponent: weekConfig.opponent || '',
        createdAt: new Date().toISOString()
      };

      // Only add isHome for season weeks (where it's defined)
      if (typeof weekConfig.isHome === 'boolean') {
        week.isHome = weekConfig.isHome;
      }

      allWeeks.push(week);
    });
  });

  return allWeeks;
}

// Season Phases Tab Component - Define and configure season phases
function SeasonPhasesTab({ seasonPhases, onUpdate, isLight = false }) {
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
      <div className={`p-4 rounded-lg border ${isLight
        ? 'bg-sky-50 border-sky-300'
        : 'bg-sky-500/10 border-sky-500/30'
        }`}>
        <p className={`text-sm ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
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
              className={`rounded-lg border overflow-hidden ${isLight
                ? 'bg-white border-gray-300'
                : 'bg-slate-700/50 border-slate-600'
                }`}
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
                  id={`phase-name-${phase.id}`}
                  type="text"
                  value={phase.name}
                  onChange={e => updatePhase(phase.id, { name: e.target.value })}
                  className="bg-transparent text-white font-semibold border-none outline-none flex-1"
                  aria-label="Phase name"
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
                  <label htmlFor={`phase-color-${phase.id}`} className={`block text-xs font-medium uppercase mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Color</label>
                  <select
                    id={`phase-color-${phase.id}`}
                    value={phase.color}
                    onChange={e => updatePhase(phase.id, { color: e.target.value })}
                    className={`w-full px-3 py-2 border rounded text-sm ${isLight
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-slate-600 border-slate-500 text-white'
                      }`}
                  >
                    {PHASE_COLORS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label htmlFor={`phase-start-date-${phase.id}`} className={`block text-xs font-medium uppercase mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Start Date</label>
                  <input
                    id={`phase-start-date-${phase.id}`}
                    type="date"
                    value={phase.startDate || ''}
                    onChange={e => updatePhase(phase.id, { startDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded text-sm ${isLight
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-slate-600 border-slate-500 text-white'
                      }`}
                  />
                </div>

                {/* Number of Weeks */}
                <div>
                  <label htmlFor={`phase-num-weeks-${phase.id}`} className={`block text-xs font-medium uppercase mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Number of Weeks</label>
                  <input
                    id={`phase-num-weeks-${phase.id}`}
                    type="number"
                    value={phase.numWeeks || ''}
                    onChange={e => updatePhase(phase.id, { numWeeks: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="52"
                    className={`w-full px-3 py-2 border rounded text-sm ${isLight
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-slate-600 border-slate-500 text-white'
                      }`}
                  />
                </div>

                {/* Date Range Display */}
                <div>
                  <label className={`block text-xs font-medium uppercase mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Date Range</label>
                  <div className={`px-3 py-2 border rounded text-sm ${isLight
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-slate-800/50 border-slate-600'
                    }`}>
                    {phase.startDate ? (
                      <span className={isLight ? 'text-gray-900' : 'text-white'}>
                        {formatDate(phase.startDate)} — {endDate ? formatDate(endDate) : '...'}
                      </span>
                    ) : (
                      <span className={isLight ? 'text-gray-500' : 'text-slate-500'}>Set start date</span>
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

  // Initialize all default weeks for the season
  const initializeSeason = () => {
    if (weeks.length > 0) {
      if (!confirm('This will add default weeks for all phases. Existing weeks will be kept. Continue?')) return;
    }

    const existingPhaseWeekNums = {};
    weeks.forEach(w => {
      if (!existingPhaseWeekNums[w.phaseId]) existingPhaseWeekNums[w.phaseId] = new Set();
      existingPhaseWeekNums[w.phaseId].add(w.weekNum);
    });

    const newWeeks = [];
    phases.forEach(phase => {
      const config = DEFAULT_WEEK_CONFIGS[phase.id];
      if (!config) return;

      config.weeks.forEach((weekConfig, index) => {
        // Skip if this week number already exists for this phase
        const weekNum = weekConfig.weekNum || 0;
        if (existingPhaseWeekNums[phase.id]?.has(weekNum)) return;

        // Calculate date if phase has a start date
        let date = null;
        if (phase.startDate && weekNum) {
          const start = new Date(phase.startDate);
          start.setDate(start.getDate() + ((weekNum - 1) * 7));
          date = start.toISOString().split('T')[0];
        }

        const week = {
          id: phase.id === 'offseason' && weekConfig.isOffseason ? 'offseason' : `${phase.id}_week_${weekNum}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: weekConfig.name,
          phaseId: phase.id,
          phaseName: phase.name,
          phaseColor: phase.color,
          weekNum: weekNum,
          date: date,
          year: activeYear,
          isOffseason: weekConfig.isOffseason || false,
          opponent: weekConfig.opponent || '',
          createdAt: new Date().toISOString()
        };

        // Only add isHome for season weeks (where it's defined)
        if (typeof weekConfig.isHome === 'boolean') {
          week.isHome = weekConfig.isHome;
        }

        newWeeks.push(week);
      });
    });

    if (newWeeks.length === 0) {
      alert('All default weeks already exist.');
      return;
    }

    onUpdateWeeks([...weeks, ...newWeeks]);
  };

  // Calculate total expected weeks for comparison
  const totalExpectedWeeks = phases.reduce((sum, p) => {
    const config = DEFAULT_WEEK_CONFIGS[p.id];
    return sum + (config?.weeks?.length || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Season Weeks Info Banner */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Calendar size={20} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {weeks.length} Week{weeks.length !== 1 ? 's' : ''} Configured
              </h3>
              <p className="text-slate-500 text-xs">
                Edit names, opponents, and dates below
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {weeks.length < totalExpectedWeeks && (
              <button
                onClick={initializeSeason}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-colors"
              >
                <Plus size={14} />
                Add Missing Weeks
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Reset all weeks to defaults? This will remove any custom weeks and opponents.')) {
                  const year = activeYear || new Date().getFullYear().toString();
                  const defaultWeeks = generateDefaultWeeks(phases, year);
                  onUpdateWeeks(defaultWeeks);
                }
              }}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            id="season-schedule-filter-phase"
            value={filterPhase}
            onChange={e => setFilterPhase(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            aria-label="Filter by phase"
          >
            <option value="all">All Phases</option>
            {phases.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            id="season-schedule-filter-level"
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            aria-label="Filter by level"
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
              <label htmlFor="week-edit-phase" className="block text-sm font-medium text-slate-300 mb-1">Phase</label>
              <select
                id="week-edit-phase"
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
              <label htmlFor="week-edit-week-num" className="block text-sm font-medium text-slate-300 mb-1">Week #</label>
              <input
                id="week-edit-week-num"
                type="number"
                value={formData.weekNum}
                onChange={e => setFormData({ ...formData, weekNum: e.target.value, dateOverride: false })}
                min="1"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="week-edit-name" className="block text-sm font-medium text-slate-300 mb-1">Week Name *</label>
            <input
              id="week-edit-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Regular Season Week 1"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="week-edit-opponent" className="block text-sm font-medium text-slate-300 mb-1">Opponent</label>
              <input
                id="week-edit-opponent"
                type="text"
                value={formData.opponent}
                onChange={e => setFormData({ ...formData, opponent: e.target.value })}
                placeholder="e.g., Rival High"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label htmlFor="week-edit-home-away" className="block text-sm font-medium text-slate-300 mb-1">Home/Away</label>
              <select
                id="week-edit-home-away"
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
              <label htmlFor="week-edit-start-date" className="block text-sm font-medium text-slate-300 mb-1">
                Week Start Date
                {!formData.dateOverride && formData.date && (
                  <span className="text-xs text-emerald-400 ml-2">(auto-calculated)</span>
                )}
              </label>
              <input
                id="week-edit-start-date"
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
              <label htmlFor="week-edit-level" className="block text-sm font-medium text-slate-300 mb-1">Program Level</label>
              <select
                id="week-edit-level"
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
            <label htmlFor="week-edit-notes" className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              id="week-edit-notes"
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
              <label htmlFor="event-edit-name" className="block text-sm font-medium text-slate-300 mb-1">Event Name *</label>
              <input
                id="event-edit-name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., End of Season Banquet"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="event-edit-type" className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                id="event-edit-type"
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
              <label htmlFor="event-edit-date" className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input
                id="event-edit-date"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label htmlFor="event-edit-time" className="block text-sm font-medium text-slate-300 mb-1">Time</label>
              <input
                id="event-edit-time"
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="event-edit-location" className="block text-sm font-medium text-slate-300 mb-1">Location</label>
            <input
              id="event-edit-location"
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., School Cafeteria"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          <div>
            <label htmlFor="event-edit-notes" className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              id="event-edit-notes"
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

// Quality Control Definitions Tab
function QualityControlDefinitionsTab({ qualityControlDefinitions, onUpdate, isLight = false }) {
  const defaults = {
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
  };

  const config = { ...defaults, ...qualityControlDefinitions };

  const updateQCConfig = (key, value) => {
    onUpdate('qualityControlDefinitions', {
      ...qualityControlDefinitions,
      [key]: value
    });
  };

  // Efficiency threshold update
  const updateEfficiencyThreshold = (down, bucket, value) => {
    const current = config.efficiencyThresholds || {};
    updateQCConfig('efficiencyThresholds', {
      ...current,
      [down]: {
        ...(current[down] || {}),
        [bucket]: parseInt(value) || 0
      }
    });
  };

  // Explosive threshold update
  const updateExplosiveThreshold = (bucket, value) => {
    const current = config.explosiveThresholds || {};
    updateQCConfig('explosiveThresholds', {
      ...current,
      [bucket]: parseInt(value) || 0
    });
  };

  // Minimum volume update
  const updateMinimumVolume = (type, value) => {
    const current = config.minimumVolume || {};
    updateQCConfig('minimumVolume', {
      ...current,
      [type]: parseInt(value) || 1
    });
  };

  return (
    <div className="space-y-8">
      {/* Help Section */}
      <HelpSection title="What are Quality Control Definitions?" isLight={isLight}>
        <div className="pt-3 space-y-3">
          <p>
            These settings power the <strong className={isLight ? "text-slate-900" : "text-white"}>X&O Quality Control</strong> tool in your Weekly Tools.
            They define what constitutes "efficient" or "explosive" performance for self-scouting purposes.
          </p>
          <p>
            <strong className={isLight ? "text-slate-900" : "text-white"}>Efficiency Thresholds</strong> define success by down. 1st down typically needs
            4+ yards, while 2nd/3rd need a percentage of remaining distance.
          </p>
        </div>
      </HelpSection>

      {/* Efficiency Thresholds Section */}
      <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
        <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h3 className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Efficiency Thresholds</h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Define what counts as an efficient play by down. 1st down = yards needed, 2nd-4th = % of distance.
          </p>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className={`px-3 py-2 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Down</th>
                <th className={`px-3 py-2 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Run</th>
                <th className={`px-3 py-2 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pass</th>
                <th className={`px-3 py-2 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Screen</th>
                <th className={`px-3 py-2 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Default</th>
              </tr>
            </thead>
            <tbody>
              {['1st', '2nd', '3rd', '4th'].map(down => (
                <tr key={down} className={`border-t ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
                  <td className={`px-3 py-2 font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {down}
                    <span className="text-xs text-slate-500 ml-2">
                      {down === '1st' ? '(yards)' : '(% of dist)'}
                    </span>
                  </td>
                  {['run', 'pass', 'screen', 'default'].map(bucket => (
                    <td key={bucket} className="px-3 py-2">
                      <input
                        id={`efficiency-${down}-${bucket}`}
                        type="number"
                        min="0"
                        max={down === '1st' ? 20 : 100}
                        value={config.efficiencyThresholds?.[down]?.[bucket] ?? defaults.efficiencyThresholds[down][bucket]}
                        onChange={(e) => updateEfficiencyThreshold(down, bucket, e.target.value)}
                        aria-label={`${down} ${bucket} efficiency threshold`}
                        className={`w-16 px-2 py-1 border rounded text-center ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explosive Thresholds Section */}
      <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
        <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h3 className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Explosive Thresholds</h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Minimum yards for a play to count as "explosive"</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {['run', 'pass', 'screen', 'default'].map(bucket => (
              <div key={bucket}>
                <label htmlFor={`explosive-${bucket}`} className={`block text-xs mb-1 capitalize ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{bucket}</label>
                <div className="flex items-center gap-2">
                  <input
                    id={`explosive-${bucket}`}
                    type="number"
                    min="0"
                    value={config.explosiveThresholds?.[bucket] ?? defaults.explosiveThresholds[bucket]}
                    onChange={(e) => updateExplosiveThreshold(bucket, e.target.value)}
                    className={`w-20 px-2 py-1.5 border rounded text-center ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-700 border-slate-600 text-white'}`}
                  />
                  <span className="text-xs text-slate-500">yards</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Minimum Volume Section */}
      <div className={`rounded-lg border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
        <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h3 className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Minimum Volume for Analysis</h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            How many reps/calls before play-level stats are meaningful
          </p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="qc-min-volume-practice" className={`block text-sm mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Practice (min reps)</label>
              <input
                id="qc-min-volume-practice"
                type="number"
                min="1"
                value={config.minimumVolume?.practice ?? 3}
                onChange={(e) => updateMinimumVolume('practice', e.target.value)}
                className={`w-24 px-3 py-2 border rounded text-center ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-700 border-slate-600 text-white'}`}
              />
            </div>
            <div>
              <label htmlFor="qc-min-volume-game" className={`block text-sm mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Game (min calls)</label>
              <input
                id="qc-min-volume-game"
                type="number"
                min="1"
                value={config.minimumVolume?.game ?? 2}
                onChange={(e) => updateMinimumVolume('game', e.target.value)}
                className={`w-24 px-3 py-2 border rounded text-center ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-700 border-slate-600 text-white'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
