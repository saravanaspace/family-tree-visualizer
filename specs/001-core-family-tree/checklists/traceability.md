# Traceability & Coverage Checklist: Core Family Tree

**Purpose**: Validate that requirements flow completely and consistently into the plan and tasks.
**Created**: 2026-08-24
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Reviewer-owned requirements-quality artifact. `[x]` means the criterion is
satisfied for requirements quality, not that implementation is complete.

## Requirement-to-Task Traceability

- [ ] CHK001 Is every functional requirement (FR-001..FR-014) represented by at least one task? [Traceability, Coverage]
- [ ] CHK002 Does each P1 user story map to a dedicated task phase? [Consistency, Spec §User Scenarios]
- [ ] CHK003 Are the required improvements (validation, errors, edge cases) individually traceable to tasks? [Coverage, Spec §FR-010, FR-011, FR-013]

## Acceptance & Success Criteria Coverage

- [ ] CHK004 Are acceptance scenarios covered by test tasks? [Coverage]
- [ ] CHK005 Are all success criteria (SC-001..SC-007) traceable to a verifying task? [Measurability, Traceability]

## Cross-Artifact Consistency

- [ ] CHK006 Are the REST contract endpoints reflected consistently in tasks? [Consistency, Contract]
- [ ] CHK007 Are data-model domain rules covered by validation/test tasks? [Consistency, Data-model]

## Gaps & Scope

- [ ] CHK008 Is any requirement left with no corresponding task? [Gap]
- [ ] CHK009 Is any task not traceable to a requirement (scope creep)? [Conflict, Boundary]
- [ ] CHK010 Are edge cases (cycles, undated events, stale refs) represented in tasks/tests? [Edge Case, Coverage]

## Non-Functional & Dependencies

- [ ] CHK011 Is the type-check gate (fixing existing errors) covered by a task? [Non-Functional, Assumption]
- [ ] CHK012 Is the story completion order documented consistently between plan and tasks? [Consistency]

## Notes

- Mark items `[x]` only after review confirms the criterion. `/speckit-implement` reads state but must not modify markers.
