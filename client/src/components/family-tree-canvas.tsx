import React, { useRef, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import FamilyMemberCard from "./family-member-card";
import type { FamilyTreeData, FamilyMember, Relationship } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import EditMemberModal from "./edit-member-modal";

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

const getRelationshipStyle = (relationship: Relationship) => {
  const baseStyle = {
    strokeWidth: 2,
    strokeDasharray: '',
    color: '#94A3B8'
  };

  switch (relationship.type) {
    case 'spouse':
      return {
        ...baseStyle,
        color: relationship.status === 'active' ? '#EF4444' : '#94A3B8',
        strokeWidth: 3,
        strokeDasharray: relationship.status === 'divorced' ? '5,5' : ''
      };
    case 'parent-child':
      return {
        ...baseStyle,
        color: relationship.subType === 'biological' ? '#3B82F6' : 
               relationship.subType === 'adopted' ? '#10B981' :
               relationship.subType === 'foster' ? '#8B5CF6' : '#94A3B8',
        strokeDasharray: relationship.subType === 'foster' ? '5,5' : ''
      };
    case 'adopted':
      return {
        ...baseStyle,
        color: '#10B981',
        strokeWidth: 2
      };
    case 'guardian':
      return {
        ...baseStyle,
        color: '#8B5CF6',
        strokeDasharray: '5,5'
      };
    default:
      return baseStyle;
  }
};

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
  const { toast } = useToast();
  const [editMember, setEditMember] = useState<FamilyMember | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [redrawKey, setRedrawKey] = useState(0);

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, x, y }: { id: number; x: number; y: number }) => {
      const response = await apiRequest('PATCH', `/api/family-members/${id}/position`, { x, y });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/family-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] });
      onMemberSelect(null);
      toast({
        title: "Success",
        description: "Family member deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (!familyTree || !svgRef.current) return;

    // Clear existing connections
    svgRef.current.innerHTML = '';

    // Deduplicate relationships to prevent multiple lines between same members
    const drawnRelationships = new Set<string>();
    
    // Draw relationships
    familyTree.relationships.forEach(rel => {
      const fromMember = familyTree.members.find(m => m.id === rel.fromMemberId);
      const toMember = familyTree.members.find(m => m.id === rel.toMemberId);

      if (fromMember && toMember) {
        // Create a unique key for this relationship to prevent duplicates
        const relationshipKey = `${rel.type}-${Math.min(rel.fromMemberId, rel.toMemberId)}-${Math.max(rel.fromMemberId, rel.toMemberId)}`;
        
        if (!drawnRelationships.has(relationshipKey)) {
          drawnRelationships.add(relationshipKey);
          drawRelationship(fromMember, toMember, rel);
        }
      }
    });
  }, [familyTree, scale, panX, panY, redrawKey]);

  const drawRelationship = (from: FamilyMember, to: FamilyMember, relationship: Relationship) => {
    const svg = svgRef.current;
    if (!svg || !familyTree) return;

    const style = getRelationshipStyle(relationship);
    const CARD_WIDTH = 256;
    const CARD_HEIGHT = 128;

    // Create a group for the relationship
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    let fromX, fromY, toX, toY;

    if (relationship.type === 'spouse') {
      // Center to center
      fromX = from.x + CARD_WIDTH / 2;
      fromY = from.y + CARD_HEIGHT / 2;
      toX = to.x + CARD_WIDTH / 2;
      toY = to.y + CARD_HEIGHT / 2;
    } else if (relationship.type === 'parent-child') {
      // Find all parents for this child
      const parents = familyTree.relationships
        .filter(r => r.type === 'parent-child' && r.toMemberId === to.id)
        .map(r => familyTree.members.find(m => m.id === r.fromMemberId))
        .filter(Boolean) as FamilyMember[];
      // Check if both parents are spouses and horizontally aligned
      let useMidpoint = false;
      if (parents.length === 2) {
        // Are they spouses?
        const spouseRel = familyTree.relationships.find(r =>
          r.type === 'spouse' &&
          ((r.fromMemberId === parents[0].id && r.toMemberId === parents[1].id) ||
           (r.fromMemberId === parents[1].id && r.toMemberId === parents[0].id))
        );
        // Are they horizontally aligned (y positions close)?
        const yClose = Math.abs(parents[0].y - parents[1].y) < 20;
        if (spouseRel && yClose) useMidpoint = true;
      }
      const ARROW_OFFSET = 5; // px, offset for visual connection
      if (useMidpoint) {
        // Draw from midpoint between bottoms of both parents
        const p1 = parents[0];
        const p2 = parents[1];
        const midX = (p1.x + CARD_WIDTH / 2 + p2.x + CARD_WIDTH / 2) / 2;
        const midY = Math.max(p1.y, p2.y) + CARD_HEIGHT; // no offset for start
        fromX = midX;
        fromY = midY;
      } else {
        // Only one parent or not a couple: draw from this parent
        fromX = from.x + CARD_WIDTH / 2;
        fromY = from.y + CARD_HEIGHT; // no offset for start
      }
      // To top center of child, but offset above the card
      toX = to.x + CARD_WIDTH / 2;
      toY = to.y - ARROW_OFFSET;
    } else {
      // Default: center to center
      fromX = from.x + CARD_WIDTH / 2;
      fromY = from.y + CARD_HEIGHT / 2;
      toX = to.x + CARD_WIDTH / 2;
      toY = to.y + CARD_HEIGHT / 2;
    }

    // Draw the main connection line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', fromX.toString());
    line.setAttribute('y1', fromY.toString());
    line.setAttribute('x2', toX.toString());
    line.setAttribute('y2', toY.toString());
    line.setAttribute('stroke', style.color);
    line.setAttribute('stroke-width', style.strokeWidth.toString());
    if (style.strokeDasharray) {
      line.setAttribute('stroke-dasharray', style.strokeDasharray);
    }
    group.appendChild(line);

    // For parent-child relationships, add an arrow pointing to the child
    if (relationship.type === 'parent-child' || relationship.type === 'adopted' || relationship.type === 'guardian') {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowLength = 10;
      const arrowWidth = 6;
      const arrowX = toX - arrowLength * Math.cos(angle);
      const arrowY = toY - arrowLength * Math.sin(angle);
      const arrowLeftX = arrowX - arrowWidth * Math.sin(angle);
      const arrowLeftY = arrowY + arrowWidth * Math.cos(angle);
      const arrowRightX = arrowX + arrowWidth * Math.sin(angle);
      const arrowRightY = arrowY - arrowWidth * Math.cos(angle);
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arrow.setAttribute('d', `M ${toX},${toY} L ${arrowLeftX},${arrowLeftY} L ${arrowRightX},${arrowRightY} Z`);
      arrow.setAttribute('fill', style.color);
      group.appendChild(arrow);
    }

    // Add a label for relationship status or type if needed
    if (relationship.status && relationship.status !== 'active') {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2 - 10;
      text.setAttribute('x', midX.toString());
      text.setAttribute('y', midY.toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', style.color);
      text.setAttribute('font-size', '12');
      text.textContent = relationship.status.charAt(0).toUpperCase() + relationship.status.slice(1);
      group.appendChild(text);
    }

    svg.appendChild(group);
  };

  const handleMemberPositionChange = (id: number, x: number, y: number) => {
    updatePositionMutation.mutate({ id, x, y });
    setRedrawKey(k => k + 1);
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
            onDelete={(id) => {
              if (window.confirm('Are you sure you want to delete this family member? This action cannot be undone.')) {
                deleteMemberMutation.mutate(id);
              }
            }}
            onEdit={(member) => {
              setEditMember(member);
              setEditModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* Edit Member Modal */}
      <EditMemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        member={editMember}
      />
    </div>
  );
}
