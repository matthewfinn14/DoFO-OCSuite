/**
 * Insights Engine
 * Anomaly detection, trend analysis, and smart filter generation for season review
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default MAD threshold for anomaly detection
 * Values beyond threshold * MAD from median are considered anomalies
 */
const DEFAULT_MAD_THRESHOLD = 2.5;

/**
 * Smart filter definitions
 */
const SMART_FILTER_DEFINITIONS = [
  {
    id: 'underused_efficient',
    label: 'Underused but Efficient',
    description: 'High efficiency concepts with low volume - potential opportunities',
    severity: 'opportunity',
    test: (item) => item.efficiency >= 60 && item.snaps < item.avgSnaps * 0.5 && item.snaps >= 3
  },
  {
    id: 'high_volume_low_return',
    label: 'High Volume, Low Return',
    description: 'Frequently called with poor results - consider reducing',
    severity: 'high',
    test: (item) => item.snaps >= item.totalSnaps * 0.1 && item.efficiency < 40
  },
  {
    id: 'volatile_by_personnel',
    label: 'Volatile by Personnel',
    description: 'High variance across personnel groupings',
    severity: 'medium',
    test: (item) => item.personnelVariance && item.personnelVariance > 25
  },
  {
    id: 'struggling_vs_pressure',
    label: 'Struggling vs Pressure',
    description: 'Significant efficiency drop when facing pressure',
    severity: 'high',
    test: (item) => item.pressuredEfficiency !== undefined &&
      item.efficiency - item.pressuredEfficiency > 20
  },
  {
    id: 'garbage_time_inflated',
    label: 'Garbage-Time Inflated',
    description: 'Stats boosted by garbage time performance',
    severity: 'medium',
    test: (item) => item.garbageTimeSnaps > item.snaps * 0.3 &&
      item.garbageTimeEfficiency > item.regularTimeEfficiency + 15
  },
  {
    id: 'starter_dependent',
    label: 'Only Effective with Starters',
    description: 'Large performance gap between starter and backup snaps',
    severity: 'medium',
    test: (item) => item.starterEfficiency !== undefined &&
      item.backupEfficiency !== undefined &&
      item.starterEfficiency - item.backupEfficiency > 25
  },
  {
    id: 'red_zone_leakage',
    label: 'Red Zone Leakage',
    description: 'Underperforming in red zone compared to overall',
    severity: 'high',
    test: (item) => item.redZoneEfficiency !== undefined &&
      item.efficiency - item.redZoneEfficiency > 15
  },
  {
    id: 'third_down_dropoff',
    label: '3rd Down Drop-off',
    description: 'Conversion rate significantly below baseline',
    severity: 'high',
    test: (item) => item.thirdDownConversion !== undefined &&
      item.thirdDownConversion < 35
  },
  {
    id: 'predictable_formation',
    label: 'Predictable by Formation',
    description: 'Formation-bucket correlation is too high',
    severity: 'medium',
    test: (item) => item.dominantPercent !== undefined && item.dominantPercent >= 75
  }
];

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

/**
 * Calculate median of an array
 * @param {Array} values - Array of numbers
 * @returns {number} Median
 */
function median(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate Median Absolute Deviation (MAD)
 * More robust than standard deviation for outlier detection
 * @param {Array} values - Array of numbers
 * @returns {number} MAD
 */
function mad(values) {
  if (!values || values.length === 0) return 0;
  const med = median(values);
  const deviations = values.map(v => Math.abs(v - med));
  return median(deviations);
}

/**
 * Calculate modified z-score using MAD
 * @param {number} value - Value to score
 * @param {number} med - Median of dataset
 * @param {number} madValue - MAD of dataset
 * @returns {number} Modified z-score
 */
function modifiedZScore(value, med, madValue) {
  if (madValue === 0) return 0;
  // 0.6745 is the scaling factor for normal distribution
  return 0.6745 * (value - med) / madValue;
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect anomalies in a dataset using MAD-based method
 * @param {Array} data - Array of objects
 * @param {Object} options - { valueKey, threshold }
 * @returns {Array} Data with anomaly flags
 */
export function detectAnomalies(data, options = {}) {
  const { valueKey = 'efficiency', threshold = DEFAULT_MAD_THRESHOLD } = options;

  if (!data || data.length === 0) return [];
  if (data.length < 3) {
    // Not enough data for meaningful anomaly detection
    return data.map(item => ({ ...item, isAnomaly: false, zScore: 0, direction: null }));
  }

  // Extract values
  const values = data.map(item => item[valueKey] || 0);

  // Calculate statistics
  const med = median(values);
  const madValue = mad(values);

  // Score each item
  return data.map(item => {
    const value = item[valueKey] || 0;
    const zScore = modifiedZScore(value, med, madValue);
    const isAnomaly = Math.abs(zScore) > threshold;
    const direction = zScore > threshold ? 'high' : zScore < -threshold ? 'low' : null;

    return {
      ...item,
      isAnomaly,
      zScore: parseFloat(zScore.toFixed(2)),
      direction,
      medianValue: med
    };
  });
}

/**
 * Find outliers in bucket/concept performance
 * @param {Array} performanceData - Array of performance objects
 * @param {string} metricKey - Which metric to analyze
 * @returns {Object} { highOutliers, lowOutliers }
 */
export function findPerformanceOutliers(performanceData, metricKey = 'efficiency') {
  const annotated = detectAnomalies(performanceData, { valueKey: metricKey });

  const highOutliers = annotated.filter(item => item.direction === 'high');
  const lowOutliers = annotated.filter(item => item.direction === 'low');

  return { highOutliers, lowOutliers, all: annotated };
}

// ============================================================================
// TREND DETECTION
// ============================================================================

/**
 * Detect trends across season thirds (early/mid/late)
 * @param {Array} games - Array of game objects sorted by date
 * @param {Function} metricExtractor - Function to extract metric from game
 * @param {Object} options - { minSampleSize }
 * @returns {Object} { early, mid, late, trend, pctChange }
 */
export function detectTrends(games, metricExtractor, options = {}) {
  const { minSampleSize = 3 } = options;

  if (!games || games.length < minSampleSize * 2) {
    return {
      early: null,
      mid: null,
      late: null,
      trend: 'insufficient_data',
      pctChange: 0
    };
  }

  // Split into thirds
  const thirdSize = Math.floor(games.length / 3);
  const earlyGames = games.slice(0, thirdSize);
  const midGames = games.slice(thirdSize, thirdSize * 2);
  const lateGames = games.slice(thirdSize * 2);

  // Calculate averages for each period
  const calcAvg = (gameSlice) => {
    const values = gameSlice.map(g => metricExtractor(g)).filter(v => v !== null && v !== undefined);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };

  const early = calcAvg(earlyGames);
  const mid = calcAvg(midGames);
  const late = calcAvg(lateGames);

  // Determine trend
  let trend = 'stable';
  let pctChange = 0;

  if (early !== null && late !== null && early !== 0) {
    pctChange = Math.round(((late - early) / early) * 100);

    if (pctChange > 10) {
      trend = 'improving';
    } else if (pctChange < -10) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
  }

  return {
    early: early !== null ? parseFloat(early.toFixed(1)) : null,
    mid: mid !== null ? parseFloat(mid.toFixed(1)) : null,
    late: late !== null ? parseFloat(late.toFixed(1)) : null,
    trend,
    pctChange
  };
}

/**
 * Detect trends for multiple metrics
 * @param {Array} gameByGame - Array of game performance objects
 * @returns {Object} Trends for key metrics
 */
export function detectAllTrends(gameByGame) {
  return {
    efficiency: detectTrends(gameByGame, g => g.efficiency),
    yardsPerPlay: detectTrends(gameByGame, g => parseFloat(g.yardsPerPlay)),
    explosiveRate: detectTrends(gameByGame, g => g.explosiveRate),
    negativeRate: detectTrends(gameByGame, g => g.negativeRate)
  };
}

// ============================================================================
// SMART FILTERS
// ============================================================================

/**
 * Generate smart filters based on season report data
 * @param {Object} seasonReport - Complete season report
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Array} Array of smart filter results
 */
export function generateSmartFilters(seasonReport, setupConfig = {}) {
  const results = [];
  const { buckets, concepts, situations, tendencies, gameByGame, metrics, totalPlays } = seasonReport;

  // Calculate average snaps per concept
  const avgSnaps = concepts.length > 0
    ? concepts.reduce((sum, c) => sum + c.snaps, 0) / concepts.length
    : 0;

  // Enrich data with additional context
  const enrichedConcepts = concepts.map(c => ({
    ...c,
    avgSnaps,
    totalSnaps: totalPlays
  }));

  const enrichedBuckets = buckets.map(b => ({
    ...b,
    totalSnaps: totalPlays
  }));

  // Check each smart filter definition
  SMART_FILTER_DEFINITIONS.forEach(filterDef => {
    const matches = [];

    // Apply to concepts
    if (['underused_efficient', 'high_volume_low_return', 'volatile_by_personnel'].includes(filterDef.id)) {
      enrichedConcepts.forEach(concept => {
        if (filterDef.test(concept)) {
          matches.push({
            type: 'concept',
            id: concept.conceptId,
            name: concept.name,
            parentBucket: concept.parentBucketLabel,
            snaps: concept.snaps,
            efficiency: concept.efficiency
          });
        }
      });
    }

    // Apply to buckets
    if (['high_volume_low_return'].includes(filterDef.id)) {
      enrichedBuckets.forEach(bucket => {
        if (filterDef.test(bucket)) {
          matches.push({
            type: 'bucket',
            id: bucket.bucketId,
            name: bucket.label,
            snaps: bucket.snaps,
            efficiency: bucket.efficiency
          });
        }
      });
    }

    // Apply to formation tendencies
    if (filterDef.id === 'predictable_formation') {
      (tendencies?.formationTendencies || []).forEach(formation => {
        if (filterDef.test(formation)) {
          matches.push({
            type: 'formation',
            id: formation.formation,
            name: formation.formation,
            dominantBucket: formation.dominantBucket,
            dominantPercent: formation.dominantPercent,
            snaps: formation.totalSnaps
          });
        }
      });
    }

    // Apply to down/distance situations
    if (filterDef.id === 'third_down_dropoff') {
      const thirdDownSituations = (situations?.byDownDistance || []).filter(s => s.down === 3);
      const avgConversion = thirdDownSituations.length > 0
        ? thirdDownSituations.reduce((sum, s) => sum + (s.conversionRate || 0), 0) / thirdDownSituations.length
        : 0;

      if (avgConversion < 35) {
        matches.push({
          type: 'situation',
          id: 'third_down_overall',
          name: '3rd Down Conversions',
          conversionRate: Math.round(avgConversion),
          snaps: thirdDownSituations.reduce((sum, s) => sum + s.snaps, 0)
        });
      }
    }

    // If matches found, add the filter result
    if (matches.length > 0) {
      results.push({
        filterId: filterDef.id,
        label: filterDef.label,
        description: filterDef.description,
        severity: filterDef.severity,
        count: matches.length,
        matches
      });
    }
  });

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, opportunity: 2, low: 3 };
  return results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ============================================================================
// RECOMMENDATIONS ENGINE
// ============================================================================

/**
 * Generate actionable recommendations from insights
 * @param {Object} seasonReport - Complete season report
 * @param {Array} smartFilters - Smart filter results
 * @param {Object} trends - Trend analysis results
 * @returns {Array} Prioritized recommendations
 */
export function generateRecommendations(seasonReport, smartFilters, trends) {
  const recommendations = [];
  const { metrics, buckets, concepts, tendencies } = seasonReport;

  // 1. Address high-severity smart filter issues
  smartFilters
    .filter(f => f.severity === 'high')
    .forEach(filter => {
      filter.matches.slice(0, 3).forEach(match => {
        recommendations.push({
          priority: 1,
          category: 'issue',
          title: filter.label,
          description: `${match.name}: ${filter.description}`,
          action: getActionForFilter(filter.filterId, match),
          data: match
        });
      });
    });

  // 2. Capitalize on opportunities
  smartFilters
    .filter(f => f.severity === 'opportunity')
    .forEach(filter => {
      filter.matches.slice(0, 3).forEach(match => {
        recommendations.push({
          priority: 2,
          category: 'opportunity',
          title: filter.label,
          description: `${match.name}: ${filter.description}`,
          action: getActionForFilter(filter.filterId, match),
          data: match
        });
      });
    });

  // 3. Address declining trends
  if (trends?.efficiency?.trend === 'declining') {
    recommendations.push({
      priority: 1,
      category: 'trend',
      title: 'Efficiency Declining',
      description: `Overall efficiency dropped ${Math.abs(trends.efficiency.pctChange)}% from early to late season`,
      action: 'Review film from late-season games to identify recurring issues',
      data: trends.efficiency
    });
  }

  if (trends?.explosiveRate?.trend === 'declining') {
    recommendations.push({
      priority: 2,
      category: 'trend',
      title: 'Explosive Plays Declining',
      description: `Explosive play rate dropped ${Math.abs(trends.explosiveRate.pctChange)}% over the season`,
      action: 'Consider adding new shot plays or adjusting blocking schemes',
      data: trends.explosiveRate
    });
  }

  // 4. Address predictability
  if (tendencies?.predictabilityIndex > 50) {
    const predictableFormations = (tendencies.formationTendencies || [])
      .filter(f => f.isPredictable)
      .slice(0, 3);

    if (predictableFormations.length > 0) {
      recommendations.push({
        priority: 2,
        category: 'tendency',
        title: 'High Predictability',
        description: `${predictableFormations.length} formations have predictable play type tendencies`,
        action: 'Mix play types better from key formations',
        data: { predictabilityIndex: tendencies.predictabilityIndex, formations: predictableFormations }
      });
    }
  }

  // 5. Bucket balance issues
  const runBucket = buckets.find(b => b.label?.toLowerCase().includes('run'));
  const passBucket = buckets.find(b => b.label?.toLowerCase().includes('pass'));

  if (runBucket && passBucket) {
    const runPct = runBucket.percentage;
    const passPct = passBucket.percentage;

    // Check for extreme imbalance
    if (Math.abs(runPct - passPct) > 30) {
      const heavy = runPct > passPct ? 'run' : 'pass';
      recommendations.push({
        priority: 3,
        category: 'balance',
        title: `${heavy.charAt(0).toUpperCase() + heavy.slice(1)}-Heavy Balance`,
        description: `Run/Pass split is ${runPct}/${passPct} - consider better balance`,
        action: `Add more ${heavy === 'run' ? 'pass' : 'run'} concepts to call sheet`,
        data: { runPct, passPct }
      });
    }
  }

  // 6. Underperforming concepts with high volume
  concepts
    .filter(c => c.snaps >= 10 && c.efficiency < 40)
    .slice(0, 2)
    .forEach(concept => {
      recommendations.push({
        priority: 2,
        category: 'concept',
        title: `${concept.name} Underperforming`,
        description: `${concept.snaps} snaps at ${concept.efficiency}% efficiency`,
        action: 'Consider reducing volume or adding variations',
        data: concept
      });
    });

  // Sort by priority
  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * Get specific action for a smart filter
 * @param {string} filterId - Filter ID
 * @param {Object} match - Matched item
 * @returns {string} Action recommendation
 */
function getActionForFilter(filterId, match) {
  const actions = {
    underused_efficient: `Increase volume for ${match.name} - currently ${match.snaps} snaps at ${match.efficiency}% efficiency`,
    high_volume_low_return: `Reduce calls for ${match.name} or review execution on film`,
    volatile_by_personnel: `Analyze why ${match.name} performs differently with various personnel groupings`,
    struggling_vs_pressure: `Add hot routes or protection adjustments for ${match.name}`,
    garbage_time_inflated: `Evaluate ${match.name} performance in competitive game situations only`,
    starter_dependent: `Consider installing simpler variations of ${match.name} for backup personnel`,
    red_zone_leakage: `Review red zone film for ${match.name} and adjust blocking/timing`,
    third_down_dropoff: `Add more high-percentage 3rd down concepts`,
    predictable_formation: `Mix in more ${match.dominantBucket === 'run' ? 'passes' : 'runs'} from ${match.name}`
  };

  return actions[filterId] || 'Review film and adjust accordingly';
}

// ============================================================================
// INSIGHTS SUMMARY
// ============================================================================

/**
 * Generate complete insights package
 * @param {Object} seasonReport - Complete season report
 * @param {Object} setupConfig - Tenant configuration
 * @returns {Object} { anomalies, trends, smartFilters, recommendations }
 */
export function generateInsights(seasonReport, setupConfig = {}) {
  const { concepts, gameByGame } = seasonReport;

  // Detect anomalies in concept performance
  const conceptAnomalies = findPerformanceOutliers(concepts, 'efficiency');

  // Detect trends
  const trends = detectAllTrends(gameByGame);

  // Generate smart filters
  const smartFilters = generateSmartFilters(seasonReport, setupConfig);

  // Generate recommendations
  const recommendations = generateRecommendations(seasonReport, smartFilters, trends);

  return {
    anomalies: {
      concepts: conceptAnomalies,
      highPerformers: conceptAnomalies.highOutliers,
      lowPerformers: conceptAnomalies.lowOutliers
    },
    trends,
    smartFilters,
    recommendations,
    summary: {
      totalIssues: smartFilters.filter(f => f.severity === 'high').reduce((sum, f) => sum + f.count, 0),
      totalOpportunities: smartFilters.filter(f => f.severity === 'opportunity').reduce((sum, f) => sum + f.count, 0),
      overallTrend: trends.efficiency?.trend || 'stable',
      topRecommendation: recommendations[0] || null
    }
  };
}
