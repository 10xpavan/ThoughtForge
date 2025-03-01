import express, { Router } from 'express';

export function registerRoutes(app: express.Application) {
  const router = Router();
  
  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // Add your other routes here
  
  return router;
}