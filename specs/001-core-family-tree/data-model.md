# Phase 1 Data Model: Core Family Tree

The baseline data model exists in `shared/schema.ts`. This feature adds domain rules and does
not change the persisted shape (no destructive migration).

## Entities (existing)

### Family member (`family_members`)
- Identity: `id`; name fields (`firstName` required, `middleName`, `lastName`).
- Life details: `gender`, `birthDate`, `birthPlace`, `deathDate`, `deathPlace`, `occupation`,
  `biography`, `photoUrl`, `isLiving`, `email`.
- Visual: `x`, `y`. Timestamps: `createdAt`, `updatedAt`.

### Relationship (`relationships`)
- `fromMemberId`, `toMemberId` (FK to members, cascade delete), `type`
  (parent-child | spouse | adopted | step-parent), `subType`, `startDate`, `endDate`,
  `status`, `notes`.
- Unique index on (`fromMemberId`, `toMemberId`, `type`).

### Family event (`family_events`)
- `type`, `date`, `place`, `description`, `memberIds` (int array, min 1).

## Domain Rules (added by this feature)

- A relationship MUST NOT have `fromMemberId == toMemberId` (no self-relationship).
- Duplicate equivalent relationships MUST be rejected (already indexed; surfaced as a clear
  error rather than a raw DB error).
- Referenced members in relationships and events MUST exist.
- Deleting a member MUST remove its relationships and remove it from events (existing behavior;
  now covered by tests).
- Events without a date remain valid and are excluded from date-ordered placement.

## Validation Surfaces

- Zod schemas in `shared/schema.ts` remain the shape source of truth.
- Domain invariants are enforced in `server/storage.ts` (or a thin service) before writes.
