import { CARD_SIZE } from './constants';

export interface Rect { id: number; x: number; y: number }

export interface Guides { x?: number; y?: number }

/** Finds graph-space lines where the dragged card's edges/centre line up with another card within `threshold`. */
export function findGuides(dragged: Rect, others: ReadonlyArray<Rect>, threshold = 6): Guides {
  const dx = [dragged.x, dragged.x + CARD_SIZE.width / 2, dragged.x + CARD_SIZE.width];
  const dy = [dragged.y, dragged.y + CARD_SIZE.height / 2, dragged.y + CARD_SIZE.height];
  let bestX: { d: number; at: number } | undefined;
  let bestY: { d: number; at: number } | undefined;

  for (const o of others) {
    if (o.id === dragged.id) continue;
    const ox = [o.x, o.x + CARD_SIZE.width / 2, o.x + CARD_SIZE.width];
    const oy = [o.y, o.y + CARD_SIZE.height / 2, o.y + CARD_SIZE.height];
    for (const a of dx) for (const b of ox) {
      const d = Math.abs(a - b);
      if (d <= threshold && (!bestX || d < bestX.d)) bestX = { d, at: b };
    }
    for (const a of dy) for (const b of oy) {
      const d = Math.abs(a - b);
      if (d <= threshold && (!bestY || d < bestY.d)) bestY = { d, at: b };
    }
  }
  return { x: bestX?.at, y: bestY?.at };
}
