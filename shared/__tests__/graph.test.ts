import { describe, it, expect } from 'vitest';
import { wouldCreateParentCycle } from '../graph';

const pc = (from: number, to: number) => ({ fromMemberId: from, toMemberId: to, type: 'parent-child' });

describe('wouldCreateParentCycle', () => {
  it('rejects a self link', () => {
    expect(wouldCreateParentCycle([], 1, 1)).toBe(true);
  });

  it('rejects a direct reversal', () => {
    expect(wouldCreateParentCycle([pc(1, 2)], 2, 1)).toBe(true);
  });

  it('rejects a multi-generation loop', () => {
    expect(wouldCreateParentCycle([pc(1, 2), pc(2, 3), pc(3, 4)], 4, 1)).toBe(true);
  });

  it('allows unrelated and downward links', () => {
    expect(wouldCreateParentCycle([pc(1, 2)], 1, 3)).toBe(false);
    expect(wouldCreateParentCycle([pc(1, 2), pc(2, 3)], 1, 3)).toBe(false);
  });

  it('ignores non parent-child relationships', () => {
    expect(wouldCreateParentCycle([{ fromMemberId: 1, toMemberId: 2, type: 'spouse' }], 2, 1)).toBe(false);
  });

  it('terminates on pre-existing cyclic data', () => {
    expect(wouldCreateParentCycle([pc(1, 2), pc(2, 1)], 5, 1)).toBe(false);
  });
});
