import { describe, expect, it } from 'vitest';
import { makeStressTree } from '@/test/stress-fixture';
import { layoutTree } from '../layout';
import { toFlow } from '../toFlow';
import { computeCollapse } from '../collapse';
import { focusSet } from '../focus';

// SC-012: auto-arrange of a large tree must stay under 2 s.
describe.each([200, 500])('stress: %i members', (size) => {
  const tree = makeStressTree(size);

  it('builds a valid fixture', () => {
    expect(tree.members).toHaveLength(size);
    expect(new Set(tree.members.map((m) => m.id)).size).toBe(size);
  });

  it('auto-arranges in under 2 seconds with unique positions', () => {
    const start = performance.now();
    const positions = layoutTree(tree.members.map((m) => m.id), tree.relationships);
    expect(performance.now() - start).toBeLessThan(2000);
    expect(positions.size).toBe(size);
    const unique = new Set(Array.from(positions.values(), (p) => `${p.x},${p.y}`));
    expect(unique.size).toBe(size);
  });

  it('derives flow nodes, collapse and focus quickly', () => {
    const start = performance.now();
    const { nodes } = toFlow(tree, { collapsed: new Set([1]) });
    computeCollapse(tree.members.map((m) => m.id), tree.relationships, new Set([1]));
    focusSet(2, tree.relationships);
    expect(performance.now() - start).toBeLessThan(1000);
    expect(nodes.length).toBeGreaterThan(0);
  });
});
