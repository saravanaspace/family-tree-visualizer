# Implementation Plan: Rich Member Profiles

**Branch**: `004-rich-member-profiles` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-rich-member-profiles/spec.md`

## Summary

Extend the existing family member with a photo, additional biographical metadata (birthday,
current location, and more), and validated social/contact links, with privacy controls that keep
sensitive details out of public views. This adds fields to the member model, an image
upload/serve path, and profile UI. It builds on the member schema and reuses the privacy model
from feature 003 when present.

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18 client, Express server)

**Primary Dependencies**: Drizzle ORM, Zod, TanStack Query, Express; an image handling approach
(validated upload + stored reference)

**Storage**: PostgreSQL for metadata/links; image bytes stored via a file/object path referenced
by URL (final store chosen in tasks)

**Testing**: Vitest for schema validation, upload validation, and profile persistence

**Target Platform**: Evergreen browsers + Node server

**Project Type**: Web application (`client/` + `server/` + `shared/`)

**Performance Goals**: Add a photo and see it on card/profile within 1 minute; profiles load
without noticeable delay

**Constraints**: Validate image type/size; validate/sanitize links; private details excluded from
public/shared views; migrations reviewed

**Scale/Scope**: Hundreds of members, each with one photo, metadata, and a few links

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — spec, plan, tasks.
- **II. Consistent Type-Safe Stack**: PASS — extends `shared/schema.ts`; Zod validates new fields,
  uploads, and links; Drizzle migration for new columns/tables.
- **III. Behavior-Driven Verification**: PASS — image validation, metadata validation, link
  sanitization, and privacy exclusion are tested.
- **IV. Reliable Integration Boundaries**: PASS — upload/serve and member update boundaries are
  integration-tested.
- **V. Accessible, Responsive, and Focused UX**: PASS — profile UI is accessible and responsive;
  photos have alt text and placeholders.

Result: No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-rich-member-profiles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── member-media.md
```

### Source Code (repository root)

```text
shared/
└── schema.ts                 # add metadata fields; add member_links table; media reference

server/
├── routes.ts                 # add photo upload/serve + link endpoints; extend member update
├── storage.ts                # persist metadata, links, media references
└── __tests__/                # upload validation, metadata/link validation, privacy exclusion

client/
└── src/
    ├── components/
    │   ├── member-profile.tsx       # NEW/expanded: photo, metadata, links display
    │   ├── member-photo-upload.tsx  # NEW: validated image upload
    │   └── edit-member-modal.tsx    # extend with metadata + links fields
    └── ...
```

**Structure Decision**: Extend the existing member model and edit flow. Photos use a validated
upload endpoint returning a stored reference (`photoUrl` already exists on the member); links are
a small related table. Privacy exclusion reuses feature 003's mechanism where available.

## Complexity Tracking

> No violations; no justifications required.
