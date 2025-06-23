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
  Link
} from "lucide-react";
import type { FamilyTreeData } from "@shared/schema";

interface SidebarControlsProps {
  familyTree?: FamilyTreeData;
  onAddMember: (type: string) => void;
  onConnectMembers: () => void;
  selectedMemberId: number | null;
}

export default function SidebarControls({
  familyTree,
  onAddMember,
  onConnectMembers,
  selectedMemberId
}: SidebarControlsProps) {
  const calculateStats = () => {
    if (!familyTree) return { totalMembers: 0, generations: 0, couples: 0 };

    const totalMembers = familyTree.members.length;
    
    // Calculate generations (simplified)
    const generations = Math.max(...familyTree.members.map(m => {
      if (m.type === 'father' || m.type === 'mother') return 1;
      if (m.type === 'spouse') return 2;
      return 3;
    }), 0);
    
    // Count couples
    const couples = familyTree.relationships.filter(r => r.type === 'spouse').length;
    
    return { totalMembers, generations, couples };
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
          onClick={() => onAddMember('father')}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 h-auto flex items-center justify-center space-x-2 transition-transform hover:scale-105"
        >
          <User className="w-4 h-4" />
          <span>Add Father</span>
        </Button>
        
        <Button
          onClick={() => onAddMember('mother')}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white p-3 h-auto flex items-center justify-center space-x-2 transition-transform hover:scale-105"
        >
          <UserX className="w-4 h-4" />
          <span>Add Mother</span>
        </Button>
        
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
            <li>• Click cards to select family members</li>
            <li>• Drag cards to reposition them</li>
            <li>• Use zoom controls to navigate</li>
            <li>• Add relationships using buttons above</li>
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
