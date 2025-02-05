import { type Entry, type InsertEntry, type Template, type UserPreferences, entries, templates, userPreferences, tags } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc } from "drizzle-orm";

export interface IStorage {
  // Entry operations
  getEntries(): Promise<Entry[]>;
  getEntry(id: number): Promise<Entry | undefined>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  updateEntry(id: number, entry: Partial<InsertEntry>): Promise<Entry>;
  deleteEntry(id: number): Promise<void>;
  searchEntries(query: string): Promise<Entry[]>;
  getFavoriteEntries(): Promise<Entry[]>;

  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: { name: string; content: string }): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;

  // Tag operations
  getTags(): Promise<string[]>;
  getEntriesByTag(tag: string): Promise<Entry[]>;

  // Preferences operations
  getUserPreferences(): Promise<UserPreferences>;
  updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}

export class DatabaseStorage implements IStorage {
  // Existing entry operations
  async getEntries(): Promise<Entry[]> {
    return await db.select().from(entries).orderBy(desc(entries.createdAt));
  }

  async getEntry(id: number): Promise<Entry | undefined> {
    const [entry] = await db.select().from(entries).where(eq(entries.id, id));
    return entry;
  }

  async createEntry(entry: InsertEntry): Promise<Entry> {
    const [created] = await db.insert(entries).values(entry).returning();
    return created;
  }

  async updateEntry(id: number, entry: Partial<InsertEntry>): Promise<Entry> {
    const [updated] = await db
      .update(entries)
      .set(entry)
      .where(eq(entries.id, id))
      .returning();

    if (!updated) {
      throw new Error("Entry not found");
    }

    return updated;
  }

  async deleteEntry(id: number): Promise<void> {
    await db.delete(entries).where(eq(entries.id, id));
  }

  async searchEntries(query: string): Promise<Entry[]> {
    return await db
      .select()
      .from(entries)
      .where(ilike(entries.title, `%${query}%`))
      .orWhere(ilike(entries.content, `%${query}%`))
      .orderBy(desc(entries.createdAt));
  }

  // New operations
  async getFavoriteEntries(): Promise<Entry[]> {
    return await db
      .select()
      .from(entries)
      .where(eq(entries.isFavorite, true))
      .orderBy(desc(entries.createdAt));
  }

  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.name);
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(template: { name: string; content: string }): Promise<Template> {
    const [created] = await db.insert(templates).values(template).returning();
    return created;
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }

  async getTags(): Promise<string[]> {
    const result = await db.select().from(entries);
    const tagsSet = new Set<string>();
    result.forEach(entry => entry.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }

  async getEntriesByTag(tag: string): Promise<Entry[]> {
    const result = await db.select().from(entries);
    return result.filter(entry => entry.tags.includes(tag));
  }

  async getUserPreferences(): Promise<UserPreferences> {
    const [prefs] = await db.select().from(userPreferences);
    if (!prefs) {
      const [created] = await db.insert(userPreferences)
        .values({ theme: "dark", settings: {} })
        .returning();
      return created;
    }
    return prefs;
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const [updated] = await db
      .update(userPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();