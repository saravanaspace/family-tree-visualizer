# Feature Specification: Event Reminders

**Feature Branch**: `005-event-reminders`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "send reminders for upcoming events like birthdays, anniversary
etc" (part of a broader idea set; accounts, profiles, Q&A, and responsive UI are tracked as
separate features).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get Reminded About Upcoming Birthdays (Priority: P1)

As a family member, I can receive reminders about upcoming birthdays so I remember to reach
out and celebrate.

**Why this priority**: Birthdays are the most frequent and universally valued recurring
event, making this the core of the feature.

**Independent Test**: Configure reminders, confirm an upcoming birthday within the reminder
window produces a reminder at the expected time, and confirm no reminder is produced outside
the window.

**Acceptance Scenarios**:

1. **Given** a member with a known birthday and reminders enabled, **When** the birthday is
   within the configured lead time, **Then** a reminder is generated for that occasion.
2. **Given** a birthday outside the lead time, **When** reminders are evaluated,
   **Then** no reminder is generated yet.
3. **Given** a member with an unknown birthday, **When** reminders are evaluated,
   **Then** no birthday reminder is generated and no error occurs.

### User Story 2 - Get Reminded About Anniversaries and Recorded Events (Priority: P2)

As a family member, I can receive reminders about anniversaries and other recorded family
events so significant dates are not missed.

**Why this priority**: Anniversaries and events extend the value of reminders but build on the
same mechanism proven by birthdays.

**Acceptance Scenarios**:

1. **Given** a relationship with a known anniversary date and reminders enabled,
   **When** the date is within the lead time, **Then** an anniversary reminder is generated.
2. **Given** a recorded family event with a future date, **When** it enters the lead time,
   **Then** a reminder is generated for that event.
3. **Given** an event without a date, **When** reminders are evaluated,
   **Then** no reminder is generated for it.

### User Story 3 - Control Reminder Preferences (Priority: P2)

As a family member, I can choose which reminders I receive, how far in advance, and how they
reach me so reminders are useful and not intrusive.

**Why this priority**: Preference control prevents reminder fatigue and unwanted notifications,
which is essential for adoption but secondary to producing reminders at all.

**Acceptance Scenarios**:

1. **Given** reminder preferences, **When** a user sets a lead time and event types,
   **Then** only matching reminders are produced on that schedule.
2. **Given** a user who opts out, **When** reminders are evaluated,
   **Then** no reminders are sent to that user.
3. **Given** a delivery channel is unavailable, **When** a reminder is due,
   **Then** the failure is handled gracefully and retried or reported without data loss.

### Edge Cases

- A person may have an unknown or partial date (for example, unknown year); reminders MUST
  handle partial dates and MUST NOT produce misleading occasions.
- Recurring dates near month or year boundaries (for example, Feb 29) MUST resolve to a
  sensible reminder date.
- A member may be deceased; reminders MUST follow configured rules and MUST NOT produce
  inappropriate reminders.
- Duplicate reminders for the same occasion MUST NOT be sent to the same recipient.
- Reminders MUST only be sent to people authorized to see the underlying person or event.
- Time zones MUST be handled so reminders arrive at a sensible local time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST generate reminders for upcoming member birthdays within a
  configured lead time.
- **FR-002**: The system MUST generate reminders for relationship anniversaries and dated
  recorded family events within the lead time.
- **FR-003**: The system MUST let users configure which event types trigger reminders and how
  far in advance.
- **FR-004**: The system MUST let users opt in or out of reminders and choose delivery
  preferences.
- **FR-005**: The system MUST only send reminders to recipients authorized to view the related
  person or event.
- **FR-006**: The system MUST NOT send duplicate reminders for the same occasion to the same
  recipient.
- **FR-007**: The system MUST handle unknown, partial, and boundary dates without error and
  without misleading occasions.
- **FR-008**: The system MUST deliver reminders at a sensible local time for the recipient.
- **FR-009**: The system MUST handle delivery failures gracefully with retry or reporting and
  no loss of pending reminders.

### Key Entities *(include if feature involves data)*

- **Reminder occasion**: An upcoming dated occurrence (birthday, anniversary, or event) that
  can trigger a reminder.
- **Reminder preference**: A user's configuration of event types, lead time, opt-in status,
  and delivery choices.
- **Reminder delivery**: A generated notification for a specific recipient and occasion, with
  a delivery status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 99% of eligible occasions with known dates generate a reminder within
  the configured lead time.
- **SC-002**: 0 duplicate reminders are sent for the same occasion and recipient in testing.
- **SC-003**: 100% of reminders are sent only to authorized recipients in verification testing.
- **SC-004**: At least 95% of reminders arrive within the recipient's expected local delivery
  window.
- **SC-005**: No unknown or partial date produces an erroneous or misleading reminder.

## Assumptions

- This feature builds on the baseline in
  [../001-core-family-tree/spec.md](../001-core-family-tree/spec.md) and uses existing member
  birthdays, relationship dates, and recorded events as occasion sources.
- Recipient identity, authorization, and contact channels align with
  [../003-accounts-collaboration/spec.md](../003-accounts-collaboration/spec.md); if accounts
  are not yet available, reminders target the single owner via a configured channel.
- A delivery channel (such as email) is available or will be provisioned during planning;
  specific channels and scheduling mechanics are implementation decisions.
- Default lead times follow sensible norms (for example, several days before) and can be
  refined during planning.
- Search, profiles, and the Q&A assistant are separate features and out of scope here.
