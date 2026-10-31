# Auth & Groups API Contract: Accounts and Collaborative Family Groups

Base path `/api`. Session cookie is HTTP-only, secure, same-site. All family-data routes require an
authenticated session and group authorization. Error shape matches the project standard
`{ "error": { "code", "message", "details" } }`. Auth errors never reveal account existence.

## Authentication

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| POST | `/api/auth/register` | Register with email | 201 | 400 |
| POST | `/api/auth/login` | Email login | 200 | 401 (generic) |
| GET | `/api/auth/sso/:provider` | Begin SSO | 302 | 400 |
| GET | `/api/auth/sso/:provider/callback` | Complete SSO | 302 | 401 |
| POST | `/api/auth/logout` | End session | 204 | 401 |
| GET | `/api/auth/me` | Current user + memberships | 200 | 401 |

## Groups, membership, invitations

| Method | Path | Role required | Purpose |
|--------|------|---------------|---------|
| POST | `/api/groups` | authenticated | Create a group (creator = owner) |
| GET | `/api/groups/:id` | member | Group details |
| POST | `/api/groups/:id/invitations` | admin+ | Invite by email with a role |
| POST | `/api/invitations/:token/accept` | authenticated | Accept an invitation |
| PATCH | `/api/groups/:id/members/:userId` | admin+ | Change a member's role |
| DELETE | `/api/groups/:id/members/:userId` | admin+ | Remove a member |

Rules:
- Role changes and removals MUST preserve at least one owner/administrator (else `409 conflict`).
- Cross-group access is denied with `403 forbidden`.

## Public sharing

| Method | Path | Role required | Purpose |
|--------|------|---------------|---------|
| POST | `/api/groups/:id/public-share` | admin+ | Create a read-only public link (optional `expiresAt`; default no expiry) |
| DELETE | `/api/groups/:id/public-share` | admin+ | Revoke the public link |
| GET | `/api/public/:token` | none | Read-only view excluding private data |

Rules:
- `/api/public/:token` is read-only and omits private-designated data.
- A revoked/expired token returns `404 not_found` (no data leak).

## Family data (existing routes, now guarded)

- All `/api/family-*`, `/api/relationships`, `/api/events` routes require `requireGroupAccess`
  and the appropriate minimum role (viewer for reads, editor+ for writes), and are always scoped
  to the caller's group.
