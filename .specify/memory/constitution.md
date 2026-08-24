<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles: added Principle VI (Security by Design / Shift-Left)
- Added sections: none (new principle within Core Principles)
- Removed sections: none
- Affected downstream artifacts: 008 (CI security gates), 011 (security-event logging),
  012 (secret/config handling), 003 (authentication/authorization) — review for alignment
- Follow-up TODOs: confirm the original ratification date
-->

# Family Tree Visualizer Constitution

## Core Principles

### I. Requirements and Traceability
Every feature MUST begin with a `spec.md` that states user needs, scope, acceptance
criteria, and non-goals. A corresponding `plan.md` MUST describe the implementation
approach, and `tasks.md` MUST list dependency-ordered work. Each task MUST be marked
complete only after implementation and validation are finished. This keeps decisions,
implementation, and delivered behavior auditable.

### II. Consistent Type-Safe Stack
Application changes MUST use TypeScript and preserve the established React, Express,
PostgreSQL, Drizzle ORM, and Zod architecture. Shared data contracts MUST be defined
in `shared/` when used by both client and server. API input MUST be validated at the
boundary with Zod, and database changes MUST include the appropriate Drizzle schema
and migration updates. This prevents contract drift and protects persisted family data.

### III. Behavior-Driven Verification
Every requirement MUST have testable acceptance criteria. New or changed server,
storage, schema, and shared validation behavior MUST include or update Vitest tests.
Tests MUST cover success paths, validation failures, and relevant relationship or
persistence edge cases. The test suite and TypeScript check MUST pass before a task is
marked complete. Verification makes completed work distinguishable from planned work.

### IV. Reliable Integration Boundaries
Changes crossing client, API, storage, database, or shared-schema boundaries MUST be
validated with an integration test or an explicitly documented reason why a focused
unit test is sufficient. Relationship mutations MUST preserve valid family-member
references and enforce applicable domain constraints. This protects the application
from failures that isolated component tests cannot detect.

### V. Accessible, Responsive, and Focused UX
User-facing features MUST work on supported desktop and mobile layouts, use semantic
controls and accessible labels, and preserve keyboard and screen-reader access.
Interactive visualizations MUST provide usable controls and clear empty, loading, and
error states. A feature MUST avoid unrelated abstraction or visual redesign unless
required by its specification. This keeps the family-history workflow usable and the
codebase maintainable.

### VI. Security by Design (Shift-Left)
Every feature MUST consider security from specification onward, not as a later gate.
Specifications that introduce user data, authentication, authorization, or external
input MUST document trust boundaries, sensitive data, and relevant abuse cases, and
MUST address the applicable OWASP Top 10 risks. All external input MUST be validated at
the boundary with Zod and, where rendered, output-encoded; every state-changing
operation MUST enforce authentication and authorization. Secrets and credentials MUST
never be committed to source or written to logs, and dependencies, secrets, and build
artifacts MUST be scanned in the automated pipeline with known high-severity issues
resolved or explicitly accepted before merge. Building security in from the start keeps
family data private and the application trustworthy.

## Technical Constraints

The project MUST retain the existing React and TypeScript client, Express server,
PostgreSQL persistence, Drizzle ORM, Zod validation, and Vitest test tooling unless a
feature specification explicitly approves a replacement. Database migrations MUST be
reviewed for destructive changes. Family-member data MUST not be logged with secrets
or credentials, and environment-specific configuration MUST remain outside committed
source files.

## Development Workflow

Spec Kit artifacts are the planning record for feature work. Before implementation,
the active feature MUST contain `spec.md`, `plan.md`, and `tasks.md`. During work,
completed tasks MUST be checked in `tasks.md`; deferred work MUST remain unchecked and
be captured in the feature spec or backlog. A feature is complete only when its
acceptance criteria are met, relevant tests pass, `npm run check` passes, and the
artifacts accurately describe the delivered behavior. Reviews MUST check the
constitution, requirements traceability, tests, and completed-task status.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution is the governing standard for project planning and delivery. Any
developer may propose an amendment by updating this file and its Sync Impact Report.
Amendments MUST state the rationale, update the version, and identify affected
specifications or tasks. Versioning follows semantic rules: MAJOR for incompatible
governance changes or removed principles, MINOR for new or materially expanded
principles or sections, and PATCH for clarifications that do not change obligations.
Every feature review MUST check compliance with this constitution. Non-compliance MUST
be corrected or documented as an accepted exception in the relevant plan before the
work is marked complete.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date is unknown | **Last Amended**: 2026-08-24
