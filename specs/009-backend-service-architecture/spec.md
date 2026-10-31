# Feature Specification: Backend Service Architecture and Reliability

**Feature Branch**: `009-backend-service-architecture`

**Created**: 2026-08-24

**Status**: Draft

**Input**: Maintainer recommendation: "business logic lives directly in route handlers,
error handling is duplicated and can crash the process after a response is sent, validation is
repeated per route, and there are multiple redundant database client dependencies" — restructure
the backend around a testable service layer with centralized validation and consistent, safe
error handling, and consolidate data-access dependencies, without changing existing API
behavior. Part of a broader code-health idea set; code quality tooling and automated test
coverage are tracked as separate features.

## Clarifications

### Session 2026-08-24

- Q: Should centralized error responses keep the current `{ message, error? }` body or adopt a
  new format? → A: Keep the existing `{ message, error? }` body and apply it consistently to all
  endpoints (no client change).
- Q: How much domain validation should the service layer enforce in this feature? → A: The two
  named rules plus basic referential/enumeration integrity (referenced members must exist;
  relationship type/status must be valid enum values); complex genealogy is deferred.

### Session 2026-10-31

- Q: Is parent-child cycle prevention in scope? → A: Yes, added to FR-006 to match feature 007 FR-024.
- Q: Should error bodies carry the correlation ID? → A: No; the body stays `{ message, error? }`. The ID is
  returned in the `X-Request-Id` response header (feature 011).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive Consistent, Safe API Errors (Priority: P1)

As an API consumer (the client application), I always receive a consistent, predictable error
response when something goes wrong, and the server never crashes as a result, so the application
stays reliable.

**Why this priority**: The current handler re-raises errors after sending a response, which can
destabilize the server; consistent, safe error handling is the highest-value reliability fix.

**Independent Test**: Trigger validation failures, not-found conditions, and unexpected errors
across endpoints and confirm each returns the same error shape with an appropriate status, no
sensitive internal detail leaks, and the server remains running afterward.

**Acceptance Scenarios**:

1. **Given** any endpoint, **When** invalid input is submitted, **Then** the response uses a
   consistent error shape with a client-error status and actionable validation detail.
2. **Given** any endpoint, **When** a referenced record does not exist, **Then** the response
   uses the consistent error shape with a not-found status.
3. **Given** any endpoint, **When** an unexpected error occurs, **Then** the response uses the
   consistent error shape with a server-error status, no sensitive internal detail is exposed,
   and the server process keeps running.
4. **Given** a handled error, **When** the response has been sent, **Then** no further error is
   re-raised that could terminate the process.

---

### User Story 2 - Exercise Domain Logic Independently of Transport (Priority: P1)

As a developer, I can invoke and test the application's business rules through a service layer
that is separate from the HTTP routing, so domain behavior is reusable and testable without
starting a web server.

**Why this priority**: Separating domain logic from transport is what makes the backend
maintainable and unlocks focused, fast tests for family-data rules.

**Independent Test**: Call a service operation directly (outside any route handler) to create a
member and a relationship, and confirm domain rules are enforced and results returned without
involving HTTP.

**Acceptance Scenarios**:

1. **Given** the service layer, **When** a domain operation is called directly,
   **Then** it performs the operation and enforces domain rules without any HTTP dependency.
2. **Given** a request handler, **When** it processes a request,
   **Then** it delegates business logic to the service layer and only handles transport concerns
   (parsing input, selecting status, shaping the response).
3. **Given** an invalid domain operation (for example a member related to itself, or a duplicate
   relationship), **When** it is attempted, **Then** the service layer rejects it with a clear
   domain error regardless of entry point.

---

### User Story 3 - Validate Input Consistently at the Boundary (Priority: P2)

As a developer, I can rely on a single, consistent mechanism that validates and rejects malformed
input at the API boundary, so validation is not re-implemented differently in each handler.

**Why this priority**: Centralized validation removes duplication and inconsistency, but it
builds on the service and error-handling foundations.

**Independent Test**: Submit malformed and well-formed payloads to multiple endpoints and confirm
rejection and acceptance behave identically and produce the shared error shape.

**Acceptance Scenarios**:

1. **Given** an endpoint that accepts a body, **When** the payload is malformed,
   **Then** it is rejected at the boundary with the shared validation error shape before any
   business logic runs.
2. **Given** the same endpoint, **When** the payload is valid,
   **Then** validated, typed data is passed to the service layer.
3. **Given** multiple endpoints, **When** each validates input,
   **Then** they use the same validation mechanism and produce consistent errors.

---

### User Story 4 - Depend on a Single Data-Access Client (Priority: P3)

As a maintainer, I can rely on a single database client dependency so there is no confusion about
which one is used and the dependency surface is smaller.

**Why this priority**: Removing unused redundant clients reduces confusion and supply-chain
surface, but it is lower risk and value than the reliability and structure stories.

**Independent Test**: Inspect the dependency manifest and server code and confirm exactly one
database client is present and used, with unused clients removed and all data access still
working.

**Acceptance Scenarios**:

1. **Given** the dependency manifest, **When** it is inspected,
   **Then** only the database client actually used by the server remains.
2. **Given** the removal of unused clients, **When** the application and test suite run,
   **Then** all data access continues to work unchanged.

### Edge Cases

- All existing endpoints MUST preserve their current request and response contracts; this is a
  restructuring, not a behavior change.
- Concurrent requests that fail MUST each receive an independent, consistent error response.
- A domain rule violation MUST be reported the same way whether triggered via the API or the
  service layer directly.
- Removing an unused dependency MUST NOT change the behavior of the retained client.
- Error responses MUST NOT leak stack traces, credentials, or internal implementation details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST handle errors through a single centralized mechanism that
  produces a consistent error response shape across all endpoints, preserving the existing
  `{ message, error? }` body so no client change is required.
- **FR-002**: The centralized error handling MUST NOT re-raise or otherwise act in a way that can
  terminate the server process after a response has been sent.
- **FR-003**: Error responses MUST use appropriate status categories (client validation error,
  not found, and server error) and MUST NOT expose sensitive internal detail.
- **FR-004**: Business logic MUST reside in a service layer that is separate from HTTP request
  handlers and callable without the HTTP transport.
- **FR-005**: Request handlers MUST delegate business logic to the service layer and limit
  themselves to transport concerns (input parsing, status selection, response shaping).
- **FR-006**: The service layer MUST enforce family-data domain rules, including at minimum
  preventing a member from being related to itself, preventing duplicate equivalent
  relationships, requiring that referenced members exist, requiring valid relationship
  type and status enum values, and preventing parent-child cycles (so the UI rule in feature
  007 FR-024 is also enforced at the API); violations MUST be rejected with clear domain
  errors. Other complex genealogical rules (biological-parent count limits and birth/death
  date sanity) are explicitly out of scope for this feature.
- **FR-007**: Input MUST be validated and rejected at the API boundary through a single
  consistent mechanism before business logic executes.
- **FR-008**: Valid input MUST be passed to the service layer as validated, typed data.
- **FR-009**: The project MUST depend on a single database client, with unused redundant clients
  removed.
- **FR-010**: All existing API endpoints MUST preserve their current request and response
  contracts (no observable behavior change for the client application).
- **FR-011**: Shared data contracts used by both client and server MUST remain defined in the
  shared module.

### Key Entities *(include if feature involves data)*

_Not applicable: this feature restructures backend code organization and error handling and
introduces no new data entities. It operates on the existing family member, relationship, and
event entities without changing their shape._

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of API endpoints return the same consistent error shape for validation,
  not-found, and unexpected-error conditions in testing.
- **SC-002**: 0 handled errors cause the server process to terminate; the server remains
  responsive after any error condition in testing.
- **SC-003**: 100% of business logic paths are invocable and testable through the service layer
  without starting the HTTP server.
- **SC-004**: Domain rules (self-relationship prevention, duplicate-relationship prevention,
  referenced-member existence, and valid type/status enums) are enforced and covered by tests,
  with violations rejected 100% of the time.
- **SC-005**: The number of database client dependencies is reduced to exactly 1.
- **SC-006**: 100% of existing endpoint contracts are preserved, verified by the existing and
  updated test suite passing with no contract changes.

## Assumptions

- The established Express, PostgreSQL, Drizzle ORM, and Zod stack is retained per the project
  constitution; this feature reorganizes backend code and does not replace the stack.
- The database client to retain is the one currently used by the server and tooling
  (`postgres` / `drizzle-orm/postgres-js`); the unused `@neondatabase/serverless` and `pg`
  clients are the candidates for removal, confirmed during planning.
- Existing Zod schemas in the shared module are reused as the basis for boundary validation.
- This work is behavior-preserving for API consumers; the responsive UI and other features are
  unaffected.
- Explicit non-goals: adding new endpoints or business capabilities, changing the database
  schema, adding caching or pagination, and introducing authentication (tracked separately) are
  out of scope for this feature.
