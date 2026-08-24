# Phase 1 Data Model: Responsive UI Refresh

This feature introduces **no new persistent entities** and changes **no database schema**. It
only refreshes presentation and interaction. The only persisted data it touches is the existing
family member position (`x`, `y`), through the existing position-update endpoint, with no change
to that contract.

## UI State (transient, client-only)

The following state is held in the client during interaction and is not persisted by this
feature.

### Viewport state

- **scale**: current zoom factor, clamped to a min/max range.
- **panX / panY**: current canvas translation.
- **inputMode**: derived indicator of the active input (pointer, touch, keyboard) used to tune
  target sizes and affordances.

### Gesture state (managed by `use-canvas-gestures`)

- **activePointers**: map of active pointer ids to positions, enabling single-pointer pan and
  two-pointer pinch.
- **gesture**: one of `idle`, `panning`, `pinching`, `dragging-card`.
- **pinchStart**: initial distance and midpoint captured when a second pointer joins.

### Selection and focus state

- **selectedMemberId**: the currently selected member (existing).
- **focusedMemberId**: the member with keyboard focus for keyboard navigation (new).

### Layout state

- **sidebarOpen**: whether the sidebar drawer is open on small screens (existing).
- **breakpoint**: current responsive breakpoint from the `use-mobile` hook (existing/extended).
- **prefersReducedMotion**: derived from the user's OS/browser preference.

## Validation / Invariants

- **scale** MUST remain within the defined min/max bounds at all times.
- A card drag MUST persist the final position through the existing position endpoint exactly
  once per drag (no intermediate writes).
- Keyboard focus MUST always reference an existing, visible member.
- Reduced-motion state MUST disable non-essential animation when set.
