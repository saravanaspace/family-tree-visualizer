# Implementation Plan: Deployment and Release Process

**Branch**: `012-deployment-release` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-deployment-release/spec.md`

## Summary

Establish a documented, repeatable release process for the app. Produce a reproducible
production artifact from a known source version using the existing `build` output (client assets +
bundled server) packaged in a container image so it runs without dev tooling. Centralize
environment configuration and secrets into a single validated config module that fails fast when a
required value is missing, replacing the scattered `process.env.DATABASE_URL || '<insecure
default>'` fallbacks. Apply database migrations as an explicit, ordered release step (reusing the
existing `db:migrate`) that stops the release on failure. Add a health/readiness endpoint that
reports healthy only when the app can reach its database, make the listen port configurable, and
embed a build/version identifier for release traceability. Document deploy, health-verification,
and rollback runbooks. Optional CI-triggered automation builds on feature 008.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM, `"type": "module"`)

**Primary Dependencies**: Existing `vite`/`esbuild` build; `drizzle-orm` + `postgres` migrations;
`zod` (already present) for startup config validation. Packaging via a multi-stage `Dockerfile`
(no new runtime library required). No framework changes.

**Storage**: PostgreSQL — no schema change; migrations are applied as a defined release step using
the existing `migrations/` folder and `server/db/migrate.ts`.

**Testing**: Existing Vitest suite; new tests for config validation (fail-fast on missing
required values) and the health endpoint (200 when DB reachable, 503 when not), reusing
`server/__tests__/setup.ts`.

**Target Platform**: A Node.js 20 container image runnable on any container host; the existing
Replit configuration and `build`/`start` scripts remain supported. Requirements stay
platform-agnostic.

**Project Type**: Web application — single npm package with `client/` (React/Vite), `server/`
(Express), `shared/` (schemas). This feature is server/build/ops-focused.

**Performance Goals**: Startup config validation fails within seconds; health check responds in
well under a second; a release completes migrations before serving traffic.

**Constraints**: No secrets in committed source or in the built artifact; required config validated
at startup with a clear failure; migrations must be safe to re-run and must halt the release on
failure; deploy steps must not print secrets (aligned with the logging feature, 011).

**Scale/Scope**: A `Dockerfile` + `.dockerignore`, a `server/config.ts` module, a health endpoint
in `server/routes.ts`, edits to `server/index.ts` (config-driven port, version log), a
`.env.example`, and release/rollback documentation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — `spec.md` with prioritized stories exists; this
  `plan.md` follows; `tasks.md` via `/speckit-tasks`.
- **II. Consistent Type-Safe Stack**: PASS — retains TypeScript/React/Express/PostgreSQL/Drizzle;
  reuses existing build and migration tooling and `zod`. Packaging (Dockerfile) is configuration,
  not a stack change.
- **III. Behavior-Driven Verification**: PASS — new config-validation and health-endpoint
  behavior is covered by Vitest tests; migration idempotency is validated via the release step
  against the test database. Suite and `npm run check` must pass.
- **IV. Reliable Integration Boundaries**: PASS — the health check exercises the app→database
  boundary; config validation guards the app→environment boundary. No storage contract change.
- **V. Accessible, Responsive, and Focused UX**: PASS (N/A user-facing) — no UI change; scope is
  limited to release/ops concerns.

**Technical Constraints (constitution §)**: Directly satisfied — "environment-specific
configuration MUST remain outside committed source files" is enforced by the config module +
`.env.example` (no real secrets committed); migrations are reviewed for destructive changes as a
release step.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/012-deployment-release/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (release/config concepts; no persistent entities)
├── quickstart.md        # Phase 1 output (release + rollback validation guide)
├── contracts/           # Phase 1 output
│   ├── config-contract.md
│   └── health-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Dockerfile               # NEW: multi-stage build → runnable production image (no dev tooling)
.dockerignore            # NEW: exclude node_modules, dist, coverage, .env, specs, etc.
.env.example             # NEW: documents required config keys (no real secrets)
server/
├── config.ts            # NEW: zod-validated env config; fail-fast on missing required values;
│                        #      single source for DATABASE_URL, PORT, NODE_ENV, LOG_LEVEL, etc.
├── routes.ts            # EDIT: add GET /api/health (readiness: app up + DB reachable)
├── index.ts             # EDIT: load config; config-driven PORT; log version/build id at startup
├── storage.ts           # EDIT: use validated config (remove insecure inline DB-URL fallback)
└── __tests__/
    ├── config.test.ts   # NEW: fail-fast validation unit tests
    └── health.test.ts   # NEW: health endpoint 200 (DB up) / 503 (DB down) integration test
README.md                # EDIT: release runbook (build, config, migrate, deploy, verify, rollback)
package.json             # EDIT: add a release helper script (migrate-then-start) if useful
```

**Structure Decision**: Single existing web application. The reproducible artifact is a
multi-stage container image: a build stage runs `npm ci` + `npm run build`; a lean runtime stage
copies `dist/`, production dependencies, and `migrations/`, and runs `node dist/index.js`. A new
`server/config.ts` centralizes and validates environment configuration (via `zod`) so startup
fails fast on missing required values and no insecure default connection strings remain. A
`/api/health` readiness endpoint checks database connectivity. The existing `db:migrate` script is
the ordered migration release step (run before serving). Version traceability comes from a build
argument (e.g. git SHA) surfaced at startup and in the health response. The existing Replit
`build`/`start` path continues to work, keeping requirements platform-agnostic.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
