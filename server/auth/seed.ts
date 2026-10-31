import { randomBytes } from "node:crypto";
import { hashPassword } from "./password";
import type { AuthRepository } from "./storage";
import type { AuthUser } from "@shared/schema";

type Environment = Record<string, string | undefined>;

export async function seedDefaultAccount(
  store: AuthRepository,
  env: Environment = process.env,
): Promise<AuthUser> {
  let username = env.DEFAULT_OWNER_USERNAME?.trim().toLowerCase();
  let password = env.DEFAULT_OWNER_PASSWORD;

  if (env.NODE_ENV === "production" && (!username || !password)) {
    throw new Error("DEFAULT_OWNER_USERNAME and DEFAULT_OWNER_PASSWORD are required in production");
  }

  username ||= "default";
  if (username.length > 50) throw new Error("DEFAULT_OWNER_USERNAME must be at most 50 characters");
  if (!password) {
    const existing = await store.findByUsername(username);
    if (existing?.secretHash) return existing.user;
  }

  if (!password) {
    password = randomBytes(24).toString("base64url");
    if (env.NODE_ENV !== "test") {
      console.info(`Generated development login password for ${username}: ${password}`);
    }
  }

  if (password.length < 12 || password.length > 256) {
    throw new Error("DEFAULT_OWNER_PASSWORD must be between 12 and 256 characters");
  }

  const secretHash = await hashPassword(password);
  return store.seedDefaultAccount(username, "Default User", secretHash);
}
