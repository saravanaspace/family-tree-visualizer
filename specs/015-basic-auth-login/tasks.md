# Tasks: Basic Authentication and Authorization

**Input**: Design documents from `/specs/015-basic-auth-login/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-and-trees.md

**Tests**: Included. The constitution (III, IV, VI) requires Vitest coverage for server, storage, schema, and
security behavior. `npm run check` and `npm test -- --run` must pass before a task is marked complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (US1 to US5)

---

## Phase 1: Setup

- [ ] T001 Add `"users": "tsx server/cli/users.ts"` script to `package.json` and document `SESSION_SECRET`, `DEFAULT_OWNER_USERNAME`, `DEFAULT_OWNER_PASSWORD`, `SESSION_IDLE_DAYS`, `SESSION_MAX_DAYS` in `README.md` (no secrets committed)
- [ ] T002 [P] Create folders `server/auth/` and `server/cli/` and add placeholder-free module files listed in plan.md as they are implemented

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: Schema, migration, and core auth primitives every story depends on.

- [ ] T003 Add `users`, `credentials`, `familyTrees`, `loginAttempts` tables and enums to `shared/schema.ts`, add `treeId` (NOT NULL, FK cascade, indexed) to `familyMembers`, `relationships`, `familyEvents`, and make the relationships unique index per tree
- [ ] T004 Add Zod schemas (`loginSchema`, `createTreeSchema`, `renameTreeSchema`, `userSchema`) and exported types to `shared/schema.ts`
- [ ] T005 Write reviewed SQL migration `migrations/0002_auth_and_trees.sql`: create tables, insert default owner user and one tree, backfill `tree_id`, set NOT NULL, FKs, indexes, replace relationships unique index, with documented rollback in a header comment
- [ ] T006 Update `server/__tests__/setup.ts` to create the new tables/columns for the test database and truncate them between tests
- [ ] T007 [P] Implement scrypt hash/verify with dummy-hash timing equalisation in `server/auth/password.ts`
- [ ] T008 [P] Write unit tests for hash format, verify success/failure, and constant-shape failure for unknown users in `server/__tests__/password.test.ts`
- [ ] T009 Implement session configuration (Postgres store `user_sessions`, regenerate on login, idle and absolute lifetime from env, 013 cookie policy, required `SESSION_SECRET` in production) in `server/auth/session.ts`
- [ ] T010 Implement `requireAuth` (loads user, rejects disabled, 401) in `server/auth/middleware.ts`
- [ ] T011 Implement default-owner seeding (env-driven, create-if-missing, never overwrite, fail in production when unset, print generated password once in development) in `server/auth/seed.ts` and call it at startup in `server/index.ts`
- [ ] T012 Add user, credential, and login-attempt storage methods to `server/storage.ts`
- [ ] T013 Make all family storage methods in `server/storage.ts` take a `treeId` and filter by it; relationship and event creation MUST verify referenced members belong to the same tree
- [ ] T014 Update `server/__tests__/storage.test.ts` for tree-scoped storage including cross-tree reference rejection

**Checkpoint**: Schema, migration, hashing, session config, and tree-scoped storage are ready.

---

## Phase 3: User Story 1 - Sign In With Username and Password (P1) 🎯 MVP

**Goal**: A signed-out visitor sees only the login page; valid credentials sign in; invalid ones are denied
generically; repeated failures lock temporarily.

**Independent Test**: Quickstart scenarios 1 to 4.

### Tests

- [ ] T015 [P] [US1] Auth API tests: success, 400 validation, identical 401 for unknown/wrong/disabled, session ID regenerated, no credential data in response, in `server/__tests__/auth.test.ts`
- [ ] T016 [P] [US1] Lockout tests: 5 failures lock 15 minutes (429 with `Retry-After`), success resets, unknown usernames lock identically, per-source limit, in `server/__tests__/lockout.test.ts`

### Implementation

- [ ] T017 [US1] Implement per-account lockout and per-source limiter in `server/auth/lockout.ts`
- [ ] T018 [US1] Implement the local passport strategy keyed on credential type in `server/auth/passport.ts`
- [ ] T019 [US1] Add `POST /api/auth/login` and `GET /api/auth/me` in `server/routes.ts` using the Zod schema and 009 error shape; exclude auth bodies from request logging in `server/index.ts`
- [ ] T020 [P] [US1] Build accessible, responsive login page (labelled fields, visible errors, keyboard submit, lockout message) in `client/src/pages/login.tsx`
- [ ] T021 [P] [US1] Add `useAuth` hook in `client/src/hooks/use-auth.ts` and `RequireAuth` wrapper in `client/src/components/require-auth.tsx`
- [ ] T022 [US1] Handle 401 in `client/src/lib/queryClient.ts` (redirect to `/login` preserving the target path) and add `/login` route plus guarded routes in `client/src/App.tsx`

**Checkpoint**: Login works end to end; unauthenticated users reach nothing.

---

## Phase 4: User Story 2 - Sign Out and Session Persistence (P1)

**Goal**: Sessions persist across reloads, expire per policy, and sign-out ends access immediately.

**Independent Test**: Quickstart scenario 5.

- [ ] T023 [P] [US2] Tests for logout idempotence, session invalid after logout, idle and absolute expiry, and disabled user's next request returning 401 in `server/__tests__/session.test.ts`
- [ ] T024 [US2] Add `POST /api/auth/logout` (destroy session, clear cookie, 204) in `server/routes.ts`
- [ ] T025 [US2] Enforce absolute session lifetime in `server/auth/middleware.ts`
- [ ] T026 [P] [US2] Add sign-out control with accessible label to the app header in `client/src/pages/family-tree.tsx` and redirect to `/login` clearing cached query data in `client/src/hooks/use-auth.ts`
- [ ] T027 [US2] Redirect signed-in users away from `/login` in `client/src/pages/login.tsx`

**Checkpoint**: Full sign-in, persistence, and sign-out lifecycle.

---

## Phase 5: User Story 3 - Trees Belong to a User (P1)

**Goal**: Users only see and modify their own trees; multiple trees with create, rename, switch, delete.

**Independent Test**: Quickstart scenarios 6 and 7.

### Tests

- [ ] T028 [P] [US3] Cross-account tests for every tree and tree-scoped endpoint (list, read, create, update, delete, relationships, events) returning 404 for foreign resources and foreign member references, in `server/__tests__/ownership.test.ts`
- [ ] T029 [P] [US3] Tests that an `ownerId` in a request body is rejected and new trees are owned by the session user, in `server/__tests__/trees.test.ts`

### Implementation

- [ ] T030 [US3] Implement `requireTreeOwner` (404 for missing or foreign) in `server/auth/middleware.ts`
- [ ] T031 [US3] Add tree storage methods (list with member counts, create, rename, delete) to `server/storage.ts`
- [ ] T032 [US3] Add `/api/trees` routes in `server/routes.ts`
- [ ] T033 [US3] Move all existing family routes under `/api/trees/:treeId/...` with `requireAuth` and `requireTreeOwner` in `server/routes.ts`
- [ ] T034 [P] [US3] Build tree list page (empty state, create, rename, delete confirmation stating member count) in `client/src/pages/trees.tsx`
- [ ] T035 [P] [US3] Build tree switcher in `client/src/components/tree-switcher.tsx`
- [ ] T036 [US3] Route `/trees`, `/trees/:treeId`, and `/` (open the single tree or show the list) in `client/src/App.tsx`; show "not found" for foreign tree IDs
- [ ] T037 [US3] Update client data hooks and API calls in `client/src/pages/family-tree.tsx` and related components in `client/src/components/` to use the tree-scoped endpoints with the `treeId` from the URL

**Checkpoint**: Ownership isolation verified across accounts and trees.

---

## Phase 6: User Story 4 - Operator Accounts and Existing Data Migration (P2)

**Goal**: Operators manage accounts by CLI; existing data lands with the default owner.

**Independent Test**: Quickstart scenarios 8 and 9.

- [ ] T038 [P] [US4] Migration test: pre-feature rows end up in one tree owned by the default owner with matching counts, and an empty database still gets the owner, in `server/__tests__/migration.test.ts`
- [ ] T039 [P] [US4] CLI tests for create (min 12 chars, normalized unique username), disable (ends sessions), enable, reset-password, in `server/__tests__/cli-users.test.ts`
- [ ] T040 [US4] Implement `create`, `disable`, `enable`, `reset-password` with password from prompt or `USER_PASSWORD` (never argv) in `server/cli/users.ts`
- [ ] T041 [US4] Delete a disabled user's sessions by `sess->>'userId'` in the storage layer used by the CLI in `server/storage.ts`
- [ ] T042 [US4] Record sign-in success, failure, sign-out, and access-denied security events without passwords or session IDs, following 011 conventions, in `server/auth/middleware.ts` and `server/routes.ts`

---

## Phase 7: User Story 5 - Ready for Other Sign-In Methods (P3)

**Goal**: Adding Google, Apple, or email+OTP later needs no ownership or session changes.

- [ ] T043 [P] [US5] Test that tree ownership and sessions depend only on `users.id` and that credential `type` is data (a second credential type can be inserted without schema change), in `server/__tests__/credentials.test.ts`
- [ ] T044 [US5] Make the login page render available sign-in methods from a single list that contains only username/password now, with no placeholder buttons, in `client/src/pages/login.tsx`
- [ ] T045 [US5] Document the extension points (credential types, passport strategy registry) in `specs/015-basic-auth-login/research.md`

---

## Phase 8: Polish and Cross-Cutting

- [ ] T046 [P] Accessibility and responsive check of login, tree list, and switcher at phone width and keyboard-only (FR-018, SC-007)
- [ ] T047 [P] Update `specs/003-accounts-collaboration/` plan, data-model, and contract to build on `family_trees`, `users`, and `credentials` instead of `family_groups`
- [ ] T048 Update `README.md` with first-run, seeding, and CLI instructions
- [ ] T049 Run `npm run check` and `npm test -- --run`, then walk through `quickstart.md` scenarios 1 to 10 against a pre-feature database
- [ ] T050 Confirm all spec checklists and that completed tasks are checked in this file

---

## Dependencies and Execution Order

- Phase 1 to Phase 2 to user stories. Phase 2 blocks everything.
- US1 and US2 are sequential on the same auth files (US2 extends US1's session handling).
- US3 depends on Phase 2 and on US1 (needs an authenticated user); it can proceed in parallel with US2.
- US4 depends on Phase 2; CLI and migration tests do not require US1 UI.
- US5 depends on US1.
- Polish last.

### Parallel opportunities

- T007 and T008; T015 and T016; T020 and T021; T028 and T029; T034 and T035; T038 and T039; T046 and T047.

## Implementation Strategy

- **MVP**: Phases 1, 2, 3, and 5 (T001 to T022, T028 to T037) deliver a login gate with owned trees. US2 sign-out
  should ship with it since it is P1.
- Deliver in order: Foundation, US1, US2, US3, then US4, US5, Polish. Validate each checkpoint with the
  quickstart scenarios.
