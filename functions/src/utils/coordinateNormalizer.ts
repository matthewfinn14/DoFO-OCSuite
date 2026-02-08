/**
 * Coordinate normalization utilities for converting whiteboard
 * percentage-based coordinates to WIZ canvas pixel coordinates.
 */

import {
  DetectedPlayer,
  WhiteboardAnalysisResult,
} from "../prompts/whiteboardAnalysis";

// WIZ canvas dimensions
const WIZ_WIDTH = 950;
const WIZ_HEIGHT = 450;
const WIZ_CENTER_X = WIZ_WIDTH / 2; // 475
const WIZ_LOS_Y = 290; // Standard line of scrimmage position

// Default skill position placements (fallback when detection is uncertain)
const SKILL_POSITION_PLACEMENTS: Record<string, { x: number; y: number }> = {
  QB: { x: 510, y: 375 },
  RB: { x: 420, y: 390 },
  X: { x: 80, y: 290 },
  Y: { x: 870, y: 290 },
  Z: { x: 710, y: 330 },
  H: { x: 750, y: 337 },
  F: { x: 350, y: 390 },
};

// O-Line positions
const OLINE_POSITIONS: Record<string, { x: number; y: number }> = {
  C: { x: WIZ_CENTER_X, y: WIZ_LOS_Y },
  LG: { x: WIZ_CENTER_X - 38, y: WIZ_LOS_Y },
  RG: { x: WIZ_CENTER_X + 38, y: WIZ_LOS_Y },
  LT: { x: WIZ_CENTER_X - 76, y: WIZ_LOS_Y },
  RT: { x: WIZ_CENTER_X + 76, y: WIZ_LOS_Y },
};

export interface WizPlayer {
  id: string;
  type: "player";
  points: Array<{ x: number; y: number }>;
  color: string;
  label: string;
  shape: "circle" | "square" | "text-only";
  variant: "filled" | "outline";
  positionKey?: string;
  groupId?: string;
  detectionConfidence?: number;
}

export interface WizRoute {
  id: string;
  type: "polyline";
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
  style: "solid" | "dashed" | "zigzag";
  endType: "arrow" | "dot" | "t" | undefined;
  detectionConfidence?: number;
}

export interface NormalizedResult {
  players: WizPlayer[];
  routes: WizRoute[];
  warnings: string[];
}

/**
 * Normalize percentage-based coordinates to WIZ canvas coordinates.
 * Anchors the line of scrimmage to the standard WIZ LOS position.
 */
export function normalizeCoordinates(
  analysis: WhiteboardAnalysisResult
): NormalizedResult {
  const warnings: string[] = [];
  const players: WizPlayer[] = [];
  const routes: WizRoute[] = [];

  // Determine the LOS offset
  const detectedLosY = analysis.lineOfScrimmage?.y ?? 60;
  const losConfidence = analysis.lineOfScrimmage?.confidence ?? 0.5;

  if (losConfidence < 0.6) {
    warnings.push("Line of scrimmage detection was uncertain. Positions may need adjustment.");
  }

  // Calculate scale factors
  // Map the detected LOS to WIZ_LOS_Y, and scale the rest proportionally
  const scaleY = (percentY: number): number => {
    // Offset so that detected LOS maps to WIZ_LOS_Y
    const yOffset = WIZ_LOS_Y - (detectedLosY / 100) * WIZ_HEIGHT;
    return (percentY / 100) * WIZ_HEIGHT + yOffset;
  };

  const scaleX = (percentX: number): number => {
    return (percentX / 100) * WIZ_WIDTH;
  };

  // Process players
  let olineCount = 0;
  const olinePlayers: DetectedPlayer[] = [];
  const skillPlayers: DetectedPlayer[] = [];

  // Separate O-line from skill players
  for (const player of analysis.players) {
    if (player.isOLine) {
      olinePlayers.push(player);
      olineCount++;
    } else {
      skillPlayers.push(player);
    }
  }

  // Handle O-line players (use default positions for reliability)
  if (olinePlayers.length > 0) {
    // Sort O-line players by x position (left to right)
    const sortedOline = [...olinePlayers].sort((a, b) => a.x - b.x);
    const olineLabels = ["LT", "LG", "C", "RG", "RT"];

    for (let i = 0; i < Math.min(sortedOline.length, 5); i++) {
      const label = olineLabels[i];
      const defaultPos = OLINE_POSITIONS[label];

      players.push({
        id: `oline-${i}`,
        type: "player",
        points: [{ x: defaultPos.x, y: defaultPos.y }],
        color: "#000000",
        label: label === "LG" || label === "RG" ? "G" : label === "LT" || label === "RT" ? "T" : "C",
        shape: "text-only",
        variant: "filled",
        positionKey: label,
        groupId: "oline",
        detectionConfidence: sortedOline[i].confidence,
      });
    }

    if (olineCount !== 5) {
      warnings.push(`Detected ${olineCount} O-linemen instead of 5. Using standard positions.`);
    }
  }

  // Handle skill players
  for (let i = 0; i < skillPlayers.length; i++) {
    const player = skillPlayers[i];
    const label = player.suggestedLabel || "?";

    // Use default position if confidence is low, otherwise use detected position
    let x: number;
    let y: number;

    if (player.confidence < 0.5 && SKILL_POSITION_PLACEMENTS[label]) {
      const defaultPos = SKILL_POSITION_PLACEMENTS[label];
      x = defaultPos.x;
      y = defaultPos.y;
      warnings.push(`Low confidence for ${label} position. Using default placement.`);
    } else {
      x = scaleX(player.x);
      y = scaleY(player.y);

      // Clamp to canvas bounds
      x = Math.max(20, Math.min(WIZ_WIDTH - 20, x));
      y = Math.max(20, Math.min(WIZ_HEIGHT - 20, y));
    }

    players.push({
      id: `skill-${i}`,
      type: "player",
      points: [{ x, y }],
      color: "#000000", // Color will be resolved by the UI based on position
      label,
      shape: "circle",
      variant: "filled",
      positionKey: label,
      detectionConfidence: player.confidence,
    });

    if (player.confidence < 0.6) {
      warnings.push(`${label} detection confidence is low (${Math.round(player.confidence * 100)}%).`);
    }
  }

  // Process routes
  for (let i = 0; i < analysis.routes.length; i++) {
    const route = analysis.routes[i];

    if (route.fromPlayerIndex < 0 || route.fromPlayerIndex >= analysis.players.length) {
      warnings.push(`Route ${i + 1} references invalid player index.`);
      continue;
    }

    // Scale route points
    const scaledPoints = route.points.map((point) => ({
      x: Math.max(0, Math.min(WIZ_WIDTH, scaleX(point.x))),
      y: Math.max(0, Math.min(WIZ_HEIGHT, scaleY(point.y))),
    }));

    // Add the starting point from the player
    const sourcePlayer = analysis.players[route.fromPlayerIndex];
    const startPoint = {
      x: scaleX(sourcePlayer.x),
      y: scaleY(sourcePlayer.y),
    };

    routes.push({
      id: `route-${i}`,
      type: "polyline",
      points: [startPoint, ...scaledPoints],
      color: "#000000",
      strokeWidth: 3,
      style: route.style,
      endType: route.endType === "none" ? undefined : route.endType,
      detectionConfidence: route.confidence,
    });

    if (route.confidence < 0.6) {
      warnings.push(`Route ${i + 1} detection confidence is low (${Math.round(route.confidence * 100)}%).`);
    }
  }

  // Add general detection notes as warning if present
  if (analysis.detectionNotes) {
    warnings.push(analysis.detectionNotes);
  }

  return { players, routes, warnings };
}
