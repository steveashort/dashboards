
# Specification: Multi-value Counter Tracker

## Goal
Allow the Counter tracker type to display up to 6 independent counters within a single card.

## Requirements
- **Data Model:** Update Counter to store an array of objects \{ label, value, color }\.
- **UI (Modal):** Add a dynamic row manager to the Counter input section (Add/Remove rows, max 6).
- **UI (Card):** 
    - If 1 counter: Large centered display (current style).
    - If > 1 counter: Display in a responsive grid/list layout.
- **UI (Zoom):** Ensure all counters are visible and legible in the zoomed view.

