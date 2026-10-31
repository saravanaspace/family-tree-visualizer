# Feature Specification: Responsive UI Refresh & Canvas Workspace

**Feature Branch**: `007-responsive-ui-refresh`

**Created**: 2026-08-24

**Status**: Draft (scope amended 2026-10-31 — canvas workspace redesign; see Clarifications)

**Input**: User description: "better responsive UI" refined to "similar to Miro" — adopt a
modern infinite-whiteboard canvas interaction model (fluid pan/zoom, zoom-to-fit, minimap,
marquee multi-select, contextual toolbar). Part of a broader idea set; accounts, profiles,
reminders, and Q&A are tracked as separate features.

## Clarifications

### Session 2026-08-24

- Q: When multiple members are marquee-selected, which actions apply to the whole selection
  versus a single member? → A: Multi-select supports group move only; add, edit, and delete
  apply to a single selected member.

### Session 2026-10-31 (canvas workspace redesign)

- Q: Does the redesign replace or extend this spec? → A: Extend this spec (nothing is built yet);
  the previous fixed desktop sidebar requirement is superseded.
- Q: Default wheel/pan scheme? → A: Scroll zooms at the pointer and dragging empty canvas pans
  (revised after demo feedback; originally scroll-pans/marquee); a setting offers a whiteboard scheme
  where scroll pans and Ctrl/Cmd+scroll zooms. Shift+drag draws a marquee selection.
- Q: How are couples and their children shown? → A: Partners link side to side through a junction
  dot between their facing edges, and children descend from that junction; this is derived from existing relationships, with no new stored data.
- Q: Undo/redo scope? → A: Per-session, this-browser only; lost on reload; not shared between users.
- Q: Deleting a member? → A: No blocking confirmation; deletion is immediately undoable instead.
- Q: Snapping? → A: Off by default; toggle in toolbar; holding Shift temporarily inverts it.
- Q: Dark theme, PDF export, server-side history, collaborative cursors? → A: Out of scope.
- Q: Rollout? → A: Replace the existing canvas outright; no side-by-side old/new views. Existing
  saved member positions are reused unchanged.

### Session 2026-10-31 (cross-spec review)

- Q: Where are parent-child cycles blocked (FR-024)? → A: Both: UI gives immediate feedback and the API
  enforces it (feature 009 FR-006).
- Q: Missing SC-007? → A: Performance targets live in SC-010; checklist references repointed there.
- Q: Dependency on accounts (003)? → A: None; ships first against the single shared tree.

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
2. **Given** panning or zooming, **When** the interaction ends, **Then** animated zoom/fit
   transitions are smooth unless reduced motion is preferred (no inertial momentum is required).
3. **Given** a tree larger than the viewport, **When** a user selects zoom-to-fit,
   **Then** all content is framed with padding, and the zoom indicator shows the current level.
4. **Given** a large tree, **When** a user views the minimap, **Then** it shows the viewport
   within the whole tree and lets the user reposition by clicking or dragging.
5. **Given** several members, **When** a user drags a marquee selection and moves them,
   **Then** the selected members move together and each new position is persisted once.
6. **Given** a current selection, **When** it is active, **Then** a contextual toolbar offers
   common actions (add relation, edit, delete) near a single selected member; when multiple
   members are selected, only group move is available.

### User Story 5 - Work on a Floating-Tool Canvas Instead of a Sidebar (Priority: P1)

As a user, I get a full-screen canvas with floating tools (toolbar, search palette, inspector)
instead of a permanent side panel, so the tree gets all the space and tools appear only when needed.

**Why this priority**: The fixed sidebar is the main reason the app does not feel like a modern
whiteboard; removing it is the visible core of the redesign.

**Independent Test**: On desktop, confirm no permanent side panel exists and that every former
sidebar action (add person, connect, auto-arrange, search, filter, stats) is reachable via the
toolbar, command palette, filter control, or inspector.

**Acceptance Scenarios**:

1. **Given** the tree view on desktop, **When** it loads, **Then** the canvas fills the viewport
   with a floating tool bar, view switch (tree/timeline), zoom controls and minimap, and no
   permanent side panel.
2. **Given** a user presses Ctrl/Cmd+K or `/`, **When** they type a name, **Then** matching
   members are listed, and choosing one centers and selects that member; the palette also offers
   Add person, Auto-arrange, Fit view, Toggle snapping, Switch view, and Export.
3. **Given** a member is selected, **When** the inspector opens, **Then** it shows their details
   and relationships with quick edit; advanced fields remain editable via the full edit dialog.
4. **Given** a small screen, **When** the tree is shown, **Then** the toolbar sits at the bottom
   and the inspector is a bottom drawer.

### User Story 6 - Drag Members Freely and Connect Them Visually (Priority: P1)

As a user, I can drag any member anywhere and drag from one member to another (or to empty space)
to create a relationship, so building the tree feels direct instead of form-driven.

**Why this priority**: Free dragging and visual linking are the interactions users cited as
missing; today dragging is inaccurate when zoomed and relationships need a form.

**Independent Test**: At several zoom levels, drag a member and confirm it stays under the pointer
with its links following live; drag between two members to create a link and to empty space to
add a new related person.

**Acceptance Scenarios**:

1. **Given** any zoom or pan level, **When** a user drags a member, **Then** the member follows
   the pointer exactly, connected links update live, and the final position is saved once on release.
2. **Given** a selected member, **When** the user drags from its top, bottom, or side connection
   point onto another member, **Then** a small chooser offers relationship type and subtype
   (defaulting from the connection point: top=parent, bottom=child, side=partner) and creates it.
3. **Given** a connection drag released on empty canvas, **When** released, **Then** the user is
   offered "Add new person here as…" with the same relationship choices.
4. **Given** a connection that would link a member to themselves, duplicate an existing
   relationship, or create a parent-child cycle, **When** the user attempts it, **Then** it is
   blocked with an inline "not allowed" explanation and nothing is saved.
5. **Given** a relationship line, **When** the user selects it, **Then** they can edit or delete
   that relationship; couples show children descending from a junction between the partners.
6. **Given** a selected member, **When** the user hovers its quick-add controls, **Then** they can
   add a parent, child, or partner in one click without opening the context menu.

### User Story 7 - Arrange, Undo, and Recover Quickly (Priority: P2)

As a user, I can auto-arrange the tree, snap and align members, and undo or redo mistakes, so
experimenting with layout and edits is safe.

**Why this priority**: Safe experimentation encourages use of the new freedom but is not needed
for basic navigation and dragging.

**Independent Test**: Auto-arrange a tree, undo it, move and delete members, undo each, and redo.

**Acceptance Scenarios**:

1. **Given** a tree, **When** the user chooses Auto-arrange, **Then** members are laid out
   hierarchically with partners adjacent and every child on a lower row than its parents, positions animate (unless reduced motion), and the
   result is saved as one operation.
2. **Given** snapping is enabled (or Shift is held), **When** a member is dragged, **Then** it
   snaps to a 20px grid and alignment guides appear against nearby members; snapping is off by default.
3. **Given** member moves, additions, deletions, connections, or auto-arrange, **When** the user
   presses Ctrl/Cmd+Z or Shift+Ctrl/Cmd+Z, **Then** the action is undone or redone, including
   restoring a deleted member's relationships.
4. **Given** a member is deleted, **When** deletion completes, **Then** a toast with Undo appears
   instead of a blocking confirmation dialog.
5. **Given** multiple members selected, **When** the user uses align or distribute actions,
   **Then** the selection is aligned or evenly spaced, and saved once.

### User Story 8 - Read Large Trees, Focus, and Share (Priority: P3)

As a user with a large tree, I can see appropriate detail per zoom level, focus on a person's
lineage, collapse branches, remember my view, and export an image.

**Why this priority**: These refine large-tree usability and sharing but are not required for
core editing.

**Independent Test**: Zoom through three detail levels on a 200-member tree, focus on a member,
collapse a branch, reload to confirm the view is restored, and export a PNG and SVG.

**Acceptance Scenarios**:

1. **Given** zoom below 40%, **When** members are shown, **Then** each appears as a compact
   name label; between 40% and 100% it shows photo, name, and dates; above 100% full details —
   with identical card footprint at every level so layout never shifts.
2. **Given** a selected member, **When** the user chooses Focus, **Then** their ancestors and
   descendants are highlighted and others are dimmed until cleared.
3. **Given** a member with descendants, **When** the user collapses the branch, **Then** the
   descendants are hidden and the card shows a "+N" count; expanding restores them; collapse state
   is remembered in this browser. (Lowest priority within this story.)
4. **Given** the user reloads, **When** the tree opens, **Then** the previous zoom/pan, snapping,
   minimap, and scheme settings are restored; first-time visitors see the tree fit to view.
5. **Given** the user selects Export, **When** they choose PNG or SVG, **Then** the full tree
   is downloaded as that image.
6. **Given** relationship labels, **When** zoomed above 100%, **Then** non-default states
   (divorced, widowed, foster, guardian) and marriage year are labeled; below 40% labels are hidden.

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
- Animated fit/zoom and auto-arrange transitions MUST be disabled when reduced motion is preferred.
- A marquee selection that includes no members MUST clear the selection without error.
- Connection drags released outside the canvas MUST cancel cleanly.
- Undo MUST be unavailable (disabled) when history is empty, and history MUST reset on reload.
- Auto-arrange on trees with multiple partners or half-siblings MUST place every member without overlap.
- Collapsing a branch that contains a selected member MUST clear or move the selection sensibly.
- Failed saves (positions, links, deletes) MUST revert the visible change and show an error.

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
  zoom MUST center on the pointer or pinch focal point. Inertial momentum is not required.
- **FR-012**: The canvas MUST support familiar whiteboard input mappings across mouse, trackpad,
  and touch: scroll to zoom at the pointer, pinch to zoom, and drag on empty canvas (or
  space-drag / middle-button drag) to pan; Shift+drag on empty canvas draws a marquee selection.
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
- **FR-018**: All canvas animations (animated zoom/fit and auto-arrange) MUST respect reduced-motion
  preferences.
- **FR-019**: The desktop view MUST NOT show a permanent side panel; all former sidebar actions
  MUST be reachable via the floating toolbar, command palette, filter control, or inspector.
- **FR-020**: The system MUST provide a command palette (Ctrl/Cmd+K or `/`) with member search
  (center and select on choose) and actions: Add person, Auto-arrange, Fit view, Toggle snapping,
  Switch view, Export.
- **FR-021**: Selecting a member MUST open an inspector showing details and relationships with
  quick edit; the full edit dialog remains for advanced fields. On small screens the inspector
  MUST be a bottom drawer and the toolbar MUST sit at the bottom.
- **FR-022**: Dragging a member MUST track the pointer exactly at any zoom/pan level, update
  connected lines live, and save the final position once on release. The system MUST support touch
  and pointer input for dragging.
- **FR-023**: Users MUST be able to create relationships by dragging between members' connection
  points, with a chooser for type/subtype defaulted by connection point, and to add a new related
  person by releasing on empty canvas. The existing dialog remains for advanced relationship fields.
- **FR-024**: The system MUST block self-links, duplicate relationships, and parent-child cycles
  at interaction time with an inline explanation; the server remains the source of truth.
- **FR-025**: Relationship lines MUST be selectable for edit/delete, styled by type/status
  (preserving existing color and dash conventions), and children of a couple MUST descend from
  a junction between the partners' facing edges, derived from existing relationships.
- **FR-026**: The system MUST provide one-click quick-add (parent, child, partner) on the selected
  member.
- **FR-027**: The system MUST provide Auto-arrange producing a hierarchical layout with partners
  adjacent, saved as a single operation, animated unless reduced motion is preferred.
- **FR-028**: The system MUST support optional snap-to-grid (20px) with alignment guides, off by
  default, toggled from the toolbar and temporarily inverted by holding Shift; and align/distribute
  for multi-selection.
- **FR-029**: The system MUST support per-session undo/redo (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z) for move,
  add, delete, connect, and auto-arrange, with deleted members' relationships restored on undo.
  Deletion MUST NOT require a blocking confirmation; an undo toast MUST be shown instead.
- **FR-030**: The system MUST render members at three detail levels by zoom (below 40%, 40–100%,
  above 100%) with a constant card footprint, and show relationship labels only for non-default
  states and marriage year above 100% zoom.
- **FR-031**: The system MUST provide Focus (highlight ancestors/descendants) and branch
  collapse/expand with a "+N" indicator, remembered in this browser.
- **FR-032**: The system MUST persist zoom/pan and view settings (snapping, minimap, wheel
  scheme) in this browser and fit the tree to view on first visit.
- **FR-033**: The system MUST export the full tree as PNG and SVG.
- **FR-034**: The system MUST offer a setting to switch wheel behavior between the default
  scheme (scroll zooms) and a whiteboard scheme (scroll pans, Ctrl/Cmd+scroll zooms).
- **FR-035**: Members MUST be keyboard focusable; arrow keys nudge the selected member (Shift for
  larger steps), Enter opens the inspector, Delete removes with undo, and every toolbar control
  MUST have an accessible name and tooltip.
- **FR-036**: The existing canvas MUST be replaced outright; saved member positions MUST be
  reused without migration.

### Key Entities *(include if feature involves data)*

_No new stored entities._ The couple junction, collapse state, view settings, and undo history
are derived or client-side only. Member positions are batch-updatable as one operation.

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
- **SC-008**: Standard whiteboard input mappings (scroll-zoom, drag-pan, pinch-zoom,
  Shift-drag marquee) work on mouse, trackpad, and touch in testing.
- **SC-009**: Dragging a member keeps it under the pointer (within 2px) at every zoom level
  from 10% to 400% in testing.
- **SC-010**: Drag and zoom sustain at least 60 fps with 200 members and at least 30 fps with 500.
- **SC-011**: A user can create a new relationship between two existing members in under 5 seconds
  and without opening a dialog in at least 90% of usability trials.
- **SC-012**: Auto-arrange of a 100-member tree completes and saves in under 2 seconds, and a
  single undo fully restores prior positions.
- **SC-013**: 100% of former sidebar actions are reachable without a permanent side panel.
- **SC-014**: Any member action (move, add, delete, connect, auto-arrange) can be undone in
  one step in 100% of tested cases.

## Scope Boundaries & Security

- **Frontend-led**: Almost all work is UI. **No database schema or migration changes.** The only
  non-UI changes are small, additive backend items needed for correctness: (1) one batch
  position-update operation (auto-arrange, group move, align/distribute saved atomically),
  (2) one restore operation so undoing a delete returns the member with its original identity,
  relationships, and events, (3) rejection of parent-child cycles on relationship creation, and
  (4) accepting the already-used `guardian` relationship type. Details in
  [contracts/api.md](contracts/api.md).
- **Trust boundary**: browser → API. New inputs (position batches, restore snapshots) are
  untrusted: they MUST be validated (types, bounds, size caps, referential integrity), applied
  atomically, and MUST NOT echo request bodies in errors.
- **Abuse cases**: oversized batches, forged/colliding restore snapshots, dangling references,
  malformed locally stored settings (MUST fall back to defaults).
- **Authentication**: none exists yet (spec 003). New endpoints follow the current unauthenticated
  pattern as a documented, time-boxed exception and MUST adopt shared auth when it lands.

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
- The redesign amends this spec because none of its tasks were implemented; accessibility and
  touch requirements here continue to apply to the new chrome.
- The family tree is a single shared tree (no per-user tree separation) until accounts ship.
- Explicit non-goals (also): dark theme, PDF export, server-side or shared undo history, and
  restyling the Timeline beyond sharing the new top bar and inspector.
- Explicit non-goals: real-time multiplayer, live collaborator cursors, comments, sticky notes,
  freeform drawing, boards/frames, and templates are out of scope for this feature.
