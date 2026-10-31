import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";

const COST = 1 << 15;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEMORY = 64 * 1024 * 1024;
const DUMMY_PASSWORD = randomBytes(32).toString("base64url");
const DUMMY_SALT = randomBytes(SALT_LENGTH);
export const DUMMY_PASSWORD_HASH = encodeHash(DUMMY_SALT, scryptSync(
  DUMMY_PASSWORD,
  DUMMY_SALT,
  KEY_LENGTH,
  { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION, maxmem: MAX_MEMORY },
));

function encodeHash(salt: Buffer, key: Buffer): string {
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

function deriveKey(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });
  return encodeHash(salt, key);
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, n, r, p, saltValue, keyValue, extra] = encoded.split("$");
  const cost = Number(n);
  const blockSize = Number(r);
  const parallelization = Number(p);
  if (
    extra !== undefined ||
    algorithm !== "scrypt" ||
    !Number.isInteger(cost) ||
    cost < 2 ||
    cost > 1 << 18 ||
    !Number.isInteger(blockSize) ||
    blockSize < 1 ||
    blockSize > 16 ||
    !Number.isInteger(parallelization) ||
    parallelization < 1 ||
    parallelization > 4 ||
    !saltValue ||
    !keyValue
  ) {
    return false;
  }

  const salt = Buffer.from(saltValue, "base64url");
  const expected = Buffer.from(keyValue, "base64url");
  if (salt.length < 16 || salt.length > 64 || expected.length !== KEY_LENGTH) return false;

  const actual = await deriveKey(password, salt, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: MAX_MEMORY,
  });
  return timingSafeEqual(actual, expected);
}
