# Data Model: Automated Test Coverage Expansion

**Feature**: 010-automated-test-coverage | **Date**: 2026-08-24

## Overview

This feature introduces **no persistent data entities** and no schema changes. The "model" is the
set of **test fixtures/factories**, the **test-suite structure**, and the **coverage
configuration** that downstream tasks reference. Contract tests operate on the existing
`familyMembers`, `relationships`, and `familyEvents` entities via the real API and an isolated
test database.

## Test Fixtures / Data Factories (non-persistent)

| Factory | Produces | Used by |
|---------|----------|---------|
| `makeMember(overrides?)` | Valid `InsertFamilyMember` payload | member + relationship + event contract tests; component form tests |
| `makeRelationship(from, to, overrides?)` | Valid `InsertRelationship` payload | relationship contract tests |
| `makeEvent(memberIds, overrides?)` | Valid `InsertFamilyEvent` payload | event contract tests |
| `renderWithProviders(ui)` | Component rendered inside QueryClient + required providers | all component tests |

- Factories return minimal valid data with override hooks so each test states only what it cares
  about (keeps tests readable and deterministic).
- Contract-test data is created through the API/DB and torn down (truncate/reseed) between tests
  for isolation.

## Test Suite Structure

| Project | Environment | Setup | Contains |
|---------|-------------|-------|----------|
| `server` | `node` | `server/__tests__/setup.ts` (test DB) | existing storage tests + new contract tests |
| `client` | `jsdom` | `client/src/test/setup-client.ts` (Testing Library + jest-dom) | component/interaction tests |

## Coverage Configuration

| Setting | Value |
|---------|-------|
| Provider | `v8` |
| Reporters | `text`, `json`, `html` |
| Gated thresholds | lines ≥ 60%, statements ≥ 60% (global) |
| Tracked (not gated initially) | functions, branches |
| Excluded | `client/src/components/ui/**`, `**/*.config.*`, `migrations/**`, `server/vite.ts`, test files |

## Validation Rules (from requirements)

- Every endpoint has success + validation-failure + not-found contract tests (FR-001, FR-002).
- Core components have ≥1 render test; identified interactions have ≥1 interaction test
  (FR-003, FR-004).
- All tests use isolated data and no external network (FR-005, FR-006).
- Coverage report produced on demand; below-threshold fails the check (FR-007, FR-008).

## State Transitions

Not applicable — no stateful domain entities are introduced.
