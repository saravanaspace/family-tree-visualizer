# Phase 0 Research: Code Quality Tooling and Continuous Integration

**Feature**: 008-code-quality-tooling | **Date**: 2026-08-24

This document resolves the technical unknowns for introducing static analysis, formatting, and a
CI pipeline to the existing TypeScript monorepo.

## Decision: ESLint 9 flat config with `typescript-eslint`

- **Decision**: Adopt ESLint 9 using the flat config format (`eslint.config.js`) with the
  `typescript-eslint` recommended (non-type-checked) rule set, plus `eslint-plugin-react` and
  `eslint-plugin-react-hooks` scoped to `client/src/**`.
- **Rationale**: Flat config is the current, actively supported ESLint format and composes
  cleanly for a mixed browser/Node monorepo. The non-type-checked recommended set gives strong
  correctness coverage (no-unused-vars, no-undef via globals, hooks rules) while keeping lint
  fast; type-checked rules can be layered in later without restructuring.
- **Alternatives considered**:
  - Legacy `.eslintrc` — rejected: deprecated path in ESLint 9.
  - Type-checked `typescript-eslint` rules now — deferred: significantly slower (requires a type
    program) and higher initial violation volume; not needed to establish the baseline.
  - Biome (single fast linter+formatter) — rejected: would replace Prettier and diverge from the
    ecosystem the team already uses; larger, riskier change than warranted.

## Decision: Prettier 3 for formatting, integrated to avoid rule conflicts

- **Decision**: Use Prettier 3 as the single formatter with `.prettierrc.json` and
  `.prettierignore`, and add `eslint-config-prettier` last in the ESLint config to disable
  stylistic ESLint rules.
- **Rationale**: Prettier is the de-facto formatter for this stack and provides a `--check` mode
  for CI (satisfies FR-003 write + verify modes). `eslint-config-prettier` guarantees ESLint and
  Prettier do not fight over stylistic rules (FR-004).
- **Alternatives considered**: ESLint stylistic rules only — rejected: weaker, slower formatting
  guarantees and no autoformat.

## Decision: GitHub Actions single-workflow pipeline

- **Decision**: One workflow at `.github/workflows/ci.yml` triggered on `pull_request` and on
  `push` to `main`, running four sequential/independent steps: type-check (`npm run check`),
  lint, format-check, and test. Node 20 on `ubuntu-latest`, dependencies installed with
  `npm ci`.
- **Rationale**: The repository is hosted on GitHub; Actions is the lowest-friction CI. Running
  on both PRs and pushes to `main` (per spec clarification) makes the gate real even if a change
  lands directly on `main`. `npm ci` gives reproducible installs from the committed lockfile.
- **Alternatives considered**: PR-only trigger — rejected: bypassable by direct pushes to
  `main`, which is the current workflow. Separate workflows per check — rejected: unnecessary
  fan-out; a single workflow with distinct steps reports the failing step clearly (FR-006).

## Decision: Branch protection as the enforcement mechanism

- **Decision**: Require the CI workflow as a status check via GitHub branch protection on `main`
  (a repository setting configured in the GitHub UI/API, documented in quickstart).
- **Rationale**: FR-006a requires enforcement, not just execution. Branch protection is the
  standard way to block merges on failing checks. It is configuration external to the codebase,
  so the plan documents it rather than committing it.
- **Alternatives considered**: Advisory-only CI — rejected: does not satisfy the enforced-gate
  requirement.

## Decision: No mandatory git pre-commit hooks

- **Decision**: Do not add Husky/lint-staged pre-commit hooks in this feature; rely on documented
  local commands plus the CI gate.
- **Rationale**: The spec requires runnable commands (FR-002, FR-003) and an enforced pipeline
  (FR-005), not local hooks. Omitting hooks avoids per-machine setup friction and keeps scope
  focused. Hooks can be added later as an optional enhancement.
- **Alternatives considered**: Husky + lint-staged — deferred as optional; not required to meet
  any FR.

## Decision: Package manager, Node version, and scripts

- **Decision**: Keep npm (a committed `package-lock.json` exists) and target Node 20 (matches
  `@types/node` 20). Add scripts: `lint`, `lint:fix`, `format`, `format:check`; reuse existing
  `check` (tsc) and `test`.
- **Rationale**: Consistency with the existing toolchain; no package-manager migration needed.
- **Alternatives considered**: pnpm/yarn — rejected: gratuitous churn.

## Decision: Ignore scope (generated/build/vendored)

- **Decision**: Exclude `node_modules/`, `dist/`, `coverage/`, `migrations/` SQL, and generated
  shadcn UI primitives under `client/src/components/ui/**` from formatting/lint noise where
  appropriate, via `ignores` in `eslint.config.js` and `.prettierignore`.
- **Rationale**: FR-007 requires excluding generated files, dependencies, and build outputs so the
  tooling reports signal, not noise. The `ui/` primitives are largely generated component code;
  formatting is applied but lint rules that would flag their generated patterns are relaxed.
- **Alternatives considered**: Lint everything including build output — rejected: noisy and slow.

## Decision: Project identity correction

- **Decision**: Rename the `package.json` `name` from `rest-express` to `family-tree-visualizer`
  and align README setup text.
- **Rationale**: FR-009/FR-010 require accurate metadata and documentation for onboarding.
- **Alternatives considered**: Leave as-is — rejected: misleading template residue.

## Open items for planning/tasks

- Exact ESLint rule severities (error vs warn) will be tuned during implementation so the initial
  run is achievable without a large violation backlog; violations that block the baseline may be
  auto-fixed or scoped to warnings and ratcheted up later.
- The initial repository-wide `prettier --write` normalization lands as its own commit, separate
  from behavioral changes, to keep review trustworthy (per spec assumption).
