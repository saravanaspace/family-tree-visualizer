# Data Model: Application Logging and Observability

**Feature**: 011-logging-observability | **Date**: 2026-08-24

## Overview

This feature introduces **no persistent data entities** and makes no database or schema changes.
The "model" here is the shape of an emitted **log entry** and the **correlation identifier** that
links entries for one request. These are operational records written to stdout, not stored by the
application.

## Log Entry (emitted record)

| Field | Type | Notes |
|-------|------|-------|
| `time` | timestamp | Epoch millis (pino default) or ISO in pretty mode |
| `level` | severity | One of `error`, `warn`, `info`, `debug` (also `fatal`/`trace` available) |
| `msg` | string | Human-readable message |
| `reqId` | string | Correlation id for request-scoped entries (from `x-request-id` or generated) |
| `req` | object | Serialized to `{ method, url, id }` only — no headers body, no request body |
| `res` | object | Serialized to `{ statusCode }` only |
| `responseTime` | number | Request duration in ms (request-completion entries) |
| `err` | object | Present on error entries: `{ type, message, stack }` — no personal payload |

**Excluded by design (never logged)**: request/response bodies, `authorization` and `cookie`
headers, `set-cookie`, session identifiers, and any `password`/`token`/`secret` fields (redacted
to a fixed placeholder). Personal family-member content (names, dates, notes, profile detail) is
never emitted.

## Correlation Identifier

| Aspect | Rule |
|--------|------|
| Source | Reuse inbound `x-request-id` header when present; otherwise generate a UUID |
| Scope | Assigned per request; attached to every entry produced while handling that request |
| Propagation | Available on `req.id` and on the per-request child logger `req.log` |
| Response | Echoed back on the response `x-request-id` header for client-side correlation |

## Severity Levels

| Level | Intended use |
|-------|--------------|
| `error` | Unexpected failures and handled server errors (with `err` context) |
| `warn` | Recoverable anomalies / client errors worth attention |
| `info` | Normal request lifecycle and lifecycle events (startup, listening) |
| `debug` | Verbose diagnostic detail, default in development |

## Configuration Inputs (non-data)

| Input | Purpose | Default |
|-------|---------|---------|
| `LOG_LEVEL` | Minimum emitted severity | `info` (or `debug` when `NODE_ENV=development`) |
| `NODE_ENV` | Selects pretty (dev) vs JSON (prod) formatting | `development` locally |

## State / Lifecycle

A request-scoped logger moves through: **assigned** (correlation id set at request start) →
**active** (entries emitted during handling share the id) → **completed** (a request-completion
entry records method, path, status, and duration). No persistence or transitions beyond the
request lifetime.
