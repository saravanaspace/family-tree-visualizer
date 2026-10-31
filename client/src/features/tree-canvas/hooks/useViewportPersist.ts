import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import type { Viewport } from '@xyflow/react';
import { readStored, writeStored } from '../lib/persist';
import { STORAGE_KEYS, ZOOM } from '../lib/constants';

export const viewportSchema = z.object({
  x: z.number().finite().min(-1e7).max(1e7),
  y: z.number().finite().min(-1e7).max(1e7),
  zoom: z.number().finite().min(ZOOM.min).max(ZOOM.max),
});

export const readViewport = (): Viewport | null => readStored<Viewport | null>(STORAGE_KEYS.viewport, viewportSchema, null);

export function useViewportPersist() {
  // Read once so the canvas mounts with the saved view; null means "fit on first visit".
  const saved = useMemo(readViewport, []);
  const save = useCallback((viewport: Viewport) => writeStored(STORAGE_KEYS.viewport, viewport), []);
  return { saved, save };
}
