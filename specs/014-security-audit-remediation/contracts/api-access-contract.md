# API Access Contract

**Feature**: 014-security-audit-remediation | **Date**: 2026-10-31 | **Covers**: FR-001, `familytree:api:no-authn`

## Requirements

- Every `/api/*` route (family tree read, family-member create/update/delete/position, relationship create/update/delete, event create/list/delete) MUST require an authenticated principal once feature 003 lands.
- Unauthenticated request → `401`. Authenticated non-member of the tree → `403`. Authorization MUST be enforced server-side on every route.
- Until 003 lands, the server MUST bind `127.0.0.1` by default; `HOST` overrides (documented for intended deployments only).
- A test MUST enumerate all registered `/api` routes and assert a guard is present, so new routes cannot ship unguarded.

## Interface summary

| Route family | Methods | Unauthenticated | Non-member |
|--------------|---------|-----------------|------------|
| `/api/family-tree` | GET | 401 | 403 |
| `/api/family-members[/:id[/position]]` | POST, PATCH, DELETE | 401 | 403 |
| `/api/relationships[/:id]` | POST, PATCH, DELETE | 401 | 403 |
| `/api/events[/:id]` | GET, POST, DELETE | 401 | 403 |

## Verification

Route-enumeration test (T014); manual checks in [quickstart.md](../quickstart.md).
