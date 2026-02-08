import { useMemo } from 'react';
import {
  computeCoverageReport,
  getScriptRows,
  getBucketCoverage,
  getConceptCoverage,
  getQuotaCompliance,
  getSituationCoverage,
  getDayBreakdown
} from '../utils/practiceCoverage';

/**
 * Custom hook for computing and memoizing practice coverage metrics
 * @param {Object} week - Week object with practicePlans
 * @param {Object} plays - Plays object keyed by ID
 * @param {Object} setupConfig - Setup configuration
 * @returns {Object} Coverage report with all metrics
 */
export function usePracticeCoverage(week, plays, setupConfig) {
  // Convert plays object to Map for O(1) lookups
  const playsMap = useMemo(() => {
    if (!plays) return {};
    // If already an object, just return it
    if (typeof plays === 'object' && !Array.isArray(plays)) {
      return plays;
    }
    // If array, convert to object
    return plays.reduce((acc, play) => {
      acc[play.id] = play;
      return acc;
    }, {});
  }, [plays]);

  // Compute full coverage report
  const coverageReport = useMemo(() => {
    if (!week) {
      return {
        buckets: [],
        concepts: [],
        quotas: [],
        situations: [],
        callSheetPlays: [],
        days: [],
        summary: {
          totalReps: 0,
          uniquePlays: 0,
          quotasMetPercent: null,
          quotasMet: 0,
          quotasTotal: 0,
          situationsCoveredPercent: null,
          situationsCovered: 0,
          situationsOnSheet: 0,
          callSheetPracticedPercent: null,
          callSheetPracticed: 0,
          callSheetTotal: 0
        },
        recommendations: [],
        executionQuality: {},
        executionIssues: {
          overallAvgRating: null,
          totalRatedReps: 0,
          workedTagsSummary: [],
          didntWorkTagsSummary: []
        }
      };
    }
    return computeCoverageReport(week, playsMap, setupConfig);
  }, [week, playsMap, setupConfig]);

  return coverageReport;
}

/**
 * Hook for day-filtered coverage (when viewing specific day)
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object
 * @param {Object} setupConfig - Setup configuration
 * @param {string} dayFilter - Day name to filter by
 * @returns {Object} Day-filtered coverage report
 */
export function useDayCoverage(week, plays, setupConfig, dayFilter) {
  const playsMap = useMemo(() => {
    if (!plays) return {};
    if (typeof plays === 'object' && !Array.isArray(plays)) return plays;
    return plays.reduce((acc, play) => {
      acc[play.id] = play;
      return acc;
    }, {});
  }, [plays]);

  return useMemo(() => {
    if (!week || !dayFilter) return null;

    const playBuckets = setupConfig?.playBuckets || [];
    const playRepTargets = week?.playRepTargets || {};
    const gamePlanLayouts = week?.gamePlanLayouts || {};
    const gamePlan = week?.offensiveGamePlan || {};

    // Create a filtered week object with only the selected day
    const filteredWeek = {
      ...week,
      practicePlans: {
        [dayFilter]: week.practicePlans?.[dayFilter]
      }
    };

    const scriptRows = getScriptRows(filteredWeek);
    const uniquePlayIds = new Set(scriptRows.filter(r => r.row.playId).map(r => r.row.playId));

    const buckets = getBucketCoverage(filteredWeek, playsMap, playBuckets, playRepTargets);
    const concepts = getConceptCoverage(filteredWeek, playsMap, playBuckets);
    const quotas = getQuotaCompliance(filteredWeek, playsMap, playRepTargets);
    const situations = getSituationCoverage(filteredWeek, playsMap, setupConfig, gamePlanLayouts, gamePlan);

    const totalReps = scriptRows.filter(r => r.row.playId).length;
    const quotasMet = quotas.filter(q => q.status === 'met').length;
    const quotasTotal = quotas.length;
    const situationsCovered = situations.filter(s => s.onCallSheet && s.repsScripted > 0).length;
    const situationsOnSheet = situations.filter(s => s.onCallSheet).length;

    return {
      dayName: dayFilter,
      buckets,
      concepts,
      quotas,
      situations,
      summary: {
        totalReps,
        uniquePlays: uniquePlayIds.size,
        quotasMetPercent: quotasTotal > 0 ? Math.round((quotasMet / quotasTotal) * 100) : null,
        situationsCoveredPercent: situationsOnSheet > 0 ? Math.round((situationsCovered / situationsOnSheet) * 100) : null
      }
    };
  }, [week, playsMap, setupConfig, dayFilter]);
}

export default usePracticeCoverage;
