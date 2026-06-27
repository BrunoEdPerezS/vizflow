## ADDED Requirements

### Requirement: Draggable divider between editor and preview panes
The system SHALL display a vertical divider between the editor pane and the preview pane. The user SHALL be able to click and drag this divider horizontally to resize the two panes. The cursor SHALL change to `col-resize` when hovering over the divider.

#### Scenario: Drag divider to resize panes
- **WHEN** user clicks and drags the divider to the right by 100px
- **THEN** the editor pane width increases by approximately 100px
- **AND** the preview pane width decreases by approximately 100px
- **AND** Monaco Editor re-layouts to fill the new editor pane width

#### Scenario: Divider hover cursor
- **WHEN** the mouse hovers over the divider
- **THEN** the cursor displays as `col-resize`

#### Scenario: Minimum pane width enforcement
- **WHEN** the user drags the divider past the minimum pane width (200px)
- **THEN** the pane stops shrinking at 200px and the divider cannot be dragged further

#### Scenario: Divider visual style
- **WHEN** the app is open
- **THEN** the divider is visible as a thin vertical bar (4px) with `border-color` background
- **AND** the divider background changes to `accent-color` on hover

### Requirement: Resize persists proportionally on window resize
When the user resizes the Vizflow window, the pane proportions set by the divider drag SHALL be maintained relative to the new window width.

#### Scenario: Window resize maintains pane proportions
- **WHEN** the editor pane is set to 60% width via divider drag
- **AND** the user resizes the window to be wider
- **THEN** the editor pane remains at approximately 60% of the new window width
