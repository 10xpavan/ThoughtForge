import { google } from "googleapis";
import { OAuth2Client } from 'google-auth-library';
import type { Request } from 'express';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Get environment variables with better logging
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/callback';

// Log the environment variables being used
console.log("[GoogleAuth] OAuth Configuration:");
console.log(`[GoogleAuth] - Client ID: ${GOOGLE_CLIENT_ID ? "Configured" : "Missing"}`);
console.log(`[GoogleAuth] - Client Secret: ${GOOGLE_CLIENT_SECRET ? "Configured" : "Missing"}`);
console.log(`[GoogleAuth] - Redirect URI: ${GOOGLE_REDIRECT_URI}`);

// Create OAuth2 client with environment variables
export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Define scopes needed for Drive access
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

interface TokenInfo {
  access_token: string;
  refresh_token?: string;
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

    // Get refresh token from storage (implement your storage method)
    const refreshToken = req.headers['x-refresh-token'] as string || null;

    // Set credentials
    oauth2Client.setCredentials({
      access_token: token,
      refresh_token: refreshToken,
    });

    // Check if token needs refresh
    try {
      const tokenInfo = await oauth2Client.getTokenInfo(token);
      const now = Date.now();
      
      if (tokenInfo.expiry_date && tokenInfo.expiry_date <= now) {
        console.log('[GoogleAuth] Token expired, attempting refresh');
        
        if (!refreshToken) {
          console.error('[GoogleAuth] No refresh token available for expired token');
          return null;
        }
        
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
    } catch (tokenInfoError) {
      console.error('[GoogleAuth] Error checking token info:', tokenInfoError);
      
      // Try to refresh anyway if we have a refresh token
      if (refreshToken) {
        console.log('[GoogleAuth] Attempting token refresh after token info failure');
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          console.log('[GoogleAuth] Token refreshed successfully after failure');
        } catch (refreshError) {
          console.error('[GoogleAuth] Token refresh failed after token info failure:', refreshError);
          return null;
        }
      } else {
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
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
    include_granted_scopes: true
  });
  
  console.log(`[GoogleAuth] Generated auth URL: ${authUrl}`);
  return authUrl;
}

/**
 * Exchange authorization code for tokens
 * @param code Authorization code from OAuth callback
 */
export async function getTokensFromCode(code: string): Promise<TokenInfo> {
  try {
    console.log(`[GoogleAuth] Exchanging authorization code for tokens`);
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      console.error('[GoogleAuth] No access token received in token exchange');
      throw new Error('No access token received');
    }

    console.log('[GoogleAuth] Successfully received tokens');
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
    const isValid = !!tokenInfo.expiry_date && tokenInfo.expiry_date > Date.now();
    return isValid;
  } catch (error) {
    console.error('[GoogleAuth] Token verification failed:', error);
    return false;
  }
}

// Add a test function to verify the OAuth2 setup
export function verifyOAuth2Setup(): boolean {
  const isSetup = !!(
    GOOGLE_CLIENT_ID && 
    GOOGLE_CLIENT_SECRET && 
    GOOGLE_REDIRECT_URI
  );
  
  if (!isSetup) {
    console.error('[GoogleAuth] Missing required environment variables for OAuth setup');
    if (!GOOGLE_CLIENT_ID) console.error('[GoogleAuth] Missing GOOGLE_CLIENT_ID');
    if (!GOOGLE_CLIENT_SECRET) console.error('[GoogleAuth] Missing GOOGLE_CLIENT_SECRET');
    if (!GOOGLE_REDIRECT_URI) console.error('[GoogleAuth] Missing GOOGLE_REDIRECT_URI');
    return false;
  }
  
  return true;
}
