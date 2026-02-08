/**
 * Validation utilities for AI-generated whiteboard analysis results.
 * Sanitizes and validates the output before sending to the client.
 */

import { WhiteboardAnalysisResult, DetectedPlayer, DetectedRoute } from "../prompts/whiteboardAnalysis";

const VALID_POSITIONS = new Set([
  "QB", "RB", "FB", "X", "Y", "Z", "H", "A", "F",
  "T", "G", "C", "LT", "LG", "RG", "RT",
  "WR", "TE", "HB"
]);

const VALID_STYLES = new Set(["solid", "dashed", "zigzag"]);
const VALID_END_TYPES = new Set(["arrow", "dot", "none"]);

/**
 * Parse and validate the raw JSON response from Claude.
 * Returns a sanitized WhiteboardAnalysisResult or throws an error.
 */
export function parseAndValidate(rawResponse: string): WhiteboardAnalysisResult {
  // Extract JSON from the response (Claude might include markdown code blocks)
  let jsonString = rawResponse.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI response is not a valid object");
  }

  const result = parsed as Record<string, unknown>;

  // Validate and sanitize players
  const players: DetectedPlayer[] = [];
  if (Array.isArray(result.players)) {
    for (const player of result.players) {
      const validated = validatePlayer(player);
      if (validated) {
        players.push(validated);
      }
    }
  }

  // Validate and sanitize routes
  const routes: DetectedRoute[] = [];
  if (Array.isArray(result.routes)) {
    for (const route of result.routes) {
      const validated = validateRoute(route, players.length);
      if (validated) {
        routes.push(validated);
      }
    }
  }

  // Validate line of scrimmage
  let lineOfScrimmage = null;
  if (result.lineOfScrimmage && typeof result.lineOfScrimmage === "object") {
    const los = result.lineOfScrimmage as Record<string, unknown>;
    const y = Number(los.y);
    const confidence = Number(los.confidence);
    if (!isNaN(y) && y >= 0 && y <= 100) {
      lineOfScrimmage = {
        y: clamp(y, 0, 100),
        confidence: clamp(isNaN(confidence) ? 0.5 : confidence, 0, 1),
      };
    }
  }

  // Get detection notes
  const detectionNotes = typeof result.detectionNotes === "string"
    ? result.detectionNotes.slice(0, 500) // Limit length
    : "";

  return {
    players,
    routes,
    lineOfScrimmage,
    detectionNotes,
  };
}

function validatePlayer(player: unknown): DetectedPlayer | null {
  if (typeof player !== "object" || player === null) {
    return null;
  }

  const p = player as Record<string, unknown>;

  const x = Number(p.x);
  const y = Number(p.y);

  if (isNaN(x) || isNaN(y)) {
    return null;
  }

  let suggestedLabel = String(p.suggestedLabel || "?").toUpperCase();
  if (!VALID_POSITIONS.has(suggestedLabel)) {
    suggestedLabel = "?";
  }

  const confidence = Number(p.confidence);
  const isOLine = Boolean(p.isOLine);

  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
    suggestedLabel,
    confidence: clamp(isNaN(confidence) ? 0.5 : confidence, 0, 1),
    isOLine,
  };
}

function validateRoute(route: unknown, playerCount: number): DetectedRoute | null {
  if (typeof route !== "object" || route === null) {
    return null;
  }

  const r = route as Record<string, unknown>;

  const fromPlayerIndex = Number(r.fromPlayerIndex);
  if (isNaN(fromPlayerIndex) || fromPlayerIndex < 0 || fromPlayerIndex >= playerCount) {
    return null;
  }

  if (!Array.isArray(r.points) || r.points.length === 0) {
    return null;
  }

  const points: Array<{ x: number; y: number }> = [];
  for (const point of r.points) {
    if (typeof point === "object" && point !== null) {
      const pt = point as Record<string, unknown>;
      const x = Number(pt.x);
      const y = Number(pt.y);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({
          x: clamp(x, 0, 100),
          y: clamp(y, 0, 100),
        });
      }
    }
  }

  if (points.length === 0) {
    return null;
  }

  let style = String(r.style || "solid").toLowerCase() as "solid" | "dashed" | "zigzag";
  if (!VALID_STYLES.has(style)) {
    style = "solid";
  }

  let endType = String(r.endType || "arrow").toLowerCase() as "arrow" | "dot" | "none";
  if (!VALID_END_TYPES.has(endType)) {
    endType = "arrow";
  }

  const confidence = Number(r.confidence);

  return {
    fromPlayerIndex,
    points,
    style,
    endType,
    confidence: clamp(isNaN(confidence) ? 0.5 : confidence, 0, 1),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if the analysis result seems valid enough to proceed.
 */
export function isValidAnalysis(result: WhiteboardAnalysisResult): { valid: boolean; reason?: string } {
  if (result.players.length === 0) {
    return { valid: false, reason: "No players detected in the image" };
  }

  // Check for minimum confidence threshold
  const avgConfidence = result.players.reduce((sum, p) => sum + p.confidence, 0) / result.players.length;
  if (avgConfidence < 0.3) {
    return { valid: false, reason: "Detection confidence is too low. Try a clearer photo." };
  }

  // Warn if no skill players detected
  const skillPlayers = result.players.filter(p => !p.isOLine);
  if (skillPlayers.length === 0) {
    return { valid: false, reason: "No skill position players detected" };
  }

  return { valid: true };
}
