# Quickstart & Validation: Deployment and Release Process

**Feature**: 012-deployment-release | **Date**: 2026-08-24

This guide validates the release process end-to-end. It references
[contracts/config-contract.md](contracts/config-contract.md) and
[contracts/health-contract.md](contracts/health-contract.md), and
[data-model.md](data-model.md) for the release concepts.

## Prerequisites

- Node.js 20 and npm installed; a container runtime available for the image path.
- A reachable PostgreSQL instance and its connection string.
- Copy `.env.example` to `.env` and fill in real values (never commit `.env`).

## 1. Reproducible build artifact (FR-001, FR-002, FR-003)

```powershell
npm ci
npm run build            # produces dist/ (client assets + bundled server)
# Portable artifact:
docker build --build-arg BUILD_ID=$(git rev-parse --short HEAD) -t familytree:local .
```

- **Expected**: the image builds from a clean checkout with no manual steps and contains no
  dev-only tooling in the runtime stage.
- **Validate run**: `docker run --env-file .env -p 5000:5000 familytree:local` serves the app.

## 2. Fail-fast configuration (FR-004, FR-005)

```powershell
# Unset a required value and start:
$env:DATABASE_URL = ""; npm run start
```

- **Expected**: the process exits non-zero within seconds and prints a clear message naming the
  missing key (`DATABASE_URL`). No insecure default connection is used.
- **Validate secrets**: confirm no secret values are printed during startup, and that `.env` is
  git-ignored and excluded from the image (`.dockerignore`).

## 3. Ordered, safe migrations (FR-006, FR-007)

```powershell
npm run db:migrate       # ordered release step, run BEFORE serving
```

- **Expected (fresh DB)**: migrations apply in order and bring the schema current.
- **Validate idempotency**: run `npm run db:migrate` again; expect no duplicate/destructive change.
- **Validate fail-stop**: point at an unreachable DB; expect a non-zero exit that would halt the
  release rather than starting the app against an inconsistent schema.

## 4. Health verification (FR-008, FR-009)

```powershell
curl http://localhost:5000/api/health -i
```

- **Expected (DB reachable)**: `200` with `{ "status": "ok", "version": "<build id>" }`.
- **Validate unhealthy**: stop the database (or use a bad `DATABASE_URL`) and re-query; expect
  `503 { "status": "unhealthy" }`.

## 5. Release traceability (FR-010)

- Start the app and check the startup log and `/api/health` `version` field.
- **Expected**: the build identifier matches the source version (git SHA) the artifact was built
  from.

## 6. Rollback (FR-011)

- Redeploy the previous known-good image tag / previous release.
- **Expected**: the running application returns to the previous version; the runbook documents how
  to handle a migration that is not backward-compatible (expand-and-contract; irreversible
  migrations flagged in release notes).

## 7. Automated tests

```powershell
npm test
```

- **Expected**: config fail-fast tests and health-endpoint (200/503) tests pass.

## Success signals

- SC-001/SC-002: a single documented process yields a runnable artifact and deploys to a fresh
  environment with no undocumented steps.
- SC-003: missing required config fails within seconds naming the value.
- SC-004: no secrets in committed source or the artifact.
- SC-005: migrations bring a fresh DB current and re-running leaves a current schema unchanged.
- SC-006: health is `200` only when able to serve; `503` when a dependency is down.
- SC-007: each release maps back to its exact source version.
- SC-008: a documented rollback returns to the previous known-good release.
