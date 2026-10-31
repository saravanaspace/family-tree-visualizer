# API Contract: Authentication and Trees

Phase 2 implements the authentication endpoints. Tree and tree-scoped contracts below describe later work;
existing family-data routes remain unauthenticated until API authorization is implemented. Phase 1 added
client-side navigation only: username `default` plus any non-empty password entered the existing tree page.
That demo flow did not verify credentials or restrict direct API requests.

Base path `/api`. Session cookie is `httpOnly`, `secure` in production, `sameSite: lax` (013 cookie policy).
Errors use the 009 shape `{ "message": string, "error"?: ... }`. The family route 401 requirement applies
only after the later API-authorization phase.

## Authentication

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| POST | `/api/auth/login` | Sign in with username and password | 200 `{ user }` | 400 invalid body; 401 generic "Invalid username or password"; 429 locked or rate limited (with `Retry-After`); 503 auth storage unavailable |
| POST | `/api/auth/logout` | End the current session | 204 | 503 auth storage unavailable |
| GET | `/api/auth/me` | Current user | 200 `{ user }` | 401; 503 auth storage unavailable |

- Login body: `{ "username": string, "password": string }`. A new session ID is issued on success.
- `user`: `{ id, username, displayName }`. Never includes credential data.
- 401 is identical for unknown user, wrong password, and disabled account.
- 429 is returned for locked accounts, including unknown usernames locked by repeated attempts, with the same
  message and no indication whether the account exists.
- Passwords must be 12–256 characters. Unknown usernames use a dummy password verification.
- Successful login regenerates the session ID; server-side sessions use configured idle and absolute
  lifetimes.
- Source-based throttling uses the direct connection address unless `TRUSTED_PROXIES` explicitly
  configures the forwarding proxy IPs/CIDRs.

## Trees

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| GET | `/api/trees` | List the caller's trees (`id`, `name`, `memberCount`) | 200 | 401 |
| POST | `/api/trees` | Create a tree owned by the caller; body `{ name }` | 201 | 400, 401 |
| PATCH | `/api/trees/:treeId` | Rename; body `{ name }` | 200 | 400, 401, 404 |
| DELETE | `/api/trees/:treeId` | Delete the tree and all its data | 204 | 401, 404 |

The owner is always the session user; any `ownerId` in a body is rejected by validation.

## Tree-scoped family data

Existing endpoints move under the tree. Every route requires a session and a tree owned by the caller;
otherwise `404` (indistinguishable from a nonexistent tree).

| Method | Path |
|--------|------|
| GET | `/api/trees/:treeId/family-tree` |
| POST | `/api/trees/:treeId/family-members` |
| PATCH | `/api/trees/:treeId/family-members/:id/position` |
| PATCH | `/api/trees/:treeId/family-members/:id` |
| DELETE | `/api/trees/:treeId/family-members/:id` |
| POST | `/api/trees/:treeId/relationships` |
| PATCH | `/api/trees/:treeId/relationships/:id` |
| DELETE | `/api/trees/:treeId/relationships/:id` |
| POST | `/api/trees/:treeId/events` |
| GET | `/api/trees/:treeId/events` |
| DELETE | `/api/trees/:treeId/events/:id` |

Rules:
- A member, relationship, or event ID that belongs to a different tree returns `404`.
- Relationship and event bodies referencing members from another tree return `404` without disclosing them.
- Responses never include other users' tree IDs or credential data.

## Operator CLI (not HTTP)

`npm run users -- create <username> [--display-name <name>]`, `disable <username>`, `enable <username>`,
`reset-password <username>`. Password supplied via prompt or `USER_PASSWORD` environment variable, minimum
12 characters. `disable` also deletes that user's sessions.
