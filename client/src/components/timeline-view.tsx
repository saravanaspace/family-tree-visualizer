import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Baby, Heart, Users } from "lucide-react";
import type { FamilyTreeData, FamilyMember } from "@shared/schema";

interface TimelineViewProps {
  familyTree?: FamilyTreeData;
}

interface TimelineEvent {
  year: number;
  type: 'birth' | 'marriage' | 'family';
  member: FamilyMember;
  description: string;
  relatedMembers?: FamilyMember[];
}

export default function TimelineView({ familyTree }: TimelineViewProps) {
  const timelineEvents = useMemo(() => {
    if (!familyTree?.members) return [];
    
    const events: TimelineEvent[] = [];
    
    // Add birth events
    familyTree.members.forEach(member => {
      if (member.birthDate) {
        const year = parseInt(member.birthDate.split('-')[0]);
        if (!isNaN(year)) {
          events.push({
            year,
            type: 'birth',
            member,
            description: `${member.name} was born`,
          });
        }
      }
    });
    
    // Add marriage events
    const processedSpouseRelations = new Set<string>();
    familyTree.relationships?.forEach(rel => {
      if (rel.type === 'spouse') {
        const relationKey = [rel.fromMemberId, rel.toMemberId].sort().join('-');
        if (processedSpouseRelations.has(relationKey)) return;
        processedSpouseRelations.add(relationKey);
        
        const spouse1 = familyTree.members.find(m => m.id === rel.fromMemberId);
        const spouse2 = familyTree.members.find(m => m.id === rel.toMemberId);
        
        if (spouse1 && spouse2) {
          // Estimate marriage year as average of birth years + 25
          const birth1 = spouse1.birthDate ? parseInt(spouse1.birthDate.split('-')[0]) : null;
          const birth2 = spouse2.birthDate ? parseInt(spouse2.birthDate.split('-')[0]) : null;
          
          if (birth1 && birth2) {
            const marriageYear = Math.round((birth1 + birth2) / 2) + 25;
            events.push({
              year: marriageYear,
              type: 'marriage',
              member: spouse1,
              description: `${spouse1.name} and ${spouse2.name} got married`,
              relatedMembers: [spouse2],
            });
          }
        }
      }
    });
    
    // Sort events by year
    return events.sort((a, b) => a.year - b.year);
  }, [familyTree]);
  
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'birth':
        return <Baby className="h-4 w-4" />;
      case 'marriage':
        return <Heart className="h-4 w-4" />;
      case 'family':
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };
  
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'birth':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'marriage':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'family':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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
              <p className="text-sm mt-2">Add birth dates to family members to see timeline events</p>
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
              {/* Year badge */}
              <div className="flex-shrink-0">
                <Badge variant="outline" className="px-3 py-1 font-semibold">
                  {event.year}
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
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{event.member.birthDate || 'Unknown date'}</span>
                          </div>
                          {event.member.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.member.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {event.relatedMembers && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.relatedMembers.map((relatedMember) => (
                              <Badge key={relatedMember.id} variant="secondary" className="text-xs">
                                {relatedMember.name}
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