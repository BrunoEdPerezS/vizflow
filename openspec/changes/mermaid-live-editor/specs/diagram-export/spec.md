## ADDED Requirements

### Requirement: Export rendered diagram to SVG
The system SHALL provide a button to export the currently rendered Mermaid diagram as an SVG file via Electron's native save dialog. The exported SVG SHALL include the diagram elements and any visible sticky notes rendered at that moment.

#### Scenario: User clicks Export SVG
- **WHEN** user clicks the "Export SVG" button
- **THEN** a native save dialog opens pre-filled with `<basename>.svg`, and upon confirmation the SVG file is written to the chosen path

#### Scenario: Export with annotations visible
- **WHEN** the diagram has sticky notes currently displayed in the preview
- **THEN** the exported SVG includes those sticky notes as part of the image

### Requirement: Export rendered diagram to PNG
The system SHALL provide a button to export the currently rendered Mermaid diagram as a PNG file via Electron's native save dialog. The PNG export SHALL capture the diagram at 2x the preview resolution.

#### Scenario: User clicks Export PNG
- **WHEN** user clicks the "Export PNG" button
- **THEN** a native save dialog opens pre-filled with `<basename>.png`, and upon confirmation a PNG file is written at 2x resolution

#### Scenario: PNG export preserves visual quality
- **WHEN** the diagram is exported to PNG
- **THEN** the resulting image is at least 2x the preview resolution to ensure sharp rendering on high-DPI displays

### Requirement: Export buttons in toolbar
The system SHALL display Export SVG and Export PNG buttons in the preview panel toolbar, accessible without navigating menus.

#### Scenario: Toolbar visibility
- **WHEN** the application is open with a diagram displayed
- **THEN** both "Export SVG" and "Export PNG" buttons are visible in the preview panel's toolbar area
