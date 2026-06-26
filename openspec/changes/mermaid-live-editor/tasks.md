## 1. Project Setup

- [ ] 1.1 Initialize npm project with `package.json` (name: `mermaid-live`, entry: `src/main.js`)
- [ ] 1.2 Install dependencies: `mermaid`, `monaco-editor`, `js-yaml`
- [ ] 1.3 Install dev dependencies: `electron`, `electron-builder`
- [ ] 1.4 Create directory structure: `src/main/`, `src/renderer/`, `src/renderer/components/`, `src/shared/`
- [ ] 1.5 Create default template file at `src/shared/default.mmd` with sample Mermaid diagram + `%%#` annotations

## 2. Entry Point and Window

- [ ] 2.1 Create `src/main/main.js` — Electron app entry point
- [ ] 2.2 Implement `createWindow(filePath)` — creates BrowserWindow (1400x900), loads `src/renderer/index.html`
- [ ] 2.3 Parse CLI argument (`process.argv`) to get `.mmd` file path; create file with default template if it doesn't exist
- [ ] 2.4 Pass `filePath` to the renderer via query string or IPC during initialization
- [ ] 2.5 Handle `app.on('window-all-closed')` and `app.on('activate')` for cross-platform behavior

## 3. Main Process — IPC Handlers

- [ ] 3.1 Create `src/main/ipc-handlers.js` — registers all `ipcMain.handle()` handlers
- [ ] 3.2 Implement `file:save` handler — receives content, writes to `.mmd` file via `fs.writeFileSync`, sets `selfSaving = true` flag
- [ ] 3.3 Implement `file:read` handler — reads `.mmd` file via `fs.readFileSync`, returns content string
- [ ] 3.4 Implement `export:svg` handler — receives `{ svgContent, defaultName }`, shows native save dialog via `dialog.showSaveDialog()`, writes file
- [ ] 3.5 Implement `export:png` handler — receives `{ dataUrl, defaultName }`, shows native save dialog, converts base64 to Buffer, writes file

## 4. Main Process — File Watcher

- [ ] 4.1 Create `src/main/file-watcher.js` — sets up `fs.watch()` on the `.mmd` file path
- [ ] 4.2 On `change` event: skip if `selfSaving` flag is true (reset flag to false); otherwise read file and send to renderer
- [ ] 4.3 Send external changes to renderer via `mainWindow.webContents.send('file:external-change', content)`
- [ ] 4.4 Handle `rename` events (file deleted/recreated) — re-attach watcher to new path if needed
- [ ] 4.5 Start watcher after window is created; close watcher via `fs.unwatchFile()` on app quit

## 5. Renderer — HTML Shell

- [ ] 5.1 Create `src/renderer/index.html` — basic HTML with `<div id="app">` mounting point
- [ ] 5.2 Add CSS variables for dark/light theme colors in a `<style>` block
- [ ] 5.3 Load `src/renderer/app.js` via `<script>` tag
- [ ] 5.4 Create `src/renderer/styles.css` — layout styles (split panes, toolbar, preview container)

## 6. Renderer — App Initialization

- [ ] 6.1 Create `src/renderer/app.js` — main entry for the renderer process
- [ ] 6.2 On load: call `ipcRenderer.invoke('file:read')` to get initial file content
- [ ] 6.3 Parse initial content via shared parser to extract frontmatter, mermaid code, and annotations
- [ ] 6.4 Initialize Monaco Editor with the full raw content
- [ ] 6.5 Initialize Mermaid.js with theme from frontmatter or default dark
- [ ] 6.6 Perform initial render of the diagram
- [ ] 6.7 Set up `ipcRenderer.on('file:external-change', ...)` listener to handle LLM edits

## 7. Renderer — Monaco Editor

- [ ] 7.1 Create `src/renderer/editor.js` — Monaco Editor setup and event binding
- [ ] 7.2 Configure Monaco with `vs-dark` / `vs` theme, monospace font, word wrap, line numbers, minimap
- [ ] 7.3 Register Mermaid language in Monaco (or use plaintext with custom tokenizer for keywords like `graph`, `sequenceDiagram`, `-->`, etc.)
- [ ] 7.4 Bind `onDidChangeModelContent` → call `renderDiagram()` instantly, start debounce timer for save
- [ ] 7.5 Implement debounce (500ms): on timer expiry, call `ipcRenderer.invoke('file:save', editor.getValue())`
- [ ] 7.6 Implement `setEditorContent(content)` — updates Monaco model value programmatically (for LLM edits)
- [ ] 7.7 On external content update, attempt to restore cursor position if possible

## 8. Renderer — Mermaid Renderer

- [ ] 8.1 Create `src/renderer/renderer.js` — Mermaid.js rendering logic
- [ ] 8.2 Implement `renderDiagram(rawContent)` — strips `%%` comment lines, calls `mermaid.render('mermaid-svg', cleanMermaid)`
- [ ] 8.3 Inject the rendered SVG into `<div id="mermaid-preview">`
- [ ] 8.4 Handle Mermaid parse errors — catch exceptions, display error message in preview pane with red styling
- [ ] 8.5 Support theme switching — re-initialize Mermaid with new theme and re-render on toggle

## 9. Shared — Parser

- [ ] 9.1 Create `src/shared/parser.js` — `parseMmd(content)` returns `{ frontmatter, mermaidCode, annotations }`
- [ ] 9.2 Parse YAML frontmatter using `js-yaml` — extract `---` delimited block, return parsed object
- [ ] 9.3 Extract `%%#` lines as annotations array — strip `%%#` prefix, trim whitespace
- [ ] 9.4 Extract `%%@` lines placeholder (parse but don't render yet — v2)
- [ ] 9.5 Return remaining content as `mermaidCode` (all `%%` lines stripped)
- [ ] 9.6 Handle edge cases: no frontmatter, no annotations, empty file

## 10. Renderer — Sticky Notes Overlay

- [ ] 10.1 Create `src/renderer/annotations.js` — annotation overlay rendering
- [ ] 10.2 Create `<div id="annotations-overlay">` positioned absolutely over the preview container
- [ ] 10.3 Implement `renderAnnotations(annotations)` — for each `%%#` note, create a `<div class="sticky-note">`
- [ ] 10.4 Position sticky notes in a cascading layout (top-left with incremental offsets to avoid overlap)
- [ ] 10.5 Style sticky notes: no border, semi-transparent background (varies by theme), small italic font, rounded corners, selectable text
- [ ] 10.6 Re-render annotations on every content change (both user input and LLM updates)

## 11. Renderer — Export

- [ ] 11.1 Implement SVG export flow: capture `#mermaid-preview` SVG + annotation overlay, serialize to string
- [ ] 11.2 Merge annotations into the SVG markup before export so sticky notes appear in the saved file
- [ ] 11.3 Call `ipcRenderer.invoke('export:svg', { svgContent, defaultName })` to trigger native save dialog
- [ ] 11.4 Implement PNG export flow: render SVG to `<canvas>` at 2x resolution, convert to data URL
- [ ] 11.5 Call `ipcRenderer.invoke('export:png', { dataUrl, defaultName })` to trigger native save dialog
- [ ] 11.6 Wire Export SVG and Export PNG buttons in the toolbar to their respective export functions

## 12. Renderer — Theme Toggle

- [ ] 12.1 Implement `setTheme(theme)` — updates CSS custom properties on `:root` for light/dark
- [ ] 12.2 Update Monaco Editor theme (`vs` ↔ `vs-dark`) when toggling
- [ ] 12.3 Re-initialize Mermaid.js with new theme and re-render diagram
- [ ] 12.4 Update sticky note colors to match theme
- [ ] 12.5 Theme toggle button in toolbar — cycles between dark and light
- [ ] 12.6 Read initial theme from YAML frontmatter `theme` field on file load
- [ ] 12.7 Write theme preference back to frontmatter when user toggles

## 13. CLI and Package Scripts

- [ ] 13.1 Add `"main": "src/main/main.js"` to `package.json`
- [ ] 13.2 Add `"scripts": { "start": "electron .", "dist": "electron-builder" }` to `package.json`
- [ ] 13.3 Add `"bin": { "mermaid-live": "./src/main/main.js" }` for CLI usage
- [ ] 13.4 Test `npm start -- architecture.mmd` works with file argument
- [ ] 13.5 Configure `electron-builder` in `package.json`: appId, productName, Windows/macOS/Linux targets

## 14. Build and Distribution

- [ ] 14.1 Configure `electron-builder` for Windows (NSIS installer, portable)
- [ ] 14.2 Configure `electron-builder` for macOS (DMG)
- [ ] 14.3 Configure `electron-builder` for Linux (AppImage, deb)
- [ ] 14.4 Add file association for `.mmd` extension in all platforms
- [ ] 14.5 Test build output on at least one platform

## 15. Integration and Polish

- [ ] 15.1 Wire all components together in `app.js`
- [ ] 15.2 Verify full flow: user types → instant render → debounce save → file written
- [ ] 15.3 Verify full flow: LLM edits file → watcher detects → IPC to renderer → editor + preview update
- [ ] 15.4 Verify save-loop prevention: app's own saves don't re-trigger watcher → renderer cycle
- [ ] 15.5 Clean shutdown: close watcher on window close, handle `app.on('before-quit')`
- [ ] 15.6 Test with a complex Mermaid diagram (20+ nodes, subgraphs, styling, classDef) to verify performance
- [ ] 15.7 Test cross-platform: verify the app launches and renders on Windows (primary target)
