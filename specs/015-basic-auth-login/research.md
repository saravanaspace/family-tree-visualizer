# Phase 0 Research: Basic Authentication and Authorization

## Delivery Phasing

The first delivery is the client-only login UI, default demo identity, route transition to the existing
tree page, and logout. It accepts username `default` with any non-empty password and stores only a
tab-scoped marker. This decision enables the UI flow without claiming verified identity or restricting
the current APIs. Phase 2 replaces that UI marker as the authentication source with a real server-side
session and password verification. Existing family-data endpoints remain unauthenticated until a later
authorization phase.

## Existing Assets

- `passport`, `passport-local`, `express-session`, `connect-pg-simple` are already dependencies.
- Data layer uses `postgres` (postgres-js) with Drizzle; `connect-pg-simple` needs a `pg` pool, and `pg` is
  also already a dependency, so the session store gets its own small pool from `DATABASE_URL`.
- No tree entity exists: members, relationships, and events are global tables.
- `server/__tests__/setup.ts` builds a separate test DB with raw SQL; it must gain the new tables.

## Decision: Server-side sessions (express-session + Postgres store)

- **Decision**: Opaque session ID cookie, session rows in Postgres, user ID stored in the session.
- **Rationale**: Immediate revocation on disable/logout (FR-006, FR-010); matches 003's direction.
- **Alternatives**: Signed JWT cookies (cannot be revoked immediately); in-memory store (lost on restart,
  not multi-instance).
- **Disable handling**: Each request loads the user and rejects if disabled; disabling also deletes that
  user's session rows.
- **Lifetimes**: Rolling idle timeout 7 days and absolute 30 days (stored as `createdAt` in the session),
  both configurable by environment.

## Decision: Password hashing with scrypt

- **Decision**: Node `crypto.scrypt` with per-password random salt, parameters N=2^15, r=8, p=1, 64-byte key,
  stored as `scrypt$N$r$p$salt$hash`; compare with `timingSafeEqual`.
- **Rationale**: Deliberately slow, salted, no new dependency (FR-005). Format carries parameters so they can
  be raised later.
- **Alternatives**: argon2/bcrypt (new native dependency; no real benefit here).
- **Unknown user timing**: Verify against a dummy hash when the username is unknown to keep timing similar
  (FR-003, SC-005).

## Decision: Account vs credential separation

- **Decision**: `users` holds identity and status; `credentials` holds `type` (`password` now; `google`,
  `apple`, `email_otp` later), `identifier`, and `secret`.
- **Rationale**: FR-017, SC-006. Tree ownership references only `users.id`.
- **Alternatives**: password columns on `users` (would force a migration to add other methods).

## Decision: Throttling

- **Decision**: Per-account lockout (5 consecutive failures, 15-minute lock, reset on success) stored on the
  `login_attempts` row keyed by normalized username; plus a per-client-IP limiter of 20 attempts per
  15 minutes, kept in memory for the planned single-instance app.
- **Client address**: Use the direct connection address unless `TRUSTED_PROXIES` lists the trusted
  proxy IPs/CIDRs; only then accept the forwarded client address.
- **Rationale**: FR-004; temporary lock avoids permanent denial of service on the real owner. The in-memory
  per-IP limiter is adequate for the planned single-instance app and can move to shared storage if
  multi-instance deployment is introduced.
- **Behaviour when locked**: Return the same status and generic message shape with a retry hint; never reveal
  that the account exists. Lockout state is applied to unknown usernames identically (tracked in
  `login_attempts` keyed by normalized username) so existence is not leaked.
- **Alternatives**: Permanent lockout (abusable); CAPTCHA (out of scope).

## Decision: Authentication route integration

- **Decision**: Register a focused authentication route module with direct credential verification and
  server-side sessions rather than wiring Passport for the single password credential available in this
  phase.
- **Rationale**: Keeps the current sign-in flow small while preserving account/credential separation for
  future methods.
- **Alternatives**: Passport local strategy (already installed, but adds indirection without a second
  authentication strategy in this phase).

## Decision: Tree entity and ownership

- **Decision**: New `family_trees(id, owner_id, name)`; `tree_id` NOT NULL FK on members, relationships,
  and events; `relationships` unique index becomes per tree. Every storage method takes `treeId`, and routes
  resolve the tree through `requireTreeOwner`, which returns 404 for missing and not-owned alike (FR-013).
- **Rationale**: FR-011, FR-012, FR-020, FR-021.
- **Cross-tree integrity**: When creating a relationship or event, every referenced member must belong to
  the same tree, otherwise 400/404 without revealing foreign IDs.
- **Alternatives**: Per-user filter without a tree table (cannot support multiple trees); 003 groups
  (heavier, role-based, deferred).

## Decision: Existing data migration

- **Decision**: Migration `0002` creates the tables, inserts one `family_trees` row per deployment owned by
  the default owner, backfills `tree_id`, then sets NOT NULL. The default owner user row is created in the
  migration with a disabled placeholder credential; the real password is set at startup seed (FR-009). If
  there is no pre-existing data, only seeding runs.
- **Rationale**: FR-015, SC-004; data is never orphaned.
- **Decision on seed**: Startup seed creates the owner's password credential only if it is missing, from
  `DEFAULT_OWNER_USERNAME` and `DEFAULT_OWNER_PASSWORD`. In production, startup fails if they are unset. In
  development, a generated password is printed once.
- **Initial account scope**: The first server-side sign-in phase accepts the seeded default account only.
  Operator CLI account management is deferred. Multiple users are created only as isolated automated-test
  fixtures; production receives no shared test accounts or test passwords.
- **Credential rules**: Default and later operator-set passwords are 12–256 characters with no composition
  requirements.
- **Note**: The migration is reviewed as destructive-adjacent because it alters constraints; it is additive
  and has a documented rollback.

## Decision: Operator CLI

- **Decision**: `server/cli/users.ts` with `create`, `disable`, `enable`, `reset-password` run via
  `npm run users -- <command>`. Passwords are read from a prompt or an environment variable, never argv.
- **Rationale**: FR-008, FR-010; no admin role or UI is needed.
- **Phase boundary**: This CLI is deferred beyond Phase 2; only the environment-seeded default account is
  available in production during the initial server-auth release.

## Decision: Client approach

- **Decision**: `GET /api/auth/me` drives a `useAuth` hook; `RequireAuth` redirects to `/login`; the
  query client turns 401 into a redirect to login while preserving the target path (US1 scenario 2).
  Routes: `/login`, `/trees`, `/trees/:treeId`, `/` (opens the single tree or shows the list, FR-021).
- **Alternatives**: Server-rendered login (does not fit the SPA).

## Trust Boundaries and Abuse Cases (Constitution VI)

| Boundary | Abuse case | Mitigation |
|----------|-----------|------------|
| Browser to API | Credential stuffing, brute force | Lockout, per-source limit, scrypt cost |
| Browser to API | Username enumeration | Generic message, dummy-hash timing, uniform lock response |
| Browser to API | Session theft/fixation | `httpOnly`, `secure`, `sameSite: lax`, regenerate session ID on login |
| Browser to API | IDOR on trees/members | Ownership check on every route, 404 for foreign resources |
| Browser to API | Cross-tree references | Same-tree check for relationships/events |
| Browser to API | Client-supplied owner ID | Owner always taken from session (FR-014) |
| Operator to DB | Secrets in source/logs | Environment-only config; redact `password`, cookies in logs |
| Server logs | Response bodies logged | Existing request logger truncates JSON bodies; auth routes excluded from body logging |

OWASP Top 10 mapped: A01 access control, A02 crypto failures, A04 insecure design, A05 misconfiguration,
A07 identification and authentication failures, A09 logging. CSRF relies on `SameSite=lax` from 013.

## Phase 2 operational behavior

- Authentication events record event type, timestamp, outcome, source IP, request ID, and account ID when
  known. Passwords and session IDs are never recorded. Use the structured logging and redaction rules in
  feature 011.
- If the account database or server-side session store is unavailable, login and session validation fail
  closed with a service-unavailable response. Never fall back to the Phase 1 client demo marker.

## Phase 2 scope boundary

The login, current-user, and logout endpoints use the server-side session. The client route guard uses
the current-user endpoint and does not trust local demo state. Existing family-data endpoints remain
callable without a session in this phase; API authorization and tree ownership must be implemented later.
