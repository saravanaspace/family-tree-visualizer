# Quickstart & Validation Guide: Responsive UI Refresh

This guide validates that the responsive UI refresh meets its spec and contract. It is a
run/verify guide; implementation details live in `tasks.md` and the code.

## Prerequisites

- Node dependencies installed (`npm install`).
- Local database configured per the repository README (for running the app end to end).
- Dev-only test tooling added during implementation: jsdom, `@testing-library/react`,
  `@testing-library/user-event`, `jest-axe`.

## Run the app

```powershell
npm run dev
```

Open the app and use browser device emulation to exercise phone, tablet, and desktop widths.

## Automated checks

```powershell
npm run check      # TypeScript must pass
npm test           # Vitest: component, interaction, and a11y tests must pass
```

Automated coverage to expect (added during implementation):
- Layout: no primary control hidden/clipped/overlapped across breakpoints (contract C-L1..C-L4).
- Gestures: pointer pan, pinch/Ctrl-scroll zoom about focal point, scroll-pan, space/middle-drag
  pan, and card drag persists once (C-G1..C-G7).
- Navigation: zoom indicator, zoom-to-fit-all/selection, and minimap reposition (C-N1..C-N4).
- Selection: click select/clear, marquee multi-select, group move persists per member, and
  contextual toolbar actions (C-S1..C-S4).
- Keyboard: focus reachability and canvas member navigation/selection (C-A1..C-A2).
- Accessibility: `jest-axe` has no violations on core surfaces; reduced-motion honored
  (C-A3..C-A5).

## Manual validation checklist (device nuances jsdom cannot cover)

1. On a phone width, open and dismiss the sidebar drawer without covering the active task.
2. Pan with one finger and pinch-zoom with two; on a trackpad, two-finger swipe to pan and
   Ctrl/Cmd+scroll to zoom about the pointer; confirm the page itself does not scroll during
   canvas gestures.
3. Confirm momentum panning feels smooth and stops cleanly, and that it is disabled when the OS
   "reduce motion" setting is on.
4. Use the zoom control: confirm the percentage updates, and that fit-all and fit-selection frame
   content with padding, including sensible behavior on an empty or single-member tree.
5. Use the minimap to jump across a large tree by clicking and dragging the viewport rectangle.
6. Marquee-select several members and move them together; confirm positions persist after reload.
7. With a selection active, use the contextual toolbar to add a relation, edit, and delete.
8. Confirm zoom, fit, view-toggle, and minimap controls form non-overlapping groups at any width.
9. Tab through the app; confirm visible focus and full keyboard operation, including selecting a
   member on the canvas and reaching the contextual toolbar.
10. Rotate the device; confirm the current view and selection are preserved.

## Expected outcome

- All acceptance scenarios in [spec.md](spec.md) pass.
- All contract items in [contracts/ui-interaction.md](contracts/ui-interaction.md) are satisfied.
- No regression to existing baseline tree, timeline, and member-management behavior.
