import { pgTable, serial, text, integer, numeric } from "drizzle-orm/pg-core";

export const tutorsTable = pgTable("tutors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  experienceYears: integer("experience_years").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  costPerHour: integer("cost_per_hour").notNull(),
  format: text("format").notNull(),
  bio: text("bio"),
});
