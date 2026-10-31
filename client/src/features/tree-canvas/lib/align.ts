import { CARD_SIZE, SNAP_GRID } from './constants';

export interface Box { id: number; x: number; y: number }

export type AlignMode = 'left' | 'right' | 'top' | 'bottom' | 'center-x' | 'center-y';

export function snap(value: number, grid = SNAP_GRID): number {
  return Math.round(value / grid) * grid + 0; // + 0 turns -0 into 0
}

export function alignBoxes(boxes: Box[], mode: AlignMode): Box[] {
  if (boxes.length < 2) return boxes;
  const xs = boxes.map((b) => b.x);
  const ys = boxes.map((b) => b.y);
  switch (mode) {
    case 'left': return boxes.map((b) => ({ ...b, x: Math.min(...xs) }));
    case 'right': return boxes.map((b) => ({ ...b, x: Math.max(...xs) }));
    case 'top': return boxes.map((b) => ({ ...b, y: Math.min(...ys) }));
    case 'bottom': return boxes.map((b) => ({ ...b, y: Math.max(...ys) }));
    case 'center-x': {
      const c = (Math.min(...xs) + Math.max(...xs)) / 2;
      return boxes.map((b) => ({ ...b, x: c }));
    }
    case 'center-y': {
      const c = (Math.min(...ys) + Math.max(...ys)) / 2;
      return boxes.map((b) => ({ ...b, y: c }));
    }
  }
}

/** Evenly spaces boxes between the outermost two along an axis; needs at least three. */
export function distributeBoxes(boxes: Box[], axis: 'x' | 'y'): Box[] {
  if (boxes.length < 3) return boxes;
  const sorted = [...boxes].sort((a, b) => a[axis] - b[axis]);
  const first = sorted[0][axis];
  const step = (sorted[sorted.length - 1][axis] - first) / (sorted.length - 1);
  return sorted.map((b, i) => ({ ...b, [axis]: first + step * i }));
}

/** Nudge distance for a given zoom is constant in graph units (1px / 10px with Shift). */
export function nudge(box: Box, dx: number, dy: number): Box {
  return { ...box, x: box.x + dx, y: box.y + dy };
}

export const CARD_CENTER = { x: CARD_SIZE.width / 2, y: CARD_SIZE.height / 2 };
