import React, { useState, useEffect } from "react";
import { useFamilyTree } from "@/hooks/use-family-tree";
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

    // Auto-align algorithm: arrange family members in hierarchical layout
    const members = [...familyTree.members];
    const relationships = familyTree.relationships;
    
    // Group members by generation
    const generations: { [key: number]: typeof members } = {};
    const memberGenerations: { [id: number]: number } = {};
    
    // Find root members (those without parents)
    const hasParent = new Set();
    relationships.forEach(rel => {
      if (rel.type === 'parent') {
        hasParent.add(rel.toMemberId);
      }
    });
    
    const rootMembers = members.filter(m => !hasParent.has(m.id));
    
    // Assign generations starting from roots
    const assignGeneration = (memberId: number, generation: number, visited = new Set()) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);
      
      memberGenerations[memberId] = generation;
      if (!generations[generation]) generations[generation] = [];
      
      const member = members.find(m => m.id === memberId);
      if (member && !generations[generation].find(m => m.id === memberId)) {
        generations[generation].push(member);
      }
      
      // Find children
      relationships.forEach(rel => {
        if (rel.type === 'parent' && rel.fromMemberId === memberId) {
          assignGeneration(rel.toMemberId, generation + 1, visited);
        }
      });
    };
    
    // Start from root members
    rootMembers.forEach(member => {
      assignGeneration(member.id, 0);
    });
    
    // Handle orphaned members
    members.forEach(member => {
      if (!(member.id in memberGenerations)) {
        const gen = Math.max(...Object.keys(generations).map(Number)) + 1 || 0;
        memberGenerations[member.id] = gen;
        if (!generations[gen]) generations[gen] = [];
        generations[gen].push(member);
      }
    });
    
    // Position members
    const promises = [];
    const startY = 100;
    const generationSpacing = 250;
    const memberSpacing = 200;
    
    Object.keys(generations).forEach(genKey => {
      const gen = parseInt(genKey);
      const genMembers = generations[gen];
      const y = startY + gen * generationSpacing;
      
      genMembers.forEach((member, index) => {
        const totalWidth = (genMembers.length - 1) * memberSpacing;
        const startX = 400 - totalWidth / 2;
        const x = startX + index * memberSpacing;
        
        promises.push(
          fetch(`/api/family-members/${member.id}/position`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y })
          })
        );
      });
    });
    
    await Promise.all(promises);
    
    // Refresh the family tree data
    window.location.reload();
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
