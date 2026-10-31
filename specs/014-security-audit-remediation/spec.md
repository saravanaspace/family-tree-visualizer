# Feature Specification: Security Audit Remediation

**Feature Branch**: `014-security-audit-remediation`
**Created**: 2026-10-31
**Status**: Draft
**Input**: Security audit of the codebase (see [audit-report.md](audit-report.md)). The audit was performed with the **`security-audit` skill**.
**Related**: 003 (accounts/authorization), 009 (service architecture), 011 (logging), 012 (deployment), 013 (DevSecOps baseline — owns scanning gates and headers; this feature does not duplicate them but tracks the findings that depend on them).

## User Scenarios & Testing

### User Story 1 - Protect family data from unauthorized access (P1)
As a family owner, only authenticated and authorized users can read or change tree data.
**Independent Test**: Unauthenticated requests to every `/api` route get 401; non-members get 403.
**Acceptance**: Covers SEC-001. Delivered via feature 003; this feature adds the audit test that enumerates every route and asserts a guard exists.

### User Story 2 - Ship with no known high/critical dependency advisories (P1)
As a maintainer, `npm audit --omit=dev --audit-level=high` passes.
**Independent Test**: Run the command; exit code 0 (or each remaining advisory has a recorded, owned, time-bounded acceptance per 013).
**Acceptance**: Covers SEC-002.

### User Story 3 - Hardened HTTP surface (P2)
Responses carry security headers, API is rate limited, dev server is host-restricted, errors don't leak internals or sensitive data to clients/logs.
**Acceptance**: Covers SEC-003, SEC-004, SEC-006, SEC-007. Header requirements are defined in 013 FR-004; implement once there.

### User Story 4 - Safer data handling (P2)
Queries are fully parameterized; inputs are bounded; photo URLs are restricted; destructive scripts are guarded.
**Acceptance**: Covers SEC-005, SEC-008, SEC-009.

### Edge Cases
- Accepting a risk requires named owner, rationale, and expiry (013 clarification).
- Dependency upgrades with breaking changes (`zod` 4, `drizzle-orm`, `express` 5) must keep the test suite green.
- Seed/cleanup scripts must still work for local development and the test database.

## Requirements

- **FR-001**: Every `/api` route MUST require an authenticated, authorized principal (via 003). Until 003 lands, the app MUST NOT be exposed publicly (bind `127.0.0.1` by default; `HOST` env to override).
- **FR-002**: Production dependencies MUST have zero unaccepted high/critical advisories; CI (013) MUST enforce.
- **FR-003**: The server MUST set protective headers (via `helmet`, per 013) and rate limit `/api` mutating routes, and MUST NOT send `X-Powered-By`.
- **FR-004**: Vite `allowedHosts` MUST be an explicit allowlist (e.g. localhost and the configured dev host), never `true`. `setupVite` MUST merge `viteConfig.server` so `fs.strict`/`fs.deny` apply (deny also covers dot-directory contents), MUST NOT call `process.exit` from the Vite logger on a refused request, and the dev server MUST NOT be exposed publicly (`familytree:dev-server:fs-deny-overridden-project-files-readable`).
- **FR-005**: `getEvents` MUST use a parameterized array-overlap query; `memberIds` MUST be validated as bounded positive integers (400 on invalid). Position PATCH `x`/`y` MUST be finite and range-bounded.
- **FR-006**: The error handler MUST return a generic message for 5xx, log server-side, and MUST NOT re-throw after responding.
- **FR-007**: Request logs MUST NOT include response bodies or PII.
- **FR-008**: `photoUrl` MUST be `http(s)` only; free-text fields (`biography`, `notes`, `description`) MUST have maximum lengths; event `memberIds` MUST have a maximum count and reference existing members.
- **FR-009**: `DATABASE_URL` MUST be required in production (no hard-coded fallback); `cleanup`/`seed` MUST refuse to run when `NODE_ENV=production` unless explicitly forced; DB TLS MUST be configurable (`DATABASE_SSL`).
- **FR-010**: Spec 013 status and tasks MUST reflect reality (not implemented) and this feature's findings MUST be traced to tasks.
- **FR-012**: Unused authentication/session/DB dependencies (`passport`, `express-session`, `memorystore`, `connect-pg-simple`, `ws`, `pg`, `@neondatabase/serverless`) MUST be removed unless feature 003 uses them, shrinking the advisory surface.
- **FR-011**: Each security audit run MUST be recorded (date, method, tool/skill used, scope, coverage) in the feature's `audit-report.md`.

## Finding Traceability (full audit `run-1`, commit `659cdff`)

| Item | Type | Requirement | Task |
|------|------|-------------|------|
| `familytree:api:no-authn` (SEC-001) | Confirmed, MEDIUM | FR-001 | T001, T014 |
| `familytree:dev-server:fs-deny-overridden-project-files-readable` (SEC-004) | Confirmed, LOW | FR-004 | T007 |
| `familytree:deps:advisory-reachability-unestablished` (SEC-002) | Rejected as finding; hygiene | FR-002, FR-012 | T002–T004, T017 |
| Headers, rate limit, `X-Powered-By` (SEC-003) | Hardening | FR-003 | T005, T006 |
| `getEvents` `sql.raw`, position finite check (SEC-005) | Hardening | FR-005 | T011 |
| 5xx `err.message` leak (SEC-006) | Hardening | FR-006 | T008 |
| Body logging (SEC-007) | Hardening | FR-007 | T009 |
| `photoUrl`, field lengths, event `memberIds` (SEC-008) | Hardening | FR-008 | T012 |
| Scripts, DB fallback, TLS (SEC-009) | Hardening | FR-009 | T013 |
| No CI/dependabot, spec 013 status (SEC-010) | Process | FR-010 | T015 |
| Unused auth/DB dependencies | Hardening | FR-012 | T017 |

## Success Criteria

- **SC-001**: 0 unauthenticated successful `/api` calls (post-003).
- **SC-002**: `npm audit --omit=dev --audit-level=high` exits 0.
- **SC-003**: Header/rate-limit/error-handling integration tests pass.
- **SC-004**: 100% of SEC-001…SEC-010 are fixed or have an accepted, owned, expiring risk entry.

## Assumptions
- Single deployment on Replit; Postgres is separate. Production proxy/TLS facts are unverified (see audit-report "Needs validation").
