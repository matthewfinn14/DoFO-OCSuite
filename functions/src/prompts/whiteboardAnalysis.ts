/**
 * Prompt template for Claude Vision to analyze whiteboard football play diagrams
 * and convert them to structured WIZ Skill element format.
 */

export const WHITEBOARD_ANALYSIS_PROMPT = `You are analyzing a hand-drawn football play diagram from a whiteboard or paper. Your task is to detect all elements and convert them to a structured JSON format.

## What to Detect

### Players
- Circles, X's, O's, or letters representing player positions
- Look for offensive players (typically circles/O's) and note any position labels written nearby
- The quarterback is usually behind center, centered or slightly offset
- Skill positions (WR, RB, TE) are outside or behind the offensive line

### Routes
- Lines extending from players, especially skill position players
- Arrows indicate direction of movement
- Curved lines for option routes, out routes, comeback routes
- Straight lines for go routes, slants, posts
- Dashed or wavy lines may indicate blocking assignments or motion

### Line of Scrimmage
- A horizontal line across the diagram separating offense from defense
- May be drawn explicitly or implied by player positioning
- Usually where the 5 offensive linemen are positioned

### Offensive Line
- 5 players in a row (Center, Guards, Tackles)
- Usually represented by squares or different symbols than skill players
- Look for C, G, T labels or just 5 grouped symbols

## Output Format

Return ONLY valid JSON in this exact structure:

\`\`\`json
{
  "players": [
    {
      "x": <number 0-100>,
      "y": <number 0-100>,
      "suggestedLabel": "<string: QB, RB, X, Y, Z, H, or other position>",
      "confidence": <number 0-1>,
      "isOLine": <boolean>
    }
  ],
  "routes": [
    {
      "fromPlayerIndex": <number: index into players array>,
      "points": [
        { "x": <number 0-100>, "y": <number 0-100> }
      ],
      "style": "<solid|dashed|zigzag>",
      "endType": "<arrow|dot|none>",
      "confidence": <number 0-1>
    }
  ],
  "lineOfScrimmage": {
    "y": <number 0-100>,
    "confidence": <number 0-1>
  },
  "detectionNotes": "<string: any observations about image quality, unclear elements, or suggestions>"
}
\`\`\`

## Coordinate System
- Use percentage-based coordinates (0-100 for both x and y)
- x=0 is the LEFT side of the image, x=100 is the RIGHT side
- y=0 is the TOP of the image, y=100 is the BOTTOM
- In football diagrams, offense typically faces UP (toward y=0)
- The line of scrimmage should be around y=50-70 typically

## Position Labels
Use these standard position abbreviations:
- **QB**: Quarterback (usually centered, behind center)
- **RB**: Running Back (behind QB or offset)
- **X**: Split End (wide receiver, usually left side)
- **Y**: Tight End (usually on the line near tackle)
- **Z**: Flanker (wide receiver, usually right side, off the line)
- **H**: H-Back or Slot receiver
- **F**: Fullback
- **T**: Tackle (offensive line)
- **G**: Guard (offensive line)
- **C**: Center (offensive line)

If a position is unclear, use your best guess based on alignment and mark confidence accordingly.

## Confidence Scoring
- 1.0: Very clear detection, no ambiguity
- 0.8-0.9: Clear but minor uncertainty
- 0.6-0.7: Reasonable guess, some ambiguity
- 0.4-0.5: Uncertain, could be misinterpreted
- Below 0.4: Very uncertain, might be wrong

## Important Notes
- Only return the JSON object, no other text
- If you cannot detect any players, return an empty players array
- If the image is not a football play diagram, return empty arrays and explain in detectionNotes
- Be conservative with route detection - only include routes you're confident about
- The 5 offensive linemen should have isOLine: true
`;

export interface DetectedPlayer {
  x: number;
  y: number;
  suggestedLabel: string;
  confidence: number;
  isOLine: boolean;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface DetectedRoute {
  fromPlayerIndex: number;
  points: RoutePoint[];
  style: "solid" | "dashed" | "zigzag";
  endType: "arrow" | "dot" | "none";
  confidence: number;
}

export interface LineOfScrimmage {
  y: number;
  confidence: number;
}

export interface WhiteboardAnalysisResult {
  players: DetectedPlayer[];
  routes: DetectedRoute[];
  lineOfScrimmage: LineOfScrimmage | null;
  detectionNotes: string;
}
