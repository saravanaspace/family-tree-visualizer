# Tooling Contract: Code Quality Tooling and Continuous Integration

**Feature**: 008-code-quality-tooling | **Date**: 2026-08-24

This contract defines the developer-facing command interface and the CI pipeline interface that
implementation must satisfy. It is the acceptance surface for the feature.

## Command Interface (npm scripts)

| Command | Purpose | Success (exit 0) | Failure (exit non-zero) |
|---------|---------|------------------|-------------------------|
| `npm run check` | Type-check (existing `tsc`) | No type errors | Any type error |
| `npm run lint` | Static analysis over client/server/shared | No violations | One or more violations (reported with file:line and rule) |
| `npm run lint:fix` | Auto-fix fixable violations | Fixables resolved; remaining reported | Unfixable violations remain |
| `npm run format` | Write formatting to the agreed style | Files normalized | I/O error |
| `npm run format:check` | Verify formatting without writing | No drift | Any file not matching style |
| `npm test` | Run the Vitest suite (existing) | All tests pass | Any test fails |

Requirements traceability: FR-001, FR-002 (`lint`), FR-003 (`format`, `format:check`), FR-010
(documented commands).

## Scope & Exclusions

- **Included paths**: `client/src/**`, `server/**`, `shared/**`, root `*.ts`/`*.js` config.
- **Excluded paths**: `node_modules/`, `dist/`, `coverage/`, `migrations/**` SQL. Generated
  shadcn primitives under `client/src/components/ui/**` are formatted but exempt from lint rules
  that flag their generated patterns. (FR-007)

## Rule-Conflict Guarantee

- `eslint-config-prettier` MUST be applied last so no enabled ESLint rule contradicts Prettier
  output. Verification: running `format` then `lint` produces no formatting-related lint errors.
  (FR-004)

## CI Pipeline Interface (`.github/workflows/ci.yml`)

**Triggers**:
- `pull_request` targeting `main`
- `push` to `main`

**Environment**: `ubuntu-latest`, Node.js 20, install via `npm ci`.

**Steps** (each independently reported; overall run fails if any fails — FR-005, FR-006):

| Step | Command | Gate |
|------|---------|------|
| Type-check | `npm run check` | Must pass |
| Lint | `npm run lint` | Must pass |
| Format check | `npm run format:check` | Must pass |
| Test | `npm test` | Must pass |

**Enforcement**: The workflow is configured as a **required status check** via branch protection
on `main`, so a failing run blocks merge (FR-006a). This is a repository setting documented in
[quickstart.md](../quickstart.md), not committed code.

**Performance**: A typical run completes within 10 minutes (SC-004).

## Behavioral Guarantee

- Introducing and running this tooling MUST NOT change any application runtime behavior
  (FR-008). Verification: application build output and test results are unchanged by tooling
  addition (formatting-only diffs excluded).

## Project Identity

- `package.json` `name` MUST be `family-tree-visualizer` (not `rest-express`), and README setup
  documentation MUST match actual commands (FR-009, FR-010).
