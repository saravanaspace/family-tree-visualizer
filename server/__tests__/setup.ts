import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { familyMembers, relationships } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

// Use a separate test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/familytree_test';

// Function to run migrations
async function runMigrations(db: ReturnType<typeof drizzle>) {
  const migrationPath = path.join(process.cwd(), 'migrations', '0000_rich_the_watchers.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  
  // Split migration into separate statements
  const statements = migration.split('-- statement-breakpoint');
  
  for (const statement of statements) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

// Function to reset the database before each test
export async function resetDatabase() {
  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    // Drop tables if they exist
    await db.execute(sql.raw('DROP TABLE IF EXISTS relationships'));
    await db.execute(sql.raw('DROP TABLE IF EXISTS family_members'));
    
    // Run migrations to recreate tables
    await runMigrations(db);
  } finally {
    await queryClient.end();
  }
}