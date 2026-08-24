# Implementation Plan: Responsive UI Refresh

**Branch**: `007-responsive-ui-refresh` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-responsive-ui-refresh/spec.md`

## Summary

Refresh the presentation and interaction of the existing family-tree client so the core
tree, timeline, and member-management views are intuitive and usable across mobile, tablet,
and desktop, adopting a modern infinite-whiteboard canvas model similar to Miro. The approach
is a frontend-only change: introduce a fluid pan/zoom canvas (momentum, zoom about the focal
point, standard scroll/Ctrl-scroll/pinch/space-drag mappings), a zoom indicator with
zoom-to-fit, a minimap, marquee multi-select with group move, and a contextual toolbar; make
layout responsive; right-size controls and tap targets; and add automated component and
accessibility checks. Miro's collaboration surface (multiplayer, cursors, comments, sticky
notes, drawing, boards) is explicitly out of scope. No data model, API, or persistence changes
are required beyond the existing member position endpoint.

## Technical Context

**Language/Version**: TypeScript 5.6 on React 18.3

**Primary Dependencies**: Vite 5, Tailwind CSS 3, Radix UI (shadcn/ui), TanStack Query,
Wouter, lucide-react

**Storage**: N/A for this feature (no schema or persistence changes; member positions continue
to use the existing REST endpoint)

**Testing**: Vitest; add jsdom + @testing-library/react + @testing-library/user-event for
component/interaction tests and jest-axe for automated accessibility assertions

**Target Platform**: Modern evergreen browsers on mobile, tablet, and desktop (touch and
pointer input)

**Project Type**: Web application (existing `client/` frontend + `server/` backend); this
feature touches the frontend only

**Performance Goals**: Sustain ~60 fps during pan/zoom (including momentum and animated
zoom-to-fit) on a mid-range mobile device for trees up to ~100 members; view switches feel
instant (<100 ms perceived)

**Constraints**: No regressions to existing baseline behavior; respect `prefers-reduced-motion`
(disables momentum and animated zoom); meet WCAG 2.1 AA contrast, visible focus, and >=44px
touch targets; no new persistent state

**Scale/Scope**: Core surfaces only — tree canvas (fluid pan/zoom, minimap, zoom indicator,
marquee select, contextual toolbar), member card, sidebar controls, view toggle, and the
add/edit/connect dialogs; typical trees up to ~100 members

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — `spec.md` exists with prioritized stories and
  acceptance criteria; `plan.md` here; `tasks.md` to follow via `/speckit-tasks`.
- **II. Consistent Type-Safe Stack**: PASS — remains TypeScript/React/Tailwind/Radix. Added
  dev-only test libraries (jsdom, Testing Library, jest-axe) extend the existing Vitest tooling
  and introduce no runtime stack change. No shared schema or DB change.
- **III. Behavior-Driven Verification**: PASS — each acceptance criterion maps to a component,
  interaction, or accessibility test; `npm run check` and the test suite gate completion.
- **IV. Reliable Integration Boundaries**: PASS — the only crossed boundary is the existing
  position-update endpoint, exercised by existing behavior; interaction changes are covered by
  component/interaction tests. No new API or storage contract.
- **V. Accessible, Responsive, and Focused UX**: PASS — this feature is the direct embodiment
  of the principle; scope is limited to presentation/interaction with no unrelated redesign.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/007-responsive-ui-refresh/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (UI state only; no persistent entities)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output (UI interaction & responsive contract)
│   └── ui-interaction.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/
├── index.html
└── src/
    ├── App.tsx                     # route shell; verify responsive container
    ├── index.css                   # design tokens; add breakpoint/reduced-motion helpers
    ├── pages/
    │   └── family-tree.tsx         # layout shell, sidebar toggle, control placement
    ├── components/
    │   ├── family-tree-canvas.tsx  # fluid pan/zoom, marquee select, focal-point zoom
    │   ├── family-member-card.tsx  # touch drag, larger tap targets, focus/keyboard
    │   ├── sidebar-controls.tsx    # responsive sidebar, selected-member context
    │   ├── zoom-controls.tsx       # zoom %, in/out, reset, fit-all, fit-selection
    │   ├── canvas-minimap.tsx      # NEW: overview minimap with viewport reposition
    │   ├── selection-toolbar.tsx   # NEW: contextual actions near the selection
    │   ├── timeline-view.tsx       # responsive timeline layout
    │   ├── add-member-modal.tsx    # mobile-friendly dialog sizing/focus
    │   ├── connect-members-modal.tsx
    │   ├── edit-member-modal.tsx
    │   └── ui/                      # shared shadcn primitives (extend, do not fork)
    └── hooks/
        ├── use-mobile.tsx          # existing breakpoint hook; reuse/extend
        ├── use-canvas-gestures.ts  # NEW: pointer/touch/keyboard + momentum + input mappings
        └── use-canvas-viewport.ts  # NEW: zoom bounds, zoom-to-fit, focal-point zoom, minimap math

client/src/**/__tests__/           # NEW: component, interaction, and a11y tests (Vitest)
```

**Structure Decision**: Single existing web application; all work lands in `client/src`. Shared
interaction logic is consolidated into a `use-canvas-gestures` hook (pointer/touch/keyboard,
momentum, and whiteboard input mappings) and a `use-canvas-viewport` hook (zoom bounds,
focal-point zoom, zoom-to-fit, minimap math) so all input paths stay consistent. The minimap and
contextual selection toolbar are new presentational components. Frontend component tests are
added alongside components under `__tests__/`, mirroring the existing server test convention.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
