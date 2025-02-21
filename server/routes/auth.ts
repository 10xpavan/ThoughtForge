import express from "express";
import { oauth2Client } from "../config/googleAuth";

const router = express.Router();

// Step 1: Redirect user to Google OAuth page
router.get("/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback & get user tokens
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code as string);

    // Store tokens securely (Database or Session)
    oauth2Client.setCredentials(tokens);

    res.json({ success: true, tokens });
  } catch (error) {
    console.error("Google OAuth Error:", error);
    res.status(500).json({ success: false, error: "Authentication failed" });
  }
});

export default router;
