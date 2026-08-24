# Phase 0 Research: Automated Test Coverage Expansion

**Feature**: 010-automated-test-coverage | **Date**: 2026-08-24

Resolves the technical approach for adding contract and component tests plus enforced coverage to
the existing Vitest setup.

## Decision: Two Vitest projects (Node + jsdom)

- **Decision**: Configure Vitest with two projects: `server` (`environment: 'node'`, keeps
  `server/__tests__/setup.ts` for DB provisioning, includes contract tests) and `client`
  (`environment: 'jsdom'`, uses a new `client/src/test/setup-client.ts`).
- **Rationale**: The current single Node config runs the DB setup for every test file. Component
  tests need a DOM and must **not** provision a database. Separate projects give each suite the
  right environment and setup while sharing one `vitest` invocation and one coverage report.
- **Alternatives considered**:
  - Per-file `// @vitest-environment jsdom` comments — rejected: still runs the global DB setup
    for client tests and scatters configuration.
  - A second config file run separately — rejected: fragments coverage and CI wiring.

## Decision: `supertest` contract tests against the real app + isolated test DB

- **Decision**: Use `supertest` to drive the real Express app (no network listener) against the
  isolated test database, reusing the existing `setup.ts` provisioning and truncation. Assert
  status codes and response body shape for success, validation-failure, and not-found per
  endpoint.
- **Rationale**: Matches the clarification (highest-fidelity: real app + real test DB) and the
  constitution's integration-boundary principle. Exercises the true
  request → validation → storage → response path.
- **App entry point**: Prefer a `createApp()` factory (introduced by feature 009) that mounts
  routes **and** the centralized error middleware without calling `listen`. If 010 is implemented
  before 009, add a minimal test harness that calls the existing `registerRoutes(app)` and mounts
  a small error handler so error-shape assertions are stable; migrate to `createApp()` when 009
  lands.
- **Alternatives considered**: Mocked storage (option B in clarify) — rejected by the decision;
  hitting a live external DB — rejected: not isolated/deterministic.

## Decision: Testing Library for component/interaction tests

- **Decision**: Use `@testing-library/react` + `@testing-library/user-event` +
  `@testing-library/jest-dom` in the jsdom project. Render core components and simulate the key
  interactions (open dialog, submit add-member form, basic canvas selection), asserting resulting
  behavior and accessible content.
- **Rationale**: Testing Library is the standard, accessibility-friendly approach for React and
  integrates cleanly with Vitest. `user-event` models real user interaction (typing, clicking).
- **Provider wrapping**: Components using TanStack Query or toasts are rendered inside a test
  `QueryClientProvider` and any required providers via a shared `renderWithProviders` helper;
  network calls are stubbed at the query/`fetch` layer to keep component tests deterministic and
  offline.
- **Alternatives considered**: Enzyme — rejected: unmaintained for modern React; raw
  react-test-renderer — rejected: lower-level and less accessibility-oriented.

## Decision: Coverage via v8 with a 60% global threshold and curated scope

- **Decision**: Keep the v8 provider. Set global thresholds to 60% for lines and statements
  (functions/branches tracked but not gated initially). Exclude from coverage:
  `client/src/components/ui/**` (generated shadcn primitives), `**/*.config.*`, `migrations/**`,
  `server/vite.ts`, and test files themselves.
- **Rationale**: The clarified baseline is 60% overall; excluding generated/boilerplate keeps the
  metric representative of first-party code so the gate is meaningful yet achievable (spec edge
  case). Gating only lines/statements first avoids brittle branch-coverage failures while the
  suite grows.
- **Alternatives considered**: Gate all four metrics at 60% now — deferred: branch coverage is
  the hardest to hit early and would block legitimate work; ratchet up later.

## Decision: Determinism and isolation

- **Decision**: Reset DB state between contract tests (truncate/reseed via existing setup),
  isolate client tests from network via query/`fetch` stubbing, and avoid real timers/`Date.now`
  dependence (use fixed fixtures or fake timers where needed).
- **Rationale**: SC-004 requires 0 flaky failures across repeated runs and order independence.
- **Alternatives considered**: Shared mutable DB state across tests — rejected: causes
  order-dependent flakiness.

## Decision: CI integration

- **Decision**: The existing `npm test` (and a `test:coverage` script) run both projects and the
  coverage gate; feature 008's pipeline invokes them. No separate CI wiring is added here beyond
  ensuring the scripts exist and pass within the time budget.
- **Rationale**: Single source of truth for the pipeline (008); this feature supplies the tests
  the pipeline runs.
- **Alternatives considered**: A dedicated coverage workflow — rejected: duplicates 008's gate.

## Open items for planning/tasks

- Final list of "core components" to cover is enumerated in
  [contracts/test-plan-contract.md](contracts/test-plan-contract.md); canvas coverage is limited
  to basic selection to avoid overlap with feature 007's interaction work.
- Whether to also gate functions/branches is revisited once the initial suite establishes a real
  baseline above 60% lines/statements.
