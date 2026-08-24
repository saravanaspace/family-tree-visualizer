# Family Tree Application: Code Health & Delivery Improvement Proposals

# Generated via GitHub Copilot (Claude Opus 4.8)

## Overview

This document reviews the existing family tree application from a **framework, language, and
engineering-approach** perspective and proposes a focused set of improvements. Unlike the
data-model-oriented proposals in `claude_proposed_improvements.md` and
`gemini_proposed_improvements.md`, this document concentrates on **code health, reliability, and
delivery discipline** — the tooling and architecture changes that make future feature work safer
and faster.

Each improvement area has been turned into a formal Spec Kit feature (specs `008`–`010`) with a
spec, plan, tasks, and checklists ready for implementation.

## Verdict: Keep the Stack

The current stack is modern and coherent for this application. There is **no framework or language
change that would justify a rewrite**. TypeScript end-to-end, React 18 + Vite, Express + Drizzle +
PostgreSQL, Zod validation, and Vitest are all appropriate. The highest-value work is closing gaps
in tooling and architecture — not swapping technologies.

## Current Architecture (as assessed)

- **Language**: TypeScript (strict mode) across client, server, and shared code.
- **Frontend**: React 18, Vite 5, Wouter (routing), TanStack Query, Tailwind CSS 3, shadcn/ui
  (Radix), Framer Motion.
- **Backend**: Express 4, Drizzle ORM, `postgres` (postgres.js), Zod + `drizzle-zod`.
- **Testing**: Vitest with v8 coverage; storage-layer tests only.
- **Tooling/CI**: none present (no ESLint/Prettier, no CI workflow).

## Strengths

1. **Strong type safety** — TypeScript `strict` plus Zod validation at the API boundary.
2. **Clean separation** — routes, storage, and shared schema are distinct.
3. **Modern, well-supported libraries** — no legacy or abandoned dependencies in the core path.
4. **Spec-driven workflow** — Spec Kit artifacts and a project constitution already in place.

## Language Recommendations

- **Keep TypeScript (already `strict`).** Solid foundation.
- **Add ESLint + Prettier.** There is currently no linter or formatter configuration in the repo —
  the single cheapest quality win.
- **Rename the package.** `package.json` `name` is still the template default `rest-express`.

## Framework Recommendations

- **Frontend (React + Vite + Wouter + TanStack Query + shadcn/ui): keep.** Consider `zustand` for
  canvas pan/zoom/selection state as interactions grow (tracked within the responsive UI feature,
  `007`, not duplicated here). A meta-framework (Next.js / TanStack Start) is only worth it if
  public SSR/SEO is needed — not the case for a private editor.
- **Backend (Express 4 + Drizzle): keep, with two fixes.**
  - **Consolidate database clients.** Three Postgres clients are declared
    (`@neondatabase/serverless`, `pg`, `postgres`) but only `postgres` (postgres.js) is used.
  - **Fix the global error handler.** `server/index.ts` calls `throw err` *after* sending the
    response, which can crash the process.

## Approach / Architecture Recommendations

- **Add a service layer.** Business logic currently lives directly in route handlers; extract it so
  domain rules are testable independent of HTTP.
- **Centralize validation and error responses.** Replace the repeated per-route `try/catch` + Zod
  shape with a single `validate(schema)` middleware and one error formatter.
- **Expand automated testing.** Coverage is backend/storage-only; add API contract tests and
  frontend component/interaction tests, plus coverage thresholds.
- **Introduce CI.** No pipeline exists; add one running type-check, lint, format-check, and tests,
  enforced via branch protection.
- **Auth direction is right.** The planned accounts feature (`003`) chose session-based Passport —
  a better default than JWT for this stateful web app. Ensure password hashing uses `argon2` or
  `bcrypt` when implemented.

## Proposed Features (Spec Kit)

These improvements are captured as three independently deliverable features. Recommended
implementation order: **008 → 009 → 010**.

### 008 — Code Quality Tooling and Continuous Integration

- ESLint 9 (flat config) + `typescript-eslint`; Prettier 3 with `eslint-config-prettier` (no rule
  conflicts).
- A single GitHub Actions pipeline (type-check, lint, format-check, test) on pull requests and
  pushes to `main`, enforced as a required status check via branch protection.
- Package rename `rest-express` → `family-tree-visualizer`; README/setup accuracy.
- Spec: [../specs/008-code-quality-tooling/spec.md](../specs/008-code-quality-tooling/spec.md)

### 009 — Backend Service Architecture and Reliability

- A transport-independent service layer over the unchanged storage module.
- `validate(schema)` boundary middleware + `asyncHandler` + a centralized error handler that
  preserves the existing `{ message, error? }` body and never crashes after responding.
- Enforced domain rules: no self-relationship, no duplicate relationship, referenced members must
  exist, valid `type`/`status` enums (complex genealogy deferred).
- Consolidate to a single database client (remove unused `@neondatabase/serverless` and `pg`).
- Behavior-preserving: all existing endpoint contracts unchanged.
- Spec: [../specs/009-backend-service-architecture/spec.md](../specs/009-backend-service-architecture/spec.md)

### 010 — Automated Test Coverage Expansion

- API contract tests for every endpoint via `supertest` against the real app + an isolated test
  database (success / validation-failure / not-found).
- Component and interaction tests for core React components (jsdom + Testing Library).
- Coverage reporting with an enforced 60% overall lines/statements threshold (raised over time).
- Spec: [../specs/010-automated-test-coverage/spec.md](../specs/010-automated-test-coverage/spec.md)

## Priority Order

1. Code quality tooling + CI (008) — establishes the enforced gate everything else runs through.
2. Remove unused DB clients; fix the error-handler crash (part of 009).
3. Service layer + shared validation/error middleware (009).
4. Contract + component tests and coverage thresholds (010).

## Open Refinements (from cross-artifact analysis)

Minor, non-blocking items surfaced while reviewing the specs; worth resolving during
implementation:

- **009 FR-010 vs error contract**: scope "no observable behavior change" to *success responses*,
  since enforcing domain rules introduces new `409`/`404` error statuses.
- **009 FR-006**: state the event referential rule (referenced members must exist for events), not
  only relationships.
- **009 FR-003**: define "sensitive internal detail" (no stack traces, credentials, or internal
  identifiers).
- **010 FR-003**: enumerate the "core frontend components" (or reference the contract matrix).
- **008 FR-011**: enumerate supported developer operating systems and the Node version.
- **Cross-feature**: removing `pg` in 009 should be coordinated with the planned accounts feature
  (`003`) so its session store standardizes on postgres.js.

## Explicit Non-Goals

- No runtime framework or language migration.
- No database schema changes.
- No new product features (search, media, DNA, GEDCOM, etc.) — those are covered by other
  proposals and specs.
