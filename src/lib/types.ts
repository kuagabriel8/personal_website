export type GithubStats = {
  source: 'live' | 'sample';
  /** last N weeks, oldest first; each week = 7 daily counts (Sun→Sat), -1 = day in the future */
  weeks: number[][];
  totalLastYear: number;
  currentStreak: number;
  longestStreak: number;
};

export type Weather = {
  source: 'live' | 'fallback';
  raining: boolean;
  thunder: boolean; // thunderstorm right now
  isDay: boolean;
  precipitation: number; // mm in the last hour
  code: number; // WMO weather code
  tempC?: number;
};

export type NowPlaying = {
  configured: boolean;
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  url?: string;
  playedAt?: string; // when not currently playing: last played time (ISO)
};
