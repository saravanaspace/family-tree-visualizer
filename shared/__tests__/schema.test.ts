import { describe, it, expect } from 'vitest';
import { batchPositionsSchema, restoreMemberSchema, insertRelationshipSchema } from '../schema';

describe('batchPositionsSchema', () => {
  it('accepts valid positions', () => {
    expect(batchPositionsSchema.safeParse({ positions: [{ id: 1, x: 1.5, y: -20 }] }).success).toBe(true);
  });

  it.each([
    ['empty list', { positions: [] }],
    ['missing positions', {}],
    ['non-integer id', { positions: [{ id: 1.5, x: 0, y: 0 }] }],
    ['zero id', { positions: [{ id: 0, x: 0, y: 0 }] }],
    ['NaN coordinate', { positions: [{ id: 1, x: NaN, y: 0 }] }],
    ['Infinity coordinate', { positions: [{ id: 1, x: 0, y: Infinity }] }],
    ['out of range', { positions: [{ id: 1, x: 1_000_001, y: 0 }] }],
    ['string coordinate', { positions: [{ id: 1, x: '5', y: 0 }] }],
    ['duplicate ids', { positions: [{ id: 1, x: 0, y: 0 }, { id: 1, x: 1, y: 1 }] }],
  ])('rejects %s', (_name, body) => {
    expect(batchPositionsSchema.safeParse(body).success).toBe(false);
  });

  it('caps the batch at 1000 items', () => {
    const make = (n: number) => ({ positions: Array.from({ length: n }, (_, i) => ({ id: i + 1, x: 0, y: 0 })) });
    expect(batchPositionsSchema.safeParse(make(1000)).success).toBe(true);
    expect(batchPositionsSchema.safeParse(make(1001)).success).toBe(false);
  });
});

describe('restoreMemberSchema', () => {
  const base = () => ({
    member: { id: 7, firstName: 'Ann', x: 0, y: 0 },
    relationships: [{ id: 12, fromMemberId: 7, toMemberId: 3, type: 'spouse' }],
    events: [{ id: 4, type: 'birth', memberIds: [7] }],
  });

  it('accepts a valid snapshot', () => {
    expect(restoreMemberSchema.safeParse(base()).success).toBe(true);
  });

  it('treats null optional columns from stored rows as absent', () => {
    const body = base() as any;
    body.member = { ...body.member, middleName: null, email: null, deathDate: null };
    body.relationships[0] = { ...body.relationships[0], notes: null, subType: null, startDate: null };
    body.events[0] = { ...body.events[0], place: null, date: null };
    expect(restoreMemberSchema.safeParse(body).success).toBe(true);
  });

  it('rejects a member without an id', () => {
    const body = base() as any;
    delete body.member.id;
    expect(restoreMemberSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a relationship that does not reference the member', () => {
    const body = base();
    body.relationships[0] = { id: 12, fromMemberId: 1, toMemberId: 3, type: 'spouse' };
    expect(restoreMemberSchema.safeParse(body).success).toBe(false);
  });

  it('rejects an event that omits the member', () => {
    const body = base();
    body.events[0].memberIds = [3];
    expect(restoreMemberSchema.safeParse(body).success).toBe(false);
  });

  it('rejects malformed and oversized payloads', () => {
    expect(restoreMemberSchema.safeParse(null).success).toBe(false);
    expect(restoreMemberSchema.safeParse({ member: 'x' }).success).toBe(false);
    const big = base();
    big.relationships = Array.from({ length: 501 }, (_, i) => ({ id: i + 1, fromMemberId: 7, toMemberId: i + 100, type: 'spouse' }));
    expect(restoreMemberSchema.safeParse(big).success).toBe(false);
  });
});

describe('insertRelationshipSchema', () => {
  it('accepts the guardian type', () => {
    expect(insertRelationshipSchema.safeParse({ fromMemberId: 1, toMemberId: 2, type: 'guardian' }).success).toBe(true);
  });
  it('rejects unknown types', () => {
    expect(insertRelationshipSchema.safeParse({ fromMemberId: 1, toMemberId: 2, type: 'cousin' }).success).toBe(false);
  });
});
