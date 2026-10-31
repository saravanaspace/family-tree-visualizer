# Feature Specification: Family History Q&A Assistant

**Feature Branch**: `006-family-history-qa`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "add RAG for Q&A" (part of a broader idea set; accounts, profiles,
reminders, and responsive UI are tracked as separate features).

## Clarifications

### Session 2026-10-31

- Q: May family data be sent to an external model provider? → A: Only if the operator explicitly configures
  one; only the minimum authorized records are sent, nothing is logged (feature 011 FR-007), and setup
  docs MUST state this. Default is no external provider (feature disabled until configured).
- Q: "Reasonable time" and "supported dataset sizes"? → A: 90% of answers within 5 seconds for trees up to
  1,000 members.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask Questions About the Family (Priority: P1)

As a family historian, I can ask natural-language questions about my family and get answers
drawn from my recorded family data so I can explore history without manual searching.

**Why this priority**: Grounded question answering is the core value of the feature and the
primary reason to build it.

**Independent Test**: Ask questions whose answers exist in the recorded data, confirm the
answers are correct and reference the underlying records, and confirm unanswerable questions
are handled honestly.

**Acceptance Scenarios**:

1. **Given** recorded family data, **When** a user asks a question answerable from that data,
   **Then** the assistant returns an accurate answer grounded in that data.
2. **Given** an answer, **When** it is presented, **Then** it references the family records it
   is based on.
3. **Given** a question that the data cannot answer, **When** the user asks,
   **Then** the assistant clearly states it does not have that information rather than
   fabricating an answer.

### User Story 2 - Trust and Verify Answers (Priority: P2)

As a family historian, I can see which records an answer is based on so I can trust and verify
what the assistant tells me.

**Why this priority**: Verifiability builds trust and guards against misinformation, but it
depends on the core answering capability existing first.

**Acceptance Scenarios**:

1. **Given** an answer with references, **When** a user opens a reference,
   **Then** they are taken to or shown the underlying member, relationship, or event.
2. **Given** an answer that combines multiple records, **When** it is shown,
   **Then** each contributing record is identified.
3. **Given** conflicting or incomplete records, **When** the assistant answers,
   **Then** it communicates the uncertainty rather than presenting a single false certainty.

### User Story 3 - Keep Answers Private and Authorized (Priority: P1)

As a family group member, I can trust that the assistant only uses data I am allowed to see so
private family information is not exposed.

**Why this priority**: Preventing disclosure of private or unauthorized data is a
non-negotiable safeguard for a system that surfaces family information.

**Acceptance Scenarios**:

1. **Given** a user with limited access, **When** they ask a question,
   **Then** the assistant only uses data that user is authorized to see.
2. **Given** data marked private, **When** it would answer a question for an unauthorized user,
   **Then** the assistant excludes it and does not reveal its contents.
3. **Given** a public viewer, **When** they use any public assistant surface,
   **Then** only public data is used.

### Edge Cases

- A question may be ambiguous; the assistant SHOULD ask for clarification or state its
  interpretation.
- The data may contain contradictions; the assistant MUST NOT invent a resolution.
- A question may request private data the user cannot access; the assistant MUST refuse
  without revealing the protected content.
- A question may be unrelated to the family data; the assistant MUST stay within scope.
- Very large family datasets MUST still return answers within a reasonable time.
- Attempts to manipulate the assistant into ignoring authorization or scope MUST be resisted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to ask natural-language questions about their family data and
  receive answers grounded in that data.
- **FR-002**: The assistant MUST base answers only on recorded family data the asking user is
  authorized to access.
- **FR-003**: The assistant MUST reference the specific records used to produce each answer.
- **FR-004**: The assistant MUST clearly indicate when it lacks the information to answer
  rather than fabricating content.
- **FR-005**: The assistant MUST communicate uncertainty when records are incomplete or
  conflicting.
- **FR-006**: The assistant MUST exclude data marked private from users not authorized to see
  it and MUST NOT reveal protected content.
- **FR-007**: The assistant MUST remain within the scope of the family data and decline
  unrelated or manipulative requests.
- **FR-008**: The assistant MUST return answers within a reasonable time for supported dataset
  sizes.
- **FR-009**: The assistant MUST not modify family data; it is a read-only capability.

### Key Entities *(include if feature involves data)*

- **Question**: A user's natural-language query about the family.
- **Grounded answer**: A response derived from and attributed to specific family records.
- **Source reference**: A pointer to a member, relationship, or event that supports an answer.
- **Access scope**: The set of family data a given user or viewer is authorized to use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of questions answerable from the data receive a correct, grounded
  answer in evaluation.
- **SC-002**: 100% of presented answers include verifiable references to underlying records.
- **SC-003**: 0 instances of private or unauthorized data disclosure in security evaluation.
- **SC-004**: At least 95% of unanswerable questions are met with an honest "not available"
  response rather than a fabricated answer.
- **SC-005**: At least 90% of typical questions return an answer within a few seconds on
  supported dataset sizes.

## Assumptions

- This feature builds on the baseline in
  [../001-core-family-tree/spec.md](../001-core-family-tree/spec.md) and treats members,
  relationships, and events as the answerable knowledge source.
- Authorization and privacy align with
  [../003-accounts-collaboration/spec.md](../003-accounts-collaboration/spec.md); without it,
  the assistant operates over the single owner's data only.
- The specific retrieval and generation approach, model choice, and hosting are implementation
  decisions for planning; this spec requires grounding, attribution, and honesty regardless of
  approach.
- The assistant is read-only and does not create or edit family data.
- Search, profiles, and reminders are separate features and out of scope here.
