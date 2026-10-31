import type { Relationship } from '@shared/schema';
import { childrenMap, parentsMap } from './focus';

type Rel = Pick<Relationship, 'fromMemberId' | 'toMemberId' | 'type'>;

export interface CollapseResult {
  hidden: Set<number>;
  /** collapsed member id -> number of descendants hidden by it */
  hiddenCounts: Map<number, number>;
}

/**
 * A member is visible when it has no parents, or at least one parent that is itself visible and
 * not collapsed. So a descendant reachable through another expanded path stays visible.
 */
export function computeCollapse(
  memberIds: ReadonlyArray<number>,
  rels: ReadonlyArray<Rel>,
  collapsed: ReadonlySet<number>,
): CollapseResult {
  // Collapsing one partner collapses the couple, otherwise shared children stay visible via the other parent.
  const couple = new Set<number>(collapsed);
  for (const r of rels) {
    if (r.type !== 'spouse') continue;
    if (collapsed.has(r.fromMemberId)) couple.add(r.toMemberId);
    if (collapsed.has(r.toMemberId)) couple.add(r.fromMemberId);
  }
  const parents = parentsMap(rels);
  const children = childrenMap(rels);
  const visibleCache = new Map<number, boolean>();

  const isVisible = (id: number, path: Set<number>): boolean => {
    const cached = visibleCache.get(id);
    if (cached !== undefined) return cached;
    if (path.has(id)) return true; // defensive: malformed cyclic data
    const ps = parents.get(id) ?? [];
    let visible = ps.length === 0;
    if (!visible) {
      path.add(id);
      visible = ps.some((p) => !couple.has(p) && isVisible(p, path));
      path.delete(id);
    }
    visibleCache.set(id, visible);
    return visible;
  };

  const hidden = new Set<number>();
  for (const id of memberIds) if (!isVisible(id, new Set())) hidden.add(id);

  const hiddenCounts = new Map<number, number>();
  Array.from(collapsed).forEach((id) => {
    const seen = new Set<number>();
    const stack = [...(children.get(id) ?? [])];
    while (stack.length) {
      const c = stack.pop()!;
      if (seen.has(c)) continue;
      seen.add(c);
      stack.push(...(children.get(c) ?? []));
    }
    let count = 0;
    seen.forEach((c) => hidden.has(c) && count++);
    if (count > 0) hiddenCounts.set(id, count);
  });

  return { hidden, hiddenCounts };
}
