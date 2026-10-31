import type { Express, NextFunction, Request, Response } from "express";
import { loginSchema, userSchema } from "@shared/schema";
import { logAuthEvent } from "./audit";
import { LoginRateLimiter } from "./lockout";
import { verifyCredentials } from "./service";
import type { AuthRepository } from "./storage";
import { destroySession, maxSessionAgeMs, regenerateSession, saveSession } from "./session";

const SESSION_COOKIE = "familytree.sid";

function requestIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function requestId(res: Response): string {
  return String(res.locals.requestId ?? "unknown");
}

function recordEvent(
  req: Request,
  res: Response,
  eventType: "sign_in_success" | "sign_in_failure" | "sign_out",
  outcome: "success" | "failure",
  accountId?: number,
): void {
  logAuthEvent({
    eventType,
    outcome,
    timestamp: new Date().toISOString(),
    sourceIp: requestIp(req),
    requestId: requestId(res),
    ...(accountId === undefined ? {} : { accountId }),
  });
}

function rejectRateLimited(res: Response, retryAfterSeconds: number): void {
  res.setHeader("Retry-After", String(retryAfterSeconds));
  res.status(429).json({ message: "Too many sign-in attempts. Try again later." });
}

function clearSessionCookie(res: Response, production: boolean): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
  });
}

export function registerAuthRoutes(
  app: Express,
  store: AuthRepository,
  rateLimiter = new LoginRateLimiter(),
  env: Record<string, string | undefined> = process.env,
): void {
  const production = env.NODE_ENV === "production";
  const maxAge = maxSessionAgeMs(env);

  app.post("/api/auth/login", async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid sign-in request" });
    }

    const sourceIp = requestIp(req);
    const sourceLimit = rateLimiter.consume(sourceIp);
    if (!sourceLimit.allowed) {
      recordEvent(req, res, "sign_in_failure", "failure");
      return rejectRateLimited(res, sourceLimit.retryAfterSeconds);
    }

    const username = parsed.data.username.toLowerCase();
    try {
      const attempt = await store.getLoginAttempt(username);
      if (attempt?.lockedUntil && attempt.lockedUntil.getTime() > Date.now()) {
        recordEvent(req, res, "sign_in_failure", "failure");
        return rejectRateLimited(
          res,
          Math.max(1, Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 1000)),
        );
      }

      const credentialCheck = await verifyCredentials(store, username, parsed.data.password);
      if (!credentialCheck.authenticated || !credentialCheck.account) {
        const failure = await store.recordLoginFailure(username);
        const lockedUntil = failure.lockedUntil;
        recordEvent(req, res, "sign_in_failure", "failure", credentialCheck.account?.user.id);
        if (lockedUntil && lockedUntil.getTime() > Date.now()) {
          return rejectRateLimited(
            res,
            Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)),
          );
        }
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const account = credentialCheck.account;
      await store.clearLoginFailures(username);
      await regenerateSession(req);
      req.session.userId = account.user.id;
      req.session.createdAt = Date.now();
      await saveSession(req);

      recordEvent(req, res, "sign_in_success", "success", account.user.id);
      return res.json({ user: userSchema.parse(account.user) });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/auth/me", async (req, res, next) => {
    const userId = req.session.userId;
    const createdAt = req.session.createdAt;
    if (!userId || !createdAt || Date.now() - createdAt > maxAge) {
      if (userId) {
        try {
          await destroySession(req);
        } catch (error) {
          return next(error);
        }
      }
      clearSessionCookie(res, production);
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const account = await store.findById(userId);
      if (!account || account.status !== "active") {
        await destroySession(req);
        clearSessionCookie(res, production);
        return res.status(401).json({ message: "Authentication required" });
      }
      return res.json({ user: userSchema.parse(account.user) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/logout", async (req, res, next) => {
    const accountId = req.session.userId;
    try {
      await destroySession(req);
      clearSessionCookie(res, production);
      if (accountId) recordEvent(req, res, "sign_out", "success", accountId);
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });
}

export function authErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) return next(error);
  if (req.path.startsWith("/api/auth/")) {
    console.error(JSON.stringify({
      event: "auth_service_unavailable",
      requestId: res.locals.requestId ?? "unknown",
      sourceIp: requestIp(req),
    }));
    res.status(503).json({ message: "Authentication service unavailable. Try again." });
    return;
  }
  next(error);
}
