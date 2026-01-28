/**
 * Quality Control Analysis Utilities
 * Helper functions for X&O Quality Control audits
 */

/**
 * Index plays by ID for fast lookup
 * @param {Object} plays - Object with play IDs as keys
 * @returns {Map} Map of playId -> play object
 */
export function indexPlaysById(plays) {
  const index = new Map();
  if (!plays) return index;

  Object.entries(plays).forEach(([id, play]) => {
    index.set(id, { ...play, id });
  });

  return index;
}

/**
 * Apply global filters to plays array
 * @param {Array} plays - Array of play objects
 * @param {Object} filters - Filter criteria
 * @param {Object} setupConfig - Setup configuration for reference
 * @returns {Array} Filtered plays
 */
export function applyPlayFilters(plays, filters, setupConfig) {
  if (!plays || !Array.isArray(plays)) return [];
  if (!filters || Object.keys(filters).length === 0) return plays;

  return plays.filter(play => {
    // Personnel filter
    if (filters.personnel && filters.personnel.length > 0) {
      if (!filters.personnel.includes(play.personnel)) return false;
    }

    // Formation filter
    if (filters.formation && filters.formation.length > 0) {
      if (!filters.formation.includes(play.formation)) return false;
    }

    // Bucket filter (play category)
    if (filters.bucket && filters.bucket.length > 0) {
      if (!filters.bucket.includes(play.bucketId)) return false;
    }

    // Concept filter
    if (filters.concept && filters.concept.length > 0) {
      if (!filters.concept.includes(play.conceptGroupId)) return false;
    }

    // Play purpose filter
    if (filters.purpose && filters.purpose.length > 0) {
      if (!filters.purpose.includes(play.playPurpose)) return false;
    }

    // Field zone filter
    if (filters.fieldZone && filters.fieldZone.length > 0) {
      const playZones = play.fieldZones || [];
      if (!filters.fieldZone.some(z => playZones.includes(z))) return false;
    }

    // Down/distance filter
    if (filters.downDistance && filters.downDistance.length > 0) {
      const playDowns = play.downDistances || [];
      if (!filters.downDistance.some(d => playDowns.includes(d))) return false;
    }

    // Special situations filter
    if (filters.situation && filters.situation.length > 0) {
      const playSituations = play.specialSituations || [];
      if (!filters.situation.some(s => playSituations.includes(s))) return false;
    }

    return true;
  });
}

/**
 * Count plays by a specific field (handles arrays)
 * @param {Array} plays - Array of play objects
 * @param {string} field - Field name to bucket by
 * @param {Array} allowedValues - Optional list of allowed values
 * @returns {Object} Counts by field value
 */
export function bucketCounts(plays, field, allowedValues = null) {
  const counts = {};

  if (!plays || !Array.isArray(plays)) return counts;

  plays.forEach(play => {
    const value = play[field];

    // Handle array fields (e.g., fieldZones, downDistances)
    if (Array.isArray(value)) {
      value.forEach(v => {
        if (!allowedValues || allowedValues.includes(v)) {
          counts[v] = (counts[v] || 0) + 1;
        }
      });
    } else if (value !== undefined && value !== null) {
      if (!allowedValues || allowedValues.includes(value)) {
        counts[value] = (counts[value] || 0) + 1;
      }
    } else {
      counts['(none)'] = (counts['(none)'] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Compute aggregated history for a play from grading sessions
 * @param {string} playId - Play ID
 * @param {Array} practiceGrades - Practice grading sessions
 * @param {Array} gameGrades - Game grading sessions
 * @param {Array} weekIds - Optional filter by week IDs
 * @returns {Object} Aggregated stats
 */
export function computePlayHistory(playId, practiceGrades = [], gameGrades = [], weekIds = null) {
  const history = {
    practice: {
      totalReps: 0,
      efficientReps: 0,
      explosiveReps: 0,
      sessions: []
    },
    game: {
      totalCalls: 0,
      efficientCalls: 0,
      explosiveCalls: 0,
      sessions: []
    }
  };

  // Aggregate practice data
  practiceGrades.forEach(session => {
    if (weekIds && !weekIds.includes(session.weekId)) return;

    const grade = session.grades?.find(g => g.playId === playId);
    if (grade) {
      history.practice.totalReps += grade.reps || 0;
      history.practice.efficientReps += grade.efficientReps || 0;
      history.practice.explosiveReps += grade.explosiveReps || 0;
      history.practice.sessions.push({
        sessionId: session.id,
        weekId: session.weekId,
        dayLabel: session.dayLabel,
        date: session.date,
        ...grade
      });
    }
  });

  // Aggregate game data
  gameGrades.forEach(session => {
    if (weekIds && !weekIds.includes(session.weekId)) return;

    const grade = session.grades?.find(g => g.playId === playId);
    if (grade) {
      history.game.totalCalls += grade.calls || 0;
      history.game.efficientCalls += grade.efficientCalls || 0;
      history.game.explosiveCalls += grade.explosiveCalls || 0;
      history.game.sessions.push({
        sessionId: session.id,
        weekId: session.weekId,
        opponent: session.opponent,
        date: session.date,
        ...grade
      });
    }
  });

  // Calculate rates
  history.practice.efficiencyRate = history.practice.totalReps > 0
    ? (history.practice.efficientReps / history.practice.totalReps * 100).toFixed(1)
    : null;
  history.practice.explosiveRate = history.practice.totalReps > 0
    ? (history.practice.explosiveReps / history.practice.totalReps * 100).toFixed(1)
    : null;

  history.game.efficiencyRate = history.game.totalCalls > 0
    ? (history.game.efficientCalls / history.game.totalCalls * 100).toFixed(1)
    : null;
  history.game.explosiveRate = history.game.totalCalls > 0
    ? (history.game.explosiveCalls / history.game.totalCalls * 100).toFixed(1)
    : null;

  return history;
}

/**
 * Check if a play result is efficient based on down/bucket thresholds
 * @param {number} yards - Yards gained
 * @param {string} down - Down (1st, 2nd, 3rd, 4th)
 * @param {string} bucket - Play bucket (run, pass, screen)
 * @param {Object} thresholds - Efficiency thresholds from setupConfig
 * @param {number} distance - Distance to go (for 2nd/3rd/4th)
 * @returns {boolean} Whether the play was efficient
 */
export function isEfficient(yards, down, bucket, thresholds, distance = 10) {
  if (!thresholds) return false;

  const downThresholds = thresholds[down] || thresholds['1st'];
  const threshold = downThresholds[bucket] || downThresholds.default || 4;

  // For 1st down: fixed yards (usually 4)
  if (down === '1st') {
    return yards >= threshold;
  }

  // For 2nd/3rd/4th: threshold is percentage of distance
  const requiredYards = (threshold / 100) * distance;
  return yards >= requiredYards;
}

/**
 * Check if a play result is explosive based on bucket thresholds
 * @param {number} yards - Yards gained
 * @param {string} bucket - Play bucket (run, pass, screen)
 * @param {Object} thresholds - Explosive thresholds from setupConfig
 * @returns {boolean} Whether the play was explosive
 */
export function isExplosive(yards, bucket, thresholds) {
  if (!thresholds) return false;

  const threshold = thresholds[bucket] || thresholds.default || 12;
  return yards >= threshold;
}

/**
 * Find coverage gaps - areas with no plays installed
 * @param {Array} plays - Array of play objects
 * @param {Array} requiredZones - Required field zones
 * @param {Array} requiredDowns - Required down/distance categories
 * @param {Array} requiredSituations - Required special situations
 * @returns {Object} Gaps by category
 */
export function findCoverageGaps(plays, requiredZones = [], requiredDowns = [], requiredSituations = []) {
  const gaps = {
    fieldZones: [],
    downDistances: [],
    situations: [],
    crossGaps: []
  };

  if (!plays || plays.length === 0) {
    return {
      fieldZones: requiredZones,
      downDistances: requiredDowns,
      situations: requiredSituations,
      crossGaps: []
    };
  }

  // Collect all covered values
  const coveredZones = new Set();
  const coveredDowns = new Set();
  const coveredSituations = new Set();

  plays.forEach(play => {
    (play.fieldZones || []).forEach(z => coveredZones.add(z));
    (play.downDistances || []).forEach(d => coveredDowns.add(d));
    (play.specialSituations || []).forEach(s => coveredSituations.add(s));
  });

  // Find missing zones
  requiredZones.forEach(zone => {
    if (!coveredZones.has(zone)) {
      gaps.fieldZones.push(zone);
    }
  });

  // Find missing downs
  requiredDowns.forEach(down => {
    if (!coveredDowns.has(down)) {
      gaps.downDistances.push(down);
    }
  });

  // Find missing situations
  requiredSituations.forEach(sit => {
    if (!coveredSituations.has(sit)) {
      gaps.situations.push(sit);
    }
  });

  // Find cross-product gaps (zone + down combos with no plays)
  requiredZones.forEach(zone => {
    requiredDowns.forEach(down => {
      const hasPlay = plays.some(p =>
        (p.fieldZones || []).includes(zone) &&
        (p.downDistances || []).includes(down)
      );
      if (!hasPlay) {
        gaps.crossGaps.push({ zone, down });
      }
    });
  });

  return gaps;
}

/**
 * Analyze balance of plays across a field
 * @param {Array} plays - Array of play objects
 * @param {string} field - Field name to analyze
 * @param {number} threshold - Warning threshold percentage (default 50)
 * @returns {Object} Balance analysis with warnings
 */
export function analyzeBalance(plays, field, threshold = 50) {
  const counts = bucketCounts(plays, field);
  const total = plays?.length || 0;

  const analysis = {
    counts,
    total,
    percentages: {},
    warnings: [],
    isBalanced: true
  };

  if (total === 0) return analysis;

  // Calculate percentages and check for imbalance
  Object.entries(counts).forEach(([key, count]) => {
    const pct = (count / total * 100).toFixed(1);
    analysis.percentages[key] = parseFloat(pct);

    if (parseFloat(pct) >= threshold) {
      analysis.warnings.push({
        category: key,
        percentage: parseFloat(pct),
        count,
        message: `${key} represents ${pct}% of plays (${count}/${total})`
      });
      analysis.isBalanced = false;
    }
  });

  return analysis;
}

/**
 * Get plays installed for a specific week
 * @param {Object} plays - All plays object
 * @param {Array} weeks - Weeks array
 * @param {string} weekId - Target week ID
 * @returns {Array} Plays installed for that week
 */
export function getInstalledPlaysForWeek(plays, weeks, weekId) {
  if (!plays || !weeks || !weekId) return [];

  const week = weeks.find(w => w.id === weekId);
  if (!week) return [];

  const installedIds = week.installedPlays || [];

  return installedIds
    .map(id => plays[id])
    .filter(Boolean)
    .map(play => ({ ...play, id: play.id }));
}

/**
 * Get plays scripted for practice in a week
 * @param {Object} plays - All plays object
 * @param {Array} weeks - Weeks array
 * @param {string} weekId - Target week ID
 * @returns {Object} Scripted plays by day and segment
 */
export function getScriptedPlaysForWeek(plays, weeks, weekId) {
  if (!plays || !weeks || !weekId) return { all: [], byDay: {}, bySegment: {} };

  const week = weeks.find(w => w.id === weekId);
  if (!week || !week.practicePlans) return { all: [], byDay: {}, bySegment: {} };

  const allScripted = new Set();
  const byDay = {};
  const bySegment = {};

  week.practicePlans.forEach(plan => {
    const dayKey = plan.date || plan.name;
    byDay[dayKey] = byDay[dayKey] || new Set();

    (plan.segments || []).forEach(segment => {
      const segKey = segment.id || segment.name;
      bySegment[segKey] = bySegment[segKey] || new Set();

      (segment.script || []).forEach(row => {
        if (row.playId && plays[row.playId]) {
          allScripted.add(row.playId);
          byDay[dayKey].add(row.playId);
          bySegment[segKey].add(row.playId);
        }
      });
    });
  });

  // Convert Sets to arrays of play objects
  const toPlayArray = (idSet) =>
    Array.from(idSet).map(id => ({ ...plays[id], id })).filter(p => p.id);

  return {
    all: toPlayArray(allScripted),
    byDay: Object.fromEntries(
      Object.entries(byDay).map(([k, v]) => [k, toPlayArray(v)])
    ),
    bySegment: Object.fromEntries(
      Object.entries(bySegment).map(([k, v]) => [k, toPlayArray(v)])
    )
  };
}

/**
 * Get plays in game plan for a week
 * @param {Object} plays - All plays object
 * @param {Object} gamePlans - Game plans by week
 * @param {string} weekId - Target week ID
 * @returns {Object} Game plan plays by section
 */
export function getGamePlanPlaysForWeek(plays, gamePlans, weekId) {
  if (!plays || !gamePlans || !weekId) return { all: [], bySection: {} };

  const gamePlan = gamePlans[weekId];
  if (!gamePlan) return { all: [], bySection: {} };

  const allPlays = new Set();
  const bySection = {};

  (gamePlan.sections || []).forEach(section => {
    const sectionKey = section.id || section.name;
    bySection[sectionKey] = bySection[sectionKey] || [];

    (section.plays || []).forEach(playEntry => {
      const playId = playEntry.playId || playEntry.id;
      if (playId && plays[playId]) {
        allPlays.add(playId);
        bySection[sectionKey].push({ ...plays[playId], id: playId });
      }
    });
  });

  return {
    all: Array.from(allPlays).map(id => ({ ...plays[id], id })).filter(p => p.id),
    bySection
  };
}

/**
 * Compare installed vs scripted plays
 * @param {Array} installedPlays - Plays installed for week
 * @param {Array} scriptedPlays - Plays scripted for practice
 * @returns {Object} Comparison results
 */
export function compareInstalledVsScripted(installedPlays, scriptedPlays) {
  const installedIds = new Set(installedPlays.map(p => p.id));
  const scriptedIds = new Set(scriptedPlays.map(p => p.id));

  const missingFromScript = installedPlays.filter(p => !scriptedIds.has(p.id));
  const extraInScript = scriptedPlays.filter(p => !installedIds.has(p.id));
  const covered = installedPlays.filter(p => scriptedIds.has(p.id));

  return {
    installed: installedPlays.length,
    scripted: scriptedPlays.length,
    covered: covered.length,
    missingFromScript,
    extraInScript,
    coverageRate: installedPlays.length > 0
      ? ((covered.length / installedPlays.length) * 100).toFixed(1)
      : '100'
  };
}

/**
 * Calculate summary statistics for a set of plays with grading data
 * @param {Array} plays - Plays with history attached
 * @param {string} type - 'practice' or 'game'
 * @param {Object} minimumVolume - Minimum volume settings
 * @returns {Object} Summary statistics
 */
export function calculateGradingSummary(plays, type = 'practice', minimumVolume = { practice: 3, game: 2 }) {
  const minVol = type === 'practice' ? minimumVolume.practice : minimumVolume.game;

  const summary = {
    totalPlays: plays.length,
    graded: 0,
    totalVolume: 0,
    efficientVolume: 0,
    explosiveVolume: 0,
    meanEfficiency: null,
    meanExplosive: null,
    topPerformers: [],
    needsWork: [],
    insufficientData: []
  };

  const volumeKey = type === 'practice' ? 'totalReps' : 'totalCalls';
  const efficientKey = type === 'practice' ? 'efficientReps' : 'efficientCalls';
  const explosiveKey = type === 'practice' ? 'explosiveReps' : 'explosiveCalls';

  const withSufficientData = [];

  plays.forEach(play => {
    const history = play.history?.[type];
    if (!history) return;

    const volume = history[volumeKey] || 0;
    const efficient = history[efficientKey] || 0;
    const explosive = history[explosiveKey] || 0;

    if (volume > 0) {
      summary.graded++;
      summary.totalVolume += volume;
      summary.efficientVolume += efficient;
      summary.explosiveVolume += explosive;
    }

    if (volume >= minVol) {
      withSufficientData.push({
        play,
        volume,
        efficiencyRate: (efficient / volume * 100),
        explosiveRate: (explosive / volume * 100)
      });
    } else if (volume > 0) {
      summary.insufficientData.push({
        play,
        volume,
        needed: minVol - volume
      });
    }
  });

  if (summary.totalVolume > 0) {
    summary.meanEfficiency = (summary.efficientVolume / summary.totalVolume * 100).toFixed(1);
    summary.meanExplosive = (summary.explosiveVolume / summary.totalVolume * 100).toFixed(1);
  }

  // Sort by efficiency for top/bottom
  withSufficientData.sort((a, b) => b.efficiencyRate - a.efficiencyRate);

  summary.topPerformers = withSufficientData.slice(0, 5).map(d => ({
    ...d.play,
    volume: d.volume,
    efficiencyRate: d.efficiencyRate.toFixed(1),
    explosiveRate: d.explosiveRate.toFixed(1)
  }));

  summary.needsWork = withSufficientData.slice(-5).reverse().map(d => ({
    ...d.play,
    volume: d.volume,
    efficiencyRate: d.efficiencyRate.toFixed(1),
    explosiveRate: d.explosiveRate.toFixed(1)
  }));

  return summary;
}

/**
 * Generate chart data for distribution visualization
 * @param {Object} counts - Counts object from bucketCounts
 * @param {Array} orderedKeys - Optional key ordering
 * @param {Object} colorMap - Optional color mapping
 * @returns {Array} Chart-ready data array
 */
export function generateChartData(counts, orderedKeys = null, colorMap = {}) {
  const keys = orderedKeys || Object.keys(counts).sort();

  return keys.map(key => ({
    name: key,
    value: counts[key] || 0,
    fill: colorMap[key] || '#6b7280'
  }));
}

/**
 * Get unique values from plays for filter options
 * @param {Array} plays - Array of play objects
 * @param {string} field - Field to extract values from
 * @returns {Array} Sorted unique values
 */
export function getUniqueValues(plays, field) {
  const values = new Set();

  plays?.forEach(play => {
    const value = play[field];
    if (Array.isArray(value)) {
      value.forEach(v => values.add(v));
    } else if (value) {
      values.add(value);
    }
  });

  return Array.from(values).sort();
}
