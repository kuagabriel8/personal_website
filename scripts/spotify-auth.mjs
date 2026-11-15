// One-time Spotify login to get a refresh token for the "now playing" record player.
//
// 1. Spotify Developer Dashboard → your app → Settings → Redirect URIs: add  http://127.0.0.1:8888/callback
// 2. Put SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local
// 3. npm run spotify:auth   → open the printed link, log in, click Agree
//
// The refresh token is written straight into .env.local (never printed in full), so you don't have to copy-paste it.
// Then copy it from .env.local into Vercel → Settings → Environment Variables and redeploy.

import http from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const ENV_FILE = '.env.local';
const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`; // Spotify requires a loopback IP, not "localhost"
const SCOPES = 'user-read-currently-playing user-read-recently-played';

const envText = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => /^\s*[A-Z0-9_]+\s*=/.test(l))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const clientId = env.SPOTIFY_CLIENT_ID;
const clientSecret = env.SPOTIFY_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error(`\n✖ Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to ${ENV_FILE} first.\n`);
  process.exit(1);
}

function saveToEnv(key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
  const next = re.test(envText) ? envText.replace(re, line) : `${envText.replace(/\s*$/, '')}\n${line}\n`;
  writeFileSync(ENV_FILE, next);
}

const state = randomBytes(16).toString('hex');
const authorizeUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({ response_type: 'code', client_id: clientId, scope: SCOPES, redirect_uri: REDIRECT_URI, state });

const page = (title, body) =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font:16px system-ui;padding:40px;max-width:520px"><h1>${title}</h1><p>${body}</p></body>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT_URI);
  if (url.pathname !== '/callback') return res.writeHead(404).end();
  const finish = (status, title, body) => {
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }).end(page(title, body));
    server.close();
  };

  if (url.searchParams.get('state') !== state) return finish(400, 'State mismatch', 'Please run the script again.');
  if (url.searchParams.get('error')) {
    console.error(`\n✖ Spotify returned: ${url.searchParams.get('error')}\n`);
    process.exitCode = 1;
    return finish(400, 'Not authorised', 'You can close this tab and run the script again.');
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code') ?? '', redirect_uri: REDIRECT_URI }),
  });
  const json = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !json.refresh_token) {
    console.error('\n✖ Token exchange failed:', json.error_description || json.error || tokenRes.status, '\n');
    process.exitCode = 1;
    return finish(500, 'Token exchange failed', 'Check the terminal for details.');
  }

  saveToEnv('SPOTIFY_REFRESH_TOKEN', json.refresh_token);
  console.log(`\n✔ Saved SPOTIFY_REFRESH_TOKEN to ${ENV_FILE} (ends with …${json.refresh_token.slice(-4)}).`);
  console.log('  Next: restart `npm run dev`, then add the same value in Vercel → Settings → Environment Variables and redeploy.\n');
  finish(200, 'Done ✔', `Your refresh token was saved to ${ENV_FILE}. You can close this tab.`);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\nOpen this link, log in to Spotify and click Agree:\n');
  console.log(`  ${authorizeUrl}\n`);
  console.log(`(waiting on ${REDIRECT_URI} …)`);
});
