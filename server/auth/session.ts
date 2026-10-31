import type { Express, Request, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Pool } from "pg";
import { randomBytes } from "node:crypto";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    createdAt?: number;
  }
}

type Environment = Record<string, string | undefined>;

function daysFromEnvironment(value: string | undefined, fallback: number, name: string): number {
  if (!value) return fallback;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error(`${name} must be a whole number between 1 and 365`);
  }
  return days;
}

export function configureTrustedProxies(app: Express, env: Environment = process.env): void {
  const configured = env.TRUSTED_PROXIES?.split(",").map((value) => value.trim()).filter(Boolean);
  if (configured?.length) app.set("trust proxy", configured);
}

export function createPgSessionStore(pool: Pool): session.Store {
  const PgStore = connectPgSimple(session);
  return new PgStore({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: false,
  });
}

export function createSessionMiddleware(
  store: session.Store,
  env: Environment = process.env,
): RequestHandler {
  const production = env.NODE_ENV === "production";
  const configuredSecret = env.SESSION_SECRET;
  if (production && !configuredSecret) {
    throw new Error("SESSION_SECRET is required in production");
  }
  if (configuredSecret && configuredSecret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }

  const idleDays = daysFromEnvironment(env.SESSION_IDLE_DAYS, 7, "SESSION_IDLE_DAYS");
  return session({
    name: "familytree.sid",
    secret: configuredSecret ?? randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store,
    cookie: {
      httpOnly: true,
      secure: production,
      sameSite: "lax",
      maxAge: idleDays * 24 * 60 * 60 * 1000,
    },
  });
}

export function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve();
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

export function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export function maxSessionAgeMs(env: Environment = process.env): number {
  const maxDays = daysFromEnvironment(env.SESSION_MAX_DAYS, 30, "SESSION_MAX_DAYS");
  return maxDays * 24 * 60 * 60 * 1000;
}
