# Quickstart & Validation Guide: Family History Q&A Assistant

## Prerequisites

- PostgreSQL configured; app running.
- Model provider credentials supplied via environment variables (never committed).
- For deterministic tests, a stubbed generator is used.

## Setup

```powershell
npm run db:generate   # if an index table is added
npm run db:migrate
npm run dev
```

## Automated checks

```powershell
npm run check
npm test              # grounding, citation, refusal, and authorization tests (stubbed generator)
```

Coverage to expect:
- Questions answerable from data return correct, grounded answers with source references.
- Unanswerable questions return an honest "not available", not a fabrication.
- Private/unauthorized data is never used or revealed for an unauthorized asker.
- Out-of-scope or manipulative prompts are declined.

## Manual validation

1. Ask a question answerable from the data; confirm the answer and its source references.
2. Ask something not in the data; confirm an honest "I don't have that information".
3. As a limited-access user, ask about private data; confirm it is excluded and not revealed.

## Expected outcome

- All acceptance scenarios in [spec.md](spec.md) pass; security evaluation shows no disclosure.
