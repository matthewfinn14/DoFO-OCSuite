import { useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { computeSeasonReport } from '../utils/seasonAnalytics';
import { generateInsights } from '../utils/insightsEngine';

/**
 * Custom hook for computing and memoizing season analytics
 * @param {string} year - Year to analyze (defaults to activeYear)
 * @returns {Object} Season analytics report with insights
 */
export function useSeasonAnalytics(year = null) {
  const {
    seasonAnalytics,
    activeYear,
    setupConfig
  } = useSchool();

  const targetYear = year || activeYear;
  const yearData = seasonAnalytics[targetYear] || { games: [], importProfiles: [], settings: {} };

  // Flatten all snaps from all games
  const allPlays = useMemo(() => {
    return yearData.games.flatMap(game => game.snaps || []);
  }, [yearData.games]);

  // Compute season report
  const seasonReport = useMemo(() => {
    if (yearData.games.length === 0) {
      return {
        metrics: {
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
        },
        buckets: [],
        concepts: [],
        situations: { byFieldZone: [], byDownDistance: [], bySpecialSituation: [] },
        tendencies: {
          predictabilityIndex: 0,
          formationTendencies: [],
          motionTendencies: [],
          personnelTendencies: [],
          downDistanceTendencies: []
        },
        drives: {
          drivesPerGame: 0,
          scoringRate: 0,
          avgPlaysPerDrive: 0,
          redZoneConversion: 0,
          threeAndOutRate: 0,
          avgStartingPosition: 0
        },
        gameByGame: [],
        gamesCount: 0,
        totalPlays: 0
      };
    }

    // Merge year-specific settings with setupConfig
    const mergedConfig = {
      ...setupConfig,
      seasonAnalytics: {
        settings: yearData.settings
      }
    };

    return computeSeasonReport(yearData.games, allPlays, mergedConfig);
  }, [yearData.games, allPlays, setupConfig, yearData.settings]);

  // Generate insights
  const insights = useMemo(() => {
    if (yearData.games.length === 0) {
      return {
        anomalies: { concepts: { all: [], highOutliers: [], lowOutliers: [] }, highPerformers: [], lowPerformers: [] },
        trends: {
          efficiency: { early: null, mid: null, late: null, trend: 'insufficient_data', pctChange: 0 },
          yardsPerPlay: { early: null, mid: null, late: null, trend: 'insufficient_data', pctChange: 0 },
          explosiveRate: { early: null, mid: null, late: null, trend: 'insufficient_data', pctChange: 0 },
          negativeRate: { early: null, mid: null, late: null, trend: 'insufficient_data', pctChange: 0 }
        },
        smartFilters: [],
        recommendations: [],
        summary: {
          totalIssues: 0,
          totalOpportunities: 0,
          overallTrend: 'stable',
          topRecommendation: null
        }
      };
    }

    return generateInsights(seasonReport, setupConfig);
  }, [seasonReport, setupConfig, yearData.games.length]);

  // Return combined report
  return {
    // Data context
    year: targetYear,
    games: yearData.games,
    importProfiles: yearData.importProfiles,
    settings: yearData.settings,
    hasData: yearData.games.length > 0,

    // Computed report
    report: seasonReport,

    // Insights
    insights,

    // Convenience accessors
    metrics: seasonReport.metrics,
    buckets: seasonReport.buckets,
    concepts: seasonReport.concepts,
    situations: seasonReport.situations,
    tendencies: seasonReport.tendencies,
    drives: seasonReport.drives,
    gameByGame: seasonReport.gameByGame,

    // Insight accessors
    anomalies: insights.anomalies,
    trends: insights.trends,
    smartFilters: insights.smartFilters,
    recommendations: insights.recommendations,
    summary: insights.summary
  };
}

/**
 * Hook for game-filtered analysis
 * @param {string} year - Year to analyze
 * @param {Array} gameIds - Array of game IDs to include (null for all)
 * @returns {Object} Filtered season analytics
 */
export function useFilteredSeasonAnalytics(year = null, gameIds = null) {
  const {
    seasonAnalytics,
    activeYear,
    setupConfig
  } = useSchool();

  const targetYear = year || activeYear;
  const yearData = seasonAnalytics[targetYear] || { games: [], importProfiles: [], settings: {} };

  // Filter games if gameIds provided
  const filteredGames = useMemo(() => {
    if (!gameIds || gameIds.length === 0) {
      return yearData.games;
    }
    const gameIdSet = new Set(gameIds);
    return yearData.games.filter(g => gameIdSet.has(g.gameId));
  }, [yearData.games, gameIds]);

  // Flatten snaps from filtered games
  const allPlays = useMemo(() => {
    return filteredGames.flatMap(game => game.snaps || []);
  }, [filteredGames]);

  // Compute report for filtered games
  const seasonReport = useMemo(() => {
    if (filteredGames.length === 0) {
      return null;
    }

    const mergedConfig = {
      ...setupConfig,
      seasonAnalytics: { settings: yearData.settings }
    };

    return computeSeasonReport(filteredGames, allPlays, mergedConfig);
  }, [filteredGames, allPlays, setupConfig, yearData.settings]);

  return {
    year: targetYear,
    games: filteredGames,
    hasData: filteredGames.length > 0,
    report: seasonReport,
    metrics: seasonReport?.metrics || null,
    buckets: seasonReport?.buckets || [],
    gameByGame: seasonReport?.gameByGame || []
  };
}

/**
 * Hook for comparing two sets of games (e.g., home vs away, vs specific opponents)
 * @param {string} year - Year to analyze
 * @param {Function} splitFn - Function to split games into two groups (game) => 'a' | 'b'
 * @returns {Object} { groupA, groupB, comparison }
 */
export function useSeasonComparison(year = null, splitFn = null) {
  const {
    seasonAnalytics,
    activeYear,
    setupConfig
  } = useSchool();

  const targetYear = year || activeYear;
  const yearData = seasonAnalytics[targetYear] || { games: [], importProfiles: [], settings: {} };

  // Default split function: home vs away
  const defaultSplit = (game) => game.isHome ? 'home' : 'away';
  const split = splitFn || defaultSplit;

  // Split games into two groups
  const { groupA, groupB } = useMemo(() => {
    const a = [];
    const b = [];

    yearData.games.forEach(game => {
      const group = split(game);
      if (group === 'a' || group === 'home') {
        a.push(game);
      } else {
        b.push(game);
      }
    });

    return { groupA: a, groupB: b };
  }, [yearData.games, split]);

  // Compute metrics for each group
  const metricsA = useMemo(() => {
    if (groupA.length === 0) return null;
    const plays = groupA.flatMap(g => g.snaps || []);
    const mergedConfig = { ...setupConfig, seasonAnalytics: { settings: yearData.settings } };
    return computeSeasonReport(groupA, plays, mergedConfig).metrics;
  }, [groupA, setupConfig, yearData.settings]);

  const metricsB = useMemo(() => {
    if (groupB.length === 0) return null;
    const plays = groupB.flatMap(g => g.snaps || []);
    const mergedConfig = { ...setupConfig, seasonAnalytics: { settings: yearData.settings } };
    return computeSeasonReport(groupB, plays, mergedConfig).metrics;
  }, [groupB, setupConfig, yearData.settings]);

  // Calculate comparison deltas
  const comparison = useMemo(() => {
    if (!metricsA || !metricsB) return null;

    return {
      snaps: { a: metricsA.totalSnaps, b: metricsB.totalSnaps },
      yardsPerPlay: {
        a: metricsA.yardsPerPlay,
        b: metricsB.yardsPerPlay,
        delta: (metricsA.yardsPerPlay - metricsB.yardsPerPlay).toFixed(1)
      },
      efficiency: {
        a: metricsA.efficiency,
        b: metricsB.efficiency,
        delta: metricsA.efficiency - metricsB.efficiency
      },
      explosiveRate: {
        a: metricsA.explosiveRate,
        b: metricsB.explosiveRate,
        delta: metricsA.explosiveRate - metricsB.explosiveRate
      }
    };
  }, [metricsA, metricsB]);

  return {
    year: targetYear,
    groupA: { games: groupA, metrics: metricsA },
    groupB: { games: groupB, metrics: metricsB },
    comparison,
    hasData: groupA.length > 0 || groupB.length > 0
  };
}

export default useSeasonAnalytics;
