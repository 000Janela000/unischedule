import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';

let cachedServiceAuth: GoogleAuth | null = null;
let cachedOAuth2Client: OAuth2Client | null = null;

/**
 * Service Account auth - for local development with key file.
 * Falls back to OAuth2 if key file not available (Vercel deployment).
 */
export function getGoogleAuth(): GoogleAuth | OAuth2Client {
  // If OAuth2 credentials are available, prefer them (works on Vercel)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    return getOAuth2Client();
  }

  // Fall back to service account key file (local dev)
  if (cachedServiceAuth) return cachedServiceAuth;

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) throw new Error('Either GOOGLE_CLIENT_ID+SECRET+REFRESH_TOKEN or GOOGLE_SERVICE_ACCOUNT_KEY_PATH must be set');

  cachedServiceAuth = new GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return cachedServiceAuth;
}

/**
 * OAuth2 client - uses the uni account's refresh token.
 * Works for both exam sheet (public) and lecture sheet (private).
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
