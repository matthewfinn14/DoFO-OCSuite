# WIZ Wristband System - Improvement Specification

## Status: Active Development (2026-01-23) - Phases 1, 2, 5, 6 Completed

This document serves as a shared reference for implementing improvements to the WIZ wristband diagramming and display system. It can be used across Claude Code and Google Antigravity sessions.

---

## Reference Artifacts (Goals)

The target appearance comes from the user's previous Google Slides/Sheets workflow.

### Skill Positions View (Target)
```
┌─────────────────────────────────────────┐
│ [Diagram Area]                          │
│   - Yard lines: 5, 10, 15 going UP      │
│   - Hash marks at TOP (orange)          │
│   - LOS at BOTTOM                       │
│   - Bold, visible route lines           │
│   - Colored circles for players (X,Y,Z) │
│   - "T G C G T" text for O-line         │
│   - Arrows on route endpoints           │
│   - Dotted lines for motion             │
│   - Optional note text at very bottom   │
├─────┬───────────────────────────────────┤
│ 301 │ 887 ORANGE X LASSO + FLOOD        │  ← Slot # left, Play name right (bold)
└─────┴───────────────────────────────────┘
```

### O-Line View (Target)
```
┌─────┬─────────────────────────────────┐
│ 301 │ BROWN                           │  ← Slot # left, Protection name right
├─────┴─────────────────────────────────┤
│                                       │
│         T G C G T                     │  ← Large text, C emphasized
│         🔒 ? 🔒                        │  ← Lock icons
│         ←───────→                     │  ← Directional arrows
│                                       │
│       Slide L – Man R                 │  ← Protection call text
│                                       │
└───────────────────────────────────────┘
```

### Key Visual Properties
- **Line thickness**: Bold, clearly visible (current is too thin/faded)
- **Colors**: Red, Blue, Green, Yellow/Gold, Purple for routes
- **Player circles**: Filled with white, colored border, letter inside
- **Space utilization**: Diagram should fill the cell, minimal white space
- **Field background**: Clean with yard markers on left side only

---

## Current Issues

### 1. Diagramming Tool (PlayDiagramEditor)
**File**: `index.html` (search for `PlayDiagramEditor`)
**Location**: Around line 36000+

| Issue | Current | Target |
|-------|---------|--------|
| Field orientation | Midfield view (35-50) | LOS at bottom, 5/10/15 going up |
| Formation library | Placeholder dropdown | Auto-populate from text input |
| Formation storage | None | Separate library to pull from |

### 2. Master Playbook Edit Preview
**Location**: PlayQuickAddModal or similar component

| Issue | Current | Target |
|-------|---------|--------|
| Player rendering | Text labels only | Colored circles with letters |
| Line thickness | Too thin | Bold, visible |
| Field background | None | Show yard lines |
| Scaling | Squished/compressed | Proper proportions |

### 3. Master Playbook Grid View
**Location**: Master Playbook card rendering

| Issue | Current | Target |
|-------|---------|--------|
| Card previews | Completely blank | Show diagram thumbnails |
| Data source | Not rendering `diagramData` | Render `wizSkillData` or `diagramData` |

### 4. WIZ Wristband Grid Display
**File**: `index.html`
**Function**: `renderWizGrid` (around line 9078)
**Function**: `renderPlayThumbnail` (around line 8956)

| Issue | Current | Target |
|-------|---------|--------|
| Diagram opacity | Faded/light | Bold, high contrast |
| Space utilization | Too much white space | Fill cell efficiently |
| Card size | Fixed | Configurable for different wristbands |
| viewBox calculation | May be off | Smart crop to content |

### 5. O-Line Diagram Library (New Feature)
**Status**: Does not exist yet

| Requirement | Description |
|-------------|-------------|
| Library storage | Collection of reusable protection schemes |
| Scheme types | BROWN, GOLD, GREEN, SHOW 7, SHOW 8, CUT, etc. |
| Assignment | Ability to assign library scheme to a play |
| Custom draw | Option to draw new scheme if not in library |
| Display | "T G C G T" with arrows, lock icons, protection text |

---

## Implementation Plan

### Phase 1: Fix Rendering Issues (Priority: HIGH) - ✅ COMPLETED
**Goal**: Get existing diagrams to display correctly everywhere

1. **Fix `renderPlayThumbnail` function** - DONE
   - Increase stroke width for lines (4px → 5px)
   - Ensure player circles render (bolded 4px border)
   - Add field background lines (light green fill, faint markers)
   - Improve viewBox calculation for better space usage (Smart Crop)

2. **Fix Master Playbook grid card previews** - DONE
   - Unified with `renderPlayThumbnail` logic

3. **Fix Master Playbook edit preview** - DONE
   - `renderDiagramPreview` in `PlayInput` updated with smart crop and field background

### Phase 2: Improve WIZ Grid Display (Priority: HIGH) - ✅ COMPLETED
**Goal**: Match reference artifact appearance

1. **Update cell layout** - DONE
   - Diagram area fills most of cell via Smart Crop
   - Bottom row with coordinate and play name

2. **Improve diagram rendering** - DONE
   - Bold lines (strokeWidth: 5)
   - Smart crop calculation for centered, high-density visuals

3. **Add configurable card size** - DONE
   - Settings dropdown for 3x5 and 4x6 in Wristband Builder
   - Dynamic aspect ratio preview support

### Phase 3: Formation Library (Priority: MEDIUM)
**Goal**: Auto-populate formations from text input

1. **Create formation data structure**
   ```javascript
   const formationLibrary = {
     "TRIPS_RT": {
       name: "Trips Right",
       players: [
         { label: "X", x: 50, y: 500, color: "#8b5cf6" },
         { label: "Y", x: 700, y: 500, color: "#eab308" },
         { label: "Z", x: 750, y: 500, color: "#22c55e" },
         // ... etc
       ]
     },
     // ... more formations
   };
   ```

2. **Update Formation dropdown**
   - Populate from library
   - On select, place players at positions

3. **Storage**
   - Save to localStorage or Firestore
   - Allow user to add/edit formations

### Phase 4: O-Line Diagram Library (Priority: MEDIUM)
**Goal**: Reusable protection scheme library

1. **Create protection scheme data structure**
   ```javascript
   const protectionLibrary = {
     "BROWN": {
       name: "Brown",
       slideDirection: "right",
       manSide: "left",
       text: "Man L – Slide R",
       specialInstructions: null
     },
     "SHOW_8": {
       name: "Show 8",
       slideDirection: null,
       manSide: null,
       text: "SHOW 8 = DON'T GO DOWNFIELD!",
       specialInstructions: "Pass set, show blitz pickup"
     }
   };
   ```

2. **O-Line diagram editor**
   - Simple interface for T G C G T + arrows
   - Text input for protection call
   - Save to library

3. **Assignment UI**
   - In play edit modal, dropdown to select protection
   - Option to "Create New" protection

### Phase 5: Field Background Improvements (Priority: LOW) - ✅ COMPLETED
**Goal**: Better field rendering in diagram editor

1. **Update field view options**
   - Consistent light green background (`#f0fdf4`) added to all previews

2. **Visual improvements**
   - Faint yard line markers added to previews
   - High-contrast bold rendering for play elements

---

## Technical Reference

### Key Data Properties on Play Objects
```javascript
play = {
  id: "...",
  name: "RED 39 MUSTANG",

  // Main diagram (from Master Playbook)
  diagramData: { elements: [...] },

  // WIZ-specific diagrams
  wizSkillData: [...],      // Array of elements
  wizOlineData: [...],      // Array of elements

  // Legacy (may still exist)
  rooskiSkillData: [...],
  rooskiOlineData: [...],

  // Wristband assignment
  wristbandSlot: "107",
  isWiz: true
}
```

### Key Functions to Modify
| Function | Location | Purpose |
|----------|----------|---------|
| `renderPlayThumbnail` | ~line 8956 | Renders diagram in WIZ grid cells |
| `renderWizGrid` | ~line 9078 | Renders the 4x4 WIZ grid |
| `PlayDiagramEditor` | ~line 36000+ | The diagramming tool |
| `WristbandDiagramSVG` | Search for it | SVG rendering component |
| `calculateDiagramBounds` | Near renderPlayThumbnail | ViewBox calculation |

### CSS/Style Adjustments Needed
```javascript
// Current (too thin)
strokeWidth: 2

// Target (bold)
strokeWidth: 4

// Player circle size
const size = 30;  // May need to increase

// Font sizes for labels
fontSize: "16"  // May need to adjust
```

---

## Progress Tracking

### Completed
- [x] Changed "R" badge to "W" in play list (2026-01-23)
- [x] Added "Standard (Master Playbook)" view option (2026-01-23)
- [x] Changed default WIZ view to "standard" (2026-01-23)
- [x] Fixed WIZ grid `renderPlayThumbnail` (~line 8956): Added arrow markers, field background, increased strokeWidth to 4-5 (2026-01-23)
- [x] Fixed Master Playbook `renderPlayThumbnail` (~line 23185): Added field background, increased strokeWidth to 4-5 (2026-01-23)
- [x] Made play name bold in WIZ grid cells (2026-01-23)
- [x] **Smart Crop Logic**: Implemented `calculateDiagramBounds` to auto-zoom on play content (2026-01-23)
- [x] **Print View Consistency**: Updated third instance of `renderPlayThumbnail` for print layouts (2026-01-23)
- [x] **Play Input Preview**: Updated `renderDiagramPreview` in `PlayInput` with smart crop and field theme (2026-01-23)
- [x] **Configurable Card Sizes**: Added support for 3x5 and 4x6 card dimensions (2026-01-23)

### In Progress
- [x] Phase 3: Formation Library - Core functionality complete (2026-01-23)
  - [x] `flipFormation()` function to mirror formations left/right
  - [x] `saveAsFormationTemplate()` function to save current diagram as formation
  - [x] UI buttons: "Flip" and "Save As Formation" in toolbar
  - [x] `onAddFormation` prop threaded through to App's `handleAddFormation`
  - [x] Formations save to localStorage via existing `formations` state
  - [x] Formation dropdown already populates from `formations` array
  - [x] `loadFormation()` already works to restore formations to canvas
  - [ ] Optional: Formation library management UI (edit, delete saved formations)

### Not Started
- [ ] Phase 4: O-Line Diagram Library

### Phase 6: Skill Editor Aspect Ratio Refactor - ✅ COMPLETED (2026-01-23)
**Goal**: Match editor canvas to WIZ card print output aspect ratio

**Problem Solved**:
- Editor used 900x600 viewBox (3:2 ratio)
- WIZ grid cells display with 800x460 viewBox (1.74:1 ratio)
- Users drew on larger canvas than visible in final output
- Elements near edges were cropped in WIZ wristband display

**Changes Made**:
1. **Added `fieldViewMode` state** - Tracks whether editor is in "WIZ Card" (800x460) or "Full Field" (900x600) view
2. **Auto-select WIZ Card view** - When `mode === 'wiz-skill'`, editor defaults to WIZ Card view
3. **Added View dropdown** - Users can switch between "WIZ Card" and "Full Field" views in wiz-skill mode
4. **Dynamic SVG viewBox** - Editor canvas switches between `0 20 800 460` (WIZ Card) and `0 0 900 600` (Full Field)
5. **Visual boundary guides** - When in Full Field view, dimmed overlay shows what will be cropped in print
6. **Updated default formation** - WIZ skill formation now positioned within visible area (LOS at y=400)
7. **Preview consistency** - `renderDiagramPreview` for wizSkillData now uses WIZ Card viewBox

**Key Locations**:
- `fieldViewMode` state: line ~3457
- View dropdown: line ~4330
- SVG viewBox: line ~4473
- Boundary guides: after line 4697
- Default formation: line ~3321
- `renderDiagramPreview`: line ~5203

---

## Session Handoff Notes

### For Next Session (Claude Code or Antigravity)

**Context**: User wants WIZ wristband system to match their previous Google Slides/Sheets workflow. Key visual goals are bold lines, proper player circles, efficient space usage, and library-based workflow for formations and O-line protections.

**What Was Just Done (2026-01-23 later session)**:
1. **Restored from Antigravity corruption**: Antigravity had corrupted the file with garbled text around lines 25029+. Restored from git and re-applied good changes manually.
2. **Formation Library COMPLETE**: Full end-to-end formation save/load now works:
   - Added `flipFormation()` to mirror formations left/right
   - Added `saveAsFormationTemplate()` to save current diagram as a formation template
   - Added "Flip" and "Save As Formation" buttons to PlayDiagramEditor toolbar
   - Connected `onAddFormation` prop all the way through PlayInput → App → `handleAddFormation`
   - Formations now save to localStorage and persist across sessions
   - Formation dropdown in wiz-skill mode auto-populates from saved formations
   - `loadFormation()` restores formations to canvas when selected
3. **Position name display**: Player labels now show `positionNames[label]` if configured (e.g., can show "WR1" instead of "X").

**Phase 3 Status**: Core functionality COMPLETE. Users can now:
- Draw a formation in the editor
- Click "Save As Formation" to add it to their library
- Select saved formations from dropdown to load them
- Use "Flip" button to mirror formations left/right

**What Still Needs Work**:
1. **Phase 3 Enhancement (Optional)**: Formation library management UI (view all formations, rename, delete from a dedicated screen)
2. **Phase 4: O-Line Protection Library**: Creating a reusable set of protection schemes (BROWN, GOLD, etc.) with specialized visual symbols.

**Priority Order**:
1. Phase 4: O-Line Diagram Library
2. (Optional) Phase 3 Enhancement: Formation management UI

**Key Files**:
- Main app: `/Users/mattfinn/Documents/GitHub/DoFO-OCSuite/index.html`
- This spec: `/Users/mattfinn/Documents/GitHub/DoFO-OCSuite/WIZ_IMPROVEMENT_SPEC.md`
- PlayChip spec: `/Users/mattfinn/Documents/GitHub/DoFO-OCSuite/PLAY_CHIP_SPEC.md`

**Key Functions**:
- `flipFormation()` - mirrors diagram horizontally (line ~3576)
- `saveAsFormationTemplate()` - saves current players as formation template (line ~3594)
- `loadFormation()` - loads formation from library to canvas (line ~3473)
- `handleAddFormation()` - App-level handler that saves to state/localStorage (line ~39022)
- UI buttons in PlayDiagramEditor toolbar (line ~4383)

**What Was Just Done (2026-01-23 - Phase 6)**:
1. **Aspect Ratio Refactor COMPLETE**: WIZ Skill Editor now matches print output
   - Added `fieldViewMode` state that defaults to "wiz-card" for wiz-skill mode
   - Added "View" dropdown to switch between WIZ Card (800x460) and Full Field (900x600)
   - Editor SVG dynamically switches viewBox based on mode
   - Added visual boundary guides when in Full Field view showing crop area
   - Repositioned default wiz-skill formation (LOS at y=400) to fit within visible bounds
   - Updated `renderDiagramPreview` to use WIZ Card viewBox for skill diagram previews

**Start Here**:
- Test WIZ skill editor aspect ratio changes (open a play, edit WIZ skill diagram)
- Verify the View dropdown appears and switches between WIZ Card and Full Field
- Test that formations and routes drawn fit within the WIZ Card visible area
- Move on to Phase 4: O-Line Protection Library

---

*Last Updated: 2026-01-23*
*Author: Claude Code + User collaboration*
