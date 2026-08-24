# Quickstart & Validation: Application Logging and Observability

**Feature**: 011-logging-observability | **Date**: 2026-08-24

This guide validates the logging capability end-to-end. It references
[contracts/logging-contract.md](contracts/logging-contract.md) for the log format, correlation,
and redaction guarantees, and [data-model.md](data-model.md) for the entry shape.

## Prerequisites

- Node.js 20 and npm installed; dependencies installed (`npm ci`).
- A `DATABASE_URL` available for running the server (see the app's setup docs).

## 1. Structured, leveled output (FR-001, FR-002, FR-003)

```powershell
$env:NODE_ENV = "production"; $env:LOG_LEVEL = "info"; npm run dev
```

- Send a request (e.g. `GET /api/family-tree`).
- **Expected**: a single structured line is emitted containing a timestamp, `level`, `msg`, the
  request `method`, `url`/route, `statusCode`, and `responseTime`.

## 2. Per-request correlation id (FR-004)

```powershell
curl -H "x-request-id: test-correlation-123" http://localhost:5000/api/family-tree -i
```

- **Expected**: the response includes an `x-request-id: test-correlation-123` header, and the log
  entry for the request carries `reqId: test-correlation-123`.
- **Validate generation**: repeat without the header; expect a generated id present on both the
  response header and the log entry.

## 3. Secrets and personal data are never logged (FR-006, FR-007)

- Send a request that includes an `Authorization` header and a body containing member details.
- **Expected**: no authorization value, cookie, token, or session id appears in any log line; no
  request/response body and no personal member content (names/dates/notes) appears. Secret fields
  show a fixed placeholder such as `[Redacted]`.

## 4. Configurable verbosity (FR-008)

```powershell
$env:LOG_LEVEL = "warn"; npm run dev
```

- **Expected**: `info`/`debug` entries are suppressed; only `warn` and `error` entries appear —
  with no code change, only the environment variable changed.
- **Validate default**: unset `LOG_LEVEL` and start with `NODE_ENV=development`; expect
  human-readable output at `debug` verbosity.

## 5. Error logging without crashing (FR-005, FR-010)

- Trigger an endpoint that raises an unexpected error.
- **Expected**: an `error`-level entry is recorded with the correlation id and `err` context, the
  client receives the standard error response, and the server keeps serving subsequent requests
  (no process exit).

## 6. Automated tests

```powershell
npm test
```

- **Expected**: unit tests for redaction and level configuration pass; the integration test
  asserting a request produces a correlated entry with no secrets passes.

## Success signals

- SC-001/SC-002: every handled request yields an entry with method, path, status, duration, a
  timestamp, level, and correlation id; logs are filterable by level.
- SC-003: all entries for one request share a single correlation id.
- SC-004: 0 secrets/tokens/session ids appear across the test suite and a sampled run.
- SC-005: changing `LOG_LEVEL` alone changes emitted verbosity.
- SC-006: an unexpected error is logged and the server continues serving.
- SC-007: the setup docs explain how to set the level and where logs are written.
