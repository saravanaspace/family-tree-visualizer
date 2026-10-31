import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../auth/password";

describe("password hashing", () => {
  it("uses a unique salted scrypt hash and verifies only the matching password", async () => {
    const first = await hashPassword("test-password-with-enough-length");
    const second = await hashPassword("test-password-with-enough-length");

    expect(first).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(second).not.toBe(first);
    await expect(verifyPassword("test-password-with-enough-length", first)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", first)).resolves.toBe(false);
  });

  it("rejects malformed or unsupported hashes without deriving a key", async () => {
    await expect(verifyPassword("any-password", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("any-password", "scrypt$999999999$8$1$salt$hash")).resolves.toBe(false);
  });
});
