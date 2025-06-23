import { 
  familyMembers, 
  relationships,
  type FamilyMember, 
  type InsertFamilyMember,
  type Relationship,
  type InsertRelationship,
  type FamilyTreeData
} from "@shared/schema";

export interface IStorage {
  getFamilyTree(): Promise<FamilyTreeData>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMemberPosition(id: number, x: number, y: number): Promise<FamilyMember>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  deleteFamilyMember(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private members: Map<number, FamilyMember>;
  private relationships: Map<number, Relationship>;
  private currentMemberId: number;
  private currentRelationshipId: number;

  constructor() {
    this.members = new Map();
    this.relationships = new Map();
    this.currentMemberId = 1;
    this.currentRelationshipId = 1;
    
    // Initialize with sample family data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample family members
    const sampleMembers: FamilyMember[] = [
      { id: 1, name: 'Robert Johnson', birthDate: '1945', location: 'New York, NY', type: 'father', x: 200, y: 50 },
      { id: 2, name: 'Mary Johnson', birthDate: '1947', location: 'Boston, MA', type: 'mother', x: 480, y: 50 },
      { id: 3, name: 'David Johnson', birthDate: '1975', location: 'Chicago, IL', type: 'child', x: 340, y: 200 },
      { id: 4, name: 'Sarah Johnson', birthDate: '1978', location: 'Denver, CO', type: 'spouse', x: 620, y: 200 },
      { id: 5, name: 'Emma Johnson', birthDate: '2005', location: 'Chicago, IL', type: 'child', x: 480, y: 350 }
    ];

    const sampleRelationships: Relationship[] = [
      { id: 1, fromMemberId: 1, toMemberId: 3, type: 'parent' },
      { id: 2, fromMemberId: 2, toMemberId: 3, type: 'parent' },
      { id: 3, fromMemberId: 1, toMemberId: 2, type: 'spouse' },
      { id: 4, fromMemberId: 3, toMemberId: 4, type: 'spouse' },
      { id: 5, fromMemberId: 3, toMemberId: 5, type: 'parent' },
      { id: 6, fromMemberId: 4, toMemberId: 5, type: 'parent' }
    ];

    sampleMembers.forEach(member => this.members.set(member.id, member));
    sampleRelationships.forEach(rel => this.relationships.set(rel.id, rel));
    
    this.currentMemberId = 6;
    this.currentRelationshipId = 7;
  }

  async getFamilyTree(): Promise<FamilyTreeData> {
    return {
      members: Array.from(this.members.values()),
      relationships: Array.from(this.relationships.values())
    };
  }

  async createFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const id = this.currentMemberId++;
    const member: FamilyMember = { 
      ...insertMember, 
      id,
      x: insertMember.x ?? 0,
      y: insertMember.y ?? 0,
      birthDate: insertMember.birthDate ?? null,
      location: insertMember.location ?? null
    };
    this.members.set(id, member);
    return member;
  }

  async updateFamilyMemberPosition(id: number, x: number, y: number): Promise<FamilyMember> {
    const member = this.members.get(id);
    if (!member) {
      throw new Error('Family member not found');
    }
    
    const updatedMember = { ...member, x, y };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const id = this.currentRelationshipId++;
    const relationship: Relationship = { ...insertRelationship, id };
    this.relationships.set(id, relationship);
    return relationship;
  }

  async deleteFamilyMember(id: number): Promise<void> {
    this.members.delete(id);
    // Also delete related relationships
    const relationshipsToDelete: number[] = [];
    this.relationships.forEach((rel, relId) => {
      if (rel.fromMemberId === id || rel.toMemberId === id) {
        relationshipsToDelete.push(relId);
      }
    });
    relationshipsToDelete.forEach(relId => this.relationships.delete(relId));
  }
}

export const storage = new MemStorage();
