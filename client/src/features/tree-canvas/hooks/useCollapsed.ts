import { useCallback, useState } from 'react';
import { z } from 'zod';
import { readStored, writeStored } from '../lib/persist';
import { STORAGE_KEYS } from '../lib/constants';

const collapsedSchema = z.array(z.number().int().positive());

export function useCollapsed() {
  const [collapsed, setCollapsed] = useState<Set<number>>(
    () => new Set(readStored(STORAGE_KEYS.collapsed, collapsedSchema, [])),
  );

  const toggle = useCallback((id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      writeStored(STORAGE_KEYS.collapsed, Array.from(next));
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
