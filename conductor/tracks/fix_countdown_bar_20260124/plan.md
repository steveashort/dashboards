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
- [ ] Task: Implement visual cues for Countdown urgency.
    - [ ] Define color/flashing logic for each threshold (7, 14, 30, 60 days).
    - [ ] Integrate icons (siren, yellow).
    - [ ] Apply changes to both List and Bar Chart views.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Urgency Visuals' (Protocol in workflow.md)

