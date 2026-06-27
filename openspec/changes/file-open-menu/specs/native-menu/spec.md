## ADDED Requirements

### Requirement: Native application menu with Archivo
The system SHALL display a native application menu bar with an "Archivo" menu containing "Abrir..." (Ctrl+O) and "Salir" (Alt+F4 / Cmd+Q) items.

#### Scenario: Menu bar visible on launch
- **WHEN** the Vizflow window opens
- **THEN** a native menu bar is visible at the top of the window with "Archivo" as the first menu

#### Scenario: Archivo submenu items
- **WHEN** the user clicks "Archivo" in the menu bar
- **THEN** the submenu shows "Abrir..." with keyboard shortcut Ctrl+O displayed
- **AND** a separator
- **AND** "Salir" with platform-appropriate shortcut
- **AND** all items are enabled

#### Scenario: Keyboard shortcut opens file dialog
- **WHEN** the user presses Ctrl+O (or Cmd+O on macOS)
- **THEN** a native file open dialog appears, filtered to `.mmd` files
