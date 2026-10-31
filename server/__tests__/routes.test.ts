import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { enableDemoMode } from '../demo-guard';

// Demo mode swaps in MemoryStorage so the routes run without a database.
enableDemoMode();

let server: Server;
let base: string;
let storage: any;

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

beforeAll(async () => {
  const { registerRoutes } = await import('../routes');
  ({ storage } = await import('../storage'));
  const app = express();
  app.use(express.json());
  server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(() => storage.reset());

describe('PATCH /api/family-members/positions', () => {
  it('updates positions in one call', async () => {
    const res = await call('PATCH', '/api/family-members/positions', {
      positions: [{ id: 1, x: 11, y: 22 }, { id: 2, x: 33, y: 44 }],
    });
    expect(res).toEqual({ status: 200, json: { updated: 2 } });
    const tree = (await call('GET', '/api/family-tree')).json;
    expect(tree.members.find((m: any) => m.id === 2)).toMatchObject({ x: 33, y: 44 });
  });

  it('is not captured by the /:id routes', async () => {
    const res = await call('PATCH', '/api/family-members/positions', { positions: [] });
    expect(res.status).toBe(400);
    expect(res.json.message).toBe('Invalid positions data');
  });

  it('returns 404 and writes nothing when an id is unknown', async () => {
    const before = (await call('GET', '/api/family-tree')).json.members.find((m: any) => m.id === 1);
    const res = await call('PATCH', '/api/family-members/positions', {
      positions: [{ id: 1, x: 999, y: 999 }, { id: 424242, x: 0, y: 0 }],
    });
    expect(res.status).toBe(404);
    const after = (await call('GET', '/api/family-tree')).json.members.find((m: any) => m.id === 1);
    expect({ x: after.x, y: after.y }).toEqual({ x: before.x, y: before.y });
  });

  it('rejects malformed bodies', async () => {
    expect((await call('PATCH', '/api/family-members/positions', { positions: [{ id: 1, x: 'a', y: 0 }] })).status).toBe(400);
    expect((await call('PATCH', '/api/family-members/positions', {})).status).toBe(400);
  });
});

describe('POST /api/family-members/restore', () => {
  it('restores a deleted member with its original id', async () => {
    const tree = (await call('GET', '/api/family-tree')).json;
    const victim = 7;
    const snapshot = {
      member: tree.members.find((m: any) => m.id === victim),
      relationships: tree.relationships.filter((r: any) => r.fromMemberId === victim || r.toMemberId === victim),
      events: tree.events.filter((e: any) => e.memberIds.includes(victim)),
    };
    // JSON dates arrive as strings; strip server-managed fields like the client does.
    const clean = (o: any) => { const { createdAt, updatedAt, ...rest } = o; return rest; };
    const body = {
      member: clean(snapshot.member),
      relationships: snapshot.relationships.map(clean),
      events: snapshot.events.map(clean),
    };
    expect((await call('DELETE', `/api/family-members/${victim}`)).status).toBe(200);
    const res = await call('POST', '/api/family-members/restore', body);
    expect(res.status).toBe(201);
    expect(res.json.member.id).toBe(victim);
    const after = (await call('GET', '/api/family-tree')).json;
    expect(after.relationships.length).toBe(tree.relationships.length);
  });

  it('returns 409 when the member id already exists', async () => {
    const res = await call('POST', '/api/family-members/restore', {
      member: { id: 1, firstName: 'Dup', x: 0, y: 0 }, relationships: [], events: [],
    });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid or dangling payloads without echoing the body', async () => {
    const dangling = await call('POST', '/api/family-members/restore', {
      member: { id: 500, firstName: 'Secret', x: 0, y: 0 },
      relationships: [{ id: 900, fromMemberId: 500, toMemberId: 9999, type: 'spouse' }],
      events: [],
    });
    expect(dangling.status).toBe(400);
    expect(JSON.stringify(dangling.json)).not.toContain('Secret');
    expect((await call('POST', '/api/family-members/restore', { member: 1 })).status).toBe(400);
  });
});

describe('POST /api/relationships cycle protection', () => {
  it('rejects a parent-child cycle with 400', async () => {
    // Sample data: member 1 is a parent of 2 (relationship 3).
    const res = await call('POST', '/api/relationships', { fromMemberId: 2, toMemberId: 1, type: 'parent-child' });
    expect(res.status).toBe(400);
  });

  it('accepts the guardian type', async () => {
    const res = await call('POST', '/api/relationships', { fromMemberId: 1, toMemberId: 8, type: 'guardian' });
    expect(res.status).toBe(200);
  });
});
