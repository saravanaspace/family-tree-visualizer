-- Phase 2 authentication persistence. This migration does not alter family data.
-- Rollback: drop user_sessions, login_attempts, credentials, then users.

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "username" varchar(50) NOT NULL,
  "display_name" varchar(100) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "users_status_check" CHECK ("status" IN ('active', 'disabled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_lower_idx" ON "users" (lower("username"));

CREATE TABLE IF NOT EXISTS "credentials" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "type" varchar(30) NOT NULL,
  "identifier" varchar(255) NOT NULL,
  "secret_hash" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "credentials_type_check" CHECK ("type" IN ('password', 'google', 'apple', 'email_otp'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "credentials_type_identifier_idx" ON "credentials" ("type", "identifier");
CREATE UNIQUE INDEX IF NOT EXISTS "credentials_user_type_idx" ON "credentials" ("user_id", "type");

CREATE TABLE IF NOT EXISTS "login_attempts" (
  "username" varchar(50) PRIMARY KEY NOT NULL,
  "failed_count" integer NOT NULL DEFAULT 0,
  "locked_until" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "login_attempts_failed_count_check" CHECK ("failed_count" >= 0)
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" varchar NOT NULL PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "user_sessions_expire_idx" ON "user_sessions" ("expire");
