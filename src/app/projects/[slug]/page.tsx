import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import { projectBySlug, projects } from '@/content/projects';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = projectBySlug((await params).slug);
  return p ? { title: p.name, description: p.oneLiner } : {};
}

export default async function ProjectPage({ params }: Props) {
  const p = projectBySlug((await params).slug);
  if (!p) notFound();

  return (
    <PageShell>
      <h1>{p.name}</h1>
      <p className="lead">{p.oneLiner}</p>
      {p.links.length > 0 && (
        <p>
          {p.links.map((l) => (
            <a key={l.href} className="arrow-link" href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label} ↗{l.note ? ` (${l.note})` : ''}
            </a>
          ))}
        </p>
      )}

      <h2>Problem</h2>
      <p>{p.problem}</p>

      <h2>My role</h2>
      <p>{p.role}</p>
      {p.outcome && <p><b>Outcome:</b> {p.outcome}</p>}

      <h2>What I built</h2>
      <ul className="built">
        {p.built.map((b, i) => (
          <li key={i}>{b.label && <b>{b.label}: </b>}{b.text}</li>
        ))}
      </ul>
      {p.also && (
        <>
          <h2>Also supported</h2>
          <ul className="built">{p.also.map((a) => <li key={a}>{a}</li>)}</ul>
        </>
      )}

      <h2>Stack</h2>
      <ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>

      {p.screenshots.length > 0 && (
        <>
          <h2>Screenshots</h2>
          <div className="shots">
            {p.screenshots.map((s, i) => (
              <Image key={i} src={s.src} alt={s.alt} sizes="(max-width: 860px) 100vw, 820px" placeholder="blur" />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
