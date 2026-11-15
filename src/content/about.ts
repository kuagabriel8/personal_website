import type { StaticImageData } from 'next/image';
import portrait from '@/assets/me/portrait.jpg';
import jason from '@/assets/testimonials/jason.jpg';
import kea from '@/assets/testimonials/kea.jpg';
import nathan from '@/assets/testimonials/nathan.jpg';
import elPrimo from '@/assets/testimonials/big-daddy-el-primo.jpg';

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
    name: 'Kea',
    quote:
      'Had the pleasure to work on Tapau with Gabriel over the school semester! Other than being extremely knowledgeable and carrying the deployment of the project, he made working on the project a lot of fun! Hopefully he can teach me how to flash v16s next.',
    photo: kea,
  },
  {
    name: 'Nathan',
    quote:
      'Gabriel is a master at everything related to the cloud. He is so good that whenever I talk to him I feel like I’m on cloud 9. An absolute coding monster, a great teammate and friend.',
    photo: nathan,
  },
  {
    name: 'Jason',
    quote:
      'Gabriel is one of the most reliable and coolest people I know. When you need help you can always count on him to be there. He also is insane at Brawl Stars. Just don’t let him go to Gunkanjima.',
    photo: jason,
  },
  {
    name: 'El Primo',
    quote: 'gabriel and i are always down for some brawling and when we are done with brawling we start coding',
    photo: elPrimo,
  },
];
