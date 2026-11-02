// Stores one record per page view in Netlify Blobs: views/<YYYY-MM-DD>/<pid>
import { getStore } from '@netlify/blobs';

const clean = (s, n) => String(s ?? '').slice(0, n);

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('', { status: 405 });
  let b;
  try { b = JSON.parse(await req.text()); } catch { return new Response('', { status: 400 }); }
  if (!b || !/^[a-z0-9]{8,30}$/.test(b.pid || '')) return new Response('', { status: 400 });

  const store = getStore('analytics');

  if (b.t === 'view') {
    const now = new Date();
    const key = `views/${now.toISOString().slice(0, 10)}/${b.pid}`;
    await store.setJSON(key, {
      at: now.toISOString(),
      vid: clean(b.vid, 30),
      page: clean(b.page, 120),
      ref: clean(b.ref, 80),
      device: Number(b.w) > 0 && Number(b.w) < 768 ? 'mobile' : 'desktop',
      lang: clean(b.lang, 12),
      country: context.geo?.country?.name || '',
      city: context.geo?.city || '',
      ms: 0,
      scroll: 0,
    });
    await store.set(`pid/${b.pid}`, key);
  } else if (b.t === 'leave') {
    const key = await store.get(`pid/${b.pid}`);
    if (!key) return new Response(null, { status: 204 });
    const rec = await store.get(key, { type: 'json' });
    if (!rec) return new Response(null, { status: 204 });
    // a tab can be hidden and shown several times: keep the latest totals
    rec.ms = Math.max(rec.ms, Math.min(Number(b.ms) || 0, 6 * 3600 * 1000));
    rec.scroll = Math.max(rec.scroll, Math.min(Number(b.scroll) || 0, 100));
    await store.setJSON(key, rec);
  }
  return new Response(null, { status: 204 });
};

export const config = { path: '/api/track' };
