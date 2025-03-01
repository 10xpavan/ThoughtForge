import express from "express";
import { verifyOAuth2Setup, getAuthUrl, SCOPES, oauth2Client, getTokensFromCode } from "../config/googleAuth";
import { google } from 'googleapis';

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
  try {
    console.log("[Auth] Generating auth URL for login...");
    if (!verifyOAuth2Setup()) {
      console.error("[Auth] OAuth setup verification failed");
      return res.status(500).json({
        error: "OAuth configuration error",
        message: "The OAuth client is not properly configured. Check server logs for details."
      });
    }
    
    const authUrl = getAuthUrl();
    console.log(`[Auth] Redirecting to auth URL: ${authUrl}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error("[Auth] Error in login route:", error);
    res.status(500).json({
      error: "Authentication error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Step 2: Handle OAuth callback & get user tokens
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      console.error("[Auth] Missing authorization code in callback");
      return res.status(400).json({ 
        error: "Missing authorization code",
        message: "No authorization code was provided in the callback"
      });
    }
    
    console.log(`[Auth] Received authorization code: ${typeof code === 'string' ? code.substring(0, 10) + '...' : 'invalid code type'}`);
    const tokens = await getTokensFromCode(code as string);

    // Set the tokens in the OAuth client
    oauth2Client.setCredentials(tokens);

    // Get user info
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const userInfo = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos',
    });

    // Extract user data
    const email = userInfo.data.emailAddresses?.[0]?.value || '';
    const name = userInfo.data.names?.[0]?.displayName || '';
    const picture = userInfo.data.photos?.[0]?.url || '';

    // Store user info in session
    if (req.session) {
      req.session.user = {
        id: email, // Using email as ID for simplicity
        email,
        name,
        picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };
      console.log(`[Auth] User session created for: ${email}`);
    }

    // For testing purposes, display the tokens
    // In production, you would redirect to your app's frontend
    res.json({
      success: true,
      message: "Authentication successful",
      user: {
        email,
        name,
        picture
      },
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
      message: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : null) : null
    });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  if (req.session) {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("[Auth] Error destroying session:", err);
        return res.status(500).json({
          error: "Logout failed",
          message: "Failed to destroy session"
        });
      }
      
      // Revoke Google token (optional)
      if (req.session?.user?.accessToken) {
        try {
          oauth2Client.revokeToken(req.session.user.accessToken);
        } catch (error) {
          console.error("[Auth] Error revoking token:", error);
          // Continue with logout even if token revocation fails
        }
      }
      
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  } else {
    res.json({
      success: true,
      message: "No active session to logout from"
    });
  }
});

// User info route
router.get("/user", (req, res) => {
  if (req.session?.user) {
    res.json({
      authenticated: true,
      user: {
        email: req.session.user.email,
        name: req.session.user.name,
        picture: req.session.user.picture
      }
    });
  } else {
    res.json({
      authenticated: false,
      message: "Not authenticated"
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
