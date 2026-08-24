# Health Check Contract

**Feature**: 012-deployment-release | **Date**: 2026-08-24

This contract defines the readiness health endpoint used to verify a deployment can serve
requests. It is technology-agnostic about implementation; the plan adds it to the Express router.

## Endpoint

`GET /api/health`

## Behavior

| Condition | Status | Body |
|-----------|--------|------|
| Process up **and** database reachable (`SELECT 1` succeeds) | `200` | `{ "status": "ok", "version": "<build id>" }` |
| Database unreachable or a required dependency fails | `503` | `{ "status": "unhealthy" }` |

## Requirements

- The endpoint MUST report healthy **only** when the application can actually serve requests,
  including reaching its database dependency (readiness, not mere liveness).
- The endpoint MUST NOT require authentication and MUST NOT expose sensitive internal detail
  (connection strings, credentials, stack traces) in its response.
- The response SHOULD include the release/build identifier so a running deployment is traceable to
  its source version.
- The check MUST be lightweight (a trivial connectivity query) and fast (sub-second under normal
  conditions), suitable for repeated polling by a deploy/verify step.

## Usage in Release Verification

- After a deployment, the release process queries this endpoint; a `200` healthy response is
  required before the release is considered complete (FR-009).
- A `503` response indicates the deployment must not be promoted / should be rolled back.
