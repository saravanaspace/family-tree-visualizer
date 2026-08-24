---
description: "Task list for Member Search and Filtering"
---

# Tasks: Member Search and Filtering

**Input**: Design documents from `/specs/002-member-search-filtering/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/search.md

**Tests**: Included (constitution requires behavior-driven verification).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3

## Path Conventions

- Client in `client/src/`, shared types in `shared/`.

## Phase 1: Setup

- [ ] T001 Add a shared search types module in `shared/search.ts` (SearchQuery, FilterSet, SearchResult)

## Phase 2: Foundational (blocking)

- [ ] T002 Create the `useMemberSearch` hook scaffold in `client/src/hooks/use-member-search.ts`
- [ ] T003 [P] Add text normalization helper (case/accent/whitespace) in `client/src/lib/text.ts`

## Phase 3: User Story 1 — Find a Person by Name (P1)

**Goal**: Locate people by partial name and act on a result.
**Independent test**: Type a partial name; matches list; selecting focuses the member.

- [ ] T004 [P] [US1] Add name-matching unit tests in `client/src/hooks/__tests__/use-member-search.test.ts`
- [ ] T005 [US1] Implement case/accent/whitespace-insensitive name matching in `client/src/hooks/use-member-search.ts`
- [ ] T006 [US1] Build the search box and results list in `client/src/components/member-search.tsx`
- [ ] T007 [US1] Wire result selection to focus/navigation in `client/src/pages/family-tree.tsx`
- [ ] T008 [P] [US1] Add empty-state rendering test in `client/src/components/__tests__/member-search.test.tsx`

## Phase 4: User Story 2 — Filter by Attributes (P2)

**Goal**: Narrow people by living status, birth period, location.
**Independent test**: Apply/clear filters; results narrow/restore; missing attributes excluded only from that filter.

- [ ] T009 [P] [US2] Add filter logic tests (living, birth period, location, missing-attribute exclusion) in `client/src/hooks/__tests__/use-member-search.test.ts`
- [ ] T010 [US2] Implement filters in `client/src/hooks/use-member-search.ts`
- [ ] T011 [US2] Build filter controls in `client/src/components/member-filters.tsx`

## Phase 5: User Story 3 — Combine Search With Filters (P3)

**Goal**: Search + filters narrow to one person.
**Independent test**: Combined query ANDs; empty result shows guidance.

- [ ] T012 [P] [US3] Add combined search+filter tests in `client/src/hooks/__tests__/use-member-search.test.ts`
- [ ] T013 [US3] Ensure hook composes search AND filters and drives the empty state in `client/src/hooks/use-member-search.ts`

## Phase 6: Polish & Cross-Cutting

- [ ] T014 [P] Ensure search/filters are keyboard-accessible and responsive in `client/src/components/member-search.tsx` and `member-filters.tsx`
- [ ] T015 Run `npm test` and `npm run check`; confirm green

## Dependencies

- Setup (T001) → Foundational (T002–T003) → US1 (T004–T008) → US2 (T009–T011) → US3 (T012–T013) → Polish.

## Parallel Execution Examples

- After T003: run T004, T008, T009, T012 in parallel (separate test files).

## Implementation Strategy

- MVP = US1 (name search + focus). Add US2 filters and US3 combination incrementally.
