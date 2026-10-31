const SOURCE_LIMIT = 20;
const WINDOW_MS = 15 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export class LoginRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  consume(sourceIp: string, now = Date.now()): RateLimitResult {
    const cutoff = now - WINDOW_MS;
    const recent = (this.attempts.get(sourceIp) ?? []).filter((time) => time > cutoff);
    if (recent.length >= SOURCE_LIMIT) {
      this.attempts.set(sourceIp, recent);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000)),
      };
    }

    recent.push(now);
    this.attempts.set(sourceIp, recent);
    return { allowed: true };
  }
}

export const loginLimits = {
  perSource: SOURCE_LIMIT,
  windowMs: WINDOW_MS,
  perUsername: 5,
  usernameLockoutMs: WINDOW_MS,
};

export function nextLoginAttempt(
  previous: { failedCount: number; lockedUntil: Date | null } | null,
  now = Date.now(),
): { failedCount: number; lockedUntil: Date | null } {
  const lockExpired = previous?.lockedUntil !== null
    && previous?.lockedUntil !== undefined
    && previous.lockedUntil.getTime() <= now;
  const failedCount = lockExpired ? 1 : (previous?.failedCount ?? 0) + 1;
  const lockedUntil = failedCount >= loginLimits.perUsername
    ? new Date(now + loginLimits.usernameLockoutMs)
    : null;
  return { failedCount, lockedUntil };
}
