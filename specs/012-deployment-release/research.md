# Phase 0 Research: Deployment and Release Process

**Feature**: 012-deployment-release | **Date**: 2026-08-24

This document resolves the technical unknowns for establishing a repeatable build, configuration,
migration, deploy, health-verification, and rollback process. Feature 008 explicitly deferred
deployment/release automation; this feature picks it up.

## Current state (what is being replaced/added)

- Build exists: `vite build && esbuild server/index.ts --bundle --format=esm --outdir=dist`;
  start exists: `NODE_ENV=production node dist/index.js`.
- Migrations exist: `server/db/migrate.ts` applies `migrations/` against `DATABASE_URL` and
  `process.exit(1)` on failure — a good ordered release step, currently not part of a documented
  release flow.
- Configuration is scattered: several modules read `process.env.DATABASE_URL` directly, and
  `server/storage.ts` falls back to a hardcoded `postgres://postgres:postgres@localhost:5432/...`
  connection string — an insecure default with no fail-fast behavior.
- The listen port is hardcoded to `5000`; there is no health/readiness endpoint and no release
  version traceability.
- A `.replit` file indicates the current deployment target.

## Decision: reproducible artifact via a multi-stage container image

- **Decision**: Package the app as a multi-stage `Dockerfile` — a build stage runs `npm ci` +
  `npm run build`; a slim runtime stage (node:20-slim) copies `dist/`, production `node_modules`,
  and `migrations/`, and runs `node dist/index.js`. Add `.dockerignore`.
- **Rationale**: A container image is the most platform-agnostic way to satisfy FR-001..FR-003
  (a complete, reproducible artifact from a given source version that runs without dev tooling).
  It reuses the existing build unchanged and pins Node 20.
- **Alternatives considered**:
  - Ship raw `dist/` + a runbook only — acceptable and kept as the Replit path, but less
    reproducible across environments; the image is the primary portable artifact.
  - Buildpacks/Nixpacks (Replit-native) — viable on Replit but platform-specific; the Dockerfile
    keeps the artifact portable while Replit's own build continues to work.

## Decision: centralized, validated configuration with fail-fast

- **Decision**: Add `server/config.ts` that parses and validates environment variables with `zod`
  at startup (`DATABASE_URL` required; `PORT` default 5000; `NODE_ENV`; `LOG_LEVEL`; and
  `SESSION_SECRET` required in production). Export a typed `config` object; throw a clear,
  aggregated error listing missing/invalid keys and exit non-zero on failure. Replace direct
  `process.env` reads and the insecure default DB URL in `server/storage.ts`.
- **Rationale**: Satisfies FR-004/FR-005 (externalized config, fail-fast with a clear message)
  and the constitution's "configuration outside committed source" constraint. `zod` is already a
  dependency, so no new library is added.
- **Alternatives considered**:
  - Keep inline `process.env` reads with fallbacks — rejected: hides misconfiguration and ships an
    insecure default connection string.
  - A config library (convict, env-var) — rejected: `zod` already covers the need.

## Decision: migrations as an ordered, fail-stopping release step

- **Decision**: Reuse `npm run db:migrate` (`server/db/migrate.ts`) as the explicit pre-start
  release step; the release runs migrations to completion before the app serves traffic, and a
  migration failure (non-zero exit) stops the release. Optionally add a convenience
  `start:release` script that runs migrate then start.
- **Rationale**: Satisfies FR-006/FR-007. Drizzle's migrator only applies not-yet-applied
  migrations (safe to re-run), and the script already exits non-zero on failure.
- **Alternatives considered**:
  - Auto-migrate on app boot inside `index.ts` — rejected: couples serving to migration and makes
    failures harder to gate; a discrete step is clearer and safer.
  - Manual SQL application — rejected: not repeatable, error-prone.

## Decision: readiness health endpoint

- **Decision**: Add `GET /api/health` that runs a lightweight `SELECT 1` against the database and
  returns `200 { status: "ok", version }` when reachable, `503 { status: "unhealthy" }` when not.
- **Rationale**: Satisfies FR-008/FR-009 — health reflects the ability to serve (including the DB
  dependency), enabling post-deploy verification.
- **Alternatives considered**:
  - Liveness-only (process up) — rejected: would report healthy even when the DB is unreachable.
  - Separate `/livez` and `/readyz` — deferred: a single readiness endpoint meets the requirement;
    can be split later.

## Decision: release traceability via build metadata

- **Decision**: Inject a version/build identifier (git SHA or package version) as a build argument
  / environment variable, surface it at startup logging and in the health response.
- **Rationale**: Satisfies FR-010 (each release traceable to its exact source version).
- **Alternatives considered**: No version surfacing — rejected: fails traceability.

## Decision: rollback strategy and migration compatibility

- **Decision**: Document rollback as redeploying the previous known-good artifact (previous image
  tag / previous release). Adopt expand-and-contract guidance for schema changes so a rollback of
  application code remains compatible with the current schema; migrations that are not
  backward-compatible are explicitly called out in the release notes/runbook.
- **Rationale**: Satisfies FR-011 and the edge case about non-reversible migrations, without
  requiring automated down-migrations (which Drizzle does not emphasize).
- **Alternatives considered**:
  - Automated down-migrations — rejected: higher risk and complexity; expand-contract plus
    redeploy-previous is the pragmatic, safe default for this app's scale.

## Decision: secret handling in deploy output

- **Decision**: Never echo secrets in build/deploy commands or logs; `.env` is git-ignored and
  excluded via `.dockerignore`; `.env.example` documents keys with placeholder values only.
- **Rationale**: Satisfies FR-012 and the constitution's configuration constraint. Aligns with the
  logging feature (011) redaction guarantees.

## Decision: optional CI automation depends on feature 008

- **Decision**: Treat automated build-and-deploy from CI as a follow-on that plugs into feature
  008's pipeline once it exists (FR-014, SHOULD). This feature delivers the artifact, config,
  migration step, health check, and runbooks that such automation would invoke.
- **Rationale**: Keeps this feature independently shippable while enabling later automation.

## Open items for planning/tasks

- The exact required-vs-optional config key list is finalized in tasks against real usage
  (`DATABASE_URL`, `PORT`, `NODE_ENV`, `LOG_LEVEL`, `SESSION_SECRET`).
- Whether to add the `start:release` convenience script or keep migrate/start as two documented
  commands is decided during implementation.
- Base image pinning (digest) and image size trimming are tuning details for the Dockerfile task.
