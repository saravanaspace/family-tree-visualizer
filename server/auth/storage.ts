import type { Pool } from "pg";
import type { AuthUser } from "@shared/schema";
import { nextLoginAttempt } from "./lockout";

export type AuthAccount = {
  user: AuthUser;
  status: "active" | "disabled";
  secretHash: string | null;
};

export type LoginAttemptState = {
  failedCount: number;
  lockedUntil: Date | null;
};

export interface AuthRepository {
  findByUsername(username: string): Promise<AuthAccount | null>;
  findById(id: number): Promise<AuthAccount | null>;
  seedDefaultAccount(username: string, displayName: string, secretHash: string): Promise<AuthUser>;
  getLoginAttempt(username: string): Promise<LoginAttemptState | null>;
  recordLoginFailure(username: string): Promise<LoginAttemptState>;
  clearLoginFailures(username: string): Promise<void>;
}

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  status: "active" | "disabled";
};

type AccountRow = UserRow & { secret_hash: string | null };

export class AuthStorage implements AuthRepository {
  constructor(private readonly pool: Pool) {}

  async findByUsername(username: string): Promise<AuthAccount | null> {
    const result = await this.pool.query<AccountRow>(
      `SELECT u.id, u.username, u.display_name, u.status, c.secret_hash
       FROM users u
       LEFT JOIN credentials c ON c.user_id = u.id AND c.type = 'password'
       WHERE lower(u.username) = $1`,
      [username],
    );
    const row = result.rows[0];
    return row ? this.toAccount(row) : null;
  }

  async findById(id: number): Promise<AuthAccount | null> {
    const result = await this.pool.query<AccountRow>(
      `SELECT u.id, u.username, u.display_name, u.status, c.secret_hash
       FROM users u
       LEFT JOIN credentials c ON c.user_id = u.id AND c.type = 'password'
       WHERE u.id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? this.toAccount(row) : null;
  }

  async seedDefaultAccount(
    username: string,
    displayName: string,
    secretHash: string,
  ): Promise<AuthUser> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO users (username, display_name)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [username, displayName],
      );
      const users = await client.query<UserRow>(
        `SELECT id, username, display_name, status
         FROM users
         WHERE lower(username) = $1
         FOR UPDATE`,
        [username],
      );
      const user = users.rows[0];
      if (!user) throw new Error("Default account could not be loaded after seeding");

      const credentials = await client.query<{ user_id: number }>(
        `SELECT user_id FROM credentials
         WHERE type = 'password' AND identifier = $1
         FOR UPDATE`,
        [username],
      );
      if (credentials.rows[0] && credentials.rows[0].user_id !== user.id) {
        throw new Error("Default account credential belongs to a different account");
      }
      if (!credentials.rows[0]) {
        await client.query(
          `INSERT INTO credentials (user_id, type, identifier, secret_hash)
           VALUES ($1, 'password', $2, $3)`,
          [user.id, username, secretHash],
        );
      }

      await client.query("COMMIT");
      return this.toUser(user);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getLoginAttempt(username: string): Promise<LoginAttemptState | null> {
    const result = await this.pool.query<LoginAttemptState>(
      `SELECT failed_count AS "failedCount", locked_until AS "lockedUntil"
       FROM login_attempts
       WHERE username = $1`,
      [username],
    );
    return result.rows[0] ?? null;
  }

  async recordLoginFailure(username: string): Promise<LoginAttemptState> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO login_attempts (username, failed_count)
         VALUES ($1, 0)
         ON CONFLICT (username) DO NOTHING`,
        [username],
      );
      const previousResult = await client.query<LoginAttemptState>(
        `SELECT failed_count AS "failedCount", locked_until AS "lockedUntil"
         FROM login_attempts
         WHERE username = $1
         FOR UPDATE`,
        [username],
      );
      const next = nextLoginAttempt(previousResult.rows[0] ?? null);
      const result = await client.query<LoginAttemptState>(
        `UPDATE login_attempts
         SET failed_count = $2, locked_until = $3, updated_at = NOW()
         WHERE username = $1
         RETURNING failed_count AS "failedCount", locked_until AS "lockedUntil"`,
        [username, next.failedCount, next.lockedUntil],
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async clearLoginFailures(username: string): Promise<void> {
    await this.pool.query("DELETE FROM login_attempts WHERE username = $1", [username]);
  }

  private toAccount(row: AccountRow): AuthAccount {
    return {
      user: this.toUser(row),
      status: row.status,
      secretHash: row.secret_hash,
    };
  }

  private toUser(row: UserRow): AuthUser {
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
    };
  }
}
