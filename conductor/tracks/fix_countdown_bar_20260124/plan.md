# Implementation Plan - Fix Countdown Bar Chart Rendering

## Phase 1: Diagnosis and Fix
- [x] Task: Review `app.js` and `charts.js` for Countdown bar chart implementation. [1e9a9ad]
    - [x] Inspect `app.js` `renderBoard` and `ZoomManager` `openChartModal` `countdown` bar style blocks.
    - [x] Inspect `charts.js` `getCountdownGanttData` function.
    - [x] Identify discrepancies or errors in data passed to `renderChart` or ApexCharts configuration.
- [x] Task: Implement fix for rendering issue. [d1e104f]
    - [x] Correct any identified data structure or configuration errors.
    - [x] Consider adding a default `yaxis.min` and `yaxis.max` or `xaxis.min`/`max` if the problem is axis scaling.
    - [x] Ensure `labels` are correct.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Fix' (Protocol in workflow.md) [checkpoint: 1e3af16]
## Phase 2: Reminder Urgency Visuals
- [x] Task: Implement visual cues for Countdown urgency. [0b3c404]
    - [x] Define color/flashing logic for each threshold (7, 14, 30, 60 days).
    - [x] Integrate icons (siren, yellow).
    - [x] Apply changes to both List and Bar Chart views.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Urgency Visuals' (Protocol in workflow.md) [checkpoint: 4259e0c]


## Phase 3: Countdown Bar Chart & Sizing Fixes
- [x] Task: Implement sizing logic for Countdown tracker. [6fda2e2]
    - [x] If list form, force S (1x1) size.
    - [x] If bar chart form, force M (2x1) size.
- [ ] Task: Fix Countdown Bar Chart Rendering.
    - [ ] Re-evaluate data structure and ApexCharts configuration.
    - [ ] Ensure chart actually draws with labels and bars.
    - [ ] Ensure X-axis represents days with today at 0.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Fixes' (Protocol in workflow.md)

