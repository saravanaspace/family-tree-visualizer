# Q&A API Contract: Family History Q&A Assistant

Base path `/api`. The endpoint requires an authenticated user (feature 003) or operates over the
single owner's data without accounts. Read-only. Standard error shape applies.

## Ask

| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| POST | `/api/qa` | Ask a question about the family | 200 | 400, 401 |

Request:

```json
{ "question": "string" }
```

Response:

```json
{
  "answer": "string",
  "sources": [ { "sourceKind": "member|relationship|event", "sourceId": 123 } ],
  "uncertainty": "optional note when records are incomplete or conflicting"
}
```

Guarantees:
- The answer is grounded only in records within the caller's authorized scope; private data the
  caller cannot see is never used or revealed.
- Every answer includes `sources` referencing the records used.
- When support is insufficient, `answer` states the information is not available (no fabrication).
- Out-of-scope or manipulative requests are declined.
- Empty question returns `400 validation_error`; unauthenticated (when accounts enabled) returns
  `401`.

## Non-changes

- No write endpoints; the assistant never modifies family data.
