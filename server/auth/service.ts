import { DUMMY_PASSWORD_HASH, verifyPassword } from "./password";
import type { AuthAccount, AuthRepository } from "./storage";

export async function verifyCredentials(
  store: AuthRepository,
  username: string,
  password: string,
): Promise<{ account: AuthAccount | null; authenticated: boolean }> {
  const account = await store.findByUsername(username);
  const hash = account?.secretHash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(password, hash);
  return {
    account,
    authenticated: Boolean(account && account.status === "active" && account.secretHash && passwordMatches),
  };
}
