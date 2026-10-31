# Contract: Demo Mode Interfaces

## 1. Start command

| Item | Contract |
|------|----------|
| Command | `npm run dev:demo` |
| Preconditions | None (no database, no `.env` needed) |
| Refusal | If `NODE_ENV` is `production`: print an error stating demo mode cannot run in production, exit non-zero, do not listen |
| Success output | A log line stating demo mode is active with in-memory sample data, and that changes are lost on restart; then the normal "serving on port" line |
| Side effects | No database connection attempted |

No other command or documented option activates demo mode (FR-001).

## 2. Existing API (unchanged)

All routes in `server/routes.ts` behave identically to normal mode in terms of request/response shape, validation errors (400), and not-found handling, per FR-003 and FR-014.

## 3. Reset endpoint

`POST /api/demo/reset`

| Aspect | Contract |
|--------|----------|
| Availability | Registered only in demo mode. In normal mode the route does not exist (404, falls through like any unknown API path). |
| Caller restriction | Only when the connection's remote address is loopback (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`). Proxy headers are ignored. Any other caller receives 404. |
| Request body | None |
| Success | `200` with `{ "message": "Demo data reset" }`; store replaced by a fresh sample dataset |
| Errors | `404` for non-loopback callers or outside demo mode |
| Idempotent | Yes |
| Deployment note | Demo mode must not run behind a reverse proxy on the same machine; proxied requests would appear as loopback. |

## 4. Storage interface (internal)

`Storage` exposes the existing method set of `PostgresStorage`:
`getFamilyTree`, `createFamilyMember`, `updateFamilyMember`, `updateFamilyMemberPosition`, `deleteFamilyMember`, `createRelationship`, `updateRelationship`, `deleteRelationship`, `createEvent`, `getEvents`, `deleteEvent`. `MemoryStorage` additionally exposes `reset()`.

Both implementations MUST pass the shared contract suite (FR-013).
