import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Baby, 
  Heart, 
  Users, 
  Cake,
  HeartCrack,
  UserCheck,
  School,
  Briefcase,
  GraduationCap
} from "lucide-react";
import type { FamilyTreeData, FamilyMember, Relationship } from "@shared/schema";

interface TimelineViewProps {
  familyTree?: FamilyTreeData;
}

interface TimelineEvent {
  date: string;
  year: number;
  type: 'birth' | 'death' | 'marriage' | 'divorce' | 'adoption' | 'career' | 'education' | 'relationship' | 'graduation' | 'move' | 'other';
  member: FamilyMember;
  description: string;
  relatedMembers?: FamilyMember[];
  location?: string;
  details?: string;
}

export default function TimelineView({ familyTree }: TimelineViewProps) {
  const timelineEvents = useMemo(() => {
    if (!familyTree?.members) return [];
    
    const events: TimelineEvent[] = [];
    
    // Add events from the familyEvents table
    familyTree.events?.forEach(event => {
      const involvedMembers = event.memberIds
        .map(id => familyTree.members.find(m => m.id === id))
        .filter((m): m is FamilyMember => m !== undefined);
      
      if (involvedMembers.length > 0) {
        const year = event.date ? parseInt(event.date.toString().split('-')[0]) : 0;
        if (!isNaN(year)) {
          events.push({
            date: event.date?.toString() || '',
            year,
            type: event.type as TimelineEvent['type'],
            member: involvedMembers[0],
            description: event.description || `Family event: ${event.type}`,
            relatedMembers: involvedMembers.slice(1),
            location: event.place || undefined,
            details: event.description || undefined
          });
        }
      }
    });

    // Add member life events
    familyTree.members.forEach(member => {
      if (member.birthDate) {
        events.push({
          date: member.birthDate.toString(),
          year: parseInt(member.birthDate.toString().split('-')[0]),
          type: 'birth',
          member,
          description: `Birth of ${member.firstName} ${member.lastName}`,
          location: member.birthPlace || undefined
        });
      }
      
      if (member.deathDate) {
        events.push({
          date: member.deathDate.toString(),
          year: parseInt(member.deathDate.toString().split('-')[0]),
          type: 'death',
          member,
          description: `Passing of ${member.firstName} ${member.lastName}`,
          location: member.deathPlace || undefined
        });
      }

      // Education events (from biography parsing)
      if (member.biography && member.birthDate) {
        const educationMatch = member.biography.match(/graduated|studied|completed|degree/i);
        if (educationMatch) {
          events.push({
            date: member.birthDate,
            year: parseInt(member.birthDate.split('-')[0]),
            type: 'education',
            member,
            description: `${member.firstName} ${member.lastName}'s education`,
            details: member.biography
          });
        }
      }

      // Career events
      if (member.occupation && member.birthDate) {
        events.push({
          date: member.birthDate,
          year: parseInt(member.birthDate.split('-')[0]) + 25,
          type: 'career',
          member,
          description: `${member.firstName} ${member.lastName}'s career`,
          details: member.occupation
        });
      }
    });
    
    // Add relationship events
    familyTree.relationships?.forEach(rel => {
      const fromMember = familyTree.members.find(m => m.id === rel.fromMemberId);
      const toMember = familyTree.members.find(m => m.id === rel.toMemberId);
      
      if (fromMember && toMember) {
        // Marriage/Relationship start
        if (rel.startDate) {
          const startYear = parseInt(rel.startDate.split('-')[0]);
          if (!isNaN(startYear)) {
            const eventType = rel.type === 'spouse' ? 'marriage' : 
                            rel.type === 'adopted' ? 'adoption' : 'relationship';
            
            const description = rel.type === 'spouse' ? 
              `${fromMember.firstName} ${fromMember.lastName} married ${toMember.firstName} ${toMember.lastName}` :
              rel.type === 'adopted' ?
              `${fromMember.firstName} ${fromMember.lastName} adopted ${toMember.firstName} ${toMember.lastName}` :
              `${fromMember.firstName} ${fromMember.lastName} became ${rel.type} of ${toMember.firstName} ${toMember.lastName}`;

            events.push({
              date: rel.startDate,
              year: startYear,
              type: eventType,
              member: fromMember,
              description,
              relatedMembers: [toMember],
              details: rel.subType ? `Type: ${rel.subType}` : undefined
            });
          }
        }

        // Divorce/Relationship end
        if (rel.endDate && rel.status === 'divorced') {
          const endYear = parseInt(rel.endDate.split('-')[0]);
          if (!isNaN(endYear)) {
            events.push({
              date: rel.endDate,
              year: endYear,
              type: 'divorce',
              member: fromMember,
              description: `${fromMember.firstName} ${fromMember.lastName} and ${toMember.firstName} ${toMember.lastName} divorced`,
              relatedMembers: [toMember]
            });
          }
        }
      }
    });
    
    // Sort events by date and then by type priority
    return events.sort((a, b) => {
      if (a.date && b.date) {
        return a.date.localeCompare(b.date);
      }
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      // Type priority: birth > death > marriage > other
      const typePriority: Record<string, number> = {
        birth: 1,
        death: 2,
        marriage: 3,
        adoption: 4,
        divorce: 5,
        career: 6,
        education: 7,
        graduation: 8,
        move: 9,
        relationship: 10,
        other: 11
      };
      return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
    });
  }, [familyTree]);
  
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'birth':
        return <Baby className="h-4 w-4" />;
      case 'death':
        return <Cake className="h-4 w-4" />;
      case 'marriage':
        return <Heart className="h-4 w-4" />;
      case 'divorce':
        return <HeartCrack className="h-4 w-4" />;
      case 'adoption':
        return <UserCheck className="h-4 w-4" />;
      case 'career':
        return <Briefcase className="h-4 w-4" />;
      case 'education':
        return <GraduationCap className="h-4 w-4" />;
      case 'relationship':
        return <Users className="h-4 w-4" />;
      case 'move':
        return <MapPin className="h-4 w-4" />;
      case 'graduation':
        return <GraduationCap className="h-4 w-4" />;
      case 'other':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };
  
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'birth':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'death':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'marriage':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'divorce':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'adoption':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'career':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'education':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'relationship':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'move':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'graduation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'other':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  if (!timelineEvents.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No timeline events available</p>
              <p className="text-sm mt-2">Add dates to family members and relationships to see timeline events</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-h-screen overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Family Timeline</h2>
        <p className="text-gray-600">Chronological view of family events and milestones</p>
      </div>
      
      <div className="space-y-6">
        {timelineEvents.map((event, index) => (
          <div key={index} className="relative">
            {/* Timeline line */}
            {index < timelineEvents.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
            )}
            
            <div className="flex items-start space-x-4">
              {/* Date badge */}
              <div className="flex-shrink-0">
                <Badge variant="outline" className="px-3 py-1 font-semibold">
                  {event.date ? new Date(event.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : event.year}
                </Badge>
              </div>
              
              {/* Event content */}
              <Card className="flex-1">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`p-1.5 rounded-full ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <h3 className="font-semibold text-gray-800">
                          {event.description}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        {event.location && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {event.details}
                          </p>
                        )}
                        
                        {event.relatedMembers && event.relatedMembers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.relatedMembers.map((relatedMember) => (
                              <Badge 
                                key={relatedMember.id} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {relatedMember.firstName} {relatedMember.lastName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}