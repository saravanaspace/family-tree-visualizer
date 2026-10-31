# Canvas-First UI Redesign (Miro / n8n style) — Proposal

Goal: turn the tree view into an infinite, freely draggable whiteboard-style canvas, with minimal chrome, floating tools, and smooth interaction.

## 1. Current State (review findings)

| Area | File | Finding |
|---|---|---|
| Canvas | `client/src/components/family-tree-canvas.tsx` | Hand-rolled pan/zoom with CSS `scale() translate()`; edges drawn imperatively via `svg.innerHTML` + `createElementNS` in a `useEffect`. Straight `<line>` edges only. No React rendering of edges, no hit-testing, no selection of edges. |
| Zoom | same | Wheel zoom is not cursor-anchored (zooms toward origin); `scale` clamped 0.1–3 in canvas but 0.5–2 in page (`handleZoom`) — inconsistent. Transform order `scale(s) translate(px,py)` makes pan speed depend on zoom. |
| Card drag | `family-member-card.tsx` | Uses raw `clientX/Y` minus `member.x/y`; **ignores zoom scale and pan**, so dragging is wrong when zoomed. Position saved only on mouse-up, then full `/api/family-tree` refetch (`invalidateQueries`) → flicker/lag; edges don't follow card during drag. Mouse-only (no touch/pointer events). |
| Layout | `pages/family-tree.tsx` | Fixed 320px left sidebar (`w-80`) + floating tab toggle + separate `ZoomControls` card; sidebar permanently consumes canvas space on desktop. `handleAutoAlign` (~130 lines) lives in the page component, custom tidy-tree algorithm, fires N separate PATCH requests, uses `fetch` directly instead of `apiRequest`. |
| Cards | `family-member-card.tsx` (283 lines) | Fixed 256×128 size hard-coded in 3 places (card, canvas, auto-align). Actions hidden in a kebab dropdown; no connection handles. |
| Relationships | `connect-members-modal.tsx` | Relationships created only via modal form. No drag-to-connect. |
| Missing | — | No minimap, no multi-select / marquee, no undo/redo, no snap/grid, no keyboard shortcuts, no fit-to-view, no export, no viewport persistence. |
| Perf | — | Every member re-renders on any pan/zoom state change (state lives in page); no virtualization; edges fully redrawn each change. |

## 2. Recommendation: adopt React Flow (`@xyflow/react`)

Building Miro/n8n behavior by hand (cursor-anchored zoom, touch, multi-select, handles, minimap, edge routing) is large and bug-prone. React Flow provides all of it, is MIT-licensed, React 18 compatible, and fits the existing model directly:

- `FamilyMember` → custom **node** (`x`,`y` already stored as position).
- `Relationship` → custom **edge** (type/subType/status map to the existing `getRelationshipStyle`).
- Built-ins: pan/zoom, pinch, `fitView`, `<MiniMap>`, `<Controls>`, `<Background variant="dots">`, snap-to-grid, multi-select/marquee, node resizing, keyboard delete, `onConnect` (drag-to-connect), `onNodeDragStop`.
- Auto layout: replace hand-written `handleAutoAlign` with `dagre` or `elkjs` (supports couples via a virtual "union" node), run client-side, persist in **one** batch request.

Alternative considered: `tldraw` (heavier, whiteboard-first, license constraints for production) and `d3-zoom` + custom (more work). Recommend React Flow.

New deps: `@xyflow/react`, `@dagrejs/dagre` (or `elkjs`). `framer-motion` already present for panel transitions.

## 3. Target UX

### 3.1 Layout (Miro-like floating chrome)
- Canvas fills 100% viewport; **no permanent sidebar**.
- **Top-left**: tree name / menu (view switch Tree ⇄ Timeline as segmented control).
- **Left floating vertical toolbar** (n8n/Miro style): Select, Pan (hand), Add person, Connect, Auto-layout, Undo/Redo.
- **Top-right**: search (⌘K command palette using existing `ui/command.tsx`), filters popover, share/export.
- **Bottom-left**: zoom −/+/%/fit controls + minimap.
- **Right-side collapsible inspector panel** (Sheet/resizable) opens on node selection: details, quick edit, relationships list. Replaces the sidebar stats/search and the edit modal for quick edits (full modal remains for advanced fields).
- Mobile: toolbar becomes bottom bar; inspector becomes bottom drawer (`ui/drawer.tsx`); pinch-zoom and one-finger pan supported natively.

### 3.2 Interactions
1. **Drag nodes freely** with correct zoom/pan math; edges follow live during drag (no refetch flicker).
2. **Cursor-anchored wheel zoom**, Ctrl/⌘+wheel or pinch to zoom, plain wheel / space+drag to pan (configurable Miro vs. n8n scheme).
3. **Connection handles** on each card (top = parent, bottom = child, sides = spouse). Drag from handle to another card → small popover to choose relationship type/subtype (replaces the modal for the common path). Dropping on empty canvas → "Add person here as child/spouse/parent".
4. **Hover quick-add buttons** (＋ above/below/side) on a selected card instead of the kebab menu.
5. **Multi-select / marquee**, group move, align & distribute helpers, snap-to-grid toggle with alignment guides.
6. **Right-click context menu** on node, edge, canvas (`ui/context-menu.tsx` already installed).
7. **Edge improvements**: smooth-step/bezier edges, marriage "union" node with children dropping from the couple midpoint (replaces the current midpoint heuristic), edge labels (status/dates), click edge to edit/delete relationship, dashed for divorced/foster per current style map.
8. **Undo/redo** (⌘Z / ⇧⌘Z) for move, add, delete, connect via a command stack.
9. **Keyboard**: `Del` delete, `Enter` edit, arrows nudge, `F` fit view, `0` reset, `/` search, `Space` pan.
10. **Focus tools**: click node → highlight ancestors/descendants, dim others; "focus on person" re-centers with animated `fitBounds`.
11. **Collapse/expand branches** to manage large trees.
12. **Persist viewport** (zoom/pan) in `localStorage`; first load runs `fitView`.

### 3.3 Visual design
- Dot-grid background, soft shadows, rounded 12px cards, consistent light/dark theme (tokens already in Tailwind config).
- Card variants by zoom level (semantic zoom): <40% → name-only pill; 40–100% → photo + name + dates; >100% → full detail. Improves legibility and perf for big trees.
- Gender color as left accent bar rather than full border; deceased shown with muted style; photo avatar prominent.
- Smooth `framer-motion` transitions for panels and auto-layout (animate node positions).
- Selection ring + resize-free fixed card size defined once in a shared `CARD_SIZE` constant.

## 4. Proposed Architecture

```
client/src/features/tree-canvas/
  TreeCanvas.tsx            # <ReactFlow> wrapper, handlers
  nodes/PersonNode.tsx      # replaces family-member-card.tsx
  nodes/UnionNode.tsx       # couple junction (tiny dot)
  edges/RelationshipEdge.tsx
  toolbar/{LeftToolbar,ZoomPanel,TopBar}.tsx
  inspector/InspectorPanel.tsx
  hooks/{useTreeGraph,useAutoLayout,useUndoRedo,useViewportPersist,useTreeShortcuts}.ts
  lib/{toFlow.ts,layout.ts,edgeStyle.ts,constants.ts}
```

- `toFlow.ts`: pure mapper `FamilyTreeData → {nodes, edges}` (unit-testable with vitest).
- State: React Flow store for viewport/selection; TanStack Query remains the server cache. Use **optimistic updates** (`setQueryData`) for position changes; debounce persistence on `onNodeDragStop`.
- Move auto-layout out of the page into `lib/layout.ts` (pure function, testable).
- Remove: `zoom-controls.tsx`, manual pan/zoom state in `family-tree.tsx`, imperative SVG drawing.

## 5. Backend changes
- Add `PATCH /api/family-members/positions` accepting `[{id,x,y}]` (single transaction) for drag-multiple and auto-layout; keep existing single endpoint. Validate with zod; reuse existing auth/logging middleware.
- Optional: store per-tree viewport/layout settings later (spec 003 collaboration).
- Optional: undo support is client-only; no schema changes needed.

## 6. Phased Delivery

| Phase | Scope | Outcome |
|---|---|---|
| 1 – Canvas foundation | Add React Flow; PersonNode, RelationshipEdge, toFlow mapper; pan/zoom/drag with correct math; background, controls, minimap; batch position endpoint | Smooth free drag, fixes zoom/drag bug |
| 2 – Chrome | Remove sidebar; floating toolbar, top bar, command-palette search, inspector panel, mobile drawer | Miro/n8n feel |
| 3 – Connections | Handles + drag-to-connect, union nodes, edge editing, context menus, hover quick-add | No modal needed for common flows |
| 4 – Power features | Multi-select, snap/guides, undo/redo, shortcuts, dagre/elk auto-layout w/ animation, focus/highlight, collapse branches, semantic zoom | Parity with whiteboard tools |
| 5 – Polish | Viewport persistence, export PNG/SVG/PDF, dark mode, a11y (keyboard nav, ARIA labels, reduced motion), perf test with 500+ nodes | Production quality |

## 7. Acceptance Criteria (draft)
- Dragging a card at any zoom/pan keeps it under the cursor; edges update live at ≥50 fps with 200 members.
- Wheel zoom anchors at cursor; zoom range consistent (10%–400%); pinch works on touch.
- User can create a parent/child/spouse link by dragging between cards without opening a modal.
- Auto-layout is one network request and animates; undo restores prior positions.
- Sidebar is gone on desktop; all former sidebar actions reachable via toolbar/palette/inspector.
- Positions persist across reload; viewport restored.
- Existing relationship styling (spouse red/dashed divorced, biological blue, adopted green, foster/guardian purple dashed) preserved.
- Unit tests for `toFlow` and `layout`; Playwright/vitest component test for drag-to-connect.

## 8. Risks / Open Questions
- Couple/union modeling: add virtual union nodes (client-only) vs. persist a `unions` table? Recommend client-only first.
- Multi-spouse and half-sibling layout in dagre — may need elkjs for better ordering.
- Pan/zoom scheme default: Miro (wheel = pan, ctrl+wheel = zoom) vs. n8n (wheel = zoom)? Suggest setting toggle.
- Relationship with spec `007-responsive-ui-refresh`: fold this proposal in as a new spec (e.g. `014-canvas-ui-redesign`) or amend 007.
- Bundle size (+~60 KB gz for React Flow); acceptable.
- Timeline view unaffected, but should adopt the same top bar/inspector.

## 9. Quick Wins (if not adopting React Flow immediately)
1. Divide drag deltas by `scale` in `family-member-card.tsx`.
2. Cursor-anchored zoom and unify clamp (0.1–3) between page and canvas.
3. Optimistic position update instead of full refetch.
4. Batch PATCH for auto-align; use `apiRequest`.
5. Extract `CARD_WIDTH/HEIGHT` constant.
6. Convert edges to React-rendered `<path>` (bezier) instead of `innerHTML`.
