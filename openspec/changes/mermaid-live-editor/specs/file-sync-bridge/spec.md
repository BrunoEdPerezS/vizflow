## ADDED Requirements

### Requirement: Save editor content to file with debounce
The system SHALL save the editor content to the `.mmd` file on disk. The save SHALL be debounced so that it occurs 500ms after the user's last keystroke, not on every keystroke.

#### Scenario: User types continuously
- **WHEN** user types a sequence of characters without pausing
- **THEN** the file is written to disk only once, 500ms after the final keystroke

#### Scenario: User pauses between edits
- **WHEN** user types a character, pauses for 600ms, then types another character
- **THEN** the file is saved after the first pause, and again after the second pause

### Requirement: File watcher detects external changes via fs.watch()
The system SHALL monitor the `.mmd` file for changes using Node.js `fs.watch()` in the Electron main process. When the file is modified by an external process (the LLM), the system SHALL read the new content and push it to the renderer process via IPC.

#### Scenario: LLM edits the file
- **WHEN** the LLM modifies `archivo.mmd` using a file edit tool
- **THEN** `fs.watch()` in the main process detects the change, reads the new file content, and sends it to the renderer via `mainWindow.webContents.send('file:external-change', content)`

#### Scenario: File is deleted and recreated
- **WHEN** the `.mmd` file is deleted and recreated with new content
- **THEN** the watcher detects the recreation and pushes the new content to the renderer

#### Scenario: Save loop prevention
- **WHEN** the main process saves content to the file (from user's editor input)
- **THEN** `fs.watch()` does NOT trigger a push back to the renderer for that save event (using a `selfSaving` flag)

### Requirement: Bidirectional bridge via Electron IPC
The system SHALL use Electron's `ipcMain` / `ipcRenderer` for communication between the main process and the renderer process for all file I/O operations.

#### Scenario: Renderer requests file save via IPC
- **WHEN** the renderer calls `ipcRenderer.invoke('file:save', content)`
- **THEN** the main process receives the invocation, writes `content` to the `.mmd` file, and returns a success confirmation

#### Scenario: Main process notifies renderer of external file change via IPC
- **WHEN** `fs.watch()` detects an external change
- **THEN** the main process calls `mainWindow.webContents.send('file:external-change', content)` and the renderer updates Monaco Editor and re-renders the diagram

#### Scenario: Renderer requests initial file read via IPC
- **WHEN** the renderer initializes and calls `ipcRenderer.invoke('file:read')`
- **THEN** the main process reads the current `.mmd` file content and returns it to the renderer for initial display

### Requirement: IPC handlers for export dialogs
The system SHALL expose IPC handlers in the main process for showing native save dialogs and writing export files.

#### Scenario: Renderer requests SVG export
- **WHEN** the renderer calls `ipcRenderer.invoke('export:svg', { svgContent, defaultName })`
- **THEN** the main process shows a native save dialog, and upon confirmation writes the SVG file to the chosen path

#### Scenario: Renderer requests PNG export
- **WHEN** the renderer calls `ipcRenderer.invoke('export:png', { dataUrl, defaultName })`
- **THEN** the main process shows a native save dialog, converts the data URL to a buffer, and writes the PNG file
