---
description: "Task list for Responsive UI Refresh (Miro-like canvas)"
---

# Tasks: Responsive UI Refresh

**Input**: Design documents from `/specs/007-responsive-ui-refresh/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-interaction.md

**Tests**: Included (component, interaction, and accessibility tests via Vitest + Testing Library + jest-axe).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4

## Path Conventions

- Client in `client/src/` (components, hooks); tests under `client/src/**/__tests__/`.

## Phase 1: Setup

- [ ] T001 Add dev test tooling (jsdom, @testing-library/react, @testing-library/user-event, jest-axe) and configure in `vitest.config.ts`
- [ ] T002 [P] Add breakpoint and reduced-motion helpers/tokens in `client/src/index.css` and extend `client/src/hooks/use-mobile.tsx`

## Phase 2: Foundational (blocking)

- [ ] T003 Create `use-canvas-viewport` hook (zoom bounds, focal-point zoom, zoom-to-fit, minimap math) in `client/src/hooks/use-canvas-viewport.ts`
- [ ] T004 Create `use-canvas-gestures` hook (Pointer Events, pinch, momentum, input mappings, keyboard) in `client/src/hooks/use-canvas-gestures.ts`
- [ ] T005 [P] Add viewport/gesture unit tests in `client/src/hooks/__tests__/use-canvas-viewport.test.ts` and `use-canvas-gestures.test.ts`

## Phase 3: User Story 1 — Core Views on Mobile (P1)

**Goal**: Tree, timeline, and member management usable on small screens.
**Independent test**: Complete member/relationship flows at mobile size; no clipped/overlapped controls.

- [ ] T006 [P] [US1] Add responsive layout tests (no hidden/clipped/overlapped controls) in `client/src/pages/__tests__/family-tree.layout.test.tsx`
- [ ] T007 [US1] Make sidebar a drawer on small screens and dock on large in `client/src/pages/family-tree.tsx`
- [ ] T008 [US1] Consolidate zoom/view-toggle into one non-overlapping control cluster in `client/src/pages/family-tree.tsx`
- [ ] T009 [P] [US1] Make cards and dialogs fluid within min/max in `client/src/components/family-member-card.tsx` and modal components

## Phase 4: User Story 4 — Whiteboard Canvas (P1)

**Goal**: Miro-like fluid pan/zoom, minimap, marquee move, contextual toolbar.
**Independent test**: Pan/zoom with standard mappings; fit + minimap reach any member; marquee group-move persists.

- [ ] T010 [P] [US4] Add gesture/zoom/minimap/selection interaction tests in `client/src/components/__tests__/family-tree-canvas.test.tsx`
- [ ] T011 [US4] Integrate gestures + viewport into the canvas (focal-point zoom, momentum, input mappings) in `client/src/components/family-tree-canvas.tsx`
- [ ] T012 [US4] Add zoom controls (percentage, in/out, reset, fit-all, fit-selection) in `client/src/components/zoom-controls.tsx`
- [ ] T013 [P] [US4] Build the minimap in `client/src/components/canvas-minimap.tsx`
- [ ] T014 [US4] Implement marquee multi-select with group move persisted once per member in `client/src/components/family-tree-canvas.tsx`
- [ ] T015 [US4] Build the contextual toolbar (single-select add/edit/delete; multi-select move only) in `client/src/components/selection-toolbar.tsx`

## Phase 5: User Story 2 — Touch Interaction (P2)

**Goal**: Natural touch pan/zoom/select without scroll conflicts.
**Independent test**: One-finger pan, two-finger pinch; targets tappable; no page-scroll hijack.

- [ ] T016 [P] [US2] Add touch-target and gesture-isolation tests in `client/src/components/__tests__/family-tree-canvas.touch.test.tsx`
- [ ] T017 [US2] Enforce >=44px touch targets and touch drag on cards in `client/src/components/family-member-card.tsx`

## Phase 6: User Story 3 — Accessibility (P1)

**Goal**: Keyboard, focus, names/states, contrast, reduced motion.
**Independent test**: Keyboard reaches all controls incl. canvas members; jest-axe passes; reduced motion honored.

- [ ] T018 [P] [US3] Add keyboard-nav and jest-axe tests in `client/src/components/__tests__/canvas-a11y.test.tsx`
- [ ] T019 [US3] Add keyboard focus/selection for canvas members in `client/src/components/family-tree-canvas.tsx`
- [ ] T020 [US3] Apply reduced-motion handling to momentum/animated zoom in `client/src/hooks/use-canvas-gestures.ts`

## Phase 7: Polish & Cross-Cutting

- [ ] T021 [P] Verify long/overflowing content wraps/truncates in cards and lists
- [ ] T022 Run `npm test` and `npm run check`; confirm green and jest-axe clean

## Dependencies

- Setup (T001–T002) → Foundational (T003–T005) → US1 (T006–T009) → US4 (T010–T015) → US2 (T016–T017) → US3 (T018–T020) → Polish.
- US1 (layout) and US4 (canvas) are the P1 core; US3 accessibility is a P1 gate verified across stories.

## Parallel Execution Examples

- After T005: run T006, T010, T016, T018 (separate test files) in parallel.
- T013 (minimap) and T015 (toolbar) can proceed in parallel with T011 once hooks exist.

## Implementation Strategy

- MVP = US1 + US4 (responsive layout + fluid whiteboard canvas) with US3 accessibility gates.
- No data/schema/API changes; group move reuses the existing position endpoint.
