# Tasks: Basic Authentication and Authorization

**Input**: Design documents from `/specs/015-basic-auth-login/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-and-trees.md

**Tests**: Phase 2 includes Vitest coverage for password handling, server sessions, login throttling, storage
outages, event redaction, and the client flow. Tree ownership and migration tests belong to later phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (US1 to US5)

---

## Phase 1: First Login UI (implemented)

**Purpose**: Deliver the login-to-existing-tree UI flow and logout before beginning server authentication.
This phase is a demo only; it does not verify passwords or protect API requests or family data.

- [x] T052 Add client auth context with fixed Default User identity and tab-scoped demo-session marker; do not persist passwords.
- [x] T053 Add accessible login page explaining demo behavior and accepting username `default` with a non-empty password.
- [x] T054 Guard the existing family-tree route and add sign-out that clears client state and returns to login.
- [x] T055 Add focused tests for route gating, sign-in, sign-out, and password non-persistence.
- [x] T056 Update the feature artifacts and README to describe Phase 1 and defer API authorization.
Phase 1 focused tests and production build passed. Its type-check reported existing errors in unchanged
`server/seed.ts`, `server/storage.ts`, and `server/vite.ts`; Phase 2 validation tracks this baseline.

**Checkpoint**: The default demo user can enter the existing family-tree UI and sign out. No API/data
protection is provided.

---

## Phase 2: Server-Side Sign-In (current implementation scope)

- [x] T001 Document `DATABASE_URL`, `SESSION_SECRET`, `DEFAULT_OWNER_USERNAME`, `DEFAULT_OWNER_PASSWORD`, `SESSION_IDLE_DAYS`, and `SESSION_MAX_DAYS` configuration in `README.md`; do not commit secrets or add account-management CLI commands in this phase.
- [x] T002 [P] Create and implement the `server/auth/` modules needed for password verification, throttling, sessions, and default-account seeding; defer operator CLI files.

### Foundation

**Purpose**: Add only the account, credential, failed-login, and session persistence needed for server sign-in.

- [x] T003 Add `users`, `credentials`, and `loginAttempts` tables/indexes to `shared/schema.ts`; do not add tree tables or alter family-data tables in Phase 2.
- [x] T004 Add the `loginSchema` and safe `userSchema` plus exported types to `shared/schema.ts`; enforce normalized usernames and 12–256 character passwords.
- [x] T005 Write additive migration `migrations/0002_authentication.sql` and update `server/db/migrate.ts` to apply it safely; create account, credential, login-attempt, and PostgreSQL session tables without modifying family data.
- [x] T006 Add isolated active accounts `fixture-a`, `fixture-b`, and disabled account `fixture-disabled` to `server/__tests__/fixtures/auth-users.ts`; test-only passwords must never be seeded into normal or production startup.
- [x] T007 [P] Implement scrypt hash/verify with dummy-hash timing equalisation in `server/auth/password.ts`
- [x] T008 [P] Write unit tests for hash format, verify success/failure, and constant-shape failure for unknown users in `server/__tests__/password.test.ts`
- [x] T009 Implement the PostgreSQL session store, session-ID regeneration, configurable idle/absolute lifetimes, 013 cookie policy, and required production `SESSION_SECRET` in `server/auth/session.ts`.
- [x] T010 Implement auth-session validation for `/api/auth/me`, including disabled-account rejection and a 503 response when account/session storage is unavailable.
- [x] T011 Seed only the configured default account at startup: create if missing, never overwrite an existing password, require credentials in production, and generate/print a development password once when absent.
- [x] T012 Add account, credential, and username-attempt persistence to `server/auth/storage.ts`.

**Checkpoint**: Server can safely load the default identity, verify credentials, and persist sessions. Existing family-data endpoints are unchanged and remain unauthenticated.

---

### Phase 2: User Story 1 - Sign In With Username and Password (P1)

**Goal**: A signed-out visitor sees only the login page; valid credentials sign in; invalid ones are denied
generically; repeated failures lock temporarily.

**Independent Test**: Quickstart scenarios 1 to 4.

### Tests

- [x] T013 [P] [US1] Auth API tests: success, 400 validation, identical 401 for unknown/wrong/disabled, session ID regenerated, seed idempotence, no credentials in responses/logs, storage outage returns 503, in `server/__tests__/auth.test.ts`
- [x] T014 [P] [US1] Lockout tests: 5 failures lock 15 minutes (429 with `Retry-After`), success resets, unknown usernames lock identically, and per-source limit behavior, in `server/__tests__/lockout.test.ts`

### Implementation

- [x] T015 [US1] Implement per-username lockout and per-source-IP limiter in `server/auth/lockout.ts`; trust forwarded client addresses only when Express proxy configuration is explicitly set.
- [x] T016 [US1] Implement credential lookup and login verification in `server/auth/service.ts`, keeping responses generic for unknown, wrong-password, and disabled accounts.
- [x] T017 [US1] Add `POST /api/auth/login` and `GET /api/auth/me` in `server/auth/routes.ts` using Zod and the 009 error shape; exclude auth bodies from request logging and record redacted auth events per feature 011.
- [x] T018 [P] [US1] Replace the demo login behavior with server-backed credential submission, accessible errors, and lockout feedback in `client/src/pages/login.tsx`.
- [x] T019 [P] [US1] Replace the browser demo marker with a `useAuth` hook backed by `/api/auth/me` and update `RequireAuth` to fail closed on errors.
- [x] T020 [US1] Wire login/current-user routes to the existing app route gate, preserving the requested page after sign-in; family-data API routes remain unchanged and unauthenticated.

**Checkpoint**: Valid credentials open the signed-in UI and invalid credentials are denied. Direct family-data API requests remain unauthenticated until the later authorization phase.

---

### Phase 2: User Story 2 - Sign Out and Session Persistence (P1)

**Goal**: Sessions persist across reloads, expire per policy, and sign-out ends access immediately.

**Independent Test**: Quickstart scenario 5.

- [x] T021 [P] [US2] Test logout idempotence, session invalid after logout, idle and absolute expiry, disabled-account rejection, and session-store outage in `server/__tests__/session.test.ts`.
- [x] T022 [US2] Add `POST /api/auth/logout` (destroy server session, clear cookie, 204) in `server/auth/routes.ts`; record a redacted sign-out event.
- [x] T023 [US2] Enforce absolute session lifetime in `server/auth/middleware.ts`.
- [x] T024 [P] [US2] Update the existing sign-out control to call server logout, clear cached query data, and redirect to `/login` in `client/src/hooks/use-auth.ts`.
- [x] T025 [US2] Redirect signed-in users away from `/login` only after `/api/auth/me` confirms a valid server session.

**Checkpoint**: Full server sign-in, persistence, and sign-out lifecycle. Family-data API authorization is not included.

### Current-phase completion

- [x] T026 Run focused auth/client tests, production build, and `npm run check`; do not mark this task complete unless required checks pass, and report any pre-existing baseline errors separately.
- [x] T057 Seed public demo accounts (`demo`, `alice`, `bob`, disabled `disabled`) into in-memory auth and session stores only in demo mode, in `server/auth/demo-accounts.ts` and `server/auth/setup.ts`; refuse in production and document them in `README.md`.

**Phase 2 scope boundary**: Authenticated browser sessions provide the login UI state only. The existing family-data endpoints remain directly accessible without a session until the later authorization phase.

**Phase 2 validation (2026-11-01)**: `npm run check` passes (earlier type errors in `server/seed.ts`,
`server/storage.ts`, and `server/vite.ts` fixed), the full Vitest suite passes, and the production build
succeeds. The PostgreSQL path was verified against a disposable PostgreSQL 16 database: migrations
(both orders, re-run), seeding without password overwrite, username lockout, session persistence across
restart, and logout. That run found and fixed two defects: auth timestamps now use `timestamptz` (a
server/database time-zone mismatch had made lockouts appear expired), and `drizzle.config.ts` excludes
`app_migrations`/`user_sessions` so `db:push` cannot drop them. Implementation locations differ from some
task paths: absolute expiry is enforced in `server/auth/routes.ts` (T023), and the client hook is
`client/src/hooks/use-auth.tsx` (T024).

---

## Later Phase 3: User Story 3 - Trees Belong to a User (P1)

**Goal**: Users only see and modify their own trees; multiple trees with create, rename, switch, delete.

**Independent Test**: Quickstart scenarios 6 and 7.

### Tests

- [ ] T027 [P] [US3] Cross-account tests for every tree and tree-scoped endpoint (list, read, create, update, delete, relationships, events) returning 404 for foreign resources and foreign member references, in `server/__tests__/ownership.test.ts`
- [ ] T028 [P] [US3] Tests that an `ownerId` in a request body is rejected and new trees are owned by the session user, in `server/__tests__/trees.test.ts`

### Implementation

- [ ] T029 [US3] Make family storage methods take a `treeId` and filter by it; relationship and event creation MUST verify referenced members belong to the same tree, in `server/storage.ts`.
- [ ] T030 [US3] Update `server/__tests__/storage.test.ts` for tree-scoped storage including cross-tree reference rejection.
- [ ] T031 [US3] Implement `requireTreeOwner` (404 for missing or foreign) in `server/auth/middleware.ts`.
- [ ] T032 [US3] Add tree storage methods (list with member counts, create, rename, delete) to `server/storage.ts`.
- [ ] T033 [US3] Add `/api/trees` routes in `server/routes.ts`.
- [ ] T034 [US3] Move all existing family routes under `/api/trees/:treeId/...` with `requireAuth` and `requireTreeOwner` in `server/routes.ts`.
- [ ] T035 [P] [US3] Build tree list page (empty state, create, rename, delete confirmation stating member count) in `client/src/pages/trees.tsx`.
- [ ] T036 [P] [US3] Build tree switcher in `client/src/components/tree-switcher.tsx`.
- [ ] T037 [US3] Route `/trees`, `/trees/:treeId`, and `/` (open the single tree or show the list) in `client/src/App.tsx`; show "not found" for foreign tree IDs.
- [ ] T038 [US3] Update client data hooks and API calls in `client/src/pages/family-tree.tsx` and related components in `client/src/components/` to use the tree-scoped endpoints with the `treeId` from the URL.
- [ ] T058 [US3] Record and test FR-016 access-denied events for missing, expired, or disabled sessions in `/api/auth/me` and for unauthenticated/foreign tree requests; include required request metadata and never log passwords or session IDs.

**Checkpoint**: Ownership isolation verified across accounts and trees.

---

## Later Phase 4: User Story 4 - Operator Accounts and Existing Data Migration (P2)

**Goal**: Operators manage accounts by CLI; existing data lands with the default owner.

**Independent Test**: Quickstart scenarios 8 and 9.

- [ ] T039 [P] [US4] Migration test: pre-feature rows end up in one tree owned by the default owner with matching counts, and an empty database still gets the owner, in `server/__tests__/migration.test.ts`.
- [ ] T040 [P] [US4] CLI tests for create (min 12 chars, normalized unique username), disable (ends sessions), enable, reset-password, in `server/__tests__/cli-users.test.ts`.
- [ ] T041 [US4] Implement `create`, `disable`, `enable`, `reset-password` with password from prompt or `USER_PASSWORD` (never argv) in `server/cli/users.ts`.
- [ ] T042 [US4] Delete a disabled user's sessions by `sess->>'userId'` in the storage layer used by the CLI in `server/storage.ts`.
- [ ] T043 [US4] Extend feature-011 security-event coverage to operator account changes; Phase 2 sign-in and sign-out events are covered by T017 and T022, and access-denied event coverage is tracked by T058.

---

## Later Phase 5: User Story 5 - Ready for Other Sign-In Methods (P3)

**Goal**: Adding Google, Apple, or email+OTP later needs no ownership or session changes.

- [ ] T044 [P] [US5] Test that tree ownership and sessions depend only on `users.id` and that credential `type` is data (a second credential type can be inserted without schema change), in `server/__tests__/credentials.test.ts`.
- [ ] T045 [US5] Make the login page render available sign-in methods from a single list that contains only username/password now, with no placeholder buttons, in `client/src/pages/login.tsx`.
- [ ] T046 [US5] Document the extension points for future credential types in `specs/015-basic-auth-login/research.md`.

---

## Later Phase 6: Polish and Cross-Cutting

- [ ] T047 [P] Accessibility and responsive check of login, tree list, and switcher at phone width and keyboard-only (FR-018, SC-007).
- [ ] T048 [P] Update `specs/003-accounts-collaboration/` plan, data-model, and contract to build on `family_trees`, `users`, and `credentials` instead of `family_groups`.
- [ ] T049 Update `README.md` with first-run, seeding, and CLI instructions.
- [ ] T050 Run `npm run check` and `npm test -- --run`, then walk through later-phase quickstart scenarios against a pre-feature database.
- [ ] T051 Confirm all spec checklists and that completed tasks are checked in this file.

---

## Dependencies and Execution Order

- Phase 1 delivers the client-only demo UI. Phase 2 implements server sign-in and sessions; later tree-ownership phases depend on it.
- US1 and US2 are sequential on the same auth files (US2 extends US1's session handling).
- US3 depends on Phase 2 and on US1 (needs an authenticated user); it can proceed in parallel with US2.
- US4 depends on Phase 2; CLI and migration tests do not require US1 UI.
- US5 depends on US1.
- Polish last.

### Parallel opportunities

- T007 and T008; T013 and T014; T018 and T019; T027 and T028; T035 and T036; T039 and T040; T044 and T047.

## Implementation Strategy

- **First delivery**: Phase 1 (T052–T056) delivers only the login UI, demo identity, family-tree transition,
  and logout; it does not deliver authentication or ownership enforcement.
- **Phase 2 server-auth milestone**: T001–T026 deliver server-side username/password verification,
  sessions, throttling, logout, test-only multi-account fixtures, and the server-backed login UI. Family-data
  API authorization, tree ownership, migration, and operator account management are explicitly deferred.
- **Full authentication milestone**: The later phases complete the original tree ownership and authorization
  scope. Validate each checkpoint with the corresponding quickstart scenarios.
