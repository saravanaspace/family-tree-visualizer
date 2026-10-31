# Demo Mode Requirements Quality Checklist: Safety and Parity

**Purpose**: Validate that the safety (security) and Postgres-parity requirements for demo mode are complete, clear, and measurable before implementation
**Created**: 2026-10-31
**Feature**: [spec.md](../spec.md)

**Note**: Reviewer-owned. `[x]` means the reviewer judged the requirements-quality criterion satisfied, not that code is done. `/speckit-implement` reads checklist state but does not modify markers.

## Safety and Activation

- [ ] CHK001 - Is "dedicated start command" defined precisely enough to distinguish it from every other way to start the app? [Clarity, Spec §FR-001]
- [ ] CHK002 - Is "production environment" defined (which signal identifies it) for the refusal requirement? [Ambiguity, Spec §FR-009]
- [ ] CHK003 - Are the required contents and visibility of the startup demo-mode message specified (what it must state, where it appears)? [Completeness, Spec §FR-008]
- [ ] CHK004 - Is it specified what "refuse to start" means for exit status and output, not just that it refuses? [Clarity, Spec §FR-009]
- [ ] CHK005 - Are trust boundaries and abuse cases for the reset endpoint documented (who may call, from where, behind a proxy)? [Gap, Spec §FR-010]
- [ ] CHK006 - Is "requests from the local machine" defined unambiguously, including IPv6 and proxied requests? [Ambiguity, Spec §FR-010]
- [ ] CHK007 - Is the response for disallowed reset callers specified consistently between the spec and the contract? [Consistency, Spec §FR-010, Contract §3]
- [ ] CHK008 - Is it stated that the sample dataset contains no real personal data? [Gap, Assumption]

## Parity with Database Behavior

- [ ] CHK009 - Is "equivalent behavior" measurable, i.e. is the list of operations and error cases that must match enumerated? [Measurability, Spec §FR-003]
- [ ] CHK010 - Are the exact constraints to mirror listed (duplicate relationship key, missing member references, event non-validation)? [Completeness, Spec §FR-014]
- [ ] CHK011 - Is the requirement for identical error messages and status codes specific enough to test? [Clarity, Spec §FR-003, §FR-014]
- [ ] CHK012 - Are id assignment rules (uniqueness, never reused, behavior after reset) stated as requirements rather than only in the plan and data model? [Gap, Spec Edge Cases]
- [ ] CHK013 - Are date-field handling requirements specified consistently with how the UI expects them? [Consistency, Spec Edge Cases]
- [ ] CHK014 - Does the spec define what happens when the unique-relationship rule and a reset interact with ids already handed to the UI? [Gap]

## Scenario Coverage

- [ ] CHK015 - Are concurrent clients (multiple browser tabs) requirements stated beyond "share the same data"? [Coverage, Spec Edge Cases]
- [ ] CHK016 - Are recovery requirements defined for a failed or partial reset? [Gap, Recovery]
- [ ] CHK017 - Is the scenario where a database URL is also configured specified as a requirement, not only an edge case? [Coverage, Spec Edge Cases]
- [ ] CHK018 - Is the expected behavior of an open UI session after reset (stale selections, cached data) specified? [Gap, Spec §FR-010]

## Acceptance Criteria Quality

- [ ] CHK019 - Can "readable on first load" and "no overlapping cards" be objectively measured? [Measurability, Spec §FR-005, US1]
- [ ] CHK020 - Is "within 1 minute" in the first success criterion scoped to what is timed (start command to first render)? [Clarity, Spec §SC-001]
- [ ] CHK021 - Is "100% of existing flows" enumerated so completeness of coverage can be checked? [Measurability, Spec §SC-002]
- [ ] CHK022 - Is "first attempt by a new contributor" defined with a method for evaluating it? [Measurability, Spec §SC-005]
- [ ] CHK023 - Do the test requirements say what "skips itself" means and who is informed when the database half is skipped? [Clarity, Spec §FR-013]

## Dependencies and Assumptions

- [ ] CHK024 - Is the dependency on the future authentication and tree-scoped data feature (015) documented in the spec, not only the plan? [Dependency, Gap]
- [ ] CHK025 - Is the assumption that the "existing seed" informs the sample dataset reconciled with the stated size (about 8 members) and the added deceased member? [Consistency, Spec §FR-004, Assumptions]
