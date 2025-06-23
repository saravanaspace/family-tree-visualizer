import { useState, useEffect } from "react";
import { useFamilyTree } from "@/hooks/use-family-tree";
import FamilyTreeCanvas from "@/components/family-tree-canvas";
import SidebarControls from "@/components/sidebar-controls";
import ZoomControls from "@/components/zoom-controls";
import AddMemberModal from "@/components/add-member-modal";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function FamilyTree() {
  const { data: familyTree, isLoading } = useFamilyTree();
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [memberType, setMemberType] = useState<string>("");
  const [relatedMemberId, setRelatedMemberId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 w-80 h-full bg-white shadow-xl z-40 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <SidebarControls
          familyTree={familyTree}
          onAddMember={handleAddMember}
          selectedMemberId={selectedMemberId}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="ml-0 md:ml-80 min-h-screen relative">
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
        />
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        memberType={memberType}
        relatedMemberId={relatedMemberId}
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
