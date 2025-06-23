import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  birthDate: text("birth_date"),
  location: text("location"),
  type: text("type").notNull(), // father, mother, spouse, child
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  fromMemberId: integer("from_member_id").notNull(),
  toMemberId: integer("to_member_id").notNull(),
  type: text("type").notNull(), // parent, spouse
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true,
});

export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

export type FamilyTreeData = {
  members: FamilyMember[];
  relationships: Relationship[];
};
