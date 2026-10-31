import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@shared/schema";
import { seedDefaultAccount } from "../auth/seed";
import { verifyPassword } from "../auth/password";
import type { AuthRepository } from "../auth/storage";
import { demoAccounts, MemoryAuthStorage, seedDemoAccounts } from "../auth/demo-accounts";

const user: AuthUser = { id: 1, username: "default", displayName: "Default User" };

function repository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    findByUsername: vi.fn(async () => null),
    findById: vi.fn(async () => null),
    seedDefaultAccount: vi.fn(async () => user),
    getLoginAttempt: vi.fn(async () => null),
    recordLoginFailure: vi.fn(async () => ({ failedCount: 1, lockedUntil: null })),
    clearLoginFailures: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("default account seeding", () => {
  it("requires environment credentials in production", async () => {
    await expect(seedDefaultAccount(repository(), { NODE_ENV: "production" }))
      .rejects.toThrow("DEFAULT_OWNER_USERNAME and DEFAULT_OWNER_PASSWORD are required");
  });

  it("does not replace an existing password when development credentials are unset", async () => {
    const store = repository({
      findByUsername: vi.fn(async () => ({
        user,
        status: "active",
        secretHash: "existing-password-hash",
      })),
    });

    await expect(seedDefaultAccount(store, { NODE_ENV: "development" })).resolves.toEqual(user);
    expect(store.seedDefaultAccount).not.toHaveBeenCalled();
  });

  it("hashes configured credentials before seeding", async () => {
    const store = repository();
    await seedDefaultAccount(store, {
      NODE_ENV: "production",
      DEFAULT_OWNER_USERNAME: "  DEFAULT ",
      DEFAULT_OWNER_PASSWORD: "valid-production-password",
    });

    const [, , secretHash] = vi.mocked(store.seedDefaultAccount).mock.calls[0];
    expect(secretHash).not.toContain("valid-production-password");
    await expect(verifyPassword("valid-production-password", secretHash)).resolves.toBe(true);
    expect(store.seedDefaultAccount).toHaveBeenCalledWith("default", "Default User", secretHash);
  });
});

describe("demo account seeding", () => {
  it("seeds hashed demo accounts, keeping the disabled account disabled", async () => {
    const store = new MemoryAuthStorage();
    await seedDemoAccounts(store, { NODE_ENV: "development" });

    for (const account of demoAccounts) {
      const stored = await store.findByUsername(account.username);
      expect(stored?.status).toBe(account.status);
      expect(stored?.secretHash).not.toContain(account.password);
      await expect(verifyPassword(account.password, stored!.secretHash!)).resolves.toBe(true);
    }
  });

  it("refuses to seed demo accounts in production", async () => {
    await expect(seedDemoAccounts(new MemoryAuthStorage(), { NODE_ENV: "production" }))
      .rejects.toThrow("must not be seeded");
  });
});
