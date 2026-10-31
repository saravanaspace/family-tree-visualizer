# Planned Data Model: Basic Authentication and Authorization

Phase 1 (the UI-only login flow) adds no database entities, shared data schemas, or migrations. The model
below separates the Phase 2 server sign-in entities from later tree-ownership entities.

Phase 2 entities are defined in `shared/schema.ts` via Drizzle and added by the additive
`migrations/0002_authentication.sql` migration. Later ownership work will use a separate migration.

## New entities

### User (`users`)
- `id` serial PK
- `username` varchar(50), unique on lowercase value, stored normalized (trimmed, lowercased)
- `displayName` varchar(100)
- `status` enum `active | disabled`, default `active`
- `createdAt`, `updatedAt`

### Credential (`credentials`)
- `id` serial PK, `userId` FK users (cascade)
- `type` enum `password` (future: `google`, `apple`, `email_otp`)
- `identifier` varchar(255): the username for `password`; provider subject or email later
- `secretHash` text nullable: scrypt string for `password`
- Unique (`type`, `identifier`); one `password` credential per user

### Login Attempt (`login_attempts`)
- `username` varchar(50) PK (normalized; includes unknown names)
- `failedCount` int, `lockedUntil` timestamp nullable, `updatedAt`
- Used so lockout behaves identically for unknown and known usernames.

### Session (`user_sessions`)
- Managed by `connect-pg-simple`: `sid` PK, `sess` json, `expire` timestamp (indexed).
- The session payload holds `userId` and `createdAt` (for absolute lifetime).

## Later tree-ownership entities

### Family Tree (`family_trees`)
- `id` serial PK
- `ownerId` FK users (restrict delete), indexed
- `name` varchar(100)
- `createdAt`, `updatedAt`

### Changes to existing tables (later phase)

- `family_members`, `relationships`, `family_events` gain `treeId` integer NOT NULL FK `family_trees`
  (cascade delete), indexed.
- `relationships` unique index becomes (`treeId`, `fromMemberId`, `toMemberId`, `type`).
- `family_members` name and birth-date indexes are unchanged.

## Relationships

- Phase 2: User 1..N Credential and User 1..N Session.
- Later: User 1..N Family Tree; Family Tree 1..N Member, Relationship, Event.

## Invariants

- Later: Every tree has exactly one owner; every member, relationship, and event belongs to exactly one tree.
- A relationship's two members and every event member belong to the same tree as the relationship/event.
- A disabled user has no valid sessions and cannot sign in (account disabling is later operator tooling).
- Usernames are unique case-insensitively.
- A tree owner ID is never accepted from the client.

## State transitions

- User: `active` to `disabled` (operator tooling in a later phase) and back to `active`.
- Login attempt: five consecutive failures for a normalized username set `lockedUntil` to 15 minutes from
  now; a successful login or expired lock resets the counter.

## Validation (Zod, in `shared/`)

- `loginSchema`: `username` trimmed, 1..50 chars; `password` 12..256 chars.
- `createTreeSchema` / `renameTreeSchema`: `name` trimmed, 1..100 chars.
- CLI password rule: minimum 12 characters, no composition rules.

## Phase 2 migration outline

1. Add the user, credential, and login-attempt tables/indexes; do not modify family data.
2. Create/use `user_sessions` for the PostgreSQL session store.
3. Seed the default account at startup; never overwrite an existing password.
4. Later tree-ownership migration adds `family_trees`, backfills existing rows, adds tree FKs, and changes
   the relationship unique index. That migration is not part of Phase 2.
