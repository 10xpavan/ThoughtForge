import express from "express";
import { verifyOAuth2Setup, getAuthUrl, SCOPES, oauth2Client, getTokensFromCode } from "../config/googleAuth";

const router = express.Router();

// Test route to verify OAuth2 setup
router.get("/verify", (req, res) => {
  const isSetup = verifyOAuth2Setup();
  
  res.json({
    status: isSetup ? "success" : "error",
    message: isSetup 
      ? "Google OAuth2 setup verified successfully" 
      : "Google OAuth2 setup verification failed - check server logs",
    details: {
      environmentVariables: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✓ Configured" : "✗ Missing",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✓ Configured" : "✗ Missing",
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI ? "✓ Configured" : "✗ Missing",
      },
      scopes: SCOPES,
      authUrl: isSetup ? getAuthUrl() : null
    },
    timestamp: new Date().toISOString()
  });
});

// Step 1: Redirect user to Google OAuth page
router.get("/login", (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback & get user tokens
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ 
        error: "Missing authorization code",
        message: "No authorization code was provided in the callback"
      });
    }
    
    console.log(`[Auth] Received authorization code: ${code}`);
    const tokens = await getTokensFromCode(code as string);

    // For testing purposes, display the tokens
    // In production, you would store these securely and redirect to your app
    res.json({
      success: true,
      message: "Authentication successful",
      tokens: {
        access_token: tokens.access_token ? `${tokens.access_token.substring(0, 10)}...` : null,
        refresh_token: tokens.refresh_token ? `${tokens.refresh_token.substring(0, 10)}...` : null,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
      },
      note: "In production, never expose tokens in the response. This is only for testing."
    });
  } catch (error) {
    console.error("[Auth] OAuth Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Authentication failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test route to check token info
router.get("/token-info", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(400).json({ error: "No token provided" });
    }
    
    const tokenInfo = await oauth2Client.getTokenInfo(token);
    res.json({
      success: true,
      tokenInfo: {
        expiry: tokenInfo.expiry_date ? new Date(tokenInfo.expiry_date).toISOString() : null,
        scopes: tokenInfo.scopes,
        email: tokenInfo.email,
        isValid: tokenInfo.expiry_date ? (tokenInfo.expiry_date > Date.now()) : false
      }
    });
  } catch (error) {
    console.error("[Auth] Token info error:", error);
    res.status(401).json({ 
      success: false, 
      error: "Invalid token",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
