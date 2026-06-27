## 1. Zoom system refactor (app.js)

- [ ] 1.1 Add `var fitScale = 1;` global variable alongside existing zoom state variables
- [ ] 1.2 Modify `applyZoom()`: use effective scale `zoomScale * fitScale` for CSS transform; label still shows `zoomScale * 100%`
- [ ] 1.3 Rewrite `zoomToFit()`: temporarily clear stage transform, measure SVG via `getBoundingClientRect()`, compute `fitScale = Math.max(sx, sy)`, set `zoomScale = 1`, compute translation offsets with `fitScale * zoomScale`
- [ ] 1.4 Add fallback to `svg.viewBox.baseVal` when `getBoundingClientRect()` returns 0x0
- [ ] 1.5 Modify `resetZoom()`: set only `zoomScale = 1` (do not touch `fitScale`)
- [ ] 1.6 Update annotation drag handler to divide by `zoomScale * fitScale` instead of just `zoomScale`

## 2. Annotation font synchronization

- [ ] 2.1 Add `syncAnnotationFontSize()` function to app.js: read computed font-size from first `<text>` element in SVG, set `--annotation-font-size` CSS property on `#annotations-overlay`
- [ ] 2.2 Call `syncAnnotationFontSize()` in the `requestAnimationFrame` callback after `zoomToFit()` in `renderDiagram()`
- [ ] 2.3 Call `syncAnnotationFontSize()` after `renderAnnotations()` in annotation drag-up handler

## 3. CSS update (styles.css)

- [ ] 3.1 Change `.sticky-note` font-size from `12px` to `var(--annotation-font-size, 12px)`

## 4. Verification

- [ ] 4.1 Open `login-flow.mmd` in Vizflow and verify zoom label shows 100% with diagram filling available space
- [ ] 4.2 Verify zoom in/out controls work relative to the 100% baseline
- [ ] 4.3 Verify Fit to Screen button returns to 100% zoom
- [ ] 4.4 Verify annotation font size matches diagram text size
- [ ] 4.5 Verify annotation dragging remains accurate after zooming
