/**
 * Depth Chart Position Utilities
 *
 * Generates depth chart positions from ALL active positions defined in Setup.
 * Uses the full positions list (defaults + custom - hidden) to ensure every
 * position appears on the depth chart.
 *
 * The base personnel is still tracked for UI purposes but doesn't limit
 * which positions appear on the depth chart.
 */

// OL positions are always included
const OL_POSITIONS = [
  { id: 'LT', label: 'LT', depth: 3 },
  { id: 'LG', label: 'LG', depth: 3 },
  { id: 'C', label: 'C', depth: 3 },
  { id: 'RG', label: 'RG', depth: 3 },
  { id: 'RT', label: 'RT', depth: 3 }
];

// OL position keys to exclude from skill positions
const OL_POSITION_KEYS = ['LT', 'LG', 'C', 'RG', 'RT'];

// Default offense positions - matches the 11 core positions in Setup.jsx
// This is the CANONICAL list - all other files should reference this
// OL positions (LT, LG, C, RG, RT) are handled separately via OL_POSITIONS
const DEFAULT_OFFENSE_POSITIONS = [
  'QB', 'RB', 'X', 'Y', 'Z', 'H'
];

// Export the full default positions for other files to use
// This includes both skill and OL positions as objects with key/default pairs
export const CANONICAL_OFFENSE_POSITIONS = [
  { key: 'QB', default: 'QB' },
  { key: 'RB', default: 'RB' },
  { key: 'X', default: 'X' },
  { key: 'Y', default: 'Y' },
  { key: 'Z', default: 'Z' },
  { key: 'H', default: 'H' },
  { key: 'LT', default: 'LT' },
  { key: 'LG', default: 'LG' },
  { key: 'C', default: 'C' },
  { key: 'RG', default: 'RG' },
  { key: 'RT', default: 'RT' }
];

/**
 * Get the effective base personnel for a given program level
 *
 * @param {string|null} levelId - The program level ID (null for varsity/default)
 * @param {Array} programLevels - Array of program level objects
 * @param {Array} personnelGroupings - Array of personnel grouping objects
 * @returns {Object|null} The base personnel grouping object, or null if none found
 */
export function getBasePersonnel(levelId, programLevels, personnelGroupings) {
  if (!personnelGroupings || personnelGroupings.length === 0) {
    return null;
  }

  // Check for level-specific override
  if (levelId && programLevels) {
    const level = programLevels.find(l => l.id === levelId);
    if (level?.basePersonnelId) {
      const levelPersonnel = personnelGroupings.find(p => p.id === level.basePersonnelId);
      if (levelPersonnel) {
        return levelPersonnel;
      }
    }
  }

  // Fall back to program default (the one marked as base)
  const basePersonnel = personnelGroupings.find(p => p.isBase);
  if (basePersonnel) {
    return basePersonnel;
  }

  // If no base is marked, default to first personnel or "11" if it exists
  const elevenPersonnel = personnelGroupings.find(p => p.code === '11');
  return elevenPersonnel || personnelGroupings[0] || null;
}

/**
 * Map a personnel grouping to depth chart positions
 * Uses the actual position keys from the grouping (e.g., X, Y, Z, QB, RB)
 *
 * @param {Object} personnelGrouping - Personnel grouping with positions array
 * @param {Object} positionNames - Custom position names from setupConfig (key -> display name)
 * @returns {Array<Object>} Array of position objects { id, label, depth, positionType }
 */
export function mapPersonnelToPositions(personnelGrouping, positionNames = {}) {
  const positionsList = personnelGrouping?.positions || [];
  const positions = [];
  const addedIds = new Set();

  // Process each position in the personnel grouping
  // Positions are the actual keys like X, Y, Z, QB, RB - use them directly
  positionsList.forEach(posKey => {
    // Skip OL positions - they're added separately
    if (OL_POSITION_KEYS.includes(posKey)) return;

    // Handle duplicates by appending a number
    let slotId = posKey;
    let counter = 1;
    while (addedIds.has(slotId)) {
      counter++;
      slotId = `${posKey}${counter}`;
    }
    addedIds.add(slotId);

    // Get display label from positionNames config, fall back to the key
    const label = positionNames[posKey] || posKey;

    positions.push({
      id: slotId,
      label: label,
      depth: 3,
      positionType: posKey
    });
  });

  // Always add OL positions - apply positionNames lookup for custom labels
  OL_POSITIONS.forEach(slot => {
    positions.push({
      id: slot.id,
      label: positionNames[slot.id] || slot.label,
      depth: slot.depth,
      positionType: slot.id  // LT, LG, C, RG, RT - not 'OL'
    });
  });

  return positions;
}

/**
 * Get positions that exist in other personnel groupings but not in the base
 *
 * @param {Object} basePersonnel - The base personnel grouping
 * @param {Array} allPersonnel - All personnel groupings
 * @param {Object} positionNames - Custom position names
 * @returns {Array<Object>} Array of additional position objects
 */
export function getAdditionalPositions(basePersonnel, allPersonnel, positionNames = {}) {
  if (!basePersonnel || !allPersonnel) return [];

  const basePositionKeys = new Set(basePersonnel.positions || []);
  const additionalPositions = [];
  const addedKeys = new Set();

  // Look through all personnel groupings for positions not in base
  allPersonnel.forEach(personnel => {
    if (personnel.id === basePersonnel.id) return; // Skip base

    (personnel.positions || []).forEach(posKey => {
      // Skip OL positions and positions already in base
      if (OL_POSITION_KEYS.includes(posKey)) return;
      if (basePositionKeys.has(posKey)) return;
      if (addedKeys.has(posKey)) return;

      addedKeys.add(posKey);
      const label = positionNames[posKey] || posKey;

      additionalPositions.push({
        id: posKey,
        label: label,
        depth: 2,
        positionType: posKey,
        fromPersonnel: personnel.code || personnel.name
      });
    });
  });

  return additionalPositions;
}

/**
 * Generate positions from ALL active positions in the setup config
 * This ensures every position defined in Setup > Position Names appears on the depth chart
 *
 * @param {Array} activePositions - Array of position objects { key, default } from Setup
 * @param {Object} positionNames - Custom position names from setupConfig (key -> display name)
 * @returns {Array<Object>} Array of position objects { id, label, depth, positionType }
 */
export function getAllActivePositions(activePositions = [], positionNames = {}) {
  const positions = [];

  // If no activePositions provided, use defaults
  const positionKeys = activePositions.length > 0
    ? activePositions.map(p => p.key || p)
    : DEFAULT_OFFENSE_POSITIONS;

  // Add each position, excluding OL (they're added separately)
  positionKeys.forEach(posKey => {
    // Skip OL positions - they're added separately
    if (OL_POSITION_KEYS.includes(posKey)) return;

    // Get display label from positionNames config, fall back to the key
    const label = positionNames[posKey] || posKey;

    positions.push({
      id: posKey,
      label: label,
      depth: 3,
      positionType: posKey
    });
  });

  // Always add OL positions - apply positionNames lookup for custom labels
  OL_POSITIONS.forEach(slot => {
    positions.push({
      id: slot.id,
      label: positionNames[slot.id] || slot.label,
      depth: slot.depth,
      positionType: slot.id  // LT, LG, C, RG, RT - not 'OL'
    });
  });

  return positions;
}

/**
 * Generate the complete depth chart position configuration for a level
 * Uses ALL active positions from Setup, not just base personnel positions
 *
 * @param {string|null} levelId - Program level ID
 * @param {Array} programLevels - All program levels
 * @param {Array} personnelGroupings - All personnel groupings
 * @param {Object} positionNames - Custom position names from setupConfig (key -> display name)
 * @param {Array} activePositions - Full list of active positions from Setup (defaults + custom - hidden)
 * @returns {Object} { basePositions, additionalPositions, basePersonnel }
 */
export function generateDepthChartPositions(levelId, programLevels, personnelGroupings, positionNames = {}, activePositions = []) {
  const basePersonnel = getBasePersonnel(levelId, programLevels, personnelGroupings);

  // Use ALL active positions from Setup
  // This ensures every position defined in Setup > Position Names appears on the depth chart
  return {
    basePositions: getAllActivePositions(activePositions, positionNames),
    additionalPositions: [], // No additional positions needed - all are included
    basePersonnel
  };
}

/**
 * Get default positions when no personnel is configured
 * Defaults to standard 11 personnel layout
 */
export function getDefaultPositions(positionNames = {}) {
  const defaultKeys = ['QB', 'RB', 'X', 'Y', 'Z', 'TE'];

  const positions = defaultKeys.map(key => ({
    id: key,
    label: positionNames[key] || key,
    depth: 3,
    positionType: key
  }));

  // Add OL positions - apply positionNames lookup for custom labels
  OL_POSITIONS.forEach(slot => {
    positions.push({
      id: slot.id,
      label: positionNames[slot.id] || slot.label,
      depth: slot.depth,
      positionType: slot.id  // LT, LG, C, RG, RT - not 'OL'
    });
  });

  return positions;
}

/**
 * Check if a personnel grouping is the base for the given level
 *
 * @param {Object} personnel - Personnel grouping to check
 * @param {string|null} levelId - Program level ID
 * @param {Array} programLevels - All program levels
 * @param {Array} allPersonnel - All personnel groupings
 * @returns {boolean} True if this is the effective base personnel
 */
export function isBasePersonnel(personnel, levelId, programLevels, allPersonnel) {
  const base = getBasePersonnel(levelId, programLevels, allPersonnel);
  return base?.id === personnel.id;
}

// Legacy export for backward compatibility
export function getSlotConfig() {
  return null;
}
