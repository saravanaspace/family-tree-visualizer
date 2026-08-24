# Feature Specification: Responsive UI Refresh

**Feature Branch**: `007-responsive-ui-refresh`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "better responsive UI" refined to "similar to Miro" — adopt a
modern infinite-whiteboard canvas interaction model (fluid pan/zoom, zoom-to-fit, minimap,
marquee multi-select, contextual toolbar). Part of a broader idea set; accounts, profiles,
reminders, and Q&A are tracked as separate features.

## Clarifications

### Session 2026-08-24

- Q: When multiple members are marquee-selected, which actions apply to the whole selection
  versus a single member? → A: Multi-select supports group move only; add, edit, and delete
  apply to a single selected member.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use Core Views Comfortably on Mobile (Priority: P1)

As a mobile user, I can comfortably use the tree, timeline, and member management views on a
small screen so I can work with my family data anywhere.

**Why this priority**: Mobile comfort for the core views is the central goal of the refresh and
delivers the most immediate improvement.

**Independent Test**: Complete the primary member and relationship flows on a small screen,
confirming content is readable, controls are reachable, and nothing important is clipped or
overlapped.

**Acceptance Scenarios**:

1. **Given** a small screen, **When** a user opens the tree or timeline,
   **Then** content is readable and controls are reachable without horizontal scrolling of the
   whole page.
2. **Given** a small screen, **When** a user opens navigation and dialogs,
   **Then** they fit the viewport and can be dismissed without obscuring the active task.
3. **Given** any supported screen size, **When** the layout adapts,
   **Then** no primary control becomes hidden, clipped, or overlapped.

### User Story 2 - Interact Naturally With Touch (Priority: P2)

As a touch user, I can pan, zoom, select, and edit using natural touch gestures so the tree is
practical without a mouse.

**Why this priority**: Touch interaction greatly improves the mobile experience but builds on
the responsive layout being in place.

**Acceptance Scenarios**:

1. **Given** a touch device, **When** a user pans or zooms the tree,
   **Then** the gestures behave predictably and do not conflict with page scrolling.
2. **Given** a touch device, **When** a user selects or edits a member,
   **Then** targets are large enough to tap reliably.
3. **Given** a touch device, **When** a user performs a gesture near an edge,
   **Then** the interaction remains controllable and recoverable.

### User Story 3 - Meet Accessibility Expectations (Priority: P1)

As a keyboard or assistive-technology user, I can operate the application with visible focus,
clear labels, and adequate contrast so the experience is inclusive.

**Why this priority**: Accessibility is a baseline obligation and a non-negotiable quality of
any UI refresh.

**Acceptance Scenarios**:

1. **Given** keyboard navigation, **When** a user tabs through the interface,
   **Then** every interactive control is reachable and shows a visible focus state.
2. **Given** assistive technology, **When** a user encounters controls and status changes,
   **Then** each has an understandable accessible name and announced state.
3. **Given** text and essential controls, **When** they are displayed,
   **Then** they meet accepted contrast and sizing guidance.

### User Story 4 - Navigate the Canvas Like a Modern Whiteboard (Priority: P1)

As a user exploring a family tree, I can pan, zoom, and orient myself on a fluid infinite
canvas with familiar whiteboard interactions (like Miro) so navigating even a large tree feels
effortless and intuitive.

**Why this priority**: The canvas is the primary surface, and its current mouse-only, non-fluid
navigation is the main reason the app feels unintuitive; a modern whiteboard model is the core
of this refresh.

**Independent Test**: On a moderately large tree, pan and zoom with standard whiteboard input
mappings, use zoom-to-fit and the minimap to reach any member, marquee-select several members
and move them as a group, and confirm the arrangement persists.

**Acceptance Scenarios**:

1. **Given** the tree canvas, **When** a user scrolls, pinches, uses Ctrl/Cmd+scroll, or
   space/middle-drags, **Then** the canvas pans or zooms following familiar whiteboard
   conventions and zooms about the pointer or pinch focal point.
2. **Given** panning or zooming, **When** the interaction ends, **Then** motion settles smoothly
   (with momentum where appropriate) unless reduced motion is preferred.
3. **Given** a tree larger than the viewport, **When** a user selects zoom-to-fit,
   **Then** all content is framed with padding, and the zoom indicator shows the current level.
4. **Given** a large tree, **When** a user views the minimap, **Then** it shows the viewport
   within the whole tree and lets the user reposition by clicking or dragging.
5. **Given** several members, **When** a user drags a marquee selection and moves them,
   **Then** the selected members move together and each new position is persisted once.
6. **Given** a current selection, **When** it is active, **Then** a contextual toolbar offers
   common actions (add relation, edit, delete) near a single selected member; when multiple
   members are selected, only group move is available.

### Edge Cases

- Very small and very large viewports MUST both remain usable without broken layout.
- Orientation changes MUST preserve the user's context and current task.
- Long names, dates, and locations MUST wrap or truncate gracefully without breaking layout.
- Touch and pointer input on hybrid devices MUST both work.
- Reduced-motion preferences MUST be respected for animated interactions.
- Zoom-to-fit on an empty tree or a single member MUST produce a sensible, bounded view.
- Zoom MUST be clamped to sensible minimum and maximum levels with no runaway zoom.
- The minimap MUST remain accurate as members are added, moved, or removed, and MUST degrade
  gracefully (or hide) on very small screens.
- Momentum/inertial panning MUST be disabled when reduced motion is preferred.
- A marquee selection that includes no members MUST clear the selection without error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The core tree, timeline, and member management views MUST be usable and readable
  across supported mobile, tablet, and desktop sizes.
- **FR-002**: Navigation, dialogs, and controls MUST fit the viewport and remain operable at
  all supported sizes.
- **FR-003**: No primary control may become hidden, clipped, or overlapped by responsive
  layout changes.
- **FR-004**: The tree MUST support predictable touch pan, zoom, select, and edit interactions
  that do not conflict with normal scrolling.
- **FR-005**: Interactive targets MUST be large enough to operate reliably by touch.
- **FR-006**: Every interactive control MUST be keyboard reachable with a visible focus state.
- **FR-007**: Controls and status changes MUST expose understandable accessible names and
  states to assistive technology.
- **FR-008**: Text and essential controls MUST meet accepted contrast and sizing guidance.
- **FR-009**: The interface MUST respect reduced-motion preferences.
- **FR-010**: Layout MUST handle long or overflowing content gracefully without breaking.
- **FR-011**: The canvas MUST behave as a fluid infinite surface: pan and zoom MUST feel smooth,
  zoom MUST center on the pointer or pinch focal point, and panning MAY carry momentum.
- **FR-012**: The canvas MUST support familiar whiteboard input mappings across mouse, trackpad,
  and touch: scroll to pan, Ctrl/Cmd+scroll to zoom, pinch to zoom, and space-drag or
  middle-button drag to pan.
- **FR-013**: The system MUST provide zoom controls showing the current zoom percentage with
  zoom in, zoom out, reset to 100%, zoom-to-fit-all, and zoom-to-fit-selection actions.
- **FR-014**: The system MUST provide a minimap/overview on larger screens showing the current
  viewport within the whole tree and allowing repositioning by click or drag.
- **FR-015**: The system MUST support marquee (rubber-band) multi-selection and moving the
  selected members together, persisting each moved member's position once per move. Multi-select
  supports group move only; add, edit, and delete act on a single selected member.
- **FR-016**: The system MUST present a contextual toolbar near a single selected member offering
  common actions (add relation, edit, delete); when multiple members are selected, the toolbar
  offers only group move.
- **FR-017**: Zoom MUST be bounded to a sensible minimum and maximum, and zoom-to-fit MUST frame
  content with padding, including sensible behavior for empty or single-member trees.
- **FR-018**: All canvas animations (momentum and animated zoom/fit) MUST respect reduced-motion
  preferences.

### Key Entities *(include if feature involves data)*

_Not applicable: this feature refreshes presentation and interaction and introduces no new
data entities._

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of primary flows are completable on supported mobile, tablet, and desktop
  sizes in testing.
- **SC-002**: 0 primary controls are hidden, clipped, or overlapped across supported
  breakpoints in testing.
- **SC-003**: 100% of interactive controls are keyboard reachable with a visible focus state.
- **SC-004**: Text and essential controls meet accepted contrast and target-size guidance in
  an accessibility audit.
- **SC-005**: At least 90% of mobile users can complete the core member and relationship flows
  without assistance in usability testing.
- **SC-006**: A user can locate and frame any member in a 100-member tree using zoom-to-fit
  and/or the minimap in under 10 seconds.
- **SC-007**: Pan and zoom sustain approximately 60 fps on a mid-range device for trees up to
  100 members.
- **SC-008**: Standard whiteboard input mappings (scroll-pan, Ctrl/Cmd+scroll-zoom, pinch-zoom,
  space/middle-drag-pan) work on mouse, trackpad, and touch in testing.

## Assumptions

- This feature refreshes the presentation of the baseline in
  [../001-core-family-tree/spec.md](../001-core-family-tree/spec.md) and does not change its
  data or core behavior.
- Accepted accessibility guidance (contrast, focus, target size, reduced motion) is the
  standard of record; specific breakpoints and design details are decided during planning.
- Supported device and browser ranges will be confirmed during planning.
- This refresh coordinates with, but does not depend on, the other proposed features.
- "Similar to Miro" refers to the single-user canvas interaction model only: fluid pan/zoom,
  zoom-to-fit, minimap, marquee multi-select, and a contextual toolbar.
- Explicit non-goals: real-time multiplayer, live collaborator cursors, comments, sticky notes,
  freeform drawing, boards/frames, and templates are out of scope for this feature.
