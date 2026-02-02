/**
 * Play Display Utilities
 *
 * Consistent formatting for play calls across the application.
 * The full play call should ALWAYS include the formation when present.
 */

/**
 * Get the full play call string (formation + play name)
 *
 * @param {Object} play - Play object with name and optional formation
 * @returns {string} Full play call (e.g., "TRIPS RT POWER" or just "POWER" if no formation)
 */
export function getPlayCall(play) {
  if (!play) return '';

  const formation = play.formation?.trim();
  const name = play.name?.trim() || '';

  if (formation) {
    return `${formation} ${name}`;
  }

  return name;
}

/**
 * Get display parts for a play call (useful for styled display)
 *
 * @param {Object} play - Play object
 * @returns {Object} { formation: string, name: string, full: string }
 */
export function getPlayCallParts(play) {
  if (!play) return { formation: '', name: '', full: '' };

  const formation = play.formation?.trim() || '';
  const name = play.name?.trim() || '';
  const full = formation ? `${formation} ${name}` : name;

  return { formation, name, full };
}

/**
 * Apply abbreviations to a play call string
 *
 * @param {string} playCall - The full play call string
 * @param {Object} abbreviations - Map of term -> abbreviation (e.g., { "TRIPS": "TRP", "RIGHT": "RT" })
 * @returns {string} Abbreviated play call
 */
export function abbreviatePlayCall(playCall, abbreviations) {
  if (!playCall || !abbreviations || Object.keys(abbreviations).length === 0) {
    return playCall;
  }

  // Split into words, apply abbreviations, rejoin
  const words = playCall.split(/\s+/);
  const abbreviated = words.map(word => {
    // Try exact match first (case-insensitive lookup)
    const upper = word.toUpperCase();
    const lower = word.toLowerCase();

    // Check for exact match in various cases
    if (abbreviations[word]) return abbreviations[word];
    if (abbreviations[upper]) return abbreviations[upper];
    if (abbreviations[lower]) return abbreviations[lower];

    // Check for case-insensitive match
    for (const [term, abbrev] of Object.entries(abbreviations)) {
      if (term.toUpperCase() === upper) {
        return abbrev;
      }
    }

    return word;
  });

  return abbreviated.join(' ');
}

/**
 * Get an abbreviated play display name
 *
 * @param {Object} play - Play object
 * @param {Object} abbreviations - Map of term -> abbreviation
 * @returns {string} Abbreviated play call
 */
export function getAbbreviatedPlayCall(play, abbreviations) {
  const fullCall = getPlayCall(play);
  return abbreviatePlayCall(fullCall, abbreviations);
}
