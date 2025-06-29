import { pgTable, text, serial, integer, real, timestamp, date, boolean, varchar, primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  gender: varchar("gender", { length: 50 }),
  birthDate: date("birth_date"),
  birthPlace: varchar("birth_place", { length: 255 }),
  deathDate: date("death_date"),
  deathPlace: varchar("death_place", { length: 255 }),
  occupation: varchar("occupation", { length: 255 }),
  biography: text("biography"),
  photoUrl: varchar("photo_url", { length: 500 }),
  isLiving: boolean("is_living").default(true),
  // Visual positioning
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  // Timestamps for record keeping
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    nameIdx: index("family_members_name_idx").on(table.firstName, table.lastName),
    birthDateIdx: index("family_members_birth_date_idx").on(table.birthDate),
  }
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  fromMemberId: integer("from_member_id").notNull().references(() => familyMembers.id, { onDelete: 'cascade' }),
  toMemberId: integer("to_member_id").notNull().references(() => familyMembers.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // parent-child, spouse, adopted, step-parent
  subType: varchar("sub_type", { length: 50 }), // biological, adopted, step for parent-child
  startDate: date("start_date"), // marriage date, adoption date, etc.
  endDate: date("end_date"), // divorce date, death date, etc.
  status: varchar("status", { length: 50 }).default('active'), // active, divorced, widowed, deceased
  notes: text("notes"),
  // Timestamps for record keeping
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    membersPairIdx: uniqueIndex("relationships_members_pair_idx").on(
      table.fromMemberId, 
      table.toMemberId, 
      table.type
    ),
    fromMemberIdx: index("relationships_from_member_idx").on(table.fromMemberId),
    toMemberIdx: index("relationships_to_member_idx").on(table.toMemberId),
  }
});

export const familyEvents = pgTable("family_events", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // birth, death, marriage, divorce, graduation, etc.
  date: date("date"),
  place: varchar("place", { length: 255 }),
  description: text("description"),
  // Multiple members can be involved in an event
  memberIds: integer("member_ids").array().notNull(), // PostgreSQL array type
  // Timestamps for record keeping
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    dateIdx: index("family_events_date_idx").on(table.date),
    typeIdx: index("family_events_type_idx").on(table.type),
  }
});

// Define relations
export const familyMembersRelations = relations(familyMembers, ({ many }) => ({
  relationships: many(relationships),
  events: many(familyEvents),
}));

export const relationshipsRelations = relations(relationships, ({ one }) => ({
  fromMember: one(familyMembers, {
    fields: [relationships.fromMemberId],
    references: [familyMembers.id],
  }),
  toMember: one(familyMembers, {
    fields: [relationships.toMemberId],
    references: [familyMembers.id],
  }),
}));

// Custom zod transform for handling dates
const dateTransform = z.preprocess((arg) => {
  if (arg === "" || arg === undefined || arg === null) return null;
  if (arg instanceof Date) return arg;
  if (typeof arg === 'string') return new Date(arg);
  return null;
}, z.date().nullable());

// Validation schemas
export const insertFamilyMemberSchema = createInsertSchema(familyMembers, {
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birthDate: dateTransform.optional(),
  birthPlace: z.string().max(255).optional(),
  deathDate: dateTransform,
  deathPlace: z.string().max(255).optional(),
  occupation: z.string().max(255).optional(),
  biography: z.string().optional(),
  photoUrl: z.string().max(500).optional(),
  isLiving: z.boolean().default(true),
  x: z.number().default(0),
  y: z.number().default(0),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertRelationshipSchema = createInsertSchema(relationships, {
  type: z.enum(['parent-child', 'spouse', 'adopted', 'step-parent']),
  subType: z.enum(['biological', 'adopted', 'step', 'foster', 'legal']).optional(),
  status: z.enum(['active', 'divorced', 'separated', 'widowed', 'deceased']).default('active'),
  startDate: dateTransform,
  endDate: dateTransform,
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertFamilyEventSchema = createInsertSchema(familyEvents, {
  type: z.enum([
    'birth', 'death', 'marriage', 'divorce', 
    'adoption', 'graduation', 'move', 'other'
  ]),
  date: dateTransform,
  memberIds: z.number().array().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Type exports
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;
export type InsertFamilyEvent = z.infer<typeof insertFamilyEventSchema>;
export type FamilyEvent = typeof familyEvents.$inferSelect;

export type FamilyTreeData = {
  members: FamilyMember[];
  relationships: Relationship[];
  events: FamilyEvent[];
};
