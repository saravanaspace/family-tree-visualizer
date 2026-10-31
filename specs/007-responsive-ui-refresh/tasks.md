# Tasks: Responsive UI Refresh & Canvas Workspace

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: Required by constitution (Principle III/IV) for server/shared/pure-logic and key interactions.

**Format**: `- [ ] T### [P?] [US#?] Description with file path` — `[P]` = parallelizable (different files, no dependency on incomplete tasks).

Paths: `client/src/features/tree-canvas/` is abbreviated **`FTC/`** below.

## Phase 1: Setup

- [ ] T001 Add dependencies `@xyflow/react`, `@dagrejs/dagre`, `html-to-image`; dev: `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `vitest-axe` in `package.json`
- [ ] T002 [P] Create folder skeleton `FTC/{nodes,edges,chrome,hooks,lib}` and `FTC/lib/constants.ts` (`CARD_SIZE` 256×128, zoom bounds 0.1–4, detail thresholds 0.4/1.0, snap 20)
- [ ] T003 [P] Add jsdom test setup stubs (`ResizeObserver`, `DOMMatrixReadOnly`) in `client/src/test/setup-dom.ts` and document per-file `@vitest-environment jsdom` pragma in `vitest.config.ts` (keep server tests on `node`)

## Phase 2: Foundational (blocks all stories)

- [ ] T004 [P] Add `'guardian'` to relationship type enum, plus `batchPositionsSchema` and `restoreMemberSchema` (with size/range limits per contracts/api.md) in `shared/schema.ts`
- [ ] T005 [P] Write failing tests for `updateFamilyMemberPositions` (success, unknown id → nothing written, duplicate ids, bounds) in `server/__tests__/positions.test.ts`
- [ ] T006 Implement transactional `updateFamilyMemberPositions` in `server/storage.ts` (depends T004, T005)
- [ ] T007 Add `PATCH /api/family-members/positions` (registered before `/:id` routes) with Zod validation and generic errors in `server/routes.ts` (depends T006)
- [ ] T008a [P] Write Zod schema tests for `batchPositionsSchema`, `restoreMemberSchema` (bounds, caps, duplicates, malformed) in `shared/__tests__/schema.test.ts`
- [ ] T008 [P] Write failing tests for relationship cycle rejection on create in `server/__tests__/relationships.test.ts`
- [ ] T009 Implement parent-child cycle check in `createRelationship` and map to 400 in `server/storage.ts` / `server/routes.ts` (depends T008)
- [ ] T010 [P] Implement pure `toFlow(tree, {collapsed, focusId})` (members→nodes, spouse→union nodes, edges) in `FTC/lib/toFlow.ts` with tests in `FTC/lib/__tests__/toFlow.test.ts`
- [ ] T011 [P] Implement `edgeStyle` map preserving existing colors/dashes in `FTC/lib/edgeStyle.ts`
- [ ] T012 [P] Implement optimistic-mutation helper (snapshot, `setQueryData`, rollback + toast) in `client/src/hooks/use-family-tree.ts`

**Checkpoint**: shared schema, batch endpoint, and pure mapper ready.

## Phase 3: User Story 4 + 6a — Fluid Canvas & Correct Dragging (P1) 🎯 MVP

**Goal**: New canvas with fluid pan/zoom, free drag that tracks the pointer at any zoom, live edges, minimap, zoom controls, marquee group move.

**Independent Test**: quickstart steps 2 and 4 (drag at 25/100/300%, fit, minimap, group move saved once).

- [ ] T013 [P] [US4] `FTC/nodes/PersonNode.tsx` (fixed footprint, gender accent, avatar, handles placeholders) replacing `family-member-card.tsx` visuals
- [ ] T014 [P] [US4] `FTC/nodes/UnionNode.tsx` (small non-draggable junction)
- [ ] T015 [P] [US4] `FTC/edges/RelationshipEdge.tsx` (smooth-step, style from `edgeStyle`)
- [ ] T016 [US4] `FTC/TreeCanvas.tsx`: ReactFlow with dot background, `MiniMap`, zoom bounds, marquee select, `onNodeDragStop`/`onSelectionDragStop` → one batch save with optimistic update (depends T007, T010, T012–T015)
- [ ] T017 [P] [US4] `FTC/chrome/ZoomPanel.tsx`: %, in/out, reset 100%, fit all, fit selection (FR-013, FR-017)
- [ ] T018 [P] [US4] `FTC/hooks/useCanvasSettings.ts`: wheel scheme (whiteboard default / alternate), snap, minimap; Zod-validated `localStorage` (FR-034)
- [ ] T019 [US4] Wire settings to canvas props (`panOnScroll`, `zoomOnScroll`, space/middle pan, reduced-motion disables animated fit/zoom) in `FTC/TreeCanvas.tsx` (FR-011/012/018)
- [ ] T020 [US4] Replace canvas usage in `client/src/pages/family-tree.tsx` (keep sidebar temporarily); delete `components/family-tree-canvas.tsx` and `components/zoom-controls.tsx`
- [ ] T021 [US4] Component test: dragging a node at non-1 zoom saves one position via batch endpoint, in `FTC/__tests__/TreeCanvas.drag.test.tsx` (jsdom)

**Checkpoint (MVP)**: usable canvas; sidebar still present.

## Phase 4: User Story 5 — Floating Chrome (P1)

**Goal**: Remove sidebar; toolbar, top bar, palette, filter, inspector, mobile layout.

**Independent Test**: quickstart steps 1 and 4; every former sidebar action reachable.

- [ ] T022 [P] [US5] Inventory sidebar actions/stats from `components/sidebar-controls.tsx` into `specs/007-responsive-ui-refresh/sidebar-migration.md`, mapping each to toolbar/palette/filter/inspector (SC-013)
- [ ] T023 [P] [US5] `FTC/chrome/LeftToolbar.tsx` (select, hand, add person, connect, auto-arrange, undo/redo) with tooltips and aria-labels
- [ ] T024 [P] [US5] `FTC/chrome/TopBar.tsx` (title, Tree/Timeline switch, search trigger, filter, export menu)
- [ ] T025 [P] [US5] `FTC/chrome/CommandPalette.tsx` using `ui/command.tsx`: fuzzy member search → center+select; actions per FR-020
- [ ] T026 [P] [US5] `FTC/chrome/FilterPopover.tsx` porting existing sidebar filters/search/stats
- [ ] T027 [P] [US5] `FTC/chrome/InspectorPanel.tsx`: details, relationships list, quick edit, link to full `edit-member-modal`; Sheet on desktop, `ui/drawer.tsx` on <768px
- [ ] T028 [US5] `FTC/hooks/useTreeShortcuts.ts`: Ctrl/Cmd+K, `/`, F, 0, Enter, Delete, arrow nudge (batched save) per contracts/ui-interaction.md
- [ ] T029 [US5] Rebuild `client/src/pages/family-tree.tsx` as slim shell: canvas + chrome, mobile bottom toolbar; remove auto-align logic and sidebar; delete `components/sidebar-controls.tsx`
- [ ] T030 [US5] Timeline view shares TopBar + InspectorPanel in `client/src/components/timeline-view.tsx`
- [ ] T031a [US5] Empty-tree, loading, and API-error states for the canvas and inspector (Constitution V) in `FTC/TreeCanvas.tsx`, `FTC/chrome/InspectorPanel.tsx`
- [ ] T031 [US5] Test: palette search selects/centers member and sidebar actions reachable in `FTC/__tests__/chrome.test.tsx`

## Phase 5: User Stories 1–3 — Responsive, Touch, Accessibility (P1/P2/P1)

**Independent Test**: quickstart step 8 plus automated axe checks.

- [ ] T032 [P] [US1] Make add/edit/connect dialogs viewport-fit sheets on small screens in `components/{add,edit,connect}-member-modal.tsx`
- [ ] T033 [P] [US1] Handle long names/dates/locations wrap/truncate in `FTC/nodes/PersonNode.tsx` and `InspectorPanel.tsx`; verify no horizontal page scroll
- [ ] T034 [P] [US2] Touch: enlarge handle hit areas ≥44px on coarse pointers (`client/src/index.css`), long-press context menu via `ui/context-menu.tsx` in `FTC/TreeCanvas.tsx`
- [ ] T035 [P] [US3] Focusable nodes (roving tab), visible focus ring, aria labels, live region for toasts/errors in `PersonNode.tsx` and `client/src/App.tsx`
- [ ] T036 [US3] Honor `prefers-reduced-motion` across chrome transitions (framer-motion `useReducedMotion`) in `FTC/chrome/*`
- [ ] T037 [US3] Axe assertions for chrome (toolbar, palette, inspector) in `FTC/__tests__/a11y.test.tsx`
- [ ] T038 [US1] Verify C-L1…C-L4 at 360/768/1280px manually and record in `quickstart.md` results

## Phase 6: User Story 6 — Connect Visually (P1)

**Goal**: Handles, validation, chooser, edge editing, quick-add, context menus.

**Independent Test**: quickstart step 3.

- [ ] T039 [P] [US6] Write failing tests for `validateLink` (self, duplicate, reversed spouse, cycle, valid) in `FTC/lib/__tests__/validateLink.test.ts`
- [ ] T040 [US6] Implement `validateLink` in `FTC/lib/validateLink.ts` (depends T039)
- [ ] T041 [P] [US6] `FTC/chrome/ConnectPopover.tsx`: type/subtype chooser (parent, child, partner, guardian; biological/adopted/foster/step/legal), default by handle side
- [ ] T042 [US6] Enable handles in `PersonNode`; `onConnect`/`onConnectEnd` in `TreeCanvas.tsx`: validate → popover → create relationship (optimistic); release on empty canvas → "Add new person here as…" via `add-member-modal` with pre-filled position (depends T040, T041)
- [ ] T043 [US6] Inline invalid-link hint (connection line turns red + message) in `TreeCanvas.tsx`
- [ ] T044 [P] [US6] Edge selection: edit/delete relationship from `RelationshipEdge` toolbar using existing relationship PATCH/DELETE
- [ ] T045 [P] [US6] Selected-node contextual toolbar (quick-add parent/child/partner, edit, delete) using `NodeToolbar` in `PersonNode.tsx` (FR-016, FR-026)
- [ ] T046 [P] [US6] Context menus for node, edge, canvas in `FTC/chrome/ContextMenus.tsx`
- [ ] T047 [US6] Union-node routing: children of a couple originate at junction (in `toFlow`) with unit tests added to `toFlow.test.ts`
- [ ] T048 [US6] Component test: drag handle A→B creates relationship; A→A, duplicate, cycle blocked, in `FTC/__tests__/connect.test.tsx`

## Phase 7: User Story 7 — Arrange, Snap, Undo (P2)

**Independent Test**: quickstart step 5.

- [ ] T049 [P] [US7] Tests for `layout` (partners adjacent, multi-spouse, half-siblings, no overlap) in `FTC/lib/__tests__/layout.test.ts`
- [ ] T050 [US7] Implement dagre `layout` in `FTC/lib/layout.ts` (depends T049); wire Auto-arrange (animated, one batch save) in `TreeCanvas.tsx`
- [ ] T051 [P] [US7] Snap-to-grid toggle + Shift invert + alignment guides; align/distribute for multi-selection in `TreeCanvas.tsx` and `LeftToolbar.tsx`
- [ ] T052 [P] [US7] Tests for restore (success keeps original ids, dangling ref 400, id collision 409, rollback on failure) in `server/__tests__/restore.test.ts`
- [ ] T053 [US7] Implement transactional `restoreFamilyMember` in `server/storage.ts` and `POST /api/family-members/restore` in `server/routes.ts` (depends T004, T052)
- [ ] T054 [P] [US7] Tests for undo stack (push/undo/redo/depth cap/clear) in `FTC/hooks/__tests__/useUndoRedo.test.ts`
- [ ] T055 [US7] Implement `FTC/hooks/useUndoRedo.ts`; register commands for move, add, delete, connect, edge-delete, auto-arrange; Ctrl/Cmd+Z / Shift+Z (depends T053, T054)
- [ ] T056 [US7] Replace `window.confirm` delete with undo toast using delete snapshot + restore endpoint; disabled undo/redo states in toolbar

## Phase 8: User Story 8 — Scale, Focus, Persist, Export (P3)

**Independent Test**: quickstart steps 6, 7, 9.

- [ ] T057 [P] [US8] Semantic zoom detail variants (<40%, 40–100%, >100%) with constant footprint in `PersonNode.tsx`; edge label rules in `RelationshipEdge.tsx`
- [ ] T058 [P] [US8] `FTC/lib/focus.ts` (ancestors/descendants) + tests; Focus action dims others
- [ ] T059 [P] [US8] `FTC/lib/collapse.ts` (descendant hiding, "+N") + tests; persist `ftv.collapsed`
- [ ] T060 [P] [US8] `FTC/hooks/useViewportPersist.ts`: save/restore viewport; fit on first visit; corrupt data → defaults (test)
- [ ] T061 [P] [US8] `FTC/hooks/useExport.ts`: PNG/SVG of full tree via `getNodesBounds` + `html-to-image`; wire to TopBar and palette
- [ ] T062 [US8] Dev-only stress fixture (200/500 members) in `server/seed.ts` or `client/src/test/stress-fixture.ts`; record fps, auto-arrange time (<2 s, SC-012) and connect-in-<5 s trial (SC-011) in `quickstart.md`
- [ ] T063 [US8] Performance pass: `React.memo` nodes, selectors, `onlyRenderVisibleElements` if 500-node target missed

## Phase 9: Polish & Cross-Cutting

- [ ] T064 [P] Delete leftovers: `components/family-member-card.tsx`, unused imports; confirm no references (`npm run check`)
- [ ] T065 [P] Update `README.md` with new interactions and shortcuts
- [ ] T066 Run full `npx vitest run` and `npm run check`; fix failures
- [ ] T067 Execute every quickstart scenario; check off results and update spec/plan if delivered behavior differs (constitution workflow)
- [ ] T068 Security review pass on batch/restore endpoints (bounds, size caps, no echo of bodies) and `localStorage` parsing

## Dependencies & Order

- Setup → Foundational → **US4/6a (MVP)** → US5 → (US1–3, US6 in parallel) → US7 → US8 → Polish.
- US6 depends on US4 canvas and US5 inspector only for edge/quick-add UI; US7 undo (T055) depends on restore (T053) and on US6 actions to register.
- Server tasks (T005–T009, T052–T053) are independent of client tasks and can run in parallel.

## Parallel Examples

- After T004: T005, T008, T010, T011, T012 together.
- US4: T013, T014, T015, T017, T018 together, then T016.
- US5: T023–T027 together.
- US7: T049, T051, T052, T054 together.
- US8: T057–T061 together.

## Implementation Strategy

1. **MVP** = Phases 1–3 (drag/zoom fixed on the new canvas, one batch save). Ship/validate.
2. Add chrome (Phase 4–5) to deliver the Miro/n8n feel and remove the sidebar.
3. Add connect (6), then arrange/undo (7), then scale/share (8).
4. Each phase ends with its quickstart checkpoint and checked tasks per the constitution.

**Totals**: 70 tasks (T008a and T031a added) — Setup 3, Foundational 10, US4 9, US5 11, US1–3 7, US6 10, US7 8, US8 7, Polish 5.
