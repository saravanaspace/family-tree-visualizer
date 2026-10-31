# Quickstart: Validate Demo Mode

Prerequisites: Node and installed dependencies (`npm install`). No database required for steps 1-5.

## 1. Start demo mode

```bash
npm run dev:demo
```

Expected: a log line says demo mode is active (in-memory, changes lost on restart); server listens on port 5000.

## 2. See the sample family

Open http://localhost:5000. Expected: about 8 members across three generations, spouse and parent-child lines, a deceased member, and at least 5 events in the timeline (User Story 1, SC-001).

## 3. Edit and persist for the session

Add a member, drag another, delete one with relationships, then refresh the page. Expected: changes remain; deleted member's relationships and events are gone (User Story 2, FR-007).

## 4. Reset without restarting

```bash
curl -X POST http://localhost:5000/api/demo/reset
```

Expected: `200`; refresh shows the original sample data. Calls from another machine receive `404` (see [contracts/demo-api.md](contracts/demo-api.md)).

## 5. Restart returns to the original data

Stop the server and run `npm run dev:demo` again. Expected: sample data in its original state (SC-003).

## 6. Production guard

```bash
NODE_ENV=production npm run dev:demo
```

Expected: refuses with a clear error, exits non-zero, no server started (FR-009).

## 7. Normal mode unaffected

With `DATABASE_URL` configured, `npm run dev`. Expected: database data is served and `POST /api/demo/reset` returns 404 (FR-002, SC-004).

## 8. Automated checks

```bash
npm run check
npx vitest run
```

Expected: type check passes; memory-storage contract tests pass without a database; Postgres contract tests run when `TEST_DATABASE_URL` is set and are skipped otherwise.
