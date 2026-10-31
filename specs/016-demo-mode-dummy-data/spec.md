# Feature Specification: Demo Mode with Dummy Data

**Feature Branch**: `016-demo-mode-dummy-data`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "I need a dummy or in-memory data for demo local testing. For staging, I can use Postgres. For quick local testing, I want some dummy data so I can settle the UI components, family tree setup etc. and test them locally before connecting to a database."

## Clarifications

### Session 2026-10-31

- Q: How should a developer trigger "reset demo data" while the app is running? → A: A developer-only HTTP endpoint (no UI control).
- Q: How is demo mode started? → A: A dedicated start command only (no separate config option).
- Q: Which sample dataset does demo mode load? → A: A small dataset (~8 members, 3 generations, like the existing seed).
- Q: Who may call the reset endpoint? → A: Only requests from the local machine; the endpoint does not exist outside demo mode.
- Q: Refuse demo mode when the environment is already production? → A: Yes, refuse with a clear error.
- Q: How is parity with Postgres verified? → A: One shared test suite runs against both storages; the Postgres half skips itself when no test database is configured.
- Q: Should demo mode enforce Postgres constraints (duplicate relationships, relationships referencing missing members)? → A: Yes, same rules and same errors.
- Q: Is an in-app "demo data" banner in scope? → A: No; startup message only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run the app locally with sample family data and no database (Priority: P1)

A developer starts the application in a "demo mode" with a single, documented action. No database needs to be installed, configured, or running. The family tree appears pre-populated with a realistic sample family (several generations, spouses, parent-child links, living and deceased members, and life events), so the visual tree, timeline, and sidebar can be reviewed immediately.

**Why this priority**: This is the core need — to iterate on UI and tree layout without database setup.

**Independent Test**: Start the app in demo mode on a machine with no database; open the app and confirm the sample family tree and timeline are displayed.

**Acceptance Scenarios**:

1. **Given** no database is available or configured, **When** the developer starts the app in demo mode, **Then** the app starts successfully and shows the sample family tree.
2. **Given** demo mode is running, **When** the developer opens the timeline, **Then** the sample events (births, marriages, graduation, etc.) are listed in the correct date order.
3. **Given** demo mode is running, **When** the developer views the tree, **Then** members are laid out at sensible positions with relationship lines visible and no overlapping cards.

---

### User Story 2 - Edit freely during a session without persistence (Priority: P1)

While in demo mode, the developer can add, edit, move, connect, and delete members, relationships, and events, exactly as in normal mode. Changes are visible immediately and for the remainder of the session, but are discarded when the app is stopped. The next start returns to the original sample data.

**Why this priority**: Settling UI components requires exercising every create/edit/delete flow, not just viewing.

**Independent Test**: Add a member, move another, delete a third, confirm the changes appear; restart in demo mode and confirm the original sample data is back.

**Acceptance Scenarios**:

1. **Given** demo mode is running, **When** the developer adds a member, **Then** the member appears in the tree and survives a page refresh.
2. **Given** a member with relationships and events, **When** the developer deletes that member, **Then** their relationships and events involving them are also removed.
3. **Given** changes were made in a session, **When** the app is restarted in demo mode, **Then** the sample data is in its original state.

---

### User Story 3 - Switch cleanly between demo mode and the database (Priority: P2)

The same codebase runs against the real database for staging/production. Demo mode is only active when explicitly requested; the default start behavior is unchanged. The developer can clearly tell which mode is active.

**Why this priority**: Prevents accidental use of dummy data in staging, and keeps the demo path from altering real behavior.

**Independent Test**: Start normally with a database configured and confirm real data is used; start in demo mode and confirm sample data is used.

**Acceptance Scenarios**:

1. **Given** the app is started without the demo option, **When** it handles requests, **Then** it uses the database as before.
2. **Given** the app is started in demo mode, **When** it starts, **Then** a clear message states that demo (in-memory) data is in use.
3. **Given** the app is running in a production environment, **When** demo mode is requested, **Then** startup is refused with a clear message, to avoid serving dummy data by mistake.

---

### User Story 4 - Reset demo data on demand (Priority: P3)

The developer can restore the sample data without restarting the app, by calling a developer-only reset endpoint, to quickly return to a known state between UI experiments. There is no reset control in the app's UI.

**Why this priority**: Convenience; restart already provides a reset.

**Independent Test**: Make edits, trigger reset, confirm the sample data returns.

**Acceptance Scenarios**:

1. **Given** demo mode with edits, **When** the developer calls the reset endpoint, **Then** the sample data is restored and the UI reflects it after refresh.
2. **Given** the app is not in demo mode, **When** the reset endpoint is called, **Then** it is rejected and no real data is affected.

---

### Edge Cases

- Demo mode requested while a database URL is also configured: demo mode takes precedence and the database is not contacted.
- Newly created records must receive unique identifiers that never collide with sample records, even after deletions.
- Deleting a member must not leave dangling relationships or events.
- Invalid input (e.g., missing first name) must be rejected in demo mode with the same validation messages as normal mode.
- Updating or deleting a non-existent record must return the same not-found behavior as normal mode.
- Duplicate relationships and relationships referencing missing members are rejected exactly as in normal mode; events are not validated against member existence (same as normal mode).
- Date fields in sample data must display and edit correctly in the UI, including deceased members with death dates.
- Concurrent browser tabs share the same in-memory data during one session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST offer a dedicated, documented start command for demo mode using dummy in-memory data, with no database required. Demo mode MUST NOT be activated by any other means, so the normal start command can never serve dummy data.
- **FR-002**: System MUST keep the current database-backed behavior as the default when demo mode is not requested.
- **FR-003**: Demo mode MUST provide behavior equivalent to normal mode for all existing data operations: view tree, create/update/move/delete members, create/update/delete relationships, create/list/delete events, including validation and not-found responses.
- **FR-004**: The sample dataset MUST be small (about 8 members) and include three generations, spouse and parent-child relationships, at least one deceased member, members with and without optional details (occupation, biography, places), and at least 5 events covering multiple event types.
- **FR-005**: Sample members MUST have pre-set positions so the tree is readable on first load.
- **FR-006**: Changes in demo mode MUST NOT be persisted beyond the running process; each start MUST begin from the original sample data.
- **FR-007**: Deleting a member in demo mode MUST also remove their relationships and events, matching normal mode.
- **FR-008**: System MUST display a clear indication at startup that demo mode is active.
- **FR-009**: System MUST refuse to start in demo mode when the environment is production (`NODE_ENV=production`).
- **FR-010**: System MUST provide a developer-only HTTP endpoint that resets demo data to its original state without restarting, available only in demo mode and only to requests from the local machine (all others get not-found). No UI control is provided.
- **FR-011**: Demo mode MUST NOT require or attempt a database connection.
- **FR-012**: Documentation MUST explain how to start demo mode, what data it contains, and that changes are not saved.
- **FR-013**: Automated tests MUST verify parity with normal-mode behavior for the operations in FR-003 using one shared test suite run against both storages; the database half MUST skip itself when no test database is configured.
- **FR-014**: Demo mode MUST enforce the same constraints and return the same errors as the database: duplicate relationships (same members and type) and relationships referencing non-existent members are rejected. Events are not checked against member existence, exactly as in the database today.
- **FR-015**: Demo mode MUST NOT show any in-app indicator; the startup message (FR-008) is the only signal.

### Key Entities

- **Family Member**: A person with name, gender, birth/death details, occupation, biography, living status, and canvas position.
- **Relationship**: A link between two members (spouse, parent-child, adopted, step-parent) with optional dates and status.
- **Family Event**: A dated life event (birth, marriage, graduation, etc.) involving one or more members.
- **Sample Dataset**: The fixed, versioned set of members, relationships, and events loaded at the start of every demo session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with no database installed can run the dedicated demo command and see the populated family tree within 1 minute of starting the app.
- **SC-002**: 100% of existing create, update, move, and delete flows in the UI can be exercised in demo mode without errors.
- **SC-003**: After restart, 100% of sample records match their original values regardless of prior edits.
- **SC-004**: Starting with the normal command (without demo mode) uses real data in 100% of cases; no dummy data is ever served unless demo mode was explicitly requested.
- **SC-005**: Demo mode can be started from the README instructions alone, by a new contributor, on the first attempt.

## Assumptions

- Primary users are developers and designers running the app locally; demo mode is not an end-user feature.
- Staging and production continue to use Postgres; demo mode is only for local development and demos.
- Demo data is a single shared dataset (no per-user or per-session data); authentication features are out of scope.
- Reset is a developer-facing endpoint only; no in-app reset button is in scope.
- Testing very large or crowded trees is out of scope; a larger dataset can be a later feature.
- Existing sample data in the repo's database seed can inform, but need not be identical to, the demo dataset.
- A visible "demo data" banner in the app is out of scope.
- Persistence of demo changes (e.g., to a file) is out of scope.
