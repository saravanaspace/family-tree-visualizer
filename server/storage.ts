import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  familyMembers, 
  relationships,
  type FamilyMember, 
  type InsertFamilyMember,
  type Relationship,
  type InsertRelationship,
  type FamilyTreeData
} from "@shared/schema";
import { eq } from 'drizzle-orm';

export interface IStorage {
  getFamilyTree(): Promise<FamilyTreeData>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMemberPosition(id: number, x: number, y: number): Promise<FamilyMember>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  deleteFamilyMember(id: number): Promise<void>;
}

// Database connection
const queryClient = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/familytree');
const db = drizzle(queryClient);

export class PostgresStorage implements IStorage {
  async getFamilyTree(): Promise<FamilyTreeData> {
    const members = await db.select().from(familyMembers);
    const rels = await db.select().from(relationships);
    return {
      members,
      relationships: rels
    };
  }

  async createFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const [member] = await db.insert(familyMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async updateFamilyMemberPosition(id: number, x: number, y: number): Promise<FamilyMember> {
    const [member] = await db.update(familyMembers)
      .set({ x, y })
      .where(eq(familyMembers.id, id))
      .returning();
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    return member;
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const [relationship] = await db.insert(relationships)
      .values(insertRelationship)
      .returning();
    return relationship;
  }

  async deleteFamilyMember(id: number): Promise<void> {
    // Delete related relationships first (due to foreign key constraints)
    await db.delete(relationships)
      .where(eq(relationships.fromMemberId, id))
      .returning();
    
    await db.delete(relationships)
      .where(eq(relationships.toMemberId, id))
      .returning();
    
    // Then delete the member
    await db.delete(familyMembers)
      .where(eq(familyMembers.id, id))
      .returning();
  }
}

// Export a singleton instance
export const storage = new PostgresStorage();
