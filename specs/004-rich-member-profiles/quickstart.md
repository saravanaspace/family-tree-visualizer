# Quickstart & Validation Guide: Rich Member Profiles

## Prerequisites

- PostgreSQL configured; app running per the README.
- Image store configured (final choice per tasks).

## Setup

```powershell
npm run db:generate
npm run db:migrate    # adds metadata columns + member_links table
npm run dev
```

## Automated checks

```powershell
npm run check
npm test              # image validation, metadata/link validation, privacy exclusion
```

Coverage to expect:
- Valid image uploads set `photoUrl`; invalid/oversized files are rejected without data loss.
- Metadata saves and reloads correctly; blank fields stay distinguishable from recorded values.
- Links validate URLs and render safely; private links are excluded from public views.

## Manual validation

1. Add a photo to a member; confirm it shows on the card and profile; replace and remove it.
2. Record birthday and current location plus other fields; leave some blank; reload and verify.
3. Add a valid and an invalid social link; confirm the invalid one is rejected; mark one private
   and confirm it is absent from any public view.

## Expected outcome

- All acceptance scenarios in [spec.md](spec.md) pass; no invalid input corrupts existing data.
