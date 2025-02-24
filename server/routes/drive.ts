import express from "express";
import { google } from "googleapis";
import { oauth2Client } from "../config/googleAuth";
import { TokenError } from "../errors/TokenError";
import { format } from 'date-fns';

const router = express.Router();
const drive = google.drive({ version: "v3", auth: oauth2Client });

// Custom error types
class DriveUploadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DriveUploadError';
  }
}

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove special characters except dash, underscore, and space
    .trim()
    .replace(/\s+/g, '-')            // Replace spaces with dashes
    .substring(0, 100);              // Limit length
}

// Helper function to generate timestamped filename
function generateTimestampedFilename(title: string = 'Untitled'): string {
  const now = new Date();
  const date = now.toISOString()
    .split('T')[0];                  // Get YYYY-MM-DD
  
  const time = now.toTimeString()
    .split(' ')[0]                   // Get HH:MM:SS
    .substring(0, 5)                 // Keep only HH:MM
    .replace(':', '');               // Remove colon
  
  const sanitizedTitle = sanitizeFilename(title);
  const baseFileName = sanitizedTitle || 'Untitled';
  
  return `${baseFileName}-${date}-${time}.txt`;
}

interface UploadRequest {
  title: string;
  content: string;
  fileId?: string | null;
}

const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second

async function uploadToDrive(
  auth: any, 
  title: string, 
  content: string, 
  fileId?: string | null,
  retryCount = 0
): Promise<{ id: string }> {
  const drive = google.drive({ version: 'v3', auth });
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const fileName = `${title || 'Untitled'}-${timestamp}.txt`;

  try {
    if (fileId) {
      // Update existing file
      const response = await drive.files.update({
        fileId,
        media: {
          mimeType: 'text/plain',
          body: content,
        },
        requestBody: {
          name: fileName,
        },
      });
      return { id: fileId };
    } else {
      // Create new file
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'text/plain',
        },
        media: {
          mimeType: 'text/plain',
          body: content,
        },
      });
      
      if (!response.data.id) {
        throw new Error('No file ID returned from Drive API');
      }
      
      return { id: response.data.id };
    }
  } catch (error) {
    console.error(`Drive upload error (attempt ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return uploadToDrive(auth, title, content, fileId, retryCount + 1);
    }
    
    throw error;
  }
}

// API to upload journal entry to Google Drive
router.post("/upload", async (req, res) => {
  const startTime = Date.now();
  const { title, content, fileId } = req.body as UploadRequest;

  console.log(`[Drive Upload] Starting upload for "${title || 'Untitled'}" at ${new Date().toISOString()}`);

  try {
    // Input validation
    if (!content?.trim()) {
      console.log('[Drive Upload] Rejected: Empty content');
      return res.status(400).json({ 
        error: "Content is required",
        details: "Cannot upload empty content"
      });
    }

    // Check auth token
    if (!oauth2Client.credentials.access_token) {
      console.error('[Drive Upload] Failed: No access token');
      throw new TokenError('No Google Drive access token available');
    }

    const result = await uploadToDrive(oauth2Client, title, content, fileId);
    res.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof DriveUploadError ? error.cause : error;
    
    console.error('[Drive Upload] Error:', {
      message: errorMessage,
      details: errorDetails,
      title,
      timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (error instanceof TokenError) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "Please sign in to Google Drive again"
      });
    }

    return res.status(500).json({
      error: "Failed to upload file to Google Drive",
      details: errorMessage
    });
  }
});

// API to share a file
router.post("/share", async (req, res) => {
  console.log('[Drive Share] Starting share request');
  
  try {
    const { fileId } = req.body;

    if (!fileId) {
      console.log('[Drive Share] Rejected: No fileId provided');
      return res.status(400).json({ 
        error: "File ID is required",
        details: "Please provide a valid file ID to share"
      });
    }

    // Check auth token
    if (!oauth2Client.credentials.access_token) {
      console.error('[Drive Share] Failed: No access token');
      throw new TokenError('No Google Drive access token available');
    }

    // Update sharing permissions
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Get the web view link
    const file = await drive.files.get({
      fileId,
      fields: 'webViewLink'
    });

    console.log(`[Drive Share] Success: File ${fileId} shared successfully`);

    res.json({
      success: true,
      webViewLink: file.data.webViewLink
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[Drive Share] Error:', {
      message: errorMessage,
      error,
      timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (error instanceof TokenError) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "Please sign in to Google Drive again"
      });
    }

    res.status(500).json({
      error: "Failed to share file",
      details: errorMessage
    });
  }
});

export default router;
