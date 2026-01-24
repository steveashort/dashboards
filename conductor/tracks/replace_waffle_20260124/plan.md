
# Implementation Plan - Replace Waffle with Stacked Bar Chart

## Phase 1: Waffle Removal
- [ ] Task: Remove Waffle functions and tests.
    - [ ] Delete \createWaffleHTML\ from \charts.js\.
    - [ ] Delete \createWaffleData\ from \charts.js\.
    - [ ] Remove \	est_waffle_limit.js\ and \	est_waffle_apex.js\.
- [ ] Task: Refactor \pp.js\ Waffle handling.
    - [ ] Remove \waffle\ import from \pp.js\.
    - [ ] Remove \waffle\ block from \enderBoard\.
    - [ ] Remove \waffle\ block from \submitTracker\.
    - [ ] Remove \waffle\ block from \ZoomManager.openChartModal\.
    - [ ] Remove \waffle\ from \TrackerManager.setType\ and \calculateTrackerSize\.
    - [ ] Remove \	ypeWaffleBtn\ from \	rackerModal\ HTML.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Waffle Removal' (Protocol in workflow.md)

## Phase 2: Stacked Bar Chart Implementation
- [ ] Task: Add new \completionBar\ tracker type.
    - [ ] Add \	ypeCompletionBarBtn\ to \	rackerModal\ HTML.
    - [ ] Update \TrackerManager.setType\.
    - [ ] Add input fields for \completed\, \	otal\, \metric\ to \completionBarInputs\.
- [ ] Task: Implement \completionBar\ logic.
    - [ ] Add \completionBar\ block to \submitTracker\.
    - [ ] Implement \completionBar\ block in \enderBoard\ using ApexCharts.
        - \	ype: 'bar'\, \stacked: true\, \horizontal: true\.
        - Data: \completed\, \emaining\.
        - Colors.
    - [ ] Implement \completionBar\ block in \ZoomManager.openChartModal\.
    - [ ] Force "Small" card size.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Stacked Bar' (Protocol in workflow.md)

