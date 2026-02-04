// System Setup Wizard Step Definitions
// Guides coaches through offensive system configuration in logical order

/**
 * 13 Steps for Offensive System Setup
 * Each step maps to a tab in Setup.jsx and includes audio script content
 */
export const SYSTEM_SETUP_STEPS = [
  {
    id: 'positions',
    order: 1,
    tabId: 'positions',
    title: 'Name Positions',
    estimatedMinutes: 3,
    dependencies: [],
    audio: {
      intro: "Let's start with the foundation of your system: position names.",
      why: "Every play, depth chart, and practice script will use these labels. Consistent terminology prevents confusion across your staff and players.",
      connection: "If your offense calls the slot receiver 'Y' instead of 'Slot', set it here and it flows through the entire app—playbook, wristbands, scripts, everything.",
      tip: "Focus on your 11 core offensive positions first. You can always add specialty positions like 'F-back' or 'Sniffer' later."
    }
  },
  {
    id: 'personnel',
    order: 2,
    tabId: 'personnel',
    title: 'Personnel Groupings',
    estimatedMinutes: 2,
    dependencies: ['positions'],
    audio: {
      intro: "Now let's define your personnel packages—the combinations of players you put on the field.",
      why: "Personnel groupings like '11' or '12' tell everyone instantly who's in the game. They're the shorthand your staff will use in game planning.",
      connection: "These packages link directly to your formations. When you build plays, you'll tag them with personnel so you can filter by package in your call sheet.",
      tip: "Start with your 3-4 most common groupings. You can always add exotic packages later as your system evolves."
    }
  },
  {
    id: 'play-buckets',
    order: 3,
    tabId: 'play-buckets',
    title: 'Define Play Buckets',
    estimatedMinutes: 2,
    dependencies: [],
    audio: {
      intro: "Play buckets are the high-level categories that organize your entire playbook.",
      why: "Categories like Run, Pass, RPO, and Screen provide the top-level structure. Good buckets make it easy to find plays quickly and analyze your scheme balance.",
      connection: "Every play you enter will be tagged with a bucket. These power the filtering in your playbook, game plan, and self-scout analytics.",
      tip: "Keep it simple—4 to 6 buckets is usually enough. You'll add more specific groupings within each bucket next."
    }
  },
  {
    id: 'formations',
    order: 4,
    tabId: 'formations',
    title: 'Formations',
    estimatedMinutes: 5,
    dependencies: ['positions', 'personnel'],
    audio: {
      intro: "Formations are the alignments your offense operates from. This is where your system really takes shape.",
      why: "A well-organized formation library speeds up play entry and ensures consistent naming across all coaches using the system.",
      connection: "Formations tie to personnel packages and appear everywhere: playbook, wristbands, practice scripts, and game planning. They're also used for self-scout tendencies.",
      tip: "Group similar formations together—all your 2x2 sets, all your trips formations. Tag them with personnel packages so filtering works smoothly."
    }
  },
  {
    id: 'shifts-motions',
    order: 5,
    tabId: 'shifts-motions',
    title: 'Shifts & Motions',
    estimatedMinutes: 3,
    dependencies: ['formations'],
    audio: {
      intro: "Shifts and motions are the pre-snap movements that make your offense dynamic.",
      why: "Standardized motion names ensure everyone speaks the same language. 'Jet' means the same thing to your QB, receivers, and offensive line.",
      connection: "Motions can be tagged on plays and used for filtering. They also power tendency analysis in self-scout—are you tipping plays with certain motions?",
      tip: "Name them based on what they do, not who does them. 'Orbit' is clearer than 'Z motion' because the position doing it might change by formation."
    }
  },
  {
    id: 'read-types',
    order: 6,
    tabId: 'read-types',
    title: 'Read Types',
    estimatedMinutes: 2,
    dependencies: [],
    audio: {
      intro: "Read types categorize how your quarterback processes each play.",
      why: "Understanding your read distribution helps balance the mental load on your QB. Too many post-snap reads in a row can lead to hesitation.",
      connection: "Tag plays with read types to analyze what you're asking from your quarterback. This feeds into game planning and self-scout reports.",
      tip: "Think about pre-snap versus post-snap, and whether it's a give read, pull read, or pass-run option. Keep categories broad enough to be useful."
    }
  },
  {
    id: 'concept-groups',
    order: 7,
    tabId: 'concept-groups',
    title: 'Concepts/Groups',
    estimatedMinutes: 4,
    dependencies: ['play-buckets'],
    audio: {
      intro: "Within each play bucket, concept groups organize your specific schemes and concepts.",
      why: "This is the second level of organization. Under 'Run', you might have Inside Zone, Outside Zone, Power, Counter. Under 'Pass', you have your route concepts.",
      connection: "Concept groups help track what's installed, what needs reps, and how your scheme is organized. They appear in your playbook filters and install tracking.",
      tip: "Match your actual terminology. If you call it 'Duo' not 'Power', use 'Duo'. The app should speak your language."
    }
  },
  {
    id: 'situations',
    order: 8,
    tabId: 'situations',
    title: 'Define Situations',
    estimatedMinutes: 4,
    dependencies: [],
    audio: {
      intro: "Situations let you tag plays for specific game scenarios—red zone, third and long, two-minute offense.",
      why: "When it's third and seven in the fourth quarter, you need to find the right call fast. Situation tags make that possible.",
      connection: "These categories appear in your playbook filters and game plan organization. Tag plays once, filter them forever.",
      tip: "Include field zones, down-and-distance categories, and special situations. Think about how you actually call games—what categories do you think in?"
    }
  },
  {
    id: 'look-alike-series',
    order: 9,
    tabId: 'look-alike-series',
    title: 'Look-Alike Series',
    estimatedMinutes: 3,
    dependencies: ['formations', 'play-buckets'],
    audio: {
      intro: "Look-alike series group plays that appear identical pre-snap but have different outcomes.",
      why: "This is constraint football. When Inside Zone, Play Action Boot, and Zone Read all look the same, defenders can't key on backfield action.",
      connection: "Series tags help with install planning—teach plays together that share the same look. The carryover reduces teaching time and multiplies confusion for defenses.",
      tip: "Start with your base run plays and build out from there. What play action comes off each run? What RPO? That's your series."
    }
  },
  {
    id: 'oline-schemes',
    order: 10,
    tabId: 'oline-schemes',
    title: 'WIZ Library (OL)',
    estimatedMinutes: 5,
    dependencies: ['positions'],
    audio: {
      intro: "The WIZ library defines your offensive line blocking schemes and protection calls.",
      why: "WIZ stands for 'What I Z'—the assignment each lineman has. A centralized library ensures your OL coach and skill coaches speak the same language.",
      connection: "Protection and scheme names can be tagged on plays. This powers OL-specific views in game planning and helps with installation tracking.",
      tip: "Separate pass protections from run schemes. For protections, define slide direction and man-side. For runs, name your gap and zone schemes."
    }
  },
  {
    id: 'play-call-chain',
    order: 11,
    tabId: 'play-call-chain',
    title: 'Play Call Chain',
    estimatedMinutes: 3,
    dependencies: [],
    audio: {
      intro: "The play call chain documents your play calling syntax—the order and structure of how plays are communicated.",
      why: "This is your Rosetta Stone. Whether it's Formation-Motion-Play-Tag or something else, documenting it helps everyone understand the system.",
      connection: "This is primarily a planning and documentation tool. It helps onboard new staff and ensures consistent communication from press box to field.",
      tip: "Map out a few example calls to make sure your chain covers everything. Does it handle audibles? Check-with-me's? Make it comprehensive."
    }
  },
  {
    id: 'wristband-abbreviations',
    order: 12,
    tabId: 'wristband-abbreviations',
    title: 'Parse & Abbreviate',
    estimatedMinutes: 5,
    dependencies: [],
    audio: {
      intro: "Parse and Abbreviate is where you scan your playbook to extract terms and create short versions for wristbands.",
      why: "Wristband space is limited. 'SPREAD RT FLANKER DRIVE Z CORNER' needs to become something a player can read in two seconds.",
      connection: "Abbreviations flow directly to your wristband builder and game plan boxes. Categorized terms also populate your glossary.",
      tip: "Use 'Scan Plays' to automatically extract terms from your playbook. Then merge multi-word terms and set abbreviations. Auto-generate handles common cases."
    }
  },
  {
    id: 'glossary',
    order: 13,
    tabId: 'glossary',
    title: 'Glossary',
    estimatedMinutes: 3,
    dependencies: ['wristband-abbreviations'],
    audio: {
      intro: "The glossary is your system's dictionary—definitions for every term your program uses.",
      why: "Every program has unique terminology. A living glossary ensures everyone speaks the same language and serves as an onboarding tool for new staff and players.",
      connection: "Terms come from Parse and Abbreviate. Add definitions here to create a reference document. Export it for your playbook or staff manual.",
      tip: "Focus on terms that aren't obvious. 'Trips' is self-explanatory, but 'Nashville' or 'Dragon' might need definitions. Include diagrams where helpful."
    }
  }
];

/**
 * Get step by ID
 * @param {string} id - Step ID (e.g., 'positions')
 * @returns {Object|null} Step object or null if not found
 */
export const getStepById = (id) => {
  return SYSTEM_SETUP_STEPS.find(step => step.id === id) || null;
};

/**
 * Get step by order number (1-indexed)
 * @param {number} order - Step order (1-13)
 * @returns {Object|null} Step object or null if not found
 */
export const getStepByOrder = (order) => {
  return SYSTEM_SETUP_STEPS.find(step => step.order === order) || null;
};

/**
 * Get full audio script as a single string
 * @param {Object} step - Step object
 * @returns {string} Combined audio script
 */
export const getFullAudioScript = (step) => {
  if (!step?.audio) return '';
  const { intro, why, connection, tip } = step.audio;
  return [intro, why, connection, tip].filter(Boolean).join(' ');
};

/**
 * Get total number of steps
 */
export const TOTAL_SYSTEM_SETUP_STEPS = SYSTEM_SETUP_STEPS.length;

/**
 * Get estimated total time in minutes
 */
export const getTotalEstimatedMinutes = () => {
  return SYSTEM_SETUP_STEPS.reduce((sum, step) => sum + step.estimatedMinutes, 0);
};

/**
 * Get step IDs that are dependencies for a given step
 * @param {string} stepId - Step ID
 * @returns {string[]} Array of dependency step IDs
 */
export const getStepDependencies = (stepId) => {
  const step = getStepById(stepId);
  return step?.dependencies || [];
};

/**
 * Check if all dependencies for a step are completed
 * @param {string} stepId - Step ID
 * @param {string[]} completedSteps - Array of completed step IDs
 * @returns {boolean}
 */
export const areDependenciesMet = (stepId, completedSteps = []) => {
  const deps = getStepDependencies(stepId);
  return deps.every(depId => completedSteps.includes(depId));
};

export default SYSTEM_SETUP_STEPS;
