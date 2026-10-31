// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { FamilyMember } from '@shared/schema';
import { EMPTY_FILTERS, filtersActive, highlightFromFilters, matchesFilters, treeStats } from '../filter';
import { findGuides } from '../guides';
import { matchShortcut, type KeyLike } from '../shortcuts';

const member = (id: number, over: Partial<FamilyMember> = {}) =>
  ({ id, firstName: `P${id}`, middleName: null, lastName: 'Doe', gender: 'male', isLiving: true, ...over }) as FamilyMember;

describe('filter', () => {
  const people = [member(1), member(2, { gender: 'female', isLiving: false }), member(3, { firstName: 'Zed' })];

  it('is inactive and dims nothing by default', () => {
    expect(filtersActive(EMPTY_FILTERS)).toBe(false);
    expect(highlightFromFilters(people, EMPTY_FILTERS)).toBeNull();
  });

  it('combines name, status and gender', () => {
    expect(highlightFromFilters(people, { ...EMPTY_FILTERS, query: 'zed' })).toEqual(new Set([3]));
    expect(highlightFromFilters(people, { ...EMPTY_FILTERS, living: 'deceased' })).toEqual(new Set([2]));
    expect(highlightFromFilters(people, { ...EMPTY_FILTERS, gender: 'female', living: 'living' })).toEqual(new Set());
    expect(matchesFilters(people[0], { ...EMPTY_FILTERS, query: 'p1 doe' })).toBe(true);
  });

  it('computes stats with generations from parent-child depth', () => {
    const rel = (from: number, to: number, type: string) => ({ fromMemberId: from, toMemberId: to, type }) as any;
    const stats = treeStats({
      members: people,
      relationships: [rel(1, 2, 'parent-child'), rel(2, 3, 'parent-child'), rel(1, 3, 'spouse')],
    });
    expect(stats).toEqual({ members: 3, generations: 3, couples: 1 });
    expect(treeStats({ members: [], relationships: [] }).generations).toBe(0);
  });

  it('does not loop on cyclic data', () => {
    const rel = (from: number, to: number) => ({ fromMemberId: from, toMemberId: to, type: 'parent-child' }) as any;
    expect(() => treeStats({ members: people, relationships: [rel(1, 2), rel(2, 1)] })).not.toThrow();
  });
});

describe('findGuides', () => {
  it('snaps to the nearest aligned edge or centre within the threshold', () => {
    const g = findGuides({ id: 1, x: 103, y: 500 }, [{ id: 2, x: 100, y: 0 }]);
    expect(g.x).toBe(100);
    expect(g.y).toBeUndefined();
  });

  it('ignores the dragged card itself and far cards', () => {
    expect(findGuides({ id: 1, x: 0, y: 0 }, [{ id: 1, x: 0, y: 0 }, { id: 2, x: 1000, y: 1000 }])).toEqual({ x: undefined, y: undefined });
  });
});

describe('matchShortcut', () => {
  const key = (k: string, over: Partial<KeyLike> = {}): KeyLike =>
    ({ key: k, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, target: document.body, ...over });

  it('maps palette, fit, zoom reset, inspector and delete', () => {
    expect(matchShortcut(key('k', { ctrlKey: true }))).toBe('palette');
    expect(matchShortcut(key('k', { metaKey: true }))).toBe('palette');
    expect(matchShortcut(key('/'))).toBe('palette');
    expect(matchShortcut(key('f'))).toBe('fit');
    expect(matchShortcut(key('0'))).toBe('reset-zoom');
    expect(matchShortcut(key('Enter'))).toBe('open-inspector');
    expect(matchShortcut(key('Delete'))).toBe('delete');
  });

  it('distinguishes undo and redo', () => {
    expect(matchShortcut(key('z', { ctrlKey: true }))).toBe('undo');
    expect(matchShortcut(key('z', { ctrlKey: true, shiftKey: true }))).toBe('redo');
    expect(matchShortcut(key('y', { ctrlKey: true }))).toBe('redo');
  });

  it('nudges by 1, or 10 with Shift', () => {
    expect(matchShortcut(key('ArrowLeft'))).toEqual({ type: 'nudge', dx: -1, dy: 0 });
    expect(matchShortcut(key('ArrowDown', { shiftKey: true }))).toEqual({ type: 'nudge', dx: 0, dy: 10 });
  });

  it('ignores plain keys while typing in inputs, dialogs and menus', () => {
    const input = document.createElement('input');
    expect(matchShortcut(key('f', { target: input }))).toBeNull();
    expect(matchShortcut(key('Delete', { target: input }))).toBeNull();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const inner = document.createElement('button');
    dialog.appendChild(inner);
    expect(matchShortcut(key('ArrowLeft', { target: inner }))).toBeNull();
  });

  it('does not hijack other modifier combos', () => {
    expect(matchShortcut(key('f', { ctrlKey: true }))).toBeNull();
    expect(matchShortcut(key('0', { altKey: true }))).toBeNull();
    expect(matchShortcut(key('x'))).toBeNull();
  });
});
