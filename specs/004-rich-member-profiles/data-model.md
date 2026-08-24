# Phase 1 Data Model: Rich Member Profiles

Extends the existing `family_members` and adds a `member_links` table via Drizzle. Migration adds
nullable columns and a new table (non-destructive).

## Extended: `family_members`

- Existing `photoUrl` reused for the member photo reference.
- Added metadata (nullable): `birthday` (or reuse `birthDate`), `currentLocation`, and a small
  set of additional biographical fields; unknown values remain null and distinguishable.

## New: `member_links`

- `id`, `memberId` (FK, cascade delete), `label`, `url` (validated/normalized), `isPrivate`
  (boolean), `createdAt`, `updatedAt`.

## New (optional): `member_media`

- If richer media beyond a single portrait is needed later, a `member_media` table can hold
  additional images/documents; out of scope unless required, noted for future feature 004+.

## Invariants

- An invalid image never changes existing profile data.
- Blank fields remain distinguishable from recorded values.
- Private links/details are excluded from public/shared views.
- URLs are validated and rendered safely.

## Validation

- Zod validates metadata fields, upload metadata (type/size), and link URLs.
