import dagre from '@dagrejs/dagre';
import type { Relationship } from '@shared/schema';
import { CARD_SIZE, LAYOUT_GAP } from './constants';

type Rel = Pick<Relationship, 'fromMemberId' | 'toMemberId' | 'type'>;

export type Positions = Map<number, { x: number; y: number }>;

/**
 * Couples (connected spouse groups) are laid out as one unit so partners stay adjacent;
 * units are ranked by generation with dagre. Returns top-left positions.
 */
export function layoutTree(memberIds: ReadonlyArray<number>, rels: ReadonlyArray<Rel>): Positions {
  const ids = [...memberIds].sort((a, b) => a - b);
  const idSet = new Set(ids);

  const spouseLinks = new Map<number, Set<number>>();
  for (const r of rels) {
    if (r.type !== 'spouse' || !idSet.has(r.fromMemberId) || !idSet.has(r.toMemberId)) continue;
    if (r.fromMemberId === r.toMemberId) continue;
    (spouseLinks.get(r.fromMemberId) ?? spouseLinks.set(r.fromMemberId, new Set()).get(r.fromMemberId)!).add(r.toMemberId);
    (spouseLinks.get(r.toMemberId) ?? spouseLinks.set(r.toMemberId, new Set()).get(r.toMemberId)!).add(r.fromMemberId);
  }

  // Group members into spouse components.
  const unitOf = new Map<number, number>();
  const units: number[][] = [];
  for (const id of ids) {
    if (unitOf.has(id)) continue;
    const component: number[] = [];
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      if (unitOf.has(cur)) continue;
      unitOf.set(cur, units.length);
      component.push(cur);
      spouseLinks.get(cur)?.forEach((n) => stack.push(n));
    }
    units.push(orderUnit(component, spouseLinks));
  }

  const g = new dagre.graphlib.Graph({ multigraph: false });
  g.setGraph({ rankdir: 'TB', nodesep: LAYOUT_GAP.x, ranksep: LAYOUT_GAP.y, marginx: 0, marginy: 0 });
  g.setDefaultEdgeLabel(() => ({}));

  const unitWidth = (u: number[]) => u.length * CARD_SIZE.width + (u.length - 1) * LAYOUT_GAP.x;
  units.forEach((u, i) => g.setNode(String(i), { width: unitWidth(u), height: CARD_SIZE.height }));

  const edgeSet = new Set<string>();
  const children = new Map<number, number[]>();
  for (const r of [...rels].sort((a, b) => a.fromMemberId - b.fromMemberId || a.toMemberId - b.toMemberId)) {
    if (r.type !== 'parent-child') continue;
    const from = unitOf.get(r.fromMemberId);
    const to = unitOf.get(r.toMemberId);
    if (from === undefined || to === undefined || from === to) continue;
    const key = `${from}>${to}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    (children.get(from) ?? children.set(from, []).get(from)!).push(to);
  }

  // Skip edges that would close a loop (e.g. a couple whose partner is also their own descendant)
  // so every remaining edge is ranked strictly top-down.
  const state = new Map<number, 1 | 2>();
  const visit = (u: number) => {
    state.set(u, 1);
    for (const c of children.get(u) ?? []) {
      if (state.get(c) === 1) continue;
      g.setEdge(String(u), String(c));
      if (!state.has(c)) visit(c);
    }
    state.set(u, 2);
  };
  units.forEach((_, i) => state.has(i) || visit(i));

  dagre.layout(g);

  const positions: Positions = new Map();
  units.forEach((u, i) => {
    const node = g.node(String(i));
    const left = node.x - unitWidth(u) / 2;
    const top = node.y - CARD_SIZE.height / 2;
    u.forEach((id, idx) => {
      positions.set(id, {
        x: Math.round(left + idx * (CARD_SIZE.width + LAYOUT_GAP.x)),
        y: Math.round(top),
      });
    });
  });
  return positions;
}

/** Puts the person with the most partners in the middle so each partner sits next to them. */
function orderUnit(component: number[], links: Map<number, Set<number>>): number[] {
  if (component.length <= 2) return [...component].sort((a, b) => a - b);
  const hub = [...component].sort((a, b) => (links.get(b)?.size ?? 0) - (links.get(a)?.size ?? 0) || a - b)[0];
  const others = component.filter((id) => id !== hub).sort((a, b) => a - b);
  const mid = Math.ceil(others.length / 2);
  return [...others.slice(0, mid), hub, ...others.slice(mid)];
}
