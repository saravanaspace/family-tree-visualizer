# Phase 0 Research: Backend Service Architecture and Reliability

**Feature**: 009-backend-service-architecture | **Date**: 2026-08-24

Resolves the technical approach for restructuring the Express backend while preserving every
existing API contract.

## Decision: Centralized error-handling middleware with typed `AppError` classes

- **Decision**: Add an Express error-handling middleware (4-argument signature) mounted **after**
  all routes. Define an `AppError` base carrying `status` and `message`, with subclasses
  `NotFoundError` (404), `ValidationError` (400), and `ConflictError` (409). The middleware maps
  `AppError` → its status + `{ message }`; `ZodError` → 400 `{ message, error: err.errors }`;
  everything else → 500 `{ message: "Internal Server Error" }` with the detail logged, not
  returned.
- **Rationale**: Produces the consistent `{ message, error? }` body the client already expects
  (clarified) while centralizing logic that is currently duplicated per route. Typed errors let
  the service layer signal intent (not-found vs. conflict) without knowing about HTTP.
- **Fixes**: The current handler in `server/index.ts` calls `throw err` **after** sending the
  response, which can crash the process (FR-002). The new handler sends once and never re-throws.
- **Alternatives considered**:
  - Per-route try/catch (status quo) — rejected: duplicated, inconsistent, and the source of the
    crash bug.
  - A new error envelope `{ error: { code, message } }` — rejected: would change the response
    contract; the clarification chose to preserve `{ message, error? }`.

## Decision: `asyncHandler` wrapper for Express 4 async routes

- **Decision**: Wrap async route handlers in an `asyncHandler(fn)` helper that catches rejected
  promises and calls `next(err)`.
- **Rationale**: Express 4 does not forward async rejections to error middleware automatically;
  without this, an unhandled rejection bypasses the central handler. The wrapper guarantees all
  errors reach one place.
- **Alternatives considered**: Upgrade to Express 5 (native async error forwarding) — deferred:
  larger change, out of scope; the wrapper is minimal and sufficient.

## Decision: Thin service layer above unchanged storage

- **Decision**: Add `server/services/{member,relationship,event}-service.ts`. Services depend on
  the existing `storage` module for persistence and own the domain rules. Route handlers call
  services; `storage.ts` keeps its current behavior as the data-access layer.
- **Rationale**: Separates domain logic from transport (FR-004/FR-005) and keeps persistence
  concerns isolated. Reusing `storage` avoids rewriting working data access and keeps the change
  behavior-preserving.
- **Alternatives considered**:
  - Put rules directly in `storage.ts` — rejected: conflates data access with domain logic and is
    harder to unit-test in isolation.
  - A repository/unit-of-work pattern — rejected: over-engineered for three entities.

## Decision: Boundary validation via a `validate(schema)` middleware

- **Decision**: A single `validate(schema)` middleware parses `req.body` (or params) with the
  existing Zod schemas from `shared/schema.ts`, attaches typed data to the request, and forwards
  a `ZodError`/`ValidationError` on failure — before any service call.
- **Rationale**: Removes the repeated `schema.parse` + try/catch in each route (FR-007/FR-008) and
  guarantees consistent validation errors. Reuses existing schemas, so no contract drift.
- **Alternatives considered**: Keep inline `parse` calls — rejected: duplication and inconsistent
  error handling.

## Decision: Domain rules enforced in this feature (per clarification)

- **Decision**: The relationship service enforces: (1) no self-relationship (`fromMemberId !==
  toMemberId`), (2) no duplicate equivalent relationship (same from/to/type — already a DB unique
  index; surface a friendly `ConflictError` instead of a raw DB error), (3) referenced members
  must exist, (4) `type` and `status` must be valid enum values, and (5) parent-child
  relationships must not create a cycle (aligns with feature 007 FR-024). Other complex genealogy
  (parent-count limits, date sanity) is explicitly deferred.
- **Rationale**: Matches the clarified scope — clearly-correct, behavior-preserving invariants
  without opening large genealogical modeling work.
- **Alternatives considered**: Full genealogical validation now — deferred by clarification;
  minimal (two rules only) — rejected in favor of also covering referential/enum integrity.

## Decision: Consolidate to a single database client

- **Decision**: Remove `@neondatabase/serverless` and `pg` from `package.json`. Keep `postgres`
  (postgres.js) with `drizzle-orm/postgres-js`, which every source file already uses.
- **Rationale**: FR-009 requires a single client; the other two are unused. `drizzle-orm/pg-core`
  (the schema builder) stays — it is not a driver.
- **Coordination note**: Planned feature 003 (accounts/collaboration) intends a Postgres session
  store (`connect-pg-simple`). That feature should standardize on the same `postgres.js` client or
  a compatible session store rather than reintroducing `pg`. `ws`/`bufferutil` (transitive Neon
  needs) can be reevaluated for removal during implementation once `@neondatabase/serverless` is
  gone, but are left untouched if any tooling still references them.
- **Alternatives considered**: Keep all three "just in case" — rejected: confusing and enlarges
  the dependency/supply-chain surface.

## Decision: Preserve exact endpoint contracts (including status codes)

- **Decision**: Keep current status codes as-is — creates continue to return `200` (not `201`),
  deletes return `200` with `{ message }`, not-found returns `404`, validation returns `400`.
- **Rationale**: FR-010 requires no observable change for the client. Normalizing to REST-ideal
  codes would break the contract and the existing client expectations.
- **Alternatives considered**: Switch creates to `201` — rejected: contract change out of scope.

## Decision: Verification strategy

- **Decision**: Unit-test each service's domain rules directly (no HTTP). Add one `supertest`
  integration test that drives representative endpoints to assert the consistent error body,
  correct statuses, and that the server keeps responding after an error.
- **Rationale**: Satisfies FR/SC for testable domain logic (SC-003) and safe errors (SC-001/002)
  while leaving broad endpoint contract coverage to feature 010.
- **Alternatives considered**: Rely only on existing storage tests — rejected: they do not cover
  the new service rules or the error middleware.
