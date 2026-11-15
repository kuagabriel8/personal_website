// Every clickable thing on the shelf. Order = list-view order.

export type SectionId =
  | 'projects' | 'experience' | 'github' | 'spotify' | 'skills' | 'cloud' | 'certs'
  | 'about' | 'awards' | 'streak' | 'contact' | 'resume' | 'terminal' | 'blog';

export const sections: { id: SectionId; title: string; kicker: string; href?: string }[] = [
  { id: 'projects', title: 'Projects', kicker: 'storage box · case studies', href: '/projects' },
  { id: 'experience', title: 'Experience', kicker: 'city block · one tower per company', href: '/resume#experience' },
  { id: 'resume', title: 'Résumé', kicker: 'leaning frame · the one-pager', href: '/resume' },
  { id: 'skills', title: 'Skills', kicker: 'keyboard · tech stack', href: '/resume#skills' },
  { id: 'cloud', title: 'Cloud', kicker: 'floating · services I’ve used', href: '/resume#cloud' },
  { id: 'certs', title: 'Certifications', kicker: 'binders · verified credentials', href: '/resume#certifications' },
  { id: 'github', title: 'GitHub', kicker: 'contribution skyline · live' },
  { id: 'streak', title: 'Commit streak', kicker: 'plant · grows with activity' },
  { id: 'spotify', title: 'Spotify', kicker: 'record player · now playing' },
  { id: 'about', title: 'About', kicker: 'framed · who I am', href: '/about' },
  { id: 'awards', title: 'Awards', kicker: 'trophy · competitions', href: '/about#awards' },
  { id: 'contact', title: 'Contact', kicker: 'letters · say hi' },
  { id: 'blog', title: 'Blog', kicker: 'magazines · coming soon' },
  { id: 'terminal', title: 'Terminal', kicker: 'crt · type help' },
];

export const sectionById = (id: SectionId) => sections.find((s) => s.id === id)!;
