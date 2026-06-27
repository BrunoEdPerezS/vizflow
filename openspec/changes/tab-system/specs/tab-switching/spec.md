## ADDED Requirements

### Requirement: Monaco model swapping on tab switch
When the user switches tabs, the system SHALL swap the active Monaco `ITextModel` on the single editor instance, save the outgoing tab's view state (cursor and scroll position), and restore the incoming tab's view state. The diagram preview SHALL be re-rendered from the incoming tab's parsed Mermaid code and annotations.

#### Scenario: Model swap preserves editor state
- **WHEN** the user switches from tab A to tab B
- **THEN** editor.getModel() returns tab B's model
- **AND** tab A's viewState is saved (cursor position, scroll offset)
- **AND** tab B's previously saved viewState is restored
- **AND** the preview renders tab B's diagram

#### Scenario: First switch to a tab with no saved viewState
- **WHEN** the user switches to a tab that has never been viewed
- **THEN** the editor shows the top of the file with cursor at position (0,0)

### Requirement: Preview re-render on tab switch
The preview pane SHALL be cleared and re-rendered with the incoming tab's diagram (Mermaid SVG), annotations (sticky notes), and annotation font size sync on every tab switch.

#### Scenario: Preview updates correctly
- **WHEN** tab A shows a flowchart and tab B shows a sequence diagram
- **AND** the user switches from A to B
- **THEN** the preview shows the sequence diagram from tab B
- **AND** tab B's sticky notes (if any) are displayed
- **AND** the annotation font size matches tab B's SVG text size

### Requirement: Restore zoom/pan on tab switch
The system SHALL apply the incoming tab's saved `zoomScale`, `fitScale`, `zoomTx`, and `zoomTy` via CSS transform on `#preview-stage` when switching tabs.

#### Scenario: Zoom restored after tab switch
- **WHEN** tab A has zoomScale = 1.5, tab B has zoomScale = 1
- **AND** the user switches from B to A
- **THEN** the CSS transform on #preview-stage reflects zoomScale=1.5 and tab A's zoomTx/zoomTy
- **AND** the zoom label updates to show 150%
