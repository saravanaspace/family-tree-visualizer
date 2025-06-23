import React, { useRef, useEffect, useState } from "react";
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
  onScaleChange: (scale: number) => void;
  onPanChange: (panX: number, panY: number) => void;
}

export default function FamilyTreeCanvas({
  familyTree,
  selectedMemberId,
  onMemberSelect,
  onAddMember,
  scale,
  panX,
  panY,
  onScaleChange,
  onPanChange
}: FamilyTreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, x, y }: { id: number; x: number; y: number }) => {
      const response = await apiRequest('PATCH', `/api/family-members/${id}/position`, { x, y });
      return response.json();
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, scale * zoomFactor));
    onScaleChange(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start panning if not clicking on a family member card
    if ((e.target as HTMLElement).closest('.family-member-card')) {
      return;
    }
    
    e.preventDefault();
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
    onMemberSelect(null); // Deselect any selected member
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    onPanChange(panX + deltaX, panY + deltaY);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Add global mouse event listeners for panning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      onPanChange(panX + deltaX, panY + deltaY);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isPanning, lastPanPoint, panX, panY, onPanChange]);

  if (!familyTree) return null;

  return (
    <div 
      ref={containerRef}
      className={`w-full h-screen overflow-hidden relative ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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
