import { google } from "googleapis";

// Verify required environment variables
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}\n` +
    "Please check your .env file and ensure all required variables are set."
  );
}

// Create OAuth2 Client with environment variables
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

// Log configuration status (without exposing sensitive values)
console.log("Google OAuth2 Configuration:", {
  clientConfigured: !!process.env.GOOGLE_CLIENT_ID,
  secretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
  redirectConfigured: !!process.env.GOOGLE_REDIRECT_URI,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

export { oauth2Client };
