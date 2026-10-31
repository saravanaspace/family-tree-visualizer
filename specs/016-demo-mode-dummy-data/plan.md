# Implementation Plan: Demo Mode with Dummy Data

**Branch**: `016-demo-mode-dummy-data` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-demo-mode-dummy-data/spec.md`

## Summary

Add a second storage implementation that keeps members, relationships, and events in process memory, preloaded with a small sample dataset. A dedicated entry point (`npm run dev:demo`) selects it, refuses to run when `NODE_ENV=production`, and logs that demo mode is active. A loopback-only `POST /api/demo/reset` endpoint (registered only in demo mode) restores the sample dataset. The existing Postgres storage and the default `npm run dev` path are unchanged. One shared contract test suite runs against both storages to prove parity.

## Technical Context

**Language/Version**: TypeScript 5.6 (Express 4 server, React 18 client)

**Primary Dependencies**: existing only (Express, Zod, Drizzle, Vitest, tsx, cross-env). No new dependencies.

**Storage**: PostgreSQL (unchanged, default); new `MemoryStorage` for demo mode

**Testing**: Vitest; a shared storage contract suite plus focused tests for the reset endpoint guard and the production guard

**Target Platform**: Developer workstation (Linux/macOS/Windows) running Node

**Project Type**: Web application (React client + Express server, shared schema)

**Performance Goals**: Demo server ready and showing the tree within 1 minute of running the command (SC-001); in-memory operations are effectively instant

**Constraints**: No DB connection attempted in demo mode; default start path behaviorally unchanged; no new runtime dependencies; reset endpoint reachable only from loopback

**Scale/Scope**: About 8 members, about 8 relationships, at least 5 events; single shared dataset per process

## Constitution Check

| Principle | Assessment |
|-----------|------------|
| I. Requirements and Traceability | PASS: spec, plan, tasks all present; FR ids referenced in tasks. |
| II. Consistent Type-Safe Stack | PASS: TypeScript, existing `@shared/schema` types; Zod validation stays in routes, so demo and Postgres share the same input validation. No schema/migration change. |
| III. Behavior-Driven Verification | PASS: shared contract suite covers success, validation/constraint failures, and relationship edge cases for both storages. |
| IV. Reliable Integration Boundaries | PASS: storage seam gets one interface and one contract suite; route-level reset behavior gets an integration test. |
| V. Accessible, Responsive, Focused UX | PASS / N/A: no UI changes (banner out of scope, FR-015). |
| VI. Security by Design | PASS with controls: dummy data only, no PII; reset endpoint is destructive so it is loopback-only and absent outside demo mode; production guard prevents serving dummy data; `X-Forwarded-For` is ignored for the loopback check. |
| Technical Constraints | PASS: PostgreSQL remains the persistence of record; the in-memory storage is an approved addition by this specification. |

Re-check after design: no violations; Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/016-demo-mode-dummy-data/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── demo-api.md
├── checklists/
└── tasks.md          # created by /speckit-tasks
```

### Source Code (repository root)

```text
server/
├── storage.ts                  # export Storage interface; select backend from the internal demo flag
├── memory-storage.ts           # NEW: in-memory Storage implementation
├── demo-data.ts                # NEW: sample dataset builder (fresh copy per call)
├── demo.ts                     # NEW: dedicated entry point (guard, flag, banner, starts server)
├── demo-guard.ts               # NEW: assertNotProduction, isLoopbackAddress, enableDemoMode/isDemoMode
├── routes.ts                   # register demo reset route when demo mode is active
└── __tests__/
    ├── storage.contract.ts     # NEW: shared contract suite (factory-parameterized)
    ├── storage.test.ts         # runs contract against Postgres (skipped without test DB)
    ├── memory-storage.test.ts  # NEW: runs contract against MemoryStorage + sample dataset checks
    └── demo-guard.test.ts      # NEW: production guard + loopback helper + reset route
package.json                    # dev:demo script
README.md                       # demo mode section
docs/glossary/GLOSSARY.md       # terms (already created)
```

**Structure Decision**: Keep the existing single web-app layout. Backend-only change; all new code lives in `server/`, with the in-memory storage behind the same method set as `PostgresStorage` so routes are untouched apart from the reset route.

## Key Design Decisions

1. **Entry point, not a flag users set.** `npm run dev:demo` runs `tsx server/demo.ts`, which checks `NODE_ENV`, calls `enableDemoMode()` (an in-process module setting in `server/demo-guard.ts`, not an environment variable), then dynamically imports `server/index.ts`. No env var or option can activate demo mode, so it cannot bypass the production guard (FR-001, FR-009). The script deliberately does not set `NODE_ENV`, so the production guard (FR-009) can actually trip; `demo.ts` defaults `NODE_ENV` to `development` only when unset.
2. **Storage seam.** Export a `Storage` interface (the existing public method set) from `storage.ts`; `storage` is chosen once at module load. Routes keep importing `storage`.
3. **Parity rules** (FR-003, FR-014): same error messages as Postgres storage (`Family member not found`, `Relationship not found`, `Event not found`); duplicate `(from, to, type)` and missing-member relationships throw; events are not validated against members; deleting a member cascades to relationships and events; IDs are monotonic and never reused; returned records are copies; date fields are `Date` objects like Postgres.
4. **Reset** (FR-010): `POST /api/demo/reset`, only registered in demo mode, checks `req.socket.remoteAddress` for loopback (ignores proxy headers), otherwise responds 404.
5. **Tests** (FR-013): contract suite takes a factory; Postgres leg uses `describe.skipIf(!process.env.TEST_DATABASE_URL)`; memory leg always runs, so CI without Postgres still verifies the demo path.

## Risks and Dependencies

- **Spec 015 (basic auth, tree-scoped data)** is planned but not implemented. When it lands, the `Storage` interface becomes tree-scoped and login is required; demo mode will then need its own tree/user or an auth bypass. Out of scope here; tracked as a follow-up so this spec is not blocked.
- `server/storage.ts` currently constructs the Postgres client at import time. The client connects lazily, so no connection is made in demo mode, and a test asserts this (FR-011).

## Complexity Tracking

No constitution violations.
