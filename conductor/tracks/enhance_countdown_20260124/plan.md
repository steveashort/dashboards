# Implementation Plan - Enhance Countdown Tracker

## Phase 1: Edit Modal & Data
- [x] Task: Update Edit Modal. [4a467dc]
    - [x] Add Radio buttons for "List" vs "Bar" in `#countdownInputs`.
    - [x] Update `TrackerManager.submitTracker` to capture `displayStyle`.
    - [x] Update `TrackerManager.openModal` to populate `displayStyle`.

## Phase 2: Rendering Logic
- [x] Task: Update `renderBoard`. [d736cc6]
    - [x] Implement sorting (Ascending date).
    - [x] Implement List rendering with new format.
    - [x] Implement Bar rendering using `renderChart`.
- [x] Task: Update `ZoomManager`. [d736cc6]
    - [x] Reflect same logic in Zoom view.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Render' (Protocol in workflow.md)