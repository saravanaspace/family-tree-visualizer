import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  familyMembers, 
  relationships,
  familyEvents,
  type FamilyMember, 
  type InsertFamilyMember,
  type Relationship,
  type InsertRelationship,
  type FamilyEvent,
  type InsertFamilyEvent,
  type FamilyTreeData
} from "@shared/schema";
import { eq, sql, inArray } from 'drizzle-orm';

// Database connection
const queryClient = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/familytree', {
  connect_timeout: 10,
  types: {
    date: {
      to: 1184,  // DATE type OID
      from: [1082, 1083, 1114, 1184],  // DATE, TIME, TIMESTAMP type OIDs
      serialize: (date: Date) => date.toISOString().split('T')[0],
      parse: (str: string) => str ? new Date(str) : null,
    }
  }
});
const defaultDb = drizzle(queryClient);

// Helper function to convert Date fields in objects
function prepareDates<T extends object>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Date) {
      (result as any)[key] = value.toISOString().split('T')[0];
    }
  }
  return result;
}

// Helper function to parse date strings back to Date objects
function parseDates<T extends object>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && (
      key === 'birthDate' || 
      key === 'deathDate' || 
      key === 'startDate' || 
      key === 'endDate' || 
      key === 'date'
    )) {
      (result as any)[key] = new Date(value);
    }
  }
  return result;
}

export class PostgresStorage {
  private db: ReturnType<typeof drizzle>;

  constructor(db?: ReturnType<typeof drizzle>) {
    this.db = db || defaultDb;
  }

  async getFamilyTree(): Promise<FamilyTreeData> {
    const members = await this.db.select().from(familyMembers);
    const rels = await this.db.select().from(relationships);
    const events = await this.db.select().from(familyEvents);
    return {
      members: members.map(m => parseDates(m)),
      relationships: rels.map(r => parseDates(r)),
      events: events.map(e => parseDates(e))
    };
  }

  async createFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const [member] = await this.db.insert(familyMembers)
      .values(prepareDates(insertMember))
      .returning();
    return parseDates(member);
  }

  async updateFamilyMemberPosition(id: number, x: number, y: number): Promise<FamilyMember> {
    const [member] = await this.db.update(familyMembers)
      .set({ x, y })
      .where(eq(familyMembers.id, id))
      .returning();
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    return member;
  }

  async updateFamilyMember(id: number, memberUpdate: Partial<InsertFamilyMember>): Promise<FamilyMember> {
    const [member] = await this.db.update(familyMembers)
      .set(prepareDates(memberUpdate))
      .where(eq(familyMembers.id, id))
      .returning();
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    return parseDates(member);
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const [relationship] = await this.db.insert(relationships)
      .values(prepareDates(insertRelationship))
      .returning();
    return parseDates(relationship);
  }

  async updateRelationship(id: number, relationshipUpdate: Partial<InsertRelationship>): Promise<Relationship> {
    const [relationship] = await this.db.update(relationships)
      .set(prepareDates(relationshipUpdate))
      .where(eq(relationships.id, id))
      .returning();
    
    if (!relationship) {
      throw new Error('Relationship not found');
    }
    
    return parseDates(relationship);
  }

  async createEvent(insertEvent: InsertFamilyEvent): Promise<FamilyEvent> {
    const [event] = await this.db.insert(familyEvents)
      .values(prepareDates(insertEvent))
      .returning();
    return parseDates(event);
  }

  async getEvents(memberIds?: number[]): Promise<FamilyEvent[]> {
    if (!memberIds?.length) {
      const events = await this.db.select().from(familyEvents);
      return events.map(e => parseDates(e));
    }
    // Use a raw SQL string for the array overlap query
    const arrayString = `ARRAY[${memberIds.join(',')}]::int[]`;
    const events = await this.db.execute<FamilyEvent[]>(
      sql.raw(`SELECT * FROM family_events WHERE member_ids && ${arrayString}`)
    );
    return events.map(e => parseDates(e));
  }

  async deleteFamilyMember(id: number): Promise<void> {
    // Check if member exists first
    const member = await this.db.select()
      .from(familyMembers)
      .where(eq(familyMembers.id, id));

    if (member.length === 0) {
      throw new Error('Family member not found');
    }

    // Delete related relationships (will cascade due to foreign key)
    await this.db.delete(relationships)
      .where(eq(relationships.fromMemberId, id))
      .returning();
    
    await this.db.delete(relationships)
      .where(eq(relationships.toMemberId, id))
      .returning();
    
    // Delete events containing this member
    await this.db.delete(familyEvents)
      .where(sql`${id} = ANY(${familyEvents.memberIds})`)
      .returning();
    
    // Then delete the member
    await this.db.delete(familyMembers)
      .where(eq(familyMembers.id, id))
      .returning();
  }

  async deleteRelationship(id: number): Promise<void> {
    const result = await this.db.delete(relationships)
      .where(eq(relationships.id, id))
      .returning();
    
    if (!result.length) {
      throw new Error('Relationship not found');
    }
  }

  async deleteEvent(id: number): Promise<void> {
    const result = await this.db.delete(familyEvents)
      .where(eq(familyEvents.id, id))
      .returning();
    
    if (!result.length) {
      throw new Error('Event not found');
    }
  }
}

// Export a singleton instance
export const storage = new PostgresStorage();
