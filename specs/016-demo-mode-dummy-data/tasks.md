# Tasks: Demo Mode with Dummy Data

**Input**: Design documents from `/specs/016-demo-mode-dummy-data/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/demo-api.md, quickstart.md

**Tests**: Required (FR-013, constitution principles III and IV).

**Format**: `- [ ] [ID] [P?] [Story?] Description with file path`. `[P]` = can run in parallel (different files, no dependency on incomplete tasks).

## Phase 1: Setup

- [x] T001 Add `"dev:demo": "tsx server/demo.ts"` script (no `NODE_ENV` set, per research item 2) to `package.json`

## Phase 2: Foundational (blocks all user stories)

- [x] T002 Export a `Storage` interface (existing `PostgresStorage` public method set) from `server/storage.ts` and type the exported `storage` singleton with it
- [x] T003 Extract the existing Postgres storage test cases from `server/__tests__/storage.test.ts` into a shared `runStorageContract(name, factory)` suite in `server/__tests__/storage.contract.ts`, covering members, relationships (including duplicate and missing-member rejection), events (including no member-existence validation), cascade delete, and not-found errors
- [x] T004 Make `server/__tests__/storage.test.ts` call the contract suite with `PostgresStorage` using `describe.skipIf(!process.env.TEST_DATABASE_URL)`, and verify the existing Postgres tests still pass when a test database is configured

**Checkpoint**: contract suite exists and passes against Postgres.

## Phase 3: User Story 1 - Run with sample data, no database (Priority: P1) 🎯 MVP

**Goal**: `npm run dev:demo` shows the sample family with no database.

**Independent Test**: Quickstart steps 1-2 on a machine without Postgres.

- [x] T006 [P] [US1] Create the sample dataset builder `buildDemoData()` returning fresh members, relationships, and events (about 8 members, 3 generations, one deceased, spouse and parent-child links, at least 5 events of multiple types, fixed x/y, `Date` objects for date fields) in `server/demo-data.ts`
- [x] T007 [P] [US1] Add sample dataset tests (member count, generations, deceased member, event type variety, every relationship and event references existing members, fresh copies per call) in `server/__tests__/memory-storage.test.ts`
- [x] T008 [US1] Implement `MemoryStorage` read path and construction (`getFamilyTree`, `getEvents` with member filter, copies on read, id counters) in `server/memory-storage.ts`
- [x] T009 [US1] Select the backend in `server/storage.ts`: use `MemoryStorage` when `isDemoMode()` (from `server/demo-guard.ts`) is true, otherwise `PostgresStorage`; do not construct the Postgres storage in demo mode
- [x] T010 [US1] Create the dedicated entry point `server/demo.ts` that calls `enableDemoMode()` from `server/demo-guard.ts` (in-process setting, not an env var), defaults `NODE_ENV` to `development` when unset, logs that demo mode is active with in-memory sample data, then dynamically imports `server/index.ts`
- [x] T011 [US1] Add a test that no database connection is attempted in demo mode (FR-011) in `server/__tests__/memory-storage.test.ts`
- [x] T012 [US1] Run quickstart steps 1-2 manually and confirm tree and timeline display and the tree layout is readable (no overlapping cards)

**Checkpoint**: MVP: read-only demo works.

## Phase 4: User Story 2 - Edit freely, no persistence (Priority: P1)

**Goal**: all create, update, move, delete flows work in memory with Postgres parity.

**Independent Test**: Quickstart steps 3 and 5.

- [x] T013 [US2] Implement `MemoryStorage` write path in `server/memory-storage.ts`: `createFamilyMember`, `updateFamilyMember`, `updateFamilyMemberPosition`, `createRelationship` (reject duplicates and missing members with database-equivalent errors), `updateRelationship`, `createEvent`, `deleteFamilyMember` (cascade relationships and events), `deleteRelationship`, `deleteEvent`, with the same not-found messages as Postgres and ids never reused
- [x] T014 [US2] Run `runStorageContract("MemoryStorage", ...)` from `server/__tests__/memory-storage.test.ts` and fix any parity gaps between memory and Postgres behavior until it passes (FR-003, FR-007, FR-014)
- [x] T015 [US2] Add tests that state is lost on a new instance (fresh `MemoryStorage` returns the original sample dataset) and that mutating a returned record does not change stored state in `server/__tests__/memory-storage.test.ts`
- [x] T016 [US2] Run quickstart steps 3 and 5 manually in the UI (add, drag, edit, connect, delete, refresh, restart)

**Checkpoint**: full edit flows work in demo mode.

## Phase 5: User Story 3 - Switch cleanly between demo mode and the database (Priority: P2)

**Goal**: demo mode only by dedicated command, refused in production, default path unchanged.

**Independent Test**: Quickstart steps 6-7.

- [x] T017 [P] [US3] Create `assertNotProduction(env)` in `server/demo-guard.ts` returning a clear error message when `NODE_ENV` is `production`
- [x] T018 [P] [US3] Add tests for `assertNotProduction` (production refused, development and unset allowed) in `server/__tests__/demo-guard.test.ts`
- [x] T019 [US3] Call the guard first in `server/demo.ts`: print the error and `process.exit(1)` before calling `enableDemoMode()` or starting the server (FR-009)
- [x] T020 [US3] Add a test that without `enableDemoMode()` having been called `server/storage.ts` exports the Postgres storage, and that setting env vars such as `DEMO_MODE` or `STORAGE` does not enable demo mode (FR-001, FR-002) in `server/__tests__/demo-guard.test.ts`
- [x] T021 [US3] Run quickstart steps 6-7 manually

**Checkpoint**: modes are cleanly separated.

## Phase 6: User Story 4 - Reset demo data on demand (Priority: P3)

**Goal**: loopback-only `POST /api/demo/reset` restores the sample dataset.

**Independent Test**: Quickstart step 4.

- [x] T022 [P] [US4] Implement `MemoryStorage.reset()` (replace data with a fresh sample dataset and restore id counters) in `server/memory-storage.ts`
- [x] T023 [P] [US4] Create `isLoopbackAddress(addr)` (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) in `server/demo-guard.ts`
- [x] T024 [US4] Register `POST /api/demo/reset` in `server/routes.ts` only when storage is a `MemoryStorage`; use `req.socket.remoteAddress` (ignore `X-Forwarded-For`), return 404 for non-loopback callers, `200 { "message": "Demo data reset" }` otherwise
- [x] T025 [US4] Add tests: `isLoopbackAddress` cases, `reset()` restores data and counters, route returns 200 from loopback and 404 in normal mode, in `server/__tests__/demo-guard.test.ts` and `server/__tests__/memory-storage.test.ts`
- [x] T026 [US4] Run quickstart step 4 manually (edit, `curl -X POST`, refresh)

**Checkpoint**: all stories complete.

## Phase 7: Polish and cross-cutting

- [x] T027 [P] Add a "Demo mode" section to `README.md` (command, what data it contains, changes not saved, reset endpoint, production refusal, Postgres still used for staging)
- [x] T028 [P] Add a follow-up note to `specs/015-basic-auth-login/plan.md` risks that demo mode needs a tree/user or auth bypass once 015 is implemented
- [x] T029 Run `npm run check` and `npx vitest run`; both must pass (memory leg without a database, Postgres leg when `TEST_DATABASE_URL` is set)
- [x] T030 Run the full quickstart (steps 1-8) and tick this file's tasks as completed

## Dependencies and Execution Order

- Phase 1 → Phase 2 → Phases 3-6 → Phase 7.
- T002 before T009 and T013; T003 before T004 and T014.
- US1 (T006-T012) is the MVP. US2 depends on US1's `MemoryStorage` skeleton (T008). US3 depends on T010 (entry point). US4 depends on T008 and T010.
- Within phases, `[P]` tasks touch different files and can run together.

## Parallel Examples

- Phase 3: T006 (demo-data.ts) with T007 (tests for it).
- Phase 5: T017 with T018.
- Phase 6: T022 with T023.
- Phase 7: T027 with T028.

## Implementation Strategy

1. Complete Setup and Foundational, then US1 and validate (MVP: browsable demo).
2. Add US2 for full editing and parity, validate with the contract suite.
3. Add US3 guard and separation, then US4 reset.
4. Polish: docs, type check, full test run.
