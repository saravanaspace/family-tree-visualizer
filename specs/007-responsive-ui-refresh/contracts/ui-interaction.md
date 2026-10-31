# UI Interaction & Layout Contract

Observable behavior verified by tests and review. IDs are referenced from `tasks.md`.

## Layout

- C-L1: Desktop (≥768px) has no permanent side panel; canvas fills viewport.
- C-L2: Floating chrome: left toolbar, top bar (title, Tree/Timeline switch, search trigger, filter,
  export), bottom-left zoom panel + minimap, right inspector (opens on selection).
- C-L3: <768px: toolbar at bottom, inspector as bottom drawer, minimap hidden or collapsed.
- C-L4: No primary control is hidden, clipped, or overlapped at any supported breakpoint; no page-level
  horizontal scroll; orientation change preserves view and selection.

## Input mappings

| Input | Whiteboard scheme (default) | Alternate scheme |
|-------|----------------------------|------------------|
| Wheel / two-finger swipe | Pan | Zoom at pointer |
| Ctrl/Cmd + wheel, pinch | Zoom at pointer/pinch center | Zoom |
| Space-drag, middle-drag, hand tool | Pan | Pan |
| Drag on empty canvas | Marquee select | Marquee select |
| Drag on member | Move (follows pointer ±2px at all zooms) | same |
| One-finger drag on empty canvas (touch) | Pan | Pan |
| Long-press | Context menu | Context menu |

- C-G1: Zoom clamped 10%–400%; fit-to-view pads content; empty/single-member trees give a bounded view.
- C-G2: Drag saves exactly once on release; live edges during drag.
- C-G3: Canvas gestures do not hijack page scroll outside the canvas.

## Connect & edit

- C-E1: Handles: top=parent, bottom=child, sides=partner. Release on member → chooser; on empty → "Add new person here as…".
- C-E2: Invalid links (self, duplicate, cycle) show an inline "not allowed" hint; nothing is saved.
- C-E3: Selecting an edge exposes edit/delete; hover on selected member shows quick-add parent/child/partner.
- C-E4: Multi-select supports group move, align, distribute; add/edit/delete act on single selection.

## Commands & shortcuts

| Key | Action |
|-----|--------|
| Ctrl/Cmd+K or `/` | Command palette |
| Ctrl/Cmd+Z / Shift+Ctrl/Cmd+Z | Undo / redo |
| Delete | Delete selected (undo toast, no confirm) |
| Enter | Open inspector for focused member |
| Arrows (+Shift) | Nudge selected 1px/10px; saves once after 300ms idle or key release |
| F / 0 | Fit view / reset zoom 100% |
| Shift (held while dragging) | Invert snapping |

## Detail levels (constant 256×128 footprint)

- <40%: name label only; 40–100%: photo, name, dates; >100%: full details. Edge labels only for
  non-default states and marriage year >100%; hidden <40%.

## Accessibility

- C-A1: Members are focusable (roving tab), all controls labelled with tooltips, visible focus ring.
- C-A2: Reduced motion disables animated fit/zoom and auto-arrange animation.
- C-A3: Chrome meets WCAG 2.1 AA contrast; touch targets ≥44px; status changes (undo toast, errors) are announced via live region.

## Persistence

- C-P1: Zoom/pan, snap, minimap, scheme persist in `localStorage`; first visit fits to view; corrupt data falls back to defaults.
