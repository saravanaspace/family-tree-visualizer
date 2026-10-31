# Quickstart: Login UI, Server Sign-In, and Later Authorization

## Phase 1: UI-only login flow (superseded by Phase 2 server auth)

Run the app using the existing development setup and open it with no active demo session.

1. Open `/`. The login page appears before the existing family-tree page.
2. Confirm that the page says this is a demo and that the password is not verified.
3. Enter username `default` and any non-empty password. The existing tree page opens.
4. Reload the tab; the demo UI session remains active.
5. Select **Sign out**; the marker and query cache are cleared and login appears again.
6. Try another username; the login page displays an error.

This flow provides no API authentication, authorization, or family-data protection. Do not use it as a
security boundary.

## Phase 2: Username/password sign-in and sessions

1. Configure `DATABASE_URL`, `SESSION_SECRET`, `DEFAULT_OWNER_USERNAME`, and
   `DEFAULT_OWNER_PASSWORD` (12–256 characters) in the development environment. Set `TRUSTED_PROXIES`
   only when the app is behind explicitly trusted proxies. Never commit secrets.
2. Apply `npm run db:migrate` to an existing family-data database, or run `npm run db:push` followed by
   `npm run db:migrate` for a new development database. The default account is created
   only if missing; an existing password is not overwritten.
3. Open `/login`, sign in with the configured default username/password, and verify `/api/auth/me` returns
   the account identity without credentials.
4. Reload the tab and verify the server session keeps the UI signed in. Sign out and verify the session
   is invalidated and the login form returns.
5. Try unknown and incorrect credentials; both receive the same generic 401. Confirm 5 consecutive
   username failures lock for 15 minutes and the per-source limit is 20 attempts per 15 minutes.
6. Verify session/database-store failures fail closed with 503, and auth logs contain no passwords or
   session IDs.
7. Automated integration tests create multiple isolated accounts (e.g. active A, active B, disabled);
   these fixtures are never seeded in production.

## Prerequisites

- PostgreSQL running; `DATABASE_URL` set; optional `TEST_DATABASE_URL` for tests.
- Environment: `SESSION_SECRET`, `DEFAULT_OWNER_USERNAME`, `DEFAULT_OWNER_PASSWORD` (12–256 characters).
  Production startup fails if these are missing.

## Setup

```bash
npm run db:migrate          # applies 0002_authentication.sql
npm run dev
```

## Later-phase validation scenarios

1. **Login gate** (US1): open `/` signed out. Expect redirect to `/login`; family-data API requests are
  still unauthenticated until the authorization phase.
2. **Sign in** (US1): sign in as the default owner; verify originally requested page is restored.
3. **Ownership** (US3): create a second user with the CLI (below); sign in as them, create a tree, and
  confirm direct requests to the other user's tree and member IDs return 404.
4. **Multi-tree** (US3): create, rename, switch, and delete a tree; delete confirmation shows the member count.
5. **Migration** (US4): start from a pre-feature database with members; after migration every member,
  relationship, and event belongs to the default owner's tree and counts match.
6. **Disable** (FR-010): disable a user with the CLI while signed in; their next request returns 401.
7. **Extensibility** (US5): login page shows only username/password; credential `type` is data, not schema.

## Operator CLI

```bash
USER_PASSWORD='<12+ chars>' npm run users -- create alice --display-name "Alice"
npm run users -- disable alice
npm run users -- enable alice
USER_PASSWORD='<new>' npm run users -- reset-password alice
```

## Automated checks

```bash
npm run check
npm test -- --run
```

Contract details: [contracts/auth-and-trees.md](contracts/auth-and-trees.md). Data details:
[data-model.md](data-model.md).

**Important**: Phase 2 login does not authenticate direct family-data API requests. Those routes remain
unprotected until the later API-authorization phase.
