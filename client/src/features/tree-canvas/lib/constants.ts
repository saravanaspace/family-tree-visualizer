export const CARD_SIZE = { width: 256, height: 128 } as const;

export const ZOOM = { min: 0.1, max: 4 } as const;

/** Zoom levels at which person cards switch detail variant. */
export const DETAIL_THRESHOLDS = { compact: 0.4, full: 1.0 } as const;

export const SNAP_GRID = 20;

export const UNION_SIZE = 12;

export const UNDO_DEPTH = 100;

export const LAYOUT_GAP = { x: 40, y: 80 } as const;

export const NUDGE = { small: 1, large: 10 } as const;

export const STORAGE_KEYS = {
  viewport: 'ftv.viewport',
  settings: 'ftv.settings',
  collapsed: 'ftv.collapsed',
} as const;

export type DetailLevel = 'minimal' | 'standard' | 'full';

export function detailLevelForZoom(zoom: number): DetailLevel {
  if (zoom < DETAIL_THRESHOLDS.compact) return 'minimal';
  if (zoom <= DETAIL_THRESHOLDS.full) return 'standard';
  return 'full';
}
