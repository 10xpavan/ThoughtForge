import express from "express";
import { google } from "googleapis";
import { oauth2Client } from "../config/googleAuth";

const router = express.Router();
const drive = google.drive({ version: "v3", auth: oauth2Client });

// Helper function to generate timestamped filename
function generateTimestampedFilename(baseFileName: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '') // Remove dashes and colons
    .replace(/\..+/, '')  // Remove milliseconds
    .replace('T', '-');   // Replace T with dash
  return `${baseFileName}-${timestamp}.txt`;
}

// API to upload journal entry to Google Drive
router.post("/upload", async (req, res) => {
  try {
    const { content, fileName } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const timestampedFileName = generateTimestampedFilename(fileName || 'journal');

    const fileMetadata = {
      name: timestampedFileName,
      mimeType: "text/plain",
    };

    const media = {
      mimeType: "text/plain",
      body: content,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id,name,webViewLink,createdTime", // Request additional fields
    });

    res.json({
      success: true,
      fileId: file.data.id,
      fileName: file.data.name,
      webViewLink: file.data.webViewLink,
      createdTime: file.data.createdTime
    });
  } catch (error) {
    console.error("Drive Upload Error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// API to share a file and get its web view link
router.post("/share", async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: "fileId is required" });
    }

    // Set file permissions to 'anyone with the link' as reader
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Get the file's webViewLink
    const file = await drive.files.get({
      fileId,
      fields: 'webViewLink'
    });

    res.json({ 
      success: true, 
      webViewLink: file.data.webViewLink
    });
  } catch (error) {
    console.error("Drive Share Error:", error);
    res.status(500).json({ error: "Failed to share file" });
  }
});

export default router;
