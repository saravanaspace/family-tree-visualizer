import type { Edge, Node } from '@xyflow/react';
import type { FamilyMember, FamilyTreeData, Relationship } from '@shared/schema';
import { CARD_SIZE, UNION_SIZE } from './constants';
import { computeCollapse } from './collapse';

export interface PersonNodeData extends Record<string, unknown> {
  member: FamilyMember;
  dimmed: boolean;
  collapsed: boolean;
  hiddenCount: number;
  hasChildren: boolean;
}

export interface UnionNodeData extends Record<string, unknown> {
  partnerIds: [number, number];
}

export interface RelationshipEdgeData extends Record<string, unknown> {
  /** All relationship rows this drawn edge stands for (shared children collapse two rows into one edge). */
  relationshipIds: number[];
  relationship: Pick<Relationship, 'type' | 'subType' | 'status' | 'startDate'>;
  dimmed: boolean;
}

export type PersonNode = Node<PersonNodeData, 'person'>;
export type UnionNode = Node<UnionNodeData, 'union'>;
export type FlowNode = PersonNode | UnionNode;
export type RelationshipEdge = Edge<RelationshipEdgeData, 'relationship'>;

export interface FlowOptions {
  collapsed?: ReadonlySet<number>;
  /** Members to keep emphasised; everything else is dimmed. */
  highlightIds?: ReadonlySet<number> | null;
}

export const memberNodeId = (id: number) => `m:${id}`;
export const unionNodeId = (relId: number) => `u:${relId}`;
export const memberIdFromNode = (nodeId: string): number | null =>
  nodeId.startsWith('m:') ? Number(nodeId.slice(2)) : null;

/** Junction sits midway between the partners' facing edges, level with their card centres. */
export function unionPosition(a: { x: number; y: number }, b: { x: number; y: number }) {
  const [left, right] = a.x <= b.x ? [a, b] : [b, a];
  return {
    x: (left.x + CARD_SIZE.width + right.x) / 2 - UNION_SIZE / 2,
    y: (a.y + b.y) / 2 + CARD_SIZE.height / 2 - UNION_SIZE / 2,
  };
}

/** Parent→child edges leave the side that faces the child, so a child placed above its parent doesn't loop around the card. */
function verticalHandles(sourceY: number, targetY: number) {
  return targetY < sourceY
    ? { sourceHandle: 'top', targetHandle: 'bottom' }
    : { sourceHandle: 'bottom', targetHandle: 'top' };
}

export function toFlow(tree: FamilyTreeData, options: FlowOptions = {}): { nodes: FlowNode[]; edges: RelationshipEdge[] } {
  const collapsed = options.collapsed ?? new Set<number>();
  const highlight = options.highlightIds ?? null;
  const rels = tree.relationships;
  const { hidden, hiddenCounts } = computeCollapse(tree.members.map((m) => m.id), rels, collapsed);
  const byId = new Map(tree.members.map((m) => [m.id, m]));
  const visible = (id: number) => byId.has(id) && !hidden.has(id);
  const isDimmed = (id: number) => (highlight ? !highlight.has(id) : false);

  const hasChildren = new Set<number>();
  for (const r of rels) if (r.type === 'parent-child') hasChildren.add(r.fromMemberId);

  const nodes: FlowNode[] = [];
  for (const m of tree.members) {
    if (hidden.has(m.id)) continue;
    nodes.push({
      id: memberNodeId(m.id),
      type: 'person',
      ariaLabel: [m.firstName, m.middleName, m.lastName].filter(Boolean).join(' '),
      position: { x: m.x, y: m.y },
      width: CARD_SIZE.width,
      height: CARD_SIZE.height,
      data: {
        member: m,
        dimmed: isDimmed(m.id),
        collapsed: collapsed.has(m.id),
        hiddenCount: hiddenCounts.get(m.id) ?? 0,
        hasChildren: hasChildren.has(m.id),
      },
    });
  }

  const spouses = rels.filter((r) => r.type === 'spouse' && visible(r.fromMemberId) && visible(r.toMemberId));
  const unionNodes = new Map<number, string>();
  const spouseKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const unionByCouple = new Map<string, Relationship>();
  for (const s of [...spouses].sort((a, b) => a.id - b.id)) {
    const key = spouseKey(s.fromMemberId, s.toMemberId);
    if (unionByCouple.has(key)) continue; // reversed duplicate spouse rows share one junction
    unionByCouple.set(key, s);
    const a = byId.get(s.fromMemberId)!;
    const b = byId.get(s.toMemberId)!;
    unionNodes.set(s.id, unionNodeId(s.id));
    nodes.push({
      id: unionNodeId(s.id),
      type: 'union',
      position: unionPosition(a, b),
      width: UNION_SIZE,
      height: UNION_SIZE,
      draggable: false,
      selectable: false,
      data: { partnerIds: [s.fromMemberId, s.toMemberId] },
    });
  }

  const edges: RelationshipEdge[] = [];
  const edgeData = (r: Relationship, ids: number[], dimmed: boolean): RelationshipEdgeData => ({
    relationshipIds: ids,
    relationship: { type: r.type, subType: r.subType, status: r.status, startDate: r.startDate },
    dimmed,
  });

  unionByCouple.forEach((s) => {
    const dimmed = isDimmed(s.fromMemberId) && isDimmed(s.toMemberId);
    const a = byId.get(s.fromMemberId)!;
    const b = byId.get(s.toMemberId)!;
    const aIsLeft = a.x <= b.x;
    // Each partner links from the side facing the other, straight into the junction.
    for (const [suffix, memberId, isLeft] of [['a', s.fromMemberId, aIsLeft], ['b', s.toMemberId, !aIsLeft]] as const) {
      edges.push({
        id: `r:${s.id}:${suffix}`,
        type: 'relationship',
        source: memberNodeId(memberId),
        sourceHandle: isLeft ? 'right' : 'left',
        target: unionNodeId(s.id),
        targetHandle: isLeft ? 'left' : 'right',
        data: edgeData(s, [s.id], dimmed),
      });
    }
  });

  // Parents of each child, used to find the couple a child "hangs" from.
  const parentRels = new Map<number, Relationship[]>();
  for (const r of rels) {
    if (r.type !== 'parent-child') continue;
    parentRels.set(r.toMemberId, [...(parentRels.get(r.toMemberId) ?? []), r]);
  }
  const handled = new Set<number>();

  for (const r of rels) {
    if (r.type === 'spouse' || handled.has(r.id)) continue;
    if (!visible(r.toMemberId)) continue;

    if (r.type === 'parent-child') {
      const siblings = parentRels.get(r.toMemberId) ?? [];
      const partner = siblings.find(
        (o) => o.id !== r.id && unionByCouple.has(spouseKey(o.fromMemberId, r.fromMemberId)),
      );
      if (partner) {
        const spouseRel = unionByCouple.get(spouseKey(partner.fromMemberId, r.fromMemberId))!;
        const ids = [r.id, partner.id].sort((a, b) => a - b);
        handled.add(r.id);
        handled.add(partner.id);
        const primary = rels.find((x) => x.id === ids[0])!;
        edges.push({
          id: `r:${ids[0]}`,
          type: 'relationship',
          source: unionNodeId(spouseRel.id),
          target: memberNodeId(r.toMemberId),
          ...verticalHandles(
            unionPosition(byId.get(spouseRel.fromMemberId)!, byId.get(spouseRel.toMemberId)!).y,
            byId.get(r.toMemberId)!.y,
          ),
          data: edgeData(primary, ids, isDimmed(r.toMemberId)),
        });
        continue;
      }
    }

    if (!visible(r.fromMemberId)) continue;
    edges.push({
      id: `r:${r.id}`,
      type: 'relationship',
      source: memberNodeId(r.fromMemberId),
      target: memberNodeId(r.toMemberId),
      ...verticalHandles(byId.get(r.fromMemberId)!.y, byId.get(r.toMemberId)!.y),
      data: edgeData(r, [r.id], isDimmed(r.fromMemberId) && isDimmed(r.toMemberId)),
    });
  }

  return { nodes, edges };
}

/** Recomputes junction positions after partners moved (e.g. mid-drag), without touching other nodes. */
export function withUnionPositions<T extends { id: string; type?: string; position: { x: number; y: number }; data: unknown }>(
  nodes: T[],
): T[] {
  const people = new Map<number, { x: number; y: number }>();
  for (const n of nodes) {
    const id = memberIdFromNode(n.id);
    if (id !== null) people.set(id, n.position);
  }
  return nodes.map((n) => {
    if (n.type !== 'union') return n;
    const [a, b] = (n.data as UnionNodeData).partnerIds;
    const pa = people.get(a);
    const pb = people.get(b);
    return pa && pb ? { ...n, position: unionPosition(pa, pb) } : n;
  });
}
