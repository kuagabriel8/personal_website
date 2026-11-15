// Contact form → your inbox via Resend.

import { clientKey, makeLimiter, sendToInbox } from '@/lib/email';

const MAX = { name: 100, email: 200, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limited = makeLimiter(5, 10 * 60 * 1000); // 5 messages per 10 minutes

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
  if (limited(clientKey(req))) return Response.json({ error: 'Too many messages, try again in a few minutes.' }, { status: 429 });

  const sent = await sendToInbox({
    subject: `Portfolio message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    replyTo: email,
  });
  if (!sent.ok) {
    return sent.status === 503
      ? Response.json({ error: 'The contact form isn’t set up yet. Please email me directly.' }, { status: 503 })
      : Response.json({ error: 'Couldn’t send right now. Please email me directly.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
