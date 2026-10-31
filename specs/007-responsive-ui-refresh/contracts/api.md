# API Contract Additions

Existing endpoints are unchanged except relationship `type` accepting `guardian` and relationship
creation rejecting parent-child cycles (400). Schemas live in `shared/schema.ts`.

## PATCH /api/family-members/positions

Batch-update positions in one transaction.

Request:
```json
{ "positions": [ { "id": 1, "x": 120.5, "y": 300 } ] }
```
Validation: 1–1000 items; `id` positive int, unique within request; `x`,`y` finite, |v| ≤ 1e6.

| Status | Meaning |
|--------|---------|
| 200 | `{ "updated": <count> }` |
| 400 | Invalid body (`message`, Zod `error` issues) — nothing written |
| 404 | Any id not found — nothing written |

Route MUST be registered before `/api/family-members/:id/position` and `/:id` patterns so
`positions` is not parsed as an id.

## POST /api/family-members/restore

Recreate a deleted member (original id) with its relationships and events, atomically.

Request:
```json
{ "member": { "id": 7, "firstName": "…", "x": 0, "y": 0, "…": "…" },
  "relationships": [ { "id": 12, "fromMemberId": 7, "toMemberId": 3, "type": "spouse" } ],
  "events": [ { "id": 4, "type": "birth", "memberIds": [7] } ] }
```
Validation: member via existing insert schema + positive int `id`; each relationship validated by
`insertRelationshipSchema` + `id`, must reference `member.id` and an existing member, no duplicate
pair/type; each event validated by `insertFamilyEventSchema` + `id`, `memberIds` must include
`member.id` and otherwise reference existing members; ≤500 relationships, ≤500 events.

| Status | Meaning |
|--------|---------|
| 201 | Restored `{ member, relationships, events }` |
| 400 | Invalid body or dangling reference — nothing written |
| 409 | Member id already exists (or relationship/event id collision) |

Errors MUST NOT echo full request bodies. Both endpoints MUST sit behind the shared auth
middleware when spec 003 lands.
