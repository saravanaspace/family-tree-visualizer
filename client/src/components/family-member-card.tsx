import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  UserX, 
  Heart, 
  Baby,
  Calendar,
  MapPin,
  MoreVertical,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import type { FamilyMember } from "@shared/schema";

interface FamilyMemberCardProps {
  member: FamilyMember;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (id: number, x: number, y: number) => void;
  onAddMember: (type: string, relatedMemberId: number) => void;
  onDelete: (id: number) => void;
  onEdit: (member: FamilyMember) => void;
}

const memberTypeConfig = {
  father: { 
    color: 'blue-500', 
    icon: User, 
    label: 'Father' 
  },
  mother: { 
    color: 'pink-500', 
    icon: UserX, 
    label: 'Mother' 
  },
  spouse: { 
    color: 'red-500', 
    icon: Heart, 
    label: 'Spouse' 
  },
  child: { 
    color: 'green-500', 
    icon: Baby, 
    label: 'Child' 
  }
};

export default function FamilyMemberCard({
  member,
  isSelected,
  onSelect,
  onPositionChange,
  onAddMember,
  onDelete,
  onEdit
}: FamilyMemberCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const config = memberTypeConfig[member.type as keyof typeof memberTypeConfig] || memberTypeConfig.child;
  const IconComponent = config.icon;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    // Don't start dragging if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('[data-dropdown-menu]')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - member.x,
      y: e.clientY - member.y
    });
    onSelect();
  };

  const getAvailableActions = () => {
    const actions = [];
    
    // Everyone can add all relationship types
    actions.push({ type: 'father', label: 'Add Father', icon: User });
    actions.push({ type: 'mother', label: 'Add Mother', icon: UserX });
    actions.push({ type: 'spouse', label: 'Add Spouse', icon: Heart });
    actions.push({ type: 'child', label: 'Add Child', icon: Baby });
    
    return actions;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    if (cardRef.current) {
      cardRef.current.style.left = newX + 'px';
      cardRef.current.style.top = newY + 'px';
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    onPositionChange(member.id, newX, newY);
  };

  // Attach global mouse events for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      ref={cardRef}
      className={`family-member-card absolute cursor-move transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{ left: member.x, top: member.y }}
      onMouseDown={handleMouseDown}
    >
      <Card className={`w-48 p-4 bg-white border-l-4 border-${config.color}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <IconComponent className={`w-4 h-4 text-${config.color}`} />
            <span className="font-semibold text-gray-800 text-sm truncate">
              {member.name}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                data-dropdown-menu
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {getAvailableActions().map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddMember(action.type, member.id);
                    }}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    <IconComponent className="mr-2 h-3 w-3" />
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(member);
                }}
                className="cursor-pointer"
              >
                <Edit2 className="mr-2 h-3 w-3" />
                Edit Member
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(member.id);
                }}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Born: {member.birthDate || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{member.location || 'Unknown'}</span>
          </div>
          <div className={`text-${config.color} font-medium`}>
            {config.label}
          </div>
        </div>
      </Card>
    </div>
  );
}
