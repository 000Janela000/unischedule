import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';

let cachedServiceAuth: GoogleAuth | null = null;
let cachedOAuth2Client: OAuth2Client | null = null;

/**
 * Service Account auth - for the public exam sheet (more reliable than gviz).
 */
export function getGoogleAuth(): GoogleAuth {
  if (cachedServiceAuth) return cachedServiceAuth;

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH not set');

  cachedServiceAuth = new GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return cachedServiceAuth;
}

/**
 * OAuth2 client - for the protected lecture sheet (user's uni account).
 * Uses a one-time refresh token that auto-refreshes.
 */
export function getOAuth2Client(): OAuth2Client {
  if (cachedOAuth2Client) return cachedOAuth2Client;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN must be set');
  }

  cachedOAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  cachedOAuth2Client.setCredentials({ refresh_token: refreshToken });

  return cachedOAuth2Client;
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getGoogleAuth() });
}

export function getDriveClient() {
  return google.drive({ version: 'v3', auth: getOAuth2Client() });
}
