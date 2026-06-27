## MODIFIED Requirements

### Requirement: File watcher detects external changes via fs.watch()
The system SHALL monitor each open `.mmd` file for changes using Node.js `fs.watch()` in the Electron main process. When any monitored file is modified by an external process (the LLM), the system SHALL read the new content and push it to the renderer process via IPC, including the `filePath` in the payload so the renderer can route the update to the correct tab.

#### Scenario: LLM edits a file
- **WHEN** the LLM modifies one of the open `.mmd` files using a file edit tool
- **THEN** `fs.watch()` in the main process detects the change, reads the new file content, and sends `{ filePath, content }` to the renderer via `mainWindow.webContents.send('file:external-change', payload)`

#### Scenario: Multiple files open, LLM edits one
- **WHEN** three files are open in tabs
- **AND** the LLM edits only the second file
- **THEN** only tab 2's content updates in the renderer
- **AND** tabs 1 and 3 remain unchanged

#### Scenario: File is deleted and recreated
- **WHEN** an open `.mmd` file is deleted and recreated with new content
- **THEN** the watcher for that file detects the recreation and pushes the new content to the renderer with the correct filePath

#### Scenario: Save loop prevention per file
- **WHEN** the main process saves content to file A (from user's editor input)
- **THEN** `fs.watch()` does NOT trigger a push back to the renderer for file A's save event (using a per-file `selfSaving` flag)
- **AND** file B's watcher continues to detect external changes independently

### Requirement: Bidirectional bridge via Electron IPC
The system SHALL use Electron's `ipcMain` / `ipcRenderer` for communication between the main process and the renderer process for all file I/O operations. File-specific operations SHALL include the file path as a parameter.

#### Scenario: Renderer requests file save via IPC
- **WHEN** the renderer calls `ipcRenderer.invoke('file:save', { filePath, content })`
- **THEN** the main process receives the invocation, writes `content` to the specified `.mmd` file, sets the per-file `selfSaving` flag, and returns a success confirmation

#### Scenario: Main process notifies renderer of external file change via IPC
- **WHEN** `fs.watch()` detects an external change on a file
- **THEN** the main process calls `mainWindow.webContents.send('file:external-change', { filePath, content })` and the renderer routes the update to the matching tab

#### Scenario: Renderer requests initial file read via IPC
- **WHEN** the renderer needs to read a file and calls `ipcRenderer.invoke('file:read', { filePath })`
- **THEN** the main process reads the specified `.mmd` file content and returns it
