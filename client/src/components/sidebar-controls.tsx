import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  UserX, 
  Heart, 
  Baby,
  Users,
  Activity,
  HeartHandshake,
  Link,
  Layout
} from "lucide-react";
import type { FamilyTreeData } from "@shared/schema";

interface SidebarControlsProps {
  familyTree?: FamilyTreeData;
  onAddMember: (type: string) => void;
  onConnectMembers: () => void;
  onAutoAlign: () => void;
  selectedMemberId: number | null;
  isAutoAligning?: boolean;
}

export default function SidebarControls({
  familyTree,
  onAddMember,
  onConnectMembers,
  onAutoAlign,
  selectedMemberId,
  isAutoAligning = false
}: SidebarControlsProps) {
  const calculateStats = () => {
    if (!familyTree) return { totalMembers: 0, generations: 0, couples: 0 };

    const totalMembers = familyTree.members.length;
    
    // Calculate generations based on relationships
    const generations = new Set<number>();
    const memberGenerations: { [id: number]: number } = {};
    
    // Find root members (those without parents)
    const hasParent = new Set<number>();
    familyTree.relationships.forEach(rel => {
      if (rel.type === 'parent-child') {
        hasParent.add(rel.toMemberId);
      }
    });
    
    const rootMembers = familyTree.members.filter(m => !hasParent.has(m.id));
    
    // Assign generations starting from roots
    const assignGeneration = (memberId: number, generation: number, visited = new Set()) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);
      
      memberGenerations[memberId] = generation;
      generations.add(generation);
      
      // Find children
      familyTree.relationships.forEach(rel => {
        if (rel.type === 'parent-child' && rel.fromMemberId === memberId) {
          assignGeneration(rel.toMemberId, generation + 1, visited);
        }
      });
    };
    
    rootMembers.forEach(member => {
      assignGeneration(member.id, 0);
    });
    
    // Count couples (spouse relationships)
    const couples = familyTree.relationships.filter(r => r.type === 'spouse').length;
    
    return { totalMembers, generations: generations.size, couples };
  };

  const stats = calculateStats();

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Family Tree Builder
        </h1>
        <p className="text-sm text-gray-600">
          Create and manage your family relationships
        </p>
      </div>

      {/* Add Member Buttons */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Add Family Members
        </h3>
        
        <Button
          onClick={() => onAddMember('spouse')}
          className="w-full bg-red-500 hover:bg-red-600 text-white p-3 h-auto flex items-center justify-center space-x-2 transition-transform hover:scale-105"
        >
          <Heart className="w-4 h-4" />
          <span>Add Spouse</span>
        </Button>
        
        <Button
          onClick={() => onAddMember('child')}
          className="w-full bg-green-500 hover:bg-green-600 text-white p-3 h-auto flex items-center justify-center space-x-2 transition-transform hover:scale-105"
        >
          <Baby className="w-4 h-4" />
          <span>Add Child</span>
        </Button>

        <Button
          onClick={onConnectMembers}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white p-3 h-auto flex items-center justify-center space-x-2 transition-transform hover:scale-105"
        >
          <Link className="w-4 h-4" />
          <span>Connect Members</span>
        </Button>

        <Button
          onClick={onAutoAlign}
          disabled={isAutoAligning}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 h-auto flex items-center justify-center space-x-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Layout className={`w-4 h-4 ${isAutoAligning ? 'animate-spin' : ''}`} />
          <span>{isAutoAligning ? "Aligning..." : "Auto Align Layout"}</span>
        </Button>
      </div>

      {/* Instructions */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-blue-800">
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click three-dot menu on any card for all relationship options (parents, spouses, children)</li>
            <li>• Drag cards to reposition them manually</li>
            <li>• Mouse wheel to zoom in/out</li>
            <li>• Click and drag canvas to pan</li>
            <li>• Use "Auto Align Layout" to organize automatically</li>
          </ul>
        </CardContent>
      </Card>

      {/* Family Stats */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            Family Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">Total Members:</span>
              </div>
              <span className="font-medium">{stats.totalMembers}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">Generations:</span>
              </div>
              <span className="font-medium">{stats.generations}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">Couples:</span>
              </div>
              <span className="font-medium">{stats.couples}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
