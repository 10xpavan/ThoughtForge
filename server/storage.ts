import { type Entry, type InsertEntry, entries } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getEntries(): Promise<Entry[]>;
  getEntry(id: number): Promise<Entry | undefined>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  updateEntry(id: number, entry: Partial<InsertEntry>): Promise<Entry>;
  deleteEntry(id: number): Promise<void>;
  searchEntries(query: string): Promise<Entry[]>;
}

export class DatabaseStorage implements IStorage {
  async getEntries(): Promise<Entry[]> {
    return await db.select().from(entries).orderBy(entries.createdAt);
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
    const lowercaseQuery = query.toLowerCase();
    const results = await db.select().from(entries);
    return results.filter(
      entry =>
        entry.title.toLowerCase().includes(lowercaseQuery) ||
        entry.content.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const storage = new DatabaseStorage();