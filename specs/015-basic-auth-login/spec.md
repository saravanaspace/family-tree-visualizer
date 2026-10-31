# Feature Specification: Basic Authentication and Authorization

**Feature Branch**: `015-basic-auth-login`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "basic authentication and authorization. create a simple login page for
the app with username password for now and extended to google, apple oauth and email+otp option for
future. all family trees are linked to a user for now."

## Clarifications

### Session 2026-10-31

- Q: How do users get a username/password account? → A: Admin/seeded accounts only; there is no
  public sign-up page in this feature.
- Q: What happens to existing family tree data, which is currently shared and unowned? → A: It is
  assigned to a seeded default owner account.
- Q: How many trees can a user own? → A: Multiple; each tree is owned by exactly one user.
- Q: How does this relate to 003-accounts-collaboration? → A: This feature is the foundational slice
  (identity, sessions, tree ownership). Group roles, invitations, public sharing, and email/SSO sign-in
  from 003 build on it later.
- Q: Is there an explicit tree entity today? → A: No; members, relationships, and events are global. This
  feature introduces a named Family Tree record, and existing data becomes one tree owned by the default
  owner.
- Q: Is tree management UI in scope? → A: Yes: create, rename, switch, and delete (delete confirmation
  states the member count).
- Q: Where do seeded credentials come from? → A: Operator-supplied environment values at startup; an
  account is created only if missing and an existing password is never overwritten. Production startup
  fails if they are unset; development generates a password printed once.
- Q: How are further accounts managed? → A: An operator command-line tool (create, disable, reset
  password); no in-app admin screen or admin role.
- Q: How does throttling work? → A: Temporary lockout of 15 minutes after 5 consecutive failures per
  username, plus a per-source limit; never permanent lockout.
- Q: Where are sessions kept? → A: Server-side and checked on every request, so disabling an account or
  signing out takes effect immediately.
- Q: How is the active tree identified? → A: By a tree ID in the page address, so reloads, bookmarks, and
  separate tabs on different trees work; ownership is verified on every request.
- Q: Is CSRF protection specified here? → A: No; cookie hardening (including SameSite) is covered by 013
  and reused.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In With Username and Password (Priority: P1)

As an account holder, I can sign in on a login page with my username and password so that only I can
reach my family trees.

**Why this priority**: Without identity, no data can be protected or owned.

**Independent Test**: Open the app signed out, confirm the login page is shown, sign in with valid
credentials, and confirm the app is reachable; sign in with invalid credentials and confirm denial.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor, **When** they open any app page, **Then** they are shown the login page
   and no family data.
2. **Given** valid credentials, **When** they submit the login form, **Then** they are signed in and
   taken to their trees (or the page they originally requested).
3. **Given** an unknown username or wrong password, **When** they submit, **Then** access is denied with
   one generic message that does not reveal which part was wrong.
4. **Given** repeated failed attempts for an account, **When** the limit is reached, **Then** further
   attempts are temporarily blocked with a clear message.

---

### User Story 2 - Sign Out and Session Persistence (Priority: P1)

As a signed-in user, my session persists across page reloads and I can sign out explicitly.

**Why this priority**: Required for a usable and safe login experience.

**Independent Test**: Sign in, reload, confirm still signed in; sign out, confirm protected data and
pages are inaccessible, including via browser back.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they reload or reopen the app within the session lifetime, **Then**
   they remain signed in.
2. **Given** a signed-in user, **When** they sign out, **Then** the session ends and protected data can
   no longer be accessed without signing in again.
3. **Given** an expired session, **When** the user takes any action, **Then** they are returned to login
   and can resume afterwards.

---

### User Story 3 - Trees Belong to a User (Priority: P1)

As a user, I only see and modify family trees I own, and every tree I create is owned by me.

**Why this priority**: Ownership is the authorization model for this phase.

**Independent Test**: With two accounts, create a tree in each; confirm neither can list, view, edit, or
delete the other's tree, including by direct address or direct data request.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they view their tree list, **Then** only trees they own appear.
2. **Given** a signed-in user, **When** they create a tree, **Then** it is owned by them.
3. **Given** a user requesting another user's tree or any of its members, relationships, or related
   records, **When** the request is made by any means, **Then** it is refused as if it did not exist.
4. **Given** a user with several trees, **When** they switch trees, **Then** all data shown belongs to the
   selected tree only.

---

### User Story 4 - Existing Data Migrated to a Default Owner (Priority: P2)

As the operator, when authentication is introduced, all existing family data becomes owned by a seeded
default owner account so nothing is lost or left exposed.

**Why this priority**: Prevents data loss and unprotected legacy data at rollout.

**Independent Test**: Upgrade a dataset created before this feature; confirm all prior data is owned by
the default owner and visible only after signing in as that account.

**Acceptance Scenarios**:

1. **Given** pre-existing tree data, **When** the feature is deployed, **Then** every tree is owned by the
   default owner account and nothing is orphaned or duplicated.
2. **Given** deployment with no pre-existing data, **When** the app starts, **Then** the seeded accounts
   still exist so someone can sign in.

---

### User Story 5 - Ready to Add Other Sign-In Methods Later (Priority: P3)

As a product owner, I want the login page and account model to accommodate Google, Apple, and
email+one-time-code sign-in later without redoing tree ownership or sessions.

**Why this priority**: Not delivered now, but must not be blocked by this design.

**Independent Test**: Review that an account is independent of how it signs in, and that the login page
can present additional sign-in options without altering sessions or ownership rules.

**Acceptance Scenarios**:

1. **Given** an account, **When** another sign-in method is later linked to it, **Then** the same trees
   and session behaviour apply with no data changes.
2. **Given** this release, **When** a user views the login page, **Then** only username/password is
   offered (no non-functional buttons for future methods).

---

### Edge Cases

- Username comparison is case-insensitive; leading/trailing whitespace is ignored.
- Disabled account: sign-in is refused with the same generic message and existing sessions end.
- Signed in on multiple devices: each session is independent; signing out one does not end the others.
- Session expires mid-edit: user is sent to login; unsaved changes are not silently accepted as
  authenticated.
- Direct links to a tree the user does not own show the same "not found" outcome as a nonexistent tree.
- A user with zero trees sees an empty state with a way to create one.
- Login page requested while already signed in redirects to the app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require authentication for all app pages and all family data access, except the
  login page.
- **FR-002**: System MUST provide a login page accepting username and password.
- **FR-003**: System MUST deny invalid credentials with a single generic message that does not reveal
  whether the username exists.
- **FR-004**: System MUST lock sign-in for an account for 15 minutes after 5 consecutive failures, and
  apply a per-source attempt limit, with a clear message. Lockout MUST never be permanent.
- **FR-005**: System MUST NOT store or log passwords in readable form; stored credentials MUST be
  protected with a modern, deliberately slow, salted one-way scheme.
- **FR-006**: System MUST maintain a session after sign-in that persists across reloads, expires after a
  period of inactivity or an absolute maximum lifetime, and is not readable by page scripts. Sessions
  are stored server-side and validated on every request.
- **FR-007**: Users MUST be able to sign out, which ends that session immediately.
- **FR-008**: System MUST NOT offer public sign-up in this feature; accounts are created by an
  administrator or seeded.
- **FR-009**: System MUST create a default owner account at startup from operator-supplied environment
  values, only if missing, never overwriting an existing password, and failing production startup if the
  values are unset. In development, a generated password MAY be printed once.
- **FR-010**: Operators MUST be able to create accounts, disable accounts, and reset passwords through a
  command-line tool. Disabling blocks sign-in and ends active sessions immediately.
- **FR-011**: Every family tree MUST have exactly one owning user; a user MAY own multiple trees.
- **FR-012**: System MUST restrict listing, reading, creating, updating, and deleting of trees and all
  tree-scoped records (members, relationships, events, and any related data) to the owning user. Every
  existing endpoint MUST be scoped to a tree, and a client-supplied tree identifier MUST be verified
  against ownership.
- **FR-020**: System MUST introduce a named Family Tree record to which members, relationships, and events
  belong, and let users create, rename, switch, and delete their trees. Deleting a tree requires
  confirmation stating how many members will be removed.
- **FR-013**: Requests for resources outside the user's ownership MUST be refused indistinguishably from
  requests for nonexistent resources.
- **FR-014**: System MUST assign newly created trees to the signed-in user, never to a user supplied by
  the client.
- **FR-015**: System MUST migrate all pre-existing tree data to the seeded default owner without loss.
- **FR-016**: System MUST record sign-in success/failure, sign-out, and access-denied events without
  recording passwords.
- **FR-017**: System MUST model an account separately from its sign-in method so Google, Apple, and
  email+one-time-code methods can be added later without changing ownership or session behaviour.
- **FR-018**: The login page MUST be responsive and keyboard/screen-reader accessible, with labelled
  fields, visible error messages, and no reliance on colour alone.
- **FR-019**: Existing responsive UI conventions (see 007) apply to the login page and any new
  signed-in controls such as the sign-out control and tree switcher.
- **FR-021**: The active tree MUST be identified by a tree ID in the page address. A page address naming a
  tree the user does not own MUST show the same "not found" outcome as a nonexistent tree, and the app
  root MUST open the user's tree directly if they own exactly one, otherwise show the tree list.

### Key Entities

- **User Account**: A person who can sign in; has a unique username, display name, status
  (active/disabled), and creation time. Independent of sign-in method.
- **Credential**: A sign-in method attached to an account; in this release only username/password.
  Future types: Google, Apple, email+one-time-code.
- **Session**: A period of authenticated access for one account on one device, with creation, last
  activity, and expiry.
- **Family Tree**: A collection of members and relationships; owned by exactly one User Account.
- **Security Event**: A record of authentication and access-denied activity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of data requests made without a valid session are refused.
- **SC-002**: In a two-account test, 0 cross-account reads or writes succeed across every tree-related
  operation.
- **SC-003**: A user with valid credentials can sign in and reach their trees in under 15 seconds.
- **SC-004**: 100% of pre-existing trees and their records are present and owned by the default owner after
  migration, with zero records lost.
- **SC-005**: Invalid-credential responses are indistinguishable between unknown username and wrong
  password.
- **SC-006**: Adding a new sign-in method later requires no changes to tree ownership data.
- **SC-007**: The login page is fully usable by keyboard alone and on phone-width screens.

## Assumptions

- Authorization in this phase is ownership-only: a user can do everything to their own trees and nothing
  to others'. Roles, invitations, and public sharing are deferred to 003.
- Account creation, password reset, and disabling are operator command-line tasks in this phase;
  self-service password change/reset and any in-app admin screen are out of scope.
- Password strength rules for operator-set passwords: minimum length 12; no composition rules.
- Session lifetime defaults: 7 days idle and 30 days absolute (long editing sessions are common); both
  are configurable.
- Google, Apple, and email+OTP sign-in, account linking, multi-factor authentication, and 003 group
  features are out of scope here.
- Sessions require the session-cookie protections from 013 FR-004 (including SameSite) and the logging
  conventions from 011; no separate CSRF requirement is added here.
- Existing deployments have data in the shared, unowned form described in 001.
