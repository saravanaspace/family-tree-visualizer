# Phase 0 Research: Application Logging and Observability

**Feature**: 011-logging-observability | **Date**: 2026-08-24

This document resolves the technical unknowns for adding structured, leveled logging with
per-request correlation and sensitive-data protection to the existing Express server.

## Current state (what is being replaced)

- `server/index.ts` contains a homemade request-logging middleware that captures the serialized
  JSON response body and appends it to a truncated log line for `/api` requests. This leaks
  personal family-member content into logs and violates the constitution's data-protection
  constraint.
- Logging otherwise goes through a `log()` helper in `server/vite.ts` that does
  `console.log`-style formatting with no severity level, no structure, and no correlation id.
- The error handler re-raises with `throw err` after responding (a crash risk addressed by the
  backend error-handling feature, 009).

## Decision: `pino` as the structured logging library

- **Decision**: Adopt `pino` as the single application logger, created once in
  `server/lib/logger.ts`.
- **Rationale**: `pino` emits structured JSON with standard levels (`fatal`/`error`/`warn`/
  `info`/`debug`/`trace`), has very low overhead, supports built-in `redact` paths for secret
  masking, and produces machine-parseable output on stdout — satisfying FR-001..FR-003, FR-006,
  and FR-009 directly.
- **Alternatives considered**:
  - `winston` — rejected: heavier and slower, transport configuration is more complex, and its
    strengths (many transports) are out of scope since logs go to stdout.
  - Keep the homemade `log()` — rejected: no levels, structure, correlation, or redaction; it is
    the root of the problem.
  - `console.*` with manual JSON — rejected: reinvents leveling/redaction/serialization poorly.

## Decision: `pino-http` for request logging and correlation ids

- **Decision**: Use `pino-http` middleware for automatic per-request logging, with a `genReqId`
  that reuses an inbound `x-request-id` header when present and otherwise generates a UUID
  (`crypto.randomUUID()`). The middleware exposes a per-request child logger at `req.log` that
  carries the request id on every entry.
- **Rationale**: This yields FR-001 (method, path/route, status, duration are logged
  automatically) and FR-004 (a single correlation id on all entries for a request, reused from an
  inbound header for cross-service tracing). Using the library's child logger avoids threading a
  logger manually through handlers.
- **Alternatives considered**:
  - Custom `AsyncLocalStorage` correlation store — deferred: adds complexity; `req.log` covers
    the in-request need. ALS can be layered later if service-layer logs must correlate without a
    request reference.
  - Keep the existing manual `res.on('finish')` timing block — rejected: it is what leaks
    response bodies and lacks levels/structure.

## Decision: redaction and no-personal-content policy

- **Decision**: Configure `pino` `redact` to mask `req.headers.authorization`,
  `req.headers.cookie`, `res.headers["set-cookie"]`, and any `password`/`token`/`secret` fields.
  Do not log request or response bodies. Request serializers log only method, url/route, and the
  request id; response serializers log only status code.
- **Rationale**: Satisfies FR-006 (no secrets) and FR-007 (no personal family content — bodies
  carry member names/dates/notes, so they are excluded entirely rather than sampled).
- **Alternatives considered**: Field-level allowlisting of body content — rejected: brittle and
  risks leaking new personal fields as the schema evolves; excluding bodies is safer.

## Decision: environment-driven level and format

- **Decision**: Read the active level from `LOG_LEVEL` (default `info`; `debug` when
  `NODE_ENV=development`). In development, use the `pino-pretty` transport for human-readable
  output; in production, emit line-delimited JSON to stdout.
- **Rationale**: Satisfies FR-008 (configurable verbosity without code changes, sensible default)
  and the spec's development-vs-production format expectation, while keeping production output
  machine-parseable.
- **Alternatives considered**: Hardcoded level — rejected: fails FR-008. Pretty output in
  production — rejected: not ideal for machine collection.

## Decision: resilience — logging must not crash the app

- **Decision**: Keep logging synchronous-to-stdout (pino's default) and never `await` logging in
  request paths; the error middleware logs the error and responds without re-raising (aligned
  with feature 009). No custom transport that could throw is introduced.
- **Rationale**: Satisfies FR-010 and the edge case that a logging failure must not break request
  handling. Writing to stdout avoids file-permission failures.
- **Alternatives considered**: Async remote transport — rejected here: out of scope (external
  aggregation) and introduces a failure surface.

## Decision: coordinate with backend error-handling feature (009)

- **Decision**: The structured logger is the mechanism 009's centralized error middleware uses to
  record errors (with the correlation id). If 009 lands first, this feature wires logging into its
  error handler; if this feature lands first, it removes `throw err`, logs the error, and responds
  safely, leaving the error-shape contract to 009.
- **Rationale**: Both features edit `server/index.ts`'s error handling; sequencing avoids
  conflicting changes and keeps a single safe error path.
- **Alternatives considered**: Duplicate error logging in both features — rejected: divergence
  risk.

## Open items for planning/tasks

- Exact redaction path list is finalized during implementation against the real request/response
  shapes; the censor value is a fixed placeholder (e.g. `"[Redacted]"`).
- Whether high-frequency health/static requests are dropped to `debug` (to reduce noise) is a
  tuning choice made in tasks; they must remain loggable, not silently discarded.
