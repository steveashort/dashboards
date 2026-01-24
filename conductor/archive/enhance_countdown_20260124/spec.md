
# Specification: Enhance Countdown Tracker

## Goal
Improve the Countdown tracker by adding visualization options (List vs Bar Chart), improving date formatting, and ensuring consistent sorting.

## Requirements
### 1. Visualization Options
- **Edit Mode:** Add a "Display Style" option for Countdown trackers.
    - **List:** Traditional text list.
    - **Bar Chart:** Horizontal bar chart showing "Days Remaining".
- **Default:** List.

### 2. Formatting (List View)
- **Format:** Display date as "DD Mon YY (XX days)".
- **Coloring:** Retain existing traffic light logic.

### 3. Sorting
- **Logic:** Always sort by date ascending (Overdue -> Today -> Future).

### 4. Bar Chart View
- **X-Axis:** Days remaining.
- **Y-Axis:** Event labels.
- **Color:** Dynamic based on urgency.

