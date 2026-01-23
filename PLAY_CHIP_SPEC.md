# PlayChip Component System - Implementation Spec

## Status: In Progress (Updated 2026-01-22)

### Completed
- [x] `PlayChip` component - visual chip with flags, colors, drag support
- [x] `PlayChipInput` component - autocomplete input with chips
- [x] `PlayDetailsModal` component - standardized modal (renamed from AssignSituationsModal)
- [x] `PlayDetailsModalContext` - root-level context for opening modal from any PlayChip
- [x] Bucket selection row in modal
- [x] Concept Family selection (nested under selected bucket)
- [x] Header shows play's assigned bucket/family
- [x] Visual feedback on situation chips (immediate color change on click)
- [x] Duplicate prevention using Set
- [x] Fixed getPlaySituations to handle array format
- [x] Standardized modal across: Install Manager, Game Planner Sidebar, Offensive Game Plan
- [x] Removed old renderSituationAssignmentModal
- [x] **Separated Quick List from Script Rows** - plays in script rows don't auto-add to Quick List

### Data Model
```
Quick List = assignedPlayIds (holding area, managed via PlayDetailsModal)
Script Rows = playIds (actual script content, separate from Quick List)
```

### TODO: Integration Points
Replace existing play inputs with `PlayChipInput`:
1. Practice Script Builder
2. Wristband Builder
3. Smart Call Sheet
4. Master Playbook

### Next Session Prompt
```
I'm continuing work on the PlayChip component system for DoFO-OCSuite.
Reference: PLAY_CHIP_SPEC.md

Last session completed:
- PlayDetailsModal with bucket/concept family selection
- Visual feedback on situation chip clicks
- Separated Quick List from Script Rows

Next priorities (ask me which to tackle):
1. Integrate PlayChipInput into existing views
2. Any bugs or UX issues with current implementation
```
