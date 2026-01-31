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
