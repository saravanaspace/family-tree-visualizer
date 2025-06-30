import React, { useState, useEffect } from "react";
import { useFamilyTree } from "@/hooks/use-family-tree";
import { useQueryClient } from "@tanstack/react-query";
import FamilyTreeCanvas from "@/components/family-tree-canvas";
import TimelineView from "@/components/timeline-view";
import SidebarControls from "@/components/sidebar-controls";
import ZoomControls from "@/components/zoom-controls";
import AddMemberModal from "@/components/add-member-modal";
import ConnectMembersModal from "@/components/connect-members-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu, TreePine, Clock } from "lucide-react";

export default function FamilyTree() {
  const { data: familyTree, isLoading } = useFamilyTree();
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [memberType, setMemberType] = useState<string>("");
  const [relatedMemberId, setRelatedMemberId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<"tree" | "timeline">("tree");
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isAutoAligning, setIsAutoAligning] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddMember = (type: string, relatedId?: number) => {
    setMemberType(type);
    setRelatedMemberId(relatedId || null);
    setModalOpen(true);
  };

  const handleAutoAlign = async () => {
    if (!familyTree?.members) return;
    setIsAutoAligning(true);
    try {
      const members = [...familyTree.members];
      const relationships = familyTree.relationships;
      // Build maps for quick lookup
      const memberMap = new Map(members.map(m => [m.id, m]));
      const childrenMap: Record<number, number[]> = {};
      const parentsMap: Record<number, number[]> = {};
      const spousesMap: Record<number, number[]> = {};
      members.forEach(m => {
        childrenMap[m.id] = [];
        parentsMap[m.id] = [];
        spousesMap[m.id] = [];
      });
      relationships.forEach(rel => {
        if (rel.type === 'parent-child') {
          childrenMap[rel.fromMemberId].push(rel.toMemberId);
          parentsMap[rel.toMemberId].push(rel.fromMemberId);
        } else if (rel.type === 'spouse') {
          spousesMap[rel.fromMemberId].push(rel.toMemberId);
          spousesMap[rel.toMemberId].push(rel.fromMemberId);
        }
      });
      // Find root members (no parents)
      const roots = members.filter(m => parentsMap[m.id].length === 0);
      // Track positions
      const memberPositions: Record<number, { x: number, y: number }> = {};
      // Layout constants
      const CARD_WIDTH = 256;
      const CARD_HEIGHT = 128;
      const X_SPACING = 40;
      const Y_SPACING = 80;
      // Recursive layout
      let nextX = 0;
      function layoutUnit(parents: number[], depth: number): number {
        // Find all children for this parent group (intersection of all parents' children)
        let children: number[] = [];
        if (parents.length === 1) {
          children = childrenMap[parents[0]];
        } else if (parents.length > 1) {
          // Children who have all these parents
          const sets = parents.map(pid => new Set(childrenMap[pid]));
          children = Array.from(new Set(parents.flatMap(pid => childrenMap[pid]))).filter(cid =>
            parents.every(pid => childrenMap[pid].includes(cid))
          );
        }
        // Layout children recursively
        let childXs: number[] = [];
        children.forEach(childId => {
          const childX = layoutUnit(getSpouseGroup(childId), depth + 1);
          childXs.push(childX);
        });
        // Position parents
        let unitWidth = parents.length * CARD_WIDTH + (parents.length - 1) * X_SPACING;
        let x: number;
        if (childXs.length > 0) {
          // Center parents above their children
          const minChildX = Math.min(...childXs);
          const maxChildX = Math.max(...childXs);
          x = (minChildX + maxChildX - unitWidth) / 2 + CARD_WIDTH / 2;
        } else {
          x = nextX;
        }
        parents.forEach((pid, i) => {
          memberPositions[pid] = {
            x: x + i * (CARD_WIDTH + X_SPACING),
            y: depth * (CARD_HEIGHT + Y_SPACING),
          };
        });
        // Update nextX for siblings
        if (childXs.length > 0) {
          nextX = Math.max(nextX, Math.max(...childXs) + CARD_WIDTH + X_SPACING);
        } else {
          nextX = x + unitWidth + X_SPACING;
        }
        // Return center x of this unit
        return parents.length === 1
          ? memberPositions[parents[0]].x
          : (memberPositions[parents[0]].x + memberPositions[parents[parents.length - 1]].x) / 2;
      }
      // Helper: get all spouses in a group (sorted by id for determinism)
      function getSpouseGroup(memberId: number): number[] {
        const group = new Set<number>();
        function dfs(id: number) {
          if (group.has(id)) return;
          group.add(id);
          spousesMap[id].forEach(dfs);
        }
        dfs(memberId);
        return Array.from(group).sort((a, b) => a - b);
      }
      // Layout all root units
      let rootXs: number[] = [];
      roots.forEach(root => {
        const group = getSpouseGroup(root);
        if (group.some(id => id in memberPositions)) return; // already placed
        const x = layoutUnit(group, 0);
        rootXs.push(x);
      });
      // Update positions in database
      const promises = Object.entries(memberPositions).map(([memberId, position]) =>
        fetch(`/api/family-members/${memberId}/position`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: position.x, y: position.y })
        })
      );
      await Promise.all(promises);
      // Center the view
      const allX = Object.values(memberPositions).map(pos => pos.x);
      const allY = Object.values(memberPositions).map(pos => pos.y);
      if (allX.length > 0 && allY.length > 0) {
        const centerX = (Math.min(...allX) + Math.max(...allX)) / 2;
        const centerY = (Math.min(...allY) + Math.max(...allY)) / 2;
        const viewportWidth = window.innerWidth - 320;
        const viewportHeight = window.innerHeight;
        setPanX(-centerX + viewportWidth / 2);
        setPanY(-centerY + viewportHeight / 2);
        setScale(1);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] });
    } catch (error) {
      console.error('Auto-align failed:', error);
    } finally {
      setIsAutoAligning(false);
    }
  };

  const handleZoom = (factor: number) => {
    setScale(prev => Math.max(0.5, Math.min(2, prev * factor)));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Mobile Menu Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* View Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "tree" | "timeline")}>
          <TabsList className="bg-white shadow-lg">
            <TabsTrigger value="tree" className="flex items-center space-x-2">
              <TreePine className="h-4 w-4" />
              <span>Tree View</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 w-80 h-full bg-white shadow-xl z-40 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <SidebarControls
          familyTree={familyTree}
          onAddMember={handleAddMember}
          onConnectMembers={() => setConnectModalOpen(true)}
          onAutoAlign={handleAutoAlign}
          selectedMemberId={selectedMemberId}
          isAutoAligning={isAutoAligning}
        />
      </div>

      {/* Main Content Area */}
      <div className="ml-0 md:ml-80 min-h-screen relative">
        {activeView === "tree" && (
          <>
            <ZoomControls
              onZoomIn={() => handleZoom(1.2)}
              onZoomOut={() => handleZoom(0.8)}
              onResetZoom={handleResetZoom}
            />

            <FamilyTreeCanvas
              familyTree={familyTree}
              selectedMemberId={selectedMemberId}
              onMemberSelect={setSelectedMemberId}
              onAddMember={handleAddMember}
              scale={scale}
              panX={panX}
              panY={panY}
              onScaleChange={setScale}
              onPanChange={(x, y) => {
                setPanX(x);
                setPanY(y);
              }}
            />
          </>
        )}
        
        {activeView === "timeline" && (
          <TimelineView familyTree={familyTree} />
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        memberType={memberType}
        relatedMemberId={relatedMemberId}
      />

      <ConnectMembersModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        familyTree={familyTree}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
