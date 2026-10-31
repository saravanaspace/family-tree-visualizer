import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";

dotenv.config();

async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is required");

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1)::bigint)", ["family-tree-migrations"]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        id varchar(100) PRIMARY KEY,
        applied_at timestamp NOT NULL DEFAULT now()
      )
    `);

    const migrationId = "0002_authentication";
    const existing = await client.query("SELECT id FROM app_migrations WHERE id = $1", [migrationId]);
    if (existing.rowCount === 0) {
      const migration = await readFile(join(process.cwd(), "migrations", `${migrationId}.sql`), "utf8");
      await client.query(migration);
      await client.query("INSERT INTO app_migrations (id) VALUES ($1)", [migrationId]);
    }

    await client.query("COMMIT");
    console.log("Authentication migration completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
