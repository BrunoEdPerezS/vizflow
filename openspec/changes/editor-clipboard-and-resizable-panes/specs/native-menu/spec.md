## MODIFIED Requirements

### Requirement: Native application menu with Archivo and Editar
The system SHALL display a native application menu bar with "Archivo" (Abrir..., Cerrar pestaña, Salir) and "Editar" (Deshacer, Rehacer, Cortar, Copiar, Pegar, Seleccionar todo) menus.

#### Scenario: Menu bar visible on launch
- **WHEN** the Vizflow window opens
- **THEN** a native menu bar is visible with "Archivo" and "Editar" menus

#### Scenario: Archivo submenu items
- **WHEN** the user clicks "Archivo" in the menu bar
- **THEN** the submenu shows "Abrir..." (Ctrl+O), "Cerrar pestaña" (Ctrl+W), separator, "Salir"

#### Scenario: Editar submenu items
- **WHEN** the user clicks "Editar" in the menu bar
- **THEN** the submenu shows "Deshacer" (Ctrl+Z), "Rehacer" (Ctrl+Y), separator, "Cortar" (Ctrl+X), "Copiar" (Ctrl+C), "Pegar" (Ctrl+V), separator, "Seleccionar todo" (Ctrl+A)

#### Scenario: Keyboard shortcut opens file dialog
- **WHEN** the user presses Ctrl+O
- **THEN** a native file open dialog appears, filtered to `.mmd` files

#### Scenario: Clipboard keyboard shortcuts function
- **WHEN** the user presses Ctrl+C with text selected
- **THEN** text is copied to clipboard
- **AND** the operation is handled by Monaco Editor correctly
