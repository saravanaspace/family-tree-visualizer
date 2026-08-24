# Quickstart & Validation Guide: Core Family Tree

## Prerequisites

- PostgreSQL configured per the README; `DATABASE_URL` set.
- Dependencies installed (`npm install`).

## Run

```powershell
npm run db:push      # sync schema
npx tsx server/seed.ts   # optional sample data
npm run dev          # start app
```

## Automated checks

```powershell
npm run check        # TypeScript must pass (existing errors fixed by this feature)
npm test             # Vitest storage + API + edge-case tests must pass
```

Coverage to expect after this feature:
- Relationship domain rules: self-relationship rejected; duplicate equivalent rejected.
- Reference integrity: relationship/event with missing member returns a clear error.
- Deletion: member deletion removes relationships and event membership.
- Edge cases: disconnected branches, multiple roots, cycles, and undated events render/compute
  without error.
- Errors: endpoints return the consistent error shape and correct status codes.

## Manual validation

1. Create members, connect them, add an event; confirm all appear in tree and timeline.
2. Attempt an invalid relationship (self-link, duplicate); confirm a clear error.
3. Delete a member; confirm dependent relationships and event membership are removed.
4. Reload; confirm persistence.

## Expected outcome

- All acceptance scenarios in [spec.md](spec.md) for the baseline and required improvements pass.
- `npm run check` and `npm test` are green.
