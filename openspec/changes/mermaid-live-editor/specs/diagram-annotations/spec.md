## ADDED Requirements

### Requirement: Parse %%# general annotations
The system SHALL parse lines starting with `%%#` in the `.mmd` file as general annotations. These lines SHALL be excluded from the Mermaid.js render input and SHALL be rendered separately as floating sticky notes overlaid on the diagram.

#### Scenario: Single annotation line
- **WHEN** the file contains `%%# This is a note about the whole diagram`
- **THEN** a sticky note with text "This is a note about the whole diagram" appears over the diagram preview

#### Scenario: Multiple annotation lines
- **WHEN** the file contains three `%%#` lines
- **THEN** three separate sticky notes appear over the diagram, positioned to avoid overlap

#### Scenario: No annotations present
- **WHEN** the file contains Mermaid syntax with no `%%#` lines
- **THEN** no sticky notes appear and the diagram renders normally

### Requirement: Sticky note visual style
Sticky notes SHALL be rendered as borderless, semi-transparent text boxes overlaid on the SVG diagram. They SHALL be visually distinct from diagram elements (nodes, edges).

#### Scenario: Sticky note appearance
- **WHEN** a `%%#` annotation is rendered
- **THEN** it appears as a text box with subtle background (e.g., pale yellow in light theme, dark amber in dark theme), no visible border, and smaller font than diagram labels

### Requirement: Parse YAML frontmatter
The system SHALL parse optional YAML frontmatter delimited by `---` at the start of the `.mmd` file. Recognized fields SHALL include `title` and `theme`.

#### Scenario: File with frontmatter
- **WHEN** the file starts with `---\ntitle: My Diagram\ntheme: dark\n---\n`
- **THEN** the parser extracts `title: "My Diagram"` and `theme: "dark"`, and the window title bar displays "My Diagram"

#### Scenario: File without frontmatter
- **WHEN** the file starts directly with Mermaid syntax (no `---` delimiters)
- **THEN** the parser returns empty metadata and the full file content is treated as Mermaid + annotations
