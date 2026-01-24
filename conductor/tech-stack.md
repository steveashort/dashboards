
# Technology Stack: Team Tracker

## Frontend
- **Language:** Modern JavaScript (ES6+).
- **Structure:** Modular ES6 module-based architecture for clean code organization (e.g., separating "app.js", "charts.js", and data handling).
- **Library:** Vanilla JavaScript for application logic and DOM manipulation to keep the app lightweight and dependency-free (aside from specialized libraries).

## Visualizations & Charts
- **ApexCharts:** The primary library for rendering interactive and high-quality charts for weekly reporting, workload balancing, and metric tracking.
- **Custom SVG/HTML:** Supplementary visualizations using native SVG (e.g., the existing Gauges/Waffle charts) where appropriate for specific dashboard elements.

## Styling
- **CSS3:** Native CSS using CSS Variables (Custom Properties) for consistent theming and easy theme switching.
- **Layout:** Flexbox and CSS Grid for modern, responsive card-based layouts optimized for 1440x900 screens.

## Data & State
- **State Management:** A centralized JavaScript "State" object to manage app data and UI configuration.
- **Persistence:**
    - "localStorage": For persisting user settings, theme preferences, and dashboard layouts between sessions.
    - "JSON": Support for importing and exporting the entire app state as JSON files for data portability and backups.

