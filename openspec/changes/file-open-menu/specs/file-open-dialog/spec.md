## ADDED Requirements

### Requirement: Open .mmd file via native dialog
The system SHALL allow the user to open any `.mmd` file through a native file selection dialog. Upon selecting a file, the application SHALL load its content, replacing the currently displayed diagram, updating the editor, rerendering the preview, and restarting the file watcher on the new path.

#### Scenario: User opens a different .mmd file
- **WHEN** a diagram is currently displayed
- **AND** the user selects "Archivo > Abrir..." and picks a different `.mmd` file
- **THEN** the Monaco editor content is replaced with the new file's content
- **AND** the diagram preview is re-rendered with the new Mermaid syntax
- **AND** sticky note annotations from the new file are displayed
- **AND** the window title updates to "Vizflow - newfilename.mmd"
- **AND** the file watcher monitors the new file for external changes

#### Scenario: User cancels file dialog
- **WHEN** the user selects "Archivo > Abrir..." and clicks "Cancel" in the file dialog
- **THEN** the current diagram state is preserved without any changes
- **AND** no IPC message is sent to the renderer

#### Scenario: Selected file does not exist
- **WHEN** the user selects a `.mmd` file that was deleted between the dialog showing and the load attempt
- **THEN** the file is created with the default template content
- **AND** the app loads the new template normally

#### Scenario: File dialog filters to .mmd only
- **WHEN** the file open dialog is displayed
- **THEN** the file list is filtered to show only `.mmd` files
- **AND** the filter label reads "Mermaid Diagrams"

### Requirement: Window title reflects current file
The native window title SHALL display "Vizflow - filename.mmd" where filename is the basename of the currently open `.mmd` file.

#### Scenario: Title updates on file open
- **WHEN** the user opens a file named `architecture.mmd`
- **THEN** the window title displays "Vizflow - architecture.mmd"

#### Scenario: Title updates on file open via menu
- **WHEN** the user switches from `login-flow.mmd` to `architecture.mmd` via "Archivo > Abrir..."
- **THEN** the window title changes from "Vizflow - login-flow.mmd" to "Vizflow - architecture.mmd"
