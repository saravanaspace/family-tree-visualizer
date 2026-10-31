# Implementation Plan: Basic Authentication and Authorization

**Branch**: `015-basic-auth-login` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-basic-auth-login/spec.md`

## Summary

Add a username/password login page, server-side sessions, and ownership-based authorization. Introduce an
explicit `family_trees` table owned by a user; scope members, relationships, and events to a tree; and
migrate all existing data to a seeded default owner. Accounts are separated from credentials so Google,
Apple, and email+OTP can be added later without touching ownership or sessions. Accounts are created by an
operator CLI; there is no public sign-up.

### Delivery Phases

- **Phase 1 (implemented first)**: client-only login UI for fixed user `default`, route gate to the
  existing family-tree page, and sign-out. Any non-empty password is accepted but not checked or stored.
  A tab-scoped browser marker is only a UI convenience, not a security boundary; API requests and family
  data remain unprotected.
- **Phase 2 (current implementation scope)**: verify the environment-seeded default account on the
  server; persist opaque sessions in PostgreSQL; add login, current-user, and logout endpoints; enforce
  account and source-based temporary login limits; record redacted auth events; and replace the client
  demo marker with the server session. Automated test fixtures provide multiple accounts for testing.
  Family-data endpoints remain unauthenticated in this phase.
- **Later phases**: add API authorization, tree ownership and management, legacy-data migration, operator
  account administration, and additional sign-in methods. Phase 2 must not be described as protecting
  family-data endpoints until those later authorization changes are complete.

Do not treat completion of Phase 1 as completion of this feature's security or authorization goals.

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18 client, Express 4 server)

**Primary Dependencies**: `express-session` + `connect-pg-simple`, Node built-in `crypto.scrypt`, `pg`,
Drizzle ORM, Zod, wouter, TanStack Query (existing dependencies)

**Storage**: PostgreSQL; Phase 2 adds `users`, `credentials`, `login_attempts`, and `user_sessions`.
Future tree-ownership phases add `family_trees` and `tree_id` to family records.

**Testing**: Vitest (password unit tests, auth/session API integration, client auth flow); test-only account
fixtures create multiple users. `npm run check` and focused tests must pass.

**Target Platform**: Evergreen browsers + Node server (single port 5000)

**Project Type**: Web application (`client/` + `server/` + `shared/`)

**Performance Goals**: Sign-in and navigation to the existing tree complete within SC-003's 15-second
user-facing target under normal development conditions.

**Constraints**: Cookie policy reuses 013 (`secure` in production, `httpOnly`, `sameSite: lax`); errors use
the 009 shape `{ message, error? }`; passwords are 12–256 characters and hashed with scrypt; secrets only
from environment; trusted forwarded addresses only behind configured proxies; auth failures fail closed
with 503 if account/session storage is unavailable; never log passwords or session IDs. New auth migration
is additive; family-tree ownership migration remains deferred.

**Scale/Scope**: Handful of accounts, several trees per account, up to thousands of members per tree

### Phase 2 Architecture

- Store normalized accounts and password credentials in PostgreSQL; keep account identity independent of
  family-tree ownership.
- Seed exactly the configured default account in production. Do not ship reusable test credentials.
  Create multiple short-lived test accounts only inside isolated automated-test setup/fixtures.
- Store sessions server-side in PostgreSQL, regenerate session identifiers after successful sign-in, and
  enforce both configured idle and absolute lifetimes.
- Use a dummy scrypt verification for unknown usernames. Track 5 consecutive username failures for a
  15-minute lockout and cap each client IP at 20 attempts per 15 minutes. Honor forwarded client IPs only
  when Express trust-proxy configuration is explicitly set.
- `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout` are auth endpoints. This phase
  does not add authentication middleware to existing family-data routes; callers can still access them
  directly until the later authorization phase.
- On database/session-store errors, return a service-unavailable result and never consult the Phase 1
  browser marker. Auth event fields follow feature 011 and omit passwords and session IDs.

## Constitution Check

*GATE: Must pass before research. The Phase 1 client-only UI is not evidence that the planned full
server-authentication design has passed its security gate.*

- **I. Requirements and Traceability**: PASS. spec, plan, tasks present; tasks trace to FR/SC IDs.
- **II. Consistent Type-Safe Stack**: PASS. Existing stack only; Zod validates all inputs; shared
  schemas in `shared/`; Drizzle schema plus reviewed SQL migration.
- **III. Behavior-Driven Verification**: Planned for the full authentication scope. Phase 1 adds focused
  UI flow tests. Phase 2 adds password, login/lockout, session, outage, event-redaction, and multi-account
  auth tests; tree ownership and migration tests remain later work.
- **IV. Reliable Integration Boundaries**: Phase 2 validates the browser/API/session/database boundary
  and fails closed on storage outages. Family-data authorization remains explicitly deferred.
- **V. Accessible, Responsive, and Focused UX**: PASS. Labelled, keyboard-operable, responsive login page and
  tree switcher with empty, loading, and error states.
- **VI. Security by Design**: Phase 1 is explicitly a non-security UI prototype. Phase 2's password,
  session, throttling, outage, and logging controls are designed in [research.md](research.md). Ownership
  authorization and data isolation remain unimplemented until later phases. **Accepted temporary
  exception**: per the user's explicit phase boundary, existing family-data APIs (including state-changing
  routes) remain directly accessible during Phase 2. This does not satisfy Principle VI for those routes;
  Phase 2 must not be presented as a secure family-data release, and the exception ends only when later
  task T034 protects the existing family routes.

Full-scope security and integration gates must be rechecked as the later phases are implemented.

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
└── schema.ts                    # users, credentials, loginAttempts; future tree entities; Zod schemas

server/
├── auth/
│   ├── password.ts              # scrypt hash/verify
│   ├── lockout.ts               # per-account lockout + per-source limiter
│   ├── session.ts               # express-session + pg store config (uses 013 cookie policy)
│   ├── storage.ts               # account, credential, and failed-login persistence
│   ├── service.ts               # credential verification
│   ├── routes.ts                # login, current-user, and logout endpoints
│   ├── setup.ts                 # startup seeding and auth middleware registration
│   ├── middleware.ts            # requireAuth, later requireTreeOwner
│   └── seed.ts                  # default owner from environment
├── cli/
│   └── users.ts                 # later: create | disable | enable | reset-password
├── routes.ts                    # auth routes, tree routes, tree-scoped family routes
├── storage.ts                   # tree-scoped queries; user/tree storage
└── __tests__/
    ├── auth.test.ts
    ├── ownership.test.ts
    └── migration.test.ts

migrations/
├── 0002_authentication.sql      # Phase 2 account, lockout, and session tables
└── later tree-ownership migration # tree tables and legacy-data backfill

client/src/
├── pages/
│   ├── login.tsx
│   └── trees.tsx                # tree list / create / rename / delete
├── hooks/use-auth.tsx
├── components/
│   ├── require-auth.tsx
│   └── tree-switcher.tsx
├── lib/queryClient.ts           # 401 handling
└── App.tsx                      # Phase 1 /login and guarded /; later tree routes
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
