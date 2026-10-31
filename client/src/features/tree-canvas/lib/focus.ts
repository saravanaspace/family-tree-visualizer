import type { Relationship } from '@shared/schema';

type Rel = Pick<Relationship, 'fromMemberId' | 'toMemberId' | 'type'>;

export function childrenMap(rels: ReadonlyArray<Rel>): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const r of rels) {
    if (r.type !== 'parent-child') continue;
    const list = map.get(r.fromMemberId) ?? [];
    list.push(r.toMemberId);
    map.set(r.fromMemberId, list);
  }
  return map;
}

export function parentsMap(rels: ReadonlyArray<Rel>): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const r of rels) {
    if (r.type !== 'parent-child') continue;
    const list = map.get(r.toMemberId) ?? [];
    list.push(r.fromMemberId);
    map.set(r.toMemberId, list);
  }
  return map;
}

function reach(start: number, next: Map<number, number[]>): Set<number> {
  const seen = new Set<number>();
  const stack = [...(next.get(start) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === start || seen.has(id)) continue;
    seen.add(id);
    stack.push(...(next.get(id) ?? []));
  }
  return seen;
}

export function descendantsOf(id: number, rels: ReadonlyArray<Rel>): Set<number> {
  return reach(id, childrenMap(rels));
}

export function ancestorsOf(id: number, rels: ReadonlyArray<Rel>): Set<number> {
  return reach(id, parentsMap(rels));
}

/** Member plus direct-line ancestors/descendants and the partners of that line. */
export function focusSet(id: number, rels: ReadonlyArray<Rel>): Set<number> {
  const result = new Set<number>([id, ...Array.from(ancestorsOf(id, rels)), ...Array.from(descendantsOf(id, rels))]);
  for (const r of rels) {
    if (r.type === 'spouse' && (result.has(r.fromMemberId) || result.has(r.toMemberId))) {
      result.add(r.fromMemberId);
      result.add(r.toMemberId);
    }
  }
  return result;
}
