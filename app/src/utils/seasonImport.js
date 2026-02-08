/**
 * Season Import Utilities
 * XLSX parsing, column detection, validation, and data governance for Hudl imports
 */

import * as XLSX from 'xlsx';

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

/**
 * Required columns - import will be blocked if any are missing
 */
export const REQUIRED_COLUMNS = [
  { key: 'gameId', aliases: ['game_id', 'gameid', 'game id', 'game'] },
  { key: 'quarter', aliases: ['quarter', 'qtr', 'q'] },
  { key: 'clock', aliases: ['clock', 'time', 'game_clock', 'gameclock'] },
  { key: 'down', aliases: ['down', 'dn'] },
  { key: 'distance', aliases: ['distance', 'dist', 'to_go', 'togo', 'yards_to_go'] },
  { key: 'yardline', aliases: ['yardline', 'yard_line', 'yd_line', 'yard line', 'los', 'line_of_scrimmage'] },
  { key: 'fieldZone', aliases: ['field_zone', 'fieldzone', 'zone', 'field zone'] },
  { key: 'playCall', aliases: ['play_call', 'playcall', 'play call', 'play_name', 'play'] },
  { key: 'bucketId', aliases: ['bucket', 'bucket_id', 'bucketid', 'play_type', 'playtype', 'type'] },
  { key: 'conceptFamilyId', aliases: ['concept_family', 'conceptfamily', 'concept_family_id', 'concept', 'family'] },
  { key: 'formation', aliases: ['formation', 'form', 'offensive_formation'] },
  { key: 'formationDistribution', aliases: ['formation_distribution', 'formationdistribution', 'distribution', 'dist'] },
  { key: 'strengthSide', aliases: ['strength_side', 'strengthside', 'strength', 'str_side'] },
  { key: 'backStructure', aliases: ['back_structure', 'backstructure', 'back_struct', 'backs'] },
  { key: 'backAlignmentQB', aliases: ['back_alignment_qb', 'backalignmentqb', 'qb_alignment', 'qb_offset'] },
  { key: 'backTERelation', aliases: ['back_te_relation', 'backterelation', 'te_relation', 'te_back'] },
  { key: 'meshPath', aliases: ['mesh_path', 'meshpath', 'mesh', 'path'] },
  { key: 'eventType', aliases: ['event_type', 'eventtype', 'event', 'result_type'] },
  { key: 'resultYards', aliases: ['result_yards', 'resultyards', 'yards', 'gain', 'yds'] },
  { key: 'successFlag', aliases: ['success_flag', 'successflag', 'success', 'successful'] },
  { key: 'explosiveFlag', aliases: ['explosive_flag', 'explosiveflag', 'explosive', 'big_play'] },
  { key: 'scoreDifferential', aliases: ['score_differential', 'scoredifferential', 'score_diff', 'margin'] },
  { key: 'personnelUnit', aliases: ['personnel_unit', 'personnelunit', 'personnel', 'package'] }
];

/**
 * Recommended columns - warnings shown, features unlocked when present
 */
export const RECOMMENDED_COLUMNS = [
  { key: 'targetReceiver', aliases: ['target_receiver', 'targetreceiver', 'target', 'receiver'], featureUnlocked: 'Receiver targeting analysis' },
  { key: 'protectionType', aliases: ['protection_type', 'protectiontype', 'protection', 'prot'], featureUnlocked: 'Pass protection analysis' },
  { key: 'motionType', aliases: ['motion_type', 'motiontype', 'motion', 'mot'], featureUnlocked: 'Motion tendency analysis' },
  { key: 'shiftType', aliases: ['shift_type', 'shifttype', 'shift'], featureUnlocked: 'Shift pattern analysis' },
  { key: 'defFront', aliases: ['def_front', 'deffront', 'defensive_front', 'front'], featureUnlocked: 'Defensive front correlation' },
  { key: 'boxCount', aliases: ['box_count', 'boxcount', 'box', 'defenders_in_box'], featureUnlocked: 'Box count analysis' },
  { key: 'shell', aliases: ['shell', 'coverage_shell', 'secondary_shell'], featureUnlocked: 'Coverage shell correlation' },
  { key: 'pressure', aliases: ['pressure', 'blitz', 'rush'], featureUnlocked: 'Pressure performance analysis' },
  { key: 'situationTag', aliases: ['situation_tag', 'situationtag', 'situation', 'sit_tag'], featureUnlocked: 'Custom situation analysis' },
  { key: 'negativeCauseTag', aliases: ['negative_cause_tag', 'negativecausetag', 'neg_cause', 'issue'], featureUnlocked: 'Negative play root cause analysis' },
  { key: 'rpoIntent', aliases: ['rpo_intent', 'rpointent', 'rpo', 'rpo_type'], featureUnlocked: 'RPO decision tracking' }
];

/**
 * Optional/internal columns for QC workflow
 */
export const OPTIONAL_COLUMNS = [
  { key: 'proposedTag', aliases: ['proposed_tag', 'proposedtag', 'ga_tag', 'ga'] },
  { key: 'finalTag', aliases: ['final_tag', 'finaltag', 'coord_tag', 'coordinator'] }
];

// ============================================================================
// COLUMN DETECTION & MAPPING
// ============================================================================

/**
 * Normalize column header for comparison
 * @param {string} header - Raw column header
 * @returns {string} Normalized header
 */
function normalizeHeader(header) {
  if (!header) return '';
  return String(header).toLowerCase().trim().replace(/[\s_-]+/g, '_');
}

/**
 * Auto-detect column mappings from file headers
 * @param {Array} headers - Array of column header strings from XLSX
 * @returns {Object} { mappings: { columnKey: headerIndex }, unmapped: [columnKeys], unknown: [headerStrings] }
 */
export function autoDetectColumns(headers) {
  const normalizedHeaders = headers.map(h => normalizeHeader(h));
  const mappings = {};
  const unmapped = [];
  const unknown = [];
  const usedIndices = new Set();

  // Check all column definitions (required + recommended + optional)
  const allColumns = [...REQUIRED_COLUMNS, ...RECOMMENDED_COLUMNS, ...OPTIONAL_COLUMNS];

  allColumns.forEach(colDef => {
    let foundIndex = -1;

    // Check each alias
    for (const alias of colDef.aliases) {
      const normalizedAlias = normalizeHeader(alias);
      const idx = normalizedHeaders.findIndex((h, i) => h === normalizedAlias && !usedIndices.has(i));
      if (idx !== -1) {
        foundIndex = idx;
        break;
      }
    }

    if (foundIndex !== -1) {
      mappings[colDef.key] = foundIndex;
      usedIndices.add(foundIndex);
    } else if (REQUIRED_COLUMNS.find(c => c.key === colDef.key)) {
      unmapped.push(colDef.key);
    }
  });

  // Find headers that weren't mapped to anything
  headers.forEach((header, idx) => {
    if (!usedIndices.has(idx) && header) {
      unknown.push(header);
    }
  });

  return { mappings, unmapped, unknown };
}

/**
 * Apply column mapping to transform raw row to structured snap
 * @param {Object} rawRow - Row from XLSX
 * @param {Object} mappings - Column key -> header index/name mapping
 * @param {Array} headers - Array of header strings
 * @returns {Object} Structured snap object
 */
export function applyColumnMapping(rawRow, mappings, headers) {
  const snap = {};

  Object.entries(mappings).forEach(([key, headerIdxOrName]) => {
    const headerKey = typeof headerIdxOrName === 'number'
      ? headers[headerIdxOrName]
      : headerIdxOrName;

    let value = rawRow[headerKey];

    // Type coercion based on field
    if (['resultYards', 'down', 'distance', 'yardline', 'scoreDifferential', 'boxCount'].includes(key)) {
      value = value !== undefined && value !== '' ? Number(value) : null;
    } else if (['successFlag', 'explosiveFlag', 'pressure'].includes(key)) {
      value = value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes' || value === 'Y';
    } else if (value !== undefined) {
      value = String(value).trim();
    }

    snap[key] = value;
  });

  return snap;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate completeness of column mapping
 * @param {Object} mappings - Column key -> header mapping
 * @returns {Object} { isValid, coreCompleteness, contextCompleteness, missingRequired, missingRecommended }
 */
export function validateColumnMapping(mappings) {
  const requiredKeys = REQUIRED_COLUMNS.map(c => c.key);
  const recommendedKeys = RECOMMENDED_COLUMNS.map(c => c.key);

  const mappedRequired = requiredKeys.filter(k => mappings[k] !== undefined);
  const mappedRecommended = recommendedKeys.filter(k => mappings[k] !== undefined);

  const missingRequired = requiredKeys.filter(k => mappings[k] === undefined);
  const missingRecommended = recommendedKeys.filter(k => mappings[k] === undefined);

  const coreCompleteness = Math.round((mappedRequired.length / requiredKeys.length) * 100);
  const contextCompleteness = Math.round((mappedRecommended.length / recommendedKeys.length) * 100);

  return {
    isValid: missingRequired.length === 0,
    coreCompleteness,
    contextCompleteness,
    missingRequired,
    missingRecommended,
    mappedRequired,
    mappedRecommended
  };
}

/**
 * Validate a single snap record
 * @param {Object} snap - Snap object
 * @returns {Object} { isValid, errors }
 */
export function validateSnap(snap) {
  const errors = [];

  // Check required fields have values
  if (!snap.gameId) errors.push('Missing game ID');
  if (snap.quarter === null || snap.quarter === undefined) errors.push('Missing quarter');
  if (snap.down === null || snap.down === undefined) errors.push('Missing down');
  if (!snap.playCall) errors.push('Missing play call');
  if (!snap.bucketId) errors.push('Missing bucket');

  // Validate numeric ranges
  if (snap.down !== null && (snap.down < 1 || snap.down > 4)) errors.push('Invalid down value');
  if (snap.quarter !== null && (snap.quarter < 1 || snap.quarter > 5)) errors.push('Invalid quarter value');
  if (snap.distance !== null && snap.distance < 0) errors.push('Invalid distance');

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a game's data completeness and snap count
 * @param {Object} game - Game object with snaps
 * @param {Object} thresholds - Validity thresholds
 * @returns {Object} { isValid, coreCompleteness, contextCompleteness, snapCount, issues }
 */
export function validateGame(game, thresholds = { coreMin: 90, contextMin: 75, snapsMin: 45 }) {
  const issues = [];
  const snaps = game.snaps || [];

  if (snaps.length < thresholds.snapsMin) {
    issues.push(`Only ${snaps.length} snaps (minimum ${thresholds.snapsMin})`);
  }

  if (game.coreCompleteness < thresholds.coreMin) {
    issues.push(`Core completeness ${game.coreCompleteness}% (minimum ${thresholds.coreMin}%)`);
  }

  if (game.contextCompleteness < thresholds.contextMin) {
    issues.push(`Context completeness ${game.contextCompleteness}% (minimum ${thresholds.contextMin}%)`);
  }

  return {
    isValid: issues.length === 0,
    coreCompleteness: game.coreCompleteness,
    contextCompleteness: game.contextCompleteness,
    snapCount: snaps.length,
    issues
  };
}

// ============================================================================
// DATA GOVERNANCE & NORMALIZATION
// ============================================================================

/**
 * Normalize strength side for formations without TE
 * Priority: pass_strength > field/boundary > RB side > neutral
 * @param {Object} snap - Snap object
 * @returns {string} Normalized strength side
 */
export function normalizeStrength(snap) {
  // If explicit strength is set and valid, use it
  if (snap.strengthSide && snap.strengthSide !== 'none' && snap.strengthSide !== 'neutral') {
    return snap.strengthSide;
  }

  // Check for pass strength indicator
  if (snap.passStrength) {
    return snap.passStrength;
  }

  // Check for field/boundary indicator
  if (snap.fieldBoundary) {
    return snap.fieldBoundary;
  }

  // Default to neutral
  return 'neutral';
}

/**
 * Normalize empty formation data
 * @param {Object} snap - Snap object
 * @returns {Object} Updated snap with normalized empty formation data
 */
export function normalizeEmptyFormation(snap) {
  const normalized = { ...snap };
  const formation = (snap.formation || '').toLowerCase();

  // Detect empty formations
  const isEmptyFormation = formation.includes('empty') ||
    formation.includes('spread') ||
    snap.backStructure === 'empty' ||
    snap.backStructure === '0_back';

  if (isEmptyFormation) {
    normalized.backStructure = 'empty';
    normalized.backAlignmentQB = 'none';
  }

  return normalized;
}

/**
 * Normalize two-back formation data
 * @param {Object} snap - Snap object
 * @returns {Object} Updated snap with normalized two-back data
 */
export function normalizeTwoBack(snap) {
  const normalized = { ...snap };
  const backStructure = (snap.backStructure || '').toLowerCase();

  // Detect two-back formations
  if (backStructure.includes('two') || backStructure === '2_back' || backStructure === 'i_form' || backStructure === 'split') {
    normalized.backStructure = 'two_back';
    // Track both backs if available
    if (snap.primaryBack && snap.secondaryBack) {
      normalized.backPositions = [snap.primaryBack, snap.secondaryBack];
    }
  }

  return normalized;
}

/**
 * Normalize RPO data - track concept family AND event type separately
 * @param {Object} snap - Snap object
 * @returns {Object} Updated snap with normalized RPO data
 */
export function normalizeRPO(snap) {
  const normalized = { ...snap };
  const bucket = (snap.bucketId || '').toLowerCase();
  const eventType = (snap.eventType || '').toLowerCase();

  if (bucket === 'rpo' || bucket.includes('rpo')) {
    // Preserve original concept family
    normalized.rpoConceptFamily = snap.conceptFamilyId;

    // Track what actually happened (give/pull/throw)
    if (eventType.includes('give') || eventType.includes('run')) {
      normalized.rpoDecision = 'give';
    } else if (eventType.includes('pull') || eventType.includes('keep')) {
      normalized.rpoDecision = 'pull';
    } else if (eventType.includes('throw') || eventType.includes('pass')) {
      normalized.rpoDecision = 'throw';
    }

    // Track RPO intent if available
    if (snap.rpoIntent) {
      normalized.rpoIntent = snap.rpoIntent;
    }
  }

  return normalized;
}

/**
 * Normalize QC tags (proposed_tag = GA, final_tag = coordinator)
 * @param {Object} snap - Snap object
 * @returns {Object} Updated snap with normalized QC tags
 */
export function normalizeQCTags(snap) {
  const normalized = { ...snap };

  // proposedTag comes from GA review
  // finalTag comes from coordinator review
  // Keep both for tracking disagreements
  if (snap.proposedTag && snap.finalTag && snap.proposedTag !== snap.finalTag) {
    normalized.qcDisagreement = true;
  }

  return normalized;
}

/**
 * Apply all data governance rules to a snap
 * @param {Object} snap - Raw snap object
 * @returns {Object} Normalized snap object
 */
export function applyDataGovernance(snap) {
  let normalized = { ...snap };

  // Apply normalization rules in order
  normalized.strengthSide = normalizeStrength(normalized);
  normalized = normalizeEmptyFormation(normalized);
  normalized = normalizeTwoBack(normalized);
  normalized = normalizeRPO(normalized);
  normalized = normalizeQCTags(normalized);

  return normalized;
}

// ============================================================================
// XLSX PARSING
// ============================================================================

/**
 * Parse XLSX file and extract rows
 * @param {File|ArrayBuffer} file - XLSX file or buffer
 * @returns {Object} { headers, rows, sheetName }
 */
export function parseXLSX(file) {
  const workbook = XLSX.read(file, { type: file instanceof ArrayBuffer ? 'array' : 'file' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Get data as array of arrays to preserve order
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error('File contains no data rows');
  }

  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const rowObj = {};
    headers.forEach((header, idx) => {
      if (header) {
        rowObj[header] = row[idx];
      }
    });
    return rowObj;
  }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''));

  return { headers, rows, sheetName };
}

/**
 * Parse file from FileReader result
 * @param {ArrayBuffer} buffer - File contents
 * @returns {Object} { headers, rows, sheetName }
 */
export function parseXLSXBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error('File contains no data rows');
  }

  const headers = data[0].map(h => h ? String(h) : '');
  const rows = data.slice(1).map(row => {
    const rowObj = {};
    headers.forEach((header, idx) => {
      if (header) {
        rowObj[header] = row[idx];
      }
    });
    return rowObj;
  }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''));

  return { headers, rows, sheetName };
}

// ============================================================================
// GAME GROUPING & PROCESSING
// ============================================================================

/**
 * Group snaps by game ID and extract game metadata
 * @param {Array} snaps - Array of snap objects
 * @returns {Array} Array of game objects with snaps
 */
export function groupSnapsByGame(snaps) {
  const gameMap = new Map();

  snaps.forEach(snap => {
    const gameId = snap.gameId;
    if (!gameMap.has(gameId)) {
      gameMap.set(gameId, {
        gameId,
        opponent: snap.opponent || '',
        date: snap.date || null,
        isHome: snap.isHome || null,
        snaps: []
      });
    }
    gameMap.get(gameId).snaps.push(snap);
  });

  return Array.from(gameMap.values());
}

/**
 * Calculate completeness scores for a game
 * @param {Object} game - Game object with snaps
 * @returns {Object} Game with completeness scores
 */
export function calculateGameCompleteness(game) {
  const snaps = game.snaps || [];
  if (snaps.length === 0) {
    return { ...game, coreCompleteness: 0, contextCompleteness: 0 };
  }

  const requiredKeys = REQUIRED_COLUMNS.map(c => c.key);
  const recommendedKeys = RECOMMENDED_COLUMNS.map(c => c.key);

  let corePresent = 0;
  let coreTotal = 0;
  let contextPresent = 0;
  let contextTotal = 0;

  snaps.forEach(snap => {
    requiredKeys.forEach(key => {
      coreTotal++;
      if (snap[key] !== undefined && snap[key] !== null && snap[key] !== '') {
        corePresent++;
      }
    });

    recommendedKeys.forEach(key => {
      contextTotal++;
      if (snap[key] !== undefined && snap[key] !== null && snap[key] !== '') {
        contextPresent++;
      }
    });
  });

  return {
    ...game,
    coreCompleteness: Math.round((corePresent / coreTotal) * 100),
    contextCompleteness: Math.round((contextPresent / contextTotal) * 100)
  };
}

// ============================================================================
// IMPORT PROFILE MANAGEMENT
// ============================================================================

/**
 * Create a new import profile
 * @param {string} name - Profile name
 * @param {Object} columnMapping - Column mapping configuration
 * @returns {Object} Import profile object
 */
export function createImportProfile(name, columnMapping) {
  return {
    id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    columnMapping,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString()
  };
}

/**
 * Update import profile last used timestamp
 * @param {Object} profile - Import profile
 * @returns {Object} Updated profile
 */
export function touchImportProfile(profile) {
  return {
    ...profile,
    lastUsedAt: new Date().toISOString()
  };
}

// ============================================================================
// FEATURE IMPACT ANALYSIS
// ============================================================================

/**
 * Get features that will be disabled based on missing columns
 * @param {Array} missingColumns - Array of missing column keys
 * @returns {Array} Array of { column, feature } objects
 */
export function getDisabledFeatures(missingColumns) {
  const disabled = [];

  missingColumns.forEach(key => {
    const recommended = RECOMMENDED_COLUMNS.find(c => c.key === key);
    if (recommended && recommended.featureUnlocked) {
      disabled.push({
        column: key,
        feature: recommended.featureUnlocked
      });
    }
  });

  return disabled;
}

/**
 * Get summary of import impact
 * @param {Object} validation - Validation result
 * @returns {Object} { canProceed, blockers, warnings, unlocked }
 */
export function getImportImpact(validation) {
  const blockers = validation.missingRequired.map(key => {
    const col = REQUIRED_COLUMNS.find(c => c.key === key);
    return `Missing required column: ${col?.aliases[0] || key}`;
  });

  const warnings = validation.missingRecommended.map(key => {
    const col = RECOMMENDED_COLUMNS.find(c => c.key === key);
    return `Missing optional column: ${col?.aliases[0] || key}`;
  });

  const unlocked = validation.mappedRecommended.map(key => {
    const col = RECOMMENDED_COLUMNS.find(c => c.key === key);
    return col?.featureUnlocked || null;
  }).filter(Boolean);

  return {
    canProceed: blockers.length === 0,
    blockers,
    warnings,
    unlocked
  };
}

// ============================================================================
// FULL IMPORT PIPELINE
// ============================================================================

/**
 * Process a complete XLSX import
 * @param {ArrayBuffer} buffer - File buffer
 * @param {Object} options - { columnMapping, profileId }
 * @param {Object} thresholds - Validity thresholds
 * @returns {Object} { games, validGames, invalidGames, stats }
 */
export function processImport(buffer, options = {}, thresholds = { coreMin: 90, contextMin: 75, snapsMin: 45 }) {
  // Parse XLSX
  const { headers, rows, sheetName } = parseXLSXBuffer(buffer);

  // Get or auto-detect column mapping
  let mappings = options.columnMapping;
  if (!mappings) {
    const detected = autoDetectColumns(headers);
    mappings = detected.mappings;
  }

  // Transform rows to snaps
  const snaps = rows.map((row, idx) => {
    const snap = applyColumnMapping(row, mappings, headers);
    snap.id = `snap_${Date.now()}_${idx}`;
    return applyDataGovernance(snap);
  });

  // Validate snaps
  const validSnaps = [];
  const invalidSnaps = [];
  snaps.forEach(snap => {
    const { isValid, errors } = validateSnap(snap);
    if (isValid) {
      validSnaps.push(snap);
    } else {
      invalidSnaps.push({ snap, errors });
    }
  });

  // Group by game and calculate completeness
  let games = groupSnapsByGame(validSnaps);
  games = games.map(game => calculateGameCompleteness(game));

  // Validate games
  const validGames = [];
  const invalidGames = [];
  games.forEach(game => {
    const validation = validateGame(game, thresholds);
    game.isValid = validation.isValid;
    game.offensiveSnaps = game.snaps.length;
    game.importedAt = new Date().toISOString();
    game.importProfile = options.profileId || null;

    if (validation.isValid) {
      validGames.push(game);
    } else {
      invalidGames.push({ game, issues: validation.issues });
    }
  });

  return {
    games,
    validGames,
    invalidGames,
    stats: {
      totalRows: rows.length,
      validSnaps: validSnaps.length,
      invalidSnaps: invalidSnaps.length,
      totalGames: games.length,
      validGameCount: validGames.length,
      invalidGameCount: invalidGames.length
    }
  };
}
