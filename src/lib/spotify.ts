import 'server-only';
import type { NowPlaying } from './types';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1/me/player';

type SpotifyTrack = {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  external_urls: { spotify: string };
};

async function accessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });
  if (!res.ok) throw new Error(`Spotify token ${res.status}`);
  return (await res.json()).access_token as string;
}

const shape = (t: SpotifyTrack): Omit<NowPlaying, 'configured' | 'isPlaying'> => ({
  title: t.name,
  artist: t.artists.map((a) => a.name).join(', '),
  album: t.album.name,
  albumArt: t.album.images[0]?.url,
  url: t.external_urls.spotify,
});

/** What's playing now, else the last played track. `configured: false` until the env vars are set. */
export async function getNowPlaying(): Promise<NowPlaying> {
  try {
    const token = await accessToken();
    if (!token) return { configured: false, isPlaying: false };
    const auth = { Authorization: `Bearer ${token}` };

    const now = await fetch(`${API}/currently-playing`, { headers: auth });
    if (now.status === 200) {
      const json = await now.json();
      if (json?.item && json.currently_playing_type === 'track') {
        return { configured: true, isPlaying: Boolean(json.is_playing), ...shape(json.item) };
      }
    }
    const recent = await fetch(`${API}/recently-played?limit=1`, { headers: auth });
    if (recent.ok) {
      const item = (await recent.json())?.items?.[0];
      if (item) return { configured: true, isPlaying: false, playedAt: item.played_at, ...shape(item.track) };
    }
    return { configured: true, isPlaying: false };
  } catch (err) {
    console.error('[spotify]', err);
    return { configured: true, isPlaying: false };
  }
}
