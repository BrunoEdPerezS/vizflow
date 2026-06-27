## 1. Main process: menu and dialog (src/main/main.js)

- [x] 1.1 Import `Menu` and `dialog` at top of main.js
- [x] 1.2 Add `updateWindowTitle()` function that sets `mainWindow.setTitle('Vizflow - ' + basename)`
- [x] 1.3 Add `openFileDialog()` async function that calls `dialog.showOpenDialog` filtered to `.mmd`
- [x] 1.4 Add `loadFile(newPath)` function: stops old watcher, updates `filePath`, calls `updateWindowTitle()`, restarts watcher, reads file, sends `file:open-result` IPC to renderer
- [x] 1.5 Add `buildMenu()` function with template: `Archivo > Abrir...` (Ctrl+O, calls openFileDialog then loadFile), separator, `Salir` (role: quit)
- [x] 1.6 In `app.whenReady()`, change no-arg behavior: instead of showing error and quitting, create `untitled.mmd` in `app.getPath('temp')` with default template
- [x] 1.7 Call `buildMenu()` and `Menu.setApplicationMenu()` after `createWindow()`

## 2. Renderer: file open handler (src/renderer/app.js)

- [x] 2.1 Move `ipcRenderer.on('file:external-change', ...)` registration outside of `init()` to avoid duplicate listeners
- [x] 2.2 Add `ipcRenderer.on('file:open-result', ...)` handler that updates `currentFileBasename`, updates `#file-name`, sets editor content, parses, checks theme, renders diagram with `zoomToFit`, and renders annotations
- [x] 2.3 Register both IPC listeners in `start()` before `init()` is called

## 3. Verification

- [ ] 3.1 Launch `vizflow` with no arguments and verify window opens with untitled.mmd template (no error dialog)
- [ ] 3.2 Open `login-flow.mmd` via CLI, then use `Archivo > Abrir...` to switch to another `.mmd` file
- [ ] 3.3 Verify window title updates after switching files
- [ ] 3.4 Verify Ctrl+O opens the file dialog
- [ ] 3.5 Verify file watcher tracks the newly opened file (external LLM edits are reflected)
- [ ] 3.6 Verify canceling the file dialog preserves current diagram state
