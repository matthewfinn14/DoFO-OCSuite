/**
 * Rep Tracking Utilities
 * Functions for counting and analyzing play reps from practice scripts
 */

/**
 * Calculate total reps from previous weeks' practice scripts
 * @param {string} playId - The play ID to count reps for
 * @param {string} currentWeekId - The current week ID (to exclude from count)
 * @param {Array} weeks - Array of week objects with practicePlans
 * @returns {number} Total reps from previous weeks
 */
export function getHistoricalReps(playId, currentWeekId, weeks) {
  if (!playId || !weeks || !Array.isArray(weeks)) return 0;

  let totalReps = 0;

  weeks.forEach(week => {
    // Skip current week
    if (week.id === currentWeekId) return;

    const practicePlans = week.practicePlans || {};
    Object.values(practicePlans).forEach(dayPlan => {
      (dayPlan.segments || []).forEach(segment => {
        (segment.script || []).forEach(row => {
          if (row.playId === playId) totalReps++;
        });
      });
    });
  });

  return totalReps;
}

/**
 * Count reps scripted for a play in the current week
 * @param {string} playId - The play ID to count reps for
 * @param {string} weekId - The week ID to count within
 * @param {Array} weeks - Array of week objects with practicePlans
 * @returns {number} Total reps in current week
 */
export function getCurrentWeekReps(playId, weekId, weeks) {
  if (!playId || !weekId || !weeks || !Array.isArray(weeks)) return 0;

  const week = weeks.find(w => w.id === weekId);
  if (!week) return 0;

  let totalReps = 0;

  const practicePlans = week.practicePlans || {};
  Object.values(practicePlans).forEach(dayPlan => {
    (dayPlan.segments || []).forEach(segment => {
      (segment.script || []).forEach(row => {
        if (row.playId === playId) totalReps++;
      });
    });
  });

  return totalReps;
}

/**
 * Get reps broken down by segment type for a play in a week
 * @param {string} playId - The play ID to analyze
 * @param {string} weekId - The week ID to analyze
 * @param {Array} weeks - Array of week objects with practicePlans
 * @returns {Object} Map of segmentTypeId -> rep count
 */
export function getRepsBySegmentType(playId, weekId, weeks) {
  if (!playId || !weekId || !weeks || !Array.isArray(weeks)) return {};

  const week = weeks.find(w => w.id === weekId);
  if (!week) return {};

  const repsByType = {};

  const practicePlans = week.practicePlans || {};
  Object.values(practicePlans).forEach(dayPlan => {
    (dayPlan.segments || []).forEach(segment => {
      const segmentTypeId = segment.typeId || segment.type || 'unknown';
      (segment.script || []).forEach(row => {
        if (row.playId === playId) {
          repsByType[segmentTypeId] = (repsByType[segmentTypeId] || 0) + 1;
        }
      });
    });
  });

  return repsByType;
}

/**
 * Get all reps for all plays in a week, organized by play ID
 * @param {string} weekId - The week ID to analyze
 * @param {Array} weeks - Array of week objects with practicePlans
 * @returns {Object} Map of playId -> rep count
 */
export function getAllRepsForWeek(weekId, weeks) {
  if (!weekId || !weeks || !Array.isArray(weeks)) return {};

  const week = weeks.find(w => w.id === weekId);
  if (!week) return {};

  const repsByPlay = {};

  const practicePlans = week.practicePlans || {};
  Object.values(practicePlans).forEach(dayPlan => {
    (dayPlan.segments || []).forEach(segment => {
      (segment.script || []).forEach(row => {
        if (row.playId) {
          repsByPlay[row.playId] = (repsByPlay[row.playId] || 0) + 1;
        }
      });
    });
  });

  return repsByPlay;
}

/**
 * Get historical reps for all plays (excluding current week)
 * @param {string} currentWeekId - The current week ID to exclude
 * @param {Array} weeks - Array of week objects with practicePlans
 * @returns {Object} Map of playId -> total historical rep count
 */
export function getAllHistoricalReps(currentWeekId, weeks) {
  if (!weeks || !Array.isArray(weeks)) return {};

  const repsByPlay = {};

  weeks.forEach(week => {
    // Skip current week
    if (week.id === currentWeekId) return;

    const practicePlans = week.practicePlans || {};
    Object.values(practicePlans).forEach(dayPlan => {
      (dayPlan.segments || []).forEach(segment => {
        (segment.script || []).forEach(row => {
          if (row.playId) {
            repsByPlay[row.playId] = (repsByPlay[row.playId] || 0) + 1;
          }
        });
      });
    });
  });

  return repsByPlay;
}

/**
 * Calculate rep deficit/surplus for a play
 * @param {string} playId - The play ID
 * @param {number} targetReps - Target rep count
 * @param {string} weekId - Week ID to check current reps
 * @param {Array} weeks - Array of week objects
 * @returns {Object} { current, target, difference, percentComplete }
 */
export function getRepProgress(playId, targetReps, weekId, weeks) {
  const current = getCurrentWeekReps(playId, weekId, weeks);
  const target = targetReps || 0;
  const difference = current - target;
  const percentComplete = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return {
    current,
    target,
    difference,
    percentComplete
  };
}
