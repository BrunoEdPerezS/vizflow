## 1. Clipboard: Edit menu (src/main/main.js)

- [x] 1.1 Add "Editar" menu to `buildMenu()` template with items: Deshacer (Ctrl+Z, role: undo), Rehacer (Ctrl+Y, role: redo), separator, Cortar (Ctrl+X, role: cut), Copiar (Ctrl+C, role: copy), Pegar (Ctrl+V, role: paste), separator, Seleccionar todo (Ctrl+A, role: selectAll)
- [x] 1.2 Insert "Editar" menu between "Archivo" and any future menus in the template array

## 2. Resizable panes: HTML divider (src/renderer/index.html)

- [x] 2.1 Add `<div id="pane-divider">` between `#editor-pane` and `#preview-pane` inside `#main-content`

## 3. Resizable panes: CSS (src/renderer/styles.css)

- [x] 3.1 Add `#pane-divider` styles: width 4px, cursor col-resize, flex-shrink 0, background var(--border-color), hover accent-color
- [x] 3.2 Remove `border-left: 1px solid var(--border-color)` from `#preview-pane` (divider replaces it)

## 4. Resizable panes: JS drag logic (src/renderer/app.js)

- [x] 4.1 Add `setupPaneResize()` function with mousedown/mousemove/mouseup handlers on `#pane-divider`
- [x] 4.2 On mousedown: save startX and startEditorWidth, set body cursor to col-resize
- [x] 4.3 On mousemove: compute new editor width in px, clamp between 200px and (totalWidth - 204px), convert to percentage, set `flex: 0 0 X%` on both panes
- [x] 4.4 Call `editor.layout()` on each mousemove so Monaco re-renders to new width
- [x] 4.5 On mouseup: reset cursor and user-select
- [x] 4.6 Call `setupPaneResize()` in `start()` after editor is initialized

## 5. Verification

- [x] 5.1 Verify Ctrl+C copies selected text from Monaco to system clipboard
- [x] 5.2 Verify Ctrl+V pastes text from system clipboard into Monaco
- [x] 5.3 Verify Ctrl+X cuts selected text
- [x] 5.4 Verify Ctrl+A selects all text
- [x] 5.5 Verify divider is draggable and panes resize proportionally
- [x] 5.6 Verify minimum pane width (200px) is enforced on both sides
- [x] 5.7 Verify Monaco editor relayouts correctly after resize
