# Service Interface Contract: Backend Service Architecture and Reliability

**Feature**: 009-backend-service-architecture | **Date**: 2026-08-24

Defines the transport-independent service operations that route handlers delegate to. Each
operation is callable directly (no HTTP) so domain rules are unit-testable (FR-004, SC-003).
Signatures are indicative; exact types derive from `shared/schema.ts`.

## memberService

| Operation | Input | Returns | Errors |
|-----------|-------|---------|--------|
| `getFamilyTree()` | — | tree data (members, relationships, events) | — |
| `createMember(data: InsertFamilyMember)` | validated member | created member | `ValidationError` |
| `updateMember(id, data: Partial<InsertFamilyMember>)` | id + partial | updated member | `NotFoundError`, `ValidationError` |
| `updateMemberPosition(id, x, y)` | id + coords | updated member | `NotFoundError`, `ValidationError` |
| `deleteMember(id)` | id | void | `NotFoundError` |

## relationshipService

| Operation | Input | Returns | Errors |
|-----------|-------|---------|--------|
| `createRelationship(data: InsertRelationship)` | validated relationship | created relationship | `ValidationError` (self-relationship, invalid enum, missing member), `ConflictError` (duplicate) |
| `updateRelationship(id, data)` | id + partial | updated relationship | `NotFoundError`, `ValidationError` |
| `deleteRelationship(id)` | id | void | `NotFoundError` |

## eventService

| Operation | Input | Returns | Errors |
|-----------|-------|---------|--------|
| `createEvent(data: InsertFamilyEvent)` | validated event | created event | `ValidationError` (missing referenced member) |
| `getEvents(memberIds?)` | optional id list | events | `ValidationError` (bad query) |
| `deleteEvent(id)` | id | void | `NotFoundError` |

## Contract rules

- **Transport independence**: no service function references `req`/`res` or HTTP concepts.
- **Persistence delegation**: services call the existing `storage` module; they do not open their
  own DB connections.
- **Rule enforcement location**: domain rules (see [data-model.md](../data-model.md)) live in the
  service, so they hold regardless of the caller (route or test).
- **Validation boundary**: route handlers run `validate(schema)` before calling a service, so
  services receive already-parsed, typed input; services still enforce cross-record rules
  (existence, duplicates) that schemas cannot express.

## Handler delegation pattern (transport-only)

```text
router.post('/api/relationships',
  validate(insertRelationshipSchema),           // boundary validation
  asyncHandler(async (req, res) => {            // forwards async errors
    const created = await relationshipService.createRelationship(req.validated);
    res.json(created);                          // preserve 200 + existing body
  })
);
// central error-handler middleware mounted last maps thrown errors → { message, error? }
```
