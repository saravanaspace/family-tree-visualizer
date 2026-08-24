---
description: "Task list for Code Quality Tooling and Continuous Integration"
---

# Tasks: Code Quality Tooling and Continuous Integration

**Input**: Design documents from `/specs/008-code-quality-tooling/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tooling-contract.md

**Tests**: No application unit tests — this feature is verification infrastructure; validation is
performed by running the tooling commands and the pipeline (see Polish phase).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4

## Path Conventions

- Root-level config (`eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `package.json`),
  CI under `.github/workflows/`, docs in `README.md`.

## Phase 1: Setup

- [ ] T001 Add dev dependencies (eslint, @eslint/js, typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier, prettier) to `package.json`
- [ ] T002 Add quality scripts (`lint`, `lint:fix`, `format`, `format:check`) to `package.json`

## Phase 2: Foundational (blocking)

- [ ] T003 Create `.prettierignore` and define the shared exclusion set (node_modules, dist, coverage, migrations) reused by both linter and formatter

## Phase 3: User Story 1 — Catch Issues Locally (P1)

**Goal**: A single command flags style and likely-correctness issues across client/server/shared.
**Independent test**: `npm run lint` reports a deliberately introduced unused variable and exits non-zero; passes when clean.

- [ ] T004 [US1] Create flat ESLint config (TypeScript rules repo-wide; React + hooks rules for `client/src/**`; Node globals for `server/**`; shared `ignores`) in `eslint.config.js`
- [ ] T005 [US1] Relax lint rules for generated primitives under `client/src/components/ui/**` in `eslint.config.js`
- [ ] T006 [US1] Run `npm run lint`, then triage and resolve or scope initial violations so the baseline passes

## Phase 4: User Story 2 — Consistent Formatting (P1)

**Goal**: One agreed formatting style with write and verify modes, not conflicting with lint.
**Independent test**: `npm run format` normalizes a misformatted file; `npm run format:check` passes after and fails on drift.

- [ ] T007 [P] [US2] Create Prettier style config in `.prettierrc.json`
- [ ] T008 [US2] Add `eslint-config-prettier` last in `eslint.config.js` to disable conflicting stylistic rules
- [ ] T009 [US2] Run repo-wide `npm run format` as a standalone normalization commit and confirm `npm run format:check` passes

## Phase 5: User Story 3 — Enforce Before Merge (P1)

**Goal**: A pipeline runs type-check, lint, format-check, and tests on PRs and pushes to `main`, enforced by branch protection.
**Independent test**: A change failing one check fails the run and names the step; branch protection blocks merge until green.

- [ ] T010 [US3] Create CI workflow (triggers: `pull_request` + `push` to `main`; steps: `npm run check`, `npm run lint`, `npm run format:check`, `npm test`; Node 20; `npm ci`) in `.github/workflows/ci.yml`
- [ ] T011 [US3] Document required-status-check / branch-protection setup for `main` in `README.md`

## Phase 6: User Story 4 — Accurate Project Identity (P3)

**Goal**: Metadata and docs describe this application, not a template.
**Independent test**: Package name reads `family-tree-visualizer`; documented commands all run as described.

- [ ] T012 [P] [US4] Rename package `name` from `rest-express` to `family-tree-visualizer` in `package.json`
- [ ] T013 [P] [US4] Update `README.md` project identity and list the quality commands (lint, format, format:check, check, test)

## Phase 7: Polish & Cross-Cutting

- [ ] T014 Run `npm run check`, `npm run lint`, `npm run format:check`, and `npm test` locally and confirm all green
- [ ] T015 [P] Confirm no `rest-express` references remain in metadata or documentation

## Dependencies

- Setup (T001–T002) → Foundational (T003) → US1 (T004–T006) → US2 (T007–T009) → US3 (T010–T011) → US4 (T012–T013) → Polish (T014–T015).
- US2 T008 edits `eslint.config.js` created in US1 T004 (sequential); US2 T007 (Prettier config) is independent.
- US4 is cosmetic and independent of US1–US3.

## Parallel Execution Examples

- T007 (Prettier config), T012 (package rename), and T013 (README) touch different files and can run in parallel.
- US4 (T012–T013) can proceed in parallel with US1–US3 at any time.

## Implementation Strategy

- MVP = US1 + US2 + US3 (lint, format, and an enforced pipeline). US4 is a low-risk cosmetic follow-up.
- Land the repo-wide formatting normalization (T009) as its own commit, separate from behavioral changes, to keep review trustworthy.
