
# Specification: Replace Waffle with Stacked Bar Chart

## Goal
Replace the existing Waffle chart visualization with a stacked bar chart that clearly shows completed versus remaining work, and ensure it always uses the "Small" card size.

## Context
The previous Waffle chart implementation proved problematic for dynamic sizing and visual clarity, especially with larger datasets. The user has requested a more robust and visually consistent stacked bar chart to represent completion against a target.

## Requirements
### 1. Remove Waffle Chart
- **Deprecation:** Eliminate \waffle\ as a tracker type.
- **Cleanup:** Remove all \createWaffleHTML\ and \createWaffleData\ functions from \charts.js\.
- **Refactor:** Remove \waffle\ type handling from \pp.js\ (\enderBoard\, \submitTracker\, \ZoomManager\, \TrackerManager.setType\, \calculateTrackerSize\).
- **Tests:** Remove related tests (\	est_waffle_limit.js\, \	est_waffle_apex.js\).

### 2. Implement Stacked Bar Chart (Gauge-style)
- **New Type:** Introduce a new tracker type, \completionBar\.
- **Data:**
    - Input: \completed\, \	otal\, \metric\.
    - Output: Two series: \Completed\ and \Remaining\ (\Remaining = total - completed\).
- **Visualization:** Single horizontal stacked bar.
- **Sizing:** Always use "Small" card size (1x1).
- **Colors:** Use project's existing color scheme (e.g., green for completed, gray/muted for remaining).

