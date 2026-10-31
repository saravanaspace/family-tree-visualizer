type Edge = { fromMemberId: number; toMemberId: number; type: string };

/** True when adding parent `from` → child `to` would make `from` its own ancestor. */
export function wouldCreateParentCycle(
  existing: ReadonlyArray<Edge>,
  from: number,
  to: number,
): boolean {
  if (from === to) return true;
  const children = new Map<number, number[]>();
  for (const r of existing) {
    if (r.type !== 'parent-child') continue;
    const list = children.get(r.fromMemberId) ?? [];
    list.push(r.toMemberId);
    children.set(r.fromMemberId, list);
  }
  // A cycle appears if `from` is already a descendant of `to`.
  const seen = new Set<number>();
  const stack = [to];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === from) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(children.get(id) ?? []));
  }
  return false;
}
