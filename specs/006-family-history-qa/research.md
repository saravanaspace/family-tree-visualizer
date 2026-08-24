# Phase 0 Research: Family History Q&A Assistant

## Knowledge Source

- Members, relationships, and events are the answerable facts. Each retrievable record carries an
  authorization tag (group and privacy) so retrieval can exclude unauthorized/private data.

## Decision: Retrieval-augmented answering

- **Decision**: Index family records into retrievable chunks, retrieve the most relevant per
  question, and generate an answer grounded strictly in the retrieved records with citations.
- **Rationale**: FR-001, FR-003; grounding + attribution is the core requirement.
- **Alternatives considered**: free generation without retrieval (hallucination risk, no grounding).

## Decision: Authorization-scoped retrieval

- **Decision**: Retrieval filters by the asking user's authorized scope and excludes private data;
  the generator only ever sees authorized context.
- **Rationale**: FR-002, FR-006; SC-003 (no disclosure). Enforced before generation, not after.
- **Alternatives considered**: post-hoc answer filtering (leak-prone).

## Decision: Honesty and uncertainty

- **Decision**: When retrieval yields insufficient support, the assistant states it does not have
  the information; when records conflict, it communicates uncertainty instead of inventing a
  resolution.
- **Rationale**: FR-004, FR-005; SC-004.

## Decision: Scope and injection resistance

- **Decision**: Guardrails keep answers within the family-data domain and resist attempts to
  bypass authorization or scope.
- **Rationale**: FR-007; edge cases; SC-003.

## Decision: Provider abstraction and index choice

- **Decision**: Access the generation model through a provider interface; start with a keyword/
  lexical retrieval index and allow a vector index later. Both chosen concretely in tasks.
- **Rationale**: Keeps the model/index swappable and testable; a stubbed generator enables
  deterministic tests.
- **Alternatives considered**: hard-coding a specific vendor/model (reduces testability/portability).

## Decision: Read-only

- **Decision**: The assistant never writes family data.
- **Rationale**: FR-009.

## Open Items

- Concrete model provider, index type (lexical vs. vector), and hosting confirmed in tasks;
  privacy/authorization depend on feature 003.
