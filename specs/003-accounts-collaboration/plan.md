# Implementation Plan: Accounts and Collaborative Family Groups

**Branch**: `003-accounts-collaboration` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-accounts-collaboration/spec.md`

## Summary

Introduce user accounts (email + SSO), account-owned family groups, role-based membership with
multiple administrators, and a revocable read-only public share that excludes private data. This
converts the current single implicit tree into a group owned by an account (migrated on first
sign-in) and enforces authorization on every family-data operation. Security (session handling,
access control, no account enumeration) is a first-class concern.

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18 client, Express server)

**Primary Dependencies**: Express, Passport (`passport-local` for email; an OIDC/OAuth strategy
for SSO), `express-session` + `connect-pg-simple` (Postgres session store), Drizzle ORM, Zod
(all already present in `package.json`)

**Storage**: PostgreSQL; new tables for users, groups, memberships, invitations, and public
shares; existing family tables gain a group scope

**Testing**: Vitest for storage, authorization rules, and API contract; security-focused tests
for access control and enumeration resistance

**Target Platform**: Evergreen browsers + Node server

**Project Type**: Web application (`client/` + `server/` + `shared/`)

**Performance Goals**: Auth and authorization add negligible latency; sign-in to tree under 3
minutes for a new user

**Constraints**: Private by default; least-privilege roles; hashed credentials; secure session
cookies; no account enumeration; destructive migrations reviewed; secrets outside source

**Scale/Scope**: Multiple accounts, multiple groups per owner, many members per group

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — spec, plan, tasks to follow.
- **II. Consistent Type-Safe Stack**: PASS — uses existing stack and installed auth libraries;
  new tables via Drizzle with Zod validation; shared types in `shared/`.
- **III. Behavior-Driven Verification**: PASS — auth flows, role enforcement, invitation, and
  share revocation are tested, including negative/security cases.
- **IV. Reliable Integration Boundaries**: PASS — new client↔API↔DB and session-store boundaries
  are integration-tested; family endpoints gain authorization checks with tests.
- **V. Accessible, Responsive, and Focused UX**: PASS — auth and sharing screens are accessible
  and responsive.

Result: No violations. Security posture is tracked as explicit tasks, not a complexity exception.

## Project Structure

### Documentation (this feature)

```text
specs/003-accounts-collaboration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── auth-and-groups.md
```

### Source Code (repository root)

```text
shared/
└── schema.ts                 # add users, family_groups, memberships, invitations, public_shares;
                              # add groupId scope to family tables

server/
├── auth/
│   ├── passport.ts           # NEW: local + SSO strategies, serialize/deserialize
│   ├── session.ts            # NEW: express-session + connect-pg-simple config
│   └── authorize.ts          # NEW: role/scope middleware (requireRole, requireGroupAccess)
├── routes.ts                 # add auth, group, membership, invitation, share routes; guard
│                             # existing family routes with authorization
├── storage.ts                # add user/group/membership/invitation/share persistence + scoping
├── db/                       # migration for new tables + data migration to first owner
└── __tests__/                # authz, enumeration, invitation, share revocation tests

client/
└── src/
    ├── pages/                # sign-in, group management, public view
    ├── components/           # auth forms, role/member management, share controls
    └── hooks/use-auth.ts     # NEW: session state
```

**Structure Decision**: Existing web application, extended with an `server/auth/` module for
strategies, session, and authorization middleware; family routes are wrapped with group-scoped
authorization. New account/group entities live in `shared/schema.ts`.

## Complexity Tracking

> No constitution violations. The added authorization layer is required by the feature, not an
> unjustified abstraction.
