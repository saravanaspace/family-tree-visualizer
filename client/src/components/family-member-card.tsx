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
  UserCircle2,
  CalendarDays,
  MapPin,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  User,
  UserRound,
  Heart,
  Baby,
  Scroll,
  UserCheck,
  Users,
  Languages,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FamilyMember } from "@shared/schema";
import { format } from "date-fns";

interface FamilyMemberCardProps {
  member: FamilyMember;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (id: number, x: number, y: number) => void;
  onAddMember: (type: string, relatedMemberId: number) => void;
  onDelete: (id: number) => void;
  onEdit: (member: FamilyMember) => void;
}

const genderConfig = {
  male: { 
    color: 'blue-500', 
    icon: User,
  },
  female: { 
    color: 'pink-500', 
    icon: UserRound,
  },
  nonbinary: {
    color: 'purple-500',
    icon: UserCircle2,
  },
  unknown: {
    color: 'gray-500',
    icon: UserCircle2,
  }
};

const relationshipActions = [
  { type: 'parent-child', label: 'Add Parent', icon: UserCircle2, subTypes: ['biological', 'adopted', 'foster'] },
  { type: 'spouse', label: 'Add Spouse', icon: Heart },
  { type: 'child', label: 'Add Child', icon: Baby, subTypes: ['biological', 'adopted', 'foster'] },
  { type: 'guardian', label: 'Add Guardian', icon: UserCheck },
  { type: 'other', label: 'Add Other Relation', icon: Users }
];

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

  const config = genderConfig[member.gender as keyof typeof genderConfig] || genderConfig.unknown;
  const IconComponent = config.icon;

  const colorClass = {
    'blue-500': 'border-blue-500',
    'pink-500': 'border-pink-500',
    'purple-500': 'border-purple-500',
    'gray-500': 'border-gray-500'
  }[config.color];

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
      <Card className={`w-64 p-4 bg-white border-l-4 ${colorClass}`}>
        <div className="flex items-start space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={member.photoUrl || ''} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback>
              {member.firstName?.[0]}{member.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="truncate">
                <h3 className="font-semibold text-gray-900">
                  {member.firstName} {member.middleName} {member.lastName}
                </h3>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant={member.isLiving ? "default" : "secondary"}>
                    {member.isLiving ? "Living" : "Deceased"}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" data-dropdown-menu>
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {relationshipActions.map((action) => (
                    <React.Fragment key={action.type}>
                      {action.subTypes ? (
                        action.subTypes.map((subType) => (
                          <DropdownMenuItem
                            key={`${action.type}-${subType}`}
                            onClick={() => onAddMember(`${action.type}-${subType}`, member.id)}
                          >
                            <action.icon className="mr-2 h-3 w-3" />
                            {`${action.label} (${subType})`}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onAddMember(action.type, member.id)}
                        >
                          <action.icon className="mr-2 h-3 w-3" />
                          {action.label}
                        </DropdownMenuItem>
                      )}
                    </React.Fragment>
                  ))}
                  <DropdownMenuItem onClick={() => onEdit(member)}>
                    <Edit2 className="mr-2 h-3 w-3" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(member.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <CalendarDays className="w-3 h-3" />
                <span>
                  {member.birthDate ? (
                    <>
                      {format(new Date(member.birthDate), 'MMM d, yyyy')}
                      {member.birthPlace && ` in ${member.birthPlace}`}
                    </>
                  ) : (
                    'Birth date unknown'
                  )}
                </span>
              </div>
              
              {!member.isLiving && member.deathDate && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {format(new Date(member.deathDate), 'MMM d, yyyy')}
                    {member.deathPlace && ` in ${member.deathPlace}`}
                  </span>
                </div>
              )}

              {member.occupation && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center space-x-1">
                        <Briefcase className="w-3 h-3" />
                        <span className="truncate">{member.occupation}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.occupation}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {member.biography && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center space-x-1">
                        <Scroll className="w-3 h-3" />
                        <span className="truncate">{member.biography}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs whitespace-normal">{member.biography}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
