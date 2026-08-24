# Phase 1 Data Model: Family History Q&A Assistant

The assistant reads existing family data; it introduces a retrieval index and does not modify
family records. Any new tables are additive.

## Derived/Indexed: Retrievable record

- `id`, `sourceKind` (member | relationship | event), `sourceId`, `groupId` (authorization scope),
  `isPrivate` (privacy tag), `content` (text used for retrieval), and optionally an embedding.
- Rebuilt/updated when family data changes.

## Transient: Question and answer

### Question
- `text`: the user's natural-language query.
- `askerScope`: the authorized group/role context used to filter retrieval.

### Grounded answer
- `text`: the generated answer.
- `sources`: list of `{ sourceKind, sourceId }` references that support the answer.
- `confidence`/`uncertaintyNote`: optional signal when records are incomplete/conflicting.

## Invariants

- Retrieval only returns records within the asker's authorized scope and excludes private data
  they cannot see.
- Every presented answer includes verifiable source references.
- If support is insufficient, the answer is an honest "not available", not a fabrication.
- The assistant never writes family data.

## Validation

- Zod validates the request (non-empty question) and the response shape (answer + sources).
