# Implementation Plan: Family History Q&A Assistant

**Branch**: `006-family-history-qa` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-family-history-qa/spec.md`

## Summary

Provide a read-only assistant that answers natural-language questions about the family strictly
from the user's authorized family data, with source attribution, honest "I don't know" handling,
and no private-data disclosure. Uses a retrieval-augmented approach: index members, relationships,
and events into retrievable, authorization-tagged records, retrieve relevant context per question,
and generate a grounded, cited answer. No family data is modified.

## Technical Context

**Language/Version**: TypeScript 5.6 (Express server; chat surface in the React client)

**Primary Dependencies**: Drizzle ORM, Zod, a retrieval index (keyword or vector), and a
generation model accessed via a provider abstraction (chosen in tasks)

**Storage**: PostgreSQL for source records and a retrieval index (table or vector store);
answers are not persisted beyond optional transient history

**Testing**: Vitest for grounding, attribution, refusal behavior, and authorization filtering with
a stubbed generator for determinism

**Target Platform**: Node server + browser chat UI

**Project Type**: Web application (`client/` + `server/` + `shared/`)

**Performance Goals**: Typical questions answered within a few seconds for supported dataset sizes

**Constraints**: Answers grounded only in authorized data; always cite sources; never fabricate;
never disclose private/unauthorized data; resist prompt-injection/manipulation; read-only

**Scale/Scope**: Hundreds of members/relationships/events per group

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Requirements and Traceability**: PASS — spec, plan, tasks.
- **II. Consistent Type-Safe Stack**: PASS — retrieval/index tables via Drizzle; Zod-validated
  request/response; the model provider is an abstraction with shared types.
- **III. Behavior-Driven Verification**: PASS — grounding, citation, refusal, and authorization
  are tested with a deterministic stubbed generator.
- **IV. Reliable Integration Boundaries**: PASS — retrieval↔generation↔authorization boundaries are
  integration-tested; the assistant performs no writes.
- **V. Accessible, Responsive, and Focused UX**: PASS — the chat surface is accessible and
  responsive; answers show sources.

Result: No violations. Safety (authorization, grounding, refusal) is tracked as explicit tasks.

## Project Structure

### Documentation (this feature)

```text
specs/006-family-history-qa/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── qa.md
```

### Source Code (repository root)

```text
shared/
└── schema.ts                 # optional retrieval index table + shared Q&A request/response types

server/
├── qa/
│   ├── index.ts              # NEW: build/update retrievable records from family data
│   ├── retrieve.ts           # NEW: authorization-scoped retrieval
│   ├── generate.ts           # NEW: grounded generation via provider abstraction
│   └── guardrails.ts         # NEW: refusal, scope, injection resistance
├── routes.ts                 # add POST /api/qa (read-only)
└── __tests__/                # grounding, citation, refusal, authorization tests

client/
└── src/components/family-qa.tsx   # NEW: question box + answer with sources
```

**Structure Decision**: A server `qa/` module handles indexing, authorization-scoped retrieval,
grounded generation, and guardrails; the client adds a chat surface that renders answers with
source references. Authorization scope reuses feature 003; without accounts, it operates over the
single owner's data.

## Complexity Tracking

> No violations. Retrieval/generation modules are intrinsic to the feature, not gratuitous
> abstraction.
