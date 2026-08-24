# Phase 1 Data Model: Member Search and Filtering

This feature introduces **no new persistent entities** and no schema change. It operates over the
existing family member data.

## Client-side view models (transient)

### Search query
- `text`: trimmed, normalized query string.

### Filter set
- `living`: all | living | deceased.
- `birthFrom` / `birthTo`: optional year or date bounds.
- `location`: optional substring for birth/current location.

### Search result
- `memberId`, display name, and matched-field hints for presentation.

## Invariants

- Filtering never mutates member data.
- A member missing an attribute is only excluded from filters that require that attribute.
- Empty query with no filters returns the full set.
