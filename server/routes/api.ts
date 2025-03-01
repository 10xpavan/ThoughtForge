import express from 'express';

const router = express.Router();

// Basic API endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'API is working',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Protected API endpoint example
router.get('/protected', (req, res) => {
  // Check if user is authenticated
  if (!req.session?.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }
  
  res.json({ 
    message: 'Protected API endpoint',
    user: req.session.user
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
