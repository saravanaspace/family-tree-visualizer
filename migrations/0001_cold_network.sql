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
--> statement-breakpoint
ALTER TABLE "family_members" ALTER COLUMN "birth_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "relationships" ALTER COLUMN "type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "first_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "middle_name" varchar(100);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "gender" varchar(50);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "birth_place" varchar(255);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "death_date" date;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "death_place" varchar(255);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "occupation" varchar(255);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "biography" text;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "photo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "is_living" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "sub_type" varchar(50);--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "status" varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "relationships" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
CREATE INDEX "family_events_date_idx" ON "family_events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "family_events_type_idx" ON "family_events" USING btree ("type");--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_from_member_id_family_members_id_fk" FOREIGN KEY ("from_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_to_member_id_family_members_id_fk" FOREIGN KEY ("to_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_members_name_idx" ON "family_members" USING btree ("first_name","last_name");--> statement-breakpoint
CREATE INDEX "family_members_birth_date_idx" ON "family_members" USING btree ("birth_date");--> statement-breakpoint
CREATE UNIQUE INDEX "relationships_members_pair_idx" ON "relationships" USING btree ("from_member_id","to_member_id","type");--> statement-breakpoint
CREATE INDEX "relationships_from_member_idx" ON "relationships" USING btree ("from_member_id");--> statement-breakpoint
CREATE INDEX "relationships_to_member_idx" ON "relationships" USING btree ("to_member_id");--> statement-breakpoint
ALTER TABLE "family_members" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "family_members" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "family_members" DROP COLUMN "type";