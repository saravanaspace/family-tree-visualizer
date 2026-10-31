import { describe, it, expect } from 'vitest';
import { validateLink } from '../validateLink';
import { edgeStyle, edgeLabel } from '../edgeStyle';
import { ancestorsOf, descendantsOf, focusSet } from '../focus';
import { computeCollapse } from '../collapse';
import { UndoStack } from '../undoStack';
import { alignBoxes, distributeBoxes, snap } from '../align';
import { detailLevelForZoom } from '../constants';

const pc = (from: number, to: number) => ({ fromMemberId: from, toMemberId: to, type: 'parent-child' });
const sp = (from: number, to: number) => ({ fromMemberId: from, toMemberId: to, type: 'spouse' });

describe('validateLink', () => {
  it('rejects self links', () => {
    expect(validateLink([], 1, 1, 'spouse')).toMatchObject({ ok: false });
  });
  it('rejects duplicates', () => {
    expect(validateLink([pc(1, 2)], 1, 2, 'parent-child')).toMatchObject({ ok: false });
  });
  it('rejects a reversed spouse pair but allows reversed non-symmetric types', () => {
    expect(validateLink([sp(1, 2)], 2, 1, 'spouse')).toMatchObject({ ok: false });
    expect(validateLink([{ fromMemberId: 1, toMemberId: 2, type: 'guardian' }], 2, 1, 'guardian')).toEqual({ ok: true });
  });
  it('rejects parent-child cycles', () => {
    expect(validateLink([pc(1, 2), pc(2, 3)], 3, 1, 'parent-child')).toMatchObject({ ok: false });
  });
  it('accepts a valid link', () => {
    expect(validateLink([pc(1, 2)], 1, 3, 'parent-child')).toEqual({ ok: true });
    expect(validateLink([], 1, 2, 'spouse')).toEqual({ ok: true });
  });
});

describe('edgeStyle', () => {
  it('keeps the existing colors and dashes', () => {
    expect(edgeStyle({ type: 'spouse', status: 'active' })).toMatchObject({ stroke: '#EF4444', strokeWidth: 3 });
    expect(edgeStyle({ type: 'spouse', status: 'divorced' })).toMatchObject({ stroke: '#94A3B8', strokeDasharray: '5,5' });
    expect(edgeStyle({ type: 'parent-child', subType: 'biological' }).stroke).toBe('#3B82F6');
    expect(edgeStyle({ type: 'parent-child', subType: 'adopted' }).stroke).toBe('#10B981');
    expect(edgeStyle({ type: 'parent-child', subType: 'foster' })).toMatchObject({ stroke: '#8B5CF6', strokeDasharray: '5,5' });
    expect(edgeStyle({ type: 'guardian' })).toMatchObject({ stroke: '#8B5CF6', strokeDasharray: '5,5' });
  });
  it('labels only non-default states and hides labels when zoomed out', () => {
    expect(edgeLabel({ type: 'spouse', status: 'active' }, 1)).toBeUndefined();
    expect(edgeLabel({ type: 'spouse', status: 'divorced' }, 1)).toBe('Divorced');
    expect(edgeLabel({ type: 'spouse', status: 'divorced' }, 0.3)).toBeUndefined();
    expect(edgeLabel({ type: 'spouse', status: 'active', startDate: new Date('1990-05-01') }, 1.5)).toBe('1990');
    expect(edgeLabel({ type: 'parent-child', subType: 'foster' }, 1)).toBe('Foster');
  });
});

describe('focus', () => {
  const rels = [pc(1, 2), pc(2, 3), pc(2, 4), sp(2, 9), pc(8, 1)];
  it('finds ancestors and descendants', () => {
    expect([...descendantsOf(2, rels)].sort()).toEqual([3, 4]);
    expect([...ancestorsOf(3, rels)].sort()).toEqual([1, 2, 8]);
  });
  it('focus set includes the line and partners, excluding siblings', () => {
    const set = focusSet(3, [...rels, pc(1, 5)]);
    expect(set.has(2) && set.has(1) && set.has(8) && set.has(9)).toBe(true);
    expect(set.has(5)).toBe(false);
    expect(set.has(4)).toBe(false);
  });
});

describe('computeCollapse', () => {
  const ids = [1, 2, 3, 4, 5];
  it('hides all descendants transitively and counts them', () => {
    const { hidden, hiddenCounts } = computeCollapse(ids, [pc(1, 2), pc(2, 3), pc(2, 4)], new Set([1]));
    expect([...hidden].sort()).toEqual([2, 3, 4]);
    expect(hiddenCounts.get(1)).toBe(3);
  });
  it('keeps a descendant visible through another expanded parent', () => {
    const { hidden } = computeCollapse(ids, [pc(1, 3), pc(2, 3)], new Set([1]));
    expect(hidden.has(3)).toBe(false);
  });
  it('hides nothing when nothing is collapsed', () => {
    expect(computeCollapse(ids, [pc(1, 2)], new Set()).hidden.size).toBe(0);
  });
  it('terminates on cyclic data', () => {
    expect(() => computeCollapse([1, 2], [pc(1, 2), pc(2, 1)], new Set([1]))).not.toThrow();
  });
});

describe('UndoStack', () => {
  const cmd = (label: string, log: string[]) => ({
    label,
    undo: () => { log.push(`undo ${label}`); },
    redo: () => { log.push(`redo ${label}`); },
  });

  it('undoes and redoes in order', async () => {
    const log: string[] = [];
    const s = new UndoStack();
    s.push(cmd('a', log));
    s.push(cmd('b', log));
    await s.undo();
    await s.undo();
    await s.redo();
    expect(log).toEqual(['undo b', 'undo a', 'redo a']);
    expect(s.canUndo && s.canRedo).toBe(true);
  });

  it('clears redo on push and caps depth', async () => {
    const log: string[] = [];
    const s = new UndoStack(2);
    s.push(cmd('a', log));
    await s.undo();
    s.push(cmd('b', log));
    expect(s.canRedo).toBe(false);
    s.push(cmd('c', log));
    s.push(cmd('d', log));
    await s.undo();
    await s.undo();
    expect(s.canUndo).toBe(false);
    expect(log.filter((l) => l.startsWith('undo')).length).toBe(3);
  });

  it('keeps the command in place when undo fails', async () => {
    const s = new UndoStack();
    s.push({ label: 'x', undo: () => { throw new Error('boom'); }, redo: () => {} });
    await expect(s.undo()).rejects.toThrow('boom');
    expect(s.canUndo).toBe(true);
    expect(s.canRedo).toBe(false);
  });

  it('is a no-op when empty and supports clear', async () => {
    const s = new UndoStack();
    expect(await s.undo()).toBeUndefined();
    expect(await s.redo()).toBeUndefined();
    s.push({ label: 'x', undo: () => {}, redo: () => {} });
    s.clear();
    expect(s.canUndo).toBe(false);
  });
});

describe('align / snap', () => {
  const boxes = [{ id: 1, x: 0, y: 10 }, { id: 2, x: 100, y: 50 }, { id: 3, x: 400, y: 30 }];
  it('aligns edges and centers', () => {
    expect(alignBoxes(boxes, 'left').every((b) => b.x === 0)).toBe(true);
    expect(alignBoxes(boxes, 'right').every((b) => b.x === 400)).toBe(true);
    expect(alignBoxes(boxes, 'top').every((b) => b.y === 10)).toBe(true);
    expect(alignBoxes(boxes, 'center-x').every((b) => b.x === 200)).toBe(true);
  });
  it('distributes evenly and needs 3+ items', () => {
    expect(distributeBoxes(boxes, 'x').map((b) => b.x)).toEqual([0, 200, 400]);
    expect(distributeBoxes(boxes.slice(0, 2), 'x')).toEqual(boxes.slice(0, 2));
  });
  it('snaps to the grid', () => {
    expect(snap(29)).toBe(20);
    expect(snap(31)).toBe(40);
    expect(snap(-9)).toBe(0);
  });
});

describe('detailLevelForZoom', () => {
  it('maps zoom to detail variants', () => {
    expect(detailLevelForZoom(0.2)).toBe('minimal');
    expect(detailLevelForZoom(0.4)).toBe('standard');
    expect(detailLevelForZoom(1)).toBe('standard');
    expect(detailLevelForZoom(1.5)).toBe('full');
  });
});
