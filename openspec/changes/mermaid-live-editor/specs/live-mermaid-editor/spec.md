## ADDED Requirements

### Requirement: Live Mermaid rendering on keystroke
The system SHALL render Mermaid.js diagrams instantly in the preview pane as the user types in Monaco Editor. Each keystroke triggers a re-render without requiring manual action.

#### Scenario: User types valid Mermaid syntax
- **WHEN** user types `graph TD\n    A --> B` in Monaco Editor
- **THEN** the preview pane displays the rendered diagram showing node A connected to node B within 100ms of the keystroke

#### Scenario: User types invalid Mermaid syntax
- **WHEN** user types `graph TD\n    A -->` (incomplete syntax)
- **THEN** the preview pane shows a user-friendly error message from Mermaid.js instead of a blank pane

#### Scenario: Diagram with annotations renders correctly
- **WHEN** the file contains Mermaid syntax mixed with `%%#` annotation lines
- **THEN** only the valid Mermaid syntax is passed to Mermaid.js for rendering (stripping `%%` comment lines), and the diagram appears correctly without `%%#` lines causing parse errors

### Requirement: Monaco Editor with Mermaid syntax highlighting
The system SHALL use Monaco Editor as the text editor, with syntax highlighting enabled for Mermaid diagram syntax.

#### Scenario: Mermaid keywords are highlighted
- **WHEN** user types `graph TD` in the editor
- **THEN** `graph` and `TD` are displayed with syntax-highlighted colors distinct from regular text

#### Scenario: Editor supports standard IDE features
- **WHEN** user interacts with the editor
- **THEN** undo/redo (Ctrl+Z/Ctrl+Y), find/replace (Ctrl+F/Ctrl+H), and line numbers are available

### Requirement: Split layout editor + preview
The system SHALL display a resizable split layout with Monaco Editor on the left and the rendered diagram preview on the right.

#### Scenario: Default layout on launch
- **WHEN** the application starts
- **THEN** the window shows a left panel (Monaco Editor) and a right panel (preview) with a draggable vertical divider, each occupying approximately 50% of the width

#### Scenario: Window size and positioning
- **WHEN** the application starts
- **THEN** the window opens at 1400x900 pixels, centered on the primary display

### Requirement: Dark and light theme support
The system SHALL provide a toggle to switch between dark and light themes. The theme SHALL apply to Monaco Editor, the preview panel, and the application chrome.

#### Scenario: Toggle to dark theme
- **WHEN** user clicks the theme toggle button
- **THEN** Monaco Editor switches to `vs-dark` theme, Mermaid.js re-renders with `dark` theme, and the preview background switches to dark

#### Scenario: Theme persists from frontmatter
- **WHEN** the `.mmd` file has `theme: dark` in its YAML frontmatter
- **THEN** the application opens with the dark theme applied automatically

### Requirement: Editor updates when LLM modifies file
The system SHALL update Monaco Editor content when the underlying `.mmd` file is modified externally (by the LLM), without requiring a manual reload.

#### Scenario: LLM adds a node to the diagram
- **WHEN** the LLM edits the file to add `    B --> C[New Node]`
- **THEN** Monaco Editor updates to show the new content, and the preview re-renders to include node C within 1 second of the file change

#### Scenario: Cursor position preserved after external update
- **WHEN** the LLM makes a small change to the file (e.g., renaming a node label)
- **THEN** Monaco Editor updates its content and attempts to restore the user's cursor position if possible
