import dotenv from 'dotenv';
// Load environment variables at the very beginning
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupVite, serveStatic, log } from "./vite";
import driveRouter from './routes/drive';
import authRouter from './routes/auth';
import apiRouter from './routes/api';
import session from 'express-session';
import { createServer } from 'net';

// Log environment variables for debugging
console.log("[Server] Environment variables:");
console.log(`[Server] - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`[Server] - PORT: ${process.env.PORT || '5001'}`);
console.log(`[Server] - GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI || 'Not set'}`);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : 'http://localhost:5173',
  credentials: true
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'thoughtforge-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/drive', driveRouter);

// Auth routes
app.use('/api/auth', authRouter);
console.log('[Server] Auth routes registered at /api/auth');

// API routes
app.use('/api', apiRouter);
console.log('[Server] API routes registered at /api');

// Root API response
app.get('/', (req, res) => {
  res.send('ThoughtForge API Server is running!');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Start the server with port fallback
const startServer = async () => {
  // Force port 5001 by default
  const PORT = process.env.PORT || 5001;
  
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] API URL: http://localhost:${PORT}/api`);
    console.log(`[Server] Auth URL: http://localhost:${PORT}/api/auth/login`);
  });
  
  return server;
};

// Start the server
const server = startServer();

export default app;
