## 1. Project Setup

- [x] 1.1 Initialize npm project with `package.json` (name: `vizflow`, entry: `src/main.js`)
- [x] 1.2 Install dependencies: `mermaid`, `monaco-editor`, `js-yaml`
- [x] 1.3 Install dev dependencies: `electron`, `electron-builder`
- [x] 1.4 Create directory structure: `src/main/`, `src/renderer/`, `src/renderer/components/`, `src/shared/`
- [x] 1.5 Create default template file at `src/shared/default.mmd` with sample Mermaid diagram + `%%#` annotations

## 2. Entry Point and Window

- [x] 2.1 Create `src/main/main.js` — Electron app entry point
- [x] 2.2 Implement `createWindow(filePath)` — creates BrowserWindow (1400x900), loads `src/renderer/index.html`
- [x] 2.3 Parse CLI argument (`process.argv`) to get `.mmd` file path; create file with default template if it doesn't exist
- [x] 2.4 Pass `filePath` to the renderer via query string or IPC during initialization
- [x] 2.5 Handle `app.on('window-all-closed')` and `app.on('activate')` for cross-platform behavior

## 3. Main Process — IPC Handlers

- [x] 3.1 Create `src/main/ipc-handlers.js` — registers all `ipcMain.handle()` handlers
- [x] 3.2 Implement `file:save` handler — receives content, writes to `.mmd` file via `fs.writeFileSync`, sets `selfSaving = true` flag
- [x] 3.3 Implement `file:read` handler — reads `.mmd` file via `fs.readFileSync`, returns content string
- [x] 3.4 Implement `export:svg` handler — receives `{ svgContent, defaultName }`, shows native save dialog via `dialog.showSaveDialog()`, writes file
- [x] 3.5 Implement `export:png` handler — receives `{ dataUrl, defaultName }`, shows native save dialog, converts base64 to Buffer, writes file

## 4. Main Process — File Watcher

- [x] 4.1 Create `src/main/file-watcher.js` — sets up `fs.watch()` on the `.mmd` file path
- [x] 4.2 On `change` event: skip if `selfSaving` flag is true (reset flag to false); otherwise read file and send to renderer
- [x] 4.3 Send external changes to renderer via `mainWindow.webContents.send('file:external-change', content)`
- [x] 4.4 Handle `rename` events (file deleted/recreated) — re-attach watcher to new path if needed
- [x] 4.5 Start watcher after window is created; close watcher via `fs.unwatchFile()` on app quit

## 5. Renderer — HTML Shell

- [x] 5.1 Create `src/renderer/index.html` — basic HTML with `<div id="app">` mounting point
- [x] 5.2 Add CSS variables for dark/light theme colors in a `<style>` block
- [x] 5.3 Load `src/renderer/app.js` via `<script>` tag
- [x] 5.4 Create `src/renderer/styles.css` — layout styles (split panes, toolbar, preview container)

## 6. Renderer — App Initialization

- [x] 6.1 Create `src/renderer/app.js` — main entry for the renderer process
- [x] 6.2 On load: call `ipcRenderer.invoke('file:read')` to get initial file content
- [x] 6.3 Parse initial content via shared parser to extract frontmatter, mermaid code, and annotations
- [x] 6.4 Initialize Monaco Editor with the full raw content
- [x] 6.5 Initialize Mermaid.js with theme from frontmatter or default dark
- [x] 6.6 Perform initial render of the diagram
- [x] 6.7 Set up `ipcRenderer.on('file:external-change', ...)` listener to handle LLM edits

## 7. Renderer — Monaco Editor

- [x] 7.1 Create `src/renderer/editor.js` — Monaco Editor setup and event binding
- [x] 7.2 Configure Monaco with `vs-dark` / `vs` theme, monospace font, word wrap, line numbers, minimap
- [x] 7.3 Register Mermaid language in Monaco (or use plaintext with custom tokenizer for keywords like `graph`, `sequenceDiagram`, `-->`, etc.)
- [x] 7.4 Bind `onDidChangeModelContent` → call `renderDiagram()` instantly, start debounce timer for save
- [x] 7.5 Implement debounce (500ms): on timer expiry, call `ipcRenderer.invoke('file:save', editor.getValue())`
- [x] 7.6 Implement `setEditorContent(content)` — updates Monaco model value programmatically (for LLM edits)
- [x] 7.7 On external content update, attempt to restore cursor position if possible

## 8. Renderer — Mermaid Renderer

- [x] 8.1 Create `src/renderer/renderer.js` — Mermaid.js rendering logic
- [x] 8.2 Implement `renderDiagram(rawContent)` — strips `%%` comment lines, calls `mermaid.render('mermaid-svg', cleanMermaid)`
- [x] 8.3 Inject the rendered SVG into `<div id="mermaid-preview">`
- [x] 8.4 Handle Mermaid parse errors — catch exceptions, display error message in preview pane with red styling
- [x] 8.5 Support theme switching — re-initialize Mermaid with new theme and re-render on toggle

## 9. Shared — Parser

- [x] 9.1 Create `src/shared/parser.js` — `parseMmd(content)` returns `{ frontmatter, mermaidCode, annotations }`
- [x] 9.2 Parse YAML frontmatter using `js-yaml` — extract `---` delimited block, return parsed object
- [x] 9.3 Extract `%%#` lines as annotations array — strip `%%#` prefix, trim whitespace
- [x] 9.4 Extract `%%@` lines placeholder (parse but don't render yet — v2)
- [x] 9.5 Return remaining content as `mermaidCode` (all `%%` lines stripped)
- [x] 9.6 Handle edge cases: no frontmatter, no annotations, empty file

## 10. Renderer — Sticky Notes Overlay

- [x] 10.1 Create `src/renderer/annotations.js` — annotation overlay rendering
- [x] 10.2 Create `<div id="annotations-overlay">` positioned absolutely over the preview container
- [x] 10.3 Implement `renderAnnotations(annotations)` — for each `%%#` note, create a `<div class="sticky-note">`
- [x] 10.4 Position sticky notes in a cascading layout (top-left with incremental offsets to avoid overlap)
- [x] 10.5 Style sticky notes: no border, semi-transparent background (varies by theme), small italic font, rounded corners, selectable text
- [x] 10.6 Re-render annotations on every content change (both user input and LLM updates)

## 11. Renderer — Export

- [x] 11.1 Implement SVG export flow: capture `#mermaid-preview` SVG + annotation overlay, serialize to string
- [x] 11.2 Merge annotations into the SVG markup before export so sticky notes appear in the saved file
- [x] 11.3 Call `ipcRenderer.invoke('export:svg', { svgContent, defaultName })` to trigger native save dialog
- [x] 11.4 Implement PNG export flow: render SVG to `<canvas>` at 2x resolution, convert to data URL
- [x] 11.5 Call `ipcRenderer.invoke('export:png', { dataUrl, defaultName })` to trigger native save dialog
- [x] 11.6 Wire Export SVG and Export PNG buttons in the toolbar to their respective export functions

## 12. Renderer — Theme Toggle

- [x] 12.1 Implement `setTheme(theme)` — updates CSS custom properties on `:root` for light/dark
- [x] 12.2 Update Monaco Editor theme (`vs` ↔ `vs-dark`) when toggling
- [x] 12.3 Re-initialize Mermaid.js with new theme and re-render diagram
- [x] 12.4 Update sticky note colors to match theme
- [x] 12.5 Theme toggle button in toolbar — cycles between dark and light
- [x] 12.6 Read initial theme from YAML frontmatter `theme` field on file load
- [x] 12.7 Write theme preference back to frontmatter when user toggles

## 13. CLI and Package Scripts

- [x] 13.1 Add `"main": "src/main/main.js"` to `package.json`
- [x] 13.2 Add `"scripts": { "start": "electron .", "dist": "electron-builder" }` to `package.json`
- [x] 13.3 Add `"bin": { "vizflow": "./bin/cli.js" }` for CLI usage
- [x] 13.4 Test `npm start -- architecture.mmd` works with file argument
- [x] 13.5 Configure `electron-builder` in `package.json`: appId, productName, Windows/macOS/Linux targets

## 14. Build and Distribution

- [x] 14.1 Configure `electron-builder` for Windows (NSIS installer, portable)
- [x] 14.2 Configure `electron-builder` for macOS (DMG)
- [x] 14.3 Configure `electron-builder` for Linux (AppImage, deb)
- [x] 14.4 Add file association for `.mmd` extension in all platforms
- [x] 14.5 Test build output on at least one platform

## 15. Integration and Polish

- [x] 15.1 Wire all components together in `app.js`
- [x] 15.2 Verify full flow: user types → instant render → debounce save → file written
- [x] 15.3 Verify full flow: LLM edits file → watcher detects → IPC to renderer → editor + preview update
- [x] 15.4 Verify save-loop prevention: app's own saves don't re-trigger watcher → renderer cycle
- [x] 15.5 Clean shutdown: close watcher on window close, handle `app.on('before-quit')`
- [x] 15.6 Test with a complex Mermaid diagram (20+ nodes, subgraphs, styling, classDef) to verify performance
- [x] 15.7 Test cross-platform: verify the app launches and renders on Windows (primary target)
