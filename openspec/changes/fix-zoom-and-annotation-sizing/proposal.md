## Why

The initial zoom-to-fit algorithm produces disproportionately small diagrams for tall flowcharts, and annotation sticky notes render at a fixed font size that doesn't match the diagram text. Users must manually zoom to 250% to make diagrams readable, defeating the purpose of auto-fit.

## What Changes

- **Zoom baseline redefinition**: 100% zoom now means "diagram fills the available space optimally" instead of "SVG native size". A new `fitScale` multiplier is computed at render time and combined with the user-facing `zoomScale`.
- **Fit strategy**: Use the maximum of width/height scale factors instead of the minimum, so diagrams fill the better-fitting dimension and overflow the other (scrollable).
- **Measurement fix**: Use `getBoundingClientRect()` (actual screen pixels) instead of `getBBox()` (SVG coordinate space) to measure diagram dimensions for zoom calculation, with a temporary transform reset to avoid measurement contamination.
- **Annotation font sync**: Sticky note annotations dynamically inherit their font size from the rendered Mermaid SVG text, ensuring proportional rendering regardless of diagram size or theme.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `diagram-zoom-pan`: Zoom scale baseline redefined (100% = fit-to-screen). Fit strategy changed from min-scale to max-scale. Measurement uses screen-space dimensions instead of SVG coordinate space.
- `diagram-annotations`: Sticky note font size is now synced from the Mermaid SVG's computed text size instead of a fixed `12px`.

## Impact

- `src/renderer/app.js`: `zoomToFit()`, `applyZoom()`, `resetZoom()`, annotation drag handler, new `syncAnnotationFontSize()` function, new `fitScale` variable
- `src/renderer/styles.css`: `.sticky-note` font-size changed to CSS custom property
