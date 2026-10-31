import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { FamilyEvent, FamilyMember, FamilyTreeData, InsertRelationship, Relationship } from '@shared/schema';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { FAMILY_TREE_KEY, optimisticTreeUpdate } from '@/hooks/use-family-tree';
import { api, toRestoreRow, type Position } from '../lib/api';
import { layoutTree } from '../lib/layout';
import { useUndoRedo } from './useUndoRedo';

const messageOf = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');

/** Drops null columns and server-managed fields so a stored row can be re-posted as an insert. */
export function toInsertRelationship(rel: Relationship): InsertRelationship {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = rel;
  return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null)) as unknown as InsertRelationship;
}

export interface DeleteSnapshot {
  member: FamilyMember;
  relationships: Relationship[];
  events: FamilyEvent[];
}

export function snapshotMember(tree: FamilyTreeData, id: number): DeleteSnapshot | null {
  const member = tree.members.find((m) => m.id === id);
  if (!member) return null;
  return {
    member,
    relationships: tree.relationships.filter((r) => r.fromMemberId === id || r.toMemberId === id),
    events: tree.events.filter((e) => e.memberIds.includes(id)),
  };
}

export function useTreeActions(tree: FamilyTreeData | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const treeRef = useRef(tree);
  treeRef.current = tree;

  const undoRedo = useUndoRedo((error, action) =>
    toast({ title: `Could not ${action}`, description: messageOf(error), variant: 'destructive' }));

  const refresh = () => queryClient.invalidateQueries({ queryKey: FAMILY_TREE_KEY });
  const fail = (title: string, error: unknown) =>
    toast({ title, description: messageOf(error), variant: 'destructive' });

  const writePositions = async (positions: Position[]) => {
    const byId = new Map(positions.map((p) => [p.id, p]));
    const rollback = await optimisticTreeUpdate(queryClient, (t) => ({
      ...t,
      members: t.members.map((m) => {
        const p = byId.get(m.id);
        return p ? { ...m, x: p.x, y: p.y } : m;
      }),
    }));
    try {
      await api.savePositions(positions);
    } catch (error) {
      rollback();
      throw error;
    }
  };

  /** One batch save per gesture; registers a single undo step. */
  const movePositions = async (next: Position[], label = 'Move'): Promise<boolean> => {
    const current = treeRef.current;
    if (!current) return false;
    const byId = new Map(current.members.map((m) => [m.id, m]));
    const changed = next.filter((p) => {
      const m = byId.get(p.id);
      return m && (m.x !== p.x || m.y !== p.y);
    });
    if (!changed.length) return false;
    const previous = changed.map((p) => ({ id: p.id, x: byId.get(p.id)!.x, y: byId.get(p.id)!.y }));
    try {
      await writePositions(changed);
    } catch (error) {
      fail('Could not save position', error);
      return false;
    }
    undoRedo.push({ label, undo: () => writePositions(previous), redo: () => writePositions(changed) });
    return true;
  };

  const autoArrange = async (): Promise<boolean> => {
    const current = treeRef.current;
    if (!current) return false;
    const positions = layoutTree(current.members.map((m) => m.id), current.relationships);
    return movePositions(Array.from(positions, ([id, p]) => ({ id, ...p })), 'Auto-arrange');
  };

  const createRelationship = async (input: InsertRelationship): Promise<Relationship | null> => {
    const tempId = -Date.now();
    const rollback = await optimisticTreeUpdate(queryClient, (t) => ({
      ...t,
      relationships: [...t.relationships, {
        subType: null, notes: null, createdAt: null, updatedAt: null, ...input,
        startDate: input.startDate ?? null, endDate: input.endDate ?? null, status: input.status ?? 'active',
        id: tempId,
      } as unknown as Relationship],
    }));
    let created: Relationship;
    try {
      created = await api.createRelationship(input);
    } catch (error) {
      rollback();
      fail('Could not connect', error);
      return null;
    }
    await refresh();
    let currentId = created.id;
    undoRedo.push({
      label: 'Connect',
      undo: async () => { await api.deleteRelationship(currentId); await refresh(); },
      redo: async () => { currentId = (await api.createRelationship(input)).id; await refresh(); },
    });
    return created;
  };

  const deleteRelationships = async (ids: number[]): Promise<boolean> => {
    const current = treeRef.current;
    const rels = current?.relationships.filter((r) => ids.includes(r.id)) ?? [];
    if (!rels.length) return false;
    const rollback = await optimisticTreeUpdate(queryClient, (t) => ({
      ...t, relationships: t.relationships.filter((r) => !ids.includes(r.id)),
    }));
    try {
      await Promise.all(rels.map((r) => api.deleteRelationship(r.id)));
    } catch (error) {
      rollback();
      await refresh();
      fail('Could not delete relationship', error);
      return false;
    }
    await refresh();
    let liveIds = rels.map((r) => r.id);
    undoRedo.push({
      label: 'Delete relationship',
      undo: async () => {
        liveIds = (await Promise.all(rels.map((r) => api.createRelationship(toInsertRelationship(r))))).map((r) => r.id);
        await refresh();
      },
      redo: async () => { await Promise.all(liveIds.map((id) => api.deleteRelationship(id))); await refresh(); },
    });
    return true;
  };

  const updateRelationship = async (ids: number[], data: Partial<InsertRelationship>): Promise<boolean> => {
    const current = treeRef.current;
    const before = current?.relationships.filter((r) => ids.includes(r.id)) ?? [];
    if (!before.length) return false;
    const keys = Object.keys(data) as (keyof InsertRelationship)[];
    try {
      await Promise.all(before.map((r) => api.updateRelationship(r.id, data)));
    } catch (error) {
      fail('Could not update relationship', error);
      return false;
    }
    await refresh();
    undoRedo.push({
      label: 'Edit relationship',
      undo: async () => {
        await Promise.all(before.map((r) => api.updateRelationship(r.id, Object.fromEntries(keys.map((k) => [k, (r as any)[k] ?? undefined])))));
        await refresh();
      },
      redo: async () => { await Promise.all(before.map((r) => api.updateRelationship(r.id, data))); await refresh(); },
    });
    return true;
  };

  const restore = async (snapshot: DeleteSnapshot) => {
    await api.restoreMember({
      member: toRestoreRow(snapshot.member),
      relationships: snapshot.relationships.map(toRestoreRow),
      events: snapshot.events.map(toRestoreRow),
    });
    await refresh();
  };

  /** No confirm dialog: delete immediately and offer Undo (restores original ids via the restore endpoint). */
  const deleteMember = async (id: number): Promise<boolean> => {
    const current = treeRef.current;
    const snapshot = current ? snapshotMember(current, id) : null;
    if (!snapshot) return false;
    const rollback = await optimisticTreeUpdate(queryClient, (t) => ({
      members: t.members.filter((m) => m.id !== id),
      relationships: t.relationships.filter((r) => r.fromMemberId !== id && r.toMemberId !== id),
      events: t.events.filter((e) => !e.memberIds.includes(id)),
    }));
    try {
      await api.deleteMember(id);
    } catch (error) {
      rollback();
      fail('Could not delete member', error);
      return false;
    }
    await refresh();
    undoRedo.push({
      label: 'Delete member',
      undo: () => restore(snapshot),
      redo: async () => { await api.deleteMember(id); await refresh(); },
    });
    toast({
      title: `Deleted ${snapshot.member.firstName}`,
      action: <ToastAction altText="Undo delete" onClick={() => void undoRedo.undo()}>Undo</ToastAction>,
    });
    return true;
  };

  /** Registers undo for a member (and optional link) that the add dialog just created. */
  const registerCreated = (result: { member: FamilyMember; relationship?: Relationship }) => {
    const snapshot: DeleteSnapshot = {
      member: result.member,
      relationships: result.relationship ? [result.relationship] : [],
      events: [],
    };
    undoRedo.push({
      label: 'Add person',
      undo: async () => { await api.deleteMember(snapshot.member.id); await refresh(); },
      redo: () => restore(snapshot),
    });
  };

  return {
    undoRedo,
    movePositions,
    autoArrange,
    createRelationship,
    deleteRelationships,
    updateRelationship,
    deleteMember,
    registerCreated,
  };
}

export type TreeActions = ReturnType<typeof useTreeActions>;
