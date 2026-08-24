# Logging Contract

**Feature**: 011-logging-observability | **Date**: 2026-08-24

This contract defines the observable logging interface the server exposes: the log-entry format,
correlation behavior, redaction guarantees, and configuration surface. It is technology-agnostic
about the specific library; the plan selects `pino`/`pino-http` to satisfy it.

## Log Output Interface

- **Destination**: application logs are written to **stdout** (never to committed files).
- **Format**: line-delimited structured records in production (one machine-parseable object per
  line); human-readable pretty output in development.
- **Required fields per entry**: a timestamp, a severity `level`, and a `msg`. Request-scoped
  entries additionally include the correlation id.

## Severity Levels

- Supported levels, in increasing severity: `debug`, `info`, `warn`, `error` (with `trace`/
  `fatal` available).
- The active minimum level is set by `LOG_LEVEL`; only entries at or above it are emitted.

## Request Logging Interface

For every handled request, a completion entry MUST include:

| Field | Meaning |
|-------|---------|
| method | HTTP method |
| path/url or route | Request target |
| statusCode | Response status |
| responseTime | Duration in milliseconds |
| reqId | Correlation id |

## Correlation Interface

- **Inbound**: if the request carries an `x-request-id` header, that value is used as the
  correlation id.
- **Generated**: otherwise a new unique id is generated.
- **Propagation**: the id appears on all entries for that request and is returned on the response
  `x-request-id` header.

## Redaction & Data-Protection Guarantees

The following MUST NOT appear in any log entry (masked to a fixed placeholder or excluded):

- `authorization` and `cookie` request headers; `set-cookie` response header.
- Session identifiers and any `password` / `token` / `secret` fields.
- Request bodies and response bodies (they may contain personal family-member content).
- Personal family-member content (names, dates, notes, profile detail) — only identifiers and
  counts may be logged.

## Error Logging Interface

- Unexpected errors are logged at `error` with `{ type, message, stack }` and the correlation id.
- Logging or handling an error MUST NOT re-raise in a way that terminates the process after a
  response is sent (aligned with feature 009's error handling).

## Configuration Interface

| Variable | Effect | Default |
|----------|--------|---------|
| `LOG_LEVEL` | Minimum severity emitted | `info` (`debug` when `NODE_ENV=development`) |
| `NODE_ENV` | Selects pretty (dev) vs JSON (prod) output | — |

## Resilience Guarantees

- A failure within the logging mechanism MUST NOT crash the process or block request handling.
- Logging MUST be applied through a single shared mechanism (middleware + logger module), not
  ad-hoc per-route statements.
