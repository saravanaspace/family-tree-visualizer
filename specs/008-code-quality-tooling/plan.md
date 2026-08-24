# Implementation Plan: Code Quality Tooling and Continuous Integration

**Branch**: `008-code-quality-tooling` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-code-quality-tooling/spec.md`

## Summary

Establish an enforced code-health baseline for the existing TypeScript monorepo: automated
static analysis across `client/`, `server/`, and `shared/`; a single automated formatter with a
verify (check) mode; and a continuous-integration pipeline that runs type-checking, static
analysis, formatting verification, and the test suite on pull requests and pushes to `main`,
gated by branch protection. Also correct the leftover template project identity. The work is
additive tooling and configuration only — it introduces no runtime dependencies and does not
change application behavior.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM, `"type": "module"`)

**Primary Dependencies**: Dev-only — ESLint 9 (flat config) with `typescript-eslint`,
`eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-config-prettier`; Prettier 3;
GitHub Actions for the pipeline. No runtime/production dependencies added.

**Storage**: N/A (no schema, persistence, or data changes)

**Testing**: Existing Vitest suite is invoked by the pipeline; `npm run check` (tsc) is reused
as the type-check step. No new test frameworks in this feature.

**Target Platform**: Developer workstations (Windows/macOS/Linux) and GitHub Actions
`ubuntu-latest` runners on Node.js 20.

**Project Type**: Web application — single npm package with `client/` (React/Vite),
`server/` (Express), and `shared/` (schemas). Tooling spans all three.

**Performance Goals**: Full pipeline completes within 10 minutes on a typical change; local
lint and format-check over the whole repo complete in seconds.

**Constraints**: No change to application runtime behavior; must run identically on Windows dev
machines and Linux CI; generated files, dependencies, and build outputs excluded; formatting
and lint rules must not conflict.

**Scale/Scope**: Entire codebase (`client/src/**`, `server/**`, `shared/**`, root config
files); one CI workflow; package metadata rename.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — `spec.md` with prioritized stories and
  clarifications exists; this `plan.md` follows; `tasks.md` via `/speckit-tasks`.
- **II. Consistent Type-Safe Stack**: PASS — retains TypeScript/React/Express/Vitest; adds only
  dev-only tooling (ESLint, Prettier, GitHub Actions). No runtime stack change, no shared-schema
  or DB change.
- **III. Behavior-Driven Verification**: PASS — the feature itself is verification
  infrastructure; the pipeline runs `npm run check` and the Vitest suite as required gates.
- **IV. Reliable Integration Boundaries**: PASS — no client/API/storage/schema boundaries are
  crossed; only build/CI configuration is added.
- **V. Accessible, Responsive, and Focused UX**: PASS (N/A user-facing) — no UI change; scope is
  intentionally limited to tooling with no unrelated refactor.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/008-code-quality-tooling/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (no data entities; config artifacts only)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output
│   └── tooling-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
eslint.config.js         # NEW: ESLint 9 flat config (client/server/shared, env-aware)
.prettierrc.json         # NEW: Prettier style config
.prettierignore          # NEW: exclude generated/build outputs
.eslintignore-equivalent # (handled via ignores in eslint.config.js — no separate file)
package.json             # EDIT: rename from "rest-express"; add lint/format scripts
.github/
└── workflows/
    └── ci.yml           # NEW: type-check + lint + format-check + test on PR and push to main
README.md                # EDIT: document quality commands; correct project identity
```

**Structure Decision**: Single existing web application. Linting is configured once via a flat
`eslint.config.js` that applies TypeScript rules repo-wide and layers browser globals + React
rules for `client/src/**` and Node globals for `server/**`. Prettier owns formatting with
`eslint-config-prettier` disabling stylistic ESLint rules to prevent conflicts (FR-004). A
single GitHub Actions workflow runs the four checks; branch protection on `main` makes the
workflow a required status check. No pre-commit git hooks are mandated (kept optional) to keep
the enforcement model simple and CI-centered.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
