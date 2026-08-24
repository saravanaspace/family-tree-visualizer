# Implementation Plan: Core Family Tree Baseline and Enhancement Roadmap

**Branch**: `001-core-family-tree` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-core-family-tree/spec.md`

## Summary

Document the already-implemented family-tree baseline (member/relationship/event CRUD,
tree and timeline visualization, PostgreSQL persistence, REST APIs, responsive UI) and plan
the required improvements that harden it: domain-level relationship validation, consistent
error handling, explicit behavior for unusual graph shapes and incomplete data, and expanded
automated coverage. Search/filtering (FR-012) is delivered separately as feature 002 and is out
of scope here. This plan is frontend + backend within the existing stack; no framework change.

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18 client, Node/Express server)

**Primary Dependencies**: Express 4, Drizzle ORM, Zod, TanStack Query, Tailwind, Radix UI

**Storage**: PostgreSQL via Drizzle (`shared/schema.ts`, `server/storage.ts`)

**Testing**: Vitest with a test database (`server/__tests__`)

**Target Platform**: Evergreen browsers (client) + Node server

**Project Type**: Web application (`client/` + `server/` + shared `shared/`)

**Performance Goals**: Tree of 100 members remains navigable; common actions <1s for 95% of
operations

**Constraints**: Preserve existing REST contract and schema compatibility; migrations reviewed
for destructive changes; `npm run check` must pass (existing type errors in scope to fix)

**Scale/Scope**: Single family tree; hundreds of members, relationships, and events

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — spec, this plan, and forthcoming tasks trace the
  baseline and improvements.
- **II. Consistent Type-Safe Stack**: PASS — no stack change; improvements include resolving the
  current TypeScript errors surfaced by `npm run check` so the gate is honored.
- **III. Behavior-Driven Verification**: PASS — each required improvement (FR-010, FR-011,
  FR-013, FR-014) maps to storage/API/shared tests.
- **IV. Reliable Integration Boundaries**: PASS — relationship and deletion changes are validated
  across storage↔DB and API boundaries; existing endpoints keep their contract.
- **V. Accessible, Responsive, and Focused UX**: PASS — baseline UX is preserved; the dedicated
  responsive overhaul lives in feature 007.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-family-tree/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── rest-api.md
```

### Source Code (repository root)

```text
shared/
└── schema.ts                 # tables + Zod schemas (source of truth; add domain rules)

server/
├── routes.ts                 # REST endpoints; centralize error handling
├── storage.ts                # PostgresStorage; add validation + typing fixes
├── seed.ts                   # sample data (fix unknown-error typing)
└── __tests__/
    ├── setup.ts
    └── storage.test.ts       # extend: relationship rules, edge cases

client/
└── src/
    ├── pages/family-tree.tsx        # fix layout typing; behavior unchanged here
    └── components/                  # tree, timeline, cards (baseline)
```

**Structure Decision**: Existing web application. Improvements are localized to `shared/schema.ts`
(domain rules), `server/routes.ts` (centralized errors), `server/storage.ts` (validation and
type fixes), and `server/__tests__` (expanded coverage). No new top-level structure.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
