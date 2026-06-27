## 1. Main process: multi-file state (src/main/main.js)

- [x] 1.1 Change `let filePath = null` to `openFiles` Map and `activeFilePath` tracking
- [x] 1.2 Change CLI arg parsing to collect ALL `.mmd` args into an array
- [x] 1.3 Add `updateWindowTitle()` that sets title based on active file
- [x] 1.4 Refactor `openFileDialog()` and `addFileToOpen()` to create new tabs without replacing existing
- [x] 1.5 Add `closeFile()` function with watcher cleanup and tab removal notification
- [x] 1.6 Send `tabs:init` IPC with all tab data on initial load; `tab:open`, `tab:activate`, `tab:removed` for changes
- [x] 1.7 Update menu with "Cerrar pestaña" (Ctrl+W)

## 2. Main process: multi-watcher (src/main/file-watcher.js)

- [x] 2.1 Replace single watcher variable with `watchers` Map
- [x] 2.2 Add `addWatcher(filePath, ...)` function
- [x] 2.3 Add `removeWatcher(filePath)` function
- [x] 2.4 Rename `stopWatcher()` to `stopAllWatchers()` — closes all watchers
- [x] 2.5 Include `{ filePath, content }` in `webContents.send('file:external-change', ...)` payload

## 3. IPC handler updates (src/main/ipc-handlers.js)

- [x] 3.1 Update `file:read` to accept `{ filePath }` parameter
- [x] 3.2 Update `file:save` to accept `{ filePath, content }` parameter
- [x] 3.3 Update `get:filepaths` to return all paths and active file path
- [x] 3.4 Implement per-file `selfSaving` via closures passed from main.js

## 4. Renderer: Tab data structures (src/renderer/app.js)

- [x] 4.1 Define `Tab` constructor with: id, filePath, model, viewState, zoomScale/fitScale/zoomTx/Ty, saveTimeout, isExternalUpdate, parsed
- [x] 4.2 Define `TabManager` object with: tabs map, _activeId, addTab(), removeTab(), getActiveTab(), saveTabState(), switchTab(), restoreTabState()
- [x] 4.3 Initialize tabs from `tabs:init` IPC payload

## 5. Renderer: Monaco model swapping (src/renderer/app.js)

- [x] 5.1 `initEditor()` creates empty editor; models are created per-tab via `monaco.editor.createModel()`
- [x] 5.2 `TabManager.switchTab()` saves viewState on old model, calls `editor.setModel()`, restores viewState
- [x] 5.3 Content-change listener uses active tab's model and per-tab `saveTimeout`/`isExternalUpdate`
- [x] 5.4 `setEditorContent()` uses `editor.getModel().setValue()` on active model
- [x] 5.5 Models disposed on tab close via `tab.model.dispose()`

## 6. Renderer: zoom/pan per tab (src/renderer/app.js)

- [x] 6.1 Zoom state variables (`zoomScale`, `fitScale`, `zoomTx`, `zoomTy`) remain module-level but synced with active tab
- [x] 6.2 `TabManager.saveTabState()` stores current zoom into active tab before switch
- [x] 6.3 `TabManager.restoreTabState()` restores zoom from incoming tab
- [x] 6.4 `zoomToFit()` on initial render only; edits preserve zoom (no fit callback)

## 7. Renderer: preview and annotations per tab (src/renderer/app.js)

- [x] 7.1 On tab switch, renders diagram and annotations from incoming tab's parsed data
- [x] 7.2 `syncAnnotationFontSize()` called on each tab switch
- [x] 7.3 `handleContentChange()` updates active tab's parsed data and re-renders

## 8. Renderer: external change routing (src/renderer/app.js)

- [x] 8.1 `file:external-change` payload includes `{ filePath, content }`
- [x] 8.2 Route update to matching tab by `TabManager.tabs[filePath]`
- [x] 8.3 If matching tab is active, re-render preview; if inactive, just update model

## 9. Renderer: keyboard shortcuts (src/renderer/app.js)

- [x] 9.1 Alt+1 through Alt+9 to switch to Nth tab
- [x] 9.2 Ctrl+W to close active tab (when >1 tabs)
- [x] 9.3 Registered in `window.addEventListener('keydown', ...)` in `start()`

## 10. Tab bar UI (src/renderer/index.html + styles.css)

- [x] 10.1 Add `<div id="tab-bar">` between `#toolbar` and `#main-content`
- [x] 10.2 CSS for `.tab`, `.tab.active`, `.tab-label`, `.tab-close`, scrollbar styling
- [x] 10.3 Adjust `#main-content` height to `calc(100vh - 40px - 32px)`
- [x] 10.4 `renderTabBar()` builds tab DOM from TabManager state with click handlers and close buttons

## 11. Verification

- [ ] 11.1 Launch `vizflow file1.mmd file2.mmd` and verify both open in tabs, file1 active
- [ ] 11.2 Use Archivo > Abrir to open a third file; verify it appears as a new active tab
- [ ] 11.3 Click between tabs and verify editor content, preview, and zoom/pan state are preserved
- [ ] 11.4 Edit tab A, switch to tab B, switch back to A — verify undo history and cursor preserved
- [ ] 11.5 Press Alt+1, Alt+2 to switch tabs; press Ctrl+W to close a tab
- [ ] 11.6 Verify LLM external edits are routed to the correct tab
- [ ] 11.7 Verify window title updates on tab switch
