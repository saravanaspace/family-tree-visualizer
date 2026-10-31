# Quickstart: Validating Basic Authentication and Authorization

## Prerequisites

- PostgreSQL running; `DATABASE_URL` set; optional `TEST_DATABASE_URL` for tests.
- Environment: `SESSION_SECRET`, `DEFAULT_OWNER_USERNAME`, `DEFAULT_OWNER_PASSWORD` (12+ characters).
  Production startup fails if these are missing.

## Setup

```bash
npm run db:migrate          # applies 0002_auth_and_trees.sql
npm run dev
```

## Validation scenarios

1. **Login gate** (US1): open `/` signed out. Expect redirect to `/login` and no tree data in network calls.
2. **Sign in** (US1): sign in as the default owner. Expect the existing tree to open (single tree) and the
   originally requested path to be restored after login.
3. **Generic failure** (US1): wrong password and unknown username show the same message and status.
4. **Lockout** (US1): 5 wrong passwords lock sign-in for 15 minutes (429); a correct password is refused
   during the lock and works after it expires.
5. **Session persistence and logout** (US2): reload stays signed in; Sign out ends access; browser back
   shows no data; an expired session returns to login.
6. **Ownership** (US3): create a second user with the CLI (below); sign in as them, create a tree, and
   confirm direct requests to the other user's tree and member IDs return 404.
7. **Multi-tree** (US3): create, rename, switch, and delete a tree; delete confirmation shows the member count.
8. **Migration** (US4): start from a pre-feature database with members; after migration every member,
   relationship, and event belongs to the default owner's tree and counts match.
9. **Disable** (FR-010): disable a user with the CLI while signed in; their next request returns 401.
10. **Extensibility** (US5): login page shows only username/password; credential `type` is data, not schema.

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
