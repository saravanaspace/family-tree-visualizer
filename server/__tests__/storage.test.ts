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