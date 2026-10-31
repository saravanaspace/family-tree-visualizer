# Implementation Plan: Security Audit Remediation

**Branch**: `014-security-audit-remediation` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-security-audit-remediation/spec.md`; findings in [audit-report.md](audit-report.md) (guidance pass plus the full six-phase `security-audit` run `run-1`).

## Summary

Close the findings from the security audit with the smallest fix at the last trusted decision point. The only confirmed issues are the unauthenticated `/api` surface (`familytree:api:no-authn`, medium) and the Vite dev-server override (`familytree:dev-server:fs-deny-overridden-project-files-readable`, low). Everything else is hardening or process. Reuse feature 003 for authentication, feature 013 for CI gates and security headers, and add small, test-backed changes in `server/` and `shared/`. No schema or database change.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM); Express 4, Vite 5, Drizzle ORM, Zod.

**Primary Dependencies**: Add `helmet` and `express-rate-limit` (shared with 013 for headers). Upgrade `express`, `drizzle-orm`, `ws`, `postcss`, `zod`/`drizzle-zod` one at a time. Remove unused `passport`, `express-session`, `memorystore`, `connect-pg-simple`, `ws`, `pg`, `@neondatabase/serverless` unless 003 needs them.

**Storage**: PostgreSQL via Drizzle; no schema change. Only `getEvents` query construction and DB connection configuration change.

**Testing**: Vitest + supertest in `server/__tests__/`. A route-enumeration test, header, rate-limit, error-body, validation and dev-server option tests (see [quickstart.md](quickstart.md)).

**Target Platform**: Replit deployment (`npm run start`, static serving) and local/Replit development (`npm run dev`, Vite middleware).

**Project Type**: Single-package web application: `client/`, `server/`, `shared/`.

**Performance Goals**: Negligible per-request overhead from headers and rate limiting.

**Constraints**: Dev workflow (`seed`, `cleanup`, local test DB) must keep working; breaking dependency upgrades (zod 4, express 5) are staged; no secrets in source or logs.

**Scale/Scope**: About 10 server/shared files, `vite.config.ts`, `package.json`, README, plus tests. See Source Code below.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS. `spec.md` has a finding-to-requirement-to-task table; `tasks.md` T001–T017.
- **II. Consistent Type-Safe Stack**: PASS. Validation stays in the shared Zod schemas; only focused middleware is added.
- **III. Behavior-Driven Verification**: PASS. Each requirement has a Vitest/supertest test listed in the quickstart.
- **IV. Reliable Integration Boundaries**: PASS. HTTP boundary behaviour is defined in [contracts/](contracts/) and covered by integration tests.
- **V. Accessible, Responsive, and Focused UX**: PASS (N/A). No UI change except rejecting non-http(s) photo URLs.
- **VI. Security by Design (Shift-Left)**: PASS. This feature is the remediation of the audit; CI enforcement is delegated to 013.

Result: No violations. Complexity Tracking not required. Re-evaluated after design: unchanged.

## Phases

1. **Containment (`familytree:api:no-authn` interim)**: bind to `127.0.0.1` by default with a `HOST` override. Full fix is feature 003 auth middleware.
2. **Dependencies (SEC-002)**: `npm audit fix`, staged direct-dependency upgrades, remove unused packages, add an audit script.
3. **HTTP and dev-server hardening (SEC-003/004/006/007)**: `helmet`, rate limit, disable `X-Powered-By`, merge `viteConfig.server`, allowlist hosts, no `process.exit` in the Vite logger, generic 5xx body, no response-body logging.
4. **Data handling (SEC-005/008/009)**: parameterized `getEvents`, bounded input schemas, finite position values, production guards and TLS option for DB scripts.
5. **Process (SEC-010)**: reconcile 013 status, add CI per 013, add the route-auth enumeration test, then re-run the `security-audit` skill (T016).

## Project Structure

### Documentation (this feature)

```text
specs/014-security-audit-remediation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (no persistent entities; audit artifacts and constrained fields)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output
│   ├── api-access-contract.md
│   ├── http-hardening-contract.md
│   ├── input-validation-contract.md
│   └── dev-server-contract.md
├── checklists/
│   ├── requirements.md
│   └── security.md
├── audit-report.md      # Audit findings (guidance pass + full run)
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
server/
├── index.ts             # EDIT: default bind 127.0.0.1 (HOST override), helmet, rate limit, error middleware, logger
├── routes.ts            # EDIT: validate memberIds, position x/y; auth guard via 003
├── storage.ts           # EDIT: parameterized getEvents; DATABASE_URL required in production; DATABASE_SSL
├── vite.ts              # EDIT: merge viteConfig.server, allowedHosts allowlist, no process.exit in logger
├── db/cleanup.ts        # EDIT: refuse in production
├── seed.ts              # EDIT: refuse in production
└── __tests__/security.test.ts   # NEW
shared/schema.ts         # EDIT: photoUrl http(s), length caps, memberIds max
vite.config.ts           # EDIT: fs.deny also covers dot-directory contents
package.json             # EDIT: add helmet/express-rate-limit/audit script; remove unused deps
README.md                # EDIT: HOST, exposure guidance
```

**Structure Decision**: Single existing web application. Changes are localized edits plus one test file, delegating shared gates and headers to 013 and authentication to 003.

## Risks

- Breaking dependency upgrades (zod 4, express 5): staged one at a time with tests.
- Loopback default may surprise Replit workflows: documented `HOST=0.0.0.0` override for the intended deployment only.
- Unknown deployment exposure: see `needs validation` in the audit report.
