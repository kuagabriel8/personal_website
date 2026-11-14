import 'server-only';
import type { GithubStats } from './types';

const WEEKS = 20;

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

type Day = { date: string; contributionCount: number };

/** Fetch contribution stats. Falls back to deterministic sample data if no token or the API fails. */
export async function getGithubStats(): Promise<GithubStats> {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.GITHUB_USERNAME || 'kuagabriel8';
  if (!token) return sample();

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'portfolio-site' },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
      next: { revalidate: 3600 }, // hit GitHub at most once an hour
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const json = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) throw new Error('Unexpected GitHub response');
    const days: Day[] = cal.weeks.flatMap((w: { contributionDays: Day[] }) => w.contributionDays);
    return { source: 'live', ...summarise(days), totalLastYear: cal.totalContributions };
  } catch (err) {
    console.error('[github] falling back to sample data:', err);
    return sample();
  }
}

function summarise(days: Day[]): Omit<GithubStats, 'source' | 'totalLastYear'> {
  const today = new Date().toISOString().slice(0, 10);
  const past = days.filter((d) => d.date <= today);

  // current streak: count back from today (a zero today doesn't break it yet)
  let current = 0;
  for (let i = past.length - 1; i >= 0; i--) {
    if (past[i].contributionCount > 0) current++;
    else if (i === past.length - 1) continue;
    else break;
  }
  let longest = 0, run = 0;
  for (const d of past) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // last WEEKS calendar weeks (Sun→Sat), future days = -1
  const weeks: number[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7).map((d) => (d.date > today ? -1 : d.contributionCount)));
  }
  return { weeks: weeks.slice(-WEEKS), currentStreak: current, longestStreak: longest };
}

function sample(): GithubStats {
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const weeks = Array.from({ length: WEEKS }, () =>
    Array.from({ length: 7 }, () => {
      const r = rand();
      return r < 0.3 ? 0 : Math.floor(r * r * 14);
    }),
  );
  return { source: 'sample', weeks, totalLastYear: 0, currentStreak: 9, longestStreak: 21 };
}
