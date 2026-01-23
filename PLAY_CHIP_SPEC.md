# PlayChip Component System - Implementation Spec

## Status: In Progress (Updated 2026-01-22)

### Completed
- [x] `PlayChip` component (line ~6210) - visual chip with flags, colors, drag support
- [x] `PlayChipInput` component (line ~6321) - autocomplete input with chips
- [x] `PlayDetailsModal` component (line ~6574) - renamed from AssignSituationsModal
- [x] `PlayDetailsModalContext` (line ~6203) - root-level context for opening modal from any PlayChip
- [x] Context provider wired up in App (line ~41875)
- [x] Root-level modal rendering (line ~43361)
- [x] Updated 3 modal usages to use new name and pass `playCategories`
- [x] **NEW: Bucket selection row** - selectable buttons below Priority/Wiz/MiniScript
- [x] **NEW: Concept Family selection** - nested under selected bucket
- [x] **NEW: Header shows play's assigned bucket/family** (not all buckets)

### PlayDetailsModal Structure (Current)

```
┌─────────────────────────────────────────┐
│ PLAY NAME                           [X] │
│ [Bucket Tag] [Concept Family Tag]       │  ← Shows play's current assignments
├─────────────────────────────────────────┤
│ [Priority] [Wiz] [Mini Script]  WB:[  ] │
├─────────────────────────────────────────┤
│ BUCKET                                  │
│ [Run] [Pass] [Screen] ...               │  ← Click to select (from playCategories)
├─────────────────────────────────────────┤
│ CONCEPT FAMILY                          │  ← Only shows if bucket selected
│ [Inside Zone] [Outside Zone] ...        │  ← Filtered by selected bucket
├─────────────────────────────────────────┤
│ SCRIPTS                                 │
│ [chip] [chip] [chip]                    │
│                                         │
│ DOWN AND DISTANCE                       │
│ [chip] [chip] [chip] ...                │
└─────────────────────────────────────────┘
```

### Data Hierarchy

```
playCategories (top-level buckets)
├── Run
├── Pass
└── Screen

playBuckets (concept families, linked via categoryId)
├── Inside Zone (categoryId: "run")
├── Outside Zone (categoryId: "run")
├── Counter (categoryId: "run")
├── Quick Game (categoryId: "pass")
├── Dropback (categoryId: "pass")
└── ...

play object
├── bucketId → links to playCategories.id
└── conceptFamily → matches playBuckets.label
```

### TODO: Integration Points (6 locations)

Replace existing play inputs with `PlayChipInput`:

1. **Practice Script Builder** (line ~10076)
   - Status: Not started
   - Currently: inline text input
   - Target: Replace with `PlayChipInput`

2. **Install Manager** (line ~23574)
   - Status: Modal updated ✓
   - Target: Add PlayChipInput for quick-add

3. **Game Planner Sidebar** (line ~25671)
   - Status: Modal updated ✓
   - Target: Add PlayChipInput for quick-add

4. **Wristband Builder** (line ~6855)
   - Status: Not started
   - Currently: Quick add input
   - Target: Replace with PlayChipInput

5. **Smart Call Sheet** (line ~20196)
   - Status: Not started
   - Currently: Inline input per situation
   - Target: Replace with PlayChipInput

6. **Master Playbook** (line ~42278)
   - Status: Not started
   - Currently: Full PlayInput editor
   - Target: Consider adding PlayChipInput for quick navigation

### Component Reference

**PlayChip props:**
```jsx
<PlayChip
  play={playObject}           // OR use playId + plays
  playId="play_123"
  plays={allPlays}
  playBuckets={buckets}       // For color
  onRemove={(id) => {}}       // Shows X button
  showFlags={true}            // ★⚡📋 indicators
  size="sm|md|lg"
  draggable={true}            // Enable drag
  onClick={() => {}}          // Optional click handler
/>
// Right-click always opens PlayDetailsModal via context
```

**PlayChipInput props:**
```jsx
<PlayChipInput
  plays={allPlays}
  selectedPlayIds={[id1, id2]}
  onChange={(newIds) => {}}
  onQuickAddPlay={(name) => {}}  // Creates new play
  playBuckets={buckets}
  placeholder="Type play name..."
  allowCreate={true}
  disabled={false}
/>
// Supports: typing, autocomplete, Enter to add, drag-drop, backspace to remove
```

**PlayDetailsModal props:**
```jsx
<PlayDetailsModal
  playId="play_123"
  plays={allPlays}
  playCategories={categories}     // Top-level buckets (Run, Pass, Screen)
  playBuckets={buckets}           // Concept families (nested under categories)
  gamePlanLayouts={layouts}
  onUpdatePlay={(id, updates) => {}}
  onAssignSituation={(playId, box) => {}}
  currentWeek={weekData}
  onClose={() => {}}
/>
```

### Files Modified
- `/Users/mattfinn/Documents/GitHub/DoFO-OCSuite/index.html`
  - Lines ~6200-6573: New components (PlayChip, PlayChipInput, context)
  - Lines ~6574-6900: PlayDetailsModal (enhanced with bucket/family selection)
  - Lines ~24601, ~26472: Updated modal usages
  - Lines ~38273-38276: Modal state in App
  - Lines ~41875, ~43361: Context provider and root modal

### Next Session Prompt

Copy this to continue work:

```
I'm continuing work on the PlayChip component system for DoFO-OCSuite.
Reference: /Users/mattfinn/Documents/GitHub/DoFO-OCSuite/PLAY_CHIP_SPEC.md

Completed so far:
- PlayChip, PlayChipInput, PlayDetailsModal components
- Modal now has Bucket and Concept Family selection rows
- Context wired up at app root

Next priority: Integrate PlayChipInput into one of these views for testing:
1. Practice Script Builder
2. Wristband Builder
3. Smart Call Sheet

The components are ready - we just need to replace existing inputs with PlayChipInput.
```
