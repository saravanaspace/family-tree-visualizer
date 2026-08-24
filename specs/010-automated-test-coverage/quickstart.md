# Quickstart & Validation: Automated Test Coverage Expansion

**Feature**: 010-automated-test-coverage | **Date**: 2026-08-24

Validates the contract tests, component tests, and enforced coverage. References
[contracts/test-plan-contract.md](contracts/test-plan-contract.md).

## Prerequisites

- Node.js 20, npm, and a reachable PostgreSQL instance for the isolated test database
  (`TEST_DATABASE_URL`, defaults to `...familytree_test`).
- Dependencies installed: `npm ci`.

## 1. Run the full suite (both projects)

```powershell
npm test
```

- **Expected**: the `server` project (storage + contract tests, Node env, test DB) and the
  `client` project (component tests, jsdom) both run and pass.

## 2. API contract tests (FR-001, FR-002, SC-001, SC-002)

- Contract tests use `supertest` against the real app and the isolated test DB.
- **Expected**: every endpoint in the matrix returns the specified status and body shape for
  success, validation-failure, and not-found.
- **Validate breakage detection**: temporarily change an endpoint's response shape or status; run
  `npm test`; expect at least one contract test to fail and name the endpoint. Revert.

## 3. Component / interaction tests (FR-003, FR-004, SC-003)

- **Expected**: each core component has a passing render test; each identified interaction
  (submit add-member form, open dialog, zoom, basic canvas selection) asserts the resulting
  behavior.
- **Validate breakage detection**: break a covered component (e.g., remove the submit handler);
  expect its interaction test to fail. Revert.

## 4. Coverage report and threshold gate (FR-007, FR-008, SC-005)

```powershell
npm run test:coverage
```

- **Expected**: a coverage report is produced (text summary + HTML under `coverage/`), and the
  run passes only when lines and statements are ≥ 60% overall (excluding generated UI primitives,
  config, migrations, and test files).
- **Validate the gate**: temporarily raise the threshold above current coverage (or delete a test
  file); expect the coverage check to fail. Revert.

## 5. Determinism and isolation (SC-004, FR-005, FR-006)

```powershell
npm test
npm test   # run again
```

- **Expected**: identical pass results across repeated runs; no order-dependent or network-based
  flakiness. Contract-test data is truncated/reseeded between tests.

## 6. Timing (SC-006)

- **Expected**: the full suite completes within 5 minutes locally and in the CI pipeline
  (feature 008).

## Success signals

- SC-001: 100% of endpoints have success + validation + not-found contract tests.
- SC-002: a breaking contract change fails at least one test.
- SC-003: every core component has a render test and each key interaction has an interaction test.
- SC-004: 0 flaky failures across repeated runs.
- SC-005: coverage report produced and 60% threshold enforced.
- SC-006: suite completes within 5 minutes.
