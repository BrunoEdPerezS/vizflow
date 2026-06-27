## MODIFIED Requirements

### Requirement: Open .mmd file via native dialog
The system SHALL allow the user to open any `.mmd` file through a native file selection dialog. Upon selecting a file, the application SHALL create a new tab with its content loaded, without closing or modifying existing tabs. The new tab SHALL become the active tab.

#### Scenario: User opens a different .mmd file
- **WHEN** one tab is currently active with a diagram
- **AND** the user selects "Archivo > Abrir..." and picks a different `.mmd` file
- **THEN** a new tab is created for the selected file
- **AND** the new tab becomes active with its diagram rendered
- **AND** the original tab remains open with its state preserved

#### Scenario: User cancels file dialog
- **WHEN** the user selects "Archivo > Abrir..." and clicks "Cancel" in the file dialog
- **THEN** no new tab is created
- **AND** the current tab state remains unchanged

#### Scenario: Selected file does not exist
- **WHEN** the user selects a `.mmd` file that was deleted between the dialog showing and the load attempt
- **THEN** the file is created with the default template content
- **AND** a new tab opens with the template loaded

#### Scenario: File dialog filters to .mmd only
- **WHEN** the file open dialog is displayed
- **THEN** the file list is filtered to show only `.mmd` files
- **AND** the filter label reads "Mermaid Diagrams"

### Requirement: Window title reflects current file
The native window title SHALL display "Vizflow - filename.mmd" where filename is the basename of the currently active tab's `.mmd` file.

#### Scenario: Title updates on tab switch
- **WHEN** the user switches from tab A (`login-flow.mmd`) to tab B (`architecture.mmd`)
- **THEN** the window title changes from "Vizflow - login-flow.mmd" to "Vizflow - architecture.mmd"

#### Scenario: Title updates on file open
- **WHEN** the user opens a file named `architecture.mmd`
- **THEN** the window title displays "Vizflow - architecture.mmd"
