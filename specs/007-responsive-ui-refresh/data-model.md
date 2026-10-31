# Data Model: Responsive UI Refresh & Canvas Workspace

No database schema changes. Persistent entities (`family_members`, `relationships`,
`family_events`) are unchanged. One additive shared-enum change: relationship `type` gains
`'guardian'` (varchar column, no migration).

## Derived (client-only) entities

| Entity | Fields | Source / rules |
|--------|--------|----------------|
| PersonNode | id=`m:{memberId}`, position `{x,y}` (= member x,y), data `{member, detailLevel, collapsed, dimmed}` | One per member; footprint fixed 256×128 |
| UnionNode | id=`u:{spouseRelId}`, position = midpoint below partners, data `{partnerIds}` | One per `spouse` relationship; not saved; not draggable |
| RelationshipEdge | id=`r:{relId}`, source, target, data `{type, subType, status, label}` | Parent-child edges from shared children originate at UnionNode; style from edge-style map (spouse red/gray, biological blue, adopted green, foster/guardian purple dashed, divorced dashed) |
| ViewSettings | `{zoom, panX, panY, snap, minimap, wheelScheme}` | `localStorage` `ftv.viewport`/`ftv.settings`; Zod-validated on read; defaults on failure |
| CollapsedSet | `number[]` member ids whose descendants are hidden | `localStorage` `ftv.collapsed` |
| UndoCommand | `{label, undo(): Promise, redo(): Promise}` | In-memory stack, depth ≤100, cleared on reload |
| DeleteSnapshot | `{member, relationships[], events[]}` | Captured before delete for undo/restore |

## Validation rules

- Link validity (`validateLink`): reject self-link; reject duplicate `(from,to,type)` and reversed
  spouse pair; reject parent-child cycles. Returns `{ok:true} | {ok:false, reason}`.
- Positions: finite numbers, |value| ≤ 1,000,000.
- Collapse: a collapsed member hides all descendants (via parent-child edges) transitively; a
  descendant with another non-collapsed parent chain remains visible only if that path is visible.

## State transitions

- Drag: `idle → dragging` (local node position, live edges) `→ released` (optimistic cache update,
  one save, push UndoCommand) `→ saved | rolled back`.
- Connect: `handle drag → target (member | empty)` → validate → chooser → create (optimistic) →
  push UndoCommand.
- Delete: snapshot → optimistic remove → DELETE → toast(Undo) → undo = restore endpoint.
- Auto-arrange: compute positions → animate → single batch save → one UndoCommand (old positions).
