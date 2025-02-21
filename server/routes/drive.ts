import express from "express";
import { google } from "googleapis";
import { oauth2Client } from "../config/googleAuth";

const router = express.Router();
const drive = google.drive({ version: "v3", auth: oauth2Client });

// API to upload journal entry to Google Drive
router.post("/upload", async (req, res) => {
  try {
    const { content, fileName } = req.body;

    const fileMetadata = {
      name: `${fileName}.txt`,
      mimeType: "text/plain",
    };

    const media = {
      mimeType: "text/plain",
      body: content,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    res.json({ success: true, fileId: file.data.id });
  } catch (error) {
    console.error("Drive Upload Error:", error);
    res.status(500).json({ success: false, error: "File upload failed" });
  }
});

export default router;
