# Feature Specification: Member Search and Filtering

**Feature Branch**: `002-member-search-filtering`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "redo and check if new specs are required" — derived from the
P1 enhancement backlog in `specs/001-core-family-tree/spec.md` (FR-012), which calls for
member search and filtering as the family tree grows.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a Person by Name (Priority: P1)

As a family historian with a large tree, I can search for a person by name so I can
locate and focus on them without scrolling the whole tree.

**Why this priority**: Locating people quickly is the most common need once a tree
grows beyond a single screen, and it unblocks every other management task.

**Independent Test**: Enter part of a person's name, confirm matching people are listed,
select a result, and confirm the tree or detail view focuses on that person.

**Acceptance Scenarios**:

1. **Given** a tree with many people, **When** a user types part of a name,
   **Then** only people whose name matches are shown as results.
2. **Given** search results, **When** a user selects a result,
   **Then** the application highlights or navigates to that person.
3. **Given** a search with no matches, **When** results are computed,
   **Then** the user sees a clear "no matches" state rather than an empty screen.

### User Story 2 - Filter People by Attributes (Priority: P2)

As a family historian, I can filter people by attributes such as living status, birth
period, or location so I can narrow a large tree to a relevant subset.

**Why this priority**: Filtering supports research tasks like reviewing a generation or
a branch, but it depends on the core search experience existing first.

**Independent Test**: Apply a single filter, confirm only matching people remain, combine
a second filter, and confirm results narrow further.

**Acceptance Scenarios**:

1. **Given** people with varied attributes, **When** a user applies a filter,
   **Then** only people matching that filter are shown.
2. **Given** an active filter, **When** a user applies an additional filter,
   **Then** results reflect all active filters combined.
3. **Given** active filters, **When** a user clears them,
   **Then** the full set of people is shown again.

### User Story 3 - Combine Search With Filters (Priority: P3)

As a family historian, I can combine a text search with active filters so I can pinpoint
a specific person within a narrowed subset.

**Why this priority**: This refinement adds convenience for advanced research but is not
required for the core value of finding and narrowing.

**Acceptance Scenarios**:

1. **Given** an active filter set, **When** a user also enters a search term,
   **Then** results match both the search term and the filters.
2. **Given** a combined query with no matches, **When** results are computed,
   **Then** the user is told no people match and how to broaden the query.

### Edge Cases

- A search term may match no people, one person, or many people.
- People may have missing names, dates, or locations and MUST be handled without error
  and excluded only from filters that depend on the missing attribute.
- Search input may contain extra spaces, mixed case, or partial tokens.
- A very large result set MUST remain readable and performant.
- Applied filters MUST have an obvious way to be cleared or reset.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to search family members by name and see a list of
  matching people.
- **FR-002**: Search MUST match partial, case-insensitive input and ignore surrounding
  whitespace.
- **FR-003**: The system MUST let a user act on a search result to focus or navigate to
  the corresponding person.
- **FR-004**: The system MUST provide a clear empty state when no people match a search
  or filter.
- **FR-005**: Users MUST be able to filter people by at least living status, birth time
  period, and location.
- **FR-006**: The system MUST allow multiple active filters to be combined and MUST allow
  filters to be cleared.
- **FR-007**: The system MUST allow search and filters to be combined into a single
  narrowed result set.
- **FR-008**: The system MUST handle members with missing searchable or filterable
  attributes without error and exclude them only from dependent filters.
- **FR-009**: The system MUST keep search and filtering usable at supported desktop and
  mobile sizes and reachable by keyboard.

### Key Entities *(include if feature involves data)*

- **Family member**: The existing person record whose name, life dates, living status,
  and location are used as searchable and filterable attributes.
- **Search query**: The user-entered text used to match people.
- **Filter set**: The collection of active attribute filters applied to the people list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a tree of 100 people, a user can locate a specific person by name in
  under 15 seconds.
- **SC-002**: At least 95% of name searches return their matching people for the first
  visible screen of results within 1 second.
- **SC-003**: At least 90% of first-time users can find a named person and narrow the
  list with a filter without assistance in usability testing.
- **SC-004**: Search and filtering remain fully usable at supported mobile and desktop
  sizes and reachable without a pointer.
- **SC-005**: No search or filter input produces an application error, including empty,
  whitespace-only, or unmatched queries.

## Assumptions

- This feature operates on the existing single family tree and existing member data;
  it does not introduce accounts, sharing, or new persisted entities.
- People with unknown attributes remain valid and are excluded only from filters that
  require the missing attribute, never hidden from unrelated searches.
- Search and filtering are read-only discovery aids and do not modify member data.
- This feature builds on the baseline documented in
  [../001-core-family-tree/spec.md](../001-core-family-tree/spec.md) and inherits its
  responsive and accessibility expectations.
