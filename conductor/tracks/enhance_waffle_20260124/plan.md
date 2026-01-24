
# Implementation Plan - Enhance Waffle Charts and Dynamic Sizing

## Phase 1: Waffle Enhancement
- [x] Task: Increase Waffle Chart Limit. [5cb3b0f]
    - [x] Update `charts.js` `createWaffleHTML` to accept up to 5000.
    - [x] Update `app.js` `TrackerManager` validation to allow 5000.
    - [x] Verify performance with 5000 items.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Waffle' (Protocol in workflow.md)

## Phase 2: Dynamic Sizing Logic
- [ ] Task: Implement Size Calculation Logic.
    - [ ] Create calculateTrackerSize(tracker) function in charts.js.
    - [ ] Define thresholds for Waffle and defaults for other types.
- [ ] Task: Update Card Rendering.
    - [ ] Update pp.js to use calculated size.
    - [ ] Update TrackerManager to remove manual size input.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Sizing' (Protocol in workflow.md)

