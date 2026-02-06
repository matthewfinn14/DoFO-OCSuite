/**
 * Unified helper functions for accessing game plan sections from SPREADSHEET layout
 */

/**
 * Get all game plan sections from SPREADSHEET layout
 * @param {Object} gamePlanLayouts - The gamePlanLayouts object from week data
 * @returns {Array} Array of section objects with normalized properties
 */
export function getGamePlanSections(gamePlanLayouts) {
  const spreadsheet = gamePlanLayouts?.SPREADSHEET;
  if (!spreadsheet?.pages?.length) return [];

  return spreadsheet.pages.flatMap((page, pageIdx) =>
    (page.headers || []).map(header => ({
      id: header.id,
      name: header.name,
      setId: `spreadsheet_${header.id}`,
      categoryType: header.categoryType,
      situationId: header.situationId,
      isMatrix: header.isMatrix,
      playTypes: header.playTypes,
      hashGroups: header.hashGroups,
      colStart: header.colStart,
      colSpan: header.colSpan,
      rowStart: header.rowStart,
      color: header.color,
      pageIdx
    }))
  );
}

/**
 * Get plays for a section by setId
 * @param {string} setId - The set ID (e.g., 'spreadsheet_h_123')
 * @param {Object} gamePlan - The offensiveGamePlan object
 * @param {Array} playsArray - Array of all play objects
 * @returns {Array} Array of play objects
 */
export function getPlaysForSection(setId, gamePlan, playsArray) {
  const set = gamePlan?.sets?.find(s => s.id === setId);
  if (!set) return [];

  const playIds = set.assignedPlayIds || set.playIds || [];
  return playIds
    .map(id => playsArray.find(p => p.id === id))
    .filter(Boolean);
}

/**
 * Get plays for a matrix cell
 * @param {string} headerId - The header ID
 * @param {string} playTypeId - The play type ID
 * @param {string} hashCol - The hash column (L, LM, M, RM, R)
 * @param {Object} gamePlan - The offensiveGamePlan object
 * @param {Array} playsArray - Array of all play objects
 * @returns {Array} Array of play objects
 */
export function getPlaysForMatrixCell(headerId, playTypeId, hashCol, gamePlan, playsArray) {
  const setId = `spreadsheet_${headerId}_${playTypeId}_${hashCol}`;
  const set = gamePlan?.sets?.find(s => s.id === setId);
  if (!set) return [];

  return (set.playIds || [])
    .map(id => playsArray.find(p => p.id === id))
    .filter(Boolean);
}

/**
 * Get all play IDs assigned to any spreadsheet section
 * @param {Object} gamePlanLayouts - The gamePlanLayouts object
 * @param {Object} gamePlan - The offensiveGamePlan object
 * @returns {Set} Set of play IDs
 */
export function getAllSpreadsheetPlayIds(gamePlanLayouts, gamePlan) {
  const sections = getGamePlanSections(gamePlanLayouts);
  const playIds = new Set();

  sections.forEach(section => {
    const set = gamePlan?.sets?.find(s => s.id === section.setId);
    if (set) {
      (set.assignedPlayIds || set.playIds || []).forEach(id => playIds.add(id));
    }
  });

  return playIds;
}

/**
 * Convert a spreadsheet header to the box format used by Install Manager and other components
 * @param {Object} header - A header object from SPREADSHEET.pages[].headers[]
 * @param {number} pageIdx - The page index
 * @returns {Object} Box object with id, label, color, setId
 */
export function headerToBox(header, pageIdx = 0) {
  return {
    id: `spreadsheet_${header.id}`,
    setId: `spreadsheet_${header.id}`,
    headerId: header.id,
    label: header.name,
    name: header.name,
    color: header.color || '#3b82f6',
    categoryType: header.categoryType,
    situationId: header.situationId,
    isMatrix: header.isMatrix,
    pageIdx
  };
}

/**
 * Get spreadsheet sections as boxes (for compatibility with existing UI)
 * @param {Object} gamePlanLayouts - The gamePlanLayouts object
 * @returns {Array} Array of box objects
 */
export function getSpreadsheetBoxes(gamePlanLayouts) {
  const spreadsheet = gamePlanLayouts?.SPREADSHEET;
  if (!spreadsheet?.pages?.length) return [];

  return spreadsheet.pages.flatMap((page, pageIdx) =>
    (page.headers || []).map(header => headerToBox(header, pageIdx))
  );
}
