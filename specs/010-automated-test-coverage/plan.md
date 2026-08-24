# Implementation Plan: Automated Test Coverage Expansion

**Branch**: `010-automated-test-coverage` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-automated-test-coverage/spec.md`

## Summary

Expand automated testing beyond the current storage-only suite. Add API **contract tests** for
every endpoint, driven through the real Express app against an isolated test database (per
clarification), and **component/interaction tests** for the core React components using a jsdom
environment and Testing Library. Add coverage reporting with an enforced **60% overall**
lines/statements threshold. Split the Vitest configuration into two projects (Node for
server/contract tests with DB setup; jsdom for client tests) so environments do not collide. The
suite is deterministic, isolated, and integrates with the CI pipeline from feature 008.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM)

**Primary Dependencies**: Existing Vitest 3 + `@vitest/coverage-v8`. Added dev/test:
`supertest` (+ `@types/supertest`) for HTTP contract tests; `jsdom`,
`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` for
component tests. No runtime/production dependencies added.

**Storage**: PostgreSQL **test** database (isolated), reusing the existing
`server/__tests__/setup.ts` provisioning/teardown pattern for server and contract tests.

**Testing**: Vitest with two projects — `server` (environment `node`, DB setup, includes
contract tests) and `client` (environment `jsdom`, Testing Library setup). Coverage via v8 with
global thresholds.

**Target Platform**: Node.js 20 for server/contract tests; jsdom (simulated DOM) for component
tests. Runs locally and on GitHub Actions.

**Project Type**: Web application — tests span `server/**`, `shared/**`, and `client/src/**`.

**Performance Goals**: Full suite completes within 5 minutes locally and in CI (SC-006).

**Constraints**: Deterministic and order-independent (SC-004); no external network; test data
isolated per run; coverage threshold 60% overall lines/statements (FR-008); exclude generated UI
primitives and config from coverage to keep the metric meaningful.

**Scale/Scope**: All 11 API endpoints (contract matrix); core client components
(`add-member-modal`, `edit-member-modal`, `connect-members-modal`, `family-member-card`,
`sidebar-controls`, `zoom-controls`, `timeline-view`, and basic `family-tree-canvas` selection);
coverage configuration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — `spec.md` (with clarifications) exists; this
  `plan.md` follows; `tasks.md` via `/speckit-tasks`.
- **II. Consistent Type-Safe Stack**: PASS — extends existing Vitest tooling; adds only dev/test
  libraries. No runtime stack, schema, or DB change (test DB reuses existing pattern).
- **III. Behavior-Driven Verification**: PASS — this feature *is* verification: it maps acceptance
  criteria to contract and component tests and enforces coverage.
- **IV. Reliable Integration Boundaries**: PASS — contract tests exercise the real API↔storage
  boundary against a real test DB (the highest-fidelity option chosen in clarification),
  satisfying the principle's integration-test expectation.
- **V. Accessible, Responsive, and Focused UX**: PASS — component tests can assert accessible
  names/roles; scope is limited to adding tests with no product refactor.

Result: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/010-automated-test-coverage/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (test fixtures + coverage config; no data entities)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output
│   └── test-plan-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
vitest.config.ts          # EDIT: two projects (server/node + client/jsdom); coverage thresholds
client/
└── src/
    ├── test/
    │   └── setup-client.ts        # NEW: Testing Library + jest-dom setup (jsdom)
    └── components/
        └── __tests__/*.test.tsx   # NEW: component/interaction tests
server/
├── app.ts                         # NEW (or from 009): createApp() without listen, for supertest
└── __tests__/
    ├── setup.ts                   # EXISTING: test-DB provisioning (server project)
    └── contract/*.test.ts         # NEW: supertest contract tests per endpoint
package.json              # EDIT: add supertest, jsdom, @testing-library/*; coverage scripts
```

**Structure Decision**: Split Vitest into a `server` project (Node env, keeps the existing DB
`setup.ts`, and hosts contract tests) and a `client` project (jsdom env, Testing Library setup)
so the DB setup never runs for component tests. Contract tests use `supertest` against an app
built by `createApp()` (provided by feature 009; if 010 lands first, a thin test harness wires
`registerRoutes` plus a minimal error handler). Coverage uses v8 with a 60% global threshold and
excludes generated `client/src/components/ui/**`, config files, and migrations so the number
reflects first-party code.

## Complexity Tracking

> No constitution violations; no complexity justifications required.
