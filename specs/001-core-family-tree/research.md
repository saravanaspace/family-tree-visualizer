# Phase 0 Research: Core Family Tree Baseline and Improvements

## Current-State Findings

- Baseline is implemented: `server/routes.ts` exposes family-tree, member, relationship, and
  event endpoints; `server/storage.ts` implements persistence; `shared/schema.ts` defines tables
  and Zod validation; the client renders tree and timeline views.
- `npm run check` currently reports TypeScript errors (Drizzle date typing in `server/storage.ts`,
  `unknown` error access in `server/seed.ts`, and a layout typing issue plus a `getSpouseGroup`
  argument-type bug in `client/src/pages/family-tree.tsx`). These block the constitution's
  type-check gate.
- Error handling is per-route and inconsistent; there is no shared error shape.
- Relationship creation validates shape via Zod but not domain rules (e.g., self-relationship).

## Decision: Centralized error handling

- **Decision**: Introduce a single Express error-handling path returning a consistent JSON error
  shape and status codes; route handlers throw typed errors instead of ad-hoc `res.status`.
- **Rationale**: Satisfies FR-011 and removes duplicated, divergent error responses.
- **Alternatives considered**: keep per-route handling (inconsistent, hard to test).

## Decision: Domain validation in the storage/service layer

- **Decision**: Enforce domain invariants (no self-relationship, no duplicate equivalent
  relationship, valid member references) before persistence, with clear errors.
- **Rationale**: Satisfies FR-010 and protects data integrity beyond shape validation.
- **Alternatives considered**: client-only checks (bypassable); DB constraints only (poorer error
  messages, partial coverage).

## Decision: Explicit behavior for unusual graphs and incomplete data

- **Decision**: Define and test behavior for disconnected branches, multiple roots, cycles,
  undated events, and unknown fields so rendering and stats never crash.
- **Rationale**: Satisfies FR-013 and the spec's edge cases.
- **Alternatives considered**: leave undefined (source of latent bugs).

## Decision: Resolve existing type errors as part of hardening

- **Decision**: Fix the Drizzle date typing, `unknown` error handling, and client layout/typing
  issues so `npm run check` passes.
- **Rationale**: Constitution principle II and the completion gate require a passing type check.
- **Alternatives considered**: defer (leaves the gate red and blocks compliant completion).

## Decision: Expand automated coverage

- **Decision**: Add Vitest coverage for relationship rules, deletion cascades, event filtering,
  and edge cases in `server/__tests__`.
- **Rationale**: Satisfies FR-014 and the verification principle.
- **Alternatives considered**: manual testing only (not repeatable).

## Open Items

- None blocking; specific error codes and messages finalized during tasks.
