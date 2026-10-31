# Implementation Plan: Responsive UI Refresh & Canvas Workspace

**Branch**: `007-responsive-ui-refresh` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Amended feature specification (canvas workspace redesign, 2026-10-31)

## Summary

Replace the hand-rolled tree canvas with a graph-canvas library (React Flow) so the tree behaves
like Miro/n8n: infinite pan/zoom, free drag with live edges, drag-to-connect, marquee select,
minimap, and floating chrome (toolbar, command palette, inspector) instead of a permanent
sidebar. Add client-side undo/redo, dagre auto-arrange, snapping, semantic zoom, and PNG/SVG
export. Backend changes are small: a batch position endpoint and a restore endpoint (for undoing
member deletes). No schema change.

## Technical Context

**Language/Version**: TypeScript 5.6 on React 18.3; Node/Express server (unchanged)

**Primary Dependencies (new)**: `@xyflow/react` (canvas, MIT), `@dagrejs/dagre` (layout),
`html-to-image` (PNG/SVG export). Existing: Vite, Tailwind, Radix/shadcn (`command`, `drawer`,
`context-menu`, `sheet`, `tooltip`), TanStack Query, framer-motion, lucide-react.

**Storage**: Existing PostgreSQL/Drizzle, **no schema change**. Positions remain `x`,`y` on
`family_members`. Viewport, settings, collapse state in `localStorage`. Undo history in memory.

**Testing**: Vitest (existing). Pure-logic tests run in the existing `node` environment. Add
`jsdom` + `@testing-library/react` + `@testing-library/user-event` for one drag-to-connect
component test, and `vitest-axe` for chrome a11y assertions, via a per-file
`// @vitest-environment jsdom` pragma so server tests are unaffected.

**Target Platform**: Evergreen browsers; touch and pointer input; tablets ≥768px use desktop layout.

**Project Type**: Web app; mostly `client/`, plus two endpoints in `server/` and shared schemas
in `shared/`.

**Performance Goals**: 60 fps drag/zoom at 200 members, ≥30 fps at 500; auto-arrange + save of 100
members < 2 s.

**Constraints**: Respect `prefers-reduced-motion`; WCAG 2.1 AA for chrome; ≥44px touch targets;
use theme tokens (no hard-coded colors) so a later dark theme is cheap.

**Scale/Scope**: Single shared tree, typically <200 members.

### Known pre-existing issue to resolve in this feature

Client code and styles use relationship types `guardian` (and `adopted` as a type), but
`insertRelationshipSchema` only allows `parent-child | spouse | adopted | step-parent`.
`guardian` links created from the existing UI would fail validation. The connect chooser must
only offer values the schema accepts; decision recorded in [research.md](research.md) (R-9):
extend the shared enum with `guardian` (additive, no DB migration since `type` is a varchar).

## Constitution Check

- **I. Traceability**: PASS — spec/plan/tasks maintained; old plan/tasks regenerated.
- **II. Type-safe stack**: PASS with note — adds three client dependencies, no stack replacement
  (React/Express/Drizzle/Zod retained). New API payloads are Zod-validated in `shared/`.
  Constitution "Technical Constraints" forbids replacing the stack, not adding libraries.
- **III. Behavior-driven verification**: PASS — Vitest tests for batch/restore endpoints
  (success, validation failure, missing id, rollback), plus pure modules (`toFlow`, `layout`,
  link validation, undo stack). `npm run check` + tests gate completion.
- **IV. Integration boundaries**: PASS — batch and restore endpoints get storage-level integration
  tests (relationship/event integrity on restore); drag-to-connect has a component test.
- **V. Accessible, responsive UX**: PASS — keyboard nudge/delete/enter, labelled controls,
  reduced motion, empty/loading/error states retained. Scope is directly the stated redesign.
- **VI. Security by design**: PASS WITH ACCEPTED EXCEPTION (no authentication on state-changing endpoints until spec 003; consistent with all existing endpoints) — new endpoints validate with Zod (bounded array size, finite
  numbers, positive integer ids), return generic errors, add no secrets/logging of member data.
  Trust boundary and abuse cases (oversized batch, forged restore snapshot, id collision) in
  [research.md](research.md) R-8. Auth is out of scope here (spec 003); new endpoints MUST use the
  same auth middleware once it exists.

Result: no unjustified violations. Post-design re-check: still PASS.

## Project Structure

### Documentation

```text
specs/007-responsive-ui-refresh/
├── spec.md  plan.md  research.md  data-model.md  quickstart.md
├── contracts/
│   ├── ui-interaction.md       # UI behavior contract
│   └── api.md                  # batch positions + restore endpoints
└── tasks.md                    # /speckit-tasks
```

### Source Code

```text
shared/schema.ts                        # + batchPositionsSchema, restoreMemberSchema, 'guardian' type

server/
├── routes.ts                           # + PATCH /api/family-members/positions, POST /api/family-members/restore
├── storage.ts                          # + updateFamilyMemberPositions (transaction), restoreFamilyMember (transaction)
└── __tests__/                          # storage + route-validation tests

client/src/
├── pages/family-tree.tsx               # slim shell: canvas + chrome; auto-align logic removed
├── features/tree-canvas/
│   ├── TreeCanvas.tsx                  # ReactFlow wrapper, handlers, settings
│   ├── nodes/PersonNode.tsx            # replaces family-member-card.tsx (3 detail levels, handles, quick-add)
│   ├── nodes/UnionNode.tsx             # couple junction (derived)
│   ├── edges/RelationshipEdge.tsx      # styled by type/status, labels, selectable
│   ├── chrome/{LeftToolbar,TopBar,ZoomPanel,InspectorPanel,CommandPalette,FilterPopover,ConnectPopover}.tsx
│   ├── hooks/{useTreeGraph,useUndoRedo,useViewportPersist,useTreeShortcuts,useCanvasSettings,useExport}.ts
│   └── lib/{toFlow,layout,validateLink,focus,collapse,constants,edgeStyle}.ts   # pure, unit-tested
├── components/{add,edit,connect}-member-modal.tsx   # kept (advanced fields)
├── components/timeline-view.tsx        # shares TopBar + inspector only
└── (removed) family-tree-canvas.tsx, family-member-card.tsx, zoom-controls.tsx, sidebar-controls.tsx
```

**Structure Decision**: Feature-folder `client/src/features/tree-canvas/` keeps the canvas
cohesive; logic that can silently break lives in pure `lib/` modules with unit tests; React
components stay thin. Sidebar capabilities (stats, search, filters) are redistributed to the
palette, filter popover, and inspector, then the old files are deleted in the cut-over (no flag,
per spec FR-036).

## Delivery Phases (map to spec stories)

1. **Foundation (US6 core, SC-009)**: React Flow canvas, `toFlow`, PersonNode/Edge, correct
   drag, batch positions endpoint, optimistic updates. Fixes today's zoom/drag bug.
2. **Chrome (US5, US1–3)**: remove sidebar; toolbar, top bar, palette, inspector, mobile drawer,
   a11y, touch, wheel-scheme setting.
3. **Connect (US6)**: handles, validation, chooser, union nodes, edge editing, quick-add, context menus.
4. **Power (US7)**: dagre auto-arrange, snapping/guides, align/distribute, undo/redo + restore endpoint.
5. **Scale & share (US8)**: semantic zoom, focus, collapse, persistence, export, perf fixture.

## Complexity Tracking

| Item | Why needed | Simpler alternative rejected because |
|------|------------|--------------------------------------|
| Three new client deps | Cursor-anchored zoom, touch, marquee, handles, minimap are large and bug-prone to hand-build | Extending the custom canvas repeats the current drag/zoom bugs |
| Restore endpoint | Undo of delete must recreate member with original id/relationships/events | Re-POSTing creates new ids, breaking relationship/event references and redo |
