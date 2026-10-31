# Feature Specification: Accounts and Collaborative Family Groups

**Feature Branch**: `003-accounts-collaboration`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "add login with email and SSO, create family tree group with
different roles so there can be multiple admins, maybe share a readable version for public"
(part of a broader idea set that also included richer member profiles, event reminders, a
Q&A assistant, and responsive UI improvements, which are tracked as separate features).

## Clarifications

### Session 2026-10-31

- Q: What is a public share link? → A: An unguessable, revocable token URL. Administrators may set an
  optional expiry (default: no expiry); expired and revoked links expose nothing.
- Q: What is private by default? → A: Contact and social details of living members, and any field an
  administrator explicitly marks private. Everything else is public in a published view.
- Q: Does 007 depend on this feature? → A: No. 007 ships first against the single shared tree; undo/redo
  stays per-browser after 003 lands.
- Q: When do session-cookie requirements (013 FR-004) apply? → A: From this feature onward, since sessions
  first exist here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In to a Personal Account (Priority: P1)

As a family historian, I can create an account and sign in with email or a single sign-on
provider so my family data is private to me and available across my devices.

**Why this priority**: Identity is the foundation for privacy, collaboration, roles, and
sharing; none of the other stories are meaningful without it.

**Independent Test**: Register or sign in with email and with an SSO provider, confirm an
authenticated session, sign out, and confirm protected data is no longer accessible.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they register with a valid email and complete any
   required verification, **Then** they have an account and an authenticated session.
2. **Given** a returning user, **When** they sign in with email or a supported SSO
   provider, **Then** they resume access to their own family data.
3. **Given** an authenticated user, **When** they sign out, **Then** their session ends and
   private family data can no longer be accessed without signing in again.
4. **Given** invalid or unverified credentials, **When** a user attempts to sign in,
   **Then** access is denied with a clear, non-revealing message.

### User Story 2 - Collaborate on a Family Group With Roles (Priority: P2)

As a family group owner, I can invite others and assign roles so multiple administrators
and contributors can maintain the tree while viewers can only read it.

**Why this priority**: Shared stewardship is a core goal (multiple admins), but it depends
on accounts existing first.

**Independent Test**: Create a group, invite a second account, assign a role, and confirm
that the invitee can perform exactly the actions their role permits and no others.

**Acceptance Scenarios**:

1. **Given** an owner, **When** they invite a person by email, **Then** that person can join
   the group after accepting the invitation.
2. **Given** a group with members, **When** the owner assigns the administrator role,
   **Then** that member can manage family data and other members' roles.
3. **Given** a member with a viewer role, **When** they attempt to edit family data,
   **Then** the action is prevented and they retain read-only access.
4. **Given** a member's role or membership is removed, **When** they next act,
   **Then** their access reflects the change immediately.
5. **Given** a group, **When** administrators are managed, **Then** the group MUST always
   retain at least one owner or administrator.

### User Story 3 - Share a Public Read-Only View (Priority: P3)

As a group administrator, I can publish a read-only version of the family tree so relatives
without accounts can view it, without exposing private details.

**Why this priority**: Public sharing adds reach and delight but is not required for private
collaboration to be valuable.

**Independent Test**: Publish a public view, open it without signing in, confirm it is
read-only and omits data marked private, then revoke it and confirm it is no longer
accessible.

**Acceptance Scenarios**:

1. **Given** an administrator, **When** they publish a public view, **Then** a shareable
   read-only link is created.
2. **Given** a public link, **When** a visitor without an account opens it, **Then** they
   can view permitted family information but cannot modify anything.
3. **Given** data marked private, **When** the public view is rendered, **Then** that data
   is excluded from the public view.
4. **Given** a published link, **When** an administrator revokes it, **Then** the link no
   longer grants access.

### Edge Cases

- A user may attempt to access a group or tree they do not belong to; access MUST be denied.
- An invitation may be sent to an email that has no account yet; the flow MUST let them join
  after creating an account.
- The same email may attempt to register twice or link both email and SSO; the identities
  MUST resolve to a single account without duplicate data.
- The last remaining owner/administrator MUST NOT be able to remove or demote themselves
  without another owner/administrator in place.
- A revoked or expired public link MUST NOT expose any data.
- A session may expire or be revoked; the user MUST be safely returned to a signed-out state.
- Existing single-tree data MUST be assigned to an owning account on first sign-in without
  data loss.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to create an account and authenticate with email.
- **FR-002**: The system MUST allow users to authenticate with at least one single sign-on
  provider.
- **FR-003**: The system MUST keep each user's family data private by default and accessible
  only to authorized group members.
- **FR-004**: The system MUST allow a user to own one or more family groups, each containing
  a family tree.
- **FR-005**: The system MUST allow group owners and administrators to invite people by email
  and manage their membership.
- **FR-006**: The system MUST support at least owner, administrator, editor, and viewer roles
  with clearly defined permissions, and MUST support multiple administrators per group.
- **FR-007**: The system MUST enforce role permissions on every action that reads or changes
  family data.
- **FR-008**: The system MUST guarantee each group always has at least one owner or
  administrator.
- **FR-009**: The system MUST allow administrators to publish and revoke a read-only public
  view of a family tree.
- **FR-010**: The public view MUST be read-only and MUST exclude data marked private.
- **FR-011**: The system MUST allow data or fields to be designated as private and excluded
  from public sharing.
- **FR-012**: The system MUST end access when a user signs out, when a session expires, or
  when membership or a share link is revoked.
- **FR-013**: The system MUST resolve email and SSO identities for the same person to a
  single account without duplicating family data.
- **FR-014**: The system MUST migrate existing single-tree data to an owning account without
  data loss on first authenticated use.
- **FR-015**: The system MUST protect authentication and authorization flows against common
  account, session, and access-control abuse, and MUST avoid revealing whether an account
  exists.

### Key Entities *(include if feature involves data)*

- **User account**: An authenticated identity with one or more sign-in methods (email, SSO).
- **Family group**: An ownable container for a family tree and its members.
- **Membership**: The association of a user account to a family group with a role.
- **Role**: A named permission level (owner, administrator, editor, viewer) that governs
  allowed actions.
- **Invitation**: A pending offer for a person (by email) to join a group with a role.
- **Public share**: A revocable, read-only publication of a family tree that excludes private
  data.
- **Privacy designation**: A marker on data or fields that controls exclusion from public
  sharing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can create an account and reach their family tree in under 3 minutes.
- **SC-002**: 100% of family-data actions are permitted only for members whose role allows
  them, verified by access-control testing.
- **SC-003**: A group can have two or more administrators simultaneously managing the tree
  without conflict in at least 95% of concurrent edit sessions tested.
- **SC-004**: 100% of data marked private is absent from every published public view in
  verification testing.
- **SC-005**: Revoking membership or a public link removes access within one action, with no
  residual access in testing.
- **SC-006**: At least 90% of invited relatives can accept an invitation and view or edit
  according to their role without assistance.
- **SC-007**: No account enumeration, unauthorized cross-group access, or privilege escalation
  is possible in security testing of the authentication and authorization flows.

## Assumptions

- This feature builds on the baseline documented in
  [../001-core-family-tree/spec.md](../001-core-family-tree/spec.md) and extends it from a
  single implicit tree to account-owned family groups.
- Standard, current best practices for account security, session management, and SSO are
  expected; specific providers and protocols are an implementation decision for planning.
- Email delivery for verification and invitations is available or will be provisioned during
  planning.
- Privacy designation starts from sensible defaults (for example, living members' contact
  details are private) and can be refined during planning.
- Search, member profiles, reminders, and the Q&A assistant are separate features and are not
  in scope here, though they will operate within these accounts and roles once available.
- Notifications and reminders delivery are out of scope for this feature.
