import { getWeather } from '@/lib/weather';

export const revalidate = 600; // Singapore weather, refreshed every 10 minutes

export async function GET() {
  return Response.json(await getWeather());
}
