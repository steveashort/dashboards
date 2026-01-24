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
- [ ] Task: Add new \completionBar\ tracker type.
    - [ ] Add \	ypeCompletionBarBtn\ to \	rackerModal\ HTML.
    - [ ] Update \TrackerManager.setType\.
    - [ ] Add input fields for \completed\, \	otal\, \metric\ to \completionBarInputs\.
- [ ] Task: Implement \completionBar\ logic.
    - [ ] Add \completionBar\ block to \submitTracker\.
    - [ ] Implement \completionBar\ block in \enderBoard\ using ApexCharts.
        - \	ype: 'bar'\, \stacked: true\, \horizontal: true\.
        - Data: \completed\, \emaining\.
        - Colors.
    - [ ] Implement \completionBar\ block in \ZoomManager.openChartModal\.
    - [ ] Force "Small" card size.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Stacked Bar' (Protocol in workflow.md)