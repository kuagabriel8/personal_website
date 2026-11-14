'use client';

import { useState, type FormEvent } from 'react';

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong.');
      setState('sent');
      form.reset();
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (state === 'sent') return <p className="form-msg">✔ Sent. Thanks, I’ll get back to you soon.</p>;

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>name<input name="name" required maxLength={100} autoComplete="name" /></label>
      <label>email<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
      <label>message<textarea name="message" required maxLength={4000} /></label>
      {/* honeypot: hidden from people, bots fill it in */}
      <label className="hp" aria-hidden="true">website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'sending…' : 'send →'}</button>
      {state === 'error' && <p className="form-msg err" role="alert">{error}</p>}
    </form>
  );
}
