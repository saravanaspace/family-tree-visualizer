# REST API Contract: Core Family Tree

Documents the existing endpoints (baseline) and the consistency improvements. Base path `/api`.
All error responses adopt a single shape after this feature:

```json
{ "error": { "code": "string", "message": "human-readable", "details": [] } }
```

## Endpoints (baseline, contract preserved)

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| GET | `/api/family-tree` | Full tree (members, relationships, events) | 200 | 500 |
| POST | `/api/family-members` | Create member (Zod validated) | 200 | 400 |
| PATCH | `/api/family-members/:id` | Update member fields | 200 | 400, 404 |
| PATCH | `/api/family-members/:id/position` | Update x/y position | 200 | 400, 404 |
| DELETE | `/api/family-members/:id` | Delete member + dependents | 200 | 404 |
| POST | `/api/relationships` | Create relationship | 200 | 400 |
| PATCH | `/api/relationships/:id` | Update relationship | 200 | 400, 404 |
| DELETE | `/api/relationships/:id` | Delete relationship | 200 | 404 |
| POST | `/api/events` | Create event | 200 | 400 |
| GET | `/api/events?memberIds=` | Events, optionally filtered by members | 200 | 400 |
| DELETE | `/api/events/:id` | Delete event | 200 | 404 |

## Behavior changes (this feature)

- **Consistent errors**: every endpoint returns the error shape above with a stable `code`
  (e.g., `validation_error`, `not_found`, `conflict`, `internal_error`).
- **Domain validation** (relationships): reject self-relationships (`conflict`/`validation_error`)
  and duplicate equivalent relationships with a clear message instead of a raw DB error.
- **Reference integrity**: creating a relationship or event referencing a missing member returns
  `not_found`/`validation_error`, not a 500.

## Non-changes

- Paths, methods, request bodies, and success payloads are unchanged to preserve compatibility.
