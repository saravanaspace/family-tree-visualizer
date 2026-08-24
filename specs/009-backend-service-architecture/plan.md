# Implementation Plan: Backend Service Architecture and Reliability

**Branch**: `009-backend-service-architecture` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-backend-service-architecture/spec.md`

## Summary

Restructure the Express backend for reliability and testability without changing any existing
API contract. Introduce a domain **service layer** that holds business rules independent of HTTP,
a single **boundary validation** mechanism built on the existing Zod schemas, and a **centralized
error-handling middleware** that returns a consistent `{ message, error? }` body, maps domain and
validation errors to appropriate statuses, never leaks internals, and never crashes the process
after a response is sent (fixing the current `throw err` in `server/index.ts`). Consolidate to a
single database client (`postgres` / `drizzle-orm/postgres-js`) by removing the unused
`@neondatabase/serverless` and `pg` clients. All endpoints keep their current request/response
shapes.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM)

**Primary Dependencies**: Express 4, Drizzle ORM, `postgres` (postgres.js), Zod, `drizzle-zod`.
Dev/test: Vitest and `supertest` (added for HTTP-level error-handling verification). Removed:
`@neondatabase/serverless`, `pg` (unused clients).

**Storage**: PostgreSQL via Drizzle ORM (existing schema in `shared/schema.ts` — **unchanged**).

**Testing**: Vitest — service-layer unit tests (domain rules) plus a focused integration test of
the error middleware and route delegation via `supertest`. Broad endpoint contract coverage is
owned by feature 010; this feature coordinates but is independently verifiable.

**Target Platform**: Node.js 20 Express server.

**Project Type**: Web application — backend (`server/`) only; no client changes.

**Performance Goals**: No measurable latency regression; the service layer adds a thin in-process
call and no extra I/O.

**Constraints**: Behavior-preserving (every existing endpoint keeps its contract, FR-010); error
body stays `{ message, error? }` (clarified); server must not terminate on handled errors
(FR-002); no sensitive detail in error responses (FR-003).

**Scale/Scope**: `server/routes.ts`, `server/storage.ts`, new `server/services/**`, new
`server/middleware/**` and `server/errors/**`, `server/index.ts` (error handler fix),
`package.json` (dependency removal).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — `spec.md` (with clarifications) exists; this
  `plan.md` follows; `tasks.md` via `/speckit-tasks`.
- **II. Consistent Type-Safe Stack**: PASS — remains Express/PostgreSQL/Drizzle/Zod/TypeScript.
  Shared data contracts stay in `shared/`. Consolidating to one Drizzle client strengthens, not
  changes, the stack. No schema/migration change.
- **III. Behavior-Driven Verification**: PASS — every domain rule and error case maps to a Vitest
  test; `npm run check` and the suite gate completion.
- **IV. Reliable Integration Boundaries**: PASS — this feature hardens the API↔storage boundary;
  the service layer enforces referential and enum integrity, and error handling is verified with
  an integration test (per the principle's requirement for boundary-crossing changes).
- **V. Accessible, Responsive, and Focused UX**: PASS (N/A UI) — backend-only; no unrelated
  refactor beyond the stated restructuring.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/009-backend-service-architecture/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (domain rules + error taxonomy; no schema change)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output
│   ├── error-contract.md
│   └── service-interfaces.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
server/
├── index.ts             # EDIT: remove `throw err`; mount centralized error middleware last
├── routes.ts            # EDIT: thin handlers — validate → call service → shape response
├── storage.ts           # KEEP: data access only (unchanged behavior; single postgres.js client)
├── errors/
│   └── app-error.ts     # NEW: AppError base + NotFoundError, ValidationError, ConflictError
├── middleware/
│   ├── validate.ts      # NEW: validate(schema) — parses body/params with Zod, forwards errors
│   ├── async-handler.ts # NEW: wraps async handlers so rejections reach the error middleware
│   └── error-handler.ts # NEW: central error → consistent { message, error? } + status mapping
├── services/
│   ├── member-service.ts        # NEW: member domain operations + rules
│   ├── relationship-service.ts  # NEW: relationship rules (self, duplicate, refs, enums)
│   └── event-service.ts         # NEW: event domain operations
└── __tests__/
    ├── services/*.test.ts       # NEW: domain-rule unit tests
    └── error-handling.test.ts   # NEW: supertest integration for error shape + no-crash

package.json             # EDIT: remove @neondatabase/serverless, pg; add supertest (dev)
```

**Structure Decision**: Keep `storage.ts` as the data-access layer (unchanged) and add a thin
`services/` layer above it that enforces domain rules and is callable without HTTP (FR-004/FR-005).
Route handlers become transport-only: a `validate(schema)` middleware parses input at the
boundary, an `asyncHandler` wrapper forwards async errors, and a single `error-handler`
middleware produces the consistent body and status. Custom `AppError` subclasses carry status +
message so the middleware maps them deterministically. Dependency removal is isolated to
`package.json` with no code depending on the removed clients.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
