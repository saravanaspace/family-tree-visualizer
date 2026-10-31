import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../memory-storage';
import { buildSampleDataset } from '../demo-data';
import { runStorageContract } from './storage.contract';

// Same behavior as Postgres, no database needed.
runStorageContract('MemoryStorage (shared contract)', async () => new MemoryStorage(false));

describe('Sample dataset', () => {
  const data = buildSampleDataset();

  it('is small, multi-generational, and includes a deceased member', () => {
    expect(data.members).toHaveLength(8);
    expect(data.members.some((m) => !m.isLiving && m.deathDate)).toBe(true);
    expect(data.relationships.some((r) => r.type === 'spouse')).toBe(true);
    expect(data.relationships.some((r) => r.type === 'parent-child')).toBe(true);
    expect(data.events.length).toBeGreaterThanOrEqual(5);
    expect(new Set(data.events.map((e) => e.type)).size).toBeGreaterThan(2);
  });

  it('only references members that exist', () => {
    const ids = new Set(data.members.map((m) => m.id));
    for (const r of data.relationships) {
      expect(ids.has(r.fromMemberId) && ids.has(r.toMemberId)).toBe(true);
    }
    for (const e of data.events) {
      expect(e.memberIds.every((id) => ids.has(id))).toBe(true);
    }
  });

  it('gives each call fresh objects', () => {
    expect(buildSampleDataset().members[0]).not.toBe(data.members[0]);
  });
});

describe('MemoryStorage demo behavior', () => {
  it('starts with the sample dataset', async () => {
    const tree = await new MemoryStorage().getFamilyTree();
    expect(tree.members).toHaveLength(8);
  });

  it('loses edits on a new instance', async () => {
    const first = new MemoryStorage();
    await first.deleteFamilyMember(1);
    expect((await first.getFamilyTree()).members).toHaveLength(7);
    expect((await new MemoryStorage().getFamilyTree()).members).toHaveLength(8);
  });

  it('does not let callers mutate stored data', async () => {
    const storage = new MemoryStorage();
    const tree = await storage.getFamilyTree();
    tree.members[0].firstName = 'Changed';
    tree.events[0].memberIds.push(999);
    const again = await storage.getFamilyTree();
    expect(again.members[0].firstName).not.toBe('Changed');
    expect(again.events[0].memberIds).not.toContain(999);
  });

  it('reset restores the sample dataset and id counters', async () => {
    const storage = new MemoryStorage();
    await storage.createFamilyMember({ firstName: 'Extra', x: 0, y: 0 } as any);
    await storage.deleteFamilyMember(2);
    storage.reset();
    const tree = await storage.getFamilyTree();
    expect(tree.members).toHaveLength(8);
    expect(tree.relationships).toHaveLength(11);
    const next = await storage.createFamilyMember({ firstName: 'After', x: 0, y: 0 } as any);
    expect(next.id).toBe(9);
  });
});
