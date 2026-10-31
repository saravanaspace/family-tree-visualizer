import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { assertNotProduction, isLoopbackAddress } from '../demo-guard';

describe('assertNotProduction', () => {
  it('refuses production', () => {
    expect(assertNotProduction({ NODE_ENV: 'production' })).toMatch(/production/);
  });

  it('allows development and unset environments', () => {
    expect(assertNotProduction({ NODE_ENV: 'development' })).toBeNull();
    expect(assertNotProduction({})).toBeNull();
  });
});

describe('isLoopbackAddress', () => {
  it('accepts loopback addresses only', () => {
    for (const ok of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
      expect(isLoopbackAddress(ok)).toBe(true);
    }
    for (const bad of ['192.168.1.20', '10.0.0.5', '::ffff:192.168.1.20', '', undefined]) {
      expect(isLoopbackAddress(bad)).toBe(false);
    }
  });
});

describe('demo mode selection and reset route', () => {
  let server: Server | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    const s = server;
    server = undefined;
    if (s) await new Promise((resolve) => s.close(resolve));
  });

  async function start() {
    const { registerRoutes } = await import('../routes');
    const app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
  }

  it('uses Postgres storage and has no reset route unless enableDemoMode() was called', async () => {
    // Env vars must not be able to turn demo mode on.
    vi.stubEnv('DEMO_MODE', 'true');
    vi.stubEnv('STORAGE', 'memory');
    const { storage, PostgresStorage } = await import('../storage');
    expect(storage).toBeInstanceOf(PostgresStorage);

    const base = await start();
    expect((await fetch(`${base}/api/demo/reset`, { method: 'POST' })).status).toBe(404);
  });

  it('uses in-memory storage and resets over loopback in demo mode', async () => {
    const { enableDemoMode } = await import('../demo-guard');
    enableDemoMode();
    const { storage, PostgresStorage } = await import('../storage');
    const { MemoryStorage } = await import('../memory-storage');
    expect(storage).toBeInstanceOf(MemoryStorage);
    expect(storage).not.toBeInstanceOf(PostgresStorage);

    await storage.deleteFamilyMember(1);
    const base = await start();
    const res = await fetch(`${base}/api/demo/reset`, { method: 'POST' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'Demo data reset' });
    expect((await storage.getFamilyTree()).members).toHaveLength(8);

    const tree = await (await fetch(`${base}/api/family-tree`)).json();
    expect(tree.members).toHaveLength(8);
  });
});
