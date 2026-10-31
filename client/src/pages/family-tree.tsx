import { useFamilyTree } from "@/hooks/use-family-tree";
import { TreeWorkspace } from "@/features/tree-canvas/TreeWorkspace";

export default function FamilyTree() {
  const { data, isLoading, error } = useFamilyTree();
  return <TreeWorkspace tree={data} isLoading={isLoading} error={error} />;
}
