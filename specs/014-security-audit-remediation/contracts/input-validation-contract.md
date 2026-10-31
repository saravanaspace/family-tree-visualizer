# Input Validation Contract

**Feature**: 014-security-audit-remediation | **Date**: 2026-10-31 | **Covers**: FR-005, FR-008, FR-009

## Requirements

| Input | Rule | Failure |
|-------|------|---------|
| `GET /api/events?memberIds` | Array of positive integers, bounded count; non-array, objects, `NaN`, `1abc` rejected | 400 |
| `getEvents` query | Parameterized array overlap; no `sql.raw` with request data | n/a |
| `PATCH /api/family-members/:id/position` `x`,`y` | Finite numbers within a defined canvas range; `Infinity` rejected | 400 |
| `:id` path params | Positive integer, full-string match (no `parseInt` truncation) | 400 |
| `photoUrl` | `http` or `https` URL only | 400 |
| `biography`, `notes`, event `description` | Maximum length | 400 |
| Event `memberIds` | Maximum count; every id references an existing member | 400 |
| `DATABASE_URL` | Required when `NODE_ENV=production`; no hard-coded fallback | startup error |
| `DATABASE_SSL` | Optional TLS setting for the DB connection | n/a |
| `cleanup`, `seed` scripts | Refuse when `NODE_ENV=production` unless explicitly forced | exit non-zero |

## Verification

Vitest/supertest cases for each row (T011–T013). Replays in the audit showed `'1abc'`→`[1]`, `memberIds[a]=1`→`ARRAY[NaN]` (caught 400), and `1e999`→`Infinity`; these become explicit 400s.
