import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { familyMembers, relationships, familyEvents } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

// Use a separate test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/familytree_test';

// Helper function to get database name from URL
function getDatabaseName(url: string): string {
  return new URL(url).pathname.slice(1);
}

// Function to run migrations
async function runMigrations(db: ReturnType<typeof drizzle>) {
  // Drop everything first to ensure clean state
  await db.execute(sql`
    DROP TABLE IF EXISTS family_events CASCADE;
    DROP TABLE IF EXISTS relationships CASCADE;
    DROP TABLE IF EXISTS family_members CASCADE;
  `);
  
  // Create tables and indexes
  await db.execute(sql`
    CREATE TABLE family_members (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      last_name VARCHAR(100),
      gender VARCHAR(50),
      birth_date DATE,
      birth_place VARCHAR(255),
      death_date DATE,
      death_place VARCHAR(255),
      occupation VARCHAR(255),
      biography TEXT,
      photo_url VARCHAR(500),
      is_living BOOLEAN DEFAULT true,
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX family_members_name_idx ON family_members (first_name, last_name);
    CREATE INDEX family_members_birth_date_idx ON family_members (birth_date);

    CREATE TABLE relationships (
      id SERIAL PRIMARY KEY,
      from_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
      to_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      sub_type VARCHAR(50),
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(from_member_id, to_member_id, type)
    );
    
    CREATE INDEX relationships_from_member_idx ON relationships (from_member_id);
    CREATE INDEX relationships_to_member_idx ON relationships (to_member_id);

    CREATE TABLE family_events (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      date DATE,
      place VARCHAR(255),
      description TEXT,
      member_ids INTEGER[] NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX family_events_date_idx ON family_events (date);
    CREATE INDEX family_events_type_idx ON family_events (type);
  `);
}

// Function to reset the database before each test
export async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const queryClient = postgres(process.env.DATABASE_URL, {
    max: 1,
    types: {
      date: {
        to: 1184,
        from: [1082, 1083, 1114, 1184],
        serialize: (date: Date) => date.toISOString().split('T')[0],
        parse: (str: string) => str ? new Date(str) : null,
      }
    }
  });
  
  try {
    const db = drizzle(queryClient);
    await db.execute(sql`
      DROP TABLE IF EXISTS family_events CASCADE;
      DROP TABLE IF EXISTS relationships CASCADE;
      DROP TABLE IF EXISTS family_members CASCADE;
      
      CREATE TABLE family_members (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        gender VARCHAR(50),
        birth_date DATE,
        birth_place VARCHAR(255),
        death_date DATE,
        death_place VARCHAR(255),
        occupation VARCHAR(255),
        biography TEXT,
        photo_url VARCHAR(500),
        is_living BOOLEAN DEFAULT true,
        x REAL NOT NULL DEFAULT 0,
        y REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE relationships (
        id SERIAL PRIMARY KEY,
        from_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        to_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        sub_type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(from_member_id, to_member_id, type)
      );

      CREATE TABLE family_events (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        date DATE,
        place VARCHAR(255),
        description TEXT,
        member_ids INTEGER[] NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } finally {
    await queryClient.end();
  }
}