import type { StaticImageData } from 'next/image';
import portrait from '@/assets/me/portrait.jpg';
import jason from '@/assets/testimonials/jason.jpg';

export const about = {
  portrait,
  bio: "I'm Gabriel, a penultimate-year CS student at NUS who likes building things end to end, from the React frontend down to the cloud infrastructure it runs on. Lately that's meant GenAI apps on AWS and Azure, event-driven microservices, and a lot of Terraform. When I'm not coding I'm usually bouldering. I've also picked up rock-climbing and scuba-diving certifications so I can explore more of the earth.",
  intoNow: ['AI engineering', 'RAG systems', 'Cloud', 'Infrastructure as code', '3D on the web (this site)'],
  outside: 'Bouldering (main hobby); certified in scuba diving and rock climbing',
};

export const awards: { name: string; detail?: string; year: string }[] = [
  { name: 'SAP SCALE', year: '2026' },
  { name: 'NUS IDEATE', detail: 'Semifinalist', year: '2024' },
];

export const testimonials: { name: string; quote: string; photo: StaticImageData }[] = [
  {
    name: 'Jason',
    quote:
      'Gabriel is one of the most reliable and coolest people I know. When you need help you can always count on him to be there. He also is insane at Brawl Stars. Just don’t let him go to Gunkanjima.',
    photo: jason,
  },
];
