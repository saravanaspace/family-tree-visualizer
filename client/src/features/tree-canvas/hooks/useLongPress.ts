import { useCallback, useEffect, useRef } from 'react';

export const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 8;

export interface LongPressPoint { x: number; y: number; target: EventTarget | null }

/** Touch long-press → callback (touch devices don't reliably fire contextmenu). Cancelled by movement or release. */
export function useLongPress(onLongPress: (point: LongPressPoint) => void, ms = LONG_PRESS_MS) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const origin = useRef<{ x: number; y: number } | null>(null);
  const cb = useRef(onLongPress);
  cb.current = onLongPress;

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    origin.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch' || !e.isPrimary) return;
      cancel();
      const point = { x: e.clientX, y: e.clientY, target: e.target };
      origin.current = point;
      timer.current = setTimeout(() => { origin.current = null; cb.current(point); }, ms);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const o = origin.current;
      if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > MOVE_TOLERANCE) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
  };
}
