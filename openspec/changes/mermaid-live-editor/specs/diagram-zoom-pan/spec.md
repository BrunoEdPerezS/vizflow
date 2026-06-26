## ADDED Requirements

### Requirement: CSS transform-based zoom and pan
The system SHALL apply zoom and pan to the rendered diagram using CSS `transform: translate(X,Y) scale(S)` on a wrapper element (`#preview-stage`) containing the Mermaid SVG and the annotation overlay. This ensures both the diagram and sticky notes move and scale together.

#### Scenario: Zoom in on diagram center
- **WHEN** user clicks the Zoom In button or presses Ctrl+MouseWheelUp
- **THEN** the diagram scales up by a factor of 1.2x centered on the preview container center, and the zoom percentage label updates

#### Scenario: Zoom out on diagram center
- **WHEN** user clicks the Zoom Out button or presses Ctrl+MouseWheelDown
- **THEN** the diagram scales down by a factor of 0.85x centered on the preview container center, clamped to a minimum of 10%

#### Scenario: Zoom centered on cursor position with Ctrl+wheel
- **WHEN** user holds Ctrl and scrolls the mouse wheel over the preview
- **THEN** the diagram scales up or down keeping the point under the cursor stationary, so the user zooms into exactly where they are looking

#### Scenario: Maximum zoom cap
- **WHEN** zoom scale reaches 500%
- **THEN** further zoom-in actions are ignored

#### Scenario: Minimum zoom cap
- **WHEN** zoom scale reaches 10%
- **THEN** further zoom-out actions are ignored

### Requirement: Mouse drag panning
The system SHALL allow the user to pan the diagram by clicking and dragging with the mouse over the preview area.

#### Scenario: User drags to pan
- **WHEN** user presses mouse button on the preview stage, moves the mouse, then releases
- **THEN** the diagram translates in the direction of the drag, and the cursor shows `grabbing` during the drag

#### Scenario: Cursor changes during pan
- **WHEN** the mouse hovers over the preview stage without pressing
- **THEN** the cursor displays as `grab`
- **WHEN** the mouse button is held down on the preview stage
- **THEN** the cursor displays as `grabbing`

### Requirement: Fit-to-screen reset
The system SHALL provide a button to reset the diagram view to fit the entire SVG within the preview pane with a small padding margin.

#### Scenario: User clicks Fit to Screen
- **WHEN** user clicks the Fit to Screen button (⊡)
- **THEN** the diagram scales to fill the preview pane while keeping 20px padding on each side, centered in the available space, capped at 100% scale so the diagram never appears larger than native size

#### Scenario: Auto-fit on new diagram render
- **WHEN** a new diagram is rendered (user types or LLM updates the file)
- **THEN** the zoom and pan state resets to fit-to-screen so the new diagram is fully visible

### Requirement: Zoom controls UI
The system SHALL display zoom control buttons (Zoom In, Zoom Out, Fit to Screen) and a percentage label in a vertical stack, positioned at the bottom-right corner of the preview pane. These controls SHALL be visually unobtrusive with a semi-transparent background.

#### Scenario: Zoom controls visibility
- **WHEN** the application is open with a diagram displayed
- **THEN** zoom controls (+ button, percentage label, - button, fit button) are visible in the bottom-right of the preview pane

#### Scenario: Percentage label updates
- **WHEN** zoom scale changes to 150%
- **THEN** the label displays "150%"

### Requirement: Zoom and annotations move together
The system SHALL apply the same CSS transform to both the Mermaid SVG and the sticky note annotations since they are children of the same transform stage wrapper.

#### Scenario: Annotations follow zoom and pan
- **WHEN** user zooms in and pans to a different region of the diagram
- **THEN** sticky notes (`%%#` annotations) move and scale proportionally with the diagram
