# Traceability & Coverage Checklist: Family History Q&A Assistant

**Purpose**: Validate that requirements (incl. safety) flow completely into the plan and tasks.
**Created**: 2026-08-24
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Reviewer-owned requirements-quality artifact. `[x]` means the criterion is
satisfied for requirements quality, not that implementation is complete.

## Requirement-to-Task Traceability

- [ ] CHK001 Is every functional requirement (FR-001..FR-009) represented by at least one task? [Traceability, Coverage]
- [ ] CHK002 Does each user story (US1–US3) map to a dedicated task phase? [Consistency, Spec §User Scenarios]

## Acceptance & Success Criteria Coverage

- [ ] CHK003 Are grounding, citation, and honesty scenarios covered by test tasks? [Coverage]
- [ ] CHK004 Are success criteria (SC-001..SC-005, incl. 0 disclosure) traceable to tasks? [Measurability, Traceability]

## Cross-Artifact Consistency

- [ ] CHK005 Is the `POST /api/qa` contract reflected in tasks? [Consistency, Contract]
- [ ] CHK006 Are retrieval-index and provider-abstraction decisions reflected in tasks? [Consistency, Data-model]

## Safety Coverage

- [ ] CHK007 Is authorization-scoped retrieval (no disclosure) covered by a test task? [Security, Spec §FR-002, FR-006]
- [ ] CHK008 Are refusal and prompt-injection resistance covered by test tasks? [Security, Spec §FR-007]
- [ ] CHK009 Is the read-only constraint reflected in tasks (no write endpoints)? [Consistency, Spec §FR-009]

## Gaps & Scope

- [ ] CHK010 Is any requirement left with no corresponding task? [Gap]
- [ ] CHK011 Is any task not traceable to a requirement (scope creep)? [Conflict, Boundary]

## Dependencies

- [ ] CHK012 Are the model provider and index-type deferrals documented as assumptions? [Assumption]

## Notes

- Mark items `[x]` only after review confirms the criterion. `/speckit-implement` reads state but must not modify markers.
