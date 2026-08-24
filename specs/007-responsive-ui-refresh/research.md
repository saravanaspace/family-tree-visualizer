# Phase 0 Research: Responsive UI Refresh

This research resolves the technical unknowns for making the existing client intuitive and
responsive. Findings are grounded in the current implementation.

## Current-State Findings (why the UI is "not intuitive")

- **Mouse-only interaction**: `family-tree-canvas.tsx` handles panning via `onMouseDown`,
  `onMouseMove`, `onMouseUp`, and `document` mouse listeners; zoom is `onWheel` only.
  `family-member-card.tsx` drags with mouse events only. There is no touch or pinch support,
  so the canvas is largely unusable on phones and tablets.
- **No keyboard path for the canvas**: cards are selected and moved only by pointer; there is
  no focus model or keyboard navigation for the graph.
- **Fixed sizing**: the sidebar is a fixed `w-80` (320px), cards are `w-64` (256px), and the
  canvas is `h-screen`. These do not adapt to small viewports.
- **Overlapping fixed controls**: the view toggle (`fixed top-4 right-4`), zoom controls
  (`fixed top-5 right-5`), and mobile menu button (`fixed top-4 left-4`) can overlap each other
  and the canvas on small screens.
- **Sub-target tap sizes**: the card menu trigger is `h-6 w-6` (~24px) and zoom buttons are
  `h-8 w-8` (~32px), below the 44px touch-target guideline.
- **Always-on motion**: hover translate/scale and spin animations do not respect
  `prefers-reduced-motion`.

## Decision: Unified pointer/touch/keyboard interaction via Pointer Events

- **Decision**: Replace separate mouse handlers with a single `use-canvas-gestures` hook built
  on Pointer Events, adding pinch-to-zoom (two-pointer) and keyboard pan/zoom/select.
- **Rationale**: Pointer Events unify mouse, touch, and pen with one code path, reducing
  divergence and fixing touch support without a heavy dependency.
- **Alternatives considered**: keep mouse + add separate touch handlers (duplicated, drift-prone);
  adopt a gesture library (unneeded weight for this scope); adopt a canvas/graph library (out of
  scope, risks regressions to existing SVG rendering).

## Decision: Tailwind breakpoint-driven responsive layout

- **Decision**: Use Tailwind responsive utilities and the existing `use-mobile` hook to make the
  sidebar a drawer on small screens and a docked panel on large screens; make cards and dialogs
  fluid within min/max bounds; reposition controls into a non-overlapping control cluster.
- **Rationale**: Tailwind is already the styling system; leaning on breakpoints avoids new
  tooling and keeps changes localized and reviewable.
- **Alternatives considered**: container queries (limited need at this scope); a new CSS
  framework (violates stack constraint); JS-driven measurement layout (more complexity, less
  predictable).

## Decision: Right-size targets and resolve control placement

- **Decision**: Raise interactive targets to >=44px on touch, and group zoom/reset and view
  toggle into a single responsive control area that never overlaps content or each other.
- **Rationale**: Directly addresses the measured tap-target and overlap problems.
- **Alternatives considered**: leave desktop sizes and only enlarge on touch media (kept as an
  enhancement, but a consistent minimum is simpler and safer).

## Decision: Accessibility baseline WCAG 2.1 AA

- **Decision**: Ensure visible focus, semantic/labeled controls, AA contrast, and
  `prefers-reduced-motion` handling across the refreshed surfaces.
- **Rationale**: Matches the constitution's UX principle and the spec's non-negotiable a11y
  story.
- **Alternatives considered**: defer a11y to a later pass (rejected; it is core to this feature).

## Decision: Frontend component + accessibility testing

- **Decision**: Add jsdom + `@testing-library/react` + `@testing-library/user-event` for
  interaction tests and `jest-axe` for automated a11y assertions, run under the existing Vitest.
- **Rationale**: Provides testable verification of responsive behavior, gestures (via pointer
  events in jsdom), keyboard paths, and a11y, satisfying the verification principle. These are
  dev-only tools that extend, not replace, the current stack.
- **Alternatives considered**: end-to-end browser tests only (heavier, slower to gate); manual
  testing only (not repeatable, fails the verification principle). Visual/gesture nuances that
  jsdom cannot capture are covered by a documented manual checklist in `quickstart.md`.

## Open Items

- Exact breakpoint values and target device matrix to be confirmed during `/speckit-tasks`
  and implementation; defaults follow Tailwind's standard breakpoints.

## Decision: Miro-like whiteboard interaction model

- **Decision**: Adopt a fluid infinite-canvas model with the interaction conventions users know
  from Miro: plain scroll/two-finger swipe pans, Ctrl/Cmd+scroll zooms about the pointer, pinch
  zooms about the midpoint, and space-drag or middle-button drag pans. Panning carries momentum
  and zoom-to-fit animates, both disabled under reduced motion.
- **Rationale**: These conventions match user expectations for a canvas app and directly resolve
  the "not intuitive" feedback; they are implementable on top of the existing transform-based SVG
  canvas without a heavy dependency.
- **Alternatives considered**: keep wheel-only zoom and drag-only pan (the current, unintuitive
  behavior); adopt a full canvas/graph framework (out of scope, regression risk to existing SVG
  rendering and auto-align).

## Decision: Zoom-to-fit, zoom indicator, and focal-point zoom

- **Decision**: Provide a zoom control with a live percentage, zoom in/out, reset to 100%,
  fit-all, and fit-selection; compute fit from the bounding box of member positions with padding,
  clamped to min/max zoom; zoom always recenters on the pointer or pinch focal point.
- **Rationale**: Framing content and showing zoom level are core to navigating large trees and
  are expected whiteboard affordances.
- **Alternatives considered**: fixed zoom steps without fit (leaves users lost in large trees);
  center-only zoom (feels unnatural versus pointer-anchored zoom).

## Decision: Minimap overview

- **Decision**: Add a minimap on larger screens showing the whole tree's bounding area and the
  current viewport rectangle, supporting click/drag to reposition; hide or degrade it on very
  small screens where space is limited.
- **Rationale**: A minimap is the standard way to stay oriented on a large canvas and to jump
  quickly, satisfying the fast-navigation success criterion.
- **Alternatives considered**: breadcrumb/list navigation only (less spatial, weaker for a tree);
  no overview (fails the large-tree orientation goal).

## Decision: Marquee multi-select and group move

- **Decision**: Support rubber-band selection to select multiple members and move them together,
  persisting each moved member's final position exactly once per gesture via the existing
  position endpoint.
- **Rationale**: Group arrangement is a natural whiteboard capability and improves manual layout;
  reusing the existing endpoint avoids any API/schema change.
- **Alternatives considered**: single-select only (tedious for arranging branches); a new bulk
  endpoint (unnecessary; per-member persistence satisfies the contract without a schema change).

## Decision: Contextual selection toolbar

- **Decision**: Show a small contextual toolbar near the active selection with common actions
  (add relation, edit, delete), keyboard reachable and screen-reader labeled.
- **Rationale**: Surfacing actions at the selection reduces reliance on the small per-card
  three-dot menu and improves discoverability, a key intuitiveness gain.
- **Alternatives considered**: keep only the per-card dropdown (low discoverability, small target).

## Scope Boundary: Miro collaboration features excluded

- **Decision**: Implement only the single-user canvas interaction model. Real-time multiplayer,
  collaborator cursors, comments, sticky notes, freeform drawing, boards/frames, and templates
  are out of scope.
- **Rationale**: These belong to collaboration and authoring features (some relate to feature
  003) and would expand this refresh far beyond an intuitive-navigation goal.
