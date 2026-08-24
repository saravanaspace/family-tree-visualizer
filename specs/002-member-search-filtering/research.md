# Phase 0 Research: Member Search and Filtering

## Decision: Client-side search over the loaded tree (default)

- **Decision**: Perform search and filtering in a memoized client hook over the family tree data
  already fetched via TanStack Query.
- **Rationale**: The whole tree is already loaded for visualization; client filtering gives
  instant results with no new endpoint and meets the 1s target for hundreds of members.
- **Alternatives considered**: server search for every keystroke (network latency, more surface);
  deferred as an optional scale path.

## Decision: Matching semantics

- **Decision**: Case-insensitive, accent-insensitive, whitespace-trimmed substring matching across
  name fields; filters for living status, birth period, and location.
- **Rationale**: Matches FR-002 and typical user expectations; avoids surprising exact-match gaps.
- **Alternatives considered**: fuzzy ranking (added complexity, not required for this scope; can be
  layered later).

## Decision: Missing attributes handling

- **Decision**: Members with a missing filtered attribute are excluded only from that specific
  filter, never hidden from unrelated name searches.
- **Rationale**: FR-008; unknown values must not disappear from discovery.
- **Alternatives considered**: exclude incomplete members globally (loses data from view).

## Decision: Result interaction

- **Decision**: Selecting a result focuses/navigates to the member using existing selection state
  in `family-tree.tsx`.
- **Rationale**: Reuses established selection behavior; FR-003.

## Decision: Optional server endpoint for scale

- **Decision**: If needed later, add `GET /api/search?q=&filters` backed by a `searchFamilyTree`
  storage method, with a shared response type.
- **Rationale**: Keeps a clean upgrade path without changing the client contract.

## Open Items

- Exact filter set beyond living/birth-period/location can grow during tasks.
