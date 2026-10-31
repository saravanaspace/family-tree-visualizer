# Feature Specification: Rich Member Profiles

**Feature Branch**: `004-rich-member-profiles`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "add image for each member, add metadata like birthday, current
location, social media etc" (part of a broader idea set; accounts, sharing, reminders, Q&A,
and responsive UI are tracked as separate features).

## Clarifications

### Session 2026-10-31

- Q: Image limits? → A: JPEG, PNG, or WebP only; maximum 5 MB per image; content type verified server-side.
- Q: Is the private flag stored before accounts (003) exist? → A: Yes. Contact and social links default to
  private and the flag is persisted now; it is enforced on public/shared surfaces once 003 provides them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a Photo to a Member (Priority: P1)

As a family historian, I can add a photo to a person so the tree feels personal and people
are easy to recognize at a glance.

**Why this priority**: A recognizable portrait is the most visible and requested profile
enhancement and immediately improves the tree experience.

**Independent Test**: Add a photo to a person, confirm it appears on their card and profile,
replace it, remove it, and confirm the fallback appearance returns.

**Acceptance Scenarios**:

1. **Given** a person without a photo, **When** a user adds a valid image,
   **Then** the image appears on the person's card and profile after reload.
2. **Given** a person with a photo, **When** a user replaces or removes it,
   **Then** the new image or a clear placeholder is shown consistently.
3. **Given** an unsupported or oversized file, **When** a user attempts to add it,
   **Then** the upload is rejected with a clear message and no partial change.

### User Story 2 - Record Extended Member Details (Priority: P1)

As a family historian, I can record extended details such as birthday, current location, and
other biographical metadata so each person's profile is complete.

**Why this priority**: Richer metadata is the core of this feature and directly supports the
family-history purpose of the product.

**Independent Test**: Add and edit several metadata fields for a person, leave some blank,
reload, and confirm saved values and blank fields are represented correctly.

**Acceptance Scenarios**:

1. **Given** a person, **When** a user records supported metadata fields,
   **Then** the values are saved and shown on the person's profile after reload.
2. **Given** invalid input in a structured field (for example, a malformed date),
   **When** the user saves, **Then** the field is rejected with a clear message.
3. **Given** unknown information, **When** a user leaves fields blank,
   **Then** blank values remain distinguishable from recorded values.

### User Story 3 - Add Social and Contact Links (Priority: P2)

As a family historian, I can add social media and contact links to a living person so
relatives can connect, while keeping this information appropriately private.

**Why this priority**: Links add convenience and connection but are secondary to portraits
and core biographical metadata, and they carry privacy considerations.

**Acceptance Scenarios**:

1. **Given** a person, **When** a user adds a valid social or contact link,
   **Then** the link is saved and shown as an actionable reference on the profile.
2. **Given** a malformed link, **When** the user saves, **Then** it is rejected with a clear
   message.
3. **Given** contact or social details, **When** they are displayed,
   **Then** they follow the person's privacy setting and are not exposed where privacy
   disallows it.

### Edge Cases

- A person may have no photo; a consistent placeholder MUST be shown.
- An image may be too large, an unsupported type, or corrupt; it MUST be rejected safely.
- Metadata fields may be partially filled; unknown values MUST remain distinguishable from
  recorded values.
- Dates such as birthdays may be incomplete (for example, unknown year); the system MUST
  handle partial dates without error.
- Social or contact links may be malformed or unsafe; they MUST be validated and rendered
  safely.
- Contact and social details for living people MUST respect privacy and MUST NOT leak into
  any public view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to add, replace, and remove a photo for each family member.
- **FR-002**: The system MUST validate uploaded images for supported type and size and reject
  invalid files without partial changes.
- **FR-003**: The system MUST display a consistent placeholder when a member has no photo.
- **FR-004**: Users MUST be able to record and edit extended member metadata, including at
  least birthday, current location, and additional biographical fields.
- **FR-005**: The system MUST validate structured fields such as dates and reject invalid
  input with a clear message.
- **FR-006**: The system MUST preserve the distinction between blank (unknown) and recorded
  values for every profile field.
- **FR-007**: Users MUST be able to add, edit, and remove social media and contact links for
  a member.
- **FR-008**: The system MUST validate links and render them safely.
- **FR-009**: The system MUST allow contact and social details to be marked private and MUST
  exclude private details from any public or shared view.
- **FR-010**: Member profiles MUST remain usable and readable at supported desktop and mobile
  sizes and reachable by keyboard.
- **FR-011**: The system MUST persist all profile data so it survives reloads and restarts.

### Key Entities *(include if feature involves data)*

- **Family member**: The existing person record, extended with a photo, additional metadata,
  and links.
- **Member photo**: An image associated with a member, with supported type and size limits.
- **Member metadata field**: A named biographical attribute (for example, birthday or current
  location) with an optional value.
- **Contact or social link**: A validated reference to a person's social or contact presence,
  subject to privacy settings.
- **Privacy setting**: A per-field or per-member marker that controls exclusion from public
  or shared views.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a photo and see it on the member's card and profile in under 1
  minute.
- **SC-002**: At least 95% of saved profile fields and photos appear correctly after reload.
- **SC-003**: 100% of invalid images and malformed structured fields are rejected without
  corrupting existing profile data.
- **SC-004**: 100% of details marked private are excluded from public or shared views in
  verification testing.
- **SC-005**: Member profiles remain fully usable at supported mobile and desktop sizes and
  reachable without a pointer.

## Assumptions

- This feature builds on the baseline in
  [../001-core-family-tree/spec.md](../001-core-family-tree/spec.md) and extends the existing
  member record rather than introducing a separate profile entity.
- Privacy exclusion aligns with the sharing model defined in
  [../003-accounts-collaboration/spec.md](../003-accounts-collaboration/spec.md); if that
  feature is not yet available, private fields simply remain hidden from any public view.
- Reasonable default limits for image type and size follow standard web practices and can be
  refined during planning.
- Image storage location and delivery are implementation decisions for planning; this spec
  only requires that photos are persisted and displayed reliably.
- Search, reminders, and the Q&A assistant are separate features and are out of scope here.
