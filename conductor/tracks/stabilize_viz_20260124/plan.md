
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
- [x] Task: Add ApexCharts dependency. [809cc75]
    - [x] Update `index.html` to include ApexCharts script (CDN).
    - [x] Verify library availability in the global scope.
- [x] Task: Create ApexCharts Helper wrapper. [7f55665]
    - [x] Create/Update `charts.js` (or `apex-helpers.js`) with a factory function to generate standard chart config.
    - [x] Map `styles.css` CSS variables to ApexCharts theme palette.
- [x] Task: Migrate existing Line/Bar charts to ApexCharts. [4fb3682]
    - [x] Refactor `Visuals.createLineChartSVG` and `Visuals.createMultiBarChartSVG` to return a container div and initialize ApexCharts.
    - [x] Update `renderBoard` to handle the new async/object-based rendering (since SVG string injection won't work directly).
- [x] Task: Implement "Top 5" Card Container. [878c56b]
    - [x] Update `index.html` to include the HTML structure for the Top 5 card.
    - [x] Add necessary CSS to `styles.css` for card layout and sizing.
- [x] Task: Render "Top 5" Chart with Mock Data. [135a85f]
    - [x] Initialize an ApexCharts instance in the Top 5 container.
    - [x] Render static mock data to verify visual style and responsiveness.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Integration' (Protocol in workflow.md) [checkpoint: 29073cd]

## Phase 3: Data Wiring and Final Polish
- [x] Task: Fix Chart Sizing and Grid Layout. [8fe7d27]
    - [x] Update CSS to enforce a 5-column grid layout.
    - [x] Implement sizing logic: S(1x1), M(2x1), L(3x1), XL(3x2).
    - [x] Fix ApexCharts sizing to fit within cards and allow editing interaction.
- [x] Task: Wire "Top 5" Chart to App State. [a89a34e]
    - [x] Update `app.js` to extract real "Top 5" metrics from `State.trackers`.
    - [x] Create an update function to refresh the chart when data changes.
- [x] Task: Verify Responsiveness. [17248bb]
    - [x] Test dashboard resizing to ensure both SVG and ApexCharts resize correctly.
    - [x] Adjust media queries if necessary for 1440x900 optimization.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Data Wiring' (Protocol in workflow.md) [checkpoint: 2e2348d]

## Phase 4: Refinement
- [ ] Task: Remove Top 5 Metrics Card.
    - [ ] Remove HTML container from `index.html`.
    - [ ] Remove `App.renderTop5` and its call in `app.js`.
    - [ ] Remove `getTop5FromTrackers` from `charts.js`.

