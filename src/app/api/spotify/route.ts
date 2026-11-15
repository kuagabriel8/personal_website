import { getNowPlaying } from '@/lib/spotify';

export const revalidate = 10; // shared cache: Spotify is called at most every 10s, however many visitors

export async function GET() {
  return Response.json(await getNowPlaying());
}
