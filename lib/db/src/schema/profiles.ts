import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  grade: text("grade").notNull(),
  egeYear: integer("ege_year").notNull(),
  favoriteSubjects: jsonb("favorite_subjects").$type<string[]>().notNull(),
  hobbies: jsonb("hobbies").$type<string[]>().notNull(),
  interests: jsonb("interests").$type<string[]>().notNull(),
  priorities: jsonb("priorities").$type<string[]>().notNull(),
  orientationAnswers: jsonb("orientation_answers").$type<Record<string, string>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
