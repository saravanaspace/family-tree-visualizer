# Test Plan Contract: Automated Test Coverage Expansion

**Feature**: 010-automated-test-coverage | **Date**: 2026-08-24

Defines the required test matrix, coverage gate, and execution interface the implementation must
satisfy. This is the acceptance surface for the feature.

## API Contract Test Matrix (real app + isolated test DB)

Each endpoint requires the marked cases (✓ = required test). "Not-found" applies where an id or
referenced record can be missing.

| Method & path | Success | Validation failure (400) | Not found (404) |
|---------------|:-------:|:------------------------:|:---------------:|
| `GET /api/family-tree` | ✓ | — | — |
| `POST /api/family-members` | ✓ | ✓ | — |
| `PATCH /api/family-members/:id/position` | ✓ | ✓ (bad x/y) | ✓ |
| `PATCH /api/family-members/:id` | ✓ | ✓ | ✓ |
| `DELETE /api/family-members/:id` | ✓ | — | ✓ |
| `POST /api/relationships` | ✓ | ✓ | ✓ (missing member) |
| `PATCH /api/relationships/:id` | ✓ | ✓ | ✓ |
| `DELETE /api/relationships/:id` | ✓ | — | ✓ |
| `POST /api/events` | ✓ | ✓ | ✓ (missing member) |
| `GET /api/events` | ✓ | ✓ (bad query) | — |
| `DELETE /api/events/:id` | ✓ | — | ✓ |

Assertions per case: HTTP status **and** response body shape (success payload, or
`{ message, error? }` for failures). A deliberately introduced breaking contract change MUST fail
at least one test (SC-002).

## Component / Interaction Test Matrix (jsdom + Testing Library)

| Component | Render test | Interaction test |
|-----------|:-----------:|------------------|
| `add-member-modal` | ✓ | Submit the add-member form → submit handler/mutation invoked with entered values |
| `edit-member-modal` | ✓ | Edit a field and save → update invoked |
| `connect-members-modal` | ✓ | Open dialog and choose members/relationship type |
| `family-member-card` | ✓ | Renders member name/details; action controls present |
| `sidebar-controls` | ✓ | Trigger add/connect controls |
| `zoom-controls` | ✓ | Zoom in/out/reset invokes the handler |
| `timeline-view` | ✓ | Renders chronological entries for provided data |
| `family-tree-canvas` | ✓ (basic) | Basic node selection updates selection state |

- Components are rendered via `renderWithProviders`; network is stubbed at the query/`fetch`
  layer. Canvas coverage is intentionally basic to avoid overlap with feature 007.

## Coverage Gate

| Metric | Threshold | Gated |
|--------|-----------|:-----:|
| Lines | ≥ 60% | ✓ |
| Statements | ≥ 60% | ✓ |
| Functions | tracked | — |
| Branches | tracked | — |

Excluded from coverage: `client/src/components/ui/**`, `**/*.config.*`, `migrations/**`,
`server/vite.ts`, test files. Below-threshold MUST fail the coverage check (FR-008, SC-005).

## Execution Interface (npm scripts)

| Command | Purpose | Success |
|---------|---------|---------|
| `npm test` | Run both projects (server+client) | all tests pass |
| `npm run test:coverage` | Run tests with coverage + threshold gate | tests pass and coverage ≥ threshold |

## Non-functional guarantees

- Deterministic and order-independent across repeated runs — 0 flaky failures (SC-004, FR-006).
- Isolated test data; no external network dependency (FR-005).
- Full suite completes within 5 minutes locally and in CI (SC-006).
- Runs inside feature 008's pipeline (FR-009).
