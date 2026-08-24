# Search Contract: Member Search and Filtering

The default implementation is client-side and exposes a hook contract; an optional server
endpoint mirrors the same semantics for scale.

## Client hook contract: `useMemberSearch`

Input:
- `members`: the loaded family members.
- `query`: normalized text.
- `filters`: { living, birthFrom, birthTo, location }.

Output:
- `results`: members matching the query AND all active filters, in stable order.
- `isEmpty`: true when there are no matches (drives the empty state).

Guarantees:
- Case-, accent-, and whitespace-insensitive name matching.
- Combined search + filters narrow results (logical AND).
- Missing attributes exclude a member only from the dependent filter.

## Optional server contract

| Method | Path | Query | Success | Errors |
|--------|------|-------|---------|--------|
| GET | `/api/search` | `q`, `living`, `birthFrom`, `birthTo`, `location` | 200 `{ results: Member[] }` | 400 |

- `q` shorter than the minimum returns `400 validation_error`.
- Semantics match the client hook exactly so the UI can switch sources without behavior change.
