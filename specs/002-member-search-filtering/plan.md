# Implementation Plan: Member Search and Filtering

**Branch**: `002-member-search-filtering` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-member-search-filtering/spec.md`

## Summary

Add fast, forgiving member search and attribute filtering so users can locate people and narrow
a large tree. The approach reuses the existing family-tree data already loaded on the client for
instant client-side search and filtering, with an optional server search endpoint for scale.
No schema change is required.

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18 client, Express server)

**Primary Dependencies**: TanStack Query, existing REST API, Drizzle ORM (server option), Zod

**Storage**: PostgreSQL (existing); no new tables

**Testing**: Vitest (client filter logic; optional server endpoint tests)

**Target Platform**: Evergreen browsers + Node server

**Project Type**: Web application (`client/` + `server/`)

**Performance Goals**: Name search returns first screen of matches within 1s for a 100-member
tree; locate a person in under 15s

**Constraints**: Read-only discovery; no mutation of member data; accessible and responsive

**Scale/Scope**: Hundreds of members; single tree

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — spec, plan, forthcoming tasks.
- **II. Consistent Type-Safe Stack**: PASS — reuses stack; shared types for any search contract
  live in `shared/`.
- **III. Behavior-Driven Verification**: PASS — matching, filtering, and empty-state logic are
  unit-tested.
- **IV. Reliable Integration Boundaries**: PASS — client-side default has no new boundary; the
  optional server endpoint gets contract tests.
- **V. Accessible, Responsive, and Focused UX**: PASS — search UI is keyboard-accessible and
  responsive.

Result: No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-member-search-filtering/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── search.md
```

### Source Code (repository root)

```text
client/
└── src/
    ├── components/
    │   ├── member-search.tsx        # NEW: search box + results list
    │   └── member-filters.tsx       # NEW: attribute filters
    ├── hooks/
    │   └── use-member-search.ts     # NEW: memoized search/filter over loaded tree
    └── pages/family-tree.tsx        # wire search to selection/focus

server/                              # OPTIONAL scale path
├── routes.ts                        # optional GET /api/search
└── storage.ts                       # optional searchFamilyTree()
```

**Structure Decision**: Client-first search over the already-loaded family tree for instant UX,
implemented in a `use-member-search` hook plus presentational components. A server endpoint is an
optional enhancement for large datasets and is contract-tested if built.

## Complexity Tracking

> No violations; no justifications required.
