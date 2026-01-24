
# Specification: Stabilize and Modernize Visualization

## Goal
To stabilize the current bug-ridden visualization module (charts.js) and integrate ApexCharts to power the new "Top 5" summary card, creating a reliable foundation for the dashboard.

## Context
The current codebase has known issues with rendering custom SVG gauges and waffle charts. Additionally, the new product definition calls for a modern "Top 5" summary card, which will be best implemented using the robust ApexCharts library, aligning with the new Tech Stack.

## Core Requirements
### 1. Fix Existing Visualizations
- **Debug:** Identify root causes of rendering errors in charts.js.
- **Gauge Charts:** Ensure SVG path calculations for the gauge arcs are mathematically correct and responsive.
- **Waffle Charts:** Fix HTML generation logic to correctly reflect server load distribution.

### 2. Integrate ApexCharts
- **Dependency:** Import ApexCharts (via CDN for simplicity or local vendor file) into index.html.
- **Architecture:** Create a new helper module or extend charts.js to handle ApexCharts configuration options (utilizing project CSS variables for theming).

### 3. Implement "Top 5" Summary Card
- **UI Component:** Create a container card for the "Top 5" metrics.
- **Visualization:** Use an ApexCharts Bar or Radial Bar chart to display the top 5 most critical metrics (e.g., highest server loads or most urgent deadlines).
- **Data Source:** Ensure the chart accepts dynamic data arrays from the main App state.

## Non-Functional Requirements
- **Performance:** Charts must render without blocking the UI thread.
- **Responsiveness:** Charts must resize gracefully, optimizing for the 1440x900 target resolution.
- **Theming:** Chart colors must correspond to the CSS variables (--accent, --g-green, etc.) defined in styles.css.

