# Feature Specification: Core Family Tree Baseline and Enhancement Roadmap

**Feature Branch**: `001-core-family-tree`

**Created**: 2026-08-24

**Status**: Baseline documented; enhancements proposed

**Input**: User description: "Document the existing core family-tree functionality: family member CRUD, parent-child and spouse relationships, family events, interactive tree visualization, timeline view, PostgreSQL persistence, REST APIs, and responsive UI. Treat already implemented behavior as the baseline. Read from other files in the repo to identify the improvements required and add to the list. Also, identify new improvements and enhancements for this repo or a family tree functionality"

## Clarifications

### Session 2026-10-31

- Q: Which spec governs search scope (FR-012)? → A: Feature 002; see FR-012.
- Q: Who enforces parent-child cycle prevention (FR-010)? → A: The backend service layer (feature 009
  FR-006), with the UI (feature 007 FR-024) giving early feedback.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Family Members (Priority: P1)

As a family historian, I can add, view, edit, and remove people so the tree reflects
the family members I want to document.

**Why this priority**: People are the foundation for every relationship, event, and
visualization in the product.

**Independent Test**: Create a person with basic details, edit those details, reload
the application, and remove the person while confirming the displayed data changes.

**Acceptance Scenarios**:

1. **Given** the family tree is available, **When** a user submits a valid person,
   **Then** the person appears in the tree and remains after reload.
2. **Given** an existing person, **When** a user edits supported details,
   **Then** the updated values appear in the person card and detail forms.
3. **Given** an existing person with related data, **When** a user deletes the person,
   **Then** the person and its dependent relationships and events are removed.

### User Story 2 - Record Family Relationships and Events (Priority: P1)

As a family historian, I can connect people as parents, children, spouses, or other
supported relationship types and record meaningful family events.

**Why this priority**: Relationships and events turn a list of people into a usable
family history.

**Independent Test**: Create two or more people, connect them, add an event involving
them, and verify the relationship and event in both relevant views.

**Acceptance Scenarios**:

1. **Given** two existing people, **When** a user creates a valid parent-child or
   spouse relationship, **Then** the connection appears in the tree.
2. **Given** an existing relationship, **When** a user changes its dates, subtype,
   status, or notes, **Then** the updated relationship is shown consistently.
3. **Given** one or more existing people, **When** a user records a dated event,
   **Then** the event appears in the timeline with its people and location details.
4. **Given** invalid or missing relationship or event data, **When** a user submits
   the form, **Then** the request is rejected with an understandable error.

### User Story 3 - Explore the Family History Visually (Priority: P1)

As a family historian, I can explore the tree spatially or chronologically so I can
understand connections and history without reading raw records.

**Why this priority**: Visualization is the primary product experience and must make
the stored information understandable.

**Independent Test**: Load seeded or created family data, switch between tree and
timeline views, pan and zoom the tree, and use auto-alignment to arrange members.

**Acceptance Scenarios**:

1. **Given** stored members and relationships, **When** a user opens tree view,
   **Then** member cards and relationship lines are displayed together.
2. **Given** a tree larger than the viewport, **When** a user pans or zooms,
   **Then** the relevant tree area remains inspectable without changing the data.
3. **Given** members with dated life, relationship, or family events, **When** a user
   opens timeline view, **Then** events are ordered chronologically and identify the
   involved people.
4. **Given** members arranged inconsistently, **When** a user selects auto-align,
   **Then** the tree is arranged by family generation and the arrangement persists.

### User Story 4 - Use the Application Across Devices (Priority: P2)

As a desktop or mobile user, I can complete core family-history tasks with readable
content, usable controls, and clear loading and error feedback.

**Why this priority**: Family historians may document information from different
devices and need the core workflow to remain practical.

**Independent Test**: Complete the primary member and relationship flows at desktop
and mobile viewport sizes using keyboard navigation for form controls.

**Acceptance Scenarios**:

1. **Given** a narrow viewport, **When** a user opens the application,
   **Then** the navigation/sidebar can be opened and dismissed without obscuring the
   active workflow.
2. **Given** data is loading or an operation fails, **When** the state changes,
   **Then** the user sees a clear status or error message and can continue safely.
3. **Given** a user navigates with a keyboard, **When** they reach interactive controls,
   **Then** each control has a visible focus state and an understandable accessible
   name.

### Edge Cases

- A person may have an unknown last name, dates, location, occupation, or biography.
- A user may submit an empty required name, malformed email, invalid date, or invalid
  relationship/event identifier; the data MUST be rejected without partial writes.
- A person may participate in multiple parent-child, spouse, or event associations.
- A family graph may contain disconnected branches, multiple roots, or cycles caused
  by invalid relationship data; visualization and validation MUST handle these without
  crashing.
- A referenced person may be deleted while a stale client view still contains that
  person; the user MUST receive a recoverable error and refreshed data.
- A timeline event may have no date; it MUST remain available without being placed at
  a misleading date.
- A narrow viewport may not have enough room for the sidebar and canvas at once.

## Requirements *(mandatory)*

### Functional Requirements

#### Existing Baseline

- **FR-001**: The system MUST allow users to create, view, update, and delete family
  members with names, optional life details, biography, contact data, and visual
  position.
- **FR-002**: The system MUST persist family members and their changes across page
  reloads and server restarts using the existing PostgreSQL data store.
- **FR-003**: The system MUST expose REST operations for family-tree retrieval,
  member management, relationship management, event management, and member position
  updates.
- **FR-004**: The system MUST validate member, relationship, and event input before
  persistence and return a client-readable error for invalid input.
- **FR-005**: The system MUST support parent-child, spouse, adopted, and step-parent
  relationship records with applicable subtype, date, status, and notes data.
- **FR-006**: The system MUST support family events involving one or more members,
  with event type, date, place, description, and deletion capabilities.
- **FR-007**: The system MUST render persisted members and relationships in an
  interactive tree with selection, dragging, panning, zooming, relationship styling,
  and auto-alignment controls.
- **FR-008**: The system MUST provide a chronological timeline view combining member
  life events, recorded family events, and dated relationship events.
- **FR-009**: The system MUST provide responsive desktop and mobile layouts, including
  a mobile sidebar control and accessible form/dialog controls.

#### Required Improvements

- **FR-010**: The system MUST prevent self-referential and otherwise invalid family
  relationships through domain validation, not only input-shape validation.
- **FR-011**: The system MUST provide consistent error responses and user feedback for
  failed requests, missing records, validation failures, and persistence failures.
- **FR-012**: The system MUST provide member search and filtering by name, life dates,
  location, relationship, and event criteria as the dataset grows. Feature 002 is the
  authoritative spec for this: its first release covers name search plus living-status,
  birth-period, and location filters; relationship and event criteria are deferred.
- **FR-013**: The system MUST define explicit behavior for incomplete dates, unknown
  people, disconnected branches, duplicate relationships, and cyclic graphs.
- **FR-014**: The system MUST provide automated coverage for storage, shared validation,
  API contracts, relationship rules, event behavior, and critical responsive UI flows.

#### Future Enhancements

- **FR-015**: The system SHOULD import and export family data using GEDCOM while
  reporting unsupported fields and preserving source identifiers where possible.
- **FR-016**: The system SHOULD support photos, documents, audio, and video linked to
  members, events, or both, with metadata and safe access controls.
- **FR-017**: The system SHOULD support normalized locations with reusable place data,
  optional coordinates, and location-based discovery.
- **FR-018**: The system SHOULD support accounts, multiple family trees, invitations,
  viewer/editor permissions, and private-by-default access.
- **FR-019**: The system SHOULD record an audit history for data changes and provide
  undo or recovery for accidental edits and deletions.
- **FR-020**: The system SHOULD provide printable and shareable tree/timeline exports
  without exposing private data by default.
- **FR-021**: The system SHOULD support richer event types and many-to-many event
  participants instead of relying on a fixed event vocabulary.
- **FR-022**: The system SHOULD provide duplicate-person detection, merge assistance,
  and relationship consistency warnings.
- **FR-023**: The system SHOULD provide keyboard-first tree navigation and a textual
  or tabular alternative for users who cannot inspect the visual graph.
- **FR-024**: The system SHOULD support importable historical sources and citations so
  users can record where family facts came from.

### Key Entities *(include if feature involves data)*

- **Family member**: A person with identity, life details, biography, contact data,
  and a position in the visual tree.
- **Relationship**: A typed, directed connection between two family members with
  optional subtype, dates, status, and notes.
- **Family event**: A dated or undated occurrence involving one or more members,
  optionally described by place and narrative.
- **Family tree**: The complete set of members, relationships, events, and visual
  arrangements that a user explores as one family history.
- **Media item**: A future artifact attached to one or more members or events with
  descriptive metadata.
- **Location**: A future reusable place record that can be referenced by members or
  events.
- **Audit entry**: A future record of who changed which family-history data and when.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a member, connect that member to an existing person,
  and see the resulting relationship in under 3 minutes on a normal connection.
- **SC-002**: At least 95% of valid create, update, delete, and relationship workflows
  complete without data loss in automated acceptance coverage.
- **SC-003**: At least 95% of stored members and valid relationships appear in both the
  tree and the appropriate timeline or detail context after reload.
- **SC-004**: A family tree containing 100 members remains navigable, with panning,
  zooming, and view switching completing within 1 second for at least 95% of actions.
- **SC-005**: At least 90% of first-time users can complete the P1 member and
  relationship scenarios without assistance in usability testing.
- **SC-006**: All P1 workflows remain usable at supported mobile and desktop sizes,
  and keyboard users can reach every core action without a pointer.
- **SC-007**: Every proposed enhancement is represented by a separate prioritized
  specification and dependency-ordered task list before implementation begins.

## Assumptions

- The current application is a single-family-tree experience without authentication;
  access control is a future enhancement rather than a baseline requirement.
- PostgreSQL remains the source of truth for persisted baseline data, and the existing
  REST boundary remains the baseline integration contract.
- Users may enter incomplete historical information; unknown values are preferable to
  fabricated values and must remain distinguishable from known values.
- The existing React, Express, TypeScript, Drizzle ORM, Zod, and Vitest stack remains
  in place unless a later plan explicitly justifies a change.
- Search, GEDCOM, media, sharing, audit history, citations, and advanced graph
  validation are roadmap items and are not implied to be implemented by this baseline
  specification.
- The proposal documents in the repository are input to this roadmap; this
  specification is the authoritative prioritized record for future feature planning.

## Current Baseline Notes

The repository currently implements the baseline member, relationship, event, tree,
timeline, persistence, REST, and responsive UI flows described above. Existing
storage tests cover member, relationship, event, deletion, and persistence behavior.
The implementation also contains areas to verify during future planning, including
centralized error handling, domain-level relationship validation, complete keyboard
accessibility, and robust handling of unusual graph shapes.

## Enhancement Priorities

1. **P1**: Search and filtering; domain relationship validation; consistent errors;
   expanded API, storage, and UI coverage.
2. **P2**: GEDCOM import/export; normalized events and locations; duplicate detection;
   printable/shareable exports.
3. **P3**: Media and documents; authentication and sharing; audit history and recovery;
   citations and historical-source integrations.