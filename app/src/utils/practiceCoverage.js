/**
 * Practice Coverage Utilities
 * Pure compute functions for analyzing practice script coverage metrics
 */

/**
 * Extract all script rows from a week's practice plans
 * @param {Object} week - Week object with practicePlans
 * @param {string} dayFilter - Optional day name to filter by (e.g., 'Monday')
 * @param {string} segmentTypeFilter - Optional segment type ID to filter by
 * @returns {Array} Array of { row, dayName, segmentId, segmentType, segmentPhase }
 */
export function getScriptRows(week, dayFilter = null, segmentTypeFilter = null) {
  if (!week?.practicePlans) return [];

  const rows = [];
  const practicePlans = week.practicePlans;

  Object.entries(practicePlans).forEach(([dayName, dayPlan]) => {
    if (dayFilter && dayName !== dayFilter) return;

    (dayPlan.segments || []).forEach(segment => {
      if (segmentTypeFilter && segment.typeId !== segmentTypeFilter && segment.type !== segmentTypeFilter) return;

      (segment.script || []).forEach(row => {
        rows.push({
          row,
          dayName,
          segmentId: segment.id,
          segmentType: segment.typeId || segment.type,
          segmentPhase: segment.phase || segment.group || 'O'
        });
      });
    });
  });

  return rows;
}

/**
 * Aggregate reps by bucket (Run/Pass/Screen/RPO)
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @param {Array} playBuckets - Array of bucket definitions from setupConfig
 * @param {Object} playRepTargets - Map of playId -> target reps
 * @returns {Array} Array of bucket coverage objects
 */
export function getBucketCoverage(week, plays, playBuckets, playRepTargets = {}) {
  const scriptRows = getScriptRows(week);
  const bucketReps = {};
  const bucketTargetReps = {};

  // Initialize buckets
  (playBuckets || []).forEach(bucket => {
    bucketReps[bucket.id] = 0;
    bucketTargetReps[bucket.id] = 0;
  });

  // Count reps by bucket
  scriptRows.forEach(({ row }) => {
    if (!row.playId) return;
    const play = plays?.[row.playId];
    if (!play?.bucketId) return;

    bucketReps[play.bucketId] = (bucketReps[play.bucketId] || 0) + 1;
  });

  // Sum target reps for plays in each bucket
  Object.entries(playRepTargets || {}).forEach(([playId, target]) => {
    const play = plays?.[playId];
    if (!play?.bucketId) return;
    bucketTargetReps[play.bucketId] = (bucketTargetReps[play.bucketId] || 0) + target;
  });

  const totalReps = Object.values(bucketReps).reduce((sum, r) => sum + r, 0);

  return (playBuckets || []).map(bucket => {
    const reps = bucketReps[bucket.id] || 0;
    const targetReps = bucketTargetReps[bucket.id] || 0;
    const delta = reps - targetReps;
    const percentage = totalReps > 0 ? Math.round((reps / totalReps) * 100) : 0;

    let status = 'met';
    if (targetReps > 0) {
      if (reps === 0) status = 'unmet';
      else if (reps < targetReps) status = 'partial';
    }

    return {
      bucketId: bucket.id,
      label: bucket.label || bucket.name,
      color: bucket.color,
      reps,
      percentage,
      targetReps,
      delta,
      status
    };
  });
}

/**
 * Aggregate reps by concept family within buckets
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @param {Array} playBuckets - Array of bucket definitions with families
 * @returns {Array} Array of concept coverage objects
 */
export function getConceptCoverage(week, plays, playBuckets) {
  const scriptRows = getScriptRows(week);
  const conceptReps = {};
  const bucketTotalReps = {};

  // Count reps by concept (conceptFamily on play - stored as string name)
  scriptRows.forEach(({ row }) => {
    if (!row.playId) return;
    const play = plays?.[row.playId];
    if (!play) return;

    // Use conceptFamily (string name) - this is how plays store their concept group
    const conceptName = play.conceptFamily || 'uncategorized';
    const bucketId = play.bucketId || 'unknown';

    conceptReps[conceptName] = (conceptReps[conceptName] || 0) + 1;
    bucketTotalReps[bucketId] = (bucketTotalReps[bucketId] || 0) + 1;
  });

  // Build result array from bucket families
  // Note: bucket.families is an array of strings (family names), not objects
  const results = [];
  (playBuckets || []).forEach(bucket => {
    (bucket.families || []).forEach(familyName => {
      // familyName is a string like "Inside Zone", not an object
      const reps = conceptReps[familyName] || 0;
      const bucketTotal = bucketTotalReps[bucket.id] || 0;
      const percentageOfBucket = bucketTotal > 0 ? Math.round((reps / bucketTotal) * 100) : 0;

      results.push({
        conceptId: `${bucket.id}_${familyName}`,
        conceptName: familyName,
        parentBucketId: bucket.id,
        parentBucketLabel: bucket.label || bucket.name,
        parentBucketColor: bucket.color,
        reps,
        percentageOfBucket
      });
    });
  });

  // Add uncategorized if present
  if (conceptReps['uncategorized'] > 0) {
    results.push({
      conceptId: 'uncategorized',
      conceptName: 'Uncategorized',
      parentBucketId: 'unknown',
      parentBucketLabel: 'Unknown',
      parentBucketColor: '#6b7280',
      reps: conceptReps['uncategorized'],
      percentageOfBucket: 0
    });
  }

  return results.filter(r => r.reps > 0).sort((a, b) => b.reps - a.reps);
}

/**
 * Compare each play's scripted reps to its quota
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @param {Object} playRepTargets - Map of playId -> target reps
 * @returns {Array} Array of quota compliance objects sorted by deficit
 */
export function getQuotaCompliance(week, plays, playRepTargets = {}) {
  const scriptRows = getScriptRows(week);
  const playReps = {};

  // Count reps per play
  scriptRows.forEach(({ row }) => {
    if (!row.playId) return;
    playReps[row.playId] = (playReps[row.playId] || 0) + 1;
  });

  // Build compliance list from plays with targets
  const results = [];
  Object.entries(playRepTargets || {}).forEach(([playId, target]) => {
    const play = plays?.[playId];
    if (!play) return;

    const actual = playReps[playId] || 0;
    const delta = actual - target;

    let status = 'met';
    if (actual === 0 && target > 0) status = 'unmet';
    else if (actual < target) status = 'partial';

    results.push({
      playId,
      playName: play.name || 'Unknown',
      formation: play.formation,
      bucketId: play.bucketId,
      target,
      actual,
      delta,
      status
    });
  });

  // Sort by deficit (most under-repped first)
  return results.sort((a, b) => a.delta - b.delta);
}

/**
 * Check which call sheet situations have practice coverage
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @param {Object} setupConfig - Setup configuration
 * @param {Object} gamePlanLayouts - Game plan layouts (SPREADSHEET)
 * @param {Object} gamePlan - Offensive game plan with sets
 * @returns {Array} Array of situation coverage objects
 */
export function getSituationCoverage(week, plays, setupConfig, gamePlanLayouts, gamePlan) {
  const scriptRows = getScriptRows(week);
  const situationMinimums = week?.situationMinimums || {};

  // Get all situation IDs from call sheet headers
  const spreadsheet = gamePlanLayouts?.SPREADSHEET;
  const callSheetSituations = new Map();

  if (spreadsheet?.pages) {
    spreadsheet.pages.forEach(page => {
      (page.headers || []).forEach(header => {
        if (header.situationId) {
          callSheetSituations.set(header.situationId, {
            headerId: header.id,
            name: header.name,
            setId: `spreadsheet_${header.id}`
          });
        }
      });
    });
  }

  // Get plays assigned to each call sheet box
  const playsInSituation = new Map();
  callSheetSituations.forEach((info, situationId) => {
    const set = gamePlan?.sets?.find(s => s.id === info.setId);
    const playIds = set?.assignedPlayIds || set?.playIds || [];
    playsInSituation.set(situationId, new Set(playIds));
  });

  // Count scripted reps for plays tagged with each situation
  const scriptedPlayIds = new Set();
  const situationReps = {};

  scriptRows.forEach(({ row }) => {
    if (!row.playId) return;
    scriptedPlayIds.add(row.playId);

    const play = plays?.[row.playId];
    if (!play) return;

    // Check play's situation tags
    (play.specialSituations || []).forEach(sitId => {
      situationReps[sitId] = (situationReps[sitId] || 0) + 1;
    });

    // Also count if play is in a call sheet box for a situation
    callSheetSituations.forEach((info, situationId) => {
      const playsInBox = playsInSituation.get(situationId);
      if (playsInBox?.has(row.playId)) {
        situationReps[situationId] = (situationReps[situationId] || 0) + 1;
      }
    });
  });

  // Build situation list from all sources
  const allSituations = new Map();

  // Add field zones
  (setupConfig?.fieldZones || []).forEach(zone => {
    allSituations.set(zone.id, {
      situationId: zone.id,
      name: zone.label || zone.name,
      type: 'fieldZone'
    });
  });

  // Add down/distance categories
  (setupConfig?.downDistanceCategories || []).forEach(dd => {
    allSituations.set(dd.id, {
      situationId: dd.id,
      name: dd.label || dd.name,
      type: 'downDistance'
    });
  });

  // Add special situations
  (setupConfig?.specialSituations || []).forEach(sit => {
    allSituations.set(sit.id, {
      situationId: sit.id,
      name: sit.label || sit.name,
      type: 'special'
    });
  });

  // Build results
  const results = [];
  allSituations.forEach((info, situationId) => {
    const onCallSheet = callSheetSituations.has(situationId);
    const playsInBox = playsInSituation.get(situationId);
    const playsAvailable = playsInBox ? playsInBox.size : 0;
    const repsScripted = situationReps[situationId] || 0;
    const minRequired = situationMinimums[situationId] || 0;
    const delta = repsScripted - minRequired;

    let status = 'met';
    if (minRequired > 0) {
      if (repsScripted === 0) status = 'unmet';
      else if (repsScripted < minRequired) status = 'partial';
    } else if (onCallSheet && repsScripted === 0) {
      status = 'warning'; // On call sheet but no reps
    }

    results.push({
      situationId,
      name: info.name,
      type: info.type,
      onCallSheet,
      playsAvailable,
      repsScripted,
      minRequired,
      delta,
      status
    });
  });

  // Sort: on-call-sheet first, then by status priority, then by name
  const statusOrder = { unmet: 0, partial: 1, warning: 2, met: 3 };
  return results.sort((a, b) => {
    if (a.onCallSheet !== b.onCallSheet) return b.onCallSheet - a.onCallSheet;
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get all plays on the call sheet with their practice rep counts
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @param {Object} gamePlanLayouts - Game plan layouts (SPREADSHEET)
 * @param {Object} gamePlan - Offensive game plan with sets
 * @returns {Array} Array of call sheet play objects with rep counts
 */
export function getCallSheetPlays(week, plays, gamePlanLayouts, gamePlan) {
  const scriptRows = getScriptRows(week);

  // Count reps per play from scripts
  const playReps = {};
  scriptRows.forEach(({ row }) => {
    if (row.playId) {
      playReps[row.playId] = (playReps[row.playId] || 0) + 1;
    }
  });

  // Get all call sheet boxes and their plays
  const spreadsheet = gamePlanLayouts?.SPREADSHEET;
  if (!spreadsheet?.pages) return [];

  const callSheetPlays = new Map(); // playId -> { play, boxes: [], reps }

  spreadsheet.pages.forEach(page => {
    (page.headers || []).forEach(header => {
      const setId = `spreadsheet_${header.id}`;
      const set = gamePlan?.sets?.find(s => s.id === setId);
      const playIds = set?.assignedPlayIds || set?.playIds || [];

      playIds.forEach(playId => {
        const play = plays?.[playId];
        if (!play) return;

        if (!callSheetPlays.has(playId)) {
          callSheetPlays.set(playId, {
            playId,
            playName: play.name,
            formation: play.formation,
            bucketId: play.bucketId,
            boxes: [],
            reps: playReps[playId] || 0
          });
        }

        // Add this box to the play's box list
        const entry = callSheetPlays.get(playId);
        if (!entry.boxes.find(b => b.id === header.id)) {
          entry.boxes.push({
            id: header.id,
            name: header.name,
            color: header.color
          });
        }
      });
    });
  });

  // Convert to array and sort: unpracticed first, then by box count, then alphabetically
  return Array.from(callSheetPlays.values()).sort((a, b) => {
    // Unpracticed plays first
    if (a.reps === 0 && b.reps > 0) return -1;
    if (b.reps === 0 && a.reps > 0) return 1;
    // Then by reps ascending (least practiced first)
    if (a.reps !== b.reps) return a.reps - b.reps;
    // Then alphabetically
    const aName = a.formation ? `${a.formation} ${a.playName}` : a.playName;
    const bName = b.formation ? `${b.formation} ${b.playName}` : b.playName;
    return aName.localeCompare(bName);
  });
}

/**
 * Break down reps by day
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @returns {Array} Array of day breakdown objects
 */
export function getDayBreakdown(week, plays) {
  if (!week?.practicePlans) return [];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const results = [];

  days.forEach(dayName => {
    const dayPlan = week.practicePlans[dayName];
    if (!dayPlan) {
      results.push({
        dayName,
        totalReps: 0,
        uniquePlays: 0,
        bucketReps: {},
        segmentReps: {}
      });
      return;
    }

    const bucketReps = {};
    const segmentReps = {};
    const uniquePlayIds = new Set();
    let totalReps = 0;

    (dayPlan.segments || []).forEach(segment => {
      const segmentKey = segment.typeId || segment.type || segment.id;
      segmentReps[segmentKey] = 0;

      (segment.script || []).forEach(row => {
        if (!row.playId) return;

        totalReps++;
        segmentReps[segmentKey]++;
        uniquePlayIds.add(row.playId);

        const play = plays?.[row.playId];
        if (play?.bucketId) {
          bucketReps[play.bucketId] = (bucketReps[play.bucketId] || 0) + 1;
        }
      });
    });

    results.push({
      dayName,
      totalReps,
      uniquePlays: uniquePlayIds.size,
      bucketReps,
      segmentReps
    });
  });

  return results;
}

/**
 * Get execution quality data from practice reviews
 * @param {Object} week - Week object with practiceReviews
 * @param {Object} plays - Plays object keyed by ID
 * @returns {Object} Map of playId -> { avgRating, totalReps, ratedReps, ratings[], workedTags, didntWorkTags }
 */
export function getExecutionQuality(week, plays) {
  const practiceReviews = week?.practiceReviews || {};
  const scriptRows = getScriptRows(week);
  const playQuality = {};

  // Initialize quality data for each scripted play
  scriptRows.forEach(({ row, dayName }) => {
    if (!row.playId) return;

    if (!playQuality[row.playId]) {
      playQuality[row.playId] = {
        playId: row.playId,
        avgRating: 0,
        totalReps: 0,
        ratedReps: 0,
        ratings: [],
        workedTags: [],
        didntWorkTags: [],
        lowRatedReps: 0, // Reps with rating <= 2
        highRatedReps: 0  // Reps with rating >= 4
      };
    }

    playQuality[row.playId].totalReps++;

    // Get review data for this script row
    const dayReview = practiceReviews[dayName];
    const scriptReview = dayReview?.scriptReviews?.[row.id];

    if (scriptReview?.rating > 0) {
      const q = playQuality[row.playId];
      q.ratedReps++;
      q.ratings.push(scriptReview.rating);

      if (scriptReview.rating <= 2) q.lowRatedReps++;
      if (scriptReview.rating >= 4) q.highRatedReps++;

      // Collect tags
      (scriptReview.workedTags || []).forEach(tagId => {
        if (!q.workedTags.includes(tagId)) q.workedTags.push(tagId);
      });
      (scriptReview.didntWorkTags || []).forEach(tagId => {
        if (!q.didntWorkTags.includes(tagId)) q.didntWorkTags.push(tagId);
      });
    }
  });

  // Calculate averages
  Object.values(playQuality).forEach(q => {
    if (q.ratings.length > 0) {
      q.avgRating = q.ratings.reduce((sum, r) => sum + r, 0) / q.ratings.length;
    }
  });

  return playQuality;
}

/**
 * Get aggregate execution issues across all plays
 * @param {Object} week - Week object with practiceReviews
 * @param {Object} setupConfig - Setup config with filmReviewTags
 * @returns {Object} { workedTagCounts, didntWorkTagCounts, overallAvgRating, totalRatedReps }
 */
export function getExecutionIssues(week, setupConfig) {
  const practiceReviews = week?.practiceReviews || {};
  const filmReviewTags = setupConfig?.filmReviewTags || { worked: [], didntWork: [] };

  const workedTagCounts = {};
  const didntWorkTagCounts = {};
  let totalRating = 0;
  let totalRatedReps = 0;

  // Iterate through all days and script reviews
  Object.values(practiceReviews).forEach(dayReview => {
    Object.values(dayReview.scriptReviews || {}).forEach(review => {
      if (review.rating > 0) {
        totalRating += review.rating;
        totalRatedReps++;
      }

      (review.workedTags || []).forEach(tagId => {
        workedTagCounts[tagId] = (workedTagCounts[tagId] || 0) + 1;
      });

      (review.didntWorkTags || []).forEach(tagId => {
        didntWorkTagCounts[tagId] = (didntWorkTagCounts[tagId] || 0) + 1;
      });
    });
  });

  // Convert to arrays with labels
  const workedTagsSummary = filmReviewTags.worked.map(tag => ({
    tagId: tag.id,
    label: tag.label,
    count: workedTagCounts[tag.id] || 0
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  const didntWorkTagsSummary = filmReviewTags.didntWork.map(tag => ({
    tagId: tag.id,
    label: tag.label,
    count: didntWorkTagCounts[tag.id] || 0
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  return {
    workedTagsSummary,
    didntWorkTagsSummary,
    overallAvgRating: totalRatedReps > 0 ? totalRating / totalRatedReps : null,
    totalRatedReps
  };
}

/**
 * Enhance quota compliance with execution quality data
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @param {Object} playRepTargets - Map of playId -> target reps
 * @param {Object} executionQuality - Map from getExecutionQuality
 * @returns {Array} Array of quota compliance objects with quality data
 */
export function getQuotaComplianceWithQuality(week, plays, playRepTargets, executionQuality) {
  const baseQuotas = getQuotaCompliance(week, plays, playRepTargets);

  return baseQuotas.map(quota => {
    const quality = executionQuality[quota.playId];

    // Determine quality status
    let qualityStatus = null;
    if (quality?.ratedReps > 0) {
      if (quality.avgRating >= 4) qualityStatus = 'game-ready';
      else if (quality.avgRating >= 3) qualityStatus = 'solid';
      else if (quality.avgRating >= 2) qualityStatus = 'needs-work';
      else qualityStatus = 'struggling';
    }

    return {
      ...quota,
      avgRating: quality?.avgRating || null,
      ratedReps: quality?.ratedReps || 0,
      lowRatedReps: quality?.lowRatedReps || 0,
      highRatedReps: quality?.highRatedReps || 0,
      qualityStatus,
      didntWorkTags: quality?.didntWorkTags || []
    };
  });
}

/**
 * Generate actionable recommendations based on coverage report
 * @param {Object} coverageReport - Full coverage report object
 * @returns {Array} Array of recommendation objects
 */
export function generateRecommendations(coverageReport) {
  const recommendations = [];

  // Check bucket balance
  (coverageReport.buckets || []).forEach(bucket => {
    if (bucket.targetReps > 0 && bucket.delta < -5) {
      recommendations.push({
        type: 'bucket',
        severity: bucket.delta < -10 ? 'high' : 'medium',
        message: `Add more ${bucket.label} plays`,
        suggestedAction: `${bucket.label} is ${Math.abs(bucket.delta)} reps under target`,
        data: bucket
      });
    }
  });

  // Check concept diversity
  (coverageReport.concepts || []).forEach(concept => {
    if (concept.percentageOfBucket > 60 && concept.reps > 5) {
      recommendations.push({
        type: 'concept',
        severity: 'low',
        message: `Diversify ${concept.parentBucketLabel} - heavy on ${concept.conceptName}`,
        suggestedAction: `${concept.conceptName} is ${concept.percentageOfBucket}% of ${concept.parentBucketLabel} reps`,
        data: concept
      });
    }
  });

  // Check quota compliance
  (coverageReport.quotas || []).forEach(quota => {
    if (quota.status === 'unmet') {
      recommendations.push({
        type: 'quota',
        severity: 'high',
        message: `${quota.playName} has 0 reps`,
        suggestedAction: `Needs ${quota.target} reps to meet target`,
        data: quota
      });
    } else if (quota.status === 'partial' && quota.delta <= -3) {
      recommendations.push({
        type: 'quota',
        severity: 'medium',
        message: `${quota.playName} needs ${Math.abs(quota.delta)} more reps`,
        suggestedAction: `Currently at ${quota.actual}/${quota.target} reps`,
        data: quota
      });
    }
  });

  // Check situation coverage
  (coverageReport.situations || []).forEach(situation => {
    if (situation.status === 'unmet' && situation.onCallSheet) {
      recommendations.push({
        type: 'situation',
        severity: 'high',
        message: `${situation.name} has 0 reps`,
        suggestedAction: `On call sheet with ${situation.playsAvailable} plays available, minimum is ${situation.minRequired}`,
        data: situation
      });
    } else if (situation.status === 'partial') {
      recommendations.push({
        type: 'situation',
        severity: 'medium',
        message: `${situation.name} needs ${Math.abs(situation.delta)} more reps`,
        suggestedAction: `Currently at ${situation.repsScripted}/${situation.minRequired} reps`,
        data: situation
      });
    } else if (situation.status === 'warning') {
      recommendations.push({
        type: 'situation',
        severity: 'low',
        message: `${situation.name} is on call sheet but has 0 reps`,
        suggestedAction: `Consider adding reps for ${situation.name}`,
        data: situation
      });
    }
  });

  // Check execution quality issues
  (coverageReport.quotas || []).forEach(quota => {
    // Plays with low execution quality need more work
    if (quota.qualityStatus === 'struggling' && quota.actual > 0) {
      recommendations.push({
        type: 'quality',
        severity: 'high',
        message: `${quota.formation ? `${quota.formation} ` : ''}${quota.playName} is struggling (${quota.avgRating?.toFixed(1)}★)`,
        suggestedAction: `${quota.lowRatedReps} of ${quota.ratedReps} reps rated poorly - needs focused attention`,
        data: quota
      });
    } else if (quota.qualityStatus === 'needs-work' && quota.actual > 0) {
      recommendations.push({
        type: 'quality',
        severity: 'medium',
        message: `${quota.formation ? `${quota.formation} ` : ''}${quota.playName} needs work (${quota.avgRating?.toFixed(1)}★)`,
        suggestedAction: `Execution is inconsistent - consider adding more focused reps`,
        data: quota
      });
    }

    // Plays that met quota but have low quality shouldn't be considered "done"
    if (quota.status === 'met' && quota.avgRating && quota.avgRating < 3) {
      recommendations.push({
        type: 'quality',
        severity: 'medium',
        message: `${quota.formation ? `${quota.formation} ` : ''}${quota.playName} met quota but quality is low`,
        suggestedAction: `${quota.actual} reps completed but avg ${quota.avgRating.toFixed(1)}★ - may need more work`,
        data: quota
      });
    }
  });

  // Highlight common execution issues
  const executionIssues = coverageReport.executionIssues;
  if (executionIssues?.didntWorkTagsSummary?.length > 0) {
    const topIssue = executionIssues.didntWorkTagsSummary[0];
    if (topIssue.count >= 3) {
      recommendations.push({
        type: 'pattern',
        severity: topIssue.count >= 5 ? 'high' : 'medium',
        message: `"${topIssue.label}" is a recurring issue (${topIssue.count} times)`,
        suggestedAction: `Address this execution problem in practice focus`,
        data: topIssue
      });
    }
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Master function combining all coverage metrics
 * @param {Object} week - Week object
 * @param {Object} plays - Plays object keyed by ID
 * @param {Object} setupConfig - Setup configuration
 * @returns {Object} Full coverage report
 */
export function computeCoverageReport(week, plays, setupConfig) {
  const playBuckets = setupConfig?.playBuckets || [];
  const playRepTargets = week?.playRepTargets || {};
  const gamePlanLayouts = week?.gamePlanLayouts || {};
  const gamePlan = week?.offensiveGamePlan || {};

  const scriptRows = getScriptRows(week);
  const uniquePlayIds = new Set(scriptRows.filter(r => r.row.playId).map(r => r.row.playId));

  // Get execution quality data from practice reviews
  const executionQuality = getExecutionQuality(week, plays);
  const executionIssues = getExecutionIssues(week, setupConfig);

  const buckets = getBucketCoverage(week, plays, playBuckets, playRepTargets);
  const concepts = getConceptCoverage(week, plays, playBuckets);

  // Use enhanced quota compliance with quality data
  const quotas = getQuotaComplianceWithQuality(week, plays, playRepTargets, executionQuality);

  const situations = getSituationCoverage(week, plays, setupConfig, gamePlanLayouts, gamePlan);
  const callSheetPlays = getCallSheetPlays(week, plays, gamePlanLayouts, gamePlan);
  const days = getDayBreakdown(week, plays);

  // Calculate summary
  const totalReps = scriptRows.filter(r => r.row.playId).length;
  const quotasMet = quotas.filter(q => q.status === 'met').length;
  const quotasTotal = quotas.length;
  const situationsCovered = situations.filter(s => s.onCallSheet && s.repsScripted > 0).length;
  const situationsOnSheet = situations.filter(s => s.onCallSheet).length;
  const callSheetPracticed = callSheetPlays.filter(p => p.reps > 0).length;
  const callSheetTotal = callSheetPlays.length;

  // Quality summary
  const playsWithQualityData = quotas.filter(q => q.ratedReps > 0);
  const gameReadyPlays = quotas.filter(q => q.qualityStatus === 'game-ready').length;
  const strugglingPlays = quotas.filter(q => q.qualityStatus === 'struggling' || q.qualityStatus === 'needs-work').length;

  const summary = {
    totalReps,
    uniquePlays: uniquePlayIds.size,
    quotasMetPercent: quotasTotal > 0 ? Math.round((quotasMet / quotasTotal) * 100) : null,
    quotasMet,
    quotasTotal,
    situationsCoveredPercent: situationsOnSheet > 0 ? Math.round((situationsCovered / situationsOnSheet) * 100) : null,
    situationsCovered,
    situationsOnSheet,
    callSheetPracticedPercent: callSheetTotal > 0 ? Math.round((callSheetPracticed / callSheetTotal) * 100) : null,
    callSheetPracticed,
    callSheetTotal,
    // Quality metrics
    overallAvgRating: executionIssues.overallAvgRating,
    totalRatedReps: executionIssues.totalRatedReps,
    gameReadyPlays,
    strugglingPlays,
    playsReviewed: playsWithQualityData.length
  };

  const report = { buckets, concepts, quotas, situations, callSheetPlays, days, summary, executionQuality, executionIssues };
  const recommendations = generateRecommendations(report);

  return { ...report, recommendations };
}
