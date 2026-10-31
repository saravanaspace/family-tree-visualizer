import { describe, expect, it } from "vitest";
import { LoginRateLimiter, loginLimits, nextLoginAttempt } from "../auth/lockout";

describe("username lockout policy", () => {
  it("increments failures and starts a lock at the configured threshold", () => {
    const now = 1_000_000;
    let state: { failedCount: number; lockedUntil: Date | null } | null = null;
    for (let attempt = 0; attempt < loginLimits.perUsername; attempt += 1) {
      state = nextLoginAttempt(state, now);
    }

    expect(state).toEqual({
      failedCount: loginLimits.perUsername,
      lockedUntil: new Date(now + loginLimits.usernameLockoutMs),
    });
  });

  it("restarts the failure count after a lock expires", () => {
    const now = 1_000_000;
    expect(nextLoginAttempt({
      failedCount: loginLimits.perUsername,
      lockedUntil: new Date(now - 1),
    }, now)).toEqual({ failedCount: 1, lockedUntil: null });
  });
});

describe("login rate limiter", () => {
  it("allows 20 attempts per source IP and blocks the next for the remaining window", () => {
    const limiter = new LoginRateLimiter();
    const start = 1_000_000;

    for (let attempt = 0; attempt < loginLimits.perSource; attempt += 1) {
      expect(limiter.consume("192.0.2.10", start + attempt)).toEqual({ allowed: true });
    }

    expect(limiter.consume("192.0.2.10", start + 100)).toEqual({
      allowed: false,
      retryAfterSeconds: 900,
    });
    expect(limiter.consume("192.0.2.11", start + 100)).toEqual({ allowed: true });
  });

  it("allows attempts again when the 15-minute window expires", () => {
    const limiter = new LoginRateLimiter();
    const start = 1_000_000;
    for (let attempt = 0; attempt < loginLimits.perSource; attempt += 1) {
      limiter.consume("192.0.2.10", start + attempt);
    }

    expect(limiter.consume("192.0.2.10", start + loginLimits.windowMs + 1)).toEqual({ allowed: true });
  });
});
