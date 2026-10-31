import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { 
  FamilyTreeData, 
  InsertFamilyMember, 
  FamilyMember,
  InsertRelationship,
  Relationship,
  InsertFamilyEvent,
  FamilyEvent
} from "@shared/schema";

export const FAMILY_TREE_KEY = ['/api/family-tree'] as const;

/**
 * Applies `updater` to the cached tree immediately and returns a rollback that restores the exact
 * snapshot taken beforehand. Callers run the real request and call `rollback()` if it fails.
 */
export async function optimisticTreeUpdate(
  queryClient: QueryClient,
  updater: (tree: FamilyTreeData) => FamilyTreeData,
): Promise<() => void> {
  await queryClient.cancelQueries({ queryKey: FAMILY_TREE_KEY });
  const snapshot = queryClient.getQueryData<FamilyTreeData>(FAMILY_TREE_KEY);
  if (snapshot) queryClient.setQueryData<FamilyTreeData>(FAMILY_TREE_KEY, updater(snapshot));
  return () => queryClient.setQueryData(FAMILY_TREE_KEY, snapshot);
}

export function useFamilyTree() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<FamilyTreeData>({
    queryKey: ['/api/family-tree'],
    queryFn: async () => {
      const response = await fetch('/api/family-tree');
      if (!response.ok) throw new Error('Failed to fetch family tree');
      return response.json();
    }
  });

  const createMember = useMutation({
    mutationFn: async (member: InsertFamilyMember): Promise<FamilyMember> => {
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      if (!response.ok) throw new Error('Failed to create family member');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertFamilyMember> }): Promise<FamilyMember> => {
      const response = await fetch(`/api/family-members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update family member');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const updateMemberPosition = useMutation({
    mutationFn: async ({ id, x, y }: { id: number, x: number, y: number }): Promise<FamilyMember> => {
      const response = await fetch(`/api/family-members/${id}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      });
      if (!response.ok) throw new Error('Failed to update position');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const createRelationship = useMutation({
    mutationFn: async (relationship: InsertRelationship): Promise<Relationship> => {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationship)
      });
      if (!response.ok) throw new Error('Failed to create relationship');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const updateRelationship = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertRelationship> }): Promise<Relationship> => {
      const response = await fetch(`/api/relationships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update relationship');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const createEvent = useMutation({
    mutationFn: async (event: InsertFamilyEvent): Promise<FamilyEvent> => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error('Failed to create event');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const deleteMember = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/family-members/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete member');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const deleteRelationship = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/relationships/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete relationship');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete event');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] })
  });

  return {
    data,
    isLoading,
    error,
    createMember,
    updateMember,
    updateMemberPosition,
    createRelationship,
    updateRelationship,
    createEvent,
    deleteMember,
    deleteRelationship,
    deleteEvent
  };
}
