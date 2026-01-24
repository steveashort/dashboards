
# Implementation Plan - Stabilize and Modernize Visualization

## Phase 1: Stabilization of Legacy Charts
- [ ] Task: Analyze and reproduce rendering bugs in charts.js.
    - [ ] Create a reproduction test case (manual or simple script) to observe failures in Gauge and Waffle charts.
    - [ ] Document findings in this task.
- [ ] Task: Fix Gauge SVG Pathing.
    - [ ] Refactor createGaugeSVG math to ensure arcs render correctly for all values (0-100).
    - [ ] Verify fix with edge cases (0, 50, 100).
- [ ] Task: Fix Waffle Chart Generation.
    - [ ] Refactor createWaffleHTML to ensure grid items are generated correctly matching input arrays.
    - [ ] Ensure correct CSS class application for colors.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Stabilization' (Protocol in workflow.md)

## Phase 2: Integration of ApexCharts
- [ ] Task: Add ApexCharts dependency.
    - [ ] Update index.html to include ApexCharts script (CDN).
    - [ ] Verify library availability in the global scope.
- [ ] Task: Create ApexCharts Helper wrapper.
    - [ ] Create/Update charts.js (or pex-helpers.js) with a factory function to generate standard chart config.
    - [ ] Map styles.css CSS variables to ApexCharts theme palette.
- [ ] Task: Implement "Top 5" Card Container.
    - [ ] Update index.html to include the HTML structure for the Top 5 card.
    - [ ] Add necessary CSS to styles.css for card layout and sizing.
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

