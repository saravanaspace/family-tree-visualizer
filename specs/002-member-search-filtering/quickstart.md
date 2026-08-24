# Quickstart & Validation Guide: Member Search and Filtering

## Prerequisites

- App running per the README with sample data seeded (`npx tsx server/seed.ts`).

## Automated checks

```powershell
npm run check
npm test        # search/filter unit tests (and optional endpoint tests)
```

Coverage to expect:
- Name matching is case/accent/whitespace-insensitive and partial.
- Filters (living status, birth period, location) narrow results; combined with search they AND.
- Members missing an attribute are excluded only from that filter.
- Empty/whitespace/unmatched queries yield the empty state, never an error.

## Manual validation

1. Type part of a name; confirm only matching people list; select one and confirm focus/navigation.
2. Apply a filter; confirm narrowing; add a second filter; confirm further narrowing; clear filters.
3. Combine a search term with a filter; confirm both apply; confirm the empty state for no matches.

## Expected outcome

- All acceptance scenarios in [spec.md](spec.md) pass; a person is locatable in a 100-member tree
  in under 15 seconds.
