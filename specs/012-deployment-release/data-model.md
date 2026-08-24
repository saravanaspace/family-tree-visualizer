# Data Model: Deployment and Release Process

**Feature**: 012-deployment-release | **Date**: 2026-08-24

## Overview

This feature introduces **no persistent application data entities** and makes no schema changes.
The "model" here is the set of release and operational concepts (artifact, release, environment
configuration, health signal) that downstream tasks and tests reference.

## Release Artifact (non-data)

| Aspect | Description |
|--------|-------------|
| Contents | Built client assets + bundled server (`dist/`), production dependencies, and `migrations/` |
| Producer | Multi-stage `Dockerfile` build stage (`npm ci` + `npm run build`) |
| Runtime | Slim Node.js 20 image running `node dist/index.js`, no dev tooling |
| Identity | Tagged with a build/version identifier (git SHA or package version) |

## Release (non-data)

| Aspect | Description |
|--------|-------------|
| Source traceability | Maps to the exact source version it was built from (build id) |
| Migration state | The set of `migrations/` applied as the ordered pre-start release step |
| Configuration | The environment configuration supplied at deploy time (below) |
| Completion | Considered complete only after health verification passes |

## Environment Configuration (validated at startup, not committed)

| Key | Required | Purpose | Default |
|-----|----------|---------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | none (fail fast) |
| `PORT` | No | HTTP listen port | `5000` |
| `NODE_ENV` | No | Runtime mode (`development`/`production`) | `development` |
| `LOG_LEVEL` | No | Log verbosity (see feature 011) | `info` |
| `SESSION_SECRET` | Yes (prod) | Session signing secret | none in production (fail fast) |

**Validation rules**: parsed and validated with `zod` at startup; missing/invalid required keys
produce a single clear error listing every offending key, and the process exits non-zero before
serving. No secrets appear in committed source; `.env.example` holds placeholder values only.

## Health Signal (readiness)

| State | Condition | Response |
|-------|-----------|----------|
| healthy | Process up **and** database reachable (`SELECT 1` succeeds) | `200 { status: "ok", version }` |
| unhealthy | Database unreachable or a required dependency fails | `503 { status: "unhealthy" }` |

## Lifecycle / States

A release progresses through: **built** (artifact produced from a source version) → **configured**
(environment config supplied and validated at startup) → **migrated** (ordered migration step
applied; release halts on failure) → **serving** (app listening) → **verified** (health check
healthy) → optionally **rolled back** (previous known-good artifact redeployed). No persistence
beyond the running deployment.
