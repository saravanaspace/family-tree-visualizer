import { Fragment, useEffect, useRef } from 'react';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

/** Minimal accessible context menu positioned at the pointer; closes on Escape or outside click. */
export function ContextMenu({ state, onClose }: { state: ContextMenuState | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    ref.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [state, onClose]);

  if (!state) return null;
  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ left: Math.min(state.x, window.innerWidth - 190), top: Math.min(state.y, window.innerHeight - 40 * state.items.length) }}
    >
      {state.items.map((item) => (
        <Fragment key={item.label}>
          {item.separatorBefore && <div role="separator" className="my-1 h-px bg-border" />}
          <button
            role="menuitem"
            disabled={item.disabled}
            className={`flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus:bg-accent disabled:opacity-50 ${item.destructive ? 'text-destructive' : ''}`}
            onClick={() => { onClose(); item.onSelect(); }}
          >
            {item.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
