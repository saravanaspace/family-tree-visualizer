import { describe, it, expect } from 'vitest';
import { toFlow, withUnionPositions, unionPosition, memberNodeId } from '../toFlow';
import { layoutTree } from '../layout';
import { CARD_SIZE } from '../constants';
import { buildSampleDataset } from '../../../../../../server/demo-data';
import type { FamilyTreeData } from '@shared/schema';

const tree = (): FamilyTreeData => buildSampleDataset();

describe('toFlow', () => {
  it('creates a person node per member at its saved position', () => {
    const data = tree();
    const { nodes } = toFlow(data);
    const people = nodes.filter((n) => n.type === 'person');
    expect(people).toHaveLength(data.members.length);
    const m = data.members[0];
    expect(people.find((n) => n.id === memberNodeId(m.id))!.position).toEqual({ x: m.x, y: m.y });
  });

  it('creates one junction per couple and routes shared children through it', () => {
    const data = tree();
    const { nodes, edges } = toFlow(data);
    const unions = nodes.filter((n) => n.type === 'union');
    expect(unions).toHaveLength(data.relationships.filter((r) => r.type === 'spouse').length);
    // Member 4 has parents 2 & 3 (a couple): one edge from the junction, not two from the parents.
    const intoChild = edges.filter((e) => e.target === 'm:4');
    expect(intoChild).toHaveLength(1);
    expect(intoChild[0].source.startsWith('u:')).toBe(true);
    expect(intoChild[0].data!.relationshipIds.sort()).toEqual([4, 5]);
  });

  it('draws single-parent children directly from the parent', () => {
    const data = tree();
    data.relationships = data.relationships.filter((r) => !(r.type === 'parent-child' && r.toMemberId === 4 && r.fromMemberId === 3));
    const intoChild = toFlow(data).edges.filter((e) => e.target === 'm:4');
    expect(intoChild).toHaveLength(1);
    expect(intoChild[0].source).toBe('m:2');
  });

  it('hides collapsed descendants, their edges and reports the count', () => {
    const data = tree();
    const { nodes, edges } = toFlow(data, { collapsed: new Set([4]) });
    expect(nodes.find((n) => n.id === 'm:7')).toBeUndefined();
    expect(nodes.find((n) => n.id === 'm:8')).toBeUndefined();
    expect(edges.some((e) => e.target === 'm:7')).toBe(false);
    const four = nodes.find((n) => n.id === 'm:4') as any;
    expect(four.data.collapsed).toBe(true);
    expect(four.data.hiddenCount).toBe(2);
  });

  it('dims everything outside the highlight set', () => {
    const { nodes } = toFlow(tree(), { highlightIds: new Set([1]) });
    const dimmed = nodes.filter((n) => n.type === 'person' && (n.data as any).dimmed);
    expect(dimmed).toHaveLength(tree().members.length - 1);
  });

  it('every edge connects existing nodes', () => {
    const { nodes, edges } = toFlow(tree());
    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges) expect(ids.has(e.source) && ids.has(e.target)).toBe(true);
  });

  it('links partners side to side into a junction between them', () => {
    const { nodes, edges } = toFlow(tree());
    const union = nodes.find((n) => n.type === 'union')!;
    const [a, b] = (union.data as any).partnerIds as [number, number];
    const x = (id: number) => nodes.find((n) => n.id === memberNodeId(id))!.position.x;
    const [leftId, rightId] = x(a) <= x(b) ? [a, b] : [b, a];
    const link = (id: number) => edges.find((e) => e.target === union.id && e.source === memberNodeId(id))!;
    expect([link(leftId).sourceHandle, link(leftId).targetHandle]).toEqual(['right', 'left']);
    expect([link(rightId).sourceHandle, link(rightId).targetHandle]).toEqual(['left', 'right']);
    expect(union.position.x).toBeGreaterThan(x(leftId));
    expect(union.position.x).toBeLessThan(x(rightId) + 256);
  });

  it('routes a child placed above its parent from top to bottom handles', () => {
    const t = tree();
    const parentRel = t.relationships.find((r) => r.type === 'parent-child')!;
    const child = t.members.find((m) => m.id === parentRel.toMemberId)!;
    const parent = t.members.find((m) => m.id === parentRel.fromMemberId)!;
    const flipped = { ...t, members: t.members.map((m) => (m.id === child.id ? { ...m, y: parent.y - 1000 } : m)) };
    const edge = toFlow(flipped).edges.find((e) => e.target === memberNodeId(child.id))!;
    expect([edge.sourceHandle, edge.targetHandle]).toEqual(['top', 'bottom']);
  });

  it('withUnionPositions re-centres a junction after a partner moves', () => {
    const { nodes } = toFlow(tree());
    const moved = nodes.map((n) => (n.id === 'm:2' ? { ...n, position: { x: 5000, y: 5000 } } : n));
    const updated = withUnionPositions(moved);
    const union = updated.find((n) => n.type === 'union' && (n.data as any).partnerIds.includes(2))!;
    const [a, b] = (union.data as any).partnerIds as [number, number];
    const pos = (id: number) => updated.find((n) => n.id === memberNodeId(id))!.position;
    expect(union.position).toEqual(unionPosition(pos(a), pos(b)));
  });
});

describe('layoutTree', () => {
  const overlap = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.abs(a.x - b.x) < CARD_SIZE.width && Math.abs(a.y - b.y) < CARD_SIZE.height;
  const rel = (from: number, to: number, type: string) => ({ fromMemberId: from, toMemberId: to, type });

  it('places partners adjacent on the same row', () => {
    const pos = layoutTree([1, 2, 3], [rel(1, 2, 'spouse'), rel(1, 3, 'parent-child'), rel(2, 3, 'parent-child')]);
    expect(pos.get(1)!.y).toBe(pos.get(2)!.y);
    expect(Math.abs(pos.get(1)!.x - pos.get(2)!.x)).toBe(CARD_SIZE.width + 40);
    expect(pos.get(3)!.y).toBeGreaterThan(pos.get(1)!.y);
  });

  it('keeps children below parents across deep, multi-parent and looping data', () => {
    // 1&2 couple -> 3; 3 & 4 couple -> 5; 5 -> 6; 6 -> 1 closes a loop through the couple; 7 is a single parent of 8.
    const rels = [
      rel(1, 2, 'spouse'), rel(3, 4, 'spouse'),
      rel(1, 3, 'parent-child'), rel(2, 3, 'parent-child'),
      rel(3, 5, 'parent-child'), rel(4, 5, 'parent-child'),
      rel(5, 6, 'parent-child'), rel(6, 1, 'parent-child'),
      rel(7, 8, 'parent-child'),
    ];
    const pos = layoutTree([1, 2, 3, 4, 5, 6, 7, 8], rels);
    const looping = new Set(['6>1']);
    for (const r of rels) {
      if (r.type !== 'parent-child' || looping.has(`${r.fromMemberId}>${r.toMemberId}`)) continue;
      expect(pos.get(r.toMemberId)!.y).toBeGreaterThan(pos.get(r.fromMemberId)!.y);
    }
  });

  it('keeps every spouse of a multi-spouse member adjacent', () => {
    const pos = layoutTree([1, 2, 3], [rel(1, 2, 'spouse'), rel(1, 3, 'spouse')]);
    const xs = [2, 1, 3].map((id) => pos.get(id)!.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(Math.abs(pos.get(1)!.x - pos.get(2)!.x)).toBe(CARD_SIZE.width + 40);
    expect(Math.abs(pos.get(1)!.x - pos.get(3)!.x)).toBe(CARD_SIZE.width + 40);
  });

  it('handles half-siblings without overlap', () => {
    const rels = [rel(1, 2, 'spouse'), rel(1, 3, 'spouse'), rel(1, 4, 'parent-child'), rel(2, 4, 'parent-child'), rel(1, 5, 'parent-child'), rel(3, 5, 'parent-child')];
    const pos = layoutTree([1, 2, 3, 4, 5], rels);
    const all = [...pos.values()];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j])).toBe(false);
    expect(pos.get(4)!.y).toBe(pos.get(5)!.y);
  });

  it('lays out the sample dataset without overlap and with generations top-down', () => {
    const data = tree();
    const pos = layoutTree(data.members.map((m) => m.id), data.relationships);
    expect(pos.size).toBe(data.members.length);
    const all = [...pos.values()];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j])).toBe(false);
    for (const r of data.relationships.filter((r) => r.type === 'parent-child')) {
      expect(pos.get(r.toMemberId)!.y).toBeGreaterThan(pos.get(r.fromMemberId)!.y);
    }
  });

  it('copes with unrelated members and empty input', () => {
    expect(layoutTree([], []).size).toBe(0);
    expect(layoutTree([1, 2], []).size).toBe(2);
  });
});
