## ADDED Requirements

### Requirement: Tab bar displays open files
The system SHALL render a tab bar between the toolbar and the main content area, showing one tab per open file. Each tab SHALL display the file's basename. The active tab SHALL be visually highlighted.

#### Scenario: Single tab on launch
- **WHEN** Vizflow opens with one file
- **THEN** the tab bar shows one tab with the filename
- **AND** the tab is marked as active (highlighted)

#### Scenario: Multiple tabs after opening files
- **WHEN** the user opens two additional files via Archivo > Abrir
- **THEN** the tab bar shows three tabs with their respective filenames
- **AND** the most recently opened tab is active

#### Scenario: Tab bar overflow
- **WHEN** more tabs are open than fit in the tab bar width
- **THEN** the tab bar scrolls horizontally to reveal overflow tabs

### Requirement: Click tab to switch
The user SHALL be able to click on any tab to switch to that file. The active tab SHALL be visually highlighted, and the editor and preview SHALL update to show the selected file's content.

#### Scenario: Click inactive tab
- **WHEN** the user clicks on an inactive tab
- **THEN** the clicked tab becomes active (highlighted)
- **AND** the previously active tab loses its highlight
- **AND** the editor shows the new tab's content
- **AND** the preview renders the new tab's diagram with restored zoom/pan state

### Requirement: Close tab button
Each tab SHALL display a close button (×) on the right side. Clicking it SHALL close that tab and remove it from the tab bar. If the closed tab was active, the adjacent tab (to the right, or left if none) SHALL become active.

#### Scenario: Close active tab with other tabs open
- **WHEN** tab B is active and the user clicks × on tab B
- **THEN** tab B is removed from the tab bar
- **AND** tab C (to the right) becomes active, or tab A (to the left) if B was the last tab

#### Scenario: Close last remaining tab
- **WHEN** only one tab is open and the user clicks ×
- **THEN** the tab is closed
- **AND** the application window remains open with no editor content (or closes — platform convention)

### Requirement: Keyboard shortcuts for tab switching
The system SHALL support Alt+1 through Alt+9 to switch to the 1st through 9th tab respectively.

#### Scenario: Switch to 3rd tab with Alt+3
- **WHEN** three tabs are open and tab 1 is active
- **AND** the user presses Alt+3
- **THEN** tab 3 becomes active
- **AND** the editor and preview update accordingly

### Requirement: Close tab with Ctrl+W
The system SHALL support Ctrl+W to close the active tab. If only one tab remains, Ctrl+W SHALL do nothing.

#### Scenario: Close active tab with Ctrl+W
- **WHEN** multiple tabs are open and tab B is active
- **AND** the user presses Ctrl+W
- **THEN** tab B is closed
- **AND** the adjacent tab becomes active
