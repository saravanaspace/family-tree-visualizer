# Quickstart & Validation: Code Quality Tooling and Continuous Integration

**Feature**: 008-code-quality-tooling | **Date**: 2026-08-24

This guide validates that the tooling and pipeline work end-to-end. It references
[contracts/tooling-contract.md](contracts/tooling-contract.md) for the command and CI interface.

## Prerequisites

- Node.js 20 and npm installed.
- Dependencies installed: `npm ci`.

## 1. Static analysis (FR-001, FR-002)

```powershell
npm run lint
```

- **Expected (clean)**: exits 0 with no violations.
- **Validate failure path**: temporarily introduce an unused variable in a `server/**` file, then
  re-run `npm run lint`. Expect a non-zero exit and a report naming the file, line, and rule.
  Revert the change.

## 2. Formatting (FR-003, FR-004)

```powershell
npm run format:check   # verify mode — fails on drift
npm run format         # write mode — normalizes files
```

- **Expected**: after `npm run format`, `npm run format:check` exits 0.
- **Validate no rule conflict**: run `npm run format` then `npm run lint`; expect no
  formatting-related lint errors.

## 3. Type-check and tests (reused pipeline steps)

```powershell
npm run check
npm test
```

- **Expected**: both exit 0 on a clean tree.

## 4. Pipeline (FR-005, FR-006)

- Open a pull request, or push to `main`. The `ci.yml` workflow runs type-check, lint,
  format-check, and test.
- **Expected pass**: all four steps green; overall run succeeds.
- **Validate failure reporting**: push a branch that fails one check (e.g., a formatting drift).
  Expect the overall run to fail and the specific failing step to be identified. Confirm the run
  completes within ~10 minutes (SC-004).

## 5. Enforcement via branch protection (FR-006a)

One-time repository configuration (GitHub UI: Settings → Branches → Branch protection rules for
`main`):

- Enable **Require status checks to pass before merging**.
- Select the `ci.yml` workflow (its job) as a required check.
- Enable **Require branches to be up to date before merging** (recommended).

- Applied by a repository admin (a GitHub setting, not repo code); list the required check names
  in this document.
- **Validate**: a pull request whose CI run fails cannot be merged; once fixed and green, it can.

## 6. Project identity (FR-009, FR-010)

```powershell
node -e "console.log(require('./package.json').name)"
```

- **Expected**: prints `family-tree-visualizer` (not `rest-express`).
- **Validate docs**: every quality command listed in README (`lint`, `format`, `format:check`,
  `check`, `test`) runs successfully as documented.

## Success signals

- SC-001/SC-002: single commands return whole-repo pass/fail for lint and format; 0 drift after
  normalization.
- SC-003: a failing change is blocked from merge in testing.
- SC-005: no `rest-express` references remain in metadata/docs.
- SC-006: a fresh clone can run every documented command with no undocumented steps.
