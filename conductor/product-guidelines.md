
# Product Guidelines: Team Tracker

## Visual Identity & UX
- **Aesthetic:** Clean & Modern. Utilize card-based layouts with subtle shadows, open spacing, and Material Design principles to ensure information is digestible but professional.
- **Interactivity:**
    - **Dynamic Layout:** Users must be able to resize and reposition dashboard cards (Drag-and-Drop) to accommodate changing metric priorities throughout the year.
    - **Persistence:** Layout configurations (positions and sizes) must be saved to localStorage or the state JSON to ensure the dashboard remains consistent across sessions.
- **Theming:**
    - Provide a selection of preset themes (e.g., "Dark", "Light", "High Contrast") to allow teams to choose their preferred visual environment.
    - The existing CSS variables should be leveraged to make theme switching seamless.
- **Responsiveness:**
    - **Primary Target:** Optimize the layout and default card sizing for **1440×900** resolution screens to ensure the best experience for the standard team monitor setup.

## User Experience (UX) Principles
- **Clarity Over Clutter:** Even with many metrics, use whitespace and card boundaries to prevent "information overload."
- **Immediate Utility:** The most critical data (Top 5, Next 5 Reminders) should be visually prioritized.
- **Responsive Feedback:** UI elements (buttons, draggable cards) should provide clear visual feedback upon interaction.

## Technical UI Constraints
- **Framework-Free:** Maintain the current approach of using modern ES6+ JavaScript and CSS without heavy external frameworks.
- **Iconography:** Use a consistent set of lightweight icons (e.g., for the settings cog or drag handles).

