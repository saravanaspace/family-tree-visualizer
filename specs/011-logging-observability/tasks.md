---
description: "Task list for Application Logging and Observability"
---

# Tasks: Application Logging and Observability

**Input**: Design documents from `/specs/011-logging-observability/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/logging-contract.md

**Tests**: Included (Vitest unit tests for logger structure/levels/redaction + a supertest integration test for request correlation and no-secret leakage), per constitution Principle III and spec SC-002/SC-003/SC-004.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4

## Path Conventions

- Backend in `server/`; logger under `server/lib/`, middleware under `server/middleware/`, tests under `server/__tests__/`.

## Phase 1: Setup

- [ ] T001 Add `pino` and `pino-http` (runtime) and `pino-pretty` (dev) to `package.json`
- [ ] T002 [P] Add `supertest` and `@types/supertest` (dev) to `package.json` for the logging integration test (skip if already present from features 009/010)

## Phase 2: Foundational (blocking)

- [ ] T003 Create the structured logger in `server/lib/logger.ts`: `pino` with level from `LOG_LEVEL` (default `info`; `debug` when `NODE_ENV=development`), `pino-pretty` transport in development and JSON to stdout in production, and `redact` paths for `authorization`/`cookie`/`set-cookie`/`password`/`token`/`secret`/session fields

**Checkpoint**: A single shared logger exists — all user stories can build on it.

## Phase 3: User Story 1 — Trace a Request End to End (P1)

**Goal**: Every request emits a correlated entry with method, path, status, and duration; all entries for one request share a correlation id.
**Independent test**: Send a request with and without an `x-request-id` header; confirm the response echoes the id and the log entry carries it plus method/path/status/duration.

- [ ] T004 [US1] Create request-logging middleware in `server/middleware/request-logger.ts` using `pino-http`: `genReqId` reuses an inbound `x-request-id` header or generates a UUID, echoes it on the response `x-request-id` header, and serializes `req` → `{ method, url, id }` and `res` → `{ statusCode }`
- [ ] T005 [US1] Replace the homemade request-logging middleware in `server/index.ts` with the new middleware and remove the `res.json` response-body capture that logs personal data
- [ ] T006 [P] [US1] Add supertest integration test asserting a request produces one correlated entry with method/path/status/duration and no response body in `server/__tests__/logging.test.ts`

**Checkpoint**: Requests are traceable end-to-end via a correlation id.

## Phase 4: User Story 2 — Consistent, Leveled Logs (P1)

**Goal**: All application logs share one structured, leveled format and are filterable by level.
**Independent test**: Emit entries at different levels and confirm each carries a timestamp/level/message and that level filtering suppresses lower-severity entries.

- [ ] T007 [US2] Route the existing `log()` call sites (startup/listening in `server/index.ts` and `server/vite.ts`) through the structured logger so all logs share the leveled structured format
- [ ] T008 [P] [US2] Add unit test asserting entries carry timestamp/level/message and that level filtering works in `server/__tests__/logger.test.ts`

**Checkpoint**: Every log line is structured and leveled.

## Phase 5: User Story 3 — Keep Secrets and Personal Data Out of Logs (P2)

**Goal**: No secrets, credentials, session ids, or personal family-member content appear in logs.
**Independent test**: Send a request with an `Authorization` header and member content; confirm neither appears in any log entry.

- [ ] T009 [US3] Confirm no request/response body serializer is enabled and finalize the redaction path list in `server/lib/logger.ts`
- [ ] T010 [US3] Add integration cases asserting `Authorization`/cookie/token/session values are redacted or absent and no personal member content is logged, appended to `server/__tests__/logging.test.ts`

**Checkpoint**: Logs are safe to retain (no secrets or personal content).

## Phase 6: User Story 4 — Control Verbosity per Environment (P3)

**Goal**: Log verbosity and format are driven by environment configuration with a sensible default.
**Independent test**: Set `LOG_LEVEL=warn` and confirm info/debug entries are suppressed; unset it in development and confirm a debug-verbosity default.

- [ ] T011 [US4] Confirm `LOG_LEVEL` drives the active level with a sensible default and dev/prod format selection in `server/lib/logger.ts`
- [ ] T012 [US4] Add unit test asserting a changed `LOG_LEVEL` changes emitted entries and the default applies, appended to `server/__tests__/logger.test.ts`

**Checkpoint**: Verbosity is configurable without code changes.

## Phase 7: Polish & Cross-Cutting

- [ ] T013 Run `npm run check` and `npm test`; confirm correlation, structure, redaction, and level configuration all pass
- [ ] T014 [P] Validate `quickstart.md` end-to-end (structured output, correlation id, redaction, verbosity, error-without-crash) and document log level/format and destination in `README.md`

## Dependencies

- Setup (T001–T002) → Foundational (T003) → US1 (T004–T006) → US2 (T007–T008) → US3 (T009–T010) → US4 (T011–T012) → Polish (T013–T014).
- T004 depends on the logger (T003); T005 depends on T004.
- T005 (US1) and T007 (US2) both edit `server/index.ts` — run sequentially (US1 before US2).
- T009/T011 further edit `server/lib/logger.ts` created in T003 — sequential on that file.
- T010 appends to `server/__tests__/logging.test.ts` (after T006); T012 appends to `server/__tests__/logger.test.ts` (after T008).
- Coordination: features 009 and 011 both touch error handling in `server/index.ts`; land whichever first and wire the error middleware to log via this logger (single safe error path).

## Parallel Execution Examples

- T002 (dev dep) can run alongside T001.
- After Foundational, T006 (integration test file) and T008 (unit test file) are separate files and can be written in parallel with their sibling implementation.

## Implementation Strategy

- MVP = US1 (request tracing with correlation id) — the foundational observability slice; it also removes the current response-body log leak.
- Then US2 (consistent leveled logs), US3 (data protection), US4 (verbosity). Each phase is an independently testable increment; no API behavior changes.
