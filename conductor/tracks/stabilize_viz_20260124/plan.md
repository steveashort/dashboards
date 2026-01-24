
# Implementation Plan - Stabilize and Modernize Visualization

## Phase 1: Stabilization of Legacy Charts
- [x] Task: Analyze and reproduce rendering bugs in `charts.js`. [35735ec]
    - [x] Create a reproduction test case (manual or simple script) to observe failures in Gauge and Waffle charts.
    - [x] Document findings in this task.
- [x] Task: Fix Gauge SVG Pathing. [b5d6688]
    - [x] Refactor createGaugeSVG math to ensure arcs render correctly for all values (0-100).
    - [x] Verify fix with edge cases (0, 50, 100).
- [x] Task: Fix Waffle Chart Generation. [b5d6688]
    - [x] Refactor createWaffleHTML to ensure grid items are generated correctly matching input arrays.
    - [x] Ensure correct CSS class application for colors.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Stabilization' (Protocol in workflow.md) [checkpoint: 453c018]

## Phase 2: Integration of ApexCharts
- [ ] Task: Add ApexCharts dependency.
    - [ ] Update `index.html` to include ApexCharts script (CDN).
    - [ ] Verify library availability in the global scope.
- [ ] Task: Create ApexCharts Helper wrapper.
    - [ ] Create/Update `charts.js` (or `apex-helpers.js`) with a factory function to generate standard chart config.
    - [ ] Map `styles.css` CSS variables to ApexCharts theme palette.
- [ ] Task: Migrate existing Line/Bar charts to ApexCharts.
    - [ ] Refactor `Visuals.createLineChartSVG` and `Visuals.createMultiBarChartSVG` to return a container div and initialize ApexCharts.
    - [ ] Update `renderBoard` to handle the new async/object-based rendering (since SVG string injection won't work directly).
- [ ] Task: Implement "Top 5" Card Container.
- [ ] Task: Render "Top 5" Chart with Mock Data.
    - [ ] Initialize an ApexCharts instance in the Top 5 container.
    - [ ] Render static mock data to verify visual style and responsiveness.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Integration' (Protocol in workflow.md)

## Phase 3: Data Wiring and Final Polish
- [ ] Task: Wire "Top 5" Chart to App State.
    - [ ] Update pp.js to extract real "Top 5" metrics from State.trackers.
    - [ ] Create an update function to refresh the chart when data changes.
- [ ] Task: Verify Responsiveness.
    - [ ] Test dashboard resizing to ensure both SVG and ApexCharts resize correctly.
    - [ ] Adjust media queries if necessary for 1440x900 optimization.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Data Wiring' (Protocol in workflow.md)

