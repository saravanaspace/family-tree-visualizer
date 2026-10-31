// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { FamilyMember, FamilyTreeData, Relationship } from '@shared/schema';

vi.mock('../../lib/api', async (orig) => {
  const actual = await orig<typeof import('../../lib/api')>();
  return {
    ...actual,
    api: {
      savePositions: vi.fn(), createMember: vi.fn(), deleteMember: vi.fn(), restoreMember: vi.fn(),
      createRelationship: vi.fn(), updateRelationship: vi.fn(), deleteRelationship: vi.fn(),
    },
  };
});
const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));

import { api, ApiError } from '../../lib/api';
import { FAMILY_TREE_KEY } from '@/hooks/use-family-tree';
import { snapshotMember, toInsertRelationship, useTreeActions } from '../useTreeActions';

const mem = (id: number, x = 0, y = 0) =>
  ({ id, firstName: `P${id}`, middleName: null, lastName: null, gender: 'male', isLiving: true, x, y, createdAt: null, updatedAt: null }) as FamilyMember;
const rel = (id: number, from: number, to: number, type = 'parent-child') =>
  ({ id, fromMemberId: from, toMemberId: to, type, status: 'active', subType: null, startDate: null, endDate: null, notes: null, createdAt: null, updatedAt: null }) as Relationship;

const tree = (): FamilyTreeData => ({
  members: [mem(1, 0, 0), mem(2, 100, 0), mem(3, 0, 200)],
  relationships: [rel(10, 1, 3), rel(11, 1, 2, 'spouse')],
  events: [{ id: 5, type: 'birth', memberIds: [3], date: null, place: null, description: null, createdAt: null, updatedAt: null } as any],
});

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  queryClient.setQueryData(FAMILY_TREE_KEY, tree());
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useTreeActions(queryClient.getQueryData<FamilyTreeData>(FAMILY_TREE_KEY)), { wrapper });
  const cached = () => queryClient.getQueryData<FamilyTreeData>(FAMILY_TREE_KEY)!;
  return { ...hook, cached };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.savePositions).mockResolvedValue({ updated: 1 });
  vi.mocked(api.deleteMember).mockResolvedValue({});
  vi.mocked(api.deleteRelationship).mockResolvedValue({});
  vi.mocked(api.restoreMember).mockResolvedValue({} as any);
});

describe('snapshotMember / toInsertRelationship', () => {
  it('captures the member with its relationships and events', () => {
    const s = snapshotMember(tree(), 1)!;
    expect(s.relationships.map((r) => r.id)).toEqual([10, 11]);
    expect(snapshotMember(tree(), 3)!.events.map((e) => e.id)).toEqual([5]);
    expect(snapshotMember(tree(), 99)).toBeNull();
  });

  it('drops server-managed columns when re-creating a link', () => {
    expect(toInsertRelationship(rel(10, 1, 3))).not.toHaveProperty('id');
    expect(toInsertRelationship(rel(10, 1, 3))).not.toHaveProperty('createdAt');
  });
});

describe('useTreeActions.movePositions', () => {
  it('sends one batch with only changed members and updates the cache', async () => {
    const { result, cached } = setup();
    await act(async () => { expect(await result.current.movePositions([{ id: 1, x: 5, y: 5 }, { id: 2, x: 100, y: 0 }], 'Move')).toBe(true); });
    expect(api.savePositions).toHaveBeenCalledTimes(1);
    expect(api.savePositions).toHaveBeenCalledWith([{ id: 1, x: 5, y: 5 }]);
    expect(cached().members.find((m) => m.id === 1)).toMatchObject({ x: 5, y: 5 });
  });

  it('does nothing when no position changed', async () => {
    const { result } = setup();
    await act(async () => { expect(await result.current.movePositions([{ id: 1, x: 0, y: 0 }])).toBe(false); });
    expect(api.savePositions).not.toHaveBeenCalled();
    expect(result.current.undoRedo.canUndo).toBe(false);
  });

  it('rolls back and toasts when saving fails', async () => {
    vi.mocked(api.savePositions).mockRejectedValue(new ApiError(500, 'nope'));
    const { result, cached } = setup();
    await act(async () => { expect(await result.current.movePositions([{ id: 1, x: 9, y: 9 }])).toBe(false); });
    expect(cached().members.find((m) => m.id === 1)).toMatchObject({ x: 0, y: 0 });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(result.current.undoRedo.canUndo).toBe(false);
  });

  it('undo restores previous positions and redo reapplies them', async () => {
    const { result } = setup();
    await act(async () => { await result.current.movePositions([{ id: 1, x: 5, y: 5 }]); });
    await act(async () => { await result.current.undoRedo.undo(); });
    expect(api.savePositions).toHaveBeenLastCalledWith([{ id: 1, x: 0, y: 0 }]);
    await act(async () => { await result.current.undoRedo.redo(); });
    expect(api.savePositions).toHaveBeenLastCalledWith([{ id: 1, x: 5, y: 5 }]);
  });
});

describe('useTreeActions.autoArrange', () => {
  it('saves a layout as a single undoable batch', async () => {
    const { result } = setup();
    await act(async () => { await result.current.autoArrange(); });
    expect(api.savePositions).toHaveBeenCalledTimes(1);
    expect(result.current.undoRedo.undoLabel).toBe('Auto-arrange');
  });
});

describe('useTreeActions.deleteMember', () => {
  it('removes the member and its links from the cache, then restores them on undo', async () => {
    const { result, cached } = setup();
    await act(async () => { expect(await result.current.deleteMember(3)).toBe(true); });
    expect(api.deleteMember).toHaveBeenCalledWith(3);
    expect(cached().members.map((m) => m.id)).not.toContain(3);
    expect(cached().relationships.map((r) => r.id)).toEqual([11]);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Deleted P3' }));

    await act(async () => { await result.current.undoRedo.undo(); });
    const body = vi.mocked(api.restoreMember).mock.calls[0][0] as any;
    expect(body.member).toMatchObject({ id: 3 });
    expect(body.member).not.toHaveProperty('createdAt');
    expect(body.relationships.map((r: any) => r.id)).toEqual([10]);
    expect(body.events.map((e: any) => e.id)).toEqual([5]);
  });

  it('rolls back when the server rejects the delete', async () => {
    vi.mocked(api.deleteMember).mockRejectedValue(new ApiError(500, 'x'));
    const { result, cached } = setup();
    await act(async () => { expect(await result.current.deleteMember(3)).toBe(false); });
    expect(cached().members.map((m) => m.id)).toContain(3);
    expect(result.current.undoRedo.canUndo).toBe(false);
  });

  it('ignores unknown members', async () => {
    const { result } = setup();
    await act(async () => { expect(await result.current.deleteMember(99)).toBe(false); });
    expect(api.deleteMember).not.toHaveBeenCalled();
  });
});

describe('useTreeActions relationships', () => {
  it('creates a link and undoes it by deleting the created row', async () => {
    vi.mocked(api.createRelationship).mockResolvedValue(rel(20, 2, 3));
    const { result } = setup();
    await act(async () => { await result.current.createRelationship({ fromMemberId: 2, toMemberId: 3, type: 'parent-child', status: 'active' } as any); });
    await act(async () => { await result.current.undoRedo.undo(); });
    expect(api.deleteRelationship).toHaveBeenCalledWith(20);
  });

  it('rolls back the optimistic link when creation fails', async () => {
    vi.mocked(api.createRelationship).mockRejectedValue(new ApiError(409, 'dup'));
    const { result, cached } = setup();
    await act(async () => { expect(await result.current.createRelationship({ fromMemberId: 2, toMemberId: 3, type: 'parent-child', status: 'active' } as any)).toBeNull(); });
    expect(cached().relationships).toHaveLength(2);
  });

  it('deletes both rows behind a shared-children edge and can undo', async () => {
    vi.mocked(api.createRelationship).mockResolvedValue(rel(30, 1, 3));
    const { result, cached } = setup();
    await act(async () => { await result.current.deleteRelationships([10, 11]); });
    expect(api.deleteRelationship).toHaveBeenCalledTimes(2);
    expect(cached().relationships).toHaveLength(0);
    await act(async () => { await result.current.undoRedo.undo(); });
    expect(api.createRelationship).toHaveBeenCalledTimes(2);
  });
});
