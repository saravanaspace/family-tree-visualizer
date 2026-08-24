# Phase 0 Research: Rich Member Profiles

## Existing Assets

- `family_members` already has `photoUrl`, `biography`, `birthDate`, `birthPlace`, `email`, and
  more; the member card already renders an avatar from `photoUrl`. This feature adds structured
  metadata, uploads, and links on top.

## Decision: Image upload with validation and a stored reference

- **Decision**: Accept image uploads through a dedicated endpoint that validates type and size,
  stores the file, and sets the member's `photoUrl`; reject invalid files without partial changes.
- **Rationale**: FR-001, FR-002; reuses the existing `photoUrl` field for display.
- **Alternatives considered**: base64 in the DB (bloats rows, poor caching); external-URL only
  (no user upload). The concrete store (local disk vs. object storage) is finalized in tasks.

## Decision: Structured metadata fields

- **Decision**: Add typed fields (e.g., birthday, current location, plus a small extensible set)
  validated by Zod; keep unknown values distinguishable from recorded values.
- **Rationale**: FR-004, FR-005, FR-006.
- **Alternatives considered**: a free-form JSON blob only (weak validation, poor querying).

## Decision: Social/contact links table

- **Decision**: Store links in a `member_links` table with label, URL (validated/normalized), and
  a privacy flag; render safely.
- **Rationale**: FR-007, FR-008; links are multi-valued and benefit from their own table.
- **Alternatives considered**: comma-separated string (no validation, brittle).

## Decision: Privacy exclusion

- **Decision**: Contact/social details can be marked private and are excluded from public/shared
  views, aligning with feature 003's privacy designation; without 003, private fields are simply
  hidden from any public render.
- **Rationale**: FR-009.

## Decision: Accessibility of media

- **Decision**: Photos always have alt text and a consistent placeholder when absent.
- **Rationale**: FR-003 and the UX principle.

## Open Items

- Final image store and size/type limits confirmed in tasks; exact metadata field set can grow.
