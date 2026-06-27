## MODIFIED Requirements

### Requirement: Sticky note visual style
Sticky notes SHALL be rendered as borderless, semi-transparent text boxes overlaid on the SVG diagram. They SHALL be visually distinct from diagram elements (nodes, edges). The font size of sticky notes SHALL match the computed font size of text elements in the rendered Mermaid SVG, ensuring proportional rendering regardless of diagram size, theme, or zoom level.

The system SHALL read the computed `font-size` from a `<text>` element inside the Mermaid-rendered SVG after each render and apply it as a CSS custom property (`--annotation-font-size`) on the annotations overlay container. Sticky notes SHALL use `font-size: var(--annotation-font-size, 12px)` to inherit this value, with a 12px fallback for the initial paint before synchronization completes.

#### Scenario: Sticky note appearance
- **WHEN** a `%%#` annotation is rendered
- **THEN** it appears as a text box with subtle background (e.g., pale yellow in light theme, dark amber in dark theme), no visible border, and font size matching the diagram's text size

#### Scenario: Annotation font matches diagram text
- **WHEN** the Mermaid SVG renders with text at 14px computed font size
- **THEN** all sticky note annotations render at 14px font size

#### Scenario: Annotation font updates on re-render
- **WHEN** the diagram is re-rendered (theme change, content change)
- **THEN** the annotation font size is re-synchronized from the new SVG text size

#### Scenario: Fallback when SVG has no text elements
- **WHEN** the rendered SVG contains no `<text>` elements (e.g., empty diagram or diagram with only shapes)
- **THEN** sticky notes render at the default 12px fallback font size

## ADDED Requirements

### Requirement: Annotation font synchronization
The system SHALL synchronize the sticky note font size with the rendered Mermaid SVG text size after each diagram render. The synchronization SHALL occur in the same requestAnimationFrame callback as the zoom-to-fit calculation to avoid layout thrashing.

#### Scenario: Font sync on initial render
- **WHEN** a diagram is rendered for the first time
- **THEN** after the SVG is injected into the DOM and before the next paint, the system reads the computed font-size from a text element and stores it as a CSS custom property on the annotations overlay

#### Scenario: Annotation drag respects combined zoom
- **WHEN** the user drags a sticky note annotation while the diagram is at a non-default zoom level
- **THEN** the drag delta SHALL be divided by the effective zoom scale (`zoomScale * fitScale`) so the annotation tracks the cursor accurately
