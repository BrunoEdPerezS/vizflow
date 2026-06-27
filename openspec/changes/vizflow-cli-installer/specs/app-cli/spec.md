## MODIFIED Requirements

### Requirement: CLI command to open a file
The system SHALL be invocable from the command line using `vizflow <file>` (via `npx vizflow`, `npm link`, or directly via the installed binary). The file argument SHALL be a path to a `.mmd` file. If the file does not exist, it SHALL be created with default template content.

#### Scenario: Open existing file
- **WHEN** user runs `vizflow architecture.mmd` and the file exists
- **THEN** the Electron application window opens with the file content loaded in Monaco Editor and the diagram rendered in the preview

#### Scenario: Open non-existent file
- **WHEN** user runs `vizflow new_diagram.mmd` and the file does not exist
- **THEN** the file is created with a default Mermaid template, and the application opens with that template displayed

#### Scenario: No file argument
- **WHEN** user runs `vizflow` without specifying a file
- **THEN** the application displays a native error dialog showing the expected usage: `vizflow <file.mmd>`

#### Scenario: Open file from file manager
- **WHEN** user double-clicks a `.mmd` file in the OS file manager and the application is set as the default handler
- **THEN** the Electron app opens with that file loaded

### Requirement: Window title displays filename
The system SHALL set the native window title to reflect the current file. If the file has a `title` in its YAML frontmatter, the title SHALL be used. Otherwise, the filename SHALL be displayed. The suffix SHALL use `Vizflow` instead of `Mermaid Live`.

#### Scenario: File with frontmatter title
- **WHEN** the file has `title: System Architecture` in its frontmatter
- **THEN** the window title displays "System Architecture — Vizflow"

#### Scenario: File without frontmatter title
- **WHEN** the file has no frontmatter title
- **THEN** the window title displays the filename (e.g., "architecture.mmd — Vizflow")
