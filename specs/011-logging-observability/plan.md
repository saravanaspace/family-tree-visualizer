# Implementation Plan: Application Logging and Observability

**Branch**: `011-logging-observability` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-logging-observability/spec.md`

## Summary

Replace the ad-hoc `log()` helper and the homemade request-logging middleware with a single
structured, leveled logging capability for the Express server. Every request gets a correlation
identifier (reused from an inbound header when present) that is attached to all log entries for
that request; entries are emitted as machine-parseable structured records with a timestamp,
severity level, and message. Secrets (authorization headers, cookies, tokens, session ids) are
redacted and personal family-member content is never logged — the current middleware, which
appends the serialized JSON response body to each log line, is removed because it leaks personal
data. Verbosity and format are driven by environment configuration (verbose/human-readable in
development, lean/structured in production) with a sensible default. The work is additive around
the existing stack and changes no API behavior.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM, `"type": "module"`)

**Primary Dependencies**: `pino` (structured leveled logger) and `pino-http` (request logging +
correlation id) as runtime dependencies; `pino-pretty` as a dev-only pretty transport for
development. No change to the React/Express/Drizzle stack.

**Storage**: N/A — logs are emitted to a standard stream (stdout), not persisted by the app.

**Testing**: Existing Vitest suite; new unit tests for the logger/redaction and an integration
test (supertest) asserting request logs carry a correlation id and no secrets. Reuses the
existing `server/__tests__/setup.ts` harness.

**Target Platform**: Node.js 20 server process (developer workstations and the hosting
environment); logs collected from stdout by the platform.

**Project Type**: Web application — single npm package with `client/` (React/Vite), `server/`
(Express), and `shared/` (schemas). This feature is server-only.

**Performance Goals**: Logging overhead is negligible under normal request volume; `pino`'s
low-overhead JSON serialization keeps per-request cost sub-millisecond in typical cases.

**Constraints**: No change to API behavior or response shapes; no secrets or personal
family-member content in logs; a logging failure must never crash the process or block a
request; output goes to stdout (no committed log files).

**Scale/Scope**: `server/**` request handling; a logger module, a request-logging middleware,
and edits to `server/index.ts`. Coordinates with the backend error-handling feature (009), which
removes the unsafe `throw err` re-raise in the same file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — `spec.md` with prioritized stories exists; this
  `plan.md` follows; `tasks.md` will be produced by `/speckit-tasks`.
- **II. Consistent Type-Safe Stack**: PASS — retains TypeScript/Express; adds `pino`/`pino-http`
  as focused, typed runtime dependencies for a cross-cutting concern. No shared-schema or DB
  change; no framework replacement.
- **III. Behavior-Driven Verification**: PASS — new server logging behavior is covered by unit
  tests (redaction, level configuration, correlation id generation) and an integration test
  (request produces a correlated entry with no secrets). Suite and `npm run check` must pass.
- **IV. Reliable Integration Boundaries**: PASS — the only boundary touched is the HTTP request
  pipeline; an integration test exercises a real request through the middleware. No storage or
  schema contract changes.
- **V. Accessible, Responsive, and Focused UX**: PASS (N/A user-facing) — no UI change; scope is
  limited to server logging with no unrelated refactor.

**Data-protection constraint (Technical Constraints §)**: Directly satisfied — the feature
enforces "family-member data MUST not be logged with secrets or credentials" via redaction and by
removing response-body logging.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/011-logging-observability/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (log-entry shape; no persistent entities)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output
│   └── logging-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
server/
├── lib/
│   └── logger.ts            # NEW: pino instance; level/format from env; redaction config
├── middleware/
│   └── request-logger.ts    # NEW: pino-http setup; correlation id (genReqId); serializers
├── index.ts                 # EDIT: replace homemade request logger; log via structured logger;
│                            #       remove response-body logging that leaks personal data
├── vite.ts                  # EDIT: route the existing log() call sites through the logger
└── __tests__/
    ├── logger.test.ts       # NEW: redaction + level configuration unit tests
    └── logging.test.ts      # NEW: supertest integration — correlation id present, no secrets
```

**Structure Decision**: Single existing web application; the feature is server-only. A single
`pino` logger is created in `server/lib/logger.ts` and configured from environment
(`LOG_LEVEL`, and pretty output in development). `pino-http` in `server/middleware/request-logger.ts`
owns per-request logging and correlation ids (reusing an inbound `x-request-id` when present,
otherwise generating one) and exposes a per-request child logger (`req.log`). `server/index.ts`
swaps its homemade middleware for this and stops appending response bodies to logs. This mirrors
the codebase's existing `server/middleware` / `server/lib` layering used by the backend
architecture feature.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
