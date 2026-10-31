---
description: "Task list for Backend Service Architecture and Reliability"
---

# Tasks: Backend Service Architecture and Reliability

**Input**: Design documents from `/specs/009-backend-service-architecture/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/error-contract.md, contracts/service-interfaces.md

**Tests**: Included (Vitest service-layer unit tests + a supertest error-handling integration test), per constitution Principle III and spec SC-003/SC-004.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4

## Path Conventions

- Backend in `server/`; shared schemas/enums in `shared/schema.ts`; tests under `server/__tests__/`.

## Phase 1: Setup

- [ ] T001 Add `supertest` and `@types/supertest` (dev) to `package.json`

## Phase 2: Foundational (blocking)

- [ ] T002 Create `AppError` base plus `NotFoundError` (404), `ValidationError` (400), and `ConflictError` (409) in `server/errors/app-error.ts`
- [ ] T003 Create `asyncHandler` wrapper that forwards async rejections to the error middleware in `server/middleware/async-handler.ts`
- [ ] T004 [P] Define canonical relationship `type` and `status` Zod enums (allowed values) in `shared/schema.ts`

## Phase 3: User Story 1 — Consistent, Safe API Errors (P1)

**Goal**: Every failure returns a consistent `{ message, error? }` body with the right status, and the server never crashes after responding.
**Independent test**: Trigger validation/not-found/unexpected errors; each returns the mapped status and body; a normal request afterward still succeeds.

- [ ] T005 [US1] Create centralized error-handling middleware mapping `AppError`/`ZodError`/unknown → `{ message, error? }` + status in `server/middleware/error-handler.ts`
- [ ] T006 [US1] Remove the `throw err` re-raise and mount the error middleware last in `server/index.ts`
- [ ] T007 [US1] Add supertest integration test asserting error shape, status mapping, and post-error server responsiveness in `server/__tests__/error-handling.test.ts`

## Phase 4: User Story 2 — Testable Domain Logic (P1)

**Goal**: Business rules live in a service layer callable without HTTP; route handlers become transport-only.
**Independent test**: Call service operations directly (no HTTP) to create members/relationships; domain rules are enforced and results returned.

- [ ] T008 [P] [US2] Create `memberService` (getFamilyTree, create/update/updatePosition/delete) delegating to `storage` in `server/services/member-service.ts`
- [ ] T009 [P] [US2] Create `relationshipService` enforcing self-relationship, duplicate, referenced-member, enum, and parent-child cycle rules in `server/services/relationship-service.ts`
- [ ] T010 [P] [US2] Create `eventService` (create with member-existence check, getEvents, delete) in `server/services/event-service.ts`
- [ ] T011 [US2] Refactor route handlers to delegate to services and shape responses only (preserve status codes) in `server/routes.ts`
- [ ] T012 [P] [US2] Add service-layer unit tests for all domain rules (including parent-child cycle rejection) in `server/__tests__/services/member-service.test.ts`, `relationship-service.test.ts`, and `event-service.test.ts`

## Phase 5: User Story 3 — Consistent Boundary Validation (P2)

**Goal**: A single mechanism validates and rejects malformed input at the boundary before business logic runs.
**Independent test**: Submit malformed and valid payloads to multiple endpoints; rejection and acceptance behave identically with the shared error shape.

- [ ] T013 [US3] Create `validate(schema)` middleware that parses body/params with Zod and forwards a `ValidationError` on failure in `server/middleware/validate.ts`
- [ ] T014 [US3] Apply `validate` to all write endpoints and remove inline `schema.parse` try/catch in `server/routes.ts`
- [ ] T015 [P] [US3] Add boundary-validation tests (malformed vs valid payloads produce consistent errors) in `server/__tests__/validation.test.ts`

## Phase 6: User Story 4 — Single Data-Access Client (P3)

**Goal**: Exactly one database client remains; unused clients are removed with no behavior change.
**Independent test**: Inspect the manifest — only `postgres` (postgres.js) remains; app and tests still pass.

- [ ] T016 [US4] Remove `@neondatabase/serverless` and `pg` from `package.json` and refresh the lockfile via `npm install`
- [ ] T017 [US4] Confirm data access is unchanged by running `npm test` and `npm run check`

## Phase 7: Polish & Cross-Cutting

- [ ] T018 Run `npm run check` and `npm test`; confirm domain rules, error shape, and preserved endpoint contracts all pass
- [ ] T019 [P] Confirm exactly one database client remains in `package.json` (no `@neondatabase/serverless`, no `pg`)

## Dependencies

- Setup (T001) → Foundational (T002–T004) → US1 (T005–T007) → US2 (T008–T012) → US3 (T013–T015) → US4 (T016–T017) → Polish (T018–T019).
- US1 error handler (T005) depends on `AppError` (T002); services (T008–T010) and validation (T013) also depend on `AppError`.
- T011 (US2) and T014 (US3) both edit `server/routes.ts` — run sequentially (US2 before US3).

## Parallel Execution Examples

- After Foundational: services T008, T009, T010 (separate files) run in parallel.
- Test files T012 and T015 can be written in parallel with their sibling implementation once `AppError` exists.

## Implementation Strategy

- MVP = US1 (consistent, safe errors) — the top reliability fix that removes the crash risk; then US2 (service layer) for testability.
- Behavior-preserving throughout: existing endpoint contracts and status codes must not change (verified in Polish).
