# Data Model: Backend Service Architecture and Reliability

**Feature**: 009-backend-service-architecture | **Date**: 2026-08-24

## Overview

This feature makes **no database schema changes**. The persistent entities (`familyMembers`,
`relationships`, `familyEvents` in `shared/schema.ts`) are unchanged. The "model" documented here
is the **domain-rule set** the service layer enforces and the **error taxonomy** the centralized
handler maps — both of which downstream tasks and tests reference.

## Persistent Entities (unchanged — reference only)

| Entity | Key fields (existing) | Notes |
|--------|-----------------------|-------|
| Family Member | `id`, `firstName`, `lastName?`, `gender?`, dates, `x`, `y` | Unchanged |
| Relationship | `id`, `fromMemberId`, `toMemberId`, `type`, `subType?`, `status?` | Unique index on (`fromMemberId`, `toMemberId`, `type`) already exists |
| Family Event | `id`, `type`, `date?`, `memberIds[]` | Unchanged |

## Domain Rules (enforced by the service layer)

| Rule | Applies to | Error raised | Requirement |
|------|-----------|--------------|-------------|
| A member may not be related to itself (`fromMemberId !== toMemberId`) | Relationship create/update | `ValidationError` (400) | FR-006 |
| No duplicate equivalent relationship (same from/to/type) | Relationship create | `ConflictError` (409) | FR-006 |
| Referenced members must exist | Relationship create/update; event create | `ValidationError` (400) or `NotFoundError` (404) for missing target | FR-006 |
| `relationship.type` ∈ allowed set; `relationship.status` ∈ allowed set | Relationship create/update | `ValidationError` (400) | FR-006 |
| A parent-child relationship must not create a cycle | Relationship create/update | `ValidationError` (400) | FR-006 |
| Input payload matches Zod schema | All write endpoints | `ValidationError` (400) with field detail | FR-007 |

**Deferred (explicitly out of scope)**: biological-parent count limits and birth/death date
sanity checks.

### Allowed enum values (surfaced from existing usage / schema)

- `relationship.type`: `parent-child`, `spouse`, `adopted`, `step-parent` (as used in
  `shared/schema.ts` comments; the service validates against a canonical Zod enum).
- `relationship.status`: `active`, `divorced`, `widowed`, `deceased`.
- `member.gender`: `male`, `female`, `other`, `unknown` (already enforced by
  `insertFamilyMemberSchema`).

> Exact canonical enum lists are finalized in implementation as shared Zod enums in `shared/`, so
> client and server agree.

## Error Taxonomy (mapped by the centralized handler)

| Error type | HTTP status | Response body | Detail exposure |
|------------|-------------|---------------|-----------------|
| `ValidationError` | 400 | `{ message, error? }` | Field-level `error` allowed |
| `ZodError` | 400 | `{ message, error: issues }` | Zod issues in `error` |
| `NotFoundError` | 404 | `{ message }` | No internals |
| `ConflictError` | 409 | `{ message }` | No internals |
| Unexpected (any other) | 500 | `{ message: "Internal Server Error" }` | Logged server-side only |

## Invariants

- The response body is always `{ message, error? }` (clarified contract preservation).
- The handler sends exactly one response and never re-throws after responding (FR-002).
- 500 responses never contain stack traces, credentials, or internal detail (FR-003).

## State Transitions

Not applicable — no new stateful lifecycle is introduced; relationship `status` transitions
remain data managed by existing endpoints.
