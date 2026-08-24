---
description: "Task list for Core Family Tree Baseline and Improvements"
---

# Tasks: Core Family Tree Baseline and Improvements

**Input**: Design documents from `/specs/001-core-family-tree/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rest-api.md

**Tests**: Included (constitution requires behavior-driven verification).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story the task serves (US1, US2, US3)

## Path Conventions

- Web app: client in `client/src/`, server in `server/`, shared in `shared/`.

## Phase 1: Setup

- [ ] T001 Confirm test database and Vitest setup work via `server/__tests__/setup.ts` and `npm test`
- [ ] T002 [P] Add a shared error type and codes in `shared/errors.ts` (validation_error, not_found, conflict, internal_error)

## Phase 2: Foundational (blocking)

- [ ] T003 Fix Drizzle date typing in `server/storage.ts` so inserts/updates type-check
- [ ] T004 [P] Fix `unknown` error handling in `server/seed.ts`
- [ ] T005 [P] Fix layout typing and `getSpouseGroup` argument bug in `client/src/pages/family-tree.tsx`
- [ ] T006 Add centralized Express error middleware in `server/routes.ts` emitting the shared error shape
- [ ] T007 Ensure `npm run check` passes after T003–T006

## Phase 3: User Story 1 — Manage Family Members (P1)

**Goal**: Reliable member CRUD with consistent errors.
**Independent test**: Create, edit, reload, and delete a member; dependent data is removed.

- [ ] T008 [P] [US1] Add member domain-validation tests in `server/__tests__/storage.test.ts` (missing name, invalid email)
- [ ] T009 [US1] Enforce member field validation and typed errors in `server/storage.ts`
- [ ] T010 [US1] Return the shared error shape for member routes in `server/routes.ts`
- [ ] T011 [P] [US1] Add member deletion cascade test (relationships + event membership) in `server/__tests__/storage.test.ts`

## Phase 4: User Story 2 — Relationships and Events (P1)

**Goal**: Domain-valid relationships and events.
**Independent test**: Reject self/duplicate relationships; missing-member refs return clear errors.

- [ ] T012 [P] [US2] Add relationship domain rules tests (self-relationship, duplicate, missing member) in `server/__tests__/storage.test.ts`
- [ ] T013 [US2] Implement relationship domain validation in `server/storage.ts` (no self-link, reject duplicate, verify member refs)
- [ ] T014 [US2] Surface relationship conflicts as `conflict`/`validation_error` in `server/routes.ts`
- [ ] T015 [P] [US2] Add event validation tests (missing member ref, undated event) in `server/__tests__/storage.test.ts`
- [ ] T016 [US2] Validate event member references in `server/storage.ts`

## Phase 5: User Story 3 — Explore Visually (P1)

**Goal**: Unusual graphs render without error.
**Independent test**: Disconnected, multi-root, and cyclic data render and compute stats safely.

- [ ] T017 [P] [US3] Add tests for disconnected/multi-root/cyclic graph handling in `client/src/pages/__tests__/family-tree.test.tsx`
- [ ] T018 [US3] Harden auto-align and stats for cycles/multiple roots in `client/src/pages/family-tree.tsx` and `client/src/components/sidebar-controls.tsx`
- [ ] T019 [P] [US3] Add timeline test for undated events in `client/src/components/__tests__/timeline-view.test.tsx`

## Phase 6: Polish & Cross-Cutting

- [ ] T020 [P] Align `server/routes.ts` remaining endpoints to the shared error shape
- [ ] T021 [P] Update `README.md` error-handling and validation notes
- [ ] T022 Run full `npm test` and `npm run check`; confirm green

## Dependencies

- Setup (T001–T002) → Foundational (T003–T007) → US1 (T008–T011) → US2 (T012–T016) → US3 (T017–T019) → Polish.
- US1–US3 are independently testable once Foundational is complete.

## Parallel Execution Examples

- After T007: run T008, T011, T012, T015, T017, T019 in parallel (separate test files).

## Implementation Strategy

- MVP = Foundational + US1 (member CRUD with consistent errors and passing check gate).
- Deliver US2 and US3 incrementally; each ends with green tests and `npm run check`.
