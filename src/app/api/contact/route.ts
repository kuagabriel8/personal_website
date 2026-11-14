// Contact form → email via Resend's REST API (no SDK needed).

const MAX = { name: 100, email: 200, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort rate limit (per serverless instance). Upgrade to Upstash Redis if spam becomes a problem.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // honeypot: real people never fill the hidden "website" field
  if (typeof body.website === 'string' && body.website.trim()) return Response.json({ ok: true });

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const message = String(body.message ?? '').trim();
  if (!name || !email || !message) return Response.json({ error: 'Please fill in every field.' }, { status: 400 });
  if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
    return Response.json({ error: 'That message is a bit too long.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) return Response.json({ error: 'That email address doesn’t look right.' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return Response.json({ error: 'Too many messages, try again in a few minutes.' }, { status: 429 });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    return Response.json({ error: 'The contact form isn’t set up yet. Please email me directly.' }, { status: 503 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: [to],
      reply_to: email,
      subject: `Portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });
  if (!res.ok) {
    console.error('[contact] resend error', res.status, await res.text());
    return Response.json({ error: 'Couldn’t send right now. Please email me directly.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
