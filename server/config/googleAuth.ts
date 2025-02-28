import { google } from "googleapis";
import { OAuth2Client } from 'google-auth-library';
import type { Request } from 'express';

// Validate required environment variables
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
};

// Check for missing credentials and log detailed errors
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`[GoogleAuth] ERROR: Missing required environment variable: ${key}`);
    console.error(`[GoogleAuth] Please ensure ${key} is set in your .env file`);
  } else {
    console.log(`[GoogleAuth] ${key} is properly configured`);
  }
});

// Create OAuth2 client with environment variables
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Log OAuth2 client initialization
console.log(`[GoogleAuth] OAuth2 client initialized with redirect URI: ${process.env.GOOGLE_REDIRECT_URI}`);

// Define scopes needed for Drive access
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
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
          console.log('[GoogleAuth] New token expires at:', new Date(credentials.expiry_date || 0).toISOString());
        } catch (refreshError) {
          console.error('[GoogleAuth] Token refresh failed:', refreshError);
          return null;
        }
      } else {
        console.log('[GoogleAuth] Token is valid until:', new Date(tokenInfo.expiry_date || 0).toISOString());
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
  });
  
  console.log(`[GoogleAuth] Generated auth URL with scopes: ${SCOPES.join(', ')}`);
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

    // Log token details (without exposing sensitive data)
    console.log(`[GoogleAuth] Received tokens successfully`);
    console.log(`[GoogleAuth] Access token expires at: ${new Date(tokens.expiry_date || 0).toISOString()}`);
    console.log(`[GoogleAuth] Refresh token received: ${tokens.refresh_token ? 'Yes' : 'No'}`);

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
    console.log(`[GoogleAuth] Verifying token validity`);
    const tokenInfo = await oauth2Client.getTokenInfo(token);
    
    const isValid = !!tokenInfo.expiry_date && tokenInfo.expiry_date > Date.now();
    
    if (isValid) {
      console.log(`[GoogleAuth] Token is valid until: ${new Date(tokenInfo.expiry_date || 0).toISOString()}`);
    } else {
      console.log(`[GoogleAuth] Token is expired or invalid`);
    }
    
    return isValid;
  } catch (error) {
    console.error('[GoogleAuth] Token verification failed:', error);
    return false;
  }
}

// Add a test function to verify the OAuth2 setup
export function verifyOAuth2Setup(): boolean {
  const isSetup = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );
  
  if (isSetup) {
    console.log('[GoogleAuth] OAuth2 setup verified successfully');
  } else {
    console.error('[GoogleAuth] OAuth2 setup verification failed - missing environment variables');
  }
  
  return isSetup;
}
