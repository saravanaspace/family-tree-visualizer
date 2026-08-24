# Quickstart & Validation: Backend Service Architecture and Reliability

**Feature**: 009-backend-service-architecture | **Date**: 2026-08-24

Validates that the restructured backend preserves contracts, enforces domain rules, handles
errors safely, and depends on a single database client. References
[contracts/error-contract.md](contracts/error-contract.md) and
[contracts/service-interfaces.md](contracts/service-interfaces.md).

## Prerequisites

- Node.js 20, npm, and a reachable PostgreSQL instance (see repo README for `DATABASE_URL`).
- Dependencies installed: `npm ci`.

## 1. Type-check and tests

```powershell
npm run check
npm test
```

- **Expected**: type-check passes; service-layer unit tests and the error-handling integration
  test pass.

## 2. Domain rules via the service layer (SC-003, FR-006)

Service unit tests call operations directly (no HTTP) and assert:

- Creating a relationship with `fromMemberId === toMemberId` → `ValidationError`.
- Creating a duplicate (same from/to/type) relationship → `ConflictError`.
- Creating a relationship referencing a non-existent member → error (not a silent DB failure).
- An invalid `type` or `status` value → `ValidationError`.

## 3. Consistent, safe error responses (SC-001, SC-002)

Run the server (`npm run dev`) and exercise error paths:

```powershell
# Validation failure → 400 with { message, error }
curl -s -X POST http://localhost:5000/api/family-members -H "Content-Type: application/json" -d '{}'

# Self-relationship → 400 with { message }
curl -s -X POST http://localhost:5000/api/relationships -H "Content-Type: application/json" -d '{ "fromMemberId": 1, "toMemberId": 1, "type": "spouse" }'

# Not found → 404 with { message }
curl -s -X DELETE http://localhost:5000/api/relationships/999999
```

- **Expected**: each returns the mapped status and a `{ message, error? }` body.
- **No-crash check**: after triggering the errors above, a normal request still succeeds:

```powershell
curl -s http://localhost:5000/api/family-tree
```

The server keeps responding (the old `throw err` crash is gone).

## 4. Single database client (SC-005, FR-009)

```powershell
node -e "const p=require('./package.json'); const d={...p.dependencies}; console.log(['@neondatabase/serverless','pg'].filter(k=>k in d))"
```

- **Expected**: prints `[]` — neither unused client remains. Confirm the app and tests still run
  (data access unchanged), proving `postgres`/`drizzle-orm/postgres-js` is the sole client.

## 5. Contract preservation (SC-006, FR-010)

- **Expected**: existing (and updated) tests pass with no changes to any success response shape or
  status code; creates still return `200`, deletes return `200 { message }`.

## Success signals

- SC-001: every endpoint returns the consistent error shape for validation/not-found/unexpected.
- SC-002: 0 handled errors terminate the process.
- SC-003: 100% of domain logic is exercised via the service layer without HTTP.
- SC-004: domain-rule violations are rejected in tests.
- SC-005: exactly one database client remains.
- SC-006: all existing endpoint contracts preserved.
