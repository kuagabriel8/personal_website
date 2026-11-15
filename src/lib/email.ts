import 'server-only';

// Shared email sending (Resend REST API, no SDK) + a tiny best-effort rate limiter for the form routes.

export type Attachment = { filename: string; content: string /* base64 */ };

export type SendResult = { ok: true } | { ok: false; status: number; error: string };

/** Sends to CONTACT_TO_EMAIL. Without a verified domain, Resend only delivers to your own signup address. */
export async function sendToInbox(msg: { subject: string; text: string; html?: string; replyTo?: string; attachments?: Attachment[] }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) return { ok: false, status: 503, error: 'not configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: [to],
      subject: msg.subject,
      text: msg.text,
      ...(msg.html ? { html: msg.html } : {}),
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      ...(msg.attachments?.length ? { attachments: msg.attachments } : {}),
    }),
  });
  if (!res.ok) {
    console.error('[email] resend error', res.status, await res.text());
    return { ok: false, status: 502, error: 'send failed' };
  }
  return { ok: true };
}

/**
 * Best-effort, in-memory rate limit per serverless instance (nothing is stored anywhere).
 * Returns true when this caller has sent too many requests recently.
 */
export function makeLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string) => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > limit;
  };
}

export const clientKey = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
