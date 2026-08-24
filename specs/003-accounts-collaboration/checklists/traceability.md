# Traceability & Coverage Checklist: Accounts and Collaborative Family Groups

**Purpose**: Validate that requirements (incl. security) flow completely into the plan and tasks.
**Created**: 2026-08-24
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Reviewer-owned requirements-quality artifact. `[x]` means the criterion is
satisfied for requirements quality, not that implementation is complete.

## Requirement-to-Task Traceability

- [ ] CHK001 Is every functional requirement (FR-001..FR-015) represented by at least one task? [Traceability, Coverage]
- [ ] CHK002 Does each user story (US1–US3) map to a dedicated task phase? [Consistency, Spec §User Scenarios]

## Acceptance & Success Criteria Coverage

- [ ] CHK003 Are acceptance scenarios covered by test tasks? [Coverage]
- [ ] CHK004 Are security success criteria (SC-002, SC-007) traceable to security test tasks? [Measurability, Traceability]

## Cross-Artifact Consistency

- [ ] CHK005 Are all auth/groups contract endpoints reflected in tasks? [Consistency, Contract]
- [ ] CHK006 Is the new data model (users, groups, memberships, invitations, shares) covered by setup/migration tasks? [Completeness, Data-model]

## Security Coverage

- [ ] CHK007 Are authorization enforcement and last-admin invariant covered by test tasks? [Security, Coverage]
- [ ] CHK008 Is account-enumeration resistance covered by a test task? [Security, Spec §FR-015]
- [ ] CHK009 Is privacy exclusion in public shares covered by a test task? [Security, Spec §FR-010, FR-011]

## Gaps & Scope

- [ ] CHK010 Is the first-owner data migration covered by a task? [Gap, Spec §FR-014]
- [ ] CHK011 Is any task not traceable to a requirement (scope creep)? [Conflict, Boundary]

## Dependencies

- [ ] CHK012 Are deferred decisions (SSO provider, email) surfaced as tasks or documented assumptions? [Assumption]

## Notes

- Mark items `[x]` only after review confirms the criterion. `/speckit-implement` reads state but must not modify markers.
