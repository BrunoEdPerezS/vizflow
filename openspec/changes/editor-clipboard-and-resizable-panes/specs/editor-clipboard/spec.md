## ADDED Requirements

### Requirement: Clipboard operations via native menu roles
The system SHALL provide a native "Editar" menu with items that use Electron's built-in clipboard roles (`cut`, `copy`, `paste`, `selectAll`). These roles SHALL enable standard clipboard operations (Ctrl+X, Ctrl+C, Ctrl+V, Ctrl+A) within Monaco Editor without requiring custom clipboard handlers.

#### Scenario: Copy selected text
- **WHEN** user selects text in Monaco Editor and presses Ctrl+C
- **THEN** the selected text is copied to the system clipboard

#### Scenario: Paste from clipboard
- **WHEN** user presses Ctrl+V with text in the system clipboard
- **THEN** the clipboard content is pasted at the cursor position in Monaco Editor

#### Scenario: Cut selected text
- **WHEN** user selects text and presses Ctrl+X
- **THEN** the selected text is removed from the editor and copied to the clipboard

#### Scenario: Select all text
- **WHEN** user presses Ctrl+A
- **THEN** all text in the editor is selected

### Requirement: Edit menu structure
The "Editar" menu SHALL appear between "Archivo" and any other menus. It SHALL contain "Deshacer" (Ctrl+Z), "Rehacer" (Ctrl+Y), a separator, "Cortar" (Ctrl+X), "Copiar" (Ctrl+C), "Pegar" (Ctrl+V), and "Seleccionar todo" (Ctrl+A).

#### Scenario: Edit menu visible
- **WHEN** the Vizflow window opens
- **THEN** the menu bar shows "Archivo" followed by "Editar"
- **AND** all clipboard items display their keyboard shortcuts
