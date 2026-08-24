---
description: "Task list for Family History Q&A Assistant"
---

# Tasks: Family History Q&A Assistant

**Input**: Design documents from `/specs/006-family-history-qa/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/qa.md

**Tests**: Included, with a stubbed generator for deterministic grounding/safety tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3

## Path Conventions

- Server in `server/` (with `server/qa/`), shared types in `shared/`, client in `client/src/`.

## Phase 1: Setup

- [ ] T001 Add shared Q&A request/response types and optional index table in `shared/schema.ts` and `shared/qa.ts`
- [ ] T002 [P] Define a model-provider interface (with a stub for tests) in `server/qa/generate.ts`

## Phase 2: Foundational (blocking)

- [ ] T003 Build authorization-tagged retrievable records from family data in `server/qa/index.ts`
- [ ] T004 Implement authorization-scoped retrieval (excludes private/unauthorized) in `server/qa/retrieve.ts`
- [ ] T005 [P] Implement guardrails (scope limits, refusal, injection resistance) in `server/qa/guardrails.ts`

## Phase 3: User Story 1 — Ask Questions (P1)

**Goal**: Grounded answers with source references; honest unknowns.
**Independent test**: Answerable question returns grounded answer with sources; unanswerable returns honest "not available".

- [ ] T006 [P] [US1] Add grounding + honesty tests with a stubbed generator in `server/__tests__/qa.test.ts`
- [ ] T007 [US1] Implement grounded generation over retrieved context in `server/qa/generate.ts`
- [ ] T008 [US1] Implement `POST /api/qa` (read-only) in `server/routes.ts`
- [ ] T009 [P] [US1] Build the question/answer UI with sources in `client/src/components/family-qa.tsx`

## Phase 4: User Story 3 — Keep Answers Authorized (P1, safety)

**Goal**: No private/unauthorized data used or revealed.
**Independent test**: Limited-access user gets no private data; public surface uses only public data.

- [ ] T010 [P] [US3] Add authorization/no-disclosure tests in `server/__tests__/qa-authz.test.ts`
- [ ] T011 [US3] Enforce scope filtering before generation in `server/qa/retrieve.ts` and `server/routes.ts`

## Phase 5: User Story 2 — Trust and Verify (P2)

**Goal**: Answers cite records; uncertainty is communicated.
**Independent test**: Answers link to underlying records; conflicting records surface uncertainty.

- [ ] T012 [P] [US2] Add citation + uncertainty tests in `server/__tests__/qa.test.ts`
- [ ] T013 [US2] Attach source references and uncertainty notes to answers in `server/qa/generate.ts`
- [ ] T014 [US2] Render clickable sources in `client/src/components/family-qa.tsx`

## Phase 6: Polish & Cross-Cutting

- [ ] T015 [P] Ensure the Q&A UI is accessible and responsive in `client/src/components/family-qa.tsx`
- [ ] T016 Update `README.md` with model provider/env notes
- [ ] T017 Run `npm test` and `npm run check`; confirm green

## Dependencies

- Setup (T001–T002) → Foundational (T003–T005) → US1 (T006–T009) → US3 authorization (T010–T011) → US2 (T012–T014) → Polish.
- US3 (authorization/no-disclosure) is a P1 safety gate and should be verified alongside US1.

## Parallel Execution Examples

- After T005: run T006, T010, T012 (separate test files) in parallel.

## Implementation Strategy

- MVP = US1 + US3 together (grounded answers that never leak private data).
- Add US2 verifiable citations/uncertainty next. Authorization scope aligns with feature 003;
  without it, operate over the single owner's data.
