## ADDED Requirements

### Requirement: Grapher agent definition exists
The project SHALL include `agent/grapher.md` — a valid opencode agent definition with YAML frontmatter and a system prompt that covers Mermaid diagram generation for Vizflow.

#### Scenario: Agent file is valid opencode agent definition
- **WHEN** the file `agent/grapher.md` is copied to `~/.config/opencode/agents/`
- **THEN** opencode recognizes `Grapher` as an available subagent
- **AND** it appears in `@` autocompletion

### Requirement: Grapher generates .mmd from natural language
The agent SHALL, when invoked, analyze the user's prompt, select an appropriate Mermaid diagram type, generate valid Mermaid syntax, and write it to a `.mmd` file with YAML frontmatter.

#### Scenario: Create new flowchart diagram
- **WHEN** user invokes `@Grapher crea un diagrama de arquitectura de microservicios`
- **THEN** the agent selects `flowchart` or `graph` diagram type
- **AND** generates valid Mermaid syntax representing the architecture
- **AND** writes to a `.mmd` file with `title` in YAML frontmatter
- **AND** reports the file path to the user

#### Scenario: Create new sequence diagram
- **WHEN** user invokes `@Grapher un diagrama de secuencia del login OAuth2`
- **THEN** the agent selects `sequenceDiagram` type
- **AND** generates valid Mermaid sequence syntax with participants, arrows, and notes

### Requirement: Grapher asks for output directory on first use
The agent SHALL use the `question` tool to ask for the output directory before creating a new diagram, unless the user already specified a path in the prompt.

#### Scenario: First diagram in invocation
- **WHEN** the agent is invoked to create a diagram and no directory has been specified
- **THEN** the agent uses the `question` tool to ask "En que carpeta guardo el diagrama?"
- **AND** uses the response as the output directory

#### Scenario: Path specified in user prompt
- **WHEN** the user prompt includes a file path (e.g., "crea diagrams/login.mmd")
- **THEN** the agent uses that path directly without asking

### Requirement: Grapher reuses file path in same invocation iterations
The agent SHALL remember the file path it created or edited during the same opencode invocation and reuse it without asking again.

#### Scenario: Iterate on same diagram
- **WHEN** user first says "crea diagrams/flow.mmd con login flow"
- **AND** then says "agregale validacion de email"
- **THEN** the agent reuses `diagrams/flow.mmd` without asking
- **AND** reads, modifies, and writes the existing file

### Requirement: Grapher edits existing .mmd files
The agent SHALL be able to read an existing `.mmd` file, modify its Mermaid content according to user instructions, and write the updated content back.

#### Scenario: Edit existing diagram
- **WHEN** user says "en diagrams/auth.mmd cambia el color del nodo principal a rojo"
- **THEN** the agent reads the file
- **AND** modifies the Mermaid syntax to apply the style change
- **AND** writes the updated content

### Requirement: Grapher uses correct .mmd format for Vizflow
The generated `.mmd` files SHALL include YAML frontmatter with at least `title`, properly delimited by `---`, followed by the Mermaid diagram body. Annotations using `%%#` SHALL be used for explanatory notes when helpful.

#### Scenario: File structure
- **WHEN** the agent creates a new `.mmd` file
- **THEN** the file begins with `---`
- **AND** contains `title: <descriptive title>`
- **AND** optionally contains `theme: dark`
- **AND** is followed by `---` on its own line
- **AND** the Mermaid diagram body follows the frontmatter

### Requirement: Installation instructions documented
The project SHALL include `agent/README.md` with step-by-step instructions to install the Grapher agent by copying `grapher.md` to the opencode agents directory.

#### Scenario: Windows install
- **WHEN** user reads `agent/README.md` on Windows
- **THEN** the document shows: `Copy-Item agent/grapher.md $env:USERPROFILE\.config\opencode\agents\grapher.md`

#### Scenario: Linux/macOS install
- **WHEN** user reads `agent/README.md` on Linux or macOS
- **THEN** the document shows: `cp agent/grapher.md ~/.config/opencode/agents/grapher.md`
