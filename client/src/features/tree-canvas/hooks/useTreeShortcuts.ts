import { useEffect, useRef } from 'react';
import { matchShortcut, type ShortcutAction } from '../lib/shortcuts';

/** Window-level shortcuts; `enabled` lets modals/palette suspend them. */
export function useTreeShortcuts(handler: (action: ShortcutAction, event: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const action = matchShortcut(e);
      if (!action) return;
      e.preventDefault();
      ref.current(action, e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
