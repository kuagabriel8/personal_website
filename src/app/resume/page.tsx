import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { projects } from '@/content/projects';
import { site } from '@/content/site';
import { experience, education, skills, cloud, certs } from '@/content/resume';
import { awards } from '@/content/about';

export const metadata: Metadata = { title: 'Résumé', description: `${site.name}: experience, projects, education, skills and certifications.` };

export default function ResumePage() {
  return (
    <PageShell>
      <h1>Résumé</h1>
      <p className="lead">{site.name} · {site.title} · {site.location}</p>

      <h2 id="experience">Experience</h2>
      {experience.map((r) => (
        <div className="item" key={r.company}>
          <div className="item-row"><b>{r.company}: {r.title}</b><span>{r.dates}</span></div>
          <ul>{r.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          <ul className="chips">{r.tech.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      ))}

      <h2 id="projects">Projects</h2>
      {projects.map((p) => (
        <div className="item" key={p.slug}>
          <div className="item-row"><Link href={`/projects/${p.slug}`}><b>{p.name} ↗</b></Link><span>{p.tags}</span></div>
          <div className="item-sub">{p.oneLiner}</div>
          <ul>
            <li>{p.role}</li>
            {p.outcome && <li>{p.outcome}</li>}
          </ul>
          <ul className="chips">{p.stack.slice(0, 10).map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      ))}

      <h2 id="education">Education</h2>
      <div className="item">
        <div className="item-row"><b>{education.school}</b><span>{education.dates}</span></div>
        <div className="item-sub">{education.degree} · {education.notes.join(' · ')}</div>
        <ul><li>Coursework: {education.coursework.join(', ')}</li></ul>
      </div>

      <h2 id="skills">Skills</h2>
      {skills.map((s) => (
        <div className="item" key={s.group}>
          <div className="item-row"><b>{s.group}</b></div>
          <div className="item-sub">{s.items.join(' · ')}</div>
        </div>
      ))}

      <h2 id="cloud">Cloud</h2>
      {cloud.map((p) => (
        <div className="sec" key={p.provider}>
          <h3>{p.provider}</h3>
          <ul className="rows svc">
            {p.services.map((s) => <li key={s.name}><b>{s.name}</b><span>{s.where}</span></li>)}
          </ul>
        </div>
      ))}

      <h2 id="certifications">Certifications</h2>
      <div className="badges">
        {certs.map((c) => (
          <a className="badge" key={c.name} href={c.href} target="_blank" rel="noopener noreferrer">
            <Image src={c.badge} alt="" width={64} height={64} />
            <b>{c.name}</b>
            <span>{c.issuer} · {c.date}</span>
          </a>
        ))}
      </div>

      <h2 id="awards">Awards</h2>
      <ul className="rows">
        {awards.map((a) => <li key={a.name}><span><b>{a.name}</b>{a.detail ? `: ${a.detail}` : ''}</span><span>{a.year}</span></li>)}
      </ul>
    </PageShell>
  );
}
