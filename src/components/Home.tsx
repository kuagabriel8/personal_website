'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { sections, type SectionId } from '@/content/sections';
import { site } from '@/content/site';
import type { GithubStats, NowPlaying } from '@/lib/types';
import { THEME_STORAGE_KEY, type ThemeKey } from './theme';
import Panel from './Panel';

// WebGL only runs in the browser, so the shelf is client-only. The list view below is server-rendered.
const ShelfCanvas = dynamic(() => import('./shelf/ShelfCanvas'), {
  ssr: false,
  loading: () => <div className="shelf-loading">loading shelf…</div>,
});

function useLive<T>(url: string, everyMs = 0) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetch(url).then((r) => (r.ok ? r.json() : null)).then((d) => alive && d && setData(d)).catch(() => {});
    load();
    const t = everyMs ? setInterval(load, everyMs) : undefined;
    return () => { alive = false; if (t) clearInterval(t); };
  }, [url, everyMs]);
  return data;
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeKey>('dark');
  const [active, setActive] = useState<SectionId | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const github = useLive<GithubStats>('/api/github');
  const nowPlaying = useLive<NowPlaying>('/api/spotify', 60_000);

  // the theme was already applied before paint (layout.tsx); sync React state with it
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === 'dark' || t === 'clay') setTheme(t);
  }, []);

  const changeTheme = (t: ThemeKey) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_STORAGE_KEY, t); } catch { /* private mode */ }
  };

  const open = useCallback((id: SectionId) => { setActive(id); setListOpen(false); }, []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    document.body.classList.toggle('panel-open', active !== null);
  }, [active]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setActive(null); setListOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <h1 className="sr-only">{site.name}: {site.title}</h1>
      <header className="chrome">
        <a className="wordmark" href="/">{site.wordmark}</a>
        <nav className="chrome-nav" aria-label="Site">
          <span className="chrome-sub">{site.title}</span>
          <button className="link-btn" type="button" aria-expanded={listOpen} onClick={() => setListOpen((v) => !v)}>
            {listOpen ? 'shelf view' : 'list view'}
          </button>
          <a className="link-btn" href="/projects">projects</a>
          <a className="link-btn" href="/resume">résumé</a>
          <a className="link-btn" href="/about">about</a>
        </nav>
      </header>

      <main className="stage" aria-label="Shelf of portfolio sections. Use list view for a text version.">
        <ShelfCanvas theme={theme} activeId={active} onSelect={open} onMiss={close} github={github} nowPlaying={nowPlaying} />
      </main>

      <nav className="listview" hidden={!listOpen} aria-label="All sections">
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => open(s.id)}>
                <span className="lv-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="lv-t">{s.title}</span>
                <span className="lv-k">{s.kicker}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Panel id={active} onClose={close} live={{ github, nowPlaying }} />

      <div className="switches">
        <div className="seg" role="group" aria-label="Theme">
          <span className="seg-label">theme</span>
          {(['dark', 'clay'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => changeTheme(t)}>{t}</button>
          ))}
        </div>
      </div>
      <p className="hint">hover an object · click to open · esc to close</p>
    </>
  );
}
