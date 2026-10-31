# Quickstart: Validating the Canvas Workspace

## Prerequisites

```bash
npm install            # after new deps are added
cp .env.example .env   # DATABASE_URL for local Postgres
npm run db:push
```

## Automated checks

```bash
npm run check          # TypeScript
npx vitest run         # unit + integration + one jsdom component test
```

Expected: batch-positions, restore, link-validation, `toFlow`, `layout`, undo-stack tests pass.

## Manual validation (`npm run dev`)

1. **Layout (US5)**: Desktop shows no sidebar; toolbar, top bar, zoom panel, minimap visible.
   Resize <768px → bottom toolbar; select a member → bottom drawer inspector.
2. **Drag (US6, SC-009)**: At 25%, 100%, 300% zoom, drag a member — it stays under the cursor;
   edges follow live; reload confirms position saved (network tab shows one request).
3. **Connect**: Drag from bottom handle of A to B → chooser → child link. Try A→A, duplicate, and
   a cycle → inline "not allowed", no request sent. Drag to empty canvas → add-person flow.
4. **Palette**: Ctrl/Cmd+K, type a name, Enter → centered and selected. Run Auto-arrange, Fit, Export.
5. **Undo (US7)**: Move, delete a member with relationships, Ctrl/Cmd+Z → member and links return
   with the same ids; Redo removes again. Auto-arrange then Undo restores positions.
6. **Zoom levels (US8)**: Zoom through <40%, 40–100%, >100% — card size constant, detail changes.
   Focus, collapse a branch (+N badge), reload — view/settings/collapse restored.
7. **Export**: PNG and SVG contain the full tree.
8. **Touch/a11y**: On a touch device/emulator pan, pinch, long-press menu. Keyboard: Tab to a
   member, arrows nudge, Enter inspector, Delete + undo toast. Enable reduced motion → no animation.
9. **Perf**: Load the dev stress fixture (200 / 500 members) and confirm drag/zoom ≥60 / ≥30 fps in
   the browser performance panel.

Contracts: [ui-interaction.md](contracts/ui-interaction.md), [api.md](contracts/api.md).
Data: [data-model.md](data-model.md).
