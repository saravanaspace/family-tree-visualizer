# Phase 1 Data Model: Basic Authentication and Authorization

Defined in `shared/schema.ts` via Drizzle; migration in `migrations/0002_auth_and_trees.sql`.

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
- `failedAttempts` int default 0, `lockedUntil` timestamp nullable
- Unique (`type`, `identifier`); one `password` credential per user

### Family Tree (`family_trees`)
- `id` serial PK
- `ownerId` FK users (restrict delete), indexed
- `name` varchar(100)
- `createdAt`, `updatedAt`

### Login Attempt (`login_attempts`)
- `username` varchar(50) PK (normalized; includes unknown names)
- `failedCount` int, `lockedUntil` timestamp nullable, `updatedAt`
- Used so lockout behaves identically for unknown and known usernames.

### Session (`user_sessions`)
- Managed by the session store: `sid` PK, `sess` json, `expire` timestamp (indexed).
- The session payload holds `userId` and `createdAt` (for absolute lifetime). Sessions of a user are found
  by `sess->>'userId'` so disabling an account can delete them.

## Changes to existing tables

- `family_members`, `relationships`, `family_events` gain `treeId` integer NOT NULL FK `family_trees`
  (cascade delete), indexed.
- `relationships` unique index becomes (`treeId`, `fromMemberId`, `toMemberId`, `type`).
- `family_members` name and birth-date indexes are unchanged.

## Relationships

- User 1..N Credential; User 1..N Family Tree; Family Tree 1..N Member, Relationship, Event.

## Invariants

- Every tree has exactly one owner; every member, relationship, and event belongs to exactly one tree.
- A relationship's two members and every event member belong to the same tree as the relationship/event.
- A disabled user has no valid sessions and cannot sign in.
- Usernames are unique case-insensitively.
- A tree owner ID is never accepted from the client.

## State transitions

- User: `active` to `disabled` (CLI) and back to `active` (CLI).
- Credential lock: `failedAttempts` reaches 5, so `lockedUntil` is now plus 15 minutes; a success or an
  expired lock resets the counters.

## Validation (Zod, in `shared/`)

- `loginSchema`: `username` trimmed, 1..50 chars; `password` 1..256 chars.
- `createTreeSchema` / `renameTreeSchema`: `name` trimmed, 1..100 chars.
- CLI password rule: minimum 12 characters, no composition rules.

## Migration outline

1. Create new tables and enums.
2. Insert the default owner user and one tree named "Family Tree" (only if any family rows exist, or always
   create the owner).
3. Add `tree_id` nullable, backfill to that tree, set NOT NULL, add FKs and indexes.
4. Replace the relationships unique index.
5. Rollback: drop `tree_id` columns and new tables (data in family tables is retained).
