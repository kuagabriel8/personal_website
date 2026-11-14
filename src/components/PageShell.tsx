import Link from 'next/link';
import type { ReactNode } from 'react';
import { site } from '@/content/site';

/** Plain-HTML layout for the content pages (good for SEO, screen readers and sharing links). */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="page-head">
        <Link className="wordmark" href="/">{site.wordmark}</Link>
        <nav className="chrome-nav" aria-label="Site">
          <Link className="link-btn" href="/">← shelf</Link>
          <Link className="link-btn" href="/projects">projects</Link>
          <Link className="link-btn" href="/resume">résumé</Link>
          <Link className="link-btn" href="/about">about</Link>
        </nav>
      </header>
      <main className="page">
        {children}
        <footer className="page-foot">
          <a href={site.links.github} target="_blank" rel="noopener noreferrer">github ↗</a>
          <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer">linkedin ↗</a>
          <a href={`mailto:${site.links.email}`}>{site.links.email}</a>
        </footer>
      </main>
    </>
  );
}
