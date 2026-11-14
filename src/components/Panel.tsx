'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sectionById, type SectionId } from '@/content/sections';
import { site } from '@/content/site';
import { projects } from '@/content/projects';
import { experience, education, skills, cloud, certs } from '@/content/resume';
import { about, awards, testimonials } from '@/content/about';
import type { GithubStats, NowPlaying } from '@/lib/types';
import ContactForm from './ContactForm';

type Live = { github: GithubStats | null; nowPlaying: NowPlaying | null };

export default function Panel({ id, onClose, live }: { id: SectionId | null; onClose: () => void; live: Live }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (id) closeRef.current?.focus({ preventScroll: true });
  }, [id]);

  const section = id ? sectionById(id) : null;
  return (
    <aside className={`panel${id ? ' open' : ''}`} role="dialog" aria-modal="false" aria-label={section?.title} aria-hidden={!id}>
      {section && (
        <div className="panel-inner">
          <div className="panel-top">
            <button ref={closeRef} className="panel-close" type="button" onClick={onClose}>close ×</button>
            {section.href && <Link className="panel-page" href={section.href}>open page →</Link>}
          </div>
          <p className="kicker">{section.kicker}</p>
          <h2 className="panel-title">{section.title}</h2>
          <Body id={section.id} live={live} />
        </div>
      )}
    </aside>
  );
}

function Body({ id, live }: { id: SectionId; live: Live }): ReactNode {
  switch (id) {
    case 'projects':
      return (
        <>
          <p className="lead">Things I’ve built. Each one opens a case study: the problem, my role, the stack, and what shipped.</p>
          <ul className="rows">
            {projects.map((p) => (
              <li key={p.slug}><Link href={`/projects/${p.slug}`}>{p.name} ↗</Link><span>{p.tags}</span></li>
            ))}
          </ul>
        </>
      );

    case 'experience':
      return <Experience />;

    case 'resume':
      return (
        <>
          <p className="lead">{site.name} · {site.title} · {site.location}</p>
          <div className="sec">
            <h3>Education</h3>
            <div className="item">
              <div className="item-row"><b>{education.school}</b><span>{education.dates}</span></div>
              <div className="item-sub">{education.degree} · {education.notes.join(' · ')}</div>
              <ul><li>Coursework: {education.coursework.join(', ')}</li></ul>
            </div>
          </div>
          <Experience />
          <div className="sec">
            <h3>Certifications</h3>
            {certs.map((c) => (
              <div className="item" key={c.name}><div className="item-row"><a href={c.href} target="_blank" rel="noopener noreferrer">{c.name}</a><span>{c.date}</span></div></div>
            ))}
          </div>
          <div className="sec">
            <h3>Skills</h3>
            {skills.map((s) => (
              <div className="item" key={s.group}><div className="item-row"><b>{s.group}</b></div><div className="item-sub">{s.items.join(' · ')}</div></div>
            ))}
          </div>
        </>
      );

    case 'skills':
      return (
        <>
          <p className="lead">One keycap per tool.</p>
          {skills.map((s) => (
            <div className="sec" key={s.group}>
              <h3>{s.group}</h3>
              <ul className="chips">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </>
      );

    case 'cloud':
      return (
        <>
          <p className="lead">Platforms and services I’ve shipped with, and where I used each one.</p>
          <CloudList />
        </>
      );

    case 'certs':
      return (
        <>
          <p className="lead">Each one links to its verification page.</p>
          <div className="badges">
            {certs.map((c) => (
              <a className="badge" key={c.name} href={c.href} target="_blank" rel="noopener noreferrer">
                <Image src={c.badge} alt="" width={64} height={64} />
                <b>{c.name}</b>
                <span>{c.issuer} · {c.date}</span>
              </a>
            ))}
          </div>
          <a className="arrow-link" href={site.links.credly} target="_blank" rel="noopener noreferrer">all badges on Credly ↗</a>
        </>
      );

    case 'github': {
      const g = live.github;
      return (
        <>
          <p className="lead">Each bar on the plinth is one day of commits from the last 20 weeks, extruded like a little city.</p>
          <div className="stats">
            <div><b>{g ? g.currentStreak : '–'}</b><span>current streak (days)</span></div>
            <div><b>{g ? g.longestStreak : '–'}</b><span>longest streak</span></div>
            <div><b>{g ? g.weeks.flat().filter((c) => c > 0).reduce((a, b) => a + b, 0) : '–'}</b><span>contributions, 20 weeks</span></div>
            <div><b>{g && g.totalLastYear ? g.totalLastYear : '–'}</b><span>contributions, past year</span></div>
          </div>
          <a className="arrow-link" href={site.links.github} target="_blank" rel="noopener noreferrer">github.com/{site.githubUsername} ↗</a>
          {g?.source === 'sample' && <p className="note">Showing sample data. Live data appears once GITHUB_TOKEN is set.</p>}
        </>
      );
    }

    case 'streak': {
      const g = live.github;
      return (
        <>
          <p className="lead">The plant grows a leaf for every few days of my current GitHub streak.</p>
          <ul className="rows">
            <li><span>current streak</span><span>{g ? `${g.currentStreak} days` : '–'}</span></li>
            <li><span>longest streak</span><span>{g ? `${g.longestStreak} days` : '–'}</span></li>
          </ul>
          {g?.source === 'sample' && <p className="note">Sample data until GITHUB_TOKEN is set.</p>}
        </>
      );
    }

    case 'spotify': {
      const n = live.nowPlaying;
      if (!n || !n.configured || !n.title) {
        return (
          <>
            <div className="now"><div className="now-art">♪</div><div><b>Nothing to show yet</b><span>Spotify isn’t connected yet. The vinyl is just spinning for fun.</span></div></div>
          </>
        );
      }
      return (
        <>
          <p className="lead">{n.isPlaying ? 'What I’m listening to right now.' : 'Last thing I listened to.'}</p>
          <div className="now">
            {n.albumArt ? <img src={n.albumArt} alt={n.album ?? ''} width={96} height={96} /> : <div className="now-art">♪</div>}
            <div><b>{n.title}</b><span>{n.artist}</span><br /><span>{n.isPlaying ? '▶ playing' : 'recently played'}</span></div>
          </div>
          {n.url && <a className="arrow-link" href={n.url} target="_blank" rel="noopener noreferrer">open in Spotify ↗</a>}
        </>
      );
    }

    case 'about':
      return (
        <>
          <Image className="portrait" src={about.portrait} alt={`Portrait of ${site.name}`} width={140} placeholder="blur" />
          <p className="lead">{about.bio}</p>
          <div className="sec"><h3>Into right now</h3><ul className="chips">{about.intoNow.map((i) => <li key={i}>{i}</li>)}</ul></div>
          <div className="sec"><h3>Outside of code</h3><p style={{ margin: '8px 0 0', fontSize: 14 }}>{about.outside}</p></div>
          {testimonials.length > 0 && (
            <div className="sec">
              <h3>Kind words</h3>
              {testimonials.map((t) => (
                <div className="quote" key={t.name}>
                  <Image src={t.photo} alt={t.name} width={56} height={56} />
                  <div><p>“{t.quote}”</p><span>{t.name}</span></div>
                </div>
              ))}
            </div>
          )}
        </>
      );

    case 'awards':
      return (
        <ul className="rows">
          {awards.map((a) => <li key={a.name}><span><b>{a.name}</b>{a.detail ? `: ${a.detail}` : ''}</span><span>{a.year}</span></li>)}
        </ul>
      );

    case 'contact':
      return (
        <>
          <p className="lead">Open to {site.openTo.toLowerCase()} and interesting projects. Send a note and it lands in my inbox.</p>
          <ul className="rows">
            <li><span>email</span><a href={`mailto:${site.links.email}`}>{site.links.email}</a></li>
            <li><span>linkedin</span><a href={site.links.linkedin} target="_blank" rel="noopener noreferrer">/in/gabriel-kua ↗</a></li>
            <li><span>github</span><a href={site.links.github} target="_blank" rel="noopener noreferrer">/{site.githubUsername} ↗</a></li>
          </ul>
          <ContactForm />
        </>
      );

    case 'blog':
      return <p className="lead">Writing is coming soon. Posts will live on Medium and show up here.</p>;

    case 'terminal':
      return <p className="lead">A tiny working shell is coming soon. Until then: <code>whoami</code> → {site.name}, {site.title.toLowerCase()}.</p>;
  }
}

export function CloudList() {
  return (
    <>
      {cloud.map((p) => (
        <div className="sec" key={p.provider}>
          <h3>{p.provider}</h3>
          <ul className="rows svc">
            {p.services.map((s) => <li key={s.name}><b>{s.name}</b><span>{s.where}</span></li>)}
          </ul>
        </div>
      ))}
    </>
  );
}

function Experience() {
  return (
    <div className="sec">
      <h3>Experience</h3>
      {experience.map((r) => (
        <div className="item" key={r.company}>
          <div className="item-row"><b>{r.company}</b><span>{r.dates}</span></div>
          <div className="item-sub">{r.title}</div>
          <ul>{r.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
