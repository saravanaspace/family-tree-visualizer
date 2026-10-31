import { createServer, type Server } from "node:http";
import express from "express";
import session from "express-session";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@shared/schema";
import { authErrorHandler, registerAuthRoutes } from "../auth/routes";
import { hashPassword } from "../auth/password";
import type { AuthAccount, AuthRepository, LoginAttemptState } from "../auth/storage";
import { loginLimits, nextLoginAttempt } from "../auth/lockout";
import { authUserFixtures } from "./fixtures/auth-users";

class FixtureAuthRepository implements AuthRepository {
  accounts = new Map<string, AuthAccount>();
  attempts = new Map<string, LoginAttemptState>();
  failLookup = false;
  failUserLoad = false;

  async findByUsername(username: string): Promise<AuthAccount | null> {
    if (this.failLookup) throw new Error("database unavailable");
    return this.accounts.get(username) ?? null;
  }

  async findById(id: number): Promise<AuthAccount | null> {
    if (this.failUserLoad) throw new Error("database unavailable");
    return Array.from(this.accounts.values()).find((account) => account.user.id === id) ?? null;
  }

  async seedDefaultAccount(_username: string, _displayName: string, _secretHash: string): Promise<AuthUser> {
    throw new Error("not used in route tests");
  }

  async getLoginAttempt(username: string): Promise<LoginAttemptState | null> {
    return this.attempts.get(username) ?? null;
  }

  async recordLoginFailure(username: string): Promise<LoginAttemptState> {
    const state = nextLoginAttempt(this.attempts.get(username) ?? null);
    this.attempts.set(username, state);
    return state;
  }

  async clearLoginFailures(username: string): Promise<void> {
    this.attempts.delete(username);
  }
}

let server: Server;
let baseUrl: string;
let repository: FixtureAuthRepository;
let logs: string[];
let logSpy: ReturnType<typeof vi.spyOn>;

async function request(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function sessionCookie(response: Response): string {
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Expected session cookie");
  return cookie;
}

beforeEach(async () => {
  repository = new FixtureAuthRepository();
  for (const [index, fixture] of authUserFixtures.entries()) {
    repository.accounts.set(fixture.username, {
      user: {
        id: index + 1,
        username: fixture.username,
        displayName: fixture.displayName,
      },
      status: fixture.status,
      secretHash: await hashPassword(fixture.password),
    });
  }

  logs = [];
  logSpy = vi.spyOn(console, "info").mockImplementation((message) => logs.push(String(message)));
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: "test-only-session-secret-that-is-long-enough",
    resave: false,
    saveUninitialized: false,
  }));
  app.use((_req, res, next) => {
    res.locals.requestId = "test-request-id";
    next();
  });
  app.get("/test/preauth", (req, res) => {
    const expired = req.query.expired === "true";
    req.session.createdAt = Date.now() - (expired ? 2 : 0) * 24 * 60 * 60 * 1000;
    if (expired) req.session.userId = 1;
    res.status(200).end();
  });
  registerAuthRoutes(app, repository, undefined, { NODE_ENV: "test", SESSION_MAX_DAYS: "1" });
  app.use(authErrorHandler);
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  logSpy.mockRestore();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("authentication routes", () => {
  it("rejects malformed or out-of-policy sign-in input", async () => {
    const response = await request("/api/auth/login", "POST", {
      username: "fixture-a",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Invalid sign-in request");
  });

  it("authenticates separate test users and exposes only safe account data", async () => {
    const response = await request("/api/auth/login", "POST", {
      username: authUserFixtures[1].username,
      password: authUserFixtures[1].password,
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user).toEqual({
      id: 2,
      username: "fixture-b",
      displayName: "Fixture Account B",
    });
    expect(JSON.stringify(body)).not.toContain(authUserFixtures[1].password);
    expect(JSON.stringify(body)).not.toContain("secretHash");
    expect(logs.join("\n")).not.toContain(authUserFixtures[1].password);
  });

  it("returns the same generic denial for unknown, wrong-password, and disabled accounts", async () => {
    const responses = await Promise.all([
      request("/api/auth/login", "POST", { username: "unknown-account", password: "wrong-password-12" }),
      request("/api/auth/login", "POST", { username: "fixture-a", password: "wrong-password-12" }),
      request("/api/auth/login", "POST", {
        username: "fixture-disabled",
        password: authUserFixtures[2].password,
      }),
    ]);
    const bodies = await Promise.all(responses.map((response) => response.json()));

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);
    expect(bodies.map((body) => body.message)).toEqual([
      "Invalid username or password",
      "Invalid username or password",
      "Invalid username or password",
    ]);
  });

  it("regenerates the session ID, supports current-user lookup, and invalidates on logout", async () => {
    const preauth = await request("/test/preauth");
    const oldCookie = sessionCookie(preauth);
    const login = await request("/api/auth/login", "POST", {
      username: authUserFixtures[0].username,
      password: authUserFixtures[0].password,
    }, oldCookie);
    const newCookie = sessionCookie(login);

    expect(newCookie).not.toBe(oldCookie);
    expect(logs.join("\n")).not.toContain(newCookie.split("=")[1]);
    expect((await request("/api/auth/me", "GET", undefined, newCookie)).status).toBe(200);
    expect((await request("/api/auth/logout", "POST", undefined, newCookie)).status).toBe(204);
    expect((await request("/api/auth/me", "GET", undefined, newCookie)).status).toBe(401);
  });

  it("locks a username after five failed attempts", async () => {
    const results: number[] = [];
    for (let attempt = 0; attempt < loginLimits.perUsername; attempt += 1) {
      const response = await request("/api/auth/login", "POST", {
        username: "fixture-a",
        password: "wrong-password-12",
      });
      results.push(response.status);
    }

    expect(results).toEqual([401, 401, 401, 401, 429]);
    const locked = await request("/api/auth/login", "POST", {
      username: "fixture-a",
      password: authUserFixtures[0].password,
    });
    expect(locked.status).toBe(429);
    expect(locked.headers.get("retry-after")).toBeTruthy();
  });

  it("applies the same lockout to an unknown username and clears an expired lock after success", async () => {
    for (let attempt = 0; attempt < loginLimits.perUsername; attempt += 1) {
      await request("/api/auth/login", "POST", {
        username: "unknown-account",
        password: "wrong-password-12",
      });
    }
    const unknownLocked = await request("/api/auth/login", "POST", {
      username: "unknown-account",
      password: "wrong-password-12",
    });
    expect(unknownLocked.status).toBe(429);

    repository.attempts.set("fixture-a", {
      failedCount: 5,
      lockedUntil: new Date(Date.now() - 1),
    });
    const success = await request("/api/auth/login", "POST", {
      username: "fixture-a",
      password: authUserFixtures[0].password,
    });
    expect(success.status).toBe(200);
    expect(repository.attempts.has("fixture-a")).toBe(false);
  });

  it("fails closed with 503 when auth storage is unavailable", async () => {
    repository.failLookup = true;
    const response = await request("/api/auth/login", "POST", {
      username: "fixture-a",
      password: authUserFixtures[0].password,
    });

    expect(response.status).toBe(503);
    expect((await response.json()).message).toContain("Authentication service unavailable");
  });

  it("rejects an expired absolute session", async () => {
    const preauth = await request("/test/preauth?expired=true");
    const cookie = sessionCookie(preauth);
    const response = await request("/api/auth/me", "GET", undefined, cookie);
    expect(response.status).toBe(401);
  });
});
