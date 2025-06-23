import { useQuery } from "@tanstack/react-query";
import type { FamilyTreeData } from "@shared/schema";

export function useFamilyTree() {
  return useQuery<FamilyTreeData>({
    queryKey: ['/api/family-tree'],
  });
}
