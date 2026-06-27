## 1. Zoom system refactor (app.js)

- [x] 1.1 Add `var fitScale = 1;` global variable alongside existing zoom state variables
- [x] 1.2 Modify `applyZoom()`: use effective scale `zoomScale * fitScale` for CSS transform; label still shows `zoomScale * 100%`
- [x] 1.3 Rewrite `zoomToFit()`: temporarily clear stage transform, measure SVG via `getBoundingClientRect()`, compute `fitScale = Math.max(sx, sy)`, set `zoomScale = 1`, compute translation offsets with `fitScale * zoomScale`
- [x] 1.4 Add fallback to `svg.viewBox.baseVal` when `getBoundingClientRect()` returns 0x0
- [x] 1.5 Modify `resetZoom()`: set only `zoomScale = 1` (do not touch `fitScale`)
- [x] 1.6 Update annotation drag handler to divide by `zoomScale * fitScale` instead of just `zoomScale`

## 2. Annotation font synchronization

- [x] 2.1 Add `syncAnnotationFontSize()` function to app.js: read computed font-size from first `<text>` element in SVG, scale by viewBox-to-layout ratio, set `--annotation-font-size` CSS property on `#annotations-overlay`
- [x] 2.2 Call `syncAnnotationFontSize()` in the `requestAnimationFrame` callback in `renderDiagram()`
- [x] 2.3 Call `syncAnnotationFontSize()` after `renderAnnotations()` in annotation drag-up handler

## 3. CSS update (styles.css)

- [x] 3.1 Change `.sticky-note` font-size from `12px` to `var(--annotation-font-size, 12px)`

## 4. Zoom persistence across re-renders

- [x] 4.1 Add optional `onAfterRender` callback parameter to `renderDiagram()`
- [x] 4.2 Pass `zoomToFit` as callback only from `init()` (initial load forces fit)
- [x] 4.3 Omit callback from `handleContentChange()`, external change listener, and theme toggle (zoom preserved)

## 5. Verification

- [x] 5.1 Open `login-flow.mmd` in Vizflow and verify zoom label shows 100% with diagram filling available space
- [x] 5.2 Verify zoom in/out controls work relative to the 100% baseline
- [x] 5.3 Verify Fit to Screen button returns to 100% zoom
- [x] 5.4 Verify annotation font size matches diagram text size
- [x] 5.5 Verify annotation dragging remains accurate after zooming
- [x] 5.6 Verify zoom does NOT reset on file edits, theme toggle, or external changes
