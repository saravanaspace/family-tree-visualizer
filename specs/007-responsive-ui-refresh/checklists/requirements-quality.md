# Requirements Quality Checklist: Responsive UI Refresh

**Purpose**: Validate the quality (completeness, clarity, consistency, measurability, coverage)
of the requirements and their alignment with the plan and UI contract before implementation.
**Created**: 2026-08-24
**Feature**: [spec.md](../spec.md)

**Review Ownership**: This is a reviewer-owned requirements-quality review artifact. Mark an item
`[x]` only when the reviewer determines the requirements-quality criterion is satisfied.
**Marker Semantics**: `[x]` means the criterion has been reviewed and satisfied for requirements
quality. It does not mean implementation work is complete.

## Requirement Completeness

- [ ] CHK001 Are responsive layout requirements defined for every core surface (tree, timeline, member management, dialogs, controls)? [Completeness, Spec §FR-001..FR-003]
- [ ] CHK002 Are touch, pointer, and keyboard input requirements each specified for the canvas and cards? [Completeness, Spec §FR-004, FR-006, FR-011, FR-012]
- [ ] CHK003 Are minimap requirements defined, including when it appears and how it degrades on small screens? [Completeness, Spec §FR-014, Edge Cases]
- [ ] CHK004 Are zoom-control requirements (percentage, in/out, reset, fit-all, fit-selection) fully enumerated? [Completeness, Spec §FR-013]
- [ ] CHK005 Are persistence requirements defined for positions after both single and group moves? [Completeness, Spec §FR-015]
- [ ] CHK006 Are accessibility requirements (focus, names/states, contrast, target size, reduced motion) specified for all refreshed surfaces? [Completeness, Spec §FR-006..FR-009, FR-018]

## Requirement Clarity

- [ ] CHK007 Is "fluid"/"smooth" pan and zoom quantified with a measurable target such as frame rate? [Clarity, Spec §FR-011, SC-010]
- [ ] CHK008 Is "supported sizes" defined with explicit breakpoints or device ranges? [Ambiguity, Spec §FR-001, Assumptions]
- [ ] CHK009 Is the minimap visibility threshold ("larger screens") quantified? [Ambiguity, Spec §FR-014]
- [ ] CHK010 Are the exact input mappings (scroll, Ctrl/Cmd+scroll, pinch, space/middle-drag) unambiguously specified? [Clarity, Spec §FR-012]
- [ ] CHK011 Is the ">=44px" target-size rule scoped to the conditions under which it applies (touch input mode)? [Clarity, Spec §FR-005, Contract §C-G5]
- [ ] CHK012 Is momentum specified as required or optional, with clear reduced-motion behavior? [Clarity, Spec §FR-011, FR-018]

## Requirement Consistency

- [ ] CHK013 Are multi-select semantics consistent between the spec (FR-015/FR-016), the clarification, and the contract (C-S3/C-S4)? [Consistency, Spec §Clarifications]
- [ ] CHK014 Do the plan's components and hooks map to every interaction requirement with no gaps or unexplained extras? [Consistency, Plan §Project Structure]
- [ ] CHK015 Are zoom bound and focal-point behaviors consistent between the spec (FR-017) and the contract (C-G6, C-N3)? [Consistency]
- [ ] CHK016 Is terminology ("whiteboard", "canvas", "minimap", "contextual toolbar") used consistently across spec, plan, and contract? [Consistency]

## Acceptance Criteria Quality

- [ ] CHK017 Are all success criteria measurable and technology-agnostic? [Measurability, Spec §SC-001..SC-008]
- [ ] CHK018 Can "navigable" and "orient" be objectively verified through the stated fit and minimap criteria? [Measurability, Spec §SC-006]
- [ ] CHK019 Are acceptance thresholds for input mappings testable across mouse, trackpad, and touch? [Acceptance Criteria, Spec §SC-008]

## Scenario Coverage

- [ ] CHK020 Are primary, alternate, and exception flows for pan/zoom/select each addressed by requirements? [Coverage, Spec §User Story 4]
- [ ] CHK021 Are keyboard-only requirements complete for reaching and operating the contextual toolbar? [Coverage, Spec §FR-016, Contract §C-S4]
- [ ] CHK022 Are requirements defined for orientation change preserving the current view and selection? [Coverage, Spec §Edge Cases, Contract §C-L3]

## Edge Case Coverage

- [ ] CHK023 Are zoom-to-fit requirements defined for empty and single-member trees? [Edge Case, Spec §FR-017, Edge Cases]
- [ ] CHK024 Is behavior specified for an empty marquee selection? [Edge Case, Spec §Edge Cases, Contract §C-S2]
- [ ] CHK025 Are requirements defined for long or overflowing names, dates, and locations? [Edge Case, Spec §FR-010, Contract §C-L4]
- [ ] CHK026 Are requirements defined to prevent canvas gestures from hijacking normal page scrolling? [Edge Case, Contract §C-G3]

## Non-Functional Requirements

- [ ] CHK027 Are performance requirements bounded to a stated dataset size and device class? [Non-Functional, Spec §SC-010, Plan §Performance Goals]
- [ ] CHK028 Is reduced-motion handling specified for every animated interaction (momentum, animated fit)? [Non-Functional, Spec §FR-018]
- [ ] CHK029 Are accessibility standards named (e.g., WCAG 2.1 AA) and applied consistently? [Non-Functional, Contract §C-A4]

## Dependencies & Assumptions

- [ ] CHK030 Are added test-tooling dependencies (jsdom, Testing Library, jest-axe) documented as assumptions rather than leaking into product requirements? [Assumption, Plan §Technical Context]
- [ ] CHK031 Is the assumption that no schema or API change is needed (reusing the position endpoint) validated for group move? [Assumption, Spec §FR-015, Data-model]
- [ ] CHK032 Are non-goals (multiplayer, cursors, comments, sticky notes, drawing, boards) explicitly bounded to prevent scope creep? [Boundary, Spec §Assumptions]

## Ambiguities & Conflicts

- [ ] CHK033 Are the deferred items (breakpoint/device matrix, minimap threshold) tracked so they are resolved before implementation? [Ambiguity, Spec §Assumptions]
- [ ] CHK034 Is any tension between "scroll to pan" and prior wheel-to-zoom expectations reconciled explicitly? [Conflict, Spec §FR-012, Contract §C-G2]

## Notes

- Mark items `[x]` only after review confirms the requirement-quality criterion is satisfied.
- Leave items unchecked when they still require clarification, correction, or reviewer evaluation.
- `/speckit-implement` reads checklist checkbox state as a gate and must not modify markers.
- `checklists/requirements.md` has a separate built-in lifecycle maintained by `/speckit-specify`
  and `/speckit-clarify`; this custom checklist is independent.
- Items are numbered sequentially (CHK001+) for easy reference.
