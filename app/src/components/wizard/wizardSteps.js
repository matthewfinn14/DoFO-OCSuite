// Voice Wizard Step Definitions
// Maps culture fields to voice prompts

export const WIZARD_STEPS = [
  // Core Identity (4 steps)
  {
    id: 'seasonMotto',
    category: 'Core Identity',
    field: 'seasonMotto',
    label: 'Season Motto',
    prompt: 'What is your season theme or motto?',
    placeholder: 'e.g., "All In", "Championship Mindset", "Finish Strong"',
    examples: ['All In', 'One Team, One Dream', 'Relentless'],
  },
  {
    id: 'teamMission',
    category: 'Core Identity',
    field: 'teamMission',
    label: 'Team Mission',
    prompt: 'Describe your team\'s mission or purpose.',
    placeholder: 'What is your team\'s purpose?',
    examples: ['To develop young men of character through competition'],
  },
  {
    id: 'teamVision',
    category: 'Core Identity',
    field: 'teamVision',
    label: 'Team Vision',
    prompt: 'Where is your program headed? Describe your vision.',
    placeholder: 'Where is your team going?',
    examples: ['To be the standard of excellence in our conference'],
  },
  {
    id: 'teamNonNegotiables',
    category: 'Core Identity',
    field: 'teamNonNegotiables',
    label: 'Core Values',
    prompt: 'What values define your program? List your non-negotiables.',
    placeholder: 'What values define your program?',
    examples: ['Effort, Attitude, Toughness, Discipline'],
  },

  // Philosophies (3 steps)
  {
    id: 'offensePhilosophy',
    category: 'Philosophies',
    field: 'offensePhilosophy',
    label: 'Offense Philosophy',
    prompt: 'How does your team attack? Describe your offensive philosophy.',
    placeholder: 'How do we attack?',
    examples: ['Physical, downhill running game that sets up play action'],
  },
  {
    id: 'defensePhilosophy',
    category: 'Philosophies',
    field: 'defensePhilosophy',
    label: 'Defense Philosophy',
    prompt: 'How do you stop opponents? Describe your defensive philosophy.',
    placeholder: 'How do we stop them?',
    examples: ['Aggressive, attacking style that creates negative plays'],
  },
  {
    id: 'specialTeamsPhilosophy',
    category: 'Philosophies',
    field: 'specialTeamsPhilosophy',
    label: 'Special Teams Philosophy',
    prompt: 'How do you win the hidden game? Describe your special teams philosophy.',
    placeholder: 'How do we win the hidden game?',
    examples: ['Field position and momentum through effort and execution'],
  },

  // Standards (9 steps)
  {
    id: 'standards_practice',
    category: 'Standards',
    field: 'standards.practice',
    label: 'Practice Standards',
    prompt: 'What are your practice expectations?',
    placeholder: 'Practice expectations...',
    examples: ['Full speed, no loafing, communicate on every rep'],
  },
  {
    id: 'standards_meeting',
    category: 'Standards',
    field: 'standards.meeting',
    label: 'Meeting Standards',
    prompt: 'What are your meeting room and film study expectations?',
    placeholder: 'Meeting room expectations...',
    examples: ['On time, engaged, taking notes, asking questions'],
  },
  {
    id: 'standards_weightRoom',
    category: 'Standards',
    field: 'standards.weightRoom',
    label: 'Weight Room Standards',
    prompt: 'What are your weight room expectations?',
    placeholder: 'Weight room expectations...',
    examples: ['Max effort, proper form, encourage teammates'],
  },
  {
    id: 'standards_life',
    category: 'Standards',
    field: 'standards.life',
    label: 'Life Standards',
    prompt: 'What are your off-field expectations for players?',
    placeholder: 'Off-field expectations...',
    examples: ['Represent the program well in all aspects of life'],
  },
  {
    id: 'standards_school',
    category: 'Standards',
    field: 'standards.school',
    label: 'School Standards',
    prompt: 'What are your academic expectations?',
    placeholder: 'Academic expectations...',
    examples: ['Attend class, sit in front, communicate with teachers'],
  },
  {
    id: 'standards_travel',
    category: 'Standards',
    field: 'standards.travel',
    label: 'Travel Standards',
    prompt: 'What are your travel expectations?',
    placeholder: 'Travel expectations...',
    examples: ['Professional dress, be early, represent the program'],
  },
  {
    id: 'standards_communication',
    category: 'Standards',
    field: 'standards.communication',
    label: 'Communication Standards',
    prompt: 'What are your communication expectations?',
    placeholder: 'Communication expectations...',
    examples: ['Respond within 24 hours, be direct and respectful'],
  },
  {
    id: 'standards_bodyLanguage',
    category: 'Standards',
    field: 'standards.bodyLanguage',
    label: 'Body Language Standards',
    prompt: 'What body language do you expect from players?',
    placeholder: 'Body language standards...',
    examples: ['Eye contact, shoulders back, never hang your head'],
  },
  {
    id: 'standards_facilities',
    category: 'Standards',
    field: 'standards.facilities',
    label: 'Facilities Standards',
    prompt: 'What are your facilities usage standards?',
    placeholder: 'Facilities usage standards...',
    examples: ['Leave it better than you found it, respect the space'],
  },

  // Coaches' Expectations (1 step)
  {
    id: 'coachesExpectations',
    category: 'Coaches',
    field: 'coachesExpectations',
    label: "Coaches' Expectations",
    prompt: 'What do you expect from your coaching staff?',
    placeholder: 'What do we expect from our coaches?',
    examples: ['Be prepared, be positive, hold players accountable'],
  },

  // Position Big Three (9 steps - 3 for each unit)
  {
    id: 'bigThree_OVERALL_OFF',
    category: 'Position Big Three',
    field: 'positionBigThree.OVERALL_OFF',
    label: 'Overall Offense Big 3',
    prompt: 'What are the three most important focus areas for your offense?',
    placeholder: 'Top 3 offensive priorities...',
    examples: ['Protect the football', 'Win the line of scrimmage', 'Finish drives'],
    isArray: true,
  },
  {
    id: 'bigThree_OVERALL_DEF',
    category: 'Position Big Three',
    field: 'positionBigThree.OVERALL_DEF',
    label: 'Overall Defense Big 3',
    prompt: 'What are the three most important focus areas for your defense?',
    placeholder: 'Top 3 defensive priorities...',
    examples: ['Stop the run', 'Create turnovers', 'Tackle in space'],
    isArray: true,
  },
  {
    id: 'bigThree_OVERALL_ST',
    category: 'Position Big Three',
    field: 'positionBigThree.OVERALL_ST',
    label: 'Overall Special Teams Big 3',
    prompt: 'What are the three most important focus areas for special teams?',
    placeholder: 'Top 3 special teams priorities...',
    examples: ['Win field position', 'No penalties', 'Maximum effort'],
    isArray: true,
  },
];

// Get unique categories in order
export const WIZARD_CATEGORIES = [...new Set(WIZARD_STEPS.map(s => s.category))];

// Get steps by category
export const getStepsByCategory = (category) =>
  WIZARD_STEPS.filter(s => s.category === category);

// Get step by index
export const getStepByIndex = (index) => WIZARD_STEPS[index] || null;

// Get total step count
export const TOTAL_STEPS = WIZARD_STEPS.length;

// Helper to get/set nested field values
export const getFieldValue = (culture, field) => {
  if (!field.includes('.')) {
    return culture?.[field] || '';
  }
  const parts = field.split('.');
  let value = culture;
  for (const part of parts) {
    value = value?.[part];
  }
  return value || (field.includes('BigThree') ? ['', '', ''] : '');
};

export const setFieldValue = (culture, field, value) => {
  if (!field.includes('.')) {
    return { ...culture, [field]: value };
  }
  const parts = field.split('.');
  const result = { ...culture };
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = { ...current[parts[i]] };
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;

  return result;
};
