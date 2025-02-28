# Google OAuth2 Setup Guide

This guide explains how to set up and verify Google OAuth2 for ThoughtForge, which is required for Google Drive integration.

## Prerequisites

1. A Google Cloud Platform account
2. A Google Cloud Project with the Google Drive API enabled
3. OAuth 2.0 credentials configured for your application

## Setting Up OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name for your OAuth client
7. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback`
   - For production: Add your production callback URL

## Environment Variables

Add the following environment variables to your `.env` file:

```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## Verifying Your Setup

### Using the Verification Script

Run the verification script to check if your OAuth2 setup is correctly configured:

```bash
npm run verify:oauth
```

This will:
- Verify that all required environment variables are set
- Check that the OAuth2 client is properly configured
- Generate an authorization URL for testing

### Using the API Endpoints

The following API endpoints are available for testing:

1. **Verify Configuration**: `GET /api/auth/verify`
   - Returns the status of your OAuth2 configuration

2. **Start OAuth Flow**: `GET /api/auth/login`
   - Redirects to Google's authorization page

3. **OAuth Callback**: `GET /api/auth/callback`
   - Handles the callback from Google after authorization
   - Returns the tokens (for testing purposes only)

4. **Check Token Info**: `GET /api/auth/token-info`
   - Requires an Authorization header with a Bearer token
   - Returns information about the provided token

## Testing the Complete OAuth Flow

1. Visit `/api/auth/login` in your browser
2. Authenticate with Google
3. You will be redirected to the callback URL
4. The server will exchange the authorization code for tokens
5. For testing, the tokens will be displayed in the response

## Troubleshooting

### Common Issues

1. **"Missing required environment variable"**
   - Ensure all required variables are set in your `.env` file

2. **"Invalid client ID" or "Invalid client secret"**
   - Double-check your credentials in the Google Cloud Console

3. **"Redirect URI mismatch"**
   - Ensure the redirect URI in your `.env` file matches exactly what's configured in the Google Cloud Console

4. **"Token refresh failed"**
   - Check that you have the correct scopes and that your refresh token is valid

### Debugging

The application includes detailed logging for OAuth2-related operations. Check the server logs for messages prefixed with `[GoogleAuth]` to diagnose issues.

## Security Considerations

- Never commit your `.env` file to version control
- In production, always store tokens securely
- Implement proper token refresh mechanisms
- Use HTTPS for all OAuth2 redirects in production
