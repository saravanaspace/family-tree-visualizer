import { describe, it, expect, beforeEach } from 'vitest';
import { PostgresStorage } from '../storage';
import { resetDatabase } from './setup';
import type { InsertFamilyMember, InsertRelationship } from '@shared/schema';

describe('PostgresStorage', () => {
  const storage = new PostgresStorage();

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Family Members', () => {
    it('should create a family member', async () => {
      const memberData: InsertFamilyMember = {
        name: 'John Doe',
        birthDate: '1980-01-01',
        location: 'New York',
        type: 'father',
        x: 100,
        y: 100
      };

      const member = await storage.createFamilyMember(memberData);
      expect(member).toMatchObject(memberData);
      expect(member.id).toBeDefined();
    });

    it('should update member position', async () => {
      const member = await storage.createFamilyMember({
        name: 'Jane Doe',
        type: 'mother',
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

    it('should delete a family member', async () => {
      const member = await storage.createFamilyMember({
        name: 'Bob Smith',
        type: 'child',
        x: 0,
        y: 0
      });

      await storage.deleteFamilyMember(member.id);
      const tree = await storage.getFamilyTree();
      expect(tree.members.find(m => m.id === member.id)).toBeUndefined();
    });

    describe('Delete Family Member', () => {
      it('should delete a family member and their relationships', async () => {
        // Create a family structure
        const father = await storage.createFamilyMember({
          name: 'John Smith',
          type: 'father',
          x: 0,
          y: 0
        });

        const mother = await storage.createFamilyMember({
          name: 'Jane Smith',
          type: 'mother',
          x: 100,
          y: 0
        });

        const child = await storage.createFamilyMember({
          name: 'Jimmy Smith',
          type: 'child',
          x: 50,
          y: 100
        });

        // Create relationships
        await storage.createRelationship({
          fromMemberId: father.id,
          toMemberId: child.id,
          type: 'parent'
        });

        await storage.createRelationship({
          fromMemberId: mother.id,
          toMemberId: child.id,
          type: 'parent'
        });

        await storage.createRelationship({
          fromMemberId: father.id,
          toMemberId: mother.id,
          type: 'spouse'
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
          name: 'Solo Member',
          type: 'child',
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

      it('should not affect other members when deleting one member', async () => {
        const member1 = await storage.createFamilyMember({
          name: 'Member 1',
          type: 'child',
          x: 0,
          y: 0
        });

        const member2 = await storage.createFamilyMember({
          name: 'Member 2',
          type: 'child',
          x: 100,
          y: 0
        });

        await storage.deleteFamilyMember(member1.id);

        const tree = await storage.getFamilyTree();
        expect(tree.members).toHaveLength(1);
        expect(tree.members[0].id).toBe(member2.id);
      });

      it('should throw error when deleting non-existent member', async () => {
        await expect(storage.deleteFamilyMember(999))
          .rejects.toThrow('Family member not found');
      });
    });

    describe('Update Family Member', () => {
      it('should update family member details', async () => {
        const member = await storage.createFamilyMember({
          name: 'John Smith',
          birthDate: '1990-01-01',
          location: 'New York',
          type: 'father',
          x: 0,
          y: 0
        });

        const updateData = {
          name: 'John A. Smith',
          birthDate: '1990-01-02',
          location: 'Los Angeles'
        };

        const updatedMember = await storage.updateFamilyMember(member.id, updateData);
        expect(updatedMember.name).toBe(updateData.name);
        expect(updatedMember.birthDate).toBe(updateData.birthDate);
        expect(updatedMember.location).toBe(updateData.location);
        // Type and position should remain unchanged
        expect(updatedMember.type).toBe(member.type);
        expect(updatedMember.x).toBe(member.x);
        expect(updatedMember.y).toBe(member.y);
      });

      it('should update partial family member details', async () => {
        const member = await storage.createFamilyMember({
          name: 'Jane Smith',
          birthDate: '1992-03-15',
          location: 'Chicago',
          type: 'mother',
          x: 100,
          y: 100
        });

        // Update only name
        const updatedMember = await storage.updateFamilyMember(member.id, {
          name: 'Jane M. Smith'
        });
        expect(updatedMember.name).toBe('Jane M. Smith');
        expect(updatedMember.birthDate).toBe(member.birthDate);
        expect(updatedMember.location).toBe(member.location);
        expect(updatedMember.type).toBe(member.type);
      });

      it('should throw error when updating non-existent member', async () => {
        await expect(storage.updateFamilyMember(999, { name: 'New Name' }))
          .rejects.toThrow('Family member not found');
      });
    });
  });

  describe('Relationships', () => {
    it('should create a relationship between members', async () => {
      const father = await storage.createFamilyMember({
        name: 'John Smith',
        type: 'father',
        x: 0,
        y: 0
      });

      const child = await storage.createFamilyMember({
        name: 'Jimmy Smith',
        type: 'child',
        x: 100,
        y: 100
      });

      const relationshipData: InsertRelationship = {
        fromMemberId: father.id,
        toMemberId: child.id,
        type: 'parent'
      };

      const relationship = await storage.createRelationship(relationshipData);
      expect(relationship).toMatchObject(relationshipData);
      expect(relationship.id).toBeDefined();
    });

    it('should delete relationships when deleting a member', async () => {
      const father = await storage.createFamilyMember({
        name: 'John Smith',
        type: 'father',
        x: 0,
        y: 0
      });

      const child = await storage.createFamilyMember({
        name: 'Jimmy Smith',
        type: 'child',
        x: 100,
        y: 100
      });

      await storage.createRelationship({
        fromMemberId: father.id,
        toMemberId: child.id,
        type: 'parent'
      });

      await storage.deleteFamilyMember(father.id);
      const tree = await storage.getFamilyTree();
      expect(tree.relationships.length).toBe(0);
    });
  });

  describe('Family Tree', () => {
    it('should get empty tree initially', async () => {
      const tree = await storage.getFamilyTree();
      expect(tree.members).toHaveLength(0);
      expect(tree.relationships).toHaveLength(0);
    });

    it('should get complete family tree with members and relationships', async () => {
      const father = await storage.createFamilyMember({
        name: 'John Smith',
        type: 'father',
        x: 0,
        y: 0
      });

      const mother = await storage.createFamilyMember({
        name: 'Jane Smith',
        type: 'mother',
        x: 100,
        y: 0
      });

      const child = await storage.createFamilyMember({
        name: 'Jimmy Smith',
        type: 'child',
        x: 50,
        y: 100
      });

      await storage.createRelationship({
        fromMemberId: father.id,
        toMemberId: child.id,
        type: 'parent'
      });

      await storage.createRelationship({
        fromMemberId: mother.id,
        toMemberId: child.id,
        type: 'parent'
      });

      await storage.createRelationship({
        fromMemberId: father.id,
        toMemberId: mother.id,
        type: 'spouse'
      });

      const tree = await storage.getFamilyTree();
      expect(tree.members).toHaveLength(3);
      expect(tree.relationships).toHaveLength(3);
    });
  });
});