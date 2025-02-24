import { google } from "googleapis";
import { OAuth2Client } from 'google-auth-library';
import type { Request } from 'express';

// Validate required environment variables
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
};

// Check for missing credentials
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`[GoogleAuth] Missing required environment variable: ${key}`);
  }
});

// Create OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Define scopes needed for Drive access
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
];

interface TokenInfo {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Gets a valid OAuth2 client for the request, handling token refresh if needed
 * @param req Express request object containing user's token
 * @returns OAuth2Client or null if no valid token
 */
export async function getOAuth2Client(req: Request): Promise<OAuth2Client | null> {
  try {
    // Get token from request (implement your token storage/retrieval logic)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.warn('[GoogleAuth] No token provided in request');
      return null;
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: token,
      // Add refresh_token if you have it stored
    });

    // Check if token needs refresh
    const tokenInfo = await oauth2Client.getTokenInfo(token);
    const now = Date.now();
    
    if (tokenInfo.expiry_date && tokenInfo.expiry_date <= now) {
      console.log('[GoogleAuth] Token expired, attempting refresh');
      
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        
        // Here you might want to store the new tokens
        // await updateStoredTokens(req.user.id, credentials);
        
        console.log('[GoogleAuth] Token refreshed successfully');
      } catch (refreshError) {
        console.error('[GoogleAuth] Token refresh failed:', refreshError);
        return null;
      }
    }

    return oauth2Client;
  } catch (error) {
    console.error('[GoogleAuth] Error getting OAuth2 client:', error);
    return null;
  }
}

/**
 * Generate authorization URL for initial OAuth flow
 */
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 * @param code Authorization code from OAuth callback
 */
export async function getTokensFromCode(code: string): Promise<TokenInfo> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    return tokens as TokenInfo;
  } catch (error) {
    console.error('[GoogleAuth] Error getting tokens from code:', error);
    throw error;
  }
}

/**
 * Verify token is valid and not expired
 * @param token Access token to verify
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const tokenInfo = await oauth2Client.getTokenInfo(token);
    return !!tokenInfo.expiry_date && tokenInfo.expiry_date > Date.now();
  } catch (error) {
    console.error('[GoogleAuth] Token verification failed:', error);
    return false;
  }
}
