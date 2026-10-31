import { randomUUID } from "node:crypto";
import type { Express } from "express";
import session from "express-session";
import { Pool } from "pg";
import { isDemoMode } from "../demo-guard";
import { demoAccounts, MemoryAuthStorage, seedDemoAccounts } from "./demo-accounts";
import { authErrorHandler, registerAuthRoutes } from "./routes";
import { seedDefaultAccount } from "./seed";
import { configureTrustedProxies, createPgSessionStore, createSessionMiddleware } from "./session";
import { AuthStorage, type AuthRepository } from "./storage";

function mountAuthentication(app: Express, store: AuthRepository, sessionStore: session.Store): void {
  configureTrustedProxies(app);
  app.use((req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  });
  app.use(createSessionMiddleware(sessionStore));
  registerAuthRoutes(app, store);
  app.use(authErrorHandler);
}

export async function setupAuthentication(app: Express): Promise<void> {
  if (isDemoMode()) {
    const store = new MemoryAuthStorage();
    await seedDemoAccounts(store);
    mountAuthentication(app, store, new session.MemoryStore());
    console.log("DEMO MODE sign-in accounts (in-memory, demo only):");
    for (const account of demoAccounts) {
      console.log(`  ${account.username} / ${account.password}${account.status === "disabled" ? " (disabled)" : ""}`);
    }
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for server-side authentication");

  const pool = new Pool({ connectionString, max: 10 });
  try {
    const store = new AuthStorage(pool);
    await seedDefaultAccount(store);
    mountAuthentication(app, store, createPgSessionStore(pool));
  } catch (error) {
    await pool.end();
    throw error;
  }
}
