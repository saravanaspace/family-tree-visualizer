import { useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import FamilyMemberCard from "./family-member-card";
import type { FamilyTreeData } from "@shared/schema";

interface FamilyTreeCanvasProps {
  familyTree?: FamilyTreeData;
  selectedMemberId: number | null;
  onMemberSelect: (id: number | null) => void;
  onAddMember: (type: string, relatedMemberId?: number) => void;
  scale: number;
  panX: number;
  panY: number;
}

export default function FamilyTreeCanvas({
  familyTree,
  selectedMemberId,
  onMemberSelect,
  onAddMember,
  scale,
  panX,
  panY
}: FamilyTreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, x, y }: { id: number; x: number; y: number }) => {
      return apiRequest('PATCH', `/api/family-members/${id}/position`, { x, y });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] });
    }
  });

  useEffect(() => {
    if (!familyTree || !svgRef.current) return;

    // Clear existing connections
    svgRef.current.innerHTML = '';

    // Draw connections
    familyTree.relationships.forEach(rel => {
      const fromMember = familyTree.members.find(m => m.id === rel.fromMemberId);
      const toMember = familyTree.members.find(m => m.id === rel.toMemberId);

      if (fromMember && toMember) {
        drawConnection(fromMember, toMember, rel.type);
      }
    });
  }, [familyTree, scale, panX, panY]);

  const drawConnection = (from: any, to: any, type: string) => {
    const svg = svgRef.current;
    if (!svg) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    
    // Calculate connection points (center of cards)
    const fromX = from.x + 96; // half of card width
    const fromY = from.y + 50; // approximate center height
    const toX = to.x + 96;
    const toY = to.y + 50;

    line.setAttribute('x1', fromX.toString());
    line.setAttribute('y1', fromY.toString());
    line.setAttribute('x2', toX.toString());
    line.setAttribute('y2', toY.toString());
    line.setAttribute('stroke', type === 'spouse' ? '#EF4444' : '#94A3B8');
    line.setAttribute('stroke-width', type === 'spouse' ? '3' : '2');
    line.setAttribute('fill', 'none');

    svg.appendChild(line);
  };

  const handleMemberPositionChange = (id: number, x: number, y: number) => {
    updatePositionMutation.mutate({ id, x, y });
  };

  if (!familyTree) return null;

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen overflow-hidden relative cursor-grab active:cursor-grabbing"
    >
      {/* SVG for connections */}
      <svg 
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`
        }}
      />

      {/* Family Members Container */}
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`
        }}
      >
        {familyTree.members.map(member => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            isSelected={selectedMemberId === member.id}
            onSelect={() => onMemberSelect(member.id)}
            onPositionChange={handleMemberPositionChange}
            onAddMember={onAddMember}
          />
        ))}
      </div>
    </div>
  );
}
