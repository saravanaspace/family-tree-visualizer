import { describe, it, expect, beforeEach } from 'vitest';
import type { Storage } from '../storage';
import type { InsertFamilyMember, InsertRelationship, InsertFamilyEvent } from '@shared/schema';

// Behavior every Storage implementation (Postgres, in-memory) must share.
// `setup` must return a Storage that starts empty.
export function runStorageContract(name: string, setup: () => Promise<Storage>) {
describe(name, () => {
  let storage: Storage;

  beforeEach(async () => {
    storage = await setup();
  });

  describe('Family Members', () => {
    it('should create a family member', async () => {
      const memberData: InsertFamilyMember = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        birthDate: new Date('1980-01-01'),
        birthPlace: 'New York',
        occupation: 'Engineer',
        biography: 'A talented engineer',
        isLiving: true,
        x: 100,
        y: 100
      };

      const member = await storage.createFamilyMember(memberData);
      expect(member).toMatchObject(memberData);
      expect(member.id).toBeDefined();
    });

    it('should update member position', async () => {
      const member = await storage.createFamilyMember({
        firstName: 'Jane',
        lastName: 'Doe',
        gender: 'female',
        x: 0,
        y: 0
      });

      const updatedMember = await storage.updateFamilyMemberPosition(member.id, 200, 300);
      expect(updatedMember.x).toBe(200);
      expect(updatedMember.y).toBe(300);
    });

    it('should throw error when updating non-existent member', async () => {
      await expect(storage.updateFamilyMemberPosition(999, 100, 100))
        .rejects.toThrow('Family member not found');
    });

    describe('Delete Family Member', () => {
      it('should delete a family member and their relationships', async () => {
        // Create a family structure
        const father = await storage.createFamilyMember({
          firstName: 'John',
          lastName: 'Smith',
          gender: 'male',
          x: 0,
          y: 0
        });

        const mother = await storage.createFamilyMember({
          firstName: 'Jane',
          lastName: 'Smith',
          gender: 'female',
          x: 100,
          y: 0
        });

        const child = await storage.createFamilyMember({
          firstName: 'Jimmy',
          lastName: 'Smith',
          gender: 'male',
          x: 50,
          y: 100
        });

        // Create relationships
        await storage.createRelationship({
          fromMemberId: father.id,
          toMemberId: child.id,
          type: 'parent-child',
          subType: 'biological'
        });

        await storage.createRelationship({
          fromMemberId: mother.id,
          toMemberId: child.id,
          type: 'parent-child',
          subType: 'biological'
        });

        await storage.createRelationship({
          fromMemberId: father.id,
          toMemberId: mother.id,
          type: 'spouse',
          status: 'active'
        });

        // Initial state verification
        let tree = await storage.getFamilyTree();
        expect(tree.members).toHaveLength(3);
        expect(tree.relationships).toHaveLength(3);

        // Delete the father
        await storage.deleteFamilyMember(father.id);

        // Verify state after deletion
        tree = await storage.getFamilyTree();
        expect(tree.members).toHaveLength(2);
        expect(tree.relationships).toHaveLength(1); // Only mother-child relationship should remain
        expect(tree.members.find(m => m.id === father.id)).toBeUndefined();
        expect(tree.relationships.every(r => r.fromMemberId !== father.id && r.toMemberId !== father.id)).toBe(true);
      });

      it('should handle deleting a member with no relationships', async () => {
        const member = await storage.createFamilyMember({
          firstName: 'Solo',
          lastName: 'Member',
          gender: 'male',
          x: 0,
          y: 0
        });

        let tree = await storage.getFamilyTree();
        expect(tree.members).toHaveLength(1);

        await storage.deleteFamilyMember(member.id);

        tree = await storage.getFamilyTree();
        expect(tree.members).toHaveLength(0);
        expect(tree.relationships).toHaveLength(0);
      });

      it('should throw error when deleting non-existent member', async () => {
        await expect(storage.deleteFamilyMember(999))
          .rejects.toThrow('Family member not found');
      });
    });

    describe('Update Family Member', () => {
      it('should update family member details', async () => {
        const member = await storage.createFamilyMember({
          firstName: 'John',
          lastName: 'Smith',
          gender: 'male',
          birthDate: new Date('1990-01-01'),
          birthPlace: 'New York',
          occupation: 'Engineer',
          isLiving: true,
          x: 0,
          y: 0
        });

        const updateData = {
          firstName: 'John',
          middleName: 'Albert',
          lastName: 'Smith',
          occupation: 'Senior Engineer',
          biography: 'Updated biography'
        };

        const updatedMember = await storage.updateFamilyMember(member.id, updateData);
        expect(updatedMember.firstName).toBe(updateData.firstName);
        expect(updatedMember.middleName).toBe(updateData.middleName);
        expect(updatedMember.occupation).toBe(updateData.occupation);
        expect(updatedMember.biography).toBe(updateData.biography);
        expect(updatedMember.birthDate?.toISOString().split('T')[0]).toBe('1990-01-01');
        expect(updatedMember.gender).toBe(member.gender);
      });

      it('should throw error when updating non-existent member', async () => {
        await expect(storage.updateFamilyMember(999, { firstName: 'New Name' }))
          .rejects.toThrow('Family member not found');
      });
    });
  });

  describe('Relationships', () => {
    it('should create a relationship between members', async () => {
      const father = await storage.createFamilyMember({
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        isLiving: true,
        x: 0,
        y: 0
      });

      const child = await storage.createFamilyMember({
        firstName: 'Jimmy',
        lastName: 'Smith',
        gender: 'male',
        isLiving: true,
        x: 100,
        y: 100
      });

      const relationshipData: InsertRelationship = {
        fromMemberId: father.id,
        toMemberId: child.id,
        type: 'parent-child',
        subType: 'biological',
        status: 'active'
      };

      const relationship = await storage.createRelationship(relationshipData);
      expect(relationship).toMatchObject(relationshipData);
      expect(relationship.id).toBeDefined();
    });

    it('should update relationship status and dates', async () => {
      const spouse1 = await storage.createFamilyMember({
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        isLiving: true,
        x: 0,
        y: 0
      });

      const spouse2 = await storage.createFamilyMember({
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        isLiving: true,
        x: 100,
        y: 0
      });

      const relationship = await storage.createRelationship({
        fromMemberId: spouse1.id,
        toMemberId: spouse2.id,
        type: 'spouse',
        startDate: new Date('2000-01-01'),
        status: 'active'
      });

      const updateData = {
        status: 'divorced',
        endDate: new Date('2020-01-01')
      };

      const updatedRelationship = await storage.updateRelationship(relationship.id, updateData);
      expect(updatedRelationship.status).toBe('divorced');
      expect(updatedRelationship.endDate?.toISOString().split('T')[0]).toBe('2020-01-01');
    });
  });

  describe('Family Events', () => {
    it('should create a family event', async () => {
      const member = await storage.createFamilyMember({
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        isLiving: true,
        x: 0,
        y: 0
      });

      const eventData: InsertFamilyEvent = {
        type: 'graduation',
        date: new Date('2020-05-15'),
        place: 'Harvard University',
        description: 'Graduated with honors',
        memberIds: [member.id]
      };

      const event = await storage.createEvent(eventData);
      expect(event).toMatchObject({
        ...eventData,
        date: expect.any(Date)
      });
      expect(event.id).toBeDefined();
    });

    it('should get events for specific members', async () => {
      const father = await storage.createFamilyMember({
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        isLiving: true,
        x: 0,
        y: 0
      });

      const mother = await storage.createFamilyMember({
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        isLiving: true,
        x: 100,
        y: 0
      });

      // Create marriage event
      await storage.createEvent({
        type: 'marriage',
        date: new Date('2000-06-15'),
        place: 'New York',
        description: 'Wedding ceremony',
        memberIds: [father.id, mother.id]
      });

      // Create individual event
      await storage.createEvent({
        type: 'graduation',
        date: new Date('1998-05-20'),
        place: 'University',
        description: 'College graduation',
        memberIds: [father.id]
      });

      const fatherEvents = await storage.getEvents([father.id]);
      expect(fatherEvents).toHaveLength(2);

      const motherEvents = await storage.getEvents([mother.id]);
      expect(motherEvents).toHaveLength(1);
    });

    it('should handle empty member list for events query', async () => {
      const events = await storage.getEvents([]);
      expect(Array.isArray(events)).toBe(true);
    });

    it('should handle invalid member IDs in events query', async () => {
      const events = await storage.getEvents([999, 1000]);
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(0);
    });
  });

  describe('Complex Family Scenarios', () => {
    it('should handle multi-generational family tree', async () => {
      // Create grandparents
      const grandfather = await storage.createFamilyMember({
        firstName: 'George',
        lastName: 'Smith',
        gender: 'male',
        birthDate: new Date('1940-01-01'),
        isLiving: false,
        deathDate: new Date('2010-01-01'),
        x: 0,
        y: 0
      });

      const grandmother = await storage.createFamilyMember({
        firstName: 'Martha',
        lastName: 'Smith',
        gender: 'female',
        birthDate: new Date('1942-03-15'),
        isLiving: true,
        x: 100,
        y: 0
      });

      // Create parents
      const father = await storage.createFamilyMember({
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        birthDate: new Date('1970-06-20'),
        isLiving: true,
        x: 50,
        y: 100
      });

      // Create relationships
      await storage.createRelationship({
        fromMemberId: grandfather.id,
        toMemberId: grandmother.id,
        type: 'spouse',
        startDate: new Date('1965-01-01'),
        endDate: new Date('2010-01-01'),
        status: 'widowed'
      });

      await storage.createRelationship({
        fromMemberId: grandfather.id,
        toMemberId: father.id,
        type: 'parent-child',
        subType: 'biological'
      });

      await storage.createRelationship({
        fromMemberId: grandmother.id,
        toMemberId: father.id,
        type: 'parent-child',
        subType: 'biological'
      });

      const tree = await storage.getFamilyTree();
      expect(tree.members).toHaveLength(3);
      expect(tree.relationships).toHaveLength(3);
    });

    it('should handle blended families with step-relationships', async () => {
      const mother = await storage.createFamilyMember({
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        isLiving: true,
        x: 0,
        y: 0
      });

      const biologicalChild = await storage.createFamilyMember({
        firstName: 'Billy',
        lastName: 'Smith',
        gender: 'male',
        isLiving: true,
        x: 100,
        y: 100
      });

      const stepFather = await storage.createFamilyMember({
        firstName: 'Tom',
        lastName: 'Johnson',
        gender: 'male',
        isLiving: true,
        x: 200,
        y: 0
      });

      // Create relationships
      await storage.createRelationship({
        fromMemberId: mother.id,
        toMemberId: biologicalChild.id,
        type: 'parent-child',
        subType: 'biological'
      });

      await storage.createRelationship({
        fromMemberId: stepFather.id,
        toMemberId: biologicalChild.id,
        type: 'parent-child',
        subType: 'step'
      });

      await storage.createRelationship({
        fromMemberId: mother.id,
        toMemberId: stepFather.id,
        type: 'spouse',
        startDate: new Date('2010-01-01'),
        status: 'active'
      });

      const tree = await storage.getFamilyTree();
      expect(tree.members).toHaveLength(3);
      expect(tree.relationships).toHaveLength(3);
      
      // Verify step-relationship
      const stepRelationship = tree.relationships.find(r => 
        r.fromMemberId === stepFather.id && r.toMemberId === biologicalChild.id
      );
      expect(stepRelationship?.subType).toBe('step');
    });
  });

  describe('Constraints and cascades', () => {
    const person = (firstName: string) => storage.createFamilyMember({ firstName, x: 0, y: 0 });

    it('should reject a duplicate relationship', async () => {
      const a = await person('A');
      const b = await person('B');
      const rel = { fromMemberId: a.id, toMemberId: b.id, type: 'spouse' as const };
      await storage.createRelationship(rel);
      await expect(storage.createRelationship(rel)).rejects.toThrow();
    });

    it('should reject a relationship that references a missing member', async () => {
      const a = await person('A');
      await expect(storage.createRelationship({ fromMemberId: a.id, toMemberId: 9999, type: 'spouse' }))
        .rejects.toThrow();
    });

    it('should accept an event that references a missing member', async () => {
      const event = await storage.createEvent({ type: 'other', memberIds: [9999] });
      expect(event.id).toBeDefined();
    });

    it('should remove events involving a deleted member', async () => {
      const a = await person('A');
      const b = await person('B');
      await storage.createEvent({ type: 'marriage', memberIds: [a.id, b.id] });
      await storage.deleteFamilyMember(a.id);
      expect((await storage.getFamilyTree()).events).toHaveLength(0);
    });

    it('should report not-found for missing relationships and events', async () => {
      await expect(storage.updateRelationship(999, { status: 'divorced' })).rejects.toThrow('Relationship not found');
      await expect(storage.deleteRelationship(999)).rejects.toThrow('Relationship not found');
      await expect(storage.deleteEvent(999)).rejects.toThrow('Event not found');
    });

    it('should never reuse ids after a delete', async () => {
      const a = await person('A');
      await storage.deleteFamilyMember(a.id);
      const b = await person('B');
      expect(b.id).not.toBe(a.id);
    });
  });

  describe('Batch positions', () => {
    const person = (firstName: string) => storage.createFamilyMember({ firstName, x: 0, y: 0 });

    it('updates every position', async () => {
      const a = await person('A');
      const b = await person('B');
      const count = await storage.updateFamilyMemberPositions([
        { id: a.id, x: 10, y: 20 },
        { id: b.id, x: -5.5, y: 7 },
      ]);
      expect(count).toBe(2);
      const { members } = await storage.getFamilyTree();
      expect(members.find((m) => m.id === a.id)).toMatchObject({ x: 10, y: 20 });
      expect(members.find((m) => m.id === b.id)).toMatchObject({ x: -5.5, y: 7 });
    });

    it('writes nothing when any id is unknown', async () => {
      const a = await person('A');
      await expect(storage.updateFamilyMemberPositions([
        { id: a.id, x: 10, y: 20 },
        { id: 9999, x: 1, y: 1 },
      ])).rejects.toThrow('Family member not found');
      const { members } = await storage.getFamilyTree();
      expect(members[0]).toMatchObject({ x: 0, y: 0 });
    });

    it('rejects duplicate ids without writing', async () => {
      const a = await person('A');
      await expect(storage.updateFamilyMemberPositions([
        { id: a.id, x: 1, y: 1 },
        { id: a.id, x: 2, y: 2 },
      ])).rejects.toThrow();
      expect((await storage.getFamilyTree()).members[0]).toMatchObject({ x: 0, y: 0 });
    });
  });

  describe('Parent-child cycles', () => {
    const person = (firstName: string) => storage.createFamilyMember({ firstName, x: 0, y: 0 });
    const parentOf = (from: number, to: number) =>
      storage.createRelationship({ fromMemberId: from, toMemberId: to, type: 'parent-child' });

    it('rejects a self parent-child link', async () => {
      const a = await person('A');
      await expect(parentOf(a.id, a.id)).rejects.toThrow('cycle');
    });

    it('rejects a link that makes a descendant an ancestor', async () => {
      const a = await person('A');
      const b = await person('B');
      const c = await person('C');
      await parentOf(a.id, b.id);
      await parentOf(b.id, c.id);
      await expect(parentOf(c.id, a.id)).rejects.toThrow('cycle');
      expect((await storage.getFamilyTree()).relationships).toHaveLength(2);
    });

    it('still allows spouse links in both directions and valid parent links', async () => {
      const a = await person('A');
      const b = await person('B');
      await storage.createRelationship({ fromMemberId: a.id, toMemberId: b.id, type: 'spouse' });
      await storage.createRelationship({ fromMemberId: b.id, toMemberId: a.id, type: 'spouse' });
      await expect(parentOf(a.id, b.id)).resolves.toBeDefined();
    });
  });

  describe('Restore member', () => {
    const person = (firstName: string) => storage.createFamilyMember({ firstName, x: 0, y: 0 });

    it('restores a deleted member with original ids, relationships and events', async () => {
      const parent = await person('Parent');
      const child = await person('Child');
      const rel = await storage.createRelationship({ fromMemberId: parent.id, toMemberId: child.id, type: 'parent-child' });
      const event = await storage.createEvent({ type: 'birth', memberIds: [child.id, parent.id] });
      const before = await storage.getFamilyTree();

      await storage.deleteFamilyMember(child.id);
      expect((await storage.getFamilyTree()).members).toHaveLength(1);

      const restored = await storage.restoreFamilyMember({
        member: before.members.find((m) => m.id === child.id)!,
        relationships: [before.relationships.find((r) => r.id === rel.id)!],
        events: [before.events.find((e) => e.id === event.id)!],
      });
      expect(restored.member.id).toBe(child.id);

      const after = await storage.getFamilyTree();
      expect(after.members.map((m) => m.id).sort()).toEqual([parent.id, child.id].sort());
      expect(after.relationships.map((r) => r.id)).toEqual([rel.id]);
      expect(after.events.map((e) => e.id)).toEqual([event.id]);
    });

    it('does not reuse the restored id for new members', async () => {
      const a = await person('A');
      const snapshot = (await storage.getFamilyTree()).members[0];
      await storage.deleteFamilyMember(a.id);
      await storage.restoreFamilyMember({ member: snapshot, relationships: [], events: [] });
      const next = await person('Next');
      expect(next.id).not.toBe(a.id);
    });

    it('rejects an id collision with a conflict error', async () => {
      const a = await person('A');
      const snapshot = (await storage.getFamilyTree()).members[0];
      await expect(storage.restoreFamilyMember({ member: snapshot, relationships: [], events: [] }))
        .rejects.toMatchObject({ code: 'CONFLICT' });
      expect((await storage.getFamilyTree()).members.map((m) => m.id)).toEqual([a.id]);
    });

    it('rejects a dangling relationship and writes nothing', async () => {
      const a = await person('A');
      const snapshot = (await storage.getFamilyTree()).members[0];
      await storage.deleteFamilyMember(a.id);
      await expect(storage.restoreFamilyMember({
        member: snapshot,
        relationships: [{
          id: 50, fromMemberId: a.id, toMemberId: 9999, type: 'spouse', subType: null, startDate: null,
          endDate: null, status: 'active', notes: null, createdAt: null, updatedAt: null,
        }],
        events: [],
      })).rejects.toMatchObject({ code: 'INVALID' });
      expect((await storage.getFamilyTree()).members).toHaveLength(0);
    });

    it('rolls back when an event id collides', async () => {
      const a = await person('A');
      const b = await person('B');
      const ev = await storage.createEvent({ type: 'other', memberIds: [b.id] });
      const snapshot = (await storage.getFamilyTree()).members.find((m) => m.id === a.id)!;
      await storage.deleteFamilyMember(a.id);
      await expect(storage.restoreFamilyMember({
        member: snapshot,
        relationships: [],
        events: [{ id: ev.id, type: 'birth', memberIds: [a.id], date: null, place: null, description: null, createdAt: null, updatedAt: null }],
      })).rejects.toMatchObject({ code: 'CONFLICT' });
      expect((await storage.getFamilyTree()).members.map((m) => m.id)).toEqual([b.id]);
    });
  });
});
}
