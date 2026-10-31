# Phase 1 Data Model: Accounts and Collaborative Family Groups

New tables added via Drizzle in `shared/schema.ts`. Existing family tables gain a `groupId` scope.
Migrations must be reviewed for destructive changes and include the data migration to the first
owner.

## New entities

### User account (`users`)
- `id`, `email` (unique), `passwordHash` (nullable when SSO-only), `displayName`,
  `emailVerifiedAt`, `createdAt`, `updatedAt`.

### External identity (`user_identities`)
- `id`, `userId` (FK), `provider` (e.g., google), `providerSubject`, unique
  (`provider`, `providerSubject`); links SSO logins to one account.

### Family group (`family_groups`)
- `id`, `name`, `ownerId` (FK users), `createdAt`, `updatedAt`.

### Membership (`memberships`)
- `id`, `groupId` (FK), `userId` (FK), `role` (owner | administrator | editor | viewer),
  unique (`groupId`, `userId`).

### Invitation (`invitations`)
- `id`, `groupId` (FK), `email`, `role`, `token` (unique), `status`
  (pending | accepted | revoked | expired), `expiresAt`.

### Public share (`public_shares`)
- `id`, `groupId` (FK), `token` (unique), `status` (active | revoked), `createdBy`, `createdAt`, `expiresAt` (nullable; null = no expiry).
  `token` is unguessable (cryptographically random); expired or revoked shares grant no access.

## Scope changes to existing tables

- `family_members`, `relationships`, `family_events` gain `groupId` (FK to `family_groups`,
  cascade delete) so all family data is partitioned by group.
- Add a privacy marker: `isPrivate` (boolean) on member fields group or a `privacy` designation
  mechanism for data excluded from public shares (final shape decided in tasks).

## Invariants

- Every family record belongs to exactly one group.
- A group always has at least one owner or administrator.
- A user's email and SSO identities resolve to a single `users` row.
- Revoked/expired invitations and revoked shares grant no access.
- Private-designated data is never included in a public share render.

## Validation

- Zod schemas validate all new inputs; roles and statuses are enums.
- Passwords are hashed (never stored in plaintext); tokens are unguessable.
