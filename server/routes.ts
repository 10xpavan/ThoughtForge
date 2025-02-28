import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEntrySchema, insertTemplateSchema, updatePreferencesSchema } from "@shared/schema";
import driveRoutes from "./routes/drive";
import authRoutes from "./routes/auth";

export function registerRoutes(app: Express): Server {
  // Register drive routes
  app.use("/api/drive", driveRoutes);

  // Register auth routes
  app.use("/api/auth", authRoutes);

  // Entry routes
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

  // Template routes
  app.get("/api/templates", async (_req, res) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const template = insertTemplateSchema.parse(req.body);
      const created = await storage.createTemplate(template);
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    await storage.deleteTemplate(Number(req.params.id));
    res.status(204).send();
  });

  // Tag routes
  app.get("/api/tags", async (_req, res) => {
    const tags = await storage.getTags();
    res.json(tags);
  });

  app.get("/api/entries/tag/:tag", async (req, res) => {
    const entries = await storage.getEntriesByTag(req.params.tag);
    res.json(entries);
  });

  // User preferences routes
  app.get("/api/preferences", async (_req, res) => {
    const preferences = await storage.getUserPreferences();
    res.json(preferences);
  });

  app.patch("/api/preferences", async (req, res) => {
    try {
      const updates = updatePreferencesSchema.partial().parse(req.body);
      const updated = await storage.updateUserPreferences(updates);
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ message });
    }
  });

  // Search route
  app.get("/api/entries/search/:query", async (req, res) => {
    const entries = await storage.searchEntries(req.params.query);
    res.json(entries);
  });

  const httpServer = createServer(app);
  return httpServer;
}