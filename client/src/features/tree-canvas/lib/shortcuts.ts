export type ShortcutAction =
  | 'palette'
  | 'fit'
  | 'reset-zoom'
  | 'open-inspector'
  | 'delete'
  | 'undo'
  | 'redo'
  | { type: 'nudge'; dx: number; dy: number };

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target?: EventTarget | null;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function isTypingTarget(target: EventTarget | null | undefined): boolean {
  const el = target as HTMLElement | null | undefined;
  if (!el || typeof el.closest !== 'function') return false;
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [cmdk-root]'));
}

/** Maps a key event to a canvas action per contracts/ui-interaction.md; null when not ours. */
export function matchShortcut(e: KeyLike): ShortcutAction | null {
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  if (mod && key === 'k') return 'palette';
  if (mod && key === 'z') return e.shiftKey ? 'redo' : 'undo';
  if (mod && key === 'y') return 'redo';

  // Everything below must not fire while typing or when a modifier is part of another shortcut.
  if (isTypingTarget(e.target) || mod || e.altKey) return null;

  if (e.key === '/') return 'palette';
  if (key === 'f') return 'fit';
  if (e.key === '0') return 'reset-zoom';
  if (e.key === 'Enter') return 'open-inspector';
  if (e.key === 'Delete' || e.key === 'Backspace') return 'delete';
  const arrow = ARROWS[e.key];
  if (arrow) {
    const step = e.shiftKey ? 10 : 1;
    return { type: 'nudge', dx: arrow[0] * step, dy: arrow[1] * step };
  }
  return null;
}
