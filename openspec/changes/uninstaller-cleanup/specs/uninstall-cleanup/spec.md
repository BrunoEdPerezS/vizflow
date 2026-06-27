## ADDED Requirements

### Requirement: Windows uninstall removes PATH entry
The NSIS uninstaller SHALL remove the Vizflow installation directory from the user's PATH environment variable (`HKCU\Environment\Path`) during uninstallation. The removal SHALL handle the directory appearing at the beginning, middle, or end of the semicolon-delimited PATH string.

#### Scenario: Uninstall removes sole PATH entry
- **WHEN** Vizflow's install directory is the only entry in PATH
- **AND** the user uninstalls Vizflow via Windows Add/Remove Programs
- **THEN** the PATH environment variable is empty (or set to empty string)
- **AND** running `vizflow` in a new terminal returns "command not found"

#### Scenario: Uninstall removes PATH entry from middle of list
- **WHEN** Vizflow's install directory is in the middle of PATH (`C:\foo;C:\Vizflow;C:\bar`)
- **AND** the user uninstalls Vizflow
- **THEN** PATH is updated to `C:\foo;C:\bar`
- **AND** other PATH entries are preserved

#### Scenario: Uninstall removes PATH entry from end of list
- **WHEN** Vizflow's install directory is at the end of PATH (`C:\foo;C:\Vizflow`)
- **AND** the user uninstalls Vizflow
- **THEN** PATH is updated to `C:\foo`

### Requirement: Windows install avoids duplicate PATH entries
The NSIS installer SHALL check whether the Vizflow installation directory already exists in the user's PATH before appending it. If the directory is already present, no modification to PATH SHALL be made.

#### Scenario: Reinstall with existing PATH entry
- **WHEN** Vizflow's install directory is already in PATH from a previous installation
- **AND** the user reinstalls Vizflow
- **THEN** PATH is not modified (no duplicate entry added)

#### Scenario: Fresh install with non-empty PATH
- **WHEN** the user's PATH is `C:\foo;C:\bar`
- **AND** Vizflow's directory is not present
- **AND** the user installs Vizflow
- **THEN** PATH becomes `C:\foo;C:\bar;C:\Programs\vizflow`

### Requirement: Linux .deb purge removes user config and cache
When the user purges the Vizflow `.deb` package (`sudo apt purge vizflow` or `sudo dpkg --purge vizflow`), the system SHALL remove the user's Vizflow configuration directory (`~/.config/vizflow/`) and cache directory (`~/.cache/vizflow/`). A standard `remove` (`sudo apt remove vizflow` or `sudo dpkg -r vizflow`) SHALL NOT remove these directories, following Debian policy.

#### Scenario: Purge removes config and cache
- **WHEN** user runs `sudo apt purge vizflow`
- **THEN** `~/.config/vizflow/` is deleted
- **AND** `~/.cache/vizflow/` is deleted
- **AND** the binary and app resources are removed

#### Scenario: Remove keeps config and cache
- **WHEN** user runs `sudo apt remove vizflow`
- **THEN** the binary and app resources are removed
- **AND** `~/.config/vizflow/` and `~/.cache/vizflow/` are preserved
