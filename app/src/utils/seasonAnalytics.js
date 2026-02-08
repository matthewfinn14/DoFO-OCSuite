/**
 * Season Analytics Utilities
 * Core analytics computations for season-wide offensive review
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default efficiency thresholds by down
 */
const DEFAULT_SUCCESS_CRITERIA = {
  firstDown: 4,    // 40% of distance = 4 yards on 1st & 10
  secondDown: 0.5, // 50% of remaining distance
  thirdDown: 1.0,  // 100% = conversion
  fourthDown: 1.0  // 100% = conversion
};

/**
 * Default explosive play thresholds
 */
const DEFAULT_EXPLOSIVE_THRESHOLDS = {
  run: 12,
  pass: 15,
  screen: 10
};

/**
 * Default minimum sample sizes
 */
const DEFAULT_MINIMUM_SAMPLES = {
  concept: 5,
  formation: 3,
  situation: 3
};

/**
 * Field zone definitions
 */
const FIELD_ZONES = [
  { id: 'backed_up', name: 'Backed Up', yardRange: [0, 10] },
  { id: 'own_territory', name: 'Own Territory', yardRange: [11, 45] },
  { id: 'plus_territory', name: 'Plus Territory', yardRange: [46, 75] },
  { id: 'red_zone', name: 'Red Zone', yardRange: [76, 90] },
  { id: 'goal_line', name: 'Goal Line', yardRange: [91, 100] }
];

/**
 * Down & distance categories
 */
const DOWN_DISTANCE_CATEGORIES = [
  { id: 'first_10', name: '1st & 10', down: 1, distanceRange: [10, 10] },
  { id: 'first_long', name: '1st & Long', down: 1, distanceRange: [11, 99] },
  { id: 'second_short', name: '2nd & Short', down: 2, distanceRange: [1, 3] },
  { id: 'second_medium', name: '2nd & Medium', down: 2, distanceRange: [4, 6] },
  { id: 'second_long', name: '2nd & Long', down: 2, distanceRange: [7, 99] },
  { id: 'third_short', name: '3rd & Short', down: 3, distanceRange: [1, 3] },
  { id: 'third_medium', name: '3rd & Medium', down: 3, distanceRange: [4, 6] },
  { id: 'third_long', name: '3rd & Long', down: 3, distanceRange: [7, 99] },
  { id: 'fourth_short', name: '4th & Short', down: 4, distanceRange: [1, 3] },
  { id: 'fourth_long', name: '4th & Long', down: 4, distanceRange: [4, 99] }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine if a play was successful based on down and distance
 * @param {Object} snap - Snap object
 * @param {Object} criteria - Success criteria
 * @returns {boolean}
 */
function isSuccessfulPlay(snap, criteria = DEFAULT_SUCCESS_CRITERIA) {
  // If already flagged, use that
  if (snap.successFlag !== undefined) {
    return snap.successFlag;
  }

  const yards = snap.resultYards || 0;
  const down = snap.down;
  const distance = snap.distance || 10;

  switch (down) {
    case 1:
      return yards >= criteria.firstDown;
    case 2:
      return yards >= distance * criteria.secondDown;
    case 3:
    case 4:
      return yards >= distance;
    default:
      return yards >= 4;
  }
}

/**
 * Determine if a play was explosive
 * @param {Object} snap - Snap object
 * @param {string} bucketId - Bucket ID
 * @param {Object} thresholds - Explosive thresholds
 * @returns {boolean}
 */
function isExplosivePlay(snap, bucketId, thresholds = DEFAULT_EXPLOSIVE_THRESHOLDS) {
  // If already flagged, use that
  if (snap.explosiveFlag !== undefined) {
    return snap.explosiveFlag;
  }

  const yards = snap.resultYards || 0;
  const bucket = (bucketId || '').toLowerCase();

  if (bucket.includes('run')) {
    return yards >= thresholds.run;
  } else if (bucket.includes('screen')) {
    return yards >= thresholds.screen;
  } else {
    return yards >= thresholds.pass;
  }
}

/**
 * Determine field zone from yardline
 * @param {number} yardline - Yardline (0-100, with 100 being opponent goal line)
 * @returns {string} Field zone ID
 */
function getFieldZone(yardline) {
  for (const zone of FIELD_ZONES) {
    if (yardline >= zone.yardRange[0] && yardline <= zone.yardRange[1]) {
      return zone.id;
    }
  }
  return 'unknown';
}

/**
 * Determine down & distance category
 * @param {number} down - Down (1-4)
 * @param {number} distance - Distance to go
 * @returns {string} Category ID
 */
function getDownDistanceCategory(down, distance) {
  for (const cat of DOWN_DISTANCE_CATEGORIES) {
    if (cat.down === down && distance >= cat.distanceRange[0] && distance <= cat.distanceRange[1]) {
      return cat.id;
    }
  }
  return `${down}_${distance > 6 ? 'long' : distance > 3 ? 'medium' : 'short'}`;
}

/**
 * Check if snap is in garbage time
 * @param {Object} snap - Snap object
 * @param {number} threshold - Score differential threshold
 * @returns {boolean}
 */
function isGarbageTime(snap, threshold = 21) {
  const diff = Math.abs(snap.scoreDifferential || 0);
  const quarter = snap.quarter || 1;

  // 4th quarter with large lead/deficit
  if (quarter >= 4 && diff >= threshold) {
    return true;
  }

  // 3rd quarter with very large lead/deficit
  if (quarter === 3 && diff >= threshold + 7) {
    return true;
  }

  return false;
}

/**
 * Calculate variance of an array
 * @param {Array} values - Array of numbers
 * @returns {number} Variance
 */
function calculateVariance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 * @param {Array} values - Array of numbers
 * @returns {number} Standard deviation
 */
function calculateStdDev(values) {
  return Math.sqrt(calculateVariance(values));
}

// ============================================================================
// CORE METRICS
// ============================================================================

/**
 * Calculate season-wide core metrics
 * @param {Array} games - Array of game objects
 * @param {Array} plays - All snaps across games
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Object} Season metrics
 */
export function getSeasonMetrics(games, plays, setupConfig = {}) {
  if (!plays || plays.length === 0) {
    return {
      totalSnaps: 0,
      snapsPerGame: 0,
      totalYards: 0,
      yardsPerPlay: 0,
      efficiency: 0,
      explosiveRate: 0,
      explosivePlays: 0,
      negativeRate: 0,
      negativePlays: 0,
      thirdDownConversion: 0,
      redZoneConversion: 0,
      firstDownsPerGame: 0
    };
  }

  const successCriteria = setupConfig?.qualityControlDefinitions?.efficiencyThresholds || DEFAULT_SUCCESS_CRITERIA;
  const explosiveThresholds = setupConfig?.qualityControlDefinitions?.explosiveThresholds || DEFAULT_EXPLOSIVE_THRESHOLDS;
  const garbageTimeThreshold = setupConfig?.seasonAnalytics?.settings?.garbageTimeThreshold || 21;

  // Filter out garbage time if configured
  const relevantPlays = plays.filter(snap => !isGarbageTime(snap, garbageTimeThreshold));

  const totalSnaps = relevantPlays.length;
  const snapsPerGame = games.length > 0 ? Math.round(totalSnaps / games.length) : 0;

  // Yards
  const totalYards = relevantPlays.reduce((sum, snap) => sum + (snap.resultYards || 0), 0);
  const yardsPerPlay = totalSnaps > 0 ? (totalYards / totalSnaps).toFixed(1) : 0;

  // Success rate
  const successfulPlays = relevantPlays.filter(snap => isSuccessfulPlay(snap, successCriteria));
  const efficiency = totalSnaps > 0 ? Math.round((successfulPlays.length / totalSnaps) * 100) : 0;

  // Explosive plays
  const explosivePlays = relevantPlays.filter(snap => isExplosivePlay(snap, snap.bucketId, explosiveThresholds));
  const explosiveRate = totalSnaps > 0 ? Math.round((explosivePlays.length / totalSnaps) * 100) : 0;

  // Negative plays
  const negativePlays = relevantPlays.filter(snap => (snap.resultYards || 0) < 0);
  const negativeRate = totalSnaps > 0 ? Math.round((negativePlays.length / totalSnaps) * 100) : 0;

  // Third down conversion
  const thirdDownPlays = relevantPlays.filter(snap => snap.down === 3);
  const thirdDownConversions = thirdDownPlays.filter(snap => (snap.resultYards || 0) >= (snap.distance || 0));
  const thirdDownConversion = thirdDownPlays.length > 0
    ? Math.round((thirdDownConversions.length / thirdDownPlays.length) * 100)
    : 0;

  // Red zone scoring (assuming scoring plays are marked somehow or yards push into end zone)
  const redZonePlays = relevantPlays.filter(snap => {
    const zone = snap.fieldZone || getFieldZone(snap.yardline || 50);
    return zone === 'red_zone' || zone === 'goal_line';
  });
  // This is a simplification - real red zone conversion would need drive-level data
  const redZoneConversion = redZonePlays.length > 0 ? 0 : 0; // Placeholder

  // First downs
  const firstDownPlays = relevantPlays.filter(snap => {
    const yards = snap.resultYards || 0;
    const distance = snap.distance || 10;
    return yards >= distance || (snap.down === 1 && yards >= 4);
  });
  const firstDownsPerGame = games.length > 0 ? (firstDownPlays.length / games.length).toFixed(1) : 0;

  return {
    totalSnaps,
    snapsPerGame,
    totalYards,
    yardsPerPlay: parseFloat(yardsPerPlay),
    efficiency,
    explosiveRate,
    explosivePlays: explosivePlays.length,
    negativeRate,
    negativePlays: negativePlays.length,
    thirdDownConversion,
    redZoneConversion,
    firstDownsPerGame: parseFloat(firstDownsPerGame)
  };
}

// ============================================================================
// BUCKET PERFORMANCE
// ============================================================================

/**
 * Calculate performance by bucket (Run/Pass/Screen/RPO)
 * @param {Array} games - Array of game objects
 * @param {Array} plays - All snaps
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Array} Bucket performance array
 */
export function getBucketPerformance(games, plays, setupConfig = {}) {
  const playBuckets = setupConfig?.playBuckets || [];
  const successCriteria = setupConfig?.qualityControlDefinitions?.efficiencyThresholds || DEFAULT_SUCCESS_CRITERIA;
  const explosiveThresholds = setupConfig?.qualityControlDefinitions?.explosiveThresholds || DEFAULT_EXPLOSIVE_THRESHOLDS;

  // Build bucket map
  const bucketMap = {};
  playBuckets.forEach(bucket => {
    bucketMap[bucket.id] = {
      bucketId: bucket.id,
      label: bucket.label || bucket.name,
      color: bucket.color || '#6b7280',
      snaps: 0,
      yards: 0,
      successes: 0,
      explosives: 0,
      negatives: 0
    };
  });

  // Add unknown bucket for unmapped plays
  bucketMap['unknown'] = {
    bucketId: 'unknown',
    label: 'Uncategorized',
    color: '#6b7280',
    snaps: 0,
    yards: 0,
    successes: 0,
    explosives: 0,
    negatives: 0
  };

  // Aggregate plays
  plays.forEach(snap => {
    const bucketId = snap.bucketId || 'unknown';
    const bucket = bucketMap[bucketId] || bucketMap['unknown'];

    bucket.snaps++;
    bucket.yards += snap.resultYards || 0;

    if (isSuccessfulPlay(snap, successCriteria)) {
      bucket.successes++;
    }

    if (isExplosivePlay(snap, bucketId, explosiveThresholds)) {
      bucket.explosives++;
    }

    if ((snap.resultYards || 0) < 0) {
      bucket.negatives++;
    }
  });

  // Calculate derived metrics
  const totalSnaps = plays.length;
  const results = Object.values(bucketMap)
    .filter(b => b.snaps > 0)
    .map(bucket => ({
      ...bucket,
      percentage: totalSnaps > 0 ? Math.round((bucket.snaps / totalSnaps) * 100) : 0,
      yardsPerPlay: bucket.snaps > 0 ? (bucket.yards / bucket.snaps).toFixed(1) : 0,
      efficiency: bucket.snaps > 0 ? Math.round((bucket.successes / bucket.snaps) * 100) : 0,
      explosiveRate: bucket.snaps > 0 ? Math.round((bucket.explosives / bucket.snaps) * 100) : 0,
      negativeRate: bucket.snaps > 0 ? Math.round((bucket.negatives / bucket.snaps) * 100) : 0,
      status: bucket.snaps >= 10
        ? (bucket.successes / bucket.snaps) >= 0.5 ? 'strong' : 'needs-work'
        : 'low-sample'
    }));

  return results.sort((a, b) => b.snaps - a.snaps);
}

// ============================================================================
// CONCEPT PERFORMANCE
// ============================================================================

/**
 * Calculate performance by concept family
 * @param {Array} games - Array of game objects
 * @param {Array} plays - All snaps
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Array} Concept performance array
 */
export function getConceptPerformance(games, plays, setupConfig = {}) {
  const conceptGroups = setupConfig?.conceptGroups || [];
  const playBuckets = setupConfig?.playBuckets || [];
  const minimumSamples = setupConfig?.seasonAnalytics?.settings?.minimumSamples?.concept || DEFAULT_MINIMUM_SAMPLES.concept;
  const successCriteria = setupConfig?.qualityControlDefinitions?.efficiencyThresholds || DEFAULT_SUCCESS_CRITERIA;

  // Build concept map
  const conceptMap = {};
  conceptGroups.forEach(concept => {
    conceptMap[concept.id] = {
      conceptId: concept.id,
      name: concept.label || concept.name,
      parentBucketId: concept.bucketId || concept.categoryId,
      snaps: 0,
      yards: 0,
      successes: 0,
      yardsArray: []
    };
  });

  // Add unknown concept
  conceptMap['unknown'] = {
    conceptId: 'unknown',
    name: 'Uncategorized',
    parentBucketId: 'unknown',
    snaps: 0,
    yards: 0,
    successes: 0,
    yardsArray: []
  };

  // Aggregate plays
  plays.forEach(snap => {
    const conceptId = snap.conceptFamilyId || 'unknown';
    const concept = conceptMap[conceptId] || conceptMap['unknown'];

    concept.snaps++;
    concept.yards += snap.resultYards || 0;
    concept.yardsArray.push(snap.resultYards || 0);

    if (isSuccessfulPlay(snap, successCriteria)) {
      concept.successes++;
    }
  });

  // Calculate derived metrics and attach bucket info
  const bucketMap = {};
  playBuckets.forEach(b => {
    bucketMap[b.id] = { label: b.label || b.name, color: b.color };
  });

  const results = Object.values(conceptMap)
    .filter(c => c.snaps > 0)
    .map(concept => {
      const bucket = bucketMap[concept.parentBucketId] || { label: 'Unknown', color: '#6b7280' };
      const variance = calculateVariance(concept.yardsArray);

      return {
        ...concept,
        parentBucketLabel: bucket.label,
        parentBucketColor: bucket.color,
        yardsPerPlay: concept.snaps > 0 ? (concept.yards / concept.snaps).toFixed(1) : 0,
        efficiency: concept.snaps > 0 ? Math.round((concept.successes / concept.snaps) * 100) : 0,
        variance: variance.toFixed(1),
        sampleSize: concept.snaps >= minimumSamples ? 'sufficient' : 'low'
      };
    });

  // Remove yardsArray from output
  results.forEach(r => delete r.yardsArray);

  return results.sort((a, b) => b.snaps - a.snaps);
}

// ============================================================================
// SITUATION PERFORMANCE
// ============================================================================

/**
 * Calculate performance by situation (field zone, down/distance, special)
 * @param {Array} games - Array of game objects
 * @param {Array} plays - All snaps
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Object} { byFieldZone, byDownDistance, bySpecialSituation }
 */
export function getSituationPerformance(games, plays, setupConfig = {}) {
  const successCriteria = setupConfig?.qualityControlDefinitions?.efficiencyThresholds || DEFAULT_SUCCESS_CRITERIA;
  const customFieldZones = setupConfig?.fieldZones || FIELD_ZONES;
  const customDownDistance = setupConfig?.downDistanceCategories || DOWN_DISTANCE_CATEGORIES;
  const specialSituations = setupConfig?.specialSituations || [];

  // Field Zone Performance
  const fieldZoneMap = {};
  customFieldZones.forEach(zone => {
    fieldZoneMap[zone.id] = {
      zoneId: zone.id,
      name: zone.label || zone.name,
      snaps: 0,
      yards: 0,
      successes: 0,
      explosives: 0
    };
  });

  // Down/Distance Performance
  const ddMap = {};
  customDownDistance.forEach(cat => {
    ddMap[cat.id] = {
      categoryId: cat.id,
      name: cat.label || cat.name,
      down: cat.down,
      snaps: 0,
      yards: 0,
      successes: 0,
      conversions: 0
    };
  });

  // Special Situations Performance
  const specialMap = {};
  specialSituations.forEach(sit => {
    specialMap[sit.id] = {
      situationId: sit.id,
      name: sit.label || sit.name,
      snaps: 0,
      yards: 0,
      successes: 0
    };
  });

  // Aggregate plays
  plays.forEach(snap => {
    // Field zone
    const zoneId = snap.fieldZone || getFieldZone(snap.yardline || 50);
    if (fieldZoneMap[zoneId]) {
      fieldZoneMap[zoneId].snaps++;
      fieldZoneMap[zoneId].yards += snap.resultYards || 0;
      if (isSuccessfulPlay(snap, successCriteria)) {
        fieldZoneMap[zoneId].successes++;
      }
      if (isExplosivePlay(snap, snap.bucketId)) {
        fieldZoneMap[zoneId].explosives++;
      }
    }

    // Down/distance
    const ddId = getDownDistanceCategory(snap.down, snap.distance || 10);
    if (ddMap[ddId]) {
      ddMap[ddId].snaps++;
      ddMap[ddId].yards += snap.resultYards || 0;
      if (isSuccessfulPlay(snap, successCriteria)) {
        ddMap[ddId].successes++;
      }
      // Track conversions for 3rd and 4th down
      if ((snap.down === 3 || snap.down === 4) && (snap.resultYards || 0) >= (snap.distance || 0)) {
        ddMap[ddId].conversions++;
      }
    }

    // Special situations (from snap's situationTag)
    const sitId = snap.situationTag;
    if (sitId && specialMap[sitId]) {
      specialMap[sitId].snaps++;
      specialMap[sitId].yards += snap.resultYards || 0;
      if (isSuccessfulPlay(snap, successCriteria)) {
        specialMap[sitId].successes++;
      }
    }
  });

  // Calculate derived metrics
  const byFieldZone = Object.values(fieldZoneMap)
    .filter(z => z.snaps > 0)
    .map(zone => ({
      ...zone,
      yardsPerPlay: zone.snaps > 0 ? (zone.yards / zone.snaps).toFixed(1) : 0,
      efficiency: zone.snaps > 0 ? Math.round((zone.successes / zone.snaps) * 100) : 0,
      explosiveRate: zone.snaps > 0 ? Math.round((zone.explosives / zone.snaps) * 100) : 0
    }));

  const byDownDistance = Object.values(ddMap)
    .filter(d => d.snaps > 0)
    .map(dd => ({
      ...dd,
      yardsPerPlay: dd.snaps > 0 ? (dd.yards / dd.snaps).toFixed(1) : 0,
      efficiency: dd.snaps > 0 ? Math.round((dd.successes / dd.snaps) * 100) : 0,
      conversionRate: dd.snaps > 0 && (dd.down === 3 || dd.down === 4)
        ? Math.round((dd.conversions / dd.snaps) * 100)
        : null
    }))
    .sort((a, b) => a.down - b.down);

  const bySpecialSituation = Object.values(specialMap)
    .filter(s => s.snaps > 0)
    .map(sit => ({
      ...sit,
      yardsPerPlay: sit.snaps > 0 ? (sit.yards / sit.snaps).toFixed(1) : 0,
      efficiency: sit.snaps > 0 ? Math.round((sit.successes / sit.snaps) * 100) : 0
    }));

  return { byFieldZone, byDownDistance, bySpecialSituation };
}

// ============================================================================
// TENDENCY ANALYSIS (SELF-SCOUT)
// ============================================================================

/**
 * Calculate tendency analysis for self-scouting
 * @param {Array} games - Array of game objects
 * @param {Array} plays - All snaps
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Object} Tendency analysis
 */
export function getTendencyAnalysis(games, plays, setupConfig = {}) {
  if (!plays || plays.length === 0) {
    return {
      predictabilityIndex: 0,
      formationTendencies: [],
      motionTendencies: [],
      personnelTendencies: [],
      downDistanceTendencies: []
    };
  }

  // Formation -> Bucket correlation
  const formationBucketMap = {};
  plays.forEach(snap => {
    const formation = snap.formation || 'Unknown';
    const bucketId = snap.bucketId || 'unknown';

    if (!formationBucketMap[formation]) {
      formationBucketMap[formation] = { total: 0, buckets: {} };
    }
    formationBucketMap[formation].total++;
    formationBucketMap[formation].buckets[bucketId] = (formationBucketMap[formation].buckets[bucketId] || 0) + 1;
  });

  const formationTendencies = Object.entries(formationBucketMap)
    .map(([formation, data]) => {
      // Find dominant bucket
      const bucketCounts = Object.entries(data.buckets);
      const dominant = bucketCounts.sort((a, b) => b[1] - a[1])[0];
      const dominantPercent = data.total > 0 ? Math.round((dominant[1] / data.total) * 100) : 0;

      return {
        formation,
        totalSnaps: data.total,
        dominantBucket: dominant[0],
        dominantPercent,
        isPredictable: dominantPercent >= 70,
        bucketBreakdown: Object.fromEntries(
          bucketCounts.map(([b, c]) => [b, Math.round((c / data.total) * 100)])
        )
      };
    })
    .filter(f => f.totalSnaps >= 5)
    .sort((a, b) => b.dominantPercent - a.dominantPercent);

  // Motion tendencies
  const motionBucketMap = {};
  plays.filter(snap => snap.motionType).forEach(snap => {
    const motion = snap.motionType;
    const bucketId = snap.bucketId || 'unknown';

    if (!motionBucketMap[motion]) {
      motionBucketMap[motion] = { total: 0, buckets: {} };
    }
    motionBucketMap[motion].total++;
    motionBucketMap[motion].buckets[bucketId] = (motionBucketMap[motion].buckets[bucketId] || 0) + 1;
  });

  const motionTendencies = Object.entries(motionBucketMap)
    .map(([motion, data]) => {
      const bucketCounts = Object.entries(data.buckets);
      const dominant = bucketCounts.sort((a, b) => b[1] - a[1])[0];
      const dominantPercent = data.total > 0 ? Math.round((dominant[1] / data.total) * 100) : 0;

      return {
        motion,
        totalSnaps: data.total,
        dominantBucket: dominant[0],
        dominantPercent,
        isPredictable: dominantPercent >= 70
      };
    })
    .filter(m => m.totalSnaps >= 3)
    .sort((a, b) => b.dominantPercent - a.dominantPercent);

  // Personnel tendencies
  const personnelBucketMap = {};
  plays.forEach(snap => {
    const personnel = snap.personnelUnit || 'Unknown';
    const bucketId = snap.bucketId || 'unknown';

    if (!personnelBucketMap[personnel]) {
      personnelBucketMap[personnel] = { total: 0, buckets: {} };
    }
    personnelBucketMap[personnel].total++;
    personnelBucketMap[personnel].buckets[bucketId] = (personnelBucketMap[personnel].buckets[bucketId] || 0) + 1;
  });

  const personnelTendencies = Object.entries(personnelBucketMap)
    .map(([personnel, data]) => {
      const bucketCounts = Object.entries(data.buckets);
      const dominant = bucketCounts.sort((a, b) => b[1] - a[1])[0];
      const dominantPercent = data.total > 0 ? Math.round((dominant[1] / data.total) * 100) : 0;

      return {
        personnel,
        totalSnaps: data.total,
        dominantBucket: dominant[0],
        dominantPercent,
        isPredictable: dominantPercent >= 70
      };
    })
    .filter(p => p.totalSnaps >= 5);

  // Down & Distance tendencies
  const ddBucketMap = {};
  plays.forEach(snap => {
    const ddId = getDownDistanceCategory(snap.down, snap.distance || 10);
    const bucketId = snap.bucketId || 'unknown';

    if (!ddBucketMap[ddId]) {
      ddBucketMap[ddId] = { total: 0, buckets: {} };
    }
    ddBucketMap[ddId].total++;
    ddBucketMap[ddId].buckets[bucketId] = (ddBucketMap[ddId].buckets[bucketId] || 0) + 1;
  });

  const downDistanceTendencies = Object.entries(ddBucketMap)
    .map(([dd, data]) => {
      const bucketCounts = Object.entries(data.buckets);
      const dominant = bucketCounts.sort((a, b) => b[1] - a[1])[0];
      const dominantPercent = data.total > 0 ? Math.round((dominant[1] / data.total) * 100) : 0;

      return {
        downDistance: dd,
        totalSnaps: data.total,
        dominantBucket: dominant[0],
        dominantPercent,
        isPredictable: dominantPercent >= 70
      };
    })
    .filter(d => d.totalSnaps >= 5);

  // Overall predictability index (average of predictable tendencies)
  const allTendencies = [...formationTendencies, ...personnelTendencies];
  const predictableCount = allTendencies.filter(t => t.isPredictable).length;
  const predictabilityIndex = allTendencies.length > 0
    ? Math.round((predictableCount / allTendencies.length) * 100)
    : 0;

  return {
    predictabilityIndex,
    formationTendencies,
    motionTendencies,
    personnelTendencies,
    downDistanceTendencies
  };
}

// ============================================================================
// DRIVE ANALYSIS
// ============================================================================

/**
 * Calculate drive-level outcomes
 * @param {Array} games - Array of game objects
 * @returns {Object} Drive analysis
 */
export function getDriveAnalysis(games) {
  // Note: Full drive analysis requires drive-level data in the import
  // This is a simplified version based on available snap data

  const totalGames = games.length;

  if (totalGames === 0) {
    return {
      drivesPerGame: 0,
      scoringRate: 0,
      avgPlaysPerDrive: 0,
      redZoneConversion: 0,
      threeAndOutRate: 0,
      avgStartingPosition: 0
    };
  }

  // Estimate drives based on 1st & 10 plays
  let totalDrives = 0;
  let totalPlays = 0;

  games.forEach(game => {
    const snaps = game.snaps || [];
    const firstDownPlays = snaps.filter(s => s.down === 1 && (s.distance || 10) >= 10);
    totalDrives += firstDownPlays.length;
    totalPlays += snaps.length;
  });

  const drivesPerGame = totalGames > 0 ? (totalDrives / totalGames).toFixed(1) : 0;
  const avgPlaysPerDrive = totalDrives > 0 ? (totalPlays / totalDrives).toFixed(1) : 0;

  return {
    drivesPerGame: parseFloat(drivesPerGame),
    scoringRate: 0, // Would need scoring data
    avgPlaysPerDrive: parseFloat(avgPlaysPerDrive),
    redZoneConversion: 0, // Would need drive-level red zone data
    threeAndOutRate: 0, // Would need drive-level data
    avgStartingPosition: 0 // Would need drive start data
  };
}

// ============================================================================
// GAME-BY-GAME TRENDS
// ============================================================================

/**
 * Get performance by game for trend analysis
 * @param {Array} games - Array of game objects
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Array} Game-by-game performance
 */
export function getGameByGamePerformance(games, setupConfig = {}) {
  const successCriteria = setupConfig?.qualityControlDefinitions?.efficiencyThresholds || DEFAULT_SUCCESS_CRITERIA;

  return games.map(game => {
    const snaps = game.snaps || [];
    const totalSnaps = snaps.length;
    const totalYards = snaps.reduce((sum, s) => sum + (s.resultYards || 0), 0);
    const successfulPlays = snaps.filter(s => isSuccessfulPlay(s, successCriteria));
    const explosivePlays = snaps.filter(s => isExplosivePlay(s, s.bucketId));
    const negativePlays = snaps.filter(s => (s.resultYards || 0) < 0);

    return {
      gameId: game.gameId,
      opponent: game.opponent,
      date: game.date,
      isHome: game.isHome,
      snaps: totalSnaps,
      yards: totalYards,
      yardsPerPlay: totalSnaps > 0 ? (totalYards / totalSnaps).toFixed(1) : 0,
      efficiency: totalSnaps > 0 ? Math.round((successfulPlays.length / totalSnaps) * 100) : 0,
      explosiveRate: totalSnaps > 0 ? Math.round((explosivePlays.length / totalSnaps) * 100) : 0,
      negativeRate: totalSnaps > 0 ? Math.round((negativePlays.length / totalSnaps) * 100) : 0
    };
  });
}

// ============================================================================
// MASTER FUNCTION
// ============================================================================

/**
 * Compute complete season report
 * @param {Array} games - Array of game objects
 * @param {Array} plays - All snaps (flattened from games)
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Object} Complete season report
 */
export function computeSeasonReport(games, plays, setupConfig = {}) {
  // If plays not provided, flatten from games
  const allPlays = plays || games.flatMap(g => g.snaps || []);

  const metrics = getSeasonMetrics(games, allPlays, setupConfig);
  const buckets = getBucketPerformance(games, allPlays, setupConfig);
  const concepts = getConceptPerformance(games, allPlays, setupConfig);
  const situations = getSituationPerformance(games, allPlays, setupConfig);
  const tendencies = getTendencyAnalysis(games, allPlays, setupConfig);
  const drives = getDriveAnalysis(games);
  const gameByGame = getGameByGamePerformance(games, setupConfig);

  return {
    metrics,
    buckets,
    concepts,
    situations,
    tendencies,
    drives,
    gameByGame,
    gamesCount: games.length,
    totalPlays: allPlays.length
  };
}
