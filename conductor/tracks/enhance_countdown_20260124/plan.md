
# Implementation Plan - Enhance Countdown Tracker

## Phase 1: Edit Modal & Data
- [ ] Task: Update Edit Modal.
    - [ ] Add Radio buttons for "List" vs "Bar" in \#countdownInputs\.
    - [ ] Update \TrackerManager.submitTracker\ to capture \displayStyle\.
    - [ ] Update \TrackerManager.openModal\ to populate \displayStyle\.

## Phase 2: Rendering Logic
- [ ] Task: Update \enderBoard\.
    - [ ] Implement sorting (Ascending date).
    - [ ] Implement List rendering with new format.
    - [ ] Implement Bar rendering using \enderChart\.
- [ ] Task: Update \ZoomManager\.
    - [ ] Reflect same logic in Zoom view.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Render' (Protocol in workflow.md)

