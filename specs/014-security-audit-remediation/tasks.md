---
description: "Task list for Security Audit Remediation"
---

# Tasks: Security Audit Remediation

**Input**: Design documents from `/specs/014-security-audit-remediation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-access-contract.md, contracts/http-hardening-contract.md, contracts/input-validation-contract.md, contracts/dev-server-contract.md, quickstart.md, audit-report.md

**Tests**: Included (Vitest + supertest in `server/__tests__/`), per constitution Principle III; each contract maps to a test (see quickstart.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4

## Path Conventions

- Server code under `server/`, shared schemas under `shared/`, `vite.config.ts` and `package.json` at the repo root.

## Dependencies on other features

- Full authentication (T014) depends on feature 003; CI gates and header definitions are owned by feature 013.

## Phase 1: Containment
- [ ] T001 [US1] Bind to `127.0.0.1` by default with `HOST` override in `server/index.ts`; document in `README.md` (SEC-001)

## Phase 2: Dependencies (US2)
- [ ] T002 [US2] Run `npm audit fix`; verify `npm test` and `npm run build` (SEC-002)
- [ ] T003 [US2] Upgrade direct deps with advisories (`express`, `drizzle-orm`, `ws`, `postcss`, `zod`, `drizzle-zod`) one at a time, testing after each
- [ ] T004 [US2] Record any residual advisory as an owned, time-bounded acceptance (per 013); add `npm audit --omit=dev --audit-level=high` script
- [ ] T017 [P] [US2] Remove unused deps (`passport`, `express-session`, `memorystore`, `connect-pg-simple`, `ws`, `pg`, `@neondatabase/serverless`) unless 003 needs them; set `app.disable('x-powered-by')` (FR-012)

## Phase 3: HTTP hardening (US3)
- [ ] T005 [P] [US3] Add `helmet` in `server/index.ts` (shared with 013 US3) (SEC-003)
- [ ] T006 [P] [US3] Add `express-rate-limit` for `/api` (stricter on mutations) (SEC-003)
- [ ] T007 [P] [US3] In `server/vite.ts`: merge `viteConfig.server` instead of replacing it (restores `fs.strict`/`fs.deny`), replace `allowedHosts: true` with an allowlist, stop `process.exit(1)` in the `customLogger.error` hook, and add `**/.*/**` to `fs.deny` in `vite.config.ts`; add a regression test with foreign Host (SEC-004, `familytree:dev-server:fs-deny-overridden-project-files-readable`)
- [ ] T008 [US3] Rewrite error middleware: generic 5xx message, server-side log, no re-throw (rethrow only drops the connection, it does not crash the process) (SEC-006)
- [ ] T009 [US3] Remove response-body logging in request logger (SEC-007)
- [ ] T010 [US3] Add `server/__tests__/security.test.ts` (headers, 429, generic 500 body)

## Phase 4: Data handling (US4)
- [ ] T011 [P] [US4] Parameterize `getEvents`; validate `memberIds` (positive ints, max count) and require finite, bounded `x`/`y` in position PATCH in `server/routes.ts` + test (SEC-005)
- [ ] T012 [P] [US4] Tighten `shared/schema.ts`: `photoUrl` http(s), length caps on `biography`/`notes`/`description`, `memberIds` max + existence check; tests (SEC-008)
- [ ] T013 [P] [US4] Require `DATABASE_URL` in production, remove hard-coded fallback, add `DATABASE_SSL`, guard `cleanup.ts`/`seed.ts` against production (SEC-009)

## Phase 5: Process & Auth verification
- [ ] T014 [US1] After feature 003: add test enumerating all `/api` routes asserting 401 unauthenticated / 403 non-member (SEC-001)
- [ ] T015 Reconcile spec 013 status and tasks with actual state; implement its CI gates (SEC-010)
- [ ] T016 Re-run the `security-audit` skill after T001–T015; append a new dated section to `audit-report.md` (FR-011)

## Dependencies
T001 → none (T001 binds to loopback, the interim mitigation for `familytree:api:no-authn`); T003 after T002; T005 shares work with 013; T014 depends on 003; T017 after T002; T016 last (after T001–T015 and T017).
