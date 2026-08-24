# Data Model: Code Quality Tooling and Continuous Integration

**Feature**: 008-code-quality-tooling | **Date**: 2026-08-24

## Overview

This feature introduces **no persistent data entities** and makes no database or schema changes.
It adds developer tooling and configuration only. For completeness, the "model" here is the set
of configuration artifacts and the CI pipeline's conceptual states, which downstream tasks and
tests reference.

## Configuration Artifacts (non-data)

| Artifact | Purpose | Key contents |
|----------|---------|--------------|
| `eslint.config.js` | Static-analysis rules | Flat config; TS rules repo-wide; React/hooks rules for `client/src/**`; Node globals for `server/**`; `ignores` for generated/build; `eslint-config-prettier` last |
| `.prettierrc.json` | Formatting style | Single agreed Prettier style (print width, quotes, semicolons, trailing commas) |
| `.prettierignore` | Formatting exclusions | `node_modules`, `dist`, `coverage`, generated outputs |
| `package.json` scripts | Command entry points | `lint`, `lint:fix`, `format`, `format:check` (plus existing `check`, `test`) |
| `package.json` name | Project identity | `family-tree-visualizer` (was `rest-express`) |
| `.github/workflows/ci.yml` | Pipeline definition | Triggers (PR + push to `main`); steps: type-check, lint, format-check, test |

## Pipeline Conceptual States

A single pipeline run moves through these observable states (used for acceptance testing):

- **Triggered** — a pull request or a push to `main` starts the workflow.
- **Running** — steps execute: type-check → lint → format-check → test (each independently
  reported).
- **Passed** — all four steps succeed; the change is eligible to merge.
- **Failed** — at least one step fails; the overall run fails and names the failing step; branch
  protection blocks merge.

## Validation Rules (from requirements)

- Static analysis MUST exit non-zero on violations (FR-002).
- Format-check MUST fail on drift; format-write MUST normalize (FR-003).
- Lint and format rules MUST NOT conflict (FR-004).
- Generated/build/dependency paths MUST be excluded (FR-007).
- Tooling MUST NOT alter runtime behavior (FR-008).
- Pipeline MUST fail overall and identify the failing step when any check fails (FR-006).
- Pipeline MUST be a required status check on `main` (FR-006a).

## State Transitions

Not applicable — no stateful domain entities are introduced.
