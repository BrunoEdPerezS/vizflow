## MODIFIED Requirements

### Requirement: CLI command to open a file
The system SHALL be invocable from the command line using `vizflow <file...>` (via `npx vizflow`, `npm link`, or directly via the installed binary). File arguments SHALL be paths to `.mmd` files. Multiple file arguments SHALL open multiple tabs. If a file does not exist, it SHALL be created with default template content.

#### Scenario: Open existing file
- **WHEN** user runs `vizflow architecture.mmd` and the file exists
- **THEN** the Electron application window opens with the file content loaded in a single tab

#### Scenario: Open non-existent file
- **WHEN** user runs `vizflow new_diagram.mmd` and the file does not exist
- **THEN** the file is created with a default Mermaid template, and the application opens with that template displayed in a tab

#### Scenario: Open multiple files
- **WHEN** user runs `vizflow login.mmd architecture.mmd`
- **THEN** both files open in separate tabs
- **AND** the first file (`login.mmd`) is the active tab
- **AND** `architecture.mmd` is open in a second tab

#### Scenario: No file argument
- **WHEN** user runs `vizflow` without specifying a file
- **THEN** the application creates a temporary `untitled.mmd` file in the system temp directory with the default template content
- **AND** the application window opens with that template displayed in a single tab
- **AND** the window title displays "Vizflow - untitled.mmd"

#### Scenario: Open file from file manager
- **WHEN** user double-clicks a `.mmd` file in the OS file manager and the application is set as the default handler
- **THEN** the Electron app opens with that file loaded in a tab
