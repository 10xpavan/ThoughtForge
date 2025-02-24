import express from "express";
import { google } from "googleapis";
import { oauth2Client } from "../config/googleAuth";
import { TokenError } from "../errors/TokenError";

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

// API to upload journal entry to Google Drive
router.post("/upload", async (req, res) => {
  const startTime = Date.now();
  const { title, content } = req.body;

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

    const filename = generateTimestampedFilename(title);
    console.log(`[Drive Upload] Generated filename: ${filename}`);

    const fileMetadata = {
      name: filename,
      mimeType: "text/plain",
      description: `Journal entry: ${title || 'Untitled'}`,
    };

    const media = {
      mimeType: "text/plain",
      body: content.trim(),
    };

    // Attempt file upload with retry
    let retryCount = 0;
    const maxRetries = 2;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        const file = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: "id,name,webViewLink,createdTime,description",
        });

        const duration = Date.now() - startTime;
        console.log(`[Drive Upload] Success: "${filename}" uploaded in ${duration}ms`);
        
        return res.json({
          success: true,
          fileId: file.data.id,
          fileName: file.data.name,
          webViewLink: file.data.webViewLink,
          createdTime: file.data.createdTime,
          description: file.data.description
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if error is retryable (network issues, temporary server problems)
        if (error instanceof Error && 
            (error.message.includes('ECONNRESET') || 
             error.message.includes('500') || 
             error.message.includes('503'))) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.log(`[Drive Upload] Retry ${retryCount}/${maxRetries} after error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            continue;
          }
        }
        
        // Non-retryable error or max retries reached
        throw new DriveUploadError(
          'Failed to upload file to Google Drive', 
          error
        );
      }
    }

    // If we get here, all retries failed
    throw new DriveUploadError(
      'Failed to upload file after multiple retries',
      lastError
    );

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
