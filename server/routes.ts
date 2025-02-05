import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEntrySchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  app.get("/api/entries", async (_req, res) => {
    const entries = await storage.getEntries();
    res.json(entries);
  });

  app.get("/api/entries/:id", async (req, res) => {
    const entry = await storage.getEntry(Number(req.params.id));
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json(entry);
  });

  app.post("/api/entries", async (req, res) => {
    try {
      const entry = insertEntrySchema.parse(req.body);
      const created = await storage.createEntry(entry);
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ message });
    }
  });

  app.patch("/api/entries/:id", async (req, res) => {
    try {
      const updates = insertEntrySchema.partial().parse(req.body);
      const updated = await storage.updateEntry(Number(req.params.id), updates);
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/entries/:id", async (req, res) => {
    await storage.deleteEntry(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/prompts", async (_req, res) => {
    const prompts = await storage.getPrompts();
    res.json(prompts);
  });

  app.get("/api/entries/search/:query", async (req, res) => {
    const entries = await storage.searchEntries(req.params.query);
    res.json(entries);
  });

  const httpServer = createServer(app);
  return httpServer;
}