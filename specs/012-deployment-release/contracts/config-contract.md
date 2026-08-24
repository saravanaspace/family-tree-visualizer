# Configuration Contract

**Feature**: 012-deployment-release | **Date**: 2026-08-24

This contract defines the environment-configuration interface the application requires at startup
and the fail-fast behavior when it is not satisfied. It is technology-agnostic; the plan selects a
`zod`-validated `server/config.ts` to satisfy it.

## Configuration Keys

| Key | Required | Purpose | Default |
|-----|----------|---------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | none |
| `PORT` | No | HTTP listen port | `5000` |
| `NODE_ENV` | No | `development` or `production` | `development` |
| `LOG_LEVEL` | No | Log verbosity (see feature 011) | `info` |
| `SESSION_SECRET` | Yes in production | Session signing secret | none |

## Startup Validation Behavior

- On startup, configuration MUST be validated. If any required key is missing or invalid:
  - The process MUST fail fast (exit non-zero) **before** accepting requests.
  - The error MUST clearly identify **which** keys are missing or invalid (aggregated, not just the
    first failure).
- When validation passes, a single typed configuration object is the source of truth for the app;
  modules MUST NOT read `process.env` directly for these values.

## Secret-Handling Guarantees

- No real secret values appear in committed source. `.env` is git-ignored and excluded from the
  build artifact (`.dockerignore`).
- `.env.example` documents every key with placeholder (non-secret) values.
- Configuration values (especially secrets) MUST NOT be printed to logs or command output during
  startup or deployment.

## Non-Goals

- Dynamic/remote configuration reloading at runtime is out of scope.
- A secrets-manager integration is out of scope; secrets are supplied via the environment.
