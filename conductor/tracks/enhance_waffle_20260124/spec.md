
# Specification: Enhance Waffle Charts and Dynamic Sizing

## Goal
Increase the capacity of Waffle charts to display up to 5000 items and implement intelligent, content-aware sizing for tracker cards to optimize dashboard space.

## Context
The current Waffle chart is limited to 450 items. The user requires up to 5000. Additionally, manually selecting card sizes (S/M/L/XL) is tedious; the system should automatically determine the optimal size based on the data to be displayed.

## Requirements
### 1. Waffle Chart Capacity
- **Limit:** Increase max items from 450 to 5000.
- **Rendering:** Ensure rendering 5000 items remains performant.

### 2. Dynamic Card Sizing
- **Logic:** Implement a heuristic to calculate the "Minimum Viable Size" for a tracker.
- **Sizes:**
    - **S (1x1):** Default for simple counters, gauges, small waffles.
    - **M (2x1):** Medium waffles, Line charts.
    - **L (3x1):** Large datasets.
    - **XL (3x2):** Very large datasets (e.g. Waffle > 1000).
- **Automation:** The system should automatically assign the smallest size that fits the content.

## Non-Functional Requirements
- **Performance:** Dashboard load time should not degrade significantly with 5000-item waffles.
- **Layout Stability:** Sizing should be deterministic.

