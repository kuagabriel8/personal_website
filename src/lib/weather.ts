import 'server-only';
import type { Weather } from './types';

// Singapore, via Open-Meteo (free, no API key).
const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198' +
  '&current=temperature_2m,precipitation,weather_code,is_day&timezone=Asia%2FSingapore';

// WMO weather codes that mean something is falling from the sky
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

/** Singapore has no daylight saving: UTC+8 all year. Rough day = 7am–7pm. */
const sgIsDay = () => {
  const h = new Date(Date.now() + 8 * 3600_000).getUTCHours();
  return h >= 7 && h < 19;
};

export async function getWeather(): Promise<Weather> {
  try {
    const res = await fetch(URL, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const c = (await res.json())?.current;
    if (!c) throw new Error('Unexpected Open-Meteo response');
    const code = Number(c.weather_code);
    const precipitation = Number(c.precipitation) || 0;
    return {
      source: 'live',
      raining: precipitation > 0 || RAIN_CODES.has(code),
      isDay: c.is_day === 1,
      precipitation,
      code,
      tempC: typeof c.temperature_2m === 'number' ? Math.round(c.temperature_2m) : undefined,
    };
  } catch (err) {
    console.error('[weather]', err);
    return { source: 'fallback', raining: false, isDay: sgIsDay(), precipitation: 0, code: -1 };
  }
}
