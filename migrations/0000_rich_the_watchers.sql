CREATE TABLE "family_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birth_date" text,
	"location" text,
	"type" text NOT NULL,
	"x" real DEFAULT 0 NOT NULL,
	"y" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_member_id" integer NOT NULL,
	"to_member_id" integer NOT NULL,
	"type" text NOT NULL
);
