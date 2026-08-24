# API Error Contract: Backend Service Architecture and Reliability

**Feature**: 009-backend-service-architecture | **Date**: 2026-08-24

This contract fixes the response behavior that centralized error handling must produce. It is
**behavior-preserving**: every endpoint keeps its current status codes and body shapes.

## Universal error body

All error responses use:

```json
{ "message": "<human-readable message>", "error": <optional field-level detail> }
```

- `error` is present only for validation failures (Zod issues); omitted otherwise.
- 5xx responses never include stack traces or internal detail.

## Status mapping

| Condition | Status | Body |
|-----------|--------|------|
| Payload fails schema validation | 400 | `{ message, error: <zod issues> }` |
| Domain rule violation (self-relationship, invalid enum) | 400 | `{ message }` |
| Duplicate equivalent relationship | 409 | `{ message }` |
| Referenced record not found | 404 | `{ message }` |
| Unexpected server error | 500 | `{ message: "Internal Server Error" }` |

## Endpoint inventory (contracts preserved)

| Method & path | Success | Preserved error statuses |
|---------------|---------|--------------------------|
| `GET /api/family-tree` | 200 tree data | 500 |
| `POST /api/family-members` | 200 member | 400 |
| `PATCH /api/family-members/:id/position` | 200 member | 400 (bad x/y), 404 |
| `PATCH /api/family-members/:id` | 200 member | 400 |
| `DELETE /api/family-members/:id` | 200 `{ message }` | 404 |
| `POST /api/relationships` | 200 relationship | 400, 409 (duplicate), 404 (missing member) |
| `PATCH /api/relationships/:id` | 200 relationship | 400, 404 |
| `DELETE /api/relationships/:id` | 200 `{ message }` | 404 |
| `POST /api/events` | 200 event | 400, 404 (missing member) |
| `GET /api/events` | 200 events | 400 |
| `DELETE /api/events/:id` | 200 `{ message }` | 404 |

Notes:
- Create endpoints intentionally continue to return **200** (not 201) to preserve the existing
  contract (FR-010).
- New statuses **409** (duplicate relationship) and **404** (missing referenced member on
  create) formalize error cases that previously surfaced as generic 400/500; they refine error
  reporting without changing any success response. Existing clients that only branch on
  success vs. failure are unaffected.

## Process-safety guarantee

- The centralized handler MUST send exactly one response and MUST NOT re-throw afterward. After
  any handled error, the server remains able to serve subsequent requests (FR-002, SC-002).

## Verification

- `supertest` integration asserts: each mapped condition returns the specified status and body
  shape; a triggered error is followed by a successful request on the same running app.
