import { useCallback, useState } from 'react';
import { z } from 'zod';
import { readStored, writeStored } from '../lib/persist';
import { STORAGE_KEYS } from '../lib/constants';

export const settingsSchema = z.object({
  wheelScheme: z.enum(['whiteboard', 'alternate']),
  snap: z.boolean(),
  minimap: z.boolean(),
});

export type CanvasSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: CanvasSettings = { wheelScheme: 'alternate', snap: false, minimap: true };

export function useCanvasSettings() {
  const [settings, setSettings] = useState<CanvasSettings>(() =>
    readStored(STORAGE_KEYS.settings, settingsSchema, DEFAULT_SETTINGS));

  const update = useCallback((patch: Partial<CanvasSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeStored(STORAGE_KEYS.settings, next);
      return next;
    });
  }, []);

  return { settings, update };
}
