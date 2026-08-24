---
description: "Task list for Deployment and Release Process"
---

# Tasks: Deployment and Release Process

**Input**: Design documents from `/specs/012-deployment-release/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/config-contract.md, contracts/health-contract.md

**Tests**: Included (Vitest unit tests for fail-fast config validation + a supertest integration test for the health endpoint), per constitution Principle III and spec SC-003/SC-006.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4, US5

## Path Conventions

- Backend in `server/`; root-level `Dockerfile`/`.dockerignore`/`.env.example`; tests under `server/__tests__/`; docs in `README.md`.

## Phase 1: Setup

- [ ] T001 [P] Add `supertest` and `@types/supertest` (dev) to `package.json` for the health integration test (skip if already present from features 009/010/011)
- [ ] T002 [P] Create `.env.example` documenting required config keys with placeholder (non-secret) values: `DATABASE_URL`, `PORT`, `NODE_ENV`, `LOG_LEVEL`, `SESSION_SECRET`

## Phase 2: Foundational (blocking)

- [ ] T003 Create a build/version accessor (reads `BUILD_ID` or `npm_package_version`) in `server/lib/version.ts` — used by the health response (US4) and startup/traceability (US5)

**Checkpoint**: Version identifier available for health and traceability.

## Phase 3: User Story 1 — Reproducible Release Build (P1)

**Goal**: A single documented process produces a complete, runnable production artifact from a source version with no manual steps.
**Independent test**: From a clean checkout, build the image and run it; the app serves without dev-only tooling.

- [ ] T004 [US1] Create a multi-stage `Dockerfile` (build stage: `npm ci` + `npm run build`; runtime stage on `node:20-slim` copying `dist/`, production dependencies, and `migrations/`; `CMD ["node","dist/index.js"]`; `ARG BUILD_ID`)
- [ ] T005 [P] [US1] Create `.dockerignore` excluding `node_modules`, `dist`, `coverage`, `.env`, `specs`, `.git`, `.github`
- [ ] T006 [US1] Document the build + run steps (produce `dist/`, build/run the image) in `README.md`

**Checkpoint**: A portable, reproducible artifact exists.

## Phase 4: User Story 2 — Externalized Configuration and Secrets (P1)

**Goal**: All environment config/secrets are supplied at deploy time and validated at startup, failing fast on missing required values.
**Independent test**: Start with a required value missing and confirm a non-zero exit with a clear message naming the missing key; no insecure default is used.

- [ ] T007 [US2] Create `server/config.ts` with a Zod schema validating `DATABASE_URL` (required), `PORT` (default `5000`), `NODE_ENV`, `LOG_LEVEL`, and `SESSION_SECRET` (required in production); aggregate all errors, print a clear message, and exit non-zero on failure
- [ ] T008 [US2] Replace direct `process.env.DATABASE_URL` reads and the insecure default connection string with the validated `config` in `server/storage.ts`
- [ ] T009 [US2] Use `config.PORT` for the listen port and log the version at startup in `server/index.ts`
- [ ] T010 [P] [US2] Add unit tests asserting fail-fast on missing required keys (aggregated, clear message, non-zero) in `server/__tests__/config.test.ts`

**Checkpoint**: Configuration is externalized, validated, and safe.

## Phase 5: User Story 3 — Safe Ordered Migrations on Release (P1)

**Goal**: Migrations are applied as a defined, ordered pre-start release step that halts the release on failure.
**Independent test**: Run the migration step against a fresh DB (schema becomes current) and re-run it (no change); an unreachable DB exits non-zero.

- [ ] T011 [US3] Add a `start:release` script running `db:migrate` before `start` (migrate-then-serve) in `package.json`
- [ ] T012 [US3] Document the ordered migration release step (run before serving; non-zero halts the release) and its idempotency in `README.md`

**Checkpoint**: Releases apply migrations safely and in order.

## Phase 6: User Story 4 — Verify a Deployment Is Healthy (P2)

**Goal**: A readiness endpoint reports healthy only when the app can serve, including database reachability.
**Independent test**: Query `/api/health` with the DB reachable (200) and with it unavailable (503).

- [ ] T013 [US4] Add `GET /api/health` returning `200 { status: "ok", version }` when a lightweight `SELECT 1` via the storage client succeeds and `503 { status: "unhealthy" }` when it fails, in `server/routes.ts`
- [ ] T014 [P] [US4] Add supertest integration test asserting `200` when the DB is reachable and `503` when it is not in `server/__tests__/health.test.ts`

**Checkpoint**: Deployments can be health-verified.

## Phase 7: User Story 5 — Recover From a Bad Release (P3)

**Goal**: Releases are traceable to their source version and there is a documented rollback path.
**Independent test**: Confirm the running version (startup log + health response) matches the built source version; follow the rollback runbook to the previous release.

- [ ] T015 [US5] Surface the build/version id in the startup log and the `/api/health` response by wiring `server/lib/version.ts` (depends on T003, T013)
- [ ] T016 [US5] Document the rollback runbook (redeploy the previous known-good artifact; expand-and-contract for schema changes; flag non-reversible migrations) in `README.md`

**Checkpoint**: Releases are traceable and recoverable.

## Phase 8: Polish & Cross-Cutting

- [ ] T017 Run `npm run check` and `npm test`; confirm config fail-fast and health `200`/`503` behavior pass
- [ ] T018 [P] Validate `quickstart.md` end-to-end (build, fail-fast config, migration idempotency, health `200`/`503`, rollback) and confirm no secrets appear in committed source or the artifact

## Dependencies

- Setup (T001–T002) → Foundational (T003) → US1 (T004–T006) → US2 (T007–T010) → US3 (T011–T012) → US4 (T013–T014) → US5 (T015–T016) → Polish (T017–T018).
- T009 (US2) depends on `config` (T007) and `version` (T003); T015 (US5) depends on `version` (T003) and the health endpoint (T013).
- T008 and T009 (US2) both read the validated config (T007) — sequential after T007.
- Coordination: `LOG_LEVEL` config here aligns with the logging feature (011); the health endpoint and config module are independent of it.

## Parallel Execution Examples

- Setup T001 and T002 (separate files) run in parallel.
- T005 (`.dockerignore`) runs alongside T004 (`Dockerfile`).
- Test files T010 (`config.test.ts`) and T014 (`health.test.ts`) can be written in parallel with their sibling implementation.

## Implementation Strategy

- MVP = US1 + US2 + US3 (the P1 core): a reproducible artifact, validated externalized config with fail-fast, and safe ordered migrations — the minimum for a trustworthy release.
- Then US4 (health verification) and US5 (traceability + rollback). Each phase is an independently testable increment; requirements stay platform-agnostic and no application behavior changes.
