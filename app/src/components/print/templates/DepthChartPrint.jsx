import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';
import { generateDepthChartPositions, CANONICAL_OFFENSE_POSITIONS } from '../../../utils/depthChartPositions';

// Default position layouts for each chart type
const POSITION_LAYOUTS = {
  offense: [
    { pos: 'QB', label: 'Quarterback' },
    { pos: 'RB', label: 'Running Back' },
    { pos: 'FB', label: 'Fullback' },
    { pos: 'WR', label: 'Wide Receiver' },
    { pos: 'TE', label: 'Tight End' },
    { pos: 'LT', label: 'Left Tackle' },
    { pos: 'LG', label: 'Left Guard' },
    { pos: 'C', label: 'Center' },
    { pos: 'RG', label: 'Right Guard' },
    { pos: 'RT', label: 'Right Tackle' }
  ],
  defense: [
    { pos: 'DE', label: 'Defensive End' },
    { pos: 'DT', label: 'Defensive Tackle' },
    { pos: 'NT', label: 'Nose Tackle' },
    { pos: 'OLB', label: 'Outside Linebacker' },
    { pos: 'ILB', label: 'Inside Linebacker' },
    { pos: 'MLB', label: 'Middle Linebacker' },
    { pos: 'CB', label: 'Cornerback' },
    { pos: 'SS', label: 'Strong Safety' },
    { pos: 'FS', label: 'Free Safety' }
  ],
  kickoff: [
    { pos: 'K', label: 'Kicker' },
    { pos: 'L1', label: 'Lane 1' },
    { pos: 'L2', label: 'Lane 2' },
    { pos: 'L3', label: 'Lane 3' },
    { pos: 'L4', label: 'Lane 4' },
    { pos: 'L5', label: 'Lane 5' }
  ],
  kickoff_return: [
    { pos: 'KR', label: 'Kick Returner' },
    { pos: 'FB1', label: 'Front Blocker 1' },
    { pos: 'FB2', label: 'Front Blocker 2' },
    { pos: 'WB1', label: 'Wedge Blocker 1' },
    { pos: 'WB2', label: 'Wedge Blocker 2' }
  ],
  punt: [
    { pos: 'P', label: 'Punter' },
    { pos: 'LS', label: 'Long Snapper' },
    { pos: 'PP', label: 'Personal Protector' },
    { pos: 'G1', label: 'Gunner 1' },
    { pos: 'G2', label: 'Gunner 2' }
  ],
  punt_return: [
    { pos: 'PR', label: 'Punt Returner' },
    { pos: 'VB1', label: 'Vice Blocker 1' },
    { pos: 'VB2', label: 'Vice Blocker 2' }
  ],
  field_goal: [
    { pos: 'K', label: 'Kicker' },
    { pos: 'H', label: 'Holder' },
    { pos: 'LS', label: 'Long Snapper' }
  ]
};

const CHART_LABELS = {
  offense: 'Offense',
  defense: 'Defense',
  kickoff: 'Kickoff',
  kickoff_return: 'Kickoff Return',
  punt: 'Punt',
  punt_return: 'Punt Return',
  field_goal: 'Field Goal'
};

// Default pairings for half-sheet mode
const DEFAULT_PAIRINGS = {
  offense: 'defense',
  kickoff: 'kickoff_return',
  punt: 'punt_return'
};

// Formation-style position coordinates (percentage-based for responsive layout)
// Defense positions arranged looking DOWN at the offense
const DEFENSE_FORMATION = {
  // Secondary (top row)
  CB: [{ x: 5, y: 5 }, { x: 85, y: 5 }],       // Two corners, far left and right
  FS: [{ x: 35, y: 5 }],                        // Free safety
  SS: [{ x: 55, y: 5 }],                        // Strong safety
  // Linebackers (middle row)
  OLB: [{ x: 10, y: 28 }, { x: 80, y: 28 }],   // Outside linebackers
  MLB: [{ x: 45, y: 28 }],                      // Middle linebacker
  ILB: [{ x: 35, y: 28 }, { x: 55, y: 28 }],   // Inside linebackers (for 3-4)
  // D-Line (bottom row)
  DE: [{ x: 15, y: 50 }, { x: 75, y: 50 }],    // Defensive ends
  DT: [{ x: 35, y: 50 }, { x: 55, y: 50 }],    // Defensive tackles
  NT: [{ x: 45, y: 50 }],                       // Nose tackle
};

// Offense positions arranged looking UP at the defense
const OFFENSE_FORMATION = {
  // O-Line (top row, closest to defense)
  LT: [{ x: 20, y: 5 }],
  LG: [{ x: 32, y: 5 }],
  C: [{ x: 44, y: 5 }],
  RG: [{ x: 56, y: 5 }],
  RT: [{ x: 68, y: 5 }],
  // Tight Ends (flanking line)
  TE: [{ x: 8, y: 5 }, { x: 80, y: 5 }],
  // Backfield
  QB: [{ x: 44, y: 30 }],
  RB: [{ x: 44, y: 50 }],
  FB: [{ x: 30, y: 40 }],
  // Receivers (wide)
  WR: [{ x: 2, y: 20 }, { x: 88, y: 20 }],
};

// Kickoff team formation
const KICKOFF_FORMATION = {
  K: [{ x: 45, y: 70 }],                        // Kicker in back
  L1: [{ x: 10, y: 15 }],                       // Lane 1
  L2: [{ x: 25, y: 15 }],                       // Lane 2
  L3: [{ x: 40, y: 15 }],                       // Lane 3
  L4: [{ x: 55, y: 15 }],                       // Lane 4
  L5: [{ x: 70, y: 15 }],                       // Lane 5
  R1: [{ x: 85, y: 15 }],                       // Right 1
  R2: [{ x: 20, y: 35 }],                       // Second row
  R3: [{ x: 45, y: 35 }],                       // Safety
  R4: [{ x: 70, y: 35 }],                       // Second row
};

// Kickoff return formation
const KICKOFF_RETURN_FORMATION = {
  KR: [{ x: 45, y: 70 }],                       // Kick returner deep
  KR2: [{ x: 30, y: 70 }],                      // Second returner
  FL: [{ x: 5, y: 15 }],                        // Front line
  FR: [{ x: 85, y: 15 }],
  WB1: [{ x: 25, y: 30 }],                      // Wedge blockers
  WB2: [{ x: 40, y: 30 }],
  WB3: [{ x: 55, y: 30 }],
  WB4: [{ x: 70, y: 30 }],
  SB1: [{ x: 35, y: 50 }],                      // Safety blockers
  SB2: [{ x: 55, y: 50 }],
};

// Punt team formation
const PUNT_FORMATION = {
  P: [{ x: 45, y: 70 }],                        // Punter
  LS: [{ x: 45, y: 15 }],                       // Long snapper
  PP: [{ x: 45, y: 40 }],                       // Personal protector
  LW: [{ x: 20, y: 15 }],                       // Left wing
  RW: [{ x: 70, y: 15 }],                       // Right wing
  LG: [{ x: 32, y: 15 }],                       // Guards
  RG: [{ x: 58, y: 15 }],
  LT: [{ x: 8, y: 15 }],                        // Tackles
  RT: [{ x: 82, y: 15 }],
  G1: [{ x: 5, y: 35 }],                        // Gunners
  G2: [{ x: 88, y: 35 }],
};

// Punt return formation
const PUNT_RETURN_FORMATION = {
  PR: [{ x: 45, y: 70 }],                       // Punt returner
  VL: [{ x: 10, y: 15 }],                       // Vice left
  VR: [{ x: 80, y: 15 }],                       // Vice right
  RL1: [{ x: 25, y: 25 }],                      // Return line
  RL2: [{ x: 40, y: 25 }],
  RL3: [{ x: 55, y: 25 }],
  RL4: [{ x: 70, y: 25 }],
  SB1: [{ x: 30, y: 45 }],                      // Safety blockers
  SB2: [{ x: 60, y: 45 }],
};

// Field goal / PAT formation
const FIELD_GOAL_FORMATION = {
  K: [{ x: 55, y: 50 }],                        // Kicker
  H: [{ x: 45, y: 40 }],                        // Holder
  LS: [{ x: 45, y: 15 }],                       // Long snapper
  LG: [{ x: 32, y: 15 }],
  RG: [{ x: 58, y: 15 }],
  LT: [{ x: 20, y: 15 }],
  RT: [{ x: 70, y: 15 }],
  LW: [{ x: 8, y: 15 }],                        // Wings
  RW: [{ x: 82, y: 15 }],
};

// Field goal block formation
const FG_BLOCK_FORMATION = {
  BL1: [{ x: 25, y: 20 }],                      // Block line
  BL2: [{ x: 35, y: 20 }],
  BL3: [{ x: 45, y: 20 }],
  BL4: [{ x: 55, y: 20 }],
  BL5: [{ x: 65, y: 20 }],
  R1: [{ x: 10, y: 35 }],                       // Rushers
  R2: [{ x: 80, y: 35 }],
  S1: [{ x: 30, y: 50 }],                       // Safeties
  S2: [{ x: 60, y: 50 }],
};

// Onside kick formation
const ONSIDE_FORMATION = {
  K: [{ x: 45, y: 50 }],                        // Kicker
  H1: [{ x: 20, y: 15 }],                       // Hands team front
  H2: [{ x: 30, y: 15 }],
  H3: [{ x: 40, y: 15 }],
  H4: [{ x: 50, y: 15 }],
  H5: [{ x: 60, y: 15 }],
  H6: [{ x: 70, y: 15 }],
  B1: [{ x: 25, y: 30 }],                       // Back row
  B2: [{ x: 45, y: 30 }],
  B3: [{ x: 65, y: 30 }],
};

// Hands team (onside recovery)
const HANDS_TEAM_FORMATION = {
  FR1: [{ x: 20, y: 15 }],                      // Front row (hands)
  FR2: [{ x: 30, y: 15 }],
  FR3: [{ x: 40, y: 15 }],
  FR4: [{ x: 50, y: 15 }],
  FR5: [{ x: 60, y: 15 }],
  FR6: [{ x: 70, y: 15 }],
  BR1: [{ x: 25, y: 35 }],                      // Back row
  BR2: [{ x: 45, y: 35 }],
  BR3: [{ x: 65, y: 35 }],
  S: [{ x: 45, y: 55 }],                        // Safety
};

// Map of formation pairs for the formation view
const FORMATION_PAIRS = {
  'offense-defense': {
    top: { formation: DEFENSE_FORMATION, chartType: 'defense', label: 'Defense' },
    bottom: { formation: OFFENSE_FORMATION, chartType: 'offense', label: 'Offense' }
  },
  'kickoff': {
    top: { formation: KICKOFF_FORMATION, chartType: 'kickoff', label: 'Kickoff Coverage' },
    bottom: { formation: KICKOFF_RETURN_FORMATION, chartType: 'kickoff_return', label: 'Kickoff Return' }
  },
  'punt': {
    top: { formation: PUNT_FORMATION, chartType: 'punt', label: 'Punt Team' },
    bottom: { formation: PUNT_RETURN_FORMATION, chartType: 'punt_return', label: 'Punt Return' }
  },
  'field-goal': {
    top: { formation: FIELD_GOAL_FORMATION, chartType: 'field_goal', label: 'Field Goal / PAT' },
    bottom: { formation: FG_BLOCK_FORMATION, chartType: 'fg_block', label: 'FG Block' }
  },
  'onside': {
    top: { formation: ONSIDE_FORMATION, chartType: 'onside', label: 'Onside Kick' },
    bottom: { formation: HANDS_TEAM_FORMATION, chartType: 'hands_team', label: 'Hands Team' }
  }
};

/**
 * Depth Chart print template - supports full page, half-sheet, and formation formats
 */
export default function DepthChartPrint({
  viewMode = 'full',
  chartTypes = ['offense', 'defense'],
  pairings = DEFAULT_PAIRINGS,
  showBackups = true,
  depthLevels = 2,
  weekId,
  levelId,
  formationPairs = ['offense-defense'] // For formation view: which pairs to print
}) {
  const { roster, depthCharts, weeks, programLevels, activeLevelId, settings, setupConfig } = useSchool();

  // Generate dynamic positions from personnel groupings and setup config
  const personnelGroupings = setupConfig?.personnelGroupings || [];
  const positionNames = setupConfig?.positionNames || {};
  const customPositions = setupConfig?.customPositions?.OFFENSE || [];
  const hiddenPositions = setupConfig?.hiddenPositions?.OFFENSE || [];

  // Use canonical offense positions from the shared utility
  // This ensures print view matches the core 11 positions from Setup.jsx
  const DEFAULT_OFFENSE_POSITIONS = CANONICAL_OFFENSE_POSITIONS;

  // Compute active positions: defaults + custom - hidden
  const activePositions = useMemo(() => {
    const defaults = DEFAULT_OFFENSE_POSITIONS.filter(p => !hiddenPositions.includes(p.key));
    const custom = customPositions.map(p => ({ key: p.key || p, default: p.default || p.key || p }));
    return [...defaults, ...custom];
  }, [customPositions, hiddenPositions]);

  const { basePositions, additionalPositions, basePersonnel } = useMemo(() => {
    return generateDepthChartPositions(levelId || activeLevelId, programLevels, personnelGroupings, positionNames, activePositions);
  }, [levelId, activeLevelId, programLevels, personnelGroupings, positionNames, activePositions]);

  // Convert dynamic positions to print format for offense
  const dynamicOffenseLayout = useMemo(() => {
    if (!basePositions || basePositions.length === 0) return POSITION_LAYOUTS.offense;
    return basePositions.map(pos => ({
      pos: pos.id,
      label: pos.label
    }));
  }, [basePositions]);

  // Get current week
  const currentWeek = useMemo(() => {
    return weeks.find(w => w.id === weekId);
  }, [weeks, weekId]);

  // Get selected level
  const selectedLevel = levelId || activeLevelId || programLevels?.[0]?.id || 'varsity';

  // Build player lookup
  const playerMap = useMemo(() => {
    const map = {};
    roster.forEach(player => {
      map[player.id] = player;
    });
    return map;
  }, [roster]);

  // Get depth chart data
  const getDepthChartData = (chartType) => {
    // Use dynamic positions for offense if available
    const positions = chartType === 'offense' && dynamicOffenseLayout.length > 0
      ? dynamicOffenseLayout
      : (POSITION_LAYOUTS[chartType] || []);
    const chartData = depthCharts?.[selectedLevel]?.[chartType] || {};

    return positions.map(({ pos, label }) => {
      const positionData = chartData[pos] || {};
      const players = [];

      for (let depth = 1; depth <= depthLevels; depth++) {
        const playerId = positionData[`depth${depth}`];
        const player = playerId ? playerMap[playerId] : null;
        players.push(player);
      }

      return { pos, label, players };
    });
  };

  if (viewMode === 'halfSheet') {
    return (
      <HalfSheetView
        chartTypes={chartTypes}
        pairings={pairings}
        depthLevels={depthLevels}
        getDepthChartData={getDepthChartData}
        currentWeek={currentWeek}
        settings={settings}
      />
    );
  }

  if (viewMode === 'formation') {
    return (
      <FormationView
        depthLevels={depthLevels}
        currentWeek={currentWeek}
        settings={settings}
        depthCharts={depthCharts}
        selectedLevel={selectedLevel}
        playerMap={playerMap}
        formationPairs={formationPairs}
        dynamicOffensePositions={basePositions}
      />
    );
  }

  return (
    <FullPageView
      chartTypes={chartTypes}
      depthLevels={depthLevels}
      getDepthChartData={getDepthChartData}
      currentWeek={currentWeek}
      settings={settings}
    />
  );
}

// Full page view - one chart per page
function FullPageView({ chartTypes, depthLevels, getDepthChartData, currentWeek, settings }) {
  return (
    <div className="depth-chart-print">
      {chartTypes.map((chartType, idx) => (
        <div key={chartType} className={idx > 0 ? 'print-page-break' : ''}>
          {/* Header */}
          <div className="print-header">
            <div className="print-header-left">
              {settings?.teamLogo && (
                <img src={settings.teamLogo} alt="Logo" className="print-header-logo" />
              )}
              <div className="print-header-info">
                <div className="print-header-title">Depth Chart - {CHART_LABELS[chartType]}</div>
                <div className="print-header-subtitle">
                  {currentWeek?.name} {currentWeek?.opponent && `vs ${currentWeek.opponent}`}
                </div>
              </div>
            </div>
            <div className="print-header-right">
              <div className="print-header-date">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Depth Chart Table */}
          <table className="depth-chart-table">
            <thead>
              <tr>
                <th>Position</th>
                {Array.from({ length: depthLevels }, (_, i) => (
                  <th key={i}>{getOrdinal(i + 1)} String</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getDepthChartData(chartType).map(({ pos, label, players }) => (
                <tr key={pos}>
                  <td className="depth-chart-position-cell">
                    <div className="font-bold">{pos}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </td>
                  {players.map((player, depth) => (
                    <td key={depth}>
                      {player ? (
                        <div>
                          <span className="font-medium">#{player.number}</span>{' '}
                          <span>{player.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// Half-sheet view - two charts per page (5.5" x 4.25" each)
function HalfSheetView({ chartTypes, pairings, depthLevels, getDepthChartData, currentWeek, settings }) {
  // Create pairs
  const pairs = [];
  const used = new Set();

  chartTypes.forEach(chartType => {
    if (used.has(chartType)) return;

    const partner = pairings[chartType];
    if (partner && chartTypes.includes(partner) && !used.has(partner)) {
      pairs.push([chartType, partner]);
      used.add(chartType);
      used.add(partner);
    } else {
      pairs.push([chartType, null]);
      used.add(chartType);
    }
  });

  return (
    <div>
      {pairs.map((pair, pairIdx) => (
        <div key={pairIdx} className="depth-chart-halfsheet-pair">
          {pair.map((chartType, idx) => (
            chartType ? (
              <div key={chartType} className="depth-chart-halfsheet">
                {/* Mini Header */}
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-400">
                  <div className="flex items-center gap-2">
                    {settings?.teamLogo && (
                      <img src={settings.teamLogo} alt="Logo" className="h-6 w-auto" />
                    )}
                    <span className="font-bold">{CHART_LABELS[chartType]}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {currentWeek?.opponent && `vs ${currentWeek.opponent}`}
                  </span>
                </div>

                {/* Compact Table */}
                <table className="depth-chart-table text-xs">
                  <thead>
                    <tr>
                      <th className="py-1 px-2">Pos</th>
                      {Array.from({ length: depthLevels }, (_, i) => (
                        <th key={i} className="py-1 px-2">{i + 1}st</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getDepthChartData(chartType).map(({ pos, players }) => (
                      <tr key={pos}>
                        <td className="font-bold py-0.5 px-2 bg-gray-100">{pos}</td>
                        {players.map((player, depth) => (
                          <td key={depth} className="py-0.5 px-2">
                            {player ? `#${player.number} ${player.name?.split(' ')[1] || player.name}` : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div key={idx} className="depth-chart-halfsheet bg-gray-50" />
            )
          ))}
        </div>
      ))}
    </div>
  );
}

// Helper to get ordinal suffix
function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Canvas dimensions from DepthCharts.jsx editor
const EDITOR_CANVAS_WIDTH = 1056;
const EDITOR_CANVAS_HEIGHT = 408;

// Formation view - renders formation pairs on landscape pages
function FormationView({ depthLevels, currentWeek, settings, depthCharts, selectedLevel, playerMap, formationPairs = ['offense-defense'], dynamicOffensePositions = [] }) {
  // Get saved layout positions from week data
  const savedLayouts = currentWeek?.depthChartLayouts || {};

  // Get depth row counts from week data
  const savedRowCounts = currentWeek?.depthRowCounts || {};

  // Build set of valid offense position IDs from dynamic positions
  const validOffensePositionIds = new Set(
    dynamicOffensePositions.map(p => p.id)
  );

  // Get depth data for a specific position - uses week-specific depth charts
  const getPositionDepth = (chartType, pos, numRows) => {
    // First try week-specific depth chart, then fall back to global
    const weekChartData = currentWeek?.depthCharts?.[chartType] || {};
    const chartData = weekChartData[pos] || depthCharts?.[selectedLevel]?.[chartType]?.[pos] || [];
    const players = [];

    // Use saved row count or fall back to depthLevels
    const rowCount = numRows || depthLevels;

    for (let depth = 0; depth < rowCount; depth++) {
      const playerId = chartData[depth];
      const player = playerId ? playerMap[playerId] : null;
      players.push(player);
    }

    return players;
  };

  // Convert editor pixel coordinates to print percentages
  const convertToPercent = (x, y) => ({
    x: (x / EDITOR_CANVAS_WIDTH) * 100,
    y: (y / EDITOR_CANVAS_HEIGHT) * 100
  });

  // Render a single position box as a spreadsheet-style table
  const PositionBox = ({ pos, players, style }) => (
    <div className="formation-position-box" style={style}>
      <table className="formation-position-table">
        <thead>
          <tr>
            <th colSpan={2}>{pos}</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => (
            <tr key={idx}>
              <td className="formation-depth-num">{idx + 1}</td>
              <td className="formation-player-name">
                {player ? `#${player.number} ${player.name?.split(' ').pop() || player.name}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render all positions for a formation using saved layout if available
  const renderFormation = (defaultFormationLayout, chartType) => {
    const boxes = [];
    const savedLayout = savedLayouts[chartType] || {};
    const chartRowCounts = savedRowCounts[chartType] || {};

    // For offense, only render positions that exist in the current setup config
    const isOffense = chartType === 'offense';
    const shouldRenderPosition = (posId) => {
      if (!isOffense) return true; // Non-offense charts render all positions
      if (validOffensePositionIds.size === 0) return true; // No config, show all
      return validOffensePositionIds.has(posId);
    };

    // If we have a saved layout, use it instead of defaults
    if (Object.keys(savedLayout).length > 0) {
      Object.entries(savedLayout).forEach(([posId, coords]) => {
        // Skip positions not in current setup config (for offense)
        if (!shouldRenderPosition(posId)) return;

        const numRows = chartRowCounts[posId] || depthLevels;
        const players = getPositionDepth(chartType, posId, numRows);
        const percent = convertToPercent(coords.x, coords.y);

        boxes.push(
          <PositionBox
            key={posId}
            pos={posId}
            players={players}
            style={{
              position: 'absolute',
              left: `${percent.x}%`,
              top: `${percent.y}%`,
              transform: 'translate(-50%, 0)'
            }}
          />
        );
      });
    } else if (isOffense && dynamicOffensePositions.length > 0) {
      // For offense without saved layout, use dynamic positions with default coords
      dynamicOffensePositions.forEach((pos) => {
        const posId = pos.id;
        const defaultCoord = OFFENSE_FORMATION[posId]?.[0] || { x: 50, y: 50 };
        const numRows = chartRowCounts[posId] || depthLevels;
        const players = getPositionDepth(chartType, posId, numRows);

        boxes.push(
          <PositionBox
            key={posId}
            pos={posId}
            players={players}
            style={{
              position: 'absolute',
              left: `${defaultCoord.x}%`,
              top: `${defaultCoord.y}%`,
              transform: 'translate(-50%, 0)'
            }}
          />
        );
      });
    } else {
      // Fall back to default formation layout (for defense, special teams, etc.)
      Object.entries(defaultFormationLayout).forEach(([pos, positions]) => {
        if (!shouldRenderPosition(pos)) return;

        const numRows = chartRowCounts[pos] || depthLevels;
        const players = getPositionDepth(chartType, pos, numRows);

        positions.forEach((coord, idx) => {
          boxes.push(
            <PositionBox
              key={`${pos}-${idx}`}
              pos={positions.length > 1 ? `${pos}` : pos}
              players={players}
              style={{
                position: 'absolute',
                left: `${coord.x}%`,
                top: `${coord.y}%`,
                transform: 'translate(-50%, 0)'
              }}
            />
          );
        });
      });
    }

    return boxes;
  };

  // Render a single formation page
  const FormationPage = ({ pairKey, isFirstPage }) => {
    const pair = FORMATION_PAIRS[pairKey];
    if (!pair) return null;

    return (
      <div className={`formation-view-container ${!isFirstPage ? 'page-break-before' : ''}`}>
        {/* Header */}
        <div className="formation-header">
          <div className="formation-header-left">
            {settings?.teamLogo && (
              <img src={settings.teamLogo} alt="Logo" className="formation-header-logo" />
            )}
            <div>
              <div className="formation-header-title">
                {pair.top.label} / {pair.bottom.label}
              </div>
              <div className="formation-header-subtitle">
                {currentWeek?.name} {currentWeek?.opponent && `vs ${currentWeek.opponent}`}
              </div>
            </div>
          </div>
          <div className="formation-header-subtitle">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Top half */}
        <div className="formation-half formation-half-top">
          <div className="formation-half-label">{pair.top.label}</div>
          {renderFormation(pair.top.formation, pair.top.chartType)}
        </div>

        {/* Divider */}
        <div className="formation-divider">
          <span className="formation-divider-text">
            {pairKey === 'offense-defense' ? 'LINE OF SCRIMMAGE' : ''}
          </span>
        </div>

        {/* Bottom half */}
        <div className="formation-half formation-half-bottom">
          <div className="formation-half-label">{pair.bottom.label}</div>
          {renderFormation(pair.bottom.formation, pair.bottom.chartType)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @media print {
          @page {
            size: letter landscape;
            margin: 0.25in;
          }
          .formation-view-container {
            margin: 0 !important;
          }
        }

        .formation-view-container {
          width: 10.5in;
          height: 8in;
          margin: 0.25in auto;
          background: white;
          display: flex;
          flex-direction: column;
          font-family: Arial, sans-serif;
        }

        .formation-view-container.page-break-before {
          page-break-before: always;
          break-before: page;
        }

        .formation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 12px;
          border-bottom: 2px solid black;
          background: #f3f4f6;
          flex-shrink: 0;
        }

        .formation-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .formation-header-logo {
          height: 28px;
          width: auto;
        }

        .formation-header-title {
          font-weight: bold;
          font-size: 12pt;
        }

        .formation-header-subtitle {
          font-size: 9pt;
          color: #666;
        }

        .formation-half {
          flex: 1;
          position: relative;
          border: 1px solid #ccc;
          overflow: hidden;
        }

        .formation-half-top {
          border-bottom: none;
          background: white;
        }

        .formation-half-bottom {
          background: white;
        }

        .formation-half-label {
          position: absolute;
          top: 4px;
          left: 8px;
          font-weight: bold;
          font-size: 10pt;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: rgba(255,255,255,0.8);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .formation-position-box {
          width: 85px;
        }

        .formation-position-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border: 2px solid black;
          font-size: 6.5pt;
          box-shadow: 1px 1px 3px rgba(0,0,0,0.2);
        }

        .formation-position-table th {
          background: #1f2937;
          color: white;
          font-weight: bold;
          font-size: 7pt;
          padding: 2px 4px;
          text-align: center;
          border: 1px solid black;
        }

        .formation-position-table td {
          border: 1px solid #333;
          padding: 1px 2px;
          background: white;
        }

        .formation-depth-num {
          width: 14px;
          text-align: center;
          font-weight: bold;
          background: #e5e7eb;
          border-right: 1px solid #333;
        }

        .formation-player-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 65px;
        }

        .formation-divider {
          height: 3px;
          background: black;
          position: relative;
          flex-shrink: 0;
        }

        .formation-divider-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 0 8px;
          font-size: 7pt;
          font-weight: bold;
          color: #666;
        }
      `}</style>

      {formationPairs.map((pairKey, idx) => (
        <FormationPage key={pairKey} pairKey={pairKey} isFirstPage={idx === 0} />
      ))}
    </div>
  );
}
