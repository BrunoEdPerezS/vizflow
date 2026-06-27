## ADDED Requirements

### Requirement: Multiple files open simultaneously
The system SHALL allow multiple `.mmd` files to be open at the same time, each represented by a tab. The main process SHALL manage a collection of open file paths, file watchers, and self-saving guards keyed by file path.

#### Scenario: Open second file via menu
- **WHEN** one diagram is open
- **AND** the user selects Archivo > Abrir and picks a different `.mmd` file
- **THEN** a new tab is created for the new file
- **AND** the original tab remains open and unchanged
- **AND** the new tab becomes active

#### Scenario: Open multiple files via CLI
- **WHEN** user runs `vizflow login.mmd architecture.mmd`
- **THEN** both files open in tabs
- **AND** `login.mmd` is the active tab (first argument)
- **AND** `architecture.mmd` is open in a second tab

### Requirement: Per-file editor state isolation
Each open tab SHALL have its own Monaco `ITextModel`, preserving independent undo history, cursor position, and scroll position. Switching tabs SHALL not lose any editor state.

#### Scenario: Undo history per tab
- **WHEN** tab A has 5 undo steps from previous edits
- **AND** the user switches to tab B, makes edits, then switches back to tab A
- **THEN** pressing Ctrl+Z in tab A undoes the last edit made in tab A (not tab B)

#### Scenario: Cursor position preserved
- **WHEN** the user places the cursor at line 10, column 5 in tab A
- **AND** switches to tab B, moves the cursor, then switches back to tab A
- **THEN** the cursor in tab A is restored to line 10, column 5

### Requirement: Per-file zoom and pan state
Each tab SHALL preserve its own zoom scale, fit scale, and pan translation. Switching tabs SHALL restore the zoom/pan state of the target tab.

#### Scenario: Zoom preserved across tab switch
- **WHEN** the user zooms to 150% in tab A
- **AND** switches to tab B (at 100%), then switches back to tab A
- **THEN** tab A displays at 150% zoom

#### Scenario: Pan position preserved
- **WHEN** the user pans tab A to show the bottom-right of the diagram
- **AND** switches to tab B, then back to tab A
- **THEN** tab A still shows the bottom-right region

### Requirement: Per-file self-saving guard
The auto-save debounce timer and `isExternalUpdate` flag SHALL operate independently per tab. Saving one tab's content SHALL not trigger the file watcher of a different tab.

#### Scenario: Concurrent edits in different tabs
- **WHEN** the user edits tab A, then switches to tab B and edits it
- **THEN** tab A's auto-save fires 500ms after the last edit in tab A
- **AND** tab B's auto-save fires 500ms after the last edit in tab B
- **AND** the file watcher for each file correctly filters out self-saves
