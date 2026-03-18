/**
 * One-time script to get a Google OAuth refresh token.
 * Run: node scripts/get-refresh-token.js
 *
 * 1. Opens browser for you to sign in with your @agruni.edu.ge account
 * 2. After sign-in, prints the refresh token
 * 3. Copy it to .env.local as GOOGLE_REFRESH_TOKEN
 */

const http = require('http');
const { google } = require('googleapis');
const open = require('child_process').exec;

// Load from .env.local
const fs = require('fs');
const envPath = require('path').join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const CLIENT_ID = envVars.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = envVars.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

// Start a temporary server to catch the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');

  if (url.pathname === '/api/auth/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error}</h1><p>Try again.</p>`);
      server.close();
      process.exit(1);
    }

    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <h1 style="color: green;">Success!</h1>
          <p>Refresh token has been printed in the terminal.</p>
          <p>You can close this tab.</p>
        `);

        console.log('\n========================================');
        console.log('SUCCESS! Here is your refresh token:');
        console.log('========================================\n');
        console.log(tokens.refresh_token);
        console.log('\n========================================');
        console.log('Add this to .env.local as:');
        console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('========================================\n');

        server.close();
        process.exit(0);
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error exchanging code</h1><pre>${err.message}</pre>`);
        console.error('Error:', err.message);
        server.close();
        process.exit(1);
      }
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => {
  console.log('Opening browser for Google sign-in...');
  console.log('Sign in with your @agruni.edu.ge account!\n');
  console.log('If browser doesn\'t open, go to:');
  console.log(authUrl + '\n');

  // Open browser
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  open(`${cmd} "${authUrl}"`);
});
