## Context

Vizflow's zoom system applies a CSS `transform: translate(X,Y) scale(S)` to `#preview-stage`, which contains both the Mermaid-rendered SVG and the annotation overlay. The current fit-to-screen algorithm (`zoomToFit()`) computes a single scale factor `S` based on `svg.getBBox()` dimensions and the container viewport, then caps it at 1.0 (100% = SVG native size).

Two problems exist:
1. **Tall diagrams render tiny**: `getBBox()` returns SVG coordinate-space dimensions (viewBox values). For a tall flowchart (e.g., 800x2400 viewBox in a 960x1040 container), the height scale factor is ~0.33, and `Math.min()` picks this, resulting in 33% zoom. The diagram uses ~30% of the available space.
2. **Fixed annotation font size**: Sticky notes use `font-size: 12px` regardless of the Mermaid SVG's text size. When the SVG renders at a small physical size (due to `max-width: 100%` on narrow-intrinsic SVGs), Mermaid text appears at e.g. 8px physical while sticky notes remain at 12px, looking disproportionately large.

## Goals / Non-Goals

**Goals:**
- On initial render, the diagram SHALL fill the available preview space as much as possible (best-fit in one dimension)
- The zoom label SHALL read 100% when the diagram is at its initial fit-to-screen position
- Sticky note annotations SHALL have the same apparent font size as the diagram text they accompany
- Annotation dragging SHALL remain accurate at all zoom levels

**Non-Goals:**
- No changes to Mermaid rendering itself (font sizes, layout)
- No changes to the zoom controls UI layout or appearance
- No changes to the panning mechanism

## Decisions

### Decision 1: Two-scale architecture (`fitScale` × `zoomScale`)

**Chosen**: Introduce a `fitScale` multiplier computed once per diagram render. The effective CSS scale is `zoomScale * fitScale`. `zoomScale` is the user-facing value (starts at 1 = 100%). `fitScale` is the ratio needed to make the diagram fill the container in the best-fitting dimension.

**Alternatives considered**:
- *Keep single scale, remove cap*: Would work for most cases but the zoom label would show e.g. "117%" for fit-to-screen, which is unintuitive. Users expect 100% to mean "fits the screen."
- *Resize the SVG element via CSS to fill width*: `#mermaid-preview svg { width: 100% !important }` would make the SVG fill the container width, and 100% zoom would look right. However, this distorts the diagram's intrinsic aspect ratio and interacts poorly with Mermaid's own `max-width: 100%`. Also doesn't solve the mismatch between SVG coordinate space and screen space for measurement.

### Decision 2: Max-scale fit instead of min-scale

**Chosen**: `fitScale = Math.max(sx, sy)` where `sx = (containerWidth - padding) / svgWidth`, `sy = (containerHeight - padding) / svgHeight`. The diagram fills the better-fitting dimension and overflows the other (pannable).

**Alternatives considered**:
- *Keep min-scale*: Ensures the entire diagram is visible without scrolling, but for tall diagrams (most flowcharts) this makes them ~30% of natural size. Unacceptable UX.
- *Use only width scale*: Simple and works for most flowcharts, but fails for wide diagrams (Gantt charts, horizontal sequences).

### Decision 3: `getBoundingClientRect()` with temporary transform removal for measurement

**Chosen**: Before measuring, temporarily clear the CSS transform on `#preview-stage`, call `svg.getBoundingClientRect()` to get actual screen-space dimensions, then restore and apply the new transform. All in one synchronous JS block (no paint between frames).

**Alternatives considered**:
- *`svg.getBBox()`*: Returns SVG coordinate-space values, not screen pixels. Mismatch when SVG renders at a physical size different from its viewBox.
- *`svg.getBoundingClientRect()` without clearing transform*: Contaminated by the current CSS transform (if zoom was previously applied).

### Decision 4: CSS custom property for annotation font sync

**Chosen**: After Mermaid renders, read `getComputedStyle(svgTextElement).fontSize` and set it as `--annotation-font-size` on `#annotations-overlay`. `.sticky-note` uses `font-size: var(--annotation-font-size, 12px)`. Sync is triggered in the same `requestAnimationFrame` as `zoomToFit()`.

**Alternatives considered**:
- *Parse font size from Mermaid's inline `<style>` element*: Fragile, depends on Mermaid's internal CSS structure which varies by version and theme.
- *Hardcode to 14px*: Simplest but doesn't account for different Mermaid themes or custom configurations.

## Risks / Trade-offs

- **[Risk] Flash of unstyled annotations**: First paint might show annotations at 12px before the font sync executes. → **Mitigation**: Sync runs in `requestAnimationFrame` alongside `zoomToFit()`, which fires before the first paint after render. The 12px fallback in `var()` ensures reasonable defaults.
- **[Risk] `getBoundingClientRect()` returning 0**: If the SVG hasn't been laid out yet (race condition), width/height could be 0. → **Mitigation**: Fallback to `svg.viewBox.baseVal` and then to hardcoded 800x600.
- **[Trade-off] Diagrams may overflow one dimension**: Using max-scale means some diagrams won't be fully visible without panning. → **Acceptable**: Most users prefer readable text size over seeing 100% of a zoomed-out diagram. Fit button is available to reset.
