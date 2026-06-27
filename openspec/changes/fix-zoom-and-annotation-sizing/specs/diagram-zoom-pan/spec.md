## MODIFIED Requirements

### Requirement: Fit-to-screen reset
The system SHALL provide a Fit to Screen button and automatic fit-on-render behavior. The fit calculation SHALL use the maximum of width and height scale factors so the diagram fills the better-fitting dimension and overflows the other (pannable). The zoom percentage label SHALL display 100% when the diagram is at its fit-to-screen position. The system SHALL maintain an internal `fitScale` multiplier separate from the user-facing `zoomScale`, where the effective CSS transform scale is `zoomScale * fitScale`.

The system SHALL measure the diagram's actual rendered dimensions using `getBoundingClientRect()` on the SVG element after temporarily clearing any CSS transform on the preview stage, with a fallback to `viewBox.baseVal` if `getBoundingClientRect()` returns zero.

#### Scenario: User clicks Fit to Screen
- **WHEN** user clicks the Fit to Screen button
- **THEN** the diagram scales to fill the preview pane in the best-fitting dimension (width or height, whichever makes the diagram larger), the zoom label displays "100%", and the other dimension may overflow (scrollable)

#### Scenario: Auto-fit on new diagram render
- **WHEN** a new diagram is rendered (user types or LLM updates the file)
- **THEN** the zoom and pan state resets to fit-to-screen, the zoom label displays "100%", and the diagram fills the available preview space

#### Scenario: Tall diagram fits width
- **WHEN** a vertical flowchart diagram renders with height exceeding container height
- **THEN** the diagram scales to fill the container width at 100% zoom, and the user can pan vertically to see the full height

#### Scenario: Wide diagram fits height
- **WHEN** a horizontal diagram renders with width exceeding container width
- **THEN** the diagram scales to fill the container height at 100% zoom, and the user can pan horizontally to see the full width

#### Scenario: Fit scale measurement with getBoundingClientRect
- **WHEN** fit-to-screen is triggered
- **THEN** the system temporarily clears the preview stage CSS transform, measures the SVG's actual screen-space dimensions via getBoundingClientRect, computes fitScale = max(containerW / svgW, containerH / svgH), sets zoomScale = 1, and applies the combined transform

#### Scenario: Fallback to viewBox when getBoundingClientRect returns 0
- **WHEN** the SVG has not completed layout and getBoundingClientRect returns 0x0
- **THEN** the system falls back to svg.viewBox.baseVal.width/height to compute fitScale

### Requirement: Zoom label baseline
The zoom percentage label SHALL reflect the user-facing zoom level. 100% SHALL correspond to the fit-to-screen position. Values above 100% indicate the user has zoomed in beyond the initial fit; values below 100% indicate zoomed out.

#### Scenario: Zoom label at fit-to-screen
- **WHEN** the diagram is at its fit-to-screen position
- **THEN** the zoom label displays "100%"

#### Scenario: Zoom label after zooming in from fit
- **WHEN** the user clicks Zoom In twice from fit-to-screen (100%)
- **THEN** the zoom label displays "144%" (100% × 1.2 × 1.2 = 144%)

#### Scenario: Zoom label after zooming out from fit
- **WHEN** the user clicks Zoom Out twice from fit-to-screen (100%)
- **THEN** the zoom label displays "69%" (100% × 0.85 × 0.85 ≈ 69%)
