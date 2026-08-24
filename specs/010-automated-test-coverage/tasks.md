---
description: "Task list for Automated Test Coverage Expansion"
---

# Tasks: Automated Test Coverage Expansion

**Input**: Design documents from `/specs/010-automated-test-coverage/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/test-plan-contract.md

**Tests**: This feature's deliverable *is* tests — every task below creates or configures automated tests and coverage.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3

## Path Conventions

- Server/contract tests under `server/__tests__/`; component tests under `client/src/components/__tests__/`; test helpers under `client/src/test/`; config in `vitest.config.ts`.

## Phase 1: Setup

- [ ] T001 Add dev dependencies (`supertest`, `@types/supertest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) to `package.json`
- [ ] T002 Configure two Vitest projects — `server` (node env + existing `server/__tests__/setup.ts` test DB) and `client` (jsdom env + client setup) — in `vitest.config.ts`
- [ ] T003 [P] Create client test setup (Testing Library matchers + jest-dom) in `client/src/test/setup-client.ts`

## Phase 2: Foundational (blocking)

- [ ] T004 Create test data factories (`makeMember`, `makeRelationship`, `makeEvent`) in `server/__tests__/factories.ts`
- [ ] T005 [P] Create `renderWithProviders` helper (QueryClient + required providers; stub network at the query/fetch layer) in `client/src/test/render.tsx`
- [ ] T006 Provide a test app entry for supertest (prefer feature 009 `createApp`; otherwise a harness over `registerRoutes` plus a minimal error handler) in `server/__tests__/contract/app.ts`

## Phase 3: User Story 1 — Protect API Contracts (P1)

**Goal**: Every endpoint has contract tests for success, validation-failure, and not-found, run against the real app + isolated test DB.
**Independent test**: The contract suite passes for all endpoints; a deliberate breaking change fails at least one test.

- [ ] T007 [P] [US1] Contract tests for `GET /api/family-tree` and member endpoints (success/validation/not-found) in `server/__tests__/contract/members.test.ts`
- [ ] T008 [P] [US1] Contract tests for relationship endpoints (success/validation/not-found) in `server/__tests__/contract/relationships.test.ts`
- [ ] T009 [P] [US1] Contract tests for event endpoints (success/validation/not-found) in `server/__tests__/contract/events.test.ts`

## Phase 4: User Story 2 — Protect Key UI Behavior (P1)

**Goal**: Core components have render tests and their key interactions have interaction tests.
**Independent test**: Each core component renders in a test; identified interactions assert resulting behavior; breaking a component fails its test.

- [ ] T010 [P] [US2] Render + submit interaction tests for add/edit/connect member modals in `client/src/components/__tests__/member-modals.test.tsx`
- [ ] T011 [P] [US2] Render + control tests for `family-member-card` and `sidebar-controls` in `client/src/components/__tests__/member-card-sidebar.test.tsx`
- [ ] T012 [P] [US2] Render + interaction tests for `zoom-controls` and `timeline-view` in `client/src/components/__tests__/zoom-timeline.test.tsx`
- [ ] T013 [P] [US2] Basic node-selection test for `family-tree-canvas` in `client/src/components/__tests__/family-tree-canvas.test.tsx`

## Phase 5: User Story 3 — Track and Enforce Coverage (P2)

**Goal**: Coverage report across client and server with an enforced 60% lines/statements gate.
**Independent test**: `npm run test:coverage` reports coverage and fails when below the threshold.

- [ ] T014 [US3] Configure v8 coverage — 60% lines/statements gate plus excludes (`client/src/components/ui/**`, `**/*.config.*`, `migrations/**`, `server/vite.ts`, test files) — in `vitest.config.ts`
- [ ] T015 [US3] Add a `test:coverage` script and confirm the gate fails below threshold and passes at/above it in `package.json`

## Phase 6: Polish & Cross-Cutting

- [ ] T016 Run `npm test` twice to confirm determinism (0 flaky failures) and confirm `npm run test:coverage` passes within the 5-minute budget
- [ ] T017 [P] Confirm every endpoint in the contract matrix and every core component in the component matrix has at least one test (per contracts/test-plan-contract.md)

## Dependencies

- Setup (T001–T003) → Foundational (T004–T006) → US1 (T007–T009) and US2 (T010–T013) → US3 (T014–T015) → Polish (T016–T017).
- US1 depends on the test app entry (T006), which coordinates with feature 009's `createApp`; US2 depends on the client setup (T003) and render helper (T005).
- US3 coverage (T014–T015) depends on US1 + US2 tests existing so the reported number is meaningful.

## Parallel Execution Examples

- After Foundational: US1 contract files (T007–T009) and US2 component files (T010–T013) are all separate files and can run fully in parallel.
- T003 (client setup) and T005 (render helper) can be built in parallel with T004/T006 (server-side helpers).

## Implementation Strategy

- MVP = US1 (API contract tests) — protects the contracts the client depends on; then US2 (component tests) for UI behavior.
- Enable the coverage gate (US3) only after US1 + US2 land so the 60% baseline is representative and non-blocking.
- Runs inside feature 008's CI pipeline; no separate CI wiring is added here.
