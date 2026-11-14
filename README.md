# personal_website

Gabriel Kua's portfolio: a 3D shelf where every object opens a section.
Next.js + TypeScript + React Three Fiber, hosted on Vercel. No database.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add keys (see below)
npm run dev                  # http://localhost:3000
```

`npm run build` creates a production build and type-checks everything.

## Where things live

| Path | What |
|---|---|
| `src/content/` | **All the words on the site.** Projects, experience, skills, certs, about. Edit these files, push, and it's live. |
| `src/assets/` | Images (portrait, screenshots, badges) |
| `src/components/shelf/scene.ts` | Shelf layout: which object sits in which cubby |
| `src/components/shelf/ShelfCanvas.tsx` | The 3D shelf (dark line art ⇄ clay) |
| `src/components/Panel.tsx` | Popup content for each section |
| `src/app/` | Pages (`/`, `/projects`, `/projects/[slug]`, `/resume`, `/about`) and API routes |
| `src/app/api/github` | Contribution data → skyline + streak plant (cached 1h) |
| `src/app/api/spotify` | Now playing → record player (cached 30s) |
| `src/app/api/contact` | Contact form → email via Resend |
| `public/models/cloud.glb` | The cloud model (`npm run make:cloud` regenerates it) |
| `planning/`, `mockups/`, `designref/` | Local only (git-ignored): planning docs, UI prototypes, design reference |

## Environment variables

Every key is optional. Without one, that feature falls back to placeholder data (or shows a "not set up yet" message).
Add them in **`.env.local`** for local dev and in **Vercel → Project → Settings → Environment Variables** for production. Never commit them.

| Key | For |
|---|---|
| `GITHUB_TOKEN`, `GITHUB_USERNAME` | Live skyline + streak (fine-grained PAT: public repos, read-only) |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL` | Contact form |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | Now playing |

## Deploy

1. Push to GitHub.
2. On vercel.com → **Add New → Project → Import** `kuagabriel8/personal_website` (framework auto-detected: Next.js).
3. Add the environment variables, then **Deploy**. You get a `*.vercel.app` URL; every later push redeploys automatically.
