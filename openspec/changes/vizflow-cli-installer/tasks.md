## 1. Rename: package.json identity

- [x] 1.1 Change `"name": "mermaid-live"` to `"name": "vizflow"` in package.json
- [x] 1.2 Change `"bin": { "mermaid-live": ... }` to `"bin": { "vizflow": "./bin/cli.js" }` in package.json
- [x] 1.3 Change `"appId": "ai.vizflow.mermaid-live"` to `"appId": "ai.vizflow.vizflow"` in build config
- [x] 1.4 Change `"productName": "Mermaid Live"` to `"productName": "Vizflow"` in build config

## 2. Rename: main process (Electron)

- [x] 2.1 Change `title: 'Mermaid Live'` to `title: 'Vizflow'` in src/main/main.js
- [x] 2.2 Change `'mermaid-live <file.mmd>'` to `'vizflow <file.mmd>'` in error dialog message in src/main/main.js
- [x] 2.3 Verify window title logic sets suffix correctly (line 36)

## 3. Rename: renderer (HTML)

- [x] 3.1 Change `<title>Mermaid Live</title>` to `<title>Vizflow</title>` in src/renderer/index.html

## 4. Rename: documentation

- [x] 4.1 Update README.md: change title from "Mermaid Live Editor" to "Vizflow"
- [x] 4.2 Update README.md: change all `mermaid-live` references to `vizflow`
- [x] 4.3 Update README.md: add installation instructions per platform (Windows NSIS, Linux .deb/AppImage, macOS .dmg symlink)

## 5. Rename: openspec historical documents

- [x] 5.1 Update openspec/changes/mermaid-live-editor/proposal.md: change `mermaid-live` to `vizflow` references
- [x] 5.2 Update openspec/changes/mermaid-live-editor/design.md: update appId and productName references
- [x] 5.3 Update openspec/changes/mermaid-live-editor/tasks.md: update bin command reference
- [x] 5.4 Update openspec/changes/mermaid-live-editor/specs/app-cli/spec.md: command name references

## 6. CLI wrapper for development (npm link)

- [x] 6.1 Create bin/cli.js: Node.js script that spawns electron with app path and file argument
- [x] 6.2 CLI wrapper resolves relative paths to absolute before passing to electron
- [x] 6.3 CLI wrapper shows usage message when no file argument provided
- [x] 6.4 CLI wrapper handles file-not-found by letting main.js create it (don't duplicate logic)
- [x] 6.5 Run `npm link` locally and verify `vizflow test-diagram.mmd` works from another directory

## 7. NSIS installer with PATH (Windows)

- [x] 7.1 Create build/installer.nsh with customInstall macro that adds $INSTDIR to user PATH
- [x] 7.2 Create customUninstall macro that removes $INSTDIR from user PATH
- [x] 7.3 Add `"nsis"` config block to package.json build section with `"oneClick": false`, `"perMachine": false`, `"include": "build/installer.nsh"`
- [x] 7.4 Run `npm run dist` to generate NSIS installer
- [x] 7.5 Install from generated .exe, restart PowerShell, verify `vizflow test.mmd` from another directory
- [x] 7.6 Verify uninstall removes PATH entry (check HKCU\Environment\Path)

## 8. Linux .deb verification

- [x] 8.1 Verify `"name": "vizflow"` in package.json produces `/usr/bin/vizflow` in .deb package
- [x] 8.2 Document in README: `sudo dpkg -i vizflow_1.0.0_amd64.deb` install command

## 9. macOS .dmg documentation

- [x] 9.1 Document symlink creation in README: `sudo ln -s /Applications/Vizflow.app/Contents/MacOS/Vizflow /usr/local/bin/vizflow`

## 10. Final verification

- [x] 10.1 `vizflow nuevo.mmd` from random directory opens editor and creates file
- [x] 10.2 `vizflow existing.mmd` opens existing file correctly
- [x] 10.3 `vizflow` (no args) shows error dialog with correct command name
- [x] 10.4 Window title shows "Vizflow" (no "Mermaid Live")
- [x] 10.5 HTML page title is "Vizflow"
