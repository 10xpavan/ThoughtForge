import { type Entry, type InsertEntry } from "@shared/schema";

export interface IStorage {
  getEntries(): Promise<Entry[]>;
  getEntry(id: number): Promise<Entry | undefined>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  updateEntry(id: number, entry: Partial<InsertEntry>): Promise<Entry>;
  deleteEntry(id: number): Promise<void>;
  searchEntries(query: string): Promise<Entry[]>;
}

export class MemStorage implements IStorage {
  private entries: Map<number, Entry>;
  private currentEntryId: number;

  constructor() {
    this.entries = new Map();
    this.currentEntryId = 1;
  }

  async getEntries(): Promise<Entry[]> {
    return Array.from(this.entries.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getEntry(id: number): Promise<Entry | undefined> {
    return this.entries.get(id);
  }

  async createEntry(entry: InsertEntry): Promise<Entry> {
    const id = this.currentEntryId++;
    const newEntry: Entry = {
      ...entry,
      id,
      createdAt: new Date(),
    };
    this.entries.set(id, newEntry);
    return newEntry;
  }

  async updateEntry(id: number, entry: Partial<InsertEntry>): Promise<Entry> {
    const existingEntry = await this.getEntry(id);
    if (!existingEntry) {
      throw new Error("Entry not found");
    }
    const updatedEntry = { ...existingEntry, ...entry };
    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteEntry(id: number): Promise<void> {
    this.entries.delete(id);
  }

  async searchEntries(query: string): Promise<Entry[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.entries.values()).filter(
      entry =>
        entry.title.toLowerCase().includes(lowercaseQuery) ||
        entry.content.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const storage = new MemStorage();