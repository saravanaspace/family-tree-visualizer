# Research: Responsive UI Refresh & Canvas Workspace

All Technical Context unknowns resolved. Format: Decision / Rationale / Alternatives.

## R-1 Canvas engine
- **Decision**: `@xyflow/react` (React Flow 12).
- **Rationale**: Built-in pan/zoom (cursor-anchored), pinch, `panOnScroll`, marquee selection,
  handles + `onConnect`, `MiniMap`, `fitView`, snap grid, `onlyRenderVisibleElements`, custom
  nodes/edges, MIT licence. Maps 1:1 to `members → nodes`, `relationships → edges`.
- **Alternatives**: tldraw (heavy, production licence terms); d3-zoom + custom (re-creates
  current bugs); keep custom canvas (rejected by grilling Q1).

## R-2 Wheel scheme
- **Decision**: Default whiteboard scheme: `panOnScroll=true`, zoom on Ctrl/Cmd+wheel and pinch,
  pan with Space/middle drag or hand tool. Setting switches to `zoomOnScroll` scheme. Stored in `localStorage`.
- **Rationale**: Matches FR-012/FR-034 and trackpad expectations.

## R-3 Couple junction (union node)
- **Decision**: Derive a client-only `UnionNode` per spouse relationship; parent-child edges
  from a couple's shared children originate at the junction. Single parents link directly.
- **Rationale**: No schema change; replaces the old "midpoint if y within 20px" heuristic.
- **Alternatives**: Persist unions table (migration, out of scope).

## R-4 Auto-layout
- **Decision**: `@dagrejs/dagre` behind `layout(nodes, edges): Positions` in `lib/layout.ts`
  (top→bottom, union nodes as rank-between nodes, partners same rank). Swap to `elkjs` only if
  multi-spouse/half-sibling ordering is poor.
- **Rationale**: Small, synchronous, adequate for <500 nodes.

## R-5 Undo/redo
- **Decision**: In-memory command stack of inverse operations (move, add, delete, connect,
  edge-delete, auto-arrange). Max depth 100. Reset on reload.
- **Delete undo**: snapshot `{member, relationships, events}` before delete; undo calls the
  restore endpoint (R-8); redo re-deletes.
- **Rationale**: Per-session scope agreed in grilling Q8.

## R-6 Optimistic persistence
- **Decision**: Update TanStack Query cache via `setQueryData` on drag stop/mutations; send
  mutation; on error roll back to snapshot and toast. Stop invalidating the whole tree on every move.
- **Rationale**: Removes flicker/refetch and satisfies "save once per move".

## R-7 Semantic zoom & export & persistence
- **Semantic zoom**: `useStore` zoom selector with three thresholds (0.4, 1.0); PersonNode
  renders one of three variants in a constant 256×128 footprint (shared `CARD_SIZE`).
- **Export**: `html-to-image` `toPng`/`toSvg` on the viewport after computing bounds with
  `getNodesBounds` + `getViewportForBounds` (React Flow documented pattern). PDF deferred.
- **Persistence**: `localStorage` keys `ftv.viewport`, `ftv.settings`, `ftv.collapsed`;
  validated with Zod on read, fall back to defaults on corruption.

## R-8 API additions and security (Principle VI)
- **Batch positions** `PATCH /api/family-members/positions`: body `{ positions: [{id,x,y}] }`;
  Zod: 1–1000 items, positive int ids, finite numbers within ±1e6, no duplicate ids;
  single DB transaction; 404/400 → no partial writes.
- **Restore** `POST /api/family-members/restore`: body `{ member, relationships, events }`
  from a client snapshot. Risks: forged snapshot, id collision, referencing non-existent members.
  Mitigation: Zod-validate every field with the existing insert schemas plus explicit ids;
  require relationships to reference the restored member and an existing member; reject if member
  id already exists (409); events must include the restored member id and only existing members;
  run in a transaction; cap sizes (≤500 relationships, ≤500 events); do not echo input in errors.
  Serial sequence is unaffected because restored ids are lower than the sequence.
- **Auth**: none exists yet (spec 003). Endpoints follow the existing unauthenticated pattern and
  MUST adopt shared auth middleware when it lands. Documented as accepted exception for now.
- **XSS**: member text is rendered by React (auto-escaped); export uses DOM clone only.

## R-9 `guardian` relationship type mismatch
- **Finding**: client styles/actions reference `guardian`, schema enum lacks it.
- **Decision**: Add `'guardian'` to `insertRelationshipSchema` type enum (additive; DB column is
  varchar so no migration). ConnectPopover offers: parent, child, partner (spouse), guardian, with
  subtypes biological/adopted/foster/step/legal for parent-child.

## R-10 Link validation (client, pure)
- Block: self-link; duplicate of same (from,to,type) or reverse spouse pair; parent-child cycles
  (DFS over parent-child edges). Server keeps unique index as source of truth; client surfaces
  409/400 as errors with rollback.
- Note: no server cycle check exists today; adding one is a task (server returns 400), since the
  client check alone is bypassable.

## R-11 Testing approach
- Pure modules in `node` env (existing config). One jsdom component test for drag-to-connect via
  Testing Library using per-file `@vitest-environment jsdom`; React Flow requires
  `ResizeObserver`/`DOMMatrixReadOnly` stubs in test setup. Perf (200/500 nodes) measured with a
  dev-only fixture, manually verified, not CI-gated.

## R-12 Mobile / touch
- React Flow handles one-finger pan, pinch zoom. Chrome adaptation uses existing `use-mobile`
  hook: bottom toolbar, `ui/drawer.tsx` inspector. Handles enlarged to ≥44px hit area via CSS on
  coarse pointers. Long-press → context menu through Radix ContextMenu.
