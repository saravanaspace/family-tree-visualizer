import { createServer, type Server } from "node:http";
import express from "express";
import session from "express-session";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryAuthStorage } from "../auth/demo-accounts";
import { hashPassword } from "../auth/password";
import { authErrorHandler, registerAuthRoutes } from "../auth/routes";
import { createSessionMiddleware } from "../auth/session";
import { authUserFixtures } from "./fixtures/auth-users";

const DAY_MS = 24 * 60 * 60 * 1000;
const env = {
  NODE_ENV: "test",
  SESSION_SECRET: "test-only-session-secret-that-is-long-enough",
  SESSION_IDLE_DAYS: "7",
  SESSION_MAX_DAYS: "30",
};

class FailingStore extends session.MemoryStore {
  failing = false;
  get(sid: string, callback: (error: unknown, session?: session.SessionData | null) => void): void {
    if (this.failing) return callback(new Error("session store unavailable"));
    super.get(sid, callback);
  }
}

let server: Server;
let baseUrl: string;
let accounts: MemoryAuthStorage;
let sessionStore: FailingStore;
let clockOffset = 0;

async function request(path: string, method = "GET", body?: unknown, cookie?: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function signIn(): Promise<string> {
  const fixture = authUserFixtures[0];
  const response = await request("/api/auth/login", "POST", {
    username: fixture.username,
    password: fixture.password,
  });
  expect(response.status).toBe(200);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Expected session cookie");
  return cookie;
}

beforeEach(async () => {
  clockOffset = 0;
  const realNow = Date.now.bind(Date);
  vi.spyOn(Date, "now").mockImplementation(() => realNow() + clockOffset);
  vi.spyOn(console, "info").mockImplementation(() => undefined);

  accounts = new MemoryAuthStorage();
  for (const fixture of authUserFixtures) {
    accounts.addAccount(fixture.username, fixture.displayName, await hashPassword(fixture.password), fixture.status);
  }
  sessionStore = new FailingStore();

  const app = express();
  app.use(express.json());
  app.use(createSessionMiddleware(sessionStore, env));
  registerAuthRoutes(app, accounts, undefined, env);
  app.use(authErrorHandler);
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe("server sessions", () => {
  it("sets an httpOnly, SameSite=Lax session cookie", async () => {
    const response = await request("/api/auth/login", "POST", {
      username: authUserFixtures[0].username,
      password: authUserFixtures[0].password,
    });
    const header = response.headers.get("set-cookie") ?? "";
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/SameSite=Lax/i);
  });

  it("keeps logout idempotent and the session invalid afterwards", async () => {
    const cookie = await signIn();
    expect((await request("/api/auth/logout", "POST", undefined, cookie)).status).toBe(204);
    expect((await request("/api/auth/logout", "POST", undefined, cookie)).status).toBe(204);
    expect((await request("/api/auth/logout", "POST")).status).toBe(204);
    expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(401);
  });

  it("renews the idle timeout on activity and expires an inactive session", async () => {
    const cookie = await signIn();

    clockOffset = 6 * DAY_MS;
    expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(200);
    clockOffset = 12 * DAY_MS;
    expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(200);

    clockOffset = 20 * DAY_MS;
    expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(401);
  });

  it("enforces the absolute lifetime even with continuous activity", async () => {
    const cookie = await signIn();
    for (const day of [6, 12, 18, 24, 29]) {
      clockOffset = day * DAY_MS;
      expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(200);
    }
    clockOffset = 31 * DAY_MS;
    expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(401);
  });

  it("ends an existing session when its account is disabled", async () => {
    const cookie = await signIn();
    const account = await accounts.findByUsername(authUserFixtures[0].username);
    account!.status = "disabled";

    expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(401);
    account!.status = "active";
    expect((await request("/api/auth/me", "GET", undefined, cookie)).status).toBe(401);
  });

  it("fails closed with 503 when the session store is unavailable", async () => {
    const cookie = await signIn();
    sessionStore.failing = true;

    const response = await request("/api/auth/me", "GET", undefined, cookie);
    expect(response.status).toBe(503);
    expect((await response.json()).message).toContain("Authentication service unavailable");
  });
});
