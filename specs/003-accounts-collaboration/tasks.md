---
description: "Task list for Accounts and Collaborative Family Groups"
---

# Tasks: Accounts and Collaborative Family Groups

**Input**: Design documents from `/specs/003-accounts-collaboration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-and-groups.md

**Tests**: Included, with dedicated security/authorization tests (constitution + security posture).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3

## Path Conventions

- Server in `server/` (with `server/auth/`), shared schema in `shared/`, client in `client/src/`.

## Phase 1: Setup

- [ ] T001 Add users, family_groups, memberships, invitations, public_shares tables + `groupId` scope in `shared/schema.ts`
- [ ] T002 [P] Add Zod schemas and enums (roles, statuses) for new entities in `shared/schema.ts`
- [ ] T003 Generate and review the migration in `server/db/` (additive tables + groupId; review destructive changes)

## Phase 2: Foundational (blocking)

- [ ] T004 Configure `express-session` + `connect-pg-simple` in `server/auth/session.ts`
- [ ] T005 Configure Passport local + SSO strategies and serialize/deserialize in `server/auth/passport.ts`
- [ ] T006 Implement `requireGroupAccess` and `requireRole` middleware in `server/auth/authorize.ts`
- [ ] T007 Implement first-owner data migration (assign existing family data to a group) in `server/db/migrate.ts`
- [ ] T008 Guard all existing family routes with authorization + group scoping in `server/routes.ts`

## Phase 3: User Story 1 — Sign In to a Personal Account (P1)

**Goal**: Email + SSO auth with private-by-default data.
**Independent test**: Register/login (email + SSO), session established, logout blocks private data.

- [ ] T009 [P] [US1] Add auth tests incl. enumeration resistance in `server/__tests__/auth.test.ts`
- [ ] T010 [US1] Implement register/login/logout/me routes in `server/routes.ts`
- [ ] T011 [US1] Implement SSO begin/callback routes in `server/routes.ts`
- [ ] T012 [US1] Persist users/identities and hash credentials in `server/storage.ts`
- [ ] T013 [P] [US1] Build sign-in UI and `use-auth` hook in `client/src/pages/sign-in.tsx` and `client/src/hooks/use-auth.ts`

## Phase 4: User Story 2 — Collaborate With Roles (P2)

**Goal**: Invitations, roles, multiple admins, last-admin invariant.
**Independent test**: Invite a second account, assign roles, enforce viewer read-only, keep >=1 admin.

- [ ] T014 [P] [US2] Add role-enforcement + last-admin invariant tests in `server/__tests__/authz.test.ts`
- [ ] T015 [US2] Implement group/invitation/membership routes in `server/routes.ts`
- [ ] T016 [US2] Implement membership + invitation persistence and invariants in `server/storage.ts`
- [ ] T017 [P] [US2] Build group/member management UI in `client/src/pages/group-management.tsx`

## Phase 5: User Story 3 — Public Read-Only Share (P3)

**Goal**: Publish/revoke a read-only view excluding private data.
**Independent test**: Publish link, open signed-out (read-only, no private data), revoke removes access.

- [ ] T018 [P] [US3] Add public-share tests (read-only, private exclusion, revocation) in `server/__tests__/share.test.ts`
- [ ] T019 [US3] Implement public-share create/revoke and `/api/public/:token` in `server/routes.ts`
- [ ] T020 [US3] Implement privacy-excluding render + share persistence in `server/storage.ts`
- [ ] T021 [P] [US3] Build share controls and public view in `client/src/pages/public-view.tsx`

## Phase 6: Polish & Cross-Cutting

- [ ] T022 [P] Add security review checklist run against `contracts/auth-and-groups.md`
- [ ] T023 Update `README.md` with auth/env/setup and migration notes
- [ ] T024 Run full `npm test` and `npm run check`; confirm green

## Dependencies

- Setup (T001–T003) → Foundational (T004–T008) → US1 (T009–T013) → US2 (T014–T017) → US3 (T018–T021) → Polish.
- US2 and US3 depend on US1 (accounts) but are otherwise independent increments.

## Parallel Execution Examples

- After T008: run T009, T014, T018 (separate test files) in parallel.

## Implementation Strategy

- MVP = Foundational + US1 (accounts + private data + guarded routes).
- Add collaboration (US2) then public sharing (US3). Security tests gate each increment.
