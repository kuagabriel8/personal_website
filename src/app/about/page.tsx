import type { Metadata } from 'next';
import Image from 'next/image';
import PageShell from '@/components/PageShell';
import { site } from '@/content/site';
import { about, awards, testimonials } from '@/content/about';

export const metadata: Metadata = { title: 'About', description: `About ${site.name}, ${site.title.toLowerCase()}.` };

export default function AboutPage() {
  return (
    <PageShell>
      <h1>About</h1>
      <Image className="portrait" src={about.portrait} alt={`Portrait of ${site.name}`} width={180} placeholder="blur" priority />
      <p className="lead">{about.bio}</p>

      <h2>Into right now</h2>
      <ul className="chips">{about.intoNow.map((i) => <li key={i}>{i}</li>)}</ul>

      <h2>Outside of code</h2>
      <p>{about.outside}</p>

      <h2 id="awards">Awards</h2>
      <ul className="rows">
        {awards.map((a) => <li key={a.name}><span><b>{a.name}</b>{a.detail ? `: ${a.detail}` : ''}</span><span>{a.year}</span></li>)}
      </ul>

      {testimonials.length > 0 && (
        <>
          <h2>Kind words</h2>
          {testimonials.map((t) => (
            <div className="quote" key={t.name}>
              <Image src={t.photo} alt={t.name} width={56} height={56} />
              <div><p>“{t.quote}”</p><span>{t.name}</span></div>
            </div>
          ))}
        </>
      )}
    </PageShell>
  );
}
