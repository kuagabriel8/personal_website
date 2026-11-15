'use client';

// "Leave kind words": name + words (required), photo (optional) → emailed to Gabriel via /api/kind-words.

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

/** Shrink a photo in the browser (max 800px, JPEG) so uploads stay small and fast. */
async function shrink(file: File, max = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', 0.85));
}

export default function KindWordsForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError('');
    if (!file) { setPhoto(null); setPreview(null); return; }
    if (!file.type.startsWith('image/')) { setError('Please pick an image file.'); return; }
    try {
      const small = await shrink(file);
      setPhoto(small);
      setPreview(URL.createObjectURL(small));
    } catch {
      setError('Couldn’t read that photo, try another one?');
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.delete('photo');
    if (photo) data.append('photo', photo, 'photo.jpg');
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/kind-words', { method: 'POST', body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong.');
      setState('sent');
      form.reset();
      clearPhoto();
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (state === 'sent') return <p className="form-msg">💌 Thank you! That made my day. I read every note, and some make it into the book.</p>;

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>your name<input name="name" required maxLength={80} autoComplete="name" /></label>
      <label>kind words<textarea name="words" required maxLength={800} placeholder="Something nice, a memory, a shout-out…" /></label>
      <div className="photo-field">
        {preview ? (
          <>
            <img src={preview} alt="Your photo preview" width={56} height={56} />
            <button type="button" className="link-btn" onClick={clearPhoto}>remove photo</button>
          </>
        ) : (
          <label className="photo-pick">
            + add a photo of yourself <span>(optional)</span>
            <input ref={fileRef} name="photo" type="file" accept="image/*" onChange={onPhoto} />
          </label>
        )}
      </div>
      {/* honeypot: hidden from people, bots fill it in */}
      <label className="hp" aria-hidden="true">website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'sending…' : 'send kind words →'}</button>
      {error && <p className="form-msg err" role="alert">{error}</p>}
    </form>
  );
}
