## ADDED Requirements

### Requirement: CLI command available from any directory (Windows)
On Windows, after running the NSIS installer, the system SHALL have the Vizflow installation directory in the user's PATH environment variable. The user SHALL be able to invoke `vizflow <file.mmd>` from any directory in PowerShell or CMD.

#### Scenario: Fresh install adds to PATH
- **WHEN** the user runs the NSIS installer and completes installation
- **THEN** the Vizflow installation directory is appended to the user PATH (HKCU\Environment\Path)
- **AND** running `vizflow test.mmd` from any directory opens the app with that file

#### Scenario: Uninstall removes from PATH
- **WHEN** the user uninstalls Vizflow via Windows Add/Remove Programs
- **THEN** the Vizflow installation directory is removed from the user PATH
- **AND** running `vizflow` in a new terminal returns "command not found"

#### Scenario: PATH not duplicated on reinstall
- **WHEN** the user reinstalls Vizflow without uninstalling first
- **THEN** the PATH does not contain duplicate entries of the install directory

### Requirement: CLI command available from any directory (Linux via .deb)
On Linux, after installing the `.deb` package, the system SHALL place the `vizflow` binary in `/usr/bin/`. The user SHALL be able to invoke `vizflow <file.mmd>` from any directory.

#### Scenario: .deb install makes command globally available
- **WHEN** user runs `sudo dpkg -i vizflow_1.0.0_amd64.deb`
- **THEN** the `vizflow` command is available from any terminal directory
- **AND** running `vizflow arch.mmd` opens the app

### Requirement: CLI command available from any directory (Linux via AppImage)
The project SHALL document how to make the AppImage globally available by moving it to `/usr/local/bin/vizflow`.

#### Scenario: AppImage manual PATH setup documented
- **WHEN** user reads the README installation section for Linux
- **THEN** instructions show `sudo mv Vizflow.AppImage /usr/local/bin/vizflow && chmod +x /usr/local/bin/vizflow`
- **AND** after following instructions, `vizflow arch.mmd` works from any directory

### Requirement: CLI command available from any directory (macOS via .dmg)
The project SHALL document how to create a symlink from the installed app to `/usr/local/bin/vizflow`.

#### Scenario: macOS symlink documented
- **WHEN** user reads the README installation section for macOS
- **THEN** instructions show `sudo ln -s /Applications/Vizflow.app/Contents/MacOS/Vizflow /usr/local/bin/vizflow`
- **AND** after following instructions, `vizflow arch.mmd` works from any directory

### Requirement: CLI wrapper for development (npm link)
The project SHALL include a Node.js CLI wrapper (`bin/cli.js`) that can be linked globally via `npm link` for development purposes.

#### Scenario: npm link makes command available during development
- **WHEN** developer runs `npm link` in the project directory
- **THEN** the `vizflow` command is available globally
- **AND** `vizflow arch.mmd` spawns Electron with the app and file

#### Scenario: CLI wrapper resolves relative paths
- **WHEN** user runs `vizflow ../diagrams/flujo.mmd` from any directory
- **THEN** the CLI wrapper resolves the path relative to the current working directory
- **AND** passes the absolute path to Electron
