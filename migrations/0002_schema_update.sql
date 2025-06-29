-- Drop old tables and recreate with new schema
DROP TABLE IF EXISTS "family_events";
DROP TABLE IF EXISTS "relationships";
DROP TABLE IF EXISTS "family_members";

-- Create family members table with new schema
CREATE TABLE "family_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "first_name" varchar(100) NOT NULL,
  "middle_name" varchar(100),
  "last_name" varchar(100),
  "gender" varchar(50),
  "birth_date" date,
  "birth_place" varchar(255),
  "death_date" date,
  "death_place" varchar(255),
  "occupation" varchar(255),
  "biography" text,
  "photo_url" varchar(500),
  "is_living" boolean DEFAULT true,
  "x" real DEFAULT 0 NOT NULL,
  "y" real DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create relationships table with new schema
CREATE TABLE "relationships" (
  "id" serial PRIMARY KEY NOT NULL,
  "from_member_id" integer NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  "to_member_id" integer NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "sub_type" varchar(50),
  "start_date" date,
  "end_date" date,
  "status" varchar(50) DEFAULT 'active',
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  UNIQUE("from_member_id", "to_member_id", "type")
);

-- Create family events table
CREATE TABLE "family_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "type" varchar(50) NOT NULL,
  "date" date,
  "place" varchar(255),
  "description" text,
  "member_ids" integer[] NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX family_members_name_idx ON family_members(first_name, last_name);
CREATE INDEX family_members_birth_date_idx ON family_members(birth_date);
CREATE INDEX relationships_from_member_idx ON relationships(from_member_id);
CREATE INDEX relationships_to_member_idx ON relationships(to_member_id);
CREATE INDEX family_events_date_idx ON family_events(date);
CREATE INDEX family_events_type_idx ON family_events(type);