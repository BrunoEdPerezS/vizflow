## ADDED Requirements

### Requirement: Package name is vizflow
The npm `package.json` SHALL use `"name": "vizflow"`. The `bin` entry SHALL map the command `vizflow` to the CLI wrapper.

#### Scenario: Package identity is vizflow
- **WHEN** inspecting `package.json`
- **THEN** `"name"` field is `"vizflow"`
- **AND** `"bin"` field key is `"vizflow"`

### Requirement: appId reflects vizflow identity
The electron-builder `appId` SHALL be `"ai.vizflow.vizflow"`.

#### Scenario: appId is consistent
- **WHEN** inspecting `package.json` build config
- **THEN** `"appId"` is `"ai.vizflow.vizflow"`

### Requirement: productName is Vizflow
The electron-builder `productName` SHALL be `"Vizflow"`, generating executable names without spaces (e.g., `Vizflow.exe` on Windows).

#### Scenario: Executable has clean name
- **WHEN** building the app with `npm run dist` on Windows
- **THEN** the generated executable is named `Vizflow.exe`
- **AND** the NSIS installer is named `Vizflow Setup 1.0.0.exe`

### Requirement: Window title uses Vizflow
The Electron BrowserWindow title SHALL be `"Vizflow"` by default, and SHALL use `Vizflow` as the suffix in title formatting (e.g., `"System Architecture — Vizflow"`).

#### Scenario: Default window title
- **WHEN** the app opens a file without a frontmatter title
- **THEN** the window title is `"Vizflow"` or reflects the filename suffixed with `"— Vizflow"`

#### Scenario: Window title with frontmatter
- **WHEN** the file has `title: System Architecture` in its frontmatter
- **THEN** the window title displays `"System Architecture — Vizflow"`

### Requirement: HTML document title is Vizflow
The `index.html` page title SHALL be `"Vizflow"`.

#### Scenario: HTML title tag
- **WHEN** the renderer loads `index.html`
- **THEN** the `<title>` tag content is `"Vizflow"`
