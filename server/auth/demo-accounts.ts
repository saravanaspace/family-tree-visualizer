import type { AuthUser } from "@shared/schema";
import { nextLoginAttempt } from "./lockout";
import { hashPassword } from "./password";
import type { AuthAccount, AuthRepository, LoginAttemptState } from "./storage";

export type DemoAccount = {
  username: string;
  password: string;
  displayName: string;
  status: "active" | "disabled";
};

// Well-known credentials for local demos only. Seeded solely into in-memory storage by `npm run dev:demo`,
// which refuses to start when NODE_ENV=production.
export const demoAccounts: readonly DemoAccount[] = [
  { username: "demo", password: "demo-password", displayName: "Demo User", status: "active" },
  { username: "alice", password: "alice-password", displayName: "Alice Demo", status: "active" },
  { username: "bob", password: "bob-password-1", displayName: "Bob Demo", status: "active" },
  { username: "disabled", password: "disabled-password", displayName: "Disabled Demo", status: "disabled" },
];

export class MemoryAuthStorage implements AuthRepository {
  private readonly accounts = new Map<string, AuthAccount>();
  private readonly attempts = new Map<string, LoginAttemptState>();
  private nextId = 1;

  async findByUsername(username: string): Promise<AuthAccount | null> {
    return this.accounts.get(username) ?? null;
  }

  async findById(id: number): Promise<AuthAccount | null> {
    return Array.from(this.accounts.values()).find((account) => account.user.id === id) ?? null;
  }

  async seedDefaultAccount(username: string, displayName: string, secretHash: string): Promise<AuthUser> {
    return this.addAccount(username, displayName, secretHash, "active");
  }

  addAccount(
    username: string,
    displayName: string,
    secretHash: string,
    status: AuthAccount["status"],
  ): AuthUser {
    const existing = this.accounts.get(username);
    if (existing) return existing.user;
    const user = { id: this.nextId++, username, displayName };
    this.accounts.set(username, { user, status, secretHash });
    return user;
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

export async function seedDemoAccounts(
  store: MemoryAuthStorage,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  if (env.NODE_ENV === "production") {
    throw new Error("Demo accounts must not be seeded when NODE_ENV=production");
  }
  for (const account of demoAccounts) {
    store.addAccount(account.username, account.displayName, await hashPassword(account.password), account.status);
  }
}
