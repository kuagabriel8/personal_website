import { getNowPlaying } from '@/lib/spotify';

export const revalidate = 30; // feels live without hammering Spotify

export async function GET() {
  return Response.json(await getNowPlaying());
}
