## ADDED Requirements

### Requirement: Draggable sticky notes with mouse
Sticky notes rendered from `%%#` annotations SHALL be draggable by the user. Clicking and dragging a sticky note SHALL reposition it freely within the preview area. The dragged note SHALL use `grabbing` cursor and slightly higher opacity during the drag for visual feedback.

#### Scenario: User drags a sticky note
- **WHEN** user presses mouse button on a `%%#` sticky note, moves the mouse, and releases
- **THEN** the sticky note moves to follow the mouse cursor during the drag, and stays at the release position

#### Scenario: Cursor feedback during drag
- **WHEN** the mouse hovers over a sticky note
- **THEN** the cursor displays as `grab`
- **WHEN** the sticky note is being dragged
- **THEN** the cursor displays as `grabbing` and the note has `opacity: 0.9`

#### Scenario: Drag in zoomed/panned view
- **WHEN** the preview is zoomed to 150% and panned to the right
- **THEN** dragging a sticky note follows the mouse correctly in stage-space coordinates (mouse delta divided by current zoom scale), so the note moves proportionally with the scaled diagram

### Requirement: Position persistence via %%# @X,Y syntax
After a sticky note is dragged to a new position, the system SHALL persist that position in the `.mmd` file by updating the corresponding `%%#` line in the editor. The syntax for positioned annotations is `%%# @X,Y <text>`, where X and Y are integer pixel coordinates in stage-space.

#### Scenario: First drag writes position to file
- **WHEN** user drags a sticky note whose source line was `%%# Debug loop ensures quality` to position (200, 80)
- **THEN** the editor line is updated to `%%# @200,80 Debug loop ensures quality`, and the file is saved via the standard debounce mechanism

#### Scenario: Subsequent drag updates position
- **WHEN** user drags a sticky note whose source line is `%%# @200,80 Debug loop ensures quality` to position (350, 120)
- **THEN** the editor line is updated to `%%# @350,120 Debug loop ensures quality`

#### Scenario: Backward compatibility — no @X,Y present
- **WHEN** the file contains `%%# A note` without `@X,Y`
- **THEN** the sticky note renders using the default cascading layout, and dragging it for the first time inserts `@X,Y` into the line

### Requirement: Parser extracts @X,Y coordinates
The shared parser (`src/shared/parser.js`) SHALL parse `@X,Y` from `%%#` annotation lines. When `@X,Y` is present, the annotation object SHALL include `x` and `y` integer properties. When absent, `x` and `y` SHALL be `null` or undefined so the renderer falls back to cascading layout.

#### Scenario: Parse positioned annotation
- **WHEN** the parser reads `%%# @150,300 My diagram note`
- **THEN** the returned annotation is `{ text: "My diagram note", x: 150, y: 300 }`

#### Scenario: Parse unpositioned annotation
- **WHEN** the parser reads `%%# Just a note`
- **THEN** the returned annotation is `{ text: "Just a note", x: null, y: null }`

#### Scenario: Malformed coordinates ignored
- **WHEN** the parser reads `%%# @abc,xyz Bad coords` or `%%# @100 Bad format`
- **THEN** the annotation `@` part is treated as literal text: `{ text: "@abc,xyz Bad coords", x: null, y: null }`

### Requirement: Renderer positions sticky notes from @X,Y
The renderer (`renderAnnotations`) SHALL use `x` and `y` from parsed annotations when present, applying them as CSS `left` and `top` properties on the sticky note element. Annotations without coordinates SHALL continue using the existing cascading layout algorithm.

#### Scenario: Positioned and unpositioned notes mixed
- **WHEN** the file has `%%# @100,50 First note` and `%%# Second note` and `%%# @300,200 Third note`
- **THEN** the first note appears at (100,50), the third at (300,200), and the second uses cascading layout (stacked after the highest bottom edge among positioned notes)

### Requirement: Editor update without cursor loss on drag end
When the system updates a `%%#` line to add or modify `@X,Y` coordinates, the update SHALL be performed via `setEditorContent()` so the editor reflects the change instantly, and the re-render + debounce-save cycle fires automatically. The cursor position in the editor SHALL be preserved across the update.

#### Scenario: Editor line updates after drag
- **WHEN** user drops a dragged sticky note at position (400, 250)
- **THEN** the Monaco Editor display updates within one frame to show the modified `%%# @400,250` line, the diagram preview re-renders with the note at its new position, and the user's cursor/selection is restored
