import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { projects } from '@/content/projects';

export const metadata: Metadata = { title: 'Projects', description: 'Case studies of things Gabriel Kua has built.' };

export default function ProjectsPage() {
  return (
    <PageShell>
      <h1>Projects</h1>
      <p className="lead">Things I’ve built: the problem, my role, the stack, and what shipped.</p>
      <ul className="card-list">
        {projects.map((p) => (
          <li key={p.slug}>
            <Link href={`/projects/${p.slug}`}>
              <h3>{p.name}</h3>
              <span>{p.tags}</span>
              <p>{p.oneLiner}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
