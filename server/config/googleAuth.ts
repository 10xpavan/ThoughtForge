import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Load Google Credentials from JSON file
const credentialsPath = path.join(__dirname, "google-credentials.json");

if (!fs.existsSync(credentialsPath)) {
  throw new Error("Google credentials file is missing!");
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
const { client_id, client_secret, redirect_uris } = credentials.web;

// Create OAuth2 Client
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

export { oauth2Client };
