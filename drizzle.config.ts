import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  // Managed by server/db/migrate.ts and connect-pg-simple; keep `db:push` from renaming or dropping them.
  tablesFilter: ["*", "!app_migrations", "!user_sessions"],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
