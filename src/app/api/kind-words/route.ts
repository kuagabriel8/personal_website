// "Leave kind words" form → your inbox via Resend, with the (optional) photo attached.
// Nothing is published or stored: you read it and add the ones you like to src/content/about.ts.

import { clientKey, escapeHtml, makeLimiter, sendToInbox } from '@/lib/email';

const MAX = { name: 80, words: 800 };
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // the browser shrinks photos first, so real uploads are ~100–300 KB
const limited = makeLimiter(3, 10 * 60 * 1000); // 3 notes per 10 minutes

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // honeypot: hidden from people, bots fill it in
  if (String(form.get('website') ?? '').trim()) return Response.json({ ok: true });

  const name = String(form.get('name') ?? '').trim();
  const words = String(form.get('words') ?? '').trim();
  if (!name || !words) return Response.json({ error: 'Please add your name and a few words.' }, { status: 400 });
  if (name.length > MAX.name || words.length > MAX.words) {
    return Response.json({ error: 'That’s a little long, could you trim it down?' }, { status: 400 });
  }

  const photo = form.get('photo');
  let attachment: { filename: string; content: string } | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith('image/')) return Response.json({ error: 'The photo needs to be an image.' }, { status: 400 });
    if (photo.size > MAX_PHOTO_BYTES) return Response.json({ error: 'That photo is too large.' }, { status: 400 });
    const ext = photo.type === 'image/png' ? 'png' : 'jpg';
    const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'friend';
    attachment = { filename: `${safe}.${ext}`, content: Buffer.from(await photo.arrayBuffer()).toString('base64') };
  }

  if (limited(clientKey(req))) return Response.json({ error: 'Thanks! That’s plenty for now, try again in a few minutes.' }, { status: 429 });

  const sent = await sendToInbox({
    subject: `💌 Kind words from ${name}`,
    text: `${name} left you kind words:\n\n“${words}”\n\n${attachment ? 'Photo attached.' : 'No photo.'}\n\nTo add it to the book: src/content/about.ts → testimonials (photo → src/assets/testimonials/).`,
    html:
      `<p><b>${escapeHtml(name)}</b> left you kind words:</p>` +
      `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #e4572e;font-size:16px">“${escapeHtml(words).replace(/\n/g, '<br>')}”</blockquote>` +
      `<p style="color:#888">${attachment ? 'Photo attached.' : 'No photo.'}<br>To add it to the book: <code>src/content/about.ts</code> → testimonials (photo → <code>src/assets/testimonials/</code>).</p>`,
    attachments: attachment ? [attachment] : undefined,
  });
  if (!sent.ok) {
    return Response.json(
      { error: sent.status === 503 ? 'This isn’t set up yet, sorry!' : 'Couldn’t send right now, please try again later.' },
      { status: sent.status },
    );
  }
  return Response.json({ ok: true });
}
