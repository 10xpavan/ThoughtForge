import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  tags: text("tags").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  theme: text("theme").default("dark").notNull(),
  settings: jsonb("settings").default({}).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema for inserting entries
export const insertEntrySchema = createInsertSchema(entries)
  .pick({
    title: true,
    content: true,
    isFavorite: true,
    tags: true,
  })
  .extend({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
    isFavorite: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  });

// Schema for inserting templates
export const insertTemplateSchema = createInsertSchema(templates)
  .pick({
    name: true,
    content: true,
  })
  .extend({
    name: z.string().min(1).max(50),
    content: z.string().min(1),
  });

// Schema for user preferences
export const updatePreferencesSchema = createInsertSchema(userPreferences)
  .pick({
    theme: true,
    settings: true,
  })
  .extend({
    theme: z.enum(["light", "dark", "system"]),
    settings: z.record(z.unknown()).default({}),
  });

// Type exports
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entries.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;