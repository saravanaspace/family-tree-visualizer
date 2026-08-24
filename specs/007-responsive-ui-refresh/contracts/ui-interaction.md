# UI Interaction & Responsive Contract: Responsive UI Refresh

This is the UI contract for the refreshed surfaces. It defines the observable behavior that
tests and review verify. It replaces external API contracts, which this feature does not change.

## Breakpoints and Layout

| Surface | Small (phone) | Medium (tablet) | Large (desktop) |
|---------|---------------|-----------------|-----------------|
| Sidebar | Off-canvas drawer, toggled by a visible button | Drawer or docked per space | Docked panel |
| Tree canvas | Full width; controls clustered, non-overlapping | Full remaining width | Remaining width beside sidebar |
| Member card | Fluid width within min/max; content wraps | Fluid width | Fixed comfortable width |
| Dialogs | Full-width sheet within viewport; scrolls | Centered, bounded | Centered, bounded |
| Control cluster (zoom/reset/view toggle) | Single non-overlapping group | Single group | Single group |

**Contract**:
- C-L1: At every supported breakpoint, no primary control is hidden, clipped, or overlapped.
- C-L2: The whole page MUST NOT require horizontal scrolling to reach primary controls.
- C-L3: Orientation changes preserve the current view and selection.
- C-L4: Long names, dates, and locations wrap or truncate without breaking layout.

## Gestures and Input (whiteboard model, Miro-like)

**Contract**:
- C-G1: Single-pointer drag on empty canvas pans; on a card drags the card; space-drag or
  middle-button drag always pans.
- C-G2: Pinch (two-pointer) zooms about the pinch midpoint; Ctrl/Cmd+scroll zooms about the
  pointer; plain scroll/trackpad two-finger swipe pans; Shift+scroll pans horizontally.
- C-G3: Canvas gestures MUST NOT hijack normal page scrolling outside the canvas.
- C-G4: A card drag persists its final position exactly once via the existing position endpoint;
  a group move persists each moved member's final position exactly once.
- C-G5: Interactive targets are >=44px in the touch input mode.
- C-G6: Zoom centers on the pointer or pinch focal point and is clamped to the min/max range.
- C-G7: Panning MAY carry momentum; momentum and animated zoom are disabled under reduced motion.

## Zoom Controls and Navigation

**Contract**:
- C-N1: A zoom control shows the current zoom percentage and offers zoom in, zoom out, and reset
  to 100%.
- C-N2: Zoom-to-fit-all frames all content with padding; zoom-to-fit-selection frames the
  current selection.
- C-N3: Empty or single-member trees produce a sensible, bounded fit view.
- C-N4: A minimap on larger screens shows the viewport within the whole tree and supports
  click/drag to reposition; it stays accurate as members change and hides or degrades on very
  small screens.

## Selection

**Contract**:
- C-S1: Clicking a member selects it; clicking empty canvas clears selection.
- C-S2: A marquee (rubber-band) drag selects all enclosed members; an empty marquee clears
  selection without error.
- C-S3: Moving a multi-selection moves all selected members together (C-G4 persistence applies);
  multi-selection supports group move only.
- C-S4: With a single member selected, a contextual toolbar appears near it with common actions
  (add relation, edit, delete) and is keyboard reachable; with multiple members selected, only
  group move is offered.

## Keyboard and Accessibility

**Contract**:
- C-A1: Every interactive control is reachable by keyboard with a visible focus indicator.
- C-A2: Canvas members are keyboard-focusable; arrow-key navigation moves focus between members
  and Enter/Space selects; documented keys pan/zoom the canvas.
- C-A3: Controls and status changes expose accessible names and states to assistive technology.
- C-A4: Text and essential controls meet WCAG 2.1 AA contrast and target-size guidance.
- C-A5: When `prefers-reduced-motion` is set, non-essential animations are disabled.

## Non-Goals

- No change to data, persistence, or REST endpoints beyond the existing position update.
- No new views or features; this is a presentation/interaction refresh of existing surfaces.
- Not building Miro's collaboration surface: no real-time multiplayer, collaborator cursors,
  comments, sticky notes, freeform drawing, boards/frames, or templates.
