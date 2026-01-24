# Implementation Plan - Replace Waffle with Stacked Bar Chart

## Phase 1: Waffle Removal
- [x] Task: Remove Waffle functions and tests. [90e9265]
    - [x] Delete `createWaffleHTML` from `charts.js`.
    - [x] Delete `createWaffleData` from `charts.js`.
    - [x] Remove `test_waffle_limit.js` and `test_waffle_apex.js`.
- [x] Task: Refactor `app.js` Waffle handling. [a51d75d]
    - [x] Remove `waffle` import from `app.js`.
    - [x] Remove `waffle` block from `renderBoard`.
    - [x] Remove `waffle` block from `submitTracker`.
    - [x] Remove `waffle` block from `ZoomManager.openChartModal`.
    - [x] Remove `waffle` from `TrackerManager.setType` and `calculateTrackerSize`.
    - [x] Remove `typeWaffleBtn` from `trackerModal` HTML.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Waffle Removal' (Protocol in workflow.md) [checkpoint: 66b0e42]

## Phase 2: Stacked Bar Chart Implementation
- [x] Task: Add new `completionBar` tracker type. [eef78a8]
    - [x] Add `typeCompletionBarBtn` to `trackerModal` HTML.
    - [x] Update `TrackerManager.setType`.
    - [x] Add input fields for `completed`, `total`, `metric` to `completionBarInputs`.
- [x] Task: Implement `completionBar` logic. [eef78a8]
    - [x] Add `completionBar` block to `submitTracker`.
    - [x] Implement `completionBar` block in `renderBoard` using ApexCharts.
        - `type: 'bar'`, `stacked: true`, `horizontal: true`.
        - Data: `completed`, `remaining`.
        - Colors.
    - [x] Implement `completionBar` block in `ZoomManager.openChartModal`.
    - [x] Force "Small" card size.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Stacked Bar' (Protocol in workflow.md)