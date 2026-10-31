# API Contract: Authentication and Trees

Base path `/api`. Session cookie is `httpOnly`, `secure` in production, `sameSite: lax` (013 cookie policy).
Errors use the 009 shape `{ "message": string, "error"?: ... }`. Unauthenticated requests to any route other
than `POST /api/auth/login` and `GET /api/auth/me` get `401`.

## Authentication

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| POST | `/api/auth/login` | Sign in with username and password | 200 `{ user }` | 400 invalid body; 401 generic "Invalid username or password"; 429 locked or rate limited (with `Retry-After`) |
| POST | `/api/auth/logout` | End the current session | 204 | none (idempotent) |
| GET | `/api/auth/me` | Current user | 200 `{ user }` | 401 |

- Login body: `{ "username": string, "password": string }`. A new session ID is issued on success.
- `user`: `{ id, username, displayName }`. Never includes credential data.
- 401 is identical for unknown user, wrong password, and disabled account.
- 429 is returned for locked accounts, including unknown usernames locked by repeated attempts, with the same
  message and no indication whether the account exists.

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
