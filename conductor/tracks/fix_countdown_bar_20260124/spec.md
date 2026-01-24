
# Specification: Fix Countdown Bar Chart Rendering

## Goal
Resolve the issue preventing the Countdown tracker's horizontal bar chart (Gantt style) from rendering correctly.

## Context
After implementing the Gantt-style bar chart for the Countdown tracker, users reported that the chart is not drawing anything. This indicates a regression or an integration issue with ApexCharts for this specific visualization.

## Requirements
### 1. Debug and Fix Rendering
- **Identify Cause:** Determine why the \angeBar\ chart is not rendering in \pp.js\. This could be due to incorrect data structure, ApexCharts configuration errors, or CSS/HTML issues.
- **Data Structure:** Verify the \getCountdownGanttData\ output is correctly consumed by \enderChart\.
- **ApexCharts Config:** Check for any misconfigurations in the \enderChart\ options for \angeBar\ type.
- **Test with Mock Data:** Temporarily render a simple \angeBar\ with hardcoded data to isolate the issue.

### 2. Verify Functionality
- **Render Board:** Ensure the Countdown bar chart renders correctly on the main dashboard.
- **Zoom Modal:** Ensure the Countdown bar chart renders correctly in the zoom modal.

