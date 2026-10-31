# Implementation Plan: Basic Authentication and Authorization

**Branch**: `015-basic-auth-login` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-basic-auth-login/spec.md`

## Summary

Add a username/password login page, server-side sessions, and ownership-based authorization. Introduce an
explicit `family_trees` table owned by a user; scope members, relationships, and events to a tree; and
migrate all existing data to a seeded default owner. Accounts are separated from credentials so Google,
Apple, and email+OTP can be added later without touching ownership or sessions. Accounts are created by an
operator CLI; there is no public sign-up.

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18 client, Express 4 server)

**Primary Dependencies**: `passport` + `passport-local`, `express-session` + `connect-pg-simple` (all already
in `package.json`), Node built-in `crypto.scrypt` for password hashing (no new dependency), Drizzle ORM, Zod,
wouter, TanStack Query

**Storage**: PostgreSQL; new tables `users`, `credentials`, `family_trees`, `user_sessions`, `login_attempts`;
`family_members`, `relationships`, `family_events` gain `tree_id`

**Testing**: Vitest (storage, authorization, API integration via an in-process Express app), cross-account
negative tests; `npm run check` must pass

**Target Platform**: Evergreen browsers + Node server (single port 5000)

**Project Type**: Web application (`client/` + `server/` + `shared/`)

**Performance Goals**: Login and per-request session/ownership check add under 50 ms at p95 for a single
instance; sign-in to tree under 15 seconds (SC-003)

**Constraints**: Cookie policy reuses 013 (`secure` in production, `httpOnly`, `sameSite: lax`); errors use
the 009 shape `{ message, error? }`; secrets only from environment; no plaintext passwords stored or logged;
destructive migration steps reviewed

**Scale/Scope**: Handful of accounts, several trees per account, up to thousands of members per tree

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS. spec, plan, tasks present; tasks trace to FR/SC IDs.
- **II. Consistent Type-Safe Stack**: PASS. Existing stack only; Zod validates all inputs; shared
  schemas in `shared/`; Drizzle schema plus reviewed SQL migration.
- **III. Behavior-Driven Verification**: PASS. Vitest covers login success/failure, lockout, session expiry,
  logout, cross-account denial on every endpoint, migration ownership.
- **IV. Reliable Integration Boundaries**: PASS. Client, API, session store, and DB boundaries are
  integration-tested; tree-scoped writes verify referenced members belong to the same tree.
- **V. Accessible, Responsive, and Focused UX**: PASS. Labelled, keyboard-operable, responsive login page and
  tree switcher with empty, loading, and error states.
- **VI. Security by Design**: PASS. Trust boundaries and abuse cases are in [research.md](research.md); all
  state-changing routes enforce authN/Z; generic failures; lockout; hashed credentials; no secrets in logs.

Post-design re-check: PASS. No violations; no Complexity Tracking entries.

## Project Structure

### Documentation (this feature)

```text
specs/015-basic-auth-login/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-and-trees.md
├── checklists/
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
shared/
└── schema.ts                    # + users, credentials, familyTrees, loginAttempts; tree_id columns; Zod schemas

server/
├── auth/
│   ├── password.ts              # scrypt hash/verify
│   ├── lockout.ts               # per-account lockout + per-source limiter
│   ├── session.ts               # express-session + pg store config (uses 013 cookie policy)
│   ├── passport.ts              # local strategy (credential-type aware)
│   ├── middleware.ts            # requireAuth, requireTreeOwner
│   └── seed.ts                  # default owner from environment
├── cli/
│   └── users.ts                 # create | disable | enable | reset-password
├── routes.ts                    # auth routes, tree routes, tree-scoped family routes
├── storage.ts                   # tree-scoped queries; user/tree storage
└── __tests__/
    ├── auth.test.ts
    ├── ownership.test.ts
    └── migration.test.ts

migrations/
└── 0002_auth_and_trees.sql      # tables, tree_id backfill to default owner

client/src/
├── pages/
│   ├── login.tsx
│   └── trees.tsx                # tree list / create / rename / delete
├── hooks/use-auth.ts
├── components/
│   ├── require-auth.tsx
│   └── tree-switcher.tsx
├── lib/queryClient.ts           # 401 handling
└── App.tsx                      # routes: /login, /trees, /trees/:treeId
```

**Structure Decision**: Extend the existing `client/` + `server/` + `shared/` layout. Auth code lives in a
new `server/auth/` folder to keep `routes.ts` small; the operator CLI is a separate `tsx` entry like the
existing `server/db/*` scripts.

## Complexity Tracking

No constitution violations to justify.

## Cross-Feature Impact

- **003-accounts-collaboration** plans `family_groups` plus memberships. This feature's `family_trees` (owned
  by one user) is the same concept: 003 should add memberships and roles on top of `family_trees` instead of
  creating `family_groups`, and reuse `users`/`credentials` for email and SSO identities. 003's docs need a
  follow-up update before it is implemented.
- **013**: cookie policy module reused for the session cookie.
- **009/011**: error shape and logging conventions apply; password and session identifiers must never be logged.
- **016 (demo mode)**: once auth and tree-scoped storage land, demo mode needs its own tree/user or an auth bypass.
