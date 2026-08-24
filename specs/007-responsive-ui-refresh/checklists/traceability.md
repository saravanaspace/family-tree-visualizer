# Traceability & Coverage Checklist: Responsive UI Refresh

**Purpose**: Validate that requirements flow completely and consistently into the plan and tasks.
**Created**: 2026-08-24
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Reviewer-owned requirements-quality artifact. `[x]` means the criterion is
satisfied for requirements quality, not that implementation is complete.

## Requirement-to-Task Traceability

- [ ] CHK001 Is every functional requirement (FR-001..FR-018) represented by at least one task? [Traceability, Coverage]
- [ ] CHK002 Does each user story (US1–US4) map to a dedicated task phase? [Consistency, Spec §User Scenarios]

## Acceptance & Success Criteria Coverage

- [ ] CHK003 Are interaction/gesture acceptance scenarios covered by test tasks? [Coverage]
- [ ] CHK004 Are success criteria (SC-001..SC-008) traceable to verifying tasks? [Measurability, Traceability]

## Cross-Artifact Consistency

- [ ] CHK005 Are the UI contract items (layout, gestures, navigation, selection, a11y) reflected in tasks? [Consistency, Contract]
- [ ] CHK006 Are the new hooks/components (`use-canvas-gestures`, `use-canvas-viewport`, minimap, toolbar) each covered by tasks? [Completeness, Plan]

## Miro-Model & Clarification Coverage

- [ ] CHK007 Are input mappings, momentum, zoom-to-fit, and minimap each covered by tasks? [Coverage, Spec §FR-011..FR-014]
- [ ] CHK008 Is the clarified multi-select (group move only) reflected consistently in the toolbar task? [Consistency, Spec §Clarifications]

## Accessibility Coverage

- [ ] CHK009 Are keyboard navigation and jest-axe checks covered by test tasks? [Non-Functional, Spec §FR-006, FR-007]
- [ ] CHK010 Is reduced-motion handling covered by a task? [Non-Functional, Spec §FR-018]

## Gaps & Scope

- [ ] CHK011 Is any requirement left with no corresponding task, or any task without a requirement? [Gap, Boundary]
- [ ] CHK012 Are deferred items (breakpoint matrix, minimap threshold) surfaced for resolution during tasks? [Assumption]

## Notes

- Mark items `[x]` only after review confirms the criterion. `/speckit-implement` reads state but must not modify markers.
