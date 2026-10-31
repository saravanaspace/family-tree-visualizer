# Data Model: Demo Mode with Dummy Data

No schema or migration changes. Demo mode reuses the existing entity types from `shared/schema.ts` (`FamilyMember`, `Relationship`, `FamilyEvent`, `FamilyTreeData`) held in memory.

## In-memory store (per process)

| Part | Description |
|------|-------------|
| members | Ordered list of `FamilyMember` |
| relationships | Ordered list of `Relationship` |
| events | Ordered list of `FamilyEvent` |
| nextId (member / relationship / event) | Counters, start at max sample id + 1, only ever increase |

## Sample dataset (FR-004, FR-005)

Small Johnson family, three generations, fixed canvas positions.

| Generation | Members |
|-----------|---------|
| 1 | Robert Johnson (living), Mary Johnson (living), Eleanor Johnson (deceased, with death date and place) |
| 2 | James Johnson, Sarah Johnson (spouse of James), Michael Johnson |
| 3 | Emily Johnson, William Johnson (children of James and Sarah) |

- Relationships: spouse (Robert-Mary, James-Sarah); parent-child (Eleanor-Robert, Robert/Mary-James, Robert/Mary-Michael, James/Sarah-Emily, James/Sarah-William).
- Events (at least 5, multiple types): two marriages, two births, one graduation, one other (art exhibition).
- Some members carry occupation, biography, and places; others omit them.

## Rules (parity with PostgreSQL storage)

- Relationship uniqueness: `(fromMemberId, toMemberId, type)`; duplicates rejected.
- Relationship references: both members must exist; otherwise rejected.
- Events: `memberIds` not validated against existing members.
- Delete member: also removes relationships where the member is either end, and events whose `memberIds` include the member.
- Not-found on update/delete: errors `Family member not found`, `Relationship not found`, `Event not found`.
- Ids are unique and never reused within a session, including after deletes. Reset restores the initial counters along with the sample dataset.
- Reads return copies; callers cannot mutate store state.

## State transitions

- Process start → Sample dataset loaded.
- Any write → store mutated, visible to all clients immediately.
- `POST /api/demo/reset` → store replaced with a fresh Sample dataset; counters restored.
- Process stop → everything discarded.
