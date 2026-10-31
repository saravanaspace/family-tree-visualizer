import type {
  FamilyMember, InsertFamilyMember,
  Relationship, InsertRelationship,
  FamilyEvent, InsertFamilyEvent,
  FamilyTreeData, RestoreMember,
} from "@shared/schema";
import { wouldCreateParentCycle } from "@shared/graph";
import { StorageError } from "./storage-error";
import { buildSampleDataset } from "./demo-data";

/** In-memory storage for demo mode. Mirrors PostgresStorage behavior; nothing is persisted. */
export class MemoryStorage {
  private members: FamilyMember[] = [];
  private rels: Relationship[] = [];
  private events: FamilyEvent[] = [];
  private nextId = { member: 1, rel: 1, event: 1 };

  /** Pass `withSampleData = false` for an empty store (used by tests). */
  constructor(withSampleData = true) {
    if (withSampleData) this.reset();
  }

  /** Replaces all data with a fresh sample dataset and restores the id counters. */
  reset(): void {
    const data = buildSampleDataset();
    this.members = data.members;
    this.rels = data.relationships;
    this.events = data.events;
    this.nextId = {
      member: Math.max(0, ...data.members.map((m) => m.id)) + 1,
      rel: Math.max(0, ...data.relationships.map((r) => r.id)) + 1,
      event: Math.max(0, ...data.events.map((e) => e.id)) + 1,
    };
  }

  async getFamilyTree(): Promise<FamilyTreeData> {
    return {
      members: this.members.map(copyMember),
      relationships: this.rels.map(copyRel),
      events: this.events.map(copyEvent),
    };
  }

  async createFamilyMember(input: InsertFamilyMember): Promise<FamilyMember> {
    const now = new Date();
    const defaults = {
      middleName: null, lastName: null, gender: null, birthDate: null, birthPlace: null,
      deathDate: null, deathPlace: null, occupation: null, biography: null, photoUrl: null,
      email: null, isLiving: true, x: 0, y: 0,
    };
    const member = Object.assign(
      {}, defaults, stripUndefined(input),
      { id: this.nextId.member++, createdAt: now, updatedAt: now },
    ) as unknown as FamilyMember;
    this.members.push(member);
    return copyMember(member);
  }

  async updateFamilyMemberPosition(id: number, x: number, y: number): Promise<FamilyMember> {
    return this.updateFamilyMember(id, { x, y });
  }

  async updateFamilyMemberPositions(positions: { id: number; x: number; y: number }[]): Promise<number> {
    if (new Set(positions.map((p) => p.id)).size !== positions.length) {
      throw new StorageError("INVALID", "Duplicate member ids");
    }
    // Validate everything first so a failure leaves all positions untouched.
    const targets = positions.map((p) => {
      const member = this.members.find((m) => m.id === p.id);
      if (!member) throw new StorageError("NOT_FOUND", "Family member not found");
      return { member, p };
    });
    for (const { member, p } of targets) Object.assign(member, { x: p.x, y: p.y, updatedAt: new Date() });
    return positions.length;
  }

  async restoreFamilyMember(snapshot: RestoreMember) {
    const { member, relationships: rels, events } = snapshot;
    const hasMember = (id: number) => this.members.some((m) => m.id === id);
    if (hasMember(member.id)) throw new StorageError("CONFLICT", "Family member id already exists");

    const others = new Set<number>();
    for (const r of rels) others.add(r.fromMemberId === member.id ? r.toMemberId : r.fromMemberId);
    for (const e of events) e.memberIds.forEach((id) => id !== member.id && others.add(id));
    Array.from(others).forEach((id) => {
      if (!hasMember(id)) throw new StorageError("INVALID", "Snapshot references a missing member");
    });
    if (rels.some((r) => this.rels.some((x) => x.id === r.id))) throw new StorageError("CONFLICT", "Relationship id already exists");
    if (events.some((e) => this.events.some((x) => x.id === e.id))) throw new StorageError("CONFLICT", "Event id already exists");

    const now = new Date();
    const memberDefaults = {
      middleName: null, lastName: null, gender: null, birthDate: null, birthPlace: null,
      deathDate: null, deathPlace: null, occupation: null, biography: null, photoUrl: null,
      email: null, isLiving: true, x: 0, y: 0,
    };
    const relDefaults = { subType: null, startDate: null, endDate: null, status: "active", notes: null };
    const eventDefaults = { date: null, place: null, description: null };

    const restoredMember = Object.assign({}, memberDefaults, stripUndefined(member), { createdAt: now, updatedAt: now }) as unknown as FamilyMember;
    const restoredRels = rels.map((r) => Object.assign({}, relDefaults, stripUndefined(r), { createdAt: now, updatedAt: now }) as unknown as Relationship);
    const restoredEvents = events.map((e) => Object.assign({}, eventDefaults, stripUndefined(e), { memberIds: [...e.memberIds], createdAt: now, updatedAt: now }) as unknown as FamilyEvent);

    this.members.push(restoredMember);
    this.rels.push(...restoredRels);
    this.events.push(...restoredEvents);
    this.nextId = {
      member: Math.max(this.nextId.member, member.id + 1),
      rel: Math.max(this.nextId.rel, ...rels.map((r) => r.id + 1)),
      event: Math.max(this.nextId.event, ...events.map((e) => e.id + 1)),
    };
    return { member: copyMember(restoredMember), relationships: restoredRels.map(copyRel), events: restoredEvents.map(copyEvent) };
  }

  async updateFamilyMember(id: number, update: Partial<InsertFamilyMember>): Promise<FamilyMember> {
    const member = this.members.find((m) => m.id === id);
    if (!member) throw new Error("Family member not found");
    Object.assign(member, stripUndefined(update), { updatedAt: new Date() });
    return copyMember(member);
  }

  async createRelationship(input: InsertRelationship): Promise<Relationship> {
    const exists = (memberId: number) => this.members.some((m) => m.id === memberId);
    if (!exists(input.fromMemberId) || !exists(input.toMemberId)) {
      throw new Error('insert or update on table "relationships" violates foreign key constraint');
    }
    if (input.type === "parent-child" && wouldCreateParentCycle(this.rels, input.fromMemberId, input.toMemberId)) {
      throw new StorageError("INVALID", "Relationship would create a parent-child cycle");
    }
    const duplicate = this.rels.some(
      (r) => r.fromMemberId === input.fromMemberId && r.toMemberId === input.toMemberId && r.type === input.type,
    );
    if (duplicate) {
      throw new Error('duplicate key value violates unique constraint "relationships_members_pair_idx"');
    }
    const now = new Date();
    const defaults = { subType: null, startDate: null, endDate: null, status: "active", notes: null };
    const rel = Object.assign(
      {}, defaults, stripUndefined(input),
      { id: this.nextId.rel++, createdAt: now, updatedAt: now },
    ) as unknown as Relationship;
    this.rels.push(rel);
    return copyRel(rel);
  }

  async updateRelationship(id: number, update: Partial<InsertRelationship>): Promise<Relationship> {
    const rel = this.rels.find((r) => r.id === id);
    if (!rel) throw new Error("Relationship not found");
    Object.assign(rel, stripUndefined(update), { updatedAt: new Date() });
    return copyRel(rel);
  }

  async createEvent(input: InsertFamilyEvent): Promise<FamilyEvent> {
    const now = new Date();
    const defaults = { date: null, place: null, description: null };
    const event = Object.assign(
      {}, defaults, stripUndefined(input),
      { memberIds: [...input.memberIds], id: this.nextId.event++, createdAt: now, updatedAt: now },
    ) as unknown as FamilyEvent;
    this.events.push(event);
    return copyEvent(event);
  }

  async getEvents(memberIds?: number[]): Promise<FamilyEvent[]> {
    const list = memberIds?.length
      ? this.events.filter((e) => e.memberIds.some((id) => memberIds.includes(id)))
      : this.events;
    return list.map(copyEvent);
  }

  async deleteFamilyMember(id: number): Promise<void> {
    if (!this.members.some((m) => m.id === id)) throw new Error("Family member not found");
    this.members = this.members.filter((m) => m.id !== id);
    this.rels = this.rels.filter((r) => r.fromMemberId !== id && r.toMemberId !== id);
    this.events = this.events.filter((e) => !e.memberIds.includes(id));
  }

  async deleteRelationship(id: number): Promise<void> {
    if (!this.rels.some((r) => r.id === id)) throw new Error("Relationship not found");
    this.rels = this.rels.filter((r) => r.id !== id);
  }

  async deleteEvent(id: number): Promise<void> {
    if (!this.events.some((e) => e.id === id)) throw new Error("Event not found");
    this.events = this.events.filter((e) => e.id !== id);
  }
}

// Optional fields omitted by the client arrive as undefined; don't let them overwrite defaults.
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

const copyMember = (m: FamilyMember): FamilyMember => ({ ...m });
const copyRel = (r: Relationship): Relationship => ({ ...r });
const copyEvent = (e: FamilyEvent): FamilyEvent => ({ ...e, memberIds: [...e.memberIds] });
