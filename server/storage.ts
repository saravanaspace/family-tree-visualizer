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
  type FamilyTreeData,
  type RestoreMember
} from "@shared/schema";
import { wouldCreateParentCycle } from '@shared/graph';
import { StorageError } from './storage-error';
import { eq, sql, inArray } from 'drizzle-orm';
import { MemoryStorage } from './memory-storage';
import { isDemoMode } from './demo-guard';

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

/** Operations the app needs from a storage backend (Postgres or in-memory demo). */
export interface Storage {
  getFamilyTree(): Promise<FamilyTreeData>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMemberPosition(id: number, x: number, y: number): Promise<FamilyMember>;
  updateFamilyMemberPositions(positions: { id: number; x: number; y: number }[]): Promise<number>;
  restoreFamilyMember(snapshot: RestoreMember): Promise<{ member: FamilyMember; relationships: Relationship[]; events: FamilyEvent[] }>;
  updateFamilyMember(id: number, update: Partial<InsertFamilyMember>): Promise<FamilyMember>;
  deleteFamilyMember(id: number): Promise<void>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  updateRelationship(id: number, update: Partial<InsertRelationship>): Promise<Relationship>;
  deleteRelationship(id: number): Promise<void>;
  createEvent(event: InsertFamilyEvent): Promise<FamilyEvent>;
  getEvents(memberIds?: number[]): Promise<FamilyEvent[]>;
  deleteEvent(id: number): Promise<void>;
}

export class PostgresStorage implements Storage {
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

  async updateFamilyMemberPositions(positions: { id: number; x: number; y: number }[]): Promise<number> {
    if (new Set(positions.map((p) => p.id)).size !== positions.length) {
      throw new StorageError('INVALID', 'Duplicate member ids');
    }
    return this.db.transaction(async (tx) => {
      for (const { id, x, y } of positions) {
        const updated = await tx.update(familyMembers).set({ x, y }).where(eq(familyMembers.id, id)).returning({ id: familyMembers.id });
        // Throwing inside the transaction rolls back every earlier write.
        if (!updated.length) throw new StorageError('NOT_FOUND', 'Family member not found');
      }
      return positions.length;
    });
  }

  async restoreFamilyMember(snapshot: RestoreMember) {
    const { member, relationships: rels, events } = snapshot;
    return this.db.transaction(async (tx) => {
      const exists = async (id: number) =>
        (await tx.select({ id: familyMembers.id }).from(familyMembers).where(eq(familyMembers.id, id))).length > 0;

      if (await exists(member.id)) throw new StorageError('CONFLICT', 'Family member id already exists');

      const [restoredMember] = await tx.insert(familyMembers).values(prepareDates(member) as any).returning();

      const otherIds = new Set<number>();
      for (const r of rels) otherIds.add(r.fromMemberId === member.id ? r.toMemberId : r.fromMemberId);
      for (const e of events) e.memberIds.forEach((id) => id !== member.id && otherIds.add(id));
      for (const id of Array.from(otherIds)) {
        if (!(await exists(id))) throw new StorageError('INVALID', 'Snapshot references a missing member');
      }

      const relIds = rels.map((r) => r.id);
      const eventIds = events.map((e) => e.id);
      if (relIds.length && (await tx.select({ id: relationships.id }).from(relationships).where(inArray(relationships.id, relIds))).length) {
        throw new StorageError('CONFLICT', 'Relationship id already exists');
      }
      if (eventIds.length && (await tx.select({ id: familyEvents.id }).from(familyEvents).where(inArray(familyEvents.id, eventIds))).length) {
        throw new StorageError('CONFLICT', 'Event id already exists');
      }

      const restoredRels = rels.length
        ? await tx.insert(relationships).values(rels.map((r) => prepareDates(r)) as any).returning()
        : [];
      const restoredEvents = events.length
        ? await tx.insert(familyEvents).values(events.map((e) => prepareDates(e)) as any).returning()
        : [];

      // Explicit ids bypass the serial sequences; move them past the restored ids.
      for (const [table, column] of [['family_members', 'id'], ['relationships', 'id'], ['family_events', 'id']]) {
        await tx.execute(sql.raw(
          `SELECT setval(pg_get_serial_sequence('${table}', '${column}'), GREATEST((SELECT COALESCE(MAX(${column}), 1) FROM ${table}), nextval(pg_get_serial_sequence('${table}', '${column}')) - 1))`
        ));
      }

      return {
        member: parseDates(restoredMember),
        relationships: restoredRels.map((r) => parseDates(r)),
        events: restoredEvents.map((e) => parseDates(e)),
      };
    });
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
    if (insertRelationship.type === 'parent-child') {
      const existing = await this.db.select().from(relationships).where(eq(relationships.type, 'parent-child'));
      if (wouldCreateParentCycle(existing, insertRelationship.fromMemberId, insertRelationship.toMemberId)) {
        throw new StorageError('INVALID', 'Relationship would create a parent-child cycle');
      }
    }
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

// Demo mode (enabled only by server/demo.ts) uses in-memory sample data; otherwise Postgres.
export const storage: Storage = isDemoMode() ? new MemoryStorage() : new PostgresStorage();
