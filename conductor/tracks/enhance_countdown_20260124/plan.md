
# Implementation Plan - Enhance Countdown Tracker

## Phase 1: Edit Modal & Data
- [x] Task: Update Edit Modal. [4a467dc]
    - [x] Add Radio buttons for "List" vs "Bar" in `#countdownInputs`.
    - [x] Update `TrackerManager.submitTracker` to capture `displayStyle`.
    - [x] Update `TrackerManager.openModal` to populate `displayStyle`.

## Phase 2: Rendering Logic
- [ ] Task: Update \enderBoard\.
    - [ ] Implement sorting (Ascending date).
    - [ ] Implement List rendering with new format.
    - [ ] Implement Bar rendering using \enderChart\.
- [ ] Task: Update \ZoomManager\.
    - [ ] Reflect same logic in Zoom view.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Render' (Protocol in workflow.md)

