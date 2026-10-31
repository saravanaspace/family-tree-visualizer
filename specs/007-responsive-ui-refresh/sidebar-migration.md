# Sidebar migration map (SC-013)

Every control and stat from the old `components/sidebar-controls.tsx` and its companions, and where it lives now.

| Old location | Old control | New location |
| --- | --- | --- |
| Sidebar | Add spouse | Select a person → quick action "Partner", right-click → "Add partner", or inspector "Partner" |
| Sidebar | Add child | Select a person → quick action "Child", right-click → "Add child", inspector "Child" |
| Sidebar | Add member (generic) | Left toolbar "Add person", palette "Add person", right-click canvas → "Add person here", empty-state button |
| Sidebar | Connect members | Left toolbar "Connect people" or palette "Connect people"; also drag from a card handle |
| Sidebar | Auto-align | Left toolbar "Auto-arrange", palette "Auto-arrange", right-click canvas |
| Sidebar stats card | Members / generations / couples | Top bar → Filters popover footer |
| Sidebar | Mobile open/close | Removed; mobile uses the bottom toolbar and bottom-sheet inspector |
| `zoom-controls.tsx` | Zoom in/out/reset | Zoom panel (bottom right), `0` resets, `F` fits |
| `family-member-card.tsx` | Card actions (edit, delete, add related) | Node quick-action toolbar, context menu, inspector |
| Header tabs | Tree / Timeline | Top bar view toggle |
| (none) | Search, filters | Top bar search (palette, Ctrl/Cmd+K) and Filters popover |
