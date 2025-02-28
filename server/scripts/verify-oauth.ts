import { verifyOAuth2Setup, getAuthUrl, oauth2Client } from '../config/googleAuth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('======================================');
console.log('Google OAuth2 Setup Verification Tool');
console.log('======================================');
console.log('');

// Verify environment variables
const isSetup = verifyOAuth2Setup();
console.log(`Overall setup status: ${isSetup ? '✅ VALID' : '❌ INVALID'}`);
console.log('');

// Check individual environment variables
console.log('Environment Variables:');
console.log(`- GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`- GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`- GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI ? '✅ Set' : '❌ Missing'}`);
console.log('');

// Display OAuth2 client info
console.log('OAuth2 Client Configuration:');
console.log(`- Client ID: ${oauth2Client._clientId ? '✅ Configured' : '❌ Not configured'}`);
console.log(`- Client Secret: ${oauth2Client._clientSecret ? '✅ Configured' : '❌ Not configured'}`);
console.log(`- Redirect URI: ${oauth2Client._redirectUri ? '✅ Configured' : '❌ Not configured'}`);
console.log('');

// Display auth URL if setup is valid
if (isSetup) {
  console.log('Auth URL:');
  console.log(getAuthUrl());
  console.log('');
  console.log('To test the OAuth2 flow:');
  console.log('1. Visit the auth URL above in your browser');
  console.log('2. Complete the Google authentication process');
  console.log('3. You will be redirected to your redirect URI with an authorization code');
  console.log('4. Use this code to obtain access and refresh tokens');
} else {
  console.log('❌ Cannot generate auth URL due to invalid setup');
  console.log('Please fix the environment variables and try again');
}

console.log('');
console.log('======================================');
