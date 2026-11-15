import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { site } from '@/content/site';
import './globals.css';

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} · ${site.title}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: `${site.name} · ${site.title}`, description: site.description, type: 'website', siteName: site.name },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0e0e0e' },
    { media: '(prefers-color-scheme: light)', color: '#efe9df' },
  ],
};

// Runs before first paint so the saved theme never flashes the wrong colours.
// Also guesses day/night in Singapore (UTC+8) so clay mode opens in the right palette; the page refines it with real sunset data.
const themeScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='clay'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'clay'}d.dataset.theme=t}catch(e){d.dataset.theme='dark'}var h=new Date(Date.now()+288e5).getUTCHours();d.dataset.time=(h<7||h>=19)?'night':'day'})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
